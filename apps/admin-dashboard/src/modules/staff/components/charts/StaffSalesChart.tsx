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
} from 'recharts';
import { formatCurrency } from '../../../../utils/formatters';
import type { StaffPerformanceMetrics } from '../../types';

interface StaffSalesChartProps {
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
  label?: string;
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
      minW="200px"
      boxShadow="xl"
    >
      <Text fontSize="sm" fontWeight="bold" color="white" mb={2}>
        {staff.full_name}
      </Text>
      <Text fontSize="xs" color="slate.400" mb={3}>
        {staff.role}
      </Text>

      <Text fontSize="md" fontWeight="bold" color="green.400" mb={2}>
        {formatCurrency(staff.sales)}
      </Text>

      <Box fontSize="xs" color="slate.400">
        <Text>{staff.transaction_count} transactions</Text>
        <Text>{formatCurrency(staff.avg_transaction_value)} avg</Text>
        <Text>{staff.recommendation_count} AI recs</Text>
      </Box>
    </Box>
  );
}

/**
 * StaffSalesChart
 * Bar chart comparing staff sales performance
 */
function StaffSalesChart({ data, isLoading = false }: StaffSalesChartProps) {
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
        <Text color="slate.400">No staff sales data available</Text>
      </Box>
    );
  }

  // Take top 10 staff by sales
  const chartData = [...data]
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 10)
    .map(staff => ({
      ...staff,
      name: staff.full_name.split(' ')[0], // Use first name for chart
    }));

  return (
    <Box className="card" p={6} h="100%" display="flex" flexDirection="column" w="100%">
      <Text fontSize="lg" fontWeight="bold" color="white" mb={4}>
        Sales Comparison (Top 10)
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
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ color: '#94a3b8' }}
            />
            <Bar
              dataKey="sales"
              fill="#22c55e"
              radius={[4, 4, 0, 0]}
              name="Sales"
            />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
}

export default StaffSalesChart;
