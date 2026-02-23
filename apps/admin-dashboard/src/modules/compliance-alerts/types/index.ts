/**
 * Compliance Alert Types
 * TypeScript interfaces for the OCP Advisory system
 */

import type { Id } from "@convex/_generated/dataModel";

// ============================================================================
// ENUMS
// ============================================================================

export type AdvisorySeverity = "critical" | "high" | "medium" | "low";
export type AdvisoryStatus = "active" | "resolved" | "expired" | "dismissed";
export type AdvisoryType = "recall" | "safety_alert" | "contamination" | "labeling" | "other";
export type ProductComplianceStatus = "clear" | "flagged" | "locked" | "under_review";
export type MatchStatus = "pending" | "confirmed" | "resolved" | "false_positive";
export type MatchType = "product_name" | "strain" | "brand" | "batch_number" | "license";
export type ResolutionAction =
  | "quarantine"
  | "destroy"
  | "return_to_vendor"
  | "relabel"
  | "customer_notification"
  | "no_action_required"
  | "other";
export type NotificationChannel = "email" | "in_app" | "sms";
export type NotificationStatus = "pending" | "sent" | "delivered" | "failed";

// ============================================================================
// ADVISORY
// ============================================================================

export interface OCPAdvisory {
  _id: Id<"ocpAdvisories">;
  _creationTime: number;
  ocpAdvisoryId: string;
  title: string;
  description: string;
  severity: AdvisorySeverity;
  advisoryType: AdvisoryType;
  status: AdvisoryStatus;
  sourceUrl: string;
  publishedAt: number;
  affectedProducts?: string[];
  affectedStrains?: string[];
  affectedBrands?: string[];
  affectedBatchNumbers?: string[];
  affectedLicenses?: string[];
  contaminants?: string[];
  recommendedAction?: string;
  regulatoryReference?: string;
  createdAt: number;
  updatedAt: number;
  processedAt?: number;
  expiresAt?: number;
  resolvedAt?: number;
}

// ============================================================================
// MATCHES
// ============================================================================

export interface AdvisoryProductMatch {
  _id: Id<"advisoryProductMatches">;
  _creationTime: number;
  advisoryId: Id<"ocpAdvisories">;
  productId: Id<"products">;
  dispensaryId: Id<"dispensaries">;
  matchType: MatchType;
  matchedValue: string;
  matchConfidence: number;
  status: MatchStatus;
  flaggedAt: number;
  acknowledgedAt?: number;
  acknowledgedBy?: Id<"users">;
  resolvedAt?: number;
  resolvedBy?: Id<"users">;
  resolutionAction?: ResolutionAction;
  resolutionNotes?: string;
  quantityAffected?: number;
  quantityResolved?: number;
  createdAt: number;
  updatedAt: number;
}

export interface EnrichedMatch extends AdvisoryProductMatch {
  advisory: OCPAdvisory | null;
  product: Product | null;
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export interface AlertNotification {
  _id: Id<"alertNotifications">;
  _creationTime: number;
  advisoryId: Id<"ocpAdvisories">;
  matchId?: Id<"advisoryProductMatches">;
  dispensaryId: Id<"dispensaries">;
  userId?: Id<"users">;
  channel: NotificationChannel;
  status: NotificationStatus;
  subject: string;
  body: string;
  recipientEmail?: string;
  createdAt: number;
  sentAt?: number;
  deliveredAt?: number;
  readAt?: number;
  failedAt?: number;
  failureReason?: string;
}

export interface EnrichedNotification extends AlertNotification {
  advisory: OCPAdvisory | null;
}

// ============================================================================
// RESOLUTION LOGS
// ============================================================================

export interface ComplianceResolutionLog {
  _id: Id<"complianceResolutionLogs">;
  _creationTime: number;
  advisoryId: Id<"ocpAdvisories">;
  matchId?: Id<"advisoryProductMatches">;
  productId?: Id<"products">;
  dispensaryId: Id<"dispensaries">;
  userId: Id<"users">;
  userEmail: string;
  userRole: string;
  action: string;
  previousStatus?: string;
  newStatus?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
  createdAt: number;
}

export interface EnrichedResolutionLog extends ComplianceResolutionLog {
  advisory: OCPAdvisory | null;
  product: Product | null;
  user: User | null;
}

// ============================================================================
// DASHBOARD SUMMARY
// ============================================================================

export interface ComplianceDashboardSummary {
  // Counts
  totalActiveMatches: number;
  pendingCount: number;
  confirmedCount: number;
  resolvedCount: number;
  falsePositiveCount: number;

  // By severity
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;

  // Response metrics
  avgResolutionTimeMs: number;
  avgResolutionTimeHours: number;

  // Advisory counts
  totalActiveAdvisories: number;

  // Products affected
  productsAffected: number;
}

// ============================================================================
// RESOLUTION METRICS
// ============================================================================

export interface ResolutionMetrics {
  totalActions: number;
  actionBreakdown: Record<string, number>;
  userBreakdown: Record<string, number>;
  resolutionsInPeriod: number;
  avgResolutionTimeHours: number;
  minResolutionTimeHours: number;
  maxResolutionTimeHours: number;
}

// ============================================================================
// COMPLIANCE REPORT
// ============================================================================

export interface ComplianceReportSummary {
  reportGeneratedAt: string;
  reportPeriod: {
    start: string;
    end: string;
  };
  dispensary: {
    name: string;
    licenseNumber: string;
  };
  totalMatches: number;
  byStatus: {
    pending: number;
    confirmed: number;
    resolved: number;
    falsePositive: number;
  };
  bySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  totalResolutionActions: number;
}

export interface ComplianceReportMatch {
  matchId: Id<"advisoryProductMatches">;
  advisoryId?: string;
  advisoryTitle?: string;
  advisorySeverity?: AdvisorySeverity;
  productName?: string;
  productSku?: string;
  productBrand?: string;
  productBatchNumber?: string;
  matchType: MatchType;
  matchedValue: string;
  matchConfidence: number;
  status: MatchStatus;
  flaggedAt: string;
  resolvedAt: string | null;
  resolvedBy?: string;
  resolutionAction?: ResolutionAction;
  resolutionNotes?: string;
  quantityAffected?: number;
  quantityResolved?: number;
}

export interface ComplianceReportAuditEntry {
  action: string;
  userEmail: string;
  userRole: string;
  previousStatus?: string;
  newStatus?: string;
  notes?: string;
  createdAt: string;
}

export interface ComplianceReport {
  summary: ComplianceReportSummary;
  matches: ComplianceReportMatch[];
  auditTrail: ComplianceReportAuditEntry[];
}

// ============================================================================
// PRODUCT (simplified for compliance context)
// ============================================================================

export interface Product {
  _id: Id<"products">;
  _creationTime: number;
  name: string;
  sku?: string;
  brand?: string;
  batchNumber?: string;
  dispensaryId: Id<"dispensaries">;
  complianceStatus?: ProductComplianceStatus;
  complianceFlagId?: Id<"advisoryProductMatches">;
  complianceLockedAt?: number;
  complianceLockedBy?: Id<"users">;
}

export interface FlaggedProduct extends Product {
  complianceMatch: AdvisoryProductMatch | null;
  advisory: OCPAdvisory | null;
}

// ============================================================================
// USER (simplified for compliance context)
// ============================================================================

export interface User {
  _id: Id<"users">;
  email: string;
  fullName?: string;
  role?: string;
}

// ============================================================================
// SEVERITY HELPERS
// ============================================================================

export const SEVERITY_CONFIG: Record<
  AdvisorySeverity,
  { label: string; color: string; bgColor: string; priority: number }
> = {
  critical: {
    label: "Critical",
    color: "red.600",
    bgColor: "red.50",
    priority: 4,
  },
  high: {
    label: "High",
    color: "orange.600",
    bgColor: "orange.50",
    priority: 3,
  },
  medium: {
    label: "Medium",
    color: "yellow.600",
    bgColor: "yellow.50",
    priority: 2,
  },
  low: {
    label: "Low",
    color: "blue.600",
    bgColor: "blue.50",
    priority: 1,
  },
};

export const STATUS_CONFIG: Record<
  MatchStatus,
  { label: string; color: string; bgColor: string }
> = {
  pending: {
    label: "Pending Review",
    color: "yellow.600",
    bgColor: "yellow.50",
  },
  confirmed: {
    label: "Confirmed",
    color: "red.600",
    bgColor: "red.50",
  },
  resolved: {
    label: "Resolved",
    color: "green.600",
    bgColor: "green.50",
  },
  false_positive: {
    label: "False Positive",
    color: "gray.600",
    bgColor: "gray.50",
  },
};

export const RESOLUTION_ACTIONS: Record<ResolutionAction, { label: string; description: string }> = {
  quarantine: {
    label: "Quarantine",
    description: "Move products to quarantine area pending further action",
  },
  destroy: {
    label: "Destroy",
    description: "Dispose of affected products according to regulations",
  },
  return_to_vendor: {
    label: "Return to Vendor",
    description: "Return products to the supplier for credit or replacement",
  },
  relabel: {
    label: "Relabel",
    description: "Update product labels to correct labeling issues",
  },
  customer_notification: {
    label: "Customer Notification",
    description: "Notify customers who purchased affected products",
  },
  no_action_required: {
    label: "No Action Required",
    description: "Product verified safe - no action needed",
  },
  other: {
    label: "Other",
    description: "Custom resolution action (specify in notes)",
  },
};
