import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { useNotificationStore } from '../stores/notificationStore';
import { useCurrentDispensary } from './useAuth';
import type { Id } from '@convex/_generated/dataModel';

/**
 * Inventory Convex Hooks
 * Real-time inventory data with automatic subscriptions
 */

// Product category type
type ProductCategory =
  | 'flower'
  | 'pre_roll'
  | 'concentrate'
  | 'edible'
  | 'topical'
  | 'tincture'
  | 'vape'
  | 'accessory';

// Filter types for compatibility with frontend store
export interface InventoryFilters {
  category?: ProductCategory | 'all' | string;
  search?: string;
  isActive?: boolean;
  status?: 'all' | 'active' | 'inactive';
  stockLevel?: 'all' | 'critical' | 'low' | 'normal' | 'high' | 'out' | 'adequate';
  brand?: string;
  vendor?: string | 'all';
}

// Transform frontend filter values to Convex-compatible values
function transformFilters(filters?: Partial<InventoryFilters>) {
  if (!filters) return {};

  // Transform category - "all" means no filter
  const category = filters.category === 'all' || !filters.category
    ? undefined
    : filters.category as ProductCategory;

  // Transform status string to isActive boolean
  let isActive: boolean | undefined = filters.isActive;
  if (filters.status && filters.status !== 'all') {
    isActive = filters.status === 'active';
  } else if (filters.status === 'all') {
    isActive = undefined;
  }

  // Transform stock level - map frontend values to backend values
  let stockLevel: 'low' | 'out' | 'adequate' | undefined;
  if (filters.stockLevel && filters.stockLevel !== 'all') {
    const stockMap: Record<string, 'low' | 'out' | 'adequate'> = {
      'critical': 'out',
      'low': 'low',
      'normal': 'adequate',
      'high': 'adequate',
      'out': 'out',
      'adequate': 'adequate',
    };
    stockLevel = stockMap[filters.stockLevel];
  }

  // Transform vendor to brand - "all" means no filter
  const brand = filters.vendor === 'all' || !filters.vendor
    ? (filters.brand === 'all' ? undefined : filters.brand)
    : filters.vendor;

  // Search - empty string means no filter
  const search = filters.search?.trim() || undefined;

  return { category, isActive, stockLevel, brand, search };
}

/**
 * Hook to fetch products with filters
 * Real-time updates via Convex subscriptions
 * Transforms frontend filter values to Convex-compatible format
 */
export function useProducts(filters?: Partial<InventoryFilters>) {
  const dispensary = useCurrentDispensary();
  const dispensaryId = dispensary?._id as Id<"dispensaries"> | undefined;

  // Transform filters before passing to Convex
  const transformedFilters = transformFilters(filters);

  const data = useQuery(
    api.products.list,
    dispensaryId
      ? {
          dispensaryId,
          ...transformedFilters,
        }
      : "skip"
  );

  return {
    data: data?.products,
    total: data?.total,
    hasMore: data?.hasMore,
    isLoading: data === undefined,
    error: null,
  };
}

/**
 * Hook to fetch single product
 */
export function useProduct(productId: string | null) {
  const data = useQuery(
    api.products.getById,
    productId ? { productId: productId as Id<"products"> } : "skip"
  );

  return {
    data,
    isLoading: productId ? data === undefined : false,
    error: null,
  };
}

/**
 * Hook to fetch vendors for filtering
 */
export function useVendors() {
  const dispensary = useCurrentDispensary();
  const dispensaryId = dispensary?._id as Id<"dispensaries"> | undefined;

  const data = useQuery(
    api.products.getVendors,
    dispensaryId ? { dispensaryId } : "skip"
  );

  return {
    data,
    isLoading: data === undefined,
    error: null,
  };
}

/**
 * Hook to fetch inventory summary
 * Real-time updates for dashboard stats
 */
export function useInventorySummary() {
  const dispensary = useCurrentDispensary();
  const dispensaryId = dispensary?._id as Id<"dispensaries"> | undefined;

  const data = useQuery(
    api.products.getSummary,
    dispensaryId ? { dispensaryId } : "skip"
  );

  return {
    data,
    isLoading: data === undefined,
    error: null,
  };
}

/**
 * Hook to fetch products by category
 */
export function useProductsByCategory() {
  const dispensary = useCurrentDispensary();
  const dispensaryId = dispensary?._id as Id<"dispensaries"> | undefined;

  const data = useQuery(
    api.products.getByCategory,
    dispensaryId ? { dispensaryId } : "skip"
  );

  return {
    data,
    isLoading: data === undefined,
    error: null,
  };
}

/**
 * Mutation: Create product
 */
export function useCreateProduct() {
  const { success, error: showError } = useNotificationStore();
  const dispensary = useCurrentDispensary();
  const createProduct = useMutation(api.products.create);

  const mutate = async (product: {
    sku: string;
    name: string;
    category: ProductCategory;
    brand?: string;
    description?: string;
    thcPercentage?: number;
    cbdPercentage?: number;
    weightGrams?: number;
    unitType?: string;
    costPrice: number;
    retailPrice: number;
    quantityOnHand?: number;
    lowStockThreshold?: number;
  }) => {
    if (!dispensary?._id) {
      showError('No dispensary selected');
      return null;
    }

    try {
      const productId = await createProduct({
        dispensaryId: dispensary._id as Id<"dispensaries">,
        ...product,
      });
      success('Product created successfully');
      return productId;
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to create product');
      return null;
    }
  };

  return { mutate };
}

/**
 * Mutation: Update product
 */
export function useUpdateProduct() {
  const { success, error: showError } = useNotificationStore();
  const updateProduct = useMutation(api.products.update);

  const mutate = async (
    productId: string,
    updates: {
      name?: string;
      category?: ProductCategory;
      brand?: string;
      description?: string;
      thcPercentage?: number;
      cbdPercentage?: number;
      costPrice?: number;
      retailPrice?: number;
      lowStockThreshold?: number;
      isActive?: boolean;
    }
  ) => {
    try {
      await updateProduct({
        productId: productId as Id<"products">,
        ...updates,
      });
      success('Product updated successfully');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to update product');
    }
  };

  return { mutate };
}

/**
 * Mutation: Adjust inventory quantity
 */
export function useAdjustQuantity() {
  const { success, error: showError } = useNotificationStore();
  const adjustQuantity = useMutation(api.products.adjustQuantity);

  const mutate = async (adjustment: {
    productId: string;
    quantityChange: number;
    reason: string;
    notes?: string;
  }) => {
    try {
      const result = await adjustQuantity({
        productId: adjustment.productId as Id<"products">,
        quantityChange: adjustment.quantityChange,
        reason: adjustment.reason,
        notes: adjustment.notes,
      });
      success('Inventory adjusted successfully');
      return result;
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to adjust inventory');
      return null;
    }
  };

  return { mutate };
}

/**
 * Mutation: Deactivate product
 */
export function useDeactivateProduct() {
  const { success, error: showError } = useNotificationStore();
  const deactivate = useMutation(api.products.deactivate);

  const mutate = async (productId: string) => {
    try {
      await deactivate({ productId: productId as Id<"products"> });
      success('Product deactivated');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to deactivate product');
    }
  };

  return { mutate };
}

/**
 * Mutation: Bulk import products
 */
export function useBulkImportProducts() {
  const { success, error: showError } = useNotificationStore();
  const dispensary = useCurrentDispensary();
  const bulkImport = useMutation(api.products.bulkImport);

  const mutate = async (
    products: Array<{
      sku: string;
      name: string;
      category: ProductCategory;
      brand?: string;
      costPrice: number;
      retailPrice: number;
      quantityOnHand?: number;
    }>,
    updateExisting: boolean = false
  ) => {
    if (!dispensary?._id) {
      showError('No dispensary selected');
      return null;
    }

    try {
      const result = await bulkImport({
        dispensaryId: dispensary._id as Id<"dispensaries">,
        products,
        updateExisting,
      });
      success(
        `Import complete: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped`
      );
      return result;
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to import products');
      return null;
    }
  };

  return { mutate };
}

// Legacy compatibility exports
export const inventoryKeys = {
  all: ['inventory'] as const,
  products: () => [...inventoryKeys.all, 'products'] as const,
  productsList: (filters?: Partial<InventoryFilters>) =>
    [...inventoryKeys.products(), { filters }] as const,
  product: (id: string) => [...inventoryKeys.products(), id] as const,
  vendors: () => [...inventoryKeys.all, 'vendors'] as const,
  summary: () => [...inventoryKeys.all, 'summary'] as const,
};

// Alias for compatibility
export const useCreateAdjustment = useAdjustQuantity;

/**
 * Hook to fetch compliance alerts
 * Returns low stock and expired product alerts
 */
export function useComplianceAlerts() {
  const dispensary = useCurrentDispensary();
  const dispensaryId = dispensary?._id as Id<"dispensaries"> | undefined;

  // Get low stock products for compliance alerts
  const lowStockData = useQuery(
    api.products.list,
    dispensaryId
      ? {
          dispensaryId,
          stockLevel: 'low' as const,
        }
      : "skip"
  );

  // Transform low stock into alerts
  const alerts = lowStockData?.products?.map((product) => ({
    id: product._id,
    type: 'low_stock' as const,
    severity: 'warning' as const,
    message: `Low stock: ${product.name} (${product.quantityOnHand} remaining)`,
    productId: product._id,
    productName: product.name,
    createdAt: new Date().toISOString(),
  })) ?? [];

  return {
    data: alerts,
    isLoading: lowStockData === undefined,
    error: null,
  };
}
