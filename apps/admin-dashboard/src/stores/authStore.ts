import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Authentication Store
 * Minimal store for Clerk + Convex auth
 * Most auth state comes from Clerk hooks directly
 */

interface AuthState {
  // Local preferences
  lastDispensaryId: string | null;

  // Actions
  setLastDispensaryId: (id: string | null) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      lastDispensaryId: null,

      setLastDispensaryId: (id: string | null) => {
        set({ lastDispensaryId: id });
      },

      reset: () => {
        set({ lastDispensaryId: null });
      },
    }),
    {
      name: 'cannabis-admin-auth-v3',
    }
  )
);

// Re-export hooks from useAuth for compatibility
// Components should use hooks from useAuth.ts instead
export const useUser = () => {
  // This is a shim - components should migrate to useCurrentUser from useAuth
  console.warn('useUser from authStore is deprecated. Use useCurrentUser from hooks/useAuth');
  return null;
};

export const useIsAuthenticated = () => {
  console.warn('useIsAuthenticated from authStore is deprecated. Use useAuth from hooks/useAuth');
  return false;
};

export const useAuthLoading = () => {
  console.warn('useAuthLoading from authStore is deprecated. Use useAuth from hooks/useAuth');
  return false;
};

export const useAuthError = () => {
  console.warn('useAuthError from authStore is deprecated. Use useAuth from hooks/useAuth');
  return null;
};
