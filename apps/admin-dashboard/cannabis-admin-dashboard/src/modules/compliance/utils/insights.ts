import type { ComplianceSummary, ComplianceFlag, License } from '../types';

/**
 * Compliance Insights Generator
 * Generates smart, contextual insights based on compliance data
 */

export interface Insight {
  id: string;
  type: 'success' | 'warning' | 'info' | 'neutral';
  title: string;
  description: string;
  icon?: string;
}

/**
 * Generate insights from compliance summary
 */
export function generateComplianceSummaryInsights(summary: ComplianceSummary): Insight[] {
  const insights: Insight[] = [];

  // Critical flags insight
  if (summary.critical_flags > 0) {
    insights.push({
      id: 'critical-flags',
      type: 'warning',
      title: 'Critical Compliance Issues',
      description: `${summary.critical_flags} critical flag${summary.critical_flags > 1 ? 's' : ''} requiring immediate attention. Address these to avoid regulatory penalties.`,
    });
  } else if (summary.open_flags === 0) {
    insights.push({
      id: 'no-open-flags',
      type: 'success',
      title: 'All Clear!',
      description: 'No open compliance flags. Great job maintaining regulatory standards!',
    });
  }

  // Resolution time insight
  if (summary.avg_resolution_time_hours < 24) {
    insights.push({
      id: 'fast-resolution',
      type: 'success',
      title: 'Rapid Response Team',
      description: `Average resolution time of ${summary.avg_resolution_time_hours.toFixed(1)} hours. Team is resolving issues quickly!`,
    });
  } else if (summary.avg_resolution_time_hours > 48) {
    insights.push({
      id: 'slow-resolution',
      type: 'warning',
      title: 'Resolution Time High',
      description: `Flags taking ${summary.avg_resolution_time_hours.toFixed(1)} hours to resolve. Consider additional resources or training.`,
    });
  }

  // Open flags insight
  if (summary.open_flags > 15) {
    insights.push({
      id: 'high-open-flags',
      type: 'warning',
      title: 'High Number of Open Issues',
      description: `${summary.open_flags} open flags need attention. Prioritize critical and high-severity items.`,
    });
  }

  return insights;
}

/**
 * Generate insights from compliance flags
 */
export function generateFlagsInsights(flags: ComplianceFlag[]): Insight[] {
  const insights: Insight[] = [];

  if (flags.length === 0) return insights;

  // Category concentration insight
  const categoryCount: Record<string, number> = {};
  flags.forEach(flag => {
    categoryCount[flag.category] = (categoryCount[flag.category] || 0) + 1;
  });

  const topCategory = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0];
  if (topCategory && topCategory[1] >= 3) {
    const categoryName = topCategory[0].split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    insights.push({
      id: 'category-pattern',
      type: 'info',
      title: `${categoryName} Pattern Detected`,
      description: `${topCategory[1]} flags in this category. Review processes and implement preventive measures.`,
    });
  }

  // Unassigned flags insight
  const unassigned = flags.filter(f => f.status === 'open' && !f.assigned_to);
  if (unassigned.length > 0) {
    insights.push({
      id: 'unassigned-flags',
      type: 'warning',
      title: 'Unassigned Compliance Flags',
      description: `${unassigned.length} open flag${unassigned.length > 1 ? 's' : ''} not yet assigned. Designate responsible parties for faster resolution.`,
    });
  }

  // In-progress insight
  const inProgress = flags.filter(f => f.status === 'in_progress');
  if (inProgress.length > 0) {
    insights.push({
      id: 'in-progress',
      type: 'info',
      title: 'Active Remediation',
      description: `${inProgress.length} compliance issue${inProgress.length > 1 ? 's' : ''} currently being addressed. Good progress!`,
    });
  }

  return insights;
}

/**
 * Generate insights from licenses
 */
export function generateLicenseInsights(licenses: License[]): Insight[] {
  const insights: Insight[] = [];

  if (licenses.length === 0) return insights;

  // Expiring soon licenses
  const expiringSoon = licenses.filter(l => l.status === 'expiring_soon');
  if (expiringSoon.length > 0) {
    const businessLicenses = expiringSoon.filter(l => l.type === 'business');
    if (businessLicenses.length > 0) {
      insights.push({
        id: 'business-license-expiring',
        type: 'warning',
        title: 'Business License Renewal Needed',
        description: `${businessLicenses.length} business license${businessLicenses.length > 1 ? 's' : ''} expiring soon. Submit renewal applications immediately.`,
      });
    } else {
      insights.push({
        id: 'licenses-expiring',
        type: 'warning',
        title: 'License Renewals Due',
        description: `${expiringSoon.length} license${expiringSoon.length > 1 ? 's' : ''} expiring soon. Plan renewal process to avoid operational disruptions.`,
      });
    }
  }

  // Expired licenses
  const expired = licenses.filter(l => l.status === 'expired');
  if (expired.length > 0) {
    insights.push({
      id: 'expired-licenses',
      type: 'warning',
      title: 'Expired Licenses Detected',
      description: `${expired.length} license${expired.length > 1 ? 's have' : ' has'} expired. Take immediate action to restore compliance.`,
    });
  }

  // All licenses current
  if (expiringSoon.length === 0 && expired.length === 0) {
    insights.push({
      id: 'licenses-current',
      type: 'success',
      title: 'All Licenses Current',
      description: 'All licenses and certifications are active with no imminent expirations. Excellent compliance!',
    });
  }

  // Staff certifications insight
  const staffCerts = licenses.filter(l => l.type === 'staff');
  if (staffCerts.length > 0) {
    const expiringStaffCerts = staffCerts.filter(l => l.status === 'expiring_soon');
    if (expiringStaffCerts.length > 0) {
      insights.push({
        id: 'staff-certs-expiring',
        type: 'info',
        title: 'Staff Training Renewals Needed',
        description: `${expiringStaffCerts.length} staff certification${expiringStaffCerts.length > 1 ? 's' : ''} expiring. Schedule training sessions soon.`,
      });
    }
  }

  return insights;
}

/**
 * Generate time-based compliance insights
 */
export function generateComplianceTimeInsights(): Insight[] {
  const insights: Insight[] = [];
  const day = new Date().getDate();
  const month = new Date().getMonth();

  // Month-end reporting reminder
  if (day >= 25) {
    insights.push({
      id: 'month-end-reporting',
      type: 'info',
      title: 'Month-End Reporting Approaching',
      description: 'Ensure all compliance reports and tax filings are prepared for month-end submission.',
    });
  }

  // Quarterly reporting
  if ([2, 5, 8, 11].includes(month) && day >= 20) {
    insights.push({
      id: 'quarterly-reporting',
      type: 'info',
      title: 'Quarterly Compliance Review Due',
      description: 'Quarter-end approaching. Prepare comprehensive compliance reports for state regulators.',
    });
  }

  // Audit preparation
  if (month === 0 && day <= 15) {
    insights.push({
      id: 'annual-audit-prep',
      type: 'info',
      title: 'Annual Audit Season',
      description: 'Start of year - ideal time to review compliance procedures and prepare for potential audits.',
    });
  }

  return insights;
}
