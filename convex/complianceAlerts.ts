import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireDispensaryAccess, requirePermission, requireAuth } from "./lib/auth";

// ============================================================================
// REAL-TIME QUERIES
// ============================================================================

/**
 * Get active alerts for real-time toast notifications
 * Used by RealTimeAlertToast component for live updates
 */
export const getActiveAlertsForDispensary = query({
  args: {
    dispensaryId: v.id("dispensaries"),
  },
  handler: async (ctx, args) => {
    await requireDispensaryAccess(ctx, args.dispensaryId);

    // Get active (unresolved) matches for this dispensary
    const activeMatches = await ctx.db
      .query("advisoryProductMatches")
      .withIndex("by_dispensary", (q) => q.eq("dispensaryId", args.dispensaryId))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "pending"),
          q.eq(q.field("status"), "confirmed")
        )
      )
      .order("desc")
      .take(50);

    // Enrich with advisory and product details
    const enrichedAlerts = await Promise.all(
      activeMatches.map(async (match) => {
        const advisory = await ctx.db.get(match.advisoryId);
        const product = await ctx.db.get(match.productId);

        return {
          matchId: match._id,
          advisoryId: match.advisoryId,
          productId: match.productId,
          advisoryTitle: advisory?.title ?? "Unknown Advisory",
          severity: advisory?.severity ?? "medium",
          productName: product?.name ?? "Unknown Product",
          matchType: match.matchType,
          matchConfidence: match.matchConfidence,
          status: match.status,
          createdAt: match.createdAt,
          flaggedAt: match.flaggedAt,
        };
      })
    );

    return enrichedAlerts;
  },
});

// ============================================================================
// DASHBOARD QUERIES
// ============================================================================

/**
 * Get compliance alert dashboard summary for a dispensary
 */
export const getDashboardSummary = query({
  args: {
    dispensaryId: v.id("dispensaries"),
  },
  handler: async (ctx, args) => {
    await requireDispensaryAccess(ctx, args.dispensaryId);

    // Get all matches for this dispensary
    const matches = await ctx.db
      .query("advisoryProductMatches")
      .withIndex("by_dispensary", (q) => q.eq("dispensaryId", args.dispensaryId))
      .collect();

    // Get active advisories
    const activeAdvisories = await ctx.db
      .query("ocpAdvisories")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    // Calculate metrics
    const pendingMatches = matches.filter((m) => m.status === "pending");
    const confirmedMatches = matches.filter((m) => m.status === "confirmed");
    const resolvedMatches = matches.filter((m) => m.status === "resolved");
    const falsePositives = matches.filter((m) => m.status === "false_positive");

    // Calculate average resolution time
    const resolvedWithTime = resolvedMatches.filter((m) => m.resolvedAt && m.flaggedAt);
    const avgResolutionTime = resolvedWithTime.length > 0
      ? resolvedWithTime.reduce((sum, m) => sum + (m.resolvedAt! - m.flaggedAt), 0) / resolvedWithTime.length
      : 0;

    // Count by severity
    const matchesBySeverity: Record<string, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    for (const match of [...pendingMatches, ...confirmedMatches]) {
      const advisory = await ctx.db.get(match.advisoryId);
      if (advisory) {
        matchesBySeverity[advisory.severity]++;
      }
    }

    return {
      // Counts
      totalActiveMatches: pendingMatches.length + confirmedMatches.length,
      pendingCount: pendingMatches.length,
      confirmedCount: confirmedMatches.length,
      resolvedCount: resolvedMatches.length,
      falsePositiveCount: falsePositives.length,

      // By severity
      criticalCount: matchesBySeverity.critical,
      highCount: matchesBySeverity.high,
      mediumCount: matchesBySeverity.medium,
      lowCount: matchesBySeverity.low,

      // Response metrics
      avgResolutionTimeMs: avgResolutionTime,
      avgResolutionTimeHours: avgResolutionTime / (1000 * 60 * 60),

      // Advisory counts
      totalActiveAdvisories: activeAdvisories.length,

      // Products affected
      productsAffected: new Set([...pendingMatches, ...confirmedMatches].map((m) => m.productId.toString())).size,
    };
  },
});

/**
 * Get flagged products for a dispensary
 */
export const getFlaggedProducts = query({
  args: {
    dispensaryId: v.id("dispensaries"),
    includeResolved: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireDispensaryAccess(ctx, args.dispensaryId);

    // Get products with compliance flags
    const products = await ctx.db
      .query("products")
      .withIndex("by_dispensary", (q) => q.eq("dispensaryId", args.dispensaryId))
      .filter((q) =>
        q.or(
          q.eq(q.field("complianceStatus"), "flagged"),
          q.eq(q.field("complianceStatus"), "locked"),
          args.includeResolved ? q.eq(q.field("complianceStatus"), "under_review") : false
        )
      )
      .collect();

    // Enrich with match and advisory details
    const enrichedProducts = await Promise.all(
      products.map(async (product) => {
        const match = product.complianceFlagId
          ? await ctx.db.get(product.complianceFlagId)
          : null;

        const advisory = match ? await ctx.db.get(match.advisoryId) : null;

        return {
          ...product,
          complianceMatch: match,
          advisory,
        };
      })
    );

    return enrichedProducts;
  },
});

/**
 * Get notification history for a dispensary
 */
export const getNotificationHistory = query({
  args: {
    dispensaryId: v.id("dispensaries"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireDispensaryAccess(ctx, args.dispensaryId);

    const limit = args.limit ?? 50;

    const notifications = await ctx.db
      .query("alertNotifications")
      .withIndex("by_dispensary", (q) => q.eq("dispensaryId", args.dispensaryId))
      .order("desc")
      .take(limit);

    // Enrich with advisory details
    const enrichedNotifications = await Promise.all(
      notifications.map(async (notification) => {
        const advisory = await ctx.db.get(notification.advisoryId);
        return {
          ...notification,
          advisory,
        };
      })
    );

    return enrichedNotifications;
  },
});

/**
 * Get resolution metrics for reporting
 */
export const getResolutionMetrics = query({
  args: {
    dispensaryId: v.id("dispensaries"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireDispensaryAccess(ctx, args.dispensaryId);

    const startDate = args.startDate ?? Date.now() - 30 * 24 * 60 * 60 * 1000; // Default 30 days
    const endDate = args.endDate ?? Date.now();

    // Get resolution logs in date range
    const logs = await ctx.db
      .query("complianceResolutionLogs")
      .withIndex("by_dispensary", (q) => q.eq("dispensaryId", args.dispensaryId))
      .filter((q) =>
        q.and(
          q.gte(q.field("createdAt"), startDate),
          q.lte(q.field("createdAt"), endDate)
        )
      )
      .collect();

    // Group by action type
    const actionCounts: Record<string, number> = {};
    const userCounts: Record<string, number> = {};

    for (const log of logs) {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
      userCounts[log.userEmail] = (userCounts[log.userEmail] || 0) + 1;
    }

    // Calculate response time distribution
    const matches = await ctx.db
      .query("advisoryProductMatches")
      .withIndex("by_dispensary", (q) => q.eq("dispensaryId", args.dispensaryId))
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), "resolved"),
          q.gte(q.field("resolvedAt"), startDate),
          q.lte(q.field("resolvedAt"), endDate)
        )
      )
      .collect();

    const resolutionTimes = matches
      .filter((m) => m.resolvedAt && m.flaggedAt)
      .map((m) => (m.resolvedAt! - m.flaggedAt) / (1000 * 60 * 60)); // Hours

    return {
      totalActions: logs.length,
      actionBreakdown: actionCounts,
      userBreakdown: userCounts,
      resolutionsInPeriod: matches.length,
      avgResolutionTimeHours:
        resolutionTimes.length > 0
          ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
          : 0,
      minResolutionTimeHours: Math.min(...resolutionTimes) || 0,
      maxResolutionTimeHours: Math.max(...resolutionTimes) || 0,
    };
  },
});

/**
 * Get resolution audit trail
 */
export const getResolutionAuditTrail = query({
  args: {
    dispensaryId: v.id("dispensaries"),
    advisoryId: v.optional(v.id("ocpAdvisories")),
    matchId: v.optional(v.id("advisoryProductMatches")),
    productId: v.optional(v.id("products")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireDispensaryAccess(ctx, args.dispensaryId);

    const limit = args.limit ?? 100;

    let logsQuery = ctx.db
      .query("complianceResolutionLogs")
      .withIndex("by_dispensary", (q) => q.eq("dispensaryId", args.dispensaryId))
      .order("desc");

    // Apply filters
    if (args.advisoryId) {
      logsQuery = logsQuery.filter((q) =>
        q.eq(q.field("advisoryId"), args.advisoryId)
      );
    }

    if (args.matchId) {
      logsQuery = logsQuery.filter((q) =>
        q.eq(q.field("matchId"), args.matchId)
      );
    }

    if (args.productId) {
      logsQuery = logsQuery.filter((q) =>
        q.eq(q.field("productId"), args.productId)
      );
    }

    const logs = await logsQuery.take(limit);

    // Enrich with related data
    const enrichedLogs = await Promise.all(
      logs.map(async (log) => {
        const advisory = await ctx.db.get(log.advisoryId);
        const product = log.productId ? await ctx.db.get(log.productId) : null;
        const user = await ctx.db.get(log.userId);

        return {
          ...log,
          advisory,
          product,
          user,
        };
      })
    );

    return enrichedLogs;
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create an in-app notification for a match
 */
export const createNotification = mutation({
  args: {
    advisoryId: v.id("ocpAdvisories"),
    matchId: v.optional(v.id("advisoryProductMatches")),
    dispensaryId: v.id("dispensaries"),
    userId: v.optional(v.id("users")),
    subject: v.string(),
    body: v.string(),
    channel: v.union(v.literal("email"), v.literal("in_app"), v.literal("sms")),
    recipientEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requirePermission(ctx, "manage_compliance");

    const notificationId = await ctx.db.insert("alertNotifications", {
      advisoryId: args.advisoryId,
      matchId: args.matchId,
      dispensaryId: args.dispensaryId,
      userId: args.userId,
      channel: args.channel,
      status: args.channel === "in_app" ? "delivered" : "pending",
      subject: args.subject,
      body: args.body,
      recipientEmail: args.recipientEmail,
      createdAt: Date.now(),
      sentAt: args.channel === "in_app" ? Date.now() : undefined,
      deliveredAt: args.channel === "in_app" ? Date.now() : undefined,
    });

    return notificationId;
  },
});

/**
 * Mark notification as read
 */
export const markNotificationRead = mutation({
  args: {
    notificationId: v.id("alertNotifications"),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    const notification = await ctx.db.get(args.notificationId);
    if (!notification) {
      throw new Error("Notification not found");
    }

    // Verify user has access to this notification
    if (notification.userId && notification.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    await requireDispensaryAccess(ctx, notification.dispensaryId);

    await ctx.db.patch(args.notificationId, {
      readAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Get unread notification count
 */
export const getUnreadNotificationCount = query({
  args: {
    dispensaryId: v.id("dispensaries"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    await requireDispensaryAccess(ctx, args.dispensaryId);

    let notificationsQuery = ctx.db
      .query("alertNotifications")
      .withIndex("by_dispensary", (q) => q.eq("dispensaryId", args.dispensaryId))
      .filter((q) =>
        q.and(
          q.eq(q.field("channel"), "in_app"),
          q.eq(q.field("readAt"), undefined)
        )
      );

    if (args.userId) {
      notificationsQuery = notificationsQuery.filter((q) =>
        q.or(
          q.eq(q.field("userId"), args.userId),
          q.eq(q.field("userId"), undefined)
        )
      );
    }

    const notifications = await notificationsQuery.collect();
    return notifications.length;
  },
});

/**
 * Generate compliance report data (for export)
 */
export const generateComplianceReport = query({
  args: {
    dispensaryId: v.id("dispensaries"),
    startDate: v.number(),
    endDate: v.number(),
    includeResolved: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireDispensaryAccess(ctx, args.dispensaryId);
    await requirePermission(ctx, "view_compliance");

    // Get dispensary info
    const dispensary = await ctx.db.get(args.dispensaryId);
    if (!dispensary) {
      throw new Error("Dispensary not found");
    }

    // Get all matches in date range
    const matches = await ctx.db
      .query("advisoryProductMatches")
      .withIndex("by_dispensary", (q) => q.eq("dispensaryId", args.dispensaryId))
      .filter((q) =>
        q.and(
          q.gte(q.field("createdAt"), args.startDate),
          q.lte(q.field("createdAt"), args.endDate)
        )
      )
      .collect();

    // Filter by status if needed
    const filteredMatches = args.includeResolved
      ? matches
      : matches.filter((m) => m.status !== "resolved" && m.status !== "false_positive");

    // Get resolution logs
    const resolutionLogs = await ctx.db
      .query("complianceResolutionLogs")
      .withIndex("by_dispensary", (q) => q.eq("dispensaryId", args.dispensaryId))
      .filter((q) =>
        q.and(
          q.gte(q.field("createdAt"), args.startDate),
          q.lte(q.field("createdAt"), args.endDate)
        )
      )
      .collect();

    // Enrich matches with details
    const enrichedMatches = await Promise.all(
      filteredMatches.map(async (match) => {
        const advisory = await ctx.db.get(match.advisoryId);
        const product = await ctx.db.get(match.productId);
        const resolvedBy = match.resolvedBy ? await ctx.db.get(match.resolvedBy) : null;

        return {
          matchId: match._id,
          advisoryId: advisory?.ocpAdvisoryId,
          advisoryTitle: advisory?.title,
          advisorySeverity: advisory?.severity,
          productName: product?.name,
          productSku: product?.sku,
          productBrand: product?.brand,
          productBatchNumber: product?.batchNumber,
          matchType: match.matchType,
          matchedValue: match.matchedValue,
          matchConfidence: match.matchConfidence,
          status: match.status,
          flaggedAt: new Date(match.flaggedAt).toISOString(),
          resolvedAt: match.resolvedAt ? new Date(match.resolvedAt).toISOString() : null,
          resolvedBy: resolvedBy?.email,
          resolutionAction: match.resolutionAction,
          resolutionNotes: match.resolutionNotes,
          quantityAffected: match.quantityAffected,
          quantityResolved: match.quantityResolved,
        };
      })
    );

    // Calculate summary statistics
    const summary = {
      reportGeneratedAt: new Date().toISOString(),
      reportPeriod: {
        start: new Date(args.startDate).toISOString(),
        end: new Date(args.endDate).toISOString(),
      },
      dispensary: {
        name: dispensary.name,
        licenseNumber: dispensary.licenseNumber,
      },
      totalMatches: filteredMatches.length,
      byStatus: {
        pending: filteredMatches.filter((m) => m.status === "pending").length,
        confirmed: filteredMatches.filter((m) => m.status === "confirmed").length,
        resolved: filteredMatches.filter((m) => m.status === "resolved").length,
        falsePositive: filteredMatches.filter((m) => m.status === "false_positive").length,
      },
      bySeverity: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      },
      totalResolutionActions: resolutionLogs.length,
    };

    // Count by severity
    for (const match of enrichedMatches) {
      if (match.advisorySeverity) {
        summary.bySeverity[match.advisorySeverity as keyof typeof summary.bySeverity]++;
      }
    }

    return {
      summary,
      matches: enrichedMatches,
      auditTrail: resolutionLogs.map((log) => ({
        action: log.action,
        userEmail: log.userEmail,
        userRole: log.userRole,
        previousStatus: log.previousStatus,
        newStatus: log.newStatus,
        notes: log.notes,
        createdAt: new Date(log.createdAt).toISOString(),
      })),
    };
  },
});
