/**
 * Kiosk Layout
 * Large-button UI layout for customer-facing kiosk mode
 * - Larger touch targets
 * - No manual override controls
 * - Guided copy for self-service
 * - Auto-reset after completion
 */

import { Box, Flex, VStack, HStack, Text, Progress, Heading } from '@chakra-ui/react';
import { useOrder } from '../OrderContext';
import { STEP_LABELS, ORDER_STEPS } from '../types';
import type { ReactNode } from 'react';

interface KioskLayoutProps {
  children: ReactNode;
  onClose?: () => void;
}

function KioskLayout({ children }: KioskLayoutProps) {
  const { state, currentStepIndex } = useOrder();
  const progressPercent = ((currentStepIndex + 1) / ORDER_STEPS.length) * 100;

  return (
    <Box
      bg="slate.900"
      minH="100vh"
      display="flex"
      flexDirection="column"
    >
      {/* Header */}
      <Box
        bg="slate.800"
        px={8}
        py={6}
        borderBottom="1px"
        borderColor="slate.700"
      >
        <VStack spacing={4}>
          <Heading size="xl" color="white">
            The Neon Pipe
          </Heading>
          <Text fontSize="lg" color="slate.300">
            Self-Service Ordering
          </Text>

          {/* Step Progress */}
          <HStack spacing={6} mt={4}>
            {ORDER_STEPS.map((step, index) => (
              <VStack key={step} spacing={2}>
                <Box
                  w={12}
                  h={12}
                  borderRadius="full"
                  bg={index <= currentStepIndex ? 'green.500' : 'slate.600'}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  transition="all 0.3s"
                >
                  <Text fontSize="lg" fontWeight="bold" color="white">
                    {index + 1}
                  </Text>
                </Box>
                <Text
                  fontSize="sm"
                  fontWeight={index === currentStepIndex ? 'bold' : 'normal'}
                  color={index <= currentStepIndex ? 'white' : 'slate.500'}
                >
                  {STEP_LABELS[step]}
                </Text>
              </VStack>
            ))}
          </HStack>
        </VStack>
      </Box>

      {/* Progress Bar */}
      <Progress
        value={progressPercent}
        size="sm"
        colorScheme="green"
        bg="slate.800"
      />

      {/* Content */}
      <Box flex="1" p={8} maxW="1200px" mx="auto" w="full">
        {children}
      </Box>

      {/* Footer - Cart Summary */}
      {state.cart.length > 0 && state.currentStep !== 'complete' && (
        <Flex
          bg="slate.800"
          px={8}
          py={4}
          justify="center"
          align="center"
          borderTop="1px"
          borderColor="slate.700"
        >
          <HStack spacing={8}>
            <Text fontSize="xl" color="slate.300">
              {state.totals.itemCount} item{state.totals.itemCount !== 1 ? 's' : ''}
            </Text>
            <Text fontSize="2xl" fontWeight="bold" color="green.400">
              Total: ${state.totals.total.toFixed(2)}
            </Text>
          </HStack>
        </Flex>
      )}
    </Box>
  );
}

export default KioskLayout;
