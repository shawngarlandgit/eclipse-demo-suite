/**
 * useRecommendationData Hook
 * Centralizes recommendation data processing logic
 * Generates mock recommendations from products and purchase history
 */

import { useMemo } from 'react';
import type { Recommendation } from '../../hooks/useRecommendations';
import type {
  ProductWithStrainType,
  PurchaseHistorySummary,
} from './types';
import {
  MOCK_STRAINS,
  MATCH_REASONS_BY_TYPE,
  PRODUCT_TYPE_PRIORITY,
  DEFAULT_PURCHASE_HISTORY,
} from './mockData';
import {
  getStrainType,
  getFavoriteRank,
  isFavoriteStrain,
  filterMatchingProducts,
  groupProductsByType,
  calculateSimilarityScore,
} from './helpers';

// ============================================================================
// TYPES
// ============================================================================

export interface UseRecommendationDataOptions {
  products: ProductWithStrainType[] | undefined;
  purchaseHistory: PurchaseHistorySummary | null;
}

export interface UseRecommendationDataResult {
  recommendations: Recommendation[];
  matchingInStock: ProductWithStrainType[];
  purchaseHistory: PurchaseHistorySummary;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

/**
 * Hook that processes products and purchase history to generate recommendations
 */
export function useRecommendationData(
  options: UseRecommendationDataOptions
): UseRecommendationDataResult {
  const { products, purchaseHistory: realPurchaseHistory } = options;

  // Use default purchase history if no real data available
  const purchaseHistory = realPurchaseHistory || DEFAULT_PURCHASE_HISTORY;

  // Generate mock recommendations from all product types
  const recommendations = useMemo((): Recommendation[] => {
    if (!products || products.length === 0) return [];

    const result: Recommendation[] = [];
    const favoriteStrains = purchaseHistory.favoriteStrains || [];

    // Group products by type
    const productsByType = groupProductsByType(products);

    // Track how many products we've added
    let addedCount = 0;
    const maxRecommendations = 6;

    // Iterate through product types in priority order
    for (const type of PRODUCT_TYPE_PRIORITY) {
      if (addedCount >= maxRecommendations) break;

      const typeProducts = productsByType[type];
      if (!typeProducts || typeProducts.length === 0) continue;

      // Prioritize in-stock products
      const inStock = typeProducts.filter(p => (p.quantity_on_hand ?? 0) > 0);
      const available = inStock.length > 0 ? inStock : typeProducts;

      // Add 2 flower products, 1 of each other type
      const countToAdd = type === 'flower' ? 2 : 1;
      const toAdd = available.slice(0, countToAdd);

      for (let idx = 0; idx < toAdd.length && addedCount < maxRecommendations; idx++) {
        const product = toAdd[idx];
        const mockStrain = MOCK_STRAINS[addedCount % MOCK_STRAINS.length];
        const strainName = product.strain_name || (type === 'flower' ? mockStrain.name : null);
        const isFavorite = strainName ? isFavoriteStrain(strainName, favoriteStrains) : false;

        // Calculate similarity score
        const similarityScore = calculateSimilarityScore(addedCount, isFavorite);

        // Get match reason
        const reasons = MATCH_REASONS_BY_TYPE[type] || MATCH_REASONS_BY_TYPE.other;
        const matchReason = isFavorite
          ? 'One of your favorites!'
          : reasons[idx % reasons.length];

        // Get strain type from product or fallback to mock
        const strainType = getStrainType(product) || mockStrain.strain_type;

        result.push({
          productId: product.id,
          productName: product.name,
          strainName: strainName || '',
          strainType,
          effects: mockStrain.effects.slice(0, 4),
          matchReason,
          similarityScore,
          inStock: (product.quantity_on_hand ?? 0) > 0,
          quantityAvailable: product.quantity_on_hand ?? 0,
          price: product.price ?? 0,
        });

        addedCount++;
      }
    }

    // Sort by score
    return result.sort((a, b) => b.similarityScore - a.similarityScore);
  }, [products, purchaseHistory]);

  // Find products in stock that match customer preferences
  const matchingInStock = useMemo((): ProductWithStrainType[] => {
    if (!products || !purchaseHistory) return [];

    return filterMatchingProducts(
      products,
      purchaseHistory.preferredStrainType,
      purchaseHistory.favoriteStrains || []
    ).slice(0, 6);
  }, [products, purchaseHistory]);

  return {
    recommendations,
    matchingInStock,
    purchaseHistory,
  };
}

export default useRecommendationData;
