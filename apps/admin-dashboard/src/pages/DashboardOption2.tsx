import { useMemo } from 'react';
import { Box, Heading, Text, Flex, HStack, VStack, Table, Thead, Tbody, Tr, Th, Td, Badge, SimpleGrid, Grid } from '@chakra-ui/react';
import { ArrowUpIcon, ArrowDownIcon } from '@chakra-ui/icons';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { Sparkles } from 'lucide-react';
import { useDashboardKPIs, useSalesTrend } from '../hooks/useDashboard';
import { useStaffPerformance } from '../hooks/useStaff';
import DateRangeSelector from '../modules/analytics/components/DateRangeSelector';
import InsightCard from '../modules/analytics/components/InsightCard';
import TopProductsChart from '../modules/analytics/components/charts/TopProductsChart';
import TopStrainsChart from '../modules/analytics/components/charts/TopStrainsChart';
import { formatCurrency } from '../utils/formatters';
import { generateDashboardInsights, generateTimeBasedBusinessInsights, generateOperationalInsights } from '../modules/dashboard/utils/insights';
import { DraggableGrid, DraggableWidget, EditModeToolbar } from '../components/grid';

/**
 * Dashboard Option 2: Data Tables with Sparklines
 * Financial dashboard style with inline mini charts
 * Now with drag-and-drop customization!
 */
function DashboardOption2() {
  const { data: kpis } = useDashboardKPIs();
  const { data: _salesTrend } = useSalesTrend();
  const { data: staffPerformance } = useStaffPerformance();

  // Generate AI insights from KPIs
  const insights = useMemo(() => {
    if (!kpis) return [];
    const dashboardInsights = generateDashboardInsights(kpis);
    const timeInsights = generateTimeBasedBusinessInsights();
    const operationalInsights = generateOperationalInsights(kpis);
    return [...dashboardInsights, ...operationalInsights, ...timeInsights].slice(0, 6);
  }, [kpis]);

  // Generate mini sparkline data
  const generateSparkline = (base: number, variance: number = 0.2) => {
    return Array.from({ length: 7 }, (_, i) => ({
      value: base * (1 + (Math.random() - 0.5) * variance) * (0.8 + i * 0.03),
    }));
  };

  const Sparkline = ({ data, color = '#22c55e' }: { data: { value: number }[]; color?: string }) => (
    <Box minW="70px" w="70px" h="24px" flexShrink={0}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );

  const ChangeIndicator = ({ value }: { value: number }) => (
    <HStack spacing={1}>
      {value >= 0 ? (
        <ArrowUpIcon boxSize={3} color="green.400" />
      ) : (
        <ArrowDownIcon boxSize={3} color="red.400" />
      )}
      <Text fontSize="xs" color={value >= 0 ? 'green.400' : 'red.400'}>
        {Math.abs(value).toFixed(1)}%
      </Text>
    </HStack>
  );

  const metricsData = [
    // Revenue Metrics
    { metric: 'Revenue Today', value: formatCurrency(kpis?.revenue_today || 0), change: 12.5, sparkline: generateSparkline(kpis?.revenue_today || 1000) },
    { metric: 'Revenue MTD', value: formatCurrency(kpis?.revenue_mtd || 0), change: 8.2, sparkline: generateSparkline(kpis?.revenue_mtd || 10000) },
    { metric: 'Revenue YTD', value: formatCurrency((kpis?.revenue_mtd || 0) * 8.5), change: 11.3, sparkline: generateSparkline((kpis?.revenue_mtd || 10000) * 8.5) },
    // Transaction Metrics
    { metric: 'Transactions Today', value: kpis?.transactions_today || 0, change: 5.1, sparkline: generateSparkline(kpis?.transactions_today || 50) },
    { metric: 'Transactions MTD', value: (kpis?.transactions_mtd || 0).toLocaleString(), change: 6.8, sparkline: generateSparkline(kpis?.transactions_mtd || 500) },
    { metric: 'Avg Ticket', value: formatCurrency(kpis?.avg_transaction_value || 0), change: -2.3, sparkline: generateSparkline(kpis?.avg_transaction_value || 75) },
    { metric: 'Peak Hour Avg', value: formatCurrency((kpis?.avg_transaction_value || 75) * 1.15), change: 4.2, sparkline: generateSparkline((kpis?.avg_transaction_value || 75) * 1.15) },
    // Customer Metrics
    { metric: 'New Customers', value: kpis?.customers_new_today || 0, change: 15.2, sparkline: generateSparkline(kpis?.customers_new_today || 10) },
    { metric: 'Repeat Customers', value: Math.round((kpis?.transactions_today || 50) * ((kpis?.customers_repeat_pct || 70) / 100)), change: 8.5, sparkline: generateSparkline((kpis?.transactions_today || 50) * 0.7) },
    { metric: 'Repeat Rate', value: `${(kpis?.customers_repeat_pct || 0).toFixed(1)}%`, change: 3.2, sparkline: generateSparkline(kpis?.customers_repeat_pct || 70) },
    { metric: 'Loyalty Members', value: Math.round((kpis?.transactions_mtd || 500) * 0.45).toLocaleString(), change: 12.1, sparkline: generateSparkline((kpis?.transactions_mtd || 500) * 0.45) },
    // Staff & Operations
    { metric: 'Staff On Duty', value: kpis?.staff_count || 0, change: 0, sparkline: generateSparkline(kpis?.staff_count || 5) },
    { metric: 'Avg Wait Time', value: '4.2 min', change: -8.5, sparkline: generateSparkline(4.2) },
    { metric: 'Orders/Staff', value: Math.round((kpis?.transactions_today || 50) / (kpis?.staff_count || 5)), change: 6.3, sparkline: generateSparkline(10) },
    // Inventory & Compliance
    { metric: 'Inventory Health', value: `${(kpis?.inventory_health_pct || 0).toFixed(0)}%`, change: 1.5, sparkline: generateSparkline(kpis?.inventory_health_pct || 85) },
    { metric: 'SKUs Active', value: Math.round((kpis?.low_stock_count || 5) * 25).toLocaleString(), change: 2.8, sparkline: generateSparkline(125) },
    { metric: 'Low Stock Items', value: kpis?.low_stock_count || 0, change: -8.0, sparkline: generateSparkline(kpis?.low_stock_count || 5), invertColor: true },
    { metric: 'Need Retest', value: kpis?.items_needing_retest || 0, change: -5.0, sparkline: generateSparkline(kpis?.items_needing_retest || 3), invertColor: true },
    { metric: 'Compliance Flags', value: kpis?.compliance_flags_open || 0, change: -10.0, sparkline: generateSparkline(kpis?.compliance_flags_open || 2), invertColor: true },
    { metric: 'Expiring Soon', value: Math.round((kpis?.items_needing_retest || 3) * 1.5), change: -3.5, sparkline: generateSparkline(5), invertColor: true },
    { metric: 'Discounts Given', value: formatCurrency((kpis?.revenue_today || 0) * 0.08), change: 2.1, sparkline: generateSparkline((kpis?.revenue_today || 1000) * 0.08) },
  ];

  return (
    <Box>
      <HStack justify="space-between" mb={4}>
        <Box>
          <Heading size="lg" color="white">Dashboard</Heading>
          <Text fontSize="sm" color="slate.400">Option 2: Data Tables with Sparklines</Text>
        </Box>
        <HStack spacing={3}>
          <DateRangeSelector />
          <Badge colorScheme="blue" fontSize="sm" px={3} py={1}>Layout Option 2</Badge>
          <EditModeToolbar dashboardStyle="option-2" />
        </HStack>
      </HStack>

      {/* Draggable Grid Layout */}
      <DraggableGrid dashboardStyle="option-2">
        {/* Main Metrics Table - Multi-Column Layout */}
        <DraggableWidget key="metrics-table" id="metrics-table" noPadding>
          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={0} h="100%">
            {[0, 1, 2].map((colIndex) => {
              const colMetrics = metricsData.slice(colIndex * 7, (colIndex + 1) * 7);
              return (
                <Box key={colIndex} bg="slate.800" borderRadius={colIndex === 0 ? 'md 0 0 md' : colIndex === 2 ? '0 md md 0' : 'none'} borderRight={colIndex < 2 ? '1px solid' : 'none'} borderColor="slate.700" overflow="hidden">
                  <Table size="sm">
                    {colIndex === 0 && (
                      <Thead bg="slate.750">
                        <Tr>
                          <Th color="slate.400" borderColor="slate.700" fontSize="xs">Metric</Th>
                          <Th color="slate.400" borderColor="slate.700" isNumeric fontSize="xs">Value</Th>
                          <Th color="slate.400" borderColor="slate.700" fontSize="xs" minW="80px">Trend</Th>
                          <Th color="slate.400" borderColor="slate.700" isNumeric fontSize="xs" minW="55px">Δ</Th>
                        </Tr>
                      </Thead>
                    )}
                    {colIndex !== 0 && (
                      <Thead bg="slate.750">
                        <Tr>
                          <Th color="slate.400" borderColor="slate.700" fontSize="xs">Metric</Th>
                          <Th color="slate.400" borderColor="slate.700" isNumeric fontSize="xs">Value</Th>
                          <Th color="slate.400" borderColor="slate.700" fontSize="xs" minW="80px">Trend</Th>
                          <Th color="slate.400" borderColor="slate.700" isNumeric fontSize="xs" minW="55px">Δ</Th>
                        </Tr>
                      </Thead>
                    )}
                    <Tbody>
                      {colMetrics.map((row) => (
                        <Tr key={row.metric} _hover={{ bg: 'slate.750' }} h="44px">
                          <Td borderColor="slate.700" py={2}>
                            <Text fontSize="xs" color="white" whiteSpace="nowrap">{row.metric}</Text>
                          </Td>
                          <Td borderColor="slate.700" isNumeric py={2}>
                            <Text fontSize="xs" fontWeight="bold" color="white" whiteSpace="nowrap">{row.value}</Text>
                          </Td>
                          <Td borderColor="slate.700" py={2} minW="80px">
                            <Sparkline data={row.sparkline} color={row.invertColor ? (row.change < 0 ? '#22c55e' : '#ef4444') : (row.change >= 0 ? '#22c55e' : '#ef4444')} />
                          </Td>
                          <Td borderColor="slate.700" isNumeric py={2} minW="55px">
                            <ChangeIndicator value={row.invertColor ? -row.change : row.change} />
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              );
            })}
          </Grid>
        </DraggableWidget>

        {/* Top Products & Strains */}
        <DraggableWidget key="products-table" id="products-table" noPadding>
          <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={4} h="100%">
            <TopProductsChart />
            <TopStrainsChart />
          </Grid>
        </DraggableWidget>

        {/* Staff Performance Table */}
        <DraggableWidget key="staff-table" id="staff-table" noPadding>
          <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={4} h="100%">
            {/* Main Staff Table */}
            <Box bg="slate.800" borderRadius="md" overflow="hidden">
              <Box bg="slate.750" px={4} py={2} borderBottom="1px" borderColor="slate.700">
                <Flex justify="space-between" align="center">
                  <Text fontSize="sm" fontWeight="semibold" color="slate.300">Staff Performance</Text>
                  <Badge colorScheme="green" fontSize="xs">Today</Badge>
                </Flex>
              </Box>
              <Box overflowY="auto" maxH="calc(100% - 40px)">
                <Table size="sm">
                  <Thead>
                    <Tr>
                      <Th color="slate.400" borderColor="slate.700" w="30px">#</Th>
                      <Th color="slate.400" borderColor="slate.700">Staff</Th>
                      <Th color="slate.400" borderColor="slate.700" isNumeric>Sales</Th>
                      <Th color="slate.400" borderColor="slate.700" isNumeric>Trans</Th>
                      <Th color="slate.400" borderColor="slate.700" isNumeric>Avg Ticket</Th>
                      <Th color="slate.400" borderColor="slate.700">Trend</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {staffPerformance?.slice(0, 10).map((staff, idx) => (
                      <Tr key={staff.user_id} _hover={{ bg: 'slate.750' }}>
                        <Td borderColor="slate.700">
                          <Flex
                            align="center"
                            justify="center"
                            w={5}
                            h={5}
                            borderRadius="full"
                            bg={idx === 0 ? 'yellow.500' : idx === 1 ? 'slate.400' : idx === 2 ? 'orange.600' : 'slate.700'}
                            color={idx < 3 ? 'slate.900' : 'slate.400'}
                            fontSize="xs"
                            fontWeight="bold"
                          >
                            {idx + 1}
                          </Flex>
                        </Td>
                        <Td borderColor="slate.700">
                          <Text fontSize="sm" color="white" fontWeight={idx < 3 ? 'semibold' : 'normal'}>{staff.full_name}</Text>
                        </Td>
                        <Td borderColor="slate.700" isNumeric>
                          <Text fontSize="sm" color={idx === 0 ? 'green.400' : 'white'} fontWeight={idx === 0 ? 'bold' : 'normal'}>
                            {formatCurrency(staff.sales)}
                          </Text>
                        </Td>
                        <Td borderColor="slate.700" isNumeric>
                          <Text fontSize="sm" color="slate.300">{staff.transaction_count}</Text>
                        </Td>
                        <Td borderColor="slate.700" isNumeric>
                          <Text fontSize="sm" color="slate.400">
                            {formatCurrency(staff.transaction_count > 0 ? staff.sales / staff.transaction_count : 0)}
                          </Text>
                        </Td>
                        <Td borderColor="slate.700">
                          <Sparkline data={generateSparkline(staff.sales)} />
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            </Box>

            {/* Staff Summary Stats */}
            <Box bg="slate.800" borderRadius="md" overflow="hidden">
              <Box bg="slate.750" px={4} py={2} borderBottom="1px" borderColor="slate.700">
                <Text fontSize="sm" fontWeight="semibold" color="slate.300">Team Summary</Text>
              </Box>
              <VStack spacing={0} align="stretch" p={3}>
                <Box py={2} borderBottom="1px" borderColor="slate.700">
                  <Text fontSize="xs" color="slate.500" mb={1}>Total Team Sales</Text>
                  <Text fontSize="lg" fontWeight="bold" color="green.400">
                    {formatCurrency(staffPerformance?.reduce((sum, s) => sum + s.sales, 0) || 0)}
                  </Text>
                </Box>
                <Box py={2} borderBottom="1px" borderColor="slate.700">
                  <Text fontSize="xs" color="slate.500" mb={1}>Total Transactions</Text>
                  <Text fontSize="lg" fontWeight="bold" color="white">
                    {staffPerformance?.reduce((sum, s) => sum + s.transaction_count, 0) || 0}
                  </Text>
                </Box>
                <Box py={2} borderBottom="1px" borderColor="slate.700">
                  <Text fontSize="xs" color="slate.500" mb={1}>Team Avg Ticket</Text>
                  <Text fontSize="lg" fontWeight="bold" color="white">
                    {formatCurrency(
                      staffPerformance && staffPerformance.length > 0
                        ? staffPerformance.reduce((sum, s) => sum + s.sales, 0) /
                          staffPerformance.reduce((sum, s) => sum + s.transaction_count, 0)
                        : 0
                    )}
                  </Text>
                </Box>
                <Box py={2} borderBottom="1px" borderColor="slate.700">
                  <Text fontSize="xs" color="slate.500" mb={1}>Top Performer</Text>
                  <HStack>
                    <Text fontSize="md" fontWeight="bold" color="yellow.400">🏆</Text>
                    <Text fontSize="sm" fontWeight="semibold" color="white">
                      {staffPerformance?.[0]?.full_name || 'N/A'}
                    </Text>
                  </HStack>
                </Box>
                <Box py={2} borderBottom="1px" borderColor="slate.700">
                  <Text fontSize="xs" color="slate.500" mb={1}>Avg Sales/Staff</Text>
                  <Text fontSize="md" fontWeight="semibold" color="white">
                    {formatCurrency(
                      staffPerformance && staffPerformance.length > 0
                        ? staffPerformance.reduce((sum, s) => sum + s.sales, 0) / staffPerformance.length
                        : 0
                    )}
                  </Text>
                </Box>
                <Box py={2}>
                  <Text fontSize="xs" color="slate.500" mb={1}>Active Staff</Text>
                  <HStack spacing={2}>
                    <Text fontSize="md" fontWeight="semibold" color="white">
                      {staffPerformance?.length || 0} budtenders
                    </Text>
                    <Badge colorScheme="green" fontSize="xs">On Duty</Badge>
                  </HStack>
                </Box>
              </VStack>
            </Box>
          </Grid>
        </DraggableWidget>

        {/* AI Insights Section */}
        <DraggableWidget key="ai-insights" id="ai-insights" noPadding>
          <Box bg="slate.800" borderRadius="md" overflow="hidden" border="1px solid" borderColor="purple.600">
            <Flex bg="slate.750" px={4} py={3} borderBottom="1px" borderColor="slate.700" align="center">
              <HStack spacing={2}>
                <Sparkles size={18} color="#A855F7" />
                <Text fontSize="sm" fontWeight="bold" color="white">AI Insights</Text>
                <Badge colorScheme="purple" fontSize="xs">Powered by AI</Badge>
              </HStack>
            </Flex>
            <Box p={4}>
              {insights.length > 0 ? (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                  {insights.map((insight) => <InsightCard key={insight.id} insight={insight} />)}
                </SimpleGrid>
              ) : (
                <Text color="slate.400" textAlign="center" py={4}>No insights available. Data is still loading...</Text>
              )}
            </Box>
          </Box>
        </DraggableWidget>
      </DraggableGrid>
    </Box>
  );
}

export default DashboardOption2;
