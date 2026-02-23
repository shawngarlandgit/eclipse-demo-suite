import { query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { requireDispensaryAccess } from "./lib/auth";

// ============================================================================
// DASHBOARD KPIs
// ============================================================================

/**
 * Get dashboard KPIs for a dispensary
 * Real-time updates via Convex subscriptions
 */
export const getKPIs = query({
  args: {
    dispensaryId: v.id("dispensaries"),
  },
  handler: async (ctx, args) => {
    // Verify user has access to this dispensary
    await requireDispensaryAccess(ctx, args.dispensaryId);

    // Verify dispensary exists
    const dispensary = await ctx.db.get(args.dispensaryId);
    if (!dispensary) {
      throw new Error("Dispensary not found");
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const startOfDayMs = startOfDay.getTime();

    // Get today's transactions
    const todayTransactions = await ctx.db
      .query("transactions")
      .withIndex("by_dispensary_date", (q) =>
        q.eq("dispensaryId", args.dispensaryId).gte("transactionDate", startOfDayMs)
      )
      .collect();

    // Calculate revenue and transaction stats
    const salesTransactions = todayTransactions.filter(
      (t) => t.transactionType === "sale"
    );
    const revenueToday = salesTransactions.reduce(
      (sum, t) => sum + t.totalAmount,
      0
    );
    const transactionsToday = salesTransactions.length;
    const avgTransactionValue =
      transactionsToday > 0 ? revenueToday / transactionsToday : 0;

    // Get unique customers today
    const uniqueCustomerIds = Array.from(
      new Set(
        salesTransactions
          .filter((t) => t.customerId)
          .map((t) => t.customerId!.toString())
      )
    );

    // Batch fetch all customers at once (fixes N+1 query)
    const customers = await Promise.all(
      uniqueCustomerIds.map((id) => ctx.db.get(id as Id<"customers">))
    );

    // Count repeat customers
    const repeatCustomers = customers.filter(
      (customer) => customer && (customer.totalTransactions ?? 0) > 1
    ).length;

    const customersNewToday = uniqueCustomerIds.length - repeatCustomers;
    const customersRepeatPct =
      uniqueCustomerIds.length > 0
        ? (repeatCustomers / uniqueCustomerIds.length) * 100
        : 0;

    // Get low stock count
    const products = await ctx.db
      .query("products")
      .withIndex("by_dispensary", (q) => q.eq("dispensaryId", args.dispensaryId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const lowStockCount = products.filter(
      (p) => (p.quantityOnHand ?? 0) <= (p.lowStockThreshold ?? 10)
    ).length;

    // Get compliance flags count (unresolved)
    const complianceFlags = await ctx.db
      .query("complianceFlags")
      .withIndex("by_dispensary", (q) => q.eq("dispensaryId", args.dispensaryId))
      .filter((q) => q.eq(q.field("resolvedAt"), undefined))
      .collect();

    // Calculate yesterday's revenue for comparison
    const yesterday = new Date(startOfDay);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStart = yesterday.getTime();
    const yesterdayEnd = startOfDayMs;

    const yesterdayTransactions = await ctx.db
      .query("transactions")
      .withIndex("by_dispensary_date", (q) =>
        q
          .eq("dispensaryId", args.dispensaryId)
          .gte("transactionDate", yesterdayStart)
          .lt("transactionDate", yesterdayEnd)
      )
      .collect();

    const revenueYesterday = yesterdayTransactions
      .filter((t) => t.transactionType === "sale")
      .reduce((sum, t) => sum + t.totalAmount, 0);

    const revenueDelta =
      revenueYesterday > 0
        ? ((revenueToday - revenueYesterday) / revenueYesterday) * 100
        : revenueToday > 0
          ? 100
          : 0;

    return {
      revenue_today: revenueToday,
      revenue_delta: revenueDelta,
      transactions_today: transactionsToday,
      avg_transaction_value: avgTransactionValue,
      customers_new_today: customersNewToday,
      customers_repeat_pct: customersRepeatPct,
      low_stock_count: lowStockCount,
      compliance_flags: complianceFlags.length,
      total_products: products.length,
      active_products: products.filter((p) => p.isActive).length,
    };
  },
});

// ============================================================================
// TOP PRODUCTS
// ============================================================================

/**
 * Get top selling products for today
 */
export const getTopProducts = query({
  args: {
    dispensaryId: v.id("dispensaries"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Verify user has access to this dispensary
    await requireDispensaryAccess(ctx, args.dispensaryId);

    const limit = args.limit ?? 5;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const startOfDayMs = startOfDay.getTime();

    // Get today's sales transactions
    const todayTransactions = await ctx.db
      .query("transactions")
      .withIndex("by_dispensary_date", (q) =>
        q.eq("dispensaryId", args.dispensaryId).gte("transactionDate", startOfDayMs)
      )
      .filter((q) => q.eq(q.field("transactionType"), "sale"))
      .collect();

    // Batch fetch all transaction items at once (fixes N+1 query)
    const transactionIds = todayTransactions.map((t) => t._id);
    const allItemsArrays = await Promise.all(
      transactionIds.map((id) =>
        ctx.db
          .query("transactionItems")
          .withIndex("by_transaction", (q) => q.eq("transactionId", id))
          .collect()
      )
    );

    // Aggregate sales by product
    const productSales = new Map<
      string,
      { units: number; revenue: number; productId: string }
    >();

    for (const items of allItemsArrays) {
      for (const item of items) {
        const productIdStr = item.productId.toString();
        const existing = productSales.get(productIdStr) || {
          units: 0,
          revenue: 0,
          productId: productIdStr,
        };
        existing.units += item.quantity;
        existing.revenue += item.lineTotal;
        productSales.set(productIdStr, existing);
      }
    }

    // Sort by revenue and get top products
    const sortedProducts = Array.from(productSales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);

    // Batch fetch product details (fixes N+1 query)
    const products = await Promise.all(
      sortedProducts.map((sale) => ctx.db.get(sale.productId as Id<"products">))
    );

    // Build results with product details
    const results = sortedProducts
      .map((sale, index) => {
        const product = products[index];
        if (!product) return null;
        return {
          product_id: product._id,
          product_name: product.name,
          category: product.category,
          units_sold: sale.units,
          revenue: sale.revenue,
          current_stock: product.quantityOnHand ?? 0,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    return results;
  },
});

// ============================================================================
// SALES TRENDS
// ============================================================================

/**
 * Get sales trends for the past N days
 */
export const getSalesTrends = query({
  args: {
    dispensaryId: v.id("dispensaries"),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Verify user has access to this dispensary
    await requireDispensaryAccess(ctx, args.dispensaryId);

    const days = args.days ?? 7;
    const trends = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dayStart = date.getTime();

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      const dayEnd = nextDate.getTime();

      const transactions = await ctx.db
        .query("transactions")
        .withIndex("by_dispensary_date", (q) =>
          q
            .eq("dispensaryId", args.dispensaryId)
            .gte("transactionDate", dayStart)
            .lt("transactionDate", dayEnd)
        )
        .filter((q) => q.eq(q.field("transactionType"), "sale"))
        .collect();

      const revenue = transactions.reduce((sum, t) => sum + t.totalAmount, 0);
      const transactionCount = transactions.length;

      trends.push({
        date: date.toISOString().split("T")[0],
        revenue,
        transactions: transactionCount,
      });
    }

    return trends;
  },
});

// ============================================================================
// LOW STOCK PRODUCTS
// ============================================================================

/**
 * Get products that are low on stock
 */
export const getLowStockProducts = query({
  args: {
    dispensaryId: v.id("dispensaries"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Verify user has access to this dispensary
    await requireDispensaryAccess(ctx, args.dispensaryId);

    const limit = args.limit ?? 10;

    const products = await ctx.db
      .query("products")
      .withIndex("by_dispensary", (q) => q.eq("dispensaryId", args.dispensaryId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Filter and sort by how far below threshold
    const lowStockProducts = products
      .filter((p) => (p.quantityOnHand ?? 0) <= (p.lowStockThreshold ?? 10))
      .sort(
        (a, b) =>
          (a.quantityOnHand ?? 0) -
          (a.lowStockThreshold ?? 10) -
          ((b.quantityOnHand ?? 0) - (b.lowStockThreshold ?? 10))
      )
      .slice(0, limit);

    return lowStockProducts.map((p) => ({
      product_id: p._id,
      product_name: p.name,
      category: p.category,
      quantity_on_hand: p.quantityOnHand ?? 0,
      low_stock_threshold: p.lowStockThreshold ?? 10,
      sku: p.sku,
    }));
  },
});
