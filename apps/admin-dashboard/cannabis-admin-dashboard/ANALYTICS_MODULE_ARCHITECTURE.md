# Analytics Module Architecture
**Cannabis Admin Dashboard - Advanced Analytics & Business Intelligence**

---

## Table of Contents
1. [Overview](#overview)
2. [File Structure](#file-structure)
3. [Type Definitions](#type-definitions)
4. [Service Layer](#service-layer)
5. [Zustand Store](#zustand-store)
6. [React Query Hooks](#react-query-hooks)
7. [Component Architecture](#component-architecture)
8. [Data Aggregation Strategies](#data-aggregation-strategies)
9. [Performance Optimization](#performance-optimization)
10. [Implementation Phases](#implementation-phases)

---

## Overview

The Analytics module provides advanced data visualization and business intelligence capabilities, building upon your existing Dashboard module. It follows your established architectural patterns:

**Architecture Pattern:**
```
Supabase DB + Edge Functions
  ↓
Service Layer (analytics.service.ts)
  ↓
React Query Hooks (useAnalytics.ts)
  ↓
Zustand Store (analyticsStore.ts)
  ↓
Components (Charts, Cards, Filters)
```

**Key Design Principles:**
- Reuse existing patterns from Dashboard and Inventory modules
- Leverage Supabase Edge Function `/calculate-analytics` for heavy computations
- Use materialized views for fast aggregations (already exists: `mv_daily_sales_summary`, `mv_product_performance`, etc.)
- Implement proper caching with React Query (5-15 min staleTime for analytics data)
- Support date range filtering, comparison mode, and export functionality
- Mobile-first responsive design with Chakra UI

---

## File Structure

```
src/
├── modules/
│   └── analytics/
│       ├── components/
│       │   ├── DateRangePicker.tsx          # Date range selection with presets
│       │   ├── ComparisonToggle.tsx         # Toggle comparison mode
│       │   ├── ExportMenu.tsx               # Export to CSV/PDF/PNG
│       │   ├── MetricCard.tsx               # Stat card with % change indicator
│       │   ├── charts/
│       │   │   ├── RevenueLineChart.tsx     # Revenue trends over time
│       │   │   ├── SalesByCategoryChart.tsx # Bar/Pie chart for categories
│       │   │   ├── ProductRankingChart.tsx  # Horizontal bar chart
│       │   │   ├── CustomerGrowthChart.tsx  # Line chart for customer metrics
│       │   │   ├── HeatmapChart.tsx         # Time-of-day patterns
│       │   │   ├── AreaChart.tsx            # Cumulative revenue/metrics
│       │   │   ├── ComparisonBarChart.tsx   # Period-over-period bars
│       │   │   └── CannabinoidMixChart.tsx  # THC vs CBD donut chart
│       │   ├── sections/
│       │   │   ├── SalesAnalyticsSection.tsx    # Revenue, trends, transactions
│       │   │   ├── CustomerAnalyticsSection.tsx # CLV, retention, cohorts
│       │   │   ├── ProductAnalyticsSection.tsx  # Rankings, mix, profitability
│       │   │   └── TimeAnalyticsSection.tsx     # Heatmaps, seasonal patterns
│       │   └── EmptyState.tsx               # No data placeholder
│       └── utils/
│           ├── chartHelpers.ts              # Chart formatting utilities
│           ├── aggregations.ts              # Client-side data aggregation
│           └── exportHelpers.ts             # CSV/PDF export logic
│
├── services/
│   └── api/
│       └── analytics.service.ts             # Analytics data fetching service
│
├── stores/
│   └── analyticsStore.ts                    # Analytics state management
│
├── hooks/
│   └── useAnalytics.ts                      # React Query hooks for analytics
│
├── pages/
│   └── AnalyticsPage.tsx                    # Main analytics page (already exists)
│
└── types/
    └── index.ts                             # Add analytics types (extend existing)
```

---

## Type Definitions

**Add to `/Users/shawngarland/cannabis-admin-dashboard/src/types/index.ts`:**

```typescript
// ============================================================================
// Analytics Module Types
// ============================================================================

// Date Range Presets
export type DateRangePreset =
  | 'today'
  | 'yesterday'
  | 'last_7_days'
  | 'last_30_days'
  | 'this_month'
  | 'last_month'
  | 'this_year'
  | 'custom';

export interface AnalyticsDateRange {
  preset: DateRangePreset;
  from: string; // ISO date string
  to: string;   // ISO date string
  label?: string; // Display label like "Last 30 days"
}

// Comparison Mode
export interface ComparisonPeriod {
  enabled: boolean;
  from: string;
  to: string;
  label?: string; // e.g., "vs Previous Period"
}

// Analytics Filters
export interface AnalyticsFilters {
  dateRange: AnalyticsDateRange;
  comparison?: ComparisonPeriod;
  productCategory?: ProductType[];
  cannabinoidType?: 'thc_dominant' | 'cbd_dominant' | 'balanced' | 'all';
  customerSegment?: CustomerSegment[];
}

// Metric with Comparison
export interface MetricWithChange {
  current: number;
  previous: number;
  percentChange: number;
  trend: 'up' | 'down' | 'stable';
}

// Sales Analytics
export interface SalesAnalytics {
  revenue: MetricWithChange;
  transactions: MetricWithChange;
  avgTransactionValue: MetricWithChange;

  // Revenue by category
  revenueByCategory: Array<{
    category: ProductType;
    revenue: number;
    percentage: number;
    transactions: number;
  }>;

  // Top products
  topProducts: Array<{
    productId: string;
    productName: string;
    productType: ProductType;
    revenue: number;
    unitsSold: number;
    growth: number; // % growth vs comparison period
  }>;

  // Worst performers
  worstProducts: Array<{
    productId: string;
    productName: string;
    revenue: number;
    unitsSold: number;
  }>;

  // Revenue trend (time series)
  revenueTrend: Array<{
    date: string;
    revenue: number;
    transactions: number;
    avgTicket: number;
    comparisonRevenue?: number; // For period comparison
  }>;

  // Sales by day of week
  salesByDayOfWeek: Array<{
    dayOfWeek: string; // 'Monday', 'Tuesday', etc.
    revenue: number;
    transactions: number;
    avgRevenue: number;
  }>;

  // Sales by hour
  salesByHour: Array<{
    hour: number; // 0-23
    revenue: number;
    transactions: number;
  }>;
}

// Customer Analytics
export interface CustomerAnalytics {
  totalCustomers: MetricWithChange;
  newCustomers: MetricWithChange;
  returningCustomers: MetricWithChange;

  // Customer Lifetime Value
  avgCustomerLifetimeValue: MetricWithChange;

  // Retention metrics
  retentionRate: {
    current: number; // percentage
    previous: number;
    change: number;
  };

  // Purchase frequency
  avgPurchaseFrequency: {
    current: number; // days between purchases
    previous: number;
  };

  // Customer cohorts
  cohorts: Array<{
    segment: CustomerSegment;
    count: number;
    percentage: number;
    totalRevenue: number;
    avgLifetimeValue: number;
  }>;

  // Customer growth trend
  customerGrowthTrend: Array<{
    date: string;
    newCustomers: number;
    returningCustomers: number;
    totalCustomers: number;
  }>;

  // Basket analysis
  avgBasketSize: MetricWithChange;
  avgItemsPerTransaction: MetricWithChange;
}

// Product Analytics
export interface ProductAnalytics {
  // Product performance rankings
  productRankings: Array<{
    rank: number;
    productId: string;
    productName: string;
    productType: ProductType;
    revenue: number;
    unitsSold: number;
    profitMargin: number;
    inventoryTurnover: number;
  }>;

  // Category mix
  categoryMix: Array<{
    category: ProductType;
    revenuePercentage: number;
    unitsSoldPercentage: number;
    profitMargin: number;
  }>;

  // Cannabinoid preference
  cannabinoidPreference: {
    thcDominant: {
      revenue: number;
      percentage: number;
      avgThcPct: number;
    };
    cbdDominant: {
      revenue: number;
      percentage: number;
      avgCbdPct: number;
    };
    balanced: {
      revenue: number;
      percentage: number;
    };
  };

  // Price elasticity insights
  priceElasticity: Array<{
    priceRange: string; // e.g., "$0-$20"
    revenue: number;
    unitsSold: number;
    avgPrice: number;
  }>;

  // Inventory turnover
  inventoryTurnover: {
    avgTurnoverDays: number;
    fastMovers: Array<{ productId: string; productName: string; turnoverDays: number }>;
    slowMovers: Array<{ productId: string; productName: string; turnoverDays: number }>;
  };

  // Profitability analysis
  profitability: {
    totalRevenue: number;
    totalCost: number;
    grossProfit: number;
    grossMargin: number;
    byCategory: Array<{
      category: ProductType;
      revenue: number;
      cost: number;
      margin: number;
    }>;
  };
}

// Time-based Analytics
export interface TimeAnalytics {
  // Peak hours heatmap data
  heatmapData: Array<{
    dayOfWeek: number; // 0 = Sunday, 6 = Saturday
    hour: number;      // 0-23
    revenue: number;
    transactions: number;
    intensity: number; // 0-100 for heatmap coloring
  }>;

  // Seasonal trends
  seasonalTrends: Array<{
    month: string;
    revenue: number;
    transactions: number;
    yearOverYear?: number; // % change vs same month last year
  }>;

  // Holiday/event impact
  eventImpact: Array<{
    eventName: string;
    date: string;
    revenue: number;
    revenueIncrease: number; // vs average day
  }>;
}

// Export Types
export type ExportFormat = 'csv' | 'pdf' | 'png';

export interface ExportRequest {
  format: ExportFormat;
  dataType: 'sales' | 'customers' | 'products' | 'all';
  dateRange: AnalyticsDateRange;
  includeCharts: boolean;
}
```

---

## Service Layer

**File: `/Users/shawngarland/cannabis-admin-dashboard/src/services/api/analytics.service.ts`**

```typescript
import { supabase } from '../supabase/client';
import { authService } from './auth.service';
import type {
  AnalyticsDateRange,
  ComparisonPeriod,
  AnalyticsFilters,
  SalesAnalytics,
  CustomerAnalytics,
  ProductAnalytics,
  TimeAnalytics,
} from '../../types';

/**
 * Analytics Service
 * Handles advanced analytics data fetching and aggregation
 *
 * Strategy:
 * - For heavy computations, use Supabase Edge Function `/calculate-analytics`
 * - For simple queries, query materialized views directly (mv_daily_sales_summary, etc.)
 * - Client-side aggregation only for UI transformations (chart formatting)
 */

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate comparison period dates based on current date range
 */
function getComparisonPeriod(dateRange: AnalyticsDateRange): ComparisonPeriod {
  const startDate = new Date(dateRange.from);
  const endDate = new Date(dateRange.to);

  const daysDiff = Math.floor(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const compEndDate = new Date(startDate);
  compEndDate.setDate(compEndDate.getDate() - 1);

  const compStartDate = new Date(compEndDate);
  compStartDate.setDate(compStartDate.getDate() - daysDiff);

  return {
    enabled: true,
    from: compStartDate.toISOString().split('T')[0],
    to: compEndDate.toISOString().split('T')[0],
    label: 'vs Previous Period',
  };
}

/**
 * Call Supabase Edge Function for heavy analytics calculations
 */
async function callAnalyticsFunction<T>(
  calculationType: 'dashboard_kpis' | 'product_insights' | 'customer_insights' | 'staff_insights' | 'forecasting',
  dateRange: AnalyticsDateRange,
  comparisonPeriod?: ComparisonPeriod,
  filters?: Record<string, any>
): Promise<T> {
  const dispensaryId = await authService.getUserDispensaryId();

  if (!dispensaryId) {
    throw new Error('No dispensary ID found');
  }

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('No active session');
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/calculate-analytics`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        dispensaryId,
        calculationType,
        dateRange: {
          startDate: dateRange.from,
          endDate: dateRange.to,
        },
        comparisonPeriod: comparisonPeriod?.enabled,
        filters,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Analytics calculation failed');
  }

  const result = await response.json();
  return result.data as T;
}

// ============================================================================
// Sales Analytics
// ============================================================================

/**
 * Get comprehensive sales analytics
 */
export async function getSalesAnalytics(
  dateRange: AnalyticsDateRange,
  comparison?: ComparisonPeriod
): Promise<SalesAnalytics> {
  const dispensaryId = await authService.getUserDispensaryId();

  if (!dispensaryId) {
    throw new Error('No dispensary ID found');
  }

  // Fetch from materialized view for speed
  const { data: dailySales, error } = await supabase
    .from('mv_daily_sales_summary')
    .select('*')
    .eq('dispensary_id', dispensaryId)
    .gte('sale_date', dateRange.from)
    .lte('sale_date', dateRange.to)
    .order('sale_date', { ascending: true });

  if (error) {
    throw error;
  }

  // Fetch comparison period if enabled
  let comparisonData: any[] = [];
  if (comparison?.enabled) {
    const { data: compData } = await supabase
      .from('mv_daily_sales_summary')
      .select('*')
      .eq('dispensary_id', dispensaryId)
      .gte('sale_date', comparison.from)
      .lte('sale_date', comparison.to);

    comparisonData = compData || [];
  }

  // Aggregate current period
  const currentRevenue = dailySales?.reduce((sum, day) => sum + parseFloat(day.total_revenue || 0), 0) || 0;
  const currentTransactions = dailySales?.reduce((sum, day) => sum + (day.total_transactions || 0), 0) || 0;

  // Aggregate comparison period
  const previousRevenue = comparisonData.reduce((sum, day) => sum + parseFloat(day.total_revenue || 0), 0);
  const previousTransactions = comparisonData.reduce((sum, day) => sum + (day.total_transactions || 0), 0);

  const currentAvgTicket = currentTransactions > 0 ? currentRevenue / currentTransactions : 0;
  const previousAvgTicket = previousTransactions > 0 ? previousRevenue / previousTransactions : 0;

  // Calculate percentage changes
  const revenueChange = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;
  const transactionsChange = previousTransactions > 0 ? ((currentTransactions - previousTransactions) / previousTransactions) * 100 : 0;
  const avgTicketChange = previousAvgTicket > 0 ? ((currentAvgTicket - previousAvgTicket) / previousAvgTicket) * 100 : 0;

  // Build revenue trend for charts
  const revenueTrend = dailySales?.map((day) => ({
    date: day.sale_date,
    revenue: parseFloat(day.total_revenue || 0),
    transactions: day.total_transactions || 0,
    avgTicket: day.total_transactions > 0 ? parseFloat(day.total_revenue) / day.total_transactions : 0,
  })) || [];

  // Fetch category breakdown
  const { data: categoryData } = await supabase
    .from('mv_product_performance')
    .select('product_type, total_revenue, units_sold')
    .eq('dispensary_id', dispensaryId);

  const categoryMap = new Map<string, { revenue: number; transactions: number }>();
  categoryData?.forEach((product) => {
    const existing = categoryMap.get(product.product_type) || { revenue: 0, transactions: 0 };
    categoryMap.set(product.product_type, {
      revenue: existing.revenue + parseFloat(product.total_revenue || 0),
      transactions: existing.transactions + (product.units_sold || 0),
    });
  });

  const totalCategoryRevenue = Array.from(categoryMap.values()).reduce((sum, cat) => sum + cat.revenue, 0);

  const revenueByCategory = Array.from(categoryMap.entries()).map(([category, data]) => ({
    category: category as any,
    revenue: data.revenue,
    percentage: totalCategoryRevenue > 0 ? (data.revenue / totalCategoryRevenue) * 100 : 0,
    transactions: data.transactions,
  }));

  // Fetch top products
  const { data: topProductsData } = await supabase
    .from('mv_product_performance')
    .select('product_id, product_name, product_type, total_revenue, units_sold')
    .eq('dispensary_id', dispensaryId)
    .order('total_revenue', { ascending: false })
    .limit(10);

  const topProducts = topProductsData?.map((p) => ({
    productId: p.product_id,
    productName: p.product_name,
    productType: p.product_type,
    revenue: parseFloat(p.total_revenue || 0),
    unitsSold: p.units_sold || 0,
    growth: 0, // TODO: Calculate growth vs comparison period
  })) || [];

  // Fetch worst performers
  const { data: worstProductsData } = await supabase
    .from('mv_product_performance')
    .select('product_id, product_name, total_revenue, units_sold')
    .eq('dispensary_id', dispensaryId)
    .order('total_revenue', { ascending: true })
    .limit(5);

  const worstProducts = worstProductsData?.map((p) => ({
    productId: p.product_id,
    productName: p.product_name,
    revenue: parseFloat(p.total_revenue || 0),
    unitsSold: p.units_sold || 0,
  })) || [];

  // TODO: Implement salesByDayOfWeek and salesByHour aggregations

  return {
    revenue: {
      current: currentRevenue,
      previous: previousRevenue,
      percentChange: revenueChange,
      trend: revenueChange > 5 ? 'up' : revenueChange < -5 ? 'down' : 'stable',
    },
    transactions: {
      current: currentTransactions,
      previous: previousTransactions,
      percentChange: transactionsChange,
      trend: transactionsChange > 5 ? 'up' : transactionsChange < -5 ? 'down' : 'stable',
    },
    avgTransactionValue: {
      current: currentAvgTicket,
      previous: previousAvgTicket,
      percentChange: avgTicketChange,
      trend: avgTicketChange > 5 ? 'up' : avgTicketChange < -5 ? 'down' : 'stable',
    },
    revenueByCategory,
    topProducts,
    worstProducts,
    revenueTrend,
    salesByDayOfWeek: [], // TODO: Implement
    salesByHour: [], // TODO: Implement
  };
}

// ============================================================================
// Customer Analytics
// ============================================================================

/**
 * Get customer analytics data
 */
export async function getCustomerAnalytics(
  dateRange: AnalyticsDateRange,
  comparison?: ComparisonPeriod
): Promise<CustomerAnalytics> {
  // Use Edge Function for complex customer calculations
  return await callAnalyticsFunction<CustomerAnalytics>(
    'customer_insights',
    dateRange,
    comparison
  );
}

// ============================================================================
// Product Analytics
// ============================================================================

/**
 * Get product analytics data
 */
export async function getProductAnalytics(
  dateRange: AnalyticsDateRange,
  filters?: { category?: string }
): Promise<ProductAnalytics> {
  return await callAnalyticsFunction<ProductAnalytics>(
    'product_insights',
    dateRange,
    undefined,
    filters
  );
}

// ============================================================================
// Time-based Analytics
// ============================================================================

/**
 * Get time-based analytics (heatmaps, seasonal trends)
 */
export async function getTimeAnalytics(
  dateRange: AnalyticsDateRange
): Promise<TimeAnalytics> {
  const dispensaryId = await authService.getUserDispensaryId();

  if (!dispensaryId) {
    throw new Error('No dispensary ID found');
  }

  // Fetch transaction timestamps for heatmap
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('transaction_date, total')
    .eq('dispensary_id', dispensaryId)
    .gte('transaction_date', dateRange.from)
    .lte('transaction_date', dateRange.to);

  if (error) {
    throw error;
  }

  // Build heatmap data (hour x day of week matrix)
  const heatmapMap = new Map<string, { revenue: number; transactions: number }>();

  transactions?.forEach((txn) => {
    const date = new Date(txn.transaction_date);
    const dayOfWeek = date.getDay();
    const hour = date.getHours();
    const key = `${dayOfWeek}-${hour}`;

    const existing = heatmapMap.get(key) || { revenue: 0, transactions: 0 };
    heatmapMap.set(key, {
      revenue: existing.revenue + (txn.total || 0),
      transactions: existing.transactions + 1,
    });
  });

  // Find max revenue for intensity calculation
  const maxRevenue = Math.max(...Array.from(heatmapMap.values()).map((v) => v.revenue));

  const heatmapData = Array.from(heatmapMap.entries()).map(([key, data]) => {
    const [dayOfWeek, hour] = key.split('-').map(Number);
    return {
      dayOfWeek,
      hour,
      revenue: data.revenue,
      transactions: data.transactions,
      intensity: maxRevenue > 0 ? (data.revenue / maxRevenue) * 100 : 0,
    };
  });

  return {
    heatmapData,
    seasonalTrends: [], // TODO: Implement monthly aggregation
    eventImpact: [], // TODO: Implement
  };
}

// ============================================================================
// Export Service Object
// ============================================================================

export const analyticsService = {
  getSalesAnalytics,
  getCustomerAnalytics,
  getProductAnalytics,
  getTimeAnalytics,
  getComparisonPeriod,
};

export default analyticsService;
```

---

## Zustand Store

**File: `/Users/shawngarland/cannabis-admin-dashboard/src/stores/analyticsStore.ts`**

```typescript
import { create } from 'zustand';
import type {
  AnalyticsDateRange,
  ComparisonPeriod,
  AnalyticsFilters,
  DateRangePreset,
} from '../types';

/**
 * Analytics Store
 * Manages analytics module state including date ranges, filters, and comparison mode
 */

interface AnalyticsState {
  // State
  dateRange: AnalyticsDateRange;
  comparison: ComparisonPeriod | null;
  filters: Partial<AnalyticsFilters>;
  isRefreshing: boolean;
  lastRefresh: Date | null;

  // Actions
  setDateRange: (dateRange: AnalyticsDateRange) => void;
  setDateRangePreset: (preset: DateRangePreset) => void;
  setComparison: (comparison: ComparisonPeriod | null) => void;
  toggleComparison: () => void;
  setFilters: (filters: Partial<AnalyticsFilters>) => void;
  resetFilters: () => void;
  setRefreshing: (isRefreshing: boolean) => void;
  markRefreshed: () => void;
  reset: () => void;
}

/**
 * Get date range for a given preset
 */
function getDateRangeForPreset(preset: DateRangePreset): AnalyticsDateRange {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  let from: string;
  let to: string;
  let label: string;

  switch (preset) {
    case 'today':
      from = todayStr;
      to = todayStr;
      label = 'Today';
      break;

    case 'yesterday':
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      from = yesterday.toISOString().split('T')[0];
      to = from;
      label = 'Yesterday';
      break;

    case 'last_7_days':
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      from = sevenDaysAgo.toISOString().split('T')[0];
      to = todayStr;
      label = 'Last 7 days';
      break;

    case 'last_30_days':
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      from = thirtyDaysAgo.toISOString().split('T')[0];
      to = todayStr;
      label = 'Last 30 days';
      break;

    case 'this_month':
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      from = monthStart.toISOString().split('T')[0];
      to = todayStr;
      label = 'This month';
      break;

    case 'last_month':
      const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
      from = lastMonthStart.toISOString().split('T')[0];
      to = lastMonthEnd.toISOString().split('T')[0];
      label = 'Last month';
      break;

    case 'this_year':
      const yearStart = new Date(today.getFullYear(), 0, 1);
      from = yearStart.toISOString().split('T')[0];
      to = todayStr;
      label = 'This year';
      break;

    case 'custom':
    default:
      // For custom, return last 30 days as default
      const defaultStart = new Date(today);
      defaultStart.setDate(defaultStart.getDate() - 30);
      from = defaultStart.toISOString().split('T')[0];
      to = todayStr;
      label = 'Custom range';
      break;
  }

  return { preset, from, to, label };
}

/**
 * Default date range: Last 30 days
 */
const getDefaultDateRange = (): AnalyticsDateRange => {
  return getDateRangeForPreset('last_30_days');
};

export const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
  // Initial State
  dateRange: getDefaultDateRange(),
  comparison: null,
  filters: {},
  isRefreshing: false,
  lastRefresh: null,

  // Set Date Range (custom)
  setDateRange: (dateRange: AnalyticsDateRange) => {
    set({ dateRange });
  },

  // Set Date Range by Preset
  setDateRangePreset: (preset: DateRangePreset) => {
    const dateRange = getDateRangeForPreset(preset);
    set({ dateRange });
  },

  // Set Comparison Period
  setComparison: (comparison: ComparisonPeriod | null) => {
    set({ comparison });
  },

  // Toggle Comparison Mode
  toggleComparison: () => {
    const currentComparison = get().comparison;

    if (currentComparison?.enabled) {
      // Disable comparison
      set({ comparison: null });
    } else {
      // Enable comparison with previous period
      const { dateRange } = get();
      const startDate = new Date(dateRange.from);
      const endDate = new Date(dateRange.to);

      const daysDiff = Math.floor(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      const compEndDate = new Date(startDate);
      compEndDate.setDate(compEndDate.getDate() - 1);

      const compStartDate = new Date(compEndDate);
      compStartDate.setDate(compStartDate.getDate() - daysDiff);

      set({
        comparison: {
          enabled: true,
          from: compStartDate.toISOString().split('T')[0],
          to: compEndDate.toISOString().split('T')[0],
          label: 'vs Previous Period',
        },
      });
    }
  },

  // Set Filters
  setFilters: (filters: Partial<AnalyticsFilters>) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
    }));
  },

  // Reset Filters
  resetFilters: () => {
    set({ filters: {} });
  },

  // Set Refreshing State
  setRefreshing: (isRefreshing: boolean) => {
    set({ isRefreshing });
  },

  // Mark as Refreshed
  markRefreshed: () => {
    set({ lastRefresh: new Date(), isRefreshing: false });
  },

  // Reset to Initial State
  reset: () => {
    set({
      dateRange: getDefaultDateRange(),
      comparison: null,
      filters: {},
      isRefreshing: false,
      lastRefresh: null,
    });
  },
}));

// Selector hooks for convenience
export const useAnalyticsDateRange = () => useAnalyticsStore((state) => state.dateRange);
export const useAnalyticsComparison = () => useAnalyticsStore((state) => state.comparison);
export const useAnalyticsFilters = () => useAnalyticsStore((state) => state.filters);
export const useAnalyticsRefreshing = () => useAnalyticsStore((state) => state.isRefreshing);
```

---

## React Query Hooks

**File: `/Users/shawngarland/cannabis-admin-dashboard/src/hooks/useAnalytics.ts`**

```typescript
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { analyticsService } from '../services/api/analytics.service';
import { useAnalyticsStore } from '../stores/analyticsStore';
import { useEffect } from 'react';
import type {
  SalesAnalytics,
  CustomerAnalytics,
  ProductAnalytics,
  TimeAnalytics,
} from '../types';

/**
 * Analytics Query Keys
 */
export const analyticsQueryKeys = {
  all: ['analytics'] as const,
  sales: (from: string, to: string, comparisonEnabled: boolean) =>
    [...analyticsQueryKeys.all, 'sales', from, to, comparisonEnabled] as const,
  customers: (from: string, to: string, comparisonEnabled: boolean) =>
    [...analyticsQueryKeys.all, 'customers', from, to, comparisonEnabled] as const,
  products: (from: string, to: string, filters?: any) =>
    [...analyticsQueryKeys.all, 'products', from, to, filters] as const,
  time: (from: string, to: string) =>
    [...analyticsQueryKeys.all, 'time', from, to] as const,
};

/**
 * Hook to fetch sales analytics
 */
export function useSalesAnalytics(): UseQueryResult<SalesAnalytics> {
  const dateRange = useAnalyticsStore((state) => state.dateRange);
  const comparison = useAnalyticsStore((state) => state.comparison);
  const setRefreshing = useAnalyticsStore((state) => state.setRefreshing);

  const query = useQuery({
    queryKey: analyticsQueryKeys.sales(
      dateRange.from,
      dateRange.to,
      comparison?.enabled || false
    ),
    queryFn: () => analyticsService.getSalesAnalytics(dateRange, comparison || undefined),
    staleTime: 5 * 60_000, // 5 minutes
    gcTime: 10 * 60_000,   // 10 minutes (formerly cacheTime)
  });

  // Sync refreshing state with store
  useEffect(() => {
    setRefreshing(query.isFetching);
  }, [query.isFetching, setRefreshing]);

  return query;
}

/**
 * Hook to fetch customer analytics
 */
export function useCustomerAnalytics(): UseQueryResult<CustomerAnalytics> {
  const dateRange = useAnalyticsStore((state) => state.dateRange);
  const comparison = useAnalyticsStore((state) => state.comparison);

  return useQuery({
    queryKey: analyticsQueryKeys.customers(
      dateRange.from,
      dateRange.to,
      comparison?.enabled || false
    ),
    queryFn: () => analyticsService.getCustomerAnalytics(dateRange, comparison || undefined),
    staleTime: 10 * 60_000, // 10 minutes (customer data changes slower)
  });
}

/**
 * Hook to fetch product analytics
 */
export function useProductAnalytics(): UseQueryResult<ProductAnalytics> {
  const dateRange = useAnalyticsStore((state) => state.dateRange);
  const filters = useAnalyticsStore((state) => state.filters);

  return useQuery({
    queryKey: analyticsQueryKeys.products(
      dateRange.from,
      dateRange.to,
      filters
    ),
    queryFn: () => analyticsService.getProductAnalytics(dateRange, filters),
    staleTime: 10 * 60_000, // 10 minutes
  });
}

/**
 * Hook to fetch time-based analytics
 */
export function useTimeAnalytics(): UseQueryResult<TimeAnalytics> {
  const dateRange = useAnalyticsStore((state) => state.dateRange);

  return useQuery({
    queryKey: analyticsQueryKeys.time(dateRange.from, dateRange.to),
    queryFn: () => analyticsService.getTimeAnalytics(dateRange),
    staleTime: 15 * 60_000, // 15 minutes (time patterns change slowly)
  });
}
```

---

## Component Architecture

### 1. Date Range Picker Component

**File: `/Users/shawngarland/cannabis-admin-dashboard/src/modules/analytics/components/DateRangePicker.tsx`**

```typescript
import { Box, Button, Menu, MenuButton, MenuList, MenuItem, HStack, Text } from '@chakra-ui/react';
import { CalendarIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useAnalyticsStore } from '../../../stores/analyticsStore';
import type { DateRangePreset } from '../../../types';

const presets: Array<{ value: DateRangePreset; label: string }> = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last_7_days', label: 'Last 7 days' },
  { value: 'last_30_days', label: 'Last 30 days' },
  { value: 'this_month', label: 'This month' },
  { value: 'last_month', label: 'Last month' },
  { value: 'this_year', label: 'This year' },
  { value: 'custom', label: 'Custom range...' },
];

export function DateRangePicker() {
  const dateRange = useAnalyticsStore((state) => state.dateRange);
  const setDateRangePreset = useAnalyticsStore((state) => state.setDateRangePreset);

  return (
    <Menu>
      <MenuButton
        as={Button}
        leftIcon={<CalendarIcon className="w-5 h-5" />}
        rightIcon={<ChevronDownIcon className="w-4 h-4" />}
        variant="outline"
        colorScheme="slate"
      >
        {dateRange.label || 'Select date range'}
      </MenuButton>
      <MenuList>
        {presets.map((preset) => (
          <MenuItem
            key={preset.value}
            onClick={() => setDateRangePreset(preset.value)}
            bg={dateRange.preset === preset.value ? 'slate.700' : undefined}
          >
            {preset.label}
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
}
```

### 2. Metric Card Component

**File: `/Users/shawngarland/cannabis-admin-dashboard/src/modules/analytics/components/MetricCard.tsx`**

```typescript
import { Box, Text, HStack, VStack, Skeleton } from '@chakra-ui/react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';
import type { MetricWithChange } from '../../../types';

interface MetricCardProps {
  label: string;
  value: number;
  format: 'currency' | 'number' | 'percentage';
  metric?: MetricWithChange;
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export function MetricCard({
  label,
  value,
  format,
  metric,
  isLoading = false,
  icon,
}: MetricCardProps) {
  const formatValue = (val: number) => {
    if (format === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(val);
    } else if (format === 'percentage') {
      return `${val.toFixed(1)}%`;
    } else {
      return new Intl.NumberFormat('en-US').format(val);
    }
  };

  if (isLoading) {
    return (
      <Box bg="slate.800" p={6} borderRadius="lg" border="1px solid" borderColor="slate.700">
        <Skeleton height="20px" mb={2} />
        <Skeleton height="32px" mb={2} />
        <Skeleton height="16px" width="60%" />
      </Box>
    );
  }

  const percentChange = metric?.percentChange || 0;
  const isPositive = percentChange > 0;
  const isNegative = percentChange < 0;

  return (
    <Box
      bg="slate.800"
      p={6}
      borderRadius="lg"
      border="1px solid"
      borderColor="slate.700"
      _hover={{ borderColor: 'slate.600' }}
      transition="border-color 0.2s"
    >
      <HStack justify="space-between" mb={2}>
        <Text fontSize="sm" color="slate.400" fontWeight="medium">
          {label}
        </Text>
        {icon && <Box color="slate.500">{icon}</Box>}
      </HStack>

      <Text fontSize="3xl" fontWeight="bold" color="white" mb={1}>
        {formatValue(value)}
      </Text>

      {metric && (
        <HStack spacing={1}>
          {isPositive && <ArrowUpIcon className="w-4 h-4 text-green-500" />}
          {isNegative && <ArrowDownIcon className="w-4 h-4 text-red-500" />}
          <Text
            fontSize="sm"
            fontWeight="medium"
            color={isPositive ? 'green.500' : isNegative ? 'red.500' : 'slate.400'}
          >
            {Math.abs(percentChange).toFixed(1)}%
          </Text>
          <Text fontSize="sm" color="slate.500">
            vs previous
          </Text>
        </HStack>
      )}
    </Box>
  );
}
```

### 3. Revenue Line Chart Component

**File: `/Users/shawngarland/cannabis-admin-dashboard/src/modules/analytics/components/charts/RevenueLineChart.tsx`**

```typescript
import { Box, Text, Skeleton } from '@chakra-ui/react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface RevenueLineChartProps {
  data: Array<{
    date: string;
    revenue: number;
    comparisonRevenue?: number;
  }>;
  isLoading?: boolean;
  showComparison?: boolean;
}

export function RevenueLineChart({
  data,
  isLoading = false,
  showComparison = false,
}: RevenueLineChartProps) {
  if (isLoading) {
    return (
      <Box bg="slate.800" p={6} borderRadius="lg" border="1px solid" borderColor="slate.700">
        <Skeleton height="300px" />
      </Box>
    );
  }

  return (
    <Box bg="slate.800" p={6} borderRadius="lg" border="1px solid" borderColor="slate.700">
      <Text fontSize="lg" fontWeight="semibold" color="white" mb={4}>
        Revenue Trend
      </Text>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="date"
            stroke="#94a3b8"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
          />
          <YAxis
            stroke="#94a3b8"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            tickFormatter={(value) =>
              new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
              }).format(value)
            }
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
            }}
            labelStyle={{ color: '#cbd5e1' }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: '#10b981', r: 4 }}
            activeDot={{ r: 6 }}
            name="Current Period"
          />
          {showComparison && (
            <Line
              type="monotone"
              dataKey="comparisonRevenue"
              stroke="#64748b"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Previous Period"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}
```

### 4. Sales Analytics Section Component

**File: `/Users/shawngarland/cannabis-admin-dashboard/src/modules/analytics/components/sections/SalesAnalyticsSection.tsx`**

```typescript
import { Box, Heading, SimpleGrid, VStack } from '@chakra-ui/react';
import { BanknotesIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import { useSalesAnalytics } from '../../../../hooks/useAnalytics';
import { MetricCard } from '../MetricCard';
import { RevenueLineChart } from '../charts/RevenueLineChart';
import { useAnalyticsComparison } from '../../../../stores/analyticsStore';

export function SalesAnalyticsSection() {
  const { data: salesData, isLoading } = useSalesAnalytics();
  const comparison = useAnalyticsComparison();

  return (
    <VStack spacing={6} align="stretch">
      <Heading size="md" color="white">
        Sales Analytics
      </Heading>

      {/* Key Metrics */}
      <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
        <MetricCard
          label="Total Revenue"
          value={salesData?.revenue.current || 0}
          format="currency"
          metric={salesData?.revenue}
          isLoading={isLoading}
          icon={<BanknotesIcon className="w-6 h-6" />}
        />

        <MetricCard
          label="Transactions"
          value={salesData?.transactions.current || 0}
          format="number"
          metric={salesData?.transactions}
          isLoading={isLoading}
          icon={<ShoppingCartIcon className="w-6 h-6" />}
        />

        <MetricCard
          label="Avg Transaction Value"
          value={salesData?.avgTransactionValue.current || 0}
          format="currency"
          metric={salesData?.avgTransactionValue}
          isLoading={isLoading}
        />
      </SimpleGrid>

      {/* Revenue Trend Chart */}
      <RevenueLineChart
        data={salesData?.revenueTrend || []}
        isLoading={isLoading}
        showComparison={comparison?.enabled || false}
      />
    </VStack>
  );
}
```

---

## Data Aggregation Strategies

### Database Layer (Recommended Materialized Views)

Create these materialized views in Supabase for optimal performance:

```sql
-- Daily sales summary (already exists based on edge function)
CREATE MATERIALIZED VIEW mv_daily_sales_summary AS
SELECT
  dispensary_id,
  DATE(transaction_date) AS sale_date,
  SUM(total) AS total_revenue,
  COUNT(*) AS total_transactions,
  COUNT(DISTINCT customer_hash) AS unique_customers,
  AVG(total) AS avg_transaction_value
FROM transactions
GROUP BY dispensary_id, DATE(transaction_date);

-- Refresh strategy: Refresh every hour via cron job
CREATE INDEX idx_mv_daily_sales_dispensary_date ON mv_daily_sales_summary(dispensary_id, sale_date);

-- Product performance (already referenced in edge function)
CREATE MATERIALIZED VIEW mv_product_performance AS
SELECT
  p.dispensary_id,
  p.id AS product_id,
  p.name AS product_name,
  p.product_type,
  SUM(ti.quantity) AS units_sold,
  SUM(ti.quantity * ti.price) AS total_revenue,
  SUM(ti.quantity * p.cost) AS total_cost,
  COUNT(DISTINCT t.id) AS times_sold,
  MAX(t.transaction_date) AS last_sale_date
FROM products p
LEFT JOIN LATERAL (
  SELECT t.id, t.transaction_date, item.*
  FROM transactions t,
  jsonb_to_recordset(t.products) AS item(product_id text, quantity int, price numeric)
  WHERE item.product_id = p.id
) AS ti ON true
LEFT JOIN transactions t ON ti.id = t.id
GROUP BY p.dispensary_id, p.id, p.name, p.product_type;

CREATE INDEX idx_mv_product_perf_dispensary ON mv_product_performance(dispensary_id);

-- Hour-of-day / Day-of-week analysis
CREATE MATERIALIZED VIEW mv_sales_by_time AS
SELECT
  dispensary_id,
  EXTRACT(DOW FROM transaction_date) AS day_of_week,
  EXTRACT(HOUR FROM transaction_date) AS hour_of_day,
  SUM(total) AS total_revenue,
  COUNT(*) AS transaction_count,
  AVG(total) AS avg_transaction_value
FROM transactions
GROUP BY dispensary_id, EXTRACT(DOW FROM transaction_date), EXTRACT(HOUR FROM transaction_date);

CREATE INDEX idx_mv_sales_time_dispensary ON mv_sales_by_time(dispensary_id);
```

**Materialized View Refresh Strategy:**
- Use Supabase cron jobs to refresh views every hour
- For real-time requirements, query the base `transactions` table directly
- For analytics dashboards, materialized views provide 100x faster queries

---

## Performance Optimization

### 1. React Query Caching Strategy

```typescript
// analytics cache config
{
  staleTime: 5 * 60_000,     // 5 min - data is fresh for 5 minutes
  gcTime: 10 * 60_000,       // 10 min - keep in cache for 10 minutes
  refetchOnWindowFocus: false, // Don't refetch on tab switch (analytics doesn't change that often)
  refetchOnMount: false,       // Use cached data if available
}
```

### 2. Code Splitting

```typescript
// Lazy load Analytics page
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
```

### 3. Chart Performance

- Use `ResponsiveContainer` from Recharts for responsive sizing
- Limit data points for line charts (aggregate daily for long ranges)
- Use memoization for expensive chart data transformations:

```typescript
const chartData = useMemo(() => {
  return salesData?.revenueTrend.map((item) => ({
    ...item,
    formattedDate: formatDate(item.date),
  }));
}, [salesData]);
```

### 4. Virtualization for Long Lists

For product rankings or customer lists with 100+ items:

```typescript
import { FixedSizeList } from 'react-window';
```

### 5. Debounced Filters

```typescript
const debouncedSetFilters = useDebouncedCallback(
  (filters) => setFilters(filters),
  500
);
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
**Goal:** Set up core infrastructure and basic sales analytics

**Tasks:**
1. Add analytics types to `/src/types/index.ts`
2. Create `analyticsStore.ts` with date range and comparison state
3. Create `analytics.service.ts` with `getSalesAnalytics()` function
4. Create `useAnalytics.ts` hooks with `useSalesAnalytics()`
5. Build core components:
   - `DateRangePicker.tsx`
   - `ComparisonToggle.tsx`
   - `MetricCard.tsx`
   - `RevenueLineChart.tsx`
6. Update `AnalyticsPage.tsx` with `SalesAnalyticsSection`

**Deliverable:** Working sales analytics with date range filtering and basic revenue charts

### Phase 2: Sales Deep Dive (Week 2)
**Goal:** Complete all sales analytics features

**Tasks:**
1. Implement `SalesByCategoryChart.tsx` (pie/donut chart)
2. Implement `ProductRankingChart.tsx` (horizontal bar chart)
3. Add `salesByDayOfWeek` aggregation to service
4. Add `salesByHour` aggregation to service
5. Build `HeatmapChart.tsx` for time-of-day patterns
6. Complete `SalesAnalyticsSection` with all charts

**Deliverable:** Full sales analytics dashboard with category breakdown, product rankings, and time patterns

### Phase 3: Customer Analytics (Week 3)
**Goal:** Implement customer insights and cohort analysis

**Tasks:**
1. Extend Edge Function to return customer analytics
2. Implement `getCustomerAnalytics()` in service
3. Create `useCustomerAnalytics()` hook
4. Build customer-specific charts:
   - `CustomerGrowthChart.tsx`
   - Customer cohort visualization
5. Create `CustomerAnalyticsSection.tsx`
6. Add customer metrics cards (CLV, retention, etc.)

**Deliverable:** Customer analytics section with growth trends and cohort analysis

### Phase 4: Product Analytics (Week 4)
**Goal:** Implement product performance and profitability analysis

**Tasks:**
1. Implement `getProductAnalytics()` in service
2. Create `useProductAnalytics()` hook
3. Build product analytics charts:
   - `CannabinoidMixChart.tsx` (THC vs CBD)
   - Price elasticity chart
   - Inventory turnover visualization
4. Create `ProductAnalyticsSection.tsx`
5. Add product profitability metrics

**Deliverable:** Product analytics with cannabinoid preferences, profitability, and turnover insights

### Phase 5: Time Analytics & Export (Week 5)
**Goal:** Complete time-based analytics and export functionality

**Tasks:**
1. Implement `getTimeAnalytics()` in service
2. Create `useTimeAnalytics()` hook
3. Build `TimeAnalyticsSection.tsx` with heatmaps
4. Implement export helpers:
   - CSV export (use `papaparse` library)
   - PDF export (use `jsPDF` library)
   - PNG chart export (use Recharts `downloadChart`)
5. Create `ExportMenu.tsx` component
6. Add seasonal trends and event impact analysis

**Deliverable:** Complete analytics module with export functionality

### Phase 6: Polish & Optimization (Week 6)
**Goal:** Mobile optimization, error handling, and performance tuning

**Tasks:**
1. Mobile-responsive layout testing and fixes
2. Add loading skeletons for all components
3. Implement error boundaries and error states
4. Add empty states for no-data scenarios
5. Performance optimization (memoization, code splitting)
6. Accessibility audit (ARIA labels, keyboard navigation)
7. User testing and feedback iteration

**Deliverable:** Production-ready analytics module

---

## Integration Points with Existing Modules

### 1. Dashboard Module
- Analytics page is accessible from Dashboard via navigation
- Share `DateRange` type and utilities
- Reuse `StatCard` component pattern (extended as `MetricCard`)

### 2. Inventory Module
- Product analytics links to inventory details
- Shared product types and filters
- Inventory turnover metrics inform reorder decisions

### 3. Service Layer Pattern
- Follow same pattern as `dashboard.service.ts`
- Use `authService.getUserDispensaryId()` for tenant isolation
- Leverage Supabase Edge Functions for heavy calculations

### 4. Navigation
Update sidebar to include Analytics link:

```typescript
// In Sidebar.tsx
{
  name: 'Analytics',
  href: '/analytics',
  icon: ChartBarIcon,
  roles: ['manager', 'owner', 'admin'],
}
```

---

## Database Considerations

### Required Tables (Already Exist)
- `transactions` - Sales data
- `products` - Product catalog
- `customers` - Customer records
- `users` - Staff data
- `compliance_flags` - Compliance tracking

### Recommended Indexes
```sql
-- Transaction date queries
CREATE INDEX idx_transactions_date ON transactions(dispensary_id, transaction_date DESC);

-- Customer hash lookups
CREATE INDEX idx_customers_hash ON customers(dispensary_id, customer_hash);

-- Product type filtering
CREATE INDEX idx_products_type ON products(dispensary_id, product_type);
```

### Materialized Views Refresh
Set up Supabase cron job:

```sql
-- Refresh materialized views every hour
SELECT cron.schedule(
  'refresh-analytics-views',
  '0 * * * *', -- Every hour at minute 0
  $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_sales_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_product_performance;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_sales_by_time;
  $$
);
```

---

## Mobile Responsiveness Strategy

### Breakpoints (Chakra UI defaults)
- `base`: 0px - 479px (mobile)
- `md`: 768px - 991px (tablet)
- `lg`: 992px+ (desktop)

### Component Adaptations

**Metric Cards:**
```typescript
<SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={6}>
```

**Charts:**
- Stack vertically on mobile
- Reduce chart height on small screens
- Hide less important chart elements (legend, grid lines)

**Date Picker:**
- Full-width on mobile
- Use Chakra's drawer component for custom date selection

**Export Menu:**
- Bottom sheet on mobile instead of dropdown

---

## Summary

This architecture provides a comprehensive Analytics module that:

1. **Integrates Seamlessly** - Follows your existing patterns (Service → React Query → Zustand → Components)
2. **Performs Optimally** - Leverages materialized views, proper caching, and Edge Functions
3. **Scales Gracefully** - Handles large datasets with pagination and virtualization
4. **Delivers Value** - Provides actionable insights across sales, customers, products, and time patterns
5. **Maintains Quality** - Mobile-responsive, accessible, and production-ready

**Next Steps:**
1. Review this architecture and provide feedback
2. Prioritize features based on business needs
3. Begin Phase 1 implementation
4. Iterate based on user feedback

**Estimated Total Implementation Time:** 6 weeks (1 developer)

**Files Created:** ~30 new files
**Lines of Code:** ~3,500 LOC

---

**Key Files Summary:**

```
/src/types/index.ts                                    (Add ~200 lines)
/src/services/api/analytics.service.ts                 (~500 lines)
/src/stores/analyticsStore.ts                          (~150 lines)
/src/hooks/useAnalytics.ts                             (~100 lines)
/src/modules/analytics/components/*.tsx                (~1,500 lines across 15 components)
/src/modules/analytics/utils/*.ts                      (~200 lines)
/src/pages/AnalyticsPage.tsx                           (Update ~100 lines)
```

This architecture is ready for implementation. Would you like me to start building any specific component or phase?
