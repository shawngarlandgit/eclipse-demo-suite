/**
 * Permission Utilities
 * Handles role-based access control (RBAC) for the unified platform
 */

import type { User, UserRole, Permission } from '../types';
import { ROLE_HIERARCHY, ROLE_PERMISSIONS } from '../types';

/**
 * Check if a user has a specific permission
 */
export function hasPermission(user: User | null, permission: Permission): boolean {
  if (!user) return false;

  // Check custom permissions override first
  if (user.permissions && permission in user.permissions) {
    return user.permissions[permission];
  }

  // Fall back to role-based permissions
  const rolePermissions = ROLE_PERMISSIONS[user.role];
  return rolePermissions?.includes(permission) ?? false;
}

/**
 * Check if a user has ALL of the specified permissions
 */
export function hasAllPermissions(user: User | null, permissions: Permission[]): boolean {
  if (!user) return false;
  return permissions.every((permission) => hasPermission(user, permission));
}

/**
 * Check if a user has ANY of the specified permissions
 */
export function hasAnyPermission(user: User | null, permissions: Permission[]): boolean {
  if (!user) return false;
  return permissions.some((permission) => hasPermission(user, permission));
}

/**
 * Check if user's role meets or exceeds minimum required role
 */
export function hasMinimumRole(user: User | null, minimumRole: UserRole): boolean {
  if (!user) return false;
  return ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[minimumRole];
}

/**
 * Check if user's role is exactly the specified role
 */
export function hasExactRole(user: User | null, role: UserRole): boolean {
  if (!user) return false;
  return user.role === role;
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(user: User | null, roles: UserRole[]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}

/**
 * Check if user is a staff member (not a patient)
 */
export function isStaffMember(user: User | null): boolean {
  return hasMinimumRole(user, 'budtender');
}

/**
 * Check if user is a manager or above
 */
export function isManagerOrAbove(user: User | null): boolean {
  return hasMinimumRole(user, 'manager');
}

/**
 * Check if user is an owner or admin
 */
export function isOwnerOrAdmin(user: User | null): boolean {
  return hasMinimumRole(user, 'owner');
}

/**
 * Check if user is a patient (lowest role level)
 */
export function isPatient(user: User | null): boolean {
  return hasExactRole(user, 'patient');
}

/**
 * Check if user is a budtender
 */
export function isBudtender(user: User | null): boolean {
  return hasExactRole(user, 'budtender');
}

/**
 * Get human-readable role name
 */
export function getRoleDisplayName(role: UserRole): string {
  const displayNames: Record<UserRole, string> = {
    patient: 'Patient',
    budtender: 'Budtender',
    staff: 'Staff',
    manager: 'Manager',
    owner: 'Owner',
    admin: 'Administrator',
  };
  return displayNames[role] || role;
}

/**
 * Get role badge color for UI
 */
export function getRoleBadgeColor(role: UserRole): string {
  const colors: Record<UserRole, string> = {
    patient: 'blue',
    budtender: 'teal',
    staff: 'cyan',
    manager: 'purple',
    owner: 'orange',
    admin: 'red',
  };
  return colors[role] || 'gray';
}

/**
 * Check if user can access a specific route
 * Returns true if access is allowed, false otherwise
 */
export function canAccessRoute(
  user: User | null,
  options: {
    minimumRole?: UserRole;
    allowedRoles?: UserRole[];
    requiredPermissions?: Permission[];
    requireAnyPermission?: Permission[];
  }
): boolean {
  if (!user) return false;

  const { minimumRole, allowedRoles, requiredPermissions, requireAnyPermission } = options;

  // Check minimum role requirement
  if (minimumRole && !hasMinimumRole(user, minimumRole)) {
    return false;
  }

  // Check allowed roles
  if (allowedRoles && !hasAnyRole(user, allowedRoles)) {
    return false;
  }

  // Check required permissions (must have ALL)
  if (requiredPermissions && !hasAllPermissions(user, requiredPermissions)) {
    return false;
  }

  // Check any permission (must have at least ONE)
  if (requireAnyPermission && !hasAnyPermission(user, requireAnyPermission)) {
    return false;
  }

  return true;
}
