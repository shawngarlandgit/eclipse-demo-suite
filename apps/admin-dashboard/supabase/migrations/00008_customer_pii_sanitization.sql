-- ============================================================================
-- Migration: Customer PII Sanitization for Maine MMCP Compliance
-- Description: Add encrypted/hashed columns for HIPAA-grade PII protection
--
-- COMPLIANCE: This migration implements data protection per:
-- - Maine Medical Use of Cannabis Program (MMCP) confidentiality rules
-- - METRC API Agreement encryption requirements
-- - HIPAA-grade security safeguards (even if not formally required)
--
-- Data Classification:
-- - HASHED (SHA-256): email, phone, license#, medical_card# (lookup only)
-- - ENCRYPTED (AES-256-GCM): first_name, last_name, DOB, address (retrievable)
-- - PLAIN: non-PII operational data
-- ============================================================================

-- Add new columns for sanitized PII storage
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS medical_card_hash VARCHAR(64),
ADD COLUMN IF NOT EXISTS first_name_encrypted TEXT,
ADD COLUMN IF NOT EXISTS last_name_encrypted TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth_encrypted TEXT,
ADD COLUMN IF NOT EXISTS physical_address_encrypted TEXT,
ADD COLUMN IF NOT EXISTS is_medical_patient BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS medical_card_expiration DATE,
ADD COLUMN IF NOT EXISTS import_source VARCHAR(255),
ADD COLUMN IF NOT EXISTS import_warnings TEXT[];

-- Create index for medical card lookup
CREATE INDEX IF NOT EXISTS idx_customers_medical_card_hash
ON customers(dispensary_id, medical_card_hash)
WHERE medical_card_hash IS NOT NULL;

-- Create index for medical patient status
CREATE INDEX IF NOT EXISTS idx_customers_medical_patient
ON customers(dispensary_id, is_medical_patient)
WHERE is_medical_patient = true;

-- Create index for expired cards (for compliance alerts)
CREATE INDEX IF NOT EXISTS idx_customers_card_expiration
ON customers(dispensary_id, medical_card_expiration)
WHERE medical_card_expiration IS NOT NULL;

-- ============================================================================
-- Audit Log Enhancements for Customer Data Access
-- ============================================================================

-- Add specific audit actions for MMCP compliance
DO $$ BEGIN
  CREATE TYPE customer_access_type AS ENUM (
    'view_list',           -- Viewed customer list
    'view_detail',         -- Viewed individual customer
    'verify_card',         -- Verified medical card
    'export_data',         -- Exported customer data
    'import_data',         -- Imported customer data
    'decrypt_pii',         -- Decrypted PII fields
    'update_record',       -- Updated customer record
    'delete_record'        -- Deleted customer record
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create dedicated customer access audit table
CREATE TABLE IF NOT EXISTS customer_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispensary_id UUID NOT NULL REFERENCES dispensaries(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_email VARCHAR(255) NOT NULL,
  user_role user_role NOT NULL,

  -- Access details
  access_type customer_access_type NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_count INTEGER DEFAULT 1,  -- For bulk operations

  -- Context
  ip_address INET,
  user_agent TEXT,
  reason TEXT,  -- Why they accessed (optional)

  -- For decryption events, track which fields
  fields_accessed TEXT[],

  -- Timestamps
  accessed_at TIMESTAMPTZ DEFAULT NOW(),

  -- Partitioning hint
  access_date DATE DEFAULT CURRENT_DATE
);

-- Indexes for audit queries
CREATE INDEX IF NOT EXISTS idx_customer_access_logs_dispensary
ON customer_access_logs(dispensary_id, accessed_at DESC);

CREATE INDEX IF NOT EXISTS idx_customer_access_logs_user
ON customer_access_logs(user_id, accessed_at DESC);

CREATE INDEX IF NOT EXISTS idx_customer_access_logs_customer
ON customer_access_logs(customer_id, accessed_at DESC)
WHERE customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_customer_access_logs_type
ON customer_access_logs(access_type, accessed_at DESC);

CREATE INDEX IF NOT EXISTS idx_customer_access_logs_date
ON customer_access_logs(access_date);

-- ============================================================================
-- Function: Log Customer Data Access
-- ============================================================================

CREATE OR REPLACE FUNCTION log_customer_access(
  p_dispensary_id UUID,
  p_user_id UUID,
  p_user_email VARCHAR(255),
  p_user_role user_role,
  p_access_type customer_access_type,
  p_customer_id UUID DEFAULT NULL,
  p_customer_count INTEGER DEFAULT 1,
  p_fields_accessed TEXT[] DEFAULT NULL,
  p_reason TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO customer_access_logs (
    dispensary_id,
    user_id,
    user_email,
    user_role,
    access_type,
    customer_id,
    customer_count,
    fields_accessed,
    reason,
    ip_address,
    user_agent
  ) VALUES (
    p_dispensary_id,
    p_user_id,
    p_user_email,
    p_user_role,
    p_access_type,
    p_customer_id,
    p_customer_count,
    p_fields_accessed,
    p_reason,
    p_ip_address,
    p_user_agent
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RLS Policies for Customer Access Logs
-- ============================================================================

ALTER TABLE customer_access_logs ENABLE ROW LEVEL SECURITY;

-- Only allow viewing logs from own dispensary
CREATE POLICY customer_access_logs_select_policy
ON customer_access_logs FOR SELECT
USING (dispensary_id = auth.user_dispensary_id());

-- Only allow inserting logs for own dispensary
CREATE POLICY customer_access_logs_insert_policy
ON customer_access_logs FOR INSERT
WITH CHECK (dispensary_id = auth.user_dispensary_id());

-- ============================================================================
-- View: Customer Import Summary (Non-PII)
-- ============================================================================

CREATE OR REPLACE VIEW v_customer_import_summary AS
SELECT
  c.dispensary_id,
  c.import_source,
  COUNT(*) as total_imported,
  COUNT(*) FILTER (WHERE c.is_medical_patient = true) as medical_patients,
  COUNT(*) FILTER (WHERE c.medical_card_expiration IS NOT NULL
                    AND c.medical_card_expiration < CURRENT_DATE) as expired_cards,
  COUNT(*) FILTER (WHERE c.email_hash IS NOT NULL) as has_email,
  COUNT(*) FILTER (WHERE c.phone_hash IS NOT NULL) as has_phone,
  COUNT(*) FILTER (WHERE c.license_number_hash IS NOT NULL) as has_license,
  MIN(c.created_at) as first_import,
  MAX(c.created_at) as last_import
FROM customers c
WHERE c.import_source IS NOT NULL
GROUP BY c.dispensary_id, c.import_source;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON COLUMN customers.medical_card_hash IS 'SHA-256 hash of Maine medical card number for lookup';
COMMENT ON COLUMN customers.first_name_encrypted IS 'AES-256-GCM encrypted first name for personalization';
COMMENT ON COLUMN customers.last_name_encrypted IS 'AES-256-GCM encrypted last name for ID verification';
COMMENT ON COLUMN customers.date_of_birth_encrypted IS 'AES-256-GCM encrypted DOB for age verification';
COMMENT ON COLUMN customers.physical_address_encrypted IS 'AES-256-GCM encrypted address for delivery';
COMMENT ON COLUMN customers.is_medical_patient IS 'Whether customer has medical card on file';
COMMENT ON COLUMN customers.medical_card_expiration IS 'Expiration date of medical card (non-PII)';
COMMENT ON COLUMN customers.import_source IS 'Identifier of CSV/data source for audit trail';
COMMENT ON COLUMN customers.import_warnings IS 'Any warnings generated during import processing';

COMMENT ON TABLE customer_access_logs IS 'MMCP-compliant audit trail of all customer PII access';
