/**
 * Recommendations Step Module
 * Barrel exports for all recommendation-related components, hooks, and utilities
 */

// Types
export * from './types';

// Mock Data
export {
  MOCK_STRAINS,
  MOCK_ORDER_HISTORY,
  DEFAULT_PURCHASE_HISTORY,
  MATCH_REASONS_BY_TYPE,
  PRODUCT_TYPE_PRIORITY,
} from './mockData';

// Helper Functions
export {
  getStrainType,
  hasStrainType,
  getStrainTypeColorScheme,
  getPreferredTypeColorScheme,
  getFavoriteRank,
  isFavoriteStrain,
  filterMatchingProducts,
  groupProductsByType,
  calculateSimilarityScore,
  formatProductType,
  truncateString,
} from './helpers';

// Hooks
export { useRecommendationData } from './useRecommendationData';
export type { UseRecommendationDataOptions, UseRecommendationDataResult } from './useRecommendationData';

// Components
export { WelcomeHeader } from './WelcomeHeader';
export { PurchaseHistoryStats } from './PurchaseHistoryStats';
export { OrderHistoryCollapse } from './OrderHistoryCollapse';
export { FavoritesInStock } from './FavoritesInStock';
export { RecommendationGrid } from './RecommendationGrid';
export { CartPreview } from './CartPreview';
export { ActionButtons } from './ActionButtons';
