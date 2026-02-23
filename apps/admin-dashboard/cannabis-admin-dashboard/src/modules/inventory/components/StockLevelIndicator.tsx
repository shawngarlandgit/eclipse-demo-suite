import { Box, HStack, Text, Progress, Tooltip } from '@chakra-ui/react';
import type { StockLevelInfo } from '../types/index';

interface StockLevelIndicatorProps {
  stockInfo: StockLevelInfo;
  quantity: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * StockLevelIndicator
 * Visual indicator for product stock levels with color coding
 */
function StockLevelIndicator({
  stockInfo,
  quantity,
  showLabel = true,
  size = 'md',
}: StockLevelIndicatorProps) {
  const sizeMap = {
    sm: { height: '6px', fontSize: 'xs' },
    md: { height: '8px', fontSize: 'sm' },
    lg: { height: '10px', fontSize: 'md' },
  };

  const colorMap = {
    critical: 'red',
    low: 'yellow',
    normal: 'green',
    high: 'blue',
  };

  const color = colorMap[stockInfo.level];

  return (
    <Tooltip
      label={`${quantity} units - ${stockInfo.label} (${Math.round(stockInfo.percentage)}% of threshold)`}
      placement="top"
    >
      <Box>
        <HStack spacing={2} align="center">
          {showLabel && (
            <Text
              fontSize={sizeMap[size].fontSize}
              fontWeight="medium"
              color={`${color}.400`}
              minW="70px"
            >
              {stockInfo.label}
            </Text>
          )}
          <Progress
            value={Math.min(stockInfo.percentage, 100)}
            colorScheme={color}
            size={size}
            flex="1"
            minW="100px"
            borderRadius="full"
            bg="slate.700"
          />
          <Text
            fontSize={sizeMap[size].fontSize}
            fontWeight="bold"
            color="slate.300"
            minW="40px"
            textAlign="right"
          >
            {quantity}
          </Text>
        </HStack>
      </Box>
    </Tooltip>
  );
}

export default StockLevelIndicator;
