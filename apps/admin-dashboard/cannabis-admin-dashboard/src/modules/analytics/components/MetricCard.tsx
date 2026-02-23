import { Box, Flex, Text, Icon } from '@chakra-ui/react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  change?: number;
  subtitle?: string;
  icon?: React.ComponentType<any>;
}

/**
 * MetricCard
 * Displays a key metric with optional trend indicator
 */
function MetricCard({ title, value, change, subtitle, icon: IconComponent }: MetricCardProps) {
  const isPositive = change !== undefined && change >= 0;
  const hasChange = change !== undefined;

  return (
    <Box className="card" p={6}>
      <Flex justify="space-between" align="start" mb={2}>
        <Text fontSize="sm" color="slate.400" fontWeight="medium">
          {title}
        </Text>
        {IconComponent && (
          <Icon as={IconComponent} boxSize={5} color="green.400" />
        )}
      </Flex>

      <Text fontSize="2xl" fontWeight="bold" color="white" mb={1}>
        {value}
      </Text>

      {hasChange && (
        <Flex align="center" gap={1}>
          <Icon
            as={isPositive ? TrendingUp : TrendingDown}
            boxSize={4}
            color={isPositive ? 'green.400' : 'red.400'}
          />
          <Text
            fontSize="sm"
            color={isPositive ? 'green.400' : 'red.400'}
            fontWeight="medium"
          >
            {isPositive ? '+' : ''}{change.toFixed(1)}%
          </Text>
          <Text fontSize="sm" color="slate.500">
            vs previous period
          </Text>
        </Flex>
      )}

      {subtitle && !hasChange && (
        <Text fontSize="sm" color="slate.500">
          {subtitle}
        </Text>
      )}
    </Box>
  );
}

export default MetricCard;
