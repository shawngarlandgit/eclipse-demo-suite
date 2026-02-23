import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { useDashboardStore } from '../stores/dashboardStore';
import { useEffect } from 'react';
import { useCurrentDispensary } from './useAuth';
import type { Id } from '@convex/_generated/dataModel';

/**
 * Dashboard Convex Hooks
 * Real-time dashboard data with automatic subscriptions
 */

/**
 * Hook to fetch and manage dashboard KPIs
 * Uses Convex for real-time updates
 */
export function useDashboardKPIs() {
  const dispensary = useCurrentDispensary();
  const setKPIs = useDashboardStore((state) => state.setKPIs);
  const setRefreshing = useDashboardStore((state) => state.setRefreshing);

  const dispensaryId = dispensary?._id as Id<"dispensaries"> | undefined;

  const data = useQuery(
    api.dashboard.getKPIs,
    dispensaryId ? { dispensaryId } : "skip"
  );

  // Update store when data changes
  useEffect(() => {
    if (data) {
      setKPIs(data);
    }
    setRefreshing(data === undefined);
  }, [data, setKPIs, setRefreshing]);

  return {
    data,
    isLoading: data === undefined,
    isFetching: data === undefined,
    error: null, // Convex throws on error
  };
}

/**
 * Hook to fetch sales trend data
 * Real-time updates via Convex subscriptions
 */
export function useSalesTrend(days: number = 7) {
  const dispensary = useCurrentDispensary();
  const dispensaryId = dispensary?._id as Id<"dispensaries"> | undefined;

  const data = useQuery(
    api.dashboard.getSalesTrends,
    dispensaryId ? { dispensaryId, days } : "skip"
  );

  return {
    data,
    isLoading: data === undefined,
    error: null,
  };
}

/**
 * Hook to fetch top products
 * Real-time updates via Convex subscriptions
 */
export function useTopProducts(limit: number = 5) {
  const dispensary = useCurrentDispensary();
  const dispensaryId = dispensary?._id as Id<"dispensaries"> | undefined;

  const data = useQuery(
    api.dashboard.getTopProducts,
    dispensaryId ? { dispensaryId, limit } : "skip"
  );

  return {
    data,
    isLoading: data === undefined,
    error: null,
  };
}

/**
 * Hook to fetch low stock products
 * Real-time updates for inventory alerts
 */
export function useLowStockProducts(limit: number = 10) {
  const dispensary = useCurrentDispensary();
  const dispensaryId = dispensary?._id as Id<"dispensaries"> | undefined;

  const data = useQuery(
    api.dashboard.getLowStockProducts,
    dispensaryId ? { dispensaryId, limit } : "skip"
  );

  return {
    data,
    isLoading: data === undefined,
    error: null,
  };
}

/**
 * Hook to fetch category breakdown from products
 */
export function useCategoryBreakdown() {
  const dispensary = useCurrentDispensary();
  const dispensaryId = dispensary?._id as Id<"dispensaries"> | undefined;

  const data = useQuery(
    api.products.getByCategory,
    dispensaryId ? { dispensaryId } : "skip"
  );

  // Transform to category counts
  const breakdown = data
    ? Object.entries(data).map(([category, products]) => ({
        category,
        count: products.length,
        revenue: 0, // Would need transaction data for revenue
      }))
    : undefined;

  return {
    data: breakdown,
    isLoading: data === undefined,
    error: null,
  };
}
