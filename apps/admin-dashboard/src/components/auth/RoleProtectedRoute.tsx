import { Navigate, useLocation } from 'react-router-dom';
import { Box, Center, Text, VStack, Icon, Button } from '@chakra-ui/react';
import { FiLock, FiAlertTriangle } from 'react-icons/fi';
import { useCurrentUser } from '../../hooks/useAuth';
import type { UserRole, Permission } from '../../types';
import { canAccessRoute, getRoleDisplayName } from '../../utils/permissions';

// BYPASS MODE: Only enabled via explicit environment variable
// SECURITY: Removed automatic DEV bypass - must explicitly set VITE_BYPASS_AUTH=true
// This prevents accidental deployment with auth disabled
const BYPASS_AUTH = import.meta.env.VITE_BYPASS_AUTH === 'true';

export interface RoleProtectedRouteProps {
  children: React.ReactNode;
  minimumRole?: UserRole;
  allowedRoles?: UserRole[];
  requiredPermissions?: Permission[];
  requireAnyPermission?: Permission[];
  fallbackPath?: string;
  showAccessDenied?: boolean;
}

/**
 * RoleProtectedRoute Component
 * Extends ProtectedRoute with role-based access control (RBAC)
 * Use this to protect routes that require specific roles or permissions
 *
 * @example
 * // Require minimum role of manager
 * <RoleProtectedRoute minimumRole="manager">
 *   <AdminPanel />
 * </RoleProtectedRoute>
 *
 * @example
 * // Allow only specific roles
 * <RoleProtectedRoute allowedRoles={['budtender', 'manager', 'owner']}>
 *   <RecommendationPage />
 * </RoleProtectedRoute>
 *
 * @example
 * // Require specific permission
 * <RoleProtectedRoute requiredPermissions={['manage_inventory']}>
 *   <InventoryEdit />
 * </RoleProtectedRoute>
 */
function RoleProtectedRoute({
  children,
  minimumRole,
  allowedRoles,
  requiredPermissions,
  requireAnyPermission,
  fallbackPath = '/dashboard',
  showAccessDenied = true,
}: RoleProtectedRouteProps) {
  const location = useLocation();
  const user = useCurrentUser();

  // BYPASS MODE - Skip all role checks
  if (BYPASS_AUTH) {
    return <>{children}</>;
  }

  // Check if user has access based on role/permissions
  const hasAccess = canAccessRoute(user, {
    minimumRole,
    allowedRoles,
    requiredPermissions,
    requireAnyPermission,
  });

  // User doesn't have access
  if (!hasAccess) {
    // Either show access denied page or redirect silently
    if (showAccessDenied) {
      return (
        <AccessDeniedPage
          user={user}
          minimumRole={minimumRole}
          fallbackPath={fallbackPath}
        />
      );
    }

    // Silent redirect to fallback
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // User has access, render children
  return <>{children}</>;
}

/**
 * Access Denied Page Component
 * Shown when user doesn't have sufficient permissions
 */
function AccessDeniedPage({
  user,
  minimumRole,
  fallbackPath,
}: {
  user: { role: UserRole } | null;
  minimumRole?: UserRole;
  fallbackPath: string;
}) {
  const navigate = (path: string) => {
    window.location.href = path;
  };

  return (
    <Center h="100%" minH="400px" bg="slate.900">
      <VStack spacing={6} textAlign="center" px={8}>
        <Box
          p={4}
          borderRadius="full"
          bg="red.900/20"
          border="2px solid"
          borderColor="red.500/30"
        >
          <Icon as={FiLock} boxSize={12} color="red.400" />
        </Box>

        <VStack spacing={2}>
          <Text fontSize="2xl" fontWeight="bold" color="white">
            Access Denied
          </Text>
          <Text color="slate.400" maxW="md">
            You don't have permission to access this page.
          </Text>
        </VStack>

        {user && (
          <Box
            bg="slate.800"
            px={4}
            py={3}
            borderRadius="lg"
            border="1px solid"
            borderColor="slate.700"
          >
            <VStack spacing={1}>
              <Text color="slate.400" fontSize="sm">
                Your current role:
              </Text>
              <Text color="cannabis.400" fontWeight="semibold">
                {getRoleDisplayName(user.role)}
              </Text>
              {minimumRole && (
                <>
                  <Text color="slate.500" fontSize="xs" mt={2}>
                    Required role:
                  </Text>
                  <Text color="orange.400" fontSize="sm">
                    {getRoleDisplayName(minimumRole)} or higher
                  </Text>
                </>
              )}
            </VStack>
          </Box>
        )}

        <VStack spacing={3}>
          <Button
            colorScheme="cannabis"
            onClick={() => navigate(fallbackPath)}
            leftIcon={<Icon as={FiAlertTriangle} />}
          >
            Go to Dashboard
          </Button>
          <Text color="slate.500" fontSize="sm">
            If you believe this is an error, contact your administrator.
          </Text>
        </VStack>
      </VStack>
    </Center>
  );
}

/**
 * Higher-order component for role-based protection
 * Useful for wrapping components programmatically
 */
export function withRoleProtection<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<RoleProtectedRouteProps, 'children'>
) {
  return function ProtectedComponent(props: P) {
    return (
      <RoleProtectedRoute {...options}>
        <Component {...props} />
      </RoleProtectedRoute>
    );
  };
}

/**
 * Hook to check if current user has access to a specific feature
 * Use this for conditional rendering within components
 */
export function useRoleAccess(options: {
  minimumRole?: UserRole;
  allowedRoles?: UserRole[];
  requiredPermissions?: Permission[];
  requireAnyPermission?: Permission[];
}): boolean {
  const user = useCurrentUser();
  // BYPASS MODE - Grant full access
  if (BYPASS_AUTH) {
    return true;
  }
  return canAccessRoute(user, options);
}

/**
 * Component that conditionally renders based on role access
 * Use this for inline permission checks
 *
 * @example
 * <RoleGate minimumRole="manager">
 *   <DeleteButton />
 * </RoleGate>
 */
export function RoleGate({
  children,
  fallback = null,
  ...options
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  minimumRole?: UserRole;
  allowedRoles?: UserRole[];
  requiredPermissions?: Permission[];
  requireAnyPermission?: Permission[];
}) {
  const hasAccess = useRoleAccess(options);
  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

/**
 * Shorthand components for common role checks
 */
export function StaffOnly({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleGate minimumRole="budtender" fallback={fallback}>
      {children}
    </RoleGate>
  );
}

export function ManagerOnly({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleGate minimumRole="manager" fallback={fallback}>
      {children}
    </RoleGate>
  );
}

export function OwnerOnly({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleGate minimumRole="owner" fallback={fallback}>
      {children}
    </RoleGate>
  );
}

export function AdminOnly({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleGate minimumRole="admin" fallback={fallback}>
      {children}
    </RoleGate>
  );
}

export default RoleProtectedRoute;
