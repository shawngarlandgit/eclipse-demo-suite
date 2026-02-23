/**
 * Payment Gateway Interface
 *
 * Universal interface for POS adapters. Implement this interface
 * to add support for new POS systems (Flowhub, Budtrack, Dutchie, etc.)
 *
 * The gateway pattern enables multi-POS support without schema changes.
 */

import { Id } from "../_generated/dataModel";

// =============================================================================
// Types
// =============================================================================

/**
 * Payment record from Convex database
 */
export interface Payment {
  _id: Id<"payments">;
  dispensaryId: Id<"dispensaries">;
  orderId: Id<"orders">;
  driverId?: string;
  paymentMethod: "cash" | "debit" | "ach" | "mobile_pay";
  amount: number;
  tipAmount?: number;
  status: "pending" | "processing" | "collected" | "completed" | "failed" | "refunded";
  cashTendered?: number;
  changeGiven?: number;
  cardLastFour?: string;
  cardBrand?: string;
  approvalCode?: string;
  terminalId?: string;
  posProvider?: string;
  posSyncStatus?: "pending" | "syncing" | "synced" | "failed" | "manual";
  posTransactionId?: string;
  posErrorMessage?: string;
  posSyncAttempts?: number;
  posSyncedAt?: number;
  metadata?: Record<string, unknown>;
  createdAt: number;
  collectedAt?: number;
  completedAt?: number;
}

/**
 * Order record from Convex database
 */
export interface Order {
  _id: Id<"orders">;
  dispensaryId: Id<"dispensaries">;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  driverId?: string;
  driverName?: string;
  items: Array<{
    productId?: string;
    name: string;
    category?: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  tipAmount?: number;
  preTipAmount?: number;
  paymentMethod?: "cash" | "debit" | "ach" | "mobile_pay";
  paymentStatus?: "pending" | "processing" | "collected" | "completed" | "failed" | "refunded";
  paymentId?: Id<"payments">;
  status: string;
  deliveryAddress: string;
  deliveryNotes?: string;
  pickupTime: string;
  estimatedDeliveryTime?: number;
  createdAt: number;
  updatedAt: number;
}

/**
 * Dispensary payment configuration
 */
export interface DispensaryPaymentConfig {
  _id: Id<"dispensaryPaymentConfig">;
  dispensaryId: Id<"dispensaries">;
  posProvider: string;
  posApiKey?: string;
  posLocationId?: string;
  posWebhookSecret?: string;
  supportedMethods: string[];
  defaultMethod?: string;
  region: string;
  taxRate: number;
  requireIdVerification: boolean;
  metrcEnabled: boolean;
  tipPresets?: number[];
  tipEnabled: boolean;
  syncMode: "realtime" | "batch" | "manual";
  syncRetryAttempts?: number;
  createdAt: number;
  updatedAt?: number;
}

// =============================================================================
// Gateway Interface
// =============================================================================

/**
 * Result of syncing a payment to external POS
 */
export interface PaymentSyncResult {
  success: boolean;
  posTransactionId?: string;
  errorMessage?: string;
  rawResponse?: unknown;
  retryable?: boolean; // Can this error be retried?
}

/**
 * Result of verifying transaction status
 */
export interface TransactionStatusResult {
  status: "pending" | "completed" | "failed" | "cancelled" | "not_found";
  posTransactionId?: string;
  errorMessage?: string;
  rawResponse?: unknown;
}

/**
 * Result of processing a webhook
 */
export interface WebhookResult {
  success: boolean;
  eventType?: string;
  paymentId?: Id<"payments">;
  action?: "status_update" | "refund" | "chargeback" | "no_action";
  newStatus?: string;
  errorMessage?: string;
}

/**
 * Universal Payment Gateway Interface
 *
 * Implement this interface for each POS system to enable
 * payment syncing, status verification, and webhook handling.
 */
export interface IPaymentGateway {
  /**
   * Gateway identifier (e.g., "flowhub", "budtrack", "dutchie")
   */
  readonly provider: string;

  /**
   * Sync a collected payment to the external POS system
   *
   * Called after driver collects payment to record the sale in the POS.
   * Should map Convex payment data to POS-specific format.
   *
   * @param payment - The payment record to sync
   * @param order - The associated order
   * @param config - Dispensary payment configuration (includes API key)
   * @returns Sync result with POS transaction ID or error
   */
  syncPayment(
    payment: Payment,
    order: Order,
    config: DispensaryPaymentConfig
  ): Promise<PaymentSyncResult>;

  /**
   * Verify the status of a transaction in the external POS
   *
   * Used for reconciliation and status checks.
   *
   * @param posTransactionId - The POS-assigned transaction ID
   * @param config - Dispensary payment configuration
   * @returns Transaction status from POS
   */
  getTransactionStatus(
    posTransactionId: string,
    config: DispensaryPaymentConfig
  ): Promise<TransactionStatusResult>;

  /**
   * Handle incoming webhook from the POS system
   *
   * Validates signature and processes webhook events.
   *
   * @param payload - Raw webhook payload (JSON parsed)
   * @param signature - Webhook signature header
   * @param config - Dispensary payment configuration (includes webhook secret)
   * @returns Webhook processing result
   */
  handleWebhook(
    payload: unknown,
    signature: string,
    config: DispensaryPaymentConfig
  ): Promise<WebhookResult>;

  /**
   * Validate that the configuration is complete for this gateway
   *
   * @param config - Dispensary payment configuration
   * @returns Array of missing/invalid config fields, empty if valid
   */
  validateConfig(config: DispensaryPaymentConfig): string[];

  /**
   * Test connection to the POS API
   *
   * @param config - Dispensary payment configuration
   * @returns True if connection successful
   */
  testConnection(config: DispensaryPaymentConfig): Promise<boolean>;
}

// =============================================================================
// Base Implementation
// =============================================================================

/**
 * Base class with common gateway functionality
 *
 * Extend this class when implementing new POS gateways.
 */
export abstract class BasePaymentGateway implements IPaymentGateway {
  abstract readonly provider: string;

  abstract syncPayment(
    payment: Payment,
    order: Order,
    config: DispensaryPaymentConfig
  ): Promise<PaymentSyncResult>;

  abstract getTransactionStatus(
    posTransactionId: string,
    config: DispensaryPaymentConfig
  ): Promise<TransactionStatusResult>;

  abstract handleWebhook(
    payload: unknown,
    signature: string,
    config: DispensaryPaymentConfig
  ): Promise<WebhookResult>;

  /**
   * Default config validation - override in subclasses for provider-specific requirements
   */
  validateConfig(config: DispensaryPaymentConfig): string[] {
    const errors: string[] = [];

    if (!config.posProvider) {
      errors.push("posProvider is required");
    }

    if (!config.posApiKey) {
      errors.push("posApiKey is required");
    }

    return errors;
  }

  /**
   * Default connection test - override in subclasses
   */
  async testConnection(_config: DispensaryPaymentConfig): Promise<boolean> {
    // Default implementation - subclasses should override
    return true;
  }

  /**
   * Helper: Map payment method to POS-specific format
   */
  protected mapPaymentMethod(
    method: Payment["paymentMethod"]
  ): string {
    // Default mapping - override in subclasses if needed
    const mapping: Record<string, string> = {
      cash: "cash",
      debit: "debit",
      ach: "bank_transfer",
      mobile_pay: "digital_wallet",
    };
    return mapping[method] || method;
  }

  /**
   * Helper: Build line items from order
   */
  protected buildLineItems(
    order: Order
  ): Array<{ name: string; quantity: number; price: number; total: number }> {
    return order.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      total: item.quantity * item.price,
    }));
  }

  /**
   * Helper: Log sync attempt for debugging
   */
  protected logSyncAttempt(
    operation: string,
    details: Record<string, unknown>
  ): void {
    console.log(`[${this.provider}] ${operation}:`, JSON.stringify(details));
  }
}
