/**
 * Supplier Risk Hooks
 * Convex query hooks for supplier risk data
 */

import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type {
  RiskTier,
  RiskDashboardSummary,
  EnrichedRiskProfile,
  SupplierFullProfile,
  EnrichedIncident,
  Supplier,
} from "../types";

// ============================================================================
// DASHBOARD HOOKS
// ============================================================================

/**
 * Get risk dashboard summary for a dispensary
 */
export function useRiskDashboardSummary(dispensaryId: Id<"dispensaries"> | undefined) {
  return useQuery(
    api.supplierRisk.getDashboardSummary,
    dispensaryId ? { dispensaryId } : "skip"
  ) as RiskDashboardSummary | undefined;
}

/**
 * Get risk profiles with optional tier filter
 */
export function useRiskProfiles(
  dispensaryId: Id<"dispensaries"> | undefined,
  options?: {
    riskTier?: RiskTier;
    sortBy?: "riskScore" | "name" | "lastIncident" | "trend";
    sortOrder?: "asc" | "desc";
    limit?: number;
  }
) {
  return useQuery(
    api.supplierRisk.getRiskProfiles,
    dispensaryId
      ? {
          dispensaryId,
          riskTier: options?.riskTier,
          sortBy: options?.sortBy,
          sortOrder: options?.sortOrder,
          limit: options?.limit,
        }
      : "skip"
  ) as EnrichedRiskProfile[] | undefined;
}

/**
 * Get high-risk suppliers above threshold
 */
export function useHighRiskSuppliers(
  dispensaryId: Id<"dispensaries"> | undefined,
  threshold?: number
) {
  return useQuery(
    api.supplierRisk.getHighRiskSuppliers,
    dispensaryId ? { dispensaryId, threshold } : "skip"
  ) as EnrichedRiskProfile[] | undefined;
}

/**
 * Get suppliers with worsening trends
 */
export function useTrendingRisk(
  dispensaryId: Id<"dispensaries"> | undefined,
  period?: number
) {
  return useQuery(
    api.supplierRisk.getTrendingRisk,
    dispensaryId ? { dispensaryId, period } : "skip"
  ) as EnrichedRiskProfile[] | undefined;
}

// ============================================================================
// SUPPLIER DETAIL HOOKS
// ============================================================================

/**
 * Get full supplier profile with risk data
 */
export function useSupplierProfile(
  supplierId: Id<"suppliers"> | undefined,
  dispensaryId: Id<"dispensaries"> | undefined
) {
  return useQuery(
    api.supplierRisk.getProfile,
    supplierId && dispensaryId ? { supplierId, dispensaryId } : "skip"
  ) as SupplierFullProfile | null | undefined;
}

/**
 * Get incident history for a supplier
 */
export function useIncidentHistory(
  supplierId: Id<"suppliers"> | undefined,
  dispensaryId: Id<"dispensaries"> | undefined,
  limit?: number
) {
  return useQuery(
    api.supplierRisk.getIncidentHistory,
    supplierId && dispensaryId ? { supplierId, dispensaryId, limit } : "skip"
  ) as EnrichedIncident[] | undefined;
}

// ============================================================================
// SUPPLIER LIST HOOKS
// ============================================================================

/**
 * List all suppliers
 */
export function useSupplierList(
  dispensaryId: Id<"dispensaries"> | undefined,
  options?: {
    licenseType?: string;
    isActive?: boolean;
    search?: string;
    limit?: number;
  }
) {
  return useQuery(
    api.suppliers.list,
    {
      dispensaryId,
      licenseType: options?.licenseType as "grower" | "caregiver" | "processor" | "distributor" | "manufacturer" | "other" | undefined,
      isActive: options?.isActive,
      search: options?.search,
      limit: options?.limit,
    }
  ) as { suppliers: Array<Supplier & { riskProfile: EnrichedRiskProfile | null }>; hasMore: boolean } | undefined;
}

/**
 * Search suppliers
 */
export function useSupplierSearch(
  query: string,
  dispensaryId: Id<"dispensaries"> | undefined,
  limit?: number
) {
  return useQuery(
    api.suppliers.search,
    query.length >= 2 && dispensaryId
      ? { query, dispensaryId, limit }
      : "skip"
  ) as Array<Supplier & { riskProfile: EnrichedRiskProfile | null }> | undefined;
}

/**
 * Get suppliers linked to products
 */
export function useLinkedSuppliers(dispensaryId: Id<"dispensaries"> | undefined) {
  return useQuery(
    api.suppliers.getLinkedToProducts,
    dispensaryId ? { dispensaryId } : "skip"
  ) as Array<Supplier & { riskProfile: EnrichedRiskProfile | null; productCount: number }> | undefined;
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Record a new supplier incident
 */
export function useRecordIncident() {
  return useMutation(api.supplierRisk.recordIncident);
}

/**
 * Resolve a supplier incident
 */
export function useResolveIncident() {
  return useMutation(api.supplierRisk.resolveIncident);
}

/**
 * Recalculate risk score for a supplier
 */
export function useRecalculateScore() {
  return useMutation(api.supplierRisk.recalculateScore);
}

/**
 * Recalculate all risk scores
 */
export function useRecalculateAllScores() {
  return useMutation(api.supplierRisk.recalculateAllScores);
}

/**
 * Create a new supplier
 */
export function useCreateSupplier() {
  return useMutation(api.suppliers.create);
}

/**
 * Update a supplier
 */
export function useUpdateSupplier() {
  return useMutation(api.suppliers.update);
}

/**
 * Link supplier to advisory
 */
export function useLinkSupplierToAdvisory() {
  return useMutation(api.suppliers.linkToAdvisory);
}
