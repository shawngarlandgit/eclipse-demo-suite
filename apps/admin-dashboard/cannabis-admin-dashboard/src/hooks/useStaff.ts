import { useQuery } from '@tanstack/react-query';
import { staffService } from '../services/api/staff.service';
import { useDateRange } from '../stores/analyticsStore';
import type { DateRange } from '../types';
import type { StaffFilters } from '../modules/staff/types';

/**
 * Staff React Query Hooks
 * Custom hooks for fetching staff performance data with caching
 */

// Query keys
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

/**
 * Hook to fetch staff performance metrics
 */
export function useStaffPerformance(filters?: StaffFilters) {
  const dateRange = useDateRange();

  return useQuery({
    queryKey: staffKeys.performance(dateRange, filters),
    queryFn: () => staffService.getStaffPerformance(dateRange, filters),
    staleTime: 5 * 60_000, // 5 minutes
    placeholderData: (previousData) => previousData, // Keep old data visible during refetch
  });
}

/**
 * Hook to fetch staff summary
 */
export function useStaffSummary() {
  const dateRange = useDateRange();

  return useQuery({
    queryKey: staffKeys.summary(dateRange),
    queryFn: () => staffService.getStaffSummary(dateRange),
    staleTime: 5 * 60_000,
  });
}

/**
 * Hook to fetch performance trend for a specific staff member
 */
export function useStaffPerformanceTrend(userId: string) {
  const dateRange = useDateRange();

  return useQuery({
    queryKey: staffKeys.trend(userId, dateRange),
    queryFn: () => staffService.getStaffPerformanceTrend(userId, dateRange),
    staleTime: 5 * 60_000,
    enabled: !!userId, // Only run if userId is provided
  });
}

/**
 * Hook to fetch top performing staff members
 */
export function useTopStaff(limit: number = 5) {
  const dateRange = useDateRange();

  return useQuery({
    queryKey: staffKeys.topStaff(dateRange, limit),
    queryFn: () => staffService.getTopStaff(dateRange, limit),
    staleTime: 5 * 60_000,
  });
}
