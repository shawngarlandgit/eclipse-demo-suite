/**
 * Suppliers - CRUD operations for supplier/grower registry
 *
 * Handles creating, reading, updating suppliers that dispensaries
 * purchase from. Suppliers are shared across dispensaries but risk
 * profiles are per-dispensary.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

// ============================================================================
// TYPE VALIDATORS
// ============================================================================

const supplierLicenseType = v.union(
  v.literal("grower"),
  v.literal("caregiver"),
  v.literal("processor"),
  v.literal("distributor"),
  v.literal("manufacturer"),
  v.literal("other")
);

// ============================================================================
// QUERIES
// ============================================================================

/**
 * List all suppliers with optional filters.
 * Suppliers are global but enriched with dispensary-specific risk data.
 */
export const list = query({
  args: {
    dispensaryId: v.optional(v.id("dispensaries")),
    licenseType: v.optional(supplierLicenseType),
    isActive: v.optional(v.boolean()),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let suppliersQuery = ctx.db.query("suppliers");

    // Filter by license type
    if (args.licenseType) {
      suppliersQuery = suppliersQuery.withIndex("by_license_type", (q) =>
        q.eq("licenseType", args.licenseType!)
      );
    } else if (args.isActive !== undefined) {
      suppliersQuery = suppliersQuery.withIndex("by_active", (q) =>
        q.eq("isActive", args.isActive!)
      );
    }

    // Get suppliers
    const limit = args.limit ?? 50;
    const suppliers = await suppliersQuery.take(limit + 1);

    // Search filter (in-memory for now)
    let filtered = suppliers;
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      filtered = suppliers.filter(
        (s) =>
          s.name.toLowerCase().includes(searchLower) ||
          s.licenseNumber.toLowerCase().includes(searchLower)
      );
    }

    // If dispensaryId provided, enrich with risk profiles
    let enriched = filtered.slice(0, limit);
    if (args.dispensaryId) {
      enriched = await Promise.all(
        filtered.slice(0, limit).map(async (supplier) => {
          const riskProfile = await ctx.db
            .query("supplierRiskProfiles")
            .withIndex("by_supplier_dispensary", (q) =>
              q.eq("supplierId", supplier._id).eq("dispensaryId", args.dispensaryId!)
            )
            .first();

          return {
            ...supplier,
            riskProfile: riskProfile ?? null,
          };
        })
      );
    }

    return {
      suppliers: enriched,
      hasMore: suppliers.length > limit,
    };
  },
});

/**
 * Get a single supplier by ID.
 */
export const getById = query({
  args: {
    supplierId: v.id("suppliers"),
    dispensaryId: v.optional(v.id("dispensaries")),
  },
  handler: async (ctx, args) => {
    const supplier = await ctx.db.get(args.supplierId);
    if (!supplier) return null;

    // If dispensaryId provided, include risk profile and incidents
    if (args.dispensaryId) {
      const [riskProfile, recentIncidents] = await Promise.all([
        ctx.db
          .query("supplierRiskProfiles")
          .withIndex("by_supplier_dispensary", (q) =>
            q.eq("supplierId", supplier._id).eq("dispensaryId", args.dispensaryId!)
          )
          .first(),
        ctx.db
          .query("supplierIncidents")
          .withIndex("by_supplier_dispensary", (q) =>
            q.eq("supplierId", supplier._id).eq("dispensaryId", args.dispensaryId!)
          )
          .order("desc")
          .take(10),
      ]);

      return {
        ...supplier,
        riskProfile: riskProfile ?? null,
        recentIncidents,
      };
    }

    return supplier;
  },
});

/**
 * Get supplier by license number.
 */
export const getByLicense = query({
  args: {
    licenseNumber: v.string(),
    dispensaryId: v.optional(v.id("dispensaries")),
  },
  handler: async (ctx, args) => {
    const supplier = await ctx.db
      .query("suppliers")
      .withIndex("by_license", (q) => q.eq("licenseNumber", args.licenseNumber))
      .first();

    if (!supplier) return null;

    // Enrich with risk profile if dispensaryId provided
    if (args.dispensaryId) {
      const riskProfile = await ctx.db
        .query("supplierRiskProfiles")
        .withIndex("by_supplier_dispensary", (q) =>
          q.eq("supplierId", supplier._id).eq("dispensaryId", args.dispensaryId!)
        )
        .first();

      return {
        ...supplier,
        riskProfile: riskProfile ?? null,
      };
    }

    return supplier;
  },
});

/**
 * Search suppliers by name or license number.
 */
export const search = query({
  args: {
    query: v.string(),
    dispensaryId: v.optional(v.id("dispensaries")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const searchLower = args.query.toLowerCase();

    // Get all active suppliers (for search)
    const suppliers = await ctx.db
      .query("suppliers")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    // Filter by search query
    const matches = suppliers
      .filter(
        (s) =>
          s.name.toLowerCase().includes(searchLower) ||
          s.licenseNumber.toLowerCase().includes(searchLower) ||
          (s.city && s.city.toLowerCase().includes(searchLower))
      )
      .slice(0, limit);

    // Enrich with risk profiles if dispensaryId provided
    if (args.dispensaryId) {
      return Promise.all(
        matches.map(async (supplier) => {
          const riskProfile = await ctx.db
            .query("supplierRiskProfiles")
            .withIndex("by_supplier_dispensary", (q) =>
              q.eq("supplierId", supplier._id).eq("dispensaryId", args.dispensaryId!)
            )
            .first();

          return {
            ...supplier,
            riskProfile: riskProfile ?? null,
          };
        })
      );
    }

    return matches;
  },
});

/**
 * Get suppliers linked to products in a dispensary.
 */
export const getLinkedToProducts = query({
  args: {
    dispensaryId: v.id("dispensaries"),
  },
  handler: async (ctx, args) => {
    // Get all products with suppliers
    const products = await ctx.db
      .query("products")
      .withIndex("by_dispensary", (q) => q.eq("dispensaryId", args.dispensaryId))
      .collect();

    // Get unique supplier IDs
    const supplierIds = new Set<Id<"suppliers">>();
    for (const product of products) {
      if (product.supplierId) {
        supplierIds.add(product.supplierId);
      }
    }

    // Fetch suppliers with risk profiles
    const suppliers = await Promise.all(
      Array.from(supplierIds).map(async (supplierId) => {
        const [supplier, riskProfile, productCount] = await Promise.all([
          ctx.db.get(supplierId),
          ctx.db
            .query("supplierRiskProfiles")
            .withIndex("by_supplier_dispensary", (q) =>
              q.eq("supplierId", supplierId).eq("dispensaryId", args.dispensaryId)
            )
            .first(),
          ctx.db
            .query("products")
            .withIndex("by_supplier", (q) => q.eq("supplierId", supplierId))
            .collect()
            .then((p) => p.filter((pr) => pr.dispensaryId === args.dispensaryId).length),
        ]);

        if (!supplier) return null;

        return {
          ...supplier,
          riskProfile: riskProfile ?? null,
          productCount,
        };
      })
    );

    return suppliers.filter((s) => s !== null);
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new supplier.
 */
export const create = mutation({
  args: {
    name: v.string(),
    licenseNumber: v.string(),
    licenseType: supplierLicenseType,
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    website: v.optional(v.string()),
    notes: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if supplier with this license already exists
    const existing = await ctx.db
      .query("suppliers")
      .withIndex("by_license", (q) => q.eq("licenseNumber", args.licenseNumber))
      .first();

    if (existing) {
      throw new Error(`Supplier with license ${args.licenseNumber} already exists`);
    }

    const supplierId = await ctx.db.insert("suppliers", {
      name: args.name,
      licenseNumber: args.licenseNumber,
      licenseType: args.licenseType,
      address: args.address,
      city: args.city,
      state: args.state,
      contactEmail: args.contactEmail,
      contactPhone: args.contactPhone,
      website: args.website,
      notes: args.notes,
      metadata: args.metadata,
      firstSeenAt: now,
      isActive: true,
      createdAt: now,
    });

    return supplierId;
  },
});

/**
 * Create or get a supplier (upsert by license number).
 * Used when extracting suppliers from advisories.
 */
export const getOrCreate = mutation({
  args: {
    name: v.string(),
    licenseNumber: v.string(),
    licenseType: v.optional(supplierLicenseType),
  },
  handler: async (ctx, args) => {
    // Check if supplier exists
    const existing = await ctx.db
      .query("suppliers")
      .withIndex("by_license", (q) => q.eq("licenseNumber", args.licenseNumber))
      .first();

    if (existing) {
      // Update last activity
      await ctx.db.patch(existing._id, {
        lastActivityAt: Date.now(),
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    // Create new supplier
    const now = Date.now();
    const supplierId = await ctx.db.insert("suppliers", {
      name: args.name,
      licenseNumber: args.licenseNumber,
      licenseType: args.licenseType ?? "other",
      firstSeenAt: now,
      isActive: true,
      createdAt: now,
    });

    return supplierId;
  },
});

/**
 * Update supplier information.
 */
export const update = mutation({
  args: {
    supplierId: v.id("suppliers"),
    name: v.optional(v.string()),
    licenseType: v.optional(supplierLicenseType),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    website: v.optional(v.string()),
    notes: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { supplierId, ...updates } = args;

    // Remove undefined values
    const cleanUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        cleanUpdates[key] = value;
      }
    }

    if (Object.keys(cleanUpdates).length === 0) {
      return supplierId;
    }

    await ctx.db.patch(supplierId, {
      ...cleanUpdates,
      updatedAt: Date.now(),
    });

    return supplierId;
  },
});

/**
 * Link a supplier to an OCP advisory.
 * Creates an incident record for the supplier.
 */
export const linkToAdvisory = mutation({
  args: {
    supplierId: v.id("suppliers"),
    advisoryId: v.id("ocpAdvisories"),
    dispensaryId: v.id("dispensaries"),
    reportedBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const advisory = await ctx.db.get(args.advisoryId);
    if (!advisory) {
      throw new Error("Advisory not found");
    }

    const supplier = await ctx.db.get(args.supplierId);
    if (!supplier) {
      throw new Error("Supplier not found");
    }

    const now = Date.now();

    // Map advisory type to incident type
    const incidentTypeMap: Record<string, string> = {
      contamination: "contamination",
      recall: "recall",
      labeling: "labeling",
      safety_alert: "quality",
      other: "other",
    };

    const incidentType = incidentTypeMap[advisory.advisoryType] ?? "other";

    // Create supplier incident
    const incidentId = await ctx.db.insert("supplierIncidents", {
      supplierId: args.supplierId,
      advisoryId: args.advisoryId,
      dispensaryId: args.dispensaryId,
      incidentType: incidentType as "contamination" | "recall" | "labeling" | "quality" | "documentation" | "other",
      severity: advisory.severity,
      title: advisory.title,
      description: advisory.description,
      affectedBatches: advisory.affectedBatchNumbers,
      affectedProducts: advisory.affectedProducts,
      contaminants: advisory.contaminants,
      contaminantDetails: advisory.contaminantDetails,
      incidentDate: advisory.issuedAt,
      reportedAt: now,
      sourceType: "ocp_advisory",
      sourceReference: advisory.ocpAdvisoryId,
      reportedBy: args.reportedBy,
      createdAt: now,
    });

    // Update supplier last activity
    await ctx.db.patch(args.supplierId, {
      lastActivityAt: now,
      updatedAt: now,
    });

    return incidentId;
  },
});

/**
 * Deactivate a supplier.
 */
export const deactivate = mutation({
  args: {
    supplierId: v.id("suppliers"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.supplierId, {
      isActive: false,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Reactivate a supplier.
 */
export const reactivate = mutation({
  args: {
    supplierId: v.id("suppliers"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.supplierId, {
      isActive: true,
      updatedAt: Date.now(),
    });
  },
});
