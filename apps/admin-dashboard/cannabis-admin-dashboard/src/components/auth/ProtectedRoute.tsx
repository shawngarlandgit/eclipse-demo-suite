import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, Spinner, Center, Text, VStack, Badge } from '@chakra-ui/react';
import { useAuthStore } from '../../stores/authStore';
import { env } from '../../config/env';
import type { User } from '../../types';

// Demo user for development mode only
// Using The Neon Pipe dispensary for dev testing
const DEMO_USER: User = {
  id: 'demo-user-id',
  dispensary_id: '06c18efa-32ce-44c3-8282-da807fefd23f', // The Neon Pipe
  email: 'admin@theneonpipe.com',
  full_name: 'The Neon Pipe Admin',
  role: 'owner',
  avatar_url: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

/**
 * ProtectedRoute Component
 * Wraps routes that require authentication
 * Redirects to login if user is not authenticated
 * In development mode, auto-logs in with demo user
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user, isLoading, refreshUser, setUser } = useAuthStore();

  // Check session on mount
  useEffect(() => {
    // In development mode, bypass auth with demo user
    if (env.isDev && !user) {
      setUser(DEMO_USER);
      return;
    }

    // In production, refresh user session
    if (!env.isDev) {
      refreshUser();
    }
  }, [refreshUser, setUser, user]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <Center h="100vh" bg="slate.900">
        <VStack spacing={4}>
          <Spinner size="xl" color="cannabis.500" thickness="4px" />
          <Text color="slate.400">Verifying authentication...</Text>
        </VStack>
      </Center>
    );
  }

  // In development mode, always allow access with demo user
  if (env.isDev && !user) {
    // This shouldn't happen due to useEffect, but fallback to be safe
    setUser(DEMO_USER);
  }

  // Redirect to login if not authenticated (production only)
  if (!env.isDev && !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User is authenticated, render protected content
  return (
    <>
      {/* Dev mode indicator */}
      {env.isDev && (
        <Box
          position="fixed"
          bottom={4}
          right={4}
          zIndex={9999}
        >
          <Badge colorScheme="orange" fontSize="xs" px={3} py={1}>
            🔓 DEV MODE - Auto-logged in as {user?.full_name}
          </Badge>
        </Box>
      )}
      {children}
    </>
  );
}

export default ProtectedRoute;
