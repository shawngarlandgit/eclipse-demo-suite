import { Box, Heading, Text, Flex, HStack, Table, Thead, Tbody, Tr, Th, Td, Badge, Progress } from '@chakra-ui/react';
import { ArrowUpIcon, ArrowDownIcon } from '@chakra-ui/icons';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { useDashboardKPIs, useSalesTrend, useTopProducts } from '../hooks/useDashboard';
import { useStaffPerformance } from '../hooks/useStaff';
import DateRangeSelector from '../modules/analytics/components/DateRangeSelector';
import { formatCurrency } from '../utils/formatters';

/**
 * Dashboard Option 2: Data Tables with Sparklines
 * Financial dashboard style with inline mini charts
 */
function DashboardOption2() {
  const { data: kpis } = useDashboardKPIs();
  const { data: salesTrend } = useSalesTrend();
  const { data: topProducts } = useTopProducts(10);
  const { data: staffPerformance } = useStaffPerformance();

  // Generate mini sparkline data
  const generateSparkline = (base: number, variance: number = 0.2) => {
    return Array.from({ length: 7 }, (_, i) => ({
      value: base * (1 + (Math.random() - 0.5) * variance) * (0.8 + i * 0.03),
    }));
  };

  const Sparkline = ({ data, color = '#22c55e' }: { data: { value: number }[]; color?: string }) => (
    <Box w="80px" h="24px">
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
    { metric: 'Revenue Today', value: formatCurrency(kpis?.revenue_today || 0), change: 12.5, sparkline: generateSparkline(kpis?.revenue_today || 1000) },
    { metric: 'Revenue MTD', value: formatCurrency(kpis?.revenue_mtd || 0), change: 8.2, sparkline: generateSparkline(kpis?.revenue_mtd || 10000) },
    { metric: 'Transactions', value: kpis?.transactions_today || 0, change: 5.1, sparkline: generateSparkline(kpis?.transactions_today || 50) },
    { metric: 'Avg Ticket', value: formatCurrency(kpis?.avg_transaction_value || 0), change: -2.3, sparkline: generateSparkline(kpis?.avg_transaction_value || 75) },
    { metric: 'New Customers', value: kpis?.customers_new_today || 0, change: 15.2, sparkline: generateSparkline(kpis?.customers_new_today || 10) },
    { metric: 'Repeat Rate', value: `${(kpis?.customers_repeat_pct || 0).toFixed(1)}%`, change: 3.2, sparkline: generateSparkline(kpis?.customers_repeat_pct || 70) },
    { metric: 'Inventory Health', value: `${(kpis?.inventory_health_pct || 0).toFixed(0)}%`, change: 1.5, sparkline: generateSparkline(kpis?.inventory_health_pct || 85) },
    { metric: 'Low Stock Items', value: kpis?.low_stock_count || 0, change: -8.0, sparkline: generateSparkline(kpis?.low_stock_count || 5), invertColor: true },
  ];

  return (
    <Box>
      <HStack justify="space-between" mb={4}>
        <Box>
          <Heading size="lg" color="white">Dashboard</Heading>
          <Text fontSize="sm" color="slate.400">Option 2: Data Tables with Sparklines</Text>
        </Box>
        <Badge colorScheme="blue" fontSize="sm" px={3} py={1}>Layout Option 2</Badge>
      </HStack>

      <Box mb={4}>
        <DateRangeSelector />
      </Box>

      {/* Main Metrics Table */}
      <Box bg="slate.800" borderRadius="md" overflow="hidden" mb={4}>
        <Table size="sm">
          <Thead bg="slate.750">
            <Tr>
              <Th color="slate.400" borderColor="slate.700">Metric</Th>
              <Th color="slate.400" borderColor="slate.700" isNumeric>Value</Th>
              <Th color="slate.400" borderColor="slate.700">Trend (7d)</Th>
              <Th color="slate.400" borderColor="slate.700" isNumeric>Change</Th>
            </Tr>
          </Thead>
          <Tbody>
            {metricsData.map((row) => (
              <Tr key={row.metric} _hover={{ bg: 'slate.750' }}>
                <Td borderColor="slate.700">
                  <Text fontSize="sm" color="white">{row.metric}</Text>
                </Td>
                <Td borderColor="slate.700" isNumeric>
                  <Text fontSize="sm" fontWeight="bold" color="white">{row.value}</Text>
                </Td>
                <Td borderColor="slate.700">
                  <Sparkline data={row.sparkline} color={row.invertColor ? (row.change < 0 ? '#22c55e' : '#ef4444') : (row.change >= 0 ? '#22c55e' : '#ef4444')} />
                </Td>
                <Td borderColor="slate.700" isNumeric>
                  <ChangeIndicator value={row.invertColor ? -row.change : row.change} />
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      <Flex gap={4} flexDir={{ base: 'column', lg: 'row' }}>
        {/* Top Products Table */}
        <Box flex={1} bg="slate.800" borderRadius="md" overflow="hidden">
          <Box bg="slate.750" px={4} py={2} borderBottom="1px" borderColor="slate.700">
            <Text fontSize="sm" fontWeight="semibold" color="slate.300">Top Products by Revenue</Text>
          </Box>
          <Table size="sm">
            <Thead>
              <Tr>
                <Th color="slate.400" borderColor="slate.700" w="30px">#</Th>
                <Th color="slate.400" borderColor="slate.700">Product</Th>
                <Th color="slate.400" borderColor="slate.700" isNumeric>Revenue</Th>
                <Th color="slate.400" borderColor="slate.700" isNumeric>Units</Th>
                <Th color="slate.400" borderColor="slate.700" w="100px">Margin</Th>
              </Tr>
            </Thead>
            <Tbody>
              {topProducts?.map((product, idx) => (
                <Tr key={product.product_id} _hover={{ bg: 'slate.750' }}>
                  <Td borderColor="slate.700">
                    <Text fontSize="xs" color="slate.500">{idx + 1}</Text>
                  </Td>
                  <Td borderColor="slate.700">
                    <Text fontSize="sm" color="white" noOfLines={1}>{product.product_name}</Text>
                  </Td>
                  <Td borderColor="slate.700" isNumeric>
                    <Text fontSize="sm" color="green.400">{formatCurrency(product.revenue)}</Text>
                  </Td>
                  <Td borderColor="slate.700" isNumeric>
                    <Text fontSize="sm" color="slate.300">{product.units_sold}</Text>
                  </Td>
                  <Td borderColor="slate.700">
                    <Progress value={product.margin} size="sm" colorScheme="green" bg="slate.700" borderRadius="full" />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>

        {/* Staff Performance Table */}
        <Box flex={1} bg="slate.800" borderRadius="md" overflow="hidden">
          <Box bg="slate.750" px={4} py={2} borderBottom="1px" borderColor="slate.700">
            <Text fontSize="sm" fontWeight="semibold" color="slate.300">Staff Performance</Text>
          </Box>
          <Table size="sm">
            <Thead>
              <Tr>
                <Th color="slate.400" borderColor="slate.700" w="30px">#</Th>
                <Th color="slate.400" borderColor="slate.700">Staff</Th>
                <Th color="slate.400" borderColor="slate.700" isNumeric>Sales</Th>
                <Th color="slate.400" borderColor="slate.700" isNumeric>Trans</Th>
                <Th color="slate.400" borderColor="slate.700">Trend</Th>
              </Tr>
            </Thead>
            <Tbody>
              {staffPerformance?.slice(0, 8).map((staff, idx) => (
                <Tr key={staff.staff_id} _hover={{ bg: 'slate.750' }}>
                  <Td borderColor="slate.700">
                    <Text fontSize="xs" color="slate.500">{idx + 1}</Text>
                  </Td>
                  <Td borderColor="slate.700">
                    <Text fontSize="sm" color="white">{staff.staff_name}</Text>
                  </Td>
                  <Td borderColor="slate.700" isNumeric>
                    <Text fontSize="sm" color="green.400">{formatCurrency(staff.total_sales)}</Text>
                  </Td>
                  <Td borderColor="slate.700" isNumeric>
                    <Text fontSize="sm" color="slate.300">{staff.transaction_count}</Text>
                  </Td>
                  <Td borderColor="slate.700">
                    <Sparkline data={generateSparkline(staff.total_sales)} />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </Flex>
    </Box>
  );
}

export default DashboardOption2;
