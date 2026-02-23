import { create } from 'zustand';
import type {
  DateRange,
  DateRangePreset,
} from '../modules/analytics/types/index';

/**
 * Analytics Store
 * Manages analytics module state including date ranges, filters, and comparison mode
 */

interface AnalyticsState {
  // Date Range State
  dateRange: DateRange;
  compareEnabled: boolean;
  comparisonPeriod: 'previous' | 'yearAgo' | null;

  // Filters
  categoryFilter: string;

  // Actions
  setDateRange: (range: DateRange) => void;
  setDateRangePreset: (preset: DateRangePreset) => void;
  setCompareEnabled: (enabled: boolean) => void;
  setComparisonPeriod: (period: 'previous' | 'yearAgo' | null) => void;
  setCategoryFilter: (category: string) => void;
  reset: () => void;
}

// Helper: Get date range for preset
function getDateRangeForPreset(preset: DateRangePreset): DateRange {
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  switch (preset) {
    case 'today':
      return {
        startDate: startOfToday.toISOString().split('T')[0],
        endDate: startOfToday.toISOString().split('T')[0],
        preset,
      };

    case 'yesterday': {
      const yesterday = new Date(startOfToday);
      yesterday.setDate(yesterday.getDate() - 1);
      return {
        startDate: yesterday.toISOString().split('T')[0],
        endDate: yesterday.toISOString().split('T')[0],
        preset,
      };
    }

    case 'last7days': {
      const sevenDaysAgo = new Date(startOfToday);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return {
        startDate: sevenDaysAgo.toISOString().split('T')[0],
        endDate: startOfToday.toISOString().split('T')[0],
        preset,
      };
    }

    case 'last30days': {
      const thirtyDaysAgo = new Date(startOfToday);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return {
        startDate: thirtyDaysAgo.toISOString().split('T')[0],
        endDate: startOfToday.toISOString().split('T')[0],
        preset,
      };
    }

    case 'thisMonth': {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      return {
        startDate: startOfMonth.toISOString().split('T')[0],
        endDate: startOfToday.toISOString().split('T')[0],
        preset,
      };
    }

    case 'lastMonth': {
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      return {
        startDate: lastMonth.toISOString().split('T')[0],
        endDate: endOfLastMonth.toISOString().split('T')[0],
        preset,
      };
    }

    case 'thisYear': {
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      return {
        startDate: startOfYear.toISOString().split('T')[0],
        endDate: startOfToday.toISOString().split('T')[0],
        preset,
      };
    }

    case 'lastYear': {
      const lastYear = new Date(today.getFullYear() - 1, 0, 1);
      const endOfLastYear = new Date(today.getFullYear() - 1, 11, 31);
      return {
        startDate: lastYear.toISOString().split('T')[0],
        endDate: endOfLastYear.toISOString().split('T')[0],
        preset,
      };
    }

    default:
      return getDateRangeForPreset('last30days');
  }
}

// Default date range: Last 30 days
const defaultDateRange = getDateRangeForPreset('last30days');

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  // Initial State
  dateRange: defaultDateRange,
  compareEnabled: false,
  comparisonPeriod: null,
  categoryFilter: 'all',

  // Actions
  setDateRange: (range: DateRange) => {
    set({ dateRange: range });
  },

  setDateRangePreset: (preset: DateRangePreset) => {
    const range = getDateRangeForPreset(preset);
    set({ dateRange: range });
  },

  setCompareEnabled: (enabled: boolean) => {
    set({ compareEnabled: enabled });
  },

  setComparisonPeriod: (period: 'previous' | 'yearAgo' | null) => {
    set({ comparisonPeriod: period });
  },

  setCategoryFilter: (category: string) => {
    set({ categoryFilter: category });
  },

  reset: () => {
    set({
      dateRange: defaultDateRange,
      compareEnabled: false,
      comparisonPeriod: null,
      categoryFilter: 'all',
    });
  },
}));

// Selector hooks for convenience
export const useDateRange = () => useAnalyticsStore((state) => state.dateRange);
export const useCompareEnabled = () => useAnalyticsStore((state) => state.compareEnabled);
