import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { requireDispensaryAccess, requireAuth, requirePermission } from "./lib/auth";

// ============================================================================
// TRANSACTION TYPE
// ============================================================================

const transactionType = v.union(
  v.literal("sale"),
  v.literal("return"),
  v.literal("void"),
  v.literal("adjustment")
);

// ============================================================================
// QUERIES
// ============================================================================

/**
 * List transactions with filtering and pagination
 * Real-time updates via Convex subscriptions
 */
export const list = query({
  args: {
    dispensaryId: v.id("dispensaries"),
    // Filters
    transactionType: v.optional(transactionType),
    customerId: v.optional(v.id("customers")),
    processedBy: v.optional(v.id("users")),
    startDate: v.optional(v.number()), // Unix ms
    endDate: v.optional(v.number()), // Unix ms
    minAmount: v.optional(v.number()),
    maxAmount: v.optional(v.number()),
    // Pagination
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireDispensaryAccess(ctx, args.dispensaryId);

    const limit = args.limit ?? 50;

    // Build query with appropriate index
    let transactionsQuery;

    if (args.startDate || args.endDate) {
      // Use date index for date range queries
      const startDate = args.startDate ?? 0;
      const endDate = args.endDate ?? Date.now();

      transactionsQuery = ctx.db
        .query("transactions")
        .withIndex("by_dispensary_date", (q) =>
          q
            .eq("dispensaryId", args.dispensaryId)
            .gte("transactionDate", startDate)
            .lte("transactionDate", endDate)
        );
    } else {
      transactionsQuery = ctx.db
        .query("transactions")
        .withIndex("by_dispensary", (q) => q.eq("dispensaryId", args.dispensaryId));
    }

    // Apply type filter
    if (args.transactionType) {
      transactionsQuery = transactionsQuery.filter((q) =>
        q.eq(q.field("transactionType"), args.transactionType)
      );
    }

    // Apply customer filter
    if (args.customerId) {
      transactionsQuery = transactionsQuery.filter((q) =>
        q.eq(q.field("customerId"), args.customerId)
      );
    }

    // Apply processedBy filter
    if (args.processedBy) {
      transactionsQuery = transactionsQuery.filter((q) =>
        q.eq(q.field("processedBy"), args.processedBy)
      );
    }

    // Collect and apply remaining filters
    let transactions = await transactionsQuery.collect();

    // Apply amount filters
    if (args.minAmount !== undefined) {
      transactions = transactions.filter((t) => t.totalAmount >= args.minAmount!);
    }
    if (args.maxAmount !== undefined) {
      transactions = transactions.filter((t) => t.totalAmount <= args.maxAmount!);
    }

    // Sort by date descending (most recent first)
    transactions.sort((a, b) => b.transactionDate - a.transactionDate);

    // Apply pagination
    const total = transactions.length;
    const paginatedTransactions = transactions.slice(0, limit);

    return {
      transactions: paginatedTransactions,
      total,
      hasMore: total > limit,
    };
  },
});

/**
 * Get a single transaction by ID with line items
 */
export const getById = query({
  args: {
    transactionId: v.id("transactions"),
  },
  handler: async (ctx, args) => {
    const transaction = await ctx.db.get(args.transactionId);
    if (!transaction) {
      return null;
    }

    await requireDispensaryAccess(ctx, transaction.dispensaryId);

    // Get line items
    const items = await ctx.db
      .query("transactionItems")
      .withIndex("by_transaction", (q) => q.eq("transactionId", args.transactionId))
      .collect();

    // Get customer if present
    let customer = null;
    if (transaction.customerId) {
      customer = await ctx.db.get(transaction.customerId);
    }

    // Get processor info
    let processedByUser = null;
    if (transaction.processedBy) {
      processedByUser = await ctx.db.get(transaction.processedBy);
    }

    return {
      ...transaction,
      items,
      customer,
      processedByUser: processedByUser
        ? { _id: processedByUser._id, fullName: processedByUser.fullName }
        : null,
    };
  },
});

/**
 * Get transactions for a specific customer
 */
export const getByCustomer = query({
  args: {
    customerId: v.id("customers"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const customer = await ctx.db.get(args.customerId);
    if (!customer) {
      throw new Error("Customer not found");
    }

    await requireDispensaryAccess(ctx, customer.dispensaryId);

    const limit = args.limit ?? 20;

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_customer", (q) => q.eq("customerId", args.customerId))
      .order("desc")
      .take(limit);

    return transactions;
  },
});

/**
 * Get today's transactions summary
 */
export const getTodaySummary = query({
  args: {
    dispensaryId: v.id("dispensaries"),
  },
  handler: async (ctx, args) => {
    await requireDispensaryAccess(ctx, args.dispensaryId);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const startOfDayMs = startOfDay.getTime();

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_dispensary_date", (q) =>
        q.eq("dispensaryId", args.dispensaryId).gte("transactionDate", startOfDayMs)
      )
      .collect();

    // Calculate totals by type
    const sales = transactions.filter((t) => t.transactionType === "sale");
    const returns = transactions.filter((t) => t.transactionType === "return");
    const voids = transactions.filter((t) => t.transactionType === "void");

    const salesTotal = sales.reduce((sum, t) => sum + t.totalAmount, 0);
    const returnsTotal = returns.reduce((sum, t) => sum + t.totalAmount, 0);
    const voidsTotal = voids.reduce((sum, t) => sum + t.totalAmount, 0);

    // Net revenue
    const netRevenue = salesTotal - returnsTotal;

    // Average transaction value
    const avgTransactionValue = sales.length > 0 ? salesTotal / sales.length : 0;

    // Payment method breakdown
    const paymentMethods: Record<string, number> = {};
    for (const sale of sales) {
      const method = sale.paymentMethod ?? "unknown";
      paymentMethods[method] = (paymentMethods[method] || 0) + sale.totalAmount;
    }

    return {
      total_transactions: transactions.length,
      sales_count: sales.length,
      returns_count: returns.length,
      voids_count: voids.length,
      sales_total: salesTotal,
      returns_total: returnsTotal,
      voids_total: voidsTotal,
      net_revenue: netRevenue,
      avg_transaction_value: avgTransactionValue,
      payment_methods: paymentMethods,
    };
  },
});

/**
 * Get hourly sales breakdown for today
 */
export const getHourlySales = query({
  args: {
    dispensaryId: v.id("dispensaries"),
  },
  handler: async (ctx, args) => {
    await requireDispensaryAccess(ctx, args.dispensaryId);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const startOfDayMs = startOfDay.getTime();

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_dispensary_date", (q) =>
        q.eq("dispensaryId", args.dispensaryId).gte("transactionDate", startOfDayMs)
      )
      .filter((q) => q.eq(q.field("transactionType"), "sale"))
      .collect();

    // Group by hour
    const hourlyData: Record<number, { count: number; revenue: number }> = {};

    for (let hour = 0; hour < 24; hour++) {
      hourlyData[hour] = { count: 0, revenue: 0 };
    }

    for (const transaction of transactions) {
      const hour = new Date(transaction.transactionDate).getHours();
      hourlyData[hour].count++;
      hourlyData[hour].revenue += transaction.totalAmount;
    }

    return Object.entries(hourlyData).map(([hour, data]) => ({
      hour: parseInt(hour),
      count: data.count,
      revenue: data.revenue,
    }));
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Generate a unique transaction number
 */
function generateTransactionNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().split("T")[0].replace(/-/g, "");
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TXN-${dateStr}-${random}`;
}

/**
 * Create a new sale transaction
 */
export const createSale = mutation({
  args: {
    dispensaryId: v.id("dispensaries"),
    customerId: v.optional(v.id("customers")),
    items: v.array(
      v.object({
        productId: v.id("products"),
        quantity: v.number(),
        unitPrice: v.number(),
        discountAmount: v.optional(v.number()),
      })
    ),
    paymentMethod: v.optional(v.string()),
    discountAmount: v.optional(v.number()),
    taxRate: v.optional(v.number()), // Override dispensary default
    notes: v.optional(v.string()),
    posTerminalId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    await requireDispensaryAccess(ctx, args.dispensaryId);

    if (args.items.length === 0) {
      throw new Error("Transaction must have at least one item");
    }

    // Get dispensary for tax rate
    const dispensary = await ctx.db.get(args.dispensaryId);
    if (!dispensary) {
      throw new Error("Dispensary not found");
    }

    const taxRate = args.taxRate ?? dispensary.taxRate ?? 0.0875; // Default 8.75%

    // Calculate totals and validate inventory
    let subtotal = 0;
    const transactionItems: Array<{
      productId: typeof args.items[0]["productId"];
      quantity: number;
      unitPrice: number;
      discountAmount: number;
      lineTotal: number;
      productSnapshot: Record<string, unknown>;
    }> = [];

    for (const item of args.items) {
      const product = await ctx.db.get(item.productId);
      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }
      if (product.dispensaryId !== args.dispensaryId) {
        throw new Error(`Product ${item.productId} belongs to another dispensary`);
      }
      if (!product.isActive) {
        throw new Error(`Product ${product.name} is inactive`);
      }

      const currentQty = product.quantityOnHand ?? 0;
      if (currentQty < item.quantity) {
        throw new Error(
          `Insufficient inventory for ${product.name}: available ${currentQty}, requested ${item.quantity}`
        );
      }

      const itemDiscount = item.discountAmount ?? 0;
      const lineTotal = item.quantity * item.unitPrice - itemDiscount;
      subtotal += lineTotal;

      transactionItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountAmount: itemDiscount,
        lineTotal,
        productSnapshot: {
          sku: product.sku,
          name: product.name,
          category: product.category,
          thcPercentage: product.thcPercentage,
          cbdPercentage: product.cbdPercentage,
        },
      });
    }

    // Calculate final amounts
    const transactionDiscount = args.discountAmount ?? 0;
    const taxableAmount = subtotal - transactionDiscount;
    const taxAmount = taxableAmount * taxRate;
    const totalAmount = taxableAmount + taxAmount;

    // Create transaction
    const transactionId = await ctx.db.insert("transactions", {
      dispensaryId: args.dispensaryId,
      customerId: args.customerId,
      transactionNumber: generateTransactionNumber(),
      transactionType: "sale",
      subtotal,
      taxAmount,
      discountAmount: transactionDiscount,
      totalAmount,
      paymentMethod: args.paymentMethod,
      processedBy: user._id,
      posTerminalId: args.posTerminalId,
      notes: args.notes,
      transactionDate: Date.now(),
      createdAt: Date.now(),
    });

    // Create transaction items and update inventory
    for (const item of transactionItems) {
      await ctx.db.insert("transactionItems", {
        transactionId,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountAmount: item.discountAmount,
        lineTotal: item.lineTotal,
        productSnapshot: item.productSnapshot,
        createdAt: Date.now(),
      });

      // Decrease inventory
      const product = await ctx.db.get(item.productId);
      if (product) {
        const newQty = (product.quantityOnHand ?? 0) - item.quantity;
        await ctx.db.patch(item.productId, {
          quantityOnHand: newQty,
          updatedAt: Date.now(),
        });

        // Create inventory snapshot
        await ctx.db.insert("inventorySnapshots", {
          dispensaryId: args.dispensaryId,
          productId: item.productId,
          quantity: newQty,
          value: newQty * product.costPrice,
          snapshotType: "sale",
          notes: `Sale transaction ${transactionId}`,
          snapshotDate: new Date().toISOString().split("T")[0],
          createdAt: Date.now(),
        });
      }
    }

    // Update customer stats if present
    if (args.customerId) {
      const customer = await ctx.db.get(args.customerId);
      if (customer) {
        await ctx.db.patch(args.customerId, {
          totalPurchases: (customer.totalPurchases ?? 0) + totalAmount,
          totalTransactions: (customer.totalTransactions ?? 0) + 1,
          lastPurchaseAt: Date.now(),
          firstPurchaseAt: customer.firstPurchaseAt ?? Date.now(),
          updatedAt: Date.now(),
        });
      }
    }

    return { transactionId, transactionNumber: generateTransactionNumber(), totalAmount };
  },
});

/**
 * Process a return
 */
export const createReturn = mutation({
  args: {
    originalTransactionId: v.id("transactions"),
    items: v.array(
      v.object({
        transactionItemId: v.id("transactionItems"),
        quantity: v.number(), // Quantity to return
        reason: v.string(),
      })
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    // Get original transaction
    const originalTransaction = await ctx.db.get(args.originalTransactionId);
    if (!originalTransaction) {
      throw new Error("Original transaction not found");
    }

    await requireDispensaryAccess(ctx, originalTransaction.dispensaryId);

    if (originalTransaction.transactionType !== "sale") {
      throw new Error("Can only return sale transactions");
    }

    // Process return items
    let returnTotal = 0;
    const returnItems: Array<{
      productId: Id<"products">;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
      productSnapshot: Record<string, unknown>;
    }> = [];

    for (const returnItem of args.items) {
      const originalItem = await ctx.db.get(returnItem.transactionItemId);
      if (!originalItem) {
        throw new Error(`Transaction item ${returnItem.transactionItemId} not found`);
      }
      if (originalItem.transactionId !== args.originalTransactionId) {
        throw new Error("Item does not belong to the specified transaction");
      }
      if (returnItem.quantity > originalItem.quantity) {
        throw new Error(
          `Return quantity (${returnItem.quantity}) exceeds original quantity (${originalItem.quantity})`
        );
      }

      const lineTotal =
        returnItem.quantity * originalItem.unitPrice -
        (originalItem.discountAmount ?? 0) * (returnItem.quantity / originalItem.quantity);
      returnTotal += lineTotal;

      returnItems.push({
        productId: originalItem.productId,
        quantity: returnItem.quantity,
        unitPrice: originalItem.unitPrice,
        lineTotal,
        productSnapshot: originalItem.productSnapshot,
      });
    }

    // Calculate return tax (proportional)
    const taxRate =
      originalTransaction.subtotal > 0
        ? originalTransaction.taxAmount / originalTransaction.subtotal
        : 0;
    const returnTax = returnTotal * taxRate;
    const totalReturn = returnTotal + returnTax;

    // Create return transaction
    const returnTransactionId = await ctx.db.insert("transactions", {
      dispensaryId: originalTransaction.dispensaryId,
      customerId: originalTransaction.customerId,
      transactionNumber: generateTransactionNumber(),
      transactionType: "return",
      subtotal: returnTotal,
      taxAmount: returnTax,
      discountAmount: 0,
      totalAmount: totalReturn,
      processedBy: user._id,
      notes: args.notes,
      metadata: { originalTransactionId: args.originalTransactionId },
      transactionDate: Date.now(),
      createdAt: Date.now(),
    });

    // Create return items and restore inventory
    for (const item of returnItems) {
      await ctx.db.insert("transactionItems", {
        transactionId: returnTransactionId,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
        productSnapshot: item.productSnapshot,
        createdAt: Date.now(),
      });

      // Restore inventory
      const product = await ctx.db.get(item.productId);
      if (product) {
        const newQty = (product.quantityOnHand ?? 0) + item.quantity;
        await ctx.db.patch(item.productId, {
          quantityOnHand: newQty,
          updatedAt: Date.now(),
        });

        // Create inventory snapshot
        await ctx.db.insert("inventorySnapshots", {
          dispensaryId: originalTransaction.dispensaryId,
          productId: item.productId,
          quantity: newQty,
          value: newQty * product.costPrice,
          snapshotType: "return",
          notes: `Return transaction ${returnTransactionId}`,
          snapshotDate: new Date().toISOString().split("T")[0],
          createdAt: Date.now(),
        });
      }
    }

    // Update customer stats if present
    if (originalTransaction.customerId) {
      const customer = await ctx.db.get(originalTransaction.customerId);
      if (customer) {
        await ctx.db.patch(originalTransaction.customerId, {
          totalPurchases: Math.max(0, (customer.totalPurchases ?? 0) - totalReturn),
          updatedAt: Date.now(),
        });
      }
    }

    return { transactionId: returnTransactionId, totalReturn };
  },
});

/**
 * Void a transaction (manager+ only)
 */
export const voidTransaction = mutation({
  args: {
    transactionId: v.id("transactions"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    await requirePermission(ctx, "manage_inventory");
    const user = await requireAuth(ctx);

    const transaction = await ctx.db.get(args.transactionId);
    if (!transaction) {
      throw new Error("Transaction not found");
    }

    await requireDispensaryAccess(ctx, transaction.dispensaryId);

    if (transaction.transactionType === "void") {
      throw new Error("Transaction is already voided");
    }

    // Get transaction items
    const items = await ctx.db
      .query("transactionItems")
      .withIndex("by_transaction", (q) => q.eq("transactionId", args.transactionId))
      .collect();

    // Restore inventory if this was a sale
    if (transaction.transactionType === "sale") {
      for (const item of items) {
        const product = await ctx.db.get(item.productId);
        if (product) {
          const newQty = (product.quantityOnHand ?? 0) + item.quantity;
          await ctx.db.patch(item.productId, {
            quantityOnHand: newQty,
            updatedAt: Date.now(),
          });

          // Create inventory snapshot
          await ctx.db.insert("inventorySnapshots", {
            dispensaryId: transaction.dispensaryId,
            productId: item.productId,
            quantity: newQty,
            value: newQty * product.costPrice,
            snapshotType: "void",
            notes: `Void of transaction ${args.transactionId}: ${args.reason}`,
            snapshotDate: new Date().toISOString().split("T")[0],
            createdAt: Date.now(),
          });
        }
      }

      // Reverse customer stats
      if (transaction.customerId) {
        const customer = await ctx.db.get(transaction.customerId);
        if (customer) {
          await ctx.db.patch(transaction.customerId, {
            totalPurchases: Math.max(0, (customer.totalPurchases ?? 0) - transaction.totalAmount),
            totalTransactions: Math.max(0, (customer.totalTransactions ?? 0) - 1),
            updatedAt: Date.now(),
          });
        }
      }
    }

    // Create void transaction record
    const voidTransactionId = await ctx.db.insert("transactions", {
      dispensaryId: transaction.dispensaryId,
      customerId: transaction.customerId,
      transactionNumber: generateTransactionNumber(),
      transactionType: "void",
      subtotal: -transaction.subtotal,
      taxAmount: -transaction.taxAmount,
      discountAmount: transaction.discountAmount,
      totalAmount: -transaction.totalAmount,
      processedBy: user._id,
      notes: args.reason,
      metadata: { voidedTransactionId: args.transactionId },
      transactionDate: Date.now(),
      createdAt: Date.now(),
    });

    return { voidTransactionId };
  },
});
