import { useUser, useClerk, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '../stores/notificationStore';

// BYPASS MODE: Only enabled via explicit environment variable
// SECURITY: Removed automatic DEV bypass - must explicitly set VITE_BYPASS_AUTH=true
const BYPASS_AUTH = import.meta.env.VITE_BYPASS_AUTH === 'true';

// Log warning in development if bypass is enabled
if (BYPASS_AUTH && import.meta.env.DEV) {
  console.warn(
    '[SECURITY WARNING] Auth bypass is enabled. ' +
    'This should NEVER be used in production. ' +
    'Set VITE_BYPASS_AUTH=false or remove it from .env'
  );
}

/**
 * Custom hook for authentication using Clerk + Convex
 * Provides auth state and actions
 */
export function useAuth() {
  const navigate = useNavigate();
  const { success } = useNotificationStore();

  // BYPASS MODE - never touch Clerk hooks if provider is not mounted.
  if (BYPASS_AUTH) {
    return {
      clerkUser: null,
      user: {
        _id: 'bypass-user' as Id<"users">,
        email: 'admin@test.com',
        name: 'Test Admin',
        role: 'admin' as const,
        permissions: {},
        dispensaryId: 'bypass-dispensary' as Id<"dispensaries">,
        isActive: true,
        _creationTime: Date.now(),
      },
      isAuthenticated: true,
      isLoading: false,
      error: null,
      logout: async () => {
        success('Logged out successfully');
        navigate('/login');
      },
      login: async () => {
        navigate('/dashboard');
        return true;
      },
      refreshUser: async () => {},
      clearError: () => {},
    };
  }

  const { user: clerkUser, isLoaded: isClerkLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();

  // Get user data from Convex (includes dispensary info, role, etc.)
  const convexUser = useQuery(api.users.me);

  const isLoading = !isClerkLoaded || (isSignedIn && convexUser === undefined);

  const logout = async () => {
    await signOut();
    success('Logged out successfully');
    navigate('/login');
  };

  return {
    // Clerk user data
    clerkUser,
    // Convex user data (with dispensary, role, permissions)
    user: convexUser,
    isAuthenticated: isSignedIn && !!convexUser,
    isLoading,
    error: null,
    logout,
    // For compatibility
    login: async () => {
      // Clerk handles login via its components
      navigate('/login');
      return false;
    },
    refreshUser: async () => {
      // Convex auto-refreshes via subscriptions
    },
    clearError: () => {},
  };
}

/**
 * Hook to get the current user from Convex
 * Returns user with dispensary info, role, permissions
 * In bypass mode, returns a mock admin user
 */
export function useCurrentUser() {
  const user = useQuery(
    api.users.me,
    BYPASS_AUTH ? "skip" : undefined
  );

  // In bypass mode, return a mock admin user
  if (BYPASS_AUTH) {
    return {
      _id: 'bypass-user' as Id<"users">,
      email: 'admin@test.com',
      name: 'Test Admin',
      role: 'admin' as const,
      permissions: {},
      dispensaryId: 'bypass-dispensary' as Id<"dispensaries">,
      isActive: true,
      _creationTime: Date.now(),
    };
  }

  return user;
}

/**
 * Hook to get the current user's dispensary
 * In bypass mode, returns the first/default dispensary
 */
export function useCurrentDispensary() {
  const defaultDispensaryId = import.meta.env.VITE_DEFAULT_DISPENSARY_ID as Id<"dispensaries"> | undefined;

  // In bypass mode, get the first dispensary
  const bypassDispensary = useQuery(
    api.dispensaries.getFirst,
    BYPASS_AUTH && !defaultDispensaryId ? {} : "skip"
  );

  // In normal mode, get user's dispensary
  const user = useQuery(
    api.users.me,
    BYPASS_AUTH ? "skip" : undefined
  );

  if (BYPASS_AUTH) {
    if (!bypassDispensary && defaultDispensaryId) {
      return {
        _id: defaultDispensaryId,
        name: "Default Dispensary",
      } as { _id: Id<"dispensaries">; name: string };
    }
    return bypassDispensary ?? null;
  }

  return user?.dispensary ?? null;
}

/**
 * Hook to get the current user's role
 */
export function useCurrentRole() {
  const user = useCurrentUser();
  return user?.role ?? null;
}

/**
 * Hook to check if user has minimum role
 */
export function useHasMinimumRole(minimumRole: 'staff' | 'manager' | 'owner' | 'admin') {
  const role = useCurrentRole();

  if (!role) return false;

  const hierarchy = { staff: 1, manager: 2, owner: 3, admin: 4 };
  return hierarchy[role] >= hierarchy[minimumRole];
}

/**
 * Hook to check if user has specific permission
 */
export function useHasPermission(permission: string) {
  const user = useCurrentUser();

  if (!user) return false;
  if (user.role === 'admin') return true;

  return user.permissions?.[permission] ?? false;
}

/**
 * Hook to require authentication
 * Redirects to login if not authenticated
 */
export function useRequireAuth() {
  const navigate = useNavigate();

  if (BYPASS_AUTH) {
    return { isAuthenticated: true, isLoading: false };
  }

  const { isSignedIn, isLoaded } = useClerkAuth();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate('/login');
    }
  }, [isLoaded, isSignedIn, navigate]);

  return { isAuthenticated: isSignedIn, isLoading: !isLoaded };
}

/**
 * Hook to require minimum role
 * Returns loading state and whether user has required role
 */
export function useRequireRole(minimumRole: 'staff' | 'manager' | 'owner' | 'admin') {
  const user = useQuery(api.users.me);
  const hasRole = useHasMinimumRole(minimumRole);

  return {
    isLoading: user === undefined,
    hasRole,
    user,
  };
}
