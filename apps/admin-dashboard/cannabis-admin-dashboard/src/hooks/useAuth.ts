import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '../stores/notificationStore';

/**
 * Custom hook for authentication
 * Provides auth state and actions
 */
export function useAuth() {
  const navigate = useNavigate();
  const { success, error: showError } = useNotificationStore();

  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login: loginAction,
    logout: logoutAction,
    refreshUser,
    clearError,
  } = useAuthStore();

  const login = async (email: string, password: string) => {
    const result = await loginAction(email, password);

    if (result) {
      success('Login successful!');
      navigate('/dashboard');
      return true;
    } else {
      showError(error || 'Login failed');
      return false;
    }
  };

  const logout = async () => {
    await logoutAction();
    success('Logged out successfully');
    navigate('/login');
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    refreshUser,
    clearError,
  };
}

/**
 * Hook to require authentication
 * Redirects to login if not authenticated
 */
export function useRequireAuth() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuthStore();

  if (!isLoading && !isAuthenticated) {
    navigate('/login');
  }

  return { isAuthenticated, isLoading };
}
