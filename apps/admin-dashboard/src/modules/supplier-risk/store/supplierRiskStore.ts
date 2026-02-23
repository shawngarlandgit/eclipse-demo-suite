/**
 * Supplier Risk Store
 * Zustand store for supplier risk UI state
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Id } from "@convex/_generated/dataModel";
import type { RiskTier, IncidentType, RiskTrend } from "../types";

// ============================================================================
// TYPES
// ============================================================================

export type SortField = "riskScore" | "name" | "lastIncident" | "trend" | "incidentRate";
export type SortOrder = "asc" | "desc";
export type ViewMode = "table" | "cards";

interface SupplierRiskFilters {
  riskTier: RiskTier | null;
  trend: RiskTrend | null;
  incidentType: IncidentType | null;
  searchQuery: string;
  showOnlyHighRisk: boolean;
  showOnlyWorsening: boolean;
}

interface SupplierRiskSort {
  field: SortField;
  order: SortOrder;
}

interface SupplierRiskState {
  // Filters
  filters: SupplierRiskFilters;
  setFilter: <K extends keyof SupplierRiskFilters>(
    key: K,
    value: SupplierRiskFilters[K]
  ) => void;
  resetFilters: () => void;

  // Sorting
  sort: SupplierRiskSort;
  setSort: (field: SortField, order?: SortOrder) => void;

  // View mode
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  // Selected supplier
  selectedSupplierId: Id<"suppliers"> | null;
  setSelectedSupplierId: (id: Id<"suppliers"> | null) => void;

  // Detail modal
  isDetailModalOpen: boolean;
  openDetailModal: (supplierId: Id<"suppliers">) => void;
  closeDetailModal: () => void;

  // Incident modal
  isIncidentModalOpen: boolean;
  incidentModalSupplierId: Id<"suppliers"> | null;
  openIncidentModal: (supplierId: Id<"suppliers">) => void;
  closeIncidentModal: () => void;

  // Dashboard preferences
  dashboardLayout: "standard" | "compact";
  setDashboardLayout: (layout: "standard" | "compact") => void;
  showTrendChart: boolean;
  setShowTrendChart: (show: boolean) => void;
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

const defaultFilters: SupplierRiskFilters = {
  riskTier: null,
  trend: null,
  incidentType: null,
  searchQuery: "",
  showOnlyHighRisk: false,
  showOnlyWorsening: false,
};

const defaultSort: SupplierRiskSort = {
  field: "riskScore",
  order: "desc",
};

// ============================================================================
// STORE
// ============================================================================

export const useSupplierRiskStore = create<SupplierRiskState>()(
  persist(
    (set) => ({
      // Filters
      filters: defaultFilters,
      setFilter: (key, value) =>
        set((state) => ({
          filters: { ...state.filters, [key]: value },
        })),
      resetFilters: () => set({ filters: defaultFilters }),

      // Sorting
      sort: defaultSort,
      setSort: (field, order) =>
        set((state) => ({
          sort: {
            field,
            order: order ?? (state.sort.field === field && state.sort.order === "desc" ? "asc" : "desc"),
          },
        })),

      // View mode
      viewMode: "table",
      setViewMode: (mode) => set({ viewMode: mode }),

      // Selected supplier
      selectedSupplierId: null,
      setSelectedSupplierId: (id) => set({ selectedSupplierId: id }),

      // Detail modal
      isDetailModalOpen: false,
      openDetailModal: (supplierId) =>
        set({
          selectedSupplierId: supplierId,
          isDetailModalOpen: true,
        }),
      closeDetailModal: () =>
        set({
          isDetailModalOpen: false,
        }),

      // Incident modal
      isIncidentModalOpen: false,
      incidentModalSupplierId: null,
      openIncidentModal: (supplierId) =>
        set({
          incidentModalSupplierId: supplierId,
          isIncidentModalOpen: true,
        }),
      closeIncidentModal: () =>
        set({
          isIncidentModalOpen: false,
          incidentModalSupplierId: null,
        }),

      // Dashboard preferences
      dashboardLayout: "standard",
      setDashboardLayout: (layout) => set({ dashboardLayout: layout }),
      showTrendChart: true,
      setShowTrendChart: (show) => set({ showTrendChart: show }),
    }),
    {
      name: "supplier-risk-store",
      partialize: (state) => ({
        viewMode: state.viewMode,
        sort: state.sort,
        dashboardLayout: state.dashboardLayout,
        showTrendChart: state.showTrendChart,
      }),
    }
  )
);

// ============================================================================
// SELECTORS
// ============================================================================

export const selectFilters = (state: SupplierRiskState) => state.filters;
export const selectSort = (state: SupplierRiskState) => state.sort;
export const selectViewMode = (state: SupplierRiskState) => state.viewMode;
export const selectSelectedSupplierId = (state: SupplierRiskState) => state.selectedSupplierId;
export const selectIsDetailModalOpen = (state: SupplierRiskState) => state.isDetailModalOpen;
export const selectIsIncidentModalOpen = (state: SupplierRiskState) => state.isIncidentModalOpen;
export const selectIncidentModalSupplierId = (state: SupplierRiskState) => state.incidentModalSupplierId;
