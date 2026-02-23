import { useDateRange } from '../stores/analyticsStore';
import type { DateRange } from '../modules/analytics/types/index';

/**
 * Analytics Hooks (Stub Implementation)
 * Returns placeholder data until Convex analytics functions are implemented
 */

// Query keys for compatibility
export const analyticsKeys = {
  all: ['analytics'] as const,
  summary: (range: DateRange) => [...analyticsKeys.all, 'summary', range] as const,
  revenue: (range: DateRange) => [...analyticsKeys.all, 'revenue', range] as const,
  categories: (range: DateRange) => [...analyticsKeys.all, 'categories', range] as const,
  topProducts: (range: DateRange, limit: number) =>
    [...analyticsKeys.all, 'topProducts', range, limit] as const,
  topStrains: (limit: number) => [...analyticsKeys.all, 'topStrains', limit] as const,
  customers: (range: DateRange) => [...analyticsKeys.all, 'customers', range] as const,
  dayPattern: (range: DateRange) => [...analyticsKeys.all, 'dayPattern', range] as const,
};

/**
 * Hook to fetch analytics summary
 * Returns nested structure expected by AnalyticsPage
 */
export function useAnalyticsSummary() {
  useDateRange();

  return {
    data: {
      // Nested structure for AnalyticsPage MetricCards
      revenue: {
        total: 45680,
        change_pct: 12.5,
      },
      transactions: {
        total: 312,
        change_pct: 8.3,
        avg_value: 146.41,
        avg_value_change_pct: 3.7,
      },
      customers: {
        total: 892,
        new: 28,
        returning: 264,
      },
      // Legacy flat fields for backward compatibility
      totalRevenue: 45680,
      totalTransactions: 312,
      avgTransactionValue: 146.41,
      newCustomers: 28,
      repeatCustomerRate: 68,
      topCategory: 'flower',
      revenueGrowth: 12.5,
    },
    isLoading: false,
    error: null,
    isError: false,
  };
}

/**
 * Hook to fetch revenue trend
 */
export function useRevenueTrend() {
  useDateRange();

  return {
    data: [
      { date: '2024-01-01', revenue: 5200, transactions: 35 },
      { date: '2024-01-02', revenue: 6100, transactions: 42 },
      { date: '2024-01-03', revenue: 4800, transactions: 33 },
      { date: '2024-01-04', revenue: 7200, transactions: 48 },
      { date: '2024-01-05', revenue: 6500, transactions: 44 },
      { date: '2024-01-06', revenue: 8100, transactions: 56 },
      { date: '2024-01-07', revenue: 7780, transactions: 54 },
    ],
    isLoading: false,
    error: null,
    isError: false,
  };
}

/**
 * Hook to fetch category breakdown
 */
export function useCategoryBreakdown() {
  useDateRange();

  return {
    data: [
      { category: 'flower', revenue: 18500, percentage: 40.5, units: 185 },
      { category: 'concentrate', revenue: 9200, percentage: 20.1, units: 46 },
      { category: 'edible', revenue: 7300, percentage: 16.0, units: 146 },
      { category: 'vape', revenue: 5800, percentage: 12.7, units: 58 },
      { category: 'pre_roll', revenue: 3200, percentage: 7.0, units: 80 },
      { category: 'topical', revenue: 1680, percentage: 3.7, units: 28 },
    ],
    isLoading: false,
    error: null,
    isError: false,
  };
}

/**
 * Hook to fetch top products
 */
export function useTopProducts(_limit: number = 10) {
  useDateRange();

  return {
    data: [
      { productId: 'p1', name: 'Blue Dream', revenue: 4200, units: 42, category: 'flower' },
      { productId: 'p2', name: 'OG Kush', revenue: 3800, units: 38, category: 'flower' },
      { productId: 'p3', name: 'Live Resin Cart', revenue: 2900, units: 29, category: 'vape' },
      { productId: 'p4', name: 'Gummy Bears 10pk', revenue: 2400, units: 48, category: 'edible' },
      { productId: 'p5', name: 'Shatter - Hybrid', revenue: 2200, units: 11, category: 'concentrate' },
    ],
    isLoading: false,
    error: null,
    isError: false,
  };
}

/**
 * Hook to fetch top strains
 */
export function useTopStrains(_limit: number = 75) {
  return {
    data: [
      { name: 'Blue Dream', type: 'Hybrid', sales: 4200 },
      { name: 'OG Kush', type: 'Indica', sales: 3800 },
      { name: 'Sour Diesel', type: 'Sativa', sales: 3200 },
      { name: 'Girl Scout Cookies', type: 'Hybrid', sales: 2900 },
      { name: 'Granddaddy Purple', type: 'Indica', sales: 2600 },
    ],
    isLoading: false,
    error: null,
    isError: false,
  };
}

/**
 * Hook to fetch customer metrics
 */
export function useCustomerMetrics() {
  useDateRange();

  return {
    data: {
      totalCustomers: 892,
      newCustomers: 28,
      repeatCustomers: 264,
      avgLifetimeValue: 485,
      avgVisitsPerMonth: 2.3,
      customerRetentionRate: 78,
    },
    isLoading: false,
    error: null,
    isError: false,
  };
}

/**
 * Hook to fetch day of week pattern
 */
export function useDayOfWeekPattern() {
  useDateRange();

  return {
    data: [
      { day: 'Monday', revenue: 5200, transactions: 35 },
      { day: 'Tuesday', revenue: 4800, transactions: 32 },
      { day: 'Wednesday', revenue: 5500, transactions: 37 },
      { day: 'Thursday', revenue: 6100, transactions: 41 },
      { day: 'Friday', revenue: 8200, transactions: 55 },
      { day: 'Saturday', revenue: 9500, transactions: 63 },
      { day: 'Sunday', revenue: 6380, transactions: 49 },
    ],
    isLoading: false,
    error: null,
    isError: false,
  };
}
