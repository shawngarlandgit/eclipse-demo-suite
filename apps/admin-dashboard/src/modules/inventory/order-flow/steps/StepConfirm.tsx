/**
 * Step: Confirm Order
 * Read-only order summary with final confirmation
 */

import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Divider,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Icon,
  Alert,
  AlertIcon,
  Spinner,
} from '@chakra-ui/react';
import {
  ShoppingCartIcon,
  UserIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { useOrder } from '../OrderContext';
import { formatCurrency } from '../../../../utils/formatters';

function StepConfirm() {
  const { state, prevStep, submitOrder } = useOrder();
  const isKiosk = state.mode === 'kiosk';
  const isProcessing = state.status === 'processing';

  const handleConfirm = async () => {
    await submitOrder();
  };

  return (
    <VStack spacing={6} align="stretch">
      {/* Header */}
      <VStack spacing={2} textAlign="center">
        <Icon as={ShoppingCartIcon} boxSize={10} color="green.400" />
        <Text fontSize="xl" fontWeight="bold" color="white">
          Review Your Order
        </Text>
        <Text color="slate.400">
          {isKiosk
            ? 'Please verify all items before completing your purchase'
            : 'Confirm order details before processing'}
        </Text>
      </VStack>

      {/* Customer Info */}
      {state.customer.verified && state.customer.customerName && (
        <Box bg="slate.800" p={4} borderRadius="md" border="1px" borderColor="slate.700">
          <HStack spacing={3}>
            <Icon as={UserIcon} boxSize={5} color="slate.400" />
            <VStack align="start" spacing={0}>
              <Text fontSize="sm" color="slate.400">
                Customer
              </Text>
              <Text fontWeight="medium" color="white">
                {state.customer.customerName}
              </Text>
            </VStack>
          </HStack>
        </Box>
      )}

      {/* Order Items Table */}
      <Box
        bg="slate.800"
        borderRadius="md"
        border="1px"
        borderColor="slate.700"
        overflow="hidden"
      >
        <Table variant="simple" size="sm">
          <Thead bg="slate.750">
            <Tr>
              <Th color="slate.400">Item</Th>
              <Th color="slate.400" isNumeric>
                Qty
              </Th>
              <Th color="slate.400" isNumeric>
                Price
              </Th>
              <Th color="slate.400" isNumeric>
                Total
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {state.cart.map((item) => (
              <Tr key={item.product.id}>
                <Td>
                  <VStack align="start" spacing={0}>
                    <Text color="white" fontSize="sm">
                      {item.product.name}
                    </Text>
                    {item.product.sku && (
                      <Text color="slate.500" fontSize="xs">
                        SKU: {item.product.sku}
                      </Text>
                    )}
                  </VStack>
                </Td>
                <Td isNumeric>
                  <Text color="white">{item.quantity}</Text>
                </Td>
                <Td isNumeric>
                  <Text color="slate.300">{formatCurrency(item.unitPrice)}</Text>
                </Td>
                <Td isNumeric>
                  <Text color="white" fontWeight="medium">
                    {formatCurrency(item.lineTotal)}
                  </Text>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      {/* Order Totals */}
      <Box bg="slate.800" p={4} borderRadius="md" border="1px" borderColor="slate.700">
        <VStack spacing={2} align="stretch">
          <HStack justify="space-between">
            <Text color="slate.400">Subtotal</Text>
            <Text color="white">{formatCurrency(state.totals.subtotal)}</Text>
          </HStack>
          <HStack justify="space-between">
            <Text color="slate.400">
              Tax ({(state.totals.taxRate * 100).toFixed(0)}%)
            </Text>
            <Text color="white">{formatCurrency(state.totals.taxAmount)}</Text>
          </HStack>
          <Divider borderColor="slate.600" />
          <HStack justify="space-between">
            <Text fontSize="lg" fontWeight="bold" color="white">
              Total
            </Text>
            <Text fontSize="xl" fontWeight="bold" color="green.400">
              {formatCurrency(state.totals.total)}
            </Text>
          </HStack>
          <Text fontSize="xs" color="slate.500" textAlign="right">
            {state.totals.itemCount} item{state.totals.itemCount !== 1 ? 's' : ''}
          </Text>
        </VStack>
      </Box>

      {/* Error Alert */}
      {state.error && (
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          {state.error}
        </Alert>
      )}

      {/* Navigation */}
      <HStack justify="space-between" pt={2}>
        <Button variant="ghost" onClick={prevStep} isDisabled={isProcessing}>
          Back to Products
        </Button>
        <Button
          colorScheme="green"
          size={isKiosk ? 'lg' : 'md'}
          leftIcon={
            isProcessing ? (
              <Spinner size="sm" />
            ) : (
              <Icon as={CheckCircleIcon} boxSize={5} />
            )
          }
          onClick={handleConfirm}
          isLoading={isProcessing}
          loadingText="Processing..."
          px={isKiosk ? 12 : 8}
        >
          {isKiosk ? 'Complete Purchase' : 'Confirm & Process'}
        </Button>
      </HStack>
    </VStack>
  );
}

export default StepConfirm;
