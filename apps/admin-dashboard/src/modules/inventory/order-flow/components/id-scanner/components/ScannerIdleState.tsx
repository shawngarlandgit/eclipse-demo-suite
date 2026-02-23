/**
 * Scanner Idle State Component
 *
 * Displays the initial state with a "Start Camera" button
 * before the user begins scanning.
 */

import { VStack, Text, Button, Icon } from '@chakra-ui/react';
import { CameraIcon } from '@heroicons/react/24/outline';
import type { ScannerIdleStateProps } from '../types';

export function ScannerIdleState({ onStartScanning }: ScannerIdleStateProps) {
  return (
    <VStack spacing={4} py={8}>
      <Icon as={CameraIcon} boxSize={16} color="green.400" />
      <Text fontSize="lg" fontWeight="bold" color="white">
        Scan Customer ID
      </Text>
      <Text color="slate.400" textAlign="center" fontSize="sm">
        Position the barcode on the back of the driver's license
      </Text>
      <Button
        colorScheme="green"
        size="lg"
        leftIcon={<Icon as={CameraIcon} boxSize={5} />}
        onClick={onStartScanning}
      >
        Start Camera
      </Button>
    </VStack>
  );
}
