import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth, requireRole, requireDispensaryAccess, hasMinimumRole } from "./lib/auth";

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get first/default dispensary (for dev/bypass mode only)
 * Returns the first active dispensary without requiring auth
 */
export const getFirst = query({
  args: {},
  handler: async (ctx) => {
    // Get the first active dispensary
    const dispensary = await ctx.db
      .query("dispensaries")
      .filter((q) => q.neq(q.field("isActive"), false))
      .first();
    return dispensary;
  },
});

/**
 * List all dispensaries (admin only) or user's dispensary
 */
export const list = query({
  args: {
    includeInactive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    // Admin can see all dispensaries
    if (user.role === "admin") {
      let dispensariesQuery = ctx.db.query("dispensaries");

      if (!args.includeInactive) {
        dispensariesQuery = dispensariesQuery.filter((q) =>
          q.neq(q.field("isActive"), false)
        );
      }

      const dispensaries = await dispensariesQuery.collect();
      return dispensaries.sort((a, b) => a.name.localeCompare(b.name));
    }

    // Non-admin users only see their own dispensary
    const dispensary = await ctx.db.get(user.dispensaryId);
    if (!dispensary) {
      return [];
    }

    return [dispensary];
  },
});

/**
 * Get a single dispensary by ID
 */
export const getById = query({
  args: {
    dispensaryId: v.id("dispensaries"),
  },
  handler: async (ctx, args) => {
    await requireDispensaryAccess(ctx, args.dispensaryId);

    const dispensary = await ctx.db.get(args.dispensaryId);
    return dispensary;
  },
});

/**
 * Get current user's dispensary
 */
export const getCurrent = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);

    const dispensary = await ctx.db.get(user.dispensaryId);
    return dispensary;
  },
});

/**
 * Get dispensary with user count
 */
export const getWithStats = query({
  args: {
    dispensaryId: v.id("dispensaries"),
  },
  handler: async (ctx, args) => {
    await requireDispensaryAccess(ctx, args.dispensaryId);

    const dispensary = await ctx.db.get(args.dispensaryId);
    if (!dispensary) {
      return null;
    }

    // Get user count
    const users = await ctx.db
      .query("users")
      .withIndex("by_dispensary", (q) => q.eq("dispensaryId", args.dispensaryId))
      .collect();

    const activeUsers = users.filter((u) => u.isActive !== false);

    // Get product count
    const products = await ctx.db
      .query("products")
      .withIndex("by_dispensary", (q) => q.eq("dispensaryId", args.dispensaryId))
      .collect();

    const activeProducts = products.filter((p) => p.isActive !== false);

    // Get today's transaction count
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todayTransactions = await ctx.db
      .query("transactions")
      .withIndex("by_dispensary_date", (q) =>
        q.eq("dispensaryId", args.dispensaryId).gte("transactionDate", startOfDay.getTime())
      )
      .collect();

    // Get unresolved compliance flags
    const complianceFlags = await ctx.db
      .query("complianceFlags")
      .withIndex("by_dispensary", (q) => q.eq("dispensaryId", args.dispensaryId))
      .filter((q) => q.eq(q.field("resolvedAt"), undefined))
      .collect();

    return {
      ...dispensary,
      stats: {
        total_users: users.length,
        active_users: activeUsers.length,
        total_products: products.length,
        active_products: activeProducts.length,
        today_transactions: todayTransactions.length,
        unresolved_flags: complianceFlags.length,
      },
    };
  },
});

/**
 * Get all dispensaries with stats (admin only)
 */
export const listWithStats = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, "admin");

    const dispensaries = await ctx.db
      .query("dispensaries")
      .filter((q) => q.neq(q.field("isActive"), false))
      .collect();

    const results = [];

    for (const dispensary of dispensaries) {
      // Get user count
      const users = await ctx.db
        .query("users")
        .withIndex("by_dispensary", (q) => q.eq("dispensaryId", dispensary._id))
        .filter((q) => q.neq(q.field("isActive"), false))
        .collect();

      // Get product count
      const products = await ctx.db
        .query("products")
        .withIndex("by_dispensary", (q) => q.eq("dispensaryId", dispensary._id))
        .filter((q) => q.neq(q.field("isActive"), false))
        .collect();

      results.push({
        ...dispensary,
        stats: {
          active_users: users.length,
          active_products: products.length,
        },
      });
    }

    return results.sort((a, b) => a.name.localeCompare(b.name));
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new dispensary (admin only)
 */
export const create = mutation({
  args: {
    name: v.string(),
    licenseNumber: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    addressLine1: v.string(),
    addressLine2: v.optional(v.string()),
    city: v.string(),
    state: v.string(),
    zipCode: v.string(),
    timezone: v.optional(v.string()),
    taxRate: v.optional(v.number()),
    settings: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, "admin");

    // Check for duplicate license number
    const existingLicense = await ctx.db
      .query("dispensaries")
      .withIndex("by_license", (q) => q.eq("licenseNumber", args.licenseNumber))
      .first();

    if (existingLicense) {
      throw new Error(`Dispensary with license '${args.licenseNumber}' already exists`);
    }

    const dispensaryId = await ctx.db.insert("dispensaries", {
      name: args.name,
      licenseNumber: args.licenseNumber,
      email: args.email,
      phone: args.phone,
      addressLine1: args.addressLine1,
      addressLine2: args.addressLine2,
      city: args.city,
      state: args.state,
      zipCode: args.zipCode,
      timezone: args.timezone ?? "America/Los_Angeles",
      taxRate: args.taxRate ?? 0.0875,
      settings: args.settings ?? {},
      isActive: true,
      createdAt: Date.now(),
    });

    return dispensaryId;
  },
});

/**
 * Update dispensary details
 * Owner can update basic info, admin can update everything
 */
export const update = mutation({
  args: {
    dispensaryId: v.id("dispensaries"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    addressLine1: v.optional(v.string()),
    addressLine2: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    zipCode: v.optional(v.string()),
    timezone: v.optional(v.string()),
    taxRate: v.optional(v.number()),
    settings: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    await requireDispensaryAccess(ctx, args.dispensaryId);

    // Owner+ can update their dispensary
    if (!hasMinimumRole(user.role, "owner")) {
      throw new Error("Only owners and admins can update dispensary settings");
    }

    const dispensary = await ctx.db.get(args.dispensaryId);
    if (!dispensary) {
      throw new Error("Dispensary not found");
    }

    // Build update object
    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updates.name = args.name;
    if (args.email !== undefined) updates.email = args.email;
    if (args.phone !== undefined) updates.phone = args.phone;
    if (args.addressLine1 !== undefined) updates.addressLine1 = args.addressLine1;
    if (args.addressLine2 !== undefined) updates.addressLine2 = args.addressLine2;
    if (args.city !== undefined) updates.city = args.city;
    if (args.state !== undefined) updates.state = args.state;
    if (args.zipCode !== undefined) updates.zipCode = args.zipCode;
    if (args.timezone !== undefined) updates.timezone = args.timezone;
    if (args.taxRate !== undefined) updates.taxRate = args.taxRate;
    if (args.settings !== undefined) updates.settings = args.settings;

    await ctx.db.patch(args.dispensaryId, updates);
  },
});

/**
 * Update dispensary license (admin only - compliance sensitive)
 */
export const updateLicense = mutation({
  args: {
    dispensaryId: v.id("dispensaries"),
    licenseNumber: v.string(),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, "admin");

    const dispensary = await ctx.db.get(args.dispensaryId);
    if (!dispensary) {
      throw new Error("Dispensary not found");
    }

    // Check for duplicate license number
    const existingLicense = await ctx.db
      .query("dispensaries")
      .withIndex("by_license", (q) => q.eq("licenseNumber", args.licenseNumber))
      .first();

    if (existingLicense && existingLicense._id !== args.dispensaryId) {
      throw new Error(`License number '${args.licenseNumber}' is already in use`);
    }

    await ctx.db.patch(args.dispensaryId, {
      licenseNumber: args.licenseNumber,
      updatedAt: Date.now(),
    });

    // Create audit log for license change
    const user = await requireAuth(ctx);
    await ctx.db.insert("auditLogs", {
      dispensaryId: args.dispensaryId,
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: "update",
      resourceType: "dispensary",
      resourceId: args.dispensaryId,
      oldValues: { licenseNumber: dispensary.licenseNumber },
      newValues: { licenseNumber: args.licenseNumber },
      status: "success",
      logDate: new Date().toISOString().split("T")[0],
      createdAt: Date.now(),
    });
  },
});

/**
 * Update dispensary settings (JSON blob)
 */
export const updateSettings = mutation({
  args: {
    dispensaryId: v.id("dispensaries"),
    settings: v.any(),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    await requireDispensaryAccess(ctx, args.dispensaryId);

    // Owner+ can update settings
    if (!hasMinimumRole(user.role, "owner")) {
      throw new Error("Only owners and admins can update dispensary settings");
    }

    const dispensary = await ctx.db.get(args.dispensaryId);
    if (!dispensary) {
      throw new Error("Dispensary not found");
    }

    // Merge settings (deep merge would be better but keep simple for now)
    const mergedSettings = {
      ...(dispensary.settings as Record<string, unknown> || {}),
      ...args.settings,
    };

    await ctx.db.patch(args.dispensaryId, {
      settings: mergedSettings,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Deactivate a dispensary (admin only)
 */
export const deactivate = mutation({
  args: {
    dispensaryId: v.id("dispensaries"),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, "admin");

    const dispensary = await ctx.db.get(args.dispensaryId);
    if (!dispensary) {
      throw new Error("Dispensary not found");
    }

    // Deactivate all users in this dispensary
    const users = await ctx.db
      .query("users")
      .withIndex("by_dispensary", (q) => q.eq("dispensaryId", args.dispensaryId))
      .collect();

    for (const user of users) {
      await ctx.db.patch(user._id, {
        isActive: false,
        updatedAt: Date.now(),
      });
    }

    await ctx.db.patch(args.dispensaryId, {
      isActive: false,
      updatedAt: Date.now(),
    });

    // Create audit log
    const currentUser = await requireAuth(ctx);
    await ctx.db.insert("auditLogs", {
      dispensaryId: args.dispensaryId,
      userId: currentUser._id,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      action: "delete",
      resourceType: "dispensary",
      resourceId: args.dispensaryId,
      oldValues: { isActive: true },
      newValues: { isActive: false },
      status: "success",
      logDate: new Date().toISOString().split("T")[0],
      createdAt: Date.now(),
    });
  },
});

/**
 * Reactivate a dispensary (admin only)
 */
export const reactivate = mutation({
  args: {
    dispensaryId: v.id("dispensaries"),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, "admin");

    const dispensary = await ctx.db.get(args.dispensaryId);
    if (!dispensary) {
      throw new Error("Dispensary not found");
    }

    await ctx.db.patch(args.dispensaryId, {
      isActive: true,
      updatedAt: Date.now(),
    });

    // Create audit log
    const currentUser = await requireAuth(ctx);
    await ctx.db.insert("auditLogs", {
      dispensaryId: args.dispensaryId,
      userId: currentUser._id,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      action: "update",
      resourceType: "dispensary",
      resourceId: args.dispensaryId,
      oldValues: { isActive: false },
      newValues: { isActive: true },
      status: "success",
      logDate: new Date().toISOString().split("T")[0],
      createdAt: Date.now(),
    });
  },
});
