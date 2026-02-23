import { Box, Heading, Text, VStack, HStack, Flex, Badge } from '@chakra-ui/react';

interface InventoryHealthCardProps {
  healthPercentage: number;
  lowStockCount: number;
  needsRetestCount: number;
  isLoading?: boolean;
}

/**
 * InventoryHealthCard Component
 * Displays inventory health status with horizontal bar breakdown
 */
function InventoryHealthCard({
  healthPercentage,
  lowStockCount,
  needsRetestCount,
  isLoading = false,
}: InventoryHealthCardProps) {
  // Inventory status items with percentages
  const inventoryItems = [
    {
      label: 'Healthy Stock',
      percentage: healthPercentage,
      color: '#22c55e', // Green
      count: null,
    },
    {
      label: 'Low Stock Items',
      percentage: ((100 - healthPercentage) / 2), // Split unhealthy percentage
      color: '#f59e0b', // Amber
      count: lowStockCount,
    },
    {
      label: 'Needs Retest',
      percentage: ((100 - healthPercentage) / 2), // Split unhealthy percentage
      color: '#ef4444', // Red
      count: needsRetestCount,
    },
  ];

  // Determine health status
  const getHealthStatus = (percentage: number) => {
    if (percentage >= 90) return { label: 'Excellent', colorScheme: 'green' };
    if (percentage >= 75) return { label: 'Good', colorScheme: 'cannabis' };
    if (percentage >= 50) return { label: 'Fair', colorScheme: 'yellow' };
    return { label: 'Poor', colorScheme: 'red' };
  };

  const healthStatus = getHealthStatus(healthPercentage);

  // Calculate total items
  const totalItems = lowStockCount + needsRetestCount;
  const healthyCount = Math.round((healthPercentage / 100) * totalItems);

  if (isLoading) {
    return (
      <Box className="card" p={6}>
        <Heading size="md" mb={4} color="white">
          Inventory Health
        </Heading>
        <Box className="skeleton" h="40px" w="full" mb={4} />
        <VStack spacing={3} align="stretch">
          <Box className="skeleton" h="60px" w="full" />
          <Box className="skeleton" h="60px" w="full" />
          <Box className="skeleton" h="60px" w="full" />
        </VStack>
      </Box>
    );
  }

  return (
    <Box className="card" p={6}>
      <Heading size="md" mb={4} color="white">
        Inventory Health
      </Heading>

      {/* Overall Health Status Badge */}
      <Flex justify="space-between" align="center" mb={6}>
        <HStack spacing={3}>
          <Text fontSize="3xl" fontWeight="bold" color="white">
            {healthPercentage.toFixed(0)}%
          </Text>
          <Badge
            colorScheme={healthStatus.colorScheme}
            fontSize="sm"
            px={3}
            py={1}
            rounded="full"
          >
            {healthStatus.label}
          </Badge>
        </HStack>
        <Text fontSize="sm" color="slate.400">
          Overall Health
        </Text>
      </Flex>

      {/* Horizontal Bar Breakdown */}
      <VStack spacing={3} align="stretch">
        {inventoryItems.map((item) => {
          const barWidth = Math.max(item.percentage, 5); // Minimum 5% width for visibility

          return (
            <Box key={item.label} position="relative">
              {/* Background bar */}
              <Box
                position="absolute"
                left={0}
                top={0}
                bottom={0}
                w={`${barWidth}%`}
                bg={item.color}
                borderRadius="md"
                opacity={0.15}
                transition="all 0.3s"
              />

              {/* Content */}
              <Flex position="relative" justify="space-between" align="center" p={4}>
                <HStack spacing={3} flex={1}>
                  <Box w={3} h={3} borderRadius="sm" bg={item.color} />
                  <Text fontSize="sm" color="white" fontWeight="semibold">
                    {item.label}
                  </Text>
                </HStack>

                <HStack spacing={6}>
                  <VStack align="end" spacing={0}>
                    <Text fontSize="sm" fontWeight="bold" color="white">
                      {item.percentage.toFixed(1)}%
                    </Text>
                    <Text fontSize="xs" color="slate.500">
                      of total
                    </Text>
                  </VStack>
                  {item.count !== null && (
                    <VStack align="end" spacing={0}>
                      <Text fontSize="md" fontWeight="bold" color="white">
                        {item.count}
                      </Text>
                      <Text fontSize="xs" color="slate.500">
                        items
                      </Text>
                    </VStack>
                  )}
                </HStack>
              </Flex>
            </Box>
          );
        })}
      </VStack>

      {/* Footer Summary */}
      <Box
        mt={4}
        pt={4}
        borderTop="1px"
        borderColor="slate.700"
      >
        <Flex justify="space-between" align="center">
          <Text fontSize="sm" color="slate.400">
            Total Inventory Items
          </Text>
          <Text fontSize="lg" fontWeight="bold" color="white">
            {totalItems + healthyCount}
          </Text>
        </Flex>
      </Box>
    </Box>
  );
}

export default InventoryHealthCard;
