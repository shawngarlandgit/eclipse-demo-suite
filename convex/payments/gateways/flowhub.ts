/**
 * Flowhub Payment Gateway
 *
 * Implementation of IPaymentGateway for Flowhub POS system.
 * Flowhub is a popular cannabis POS used by Hazy Moose and many other dispensaries.
 *
 * API Documentation: https://developers.flowhub.com/
 */

import {
  BasePaymentGateway,
  Payment,
  Order,
  DispensaryPaymentConfig,
  PaymentSyncResult,
  TransactionStatusResult,
  WebhookResult,
} from "../gateway";

// =============================================================================
// Flowhub API Types
// =============================================================================

interface FlowhubSaleRequest {
  location_id: string;
  order_number: string;
  external_order_id: string;
  payment_type: string;
  total: number;
  subtotal: number;
  tax_amount: number;
  tip_amount: number;
  items: FlowhubLineItem[];
  customer?: {
    name: string;
    phone?: string;
    email?: string;
  };
  metadata?: Record<string, unknown>;
}

interface FlowhubLineItem {
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  category?: string;
  sku?: string;
}

interface FlowhubSaleResponse {
  sale_id: string;
  order_number: string;
  status: string;
  created_at: string;
  total: number;
  payment_type: string;
}

interface FlowhubErrorResponse {
  error: string;
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

interface FlowhubWebhookPayload {
  event: string;
  sale_id: string;
  status: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

// =============================================================================
// Flowhub Gateway Implementation
// =============================================================================

export class FlowhubGateway extends BasePaymentGateway {
  readonly provider = "flowhub";

  private readonly baseUrl = "https://api.flowhub.com/v1";
  private readonly webhookEventTypes = [
    "sale.completed",
    "sale.voided",
    "sale.refunded",
  ];

  /**
   * Sync payment to Flowhub as a sale record
   */
  async syncPayment(
    payment: Payment,
    order: Order,
    config: DispensaryPaymentConfig
  ): Promise<PaymentSyncResult> {
    this.logSyncAttempt("syncPayment", {
      paymentId: payment._id,
      orderId: order._id,
      amount: payment.amount,
    });

    // Validate config
    const configErrors = this.validateConfig(config);
    if (configErrors.length > 0) {
      return {
        success: false,
        errorMessage: `Invalid config: ${configErrors.join(", ")}`,
        retryable: false,
      };
    }

    try {
      const saleRequest = this.buildSaleRequest(payment, order, config);

      const response = await fetch(`${this.baseUrl}/sales`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.posApiKey}`,
          "Content-Type": "application/json",
          "X-Location-ID": config.posLocationId || "",
        },
        body: JSON.stringify(saleRequest),
      });

      if (response.ok) {
        const result = (await response.json()) as FlowhubSaleResponse;
        this.logSyncAttempt("syncPayment:success", {
          saleId: result.sale_id,
        });

        return {
          success: true,
          posTransactionId: result.sale_id,
          rawResponse: result,
        };
      }

      // Handle error response
      const errorText = await response.text();
      let errorData: FlowhubErrorResponse;

      try {
        errorData = JSON.parse(errorText) as FlowhubErrorResponse;
      } catch {
        errorData = { error: "parse_error", message: errorText };
      }

      const isRetryable = this.isRetryableError(response.status, errorData);

      this.logSyncAttempt("syncPayment:error", {
        status: response.status,
        error: errorData,
      });

      return {
        success: false,
        errorMessage: errorData.message || `HTTP ${response.status}`,
        rawResponse: errorData,
        retryable: isRetryable,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      this.logSyncAttempt("syncPayment:exception", { error: errorMessage });

      return {
        success: false,
        errorMessage,
        retryable: true, // Network errors are typically retryable
      };
    }
  }

  /**
   * Get transaction status from Flowhub
   */
  async getTransactionStatus(
    posTransactionId: string,
    config: DispensaryPaymentConfig
  ): Promise<TransactionStatusResult> {
    this.logSyncAttempt("getTransactionStatus", { posTransactionId });

    const configErrors = this.validateConfig(config);
    if (configErrors.length > 0) {
      return {
        status: "failed",
        errorMessage: `Invalid config: ${configErrors.join(", ")}`,
      };
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/sales/${posTransactionId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${config.posApiKey}`,
            "X-Location-ID": config.posLocationId || "",
          },
        }
      );

      if (response.ok) {
        const result = (await response.json()) as FlowhubSaleResponse;

        return {
          status: this.mapFlowhubStatus(result.status),
          posTransactionId: result.sale_id,
          rawResponse: result,
        };
      }

      if (response.status === 404) {
        return {
          status: "not_found",
          errorMessage: "Sale not found in Flowhub",
        };
      }

      return {
        status: "failed",
        errorMessage: `HTTP ${response.status}`,
      };
    } catch (error) {
      return {
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Handle incoming Flowhub webhook
   */
  async handleWebhook(
    payload: unknown,
    signature: string,
    config: DispensaryPaymentConfig
  ): Promise<WebhookResult> {
    this.logSyncAttempt("handleWebhook", {
      event: (payload as FlowhubWebhookPayload)?.event,
    });

    // Validate signature
    const isValid = await this.verifyWebhookSignatureAsync(payload, signature, config);
    if (!isValid) {
      return {
        success: false,
        errorMessage: "Invalid webhook signature",
      };
    }

    const webhookData = payload as FlowhubWebhookPayload;

    // Validate event type
    if (!this.webhookEventTypes.includes(webhookData.event)) {
      return {
        success: true,
        eventType: webhookData.event,
        action: "no_action",
      };
    }

    // Map event to action
    const actionMap: Record<string, WebhookResult["action"]> = {
      "sale.completed": "status_update",
      "sale.voided": "refund",
      "sale.refunded": "refund",
    };

    const statusMap: Record<string, string> = {
      "sale.completed": "completed",
      "sale.voided": "refunded",
      "sale.refunded": "refunded",
    };

    return {
      success: true,
      eventType: webhookData.event,
      action: actionMap[webhookData.event],
      newStatus: statusMap[webhookData.event],
    };
  }

  /**
   * Validate Flowhub-specific config requirements
   */
  validateConfig(config: DispensaryPaymentConfig): string[] {
    const errors = super.validateConfig(config);

    if (!config.posLocationId) {
      errors.push("posLocationId is required for Flowhub");
    }

    if (config.posProvider !== "flowhub") {
      errors.push(`Expected posProvider 'flowhub', got '${config.posProvider}'`);
    }

    return errors;
  }

  /**
   * Test connection to Flowhub API
   */
  async testConnection(config: DispensaryPaymentConfig): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/locations`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${config.posApiKey}`,
        },
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  // ===========================================================================
  // Private Helpers
  // ===========================================================================

  /**
   * Build Flowhub sale request from payment and order
   */
  private buildSaleRequest(
    payment: Payment,
    order: Order,
    config: DispensaryPaymentConfig
  ): FlowhubSaleRequest {
    return {
      location_id: config.posLocationId || "",
      order_number: order._id,
      external_order_id: order._id,
      payment_type: this.mapPaymentMethodToFlowhub(payment.paymentMethod),
      total: payment.amount + (payment.tipAmount || 0),
      subtotal: order.subtotal,
      tax_amount: order.tax,
      tip_amount: payment.tipAmount || 0,
      items: order.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.quantity * item.price,
        category: item.category,
        sku: item.productId,
      })),
      customer: {
        name: order.customerName,
        phone: order.customerPhone,
        email: order.customerEmail,
      },
      metadata: {
        delivery_address: order.deliveryAddress,
        driver_id: payment.driverId,
        collected_at: payment.collectedAt,
        source: "hazy_moose_delivery",
      },
    };
  }

  /**
   * Map our payment method to Flowhub's format
   */
  private mapPaymentMethodToFlowhub(
    method: Payment["paymentMethod"]
  ): string {
    const mapping: Record<string, string> = {
      cash: "cash",
      debit: "debit",
      ach: "bank_transfer",
      mobile_pay: "digital",
    };
    return mapping[method] || "cash";
  }

  /**
   * Map Flowhub status to our standard status
   */
  private mapFlowhubStatus(
    flowhubStatus: string
  ): TransactionStatusResult["status"] {
    const mapping: Record<string, TransactionStatusResult["status"]> = {
      completed: "completed",
      pending: "pending",
      processing: "pending",
      voided: "cancelled",
      refunded: "cancelled",
      failed: "failed",
    };
    return mapping[flowhubStatus] || "pending";
  }

  /**
   * Verify Flowhub webhook signature using Web Crypto API
   */
  private async verifyWebhookSignatureAsync(
    payload: unknown,
    signature: string,
    config: DispensaryPaymentConfig
  ): Promise<boolean> {
    if (!config.posWebhookSecret) {
      console.warn("[flowhub] No webhook secret configured");
      return false;
    }

    try {
      const payloadString =
        typeof payload === "string" ? payload : JSON.stringify(payload);

      // Import the key for HMAC using Web Crypto API
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(config.posWebhookSecret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );

      // Compute the expected signature
      const signatureBytes = await crypto.subtle.sign(
        "HMAC",
        key,
        encoder.encode(payloadString)
      );

      // Convert to hex
      const expectedSignature = Array.from(new Uint8Array(signatureBytes))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      // Constant-time comparison (best effort without timingSafeEqual)
      const cleanSignature = signature.toLowerCase();
      if (cleanSignature.length !== expectedSignature.length) {
        return false;
      }

      let result = 0;
      for (let i = 0; i < cleanSignature.length; i++) {
        result |= cleanSignature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
      }

      return result === 0;
    } catch {
      return false;
    }
  }

  /**
   * Determine if an error is retryable
   */
  private isRetryableError(
    statusCode: number,
    _error: FlowhubErrorResponse
  ): boolean {
    // Network errors and server errors are retryable
    if (statusCode >= 500) return true;

    // Rate limiting is retryable
    if (statusCode === 429) return true;

    // Most 4xx errors are not retryable
    return false;
  }
}

// Export singleton instance
export const flowhubGateway = new FlowhubGateway();
