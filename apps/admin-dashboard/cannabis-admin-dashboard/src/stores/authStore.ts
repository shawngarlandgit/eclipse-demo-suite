import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import { authService } from '../services/api/auth.service';
import { log } from '../utils/logger';

/**
 * Authentication Store
 * Manages user authentication state and auth-related actions
 */

interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial State
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Login Action
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const { user, error } = await authService.login({ email, password });

          if (error) {
            set({
              error: error.message || 'Login failed',
              isLoading: false,
              isAuthenticated: false,
              user: null,
            });
            return false;
          }

          if (user) {
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            return true;
          }

          return false;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Login failed';
          set({
            error: errorMessage,
            isLoading: false,
            isAuthenticated: false,
            user: null,
          });
          return false;
        }
      },

      // Logout Action
      logout: async () => {
        set({ isLoading: true });

        try {
          await authService.logout();

          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          log.error('Logout error:', error);
          // Still clear local state even if logout request fails
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      // Refresh User Data
      refreshUser: async () => {
        set({ isLoading: true });

        try {
          const user = await authService.getCurrentUser();

          if (user) {
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } else {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
            });
          }
        } catch (error) {
          log.error('Refresh user error:', error);
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to refresh user',
          });
        }
      },

      // Clear Error
      clearError: () => {
        set({ error: null });
      },

      // Set User (for external updates)
      setUser: (user: User | null) => {
        set({
          user,
          isAuthenticated: !!user,
        });
      },
    }),
    {
      name: 'cannabis-admin-auth', // LocalStorage key
      partialize: (state) => ({
        // Only persist user data, not loading/error states
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Selector hooks for specific state slices
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);
