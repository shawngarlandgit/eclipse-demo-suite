import { Box, Heading, Text, Flex, VStack, Icon, HStack } from '@chakra-ui/react';
import { DollarSign, ShoppingCart, TrendingUp } from 'lucide-react';
import { useDashboardKPIs, useTopProducts } from '../hooks/useDashboard';
import { formatCurrency } from '../utils/formatters';
import { DraggableGrid, DraggableWidget, EditModeToolbar } from '../components/grid';

/**
 * Dashboard Simple 1: "The Big Three"
 *
 * Ultra-minimal dashboard showing only 3 things:
 * 1. Today's Revenue (big, prominent)
 * 2. Number of Sales Today
 * 3. Your Best Seller Right Now
 *
 * Now with drag-and-drop customization!
 */
function DashboardSimple1() {
  const { data: kpis, isLoading } = useDashboardKPIs();
  const { data: topProducts } = useTopProducts(1);

  const topProduct = topProducts?.[0];

  if (isLoading) {
    return (
      <Flex h="80vh" align="center" justify="center">
        <Text fontSize="xl" color="slate.400">Loading...</Text>
      </Flex>
    );
  }

  return (
    <Box p={8} maxW="1200px" mx="auto">
      {/* Header with Edit Button */}
      <HStack justify="space-between" align="start" mb={8}>
        <VStack spacing={2} align="start">
          <Heading size="lg" color="white">Today at a Glance</Heading>
          <Text color="slate.400">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
        </VStack>
        <EditModeToolbar dashboardStyle="simple-1" />
      </HStack>

      {/* The Big Three Cards - Now Draggable */}
      <DraggableGrid dashboardStyle="simple-1">
        {/* Card 1: Today's Revenue */}
        <DraggableWidget key="revenue-card" id="revenue-card" noPadding>
          <Box
            bg="linear-gradient(135deg, #10b981 0%, #059669 100%)"
            borderRadius="xl"
            p={8}
            textAlign="center"
            h="100%"
            display="flex"
            flexDirection="column"
            justifyContent="center"
            _hover={{ transform: 'scale(1.01)' }}
            transition="transform 0.2s"
          >
            <Icon as={DollarSign} boxSize={12} color="white" opacity={0.9} mb={4} />
            <Text fontSize="md" color="whiteAlpha.800" fontWeight="medium" mb={2}>
              Today's Revenue
            </Text>
            <Text fontSize="4xl" fontWeight="bold" color="white" lineHeight="1">
              {formatCurrency(kpis?.revenue_today || 0)}
            </Text>
          </Box>
        </DraggableWidget>

        {/* Card 2: Sales Count */}
        <DraggableWidget key="sales-card" id="sales-card" noPadding>
          <Box
            bg="linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
            borderRadius="xl"
            p={8}
            textAlign="center"
            h="100%"
            display="flex"
            flexDirection="column"
            justifyContent="center"
            _hover={{ transform: 'scale(1.01)' }}
            transition="transform 0.2s"
          >
            <Icon as={ShoppingCart} boxSize={12} color="white" opacity={0.9} mb={4} />
            <Text fontSize="md" color="whiteAlpha.800" fontWeight="medium" mb={2}>
              Sales Today
            </Text>
            <Text fontSize="4xl" fontWeight="bold" color="white" lineHeight="1">
              {kpis?.transactions_today?.toLocaleString() || 0}
            </Text>
            <Text color="whiteAlpha.800" fontSize="lg" mt={4}>
              Avg ticket: {formatCurrency(kpis?.avg_transaction_value || 0)}
            </Text>
          </Box>
        </DraggableWidget>

        {/* Card 3: Top Seller */}
        <DraggableWidget key="bestseller-card" id="bestseller-card" noPadding>
          <Box
            bg="linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)"
            borderRadius="xl"
            p={8}
            textAlign="center"
            h="100%"
            display="flex"
            flexDirection="column"
            justifyContent="center"
            _hover={{ transform: 'scale(1.01)' }}
            transition="transform 0.2s"
          >
            <Icon as={TrendingUp} boxSize={12} color="white" opacity={0.9} mb={4} />
            <Text fontSize="md" color="whiteAlpha.800" fontWeight="medium" mb={2}>
              Best Seller Today
            </Text>
            <Text fontSize="xl" fontWeight="bold" color="white" lineHeight="1.2" noOfLines={2}>
              {topProduct?.product_name || 'Loading...'}
            </Text>
            <VStack mt={4} spacing={1}>
              <Text color="whiteAlpha.900" fontSize="md">
                {topProduct?.units_sold || 0} units sold
              </Text>
              <Text color="whiteAlpha.800" fontSize="sm">
                {formatCurrency(topProduct?.revenue || 0)} revenue
              </Text>
            </VStack>
          </Box>
        </DraggableWidget>
      </DraggableGrid>

      {/* Simple Footer Message */}
      <Box mt={8} textAlign="center">
        <Text color="slate.500" fontSize="sm">
          For more details, check the Analytics page
        </Text>
      </Box>
    </Box>
  );
}

export default DashboardSimple1;
