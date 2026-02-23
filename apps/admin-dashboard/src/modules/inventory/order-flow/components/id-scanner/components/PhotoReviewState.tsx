/**
 * Photo Review State Component
 *
 * Displays a captured photo for manual verification by the budtender.
 * Used as a fallback when barcode scanning fails.
 */

import { VStack, HStack, Box, Text, Button, Icon } from '@chakra-ui/react';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import type { PhotoReviewStateProps } from '../types';

export function PhotoReviewState({
  capturedPhoto,
  onConfirm,
  onRetake,
}: PhotoReviewStateProps) {
  return (
    <VStack spacing={4} py={4}>
      <Text fontSize="lg" fontWeight="bold" color="white">
        Verify ID Photo
      </Text>

      <Box
        borderRadius="lg"
        overflow="hidden"
        border="2px"
        borderColor="blue.500"
        maxW="350px"
      >
        <img
          src={capturedPhoto}
          alt="Captured ID"
          style={{ width: '100%', height: 'auto' }}
        />
      </Box>

      <Text fontSize="sm" color="slate.400" textAlign="center">
        Visually confirm customer is 21+ and ID is valid
      </Text>

      <HStack spacing={3}>
        <Button
          colorScheme="green"
          size="lg"
          leftIcon={<Icon as={CheckCircleIcon} boxSize={5} />}
          onClick={onConfirm}
        >
          Confirm 21+
        </Button>
        <Button variant="outline" onClick={onRetake}>
          Retake
        </Button>
      </HStack>
    </VStack>
  );
}
