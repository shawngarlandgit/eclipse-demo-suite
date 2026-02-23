/**
 * Scanning State Component
 *
 * Displays the controls and status while actively scanning for a barcode.
 */

import { VStack, HStack, Text, Button, Icon, Badge, Spinner } from '@chakra-ui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { ScanningStateProps } from '../types';

export function ScanningState({ status, debugInfo, onCancel }: ScanningStateProps) {
  return (
    <VStack spacing={4} mt={4}>
      {/* Show spinner during init */}
      {status === 'requesting' && (
        <HStack spacing={3}>
          <Spinner size="md" color="green.400" thickness="3px" />
          <Text color="slate.300">Starting camera...</Text>
        </HStack>
      )}

      {/* Debug info */}
      {debugInfo && (
        <Text fontSize="xs" color="yellow.400" textAlign="center">
          {debugInfo}
        </Text>
      )}

      {/* Show controls when scanning */}
      {status === 'scanning' && (
        <>
          <HStack spacing={2}>
            <Badge colorScheme="green" variant="subtle">
              <HStack spacing={1}>
                <Spinner size="xs" />
                <Text>Scanning...</Text>
              </HStack>
            </Badge>
          </HStack>

          <Text fontSize="sm" color="slate.400" textAlign="center">
            Hold the ID barcode (on the back) in front of the camera
          </Text>

          <HStack spacing={3}>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Icon as={XMarkIcon} boxSize={4} />}
              onClick={onCancel}
            >
              Cancel
            </Button>
          </HStack>
        </>
      )}
    </VStack>
  );
}
