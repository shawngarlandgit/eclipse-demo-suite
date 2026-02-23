/**
 * Mock POS Service
 * Simulates POS integration for order processing
 *
 * TODO: Replace with real POS integration (Square, Dutchie, etc.)
 * TODO: Add compliance/METRC hooks for inventory deduction
 */

import type { POSOrderPayload, POSOrderResponse } from '../types';

// Simulated network delay range (ms)
const MIN_DELAY = 800;
const MAX_DELAY = 2000;

/**
 * Generate a mock receipt ID
 */
function generateReceiptId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `RCP-${timestamp}-${random}`;
}

/**
 * Simulate network delay
 */
function simulateDelay(): Promise<void> {
  const delay = Math.random() * (MAX_DELAY - MIN_DELAY) + MIN_DELAY;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Mock POS Service Class
 * Designed to be swappable with real POS implementation
 */
class MockPOSService {
  private serviceName = 'MockPOS';

  /**
   * Submit an order to the (mock) POS system
   */
  async submitOrder(payload: POSOrderPayload): Promise<POSOrderResponse> {
    // Log the payload for inspection
    console.group(`[${this.serviceName}] Order Submission`);
    console.table(
      payload.items.map((item) => ({
        SKU: item.sku || 'N/A',
        Name: item.name.substring(0, 30),
        Qty: item.quantity,
        Price: `$${item.unitPrice.toFixed(2)}`,
        Total: `$${item.lineTotal.toFixed(2)}`,
      }))
    );
    console.groupEnd();

    // Simulate network delay
    await simulateDelay();

    // Generate response
    const receiptId = generateReceiptId();
    const timestamp = new Date().toISOString();

    const response: POSOrderResponse = {
      success: true,
      receiptId,
      timestamp,
      message: 'Order processed successfully',
    };


    return response;
  }

  /**
   * Validate order before submission
   * TODO: Add real validation logic (inventory availability, limits, etc.)
   */
  async validateOrder(payload: POSOrderPayload): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Check for empty cart
    if (payload.items.length === 0) {
      errors.push('Cart is empty');
    }

    // Check for customer verification in kiosk mode
    if (payload.mode === 'kiosk' && !payload.customer.verified) {
      errors.push('Customer verification required for kiosk orders');
    }

    // Check for valid quantities
    const invalidQuantities = payload.items.filter((item) => item.quantity <= 0);
    if (invalidQuantities.length > 0) {
      errors.push('All items must have a quantity greater than 0');
    }

    // Check for valid totals
    if (payload.totals.total <= 0) {
      errors.push('Order total must be greater than $0');
    }

    // TODO: Check inventory availability
    // TODO: Check purchase limits
    // TODO: Check compliance requirements

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get service status
   * TODO: Add real health check for POS connection
   */
  async getStatus(): Promise<{ online: boolean; service: string }> {
    return {
      online: true,
      service: this.serviceName,
    };
  }
}

// Export singleton instance
export const posMockService = new MockPOSService();

// Export class for testing
export { MockPOSService };
