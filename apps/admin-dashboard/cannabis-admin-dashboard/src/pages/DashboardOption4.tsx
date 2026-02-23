import { Box, Heading, Text, Flex, VStack, HStack, Divider, Badge, Grid } from '@chakra-ui/react';
import { ArrowUpIcon, ArrowDownIcon } from '@chakra-ui/icons';
import { useDashboardKPIs, useSalesTrend, useTopProducts } from '../hooks/useDashboard';
import { useStaffPerformance } from '../hooks/useStaff';
import RevenueChart from '../modules/dashboard/components/RevenueChart';
import DateRangeSelector from '../modules/analytics/components/DateRangeSelector';
import { formatCurrency } from '../utils/formatters';

/**
 * Dashboard Option 4: Sidebar Stats + Main Content
 * Key metrics in a slim left sidebar, detailed content takes the main area
 */
function DashboardOption4() {
  const { data: kpis } = useDashboardKPIs();
  const { data: salesTrend, isLoading: trendLoading } = useSalesTrend();
  const { data: topProducts } = useTopProducts(5);
  const { data: staffPerformance } = useStaffPerformance();

  const SidebarMetric = ({ label, value, change, isPercentage = false }: {
    label: string;
    value: string | number;
    change?: number;
    isPercentage?: boolean;
  }) => (
    <Box py={3} borderBottom="1px" borderColor="slate.700">
      <Text fontSize="xs" color="slate.500" textTransform="uppercase" mb={1}>{label}</Text>
      <HStack justify="space-between">
        <Text fontSize="lg" fontWeight="bold" color="white">
          {isPercentage ? `${value}%` : value}
        </Text>
        {change !== undefined && (
          <HStack spacing={0.5}>
            {change >= 0 ? (
              <ArrowUpIcon boxSize={3} color="green.400" />
            ) : (
              <ArrowDownIcon boxSize={3} color="red.400" />
            )}
            <Text fontSize="xs" color={change >= 0 ? 'green.400' : 'red.400'}>
              {Math.abs(change).toFixed(1)}%
            </Text>
          </HStack>
        )}
      </HStack>
    </Box>
  );

  const AlertBadge = ({ count, label, colorScheme }: { count: number; label: string; colorScheme: string }) => (
    <HStack justify="space-between" py={2}>
      <Text fontSize="sm" color="slate.400">{label}</Text>
      <Badge colorScheme={colorScheme} variant="solid" borderRadius="full" px={2}>
        {count}
      </Badge>
    </HStack>
  );

  return (
    <Box>
      <HStack justify="space-between" mb={4}>
        <Box>
          <Heading size="lg" color="white">Dashboard</Heading>
          <Text fontSize="sm" color="slate.400">Option 4: Sidebar Stats + Main Content</Text>
        </Box>
        <Badge colorScheme="orange" fontSize="sm" px={3} py={1}>Layout Option 4</Badge>
      </HStack>

      <Flex gap={4}>
        {/* Left Sidebar - Metrics */}
        <Box w="240px" flexShrink={0}>
          <Box bg="slate.800" borderRadius="md" p={4} position="sticky" top={4}>
            <Text fontSize="sm" fontWeight="semibold" color="slate.300" mb={2}>Key Metrics</Text>

            <SidebarMetric
              label="Revenue Today"
              value={formatCurrency(kpis?.revenue_today || 0)}
              change={12.5}
            />
            <SidebarMetric
              label="Revenue MTD"
              value={formatCurrency(kpis?.revenue_mtd || 0)}
              change={8.2}
            />
            <SidebarMetric
              label="Transactions"
              value={kpis?.transactions_today || 0}
              change={5.1}
            />
            <SidebarMetric
              label="Avg Ticket"
              value={formatCurrency(kpis?.avg_transaction_value || 0)}
              change={-2.3}
            />
            <SidebarMetric
              label="New Customers"
              value={kpis?.customers_new_today || 0}
            />
            <SidebarMetric
              label="Repeat Rate"
              value={(kpis?.customers_repeat_pct || 0).toFixed(1)}
              isPercentage
              change={3.2}
            />
            <SidebarMetric
              label="Inventory Health"
              value={(kpis?.inventory_health_pct || 0).toFixed(0)}
              isPercentage
            />

            <Box mt={4} pt={4} borderTop="1px" borderColor="slate.600">
              <Text fontSize="xs" fontWeight="semibold" color="slate.400" mb={2}>ALERTS</Text>
              <AlertBadge count={kpis?.low_stock_count || 0} label="Low Stock" colorScheme="yellow" />
              <AlertBadge count={kpis?.items_needing_retest || 0} label="Need Retest" colorScheme="orange" />
              <AlertBadge count={kpis?.compliance_flags_open || 0} label="Open Flags" colorScheme="red" />
            </Box>

            <Box mt={4} pt={4} borderTop="1px" borderColor="slate.600">
              <Text fontSize="xs" fontWeight="semibold" color="slate.400" mb={2}>STAFF</Text>
              <Text fontSize="2xl" fontWeight="bold" color="white">{kpis?.staff_count || 0}</Text>
              <Text fontSize="xs" color="slate.500">Active Staff Members</Text>
            </Box>
          </Box>
        </Box>

        {/* Main Content Area */}
        <Box flex={1}>
          <Box mb={4}>
            <DateRangeSelector />
          </Box>

          {/* Revenue Chart - Full Width */}
          <Box mb={4}>
            <RevenueChart data={salesTrend || []} isLoading={trendLoading} />
          </Box>

          {/* Two Column Layout for Lists */}
          <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={4}>
            {/* Top Products */}
            <Box bg="slate.800" borderRadius="md" overflow="hidden">
              <Box bg="slate.750" px={4} py={3} borderBottom="1px" borderColor="slate.700">
                <Text fontSize="sm" fontWeight="semibold" color="white">Top Products</Text>
              </Box>
              <VStack spacing={0} align="stretch">
                {topProducts?.map((product, idx) => (
                  <Flex
                    key={product.product_id}
                    justify="space-between"
                    px={4}
                    py={3}
                    borderBottom={idx < (topProducts.length - 1) ? '1px' : 'none'}
                    borderColor="slate.700"
                    _hover={{ bg: 'slate.750' }}
                  >
                    <HStack>
                      <Box
                        w="24px"
                        h="24px"
                        borderRadius="full"
                        bg={idx < 3 ? 'green.500' : 'slate.600'}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Text fontSize="xs" fontWeight="bold" color="white">{idx + 1}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="white" noOfLines={1}>{product.product_name}</Text>
                        <Text fontSize="xs" color="slate.500">{product.units_sold} units</Text>
                      </Box>
                    </HStack>
                    <Box textAlign="right">
                      <Text fontSize="sm" fontWeight="bold" color="green.400">{formatCurrency(product.revenue)}</Text>
                      <Text fontSize="xs" color="slate.500">{product.margin.toFixed(0)}% margin</Text>
                    </Box>
                  </Flex>
                ))}
              </VStack>
            </Box>

            {/* Staff Leaderboard */}
            <Box bg="slate.800" borderRadius="md" overflow="hidden">
              <Box bg="slate.750" px={4} py={3} borderBottom="1px" borderColor="slate.700">
                <Text fontSize="sm" fontWeight="semibold" color="white">Staff Leaderboard</Text>
              </Box>
              <VStack spacing={0} align="stretch">
                {staffPerformance?.slice(0, 5).map((staff, idx) => (
                  <Flex
                    key={staff.staff_id}
                    justify="space-between"
                    px={4}
                    py={3}
                    borderBottom={idx < 4 ? '1px' : 'none'}
                    borderColor="slate.700"
                    _hover={{ bg: 'slate.750' }}
                  >
                    <HStack>
                      <Box
                        w="24px"
                        h="24px"
                        borderRadius="full"
                        bg={idx < 3 ? 'purple.500' : 'slate.600'}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Text fontSize="xs" fontWeight="bold" color="white">{idx + 1}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="white">{staff.staff_name}</Text>
                        <Text fontSize="xs" color="slate.500">{staff.transaction_count} transactions</Text>
                      </Box>
                    </HStack>
                    <Box textAlign="right">
                      <Text fontSize="sm" fontWeight="bold" color="green.400">{formatCurrency(staff.total_sales)}</Text>
                      <Text fontSize="xs" color="slate.500">{formatCurrency(staff.avg_transaction)} avg</Text>
                    </Box>
                  </Flex>
                ))}
              </VStack>
            </Box>
          </Grid>
        </Box>
      </Flex>
    </Box>
  );
}

export default DashboardOption4;
