import { Box, Heading, Text, VStack, HStack, Flex } from '@chakra-ui/react';
import type { ReactNode } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import type { SalesTrend } from '../../../types';
import { CHART_COLORS } from '../../../utils/constants';

interface RevenueChartProps {
  data: SalesTrend[];
  isLoading?: boolean;
  headerRight?: ReactNode;
}

// Custom tooltip props interface
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: {
      date: string;
      originalDate: string;
      transactions: number;
    };
    [key: string]: any;
  }>;
  label?: string;
}

// Sample products and strains for tooltip
const TOP_PRODUCTS = [
  'Blue Dream - Flower (1/8th)', 'Sour Diesel - Pre-Roll', 'GSC - Live Resin Cart',
  'Wedding Cake - Flower (1/8th)', 'OG Kush - Pre-Roll Pack', 'Gelato - Shatter',
  'Jack Herer - Cart', 'Purple Punch - Edible Gummies', 'White Widow - Flower (1/4oz)',
  'Northern Lights - Disposable Vape', 'Pineapple Express - Pre-Roll', 'Zkittlez - Cart',
];

const TOP_STRAINS = [
  'Blue Dream', 'Sour Diesel', 'Girl Scout Cookies', 'Gorilla Glue #4', 'Wedding Cake',
  'OG Kush', 'Gelato', 'Purple Haze', 'Jack Herer', 'White Widow',
  'Northern Lights', 'Pineapple Express', 'Zkittlez', 'Mimosa', 'Runtz',
];

/**
 * RevenueChart Component
 * Displays revenue trend over time as a line chart
 */
function RevenueChart({ data, isLoading = false, headerRight }: RevenueChartProps) {
  if (isLoading) {
    return (
      <Box className="card" p={6}>
        <Heading size="md" mb={4} color="white">
          Revenue Trend
        </Heading>
        <Box className="skeleton" h="300px" w="full" />
      </Box>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Box className="card" p={6}>
        <Heading size="md" mb={4} color="white">
          Revenue Trend
        </Heading>
        <Box h="300px" display="flex" alignItems="center" justifyContent="center">
          <Text color="slate.400">No sales data available</Text>
        </Box>
      </Box>
    );
  }

  // Format data for chart - keep original date for tooltip
  const chartData = data.map((item) => ({
    date: formatDate(item.date, 'MMM dd'),
    originalDate: item.date, // Keep original for tooltip seed
    sales: item.sales,
    transactions: item.transactions,
  }));

  // Custom tooltip with product and strain breakdown
  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (!active || !payload || !payload.length) return null;

    // Get original date from payload for seeded random
    const originalDate = payload[0].payload.originalDate;
    const date = new Date(originalDate);

    // Generate top 3 products and strains for this data point using seeded random
    const seed = date.getTime();

    // Seeded random function
    const seededRandom = (s: number) => {
      const x = Math.sin(s) * 10000;
      return x - Math.floor(x);
    };

    const getTop3 = (items: string[], offset: number = 0) => {
      const indexedItems = items.map((item, idx) => ({ item, idx }));
      indexedItems.sort((a, b) => {
        const randA = seededRandom(seed + a.idx + offset);
        const randB = seededRandom(seed + b.idx + offset);
        return randA - randB;
      });
      return indexedItems.slice(0, 3).map(i => i.item);
    };

    const topProducts = getTop3(TOP_PRODUCTS, 0);
    const topStrains = getTop3(TOP_STRAINS, 1000);

    return (
      <Box
        bg="slate.900"
        border="1px solid"
        borderColor="slate.600"
        borderRadius="lg"
        p={4}
        minW="280px"
        boxShadow="xl"
      >
        {/* Date */}
        <Text fontSize="sm" fontWeight="bold" color="white" mb={2}>
          {label}
        </Text>

        {/* Revenue */}
        <HStack justify="space-between" mb={3} pb={3} borderBottom="1px solid" borderColor="slate.700">
          <Text fontSize="sm" color="slate.400">Revenue</Text>
          <Text fontSize="md" fontWeight="bold" color="green.400">
            {formatCurrency(payload[0].value as number)}
          </Text>
        </HStack>

        {/* Transactions */}
        <HStack justify="space-between" mb={3} pb={3} borderBottom="1px solid" borderColor="slate.700">
          <Text fontSize="sm" color="slate.400">Transactions</Text>
          <Text fontSize="md" fontWeight="bold" color="white">
            {payload[0].payload.transactions}
          </Text>
        </HStack>

        {/* Top Products */}
        <VStack align="stretch" spacing={2} mb={3}>
          <Text fontSize="xs" fontWeight="semibold" color="slate.500" textTransform="uppercase">
            Top Products
          </Text>
          {topProducts.map((product, idx) => (
            <HStack key={idx} spacing={2}>
              <Box
                w={5}
                h={5}
                borderRadius="sm"
                bg={idx === 0 ? 'green.600' : idx === 1 ? 'blue.600' : 'purple.600'}
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Text fontSize="xs" fontWeight="bold" color="white">
                  {idx + 1}
                </Text>
              </Box>
              <Text fontSize="xs" color="slate.300" isTruncated>
                {product}
              </Text>
            </HStack>
          ))}
        </VStack>

        {/* Top Strains */}
        <VStack align="stretch" spacing={2}>
          <Text fontSize="xs" fontWeight="semibold" color="slate.500" textTransform="uppercase">
            Top Strains
          </Text>
          {topStrains.map((strain, idx) => (
            <HStack key={idx} spacing={2}>
              <Box
                w={5}
                h={5}
                borderRadius="sm"
                bg={idx === 0 ? 'green.600' : idx === 1 ? 'blue.600' : 'purple.600'}
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Text fontSize="xs" fontWeight="bold" color="white">
                  {idx + 1}
                </Text>
              </Box>
              <Text fontSize="xs" color="slate.300">
                {strain}
              </Text>
            </HStack>
          ))}
        </VStack>
      </Box>
    );
  };

  return (
    <Box className="card" p={6} h="100%" display="flex" flexDirection="column">
      <Flex justify="space-between" align="flex-start" mb={4} flexShrink={0}>
        <Box>
          <Heading size="md" color="white">
            Revenue Trend
          </Heading>
          <Text fontSize="sm" color="slate.400" mt={1}>
            Last {data.length} days
          </Text>
        </Box>
        {headerRight && <Box>{headerRight}</Box>}
      </Flex>

      <Box flex="1" minH="200px">
        <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
              <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />

          <XAxis
            dataKey="date"
            stroke="#94a3b8"
            style={{ fontSize: '12px' }}
            tick={{ fill: '#94a3b8' }}
          />

          <YAxis
            stroke="#94a3b8"
            style={{ fontSize: '12px' }}
            tick={{ fill: '#94a3b8' }}
            tickFormatter={(value) => formatCurrency(value, { notation: 'compact' })}
          />

          <Tooltip content={<CustomTooltip />} />

          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
            formatter={(value) => (
              <span style={{ color: '#e2e8f0', fontSize: '14px' }}>{value}</span>
            )}
          />

          <Line
            type="monotone"
            dataKey="sales"
            name="Sales"
            stroke={CHART_COLORS.primary}
            strokeWidth={3}
            dot={{ fill: CHART_COLORS.primary, r: 4 }}
            activeDot={{ r: 6 }}
            fill="url(#revenueGradient)"
          />
        </LineChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
}

export default RevenueChart;
