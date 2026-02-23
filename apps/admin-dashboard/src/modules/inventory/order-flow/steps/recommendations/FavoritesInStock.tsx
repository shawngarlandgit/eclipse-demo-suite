/**
 * FavoritesInStock Component
 * Displays in-stock products matching customer preferences
 */

import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Icon,
  Badge,
  SimpleGrid,
  Flex,
} from '@chakra-ui/react';
import {
  FireIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { formatCurrency } from '../../../../../utils/formatters';
import type { FavoritesInStockProps } from './types';
import { getStrainType, getStrainTypeColorScheme, formatProductType } from './helpers';

export function FavoritesInStock({
  products,
  addedProductIds,
  onAddToCart,
}: FavoritesInStockProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <Box>
      <HStack spacing={2} mb={3}>
        <Icon as={FireIcon} boxSize={5} color="orange.400" />
        <Text fontWeight="bold" color="white">Your Favorites - In Stock Now</Text>
      </HStack>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={3}>
        {products.map(product => (
          <FavoriteProductCard
            key={product.id}
            product={product}
            isAdded={addedProductIds.has(product.id)}
            onAddToCart={onAddToCart}
          />
        ))}
      </SimpleGrid>
    </Box>
  );
}

/**
 * FavoriteProductCard - Individual favorite product display
 */
interface FavoriteProductCardProps {
  product: FavoritesInStockProps['products'][0];
  isAdded: boolean;
  onAddToCart: (productId: string) => void;
}

function FavoriteProductCard({ product, isAdded, onAddToCart }: FavoriteProductCardProps) {
  const strainType = getStrainType(product);

  return (
    <Box
      bg={isAdded ? 'green.900' : 'slate.800'}
      borderRadius="md"
      p={3}
      border="1px"
      borderColor={isAdded ? 'green.600' : 'slate.700'}
    >
      <Flex justify="space-between" align="start">
        <VStack align="start" spacing={1} flex={1}>
          <Text fontWeight="medium" color="white" fontSize="sm" noOfLines={1}>
            {product.name}
          </Text>
          <HStack spacing={1} flexWrap="wrap">
            {product.product_type && (
              <Badge
                size="sm"
                colorScheme="blue"
                fontSize="xs"
                textTransform="capitalize"
              >
                {formatProductType(product.product_type)}
              </Badge>
            )}
            {strainType && (
              <Badge
                size="sm"
                colorScheme={getStrainTypeColorScheme(strainType)}
                fontSize="xs"
              >
                {strainType}
              </Badge>
            )}
          </HStack>
          <HStack spacing={2}>
            <Text fontWeight="bold" color="green.400">
              {formatCurrency(product.price)}
            </Text>
            <Text fontSize="xs" color="slate.500">
              {product.quantity_on_hand} in stock
            </Text>
          </HStack>
        </VStack>

        <Button
          size="sm"
          colorScheme={isAdded ? 'green' : 'purple'}
          variant={isAdded ? 'solid' : 'outline'}
          onClick={() => onAddToCart(product.id)}
          isDisabled={isAdded}
          leftIcon={isAdded ? <Icon as={CheckCircleIcon} boxSize={4} /> : undefined}
        >
          {isAdded ? 'Added' : 'Add'}
        </Button>
      </Flex>
    </Box>
  );
}

export default FavoritesInStock;
