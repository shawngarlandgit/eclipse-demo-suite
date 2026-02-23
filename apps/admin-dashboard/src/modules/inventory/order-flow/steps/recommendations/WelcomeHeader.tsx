/**
 * WelcomeHeader Component
 * Displays the welcome message and customer identification card
 */

import {
  Box,
  VStack,
  HStack,
  Text,
  Icon,
  Badge,
} from '@chakra-ui/react';
import {
  SparklesIcon,
  IdentificationIcon,
} from '@heroicons/react/24/outline';
import type { WelcomeHeaderProps } from './types';

export function WelcomeHeader({ customerName, customerInfo }: WelcomeHeaderProps) {
  return (
    <Box
      bg="linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #c084fc 100%)"
      borderRadius="xl"
      p={5}
      position="relative"
      overflow="hidden"
    >
      {/* Decorative sparkle pattern */}
      <Box
        position="absolute"
        top={0}
        right={0}
        bottom={0}
        left={0}
        opacity={0.1}
        bgImage="radial-gradient(circle, white 1px, transparent 1px)"
        bgSize="20px 20px"
      />

      <VStack spacing={3} position="relative">
        {/* Welcome Message */}
        <HStack spacing={2} justify="center">
          <Icon as={SparklesIcon} boxSize={7} color="white" />
          <Text fontSize="2xl" fontWeight="bold" color="white">
            Welcome Back{customerName ? `, ${customerName.split(' ')[0]}` : ''}!
          </Text>
        </HStack>

        {/* Customer ID Card */}
        {(customerInfo.customerName || customerInfo.idNumber) && (
          <CustomerIdCard customerInfo={customerInfo} />
        )}

        <Text color="whiteAlpha.800" fontSize="sm">
          Based on your purchase history, here are some recommendations
        </Text>
      </VStack>
    </Box>
  );
}

/**
 * CustomerIdCard - Displays verified customer information
 */
function CustomerIdCard({ customerInfo }: { customerInfo: WelcomeHeaderProps['customerInfo'] }) {
  return (
    <Box
      bg="whiteAlpha.200"
      backdropFilter="blur(10px)"
      borderRadius="lg"
      p={3}
      border="1px"
      borderColor="whiteAlpha.300"
      w="full"
      maxW="400px"
    >
      <HStack spacing={3}>
        <Icon as={IdentificationIcon} boxSize={8} color="white" />
        <VStack align="start" spacing={0} flex={1}>
          {customerInfo.customerName && (
            <Text fontWeight="bold" color="white" fontSize="md">
              {customerInfo.customerName}
            </Text>
          )}
          <HStack spacing={4} flexWrap="wrap">
            {customerInfo.idNumber && (
              <Text fontSize="sm" color="whiteAlpha.800">
                ID: {customerInfo.idNumber}
              </Text>
            )}
            {customerInfo.dateOfBirth && (
              <Text fontSize="sm" color="whiteAlpha.800">
                DOB: {new Date(customerInfo.dateOfBirth).toLocaleDateString()}
              </Text>
            )}
          </HStack>
        </VStack>
        <Badge
          colorScheme="green"
          variant="solid"
          fontSize="xs"
          px={2}
          py={1}
        >
          {customerInfo.method === 'scan' ? 'Verified' : 'Manual'}
        </Badge>
      </HStack>
    </Box>
  );
}

export default WelcomeHeader;
