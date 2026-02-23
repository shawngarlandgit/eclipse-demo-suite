import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../services/api/analytics.service';
import { useDateRange } from '../stores/analyticsStore';
import type { DateRange } from '../modules/analytics/types/index';

/**
 * Analytics React Query Hooks
 * Custom hooks for fetching analytics data with caching
 */

// Query keys
export const analyticsKeys = {
  all: ['analytics'] as const,
  summary: (range: DateRange) => [...analyticsKeys.all, 'summary', range] as const,
  revenue: (range: DateRange) => [...analyticsKeys.all, 'revenue', range] as const,
  categories: (range: DateRange) => [...analyticsKeys.all, 'categories', range] as const,
  topProducts: (range: DateRange, limit: number) =>
    [...analyticsKeys.all, 'topProducts', range, limit] as const,
  customers: (range: DateRange) => [...analyticsKeys.all, 'customers', range] as const,
  dayPattern: (range: DateRange) => [...analyticsKeys.all, 'dayPattern', range] as const,
};

/**
 * Hook to fetch analytics summary
 */
export function useAnalyticsSummary() {
  const dateRange = useDateRange();

  return useQuery({
    queryKey: analyticsKeys.summary(dateRange),
    queryFn: () => analyticsService.getAnalyticsSummary(dateRange),
    staleTime: 5 * 60_000, // 5 minutes
  });
}

/**
 * Hook to fetch revenue trend
 */
export function useRevenueTrend() {
  const dateRange = useDateRange();

  return useQuery({
    queryKey: analyticsKeys.revenue(dateRange),
    queryFn: () => analyticsService.getRevenueTrend(dateRange),
    staleTime: 5 * 60_000,
  });
}

/**
 * Hook to fetch category breakdown
 */
export function useCategoryBreakdown() {
  const dateRange = useDateRange();

  return useQuery({
    queryKey: analyticsKeys.categories(dateRange),
    queryFn: () => analyticsService.getCategoryBreakdown(dateRange),
    staleTime: 5 * 60_000,
  });
}

/**
 * Hook to fetch top products
 */
export function useTopProducts(limit: number = 10) {
  const dateRange = useDateRange();

  return useQuery({
    queryKey: analyticsKeys.topProducts(dateRange, limit),
    queryFn: () => analyticsService.getTopProducts(dateRange, limit),
    staleTime: 5 * 60_000,
  });
}

/**
 * Hook to fetch customer metrics
 */
export function useCustomerMetrics() {
  const dateRange = useDateRange();

  return useQuery({
    queryKey: analyticsKeys.customers(dateRange),
    queryFn: () => analyticsService.getCustomerMetrics(dateRange),
    staleTime: 5 * 60_000,
  });
}

/**
 * Hook to fetch day of week pattern
 */
export function useDayOfWeekPattern() {
  const dateRange = useDateRange();

  return useQuery({
    queryKey: analyticsKeys.dayPattern(dateRange),
    queryFn: () => analyticsService.getDayOfWeekPattern(dateRange),
    staleTime: 5 * 60_000,
  });
}
