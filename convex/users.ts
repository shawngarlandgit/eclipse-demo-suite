import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth, requireRole, requireDispensaryAccess, getDefaultPermissions } from "./lib/auth";

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get current authenticated user
 */
export const me = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return null;
    }

    // Also fetch dispensary info
    const dispensary = await ctx.db.get(user.dispensaryId);

    return {
      ...user,
      dispensary: dispensary
        ? {
            _id: dispensary._id,
            name: dispensary.name,
          }
        : null,
    };
  },
});

/**
 * Get users for a dispensary
 */
export const listByDispensary = query({
  args: {
    dispensaryId: v.id("dispensaries"),
  },
  handler: async (ctx, args) => {
    await requireDispensaryAccess(ctx, args.dispensaryId);

    const users = await ctx.db
      .query("users")
      .withIndex("by_dispensary", (q) => q.eq("dispensaryId", args.dispensaryId))
      .collect();

    return users;
  },
});

/**
 * Get user by ID
 */
export const getById = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }

    await requireDispensaryAccess(ctx, user.dispensaryId);
    return user;
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new user (requires manager+ role)
 */
export const create = mutation({
  args: {
    clerkId: v.string(),
    dispensaryId: v.id("dispensaries"),
    email: v.string(),
    fullName: v.string(),
    role: v.union(
      v.literal("staff"),
      v.literal("manager"),
      v.literal("owner"),
      v.literal("admin")
    ),
    employeeId: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Require manager role to create users
    await requireRole(ctx, "manager");

    // Check if user already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existing) {
      throw new Error("User already exists");
    }

    // Get default permissions for role
    const permissions = getDefaultPermissions(args.role);

    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      dispensaryId: args.dispensaryId,
      email: args.email,
      fullName: args.fullName,
      role: args.role,
      permissions,
      employeeId: args.employeeId,
      avatarUrl: args.avatarUrl,
      isActive: true,
      createdAt: Date.now(),
    });

    return userId;
  },
});

/**
 * Update user role (requires owner+ role)
 */
export const updateRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(
      v.literal("staff"),
      v.literal("manager"),
      v.literal("owner"),
      v.literal("admin")
    ),
  },
  handler: async (ctx, args) => {
    // Require owner role to change roles
    const currentUser = await requireRole(ctx, "owner");

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Can't change your own role
    if (user._id === currentUser._id) {
      throw new Error("Cannot change your own role");
    }

    // Only admin can create other admins
    if (args.role === "admin" && currentUser.role !== "admin") {
      throw new Error("Only admins can create other admins");
    }

    // Update role and permissions
    const permissions = getDefaultPermissions(args.role);

    await ctx.db.patch(args.userId, {
      role: args.role,
      permissions,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Deactivate user (requires manager+ role)
 */
export const deactivate = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireRole(ctx, "manager");

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Can't deactivate yourself
    if (user._id === currentUser._id) {
      throw new Error("Cannot deactivate yourself");
    }

    await ctx.db.patch(args.userId, {
      isActive: false,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Update last login timestamp
 */
export const recordLogin = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);

    await ctx.db.patch(user._id, {
      lastLoginAt: Date.now(),
    });
  },
});

// ============================================================================
// INTERNAL MUTATIONS (for webhooks)
// ============================================================================

/**
 * Sync user info from Clerk webhook
 */
export const syncClerkUser = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    fullName: v.string(),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (user) {
      await ctx.db.patch(user._id, {
        email: args.email,
        fullName: args.fullName,
        avatarUrl: args.avatarUrl,
        updatedAt: Date.now(),
      });
    }
    // Don't create users automatically - they must be added by an admin
  },
});

/**
 * Deactivate user by Clerk ID (for user.deleted webhook)
 */
export const deactivateByClerkId = internalMutation({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (user) {
      await ctx.db.patch(user._id, {
        isActive: false,
        updatedAt: Date.now(),
      });
    }
  },
});
