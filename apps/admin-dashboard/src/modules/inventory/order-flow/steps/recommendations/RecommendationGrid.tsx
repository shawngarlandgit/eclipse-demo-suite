/**
 * RecommendationGrid Component
 * Displays AI-powered product recommendations in a responsive grid
 */

import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Icon,
  Badge,
  SimpleGrid,
  Flex,
} from '@chakra-ui/react';
import {
  SparklesIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { formatCurrency } from '../../../../../utils/formatters';
import type { RecommendationGridProps, Recommendation, ProductWithStrainType } from './types';
import { getStrainTypeColorScheme, formatProductType } from './helpers';

export function RecommendationGrid({
  recommendations,
  products,
  addedProductIds,
  onAddToCart,
}: RecommendationGridProps) {
  if (recommendations.length === 0) {
    return null;
  }

  return (
    <Box>
      <HStack spacing={2} mb={3}>
        <Icon as={SparklesIcon} boxSize={5} color="green.400" />
        <Text fontWeight="bold" color="white">Recommended For You</Text>
        <Badge colorScheme="green" fontSize="xs">AI Powered</Badge>
      </HStack>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
        {recommendations.map((rec) => (
          <RecommendationCard
            key={rec.productId}
            recommendation={rec}
            products={products}
            isAdded={addedProductIds.has(rec.productId)}
            onAddToCart={onAddToCart}
          />
        ))}
      </SimpleGrid>

      <Text fontSize="xs" color="slate.500" mt={3} textAlign="center">
        Recommendations based on your purchase history and effect preferences
      </Text>
    </Box>
  );
}

/**
 * RecommendationCard - Individual recommendation display with match score
 */
interface RecommendationCardProps {
  recommendation: Recommendation;
  products: ProductWithStrainType[] | undefined;
  isAdded: boolean;
  onAddToCart: (productId: string) => void;
}

function RecommendationCard({
  recommendation: rec,
  products,
  isAdded,
  onAddToCart,
}: RecommendationCardProps) {
  // Find the actual product to get its type
  const product = products?.find(p => p.id === rec.productId);
  const productType = product?.product_type || 'flower';

  return (
    <Box
      bg={isAdded ? 'green.900' : 'slate.800'}
      borderRadius="lg"
      p={4}
      border="1px"
      borderColor={isAdded ? 'green.600' : 'slate.700'}
      _hover={{ borderColor: isAdded ? 'green.500' : 'green.700' }}
      transition="all 0.2s"
    >
      <Flex justify="space-between" align="start" gap={3}>
        <VStack align="start" spacing={2} flex={1}>
          {/* Product Name (Primary) */}
          <Box>
            <Text fontWeight="bold" color="white" fontSize="md" noOfLines={1}>
              {rec.productName}
            </Text>
            {rec.strainName && rec.strainName !== rec.productName && (
              <Text fontSize="xs" color="slate.400" noOfLines={1}>
                Strain: {rec.strainName}
              </Text>
            )}
          </Box>

          {/* Product Type & Strain Type Badges */}
          <HStack spacing={2}>
            <Badge
              colorScheme="blue"
              fontSize="xs"
              textTransform="capitalize"
            >
              {formatProductType(productType)}
            </Badge>
            <Badge
              colorScheme={getStrainTypeColorScheme(rec.strainType)}
              fontSize="xs"
              textTransform="capitalize"
            >
              {rec.strainType}
            </Badge>
          </HStack>

          {/* Effects */}
          <HStack spacing={1} flexWrap="wrap">
            {rec.effects.slice(0, 3).map(effect => (
              <Badge
                key={effect}
                variant="subtle"
                colorScheme="green"
                fontSize="xs"
                textTransform="capitalize"
              >
                {effect}
              </Badge>
            ))}
          </HStack>

          {/* Match Reason */}
          <Text fontSize="xs" color="green.300" fontStyle="italic">
            "{rec.matchReason}"
          </Text>

          {/* Price & Stock */}
          <HStack spacing={3}>
            <Text fontWeight="bold" color="green.400" fontSize="lg">
              {formatCurrency(rec.price)}
            </Text>
            <Text fontSize="xs" color="slate.500">
              {rec.quantityAvailable} in stock
            </Text>
          </HStack>
        </VStack>

        {/* Add Button */}
        <Button
          size="sm"
          colorScheme="green"
          variant={isAdded ? 'solid' : 'outline'}
          onClick={() => onAddToCart(rec.productId)}
          isDisabled={isAdded || rec.productId.startsWith('mock-')}
          leftIcon={isAdded ? <Icon as={CheckCircleIcon} boxSize={4} /> : undefined}
          minW="80px"
        >
          {isAdded ? 'Added' : rec.productId.startsWith('mock-') ? 'Demo' : 'Add'}
        </Button>
      </Flex>

      {/* Match Score Bar */}
      <MatchScoreBar score={rec.similarityScore} />
    </Box>
  );
}

/**
 * MatchScoreBar - Visual indicator of recommendation match quality
 */
function MatchScoreBar({ score }: { score: number }) {
  return (
    <Box mt={3}>
      <HStack justify="space-between" mb={1}>
        <Text fontSize="xs" color="slate.500">Match Score</Text>
        <Text fontSize="xs" color="green.400" fontWeight="bold">
          {Math.round(score * 100)}%
        </Text>
      </HStack>
      <Box bg="slate.700" borderRadius="full" h="4px" overflow="hidden">
        <Box
          bg="green.400"
          h="full"
          w={`${score * 100}%`}
          borderRadius="full"
        />
      </Box>
    </Box>
  );
}

export default RecommendationGrid;
