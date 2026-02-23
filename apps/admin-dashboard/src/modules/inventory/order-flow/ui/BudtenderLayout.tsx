/**
 * Budtender Layout
 * Compact UI layout for budtender order mode
 * - Smaller buttons and inputs
 * - Manual override controls visible
 * - Faster workflow optimizations
 */

import { Box, Flex, VStack, HStack, Text, Progress, IconButton } from '@chakra-ui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useOrder } from '../OrderContext';
import { STEP_LABELS, ORDER_STEPS } from '../types';
import type { ReactNode } from 'react';

interface BudtenderLayoutProps {
  children: ReactNode;
  onClose: () => void;
}

function BudtenderLayout({ children, onClose }: BudtenderLayoutProps) {
  const { state, currentStepIndex } = useOrder();
  const progressPercent = ((currentStepIndex + 1) / ORDER_STEPS.length) * 100;

  return (
    <Box
      bg="slate.900"
      borderRadius="xl"
      border="1px"
      borderColor="slate.700"
      overflow="hidden"
      maxW="900px"
      w="full"
      mx="auto"
    >
      {/* Header */}
      <Flex
        bg="slate.800"
        px={6}
        py={4}
        align="center"
        justify="space-between"
        borderBottom="1px"
        borderColor="slate.700"
      >
        <VStack align="start" spacing={0}>
          <Text fontSize="lg" fontWeight="bold" color="white">
            New Order
          </Text>
          <Text fontSize="xs" color="slate.400">
            Budtender Mode
          </Text>
        </VStack>

        {/* Step Indicators */}
        <HStack spacing={4}>
          {ORDER_STEPS.map((step, index) => (
            <HStack key={step} spacing={2}>
              <Box
                w={7}
                h={7}
                borderRadius="full"
                bg={index <= currentStepIndex ? 'green.500' : 'slate.600'}
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Text fontSize="xs" fontWeight="bold" color="white">
                  {index + 1}
                </Text>
              </Box>
              <Text
                fontSize="sm"
                fontWeight={index === currentStepIndex ? 'semibold' : 'normal'}
                color={index <= currentStepIndex ? 'white' : 'slate.500'}
                display={{ base: 'none', md: 'block' }}
              >
                {STEP_LABELS[step]}
              </Text>
            </HStack>
          ))}
        </HStack>

        <IconButton
          aria-label="Close order"
          icon={<XMarkIcon className="w-5 h-5" />}
          variant="ghost"
          size="sm"
          onClick={onClose}
        />
      </Flex>

      {/* Progress Bar */}
      <Progress
        value={progressPercent}
        size="xs"
        colorScheme="green"
        bg="slate.800"
      />

      {/* Content */}
      <Box p={4} minH="400px">
        {children}
      </Box>

      {/* Footer - Cart Summary (when applicable) */}
      {state.cart.length > 0 && state.currentStep !== 'complete' && (
        <Flex
          bg="slate.800"
          px={4}
          py={2}
          justify="space-between"
          align="center"
          borderTop="1px"
          borderColor="slate.700"
        >
          <Text fontSize="sm" color="slate.400">
            {state.totals.itemCount} item{state.totals.itemCount !== 1 ? 's' : ''} in cart
          </Text>
          <HStack spacing={4}>
            <Text fontSize="sm" color="slate.400">
              Subtotal: ${state.totals.subtotal.toFixed(2)}
            </Text>
            <Text fontSize="sm" fontWeight="bold" color="green.400">
              Total: ${state.totals.total.toFixed(2)}
            </Text>
          </HStack>
        </Flex>
      )}
    </Box>
  );
}

export default BudtenderLayout;
