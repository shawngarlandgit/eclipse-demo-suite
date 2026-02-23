import { QueryClient } from '@tanstack/react-query';

// TanStack Query client configuration
// Optimized for Cannabis Admin Dashboard with real-time data needs

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache Configuration
      staleTime: 60_000, // Consider data fresh for 1 minute
      gcTime: 5 * 60_000, // Keep unused data in cache for 5 minutes (formerly cacheTime)

      // Retry Configuration
      retry: 3, // Retry failed queries 3 times
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff

      // Refetch Configuration
      refetchOnWindowFocus: true, // Refetch when user returns to tab
      refetchOnReconnect: true, // Refetch when internet reconnects
      refetchOnMount: true, // Refetch when component mounts

      // Error Handling
      throwOnError: false, // Don't throw errors globally, handle in components

      // Network Mode
      networkMode: 'online', // Only fetch when online
    },
    mutations: {
      // Retry Configuration for Mutations
      retry: 1, // Retry mutations once
      retryDelay: 1000,

      // Network Mode
      networkMode: 'online',

      // Error Handling
      throwOnError: false,
    },
  },
});

// Query key factory for consistent key management
export const queryKeys = {
  // Dashboard queries
  dashboard: {
    all: ['dashboard'] as const,
    summary: () => [...queryKeys.dashboard.all, 'summary'] as const,
    kpis: (dateRange?: { from: string; to: string }) =>
      [...queryKeys.dashboard.all, 'kpis', dateRange] as const,
    salesTrend: (days: number) =>
      [...queryKeys.dashboard.all, 'salesTrend', days] as const,
    categoryBreakdown: () =>
      [...queryKeys.dashboard.all, 'categoryBreakdown'] as const,
    topProducts: (limit: number) =>
      [...queryKeys.dashboard.all, 'topProducts', limit] as const,
  },

  // Inventory queries
  inventory: {
    all: ['inventory'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.inventory.all, 'list', filters] as const,
    detail: (productId: string) =>
      [...queryKeys.inventory.all, 'detail', productId] as const,
    lowStock: () => [...queryKeys.inventory.all, 'lowStock'] as const,
    batches: (productId: string) =>
      [...queryKeys.inventory.all, 'batches', productId] as const,
  },

  // Analytics queries
  analytics: {
    all: ['analytics'] as const,
    sales: {
      daily: (dateRange: { from: string; to: string }) =>
        [...queryKeys.analytics.all, 'sales', 'daily', dateRange] as const,
      hourly: (date: string) =>
        [...queryKeys.analytics.all, 'sales', 'hourly', date] as const,
      topProducts: (period: string, limit: number) =>
        [...queryKeys.analytics.all, 'sales', 'topProducts', period, limit] as const,
    },
    customers: {
      cohorts: () => [...queryKeys.analytics.all, 'customers', 'cohorts'] as const,
      segments: () => [...queryKeys.analytics.all, 'customers', 'segments'] as const,
      ltv: () => [...queryKeys.analytics.all, 'customers', 'ltv'] as const,
    },
  },

  // Staff queries
  staff: {
    all: ['staff'] as const,
    list: () => [...queryKeys.staff.all, 'list'] as const,
    detail: (staffId: string) =>
      [...queryKeys.staff.all, 'detail', staffId] as const,
    performance: (staffId: string, dateRange?: { from: string; to: string }) =>
      [...queryKeys.staff.all, 'performance', staffId, dateRange] as const,
    leaderboard: (dateRange?: { from: string; to: string }) =>
      [...queryKeys.staff.all, 'leaderboard', dateRange] as const,
  },

  // Compliance queries
  compliance: {
    all: ['compliance'] as const,
    flags: (status?: 'open' | 'resolved' | 'all') =>
      [...queryKeys.compliance.all, 'flags', status] as const,
    reports: () => [...queryKeys.compliance.all, 'reports'] as const,
    auditLogs: (filters?: Record<string, unknown>) =>
      [...queryKeys.compliance.all, 'auditLogs', filters] as const,
  },

  // Configuration queries
  config: {
    all: ['config'] as const,
    integrations: () => [...queryKeys.config.all, 'integrations'] as const,
    users: () => [...queryKeys.config.all, 'users'] as const,
    dispensary: () => [...queryKeys.config.all, 'dispensary'] as const,
  },

  // Auth queries
  auth: {
    all: ['auth'] as const,
    user: () => [...queryKeys.auth.all, 'user'] as const,
    permissions: () => [...queryKeys.auth.all, 'permissions'] as const,
  },
};

// Helper function to invalidate all queries for a specific module
export const invalidateModule = (module: keyof typeof queryKeys) => {
  return queryClient.invalidateQueries({ queryKey: queryKeys[module].all });
};

// Helper function to clear all cache
export const clearAllCache = () => {
  queryClient.clear();
};

export default queryClient;
