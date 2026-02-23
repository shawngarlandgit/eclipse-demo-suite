-- ============================================================================
-- Migration: Customer Purchase History
-- Description: Track individual product purchases for AI recommendations
-- ============================================================================

-- Create customer_purchases table to track what each customer buys
-- This powers the AI recommendation engine
CREATE TABLE IF NOT EXISTS customer_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispensary_id UUID NOT NULL REFERENCES dispensaries(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,

    -- Denormalized product data (preserved even if product deleted)
    product_name VARCHAR(255) NOT NULL,
    strain_name VARCHAR(255),
    strain_type VARCHAR(50), -- indica, sativa, hybrid
    category VARCHAR(50), -- flower, pre_roll, concentrate, edible, vape, etc.

    -- Effects for AI matching (denormalized from strain data)
    effects TEXT[], -- ['relaxing', 'creative', 'energetic']

    -- Purchase details
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2),

    -- Timestamps
    purchased_at TIMESTAMPTZ DEFAULT NOW(),

    -- Indexes for fast queries
    CONSTRAINT fk_customer_purchases_dispensary
        FOREIGN KEY (dispensary_id) REFERENCES dispensaries(id)
);

-- Index for customer history lookups
CREATE INDEX IF NOT EXISTS idx_customer_purchases_customer
ON customer_purchases(customer_id, purchased_at DESC);

-- Index for dispensary-wide analytics
CREATE INDEX IF NOT EXISTS idx_customer_purchases_dispensary
ON customer_purchases(dispensary_id, purchased_at DESC);

-- Index for strain popularity
CREATE INDEX IF NOT EXISTS idx_customer_purchases_strain
ON customer_purchases(dispensary_id, strain_name)
WHERE strain_name IS NOT NULL;

-- Enable RLS
ALTER TABLE customer_purchases ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see purchases from their dispensary
CREATE POLICY customer_purchases_dispensary_isolation
ON customer_purchases
FOR ALL
USING (dispensary_id = auth.user_dispensary_id());

-- ============================================================================
-- Materialized View: Customer Preferences (for fast AI queries)
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_customer_preferences AS
SELECT
    cp.customer_id,
    cp.dispensary_id,

    -- Strain type preferences (weighted by frequency)
    mode() WITHIN GROUP (ORDER BY cp.strain_type) as preferred_strain_type,
    array_agg(DISTINCT cp.strain_type) FILTER (WHERE cp.strain_type IS NOT NULL) as all_strain_types,

    -- Top effects (flattened and counted)
    (
        SELECT array_agg(effect ORDER BY cnt DESC)
        FROM (
            SELECT unnest(cp2.effects) as effect, COUNT(*) as cnt
            FROM customer_purchases cp2
            WHERE cp2.customer_id = cp.customer_id
            GROUP BY unnest(cp2.effects)
            LIMIT 10
        ) top_effects
    ) as top_effects,

    -- Purchase stats
    COUNT(DISTINCT cp.transaction_id) as transaction_count,
    COUNT(*) as total_items_purchased,
    SUM(cp.quantity) as total_quantity,

    -- Favorite strains
    (
        SELECT array_agg(strain_name ORDER BY cnt DESC)
        FROM (
            SELECT cp3.strain_name, COUNT(*) as cnt
            FROM customer_purchases cp3
            WHERE cp3.customer_id = cp.customer_id
              AND cp3.strain_name IS NOT NULL
            GROUP BY cp3.strain_name
            ORDER BY cnt DESC
            LIMIT 5
        ) top_strains
    ) as favorite_strains,

    -- Recency
    MAX(cp.purchased_at) as last_purchase_at,
    MIN(cp.purchased_at) as first_purchase_at

FROM customer_purchases cp
GROUP BY cp.customer_id, cp.dispensary_id;

-- Index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_customer_preferences_customer
ON mv_customer_preferences(customer_id);

-- ============================================================================
-- Function: Refresh customer preferences (call after purchases)
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_customer_preferences()
RETURNS TRIGGER AS $$
BEGIN
    -- Refresh the materialized view concurrently (non-blocking)
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_customer_preferences;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: For production, you'd want to debounce this or run it on a schedule
-- rather than on every insert. For now, we'll refresh manually after batch inserts.

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE customer_purchases IS 'Individual product purchases linked to customers for AI recommendations';
COMMENT ON MATERIALIZED VIEW mv_customer_preferences IS 'Pre-aggregated customer preferences for fast AI recommendation queries';
