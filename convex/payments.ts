/**
 * Payment Service - Convex Mutations & Queries
 *
 * Core payment operations for the multi-POS payment platform.
 * Handles payment creation, collection, and POS synchronization.
 */

import { v } from "convex/values";
import { mutation, query, internalMutation, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { getPaymentGateway } from "./payments/gatewayFactory";
import type { Payment, Order, DispensaryPaymentConfig } from "./payments/gateway";

// =============================================================================
// Payment Method & Status Validators
// =============================================================================

const paymentMethodValidator = v.union(
  v.literal("cash"),
  v.literal("debit"),
  v.literal("ach"),
  v.literal("mobile_pay")
);

const paymentStatusValidator = v.union(
  v.literal("pending"),
  v.literal("processing"),
  v.literal("collected"),
  v.literal("completed"),
  v.literal("failed"),
  v.literal("refunded")
);

// =============================================================================
// Queries
// =============================================================================

/**
 * Get payment by ID
 */
export const getPayment = query({
  args: { paymentId: v.id("payments") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.paymentId);
  },
});

/**
 * Get payment by order ID
 */
export const getPaymentByOrder = query({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("payments")
      .withIndex("by_order", (q) => q.eq("orderId", args.orderId))
      .first();
  },
});

/**
 * Get all payments for a dispensary
 */
export const getPaymentsByDispensary = query({
  args: {
    dispensaryId: v.id("dispensaries"),
    limit: v.optional(v.number()),
    status: v.optional(paymentStatusValidator),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("payments")
      .withIndex("by_dispensary", (q) => q.eq("dispensaryId", args.dispensaryId))
      .order("desc");

    const payments = await query.take(args.limit || 50);

    // Filter by status if specified
    if (args.status) {
      return payments.filter((p) => p.status === args.status);
    }

    return payments;
  },
});

/**
 * Get payments pending POS sync
 */
export const getPendingSyncPayments = query({
  args: { dispensaryId: v.id("dispensaries") },
  handler: async (ctx, args) => {
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_dispensary", (q) => q.eq("dispensaryId", args.dispensaryId))
      .collect();

    return payments.filter(
      (p) =>
        p.status === "collected" &&
        (p.posSyncStatus === "pending" || p.posSyncStatus === "failed")
    );
  },
});

/**
 * Get driver earnings for a period
 */
export const getDriverEarnings = query({
  args: {
    driverId: v.string(),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const earnings = await ctx.db
      .query("driverEarnings")
      .withIndex("by_driver", (q) => q.eq("driverId", args.driverId))
      .collect();

    // Filter by date range if specified
    let filtered = earnings;
    if (args.startDate) {
      filtered = filtered.filter((e) => e.earnedAt >= args.startDate!);
    }
    if (args.endDate) {
      filtered = filtered.filter((e) => e.earnedAt <= args.endDate!);
    }

    // Calculate totals
    const totalTips = filtered.reduce((sum, e) => sum + e.tipAmount, 0);
    const totalDeliveryFees = filtered.reduce(
      (sum, e) => sum + (e.deliveryFee || 0),
      0
    );
    const totalEarned = filtered.reduce((sum, e) => sum + e.totalEarned, 0);

    return {
      earnings: filtered,
      summary: {
        totalTips,
        totalDeliveryFees,
        totalEarned,
        deliveryCount: filtered.length,
      },
    };
  },
});

/**
 * Get dispensary payment config
 */
export const getPaymentConfig = query({
  args: { dispensaryId: v.id("dispensaries") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("dispensaryPaymentConfig")
      .withIndex("by_dispensary", (q) => q.eq("dispensaryId", args.dispensaryId))
      .first();
  },
});

// =============================================================================
// Mutations
// =============================================================================

/**
 * Create a payment record when order is placed
 *
 * Called from checkout to initialize payment tracking.
 * Payment starts in "pending" status until collected by driver.
 */
export const createPayment = mutation({
  args: {
    orderId: v.id("orders"),
    paymentMethod: paymentMethodValidator,
    preTipAmount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    // Check if payment already exists for this order
    const existingPayment = await ctx.db
      .query("payments")
      .withIndex("by_order", (q) => q.eq("orderId", args.orderId))
      .first();

    if (existingPayment) {
      throw new Error("Payment already exists for this order");
    }

    // Get dispensary config for POS provider
    const config = await ctx.db
      .query("dispensaryPaymentConfig")
      .withIndex("by_dispensary", (q) =>
        q.eq("dispensaryId", order.dispensaryId)
      )
      .first();

    const now = Date.now();

    // Create payment record
    const paymentId = await ctx.db.insert("payments", {
      dispensaryId: order.dispensaryId,
      orderId: args.orderId,
      paymentMethod: args.paymentMethod,
      amount: order.total,
      tipAmount: args.preTipAmount,
      status: "pending",
      posProvider: config?.posProvider,
      posSyncStatus: "pending",
      posSyncAttempts: 0,
      createdAt: now,
    });

    // Update order with payment reference
    await ctx.db.patch(args.orderId, {
      paymentMethod: args.paymentMethod,
      paymentStatus: "pending",
      paymentId,
      preTipAmount: args.preTipAmount,
      updatedAt: now,
    });

    return { paymentId };
  },
});

/**
 * Collect payment - called when driver receives payment from customer
 *
 * Updates payment status to "collected" and creates driver earnings record.
 * Schedules background POS sync.
 */
export const collectPayment = mutation({
  args: {
    paymentId: v.id("payments"),
    driverId: v.string(),
    tipAmount: v.optional(v.number()),
    // Cash-specific
    cashTendered: v.optional(v.number()),
    changeGiven: v.optional(v.number()),
    // Card-specific
    approvalCode: v.optional(v.string()),
    cardLastFour: v.optional(v.string()),
    cardBrand: v.optional(v.string()),
    terminalId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db.get(args.paymentId);
    if (!payment) {
      throw new Error("Payment not found");
    }

    if (payment.status !== "pending" && payment.status !== "processing") {
      throw new Error(`Cannot collect payment with status: ${payment.status}`);
    }

    const order = await ctx.db.get(payment.orderId);
    if (!order) {
      throw new Error("Associated order not found");
    }

    // Validate driver assignment
    if (order.driverId !== args.driverId) {
      throw new Error("Driver not assigned to this order");
    }

    const now = Date.now();
    const finalTip = args.tipAmount ?? payment.tipAmount ?? 0;

    // Update payment to collected
    await ctx.db.patch(args.paymentId, {
      status: "collected",
      driverId: args.driverId,
      tipAmount: finalTip,
      cashTendered: args.cashTendered,
      changeGiven: args.changeGiven,
      approvalCode: args.approvalCode,
      cardLastFour: args.cardLastFour,
      cardBrand: args.cardBrand,
      terminalId: args.terminalId,
      collectedAt: now,
    });

    // Update order status
    await ctx.db.patch(payment.orderId, {
      status: "delivered",
      tipAmount: finalTip,
      paymentStatus: "collected",
      deliveredAt: now,
      updatedAt: now,
    });

    // Create driver earnings record
    const deliveryFee = 0; // TODO: Get from config or order
    const totalEarned = deliveryFee + finalTip;

    const earningsId = await ctx.db.insert("driverEarnings", {
      driverId: args.driverId,
      dispensaryId: payment.dispensaryId,
      paymentId: args.paymentId,
      orderId: payment.orderId,
      deliveryFee,
      tipAmount: finalTip,
      totalEarned,
      payoutStatus: "pending",
      earnedAt: now,
    });

    // Update driver stats
    const driver = await ctx.db
      .query("drivers")
      .withIndex("by_driver_id", (q) => q.eq("driverId", args.driverId))
      .first();

    if (driver) {
      await ctx.db.patch(driver._id, {
        completedDeliveries: (driver.completedDeliveries || 0) + 1,
        totalTips: (driver.totalTips || 0) + finalTip,
        updatedAt: now,
      });
    }

    // Schedule POS sync (background)
    await ctx.scheduler.runAfter(0, internal.payments.syncPaymentToPOS, {
      paymentId: args.paymentId,
    });

    return {
      success: true,
      earningsId,
      tipAmount: finalTip,
    };
  },
});

/**
 * Mark payment as failed (manual or automated)
 */
export const failPayment = mutation({
  args: {
    paymentId: v.id("payments"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db.get(args.paymentId);
    if (!payment) {
      throw new Error("Payment not found");
    }

    const now = Date.now();

    await ctx.db.patch(args.paymentId, {
      status: "failed",
      metadata: {
        ...(payment.metadata as Record<string, unknown> || {}),
        failureReason: args.reason,
        failedAt: now,
      },
    });

    // Update order payment status
    await ctx.db.patch(payment.orderId, {
      paymentStatus: "failed",
      updatedAt: now,
    });

    return { success: true };
  },
});

/**
 * Refund payment
 */
export const refundPayment = mutation({
  args: {
    paymentId: v.id("payments"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db.get(args.paymentId);
    if (!payment) {
      throw new Error("Payment not found");
    }

    if (payment.status !== "collected" && payment.status !== "completed") {
      throw new Error(`Cannot refund payment with status: ${payment.status}`);
    }

    const now = Date.now();

    await ctx.db.patch(args.paymentId, {
      status: "refunded",
      metadata: {
        ...(payment.metadata as Record<string, unknown> || {}),
        refundReason: args.reason,
        refundedAt: now,
      },
    });

    // Update order payment status
    await ctx.db.patch(payment.orderId, {
      paymentStatus: "refunded",
      updatedAt: now,
    });

    return { success: true };
  },
});

// =============================================================================
// Internal Actions (Background POS Sync)
// =============================================================================

/**
 * Sync payment to external POS (background action)
 *
 * Uses the gateway adapter pattern to support multiple POS systems.
 */
export const syncPaymentToPOS = internalAction({
  args: { paymentId: v.id("payments") },
  handler: async (ctx, args) => {
    // Get payment
    const payment = await ctx.runQuery(internal.payments.getPaymentInternal, {
      paymentId: args.paymentId,
    });

    if (!payment) {
      console.error(`[syncPaymentToPOS] Payment not found: ${args.paymentId}`);
      return { success: false, error: "Payment not found" };
    }

    // Get order
    const order = await ctx.runQuery(internal.payments.getOrderInternal, {
      orderId: payment.orderId,
    });

    if (!order) {
      console.error(`[syncPaymentToPOS] Order not found: ${payment.orderId}`);
      return { success: false, error: "Order not found" };
    }

    // Get payment config
    const config = await ctx.runQuery(internal.payments.getPaymentConfigInternal, {
      dispensaryId: payment.dispensaryId,
    });

    if (!config) {
      console.log(`[syncPaymentToPOS] No payment config for dispensary - marking as manual`);
      await ctx.runMutation(internal.payments.updatePaymentSyncStatus, {
        paymentId: args.paymentId,
        posSyncStatus: "manual",
        posErrorMessage: "No payment config found - requires manual sync",
      });
      return { success: false, error: "No payment config" };
    }

    // Mark as syncing
    await ctx.runMutation(internal.payments.updatePaymentSyncStatus, {
      paymentId: args.paymentId,
      posSyncStatus: "syncing",
    });

    try {
      // Get the appropriate gateway
      const gateway = getPaymentGateway(config.posProvider);

      // Sync to POS
      const result = await gateway.syncPayment(
        payment as unknown as Payment,
        order as unknown as Order,
        config as unknown as DispensaryPaymentConfig
      );

      if (result.success) {
        // Update payment with success
        await ctx.runMutation(internal.payments.updatePaymentSyncStatus, {
          paymentId: args.paymentId,
          posSyncStatus: "synced",
          posTransactionId: result.posTransactionId,
          completedAt: Date.now(),
        });

        // Update payment status to completed
        await ctx.runMutation(internal.payments.updatePaymentStatus, {
          paymentId: args.paymentId,
          status: "completed",
        });

        return { success: true, posTransactionId: result.posTransactionId };
      } else {
        // Handle failure
        const currentAttempts = (payment.posSyncAttempts || 0) + 1;
        const maxRetries = config.syncRetryAttempts || 3;

        await ctx.runMutation(internal.payments.updatePaymentSyncStatus, {
          paymentId: args.paymentId,
          posSyncStatus: currentAttempts >= maxRetries ? "failed" : "pending",
          posErrorMessage: result.errorMessage,
          posSyncAttempts: currentAttempts,
        });

        // Schedule retry if retryable and under max attempts
        if (result.retryable && currentAttempts < maxRetries) {
          const delay = Math.pow(2, currentAttempts) * 60000; // Exponential backoff: 2, 4, 8 minutes
          await ctx.scheduler.runAfter(delay, internal.payments.syncPaymentToPOS, {
            paymentId: args.paymentId,
          });
        }

        return { success: false, error: result.errorMessage };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error(`[syncPaymentToPOS] Error:`, errorMessage);

      await ctx.runMutation(internal.payments.updatePaymentSyncStatus, {
        paymentId: args.paymentId,
        posSyncStatus: "failed",
        posErrorMessage: errorMessage,
        posSyncAttempts: (payment.posSyncAttempts || 0) + 1,
      });

      return { success: false, error: errorMessage };
    }
  },
});

// =============================================================================
// Internal Queries & Mutations (for actions)
// =============================================================================

export const getPaymentInternal = internalMutation({
  args: { paymentId: v.id("payments") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.paymentId);
  },
});

export const getOrderInternal = internalMutation({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.orderId);
  },
});

export const getPaymentConfigInternal = internalMutation({
  args: { dispensaryId: v.id("dispensaries") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("dispensaryPaymentConfig")
      .withIndex("by_dispensary", (q) => q.eq("dispensaryId", args.dispensaryId))
      .first();
  },
});

export const updatePaymentSyncStatus = internalMutation({
  args: {
    paymentId: v.id("payments"),
    posSyncStatus: v.string(),
    posTransactionId: v.optional(v.string()),
    posErrorMessage: v.optional(v.string()),
    posSyncAttempts: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, unknown> = {
      posSyncStatus: args.posSyncStatus,
      posSyncedAt: Date.now(),
    };

    if (args.posTransactionId !== undefined) {
      updates.posTransactionId = args.posTransactionId;
    }
    if (args.posErrorMessage !== undefined) {
      updates.posErrorMessage = args.posErrorMessage;
    }
    if (args.posSyncAttempts !== undefined) {
      updates.posSyncAttempts = args.posSyncAttempts;
    }
    if (args.completedAt !== undefined) {
      updates.completedAt = args.completedAt;
    }

    await ctx.db.patch(args.paymentId, updates);
  },
});

export const updatePaymentStatus = internalMutation({
  args: {
    paymentId: v.id("payments"),
    status: paymentStatusValidator,
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db.get(args.paymentId);
    if (!payment) return;

    await ctx.db.patch(args.paymentId, { status: args.status });

    // Also update order payment status
    await ctx.db.patch(payment.orderId, {
      paymentStatus: args.status,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Get payment config by POS location ID
 * Used by webhook handlers to find the correct dispensary config
 */
export const getPaymentConfigByLocationId = internalMutation({
  args: { posLocationId: v.string() },
  handler: async (ctx, args) => {
    // Get all configs and find by location ID
    // Note: In production, consider adding an index on posLocationId
    const configs = await ctx.db.query("dispensaryPaymentConfig").collect();
    return configs.find((c) => c.posLocationId === args.posLocationId) || null;
  },
});

/**
 * Handle incoming POS webhook
 * Updates payment status based on POS events
 */
export const handlePOSWebhook = internalMutation({
  args: {
    posProvider: v.string(),
    eventType: v.string(),
    posTransactionId: v.optional(v.string()),
    status: v.optional(v.string()),
    rawPayload: v.any(),
  },
  handler: async (ctx, args) => {
    if (!args.posTransactionId) {
      console.warn(`[handlePOSWebhook] No transaction ID in ${args.posProvider} webhook`);
      return { processed: false, reason: "No transaction ID" };
    }

    // Find payment by POS transaction ID
    const payments = await ctx.db
      .query("payments")
      .filter((q) => q.eq(q.field("posTransactionId"), args.posTransactionId))
      .collect();

    const payment = payments[0];

    if (!payment) {
      console.log(`[handlePOSWebhook] No payment found for POS transaction: ${args.posTransactionId}`);
      return { processed: false, reason: "Payment not found" };
    }

    const now = Date.now();

    // Map event types to payment status updates
    const eventStatusMap: Record<string, string> = {
      // Flowhub events
      "sale.completed": "completed",
      "sale.voided": "refunded",
      "sale.refunded": "refunded",
      // Generic events
      completed: "completed",
      voided: "refunded",
      refunded: "refunded",
      failed: "failed",
    };

    const newStatus = eventStatusMap[args.eventType];

    if (newStatus) {
      await ctx.db.patch(payment._id, {
        status: newStatus as "pending" | "processing" | "collected" | "completed" | "failed" | "refunded",
        posSyncStatus: "synced",
        posSyncedAt: now,
        metadata: {
          ...(payment.metadata as Record<string, unknown> || {}),
          lastWebhookEvent: args.eventType,
          lastWebhookAt: now,
        },
      });

      // Update order status
      await ctx.db.patch(payment.orderId, {
        paymentStatus: newStatus as "pending" | "processing" | "collected" | "completed" | "failed" | "refunded",
        updatedAt: now,
      });

      console.log(`[handlePOSWebhook] Updated payment ${payment._id} to status: ${newStatus}`);
      return { processed: true, newStatus };
    }

    // Log unhandled event types
    console.log(`[handlePOSWebhook] Unhandled event type: ${args.eventType}`);
    return { processed: false, reason: `Unhandled event type: ${args.eventType}` };
  },
});

// =============================================================================
// Payment Config Mutations
// =============================================================================

/**
 * Create or update dispensary payment configuration
 */
export const upsertPaymentConfig = mutation({
  args: {
    dispensaryId: v.id("dispensaries"),
    posProvider: v.string(),
    posApiKey: v.optional(v.string()),
    posLocationId: v.optional(v.string()),
    posWebhookSecret: v.optional(v.string()),
    supportedMethods: v.array(v.string()),
    defaultMethod: v.optional(v.string()),
    region: v.string(),
    taxRate: v.number(),
    requireIdVerification: v.boolean(),
    metrcEnabled: v.boolean(),
    tipPresets: v.optional(v.array(v.number())),
    tipEnabled: v.boolean(),
    syncMode: v.union(
      v.literal("realtime"),
      v.literal("batch"),
      v.literal("manual")
    ),
    syncRetryAttempts: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("dispensaryPaymentConfig")
      .withIndex("by_dispensary", (q) => q.eq("dispensaryId", args.dispensaryId))
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        updatedAt: now,
      });
      return { configId: existing._id, created: false };
    }

    const configId = await ctx.db.insert("dispensaryPaymentConfig", {
      ...args,
      createdAt: now,
    });

    return { configId, created: true };
  },
});

/**
 * Retry failed POS sync manually
 */
export const retrySync = mutation({
  args: { paymentId: v.id("payments") },
  handler: async (ctx, args) => {
    const payment = await ctx.db.get(args.paymentId);
    if (!payment) {
      throw new Error("Payment not found");
    }

    if (payment.posSyncStatus !== "failed" && payment.posSyncStatus !== "manual") {
      throw new Error(`Cannot retry sync with status: ${payment.posSyncStatus}`);
    }

    // Reset sync status and schedule
    await ctx.db.patch(args.paymentId, {
      posSyncStatus: "pending",
      posErrorMessage: undefined,
    });

    await ctx.scheduler.runAfter(0, internal.payments.syncPaymentToPOS, {
      paymentId: args.paymentId,
    });

    return { success: true };
  },
});
