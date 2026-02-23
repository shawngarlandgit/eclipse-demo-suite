-- Cannabis Admin Dashboard - Complete Database Schema
-- Migration: 00001_initial_schema
-- Description: Initial database setup with all tables, indexes, and triggers

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE user_role AS ENUM ('staff', 'manager', 'owner', 'admin');
CREATE TYPE compliance_status AS ENUM ('compliant', 'warning', 'violation', 'resolved');
CREATE TYPE transaction_type AS ENUM ('sale', 'return', 'void', 'adjustment');
CREATE TYPE product_category AS ENUM ('flower', 'pre_roll', 'concentrate', 'edible', 'topical', 'tincture', 'vape', 'accessory');
CREATE TYPE integration_status AS ENUM ('active', 'inactive', 'error', 'syncing');
CREATE TYPE report_type AS ENUM ('daily_sales', 'inventory', 'compliance', 'audit', 'custom');
CREATE TYPE report_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Organizations/Dispensaries Table
CREATE TABLE dispensaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    license_number VARCHAR(100) UNIQUE NOT NULL,

    -- Contact Information
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),

    -- Address
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL,
    zip_code VARCHAR(10) NOT NULL,

    -- Business Details
    timezone VARCHAR(50) DEFAULT 'America/Los_Angeles',
    tax_rate DECIMAL(5,4) DEFAULT 0.0000,

    -- Settings (JSONB for flexible configuration)
    settings JSONB DEFAULT '{
        "business_hours": {
            "monday": {"open": "09:00", "close": "21:00"},
            "tuesday": {"open": "09:00", "close": "21:00"},
            "wednesday": {"open": "09:00", "close": "21:00"},
            "thursday": {"open": "09:00", "close": "21:00"},
            "friday": {"open": "09:00", "close": "21:00"},
            "saturday": {"open": "10:00", "close": "22:00"},
            "sunday": {"open": "10:00", "close": "20:00"}
        },
        "low_stock_threshold": 10,
        "enable_metrc": false,
        "enable_pos_sync": false
    }'::jsonb,

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_state CHECK (state ~* '^[A-Z]{2}$'),
    CONSTRAINT valid_tax_rate CHECK (tax_rate >= 0 AND tax_rate <= 1)
);

-- Users Table (extends Supabase auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    dispensary_id UUID NOT NULL REFERENCES dispensaries(id) ON DELETE CASCADE,

    -- Profile Information
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,

    -- Role & Permissions
    role user_role NOT NULL DEFAULT 'staff',
    permissions JSONB DEFAULT '{
        "view_dashboard": true,
        "manage_inventory": false,
        "view_reports": false,
        "manage_staff": false,
        "view_analytics": false,
        "manage_integrations": false,
        "view_audit_logs": false
    }'::jsonb,

    -- Employment Details
    employee_id VARCHAR(50),
    hire_date DATE,

    -- Status
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Indexes will be added later
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Products Table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispensary_id UUID NOT NULL REFERENCES dispensaries(id) ON DELETE CASCADE,

    -- Product Information
    sku VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category product_category NOT NULL,
    brand VARCHAR(255),
    description TEXT,

    -- Cannabis-Specific Details
    thc_percentage DECIMAL(5,2),
    cbd_percentage DECIMAL(5,2),
    weight_grams DECIMAL(10,2),
    unit_type VARCHAR(50), -- 'gram', 'unit', 'ounce', etc.

    -- Pricing
    cost_price DECIMAL(10,2) NOT NULL,
    retail_price DECIMAL(10,2) NOT NULL,

    -- Inventory
    quantity_on_hand INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 10,

    -- Compliance
    metrc_id VARCHAR(100) UNIQUE,
    batch_number VARCHAR(100),
    lab_test_results JSONB,

    -- Tracking
    is_active BOOLEAN DEFAULT true,
    last_restocked_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT unique_sku_per_dispensary UNIQUE (dispensary_id, sku),
    CONSTRAINT valid_thc CHECK (thc_percentage >= 0 AND thc_percentage <= 100),
    CONSTRAINT valid_cbd CHECK (cbd_percentage >= 0 AND cbd_percentage <= 100),
    CONSTRAINT valid_pricing CHECK (retail_price >= cost_price),
    CONSTRAINT positive_quantity CHECK (quantity_on_hand >= 0)
);

-- Customers Table (PII-protected)
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispensary_id UUID NOT NULL REFERENCES dispensaries(id) ON DELETE CASCADE,

    -- PII - Hashed for compliance
    email_hash VARCHAR(64), -- SHA-256 hash
    phone_hash VARCHAR(64), -- SHA-256 hash

    -- Non-identifying information
    first_name_initial CHAR(1),

    -- Medical Card Info
    has_medical_card BOOLEAN DEFAULT false,
    medical_card_expires_at DATE,

    -- Purchase History Summary
    total_purchases DECIMAL(12,2) DEFAULT 0,
    total_transactions INTEGER DEFAULT 0,
    first_purchase_at TIMESTAMPTZ,
    last_purchase_at TIMESTAMPTZ,

    -- Segmentation
    customer_tier VARCHAR(20) DEFAULT 'standard', -- standard, silver, gold, platinum
    loyalty_points INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT unique_email_per_dispensary UNIQUE (dispensary_id, email_hash),
    CONSTRAINT valid_tier CHECK (customer_tier IN ('standard', 'silver', 'gold', 'platinum'))
);

-- Transactions Table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispensary_id UUID NOT NULL REFERENCES dispensaries(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,

    -- Transaction Details
    transaction_number VARCHAR(50) NOT NULL,
    transaction_type transaction_type NOT NULL DEFAULT 'sale',

    -- Financial Details
    subtotal DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(12,2) NOT NULL,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,

    -- Payment
    payment_method VARCHAR(50), -- 'cash', 'debit', 'credit', 'check'

    -- Staff & POS
    processed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    pos_terminal_id VARCHAR(100),

    -- Compliance
    metrc_id VARCHAR(100),

    -- Metadata
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Timestamps
    transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT unique_transaction_number UNIQUE (dispensary_id, transaction_number),
    CONSTRAINT valid_total CHECK (total_amount = subtotal + tax_amount - discount_amount),
    CONSTRAINT positive_amounts CHECK (
        subtotal >= 0 AND
        tax_amount >= 0 AND
        discount_amount >= 0 AND
        total_amount >= 0
    )
);

-- Transaction Items Table
CREATE TABLE transaction_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,

    -- Item Details
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    line_total DECIMAL(12,2) NOT NULL,

    -- Snapshot data (in case product is deleted/modified)
    product_snapshot JSONB NOT NULL,

    -- Batch Tracking
    batch_number VARCHAR(100),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT positive_quantity CHECK (quantity > 0),
    CONSTRAINT valid_line_total CHECK (line_total = (quantity * unit_price) - discount_amount)
);

-- Inventory Snapshots Table (for historical tracking)
CREATE TABLE inventory_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispensary_id UUID NOT NULL REFERENCES dispensaries(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

    -- Snapshot Data
    quantity INTEGER NOT NULL,
    value DECIMAL(12,2) NOT NULL,

    -- Metadata
    snapshot_type VARCHAR(50) NOT NULL, -- 'daily', 'transaction', 'adjustment', 'audit'
    notes TEXT,

    -- Timestamps
    snapshot_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT positive_snapshot_quantity CHECK (quantity >= 0)
);

-- Compliance Flags Table
CREATE TABLE compliance_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispensary_id UUID NOT NULL REFERENCES dispensaries(id) ON DELETE CASCADE,

    -- Flag Details
    flag_type VARCHAR(100) NOT NULL,
    severity compliance_status NOT NULL,

    -- Description
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,

    -- Related Entities
    related_product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    related_transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,

    -- Resolution
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolution_notes TEXT,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Timestamps
    flagged_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_resolution CHECK (
        (resolved_at IS NULL AND resolved_by IS NULL) OR
        (resolved_at IS NOT NULL AND resolved_by IS NOT NULL)
    )
);

-- Audit Logs Table (HIPAA/Compliance tracking)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispensary_id UUID NOT NULL REFERENCES dispensaries(id) ON DELETE CASCADE,

    -- User & Action
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_email VARCHAR(255) NOT NULL,
    user_role user_role NOT NULL,

    -- Action Details
    action VARCHAR(100) NOT NULL, -- 'create', 'read', 'update', 'delete', 'login', 'logout'
    resource_type VARCHAR(100) NOT NULL, -- 'product', 'transaction', 'user', etc.
    resource_id UUID,

    -- Request Context
    ip_address INET,
    user_agent TEXT,
    request_method VARCHAR(10),
    request_path TEXT,

    -- Data Changes (for update/delete actions)
    old_values JSONB,
    new_values JSONB,

    -- Status
    status VARCHAR(20) DEFAULT 'success', -- 'success', 'failure', 'error'
    error_message TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Partitioning hint (for future partitioning by date)
    log_date DATE DEFAULT CURRENT_DATE
);

-- API Integrations Table
CREATE TABLE api_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispensary_id UUID NOT NULL REFERENCES dispensaries(id) ON DELETE CASCADE,

    -- Integration Details
    integration_type VARCHAR(50) NOT NULL, -- 'metrc', 'pos', 'accounting', 'crm'
    name VARCHAR(255) NOT NULL,

    -- Configuration (encrypted)
    api_key_encrypted TEXT,
    api_secret_encrypted TEXT,
    config JSONB DEFAULT '{}'::jsonb,

    -- Status
    status integration_status DEFAULT 'inactive',
    last_sync_at TIMESTAMPTZ,
    last_sync_status VARCHAR(50),
    last_error TEXT,

    -- Sync Settings
    sync_frequency_minutes INTEGER DEFAULT 60,
    auto_sync_enabled BOOLEAN DEFAULT false,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT unique_integration_type UNIQUE (dispensary_id, integration_type)
);

-- Reports Table
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispensary_id UUID NOT NULL REFERENCES dispensaries(id) ON DELETE CASCADE,

    -- Report Details
    report_type report_type NOT NULL,
    title VARCHAR(255) NOT NULL,

    -- Generation
    generated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    status report_status DEFAULT 'pending',

    -- Date Range
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    -- Parameters
    filters JSONB DEFAULT '{}'::jsonb,

    -- Output
    file_url TEXT,
    file_size_bytes INTEGER,

    -- Processing
    processing_started_at TIMESTAMPTZ,
    processing_completed_at TIMESTAMPTZ,
    error_message TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Dispensaries
CREATE INDEX idx_dispensaries_license ON dispensaries(license_number);
CREATE INDEX idx_dispensaries_active ON dispensaries(is_active);

-- Users
CREATE INDEX idx_users_dispensary ON users(dispensary_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_users_dispensary_role ON users(dispensary_id, role);

-- Products
CREATE INDEX idx_products_dispensary ON products(dispensary_id);
CREATE INDEX idx_products_sku ON products(dispensary_id, sku);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_low_stock ON products(dispensary_id) WHERE quantity_on_hand <= low_stock_threshold;
CREATE INDEX idx_products_metrc ON products(metrc_id) WHERE metrc_id IS NOT NULL;

-- Customers
CREATE INDEX idx_customers_dispensary ON customers(dispensary_id);
CREATE INDEX idx_customers_email_hash ON customers(email_hash);
CREATE INDEX idx_customers_tier ON customers(customer_tier);
CREATE INDEX idx_customers_last_purchase ON customers(last_purchase_at DESC);

-- Transactions
CREATE INDEX idx_transactions_dispensary ON transactions(dispensary_id);
CREATE INDEX idx_transactions_customer ON transactions(customer_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date DESC);
CREATE INDEX idx_transactions_number ON transactions(transaction_number);
CREATE INDEX idx_transactions_dispensary_date ON transactions(dispensary_id, transaction_date DESC);
CREATE INDEX idx_transactions_processed_by ON transactions(processed_by);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);

-- Transaction Items
CREATE INDEX idx_transaction_items_transaction ON transaction_items(transaction_id);
CREATE INDEX idx_transaction_items_product ON transaction_items(product_id);

-- Inventory Snapshots
CREATE INDEX idx_inventory_snapshots_dispensary ON inventory_snapshots(dispensary_id);
CREATE INDEX idx_inventory_snapshots_product ON inventory_snapshots(product_id);
CREATE INDEX idx_inventory_snapshots_date ON inventory_snapshots(snapshot_date DESC);
CREATE INDEX idx_inventory_snapshots_dispensary_date ON inventory_snapshots(dispensary_id, snapshot_date DESC);

-- Compliance Flags
CREATE INDEX idx_compliance_flags_dispensary ON compliance_flags(dispensary_id);
CREATE INDEX idx_compliance_flags_severity ON compliance_flags(severity);
CREATE INDEX idx_compliance_flags_resolved ON compliance_flags(resolved_at);
CREATE INDEX idx_compliance_flags_unresolved ON compliance_flags(dispensary_id) WHERE resolved_at IS NULL;
CREATE INDEX idx_compliance_flags_product ON compliance_flags(related_product_id) WHERE related_product_id IS NOT NULL;

-- Audit Logs
CREATE INDEX idx_audit_logs_dispensary ON audit_logs(dispensary_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_date ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_log_date ON audit_logs(log_date);

-- API Integrations
CREATE INDEX idx_api_integrations_dispensary ON api_integrations(dispensary_id);
CREATE INDEX idx_api_integrations_type ON api_integrations(integration_type);
CREATE INDEX idx_api_integrations_status ON api_integrations(status);

-- Reports
CREATE INDEX idx_reports_dispensary ON reports(dispensary_id);
CREATE INDEX idx_reports_type ON reports(report_type);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_date_range ON reports(start_date, end_date);
CREATE INDEX idx_reports_created ON reports(created_at DESC);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_dispensaries_updated_at BEFORE UPDATE ON dispensaries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_integrations_updated_at BEFORE UPDATE ON api_integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inventory snapshot trigger (daily snapshots)
CREATE OR REPLACE FUNCTION create_inventory_snapshot()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO inventory_snapshots (
        dispensary_id,
        product_id,
        quantity,
        value,
        snapshot_type,
        snapshot_date
    ) VALUES (
        NEW.dispensary_id,
        NEW.id,
        NEW.quantity_on_hand,
        NEW.quantity_on_hand * NEW.cost_price,
        'transaction',
        CURRENT_DATE
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Transaction audit log trigger
CREATE OR REPLACE FUNCTION log_transaction_audit()
RETURNS TRIGGER AS $$
DECLARE
    v_user_email VARCHAR(255);
    v_user_role user_role;
BEGIN
    -- Get user details
    SELECT email, role INTO v_user_email, v_user_role
    FROM users WHERE id = NEW.processed_by;

    INSERT INTO audit_logs (
        dispensary_id,
        user_id,
        user_email,
        user_role,
        action,
        resource_type,
        resource_id,
        new_values,
        status
    ) VALUES (
        NEW.dispensary_id,
        NEW.processed_by,
        COALESCE(v_user_email, 'system'),
        COALESCE(v_user_role, 'staff'),
        'create',
        'transaction',
        NEW.id,
        to_jsonb(NEW),
        'success'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_transaction_creation AFTER INSERT ON transactions
    FOR EACH ROW EXECUTE FUNCTION log_transaction_audit();

-- Generic audit log trigger for sensitive tables
CREATE OR REPLACE FUNCTION log_table_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_action VARCHAR(20);
    v_user_id UUID;
    v_user_email VARCHAR(255);
    v_user_role user_role;
BEGIN
    -- Determine action
    IF TG_OP = 'INSERT' THEN
        v_action := 'create';
    ELSIF TG_OP = 'UPDATE' THEN
        v_action := 'update';
    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'delete';
    END IF;

    -- Get current user from session (set by RLS context)
    v_user_id := current_setting('app.user_id', true)::UUID;

    IF v_user_id IS NOT NULL THEN
        SELECT email, role INTO v_user_email, v_user_role
        FROM users WHERE id = v_user_id;
    END IF;

    INSERT INTO audit_logs (
        dispensary_id,
        user_id,
        user_email,
        user_role,
        action,
        resource_type,
        resource_id,
        old_values,
        new_values,
        status
    ) VALUES (
        COALESCE(NEW.dispensary_id, OLD.dispensary_id),
        v_user_id,
        COALESCE(v_user_email, 'system'),
        COALESCE(v_user_role, 'staff'),
        v_action,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END,
        'success'
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to sensitive tables
CREATE TRIGGER audit_products AFTER INSERT OR UPDATE OR DELETE ON products
    FOR EACH ROW EXECUTE FUNCTION log_table_changes();

CREATE TRIGGER audit_users AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION log_table_changes();

-- Customer statistics update trigger
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE customers
    SET
        total_purchases = total_purchases + NEW.total_amount,
        total_transactions = total_transactions + 1,
        last_purchase_at = NEW.transaction_date,
        first_purchase_at = COALESCE(first_purchase_at, NEW.transaction_date)
    WHERE id = NEW.customer_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customer_transaction_stats AFTER INSERT ON transactions
    FOR EACH ROW WHEN (NEW.customer_id IS NOT NULL AND NEW.transaction_type = 'sale')
    EXECUTE FUNCTION update_customer_stats();

-- Inventory adjustment trigger
CREATE OR REPLACE FUNCTION adjust_product_inventory()
RETURNS TRIGGER AS $$
BEGIN
    -- Decrease inventory when sale is made
    UPDATE products
    SET quantity_on_hand = quantity_on_hand - NEW.quantity
    WHERE id = NEW.product_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER adjust_inventory_on_sale AFTER INSERT ON transaction_items
    FOR EACH ROW EXECUTE FUNCTION adjust_product_inventory();

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function to hash PII data
CREATE OR REPLACE FUNCTION hash_pii(input_text TEXT)
RETURNS VARCHAR(64) AS $$
BEGIN
    RETURN encode(digest(input_text, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to encrypt API keys
CREATE OR REPLACE FUNCTION encrypt_api_key(api_key TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN encode(
        pgp_sym_encrypt(
            api_key,
            current_setting('app.encryption_key', true)
        ),
        'base64'
    );
END;
$$ LANGUAGE plpgsql;

-- Function to decrypt API keys
CREATE OR REPLACE FUNCTION decrypt_api_key(encrypted_key TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN pgp_sym_decrypt(
        decode(encrypted_key, 'base64'),
        current_setting('app.encryption_key', true)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- COMMENT ON SCHEMA
COMMENT ON TABLE dispensaries IS 'Multi-tenant organizations/dispensaries';
COMMENT ON TABLE users IS 'User profiles extending Supabase auth.users';
COMMENT ON TABLE products IS 'Product catalog with cannabis-specific attributes';
COMMENT ON TABLE customers IS 'Customer records with PII hashing for compliance';
COMMENT ON TABLE transactions IS 'Sales transactions with financial details';
COMMENT ON TABLE transaction_items IS 'Line items for each transaction';
COMMENT ON TABLE inventory_snapshots IS 'Historical inventory tracking for audits';
COMMENT ON TABLE compliance_flags IS 'Compliance violations and warnings';
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for HIPAA compliance';
COMMENT ON TABLE api_integrations IS 'Third-party API configurations';
COMMENT ON TABLE reports IS 'Generated reports queue and history';
