import { create } from 'zustand';
import type { DashboardKPIs, DateRange } from '../types';

/**
 * Dashboard Store
 * Manages dashboard state including KPIs, date ranges, and refresh triggers
 */

interface DashboardState {
  // State
  kpis: DashboardKPIs | null;
  dateRange: DateRange;
  isRefreshing: boolean;
  lastRefresh: Date | null;

  // Actions
  setKPIs: (kpis: DashboardKPIs) => void;
  setDateRange: (dateRange: DateRange) => void;
  setRefreshing: (isRefreshing: boolean) => void;
  markRefreshed: () => void;
  reset: () => void;
}

// Default date range: Last 30 days
const getDefaultDateRange = (): DateRange => {
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);

  return {
    from: thirtyDaysAgo.toISOString().split('T')[0],
    to: today.toISOString().split('T')[0],
  };
};

export const useDashboardStore = create<DashboardState>((set) => ({
  // Initial State
  kpis: null,
  dateRange: getDefaultDateRange(),
  isRefreshing: false,
  lastRefresh: null,

  // Set KPIs
  setKPIs: (kpis: DashboardKPIs) => {
    set({ kpis, lastRefresh: new Date() });
  },

  // Set Date Range
  setDateRange: (dateRange: DateRange) => {
    set({ dateRange });
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
      kpis: null,
      dateRange: getDefaultDateRange(),
      isRefreshing: false,
      lastRefresh: null,
    });
  },
}));

// Selector hooks
export const useDashboardKPIs = () => useDashboardStore((state) => state.kpis);
export const useDateRange = () => useDashboardStore((state) => state.dateRange);
export const useIsRefreshing = () => useDashboardStore((state) => state.isRefreshing);
export const useLastRefresh = () => useDashboardStore((state) => state.lastRefresh);
