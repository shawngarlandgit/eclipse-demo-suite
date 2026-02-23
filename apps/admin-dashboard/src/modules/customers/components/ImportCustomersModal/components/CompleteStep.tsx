/**
 * Complete Step Component
 *
 * Final step in the import workflow. Displays:
 * - Success/warning icon based on results
 * - Inserted/failed count statistics
 * - Error message if any batches failed
 * - Compliance confirmation badges
 */

import {
  VStack,
  HStack,
  SimpleGrid,
  Text,
  Alert,
  AlertIcon,
  Stat,
  StatLabel,
  StatNumber,
  Divider,
  Icon,
} from '@chakra-ui/react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  IdentificationIcon,
} from '@heroicons/react/24/outline';
import type { DbInsertResult } from '../types';

interface CompleteStepProps {
  result: DbInsertResult;
}

/**
 * Renders the completion summary with stats and compliance info
 */
export function CompleteStep({ result }: CompleteStepProps) {
  const hasFailures = result.failed > 0;

  return (
    <VStack spacing={6} py={8}>
      {/* Status Icon */}
      <Icon
        as={hasFailures ? ExclamationTriangleIcon : CheckCircleIcon}
        boxSize={16}
        color={hasFailures ? 'yellow.400' : 'green.400'}
      />

      {/* Title */}
      <Text color="white" fontSize="2xl" fontWeight="bold">
        Import Complete!
      </Text>

      {/* Stats */}
      <SimpleGrid columns={2} spacing={4} w="full" maxW="300px">
        <Stat textAlign="center">
          <StatLabel color="gray.400">Imported</StatLabel>
          <StatNumber color="green.400">{result.inserted}</StatNumber>
        </Stat>
        <Stat textAlign="center">
          <StatLabel color="gray.400">Failed</StatLabel>
          <StatNumber color={hasFailures ? 'red.400' : 'gray.400'}>
            {result.failed}
          </StatNumber>
        </Stat>
      </SimpleGrid>

      {/* Error Message */}
      {result.errors.length > 0 && (
        <Alert status="warning" borderRadius="md" maxW="400px">
          <AlertIcon />
          <Text fontSize="sm">{result.errors[0]}</Text>
        </Alert>
      )}

      <Divider borderColor="gray.600" />

      {/* Compliance Confirmation */}
      <ComplianceConfirmation />
    </VStack>
  );
}

/**
 * Displays compliance confirmation badges
 */
function ComplianceConfirmation() {
  return (
    <VStack spacing={2}>
      <HStack>
        <Icon as={ShieldCheckIcon} color="green.400" />
        <Text color="gray.300" fontSize="sm">
          All PII has been encrypted/hashed
        </Text>
      </HStack>
      <HStack>
        <Icon as={IdentificationIcon} color="blue.400" />
        <Text color="gray.300" fontSize="sm">
          Import logged for MMCP audit compliance
        </Text>
      </HStack>
    </VStack>
  );
}
