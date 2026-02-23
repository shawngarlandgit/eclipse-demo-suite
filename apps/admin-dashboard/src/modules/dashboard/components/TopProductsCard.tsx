import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Progress,
} from '@chakra-ui/react';
import { ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '../../../utils/formatters';
import type { TopProduct } from '../../../types';

interface TopProductsCardProps {
  data: TopProduct[];
  isLoading?: boolean;
}

/**
 * TopProductsCard Component
 * Displays best-selling products
 */
function TopProductsCard({ data, isLoading = false }: TopProductsCardProps) {
  if (isLoading) {
    return (
      <Box className="card" p={6}>
        <Heading size="md" mb={4} color="white">
          Top Products
        </Heading>
        <VStack spacing={3} align="stretch">
          {[1, 2, 3, 4, 5].map((i) => (
            <Box key={i} className="skeleton" h="60px" w="full" />
          ))}
        </VStack>
      </Box>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Box className="card" p={6}>
        <Heading size="md" mb={4} color="white">
          Top Products
        </Heading>
        <Box h="200px" display="flex" alignItems="center" justifyContent="center">
          <Text color="slate.400">No product data available</Text>
        </Box>
      </Box>
    );
  }

  const maxRevenue = Math.max(...data.map(p => p.revenue));

  return (
    <Box className="card" p={6}>
      <HStack justify="space-between" mb={4}>
        <Heading size="md" color="white">
          Top Products
        </Heading>
        <HStack spacing={2}>
          <ArrowTrendingUpIcon className="w-5 h-5 text-cannabis-400" />
          <Text fontSize="sm" color="slate.400">
            Best Sellers
          </Text>
        </HStack>
      </HStack>

      <VStack spacing={4} align="stretch">
        {data.map((product, index) => {
          const percentage = (product.revenue / maxRevenue) * 100;

          return (
            <Box key={product.product_id}>
              <HStack justify="space-between" mb={2}>
                <HStack spacing={2} flex={1} minW={0}>
                  <Badge
                    colorScheme={index === 0 ? 'green' : 'gray'}
                    variant="subtle"
                  >
                    #{index + 1}
                  </Badge>
                  <VStack align="start" spacing={0} flex={1} minW={0}>
                    <Text
                      fontSize="sm"
                      fontWeight="medium"
                      color="white"
                      noOfLines={1}
                    >
                      {product.product_name}
                    </Text>
                    <Text fontSize="xs" color="slate.400" textTransform="capitalize">
                      {product.product_type.replace('_', ' ')} • {product.units_sold} units
                    </Text>
                  </VStack>
                </HStack>
                <Text
                  fontSize="sm"
                  fontWeight="bold"
                  color="cannabis.400"
                  minW="fit-content"
                >
                  {formatCurrency(product.revenue)}
                </Text>
              </HStack>
              <Progress
                value={percentage}
                size="sm"
                colorScheme="cannabis"
                bg="slate.700"
                borderRadius="full"
              />
            </Box>
          );
        })}
      </VStack>
    </Box>
  );
}

export default TopProductsCard;
