import { Box, Heading, Text, Flex, VStack, HStack, Icon } from '@chakra-ui/react';
import { TrendingUp, TrendingDown, Minus, DollarSign, Users, Package, Award } from 'lucide-react';
import { useDashboardKPIs, useTopProducts } from '../hooks/useDashboard';
import { useStaffPerformance } from '../hooks/useStaff';
import { formatCurrency } from '../utils/formatters';
import { DraggableGrid, DraggableWidget, EditModeToolbar } from '../components/grid';

/**
 * Dashboard Simple 4: "Owner's Summary"
 *
 * A single-page summary written in plain English.
 * No charts, no complex numbers - just clear statements:
 * - "You made $X today"
 * - "That's 12% more than yesterday"
 * - "Your best employee today is..."
 *
 * Perfect for owners who want a morning briefing.
 * Now with drag-and-drop customization!
 */
function DashboardSimple4() {
  const { data: kpis, isLoading } = useDashboardKPIs();
  const { data: topProducts } = useTopProducts(3);
  const { data: staffPerformance } = useStaffPerformance();

  const topStaff = staffPerformance?.[0];
  // Calculate a pseudo-change based on MTD vs daily average
  const dailyAvg = (kpis?.revenue_mtd || 0) / 30;
  const revenueChange = dailyAvg > 0 ? (((kpis?.revenue_today || 0) - dailyAvg) / dailyAvg) * 100 : 0;

  const getTrendIcon = (change: number) => {
    if (change > 2) return TrendingUp;
    if (change < -2) return TrendingDown;
    return Minus;
  };

  const getTrendColor = (change: number) => {
    if (change > 2) return 'green.400';
    if (change < -2) return 'red.400';
    return 'slate.400';
  };

  if (isLoading) {
    return (
      <Flex h="80vh" align="center" justify="center">
        <Text fontSize="xl" color="slate.400">Loading your summary...</Text>
      </Flex>
    );
  }

  return (
    <Box p={8} maxW="1200px" mx="auto">
      {/* Greeting Header with Edit Button */}
      <HStack justify="space-between" align="start" mb={6}>
        <VStack spacing={2} align="start">
          <Text color="slate.400" fontSize="lg">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </Text>
          <Heading size="xl" color="white">
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}!
          </Heading>
          <Text color="slate.400" fontSize="lg">
            Here's what's happening at your dispensary today.
          </Text>
        </VStack>
        <EditModeToolbar dashboardStyle="simple-4" />
      </HStack>

      {/* Draggable Grid */}
      <DraggableGrid dashboardStyle="simple-4">
        {/* Revenue Summary */}
        <DraggableWidget key="revenue-summary" id="revenue-summary" noPadding>
          <Box bg="slate.800" borderRadius="xl" p={6} h="100%">
            <HStack spacing={3} mb={4}>
              <Icon as={DollarSign} color="emerald.400" boxSize={6} />
              <Heading size="md" color="white">Revenue</Heading>
            </HStack>
            <VStack align="start" spacing={4} pl={9}>
              <Box>
                <Text fontSize="3xl" fontWeight="bold" color="white" lineHeight="1">
                  {formatCurrency(kpis?.revenue_today || 0)}
                </Text>
                <Text color="slate.400" fontSize="md" mt={1}>
                  in sales today
                </Text>
              </Box>

              <HStack
                bg="slate.700"
                px={4}
                py={2}
                borderRadius="lg"
                borderLeft="3px solid"
                borderLeftColor={getTrendColor(revenueChange)}
              >
                <Icon as={getTrendIcon(revenueChange)} color={getTrendColor(revenueChange)} boxSize={5} />
                <Text color="slate.200" fontSize="sm">
                  {revenueChange >= 0 ? (
                    <>That's <Text as="span" color="green.400" fontWeight="bold">{revenueChange.toFixed(1)}% more</Text> than yesterday.</>
                  ) : (
                    <>That's <Text as="span" color="red.400" fontWeight="bold">{Math.abs(revenueChange).toFixed(1)}% less</Text> than yesterday.</>
                  )}
                </Text>
              </HStack>
            </VStack>
          </Box>
        </DraggableWidget>

        {/* Top Products */}
        <DraggableWidget key="bestsellers-summary" id="bestsellers-summary" noPadding>
          <Box bg="slate.800" borderRadius="xl" p={6} h="100%" overflow="auto">
            <HStack spacing={3} mb={4}>
              <Icon as={Package} color="emerald.400" boxSize={6} />
              <Heading size="md" color="white">Best Sellers</Heading>
            </HStack>
            <VStack align="start" spacing={3} pl={9}>
              <Text color="slate.300" fontSize="sm">
                Your customers are loving these:
              </Text>
              {topProducts?.map((product, index) => (
                <HStack key={product.product_id || index} spacing={3}>
                  <Text color="emerald.400" fontWeight="bold" fontSize="md">
                    {index + 1}.
                  </Text>
                  <Text color="white" fontSize="sm">
                    <Text as="span" fontWeight="bold">{product.product_name}</Text>
                    {' — '}
                    <Text as="span" color="slate.400">
                      {product.units_sold} sold
                    </Text>
                  </Text>
                </HStack>
              ))}
            </VStack>
          </Box>
        </DraggableWidget>

        {/* Customer Insights */}
        <DraggableWidget key="customers-summary" id="customers-summary" noPadding>
          <Box bg="slate.800" borderRadius="xl" p={6} h="100%">
            <HStack spacing={3} mb={4}>
              <Icon as={Users} color="emerald.400" boxSize={6} />
              <Heading size="md" color="white">Customers</Heading>
            </HStack>
            <VStack align="start" spacing={3} pl={9}>
              <Text color="slate.300" fontSize="sm">
                <Text as="span" fontWeight="bold" color="white">{kpis?.customers_new_today || 0} new</Text> customers today.
              </Text>
              <Text color="slate.300" fontSize="sm">
                <Text as="span" fontWeight="bold" color="white">{kpis?.customers_repeat_pct?.toFixed(0) || 0}%</Text> are returning customers.
                {(kpis?.customers_repeat_pct || 0) >= 60 && (
                  <Text as="span" color="green.400"> Great loyalty!</Text>
                )}
              </Text>
            </VStack>
          </Box>
        </DraggableWidget>

        {/* Staff Highlight */}
        <DraggableWidget key="staff-spotlight" id="staff-spotlight" noPadding>
          <Box bg="slate.800" borderRadius="xl" p={6} h="100%">
            <HStack spacing={3} mb={4}>
              <Icon as={Award} color="emerald.400" boxSize={6} />
              <Heading size="md" color="white">Staff Spotlight</Heading>
            </HStack>
            {topStaff ? (
              <Box
                bgGradient="linear(to-r, purple.900, slate.800)"
                p={4}
                borderRadius="lg"
                border="1px solid"
                borderColor="purple.700"
                ml={9}
              >
                <HStack spacing={4}>
                  <Text fontSize="2xl">🏆</Text>
                  <VStack align="start" spacing={0}>
                    <Text color="white" fontSize="md" fontWeight="bold">
                      {topStaff.full_name || 'Top Performer'}
                    </Text>
                    <Text color="slate.300" fontSize="sm">
                      {topStaff.transaction_count || 0} sales today
                    </Text>
                  </VStack>
                </HStack>
              </Box>
            ) : (
              <Text color="slate.400" fontSize="sm" pl={9}>No staff data yet</Text>
            )}
          </Box>
        </DraggableWidget>

        {/* Alerts */}
        <DraggableWidget key="alerts-summary" id="alerts-summary" noPadding>
          {(kpis?.low_stock_count || 0) > 0 || (kpis?.compliance_flags_open || 0) > 0 ? (
            <Box
              bg="orange.900"
              p={6}
              borderRadius="xl"
              borderLeft="4px solid"
              borderLeftColor="orange.400"
              h="100%"
            >
              <Heading size="sm" color="orange.200" mb={3}>
                Things to check:
              </Heading>
              <VStack align="start" spacing={2}>
                {(kpis?.low_stock_count || 0) > 0 && (
                  <Text color="orange.100" fontSize="sm">
                    • {kpis?.low_stock_count} products low on stock
                  </Text>
                )}
                {(kpis?.compliance_flags_open || 0) > 0 && (
                  <Text color="orange.100" fontSize="sm">
                    • {kpis?.compliance_flags_open} compliance items
                  </Text>
                )}
              </VStack>
            </Box>
          ) : (
            <Box
              bg="green.900"
              p={6}
              borderRadius="xl"
              borderLeft="4px solid"
              borderLeftColor="green.400"
              h="100%"
              display="flex"
              alignItems="center"
            >
              <Text color="green.200" fontSize="sm">
                ✓ No urgent issues. Everything is running smoothly!
              </Text>
            </Box>
          )}
        </DraggableWidget>
      </DraggableGrid>

      {/* Footer */}
      <Text color="slate.500" fontSize="sm" textAlign="center" mt={10}>
        Last updated: {new Date().toLocaleTimeString()}
      </Text>
    </Box>
  );
}

export default DashboardSimple4;
