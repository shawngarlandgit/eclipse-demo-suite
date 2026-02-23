/**
 * OrderHistoryCollapse Component
 * Collapsible section showing recent customer orders
 */

import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Collapse,
} from '@chakra-ui/react';
import { formatCurrency } from '../../../../../utils/formatters';
import type { OrderHistoryCollapseProps, MockOrder } from './types';

export function OrderHistoryCollapse({ isOpen, orders }: OrderHistoryCollapseProps) {
  return (
    <Collapse in={isOpen} animateOpacity>
      <Box
        bg="slate.800"
        borderRadius="lg"
        p={4}
        border="1px"
        borderColor="purple.700"
      >
        <Text fontSize="sm" fontWeight="bold" color="white" mb={3}>
          Recent Orders
        </Text>
        <VStack spacing={2} align="stretch">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </VStack>
      </Box>
    </Collapse>
  );
}

/**
 * OrderCard - Individual order display
 */
function OrderCard({ order }: { order: MockOrder }) {
  return (
    <Box
      bg="slate.750"
      borderRadius="md"
      p={3}
      border="1px"
      borderColor="slate.600"
    >
      <HStack justify="space-between" mb={2}>
        <HStack spacing={2}>
          <Text fontSize="sm" fontWeight="bold" color="white">
            {order.id}
          </Text>
          <Text fontSize="xs" color="slate.500">
            {order.date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </Text>
        </HStack>
        <Text fontSize="md" fontWeight="bold" color="green.400">
          {formatCurrency(order.total)}
        </Text>
      </HStack>
      <HStack spacing={2} flexWrap="wrap">
        {order.items.map((item, idx) => (
          <Badge
            key={idx}
            variant="outline"
            colorScheme="gray"
            fontSize="xs"
          >
            {item.quantity}x {item.name.split(' - ')[0]}
          </Badge>
        ))}
      </HStack>
    </Box>
  );
}

export default OrderHistoryCollapse;
