/**
 * Step: Recommendations
 * Shows returning customer their purchase history and personalized recommendations
 * - Previous purchases summary
 * - What's in stock matching their preferences
 * - AI-powered recommendations
 * - Option to skip to regular product selection
 */

import { useMemo, useCallback } from 'react';
import {
  VStack,
  Divider,
  useDisclosure,
} from '@chakra-ui/react';
import { useOrder } from '../OrderContext';
import { useProducts } from '../../../../hooks/useInventory';

// Import extracted modules
import {
  // Mock data
  MOCK_ORDER_HISTORY,
  // Hook
  useRecommendationData,
  // Components
  WelcomeHeader,
  PurchaseHistoryStats,
  OrderHistoryCollapse,
  FavoritesInStock,
  RecommendationGrid,
  CartPreview,
  ActionButtons,
  // Types
  type ProductWithStrainType,
} from './recommendations';

/**
 * StepRecommendations - Main recommendations step component
 * Orchestrates the display of customer history and product recommendations
 */
function StepRecommendations() {
  const { state, addToCart, nextStep } = useOrder();
  const { data: products } = useProducts({ status: 'active' });
  const isKiosk = state.mode === 'kiosk';

  // Get customer lookup data from context
  const { customerLookup } = state;
  const realPurchaseHistory = customerLookup.purchaseHistory;

  // Order history disclosure
  const { isOpen: isHistoryOpen, onToggle: toggleHistory } = useDisclosure();

  // Use the recommendation data hook to process products and history
  const { recommendations, matchingInStock, purchaseHistory } = useRecommendationData({
    products: products as ProductWithStrainType[] | undefined,
    purchaseHistory: realPurchaseHistory,
  });

  // Track which products have been added to cart
  const addedProductIds = useMemo(
    () => new Set(state.cart.map(item => item.product.id)),
    [state.cart]
  );

  // Handle adding product to cart
  const handleAddToCart = useCallback((productId: string) => {
    const product = products?.find(p => p.id === productId);
    if (product) {
      addToCart(product);
    }
  }, [products, addToCart]);

  // Skip recommendations and go to product selection
  const handleSkip = useCallback(() => {
    nextStep();
  }, [nextStep]);

  // Continue with current cart
  const handleContinue = useCallback(() => {
    nextStep();
  }, [nextStep]);

  // Get customer details from verification
  const customerInfo = state.customer;

  return (
    <VStack spacing={6} align="stretch" py={4}>
      {/* Header with Customer Details */}
      <WelcomeHeader
        customerName={customerInfo.customerName}
        customerInfo={customerInfo}
      />

      {/* Purchase History Summary - Clean Stats Card */}
      {purchaseHistory && (
        <PurchaseHistoryStats
          purchaseHistory={purchaseHistory}
          isHistoryOpen={isHistoryOpen}
          onToggleHistory={toggleHistory}
        />
      )}

      {/* Collapsible Order History */}
      <OrderHistoryCollapse
        isOpen={isHistoryOpen}
        orders={MOCK_ORDER_HISTORY}
      />

      {/* In Stock Matching Preferences */}
      <FavoritesInStock
        products={matchingInStock}
        addedProductIds={addedProductIds}
        onAddToCart={handleAddToCart}
      />

      {/* AI-Powered Recommendations */}
      <RecommendationGrid
        recommendations={recommendations}
        products={products as ProductWithStrainType[] | undefined}
        addedProductIds={addedProductIds}
        onAddToCart={handleAddToCart}
      />

      {/* Cart Preview */}
      <CartPreview
        itemCount={state.cart.length}
        subtotal={state.totals.subtotal}
      />

      <Divider borderColor="slate.700" />

      {/* Action Buttons */}
      <ActionButtons
        cartItemCount={state.cart.length}
        isKiosk={isKiosk}
        onSkip={handleSkip}
        onContinue={handleContinue}
      />
    </VStack>
  );
}

export default StepRecommendations;
