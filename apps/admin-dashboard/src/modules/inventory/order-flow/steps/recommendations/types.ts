/**
 * Recommendations Step Types
 * Types specific to the recommendations step in the order flow
 */

import type { ProductWithInventory } from '../../../types';
import type { Recommendation } from '../../hooks/useRecommendations';
import type { CustomerLookupData, CustomerVerification } from '../../types';

// ============================================================================
// EXTENDED PRODUCT TYPE WITH STRAIN_TYPE
// ============================================================================

/**
 * Extended product type that includes optional strain_type field.
 * Some products (like flower) may have strain_type, others won't.
 */
export interface ProductWithStrainType extends ProductWithInventory {
  strain_type?: 'indica' | 'sativa' | 'hybrid' | string;
}

// ============================================================================
// MOCK DATA TYPES
// ============================================================================

export interface MockStrain {
  name: string;
  strain_type: 'indica' | 'sativa' | 'hybrid';
  effects: string[];
  flavors: string[];
}

export interface MockOrderHistoryItem {
  name: string;
  quantity: number;
  price: number;
}

export interface MockOrder {
  id: string;
  date: Date;
  items: MockOrderHistoryItem[];
  total: number;
  status: 'completed' | 'pending' | 'cancelled';
}

// ============================================================================
// PURCHASE HISTORY TYPES
// ============================================================================

export interface PurchaseHistorySummary {
  preferredStrainType: string | null;
  topEffects: Array<{ effect: string; count: number }>;
  favoriteStrains: string[];
  totalTransactions: number;
}

// ============================================================================
// COMPONENT PROPS
// ============================================================================

export interface WelcomeHeaderProps {
  customerName?: string | null;
  customerInfo: CustomerVerification;
}

export interface PurchaseHistoryStatsProps {
  purchaseHistory: PurchaseHistorySummary;
  isHistoryOpen: boolean;
  onToggleHistory: () => void;
}

export interface OrderHistoryCollapseProps {
  isOpen: boolean;
  orders: MockOrder[];
}

export interface FavoritesInStockProps {
  products: ProductWithStrainType[];
  addedProductIds: Set<string>;
  onAddToCart: (productId: string) => void;
}

export interface RecommendationGridProps {
  recommendations: Recommendation[];
  products: ProductWithStrainType[];
  addedProductIds: Set<string>;
  onAddToCart: (productId: string) => void;
}

export interface CartPreviewProps {
  itemCount: number;
  subtotal: number;
}

export interface ActionButtonsProps {
  cartItemCount: number;
  isKiosk: boolean;
  onSkip: () => void;
  onContinue: () => void;
}

// ============================================================================
// HELPER FUNCTION TYPES
// ============================================================================

export type StrainTypeColorScheme = 'purple' | 'orange' | 'cyan' | 'green';

export interface MatchReasons {
  [key: string]: string[];
}

// Re-export types for convenience
export type { Recommendation } from '../../hooks/useRecommendations';
export type { CustomerVerification, CustomerLookupData } from '../../types';
