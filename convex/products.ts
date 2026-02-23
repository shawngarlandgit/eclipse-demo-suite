import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireDispensaryAccess, requirePermission, requireAuth } from "./lib/auth";
import { checkRateLimit } from "./lib/rateLimit";

// ============================================================================
// PRODUCT CATEGORY TYPE
// ============================================================================

const productCategory = v.union(
  v.literal("flower"),
  v.literal("pre_roll"),
  v.literal("concentrate"),
  v.literal("edible"),
  v.literal("topical"),
  v.literal("tincture"),
  v.literal("vape"),
  v.literal("accessory")
);

// ============================================================================
// QUERIES
// ============================================================================

/**
 * List products with filtering and pagination
 * Real-time updates via Convex subscriptions
 */
export const list = query({
  args: {
    dispensaryId: v.id("dispensaries"),
    // Filters
    category: v.optional(productCategory),
    isActive: v.optional(v.boolean()),
    search: v.optional(v.string()),
    stockLevel: v.optional(
      v.union(v.literal("low"), v.literal("out"), v.literal("adequate"))
    ),
    brand: v.optional(v.string()),
    // Pagination
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify user has access to this dispensary
    await requireDispensaryAccess(ctx, args.dispensaryId);

    const limit = args.limit ?? 50;

    // Start with dispensary index
    let productsQuery = ctx.db
      .query("products")
      .withIndex("by_dispensary", (q) => q.eq("dispensaryId", args.dispensaryId));

    // Apply category filter if specified
    if (args.category) {
      productsQuery = productsQuery.filter((q) =>
        q.eq(q.field("category"), args.category)
      );
    }

    // Apply active filter if specified
    if (args.isActive !== undefined) {
      productsQuery = productsQuery.filter((q) =>
        q.eq(q.field("isActive"), args.isActive)
      );
    }

    // Apply brand filter if specified
    if (args.brand) {
      productsQuery = productsQuery.filter((q) =>
        q.eq(q.field("brand"), args.brand)
      );
    }

    // Collect all matching products
    let products = await productsQuery.collect();

    // Apply search filter (client-side for flexibility)
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.sku.toLowerCase().includes(searchLower) ||
          (p.brand && p.brand.toLowerCase().includes(searchLower)) ||
          (p.description && p.description.toLowerCase().includes(searchLower))
      );
    }

    // Apply stock level filter
    if (args.stockLevel) {
      products = products.filter((p) => {
        const qty = p.quantityOnHand ?? 0;
        const threshold = p.lowStockThreshold ?? 10;

        switch (args.stockLevel) {
          case "out":
            return qty === 0;
          case "low":
            return qty > 0 && qty <= threshold;
          case "adequate":
            return qty > threshold;
          default:
            return true;
        }
      });
    }

    // Sort by name
    products.sort((a, b) => a.name.localeCompare(b.name));

    // Apply pagination
    const total = products.length;
    const paginatedProducts = products.slice(0, limit);

    return {
      products: paginatedProducts,
      total,
      hasMore: total > limit,
    };
  },
});

/**
 * Get a single product by ID
 */
export const getById = query({
  args: {
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) {
      return null;
    }

    // Verify user has access to this product's dispensary
    await requireDispensaryAccess(ctx, product.dispensaryId);
    return product;
  },
});

/**
 * Get product by SKU within a dispensary
 */
export const getBySku = query({
  args: {
    dispensaryId: v.id("dispensaries"),
    sku: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify user has access to this dispensary
    await requireDispensaryAccess(ctx, args.dispensaryId);

    const product = await ctx.db
      .query("products")
      .withIndex("by_dispensary_sku", (q) =>
        q.eq("dispensaryId", args.dispensaryId).eq("sku", args.sku)
      )
      .first();

    return product;
  },
});

/**
 * Get all unique vendors/brands for a dispensary
 */
export const getVendors = query({
  args: {
    dispensaryId: v.id("dispensaries"),
  },
  handler: async (ctx, args) => {
    // Verify user has access to this dispensary
    await requireDispensaryAccess(ctx, args.dispensaryId);

    const products = await ctx.db
      .query("products")
      .withIndex("by_dispensary", (q) => q.eq("dispensaryId", args.dispensaryId))
      .collect();

    const vendors = new Set<string>();
    for (const product of products) {
      if (product.brand) {
        vendors.add(product.brand);
      }
    }

    return Array.from(vendors).sort();
  },
});

/**
 * Get inventory summary statistics
 */
export const getSummary = query({
  args: {
    dispensaryId: v.id("dispensaries"),
  },
  handler: async (ctx, args) => {
    // Verify user has access to this dispensary
    await requireDispensaryAccess(ctx, args.dispensaryId);

    const products = await ctx.db
      .query("products")
      .withIndex("by_dispensary", (q) => q.eq("dispensaryId", args.dispensaryId))
      .collect();

    const activeProducts = products.filter((p) => p.isActive !== false);

    // Calculate stats
    const totalProducts = products.length;
    const activeCount = activeProducts.length;
    const inactiveCount = totalProducts - activeCount;

    // Stock levels
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let adequateStockCount = 0;

    // Value calculations
    let totalCostValue = 0;
    let totalRetailValue = 0;
    let totalUnits = 0;

    // Category breakdown
    const categoryBreakdown: Record<string, number> = {};

    for (const product of activeProducts) {
      const qty = product.quantityOnHand ?? 0;
      const threshold = product.lowStockThreshold ?? 10;

      // Stock level categorization
      if (qty === 0) {
        outOfStockCount++;
      } else if (qty <= threshold) {
        lowStockCount++;
      } else {
        adequateStockCount++;
      }

      // Value calculations
      totalCostValue += product.costPrice * qty;
      totalRetailValue += product.retailPrice * qty;
      totalUnits += qty;

      // Category breakdown
      categoryBreakdown[product.category] =
        (categoryBreakdown[product.category] || 0) + 1;
    }

    return {
      total_products: totalProducts,
      active_products: activeCount,
      inactive_products: inactiveCount,
      low_stock_count: lowStockCount,
      out_of_stock_count: outOfStockCount,
      adequate_stock_count: adequateStockCount,
      total_cost_value: totalCostValue,
      total_retail_value: totalRetailValue,
      total_units: totalUnits,
      potential_margin: totalRetailValue - totalCostValue,
      category_breakdown: categoryBreakdown,
    };
  },
});

/**
 * Get products grouped by category
 */
export const getByCategory = query({
  args: {
    dispensaryId: v.id("dispensaries"),
  },
  handler: async (ctx, args) => {
    // Verify user has access to this dispensary
    await requireDispensaryAccess(ctx, args.dispensaryId);

    const products = await ctx.db
      .query("products")
      .withIndex("by_dispensary", (q) => q.eq("dispensaryId", args.dispensaryId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const grouped: Record<string, typeof products> = {};

    for (const product of products) {
      if (!grouped[product.category]) {
        grouped[product.category] = [];
      }
      grouped[product.category].push(product);
    }

    // Sort products within each category
    for (const category of Object.keys(grouped)) {
      grouped[category].sort((a, b) => a.name.localeCompare(b.name));
    }

    return grouped;
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new product
 */
export const create = mutation({
  args: {
    dispensaryId: v.id("dispensaries"),
    sku: v.string(),
    name: v.string(),
    category: productCategory,
    brand: v.optional(v.string()),
    description: v.optional(v.string()),
    thcPercentage: v.optional(v.number()),
    cbdPercentage: v.optional(v.number()),
    weightGrams: v.optional(v.number()),
    unitType: v.optional(v.string()),
    costPrice: v.number(),
    retailPrice: v.number(),
    quantityOnHand: v.optional(v.number()),
    lowStockThreshold: v.optional(v.number()),
    metrcId: v.optional(v.string()),
    batchNumber: v.optional(v.string()),
    labTestResults: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Require manage_inventory permission
    await requirePermission(ctx, "manage_inventory");
    await requireDispensaryAccess(ctx, args.dispensaryId);

    // Rate limit product creation (50 per minute)
    const user = await requireAuth(ctx);
    await checkRateLimit(ctx, user.clerkId, "createProduct");

    // Check for duplicate SKU
    const existingSku = await ctx.db
      .query("products")
      .withIndex("by_dispensary_sku", (q) =>
        q.eq("dispensaryId", args.dispensaryId).eq("sku", args.sku)
      )
      .first();

    if (existingSku) {
      throw new Error(`Product with SKU '${args.sku}' already exists`);
    }

    const productId = await ctx.db.insert("products", {
      dispensaryId: args.dispensaryId,
      sku: args.sku,
      name: args.name,
      category: args.category,
      brand: args.brand,
      description: args.description,
      thcPercentage: args.thcPercentage,
      cbdPercentage: args.cbdPercentage,
      weightGrams: args.weightGrams,
      unitType: args.unitType,
      costPrice: args.costPrice,
      retailPrice: args.retailPrice,
      quantityOnHand: args.quantityOnHand ?? 0,
      lowStockThreshold: args.lowStockThreshold ?? 10,
      metrcId: args.metrcId,
      batchNumber: args.batchNumber,
      labTestResults: args.labTestResults,
      isActive: true,
      createdAt: Date.now(),
    });

    return productId;
  },
});

/**
 * Update an existing product
 */
export const update = mutation({
  args: {
    productId: v.id("products"),
    name: v.optional(v.string()),
    category: v.optional(productCategory),
    brand: v.optional(v.string()),
    description: v.optional(v.string()),
    thcPercentage: v.optional(v.number()),
    cbdPercentage: v.optional(v.number()),
    weightGrams: v.optional(v.number()),
    unitType: v.optional(v.string()),
    costPrice: v.optional(v.number()),
    retailPrice: v.optional(v.number()),
    lowStockThreshold: v.optional(v.number()),
    metrcId: v.optional(v.string()),
    batchNumber: v.optional(v.string()),
    labTestResults: v.optional(v.any()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Require manage_inventory permission
    await requirePermission(ctx, "manage_inventory");

    // Rate limit product updates (100 per minute)
    const user = await requireAuth(ctx);
    await checkRateLimit(ctx, user.clerkId, "updateProduct");

    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Product not found");
    }

    // Verify user has access to this product's dispensary
    await requireDispensaryAccess(ctx, product.dispensaryId);

    // Build update object with only provided fields
    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updates.name = args.name;
    if (args.category !== undefined) updates.category = args.category;
    if (args.brand !== undefined) updates.brand = args.brand;
    if (args.description !== undefined) updates.description = args.description;
    if (args.thcPercentage !== undefined) updates.thcPercentage = args.thcPercentage;
    if (args.cbdPercentage !== undefined) updates.cbdPercentage = args.cbdPercentage;
    if (args.weightGrams !== undefined) updates.weightGrams = args.weightGrams;
    if (args.unitType !== undefined) updates.unitType = args.unitType;
    if (args.costPrice !== undefined) updates.costPrice = args.costPrice;
    if (args.retailPrice !== undefined) updates.retailPrice = args.retailPrice;
    if (args.lowStockThreshold !== undefined)
      updates.lowStockThreshold = args.lowStockThreshold;
    if (args.metrcId !== undefined) updates.metrcId = args.metrcId;
    if (args.batchNumber !== undefined) updates.batchNumber = args.batchNumber;
    if (args.labTestResults !== undefined) updates.labTestResults = args.labTestResults;
    if (args.isActive !== undefined) updates.isActive = args.isActive;

    await ctx.db.patch(args.productId, updates);
  },
});

/**
 * Adjust inventory quantity (for adjustments, receiving, etc.)
 */
export const adjustQuantity = mutation({
  args: {
    productId: v.id("products"),
    quantityChange: v.number(), // Positive for add, negative for subtract
    reason: v.string(), // sale, return, adjustment, receiving, damage, theft
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Require manage_inventory permission
    await requirePermission(ctx, "manage_inventory");

    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Product not found");
    }

    // Verify user has access to this product's dispensary
    await requireDispensaryAccess(ctx, product.dispensaryId);

    const currentQty = product.quantityOnHand ?? 0;
    const newQty = currentQty + args.quantityChange;

    if (newQty < 0) {
      throw new Error(
        `Insufficient inventory: current ${currentQty}, change ${args.quantityChange}`
      );
    }

    // Update product quantity
    await ctx.db.patch(args.productId, {
      quantityOnHand: newQty,
      lastRestockedAt: args.quantityChange > 0 ? Date.now() : product.lastRestockedAt,
      updatedAt: Date.now(),
    });

    // Create inventory snapshot for audit trail
    await ctx.db.insert("inventorySnapshots", {
      dispensaryId: product.dispensaryId,
      productId: args.productId,
      quantity: newQty,
      value: newQty * product.costPrice,
      snapshotType: args.reason,
      notes: args.notes,
      snapshotDate: new Date().toISOString().split("T")[0],
      createdAt: Date.now(),
    });

    return { previousQuantity: currentQty, newQuantity: newQty };
  },
});

/**
 * Bulk import products
 */
export const bulkImport = mutation({
  args: {
    dispensaryId: v.id("dispensaries"),
    products: v.array(
      v.object({
        sku: v.string(),
        name: v.string(),
        category: productCategory,
        brand: v.optional(v.string()),
        description: v.optional(v.string()),
        thcPercentage: v.optional(v.number()),
        cbdPercentage: v.optional(v.number()),
        weightGrams: v.optional(v.number()),
        unitType: v.optional(v.string()),
        costPrice: v.number(),
        retailPrice: v.number(),
        quantityOnHand: v.optional(v.number()),
        lowStockThreshold: v.optional(v.number()),
      })
    ),
    updateExisting: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Require manage_inventory permission
    await requirePermission(ctx, "manage_inventory");
    await requireDispensaryAccess(ctx, args.dispensaryId);

    // Rate limit bulk imports (5 per hour)
    const user = await requireAuth(ctx);
    await checkRateLimit(ctx, user.clerkId, "bulkImport");

    const results = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (const productData of args.products) {
      try {
        // Check if product already exists by SKU
        const existing = await ctx.db
          .query("products")
          .withIndex("by_dispensary_sku", (q) =>
            q.eq("dispensaryId", args.dispensaryId).eq("sku", productData.sku)
          )
          .first();

        if (existing) {
          if (args.updateExisting) {
            // Update existing product
            await ctx.db.patch(existing._id, {
              ...productData,
              updatedAt: Date.now(),
            });
            results.updated++;
          } else {
            results.skipped++;
          }
        } else {
          // Create new product
          await ctx.db.insert("products", {
            dispensaryId: args.dispensaryId,
            ...productData,
            quantityOnHand: productData.quantityOnHand ?? 0,
            lowStockThreshold: productData.lowStockThreshold ?? 10,
            isActive: true,
            createdAt: Date.now(),
          });
          results.created++;
        }
      } catch (error) {
        results.errors.push(
          `SKU ${productData.sku}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }

    return results;
  },
});

/**
 * Deactivate a product (soft delete)
 */
export const deactivate = mutation({
  args: {
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    // Require manage_inventory permission
    await requirePermission(ctx, "manage_inventory");

    // Rate limit product deletions (20 per minute)
    const user = await requireAuth(ctx);
    await checkRateLimit(ctx, user.clerkId, "deleteProduct");

    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Product not found");
    }

    // Verify user has access to this product's dispensary
    await requireDispensaryAccess(ctx, product.dispensaryId);

    await ctx.db.patch(args.productId, {
      isActive: false,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Reactivate a product
 */
export const reactivate = mutation({
  args: {
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    // Require manage_inventory permission
    await requirePermission(ctx, "manage_inventory");

    const product = await ctx.db.get(args.productId);
    if (!product) {
      throw new Error("Product not found");
    }

    // Verify user has access to this product's dispensary
    await requireDispensaryAccess(ctx, product.dispensaryId);

    await ctx.db.patch(args.productId, {
      isActive: true,
      updatedAt: Date.now(),
    });
  },
});
