import { Navigate, useLocation } from 'react-router-dom';
import { Box, Spinner, Center, Text, VStack, Badge } from '@chakra-ui/react';
import { useAuth as useClerkAuth, SignedIn, SignedOut } from '@clerk/clerk-react';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';

// BYPASS MODE: Only enabled via explicit environment variable
// SECURITY: Removed automatic DEV bypass - must explicitly set VITE_BYPASS_AUTH=true
// This prevents accidental deployment with auth disabled
const BYPASS_AUTH = import.meta.env.VITE_BYPASS_AUTH === 'true';

/**
 * ProtectedRoute Component
 * Wraps routes that require authentication via Clerk + Convex
 * Redirects to login if user is not authenticated
 *
 * In bypass mode (dev or VITE_BYPASS_AUTH=true), authentication is skipped
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // BYPASS MODE - Skip all auth checks without touching Clerk hooks.
  if (BYPASS_AUTH) {
    return (
      <>
        <Box
          position="fixed"
          bottom={4}
          right={4}
          zIndex={9999}
        >
          <Badge colorScheme="orange" fontSize="xs" px={3} py={1}>
            DEV MODE - Auth Bypassed
          </Badge>
        </Box>
        {children}
      </>
    );
  }

  const location = useLocation();
  const { isLoaded, isSignedIn } = useClerkAuth();

  // Get user from Convex (includes dispensary, role, permissions)
  // Skip the query in bypass mode to avoid errors
  const convexUser = useQuery(
    api.users.me,
    BYPASS_AUTH ? "skip" : undefined
  );

  // Show loading state while Clerk is initializing
  if (!isLoaded) {
    return (
      <Center h="100vh" bg="slate.900">
        <VStack spacing={4}>
          <Spinner size="xl" color="cannabis.500" thickness="4px" />
          <Text color="slate.400">Loading...</Text>
        </VStack>
      </Center>
    );
  }

  // Show loading state while Convex user is being fetched
  if (isSignedIn && convexUser === undefined) {
    return (
      <Center h="100vh" bg="slate.900">
        <VStack spacing={4}>
          <Spinner size="xl" color="cannabis.500" thickness="4px" />
          <Text color="slate.400">Loading user data...</Text>
        </VStack>
      </Center>
    );
  }

  return (
    <>
      {/* User is not signed in - redirect to login */}
      <SignedOut>
        <Navigate to="/login" state={{ from: location }} replace />
      </SignedOut>

      {/* User is signed in - render protected content */}
      <SignedIn>
        {/* Check if user exists in Convex */}
        {convexUser ? (
          <Box>{children}</Box>
        ) : (
          // User is authenticated with Clerk but not in Convex yet
          // This can happen on first login before webhook creates user
          <Center h="100vh" bg="slate.900">
            <VStack spacing={4}>
              <Spinner size="xl" color="cannabis.500" thickness="4px" />
              <Text color="slate.400">Setting up your account...</Text>
              <Text color="slate.500" fontSize="sm">
                This may take a moment on first login
              </Text>
            </VStack>
          </Center>
        )}
      </SignedIn>
    </>
  );
}

export default ProtectedRoute;
