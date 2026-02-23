/**
 * Risk Scoring Algorithm Library
 *
 * Core functions for calculating supplier risk scores based on:
 * - Incident history (type and severity)
 * - Time decay (recent incidents weigh more)
 * - Volume-adjusted rates (incidents per 100 batches)
 * - Trend analysis (improving/stable/worsening)
 */

// ============================================================================
// TYPES
// ============================================================================

export type RiskTier = "low" | "medium" | "high" | "critical";
export type RiskTrend = "improving" | "stable" | "worsening";
export type IncidentSeverity = "critical" | "high" | "medium" | "low";
export type IncidentType =
  | "contamination"
  | "recall"
  | "labeling"
  | "quality"
  | "documentation"
  | "other";

export interface IncidentForScoring {
  incidentType: IncidentType;
  severity: IncidentSeverity;
  incidentDate: number; // Unix ms
}

export interface RiskScoreResult {
  riskScore: number; // 0-100
  riskTier: RiskTier;
  incidentRate: number; // incidents per 100 batches
  daysSinceLastIncident: number | null;
}

export interface TrendResult {
  trend: RiskTrend;
  trendDirection: number; // -1 (improving) to +1 (worsening)
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Severity weights for incidents.
 * These values contribute to the raw risk score.
 */
export const SEVERITY_WEIGHTS: Record<IncidentSeverity, number> = {
  critical: 25,
  high: 15,
  medium: 8,
  low: 3,
};

/**
 * Incident type multipliers.
 * Contamination and recalls are more severe than labeling issues.
 */
export const INCIDENT_TYPE_MULTIPLIERS: Record<IncidentType, number> = {
  contamination: 1.5,
  recall: 1.4,
  quality: 1.0,
  labeling: 0.7,
  documentation: 0.5,
  other: 0.6,
};

/**
 * Risk tier thresholds.
 */
export const RISK_TIER_THRESHOLDS = {
  critical: 70, // 70-100
  high: 50, // 50-69
  medium: 25, // 25-49
  low: 0, // 0-24
};

/**
 * Time decay half-life in days.
 * After this many days, an incident's impact is halved.
 */
export const DECAY_HALF_LIFE_DAYS = 180; // 6 months

/**
 * Trend calculation window in days.
 */
export const TREND_WINDOW_DAYS = 90; // 3 months

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Calculate the risk score for a supplier based on their incident history.
 *
 * Algorithm:
 * 1. For each incident, calculate a weighted score based on severity and type
 * 2. Apply time decay (exponential, with 6-month half-life)
 * 3. Sum all weighted scores
 * 4. Add incident rate penalty (incidents per 100 batches)
 * 5. Normalize to 0-100 scale
 */
export function calculateRiskScore(
  incidents: IncidentForScoring[],
  totalBatches: number
): RiskScoreResult {
  const now = Date.now();

  // Handle edge case: no incidents = zero risk
  if (incidents.length === 0) {
    return {
      riskScore: 0,
      riskTier: "low",
      incidentRate: 0,
      daysSinceLastIncident: null,
    };
  }

  // Calculate time-decayed weighted score for each incident
  const incidentScores = incidents.map((incident) => {
    const baseScore = SEVERITY_WEIGHTS[incident.severity];
    const typeMultiplier = INCIDENT_TYPE_MULTIPLIERS[incident.incidentType];

    // Time decay: exponential decay with half-life
    const ageInDays = (now - incident.incidentDate) / (1000 * 60 * 60 * 24);
    const decayFactor = Math.exp(
      (-Math.LN2 * ageInDays) / DECAY_HALF_LIFE_DAYS
    );

    return baseScore * typeMultiplier * decayFactor;
  });

  // Sum all incident scores
  const rawScore = incidentScores.reduce((sum, score) => sum + score, 0);

  // Calculate incident rate (per 100 batches)
  const effectiveBatches = Math.max(totalBatches, 1); // Avoid division by zero
  const incidentRate = (incidents.length / effectiveBatches) * 100;

  // Add incident rate penalty
  const ratePenalty = incidentRate * 2;

  // Combine and normalize to 0-100
  const combinedScore = rawScore + ratePenalty;
  const normalizedScore = Math.min(100, Math.round(combinedScore));

  // Determine risk tier
  const riskTier = getRiskTier(normalizedScore);

  // Calculate days since last incident
  const mostRecentIncident = Math.max(...incidents.map((i) => i.incidentDate));
  const daysSinceLastIncident = Math.floor(
    (now - mostRecentIncident) / (1000 * 60 * 60 * 24)
  );

  return {
    riskScore: normalizedScore,
    riskTier,
    incidentRate: Math.round(incidentRate * 100) / 100, // 2 decimal places
    daysSinceLastIncident,
  };
}

/**
 * Determine risk tier from score.
 */
export function getRiskTier(score: number): RiskTier {
  if (score >= RISK_TIER_THRESHOLDS.critical) return "critical";
  if (score >= RISK_TIER_THRESHOLDS.high) return "high";
  if (score >= RISK_TIER_THRESHOLDS.medium) return "medium";
  return "low";
}

/**
 * Analyze trend based on recent vs historical incident rate.
 *
 * Algorithm:
 * 1. Split incidents into recent (last 90 days) and historical
 * 2. Calculate incident rate for each period
 * 3. Compare rates to determine trend
 */
export function calculateTrend(
  incidents: IncidentForScoring[],
  totalBatches: number,
  previousScore?: number,
  currentScore?: number
): TrendResult {
  const now = Date.now();
  const trendWindowMs = TREND_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const trendCutoff = now - trendWindowMs;

  // If we have previous and current scores, use simple comparison
  if (previousScore !== undefined && currentScore !== undefined) {
    const scoreDiff = currentScore - previousScore;

    if (scoreDiff <= -5) {
      return { trend: "improving", trendDirection: -1 };
    } else if (scoreDiff >= 5) {
      return { trend: "worsening", trendDirection: 1 };
    } else {
      return { trend: "stable", trendDirection: 0 };
    }
  }

  // Fallback: analyze incident frequency
  const recentIncidents = incidents.filter((i) => i.incidentDate >= trendCutoff);
  const historicalIncidents = incidents.filter(
    (i) => i.incidentDate < trendCutoff
  );

  // Need at least some historical data to determine trend
  if (historicalIncidents.length === 0) {
    if (recentIncidents.length === 0) {
      return { trend: "stable", trendDirection: 0 };
    }
    // Only recent incidents, can't determine trend
    return { trend: "stable", trendDirection: 0 };
  }

  // Calculate rates (simple frequency for trend analysis)
  const recentRate = recentIncidents.length / TREND_WINDOW_DAYS;
  const historicalDays = Math.max(
    1,
    (trendCutoff - Math.min(...incidents.map((i) => i.incidentDate))) /
      (1000 * 60 * 60 * 24)
  );
  const historicalRate = historicalIncidents.length / historicalDays;

  // Compare rates
  const rateDiff = recentRate - historicalRate;
  const threshold = 0.01; // ~1 incident per 100 days difference

  if (rateDiff <= -threshold) {
    return {
      trend: "improving",
      trendDirection: Math.max(-1, rateDiff * 100),
    };
  } else if (rateDiff >= threshold) {
    return {
      trend: "worsening",
      trendDirection: Math.min(1, rateDiff * 100),
    };
  } else {
    return { trend: "stable", trendDirection: 0 };
  }
}

/**
 * Calculate incident counts by type.
 */
export function countIncidentsByType(
  incidents: IncidentForScoring[]
): Record<IncidentType, number> {
  const counts: Record<IncidentType, number> = {
    contamination: 0,
    recall: 0,
    labeling: 0,
    quality: 0,
    documentation: 0,
    other: 0,
  };

  for (const incident of incidents) {
    counts[incident.incidentType]++;
  }

  return counts;
}

/**
 * Get tier configuration for display purposes.
 */
export function getTierConfig(tier: RiskTier): {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  priority: number;
  description: string;
} {
  const configs = {
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

  return configs[tier];
}

/**
 * Get trend configuration for display purposes.
 */
export function getTrendConfig(trend: RiskTrend): {
  label: string;
  color: string;
  icon: string;
} {
  const configs = {
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

  return configs[trend];
}

/**
 * Format days since last incident for display.
 */
export function formatDaysSinceIncident(days: number | null): string {
  if (days === null) return "No incidents";
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  if (days < 60) return "1 month ago";
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  if (days < 730) return "1 year ago";
  return `${Math.floor(days / 365)} years ago`;
}
