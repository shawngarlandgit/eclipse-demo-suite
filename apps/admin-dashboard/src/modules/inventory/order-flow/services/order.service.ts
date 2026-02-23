/**
 * Order Service
 * Handles order persistence, customer lookup, and purchase history tracking
 * for AI-powered strain recommendations
 */

import { supabase } from '../../../../services/supabase/client';
import { log } from '../../../../utils/logger';
import type { POSOrderPayload } from '../types';

// ============================================================================
// TYPES
// ============================================================================

export interface Customer {
  id: string;
  dispensary_id: string;
  license_number_hash: string | null;
  phone_hash: string | null;
  first_name: string | null;
  last_name: string | null;
  email_hash: string | null;
  total_purchases: number;
  total_transactions: number;
  customer_tier: string;
  loyalty_points: number;
  first_purchase_at: string | null;
  last_purchase_at: string | null;
  created_at: string;
}

export interface CustomerLookupResult {
  customer: Customer;
  isReturning: boolean;
  purchaseCount: number;
}

export interface PurchaseHistorySummary {
  topEffects: Array<{ effect: string; count: number }>;
  preferredStrainType: string | null;
  favoriteStrains: string[];
  totalPurchases: number;
  lastPurchaseAt: string | null;
}

export interface SaveOrderResult {
  success: boolean;
  transactionId: string | null;
  receiptId: string;
  error?: string;
}

// ============================================================================
// HASHING
// ============================================================================

/**
 * Hash a string using SHA-256 for privacy-compliant storage
 * License numbers and phone numbers should never be stored in plain text
 */
async function hashString(input: string): Promise<string> {
  // Normalize: uppercase and remove special characters
  const normalized = input.toUpperCase().replace(/[^A-Z0-9]/g, '');

  // Use Web Crypto API for SHA-256
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);

  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}

/**
 * Generate a receipt ID
 */
function generateReceiptId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `RCP-${timestamp}-${random}`;
}

// ============================================================================
// ORDER SERVICE CLASS
// ============================================================================

class OrderService {
  private serviceName = 'OrderService';

  /**
   * Look up a customer by license number, or create a new one
   */
  async lookupOrCreateCustomer(
    dispensaryId: string,
    licenseNumber: string,
    customerData: { firstName?: string; lastName?: string }
  ): Promise<CustomerLookupResult> {
    const licenseHash = await hashString(licenseNumber);

    log.info(`[${this.serviceName}] Looking up customer by license hash`);

    // Try to find existing customer
    const { data: existingCustomer, error: lookupError } = await supabase
      .from('customers')
      .select('*')
      .eq('dispensary_id', dispensaryId)
      .eq('license_number_hash', licenseHash)
      .single();

    if (existingCustomer && !lookupError) {
      log.info(`[${this.serviceName}] Found returning customer: ${existingCustomer.id}`);

      // Update name if provided and different
      if (customerData.firstName || customerData.lastName) {
        await supabase
          .from('customers')
          .update({
            first_name: customerData.firstName || existingCustomer.first_name,
            last_name: customerData.lastName || existingCustomer.last_name,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingCustomer.id);
      }

      return {
        customer: existingCustomer as Customer,
        isReturning: true,
        purchaseCount: existingCustomer.total_transactions || 0,
      };
    }

    // Create new customer
    log.info(`[${this.serviceName}] Creating new customer`);

    const { data: newCustomer, error: createError } = await supabase
      .from('customers')
      .insert({
        dispensary_id: dispensaryId,
        license_number_hash: licenseHash,
        first_name: customerData.firstName || null,
        last_name: customerData.lastName || null,
        customer_tier: 'standard',
        loyalty_points: 0,
        total_purchases: 0,
        total_transactions: 0,
      })
      .select()
      .single();

    if (createError) {
      log.error(`[${this.serviceName}] Failed to create customer:`, createError);
      throw new Error(`Failed to create customer: ${createError.message}`);
    }

    return {
      customer: newCustomer as Customer,
      isReturning: false,
      purchaseCount: 0,
    };
  }

  /**
   * Get customer purchase history summary for AI recommendations
   */
  async getCustomerPreferences(customerId: string): Promise<PurchaseHistorySummary | null> {
    log.info(`[${this.serviceName}] Fetching customer preferences: ${customerId}`);

    // Try materialized view first (faster)
    const { data: mvData, error: mvError } = await supabase
      .from('mv_customer_preferences')
      .select('*')
      .eq('customer_id', customerId)
      .single();

    if (mvData && !mvError) {
      return {
        topEffects: (mvData.top_effects || []).map((e: string, i: number) => ({
          effect: e,
          count: 10 - i, // Approximate count from ordered array
        })),
        preferredStrainType: mvData.preferred_strain_type,
        favoriteStrains: mvData.favorite_strains || [],
        totalPurchases: mvData.total_items_purchased || 0,
        lastPurchaseAt: mvData.last_purchase_at,
      };
    }

    // Fallback: query purchases directly
    const { data: purchases, error: purchasesError } = await supabase
      .from('customer_purchases')
      .select('strain_name, strain_type, effects, quantity, purchased_at')
      .eq('customer_id', customerId)
      .order('purchased_at', { ascending: false })
      .limit(50);

    if (purchasesError || !purchases || purchases.length === 0) {
      return null;
    }

    // Aggregate effects
    const effectCounts: Record<string, number> = {};
    const strainTypeCounts: Record<string, number> = {};
    const strainCounts: Record<string, number> = {};

    for (const purchase of purchases) {
      // Count effects
      if (purchase.effects) {
        for (const effect of purchase.effects) {
          effectCounts[effect] = (effectCounts[effect] || 0) + purchase.quantity;
        }
      }

      // Count strain types
      if (purchase.strain_type) {
        strainTypeCounts[purchase.strain_type] =
          (strainTypeCounts[purchase.strain_type] || 0) + purchase.quantity;
      }

      // Count strains
      if (purchase.strain_name) {
        strainCounts[purchase.strain_name] =
          (strainCounts[purchase.strain_name] || 0) + purchase.quantity;
      }
    }

    // Sort and take top results
    const topEffects = Object.entries(effectCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([effect, count]) => ({ effect, count }));

    const preferredStrainType = Object.entries(strainTypeCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    const favoriteStrains = Object.entries(strainCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([strain]) => strain);

    return {
      topEffects,
      preferredStrainType,
      favoriteStrains,
      totalPurchases: purchases.reduce((sum, p) => sum + p.quantity, 0),
      lastPurchaseAt: purchases[0]?.purchased_at || null,
    };
  }

  /**
   * Save a completed order to the database
   */
  async saveOrder(
    dispensaryId: string,
    payload: POSOrderPayload,
    customerId: string | null
  ): Promise<SaveOrderResult> {
    const receiptId = generateReceiptId();

    log.info(`[${this.serviceName}] Saving order: ${receiptId}`);

    try {
      // 1. Create transaction record
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert({
          dispensary_id: dispensaryId,
          customer_id: customerId,
          receipt_number: receiptId,
          subtotal: payload.totals.subtotal,
          tax_amount: payload.totals.taxAmount,
          total_amount: payload.totals.total,
          payment_method: 'cash', // TODO: Support multiple payment methods
          payment_status: 'completed',
          order_type: payload.mode === 'kiosk' ? 'kiosk' : 'in_store',
          notes: payload.customer.customerName
            ? `Customer: ${payload.customer.customerName}`
            : null,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (txError) {
        log.error(`[${this.serviceName}] Failed to create transaction:`, txError);
        return {
          success: false,
          transactionId: null,
          receiptId,
          error: `Failed to create transaction: ${txError.message}`,
        };
      }

      // 2. Create transaction items
      const transactionItems = payload.items.map(item => ({
        transaction_id: transaction.id,
        product_id: item.productId,
        product_name: item.name,
        sku: item.sku || null,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        line_total: item.lineTotal,
      }));

      const { error: itemsError } = await supabase
        .from('transaction_items')
        .insert(transactionItems);

      if (itemsError) {
        log.error(`[${this.serviceName}] Failed to create transaction items:`, itemsError);
        // Continue anyway - transaction is created
      }

      // 3. Record purchase history for AI (if customer identified)
      if (customerId) {
        await this.recordPurchaseHistory(dispensaryId, customerId, transaction.id, payload.items);
      }

      // 4. Deduct inventory
      await this.deductInventory(payload.items);

      log.info(`[${this.serviceName}] Order saved successfully: ${transaction.id}`);

      return {
        success: true,
        transactionId: transaction.id,
        receiptId,
      };
    } catch (error) {
      log.error(`[${this.serviceName}] Error saving order:`, error);
      return {
        success: false,
        transactionId: null,
        receiptId,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Record purchase history for AI recommendations
   */
  private async recordPurchaseHistory(
    dispensaryId: string,
    customerId: string,
    transactionId: string,
    items: POSOrderPayload['items']
  ): Promise<void> {
    log.info(`[${this.serviceName}] Recording purchase history for customer: ${customerId}`);

    // Fetch product details for effects
    const productIds = items.map(i => i.productId);
    const { data: products } = await supabase
      .from('products')
      .select('id, strain_name, product_type')
      .in('id', productIds);

    const productMap = new Map(products?.map(p => [p.id, p]) || []);

    // Get strain effects from strains.json or database
    // For now, we'll store basic product info
    const purchaseRecords = items.map(item => {
      const product = productMap.get(item.productId);
      return {
        dispensary_id: dispensaryId,
        customer_id: customerId,
        transaction_id: transactionId,
        product_id: item.productId,
        product_name: item.name,
        strain_name: product?.strain_name || null,
        strain_type: null, // TODO: Get from strain data
        category: product?.product_type || null,
        effects: [], // TODO: Get from strain data
        quantity: item.quantity,
        unit_price: item.unitPrice,
        purchased_at: new Date().toISOString(),
      };
    });

    const { error } = await supabase
      .from('customer_purchases')
      .insert(purchaseRecords);

    if (error) {
      log.error(`[${this.serviceName}] Failed to record purchase history:`, error);
      // Don't throw - this is non-critical
    }
  }

  /**
   * Deduct inventory after sale
   */
  private async deductInventory(items: POSOrderPayload['items']): Promise<void> {
    log.info(`[${this.serviceName}] Deducting inventory for ${items.length} items`);

    for (const item of items) {
      const { error } = await supabase.rpc('decrement_inventory', {
        p_product_id: item.productId,
        p_quantity: item.quantity,
      });

      if (error) {
        log.error(`[${this.serviceName}] Failed to deduct inventory for ${item.productId}:`, error);
        // Continue with other items
      }
    }
  }

  /**
   * Update customer stats after purchase
   */
  async updateCustomerAfterPurchase(
    customerId: string,
    totalAmount: number
  ): Promise<void> {
    log.info(`[${this.serviceName}] Updating customer stats: ${customerId}`);

    const { error } = await supabase.rpc('update_customer_purchase_stats', {
      p_customer_id: customerId,
      p_purchase_amount: totalAmount,
    });

    if (error) {
      // Fallback to manual update
      const { data: customer } = await supabase
        .from('customers')
        .select('total_purchases, total_transactions')
        .eq('id', customerId)
        .single();

      if (customer) {
        await supabase
          .from('customers')
          .update({
            total_purchases: (customer.total_purchases || 0) + totalAmount,
            total_transactions: (customer.total_transactions || 0) + 1,
            last_purchase_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', customerId);
      }
    }
  }

  /**
   * Look up customer by phone number (for loyalty lookup)
   */
  async lookupByPhone(
    dispensaryId: string,
    phoneNumber: string
  ): Promise<Customer | null> {
    const phoneHash = await hashString(phoneNumber);

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('dispensary_id', dispensaryId)
      .eq('phone_hash', phoneHash)
      .single();

    if (error || !data) {
      return null;
    }

    return data as Customer;
  }

  /**
   * Link phone number to customer (for loyalty program)
   */
  async linkPhone(customerId: string, phoneNumber: string): Promise<void> {
    const phoneHash = await hashString(phoneNumber);

    await supabase
      .from('customers')
      .update({
        phone_hash: phoneHash,
        updated_at: new Date().toISOString(),
      })
      .eq('id', customerId);
  }
}

// Export singleton instance
export const orderService = new OrderService();

// Export class for testing
export { OrderService };
