import { useDateRange } from '../stores/analyticsStore';
import type { DateRange } from '../modules/analytics/types';
import type { StaffFilters } from '../modules/staff/types';

/**
 * Staff Hooks (Stub Implementation)
 * Returns placeholder data until Convex staff functions are implemented
 */

// Query keys for compatibility
export const staffKeys = {
  all: ['staff'] as const,
  performance: (range: DateRange, filters?: StaffFilters) =>
    [...staffKeys.all, 'performance', range, filters] as const,
  summary: (range: DateRange) => [...staffKeys.all, 'summary', range] as const,
  trend: (userId: string, range: DateRange) =>
    [...staffKeys.all, 'trend', userId, range] as const,
  topStaff: (range: DateRange, limit: number) =>
    [...staffKeys.all, 'topStaff', range, limit] as const,
};

// Stub staff performance data
// Note: includes both 'sales' and 'total_sales' for compatibility
const STUB_STAFF_PERFORMANCE = [
  {
    user_id: 'staff-1',
    full_name: 'Alex Johnson',
    avatar_url: null,
    role: 'budtender',
    sales: 12500,
    total_sales: 12500,
    transaction_count: 85,
    avg_transaction: 147.06,
    customers_served: 72,
    items_sold: 156,
  },
  {
    user_id: 'staff-2',
    full_name: 'Maria Garcia',
    avatar_url: null,
    role: 'budtender',
    sales: 10800,
    total_sales: 10800,
    transaction_count: 72,
    avg_transaction: 150.0,
    customers_served: 65,
    items_sold: 134,
  },
  {
    user_id: 'staff-3',
    full_name: 'James Wilson',
    avatar_url: null,
    role: 'manager',
    sales: 8200,
    total_sales: 8200,
    transaction_count: 45,
    avg_transaction: 182.22,
    customers_served: 40,
    items_sold: 98,
  },
];

/**
 * Hook to fetch staff performance metrics
 */
export function useStaffPerformance(_filters?: StaffFilters) {
  useDateRange(); // Keep for compatibility

  return {
    data: STUB_STAFF_PERFORMANCE,
    isLoading: false,
    error: null,
    isError: false,
  };
}

/**
 * Hook to fetch staff summary
 */
export function useStaffSummary() {
  useDateRange();

  return {
    data: {
      total_staff: 8,
      active_today: 5,
      avg_sales_per_staff: 10500,
      top_performer: 'Alex Johnson',
    },
    isLoading: false,
    error: null,
    isError: false,
  };
}

/**
 * Hook to fetch performance trend for a specific staff member
 */
export function useStaffPerformanceTrend(_userId: string) {
  useDateRange();

  return {
    data: [
      { date: '2024-01-01', sales: 1200, transactions: 8 },
      { date: '2024-01-02', sales: 1450, transactions: 10 },
      { date: '2024-01-03', sales: 980, transactions: 7 },
      { date: '2024-01-04', sales: 1600, transactions: 12 },
      { date: '2024-01-05', sales: 1350, transactions: 9 },
    ],
    isLoading: false,
    error: null,
    isError: false,
  };
}

/**
 * Hook to fetch top performing staff members
 */
export function useTopStaff(_limit: number = 5) {
  useDateRange();

  return {
    data: STUB_STAFF_PERFORMANCE.slice(0, _limit),
    isLoading: false,
    error: null,
    isError: false,
  };
}
