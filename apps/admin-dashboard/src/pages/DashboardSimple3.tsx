import { Box, Heading, Text, Flex, VStack, HStack, Divider, Badge } from '@chakra-ui/react';
import { useDashboardKPIs, useTopProducts } from '../hooks/useDashboard';
import { formatCurrency } from '../utils/formatters';
import { DraggableGrid, DraggableWidget, EditModeToolbar } from '../components/grid';

/**
 * Dashboard Simple 3: "Cash Register View"
 *
 * Designed specifically for budtenders at the counter.
 * Shows what matters during a shift:
 * - Big revenue display (like a register)
 * - What's selling well (to recommend)
 * - What's running low (to warn customers)
 *
 * Large text, high contrast, easy to read at a glance.
 * Now with drag-and-drop customization!
 */
function DashboardSimple3() {
  const { data: kpis, isLoading } = useDashboardKPIs();
  const { data: topProducts } = useTopProducts(5);

  if (isLoading) {
    return (
      <Flex h="80vh" align="center" justify="center">
        <Text fontSize="xl" color="slate.400">Loading...</Text>
      </Flex>
    );
  }

  // Low stock products for alerts
  const lowStockProducts = [
    { name: 'Blue Dream 1/8oz', stock: 3 },
    { name: 'OG Kush Pre-rolls', stock: 5 },
  ];

  return (
    <Box p={6} maxW="1200px" mx="auto">
      {/* Header with Edit Button */}
      <HStack justify="space-between" align="start" mb={6}>
        <Heading size="lg" color="white">Budtender View</Heading>
        <EditModeToolbar dashboardStyle="simple-3" />
      </HStack>

      {/* Draggable Grid */}
      <DraggableGrid dashboardStyle="simple-3">
        {/* Register-Style Revenue Display */}
        <DraggableWidget key="register-display" id="register-display" noPadding>
          <Box
            bg="black"
            borderRadius="xl"
            p={6}
            h="100%"
            textAlign="center"
            border="3px solid"
            borderColor="green.500"
            display="flex"
            flexDirection="column"
            justifyContent="center"
          >
            <Text color="green.400" fontSize="sm" fontWeight="bold" letterSpacing="wider" mb={2}>
              TODAY'S TOTAL
            </Text>
            <Text
              fontSize={{ base: '4xl', md: '5xl' }}
              fontWeight="bold"
              color="green.400"
              fontFamily="mono"
              letterSpacing="tight"
            >
              {formatCurrency(kpis?.revenue_today || 0)}
            </Text>
            <HStack justify="center" spacing={8} mt={4}>
              <VStack spacing={0}>
                <Text color="slate.500" fontSize="xs">TRANSACTIONS</Text>
                <Text color="green.300" fontSize="xl" fontFamily="mono" fontWeight="bold">
                  {kpis?.transactions_today || 0}
                </Text>
              </VStack>
              <Divider orientation="vertical" h="40px" borderColor="slate.700" />
              <VStack spacing={0}>
                <Text color="slate.500" fontSize="xs">AVG TICKET</Text>
                <Text color="green.300" fontSize="xl" fontFamily="mono" fontWeight="bold">
                  {formatCurrency(kpis?.avg_transaction_value || 0)}
                </Text>
              </VStack>
            </HStack>
          </Box>
        </DraggableWidget>

        {/* What's Selling */}
        <DraggableWidget key="whats-selling" id="whats-selling" noPadding>
          <Box bg="slate.800" borderRadius="xl" p={6} h="100%" overflow="auto">
            <HStack mb={4}>
              <Text fontSize="lg" fontWeight="bold" color="white">
                What's Selling
              </Text>
              <Badge colorScheme="green" fontSize="xs">HOT</Badge>
            </HStack>

            <Text color="slate.400" fontSize="sm" mb={4}>
              Recommend these to customers
            </Text>

            <VStack align="stretch" spacing={3}>
              {topProducts?.slice(0, 5).map((product, index) => (
                <HStack
                  key={product.product_id || index}
                  justify="space-between"
                  p={3}
                  bg="slate.700"
                  borderRadius="lg"
                  borderLeft="3px solid"
                  borderLeftColor={index === 0 ? 'yellow.400' : 'slate.600'}
                >
                  <VStack align="start" spacing={0}>
                    <Text color="white" fontWeight="medium" fontSize="md">
                      {index === 0 && '🏆 '}
                      {product.product_name}
                    </Text>
                    <Text color="slate.400" fontSize="sm">
                      {product.units_sold} sold today
                    </Text>
                  </VStack>
                  <Text color="green.400" fontWeight="bold" fontSize="lg">
                    {formatCurrency(product.revenue)}
                  </Text>
                </HStack>
              ))}
            </VStack>
          </Box>
        </DraggableWidget>

        {/* Stock Alerts */}
        <DraggableWidget key="stock-alerts" id="stock-alerts" noPadding>
          <Box bg="slate.800" borderRadius="xl" p={6} h="100%" overflow="auto">
            <HStack mb={4}>
              <Text fontSize="lg" fontWeight="bold" color="white">
                Stock Alerts
              </Text>
              {(kpis?.low_stock_count || 0) > 0 && (
                <Badge colorScheme="orange" fontSize="xs">
                  {kpis?.low_stock_count} LOW
                </Badge>
              )}
            </HStack>

            <Text color="slate.400" fontSize="sm" mb={4}>
              Warn customers before they ask
            </Text>

            {(kpis?.low_stock_count || 0) === 0 ? (
              <Box p={6} bg="slate.700" borderRadius="lg" textAlign="center">
                <Text fontSize="3xl" mb={2}>✓</Text>
                <Text color="green.400" fontWeight="medium">
                  All products well-stocked!
                </Text>
              </Box>
            ) : (
              <VStack align="stretch" spacing={3}>
                {lowStockProducts.map((product, index) => (
                  <HStack
                    key={index}
                    justify="space-between"
                    p={3}
                    bg="orange.900"
                    borderRadius="lg"
                    borderLeft="3px solid"
                    borderLeftColor="orange.400"
                  >
                    <Text color="white" fontWeight="medium">
                      {product.name}
                    </Text>
                    <Badge colorScheme="orange" fontSize="md" px={3}>
                      Only {product.stock} left
                    </Badge>
                  </HStack>
                ))}
              </VStack>
            )}

            {/* Quick Stats for Budtender */}
            <Divider my={6} borderColor="slate.600" />

            <VStack spacing={3}>
              <HStack justify="space-between" w="full">
                <Text color="slate.400">New customers today</Text>
                <Text color="white" fontWeight="bold">{kpis?.customers_new_today || 0}</Text>
              </HStack>
              <HStack justify="space-between" w="full">
                <Text color="slate.400">Returning customers</Text>
                <Text color="white" fontWeight="bold">{kpis?.customers_repeat_pct?.toFixed(0) || 0}%</Text>
              </HStack>
            </VStack>
          </Box>
        </DraggableWidget>
      </DraggableGrid>

      {/* Shift Tip */}
      <Box
        mt={6}
        p={4}
        bg="blue.900"
        borderRadius="lg"
        borderLeft="4px solid"
        borderLeftColor="blue.400"
      >
        <Text color="blue.200" fontSize="sm">
          💡 <strong>Tip:</strong> Customers who buy {topProducts?.[0]?.product_name || 'top products'} often also like similar strains. Check the Recommendations page for personalized suggestions!
        </Text>
      </Box>
    </Box>
  );
}

export default DashboardSimple3;
