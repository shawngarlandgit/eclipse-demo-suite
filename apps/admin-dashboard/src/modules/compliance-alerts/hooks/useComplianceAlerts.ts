/**
 * Compliance Alerts Hooks
 * React hooks for accessing OCP advisory data via Convex
 */

import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type {
  AdvisorySeverity,
  AdvisoryStatus,
  MatchStatus,
  ResolutionAction,
} from "../types";

// ============================================================================
// ADVISORY QUERIES
// ============================================================================

/**
 * Get list of advisories with optional filters
 */
export function useAdvisories(
  filters?: {
    status?: AdvisoryStatus;
    severity?: AdvisorySeverity;
  },
  limit?: number
) {
  return useQuery(api.ocpAdvisories.list, {
    status: filters?.status,
    severity: filters?.severity,
    limit,
  });
}

/**
 * Get a single advisory by ID with all related data
 */
export function useAdvisory(advisoryId: Id<"ocpAdvisories"> | undefined) {
  return useQuery(
    api.ocpAdvisories.getById,
    advisoryId ? { advisoryId } : "skip"
  );
}

/**
 * Get active alerts for dashboard banner
 */
export function useActiveAlerts() {
  return useQuery(api.ocpAdvisories.getActiveAlerts, {});
}

/**
 * Get matches for a specific dispensary
 */
export function useDispensaryMatches(
  dispensaryId: Id<"dispensaries"> | undefined,
  filters?: {
    status?: MatchStatus;
    advisoryId?: Id<"ocpAdvisories">;
  },
  limit?: number
) {
  return useQuery(
    api.ocpAdvisories.getMatchesForDispensary,
    dispensaryId
      ? {
          dispensaryId,
          status: filters?.status,
          advisoryId: filters?.advisoryId,
          limit,
        }
      : "skip"
  );
}

// ============================================================================
// DASHBOARD QUERIES
// ============================================================================

/**
 * Get compliance dashboard summary for a dispensary
 */
export function useComplianceDashboardSummary(
  dispensaryId: Id<"dispensaries"> | undefined
) {
  return useQuery(
    api.complianceAlerts.getDashboardSummary,
    dispensaryId ? { dispensaryId } : "skip"
  );
}

/**
 * Get flagged products for a dispensary
 */
export function useFlaggedProducts(
  dispensaryId: Id<"dispensaries"> | undefined,
  includeResolved?: boolean
) {
  return useQuery(
    api.complianceAlerts.getFlaggedProducts,
    dispensaryId ? { dispensaryId, includeResolved } : "skip"
  );
}

/**
 * Get notification history for a dispensary
 */
export function useNotificationHistory(
  dispensaryId: Id<"dispensaries"> | undefined,
  limit?: number
) {
  return useQuery(
    api.complianceAlerts.getNotificationHistory,
    dispensaryId ? { dispensaryId, limit } : "skip"
  );
}

/**
 * Get resolution metrics for reporting
 */
export function useResolutionMetrics(
  dispensaryId: Id<"dispensaries"> | undefined,
  dateRange?: { startDate?: number; endDate?: number }
) {
  return useQuery(
    api.complianceAlerts.getResolutionMetrics,
    dispensaryId
      ? {
          dispensaryId,
          startDate: dateRange?.startDate,
          endDate: dateRange?.endDate,
        }
      : "skip"
  );
}

/**
 * Get resolution audit trail
 */
export function useResolutionAuditTrail(
  dispensaryId: Id<"dispensaries"> | undefined,
  filters?: {
    advisoryId?: Id<"ocpAdvisories">;
    matchId?: Id<"advisoryProductMatches">;
    productId?: Id<"products">;
  },
  limit?: number
) {
  return useQuery(
    api.complianceAlerts.getResolutionAuditTrail,
    dispensaryId
      ? {
          dispensaryId,
          advisoryId: filters?.advisoryId,
          matchId: filters?.matchId,
          productId: filters?.productId,
          limit,
        }
      : "skip"
  );
}

/**
 * Get unread notification count
 */
export function useUnreadNotificationCount(
  dispensaryId: Id<"dispensaries"> | undefined,
  userId?: Id<"users">
) {
  return useQuery(
    api.complianceAlerts.getUnreadNotificationCount,
    dispensaryId ? { dispensaryId, userId } : "skip"
  );
}

/**
 * Generate compliance report data
 */
export function useComplianceReport(
  dispensaryId: Id<"dispensaries"> | undefined,
  dateRange: { startDate: number; endDate: number },
  includeResolved?: boolean
) {
  return useQuery(
    api.complianceAlerts.generateComplianceReport,
    dispensaryId
      ? {
          dispensaryId,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          includeResolved,
        }
      : "skip"
  );
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Hook for resolving a match
 */
export function useResolveMatch() {
  return useMutation(api.ocpAdvisories.resolveMatch);
}

/**
 * Hook for dismissing a match as false positive
 */
export function useDismissMatch() {
  return useMutation(api.ocpAdvisories.dismissMatch);
}

/**
 * Hook for locking a product
 */
export function useLockProduct() {
  return useMutation(api.ocpAdvisories.lockProduct);
}

/**
 * Hook for acknowledging a match
 */
export function useAcknowledgeMatch() {
  return useMutation(api.ocpAdvisories.acknowledgeMatch);
}

/**
 * Hook for creating a notification
 */
export function useCreateNotification() {
  return useMutation(api.complianceAlerts.createNotification);
}

/**
 * Hook for marking a notification as read
 */
export function useMarkNotificationRead() {
  return useMutation(api.complianceAlerts.markNotificationRead);
}

// ============================================================================
// COMPOSITE HOOKS
// ============================================================================

/**
 * Combined hook for compliance alert center page
 * Returns all data needed for the main alert center view
 */
export function useComplianceAlertCenter(
  dispensaryId: Id<"dispensaries"> | undefined
) {
  const summary = useComplianceDashboardSummary(dispensaryId);
  const activeAlerts = useActiveAlerts();
  const flaggedProducts = useFlaggedProducts(dispensaryId);
  const matches = useDispensaryMatches(dispensaryId);
  const notifications = useNotificationHistory(dispensaryId, 10);
  const unreadCount = useUnreadNotificationCount(dispensaryId);

  return {
    summary,
    activeAlerts,
    flaggedProducts,
    matches,
    notifications,
    unreadCount,
    isLoading:
      summary === undefined ||
      activeAlerts === undefined ||
      flaggedProducts === undefined,
  };
}

/**
 * Hook for resolution workflow modal
 */
export function useResolutionWorkflow(
  matchId: Id<"advisoryProductMatches"> | undefined,
  dispensaryId: Id<"dispensaries"> | undefined
) {
  const auditTrail = useResolutionAuditTrail(
    dispensaryId,
    matchId ? { matchId } : undefined
  );
  const resolveMatch = useResolveMatch();
  const dismissMatch = useDismissMatch();
  const lockProduct = useLockProduct();
  const acknowledgeMatch = useAcknowledgeMatch();

  return {
    auditTrail,
    resolveMatch,
    dismissMatch,
    lockProduct,
    acknowledgeMatch,
  };
}

// ============================================================================
// UTILITY TYPES FOR HOOK RETURNS
// ============================================================================

export type ResolveMatchParams = {
  matchId: Id<"advisoryProductMatches">;
  resolutionAction: ResolutionAction;
  notes?: string;
  quantityResolved?: number;
};

export type DismissMatchParams = {
  matchId: Id<"advisoryProductMatches">;
  reason: string;
};

export type LockProductParams = {
  matchId: Id<"advisoryProductMatches">;
};

export type AcknowledgeMatchParams = {
  matchId: Id<"advisoryProductMatches">;
};
