/**
 * Compliance Module Types
 * Types for regulatory compliance, audit logs, and reporting
 */

export type ComplianceFlagSeverity = 'critical' | 'high' | 'medium' | 'low';
export type ComplianceFlagStatus = 'open' | 'in_progress' | 'resolved' | 'dismissed';
export type ComplianceFlagCategory =
  | 'age_verification'
  | 'purchase_limits'
  | 'inventory_discrepancy'
  | 'license_expiration'
  | 'metrc_sync'
  | 'staff_certification'
  | 'regulatory_reporting'
  | 'security';

export interface ComplianceFlag {
  id: string;
  category: ComplianceFlagCategory;
  severity: ComplianceFlagSeverity;
  status: ComplianceFlagStatus;
  title: string;
  description: string;
  detected_at: string;
  resolved_at?: string;
  assigned_to?: string;
  related_entity?: {
    type: 'transaction' | 'product' | 'staff' | 'license';
    id: string;
    name: string;
  };
  actions_taken?: string[];
}

export interface ComplianceSummary {
  total_flags: number;
  open_flags: number;
  critical_flags: number;
  high_priority_flags: number;
  resolved_last_30_days: number;
  avg_resolution_time_hours: number;
  flags_by_category: Record<ComplianceFlagCategory, number>;
  flags_by_severity: Record<ComplianceFlagSeverity, number>;
}

export type AuditAction =
  | 'user_login'
  | 'user_logout'
  | 'transaction_void'
  | 'transaction_refund'
  | 'inventory_adjustment'
  | 'price_override'
  | 'compliance_flag_created'
  | 'compliance_flag_resolved'
  | 'report_generated'
  | 'system_config_change';

export interface AuditLog {
  id: string;
  timestamp: string;
  action: AuditAction;
  user_id: string;
  user_name: string;
  entity_type?: string;
  entity_id?: string;
  details: string;
  ip_address?: string;
  metadata?: Record<string, any>;
}

export interface License {
  id: string;
  type: 'business' | 'staff' | 'operational';
  name: string;
  license_number: string;
  issued_date: string;
  expiration_date: string;
  status: 'active' | 'expiring_soon' | 'expired' | 'pending_renewal';
  issuing_authority: string;
  renewal_required: boolean;
  holder_name?: string;
}

export interface ComplianceReport {
  id: string;
  type: 'metrc' | 'state_tax' | 'inventory_reconciliation' | 'sales_summary';
  name: string;
  period_start: string;
  period_end: string;
  generated_at: string;
  generated_by: string;
  status: 'draft' | 'submitted' | 'accepted' | 'rejected';
  file_url?: string;
}

export interface ComplianceMetrics {
  compliance_score: number; // 0-100
  flags_trend: {
    date: string;
    count: number;
    critical_count: number;
  }[];
  resolution_time_trend: {
    date: string;
    avg_hours: number;
  }[];
  category_breakdown: {
    category: ComplianceFlagCategory;
    count: number;
    percentage: number;
  }[];
}
