/**
 * PurchaseHistoryStats Component
 * Displays customer purchase history summary in a horizontal stats card
 */

import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Icon,
  Badge,
} from '@chakra-ui/react';
import { ReceiptRefundIcon } from '@heroicons/react/24/outline';
import type { PurchaseHistoryStatsProps } from './types';
import { getPreferredTypeColorScheme } from './helpers';

export function PurchaseHistoryStats({
  purchaseHistory,
  isHistoryOpen,
  onToggleHistory,
}: PurchaseHistoryStatsProps) {
  return (
    <Box
      bg="slate.800/50"
      borderRadius="xl"
      p={4}
      border="1px"
      borderColor="slate.700/50"
    >
      <HStack spacing={6} justify="space-between" align="center" flexWrap="wrap">
        {/* Visits */}
        <VStack spacing={0} align="center" minW="60px">
          <Text fontSize="xl" fontWeight="bold" color="white" lineHeight="1">
            {purchaseHistory.totalTransactions || 0}
          </Text>
          <Text fontSize="xs" color="slate.500" textTransform="uppercase" letterSpacing="wide">
            Visits
          </Text>
        </VStack>

        <StatDivider />

        {/* Preferred Type */}
        {purchaseHistory.preferredStrainType && (
          <>
            <VStack spacing={1} align="center" minW="70px">
              <Badge
                colorScheme={getPreferredTypeColorScheme(purchaseHistory.preferredStrainType)}
                fontSize="xs"
                px={2}
                py={0.5}
                textTransform="capitalize"
                borderRadius="full"
              >
                {purchaseHistory.preferredStrainType}
              </Badge>
              <Text fontSize="xs" color="slate.500" textTransform="uppercase" letterSpacing="wide">
                Type
              </Text>
            </VStack>
            <StatDivider />
          </>
        )}

        {/* Top Effects */}
        {purchaseHistory.topEffects && purchaseHistory.topEffects.length > 0 && (
          <>
            <VStack spacing={1} align="center" flex={1} minW="100px">
              <HStack spacing={1}>
                {purchaseHistory.topEffects.slice(0, 3).map(e => (
                  <Badge
                    key={e.effect}
                    variant="subtle"
                    colorScheme="green"
                    fontSize="2xs"
                    textTransform="capitalize"
                    borderRadius="full"
                  >
                    {e.effect}
                  </Badge>
                ))}
              </HStack>
              <Text fontSize="xs" color="slate.500" textTransform="uppercase" letterSpacing="wide">
                Effects
              </Text>
            </VStack>
            <StatDivider />
          </>
        )}

        {/* Favorites */}
        {purchaseHistory.favoriteStrains && purchaseHistory.favoriteStrains.length > 0 && (
          <>
            <VStack spacing={1} align="center" minW="90px">
              <Text fontSize="sm" fontWeight="medium" color="white" noOfLines={1}>
                {purchaseHistory.favoriteStrains[0]}
              </Text>
              <Text fontSize="xs" color="slate.500" textTransform="uppercase" letterSpacing="wide">
                Favorite
              </Text>
            </VStack>
            <StatDivider />
          </>
        )}

        {/* View Orders Button */}
        <Button
          onClick={onToggleHistory}
          variant={isHistoryOpen ? 'solid' : 'ghost'}
          colorScheme={isHistoryOpen ? 'purple' : 'gray'}
          size="sm"
          leftIcon={<Icon as={ReceiptRefundIcon} boxSize={4} />}
        >
          {isHistoryOpen ? 'Hide' : 'Orders'}
        </Button>
      </HStack>
    </Box>
  );
}

/**
 * Vertical divider between stats
 */
function StatDivider() {
  return (
    <Box
      h="30px"
      w="1px"
      bg="slate.700"
      display={{ base: 'none', sm: 'block' }}
    />
  );
}

export default PurchaseHistoryStats;
