/**
 * RecommendationCard Component
 * Displays a single strain recommendation with match info and add-to-cart action
 */

import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Icon,
  Image,
  Skeleton,
} from '@chakra-ui/react';
import {
  PlusIcon,
  SparklesIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import type { Recommendation } from '../hooks/useRecommendations';

interface RecommendationCardProps {
  recommendation: Recommendation;
  onAddToCart: (productId: string) => void;
  isAdding?: boolean;
  isAdded?: boolean;
}

// Strain type colors
const STRAIN_TYPE_COLORS: Record<string, string> = {
  indica: 'purple',
  sativa: 'orange',
  hybrid: 'green',
};

function RecommendationCard({
  recommendation,
  onAddToCart,
  isAdding = false,
  isAdded = false,
}: RecommendationCardProps) {
  const {
    productId,
    productName,
    strainName,
    strainType,
    effects,
    matchReason,
    similarityScore,
    quantityAvailable,
    price,
    imageUrl,
  } = recommendation;

  const matchPercentage = Math.round(similarityScore * 100);
  const typeColor = STRAIN_TYPE_COLORS[strainType.toLowerCase()] || 'gray';

  return (
    <Box
      bg="slate.800"
      borderRadius="lg"
      border="1px"
      borderColor="slate.700"
      overflow="hidden"
      minW="280px"
      maxW="300px"
      transition="all 0.2s"
      _hover={{
        borderColor: 'green.500',
        transform: 'translateY(-2px)',
        boxShadow: 'lg',
      }}
    >
      {/* Image or Placeholder */}
      <Box h="120px" bg="slate.900" position="relative">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={strainName}
            objectFit="cover"
            w="full"
            h="full"
          />
        ) : (
          <Box
            w="full"
            h="full"
            display="flex"
            alignItems="center"
            justifyContent="center"
            bg={`${typeColor}.900`}
            opacity={0.5}
          >
            <Icon as={SparklesIcon} boxSize={12} color={`${typeColor}.400`} />
          </Box>
        )}

        {/* Match Score Badge */}
        <Badge
          position="absolute"
          top={2}
          right={2}
          colorScheme={matchPercentage >= 80 ? 'green' : matchPercentage >= 60 ? 'yellow' : 'gray'}
          fontSize="sm"
          px={2}
          py={1}
        >
          {matchPercentage}% match
        </Badge>

        {/* Strain Type Badge */}
        <Badge
          position="absolute"
          top={2}
          left={2}
          colorScheme={typeColor}
          textTransform="capitalize"
        >
          {strainType}
        </Badge>
      </Box>

      {/* Content */}
      <VStack p={4} spacing={3} align="stretch">
        {/* Name - Product name is primary */}
        <VStack spacing={0} align="start">
          <Text
            fontWeight="bold"
            fontSize="md"
            color="white"
            noOfLines={1}
          >
            {productName}
          </Text>
          {strainName && strainName !== productName && (
            <Text fontSize="xs" color="slate.400" noOfLines={1}>
              Strain: {strainName}
            </Text>
          )}
        </VStack>

        {/* Match Reason */}
        <Text fontSize="sm" color="slate.300" noOfLines={2}>
          {matchReason}
        </Text>

        {/* Effects */}
        <HStack spacing={1} flexWrap="wrap">
          {effects.slice(0, 3).map((effect) => (
            <Badge
              key={effect}
              size="sm"
              variant="subtle"
              colorScheme="slate"
              fontSize="xs"
              textTransform="capitalize"
            >
              {effect}
            </Badge>
          ))}
          {effects.length > 3 && (
            <Badge size="sm" variant="subtle" colorScheme="slate" fontSize="xs">
              +{effects.length - 3}
            </Badge>
          )}
        </HStack>

        {/* Price & Stock */}
        <HStack justify="space-between">
          <Text fontSize="lg" fontWeight="bold" color="green.400">
            ${price.toFixed(2)}
          </Text>
          <Text fontSize="xs" color="slate.500">
            {quantityAvailable} in stock
          </Text>
        </HStack>

        {/* Add to Cart Button */}
        <Button
          colorScheme={isAdded ? 'green' : 'cannabis'}
          size="sm"
          leftIcon={
            <Icon as={isAdded ? CheckCircleIcon : PlusIcon} boxSize={4} />
          }
          onClick={() => onAddToCart(productId)}
          isLoading={isAdding}
          isDisabled={isAdded}
          w="full"
        >
          {isAdded ? 'Added' : 'Add to Cart'}
        </Button>
      </VStack>
    </Box>
  );
}

// Skeleton version for loading state
export function RecommendationCardSkeleton() {
  return (
    <Box
      bg="slate.800"
      borderRadius="lg"
      border="1px"
      borderColor="slate.700"
      overflow="hidden"
      minW="280px"
      maxW="300px"
    >
      <Skeleton h="120px" />
      <VStack p={4} spacing={3} align="stretch">
        <Skeleton h="20px" w="70%" />
        <Skeleton h="16px" w="100%" />
        <HStack spacing={1}>
          <Skeleton h="20px" w="60px" borderRadius="full" />
          <Skeleton h="20px" w="60px" borderRadius="full" />
          <Skeleton h="20px" w="60px" borderRadius="full" />
        </HStack>
        <HStack justify="space-between">
          <Skeleton h="24px" w="60px" />
          <Skeleton h="16px" w="50px" />
        </HStack>
        <Skeleton h="32px" w="full" borderRadius="md" />
      </VStack>
    </Box>
  );
}

export default RecommendationCard;
