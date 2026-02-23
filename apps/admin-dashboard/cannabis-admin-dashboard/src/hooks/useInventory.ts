import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService } from '../services/api/inventory.service';
// import { mockInventoryService as inventoryService } from '../services/api/inventory-mock.service';
import { useNotificationStore } from '../stores/notificationStore';
import { useDateRange } from '../stores/analyticsStore';
import type {
  InventoryFilters,
  BatchFilters,
  AdjustmentType,
} from '../modules/inventory/types/index';

/**
 * Inventory React Query Hooks
 * Custom hooks for fetching and mutating inventory data
 */

// Query keys for cache management
export const inventoryKeys = {
  all: ['inventory'] as const,
  products: () => [...inventoryKeys.all, 'products'] as const,
  productsList: (filters?: Partial<InventoryFilters>, dateRange?: { startDate: string; endDate: string }) =>
    [...inventoryKeys.products(), { filters, dateRange }] as const,
  product: (id: string) => [...inventoryKeys.products(), id] as const,
  productBatches: (id: string) =>
    [...inventoryKeys.product(id), 'batches'] as const,
  productAdjustments: (id: string) =>
    [...inventoryKeys.product(id), 'adjustments'] as const,
  productTrend: (id: string, days: number) =>
    [...inventoryKeys.product(id), 'trend', days] as const,
  batches: () => [...inventoryKeys.all, 'batches'] as const,
  batchesList: (filters?: Partial<BatchFilters>) =>
    [...inventoryKeys.batches(), { filters }] as const,
  vendors: () => [...inventoryKeys.all, 'vendors'] as const,
  summary: (dateRange?: { startDate: string; endDate: string }) =>
    [...inventoryKeys.all, 'summary', { dateRange }] as const,
  alerts: () => [...inventoryKeys.all, 'alerts'] as const,
};

/**
 * Hook to fetch products with filters
 * Uses date range from analytics store
 */
export function useProducts(filters?: Partial<InventoryFilters>) {
  const dateRange = useDateRange();

  return useQuery({
    queryKey: inventoryKeys.productsList(filters, dateRange),
    queryFn: () => inventoryService.getProducts(filters, dateRange),
    staleTime: 2 * 60_000, // 2 minutes
  });
}

/**
 * Hook to fetch single product
 */
export function useProduct(productId: string | null) {
  return useQuery({
    queryKey: inventoryKeys.product(productId || ''),
    queryFn: () => inventoryService.getProductById(productId!),
    enabled: !!productId,
    staleTime: 2 * 60_000,
  });
}

/**
 * Hook to fetch batches with filters
 */
export function useBatches(filters?: Partial<BatchFilters>) {
  return useQuery({
    queryKey: inventoryKeys.batchesList(filters),
    queryFn: () => inventoryService.getBatches(filters),
    staleTime: 2 * 60_000,
  });
}

/**
 * Hook to fetch batches for a specific product
 */
export function useProductBatches(productId: string | null) {
  return useQuery({
    queryKey: inventoryKeys.productBatches(productId || ''),
    queryFn: () => inventoryService.getProductBatches(productId!),
    enabled: !!productId,
    staleTime: 2 * 60_000,
  });
}

/**
 * Hook to fetch adjustment history
 */
export function useProductAdjustments(productId: string | null) {
  return useQuery({
    queryKey: inventoryKeys.productAdjustments(productId || ''),
    queryFn: () => inventoryService.getProductAdjustments(productId!),
    enabled: !!productId,
    staleTime: 2 * 60_000,
  });
}

/**
 * Hook to fetch stock trend
 */
export function useStockTrend(productId: string | null, days: number = 30) {
  return useQuery({
    queryKey: inventoryKeys.productTrend(productId || '', days),
    queryFn: () => inventoryService.getStockTrend(productId!, days),
    enabled: !!productId,
    staleTime: 5 * 60_000,
  });
}

/**
 * Hook to fetch vendors for filtering
 */
export function useVendors() {
  return useQuery({
    queryKey: inventoryKeys.vendors(),
    queryFn: () => inventoryService.getVendors(),
    staleTime: 10 * 60_000, // 10 minutes
  });
}

/**
 * Hook to fetch inventory summary
 * Uses date range from analytics store
 */
export function useInventorySummary() {
  const dateRange = useDateRange();

  return useQuery({
    queryKey: inventoryKeys.summary(dateRange),
    queryFn: () => inventoryService.getInventorySummary(dateRange),
    staleTime: 60_000, // 1 minute
    refetchInterval: 60_000, // Auto-refresh every minute
  });
}

/**
 * Hook to fetch compliance alerts
 */
export function useComplianceAlerts() {
  return useQuery({
    queryKey: inventoryKeys.alerts(),
    queryFn: () => inventoryService.getComplianceAlerts(),
    staleTime: 60_000,
    refetchInterval: 5 * 60_000, // Check every 5 minutes
  });
}

/**
 * Mutation: Create inventory adjustment
 */
export function useCreateAdjustment() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useNotificationStore();

  return useMutation({
    mutationFn: (adjustment: {
      product_id: string;
      batch_id?: string;
      adjustment_type: AdjustmentType;
      quantity_delta: number;
      reason: string;
      notes?: string;
    }) => inventoryService.createAdjustment(adjustment),
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: inventoryKeys.products() });
      queryClient.invalidateQueries({
        queryKey: inventoryKeys.product(data.product_id),
      });
      queryClient.invalidateQueries({
        queryKey: inventoryKeys.productAdjustments(data.product_id),
      });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.summary() });

      success('Inventory adjustment recorded successfully');
    },
    onError: (err: Error) => {
      showError(err.message || 'Failed to create adjustment');
    },
  });
}

/**
 * Mutation: Update batch status
 */
export function useUpdateBatchStatus() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useNotificationStore();

  return useMutation({
    mutationFn: ({ batchId, status }: { batchId: string; status: string }) =>
      inventoryService.updateBatchStatus(batchId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.batches() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.alerts() });

      success('Batch status updated successfully');
    },
    onError: (err: Error) => {
      showError(err.message || 'Failed to update batch status');
    },
  });
}

/**
 * Mutation: Create new batch
 */
export function useCreateBatch() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useNotificationStore();

  return useMutation({
    mutationFn: (batch: any) => inventoryService.createBatch(batch),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.batches() });
      queryClient.invalidateQueries({
        queryKey: inventoryKeys.product(data.product_id),
      });
      queryClient.invalidateQueries({
        queryKey: inventoryKeys.productBatches(data.product_id),
      });

      success('New batch created successfully');
    },
    onError: (err: Error) => {
      showError(err.message || 'Failed to create batch');
    },
  });
}
