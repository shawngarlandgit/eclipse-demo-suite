/**
 * Supplier Risk - Risk calculation, dashboard queries, and incident management
 *
 * Provides:
 * - Risk score calculation for suppliers
 * - Dashboard summary for risk overview
 * - High-risk supplier alerts
 * - Trend analysis
 * - Incident recording and retrieval
 */

import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import {
  calculateRiskScore,
  calculateTrend,
  countIncidentsByType,
  getTierConfig,
  type IncidentForScoring,
  type RiskTier,
} from "./lib/riskScoring";

// ============================================================================
// TYPE VALIDATORS
// ============================================================================

const riskTierValidator = v.union(
  v.literal("low"),
  v.literal("medium"),
  v.literal("high"),
  v.literal("critical")
);

const incidentTypeValidator = v.union(
  v.literal("contamination"),
  v.literal("recall"),
  v.literal("labeling"),
  v.literal("quality"),
  v.literal("documentation"),
  v.literal("other")
);

const severityValidator = v.union(
  v.literal("critical"),
  v.literal("high"),
  v.literal("medium"),
  v.literal("low")
);

// ============================================================================
// DASHBOARD QUERIES
// ============================================================================

/**
 * Get risk dashboard summary for a dispensary.
 */
export const getDashboardSummary = query({
  args: {
    dispensaryId: v.id("dispensaries"),
  },
  handler: async (ctx, args) => {
    // Get all risk profiles for this dispensary
    const riskProfiles = await ctx.db
      .query("supplierRiskProfiles")
      .withIndex("by_dispensary", (q) => q.eq("dispensaryId", args.dispensaryId))
      .collect();

    // Count by tier
    const tierCounts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };
    let totalRiskScore = 0;

    for (const profile of riskProfiles) {
      tierCounts[profile.riskTier]++;
      totalRiskScore += profile.riskScore;
    }

    // Get recent incidents (last 30 days)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentIncidents = await ctx.db
      .query("supplierIncidents")
      .withIndex("by_dispensary", (q) => q.eq("dispensaryId", args.dispensaryId))
      .filter((q) => q.gte(q.field("incidentDate"), thirtyDaysAgo))
      .collect();

    // Get suppliers with worsening trends
    const worseningSuppliers = riskProfiles.filter(
      (p) => p.trend === "worsening"
    ).length;

    // Get products linked to high-risk suppliers
    const highRiskSupplierIds = riskProfiles
      .filter((p) => p.riskTier === "critical" || p.riskTier === "high")
      .map((p) => p.supplierId);

    let productsAtRisk = 0;
    for (const supplierId of highRiskSupplierIds) {
      const products = await ctx.db
        .query("products")
        .withIndex("by_supplier", (q) => q.eq("supplierId", supplierId))
        .filter((q) => q.eq(q.field("dispensaryId"), args.dispensaryId))
        .collect();
      productsAtRisk += products.length;
    }

    return {
      totalSuppliers: riskProfiles.length,
      tierCounts,
      avgRiskScore:
        riskProfiles.length > 0
          ? Math.round(totalRiskScore / riskProfiles.length)
          : 0,
      recentIncidentCount: recentIncidents.length,
      worseningSupplierCount: worseningSuppliers,
      productsAtRisk,
      highRiskCount: tierCounts.critical + tierCounts.high,
    };
  },
});

/**
 * Get risk profiles for a dispensary with optional tier filter.
 */
export const getRiskProfiles = query({
  args: {
    dispensaryId: v.id("dispensaries"),
    riskTier: v.optional(riskTierValidator),
    sortBy: v.optional(
      v.union(
        v.literal("riskScore"),
        v.literal("name"),
        v.literal("lastIncident"),
        v.literal("trend")
      )
    ),
    sortOrder: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Query based on tier filter
    let profilesQuery;
    if (args.riskTier) {
      profilesQuery = ctx.db
        .query("supplierRiskProfiles")
        .withIndex("by_dispensary_tier", (q) =>
          q.eq("dispensaryId", args.dispensaryId).eq("riskTier", args.riskTier!)
        );
    } else {
      profilesQuery = ctx.db
        .query("supplierRiskProfiles")
        .withIndex("by_dispensary", (q) =>
          q.eq("dispensaryId", args.dispensaryId)
        );
    }

    const profiles = await profilesQuery.collect();

    // Enrich with supplier data
    const enriched = await Promise.all(
      profiles.map(async (profile) => {
        const supplier = await ctx.db.get(profile.supplierId);
        return {
          ...profile,
          supplier: supplier ?? null,
          tierConfig: getTierConfig(profile.riskTier),
        };
      })
    );

    // Sort
    const sortBy = args.sortBy ?? "riskScore";
    const sortOrder = args.sortOrder ?? "desc";
    const multiplier = sortOrder === "desc" ? -1 : 1;

    enriched.sort((a, b) => {
      switch (sortBy) {
        case "riskScore":
          return (a.riskScore - b.riskScore) * multiplier;
        case "name":
          return (
            (a.supplier?.name ?? "").localeCompare(b.supplier?.name ?? "") *
            multiplier
          );
        case "lastIncident":
          return (
            ((a.lastIncidentDate ?? 0) - (b.lastIncidentDate ?? 0)) * multiplier
          );
        case "trend":
          return (a.trendDirection - b.trendDirection) * multiplier;
        default:
          return 0;
      }
    });

    // Limit
    const limit = args.limit ?? 50;
    return enriched.slice(0, limit);
  },
});

/**
 * Get a single supplier's risk profile with full details.
 */
export const getProfile = query({
  args: {
    supplierId: v.id("suppliers"),
    dispensaryId: v.id("dispensaries"),
  },
  handler: async (ctx, args) => {
    const [supplier, profile, incidents] = await Promise.all([
      ctx.db.get(args.supplierId),
      ctx.db
        .query("supplierRiskProfiles")
        .withIndex("by_supplier_dispensary", (q) =>
          q.eq("supplierId", args.supplierId).eq("dispensaryId", args.dispensaryId)
        )
        .first(),
      ctx.db
        .query("supplierIncidents")
        .withIndex("by_supplier_dispensary", (q) =>
          q.eq("supplierId", args.supplierId).eq("dispensaryId", args.dispensaryId)
        )
        .order("desc")
        .collect(),
    ]);

    if (!supplier) return null;

    // Get products from this supplier
    const products = await ctx.db
      .query("products")
      .withIndex("by_supplier", (q) => q.eq("supplierId", args.supplierId))
      .filter((q) => q.eq(q.field("dispensaryId"), args.dispensaryId))
      .collect();

    // Calculate incident breakdown
    const incidentCounts = countIncidentsByType(
      incidents.map((i) => ({
        incidentType: i.incidentType,
        severity: i.severity,
        incidentDate: i.incidentDate,
      }))
    );

    return {
      supplier,
      profile: profile ?? null,
      incidents,
      products,
      incidentCounts,
      tierConfig: profile ? getTierConfig(profile.riskTier) : null,
    };
  },
});

/**
 * Get incident history for a supplier.
 */
export const getIncidentHistory = query({
  args: {
    supplierId: v.id("suppliers"),
    dispensaryId: v.id("dispensaries"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    const incidents = await ctx.db
      .query("supplierIncidents")
      .withIndex("by_supplier_dispensary", (q) =>
        q.eq("supplierId", args.supplierId).eq("dispensaryId", args.dispensaryId)
      )
      .order("desc")
      .take(limit);

    // Enrich with advisory data if linked
    const enriched = await Promise.all(
      incidents.map(async (incident) => {
        let advisory = null;
        if (incident.advisoryId) {
          advisory = await ctx.db.get(incident.advisoryId);
        }
        return {
          ...incident,
          advisory,
        };
      })
    );

    return enriched;
  },
});

/**
 * Get high-risk suppliers above a threshold.
 */
export const getHighRiskSuppliers = query({
  args: {
    dispensaryId: v.id("dispensaries"),
    threshold: v.optional(v.number()), // Default: 50 (high tier)
  },
  handler: async (ctx, args) => {
    const threshold = args.threshold ?? 50;

    const profiles = await ctx.db
      .query("supplierRiskProfiles")
      .withIndex("by_dispensary", (q) => q.eq("dispensaryId", args.dispensaryId))
      .filter((q) => q.gte(q.field("riskScore"), threshold))
      .collect();

    // Enrich with supplier data and sort by risk score
    const enriched = await Promise.all(
      profiles.map(async (profile) => {
        const supplier = await ctx.db.get(profile.supplierId);
        return {
          ...profile,
          supplier: supplier ?? null,
          tierConfig: getTierConfig(profile.riskTier),
        };
      })
    );

    // Sort by risk score descending
    enriched.sort((a, b) => b.riskScore - a.riskScore);

    return enriched;
  },
});

/**
 * Get suppliers with worsening trends.
 */
export const getTrendingRisk = query({
  args: {
    dispensaryId: v.id("dispensaries"),
    period: v.optional(v.number()), // Days to look back
  },
  handler: async (ctx, args) => {
    const profiles = await ctx.db
      .query("supplierRiskProfiles")
      .withIndex("by_dispensary", (q) => q.eq("dispensaryId", args.dispensaryId))
      .filter((q) => q.eq(q.field("trend"), "worsening"))
      .collect();

    // Enrich with supplier data
    const enriched = await Promise.all(
      profiles.map(async (profile) => {
        const supplier = await ctx.db.get(profile.supplierId);
        return {
          ...profile,
          supplier: supplier ?? null,
          tierConfig: getTierConfig(profile.riskTier),
        };
      })
    );

    // Sort by trend direction (most worsening first)
    enriched.sort((a, b) => b.trendDirection - a.trendDirection);

    return enriched;
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Record a new supplier incident.
 */
export const recordIncident = mutation({
  args: {
    supplierId: v.id("suppliers"),
    dispensaryId: v.id("dispensaries"),
    incidentType: incidentTypeValidator,
    severity: severityValidator,
    title: v.string(),
    description: v.string(),
    affectedBatches: v.optional(v.array(v.string())),
    affectedProducts: v.optional(v.array(v.string())),
    affectedQuantity: v.optional(v.number()),
    contaminants: v.optional(v.array(v.string())),
    contaminantDetails: v.optional(v.string()),
    incidentDate: v.number(),
    sourceType: v.optional(v.string()),
    sourceReference: v.optional(v.string()),
    reportedBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Verify supplier exists
    const supplier = await ctx.db.get(args.supplierId);
    if (!supplier) {
      throw new Error("Supplier not found");
    }

    // Create incident record
    const incidentId = await ctx.db.insert("supplierIncidents", {
      supplierId: args.supplierId,
      dispensaryId: args.dispensaryId,
      incidentType: args.incidentType,
      severity: args.severity,
      title: args.title,
      description: args.description,
      affectedBatches: args.affectedBatches,
      affectedProducts: args.affectedProducts,
      affectedQuantity: args.affectedQuantity,
      contaminants: args.contaminants,
      contaminantDetails: args.contaminantDetails,
      incidentDate: args.incidentDate,
      reportedAt: now,
      sourceType: args.sourceType ?? "manual",
      sourceReference: args.sourceReference,
      reportedBy: args.reportedBy,
      createdAt: now,
    });

    // Update supplier last activity
    await ctx.db.patch(args.supplierId, {
      lastActivityAt: now,
      updatedAt: now,
    });

    return incidentId;
  },
});

/**
 * Resolve a supplier incident.
 */
export const resolveIncident = mutation({
  args: {
    incidentId: v.id("supplierIncidents"),
    resolutionNotes: v.string(),
    resolutionAction: v.optional(
      v.union(
        v.literal("removed_from_sale"),
        v.literal("returned_to_supplier"),
        v.literal("destroyed"),
        v.literal("quarantined"),
        v.literal("cleared_after_test"),
        v.literal("false_positive_confirmed"),
        v.literal("other")
      )
    ),
    resolvedBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    await ctx.db.patch(args.incidentId, {
      resolvedAt: now,
      resolutionNotes: args.resolutionNotes,
      resolutionAction: args.resolutionAction,
      resolvedBy: args.resolvedBy,
      updatedAt: now,
    });
  },
});

/**
 * Recalculate risk score for a specific supplier in a dispensary.
 */
export const recalculateScore = mutation({
  args: {
    supplierId: v.id("suppliers"),
    dispensaryId: v.id("dispensaries"),
    totalBatches: v.optional(v.number()), // If known, otherwise estimate
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Get all incidents for this supplier in this dispensary
    const incidents = await ctx.db
      .query("supplierIncidents")
      .withIndex("by_supplier_dispensary", (q) =>
        q.eq("supplierId", args.supplierId).eq("dispensaryId", args.dispensaryId)
      )
      .collect();

    // Estimate total batches if not provided
    // Could be enhanced to count actual batches from products/transactions
    const totalBatches = args.totalBatches ?? Math.max(incidents.length * 10, 10);

    // Convert to scoring format
    const incidentsForScoring: IncidentForScoring[] = incidents.map((i) => ({
      incidentType: i.incidentType,
      severity: i.severity,
      incidentDate: i.incidentDate,
    }));

    // Calculate risk score
    const scoreResult = calculateRiskScore(incidentsForScoring, totalBatches);

    // Get existing profile for trend calculation
    const existingProfile = await ctx.db
      .query("supplierRiskProfiles")
      .withIndex("by_supplier_dispensary", (q) =>
        q.eq("supplierId", args.supplierId).eq("dispensaryId", args.dispensaryId)
      )
      .first();

    // Calculate trend
    const trendResult = calculateTrend(
      incidentsForScoring,
      totalBatches,
      existingProfile?.riskScore,
      scoreResult.riskScore
    );

    // Count incidents by type
    const incidentCounts = countIncidentsByType(incidentsForScoring);

    if (existingProfile) {
      // Update existing profile
      await ctx.db.patch(existingProfile._id, {
        riskScore: scoreResult.riskScore,
        riskTier: scoreResult.riskTier,
        totalBatches,
        contaminationCount: incidentCounts.contamination,
        recallCount: incidentCounts.recall,
        labelingIssueCount: incidentCounts.labeling,
        qualityIssueCount: incidentCounts.quality,
        lastIncidentDate: scoreResult.daysSinceLastIncident !== null
          ? now - scoreResult.daysSinceLastIncident * 24 * 60 * 60 * 1000
          : undefined,
        daysSinceLastIncident: scoreResult.daysSinceLastIncident ?? undefined,
        trend: trendResult.trend,
        trendDirection: trendResult.trendDirection,
        previousScore: existingProfile.riskScore,
        scoreChange: scoreResult.riskScore - existingProfile.riskScore,
        incidentRate: scoreResult.incidentRate,
        calculatedAt: now,
        calculationVersion: "1.0",
        updatedAt: now,
      });
      return existingProfile._id;
    } else {
      // Create new profile
      const profileId = await ctx.db.insert("supplierRiskProfiles", {
        supplierId: args.supplierId,
        dispensaryId: args.dispensaryId,
        riskScore: scoreResult.riskScore,
        riskTier: scoreResult.riskTier,
        totalBatches,
        contaminationCount: incidentCounts.contamination,
        recallCount: incidentCounts.recall,
        labelingIssueCount: incidentCounts.labeling,
        qualityIssueCount: incidentCounts.quality,
        lastIncidentDate: scoreResult.daysSinceLastIncident !== null
          ? now - scoreResult.daysSinceLastIncident * 24 * 60 * 60 * 1000
          : undefined,
        daysSinceLastIncident: scoreResult.daysSinceLastIncident ?? undefined,
        trend: trendResult.trend,
        trendDirection: trendResult.trendDirection,
        incidentRate: scoreResult.incidentRate,
        calculatedAt: now,
        calculationVersion: "1.0",
        createdAt: now,
      });
      return profileId;
    }
  },
});

/**
 * Recalculate all risk scores for a dispensary.
 */
export const recalculateAllScores = mutation({
  args: {
    dispensaryId: v.id("dispensaries"),
  },
  handler: async (ctx, args) => {
    // Get all unique suppliers with incidents in this dispensary
    const incidents = await ctx.db
      .query("supplierIncidents")
      .withIndex("by_dispensary", (q) => q.eq("dispensaryId", args.dispensaryId))
      .collect();

    const supplierIds = new Set<Id<"suppliers">>();
    for (const incident of incidents) {
      supplierIds.add(incident.supplierId);
    }

    // Also include suppliers linked to products
    const products = await ctx.db
      .query("products")
      .withIndex("by_dispensary", (q) => q.eq("dispensaryId", args.dispensaryId))
      .collect();

    for (const product of products) {
      if (product.supplierId) {
        supplierIds.add(product.supplierId);
      }
    }

    // Recalculate for each supplier
    const results: { supplierId: Id<"suppliers">; riskScore: number }[] = [];
    const now = Date.now();

    for (const supplierId of supplierIds) {
      // Get incidents for this supplier
      const supplierIncidents = incidents.filter(
        (i) => i.supplierId === supplierId
      );

      // Estimate batches from products
      const supplierProducts = products.filter(
        (p) => p.supplierId === supplierId
      );
      const totalBatches = Math.max(supplierProducts.length * 5, 10);

      // Convert to scoring format
      const incidentsForScoring: IncidentForScoring[] = supplierIncidents.map(
        (i) => ({
          incidentType: i.incidentType,
          severity: i.severity,
          incidentDate: i.incidentDate,
        })
      );

      // Calculate score
      const scoreResult = calculateRiskScore(incidentsForScoring, totalBatches);

      // Get existing profile
      const existingProfile = await ctx.db
        .query("supplierRiskProfiles")
        .withIndex("by_supplier_dispensary", (q) =>
          q.eq("supplierId", supplierId).eq("dispensaryId", args.dispensaryId)
        )
        .first();

      // Calculate trend
      const trendResult = calculateTrend(
        incidentsForScoring,
        totalBatches,
        existingProfile?.riskScore,
        scoreResult.riskScore
      );

      // Count incidents by type
      const incidentCounts = countIncidentsByType(incidentsForScoring);

      if (existingProfile) {
        await ctx.db.patch(existingProfile._id, {
          riskScore: scoreResult.riskScore,
          riskTier: scoreResult.riskTier,
          totalBatches,
          contaminationCount: incidentCounts.contamination,
          recallCount: incidentCounts.recall,
          labelingIssueCount: incidentCounts.labeling,
          qualityIssueCount: incidentCounts.quality,
          lastIncidentDate: scoreResult.daysSinceLastIncident !== null
            ? now - scoreResult.daysSinceLastIncident * 24 * 60 * 60 * 1000
            : undefined,
          daysSinceLastIncident: scoreResult.daysSinceLastIncident ?? undefined,
          trend: trendResult.trend,
          trendDirection: trendResult.trendDirection,
          previousScore: existingProfile.riskScore,
          scoreChange: scoreResult.riskScore - existingProfile.riskScore,
          incidentRate: scoreResult.incidentRate,
          calculatedAt: now,
          calculationVersion: "1.0",
          updatedAt: now,
        });
      } else {
        await ctx.db.insert("supplierRiskProfiles", {
          supplierId,
          dispensaryId: args.dispensaryId,
          riskScore: scoreResult.riskScore,
          riskTier: scoreResult.riskTier,
          totalBatches,
          contaminationCount: incidentCounts.contamination,
          recallCount: incidentCounts.recall,
          labelingIssueCount: incidentCounts.labeling,
          qualityIssueCount: incidentCounts.quality,
          lastIncidentDate: scoreResult.daysSinceLastIncident !== null
            ? now - scoreResult.daysSinceLastIncident * 24 * 60 * 60 * 1000
            : undefined,
          daysSinceLastIncident: scoreResult.daysSinceLastIncident ?? undefined,
          trend: trendResult.trend,
          trendDirection: trendResult.trendDirection,
          incidentRate: scoreResult.incidentRate,
          calculatedAt: now,
          calculationVersion: "1.0",
          createdAt: now,
        });
      }

      results.push({ supplierId, riskScore: scoreResult.riskScore });
    }

    return {
      processedCount: results.length,
      results,
    };
  },
});

/**
 * Update total batches for a supplier (called when products are added/updated).
 */
export const updateBatchCount = mutation({
  args: {
    supplierId: v.id("suppliers"),
    dispensaryId: v.id("dispensaries"),
    batchCount: v.number(),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("supplierRiskProfiles")
      .withIndex("by_supplier_dispensary", (q) =>
        q.eq("supplierId", args.supplierId).eq("dispensaryId", args.dispensaryId)
      )
      .first();

    if (profile) {
      // Recalculate incident rate with new batch count
      const newIncidentRate =
        (profile.contaminationCount +
          profile.recallCount +
          profile.labelingIssueCount +
          (profile.qualityIssueCount ?? 0)) /
        Math.max(args.batchCount, 1) *
        100;

      await ctx.db.patch(profile._id, {
        totalBatches: args.batchCount,
        incidentRate: Math.round(newIncidentRate * 100) / 100,
        updatedAt: Date.now(),
      });
    }
  },
});
