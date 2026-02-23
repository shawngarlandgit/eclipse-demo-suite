/**
 * Supplier Risk Scoring Types
 * TypeScript interfaces for the Supplier Risk system
 */

import type { Id } from "@convex/_generated/dataModel";

// ============================================================================
// ENUMS
// ============================================================================

export type SupplierLicenseType =
  | "grower"
  | "caregiver"
  | "processor"
  | "distributor"
  | "manufacturer"
  | "other";

export type RiskTier = "low" | "medium" | "high" | "critical";
export type RiskTrend = "improving" | "stable" | "worsening";
export type IncidentType =
  | "contamination"
  | "recall"
  | "labeling"
  | "quality"
  | "documentation"
  | "other";
export type IncidentSeverity = "critical" | "high" | "medium" | "low";

// ============================================================================
// SUPPLIER
// ============================================================================

export interface Supplier {
  _id: Id<"suppliers">;
  _creationTime: number;
  name: string;
  licenseNumber: string;
  licenseType: SupplierLicenseType;
  address?: string;
  city?: string;
  state?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  firstSeenAt: number;
  lastActivityAt?: number;
  isActive?: boolean;
  notes?: string;
  metadata?: Record<string, unknown>;
  createdAt: number;
  updatedAt?: number;
}

// ============================================================================
// RISK PROFILE
// ============================================================================

export interface SupplierRiskProfile {
  _id: Id<"supplierRiskProfiles">;
  _creationTime: number;
  supplierId: Id<"suppliers">;
  dispensaryId: Id<"dispensaries">;
  riskScore: number;
  riskTier: RiskTier;
  totalBatches: number;
  contaminationCount: number;
  recallCount: number;
  labelingIssueCount: number;
  qualityIssueCount?: number;
  lastIncidentDate?: number;
  daysSinceLastIncident?: number;
  trend: RiskTrend;
  trendDirection: number;
  previousScore?: number;
  scoreChange?: number;
  incidentRate: number;
  calculatedAt: number;
  calculationVersion?: string;
  createdAt: number;
  updatedAt?: number;
}

export interface EnrichedRiskProfile extends SupplierRiskProfile {
  supplier: Supplier | null;
  tierConfig: TierConfig;
}

// ============================================================================
// INCIDENTS
// ============================================================================

export interface SupplierIncident {
  _id: Id<"supplierIncidents">;
  _creationTime: number;
  supplierId: Id<"suppliers">;
  advisoryId?: Id<"ocpAdvisories">;
  dispensaryId: Id<"dispensaries">;
  incidentType: IncidentType;
  severity: IncidentSeverity;
  title: string;
  description: string;
  affectedBatches?: string[];
  affectedProducts?: string[];
  affectedQuantity?: number;
  contaminants?: string[];
  contaminantDetails?: string;
  incidentDate: number;
  reportedAt: number;
  resolvedAt?: number;
  resolutionNotes?: string;
  resolutionAction?: string;
  sourceType?: string;
  sourceReference?: string;
  evidence?: Record<string, unknown>;
  reportedBy?: Id<"users">;
  resolvedBy?: Id<"users">;
  createdAt: number;
  updatedAt?: number;
}

export interface EnrichedIncident extends SupplierIncident {
  advisory?: {
    _id: Id<"ocpAdvisories">;
    ocpAdvisoryId: string;
    title: string;
  } | null;
}

// ============================================================================
// DASHBOARD SUMMARY
// ============================================================================

export interface RiskDashboardSummary {
  totalSuppliers: number;
  tierCounts: Record<RiskTier, number>;
  avgRiskScore: number;
  recentIncidentCount: number;
  worseningSupplierCount: number;
  productsAtRisk: number;
  highRiskCount: number;
}

// ============================================================================
// SUPPLIER PROFILE (Full Detail)
// ============================================================================

export interface SupplierFullProfile {
  supplier: Supplier;
  profile: SupplierRiskProfile | null;
  incidents: SupplierIncident[];
  products: Array<{
    _id: Id<"products">;
    name: string;
    sku: string;
    category: string;
    brand?: string;
  }>;
  incidentCounts: Record<IncidentType, number>;
  tierConfig: TierConfig | null;
}

// ============================================================================
// UI CONFIGURATION
// ============================================================================

export interface TierConfig {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  priority: number;
  description: string;
}

export interface TrendConfig {
  label: string;
  color: string;
  icon: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const TIER_CONFIGS: Record<RiskTier, TierConfig> = {
  critical: {
    label: "Critical Risk",
    color: "red.600",
    bgColor: "red.50",
    borderColor: "red.200",
    priority: 4,
    description: "Block orders, immediate action required",
  },
  high: {
    label: "High Risk",
    color: "orange.600",
    bgColor: "orange.50",
    borderColor: "orange.200",
    priority: 3,
    description: "Warn before ordering, review needed",
  },
  medium: {
    label: "Medium Risk",
    color: "yellow.600",
    bgColor: "yellow.50",
    borderColor: "yellow.200",
    priority: 2,
    description: "Monitor closely",
  },
  low: {
    label: "Low Risk",
    color: "green.600",
    bgColor: "green.50",
    borderColor: "green.200",
    priority: 1,
    description: "Normal operations",
  },
};

export const TREND_CONFIGS: Record<RiskTrend, TrendConfig> = {
  improving: {
    label: "Improving",
    color: "green.500",
    icon: "trending-down",
  },
  stable: {
    label: "Stable",
    color: "gray.500",
    icon: "minus",
  },
  worsening: {
    label: "Worsening",
    color: "red.500",
    icon: "trending-up",
  },
};

export const INCIDENT_TYPE_LABELS: Record<IncidentType, string> = {
  contamination: "Contamination",
  recall: "Recall",
  labeling: "Labeling Issue",
  quality: "Quality Issue",
  documentation: "Documentation",
  other: "Other",
};

export const SEVERITY_CONFIGS: Record<
  IncidentSeverity,
  { label: string; color: string; bgColor: string }
> = {
  critical: {
    label: "Critical",
    color: "red.600",
    bgColor: "red.50",
  },
  high: {
    label: "High",
    color: "orange.600",
    bgColor: "orange.50",
  },
  medium: {
    label: "Medium",
    color: "yellow.600",
    bgColor: "yellow.50",
  },
  low: {
    label: "Low",
    color: "blue.600",
    bgColor: "blue.50",
  },
};

export const LICENSE_TYPE_LABELS: Record<SupplierLicenseType, string> = {
  grower: "Grower",
  caregiver: "Caregiver",
  processor: "Processor",
  distributor: "Distributor",
  manufacturer: "Manufacturer",
  other: "Other",
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function formatDaysSinceIncident(days: number | null | undefined): string {
  if (days === null || days === undefined) return "No incidents";
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  if (days < 60) return "1 month ago";
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  if (days < 730) return "1 year ago";
  return `${Math.floor(days / 365)} years ago`;
}

export function getRiskScoreColor(score: number): string {
  if (score >= 70) return "red.500";
  if (score >= 50) return "orange.500";
  if (score >= 25) return "yellow.500";
  return "green.500";
}

export function getRiskScoreGradient(score: number): string {
  if (score >= 70) return "linear(to-r, red.400, red.600)";
  if (score >= 50) return "linear(to-r, orange.400, orange.600)";
  if (score >= 25) return "linear(to-r, yellow.400, yellow.600)";
  return "linear(to-r, green.400, green.600)";
}
