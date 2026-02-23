-- ============================================================================
-- Migration: Customer License Tracking
-- Description: Add license number hash for customer identification from ID scan
-- ============================================================================

-- Add license number hash column (SHA-256 of driver's license number)
-- This is the primary identifier for returning customers from ID scans
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS license_number_hash VARCHAR(64);

-- Add first_name column for personalization (from ID scan)
-- More useful than just the initial for greeting returning customers
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);

-- Add last_name column for full identification
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);

-- Create index for fast customer lookup by license hash
CREATE INDEX IF NOT EXISTS idx_customers_license_hash
ON customers(dispensary_id, license_number_hash)
WHERE license_number_hash IS NOT NULL;

-- Add unique constraint per dispensary (customer identified by license within a dispensary)
-- Using a partial unique index since license_number_hash can be NULL
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_license_per_dispensary
ON customers(dispensary_id, license_number_hash)
WHERE license_number_hash IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN customers.license_number_hash IS 'SHA-256 hash of driver''s license number from ID scan';
COMMENT ON COLUMN customers.first_name IS 'First name from ID scan for personalized greetings';
COMMENT ON COLUMN customers.last_name IS 'Last name from ID scan';
