import { useQuery } from '@tanstack/react-query';
// import { dashboardService } from '../services/api/dashboard.service';
import { mockDashboardService as dashboardService } from '../services/api/dashboard-mock.service';
import { queryKeys } from '../config/queryClient';
import { useDashboardStore } from '../stores/dashboardStore';
import { useDateRange } from '../stores/analyticsStore';
import { useEffect } from 'react';

/**
 * Hook to fetch and manage dashboard KPIs
 * Uses date range from analytics store
 */
export function useDashboardKPIs() {
  const dateRange = useDateRange();
  const setKPIs = useDashboardStore((state) => state.setKPIs);
  const setRefreshing = useDashboardStore((state) => state.setRefreshing);

  const query = useQuery({
    queryKey: queryKeys.dashboard.kpis({ from: dateRange.startDate, to: dateRange.endDate }),
    queryFn: () => dashboardService.getDashboardSummary(dateRange),
    staleTime: 60_000, // 1 minute
    refetchInterval: 60_000, // Auto-refetch every minute
    placeholderData: (previousData) => previousData, // Keep old data visible during refetch
  });

  // Update store when data changes
  useEffect(() => {
    if (query.data) {
      setKPIs(query.data);
    }
    setRefreshing(query.isFetching);
  }, [query.data, query.isFetching, setKPIs, setRefreshing]);

  return query;
}

/**
 * Hook to fetch sales trend data
 * Uses the date range from analytics store
 */
export function useSalesTrend(daysOverride?: number) {
  const dateRange = useDateRange();

  // Calculate days from date range or use override
  const days = daysOverride ?? (() => {
    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 30;
  })();

  return useQuery({
    queryKey: queryKeys.dashboard.salesTrend(days),
    queryFn: () => dashboardService.getSalesTrend(days),
    staleTime: 5 * 60_000, // 5 minutes
    placeholderData: (previousData) => previousData, // Keep old data visible during refetch
  });
}

/**
 * Hook to fetch category breakdown
 */
export function useCategoryBreakdown() {
  return useQuery({
    queryKey: queryKeys.dashboard.categoryBreakdown(),
    queryFn: () => dashboardService.getCategoryBreakdown(),
    staleTime: 5 * 60_000, // 5 minutes
  });
}

/**
 * Hook to fetch top products
 */
export function useTopProducts(limit: number = 5) {
  return useQuery({
    queryKey: queryKeys.dashboard.topProducts(limit),
    queryFn: () => dashboardService.getTopProducts(limit),
    staleTime: 5 * 60_000, // 5 minutes
  });
}
