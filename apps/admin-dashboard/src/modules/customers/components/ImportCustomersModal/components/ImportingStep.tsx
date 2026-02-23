/**
 * Importing Step Component
 *
 * Third step in the import workflow. Displays:
 * - Upload icon animation
 * - Progress bar with current/total count
 * - Animated stripe effect
 */

import { VStack, Box, Text, Progress, Icon } from '@chakra-ui/react';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import type { ImportProgress } from '../types';

interface ImportingStepProps {
  progress: ImportProgress;
}

/**
 * Renders the importing progress display
 */
export function ImportingStep({ progress }: ImportingStepProps) {
  const percentComplete = progress.total > 0
    ? (progress.current / progress.total) * 100
    : 0;

  return (
    <VStack spacing={6} py={8}>
      <Icon as={ArrowUpTrayIcon} boxSize={12} color="blue.400" />
      <Text color="white" fontSize="xl" fontWeight="medium">
        Importing Customers...
      </Text>
      <Box w="full" maxW="400px">
        <Progress
          value={percentComplete}
          size="lg"
          colorScheme="blue"
          borderRadius="full"
          bg="gray.600"
          hasStripe
          isAnimated
        />
      </Box>
      <Text color="white" fontSize="lg">
        {progress.current} of {progress.total}
      </Text>
    </VStack>
  );
}
