import { Box, Text, Skeleton, VStack, HStack } from '@chakra-ui/react';
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
import { useRevenueTrend } from '../../../../hooks/useAnalytics';
import { formatCurrency, formatDate } from '../../../../utils/formatters';

// Custom tooltip props interface
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
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

// Custom tooltip component
function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const date = new Date(label || '');
  const isHourlyData = label?.includes('T') ?? false;

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
      {/* Date/Time */}
      <Text fontSize="sm" fontWeight="bold" color="white" mb={2}>
        {isHourlyData ? (
          <>
            {date.getHours() === 0 ? '12' : date.getHours() > 12 ? date.getHours() - 12 : date.getHours()}
            :00 {date.getHours() >= 12 ? 'PM' : 'AM'}
          </>
        ) : (
          formatDate(label || '')
        )}
      </Text>

      {/* Revenue */}
      <HStack justify="space-between" mb={3} pb={3} borderBottom="1px solid" borderColor="slate.700">
        <Text fontSize="sm" color="slate.400">Revenue</Text>
        <Text fontSize="md" fontWeight="bold" color="green.400">
          {formatCurrency(payload[0].value as number)}
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
}

/**
 * RevenueTrendChart
 * Line chart showing revenue trends over time
 */
function RevenueTrendChart() {
  const { data, isLoading } = useRevenueTrend();

  if (isLoading) {
    return (
      <Box className="card" p={6}>
        <Skeleton height="300px" />
      </Box>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Box className="card" p={6}>
        <Text color="slate.400">No revenue data available</Text>
      </Box>
    );
  }

  // Detect if this is hourly data (contains timestamps with hours)
  const isHourlyData = data.length > 0 && data[0].date.includes('T');

  return (
    <Box className="card" p={6}>
      <Text fontSize="lg" fontWeight="bold" color="white" mb={4}>
        Revenue Trend {isHourlyData && '(Hourly)'}
      </Text>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="date"
            stroke="#94a3b8"
            tick={{ fill: '#94a3b8' }}
            tickFormatter={(value) => {
              const date = new Date(value);
              if (isHourlyData) {
                // Format as hour (e.g., "9 AM", "3 PM")
                const hour = date.getHours();
                if (hour === 0) return '12 AM';
                if (hour === 12) return '12 PM';
                if (hour < 12) return `${hour} AM`;
                return `${hour - 12} PM`;
              } else {
                // Format as date (e.g., "1/15")
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }
            }}
            interval={isHourlyData ? 2 : undefined} // Show every 3rd hour for hourly data
          />
          <YAxis
            stroke="#94a3b8"
            tick={{ fill: '#94a3b8' }}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ color: '#94a3b8' }}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#22c55e"
            strokeWidth={2}
            dot={{ fill: '#22c55e', r: 4 }}
            activeDot={{ r: 6 }}
            name="Revenue"
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}

export default RevenueTrendChart;
