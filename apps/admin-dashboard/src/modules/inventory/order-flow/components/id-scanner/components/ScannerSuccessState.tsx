/**
 * Scanner Success State Component
 *
 * Displays the verified ID information after a successful scan.
 */

import { VStack, HStack, Box, Text, Icon, Badge } from '@chakra-ui/react';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import type { ScannerSuccessStateProps } from '../types';

export function ScannerSuccessState({ scannedData }: ScannerSuccessStateProps) {
  return (
    <VStack spacing={4} py={4}>
      {/* Success icon */}
      <Box
        w={16}
        h={16}
        borderRadius="full"
        bg="green.500"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Icon as={CheckCircleIcon} boxSize={10} color="white" />
      </Box>

      <Text fontSize="lg" fontWeight="bold" color="white">
        ID Verified
      </Text>

      {/* Scanned data display */}
      <Box
        bg="slate.800"
        p={4}
        borderRadius="md"
        border="1px"
        borderColor="green.600"
        w="full"
        maxW="300px"
      >
        <VStack spacing={2} align="start">
          {scannedData.fullName && (
            <HStack justify="space-between" w="full">
              <Text color="slate.400" fontSize="sm">
                Name
              </Text>
              <Text color="white" fontWeight="medium">
                {scannedData.fullName}
              </Text>
            </HStack>
          )}
          {scannedData.age !== null && (
            <HStack justify="space-between" w="full">
              <Text color="slate.400" fontSize="sm">
                Age
              </Text>
              <HStack>
                <Text color="white" fontWeight="medium">
                  {scannedData.age}
                </Text>
                <Badge colorScheme="green">21+</Badge>
              </HStack>
            </HStack>
          )}
          {scannedData.licenseNumber && (
            <HStack justify="space-between" w="full">
              <Text color="slate.400" fontSize="sm">
                License #
              </Text>
              <Text color="white" fontFamily="mono" fontSize="sm">
                {scannedData.licenseNumber}
              </Text>
            </HStack>
          )}
        </VStack>
      </Box>
    </VStack>
  );
}
