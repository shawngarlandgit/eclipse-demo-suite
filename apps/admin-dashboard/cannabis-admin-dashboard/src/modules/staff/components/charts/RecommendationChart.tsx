import { Box, Text } from '@chakra-ui/react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import type { StaffPerformanceMetrics } from '../../types';

interface RecommendationChartProps {
  data: StaffPerformanceMetrics[];
  isLoading?: boolean;
}

// Custom tooltip
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: StaffPerformanceMetrics;
    [key: string]: any;
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const staff = payload[0].payload;

  return (
    <Box
      bg="slate.900"
      border="1px solid"
      borderColor="slate.600"
      borderRadius="lg"
      p={4}
      minW="180px"
      boxShadow="xl"
    >
      <Text fontSize="sm" fontWeight="bold" color="white" mb={2}>
        {staff.full_name}
      </Text>

      <Box fontSize="xs" color="slate.400">
        <Text mb={1}>{staff.recommendation_count} recommendations</Text>
        <Text fontWeight="bold" color="purple.400">
          {(staff.recommendation_conversion_rate * 100).toFixed(1)}% conversion
        </Text>
      </Box>
    </Box>
  );
}

/**
 * RecommendationChart
 * Shows staff AI recommendation conversion rates
 */
function RecommendationChart({ data, isLoading = false }: RecommendationChartProps) {
  if (isLoading) {
    return (
      <Box className="card" p={6}>
        <Box className="skeleton" height="400px" />
      </Box>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Box className="card" p={6}>
        <Text color="slate.400">No recommendation data available</Text>
      </Box>
    );
  }

  // Sort by recommendation count and take top 10
  const chartData = [...data]
    .sort((a, b) => b.recommendation_count - a.recommendation_count)
    .slice(0, 10)
    .map(staff => ({
      ...staff,
      name: staff.full_name.split(' ')[0], // Use first name
      conversionPct: staff.recommendation_conversion_rate * 100,
    }));

  // Color bars based on conversion rate
  const getBarColor = (rate: number) => {
    if (rate >= 60) return '#22c55e'; // Green
    if (rate >= 40) return '#eab308'; // Yellow
    return '#ef4444'; // Red
  };

  return (
    <Box className="card" p={6} h="100%" display="flex" flexDirection="column" w="100%">
      <Text fontSize="lg" fontWeight="bold" color="white" mb={2}>
        AI Recommendation Performance
      </Text>
      <Text fontSize="sm" color="slate.400" mb={4}>
        Conversion rates for top 10 staff by recommendation count
      </Text>

      <Box flex={1} minH="400px">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="name"
              stroke="#94a3b8"
              tick={{ fill: '#94a3b8' }}
            />
            <YAxis
              stroke="#94a3b8"
              tick={{ fill: '#94a3b8' }}
              tickFormatter={(value) => `${value}%`}
              domain={[0, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ color: '#94a3b8' }}
            />
            <Bar
              dataKey="conversionPct"
              radius={[4, 4, 0, 0]}
              name="Conversion Rate"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.conversionPct)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>

      {/* Legend for colors */}
      <Box mt={4} display="flex" gap={4} justifyContent="center" fontSize="xs" color="slate.400">
        <Box display="flex" alignItems="center" gap={2}>
          <Box w={3} h={3} bg="green.500" borderRadius="sm" />
          <Text>Excellent (≥60%)</Text>
        </Box>
        <Box display="flex" alignItems="center" gap={2}>
          <Box w={3} h={3} bg="yellow.500" borderRadius="sm" />
          <Text>Good (40-60%)</Text>
        </Box>
        <Box display="flex" alignItems="center" gap={2}>
          <Box w={3} h={3} bg="red.500" borderRadius="sm" />
          <Text>Needs Improvement (&lt;40%)</Text>
        </Box>
      </Box>
    </Box>
  );
}

export default RecommendationChart;
