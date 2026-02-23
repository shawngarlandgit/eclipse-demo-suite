import { create } from 'zustand';
import type {
  InventoryFilters,
  BatchFilters,
} from '../modules/inventory/types/index';

/**
 * Inventory Store
 * Manages inventory module state including filters, selected items, and UI state
 */

interface InventoryState {
  // Filter State
  productFilters: InventoryFilters;
  batchFilters: BatchFilters;

  // Selection State
  selectedProductId: string | null;
  selectedBatchId: string | null;

  // UI State
  isDetailModalOpen: boolean;
  isAdjustmentDrawerOpen: boolean;
  view: 'products' | 'batches';

  // Actions - Filters
  setProductFilters: (filters: Partial<InventoryFilters>) => void;
  setBatchFilters: (filters: Partial<BatchFilters>) => void;
  resetProductFilters: () => void;
  resetBatchFilters: () => void;

  // Actions - Selection
  setSelectedProduct: (productId: string | null) => void;
  setSelectedBatch: (batchId: string | null) => void;

  // Actions - UI
  openDetailModal: (productId: string) => void;
  closeDetailModal: () => void;
  openAdjustmentDrawer: (productId: string) => void;
  closeAdjustmentDrawer: () => void;
  setView: (view: 'products' | 'batches') => void;

  // Reset
  reset: () => void;
}

// Default filters
const defaultProductFilters: InventoryFilters = {
  search: '',
  category: 'all',
  status: 'all',
  stockLevel: 'all',
  vendor: 'all',
};

const defaultBatchFilters: BatchFilters = {
  search: '',
  productId: 'all',
  status: 'all',
  testStatus: 'all',
};

export const useInventoryStore = create<InventoryState>((set) => ({
  // Initial State
  productFilters: defaultProductFilters,
  batchFilters: defaultBatchFilters,
  selectedProductId: null,
  selectedBatchId: null,
  isDetailModalOpen: false,
  isAdjustmentDrawerOpen: false,
  view: 'products',

  // Filter Actions
  setProductFilters: (filters: Partial<InventoryFilters>) => {
    set((state) => ({
      productFilters: { ...state.productFilters, ...filters },
    }));
  },

  setBatchFilters: (filters: Partial<BatchFilters>) => {
    set((state) => ({
      batchFilters: { ...state.batchFilters, ...filters },
    }));
  },

  resetProductFilters: () => {
    set({ productFilters: defaultProductFilters });
  },

  resetBatchFilters: () => {
    set({ batchFilters: defaultBatchFilters });
  },

  // Selection Actions
  setSelectedProduct: (productId: string | null) => {
    set({ selectedProductId: productId });
  },

  setSelectedBatch: (batchId: string | null) => {
    set({ selectedBatchId: batchId });
  },

  // UI Actions
  openDetailModal: (productId: string) => {
    set({
      selectedProductId: productId,
      isDetailModalOpen: true,
    });
  },

  closeDetailModal: () => {
    set({
      isDetailModalOpen: false,
      selectedProductId: null,
    });
  },

  openAdjustmentDrawer: (productId: string) => {
    set({
      selectedProductId: productId,
      isAdjustmentDrawerOpen: true,
    });
  },

  closeAdjustmentDrawer: () => {
    set({
      isAdjustmentDrawerOpen: false,
      selectedProductId: null,
    });
  },

  setView: (view: 'products' | 'batches') => {
    set({ view });
  },

  // Reset All
  reset: () => {
    set({
      productFilters: defaultProductFilters,
      batchFilters: defaultBatchFilters,
      selectedProductId: null,
      selectedBatchId: null,
      isDetailModalOpen: false,
      isAdjustmentDrawerOpen: false,
      view: 'products',
    });
  },
}));

// Selector hooks for convenience
export const useProductFilters = () =>
  useInventoryStore((state) => state.productFilters);
export const useBatchFilters = () =>
  useInventoryStore((state) => state.batchFilters);
export const useSelectedProductId = () =>
  useInventoryStore((state) => state.selectedProductId);
export const useInventoryView = () =>
  useInventoryStore((state) => state.view);
