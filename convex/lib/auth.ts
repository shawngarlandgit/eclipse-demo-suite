import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

// ============================================================================
// BYPASS MODE
// ============================================================================

/**
 * Check if auth bypass is enabled via environment variable.
 * Set BYPASS_AUTH=true in Convex environment for development/testing.
 * NEVER enable in production!
 */
function isBypassEnabled(): boolean {
  return process.env.BYPASS_AUTH === "true";
}

// ============================================================================
// TYPES
// ============================================================================

export type UserRole = "staff" | "manager" | "owner" | "admin";

export interface AuthenticatedUser {
  _id: Id<"users">;
  clerkId: string;
  dispensaryId: Id<"dispensaries">;
  email: string;
  fullName: string;
  role: UserRole;
  permissions: Record<string, boolean>;
  isActive: boolean;
}

// Role hierarchy for permission checks
const ROLE_HIERARCHY: Record<UserRole, number> = {
  staff: 1,
  manager: 2,
  owner: 3,
  admin: 4,
};

/**
 * Create a bypass user for development/testing.
 * Returns a mock admin user with full permissions.
 */
function createBypassUser(dispensaryId: Id<"dispensaries">): AuthenticatedUser {
  return {
    _id: "bypass_user" as Id<"users">,
    clerkId: "bypass_clerk_id",
    dispensaryId,
    email: "bypass@dev.local",
    fullName: "Bypass User (Dev Mode)",
    role: "admin" as UserRole,
    permissions: getDefaultPermissions("admin"),
    isActive: true,
  };
}

// ============================================================================
// CORE AUTH FUNCTIONS
// ============================================================================

/**
 * Get the current user from Clerk identity
 * Returns null if not authenticated
 */
export async function getCurrentUser(
  ctx: QueryCtx | MutationCtx
): Promise<AuthenticatedUser | null> {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    return null;
  }

  // Look up user by Clerk ID
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .first();

  if (!user || !user.isActive) {
    return null;
  }

  return {
    _id: user._id,
    clerkId: user.clerkId,
    dispensaryId: user.dispensaryId,
    email: user.email,
    fullName: user.fullName,
    role: user.role as UserRole,
    permissions: (user.permissions as Record<string, boolean>) || {},
    isActive: user.isActive ?? true,
  };
}

/**
 * Require authentication - throws if not logged in
 */
export async function requireAuth(
  ctx: QueryCtx | MutationCtx
): Promise<AuthenticatedUser> {
  const user = await getCurrentUser(ctx);

  if (!user) {
    throw new Error("Authentication required");
  }

  return user;
}

/**
 * Require access to a specific dispensary
 * Admin users can access all dispensaries
 * In bypass mode (BYPASS_AUTH=true), returns a mock admin user
 */
export async function requireDispensaryAccess(
  ctx: QueryCtx | MutationCtx,
  dispensaryId: Id<"dispensaries">
): Promise<AuthenticatedUser> {
  // Check for bypass mode first
  if (isBypassEnabled()) {
    return createBypassUser(dispensaryId);
  }

  const user = await requireAuth(ctx);

  // Admin can access all dispensaries
  if (user.role === "admin") {
    return user;
  }

  // Check if user belongs to this dispensary
  if (user.dispensaryId !== dispensaryId) {
    throw new Error("Access denied: You don't have access to this dispensary");
  }

  return user;
}

/**
 * Require minimum role level
 * Uses role hierarchy: staff < manager < owner < admin
 */
export async function requireRole(
  ctx: QueryCtx | MutationCtx,
  minimumRole: UserRole
): Promise<AuthenticatedUser> {
  const user = await requireAuth(ctx);

  const userLevel = ROLE_HIERARCHY[user.role];
  const requiredLevel = ROLE_HIERARCHY[minimumRole];

  if (userLevel < requiredLevel) {
    throw new Error(
      `Access denied: Requires ${minimumRole} role or higher`
    );
  }

  return user;
}

/**
 * Require one of specific roles
 */
export async function requireOneOfRoles(
  ctx: QueryCtx | MutationCtx,
  allowedRoles: UserRole[]
): Promise<AuthenticatedUser> {
  const user = await requireAuth(ctx);

  if (!allowedRoles.includes(user.role)) {
    throw new Error(
      `Access denied: Requires one of these roles: ${allowedRoles.join(", ")}`
    );
  }

  return user;
}

/**
 * Require specific permission
 */
export async function requirePermission(
  ctx: QueryCtx | MutationCtx,
  permission: string
): Promise<AuthenticatedUser> {
  const user = await requireAuth(ctx);

  // Admin always has all permissions
  if (user.role === "admin") {
    return user;
  }

  // Check specific permission
  if (!user.permissions[permission]) {
    throw new Error(`Access denied: Missing permission '${permission}'`);
  }

  return user;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if user has at least minimum role
 */
export function hasMinimumRole(
  userRole: UserRole,
  minimumRole: UserRole
): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minimumRole];
}

/**
 * Check if user can access dispensary
 */
export function canAccessDispensary(
  user: AuthenticatedUser,
  dispensaryId: Id<"dispensaries">
): boolean {
  return user.role === "admin" || user.dispensaryId === dispensaryId;
}

/**
 * Get default permissions for a role
 */
export function getDefaultPermissions(role: UserRole): Record<string, boolean> {
  const basePermissions = {
    view_dashboard: true,
    manage_inventory: false,
    view_reports: false,
    manage_staff: false,
    view_analytics: false,
    manage_integrations: false,
    view_audit_logs: false,
  };

  switch (role) {
    case "admin":
      return {
        view_dashboard: true,
        manage_inventory: true,
        view_reports: true,
        manage_staff: true,
        view_analytics: true,
        manage_integrations: true,
        view_audit_logs: true,
      };
    case "owner":
      return {
        view_dashboard: true,
        manage_inventory: true,
        view_reports: true,
        manage_staff: true,
        view_analytics: true,
        manage_integrations: true,
        view_audit_logs: true,
      };
    case "manager":
      return {
        view_dashboard: true,
        manage_inventory: true,
        view_reports: true,
        manage_staff: true,
        view_analytics: true,
        manage_integrations: false,
        view_audit_logs: false,
      };
    case "staff":
    default:
      return basePermissions;
  }
}
