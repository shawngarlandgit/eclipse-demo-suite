import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Button,
  Flex,
  Divider,
} from '@chakra-ui/react';
import { ExclamationTriangleIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

interface CriticalItem {
  id: string;
  name: string;
  quantity: number;
  threshold: number;
  category: string;
}

interface CriticalInventoryCardProps {
  lowStockCount: number;
  criticalStockCount: number;
  healthPercentage?: number;
  needsRetestCount?: number;
  items?: CriticalItem[];
  isLoading?: boolean;
}

/**
 * CriticalInventoryCard Component
 * Displays critical inventory alerts requiring attention
 */
function CriticalInventoryCard({
  lowStockCount,
  criticalStockCount,
  healthPercentage = 0,
  needsRetestCount = 0,
  items = [],
  isLoading = false,
}: CriticalInventoryCardProps) {
  const navigate = useNavigate();

  // Determine health status
  const getHealthStatus = (percentage: number) => {
    if (percentage >= 90) return { label: 'Excellent', colorScheme: 'green' };
    if (percentage >= 75) return { label: 'Good', colorScheme: 'cannabis' };
    if (percentage >= 50) return { label: 'Fair', colorScheme: 'yellow' };
    return { label: 'Poor', colorScheme: 'red' };
  };

  const healthStatus = getHealthStatus(healthPercentage);

  if (isLoading) {
    return (
      <Box className="card" p={6}>
        <Heading size="md" mb={4} color="white">
          Inventory Health
        </Heading>
        <VStack spacing={3} align="stretch">
          {[1, 2, 3].map((i) => (
            <Box key={i} className="skeleton" h="60px" w="full" />
          ))}
        </VStack>
      </Box>
    );
  }

  const totalAlerts = lowStockCount + criticalStockCount;

  return (
    <Box className="card" p={6}>
      {/* Inventory Health Section */}
      <HStack justify="space-between" mb={4}>
        <Heading size="md" color="white">
          Inventory Health
        </Heading>
        <HStack spacing={2}>
          <Text fontSize="2xl" fontWeight="bold" color="white">
            {healthPercentage.toFixed(0)}%
          </Text>
          <Badge
            colorScheme={healthStatus.colorScheme}
            fontSize="xs"
            px={2}
            py={0.5}
            rounded="full"
          >
            {healthStatus.label}
          </Badge>
        </HStack>
      </HStack>

      {/* Inventory Breakdown */}
      <VStack spacing={2} align="stretch" mb={4}>
        {[
          { label: 'Healthy Stock', percentage: healthPercentage, color: '#22c55e' },
          { label: 'Low Stock', percentage: lowStockCount > 0 ? ((100 - healthPercentage) / 2) : 0, color: '#f59e0b', count: lowStockCount },
          { label: 'Needs Retest', percentage: needsRetestCount > 0 ? ((100 - healthPercentage) / 2) : 0, color: '#ef4444', count: needsRetestCount },
        ].map((item) => (
          <Flex key={item.label} align="center" justify="space-between">
            <HStack spacing={2} flex={1}>
              <Box w={2} h={2} borderRadius="sm" bg={item.color} />
              <Text fontSize="xs" color="slate.400">{item.label}</Text>
            </HStack>
            <HStack spacing={3}>
              <Text fontSize="xs" fontWeight="medium" color="white">
                {item.percentage.toFixed(0)}%
              </Text>
              {item.count !== undefined && (
                <Text fontSize="xs" color="slate.500">
                  {item.count} items
                </Text>
              )}
            </HStack>
          </Flex>
        ))}
      </VStack>

      <Divider borderColor="slate.700" mb={4} />

      {/* Inventory Alerts Section */}
      <HStack justify="space-between" mb={4}>
        <Text fontSize="sm" fontWeight="semibold" color="slate.300">
          Inventory Alerts
        </Text>
        {totalAlerts > 0 && (
          <HStack spacing={2}>
            <ExclamationTriangleIcon className="w-4 h-4 text-orange-400" />
            <Text fontSize="sm" color="slate.400">
              {totalAlerts} Alert{totalAlerts > 1 ? 's' : ''}
            </Text>
          </HStack>
        )}
      </HStack>

      {totalAlerts === 0 ? (
        <Box
          py={6}
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          mb={4}
        >
          <Text color="green.400" fontSize="2xl" mb={2}>
            ✓
          </Text>
          <Text color="slate.400" fontSize="sm">All inventory levels healthy</Text>
        </Box>
      ) : (
        <>

      {/* Alert Summary */}
      <VStack spacing={3} align="stretch" mb={4}>
        {criticalStockCount > 0 && (
          <HStack
            p={3}
            bg="red.900"
            borderWidth="1px"
            borderColor="red.700"
            rounded="lg"
          >
            <Badge colorScheme="red" variant="solid">
              CRITICAL
            </Badge>
            <Text fontSize="sm" color="white" flex={1}>
              {criticalStockCount} item{criticalStockCount > 1 ? 's' : ''} out of stock
            </Text>
          </HStack>
        )}

        {lowStockCount > 0 && (
          <HStack
            p={3}
            bg="orange.900"
            borderWidth="1px"
            borderColor="orange.700"
            rounded="lg"
          >
            <Badge colorScheme="orange" variant="solid">
              LOW
            </Badge>
            <Text fontSize="sm" color="white" flex={1}>
              {lowStockCount} item{lowStockCount > 1 ? 's' : ''} running low
            </Text>
          </HStack>
        )}
      </VStack>

      {/* Sample Items */}
      {items.length > 0 && (
        <VStack spacing={2} align="stretch" mb={4}>
          <Text fontSize="xs" color="slate.400" fontWeight="medium">
            NEEDS ATTENTION:
          </Text>
          {items.slice(0, 3).map((item) => (
            <HStack
              key={item.id}
              p={2}
              bg="slate.750"
              rounded="md"
              spacing={2}
            >
              <Box flex={1} minW={0}>
                <Text fontSize="sm" color="white" noOfLines={1}>
                  {item.name}
                </Text>
                <Text fontSize="xs" color="slate.400">
                  {item.quantity} / {item.threshold} units
                </Text>
              </Box>
              <Badge
                colorScheme={item.quantity === 0 ? 'red' : 'orange'}
                fontSize="xs"
              >
                {item.quantity === 0 ? 'Out' : 'Low'}
              </Badge>
            </HStack>
          ))}
        </VStack>
      )}
        </>
      )}

      {/* Action Button */}
      <Button
        size="sm"
        variant="outline"
        colorScheme="cannabis"
        w="full"
        rightIcon={<ArrowRightIcon className="w-4 h-4" />}
        onClick={() => navigate('/inventory')}
      >
        View All Inventory
      </Button>
    </Box>
  );
}

export default CriticalInventoryCard;
