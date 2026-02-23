import { Box, Text, Skeleton, VStack, HStack, Flex } from '@chakra-ui/react';
import { useCategoryBreakdown } from '../../../../hooks/useAnalytics';
import { formatCurrency } from '../../../../utils/formatters';

/**
 * CategoryBreakdownChart
 * Horizontal bar chart showing revenue distribution by category
 */
function CategoryBreakdownChart() {
  const { data, isLoading } = useCategoryBreakdown();

  // Color palette for categories - matching cannabis theme
  const COLORS: Record<string, string> = {
    flower: '#22c55e',      // Green
    edible: '#f59e0b',      // Amber
    extract: '#8b5cf6',     // Purple
    'pre-roll': '#3b82f6',  // Blue
    vape: '#ec4899',        // Pink
    topical: '#14b8a6',     // Teal
  };

  if (isLoading) {
    return (
      <Box className="card" p={6}>
        <Skeleton height="400px" />
      </Box>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Box className="card" p={6}>
        <Text color="slate.400">No category data available</Text>
      </Box>
    );
  }

  // Capitalize category names for display
  const formatCategoryName = (category: string) => {
    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const maxRevenue = Math.max(...data.map(d => d.revenue));

  return (
    <Box className="card" p={6}>
      <Text fontSize="lg" fontWeight="bold" color="white" mb={6}>
        Sales by Category
      </Text>

      <VStack spacing={4} align="stretch">
        {data.map((item, _index) => {
          const barWidth = (item.revenue / maxRevenue) * 100;

          return (
            <Box key={item.category} position="relative">
              {/* Background bar */}
              <Box
                position="absolute"
                left={0}
                top={0}
                bottom={0}
                w={`${barWidth}%`}
                bg={COLORS[item.category] || '#64748b'}
                borderRadius="md"
                opacity={0.15}
                transition="all 0.3s"
              />

              {/* Content */}
              <Flex
                position="relative"
                justify="space-between"
                align="center"
                p={4}
              >
                <HStack spacing={3} flex={1}>
                  <Box
                    w={3}
                    h={3}
                    borderRadius="sm"
                    bg={COLORS[item.category] || '#64748b'}
                  />
                  <Text fontSize="sm" color="white" fontWeight="semibold" minW="100px">
                    {formatCategoryName(item.category)}
                  </Text>
                </HStack>

                <HStack spacing={6}>
                  <VStack align="end" spacing={0} minW="80px">
                    <Text fontSize="sm" fontWeight="bold" color="white">
                      {item.percentage.toFixed(1)}%
                    </Text>
                    <Text fontSize="xs" color="slate.500">
                      of total
                    </Text>
                  </VStack>

                  <VStack align="end" spacing={0} minW="100px">
                    <Text fontSize="md" fontWeight="bold" color="white">
                      {formatCurrency(item.revenue)}
                    </Text>
                    <Text fontSize="xs" color="slate.500">
                      {item.transaction_count} transactions
                    </Text>
                  </VStack>
                </HStack>
              </Flex>
            </Box>
          );
        })}
      </VStack>

      {/* Summary Footer */}
      <Box
        mt={4}
        pt={4}
        borderTop="1px solid"
        borderColor="slate.700"
      >
        <HStack justify="space-between">
          <Text fontSize="xs" color="slate.500">
            Total Revenue (All Categories)
          </Text>
          <Text fontSize="sm" fontWeight="semibold" color="green.400">
            {formatCurrency(data.reduce((sum, d) => sum + d.revenue, 0))}
          </Text>
        </HStack>
      </Box>
    </Box>
  );
}

export default CategoryBreakdownChart;
