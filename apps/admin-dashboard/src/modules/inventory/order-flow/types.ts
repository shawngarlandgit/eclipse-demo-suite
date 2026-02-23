/**
 * Order Flow Types
 * Types for the ordering stepper system supporting Budtender and Kiosk modes
 */

import type { ProductWithInventory } from '../types';

// ============================================================================
// ORDER MODE
// ============================================================================

export type OrderMode = 'budtender' | 'kiosk';

// ============================================================================
// ORDER STEPS
// ============================================================================

export type OrderStep = 'scan_id' | 'recommendations' | 'select_products' | 'confirm' | 'complete';

export const ORDER_STEPS: OrderStep[] = ['scan_id', 'recommendations', 'select_products', 'confirm', 'complete'];

export const STEP_LABELS: Record<OrderStep, string> = {
  scan_id: 'Verify ID',
  recommendations: 'For You',
  select_products: 'Select Products',
  confirm: 'Confirm Order',
  complete: 'Complete',
};

// ============================================================================
// CUSTOMER VERIFICATION
// ============================================================================

export interface CustomerVerification {
  verified: boolean;
  method: 'scan' | 'manual' | null;
  idNumber: string | null;
  customerName: string | null;
  dateOfBirth: string | null;
  verifiedAt: string | null;
}

// ============================================================================
// CART ITEMS
// ============================================================================

export interface CartItem {
  product: ProductWithInventory;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

// ============================================================================
// ORDER TOTALS
// ============================================================================

export interface OrderTotals {
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  itemCount: number;
}

// ============================================================================
// ORDER STATUS
// ============================================================================

export type OrderStatus = 'idle' | 'processing' | 'complete' | 'error';

// ============================================================================
// CUSTOMER LOOKUP DATA (for returning customers)
// ============================================================================

export interface CustomerLookupData {
  customerId: string | null;
  isReturning: boolean;
  purchaseHistory: {
    preferredStrainType: string | null;
    topEffects: Array<{ effect: string; count: number }>;
    favoriteStrains: string[];
    totalTransactions: number;
  } | null;
}

// ============================================================================
// ORDER STATE
// ============================================================================

export interface OrderState {
  mode: OrderMode;
  currentStep: OrderStep;
  customer: CustomerVerification;
  customerLookup: CustomerLookupData;
  cart: CartItem[];
  totals: OrderTotals;
  status: OrderStatus;
  error: string | null;
  receiptId: string | null;
  completedAt: string | null;
}

// ============================================================================
// ORDER ACTIONS
// ============================================================================

export type OrderAction =
  | { type: 'SET_MODE'; payload: OrderMode }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'GO_TO_STEP'; payload: OrderStep }
  | { type: 'VERIFY_CUSTOMER'; payload: Omit<CustomerVerification, 'verified' | 'verifiedAt'> & { verified: true } }
  | { type: 'SKIP_VERIFICATION' }
  | { type: 'SET_CUSTOMER_LOOKUP'; payload: CustomerLookupData }
  | { type: 'ADD_TO_CART'; payload: ProductWithInventory }
  | { type: 'REMOVE_FROM_CART'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'START_PROCESSING' }
  | { type: 'COMPLETE_ORDER'; payload: { receiptId: string } }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'RESET_ORDER' };

// ============================================================================
// POS SERVICE TYPES
// ============================================================================

export interface POSOrderPayload {
  mode: OrderMode;
  customer: CustomerVerification;
  items: Array<{
    productId: string;
    sku: string | undefined;
    name: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  totals: OrderTotals;
  timestamp: string;
}

export interface POSOrderResponse {
  success: boolean;
  receiptId: string;
  timestamp: string;
  message?: string;
}

// ============================================================================
// CONTEXT TYPES
// ============================================================================

export interface OrderContextValue {
  state: OrderState;
  dispatch: React.Dispatch<OrderAction>;
  // Helper functions
  addToCart: (product: ProductWithInventory) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  verifyCustomer: (data: Omit<CustomerVerification, 'verified' | 'verifiedAt'>) => void;
  skipVerification: () => void;
  setCustomerLookup: (data: CustomerLookupData) => void;
  nextStep: () => void;
  prevStep: () => void;
  submitOrder: () => Promise<void>;
  resetOrder: () => void;
  // Computed values
  canProceed: boolean;
  isCartEmpty: boolean;
  currentStepIndex: number;
}
