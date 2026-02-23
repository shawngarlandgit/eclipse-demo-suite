import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { useNotificationStore } from '../stores/notificationStore';
import { useCurrentDispensary, useCurrentUser } from './useAuth';
import type { Id } from '@convex/_generated/dataModel';

/**
 * Transactions Convex Hooks
 * Real-time transaction data with automatic subscriptions
 */

type TransactionType = 'sale' | 'return' | 'void' | 'adjustment';

export interface TransactionFilters {
  transactionType?: TransactionType;
  customerId?: string;
  processedBy?: string;
  startDate?: number;
  endDate?: number;
  minAmount?: number;
  maxAmount?: number;
}

/**
 * Hook to fetch transactions with filters
 * Real-time updates via Convex subscriptions
 */
export function useTransactions(filters?: Partial<TransactionFilters>, limit?: number) {
  const dispensary = useCurrentDispensary();
  const dispensaryId = dispensary?._id as Id<"dispensaries"> | undefined;

  const data = useQuery(
    api.transactions.list,
    dispensaryId
      ? {
          dispensaryId,
          transactionType: filters?.transactionType,
          customerId: filters?.customerId as Id<"customers"> | undefined,
          processedBy: filters?.processedBy as Id<"users"> | undefined,
          startDate: filters?.startDate,
          endDate: filters?.endDate,
          minAmount: filters?.minAmount,
          maxAmount: filters?.maxAmount,
          limit,
        }
      : "skip"
  );

  return {
    data: data?.transactions,
    total: data?.total,
    hasMore: data?.hasMore,
    isLoading: data === undefined,
    error: null,
  };
}

/**
 * Hook to fetch a single transaction with details
 */
export function useTransaction(transactionId: string | null) {
  const data = useQuery(
    api.transactions.getById,
    transactionId ? { transactionId: transactionId as Id<"transactions"> } : "skip"
  );

  return {
    data,
    isLoading: transactionId ? data === undefined : false,
    error: null,
  };
}

/**
 * Hook to fetch today's transaction summary
 */
export function useTodaySummary() {
  const dispensary = useCurrentDispensary();
  const dispensaryId = dispensary?._id as Id<"dispensaries"> | undefined;

  const data = useQuery(
    api.transactions.getTodaySummary,
    dispensaryId ? { dispensaryId } : "skip"
  );

  return {
    data,
    isLoading: data === undefined,
    error: null,
  };
}

/**
 * Hook to fetch hourly sales breakdown
 */
export function useHourlySales() {
  const dispensary = useCurrentDispensary();
  const dispensaryId = dispensary?._id as Id<"dispensaries"> | undefined;

  const data = useQuery(
    api.transactions.getHourlySales,
    dispensaryId ? { dispensaryId } : "skip"
  );

  return {
    data,
    isLoading: data === undefined,
    error: null,
  };
}

/**
 * Hook to fetch transactions for a customer
 */
export function useCustomerTransactions(customerId: string | null, limit?: number) {
  const data = useQuery(
    api.transactions.getByCustomer,
    customerId ? { customerId: customerId as Id<"customers">, limit } : "skip"
  );

  return {
    data,
    isLoading: customerId ? data === undefined : false,
    error: null,
  };
}

/**
 * Mutation: Create a sale
 */
export function useCreateSale() {
  const { success, error: showError } = useNotificationStore();
  const dispensary = useCurrentDispensary();
  const createSale = useMutation(api.transactions.createSale);

  const mutate = async (sale: {
    customerId?: string;
    items: Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
      discountAmount?: number;
    }>;
    paymentMethod?: string;
    discountAmount?: number;
    taxRate?: number;
    notes?: string;
    posTerminalId?: string;
  }) => {
    if (!dispensary?._id) {
      showError('No dispensary selected');
      return null;
    }

    try {
      const result = await createSale({
        dispensaryId: dispensary._id as Id<"dispensaries">,
        customerId: sale.customerId as Id<"customers"> | undefined,
        items: sale.items.map((item) => ({
          ...item,
          productId: item.productId as Id<"products">,
        })),
        paymentMethod: sale.paymentMethod,
        discountAmount: sale.discountAmount,
        taxRate: sale.taxRate,
        notes: sale.notes,
        posTerminalId: sale.posTerminalId,
      });
      success(`Sale completed: $${result.totalAmount.toFixed(2)}`);
      return result;
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to process sale');
      return null;
    }
  };

  return { mutate };
}

/**
 * Mutation: Process a return
 */
export function useCreateReturn() {
  const { success, error: showError } = useNotificationStore();
  const createReturn = useMutation(api.transactions.createReturn);

  const mutate = async (returnData: {
    originalTransactionId: string;
    items: Array<{
      transactionItemId: string;
      quantity: number;
      reason: string;
    }>;
    notes?: string;
  }) => {
    try {
      const result = await createReturn({
        originalTransactionId: returnData.originalTransactionId as Id<"transactions">,
        items: returnData.items.map((item) => ({
          ...item,
          transactionItemId: item.transactionItemId as Id<"transactionItems">,
        })),
        notes: returnData.notes,
      });
      success(`Return processed: $${result.totalReturn.toFixed(2)}`);
      return result;
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to process return');
      return null;
    }
  };

  return { mutate };
}

/**
 * Mutation: Void a transaction
 */
export function useVoidTransaction() {
  const { success, error: showError } = useNotificationStore();
  const voidTransaction = useMutation(api.transactions.voidTransaction);

  const mutate = async (transactionId: string, reason: string) => {
    try {
      const result = await voidTransaction({
        transactionId: transactionId as Id<"transactions">,
        reason,
      });
      success('Transaction voided');
      return result;
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to void transaction');
      return null;
    }
  };

  return { mutate };
}

// Query keys for compatibility
export const transactionKeys = {
  all: ['transactions'] as const,
  list: (filters?: Partial<TransactionFilters>) =>
    [...transactionKeys.all, 'list', filters] as const,
  detail: (id: string) => [...transactionKeys.all, 'detail', id] as const,
  todaySummary: () => [...transactionKeys.all, 'today-summary'] as const,
  hourly: () => [...transactionKeys.all, 'hourly'] as const,
};
