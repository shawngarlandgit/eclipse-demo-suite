/**
 * Step: Complete
 * Order completion with success state and reset
 * - Kiosk mode: Auto-reset after timeout
 * - Budtender mode: Manual close
 */

import { useEffect } from 'react';
import {
  VStack,
  Text,
  Button,
  Icon,
  Box,
  HStack,
  Divider,
} from '@chakra-ui/react';
import { CheckCircleIcon, PrinterIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useOrder } from '../OrderContext';
import { formatCurrency } from '../../../../utils/formatters';

// Auto-reset timeout for kiosk mode (seconds)
const KIOSK_AUTO_RESET_DELAY = 15;

interface StepCompleteProps {
  onClose?: () => void;
}

function StepComplete({ onClose }: StepCompleteProps) {
  const { state, resetOrder } = useOrder();
  const isKiosk = state.mode === 'kiosk';

  // Auto-reset for kiosk mode
  useEffect(() => {
    if (isKiosk && state.status === 'complete') {
      const timer = setTimeout(() => {
        resetOrder();
      }, KIOSK_AUTO_RESET_DELAY * 1000);

      return () => clearTimeout(timer);
    }
  }, [isKiosk, state.status, resetOrder]);

  const handleNewOrder = () => {
    resetOrder();
  };

  const handleClose = () => {
    resetOrder();
    onClose?.();
  };

  const handlePrintReceipt = () => {
    // TODO: Integrate with receipt printer
    window.print();
  };

  return (
    <VStack spacing={8} py={8} align="center">
      {/* Success Icon */}
      <Box
        w={24}
        h={24}
        borderRadius="full"
        bg="green.500"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Icon as={CheckCircleIcon} boxSize={16} color="white" />
      </Box>

      {/* Success Message */}
      <VStack spacing={2}>
        <Text fontSize="2xl" fontWeight="bold" color="white">
          Order Complete!
        </Text>
        <Text color="slate.400" textAlign="center">
          {isKiosk
            ? 'Thank you for your purchase. Please proceed to the counter.'
            : 'Order has been processed successfully.'}
        </Text>
      </VStack>

      {/* Receipt Info */}
      <Box
        bg="slate.800"
        p={6}
        borderRadius="lg"
        border="1px"
        borderColor="slate.700"
        minW="300px"
      >
        <VStack spacing={3} align="stretch">
          <HStack justify="space-between">
            <Text color="slate.400">Receipt #</Text>
            <Text color="white" fontFamily="mono" fontWeight="bold">
              {state.receiptId}
            </Text>
          </HStack>

          <Divider borderColor="slate.600" />

          <HStack justify="space-between">
            <Text color="slate.400">Items</Text>
            <Text color="white">{state.totals.itemCount}</Text>
          </HStack>

          <HStack justify="space-between">
            <Text color="slate.400">Total</Text>
            <Text color="green.400" fontSize="xl" fontWeight="bold">
              {formatCurrency(state.totals.total)}
            </Text>
          </HStack>

          {state.completedAt && (
            <>
              <Divider borderColor="slate.600" />
              <Text fontSize="xs" color="slate.500" textAlign="center">
                {new Date(state.completedAt).toLocaleString()}
              </Text>
            </>
          )}
        </VStack>
      </Box>

      {/* Actions */}
      <VStack spacing={3} w="full" maxW="300px">
        <Button
          colorScheme="green"
          size="lg"
          w="full"
          leftIcon={<Icon as={PrinterIcon} boxSize={5} />}
          onClick={handlePrintReceipt}
        >
          Print Receipt
        </Button>

        {isKiosk ? (
          <VStack spacing={2}>
            <Button
              variant="outline"
              colorScheme="green"
              size="lg"
              w="full"
              leftIcon={<Icon as={ArrowPathIcon} boxSize={5} />}
              onClick={handleNewOrder}
            >
              Start New Order
            </Button>
            <Text fontSize="sm" color="slate.500">
              Auto-reset in {KIOSK_AUTO_RESET_DELAY} seconds
            </Text>
          </VStack>
        ) : (
          <HStack spacing={3} w="full">
            <Button
              variant="outline"
              flex={1}
              onClick={handleNewOrder}
              leftIcon={<Icon as={ArrowPathIcon} boxSize={4} />}
            >
              New Order
            </Button>
            <Button variant="ghost" flex={1} onClick={handleClose}>
              Close
            </Button>
          </HStack>
        )}
      </VStack>
    </VStack>
  );
}

export default StepComplete;
