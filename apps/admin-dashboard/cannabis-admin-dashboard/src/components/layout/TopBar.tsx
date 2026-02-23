import {
  Box,
  Flex,
  HStack,
  IconButton,
  Text,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Avatar,
  Badge,
  useToast,
} from '@chakra-ui/react';
import {
  Bars3Icon,
  BellIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

interface TopBarProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

/**
 * TopBar Component
 * Top navigation bar with user menu, notifications, and sidebar toggle
 */
function TopBar({ onToggleSidebar, isSidebarOpen }: TopBarProps) {
  const toast = useToast();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/login');
    } catch (error) {
      toast({
        title: 'Logout failed',
        description: 'There was an error logging out. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box
      as="header"
      h="16"
      bg="slate.800"
      borderBottom="1px"
      borderColor="slate.700"
      px={6}
    >
      <Flex h="full" align="center" justify="space-between">
        {/* Left: Sidebar Toggle */}
        <HStack spacing={4}>
          <IconButton
            aria-label="Toggle sidebar"
            icon={<Bars3Icon className="w-5 h-5" />}
            onClick={onToggleSidebar}
            variant="ghost"
            color="slate.300"
            _hover={{ bg: 'slate.700', color: 'white' }}
          />
          <Text fontSize="lg" fontWeight="semibold" color="white">
            {/* Dynamic page title can go here */}
          </Text>
        </HStack>

        {/* Right: Notifications & User Menu */}
        <HStack spacing={4}>
          {/* Sync Status Indicator */}
          <HStack spacing={2} px={3} py={1} bg="slate.700" rounded="md">
            <Box w={2} h={2} bg="green.500" rounded="full" />
            <Text fontSize="xs" color="slate.300">
              Synced
            </Text>
          </HStack>

          {/* Notifications */}
          <Box position="relative">
            <IconButton
              aria-label="Notifications"
              icon={<BellIcon className="w-5 h-5" />}
              variant="ghost"
              color="slate.300"
              _hover={{ bg: 'slate.700', color: 'white' }}
            />
            <Badge
              position="absolute"
              top={1}
              right={1}
              colorScheme="red"
              rounded="full"
              fontSize="xs"
            >
              3
            </Badge>
          </Box>

          {/* User Menu */}
          <Menu>
            <MenuButton>
              <HStack
                spacing={3}
                px={3}
                py={2}
                rounded="lg"
                _hover={{ bg: 'slate.700' }}
                cursor="pointer"
                transition="all 0.2s"
              >
                <Avatar
                  size="sm"
                  name={user?.full_name || 'User'}
                  src={user?.avatar_url || undefined}
                  bg="brand.600"
                />
                <Box textAlign="left">
                  <Text fontSize="sm" fontWeight="medium" color="white">
                    {user?.full_name || 'User'}
                  </Text>
                  <Text fontSize="xs" color="slate.400" textTransform="capitalize">
                    {user?.role || 'User'}
                  </Text>
                </Box>
              </HStack>
            </MenuButton>
            <MenuList bg="slate.800" borderColor="slate.700">
              <MenuItem
                icon={<UserCircleIcon className="w-5 h-5" />}
                bg="slate.800"
                _hover={{ bg: 'slate.700' }}
              >
                Profile
              </MenuItem>
              <MenuItem
                icon={<Cog6ToothIcon className="w-5 h-5" />}
                bg="slate.800"
                _hover={{ bg: 'slate.700' }}
              >
                Settings
              </MenuItem>
              <MenuDivider borderColor="slate.700" />
              <MenuItem
                icon={<ArrowRightOnRectangleIcon className="w-5 h-5" />}
                onClick={handleLogout}
                bg="slate.800"
                _hover={{ bg: 'slate.700' }}
                color="red.400"
              >
                Logout
              </MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>
    </Box>
  );
}

export default TopBar;
