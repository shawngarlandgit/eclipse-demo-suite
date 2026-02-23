import {
  Box,
  VStack,
  HStack,
  Text,
  Icon,
  Flex,
  Divider,
  Badge,
} from '@chakra-ui/react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  CubeIcon,
  ChartBarIcon,
  UsersIcon,
  ShieldCheckIcon,
  Cog6ToothIcon,
  SparklesIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  BeakerIcon,
  BellAlertIcon,
  TruckIcon,
  IdentificationIcon,
} from '@heroicons/react/24/outline';
import { useCurrentUser } from '../../hooks/useAuth';
import { hasMinimumRole, hasPermission } from '../../utils/permissions';
import type { UserRole, Permission } from '../../types';

interface SidebarProps {
  isOpen: boolean;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  badge?: number;
  minimumRole?: UserRole;
  permission?: Permission;
  section?: 'main' | 'budtender' | 'management';
}

const navigationItems: NavItem[] = [
  // Main Section - Budtender+
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: HomeIcon,
    minimumRole: 'budtender',
    section: 'main',
  },

  // Budtender Tools Section
  {
    label: 'Dispatch',
    path: '/dispatch',
    icon: TruckIcon,
    minimumRole: 'budtender',
    section: 'budtender',
  },
  {
    label: 'Med Card Flow',
    path: '/med-card-flow',
    icon: IdentificationIcon,
    minimumRole: 'budtender',
    section: 'budtender',
  },
  {
    label: 'Recommendations',
    path: '/recommendations',
    icon: SparklesIcon,
    minimumRole: 'budtender',
    permission: 'view_recommendations',
    section: 'budtender',
  },
  {
    label: 'Questionnaire',
    path: '/questionnaire',
    icon: ClipboardDocumentListIcon,
    minimumRole: 'budtender',
    permission: 'view_questionnaire',
    section: 'budtender',
  },
  {
    label: 'Patients',
    path: '/patients',
    icon: UserGroupIcon,
    minimumRole: 'budtender',
    permission: 'view_patients',
    section: 'budtender',
  },
  {
    label: 'Strains',
    path: '/strains',
    icon: BeakerIcon,
    minimumRole: 'budtender',
    permission: 'view_strains',
    section: 'budtender',
  },

  // Management Section - Manager+
  {
    label: 'Inventory',
    path: '/inventory',
    icon: CubeIcon,
    minimumRole: 'manager',
    permission: 'view_inventory',
    section: 'management',
  },
  {
    label: 'Analytics',
    path: '/analytics',
    icon: ChartBarIcon,
    minimumRole: 'manager',
    permission: 'view_analytics',
    section: 'management',
  },
  {
    label: 'Staff',
    path: '/staff',
    icon: UsersIcon,
    minimumRole: 'manager',
    permission: 'manage_staff',
    section: 'management',
  },

  // Admin Section - Owner+
  {
    label: 'Compliance',
    path: '/compliance',
    icon: ShieldCheckIcon,
    minimumRole: 'owner',
    permission: 'view_compliance',
    section: 'management',
  },
  {
    label: 'Compliance Alerts',
    path: '/compliance-alerts',
    icon: BellAlertIcon,
    minimumRole: 'manager',
    permission: 'view_compliance',
    section: 'management',
  },
  {
    label: 'Configuration',
    path: '/configuration',
    icon: Cog6ToothIcon,
    minimumRole: 'owner',
    section: 'management',
  },
];

/**
 * Sidebar Component
 * Main navigation sidebar for the dashboard
 * Shows/hides items based on user role and permissions
 */
function Sidebar({ isOpen }: SidebarProps) {
  const location = useLocation();
  const user = useCurrentUser();

  if (!isOpen) return null;

  // Filter navigation items based on user's role and permissions
  const visibleItems = navigationItems.filter((item) => {
    // Check minimum role
    if (item.minimumRole && !hasMinimumRole(user, item.minimumRole)) {
      return false;
    }
    // Check specific permission
    if (item.permission && !hasPermission(user, item.permission)) {
      return false;
    }
    return true;
  });

  // Group items by section
  const budtenderItems = visibleItems.filter((item) => item.section === 'budtender');
  const managementItems = visibleItems.filter((item) => item.section === 'management');
  const mainItems = visibleItems.filter((item) => item.section === 'main');

  const renderNavItem = (item: NavItem) => {
    const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);

    return (
      <NavLink key={item.path} to={item.path}>
        <Flex
          align="center"
          px={4}
          py={3}
          rounded="md"
          cursor="pointer"
          bg={isActive ? 'whiteAlpha.100' : 'transparent'}
          color={isActive ? 'white' : 'slate.300'}
          borderLeft="2px solid"
          borderColor={isActive ? 'cannabis.500' : 'transparent'}
          _hover={{
            bg: isActive ? 'whiteAlpha.140' : 'whiteAlpha.100',
            color: 'white',
          }}
          transition="all 0.2s"
        >
          <Icon
            as={item.icon}
            boxSize={5}
            mr={3}
            color={isActive ? 'cannabis.400' : 'slate.400'}
          />
          <Text fontSize="sm" fontWeight="medium" flex={1}>
            {item.label}
          </Text>
          {item.badge && (
            <Badge colorScheme="red" rounded="full">
              {item.badge}
            </Badge>
          )}
        </Flex>
      </NavLink>
    );
  };

  return (
    <Box
      as="nav"
      w="260px"
      bg="slate.800"
      borderRight="1px"
      borderColor="slate.700"
      h="full"
      overflowY="auto"
    >
      {/* Logo/Brand */}
      <Flex
        h="16"
        alignItems="center"
        px={6}
        borderBottom="1px"
        borderColor="slate.700"
      >
        <HStack spacing={3}>
          <Box
            w={8}
            h={8}
            bg="cannabis.600"
            rounded="lg"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Text fontSize="xl" fontWeight="bold">
              🌿
            </Text>
          </Box>
          <Text fontSize="lg" fontWeight="bold" color="white">
            Cannabis Admin
          </Text>
        </HStack>
      </Flex>

      {/* Navigation Links */}
      <VStack spacing={0} align="stretch" p={4}>
        {/* Main Section */}
        {mainItems.length > 0 && (
          <>
            {mainItems.map(renderNavItem)}
          </>
        )}

        {/* Budtender Tools Section */}
        {budtenderItems.length > 0 && (
          <>
            <Divider borderColor="slate.700" my={3} />
            <Text
              fontSize="xs"
              fontWeight="semibold"
              color="slate.500"
              textTransform="uppercase"
              letterSpacing="wider"
              px={4}
              mb={2}
            >
              Budtender Tools
            </Text>
            {budtenderItems.map(renderNavItem)}
          </>
        )}

        {/* Management Section */}
        {managementItems.length > 0 && (
          <>
            <Divider borderColor="slate.700" my={3} />
            <Text
              fontSize="xs"
              fontWeight="semibold"
              color="slate.500"
              textTransform="uppercase"
              letterSpacing="wider"
              px={4}
              mb={2}
            >
              Management
            </Text>
            {managementItems.map(renderNavItem)}
          </>
        )}
      </VStack>

      {/* Footer/Version Info */}
      <Box px={6} py={4} mt="auto">
        <Divider borderColor="slate.700" mb={4} />
        <VStack align="start" spacing={1}>
          <Text fontSize="xs" color="slate.500">
            v1.0.0 - Unified Platform
          </Text>
          {user && (
            <Badge
              colorScheme={
                user.role === 'admin' ? 'red' :
                user.role === 'owner' ? 'orange' :
                user.role === 'manager' ? 'purple' :
                user.role === 'budtender' ? 'teal' : 'blue'
              }
              fontSize="xs"
            >
              {user.role}
            </Badge>
          )}
        </VStack>
      </Box>
    </Box>
  );
}

export default Sidebar;
