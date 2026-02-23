import { supabase } from '../supabase/client';
import type { User, UserRole } from '../../types';
import { ROLE_PERMISSIONS } from '../../utils/constants';
import { log } from '../../utils/logger';

/**
 * Authentication Service
 * Handles all authentication operations with Supabase
 */

// ============================================================================
// Login & Logout
// ============================================================================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResult {
  user: User | null;
  error: Error | null;
}

/**
 * Login with email and password
 */
export async function login(credentials: LoginCredentials): Promise<LoginResult> {
  try {
    // Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (authError) {
      throw authError;
    }

    if (!authData.user) {
      throw new Error('No user data returned');
    }

    // Fetch user profile from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (userError) {
      throw userError;
    }

    // Log audit event
    await logAuditEvent({
      user_id: authData.user.id,
      action: 'login',
      table_affected: 'users',
      record_id: authData.user.id,
    });

    return {
      user: userData as User,
      error: null,
    };
  } catch (error) {
    log.error('Login error', error, 'AuthService');
    return {
      user: null,
      error: error as Error,
    };
  }
}

/**
 * Logout current user
 */
export async function logout(): Promise<{ error: Error | null }> {
  try {
    // Get current user before logout for audit log
    const { data: { user } } = await supabase.auth.getUser();

    // Sign out
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    // Log audit event
    if (user) {
      await logAuditEvent({
        user_id: user.id,
        action: 'login', // Using 'login' action for logout too
        table_affected: 'users',
        record_id: user.id,
      });
    }

    return { error: null };
  } catch (error) {
    log.error('Logout error:', error);
    return { error: error as Error };
  }
}

// ============================================================================
// User Session Management
// ============================================================================

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return null;
    }

    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (error) {
      log.error('Error fetching user data:', error);
      return null;
    }

    return userData as User;
  } catch (error) {
    log.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
}

/**
 * Get user's dispensary ID
 */
export async function getUserDispensaryId(): Promise<string | null> {
  try {
    const user = await getCurrentUser();
    // In development, return a demo dispensary ID if no user is authenticated
    // Use the same ID as budtender-mvp for data consistency
    if (!user && import.meta.env.DEV) {
      return 'demo-dispensary-1';
    }
    return user?.dispensary_id || null;
  } catch (error) {
    log.error('Error getting dispensary ID:', error);
    // Return demo ID in development mode
    if (import.meta.env.DEV) {
      return 'demo-dispensary-1';
    }
    return null;
  }
}

// ============================================================================
// User Profile Management
// ============================================================================

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<User>
): Promise<{ data: User | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log audit event
    await logAuditEvent({
      user_id: userId,
      action: 'edit',
      table_affected: 'users',
      record_id: userId,
      changes: { after: updates },
    });

    return { data: data as User, error: null };
  } catch (error) {
    log.error('Error updating user profile:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Change user password
 */
export async function changePassword(
  newPassword: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw error;
    }

    return { error: null };
  } catch (error) {
    log.error('Error changing password:', error);
    return { error: error as Error };
  }
}

// ============================================================================
// Password Reset
// ============================================================================

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      throw error;
    }

    return { error: null };
  } catch (error) {
    log.error('Error sending password reset email:', error);
    return { error: error as Error };
  }
}

// ============================================================================
// Permissions & Authorization
// ============================================================================

/**
 * Check if user has a specific permission
 */
export function hasPermission(userRole: UserRole, permission: string): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole];

  // Admin has all permissions
  if (rolePermissions.includes('*')) {
    return true;
  }

  return rolePermissions.includes(permission);
}

/**
 * Check if user has any of the given permissions
 */
export function hasAnyPermission(userRole: UserRole, permissions: string[]): boolean {
  return permissions.some((permission) => hasPermission(userRole, permission));
}

/**
 * Check if user has all of the given permissions
 */
export function hasAllPermissions(userRole: UserRole, permissions: string[]): boolean {
  return permissions.every((permission) => hasPermission(userRole, permission));
}

/**
 * Check if user is admin
 */
export function isAdmin(userRole: UserRole): boolean {
  return userRole === 'admin';
}

/**
 * Check if user is owner or admin
 */
export function isOwnerOrAdmin(userRole: UserRole): boolean {
  return userRole === 'owner' || userRole === 'admin';
}

/**
 * Check if user is manager or above
 */
export function isManagerOrAbove(userRole: UserRole): boolean {
  return ['manager', 'owner', 'admin'].includes(userRole);
}

// ============================================================================
// User Management (Admin Only)
// ============================================================================

/**
 * Create new user (admin/owner only)
 */
export async function createUser(
  userData: {
    email: string;
    password: string;
    full_name: string;
    role: UserRole;
    dispensary_id: string;
  }
): Promise<{ data: User | null; error: Error | null }> {
  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
    });

    if (authError) {
      throw authError;
    }

    if (!authData.user) {
      throw new Error('No user created');
    }

    // Create user profile
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role,
        dispensary_id: userData.dispensary_id,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log audit event
    const currentUser = await getCurrentUser();
    if (currentUser) {
      await logAuditEvent({
        user_id: currentUser.id,
        action: 'create',
        table_affected: 'users',
        record_id: data.id,
        changes: { after: data },
      });
    }

    return { data: data as User, error: null };
  } catch (error) {
    log.error('Error creating user:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Delete user (admin/owner only)
 */
export async function deleteUser(
  userId: string
): Promise<{ error: Error | null }> {
  try {
    // Delete from users table (auth user deletion is handled by RLS/triggers)
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      throw error;
    }

    // Log audit event
    const currentUser = await getCurrentUser();
    if (currentUser) {
      await logAuditEvent({
        user_id: currentUser.id,
        action: 'delete',
        table_affected: 'users',
        record_id: userId,
      });
    }

    return { error: null };
  } catch (error) {
    log.error('Error deleting user:', error);
    return { error: error as Error };
  }
}

// ============================================================================
// Audit Logging
// ============================================================================

interface AuditEventData {
  user_id: string;
  action: 'view' | 'edit' | 'delete' | 'export' | 'login' | 'create';
  table_affected: string;
  record_id: string;
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
}

/**
 * Log audit event
 */
async function logAuditEvent(eventData: AuditEventData): Promise<void> {
  try {
    // Get user's IP address (client-side approximation)
    const ipAddress = null; // Would need server-side to get real IP

    await supabase.from('audit_logs').insert({
      ...eventData,
      ip_address: ipAddress,
      dispensary_id: await getUserDispensaryId(),
    });
  } catch (error) {
    // Don't throw on audit log failure, just log it
    log.error('Failed to log audit event:', error);
  }
}

export const authService = {
  login,
  logout,
  getCurrentUser,
  isAuthenticated,
  getUserDispensaryId,
  updateUserProfile,
  changePassword,
  sendPasswordResetEmail,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  isAdmin,
  isOwnerOrAdmin,
  isManagerOrAbove,
  createUser,
  deleteUser,
};

export default authService;
