/**
 * Order Context
 * React Context + Reducer for order flow state management
 * Scoped to the order-flow module - does NOT use global stores
 */

import { createContext, useContext, useReducer, useCallback, useMemo, type ReactNode } from 'react';
import type {
  OrderState,
  OrderAction,
  OrderContextValue,
  OrderStep,
  OrderMode,
  CartItem,
  CustomerVerification,
  CustomerLookupData,
  POSOrderPayload,
} from './types';
import { ORDER_STEPS } from './types';
import { posMockService } from './services/pos.mock.service';
import type { ProductWithInventory } from '../types';

// ============================================================================
// INITIAL STATE
// ============================================================================

const TAX_RATE = 0.08; // 8% tax rate - TODO: Make configurable per dispensary

const initialCustomer: CustomerVerification = {
  verified: false,
  method: null,
  idNumber: null,
  customerName: null,
  dateOfBirth: null,
  verifiedAt: null,
};

const initialCustomerLookup: CustomerLookupData = {
  customerId: null,
  isReturning: false,
  purchaseHistory: null,
};

const initialState: OrderState = {
  mode: 'budtender',
  currentStep: 'scan_id',
  customer: initialCustomer,
  customerLookup: initialCustomerLookup,
  cart: [],
  totals: {
    subtotal: 0,
    taxRate: TAX_RATE,
    taxAmount: 0,
    total: 0,
    itemCount: 0,
  },
  status: 'idle',
  error: null,
  receiptId: null,
  completedAt: null,
};

// ============================================================================
// HELPERS
// ============================================================================

function calculateTotals(cart: CartItem[]): OrderState['totals'] {
  const subtotal = cart.reduce((sum, item) => sum + item.lineTotal, 0);
  const taxAmount = subtotal * TAX_RATE;
  const total = subtotal + taxAmount;
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return {
    subtotal,
    taxRate: TAX_RATE,
    taxAmount,
    total,
    itemCount,
  };
}

function getNextStep(current: OrderStep): OrderStep {
  const currentIndex = ORDER_STEPS.indexOf(current);
  if (currentIndex < ORDER_STEPS.length - 1) {
    return ORDER_STEPS[currentIndex + 1];
  }
  return current;
}

function getPrevStep(current: OrderStep): OrderStep {
  const currentIndex = ORDER_STEPS.indexOf(current);
  if (currentIndex > 0) {
    return ORDER_STEPS[currentIndex - 1];
  }
  return current;
}

// ============================================================================
// REDUCER
// ============================================================================

function orderReducer(state: OrderState, action: OrderAction): OrderState {
  switch (action.type) {
    case 'SET_MODE':
      return { ...state, mode: action.payload };

    case 'NEXT_STEP':
      return { ...state, currentStep: getNextStep(state.currentStep) };

    case 'PREV_STEP':
      return { ...state, currentStep: getPrevStep(state.currentStep) };

    case 'GO_TO_STEP':
      return { ...state, currentStep: action.payload };

    case 'VERIFY_CUSTOMER':
      return {
        ...state,
        customer: {
          ...action.payload,
          verified: true,
          verifiedAt: new Date().toISOString(),
        },
      };

    case 'SKIP_VERIFICATION':
      // Only allowed in budtender mode
      if (state.mode === 'budtender') {
        return {
          ...state,
          customer: {
            ...initialCustomer,
            verified: true,
            method: 'manual',
            verifiedAt: new Date().toISOString(),
          },
        };
      }
      return state;

    case 'SET_CUSTOMER_LOOKUP':
      return {
        ...state,
        customerLookup: action.payload,
      };

    case 'ADD_TO_CART': {
      const product = action.payload;
      const existingIndex = state.cart.findIndex((item) => item.product.id === product.id);

      let newCart: CartItem[];
      if (existingIndex >= 0) {
        // Update existing item quantity
        newCart = state.cart.map((item, index) =>
          index === existingIndex
            ? {
                ...item,
                quantity: item.quantity + 1,
                lineTotal: (item.quantity + 1) * item.unitPrice,
              }
            : item
        );
      } else {
        // Add new item
        const newItem: CartItem = {
          product,
          quantity: 1,
          unitPrice: product.price,
          lineTotal: product.price,
        };
        newCart = [...state.cart, newItem];
      }

      return {
        ...state,
        cart: newCart,
        totals: calculateTotals(newCart),
      };
    }

    case 'REMOVE_FROM_CART': {
      const newCart = state.cart.filter((item) => item.product.id !== action.payload);
      return {
        ...state,
        cart: newCart,
        totals: calculateTotals(newCart),
      };
    }

    case 'UPDATE_QUANTITY': {
      const { productId, quantity } = action.payload;
      if (quantity <= 0) {
        // Remove item if quantity is 0 or less
        const newCart = state.cart.filter((item) => item.product.id !== productId);
        return {
          ...state,
          cart: newCart,
          totals: calculateTotals(newCart),
        };
      }

      const newCart = state.cart.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              quantity,
              lineTotal: quantity * item.unitPrice,
            }
          : item
      );

      return {
        ...state,
        cart: newCart,
        totals: calculateTotals(newCart),
      };
    }

    case 'CLEAR_CART':
      return {
        ...state,
        cart: [],
        totals: calculateTotals([]),
      };

    case 'START_PROCESSING':
      return { ...state, status: 'processing', error: null };

    case 'COMPLETE_ORDER':
      return {
        ...state,
        status: 'complete',
        receiptId: action.payload.receiptId,
        completedAt: new Date().toISOString(),
        currentStep: 'complete',
      };

    case 'SET_ERROR':
      return { ...state, status: 'error', error: action.payload };

    case 'RESET_ORDER':
      return { ...initialState, mode: state.mode };

    default:
      return state;
  }
}

// ============================================================================
// CONTEXT
// ============================================================================

const OrderContext = createContext<OrderContextValue | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

interface OrderProviderProps {
  children: ReactNode;
  initialMode?: OrderMode;
}

export function OrderProvider({ children, initialMode = 'budtender' }: OrderProviderProps) {
  const [state, dispatch] = useReducer(orderReducer, {
    ...initialState,
    mode: initialMode,
  });

  // Helper functions
  const addToCart = useCallback((product: ProductWithInventory) => {
    dispatch({ type: 'ADD_TO_CART', payload: product });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: productId });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } });
  }, []);

  const verifyCustomer = useCallback(
    (data: Omit<CustomerVerification, 'verified' | 'verifiedAt'>) => {
      dispatch({
        type: 'VERIFY_CUSTOMER',
        payload: { ...data, verified: true },
      });
    },
    []
  );

  const skipVerification = useCallback(() => {
    dispatch({ type: 'SKIP_VERIFICATION' });
  }, []);

  const setCustomerLookup = useCallback((data: CustomerLookupData) => {
    dispatch({ type: 'SET_CUSTOMER_LOOKUP', payload: data });
  }, []);

  const nextStep = useCallback(() => {
    dispatch({ type: 'NEXT_STEP' });
  }, []);

  const prevStep = useCallback(() => {
    dispatch({ type: 'PREV_STEP' });
  }, []);

  const submitOrder = useCallback(async () => {
    dispatch({ type: 'START_PROCESSING' });

    try {
      // Build payload
      const payload: POSOrderPayload = {
        mode: state.mode,
        customer: state.customer,
        items: state.cart.map((item) => ({
          productId: item.product.id,
          sku: item.product.sku,
          name: item.product.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal,
        })),
        totals: state.totals,
        timestamp: new Date().toISOString(),
      };

      // Validate order
      const validation = await posMockService.validateOrder(payload);
      if (!validation.valid) {
        throw new Error(validation.errors.join(', '));
      }

      // Submit to POS
      const response = await posMockService.submitOrder(payload);

      if (response.success) {
        dispatch({ type: 'COMPLETE_ORDER', payload: { receiptId: response.receiptId } });
      } else {
        throw new Error(response.message || 'Order submission failed');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      dispatch({ type: 'SET_ERROR', payload: message });
    }
  }, [state.mode, state.customer, state.cart, state.totals]);

  const resetOrder = useCallback(() => {
    dispatch({ type: 'RESET_ORDER' });
  }, []);

  // Computed values
  const canProceed = useMemo(() => {
    switch (state.currentStep) {
      case 'scan_id':
        return state.customer.verified || state.mode === 'budtender';
      case 'recommendations':
        return true; // Can always proceed from recommendations (skip or continue)
      case 'select_products':
        return state.cart.length > 0;
      case 'confirm':
        return state.status === 'idle';
      case 'complete':
        return false;
      default:
        return false;
    }
  }, [state.currentStep, state.customer.verified, state.mode, state.cart.length, state.status]);

  const isCartEmpty = state.cart.length === 0;
  const currentStepIndex = ORDER_STEPS.indexOf(state.currentStep);

  const value: OrderContextValue = {
    state,
    dispatch,
    addToCart,
    removeFromCart,
    updateQuantity,
    verifyCustomer,
    skipVerification,
    setCustomerLookup,
    nextStep,
    prevStep,
    submitOrder,
    resetOrder,
    canProceed,
    isCartEmpty,
    currentStepIndex,
  };

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

// ============================================================================
// HOOK
// ============================================================================

export function useOrder(): OrderContextValue {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
}

export { OrderContext };
