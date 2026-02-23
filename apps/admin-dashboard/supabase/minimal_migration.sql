-- ============================================================================
-- MINIMAL MIGRATION: Core tables for Customer Purchase History
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CORE TABLES (only if they don't exist)
-- ============================================================================

-- Dispensaries Table
CREATE TABLE IF NOT EXISTS dispensaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    license_number VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    address_line1 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(2),
    zip_code VARCHAR(10),
    tax_rate DECIMAL(5,4) DEFAULT 0.0875,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispensary_id UUID REFERENCES dispensaries(id) ON DELETE CASCADE,
    sku VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    product_type VARCHAR(50) DEFAULT 'flower',
    strain_name VARCHAR(255),
    strain_type VARCHAR(50),
    brand VARCHAR(255),
    description TEXT,
    thc_pct DECIMAL(5,2),
    cbd_pct DECIMAL(5,2),
    price DECIMAL(10,2) DEFAULT 0,
    quantity_on_hand INTEGER DEFAULT 0,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispensary_id UUID REFERENCES dispensaries(id) ON DELETE CASCADE,
    email_hash VARCHAR(64),
    phone_hash VARCHAR(64),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    license_number_hash VARCHAR(64),
    has_medical_card BOOLEAN DEFAULT false,
    total_purchases DECIMAL(12,2) DEFAULT 0,
    total_transactions INTEGER DEFAULT 0,
    first_purchase_at TIMESTAMPTZ,
    last_purchase_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispensary_id UUID REFERENCES dispensaries(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    transaction_number VARCHAR(50),
    subtotal DECIMAL(12,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) DEFAULT 0,
    payment_method VARCHAR(50),
    transaction_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CUSTOMER PURCHASES (for AI recommendations)
-- ============================================================================

CREATE TABLE IF NOT EXISTS customer_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispensary_id UUID REFERENCES dispensaries(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    strain_name VARCHAR(255),
    strain_type VARCHAR(50),
    category VARCHAR(50),
    effects TEXT[],
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2),
    purchased_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ADD MISSING COLUMNS TO EXISTING TABLES
-- ============================================================================

-- Add license tracking columns to customers if they don't exist
ALTER TABLE customers ADD COLUMN IF NOT EXISTS license_number_hash VARCHAR(64);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_customers_license_hash
ON customers(dispensary_id, license_number_hash)
WHERE license_number_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_customer_purchases_customer
ON customer_purchases(customer_id, purchased_at DESC);

CREATE INDEX IF NOT EXISTS idx_products_dispensary
ON products(dispensary_id);

CREATE INDEX IF NOT EXISTS idx_products_strain
ON products(dispensary_id, strain_name)
WHERE strain_name IS NOT NULL;

-- ============================================================================
-- SEED: Create a test dispensary if none exists
-- ============================================================================

INSERT INTO dispensaries (id, name, license_number)
SELECT
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
    'The Neon Pipe',
    'C10-0000001-LIC'
WHERE NOT EXISTS (
    SELECT 1 FROM dispensaries LIMIT 1
);

-- ============================================================================
-- DONE!
-- ============================================================================

SELECT 'Migration complete!' as status;
SELECT table_name,
       (SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_name = t.table_name) as columns
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_name IN ('dispensaries', 'products', 'customers', 'transactions', 'customer_purchases')
ORDER BY table_name;
