/**
 * Scanner Error State Component
 *
 * Displays error information and retry/cancel options when scanning fails.
 */

import {
  VStack,
  HStack,
  Box,
  Text,
  Button,
  Icon,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Badge,
} from '@chakra-ui/react';
import { ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import type { ScannerErrorStateProps } from '../types';

export function ScannerErrorState({
  errorMessage,
  scannedData,
  onRetry,
  onCancel,
}: ScannerErrorStateProps) {
  return (
    <VStack spacing={4} py={4}>
      <Alert
        status="error"
        variant="subtle"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        textAlign="center"
        borderRadius="md"
        py={4}
      >
        <AlertIcon as={ExclamationTriangleIcon} boxSize={10} mr={0} mb={2} />
        <AlertTitle mt={2}>Scan Failed</AlertTitle>
        <AlertDescription maxW="sm" mt={2}>
          {errorMessage}
        </AlertDescription>
      </Alert>

      {/* Show what was scanned if we have partial data */}
      {scannedData && <PartialDataDisplay scannedData={scannedData} />}

      <HStack spacing={3}>
        <Button
          colorScheme="green"
          leftIcon={<Icon as={ArrowPathIcon} boxSize={4} />}
          onClick={onRetry}
        >
          Try Again
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </HStack>
    </VStack>
  );
}

/**
 * Displays partial scanned data when scan fails but some data was captured
 */
interface PartialDataDisplayProps {
  scannedData: NonNullable<ScannerErrorStateProps['scannedData']>;
}

function PartialDataDisplay({ scannedData }: PartialDataDisplayProps) {
  return (
    <Box
      bg="slate.800"
      p={4}
      borderRadius="md"
      border="1px"
      borderColor="red.600"
      w="full"
      maxW="300px"
    >
      <VStack spacing={2} align="start">
        {scannedData.fullName && (
          <HStack justify="space-between" w="full">
            <Text color="slate.400" fontSize="sm">
              Name
            </Text>
            <Text color="white">{scannedData.fullName}</Text>
          </HStack>
        )}
        {scannedData.age !== null && (
          <HStack justify="space-between" w="full">
            <Text color="slate.400" fontSize="sm">
              Age
            </Text>
            <HStack>
              <Text color="white">{scannedData.age}</Text>
              <Badge colorScheme={scannedData.isOver21 ? 'green' : 'red'}>
                {scannedData.isOver21 ? '21+' : 'Under 21'}
              </Badge>
            </HStack>
          </HStack>
        )}
        {scannedData.isExpired && (
          <Badge colorScheme="red" w="full" textAlign="center">
            ID EXPIRED
          </Badge>
        )}
      </VStack>
    </Box>
  );
}
