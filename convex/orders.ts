import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ============================================================================
// CUSTOMER FUNCTIONS
// ============================================================================

/**
 * Create a new delivery order
 */
export const createOrder = mutation({
  args: {
    dispensaryId: v.id("dispensaries"),
    customerName: v.string(),
    customerPhone: v.optional(v.string()),
    customerEmail: v.optional(v.string()),
    items: v.array(v.object({
      productId: v.optional(v.string()),
      name: v.string(),
      category: v.optional(v.string()),
      quantity: v.number(),
      price: v.number(),
    })),
    subtotal: v.number(),
    tax: v.number(),
    total: v.number(),
    deliveryAddress: v.string(),
    deliveryNotes: v.optional(v.string()),
    pickupTime: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const orderId = await ctx.db.insert("orders", {
      dispensaryId: args.dispensaryId,
      customerName: args.customerName,
      customerPhone: args.customerPhone,
      customerEmail: args.customerEmail,
      items: args.items,
      subtotal: args.subtotal,
      tax: args.tax,
      total: args.total,
      deliveryAddress: args.deliveryAddress,
      deliveryNotes: args.deliveryNotes,
      pickupTime: args.pickupTime,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    return orderId;
  },
});

/**
 * List all orders (for patient app)
 * Returns recent orders sorted by creation time
 */
export const listOrders = query({
  args: {},
  handler: async (ctx) => {
    const orders = await ctx.db
      .query("orders")
      .order("desc")
      .take(50);
    return orders;
  },
});

/**
 * Get order by ID (for customer tracking)
 */
export const getOrder = query({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.orderId);
  },
});

/**
 * Get orders by customer email
 */
export const getCustomerOrders = query({
  args: { customerEmail: v.string() },
  handler: async (ctx, args) => {
    const orders = await ctx.db
      .query("orders")
      .filter((q) => q.eq(q.field("customerEmail"), args.customerEmail))
      .order("desc")
      .take(20);
    return orders;
  },
});

// ============================================================================
// DRIVER FUNCTIONS
// ============================================================================

/**
 * Driver login - find or create driver profile
 */
export const driverLogin = mutation({
  args: {
    driverId: v.string(),
    dispensaryId: v.id("dispensaries"),
  },
  handler: async (ctx, args) => {
    // Find existing driver
    const existingDriver = await ctx.db
      .query("drivers")
      .withIndex("by_driver_id", (q) => q.eq("driverId", args.driverId))
      .first();

    if (existingDriver) {
      // Update last login
      await ctx.db.patch(existingDriver._id, {
        lastLoginAt: Date.now(),
        updatedAt: Date.now(),
      });
      return existingDriver;
    }

    // Create new driver profile
    const now = Date.now();
    const newDriverId = await ctx.db.insert("drivers", {
      dispensaryId: args.dispensaryId,
      driverId: args.driverId,
      name: `Driver ${args.driverId}`,
      isOnline: false,
      isActive: true,
      completedDeliveries: 0,
      totalTips: 0,
      rating: 5.0,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
    });

    return await ctx.db.get(newDriverId);
  },
});

/**
 * Get driver profile by login ID
 */
export const getDriver = query({
  args: { driverId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("drivers")
      .withIndex("by_driver_id", (q) => q.eq("driverId", args.driverId))
      .first();
  },
});

/**
 * Toggle driver online status
 */
export const setDriverOnline = mutation({
  args: {
    driverId: v.string(),
    isOnline: v.boolean(),
  },
  handler: async (ctx, args) => {
    const driver = await ctx.db
      .query("drivers")
      .withIndex("by_driver_id", (q) => q.eq("driverId", args.driverId))
      .first();

    if (!driver) throw new Error("Driver not found");

    await ctx.db.patch(driver._id, {
      isOnline: args.isOnline,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Get pending orders for drivers (available to accept)
 */
export const getPendingOrders = query({
  args: { dispensaryId: v.id("dispensaries") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("orders")
      .withIndex("by_dispensary_status", (q) =>
        q.eq("dispensaryId", args.dispensaryId).eq("status", "pending")
      )
      .order("desc")
      .collect();
  },
});

/**
 * Get orders assigned to a specific driver
 */
export const getDriverOrders = query({
  args: { driverId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("orders")
      .withIndex("by_driver", (q) => q.eq("driverId", args.driverId))
      .order("desc")
      .collect();
  },
});

/**
 * Get active order for driver (accepted but not delivered)
 */
export const getDriverActiveOrder = query({
  args: { driverId: v.string() },
  handler: async (ctx, args) => {
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_driver", (q) => q.eq("driverId", args.driverId))
      .collect();

    // Find active order (accepted, picked_up, or en_route)
    return orders.find(o =>
      o.status === "accepted" ||
      o.status === "picked_up" ||
      o.status === "en_route"
    ) || null;
  },
});

/**
 * Driver accepts an order
 */
export const acceptOrder = mutation({
  args: {
    orderId: v.id("orders"),
    driverId: v.string(),
    driverName: v.string(),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");
    if (order.status !== "pending") throw new Error("Order already taken");

    const now = Date.now();
    await ctx.db.patch(args.orderId, {
      status: "accepted",
      driverId: args.driverId,
      driverName: args.driverName,
      acceptedAt: now,
      updatedAt: now,
      estimatedDeliveryTime: now + 30 * 60 * 1000, // 30 min estimate
    });

    return { success: true };
  },
});

/**
 * Update order status (driver workflow)
 */
export const updateOrderStatus = mutation({
  args: {
    orderId: v.id("orders"),
    status: v.string(),
    driverId: v.string(),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");
    if (order.driverId !== args.driverId) throw new Error("Not your order");

    const now = Date.now();
    const updates: any = {
      status: args.status,
      updatedAt: now,
    };

    // Add specific timestamps based on status
    if (args.status === "picked_up") {
      updates.pickedUpAt = now;
    } else if (args.status === "delivered") {
      updates.deliveredAt = now;

      // Update driver stats
      const driver = await ctx.db
        .query("drivers")
        .withIndex("by_driver_id", (q) => q.eq("driverId", args.driverId))
        .first();

      if (driver) {
        await ctx.db.patch(driver._id, {
          completedDeliveries: (driver.completedDeliveries || 0) + 1,
          updatedAt: now,
        });
      }
    }

    await ctx.db.patch(args.orderId, updates);
    return { success: true };
  },
});

/**
 * Complete delivery with optional tip
 */
export const completeDelivery = mutation({
  args: {
    orderId: v.id("orders"),
    driverId: v.string(),
    tipAmount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");
    if (order.driverId !== args.driverId) throw new Error("Not your order");

    const now = Date.now();

    // Update order
    await ctx.db.patch(args.orderId, {
      status: "delivered",
      deliveredAt: now,
      updatedAt: now,
      tipAmount: args.tipAmount,
    });

    // Update driver stats
    const driver = await ctx.db
      .query("drivers")
      .withIndex("by_driver_id", (q) => q.eq("driverId", args.driverId))
      .first();

    if (driver) {
      await ctx.db.patch(driver._id, {
        completedDeliveries: (driver.completedDeliveries || 0) + 1,
        totalTips: (driver.totalTips || 0) + (args.tipAmount || 0),
        updatedAt: now,
      });
    }

    return { success: true };
  },
});

// ============================================================================
// ADMIN DASHBOARD FUNCTIONS
// ============================================================================

/**
 * Get all orders for admin dashboard (with filters)
 */
export const getAllOrders = query({
  args: {
    dispensaryId: v.id("dispensaries"),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("orders")
      .withIndex("by_dispensary", (q) => q.eq("dispensaryId", args.dispensaryId));

    const orders = await query.order("desc").collect();

    // Filter by status if provided
    let filtered = args.status
      ? orders.filter(o => o.status === args.status)
      : orders;

    // Apply limit
    if (args.limit) {
      filtered = filtered.slice(0, args.limit);
    }

    return filtered;
  },
});

/**
 * Get delivery metrics for admin dashboard
 */
export const getDeliveryMetrics = query({
  args: { dispensaryId: v.id("dispensaries") },
  handler: async (ctx, args) => {
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_dispensary", (q) => q.eq("dispensaryId", args.dispensaryId))
      .collect();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();

    const todayOrders = orders.filter(o => o.createdAt >= todayStart);
    const pendingOrders = orders.filter(o => o.status === "pending");
    const activeOrders = orders.filter(o =>
      o.status === "accepted" || o.status === "picked_up" || o.status === "en_route"
    );
    const completedToday = todayOrders.filter(o => o.status === "delivered");

    const totalRevenue = completedToday.reduce((sum, o) => sum + o.total, 0);
    const totalTips = completedToday.reduce((sum, o) => sum + (o.tipAmount || 0), 0);

    // Get online drivers count
    const onlineDrivers = await ctx.db
      .query("drivers")
      .withIndex("by_dispensary_online", (q) =>
        q.eq("dispensaryId", args.dispensaryId).eq("isOnline", true)
      )
      .collect();

    return {
      totalOrdersToday: todayOrders.length,
      pendingOrders: pendingOrders.length,
      activeDeliveries: activeOrders.length,
      completedToday: completedToday.length,
      totalRevenue,
      totalTips,
      onlineDrivers: onlineDrivers.length,
      avgDeliveryTime: 25, // Mock for now
    };
  },
});

/**
 * Get all drivers for admin
 */
export const getAllDrivers = query({
  args: { dispensaryId: v.id("dispensaries") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("drivers")
      .withIndex("by_dispensary", (q) => q.eq("dispensaryId", args.dispensaryId))
      .collect();
  },
});

// ============================================================================
// SEED DATA
// ============================================================================

/**
 * Seed sample orders for testing
 */
export const seedOrders = mutation({
  args: { dispensaryId: v.id("dispensaries") },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Sample orders
    const sampleOrders = [
      {
        customerName: "Alice Smith",
        customerPhone: "(207) 555-0123",
        deliveryAddress: "123 Pine St, Howland, ME 04448",
        items: [
          { name: "Hazy's Happy Deal #1 - Hybrid", category: "Flower", quantity: 1, price: 45 },
          { name: "1000mg Apple Berry Gummies", category: "Edibles", quantity: 2, price: 30.15 },
        ],
        subtotal: 105.30,
        tax: 5.79,
        total: 111.09,
      },
      {
        customerName: "Bob Jones",
        customerPhone: "(207) 555-0456",
        deliveryAddress: "456 Maple Ave, Howland, ME 04448",
        items: [
          { name: "RSO Dart 3g", category: "Concentrates", quantity: 1, price: 60 },
        ],
        subtotal: 60,
        tax: 3.30,
        total: 63.30,
      },
      {
        customerName: "Carol White",
        customerPhone: "(207) 555-0789",
        deliveryAddress: "789 Oak Ln, Enfield, ME 04433",
        items: [
          { name: "Liquid Diamond Dual Tank 2g", category: "Vape", quantity: 1, price: 45 },
          { name: "2500mg Milk Chocolate Bar", category: "Edibles", quantity: 1, price: 42 },
          { name: "Hazy Moose Pre-Rolls 3pk", category: "Pre-rolls", quantity: 2, price: 10 },
        ],
        subtotal: 107,
        tax: 5.89,
        total: 112.89,
      },
    ];

    const orderIds = [];
    for (const order of sampleOrders) {
      const id = await ctx.db.insert("orders", {
        dispensaryId: args.dispensaryId,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        items: order.items,
        subtotal: order.subtotal,
        tax: order.tax,
        total: order.total,
        deliveryAddress: order.deliveryAddress,
        pickupTime: "ASAP",
        status: "pending",
        createdAt: now - Math.floor(Math.random() * 3600000), // Random time in last hour
        updatedAt: now,
      });
      orderIds.push(id);
    }

    // Create a sample driver
    await ctx.db.insert("drivers", {
      dispensaryId: args.dispensaryId,
      driverId: "DRV-001",
      name: "Shawn Garland",
      phone: "(207) 555-0001",
      isOnline: false,
      isActive: true,
      completedDeliveries: 12,
      totalTips: 45,
      rating: 4.9,
      createdAt: now,
      updatedAt: now,
    });

    return { orderIds, message: "Seeded 3 orders and 1 driver" };
  },
});
