import { useQuery } from '@tanstack/react-query';
import { complianceService } from '../services/api/compliance.service';
import { useDateRange } from '../stores/analyticsStore';
import type {
  ComplianceFlagStatus,
  ComplianceFlagSeverity,
  ComplianceFlagCategory,
} from '../modules/compliance/types';

/**
 * Compliance Query Keys
 */
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
 */
export function useComplianceSummary() {
  const dateRange = useDateRange();

  return useQuery({
    queryKey: complianceKeys.summary(dateRange),
    queryFn: () => complianceService.getComplianceSummary(dateRange),
    staleTime: 5 * 60_000, // 5 minutes
  });
}

/**
 * Get compliance flags
 */
export function useComplianceFlags(filters?: {
  status?: ComplianceFlagStatus;
  severity?: ComplianceFlagSeverity;
  category?: ComplianceFlagCategory;
}) {
  return useQuery({
    queryKey: complianceKeys.flags(filters),
    queryFn: () => complianceService.getComplianceFlags(filters),
    staleTime: 2 * 60_000, // 2 minutes - more frequent updates for compliance
  });
}

/**
 * Get audit logs
 */
export function useAuditLogs(limit: number = 50) {
  const dateRange = useDateRange();

  return useQuery({
    queryKey: complianceKeys.auditLogs(dateRange, limit),
    queryFn: () => complianceService.getAuditLogs(dateRange, limit),
    staleTime: 1 * 60_000, // 1 minute
  });
}

/**
 * Get licenses
 */
export function useLicenses() {
  return useQuery({
    queryKey: complianceKeys.licenses(),
    queryFn: () => complianceService.getLicenses(),
    staleTime: 10 * 60_000, // 10 minutes - licenses don't change frequently
  });
}

/**
 * Get compliance metrics
 */
export function useComplianceMetrics() {
  const dateRange = useDateRange();

  return useQuery({
    queryKey: complianceKeys.metrics(dateRange),
    queryFn: () => complianceService.getComplianceMetrics(dateRange),
    staleTime: 5 * 60_000, // 5 minutes
  });
}
