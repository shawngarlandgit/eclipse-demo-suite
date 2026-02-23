-- ============================================================================
-- COMBINED MIGRATION: Base Schema + Customer Purchase History + AI Recommendations
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ENUMS (only if not exists)
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('staff', 'manager', 'owner', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE compliance_status AS ENUM ('compliant', 'warning', 'violation', 'resolved');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM ('sale', 'return', 'void', 'adjustment');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE product_category AS ENUM ('flower', 'pre_roll', 'concentrate', 'edible', 'topical', 'tincture', 'vape', 'accessory');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Dispensaries Table
CREATE TABLE IF NOT EXISTS dispensaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    license_number VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL,
    zip_code VARCHAR(10) NOT NULL,
    timezone VARCHAR(50) DEFAULT 'America/Los_Angeles',
    tax_rate DECIMAL(5,4) DEFAULT 0.0000,
    settings JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispensary_id UUID NOT NULL REFERENCES dispensaries(id) ON DELETE CASCADE,
    sku VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    product_type VARCHAR(50) NOT NULL DEFAULT 'flower',
    strain_name VARCHAR(255),
    strain_type VARCHAR(50),
    brand VARCHAR(255),
    description TEXT,
    thc_pct DECIMAL(5,2),
    cbd_pct DECIMAL(5,2),
    weight_grams DECIMAL(10,2),
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    quantity_on_hand INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 10,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_sku_per_dispensary UNIQUE (dispensary_id, sku)
);

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispensary_id UUID NOT NULL REFERENCES dispensaries(id) ON DELETE CASCADE,
    email_hash VARCHAR(64),
    phone_hash VARCHAR(64),
    first_name_initial CHAR(1),
    has_medical_card BOOLEAN DEFAULT false,
    medical_card_expires_at DATE,
    total_purchases DECIMAL(12,2) DEFAULT 0,
    total_transactions INTEGER DEFAULT 0,
    first_purchase_at TIMESTAMPTZ,
    last_purchase_at TIMESTAMPTZ,
    customer_tier VARCHAR(20) DEFAULT 'standard',
    loyalty_points INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispensary_id UUID NOT NULL REFERENCES dispensaries(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    transaction_number VARCHAR(50) NOT NULL,
    transaction_type transaction_type NOT NULL DEFAULT 'sale',
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    payment_method VARCHAR(50),
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CUSTOMER LICENSE TRACKING (for ID scan identification)
-- ============================================================================

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS license_number_hash VARCHAR(64);

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);

-- Index for fast customer lookup by license hash
CREATE INDEX IF NOT EXISTS idx_customers_license_hash
ON customers(dispensary_id, license_number_hash)
WHERE license_number_hash IS NOT NULL;

-- ============================================================================
-- CUSTOMER PURCHASES TABLE (for AI recommendations)
-- ============================================================================

CREATE TABLE IF NOT EXISTS customer_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispensary_id UUID NOT NULL REFERENCES dispensaries(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    strain_name VARCHAR(255),
    strain_type VARCHAR(50),
    category VARCHAR(50),
    effects TEXT[],
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2),
    purchased_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for customer purchases
CREATE INDEX IF NOT EXISTS idx_customer_purchases_customer
ON customer_purchases(customer_id, purchased_at DESC);

CREATE INDEX IF NOT EXISTS idx_customer_purchases_dispensary
ON customer_purchases(dispensary_id, purchased_at DESC);

CREATE INDEX IF NOT EXISTS idx_customer_purchases_strain
ON customer_purchases(dispensary_id, strain_name)
WHERE strain_name IS NOT NULL;

-- Enable RLS on customer_purchases
ALTER TABLE customer_purchases ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- MATERIALIZED VIEW: Customer Preferences (for fast AI queries)
-- ============================================================================

DROP MATERIALIZED VIEW IF EXISTS mv_customer_preferences;

CREATE MATERIALIZED VIEW mv_customer_preferences AS
SELECT
    cp.customer_id,
    cp.dispensary_id,
    mode() WITHIN GROUP (ORDER BY cp.strain_type) as preferred_strain_type,
    array_agg(DISTINCT cp.strain_type) FILTER (WHERE cp.strain_type IS NOT NULL) as all_strain_types,
    COUNT(DISTINCT cp.transaction_id) as transaction_count,
    COUNT(*) as total_items_purchased,
    SUM(cp.quantity) as total_quantity,
    MAX(cp.purchased_at) as last_purchase_at,
    MIN(cp.purchased_at) as first_purchase_at
FROM customer_purchases cp
GROUP BY cp.customer_id, cp.dispensary_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_customer_preferences_customer
ON mv_customer_preferences(customer_id);

-- ============================================================================
-- Helper function for user dispensary (for RLS)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_dispensary_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT dispensary_id
        FROM public.users
        WHERE id = auth.uid()
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- DONE! Tables created for customer purchase history and AI recommendations
-- ============================================================================

SELECT 'Migration complete! Tables created:' as status;
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('dispensaries', 'products', 'customers', 'transactions', 'customer_purchases')
ORDER BY table_name;
