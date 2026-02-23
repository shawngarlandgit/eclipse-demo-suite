-- Cannabis Admin Dashboard - Materialized Views for Analytics
-- Migration: 00003_materialized_views
-- Description: Optimized materialized views for complex analytics queries

-- ============================================================================
-- DAILY SALES SUMMARY (for dashboard performance)
-- ============================================================================

CREATE MATERIALIZED VIEW mv_daily_sales_summary AS
SELECT
    t.dispensary_id,
    DATE(t.transaction_date) as sale_date,
    COUNT(DISTINCT t.id) as total_transactions,
    COUNT(DISTINCT t.customer_id) as unique_customers,
    SUM(t.total_amount) as total_revenue,
    SUM(t.subtotal) as total_subtotal,
    SUM(t.tax_amount) as total_tax,
    SUM(t.discount_amount) as total_discounts,
    AVG(t.total_amount) as avg_transaction_value,
    MAX(t.total_amount) as max_transaction_value,
    MIN(t.total_amount) as min_transaction_value
FROM transactions t
WHERE t.transaction_type = 'sale'
GROUP BY t.dispensary_id, DATE(t.transaction_date);

-- Indexes for fast lookups
CREATE UNIQUE INDEX idx_mv_daily_sales_dispensary_date
    ON mv_daily_sales_summary(dispensary_id, sale_date DESC);
CREATE INDEX idx_mv_daily_sales_date
    ON mv_daily_sales_summary(sale_date DESC);

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_daily_sales_summary()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_sales_summary;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PRODUCT PERFORMANCE (top/bottom sellers)
-- ============================================================================

CREATE MATERIALIZED VIEW mv_product_performance AS
SELECT
    p.dispensary_id,
    p.id as product_id,
    p.name as product_name,
    p.category,
    p.brand,
    p.retail_price,
    COUNT(DISTINCT ti.transaction_id) as times_sold,
    SUM(ti.quantity) as total_quantity_sold,
    SUM(ti.line_total) as total_revenue,
    SUM(ti.line_total - (ti.quantity * p.cost_price)) as total_profit,
    AVG(ti.quantity) as avg_quantity_per_transaction,
    MIN(ti.created_at) as first_sale_date,
    MAX(ti.created_at) as last_sale_date,
    -- Rank within category
    RANK() OVER (
        PARTITION BY p.dispensary_id, p.category
        ORDER BY SUM(ti.line_total) DESC
    ) as revenue_rank_in_category
FROM products p
LEFT JOIN transaction_items ti ON ti.product_id = p.id
LEFT JOIN transactions t ON t.id = ti.transaction_id AND t.transaction_type = 'sale'
WHERE p.is_active = true
GROUP BY p.dispensary_id, p.id, p.name, p.category, p.brand, p.retail_price;

-- Indexes
CREATE UNIQUE INDEX idx_mv_product_performance_id
    ON mv_product_performance(dispensary_id, product_id);
CREATE INDEX idx_mv_product_performance_revenue
    ON mv_product_performance(dispensary_id, total_revenue DESC NULLS LAST);
CREATE INDEX idx_mv_product_performance_category
    ON mv_product_performance(dispensary_id, category, revenue_rank_in_category);

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_product_performance()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_product_performance;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CUSTOMER SEGMENTS (RFM Analysis)
-- ============================================================================

CREATE MATERIALIZED VIEW mv_customer_segments AS
WITH customer_metrics AS (
    SELECT
        c.dispensary_id,
        c.id as customer_id,
        c.customer_tier,
        c.total_purchases,
        c.total_transactions,
        c.first_purchase_at,
        c.last_purchase_at,
        -- Recency: days since last purchase
        EXTRACT(DAY FROM (NOW() - c.last_purchase_at)) as days_since_last_purchase,
        -- Frequency: purchases per month
        CASE
            WHEN c.first_purchase_at IS NULL THEN 0
            ELSE c.total_transactions::FLOAT /
                 GREATEST(1, EXTRACT(DAY FROM (NOW() - c.first_purchase_at)) / 30.0)
        END as purchases_per_month,
        -- Monetary: average transaction value
        CASE
            WHEN c.total_transactions > 0 THEN c.total_purchases / c.total_transactions
            ELSE 0
        END as avg_transaction_value
    FROM customers c
),
rfm_scores AS (
    SELECT
        *,
        -- Recency score (1-5, lower days = higher score)
        CASE
            WHEN days_since_last_purchase <= 7 THEN 5
            WHEN days_since_last_purchase <= 30 THEN 4
            WHEN days_since_last_purchase <= 90 THEN 3
            WHEN days_since_last_purchase <= 180 THEN 2
            ELSE 1
        END as recency_score,
        -- Frequency score (1-5)
        CASE
            WHEN purchases_per_month >= 4 THEN 5
            WHEN purchases_per_month >= 2 THEN 4
            WHEN purchases_per_month >= 1 THEN 3
            WHEN purchases_per_month >= 0.5 THEN 2
            ELSE 1
        END as frequency_score,
        -- Monetary score (1-5)
        NTILE(5) OVER (
            PARTITION BY dispensary_id
            ORDER BY avg_transaction_value
        ) as monetary_score
    FROM customer_metrics
)
SELECT
    dispensary_id,
    customer_id,
    customer_tier,
    total_purchases,
    total_transactions,
    first_purchase_at,
    last_purchase_at,
    days_since_last_purchase,
    purchases_per_month,
    avg_transaction_value,
    recency_score,
    frequency_score,
    monetary_score,
    -- Combined RFM score
    (recency_score + frequency_score + monetary_score) as rfm_score,
    -- Segment classification
    CASE
        WHEN recency_score >= 4 AND frequency_score >= 4 AND monetary_score >= 4 THEN 'champions'
        WHEN recency_score >= 3 AND frequency_score >= 3 AND monetary_score >= 3 THEN 'loyal_customers'
        WHEN recency_score >= 4 AND frequency_score <= 2 THEN 'promising'
        WHEN recency_score <= 2 AND frequency_score >= 4 THEN 'at_risk'
        WHEN recency_score <= 2 AND frequency_score <= 2 THEN 'hibernating'
        WHEN recency_score >= 4 AND monetary_score >= 4 THEN 'big_spenders'
        ELSE 'regular'
    END as segment,
    -- Churn risk
    CASE
        WHEN days_since_last_purchase > 180 THEN 'high'
        WHEN days_since_last_purchase > 90 THEN 'medium'
        ELSE 'low'
    END as churn_risk
FROM rfm_scores;

-- Indexes
CREATE UNIQUE INDEX idx_mv_customer_segments_id
    ON mv_customer_segments(dispensary_id, customer_id);
CREATE INDEX idx_mv_customer_segments_segment
    ON mv_customer_segments(dispensary_id, segment);
CREATE INDEX idx_mv_customer_segments_rfm
    ON mv_customer_segments(dispensary_id, rfm_score DESC);
CREATE INDEX idx_mv_customer_segments_churn
    ON mv_customer_segments(dispensary_id, churn_risk);

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_customer_segments()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_customer_segments;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INVENTORY VALUE SUMMARY
-- ============================================================================

CREATE MATERIALIZED VIEW mv_inventory_value AS
SELECT
    p.dispensary_id,
    p.category,
    COUNT(p.id) as product_count,
    SUM(p.quantity_on_hand) as total_units,
    SUM(p.quantity_on_hand * p.cost_price) as total_cost_value,
    SUM(p.quantity_on_hand * p.retail_price) as total_retail_value,
    SUM(p.quantity_on_hand * (p.retail_price - p.cost_price)) as potential_profit,
    COUNT(*) FILTER (WHERE p.quantity_on_hand <= p.low_stock_threshold) as low_stock_count,
    COUNT(*) FILTER (WHERE p.quantity_on_hand = 0) as out_of_stock_count,
    AVG(p.quantity_on_hand) as avg_quantity_on_hand
FROM products p
WHERE p.is_active = true
GROUP BY p.dispensary_id, p.category;

-- Indexes
CREATE UNIQUE INDEX idx_mv_inventory_value
    ON mv_inventory_value(dispensary_id, category);

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_inventory_value()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_inventory_value;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- HOURLY SALES PATTERNS
-- ============================================================================

CREATE MATERIALIZED VIEW mv_hourly_sales_patterns AS
SELECT
    t.dispensary_id,
    EXTRACT(HOUR FROM t.transaction_date) as hour_of_day,
    EXTRACT(DOW FROM t.transaction_date) as day_of_week, -- 0=Sunday, 6=Saturday
    COUNT(t.id) as transaction_count,
    SUM(t.total_amount) as total_revenue,
    AVG(t.total_amount) as avg_transaction_value,
    COUNT(DISTINCT t.customer_id) as unique_customers
FROM transactions t
WHERE t.transaction_type = 'sale'
  AND t.transaction_date >= NOW() - INTERVAL '90 days'
GROUP BY t.dispensary_id, EXTRACT(HOUR FROM t.transaction_date), EXTRACT(DOW FROM t.transaction_date);

-- Indexes
CREATE UNIQUE INDEX idx_mv_hourly_patterns
    ON mv_hourly_sales_patterns(dispensary_id, day_of_week, hour_of_day);

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_hourly_sales_patterns()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_hourly_sales_patterns;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STAFF PERFORMANCE
-- ============================================================================

CREATE MATERIALIZED VIEW mv_staff_performance AS
WITH staff_metrics AS (
    SELECT
        u.dispensary_id,
        u.id as user_id,
        u.full_name,
        u.role,
        COUNT(DISTINCT t.id) as total_transactions,
        SUM(t.total_amount) as total_sales,
        AVG(t.total_amount) as avg_transaction_value,
        COUNT(DISTINCT DATE(t.transaction_date)) as days_worked,
        MIN(t.transaction_date) as first_sale_date,
        MAX(t.transaction_date) as last_sale_date
    FROM users u
    LEFT JOIN transactions t ON t.processed_by = u.id AND t.transaction_type = 'sale'
    WHERE u.is_active = true
    GROUP BY u.dispensary_id, u.id, u.full_name, u.role
)
SELECT
    dispensary_id,
    user_id,
    full_name,
    role,
    total_transactions,
    total_sales,
    avg_transaction_value,
    days_worked,
    first_sale_date,
    last_sale_date,
    -- Performance metrics
    CASE
        WHEN days_worked > 0 THEN total_transactions::FLOAT / days_worked
        ELSE 0
    END as avg_transactions_per_day,
    CASE
        WHEN days_worked > 0 THEN total_sales / days_worked
        ELSE 0
    END as avg_sales_per_day,
    -- Rankings
    RANK() OVER (
        PARTITION BY dispensary_id
        ORDER BY total_sales DESC
    ) as sales_rank,
    RANK() OVER (
        PARTITION BY dispensary_id
        ORDER BY total_transactions DESC
    ) as transaction_rank
FROM staff_metrics;

-- Indexes
CREATE UNIQUE INDEX idx_mv_staff_performance_id
    ON mv_staff_performance(dispensary_id, user_id);
CREATE INDEX idx_mv_staff_performance_sales
    ON mv_staff_performance(dispensary_id, total_sales DESC NULLS LAST);

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_staff_performance()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_staff_performance;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMPLIANCE DASHBOARD
-- ============================================================================

CREATE MATERIALIZED VIEW mv_compliance_dashboard AS
SELECT
    cf.dispensary_id,
    cf.severity,
    COUNT(*) as flag_count,
    COUNT(*) FILTER (WHERE cf.resolved_at IS NULL) as unresolved_count,
    COUNT(*) FILTER (WHERE cf.resolved_at IS NOT NULL) as resolved_count,
    MIN(cf.flagged_at) FILTER (WHERE cf.resolved_at IS NULL) as oldest_unresolved_date,
    AVG(EXTRACT(EPOCH FROM (cf.resolved_at - cf.flagged_at)) / 86400.0) FILTER (WHERE cf.resolved_at IS NOT NULL) as avg_resolution_days
FROM compliance_flags cf
WHERE cf.flagged_at >= NOW() - INTERVAL '180 days'
GROUP BY cf.dispensary_id, cf.severity;

-- Indexes
CREATE UNIQUE INDEX idx_mv_compliance_dashboard
    ON mv_compliance_dashboard(dispensary_id, severity);

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_compliance_dashboard()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_compliance_dashboard;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MASTER REFRESH FUNCTION (refresh all views)
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS void AS $$
BEGIN
    PERFORM refresh_daily_sales_summary();
    PERFORM refresh_product_performance();
    PERFORM refresh_customer_segments();
    PERFORM refresh_inventory_value();
    PERFORM refresh_hourly_sales_patterns();
    PERFORM refresh_staff_performance();
    PERFORM refresh_compliance_dashboard();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SCHEDULED REFRESH (via pg_cron if available, or edge function)
-- ============================================================================

-- Function to refresh views that change frequently (call every 5-15 minutes)
CREATE OR REPLACE FUNCTION refresh_realtime_views()
RETURNS void AS $$
BEGIN
    PERFORM refresh_inventory_value();
    PERFORM refresh_compliance_dashboard();
END;
$$ LANGUAGE plpgsql;

-- Function to refresh views that change daily (call once per day)
CREATE OR REPLACE FUNCTION refresh_daily_views()
RETURNS void AS $$
BEGIN
    PERFORM refresh_daily_sales_summary();
    PERFORM refresh_hourly_sales_patterns();
END;
$$ LANGUAGE plpgsql;

-- Function to refresh analytics views (call every hour)
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void AS $$
BEGIN
    PERFORM refresh_product_performance();
    PERFORM refresh_customer_segments();
    PERFORM refresh_staff_performance();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- HELPER FUNCTIONS FOR QUERYING MATERIALIZED VIEWS
-- ============================================================================

-- Get sales trend for date range
CREATE OR REPLACE FUNCTION get_sales_trend(
    p_dispensary_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    sale_date DATE,
    total_revenue NUMERIC,
    total_transactions BIGINT,
    avg_transaction_value NUMERIC,
    unique_customers BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.sale_date,
        s.total_revenue,
        s.total_transactions,
        s.avg_transaction_value,
        s.unique_customers
    FROM mv_daily_sales_summary s
    WHERE s.dispensary_id = p_dispensary_id
      AND s.sale_date BETWEEN p_start_date AND p_end_date
    ORDER BY s.sale_date;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get top products by revenue
CREATE OR REPLACE FUNCTION get_top_products(
    p_dispensary_id UUID,
    p_category product_category DEFAULT NULL,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    product_id UUID,
    product_name VARCHAR,
    category product_category,
    total_revenue NUMERIC,
    total_quantity_sold NUMERIC,
    times_sold BIGINT,
    revenue_rank_in_category BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        pp.product_id,
        pp.product_name,
        pp.category,
        pp.total_revenue,
        pp.total_quantity_sold,
        pp.times_sold,
        pp.revenue_rank_in_category
    FROM mv_product_performance pp
    WHERE pp.dispensary_id = p_dispensary_id
      AND (p_category IS NULL OR pp.category = p_category)
    ORDER BY pp.total_revenue DESC NULLS LAST
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get customer segment distribution
CREATE OR REPLACE FUNCTION get_customer_distribution(
    p_dispensary_id UUID
)
RETURNS TABLE (
    segment TEXT,
    customer_count BIGINT,
    total_revenue NUMERIC,
    avg_transaction_value NUMERIC,
    churn_risk TEXT,
    at_risk_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        cs.segment,
        COUNT(*)::BIGINT as customer_count,
        SUM(cs.total_purchases) as total_revenue,
        AVG(cs.avg_transaction_value) as avg_transaction_value,
        cs.churn_risk,
        COUNT(*) FILTER (WHERE cs.churn_risk IN ('high', 'medium'))::BIGINT as at_risk_count
    FROM mv_customer_segments cs
    WHERE cs.dispensary_id = p_dispensary_id
    GROUP BY cs.segment, cs.churn_risk
    ORDER BY customer_count DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT ON mv_daily_sales_summary TO authenticated;
GRANT SELECT ON mv_product_performance TO authenticated;
GRANT SELECT ON mv_customer_segments TO authenticated;
GRANT SELECT ON mv_inventory_value TO authenticated;
GRANT SELECT ON mv_hourly_sales_patterns TO authenticated;
GRANT SELECT ON mv_staff_performance TO authenticated;
GRANT SELECT ON mv_compliance_dashboard TO authenticated;

GRANT EXECUTE ON FUNCTION refresh_all_materialized_views() TO service_role;
GRANT EXECUTE ON FUNCTION refresh_realtime_views() TO service_role;
GRANT EXECUTE ON FUNCTION refresh_daily_views() TO service_role;
GRANT EXECUTE ON FUNCTION refresh_analytics_views() TO service_role;

GRANT EXECUTE ON FUNCTION get_sales_trend(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_products(UUID, product_category, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_customer_distribution(UUID) TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON MATERIALIZED VIEW mv_daily_sales_summary IS 'Daily sales aggregates for fast dashboard loading';
COMMENT ON MATERIALIZED VIEW mv_product_performance IS 'Product-level sales metrics and rankings';
COMMENT ON MATERIALIZED VIEW mv_customer_segments IS 'RFM analysis and customer segmentation';
COMMENT ON MATERIALIZED VIEW mv_inventory_value IS 'Current inventory value by category';
COMMENT ON MATERIALIZED VIEW mv_hourly_sales_patterns IS 'Sales patterns by hour and day of week';
COMMENT ON MATERIALIZED VIEW mv_staff_performance IS 'Staff sales performance metrics';
COMMENT ON MATERIALIZED VIEW mv_compliance_dashboard IS 'Compliance flag summary';

COMMENT ON FUNCTION refresh_all_materialized_views() IS 'Refresh all materialized views (expensive, use sparingly)';
COMMENT ON FUNCTION refresh_realtime_views() IS 'Refresh frequently-changing views (run every 5-15 min)';
COMMENT ON FUNCTION refresh_daily_views() IS 'Refresh daily aggregate views (run once per day)';
COMMENT ON FUNCTION refresh_analytics_views() IS 'Refresh analytics views (run every hour)';
