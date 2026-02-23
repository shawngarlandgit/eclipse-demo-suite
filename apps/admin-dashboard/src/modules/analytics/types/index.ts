/**
 * Analytics Module Types
 * Type definitions for analytics, reporting, and data visualization
 */

// ============================================================================
// DATE RANGES
// ============================================================================

export type DateRangePreset =
  | 'today'
  | 'yesterday'
  | 'last7days'
  | 'last30days'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisYear'
  | 'lastYear'
  | 'custom';

export interface DateRange {
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  preset?: DateRangePreset;
}

// ============================================================================
// REVENUE ANALYTICS
// ============================================================================

export interface RevenueTrend {
  date: string;
  revenue: number;
  transaction_count: number;
  avg_transaction_value: number;
}

export interface RevenueComparison {
  current: {
    total_revenue: number;
    transaction_count: number;
    avg_transaction_value: number;
  };
  previous: {
    total_revenue: number;
    transaction_count: number;
    avg_transaction_value: number;
  };
  change: {
    revenue_pct: number;
    transactions_pct: number;
    avg_value_pct: number;
  };
}

// ============================================================================
// CATEGORY ANALYTICS
// ============================================================================

export interface CategoryBreakdown {
  category: string;
  revenue: number;
  transaction_count: number;
  percentage: number;
  avg_transaction_value: number;
}

export interface ProductPerformance {
  product_id: string;
  product_name: string;
  category: string;
  revenue: number;
  quantity_sold: number;
  transaction_count: number;
  avg_price: number;
}

// ============================================================================
// CUSTOMER ANALYTICS
// ============================================================================

export interface CustomerMetrics {
  total_customers: number;
  new_customers: number;
  returning_customers: number;
  avg_customer_value: number;
  avg_purchase_frequency: number;
  retention_rate: number;
}

export interface CustomerTrend {
  date: string;
  new_customers: number;
  returning_customers: number;
  total_revenue: number;
}

export interface CustomerCohort {
  cohort_month: string;
  customer_count: number;
  month_1_retention: number;
  month_2_retention: number;
  month_3_retention: number;
  month_6_retention: number;
  lifetime_value: number;
}

// ============================================================================
// TIME-BASED ANALYTICS
// ============================================================================

export interface HourlyPattern {
  hour: number;
  day_of_week: string;
  avg_revenue: number;
  transaction_count: number;
}

export interface DayOfWeekPattern {
  day_of_week: string;
  avg_revenue: number;
  transaction_count: number;
}

// ============================================================================
// ANALYTICS SUMMARY
// ============================================================================

export interface AnalyticsSummary {
  date_range: DateRange;
  revenue: {
    total: number;
    change_pct: number;
    avg_daily: number;
  };
  transactions: {
    total: number;
    change_pct: number;
    avg_value: number;
    avg_value_change_pct: number;
  };
  customers: {
    total: number;
    new: number;
    returning: number;
    retention_rate: number;
  };
  top_product: {
    name: string;
    revenue: number;
  };
  top_category: {
    name: string;
    revenue: number;
    percentage: number;
  };
}

// ============================================================================
// FILTERS & STATE
// ============================================================================

export interface AnalyticsFilters {
  dateRange: DateRange;
  compareEnabled: boolean;
  comparisonPeriod: 'previous' | 'yearAgo' | null;
  categoryFilter: string | 'all';
}
