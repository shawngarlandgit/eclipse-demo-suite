/**
 * CartPreview Component
 * Displays a summary of items in the cart
 */

import {
  Box,
  HStack,
  Text,
  Icon,
} from '@chakra-ui/react';
import { ShoppingBagIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '../../../../../utils/formatters';
import type { CartPreviewProps } from './types';

export function CartPreview({ itemCount, subtotal }: CartPreviewProps) {
  if (itemCount === 0) {
    return null;
  }

  return (
    <Box
      bg="green.900"
      borderRadius="lg"
      p={4}
      border="1px"
      borderColor="green.600"
    >
      <HStack justify="space-between">
        <HStack spacing={2}>
          <Icon as={ShoppingBagIcon} boxSize={5} color="green.400" />
          <Text fontWeight="bold" color="white">
            {itemCount} item{itemCount > 1 ? 's' : ''} added
          </Text>
        </HStack>
        <Text fontWeight="bold" color="green.400">
          {formatCurrency(subtotal)}
        </Text>
      </HStack>
    </Box>
  );
}

export default CartPreview;
