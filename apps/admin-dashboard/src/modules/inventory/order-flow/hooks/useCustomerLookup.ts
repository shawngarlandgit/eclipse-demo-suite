/**
 * Customer Lookup Hook
 * Handles customer identification from ID scan data
 * Returns customer info and purchase history for recommendations
 */

import { useState, useCallback } from 'react';
import { orderService, type Customer, type PurchaseHistorySummary } from '../services/order.service';
import { useCurrentDispensary } from '../../../../hooks/useAuth';
import { log } from '../../../../utils/logger';

export interface CustomerLookupState {
  customer: Customer | null;
  isReturning: boolean;
  purchaseHistory: PurchaseHistorySummary | null;
  isLoading: boolean;
  error: string | null;
}

export interface LookupResult {
  customer: Customer | null;
  isReturning: boolean;
  purchaseHistory: PurchaseHistorySummary | null;
}

export interface UseCustomerLookupResult extends CustomerLookupState {
  lookupByLicense: (licenseNumber: string, firstName?: string, lastName?: string) => Promise<LookupResult | null>;
  lookupByPhone: (phoneNumber: string) => Promise<LookupResult | null>;
  clearCustomer: () => void;
}

/**
 * Hook for customer identification and history lookup
 */
export function useCustomerLookup(): UseCustomerLookupResult {
  const dispensary = useCurrentDispensary();
  const dispensaryId = dispensary?._id;

  const [state, setState] = useState<CustomerLookupState>({
    customer: null,
    isReturning: false,
    purchaseHistory: null,
    isLoading: false,
    error: null,
  });

  /**
   * Look up customer by driver's license number
   */
  const lookupByLicense = useCallback(
    async (licenseNumber: string, firstName?: string, lastName?: string): Promise<LookupResult | null> => {
      if (!dispensaryId) {
        setState(prev => ({
          ...prev,
          error: 'No dispensary ID available',
          isLoading: false,
        }));
        return null;
      }

      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        log.info('[useCustomerLookup] Looking up customer by license');

        // Look up or create customer
        const result = await orderService.lookupOrCreateCustomer(
          dispensaryId,
          licenseNumber,
          { firstName, lastName }
        );

        // Fetch purchase history if returning customer
        let purchaseHistory: PurchaseHistorySummary | null = null;
        if (result.isReturning && result.customer.id) {
          purchaseHistory = await orderService.getCustomerPreferences(result.customer.id);
        }

        const lookupResult: LookupResult = {
          customer: result.customer,
          isReturning: result.isReturning,
          purchaseHistory,
        };

        setState({
          ...lookupResult,
          isLoading: false,
          error: null,
        });

        log.info(
          `[useCustomerLookup] Customer ${result.isReturning ? 'found' : 'created'}: ${result.customer.id}`
        );

        return lookupResult;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to lookup customer';
        log.error('[useCustomerLookup] Error:', error);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        return null;
      }
    },
    [dispensaryId]
  );

  /**
   * Look up customer by phone number (loyalty lookup)
   */
  const lookupByPhone = useCallback(
    async (phoneNumber: string): Promise<LookupResult | null> => {
      if (!dispensaryId) {
        setState(prev => ({
          ...prev,
          error: 'No dispensary ID available',
          isLoading: false,
        }));
        return null;
      }

      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        log.info('[useCustomerLookup] Looking up customer by phone');

        const customer = await orderService.lookupByPhone(dispensaryId, phoneNumber);

        if (!customer) {
          setState(prev => ({
            ...prev,
            customer: null,
            isReturning: false,
            purchaseHistory: null,
            isLoading: false,
            error: 'No customer found with this phone number',
          }));
          return null;
        }

        // Fetch purchase history
        const purchaseHistory = await orderService.getCustomerPreferences(customer.id);

        const lookupResult: LookupResult = {
          customer,
          isReturning: true,
          purchaseHistory,
        };

        setState({
          ...lookupResult,
          isLoading: false,
          error: null,
        });

        return lookupResult;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to lookup customer';
        log.error('[useCustomerLookup] Error:', error);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        return null;
      }
    },
    [dispensaryId]
  );

  /**
   * Clear customer state
   */
  const clearCustomer = useCallback(() => {
    setState({
      customer: null,
      isReturning: false,
      purchaseHistory: null,
      isLoading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    lookupByLicense,
    lookupByPhone,
    clearCustomer,
  };
}

export default useCustomerLookup;
