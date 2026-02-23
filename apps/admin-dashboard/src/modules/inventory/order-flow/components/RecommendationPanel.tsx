/**
 * RecommendationPanel Component
 * Displays a horizontal scroll of recommendations for customers
 * Used in both returning customer and out-of-stock contexts
 */

import { useState } from 'react';
import {
  Box,
  HStack,
  Text,
  Button,
  Icon,
  Alert,
  AlertIcon,
  IconButton,
} from '@chakra-ui/react';
import {
  SparklesIcon,
  XMarkIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import RecommendationCard, { RecommendationCardSkeleton } from './RecommendationCard';
import { useRecommendations, type RecommendationContext } from '../hooks/useRecommendations';
import type { PurchaseHistorySummary } from '../services/order.service';

interface RecommendationPanelProps {
  context: RecommendationContext;
  customerId?: string;
  purchaseHistory?: PurchaseHistorySummary | null;
  requestedStrain?: string;
  title?: string;
  onAddToCart: (productId: string) => void;
  onDismiss?: () => void;
  addedProductIds?: Set<string>;
}

function RecommendationPanel({
  context,
  customerId,
  purchaseHistory,
  requestedStrain,
  title,
  onAddToCart,
  onDismiss,
  addedProductIds = new Set(),
}: RecommendationPanelProps) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [addingProductId, setAddingProductId] = useState<string | null>(null);

  const { recommendations, isLoading, error, refetch } = useRecommendations({
    context,
    customerId,
    purchaseHistory,
    requestedStrain,
    enabled: true,
    limit: 6,
  });

  // Don't render if no recommendations and not loading
  if (!isLoading && recommendations.length === 0 && !error) {
    return null;
  }

  // Default titles based on context
  const defaultTitle =
    context === 'returning_customer'
      ? 'Based on your previous purchases'
      : `Similar to ${requestedStrain}`;

  const displayTitle = title || defaultTitle;

  // Handle add to cart with loading state
  const handleAddToCart = async (productId: string) => {
    setAddingProductId(productId);
    try {
      await onAddToCart(productId);
    } finally {
      setAddingProductId(null);
    }
  };

  // Scroll handlers
  const scrollContainer = (direction: 'left' | 'right') => {
    const container = document.getElementById('recommendation-scroll');
    if (container) {
      const scrollAmount = 300;
      const newPosition =
        direction === 'left'
          ? Math.max(0, scrollPosition - scrollAmount)
          : scrollPosition + scrollAmount;
      container.scrollTo({ left: newPosition, behavior: 'smooth' });
      setScrollPosition(newPosition);
    }
  };

  return (
    <Box
      bg="slate.850"
      borderRadius="lg"
      border="1px"
      borderColor={context === 'out_of_stock' ? 'orange.700' : 'green.700'}
      p={4}
      position="relative"
    >
      {/* Header */}
      <HStack justify="space-between" mb={4}>
        <HStack spacing={2}>
          <Icon
            as={SparklesIcon}
            boxSize={5}
            color={context === 'out_of_stock' ? 'orange.400' : 'green.400'}
          />
          <Text fontWeight="bold" color="white">
            {displayTitle}
          </Text>
        </HStack>

        <HStack spacing={2}>
          {error && (
            <IconButton
              aria-label="Retry"
              icon={<Icon as={ArrowPathIcon} boxSize={4} />}
              size="sm"
              variant="ghost"
              onClick={refetch}
            />
          )}
          {onDismiss && (
            <IconButton
              aria-label="Dismiss"
              icon={<Icon as={XMarkIcon} boxSize={4} />}
              size="sm"
              variant="ghost"
              onClick={onDismiss}
            />
          )}
        </HStack>
      </HStack>

      {/* Error State */}
      {error && (
        <Alert status="error" variant="subtle" borderRadius="md" mb={4}>
          <AlertIcon />
          <Text fontSize="sm">{error}</Text>
          <Button size="sm" ml="auto" onClick={refetch}>
            Retry
          </Button>
        </Alert>
      )}

      {/* Recommendations Scroll Container */}
      <Box position="relative">
        {/* Left Scroll Button */}
        {recommendations.length > 3 && (
          <IconButton
            aria-label="Scroll left"
            icon={<Icon as={ChevronLeftIcon} boxSize={5} />}
            position="absolute"
            left={-2}
            top="50%"
            transform="translateY(-50%)"
            zIndex={2}
            size="sm"
            borderRadius="full"
            bg="slate.700"
            _hover={{ bg: 'slate.600' }}
            onClick={() => scrollContainer('left')}
            display={{ base: 'none', md: 'flex' }}
          />
        )}

        {/* Scrollable Content */}
        <Box
          id="recommendation-scroll"
          overflowX="auto"
          overflowY="hidden"
          css={{
            '&::-webkit-scrollbar': {
              height: '6px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'var(--chakra-colors-slate-600)',
              borderRadius: '3px',
            },
          }}
          onScroll={(e) => setScrollPosition((e.target as HTMLElement).scrollLeft)}
        >
          <HStack spacing={4} py={2} px={1}>
            {isLoading ? (
              // Loading skeletons
              <>
                <RecommendationCardSkeleton />
                <RecommendationCardSkeleton />
                <RecommendationCardSkeleton />
              </>
            ) : (
              // Actual recommendations
              recommendations.map((recommendation) => (
                <RecommendationCard
                  key={recommendation.productId}
                  recommendation={recommendation}
                  onAddToCart={handleAddToCart}
                  isAdding={addingProductId === recommendation.productId}
                  isAdded={addedProductIds.has(recommendation.productId)}
                />
              ))
            )}
          </HStack>
        </Box>

        {/* Right Scroll Button */}
        {recommendations.length > 3 && (
          <IconButton
            aria-label="Scroll right"
            icon={<Icon as={ChevronRightIcon} boxSize={5} />}
            position="absolute"
            right={-2}
            top="50%"
            transform="translateY(-50%)"
            zIndex={2}
            size="sm"
            borderRadius="full"
            bg="slate.700"
            _hover={{ bg: 'slate.600' }}
            onClick={() => scrollContainer('right')}
            display={{ base: 'none', md: 'flex' }}
          />
        )}
      </Box>

      {/* Context-specific footer text */}
      <Text fontSize="xs" color="slate.500" mt={3} textAlign="center">
        {context === 'out_of_stock'
          ? 'These strains have similar effects and profiles'
          : 'Recommendations based on your purchase history'}
      </Text>
    </Box>
  );
}

export default RecommendationPanel;
