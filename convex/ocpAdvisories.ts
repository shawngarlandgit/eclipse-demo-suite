import { query, mutation, internalMutation, internalAction, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { requireDispensaryAccess, requirePermission, requireAuth } from "./lib/auth";
import {
  matchProductToAdvisory,
  type AdvisoryMatchCriteria,
  type MatchableProduct,
} from "./lib/ocpMatching";
import type { Doc, Id } from "./_generated/dataModel";

// ============================================================================
// TYPE VALIDATORS
// ============================================================================

const advisorySeverity = v.union(
  v.literal("critical"),
  v.literal("high"),
  v.literal("medium"),
  v.literal("low")
);

const advisoryStatus = v.union(
  v.literal("active"),
  v.literal("resolved"),
  v.literal("expired"),
  v.literal("dismissed")
);

const matchStatus = v.union(
  v.literal("pending"),
  v.literal("confirmed"),
  v.literal("resolved"),
  v.literal("false_positive")
);

const resolutionAction = v.union(
  v.literal("removed_from_sale"),
  v.literal("returned_to_supplier"),
  v.literal("destroyed"),
  v.literal("quarantined"),
  v.literal("cleared_after_test"),
  v.literal("false_positive_confirmed"),
  v.literal("other")
);

// ============================================================================
// QUERIES
// ============================================================================

/**
 * List advisories with filters
 */
export const list = query({
  args: {
    status: v.optional(advisoryStatus),
    severity: v.optional(advisorySeverity),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    let advisoriesQuery = ctx.db.query("ocpAdvisories").order("desc");

    // Apply status filter
    if (args.status) {
      advisoriesQuery = advisoriesQuery.filter((q) =>
        q.eq(q.field("status"), args.status)
      );
    }

    // Apply severity filter
    if (args.severity) {
      advisoriesQuery = advisoriesQuery.filter((q) =>
        q.eq(q.field("severity"), args.severity)
      );
    }

    const advisories = await advisoriesQuery.take(limit);

    return {
      advisories,
      hasMore: advisories.length === limit,
    };
  },
});

/**
 * Get advisory by ID with product matches
 */
export const getById = query({
  args: {
    advisoryId: v.id("ocpAdvisories"),
  },
  handler: async (ctx, args) => {
    const advisory = await ctx.db.get(args.advisoryId);
    if (!advisory) return null;

    // Get all matches for this advisory
    const matches = await ctx.db
      .query("advisoryProductMatches")
      .withIndex("by_advisory", (q) => q.eq("advisoryId", args.advisoryId))
      .collect();

    // Enrich matches with product details
    const enrichedMatches = await Promise.all(
      matches.map(async (match) => {
        const product = await ctx.db.get(match.productId);
        const dispensary = await ctx.db.get(match.dispensaryId);
        return {
          ...match,
          product,
          dispensary,
        };
      })
    );

    return {
      ...advisory,
      matches: enrichedMatches,
    };
  },
});

/**
 * Get active alerts for dashboard banner
 */
export const getActiveAlerts = query({
  args: {
    dispensaryId: v.optional(v.id("dispensaries")),
  },
  handler: async (ctx, args) => {
    // Get active advisories
    const advisories = await ctx.db
      .query("ocpAdvisories")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    if (!args.dispensaryId) {
      return {
        advisories,
        totalCount: advisories.length,
        criticalCount: advisories.filter((a) => a.severity === "critical").length,
        highCount: advisories.filter((a) => a.severity === "high").length,
      };
    }

    // If dispensaryId provided, get match counts for that dispensary
    const matchCounts = await Promise.all(
      advisories.map(async (advisory) => {
        const matches = await ctx.db
          .query("advisoryProductMatches")
          .withIndex("by_advisory_dispensary", (q) =>
            q.eq("advisoryId", advisory._id).eq("dispensaryId", args.dispensaryId!)
          )
          .filter((q) =>
            q.or(
              q.eq(q.field("status"), "pending"),
              q.eq(q.field("status"), "confirmed")
            )
          )
          .collect();

        return {
          advisory,
          matchCount: matches.length,
          pendingCount: matches.filter((m) => m.status === "pending").length,
        };
      })
    );

    const relevantAlerts = matchCounts.filter((mc) => mc.matchCount > 0);

    return {
      advisories: relevantAlerts.map((ra) => ra.advisory),
      totalCount: advisories.length,
      relevantCount: relevantAlerts.length,
      criticalCount: relevantAlerts.filter((ra) => ra.advisory.severity === "critical").length,
      highCount: relevantAlerts.filter((ra) => ra.advisory.severity === "high").length,
      totalPendingMatches: relevantAlerts.reduce((sum, ra) => sum + ra.pendingCount, 0),
    };
  },
});

/**
 * Get matches for a dispensary
 */
export const getMatchesForDispensary = query({
  args: {
    dispensaryId: v.id("dispensaries"),
    status: v.optional(matchStatus),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireDispensaryAccess(ctx, args.dispensaryId);

    const limit = args.limit ?? 100;

    let matchesQuery = ctx.db
      .query("advisoryProductMatches")
      .withIndex("by_dispensary", (q) => q.eq("dispensaryId", args.dispensaryId))
      .order("desc");

    if (args.status) {
      matchesQuery = matchesQuery.filter((q) =>
        q.eq(q.field("status"), args.status)
      );
    }

    const matches = await matchesQuery.take(limit);

    // Enrich with advisory and product details
    const enrichedMatches = await Promise.all(
      matches.map(async (match) => {
        const advisory = await ctx.db.get(match.advisoryId);
        const product = await ctx.db.get(match.productId);
        return {
          ...match,
          advisory,
          product,
        };
      })
    );

    return enrichedMatches;
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

const advisoryTypeValidator = v.union(
  v.literal("recall"),
  v.literal("safety_alert"),
  v.literal("contamination"),
  v.literal("labeling"),
  v.literal("other")
);

/**
 * Ingest a new advisory from webhook (internal)
 * Note: webhook sends `publishedAt` which maps to `issuedAt` in schema
 */
export const ingest = internalMutation({
  args: {
    ocpAdvisoryId: v.string(),
    title: v.string(),
    description: v.string(),
    severity: advisorySeverity,
    advisoryType: advisoryTypeValidator,
    sourceUrl: v.string(),
    publishedAt: v.number(), // Webhook field - maps to issuedAt
    expiresAt: v.optional(v.number()),
    affectedProducts: v.optional(v.array(v.string())),
    affectedStrains: v.optional(v.array(v.string())),
    affectedBrands: v.optional(v.array(v.string())),
    affectedBatchNumbers: v.optional(v.array(v.string())),
    affectedLicenses: v.optional(v.array(v.string())),
    contaminants: v.optional(v.array(v.string())),
    recommendedAction: v.optional(v.string()),
    regulatoryReference: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if advisory already exists
    const existing = await ctx.db
      .query("ocpAdvisories")
      .withIndex("by_ocp_id", (q) => q.eq("ocpAdvisoryId", args.ocpAdvisoryId))
      .first();

    // Map webhook fields to schema fields
    const { publishedAt, ...rest } = args;
    const advisoryData = {
      ...rest,
      issuedAt: publishedAt, // Map publishedAt to issuedAt
    };

    if (existing) {
      // Update existing advisory
      await ctx.db.patch(existing._id, {
        ...advisoryData,
        status: "active",
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    // Create new advisory
    const advisoryId = await ctx.db.insert("ocpAdvisories", {
      ...advisoryData,
      status: "active",
      createdAt: Date.now(),
    });

    return advisoryId;
  },
});

/**
 * Process advisory - cross-reference against all dispensary inventories (internal)
 */
export const processAdvisory = internalAction({
  args: {
    advisoryId: v.id("ocpAdvisories"),
  },
  handler: async (ctx, args) => {
    // Get the advisory
    const advisory = await ctx.runQuery(internal.ocpAdvisories.getAdvisoryInternal, {
      advisoryId: args.advisoryId,
    });

    if (!advisory) {
      throw new Error("Advisory not found");
    }

    // Get all active dispensaries
    const dispensaries = await ctx.runQuery(internal.ocpAdvisories.getAllDispensaries, {});

    const matchCriteria: AdvisoryMatchCriteria = {
      affectedProducts: advisory.affectedProducts,
      affectedStrains: advisory.affectedStrains,
      affectedBrands: advisory.affectedBrands,
      affectedBatchNumbers: advisory.affectedBatchNumbers,
      affectedLicenses: advisory.affectedLicenses,
    };

    let totalMatches = 0;

    // Track matches per dispensary for notifications
    const dispensaryMatches: Map<string, { count: number; criticalCount: number }> = new Map();

    // Process each dispensary
    for (const dispensary of dispensaries) {
      // Get all active products for this dispensary
      const products = await ctx.runQuery(internal.ocpAdvisories.getDispensaryProducts, {
        dispensaryId: dispensary._id,
      });

      let dispensaryMatchCount = 0;
      let dispensaryCriticalCount = 0;

      // Match each product
      for (const product of products) {
        const matchableProduct: MatchableProduct = {
          name: product.name,
          brand: product.brand,
          batchNumber: product.batchNumber,
          metrcId: product.metrcId,
        };

        const matches = matchProductToAdvisory(matchableProduct, matchCriteria);

        if (matches.length > 0) {
          // Get best match (highest confidence)
          const bestMatch = matches.reduce((best, current) =>
            current.confidence > best.confidence ? current : best
          );

          // Create match record and flag product
          await ctx.runMutation(internal.ocpAdvisories.createMatch, {
            advisoryId: args.advisoryId,
            productId: product._id,
            dispensaryId: dispensary._id,
            matchType: bestMatch.matchType,
            matchedValue: bestMatch.matchedValue,
            matchConfidence: bestMatch.confidence,
            quantityAffected: product.quantityOnHand ?? 0,
          });

          totalMatches++;
          dispensaryMatchCount++;

          // Track critical matches (high confidence + critical/high severity)
          if (bestMatch.confidence >= 0.8 && (advisory.severity === "critical" || advisory.severity === "high")) {
            dispensaryCriticalCount++;
          }
        }
      }

      // Track matches for this dispensary
      if (dispensaryMatchCount > 0) {
        dispensaryMatches.set(dispensary._id, {
          count: dispensaryMatchCount,
          criticalCount: dispensaryCriticalCount,
        });
      }
    }

    // Update advisory with match count and processed time
    await ctx.runMutation(internal.ocpAdvisories.updateAdvisoryProcessed, {
      advisoryId: args.advisoryId,
      matchCount: totalMatches,
    });

    // Send email notifications to dispensaries with matches
    for (const [dispensaryId, matchData] of dispensaryMatches) {
      // Schedule email notification for each affected dispensary
      await ctx.scheduler.runAfter(0, internal.ocpAdvisories.sendAlertEmail, {
        advisoryId: args.advisoryId,
        dispensaryId: dispensaryId as Id<"dispensaries">,
        matchCount: matchData.count,
        criticalMatches: matchData.criticalCount,
      });
    }

    return {
      totalMatches,
      dispensariesAffected: dispensaryMatches.size,
    };
  },
});

/**
 * Internal query to get advisory
 */
export const getAdvisoryInternal = internalQuery({
  args: { advisoryId: v.id("ocpAdvisories") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.advisoryId);
  },
});

/**
 * Internal query to get all dispensaries
 */
export const getAllDispensaries = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("dispensaries")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

/**
 * Internal query to get dispensary products
 */
export const getDispensaryProducts = internalQuery({
  args: { dispensaryId: v.id("dispensaries") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("products")
      .withIndex("by_dispensary", (q) => q.eq("dispensaryId", args.dispensaryId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

/**
 * Internal mutation to create a match
 */
export const createMatch = internalMutation({
  args: {
    advisoryId: v.id("ocpAdvisories"),
    productId: v.id("products"),
    dispensaryId: v.id("dispensaries"),
    matchType: v.string(),
    matchedValue: v.string(),
    matchConfidence: v.number(),
    quantityAffected: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if match already exists
    const existing = await ctx.db
      .query("advisoryProductMatches")
      .withIndex("by_advisory", (q) => q.eq("advisoryId", args.advisoryId))
      .filter((q) => q.eq(q.field("productId"), args.productId))
      .first();

    if (existing) {
      // Update existing match if confidence is higher
      if (args.matchConfidence > existing.matchConfidence) {
        await ctx.db.patch(existing._id, {
          matchType: args.matchType,
          matchedValue: args.matchedValue,
          matchConfidence: args.matchConfidence,
          updatedAt: now,
        });
      }
      return existing._id;
    }

    // Create new match
    const matchId = await ctx.db.insert("advisoryProductMatches", {
      advisoryId: args.advisoryId,
      productId: args.productId,
      dispensaryId: args.dispensaryId,
      matchType: args.matchType,
      matchedValue: args.matchedValue,
      matchConfidence: args.matchConfidence,
      status: "pending",
      flaggedAt: now,
      quantityAffected: args.quantityAffected ?? 0,
      createdAt: now,
    });

    // Flag the product
    await ctx.db.patch(args.productId, {
      complianceStatus: "flagged",
      complianceFlagId: matchId,
      updatedAt: now,
    });

    return matchId;
  },
});

/**
 * Internal mutation to update advisory processed status
 */
export const updateAdvisoryProcessed = internalMutation({
  args: {
    advisoryId: v.id("ocpAdvisories"),
    matchCount: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.advisoryId, {
      processedAt: Date.now(),
      matchCount: args.matchCount,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Resolve a product match (public - requires manager+ role)
 */
export const resolveMatch = mutation({
  args: {
    matchId: v.id("advisoryProductMatches"),
    resolutionAction: resolutionAction,
    resolutionNotes: v.optional(v.string()),
    quantityResolved: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requirePermission(ctx, "manage_compliance");
    const user = await requireAuth(ctx);

    const match = await ctx.db.get(args.matchId);
    if (!match) {
      throw new Error("Match not found");
    }

    await requireDispensaryAccess(ctx, match.dispensaryId);

    const now = Date.now();
    const previousStatus = match.status;

    // Update match
    await ctx.db.patch(args.matchId, {
      status: "resolved",
      resolvedAt: now,
      resolvedBy: user._id,
      resolutionAction: args.resolutionAction,
      resolutionNotes: args.resolutionNotes,
      quantityResolved: args.quantityResolved ?? match.quantityAffected,
      updatedAt: now,
    });

    // Clear product compliance status
    await ctx.db.patch(match.productId, {
      complianceStatus: "clear",
      complianceFlagId: undefined,
      updatedAt: now,
    });

    // Create audit log
    await ctx.db.insert("complianceResolutionLogs", {
      advisoryId: match.advisoryId,
      matchId: args.matchId,
      productId: match.productId,
      dispensaryId: match.dispensaryId,
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: "resolved",
      previousStatus,
      newStatus: "resolved",
      notes: args.resolutionNotes,
      createdAt: now,
    });

    return { success: true };
  },
});

/**
 * Dismiss a match as false positive (public - requires owner+ role)
 */
export const dismissMatch = mutation({
  args: {
    matchId: v.id("advisoryProductMatches"),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePermission(ctx, "manage_compliance");
    const user = await requireAuth(ctx);

    // Only owner+ can dismiss
    if (user.role !== "owner" && user.role !== "admin") {
      throw new Error("Only owners or admins can dismiss compliance matches");
    }

    const match = await ctx.db.get(args.matchId);
    if (!match) {
      throw new Error("Match not found");
    }

    await requireDispensaryAccess(ctx, match.dispensaryId);

    const now = Date.now();
    const previousStatus = match.status;

    // Update match
    await ctx.db.patch(args.matchId, {
      status: "false_positive",
      resolvedAt: now,
      resolvedBy: user._id,
      resolutionAction: "false_positive_confirmed",
      resolutionNotes: args.notes,
      updatedAt: now,
    });

    // Clear product compliance status
    await ctx.db.patch(match.productId, {
      complianceStatus: "clear",
      complianceFlagId: undefined,
      updatedAt: now,
    });

    // Create audit log
    await ctx.db.insert("complianceResolutionLogs", {
      advisoryId: match.advisoryId,
      matchId: args.matchId,
      productId: match.productId,
      dispensaryId: match.dispensaryId,
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: "dismissed",
      previousStatus,
      newStatus: "false_positive",
      notes: args.notes,
      createdAt: now,
    });

    return { success: true };
  },
});

/**
 * Lock a product for compliance review
 */
export const lockProduct = mutation({
  args: {
    matchId: v.id("advisoryProductMatches"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requirePermission(ctx, "manage_compliance");
    const user = await requireAuth(ctx);

    const match = await ctx.db.get(args.matchId);
    if (!match) {
      throw new Error("Match not found");
    }

    await requireDispensaryAccess(ctx, match.dispensaryId);

    const now = Date.now();

    // Update match status
    await ctx.db.patch(args.matchId, {
      status: "confirmed",
      acknowledgedAt: now,
      acknowledgedBy: user._id,
      updatedAt: now,
    });

    // Lock the product
    await ctx.db.patch(match.productId, {
      complianceStatus: "locked",
      complianceLockedAt: now,
      complianceLockedBy: user._id,
      updatedAt: now,
    });

    // Create audit log
    await ctx.db.insert("complianceResolutionLogs", {
      advisoryId: match.advisoryId,
      matchId: args.matchId,
      productId: match.productId,
      dispensaryId: match.dispensaryId,
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: "locked",
      previousStatus: match.status,
      newStatus: "confirmed",
      notes: args.notes,
      createdAt: now,
    });

    return { success: true };
  },
});

/**
 * Acknowledge a match (for staff viewing)
 */
export const acknowledgeMatch = mutation({
  args: {
    matchId: v.id("advisoryProductMatches"),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const match = await ctx.db.get(args.matchId);
    if (!match) {
      throw new Error("Match not found");
    }

    await requireDispensaryAccess(ctx, match.dispensaryId);

    // Only update if not already acknowledged
    if (!match.acknowledgedAt) {
      await ctx.db.patch(args.matchId, {
        acknowledgedAt: Date.now(),
        acknowledgedBy: user._id,
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

// ============================================================================
// EMAIL NOTIFICATIONS (via Resend)
// ============================================================================

/**
 * Send compliance alert email via Resend API
 * Internal action - called after matches are created
 */
export const sendAlertEmail = internalAction({
  args: {
    advisoryId: v.id("ocpAdvisories"),
    dispensaryId: v.id("dispensaries"),
    matchCount: v.number(),
    criticalMatches: v.number(),
  },
  handler: async (ctx, args) => {
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      console.warn("RESEND_API_KEY not configured - skipping email notification");
      return { sent: false, reason: "API key not configured" };
    }

    // Get advisory and dispensary details
    const advisory = await ctx.runQuery(internal.ocpAdvisories.getAdvisoryInternal, {
      advisoryId: args.advisoryId,
    });

    const dispensary = await ctx.runQuery(internal.ocpAdvisories.getDispensaryById, {
      dispensaryId: args.dispensaryId,
    });

    if (!advisory || !dispensary) {
      console.error("Advisory or dispensary not found for email notification");
      return { sent: false, reason: "Data not found" };
    }

    // Get users with compliance notification permissions
    const recipients = await ctx.runQuery(internal.ocpAdvisories.getNotificationRecipients, {
      dispensaryId: args.dispensaryId,
    });

    if (recipients.length === 0) {
      console.log("No recipients found for compliance notifications");
      return { sent: false, reason: "No recipients" };
    }

    // Determine severity and styling
    const isCritical = advisory.severity === "critical" || args.criticalMatches > 0;
    const isHigh = advisory.severity === "high";

    const severityColor = isCritical ? "#DC2626" : isHigh ? "#EA580C" : "#D97706";
    const severityLabel = isCritical ? "CRITICAL" : isHigh ? "HIGH" : "MEDIUM";

    // Build email HTML
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Compliance Alert</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #1E293B;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #0F172A; border-radius: 8px; overflow: hidden;">
    <!-- Header -->
    <div style="background-color: ${severityColor}; padding: 24px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">${severityLabel} Compliance Alert</h1>
    </div>

    <!-- Content -->
    <div style="padding: 24px; color: #E2E8F0;">
      <h2 style="color: white; margin-top: 0;">${advisory.title}</h2>

      <div style="background-color: #1E293B; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
        <p style="margin: 0 0 8px 0;"><strong>OCP Advisory ID:</strong> ${advisory.ocpAdvisoryId}</p>
        <p style="margin: 0 0 8px 0;"><strong>Severity:</strong> <span style="color: ${severityColor}; font-weight: bold;">${advisory.severity.toUpperCase()}</span></p>
        <p style="margin: 0 0 8px 0;"><strong>Products Affected:</strong> ${args.matchCount}</p>
        <p style="margin: 0;"><strong>Dispensary:</strong> ${dispensary.name}</p>
      </div>

      <p style="line-height: 1.6;">${advisory.description}</p>

      ${advisory.contaminants && advisory.contaminants.length > 0 ? `
      <div style="background-color: #7F1D1D; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <p style="margin: 0 0 8px 0; font-weight: bold; color: #FCA5A5;">Contaminants Detected:</p>
        <p style="margin: 0;">${advisory.contaminants.join(", ")}</p>
      </div>
      ` : ""}

      ${isCritical ? `
      <div style="background-color: #7F1D1D; border-radius: 8px; padding: 16px; margin: 16px 0; border: 2px solid #DC2626;">
        <p style="margin: 0; font-weight: bold; color: #FCA5A5;">⚠️ IMMEDIATE ACTION REQUIRED</p>
        <p style="margin: 8px 0 0 0;">Affected products may need to be pulled from inventory immediately.</p>
      </div>
      ` : ""}

      <!-- CTA Button -->
      <div style="text-align: center; margin: 24px 0;">
        <a href="${process.env.APP_URL || 'https://hma.awknd.me'}/compliance-alerts"
           style="display: inline-block; background-color: #10B981; color: white; padding: 12px 32px;
                  border-radius: 8px; text-decoration: none; font-weight: bold;">
          View Alert Center
        </a>
      </div>

      <p style="font-size: 12px; color: #94A3B8; margin-top: 24px;">
        This is an automated compliance notification from Rootstock Cannabis Admin.
        ${advisory.sourceUrl ? `<br>Source: <a href="${advisory.sourceUrl}" style="color: #10B981;">${advisory.sourceUrl}</a>` : ""}
      </p>
    </div>
  </div>
</body>
</html>
    `.trim();

    // Determine subject line
    const subject = isCritical
      ? `🚨 CRITICAL: ${advisory.title} - ${args.matchCount} Products Affected`
      : isHigh
      ? `⚠️ High Priority: ${advisory.title} - ${args.matchCount} Products Affected`
      : `Compliance Alert: ${advisory.title} - ${args.matchCount} Products Affected`;

    // Send to each recipient
    const results: Array<{ email: string; success: boolean; error?: string }> = [];

    for (const recipient of recipients) {
      if (!recipient.email) continue;

      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Rootstock Compliance <alerts@awakenedai.online>",
            to: [recipient.email],
            subject,
            html: emailHtml,
          }),
        });

        if (!response.ok) {
          const errorBody = await response.text();
          console.error(`Failed to send email to ${recipient.email}:`, errorBody);
          results.push({ email: recipient.email, success: false, error: errorBody });

          // Record failed notification
          await ctx.runMutation(internal.ocpAdvisories.recordNotification, {
            advisoryId: args.advisoryId,
            dispensaryId: args.dispensaryId,
            userId: recipient._id,
            channel: "email",
            status: "failed",
            subject,
            body: emailHtml,
            recipientEmail: recipient.email,
            errorMessage: errorBody,
          });
        } else {
          const result = await response.json();
          console.log(`Email sent to ${recipient.email}:`, result);
          results.push({ email: recipient.email, success: true });

          // Record successful notification
          await ctx.runMutation(internal.ocpAdvisories.recordNotification, {
            advisoryId: args.advisoryId,
            dispensaryId: args.dispensaryId,
            userId: recipient._id,
            channel: "email",
            status: "sent",
            subject,
            body: emailHtml,
            recipientEmail: recipient.email,
            externalId: result.id,
          });
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        console.error(`Error sending email to ${recipient.email}:`, error);
        results.push({ email: recipient.email, success: false, error: errorMsg });

        // Record failed notification
        await ctx.runMutation(internal.ocpAdvisories.recordNotification, {
          advisoryId: args.advisoryId,
          dispensaryId: args.dispensaryId,
          userId: recipient._id,
          channel: "email",
          status: "failed",
          subject,
          body: emailHtml,
          recipientEmail: recipient.email,
          errorMessage: errorMsg,
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    return {
      sent: successCount > 0,
      successCount,
      totalRecipients: recipients.length,
      results
    };
  },
});

/**
 * Internal query to get dispensary by ID
 */
export const getDispensaryById = internalQuery({
  args: { dispensaryId: v.id("dispensaries") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.dispensaryId);
  },
});

/**
 * Internal query to get notification recipients for a dispensary
 * Returns managers, owners, and admins who should receive compliance alerts
 */
export const getNotificationRecipients = internalQuery({
  args: { dispensaryId: v.id("dispensaries") },
  handler: async (ctx, args) => {
    // Get users associated with this dispensary who have compliance view permission
    // Typically managers, owners, and admins
    const users = await ctx.db
      .query("users")
      .filter((q) =>
        q.and(
          q.eq(q.field("dispensaryId"), args.dispensaryId),
          q.eq(q.field("isActive"), true),
          q.or(
            q.eq(q.field("role"), "manager"),
            q.eq(q.field("role"), "owner"),
            q.eq(q.field("role"), "admin")
          )
        )
      )
      .collect();

    return users;
  },
});

/**
 * Internal mutation to record notification in database
 */
export const recordNotification = internalMutation({
  args: {
    advisoryId: v.id("ocpAdvisories"),
    matchId: v.optional(v.id("advisoryProductMatches")),
    dispensaryId: v.id("dispensaries"),
    userId: v.optional(v.id("users")),
    channel: v.union(v.literal("email"), v.literal("in_app"), v.literal("sms")),
    status: v.union(v.literal("pending"), v.literal("sent"), v.literal("delivered"), v.literal("failed")),
    subject: v.string(),
    body: v.string(),
    recipientEmail: v.optional(v.string()),
    recipientPhone: v.optional(v.string()),
    externalId: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    return await ctx.db.insert("alertNotifications", {
      ...args,
      sentAt: args.status === "sent" || args.status === "delivered" ? now : undefined,
      createdAt: now,
    });
  },
});

// ============================================================================
// SUPPLIER EXTRACTION (for Risk Scoring integration)
// ============================================================================

/**
 * Extract suppliers from an advisory and create supplier incidents.
 * Called after advisory processing to feed the Supplier Risk Scoring system.
 */
export const extractSuppliersFromAdvisory = internalAction({
  args: {
    advisoryId: v.id("ocpAdvisories"),
  },
  handler: async (ctx, args) => {
    // Get the advisory
    const advisory = await ctx.runQuery(internal.ocpAdvisories.getAdvisoryInternal, {
      advisoryId: args.advisoryId,
    });

    if (!advisory) {
      throw new Error("Advisory not found");
    }

    const supplierResults: Array<{
      licenseNumber: string;
      supplierId: Id<"suppliers">;
      isNew: boolean;
    }> = [];

    // Extract suppliers from affected licenses
    if (advisory.affectedLicenses && advisory.affectedLicenses.length > 0) {
      for (const licenseNumber of advisory.affectedLicenses) {
        // Try to determine license type from the license format
        const licenseType = inferLicenseType(licenseNumber);

        // Create or get the supplier
        const result = await ctx.runMutation(internal.ocpAdvisories.getOrCreateSupplier, {
          licenseNumber,
          licenseType,
          advisoryTitle: advisory.title,
        });

        supplierResults.push({
          licenseNumber,
          supplierId: result.supplierId,
          isNew: result.isNew,
        });

        // Create supplier incident for each dispensary that has products from this supplier
        await ctx.runMutation(internal.ocpAdvisories.createSupplierIncidentsForAdvisory, {
          supplierId: result.supplierId,
          advisoryId: args.advisoryId,
        });
      }
    }

    return {
      suppliersExtracted: supplierResults.length,
      newSuppliers: supplierResults.filter((r) => r.isNew).length,
      suppliers: supplierResults,
    };
  },
});

/**
 * Infer license type from license number format.
 * Maine uses specific prefixes for different license types.
 */
function inferLicenseType(
  licenseNumber: string
): "grower" | "caregiver" | "processor" | "distributor" | "manufacturer" | "other" {
  const upper = licenseNumber.toUpperCase();

  // Maine license prefixes (example patterns - adjust based on actual OCP formats)
  if (upper.startsWith("AMS") || upper.startsWith("AMC")) {
    return "grower"; // Adult Use Cultivation
  }
  if (upper.startsWith("CG") || upper.includes("CAREGIVER")) {
    return "caregiver";
  }
  if (upper.startsWith("AMP") || upper.startsWith("MMP")) {
    return "processor";
  }
  if (upper.startsWith("AMD") || upper.startsWith("MMD")) {
    return "distributor";
  }
  if (upper.startsWith("MFG") || upper.includes("MANUF")) {
    return "manufacturer";
  }

  return "other";
}

/**
 * Internal mutation to get or create a supplier
 */
export const getOrCreateSupplier = internalMutation({
  args: {
    licenseNumber: v.string(),
    licenseType: v.union(
      v.literal("grower"),
      v.literal("caregiver"),
      v.literal("processor"),
      v.literal("distributor"),
      v.literal("manufacturer"),
      v.literal("other")
    ),
    advisoryTitle: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if supplier exists
    const existing = await ctx.db
      .query("suppliers")
      .withIndex("by_license", (q) => q.eq("licenseNumber", args.licenseNumber))
      .first();

    if (existing) {
      // Update last activity
      await ctx.db.patch(existing._id, {
        lastActivityAt: now,
        updatedAt: now,
      });
      return { supplierId: existing._id, isNew: false };
    }

    // Extract name from license or use placeholder
    const name = `Supplier ${args.licenseNumber}`;

    // Create new supplier
    const supplierId = await ctx.db.insert("suppliers", {
      name,
      licenseNumber: args.licenseNumber,
      licenseType: args.licenseType,
      firstSeenAt: now,
      lastActivityAt: now,
      isActive: true,
      notes: args.advisoryTitle
        ? `First identified from advisory: ${args.advisoryTitle}`
        : undefined,
      createdAt: now,
    });

    return { supplierId, isNew: true };
  },
});

/**
 * Create supplier incidents for all dispensaries that have matches with this advisory
 */
export const createSupplierIncidentsForAdvisory = internalMutation({
  args: {
    supplierId: v.id("suppliers"),
    advisoryId: v.id("ocpAdvisories"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Get advisory
    const advisory = await ctx.db.get(args.advisoryId);
    if (!advisory) return { incidentsCreated: 0 };

    // Get all matches for this advisory
    const matches = await ctx.db
      .query("advisoryProductMatches")
      .withIndex("by_advisory", (q) => q.eq("advisoryId", args.advisoryId))
      .collect();

    // Get unique dispensary IDs from matches
    const dispensaryIds = new Set(matches.map((m) => m.dispensaryId));

    // Map advisory type to incident type
    const incidentTypeMap: Record<string, string> = {
      contamination: "contamination",
      recall: "recall",
      labeling: "labeling",
      safety_alert: "quality",
      other: "other",
    };
    const incidentType = (incidentTypeMap[advisory.advisoryType] ?? "other") as
      | "contamination"
      | "recall"
      | "labeling"
      | "quality"
      | "documentation"
      | "other";

    let incidentsCreated = 0;

    // Create an incident for each affected dispensary
    for (const dispensaryId of dispensaryIds) {
      // Check if incident already exists for this supplier/advisory/dispensary combo
      const existingIncident = await ctx.db
        .query("supplierIncidents")
        .withIndex("by_supplier_dispensary", (q) =>
          q.eq("supplierId", args.supplierId).eq("dispensaryId", dispensaryId)
        )
        .filter((q) => q.eq(q.field("advisoryId"), args.advisoryId))
        .first();

      if (existingIncident) {
        continue; // Skip if already exists
      }

      // Create supplier incident
      await ctx.db.insert("supplierIncidents", {
        supplierId: args.supplierId,
        advisoryId: args.advisoryId,
        dispensaryId,
        incidentType,
        severity: advisory.severity,
        title: advisory.title,
        description: advisory.description,
        affectedBatches: advisory.affectedBatchNumbers,
        affectedProducts: advisory.affectedProducts,
        contaminants: advisory.contaminants,
        contaminantDetails: advisory.contaminantDetails,
        incidentDate: advisory.issuedAt,
        reportedAt: now,
        sourceType: "ocp_advisory",
        sourceReference: advisory.ocpAdvisoryId,
        createdAt: now,
      });

      incidentsCreated++;
    }

    return { incidentsCreated };
  },
});

/**
 * Update processAdvisory to also extract suppliers.
 * Call this after initial processing to feed the risk scoring system.
 */
export const processAdvisoryWithSuppliers = internalAction({
  args: {
    advisoryId: v.id("ocpAdvisories"),
  },
  handler: async (ctx, args) => {
    // First, run the standard advisory processing
    const processingResult = await ctx.runAction(internal.ocpAdvisories.processAdvisory, {
      advisoryId: args.advisoryId,
    });

    // Then, extract suppliers for risk scoring
    const supplierResult = await ctx.runAction(internal.ocpAdvisories.extractSuppliersFromAdvisory, {
      advisoryId: args.advisoryId,
    });

    // Recalculate risk scores for affected suppliers in affected dispensaries
    if (supplierResult.suppliers.length > 0) {
      // Get all dispensaries with matches
      const advisory = await ctx.runQuery(internal.ocpAdvisories.getAdvisoryInternal, {
        advisoryId: args.advisoryId,
      });

      if (advisory) {
        const matches = await ctx.runQuery(internal.ocpAdvisories.getMatchesForAdvisory, {
          advisoryId: args.advisoryId,
        });

        const dispensaryIds = new Set(matches.map((m: { dispensaryId: Id<"dispensaries"> }) => m.dispensaryId));

        // Schedule risk recalculation for each supplier/dispensary combination
        for (const supplier of supplierResult.suppliers) {
          for (const dispensaryId of dispensaryIds) {
            await ctx.scheduler.runAfter(
              1000, // 1 second delay to allow incidents to be fully written
              internal.ocpAdvisories.recalculateSupplierRisk,
              {
                supplierId: supplier.supplierId,
                dispensaryId: dispensaryId as Id<"dispensaries">,
              }
            );
          }
        }
      }
    }

    return {
      processing: processingResult,
      suppliers: supplierResult,
    };
  },
});

/**
 * Get matches for an advisory (internal query)
 */
export const getMatchesForAdvisory = internalQuery({
  args: {
    advisoryId: v.id("ocpAdvisories"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("advisoryProductMatches")
      .withIndex("by_advisory", (q) => q.eq("advisoryId", args.advisoryId))
      .collect();
  },
});

/**
 * Recalculate risk score for a supplier in a dispensary (internal)
 */
export const recalculateSupplierRisk = internalMutation({
  args: {
    supplierId: v.id("suppliers"),
    dispensaryId: v.id("dispensaries"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Import risk scoring utilities
    const { calculateRiskScore, calculateTrend, countIncidentsByType } = await import("./lib/riskScoring");

    // Get all incidents for this supplier in this dispensary
    const incidents = await ctx.db
      .query("supplierIncidents")
      .withIndex("by_supplier_dispensary", (q) =>
        q.eq("supplierId", args.supplierId).eq("dispensaryId", args.dispensaryId)
      )
      .collect();

    // Get products from this supplier in this dispensary
    const products = await ctx.db
      .query("products")
      .withIndex("by_supplier", (q) => q.eq("supplierId", args.supplierId))
      .filter((q) => q.eq(q.field("dispensaryId"), args.dispensaryId))
      .collect();

    // Estimate total batches
    const totalBatches = Math.max(products.length * 5, incidents.length * 10, 10);

    // Convert incidents to scoring format
    const incidentsForScoring = incidents.map((i) => ({
      incidentType: i.incidentType,
      severity: i.severity,
      incidentDate: i.incidentDate,
    }));

    // Calculate score
    const scoreResult = calculateRiskScore(incidentsForScoring, totalBatches);

    // Get existing profile
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
