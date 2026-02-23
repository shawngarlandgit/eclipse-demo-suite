import type {
  ComplianceFlag,
  ComplianceSummary,
  AuditLog,
  License,
  ComplianceReport,
  ComplianceMetrics,
  ComplianceFlagSeverity,
  ComplianceFlagStatus,
  ComplianceFlagCategory,
} from '../../modules/compliance/types';
import type { DateRange } from '../../stores/analyticsStore';

/**
 * Compliance Service
 * Handles compliance flags, audit logs, licenses, and reporting
 */

class ComplianceService {
  /**
   * Get compliance summary metrics
   */
  async getComplianceSummary(dateRange: DateRange): Promise<ComplianceSummary> {
    await this.simulateDelay();

    const flagsByCategory: Record<ComplianceFlagCategory, number> = {
      age_verification: 2,
      purchase_limits: 1,
      inventory_discrepancy: 5,
      license_expiration: 3,
      metrc_sync: 2,
      staff_certification: 4,
      regulatory_reporting: 1,
      security: 2,
    };

    const flagsBySeverity: Record<ComplianceFlagSeverity, number> = {
      critical: 3,
      high: 7,
      medium: 8,
      low: 2,
    };

    return {
      total_flags: 20,
      open_flags: 12,
      critical_flags: 3,
      high_priority_flags: 7,
      resolved_last_30_days: 15,
      avg_resolution_time_hours: 18.5,
      flags_by_category: flagsByCategory,
      flags_by_severity: flagsBySeverity,
    };
  }

  /**
   * Get compliance flags
   */
  async getComplianceFlags(
    filters?: {
      status?: ComplianceFlagStatus;
      severity?: ComplianceFlagSeverity;
      category?: ComplianceFlagCategory;
    }
  ): Promise<ComplianceFlag[]> {
    await this.simulateDelay();

    const now = new Date();

    const flags: ComplianceFlag[] = [
      {
        id: 'flag-1',
        category: 'inventory_discrepancy',
        severity: 'critical',
        status: 'open',
        title: 'Inventory Count Mismatch - Blue Dream',
        description: 'Physical count shows 45 units, system shows 52 units. Discrepancy of 7 units detected.',
        detected_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        related_entity: {
          type: 'product',
          id: 'prod-1',
          name: 'Blue Dream (1/8oz)',
        },
      },
      {
        id: 'flag-2',
        category: 'license_expiration',
        severity: 'critical',
        status: 'open',
        title: 'Business License Expiring Soon',
        description: 'State cannabis retail license expires in 14 days. Renewal application must be submitted.',
        detected_at: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
        related_entity: {
          type: 'license',
          id: 'lic-1',
          name: 'Cannabis Retail License #CR-2024-1234',
        },
      },
      {
        id: 'flag-3',
        category: 'metrc_sync',
        severity: 'critical',
        status: 'in_progress',
        title: 'Metrc Sync Failure',
        description: '3 transactions failed to sync with Metrc state tracking system. Manual reconciliation required.',
        detected_at: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
        assigned_to: 'Mike Chen',
        actions_taken: ['Reviewed failed transactions', 'Contacted Metrc support'],
      },
      {
        id: 'flag-4',
        category: 'staff_certification',
        severity: 'high',
        status: 'open',
        title: 'Staff Training Certifications Expiring',
        description: '4 staff members have cannabis handler certifications expiring within 30 days.',
        detected_at: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'flag-5',
        category: 'age_verification',
        severity: 'high',
        status: 'resolved',
        title: 'Failed Age Verification Attempt',
        description: 'Customer attempted purchase with invalid ID. Transaction blocked by system.',
        detected_at: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(),
        resolved_at: new Date(now.getTime() - 46 * 60 * 60 * 1000).toISOString(),
        actions_taken: ['ID confiscated', 'Incident report filed', 'Customer banned'],
      },
      {
        id: 'flag-6',
        category: 'purchase_limits',
        severity: 'high',
        status: 'open',
        title: 'Daily Purchase Limit Exceeded Attempt',
        description: 'Customer attempted to purchase above state daily limit (1oz). System blocked transaction.',
        detected_at: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'flag-7',
        category: 'inventory_discrepancy',
        severity: 'medium',
        status: 'in_progress',
        title: 'Batch Tracking Incomplete',
        description: 'Batch #BT-2024-0892 missing final package weights. Complete before month-end reporting.',
        detected_at: new Date(now.getTime() - 18 * 60 * 60 * 1000).toISOString(),
        assigned_to: 'Sarah Johnson',
      },
      {
        id: 'flag-8',
        category: 'regulatory_reporting',
        severity: 'high',
        status: 'open',
        title: 'Monthly Tax Report Due',
        description: 'State cannabis tax report due in 5 days. Ensure all transactions are reconciled.',
        detected_at: new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'flag-9',
        category: 'security',
        severity: 'medium',
        status: 'resolved',
        title: 'Security Camera Offline',
        description: 'Camera #4 (storage area) went offline for 2 hours. Footage gap documented.',
        detected_at: new Date(now.getTime() - 96 * 60 * 60 * 1000).toISOString(),
        resolved_at: new Date(now.getTime() - 90 * 60 * 60 * 1000).toISOString(),
        actions_taken: ['Camera reset', 'Backup footage verified', 'Maintenance scheduled'],
      },
      {
        id: 'flag-10',
        category: 'staff_certification',
        severity: 'medium',
        status: 'open',
        title: 'New Staff Pending Certification',
        description: '2 new hires require state-mandated training completion within 14 days.',
        detected_at: new Date(now.getTime() - 36 * 60 * 60 * 1000).toISOString(),
      },
    ];

    // Apply filters
    let filtered = flags;
    if (filters?.status) {
      filtered = filtered.filter(f => f.status === filters.status);
    }
    if (filters?.severity) {
      filtered = filtered.filter(f => f.severity === filters.severity);
    }
    if (filters?.category) {
      filtered = filtered.filter(f => f.category === filters.category);
    }

    return filtered;
  }

  /**
   * Get audit logs
   */
  async getAuditLogs(dateRange: DateRange, limit: number = 50): Promise<AuditLog[]> {
    await this.simulateDelay();

    const now = new Date();
    const logs: AuditLog[] = [];

    // Generate sample audit logs
    const actions: Array<{ action: AuditLog['action']; details: string; user: string }> = [
      { action: 'user_login', details: 'User logged in successfully', user: 'Sarah Johnson' },
      { action: 'transaction_void', details: 'Transaction #TXN-2024-1234 voided - customer request', user: 'Mike Chen' },
      { action: 'inventory_adjustment', details: 'Adjusted inventory for Blue Dream: -7 units (damaged)', user: 'Sarah Johnson' },
      { action: 'price_override', details: 'Price override applied: 10% employee discount', user: 'Lisa Wong' },
      { action: 'compliance_flag_created', details: 'Created flag: Inventory Count Mismatch', user: 'System' },
      { action: 'compliance_flag_resolved', details: 'Resolved flag: Failed Age Verification Attempt', user: 'Mike Chen' },
      { action: 'report_generated', details: 'Generated monthly sales summary report', user: 'Sarah Johnson' },
      { action: 'transaction_refund', details: 'Refund processed: $45.50 - product quality issue', user: 'Mike Chen' },
      { action: 'system_config_change', details: 'Updated tax rate: 25% -> 26%', user: 'Admin' },
      { action: 'user_logout', details: 'User logged out', user: 'Lisa Wong' },
    ];

    for (let i = 0; i < limit; i++) {
      const actionData = actions[i % actions.length];
      logs.push({
        id: `audit-${i + 1}`,
        timestamp: new Date(now.getTime() - i * 30 * 60 * 1000).toISOString(),
        action: actionData.action,
        user_id: `user-${i % 5}`,
        user_name: actionData.user,
        details: actionData.details,
        ip_address: `192.168.1.${100 + (i % 50)}`,
      });
    }

    return logs;
  }

  /**
   * Get licenses
   */
  async getLicenses(): Promise<License[]> {
    await this.simulateDelay();

    const now = new Date();
    const in15Days = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
    const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    const in180Days = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
    const in365Days = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

    return [
      {
        id: 'lic-1',
        type: 'business',
        name: 'Cannabis Retail License',
        license_number: 'CR-2024-1234',
        issued_date: '2024-01-15',
        expiration_date: in15Days.toISOString().split('T')[0],
        status: 'expiring_soon',
        issuing_authority: 'State Cannabis Control Board',
        renewal_required: true,
      },
      {
        id: 'lic-2',
        type: 'operational',
        name: 'Health Department Permit',
        license_number: 'HD-2024-5678',
        issued_date: '2024-03-01',
        expiration_date: in90Days.toISOString().split('T')[0],
        status: 'active',
        issuing_authority: 'County Health Department',
        renewal_required: true,
      },
      {
        id: 'lic-3',
        type: 'operational',
        name: 'Fire Safety Certificate',
        license_number: 'FS-2024-9012',
        issued_date: '2024-02-10',
        expiration_date: in180Days.toISOString().split('T')[0],
        status: 'active',
        issuing_authority: 'Fire Marshal Office',
        renewal_required: true,
      },
      {
        id: 'lic-4',
        type: 'business',
        name: 'Business Operations License',
        license_number: 'BOL-2024-3456',
        issued_date: '2024-01-01',
        expiration_date: in365Days.toISOString().split('T')[0],
        status: 'active',
        issuing_authority: 'City Business Affairs',
        renewal_required: true,
      },
      {
        id: 'lic-5',
        type: 'staff',
        name: 'Cannabis Handler Certification - Sarah Johnson',
        license_number: 'CHC-2024-7890',
        issued_date: '2024-04-01',
        expiration_date: in90Days.toISOString().split('T')[0],
        status: 'active',
        issuing_authority: 'State Cannabis Training Board',
        renewal_required: true,
        holder_name: 'Sarah Johnson',
      },
    ];
  }

  /**
   * Get compliance metrics
   */
  async getComplianceMetrics(dateRange: DateRange): Promise<ComplianceMetrics> {
    await this.simulateDelay();

    const now = new Date();
    const flagsTrend = [];
    const resolutionTimeTrend = [];

    // Generate 30 days of trend data
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      flagsTrend.push({
        date: date.toISOString().split('T')[0],
        count: Math.floor(Math.random() * 8) + 2,
        critical_count: Math.floor(Math.random() * 3),
      });
      resolutionTimeTrend.push({
        date: date.toISOString().split('T')[0],
        avg_hours: Math.random() * 30 + 10,
      });
    }

    const categoryBreakdown = [
      { category: 'inventory_discrepancy' as ComplianceFlagCategory, count: 5, percentage: 25 },
      { category: 'staff_certification' as ComplianceFlagCategory, count: 4, percentage: 20 },
      { category: 'license_expiration' as ComplianceFlagCategory, count: 3, percentage: 15 },
      { category: 'age_verification' as ComplianceFlagCategory, count: 2, percentage: 10 },
      { category: 'metrc_sync' as ComplianceFlagCategory, count: 2, percentage: 10 },
      { category: 'security' as ComplianceFlagCategory, count: 2, percentage: 10 },
      { category: 'purchase_limits' as ComplianceFlagCategory, count: 1, percentage: 5 },
      { category: 'regulatory_reporting' as ComplianceFlagCategory, count: 1, percentage: 5 },
    ];

    return {
      compliance_score: 87,
      flags_trend: flagsTrend,
      resolution_time_trend: resolutionTimeTrend,
      category_breakdown: categoryBreakdown,
    };
  }

  private simulateDelay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200));
  }
}

export const complianceService = new ComplianceService();
