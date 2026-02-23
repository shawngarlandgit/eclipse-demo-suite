import { Box, Text, HStack, Icon } from '@chakra-ui/react';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/solid';
import { formatCurrency, formatNumber, formatPercentage } from '../../../utils/formatters';

interface StatCardProps {
  label: string;
  value: number | string;
  format?: 'currency' | 'number' | 'percentage';
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  isLoading?: boolean;
  insight?: string;
}

/**
 * StatCard Component
 * Displays a KPI metric with optional trend indicator
 */
function StatCard({
  label,
  value,
  format = 'number',
  trend,
  icon,
  isLoading = false,
  insight,
}: StatCardProps) {
  // Format value based on type
  const formattedValue = (() => {
    if (typeof value === 'string') return value;

    switch (format) {
      case 'currency':
        return formatCurrency(value);
      case 'percentage':
        return formatPercentage(value / 100);
      case 'number':
      default:
        return formatNumber(value);
    }
  })();

  if (isLoading) {
    return (
      <Box className="stat-card">
        <HStack justify="space-between" mb={2}>
          <Text className="stat-label">{label}</Text>
          {icon && <Box opacity={0.5}>{icon}</Box>}
        </HStack>
        <Box className="skeleton" h="40px" w="60%" mb={2} />
        {trend && <Box className="skeleton" h="20px" w="40%" />}
      </Box>
    );
  }

  return (
    <Box className="stat-card">
      {/* Header: Label + Icon */}
      <HStack justify="space-between" mb={2}>
        <Text className="stat-label">{label}</Text>
        {icon && <Box opacity={0.7}>{icon}</Box>}
      </HStack>

      {/* Value */}
      <Text className="stat-value" mb={trend ? 2 : 0}>
        {formattedValue}
      </Text>

      {/* Trend Indicator */}
      {trend && (
        <HStack
          spacing={1}
          className={trend.isPositive ? 'stat-trend-up' : 'stat-trend-down'}
        >
          <Icon
            as={trend.isPositive ? ArrowTrendingUpIcon : ArrowTrendingDownIcon}
            boxSize={4}
          />
          <Text>
            {trend.isPositive ? '+' : ''}
            {formatPercentage(Math.abs(trend.value) / 100)}
          </Text>
          <Text fontSize="xs" color="slate.400">
            vs last period
          </Text>
        </HStack>
      )}

      {/* Insight */}
      {insight && (
        <Box
          mt={3}
          pt={3}
          borderTop="1px"
          borderColor="slate.700"
        >
          <Text fontSize="xs" color="slate.400" lineHeight="1.5">
            {insight}
          </Text>
        </Box>
      )}
    </Box>
  );
}

export default StatCard;
