import { useDateRange } from '../stores/analyticsStore';
import type {
  ComplianceFlagStatus,
  ComplianceFlagSeverity,
  ComplianceFlagCategory,
} from '../modules/compliance/types';

/**
 * Compliance Hooks (Stub Implementation)
 * Returns placeholder data until Convex compliance functions are implemented
 */

// Query keys for compatibility
export const complianceKeys = {
  all: ['compliance'] as const,
  summary: (dateRange: ReturnType<typeof useDateRange>) =>
    [...complianceKeys.all, 'summary', dateRange] as const,
  flags: (filters?: {
    status?: ComplianceFlagStatus;
    severity?: ComplianceFlagSeverity;
    category?: ComplianceFlagCategory;
  }) => [...complianceKeys.all, 'flags', filters] as const,
  auditLogs: (dateRange: ReturnType<typeof useDateRange>, limit?: number) =>
    [...complianceKeys.all, 'audit-logs', dateRange, limit] as const,
  licenses: () => [...complianceKeys.all, 'licenses'] as const,
  metrics: (dateRange: ReturnType<typeof useDateRange>) =>
    [...complianceKeys.all, 'metrics', dateRange] as const,
};

/**
 * Get compliance summary
 * Returns both camelCase and snake_case for compatibility
 */
export function useComplianceSummary() {
  useDateRange();

  return {
    data: {
      // snake_case for ComplianceSummaryMetrics component
      total_flags: 3,
      open_flags: 2,
      critical_flags: 0,
      high_priority_flags: 2,
      resolved_last_30_days: 1,
      avg_resolution_time_hours: 4.2,
      // camelCase for legacy compatibility
      totalFlags: 3,
      openFlags: 2,
      resolvedFlags: 1,
      criticalFlags: 0,
      warningFlags: 2,
      infoFlags: 1,
      complianceScore: 94,
    },
    isLoading: false,
    error: null,
    isError: false,
  };
}

/**
 * Get compliance flags
 */
export function useComplianceFlags(_filters?: {
  status?: ComplianceFlagStatus;
  severity?: ComplianceFlagSeverity;
  category?: ComplianceFlagCategory;
}) {
  return {
    data: [
      {
        id: 'flag-1',
        category: 'inventory' as ComplianceFlagCategory,
        severity: 'warning' as ComplianceFlagSeverity,
        status: 'open' as ComplianceFlagStatus,
        title: 'Low inventory threshold reached',
        description: '3 products below minimum stock levels',
        createdAt: new Date().toISOString(),
        productId: null,
        customerId: null,
      },
      {
        id: 'flag-2',
        category: 'documentation' as ComplianceFlagCategory,
        severity: 'warning' as ComplianceFlagSeverity,
        status: 'open' as ComplianceFlagStatus,
        title: 'License renewal due',
        description: 'State license expires in 30 days',
        createdAt: new Date().toISOString(),
        productId: null,
        customerId: null,
      },
    ],
    isLoading: false,
    error: null,
    isError: false,
  };
}

/**
 * Get audit logs
 */
export function useAuditLogs(_limit: number = 50) {
  useDateRange();

  return {
    data: [
      {
        id: 'log-1',
        action: 'product.create',
        userId: 'user-1',
        userName: 'Admin User',
        details: 'Created product: Blue Dream',
        timestamp: new Date().toISOString(),
        ipAddress: '192.168.1.1',
      },
      {
        id: 'log-2',
        action: 'transaction.complete',
        userId: 'user-2',
        userName: 'Alex Johnson',
        details: 'Completed sale #1234 for $85.00',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        ipAddress: '192.168.1.5',
      },
    ],
    isLoading: false,
    error: null,
    isError: false,
  };
}

/**
 * Get licenses
 */
export function useLicenses() {
  return {
    data: [
      {
        id: 'license-1',
        type: 'retail',
        number: 'MJ-RET-2024-001234',
        issuedBy: 'State Cannabis Authority',
        issuedDate: '2024-01-01',
        expiryDate: '2025-01-01',
        status: 'active',
      },
      {
        id: 'license-2',
        type: 'medical',
        number: 'MJ-MED-2024-005678',
        issuedBy: 'State Health Department',
        issuedDate: '2024-01-01',
        expiryDate: '2025-01-01',
        status: 'active',
      },
    ],
    isLoading: false,
    error: null,
    isError: false,
  };
}

/**
 * Get compliance metrics
 */
export function useComplianceMetrics() {
  useDateRange();

  return {
    data: {
      compliance_score: 94, // Required by CompliancePage ComplianceScoreCard
      inventoryAccuracy: 98.5,
      documentationComplete: 100,
      auditReadiness: 95,
      trainingCompliance: 100,
      incidentResponseTime: 2.5, // hours
    },
    isLoading: false,
    error: null,
    isError: false,
  };
}
