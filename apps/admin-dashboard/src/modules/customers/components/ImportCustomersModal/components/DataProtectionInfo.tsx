/**
 * Data Protection Info Cards
 *
 * Displays information about how customer PII is protected
 * during the import process (hashing vs encryption).
 */

import { SimpleGrid, Box, HStack, Text, Icon } from '@chakra-ui/react';
import {
  ShieldCheckIcon,
  IdentificationIcon,
} from '@heroicons/react/24/outline';

/**
 * Renders three info cards explaining data protection methods
 */
export function DataProtectionInfo() {
  return (
    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} w="full">
      <Box bg="gray.700" p={4} borderRadius="md">
        <HStack mb={2}>
          <Icon as={ShieldCheckIcon} color="green.400" />
          <Text color="white" fontWeight="medium">
            Hashed (SHA-256)
          </Text>
        </HStack>
        <Text color="gray.400" fontSize="sm">
          Email, Phone, License#, Medical Card#
        </Text>
      </Box>
      <Box bg="gray.700" p={4} borderRadius="md">
        <HStack mb={2}>
          <Icon as={ShieldCheckIcon} color="blue.400" />
          <Text color="white" fontWeight="medium">
            Encrypted (AES-256)
          </Text>
        </HStack>
        <Text color="gray.400" fontSize="sm">
          Names, DOB, Address
        </Text>
      </Box>
      <Box bg="gray.700" p={4} borderRadius="md">
        <HStack mb={2}>
          <Icon as={IdentificationIcon} color="purple.400" />
          <Text color="white" fontWeight="medium">
            Auto-Detected
          </Text>
        </HStack>
        <Text color="gray.400" fontSize="sm">
          Medical cards from note field
        </Text>
      </Box>
    </SimpleGrid>
  );
}
