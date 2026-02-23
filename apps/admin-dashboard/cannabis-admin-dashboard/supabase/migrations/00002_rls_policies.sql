-- Cannabis Admin Dashboard - Row-Level Security Policies
-- Migration: 00002_rls_policies
-- Description: Complete RLS policies for multi-tenant isolation and role-based access

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE dispensaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTIONS FOR RLS
-- ============================================================================

-- Get current user's dispensary_id
CREATE OR REPLACE FUNCTION auth.user_dispensary_id()
RETURNS UUID AS $$
    SELECT dispensary_id FROM users WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Get current user's role
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS user_role AS $$
    SELECT role FROM users WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Check if user has specific permission
CREATE OR REPLACE FUNCTION auth.has_permission(permission_name TEXT)
RETURNS BOOLEAN AS $$
    SELECT COALESCE(
        (permissions->permission_name)::boolean,
        false
    )
    FROM users
    WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Check if user is admin
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
    SELECT role = 'admin' FROM users WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Check if user is manager or above
CREATE OR REPLACE FUNCTION auth.is_manager_or_above()
RETURNS BOOLEAN AS $$
    SELECT role IN ('manager', 'owner', 'admin') FROM users WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Check if user is owner or above
CREATE OR REPLACE FUNCTION auth.is_owner_or_above()
RETURNS BOOLEAN AS $$
    SELECT role IN ('owner', 'admin') FROM users WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================================
-- DISPENSARIES POLICIES
-- ============================================================================

-- Users can view their own dispensary
CREATE POLICY "Users can view their dispensary"
    ON dispensaries FOR SELECT
    USING (
        auth.uid() IN (
            SELECT id FROM users WHERE dispensary_id = dispensaries.id
        )
    );

-- Only owners and admins can update dispensary settings
CREATE POLICY "Owners can update their dispensary"
    ON dispensaries FOR UPDATE
    USING (
        auth.is_owner_or_above() AND
        id = auth.user_dispensary_id()
    )
    WITH CHECK (
        auth.is_owner_or_above() AND
        id = auth.user_dispensary_id()
    );

-- Admins can view all dispensaries
CREATE POLICY "Admins can view all dispensaries"
    ON dispensaries FOR SELECT
    USING (auth.is_admin());

-- ============================================================================
-- USERS POLICIES
-- ============================================================================

-- Users can view other users in their dispensary
CREATE POLICY "Users can view colleagues"
    ON users FOR SELECT
    USING (
        dispensary_id = auth.user_dispensary_id() OR
        auth.is_admin()
    );

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (
        id = auth.uid() AND
        -- Can't change their own role or dispensary
        role = (SELECT role FROM users WHERE id = auth.uid()) AND
        dispensary_id = (SELECT dispensary_id FROM users WHERE id = auth.uid())
    );

-- Managers can create staff accounts
CREATE POLICY "Managers can create staff"
    ON users FOR INSERT
    WITH CHECK (
        auth.is_manager_or_above() AND
        dispensary_id = auth.user_dispensary_id() AND
        -- Can only create users with lower privilege
        CASE auth.user_role()
            WHEN 'admin' THEN true
            WHEN 'owner' THEN role IN ('staff', 'manager')
            WHEN 'manager' THEN role = 'staff'
            ELSE false
        END
    );

-- Managers can update staff in their dispensary
CREATE POLICY "Managers can update staff"
    ON users FOR UPDATE
    USING (
        auth.is_manager_or_above() AND
        dispensary_id = auth.user_dispensary_id() AND
        id != auth.uid() AND -- Can't update self via this policy
        -- Can only update users with lower privilege
        CASE auth.user_role()
            WHEN 'admin' THEN true
            WHEN 'owner' THEN role IN ('staff', 'manager')
            WHEN 'manager' THEN role = 'staff'
            ELSE false
        END
    )
    WITH CHECK (
        auth.is_manager_or_above() AND
        dispensary_id = auth.user_dispensary_id()
    );

-- Owners can delete users from their dispensary
CREATE POLICY "Owners can delete users"
    ON users FOR DELETE
    USING (
        auth.is_owner_or_above() AND
        dispensary_id = auth.user_dispensary_id() AND
        id != auth.uid() -- Can't delete self
    );

-- ============================================================================
-- PRODUCTS POLICIES
-- ============================================================================

-- All authenticated users can view products in their dispensary
CREATE POLICY "Users can view products"
    ON products FOR SELECT
    USING (
        dispensary_id = auth.user_dispensary_id() OR
        auth.is_admin()
    );

-- Users with manage_inventory permission can create products
CREATE POLICY "Authorized users can create products"
    ON products FOR INSERT
    WITH CHECK (
        dispensary_id = auth.user_dispensary_id() AND
        auth.has_permission('manage_inventory')
    );

-- Users with manage_inventory permission can update products
CREATE POLICY "Authorized users can update products"
    ON products FOR UPDATE
    USING (
        dispensary_id = auth.user_dispensary_id() AND
        auth.has_permission('manage_inventory')
    )
    WITH CHECK (
        dispensary_id = auth.user_dispensary_id() AND
        auth.has_permission('manage_inventory')
    );

-- Managers can delete products
CREATE POLICY "Managers can delete products"
    ON products FOR DELETE
    USING (
        dispensary_id = auth.user_dispensary_id() AND
        auth.is_manager_or_above()
    );

-- ============================================================================
-- CUSTOMERS POLICIES
-- ============================================================================

-- All users can view customers in their dispensary
CREATE POLICY "Users can view customers"
    ON customers FOR SELECT
    USING (
        dispensary_id = auth.user_dispensary_id() OR
        auth.is_admin()
    );

-- All users can create customers (for new sales)
CREATE POLICY "Users can create customers"
    ON customers FOR INSERT
    WITH CHECK (
        dispensary_id = auth.user_dispensary_id()
    );

-- Only managers can update customer records
CREATE POLICY "Managers can update customers"
    ON customers FOR UPDATE
    USING (
        dispensary_id = auth.user_dispensary_id() AND
        auth.is_manager_or_above()
    )
    WITH CHECK (
        dispensary_id = auth.user_dispensary_id() AND
        auth.is_manager_or_above()
    );

-- Owners can delete customers
CREATE POLICY "Owners can delete customers"
    ON customers FOR DELETE
    USING (
        dispensary_id = auth.user_dispensary_id() AND
        auth.is_owner_or_above()
    );

-- ============================================================================
-- TRANSACTIONS POLICIES
-- ============================================================================

-- Users can view transactions in their dispensary
CREATE POLICY "Users can view transactions"
    ON transactions FOR SELECT
    USING (
        dispensary_id = auth.user_dispensary_id() OR
        auth.is_admin()
    );

-- All authenticated users can create transactions
CREATE POLICY "Users can create transactions"
    ON transactions FOR INSERT
    WITH CHECK (
        dispensary_id = auth.user_dispensary_id() AND
        processed_by = auth.uid()
    );

-- Managers can update transactions (for voids/returns)
CREATE POLICY "Managers can update transactions"
    ON transactions FOR UPDATE
    USING (
        dispensary_id = auth.user_dispensary_id() AND
        auth.is_manager_or_above()
    )
    WITH CHECK (
        dispensary_id = auth.user_dispensary_id() AND
        auth.is_manager_or_above()
    );

-- Owners can delete transactions
CREATE POLICY "Owners can delete transactions"
    ON transactions FOR DELETE
    USING (
        dispensary_id = auth.user_dispensary_id() AND
        auth.is_owner_or_above()
    );

-- ============================================================================
-- TRANSACTION ITEMS POLICIES
-- ============================================================================

-- Users can view transaction items for their dispensary's transactions
CREATE POLICY "Users can view transaction items"
    ON transaction_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM transactions
            WHERE transactions.id = transaction_items.transaction_id
            AND (
                transactions.dispensary_id = auth.user_dispensary_id() OR
                auth.is_admin()
            )
        )
    );

-- Users can create transaction items for their transactions
CREATE POLICY "Users can create transaction items"
    ON transaction_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM transactions
            WHERE transactions.id = transaction_items.transaction_id
            AND transactions.dispensary_id = auth.user_dispensary_id()
            AND transactions.processed_by = auth.uid()
        )
    );

-- Managers can update transaction items
CREATE POLICY "Managers can update transaction items"
    ON transaction_items FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM transactions
            WHERE transactions.id = transaction_items.transaction_id
            AND transactions.dispensary_id = auth.user_dispensary_id()
        ) AND
        auth.is_manager_or_above()
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM transactions
            WHERE transactions.id = transaction_items.transaction_id
            AND transactions.dispensary_id = auth.user_dispensary_id()
        ) AND
        auth.is_manager_or_above()
    );

-- Owners can delete transaction items
CREATE POLICY "Owners can delete transaction items"
    ON transaction_items FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM transactions
            WHERE transactions.id = transaction_items.transaction_id
            AND transactions.dispensary_id = auth.user_dispensary_id()
        ) AND
        auth.is_owner_or_above()
    );

-- ============================================================================
-- INVENTORY SNAPSHOTS POLICIES
-- ============================================================================

-- Users can view inventory snapshots
CREATE POLICY "Users can view inventory snapshots"
    ON inventory_snapshots FOR SELECT
    USING (
        dispensary_id = auth.user_dispensary_id() OR
        auth.is_admin()
    );

-- System can create snapshots (via triggers)
-- Managers can create manual snapshots
CREATE POLICY "Managers can create inventory snapshots"
    ON inventory_snapshots FOR INSERT
    WITH CHECK (
        dispensary_id = auth.user_dispensary_id() AND
        auth.is_manager_or_above()
    );

-- Admins can delete old snapshots
CREATE POLICY "Admins can delete inventory snapshots"
    ON inventory_snapshots FOR DELETE
    USING (auth.is_admin());

-- ============================================================================
-- COMPLIANCE FLAGS POLICIES
-- ============================================================================

-- Managers and above can view compliance flags
CREATE POLICY "Managers can view compliance flags"
    ON compliance_flags FOR SELECT
    USING (
        (dispensary_id = auth.user_dispensary_id() AND auth.is_manager_or_above()) OR
        auth.is_admin()
    );

-- System and managers can create compliance flags
CREATE POLICY "Managers can create compliance flags"
    ON compliance_flags FOR INSERT
    WITH CHECK (
        dispensary_id = auth.user_dispensary_id() AND
        auth.is_manager_or_above()
    );

-- Managers can resolve compliance flags
CREATE POLICY "Managers can update compliance flags"
    ON compliance_flags FOR UPDATE
    USING (
        dispensary_id = auth.user_dispensary_id() AND
        auth.is_manager_or_above()
    )
    WITH CHECK (
        dispensary_id = auth.user_dispensary_id() AND
        auth.is_manager_or_above() AND
        resolved_by = auth.uid()
    );

-- Owners can delete compliance flags
CREATE POLICY "Owners can delete compliance flags"
    ON compliance_flags FOR DELETE
    USING (
        dispensary_id = auth.user_dispensary_id() AND
        auth.is_owner_or_above()
    );

-- ============================================================================
-- AUDIT LOGS POLICIES
-- ============================================================================

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
    ON audit_logs FOR SELECT
    USING (
        auth.is_admin() OR
        (auth.is_owner_or_above() AND dispensary_id = auth.user_dispensary_id())
    );

-- System can insert audit logs (via triggers and application code)
CREATE POLICY "System can create audit logs"
    ON audit_logs FOR INSERT
    WITH CHECK (true); -- Triggers handle security

-- Only admins can delete old audit logs (for retention policies)
CREATE POLICY "Admins can delete audit logs"
    ON audit_logs FOR DELETE
    USING (auth.is_admin());

-- ============================================================================
-- API INTEGRATIONS POLICIES
-- ============================================================================

-- Owners can view API integrations
CREATE POLICY "Owners can view integrations"
    ON api_integrations FOR SELECT
    USING (
        (dispensary_id = auth.user_dispensary_id() AND auth.is_owner_or_above()) OR
        auth.is_admin()
    );

-- Owners can create API integrations
CREATE POLICY "Owners can create integrations"
    ON api_integrations FOR INSERT
    WITH CHECK (
        dispensary_id = auth.user_dispensary_id() AND
        auth.is_owner_or_above()
    );

-- Owners can update API integrations
CREATE POLICY "Owners can update integrations"
    ON api_integrations FOR UPDATE
    USING (
        dispensary_id = auth.user_dispensary_id() AND
        auth.is_owner_or_above()
    )
    WITH CHECK (
        dispensary_id = auth.user_dispensary_id() AND
        auth.is_owner_or_above()
    );

-- Owners can delete API integrations
CREATE POLICY "Owners can delete integrations"
    ON api_integrations FOR DELETE
    USING (
        dispensary_id = auth.user_dispensary_id() AND
        auth.is_owner_or_above()
    );

-- ============================================================================
-- REPORTS POLICIES
-- ============================================================================

-- Users with view_reports permission can view reports
CREATE POLICY "Authorized users can view reports"
    ON reports FOR SELECT
    USING (
        (dispensary_id = auth.user_dispensary_id() AND auth.has_permission('view_reports')) OR
        auth.is_admin()
    );

-- Users with view_reports permission can create reports
CREATE POLICY "Authorized users can create reports"
    ON reports FOR INSERT
    WITH CHECK (
        dispensary_id = auth.user_dispensary_id() AND
        auth.has_permission('view_reports') AND
        generated_by = auth.uid()
    );

-- Users can update their own pending reports (to cancel)
CREATE POLICY "Users can update their reports"
    ON reports FOR UPDATE
    USING (
        dispensary_id = auth.user_dispensary_id() AND
        generated_by = auth.uid() AND
        status = 'pending'
    )
    WITH CHECK (
        dispensary_id = auth.user_dispensary_id() AND
        generated_by = auth.uid()
    );

-- Managers can delete reports
CREATE POLICY "Managers can delete reports"
    ON reports FOR DELETE
    USING (
        dispensary_id = auth.user_dispensary_id() AND
        auth.is_manager_or_above()
    );

-- ============================================================================
-- SECURITY DEFINER FUNCTIONS FOR SERVICE ROLE
-- ============================================================================

-- Function for system to create audit logs (bypasses RLS)
CREATE OR REPLACE FUNCTION create_audit_log(
    p_dispensary_id UUID,
    p_user_id UUID,
    p_user_email VARCHAR,
    p_user_role user_role,
    p_action VARCHAR,
    p_resource_type VARCHAR,
    p_resource_id UUID,
    p_ip_address INET DEFAULT NULL,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO audit_logs (
        dispensary_id,
        user_id,
        user_email,
        user_role,
        action,
        resource_type,
        resource_id,
        ip_address,
        old_values,
        new_values
    ) VALUES (
        p_dispensary_id,
        p_user_id,
        p_user_email,
        p_user_role,
        p_action,
        p_resource_type,
        p_resource_id,
        p_ip_address,
        p_old_values,
        p_new_values
    ) RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle user login audit
CREATE OR REPLACE FUNCTION log_user_login(
    p_user_id UUID,
    p_ip_address INET DEFAULT NULL
)
RETURNS void AS $$
DECLARE
    v_dispensary_id UUID;
    v_email VARCHAR;
    v_role user_role;
BEGIN
    SELECT dispensary_id, email, role
    INTO v_dispensary_id, v_email, v_role
    FROM users WHERE id = p_user_id;

    UPDATE users
    SET last_login_at = NOW()
    WHERE id = p_user_id;

    PERFORM create_audit_log(
        v_dispensary_id,
        p_user_id,
        v_email,
        v_role,
        'login',
        'user',
        p_user_id,
        p_ip_address,
        NULL,
        NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant usage on sequences to authenticated users
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION auth.user_dispensary_id() TO authenticated;
GRANT EXECUTE ON FUNCTION auth.user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION auth.has_permission(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION auth.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION auth.is_manager_or_above() TO authenticated;
GRANT EXECUTE ON FUNCTION auth.is_owner_or_above() TO authenticated;
GRANT EXECUTE ON FUNCTION hash_pii(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION log_user_login(UUID, INET) TO authenticated;

-- Service role has full access (for edge functions)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION auth.user_dispensary_id() IS 'Returns the dispensary_id of the currently authenticated user';
COMMENT ON FUNCTION auth.user_role() IS 'Returns the role of the currently authenticated user';
COMMENT ON FUNCTION auth.has_permission(TEXT) IS 'Check if current user has a specific permission';
COMMENT ON FUNCTION auth.is_admin() IS 'Check if current user is an admin';
COMMENT ON FUNCTION auth.is_manager_or_above() IS 'Check if current user is a manager, owner, or admin';
COMMENT ON FUNCTION auth.is_owner_or_above() IS 'Check if current user is an owner or admin';
