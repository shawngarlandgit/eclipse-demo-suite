import { Box, Flex, useDisclosure } from '@chakra-ui/react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

/**
 * DashboardLayout Component
 * Main layout wrapper for authenticated pages
 * Contains Sidebar, TopBar, and main content area
 */
function DashboardLayout() {
  const { isOpen: isSidebarOpen, onToggle: toggleSidebar } = useDisclosure({
    defaultIsOpen: true,
  });

  return (
    <Flex h="100vh" overflow="hidden" bg="slate.900">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} />

      {/* Main Content Area */}
      <Flex direction="column" flex={1} overflow="hidden">
        {/* Top Bar */}
        <TopBar onToggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />

        {/* Page Content */}
        <Box
          as="main"
          flex={1}
          overflow="auto"
          p={6}
          bg="slate.900"
        >
          <Outlet />
        </Box>
      </Flex>
    </Flex>
  );
}

export default DashboardLayout;
