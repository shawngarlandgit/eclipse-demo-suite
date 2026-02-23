import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// ============================================================================
// ENUM VALIDATORS
// ============================================================================

const userRole = v.union(
  v.literal("staff"),
  v.literal("manager"),
  v.literal("owner"),
  v.literal("admin")
);

const complianceStatus = v.union(
  v.literal("compliant"),
  v.literal("warning"),
  v.literal("violation"),
  v.literal("resolved")
);

const transactionType = v.union(
  v.literal("sale"),
  v.literal("return"),
  v.literal("void"),
  v.literal("adjustment")
);

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

const integrationStatus = v.union(
  v.literal("active"),
  v.literal("inactive"),
  v.literal("error"),
  v.literal("syncing")
);

const reportType = v.union(
  v.literal("daily_sales"),
  v.literal("inventory"),
  v.literal("compliance"),
  v.literal("audit"),
  v.literal("custom")
);

const reportStatus = v.union(
  v.literal("pending"),
  v.literal("processing"),
  v.literal("completed"),
  v.literal("failed")
);

// Payment enums
const paymentMethod = v.union(
  v.literal("cash"),
  v.literal("debit"),
  v.literal("ach"),
  v.literal("mobile_pay")
);

const paymentStatus = v.union(
  v.literal("pending"),
  v.literal("processing"),
  v.literal("collected"),
  v.literal("completed"),
  v.literal("failed"),
  v.literal("refunded")
);

const posSyncStatus = v.union(
  v.literal("pending"),
  v.literal("syncing"),
  v.literal("synced"),
  v.literal("failed"),
  v.literal("manual")
);

const syncMode = v.union(
  v.literal("realtime"),
  v.literal("batch"),
  v.literal("manual")
);

const payoutStatus = v.union(
  v.literal("pending"),
  v.literal("processed"),
  v.literal("paid")
);

// OCP Advisory enums
const advisorySeverity = v.union(
  v.literal("critical"),
  v.literal("high"),
  v.literal("medium"),
  v.literal("low")
);

const advisoryStatus = v.union(
  v.literal("active"),
  v.literal("resolved"),
  v.literal("expired"),
  v.literal("dismissed")
);

const advisoryType = v.union(
  v.literal("recall"),
  v.literal("safety_alert"),
  v.literal("contamination"),
  v.literal("labeling"),
  v.literal("other")
);

const productComplianceStatus = v.union(
  v.literal("clear"),
  v.literal("flagged"),
  v.literal("locked"),
  v.literal("under_review")
);

const matchStatus = v.union(
  v.literal("pending"),
  v.literal("confirmed"),
  v.literal("resolved"),
  v.literal("false_positive")
);

const notificationChannel = v.union(
  v.literal("email"),
  v.literal("in_app"),
  v.literal("sms")
);

const notificationStatus = v.union(
  v.literal("pending"),
  v.literal("sent"),
  v.literal("delivered"),
  v.literal("failed")
);

const resolutionAction = v.union(
  v.literal("removed_from_sale"),
  v.literal("returned_to_supplier"),
  v.literal("destroyed"),
  v.literal("quarantined"),
  v.literal("cleared_after_test"),
  v.literal("false_positive_confirmed"),
  v.literal("other")
);

// Supplier Risk enums
const supplierLicenseType = v.union(
  v.literal("grower"),
  v.literal("caregiver"),
  v.literal("processor"),
  v.literal("distributor"),
  v.literal("manufacturer"),
  v.literal("other")
);

const riskTier = v.union(
  v.literal("low"),
  v.literal("medium"),
  v.literal("high"),
  v.literal("critical")
);

const riskTrend = v.union(
  v.literal("improving"),
  v.literal("stable"),
  v.literal("worsening")
);

const incidentType = v.union(
  v.literal("contamination"),
  v.literal("recall"),
  v.literal("labeling"),
  v.literal("quality"),
  v.literal("documentation"),
  v.literal("other")
);

// ============================================================================
// SCHEMA DEFINITION
// ============================================================================

export default defineSchema({
  // -------------------------------------------------------------------------
  // DISPENSARIES - Multi-tenant organizations
  // -------------------------------------------------------------------------
  dispensaries: defineTable({
    // Core fields
    name: v.string(),
    licenseNumber: v.string(),

    // Contact
    email: v.string(),
    phone: v.optional(v.string()),

    // Address
    addressLine1: v.string(),
    addressLine2: v.optional(v.string()),
    city: v.string(),
    state: v.string(), // 2-letter code
    zipCode: v.string(),

    // Business
    timezone: v.optional(v.string()), // Default: America/Los_Angeles
    taxRate: v.optional(v.number()), // 0.0000 - 1.0000

    // Settings (flexible JSON)
    settings: v.optional(v.any()),

    // Status
    isActive: v.optional(v.boolean()), // Default: true

    // Migration tracking
    supabaseId: v.optional(v.string()),

    // Timestamps (Unix ms)
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_license", ["licenseNumber"])
    .index("by_active", ["isActive"])
    .index("by_supabase_id", ["supabaseId"]),

  // -------------------------------------------------------------------------
  // USERS - Linked to Clerk auth
  // -------------------------------------------------------------------------
  users: defineTable({
    // Clerk integration
    clerkId: v.string(), // Clerk user ID

    // Tenant
    dispensaryId: v.id("dispensaries"),

    // Profile
    email: v.string(),
    fullName: v.string(),
    avatarUrl: v.optional(v.string()),

    // Role & Permissions
    role: userRole,
    permissions: v.optional(v.any()), // JSON: { view_dashboard, manage_inventory, etc. }

    // Employment
    employeeId: v.optional(v.string()),
    hireDate: v.optional(v.string()), // ISO date string

    // Status
    isActive: v.optional(v.boolean()),
    lastLoginAt: v.optional(v.number()),

    // Migration
    supabaseId: v.optional(v.string()),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_dispensary", ["dispensaryId"])
    .index("by_email", ["email"])
    .index("by_role", ["role"])
    .index("by_dispensary_role", ["dispensaryId", "role"])
    .index("by_supabase_id", ["supabaseId"]),

  // -------------------------------------------------------------------------
  // PRODUCTS - Cannabis inventory
  // -------------------------------------------------------------------------
  products: defineTable({
    dispensaryId: v.id("dispensaries"),

    // Product info
    sku: v.string(),
    name: v.string(),
    category: productCategory,
    brand: v.optional(v.string()),
    description: v.optional(v.string()),

    // Cannabis-specific
    thcPercentage: v.optional(v.number()), // 0-100
    cbdPercentage: v.optional(v.number()), // 0-100
    weightGrams: v.optional(v.number()),
    unitType: v.optional(v.string()), // 'gram', 'unit', 'ounce', etc.

    // Pricing
    costPrice: v.number(),
    retailPrice: v.number(),

    // Inventory
    quantityOnHand: v.optional(v.number()), // Default: 0
    lowStockThreshold: v.optional(v.number()), // Default: 10

    // Compliance
    metrcId: v.optional(v.string()),
    batchNumber: v.optional(v.string()),
    labTestResults: v.optional(v.any()), // JSON

    // OCP Compliance Status
    complianceStatus: v.optional(productComplianceStatus), // Default: "clear"
    complianceFlagId: v.optional(v.id("advisoryProductMatches")),
    complianceLockedAt: v.optional(v.number()),
    complianceLockedBy: v.optional(v.id("users")),

    // Supplier tracking (for risk scoring)
    supplierId: v.optional(v.id("suppliers")),

    // Status
    isActive: v.optional(v.boolean()),
    lastRestockedAt: v.optional(v.number()),

    // Migration
    supabaseId: v.optional(v.string()),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_dispensary", ["dispensaryId"])
    .index("by_dispensary_sku", ["dispensaryId", "sku"])
    .index("by_category", ["category"])
    .index("by_active", ["isActive"])
    .index("by_metrc", ["metrcId"])
    .index("by_compliance_status", ["complianceStatus"])
    .index("by_supplier", ["supplierId"])
    .index("by_supabase_id", ["supabaseId"]),

  // -------------------------------------------------------------------------
  // CUSTOMERS - PII-hashed patient records
  // -------------------------------------------------------------------------
  customers: defineTable({
    dispensaryId: v.id("dispensaries"),

    // PII - Hashed
    emailHash: v.optional(v.string()), // SHA-256
    phoneHash: v.optional(v.string()), // SHA-256

    // Non-identifying
    firstNameInitial: v.optional(v.string()), // Single char

    // Medical
    hasMedicalCard: v.optional(v.boolean()),
    medicalCardExpiresAt: v.optional(v.string()), // ISO date

    // Purchase history
    totalPurchases: v.optional(v.number()), // Default: 0
    totalTransactions: v.optional(v.number()), // Default: 0
    firstPurchaseAt: v.optional(v.number()),
    lastPurchaseAt: v.optional(v.number()),

    // Segmentation
    customerTier: v.optional(v.string()), // standard, silver, gold, platinum
    loyaltyPoints: v.optional(v.number()), // Default: 0

    // Migration
    supabaseId: v.optional(v.string()),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_dispensary", ["dispensaryId"])
    .index("by_email_hash", ["emailHash"])
    .index("by_tier", ["customerTier"])
    .index("by_last_purchase", ["lastPurchaseAt"])
    .index("by_supabase_id", ["supabaseId"]),

  // -------------------------------------------------------------------------
  // TRANSACTIONS - Sales records
  // -------------------------------------------------------------------------
  transactions: defineTable({
    dispensaryId: v.id("dispensaries"),
    customerId: v.optional(v.id("customers")),

    // Transaction details
    transactionNumber: v.string(),
    transactionType: transactionType,

    // Financial
    subtotal: v.number(),
    taxAmount: v.number(),
    discountAmount: v.optional(v.number()), // Default: 0
    totalAmount: v.number(),

    // Payment
    paymentMethod: v.optional(v.string()), // cash, debit, credit, check

    // Staff & POS
    processedBy: v.optional(v.id("users")),
    posTerminalId: v.optional(v.string()),

    // Compliance
    metrcId: v.optional(v.string()),

    // Metadata
    notes: v.optional(v.string()),
    metadata: v.optional(v.any()),

    // Date
    transactionDate: v.number(), // Unix ms

    // Migration
    supabaseId: v.optional(v.string()),

    // Timestamps
    createdAt: v.number(),
  })
    .index("by_dispensary", ["dispensaryId"])
    .index("by_customer", ["customerId"])
    .index("by_date", ["transactionDate"])
    .index("by_dispensary_date", ["dispensaryId", "transactionDate"])
    .index("by_processed_by", ["processedBy"])
    .index("by_type", ["transactionType"])
    .index("by_supabase_id", ["supabaseId"]),

  // -------------------------------------------------------------------------
  // TRANSACTION_ITEMS - Line items per transaction
  // -------------------------------------------------------------------------
  transactionItems: defineTable({
    transactionId: v.id("transactions"),
    productId: v.id("products"),

    // Item details
    quantity: v.number(),
    unitPrice: v.number(),
    discountAmount: v.optional(v.number()),
    lineTotal: v.number(),

    // Snapshot (in case product changes)
    productSnapshot: v.any(),

    // Batch tracking
    batchNumber: v.optional(v.string()),

    // Migration
    supabaseId: v.optional(v.string()),

    // Timestamp
    createdAt: v.number(),
  })
    .index("by_transaction", ["transactionId"])
    .index("by_product", ["productId"])
    .index("by_supabase_id", ["supabaseId"]),

  // -------------------------------------------------------------------------
  // INVENTORY_SNAPSHOTS - Audit trail
  // -------------------------------------------------------------------------
  inventorySnapshots: defineTable({
    dispensaryId: v.id("dispensaries"),
    productId: v.id("products"),

    // Snapshot data
    quantity: v.number(),
    value: v.number(),

    // Type
    snapshotType: v.string(), // daily, transaction, adjustment, audit
    notes: v.optional(v.string()),

    // Date
    snapshotDate: v.string(), // ISO date

    // Migration
    supabaseId: v.optional(v.string()),

    // Timestamp
    createdAt: v.number(),
  })
    .index("by_dispensary", ["dispensaryId"])
    .index("by_product", ["productId"])
    .index("by_date", ["snapshotDate"])
    .index("by_dispensary_date", ["dispensaryId", "snapshotDate"])
    .index("by_supabase_id", ["supabaseId"]),

  // -------------------------------------------------------------------------
  // COMPLIANCE_FLAGS - Regulatory violations
  // -------------------------------------------------------------------------
  complianceFlags: defineTable({
    dispensaryId: v.id("dispensaries"),

    // Flag details
    flagType: v.string(),
    severity: complianceStatus,

    // Description
    title: v.string(),
    description: v.string(),

    // Related entities
    relatedProductId: v.optional(v.id("products")),
    relatedTransactionId: v.optional(v.id("transactions")),

    // Resolution
    resolvedAt: v.optional(v.number()),
    resolvedBy: v.optional(v.id("users")),
    resolutionNotes: v.optional(v.string()),

    // Metadata
    metadata: v.optional(v.any()),

    // Flagged timestamp
    flaggedAt: v.number(),

    // Migration
    supabaseId: v.optional(v.string()),

    // Timestamp
    createdAt: v.number(),
  })
    .index("by_dispensary", ["dispensaryId"])
    .index("by_severity", ["severity"])
    .index("by_resolved", ["resolvedAt"])
    .index("by_product", ["relatedProductId"])
    .index("by_supabase_id", ["supabaseId"]),

  // -------------------------------------------------------------------------
  // AUDIT_LOGS - HIPAA compliance tracking
  // -------------------------------------------------------------------------
  auditLogs: defineTable({
    dispensaryId: v.id("dispensaries"),

    // User & Action
    userId: v.optional(v.id("users")),
    userEmail: v.string(),
    userRole: userRole,

    // Action details
    action: v.string(), // create, read, update, delete, login, logout
    resourceType: v.string(), // product, transaction, user, etc.
    resourceId: v.optional(v.string()),

    // Request context
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    requestMethod: v.optional(v.string()),
    requestPath: v.optional(v.string()),

    // Data changes
    oldValues: v.optional(v.any()),
    newValues: v.optional(v.any()),

    // Status
    status: v.optional(v.string()), // success, failure, error
    errorMessage: v.optional(v.string()),

    // Log date (for partitioning)
    logDate: v.string(), // ISO date

    // Migration
    supabaseId: v.optional(v.string()),

    // Timestamp
    createdAt: v.number(),
  })
    .index("by_dispensary", ["dispensaryId"])
    .index("by_user", ["userId"])
    .index("by_date", ["createdAt"])
    .index("by_resource", ["resourceType", "resourceId"])
    .index("by_action", ["action"])
    .index("by_log_date", ["logDate"])
    .index("by_supabase_id", ["supabaseId"]),

  // -------------------------------------------------------------------------
  // API_INTEGRATIONS - Third-party configs
  // -------------------------------------------------------------------------
  apiIntegrations: defineTable({
    dispensaryId: v.id("dispensaries"),

    // Integration details
    integrationType: v.string(), // metrc, pos, accounting, crm
    name: v.string(),

    // Config (secrets stored separately in Clerk/env)
    config: v.optional(v.any()),

    // Status
    status: integrationStatus,
    lastSyncAt: v.optional(v.number()),
    lastSyncStatus: v.optional(v.string()),
    lastError: v.optional(v.string()),

    // Sync settings
    syncFrequencyMinutes: v.optional(v.number()), // Default: 60
    autoSyncEnabled: v.optional(v.boolean()),

    // Metadata
    metadata: v.optional(v.any()),

    // Migration
    supabaseId: v.optional(v.string()),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_dispensary", ["dispensaryId"])
    .index("by_type", ["integrationType"])
    .index("by_status", ["status"])
    .index("by_dispensary_type", ["dispensaryId", "integrationType"])
    .index("by_supabase_id", ["supabaseId"]),

  // -------------------------------------------------------------------------
  // REPORTS - Generated reports queue
  // -------------------------------------------------------------------------
  reports: defineTable({
    dispensaryId: v.id("dispensaries"),

    // Report details
    reportType: reportType,
    title: v.string(),

    // Generation
    generatedBy: v.optional(v.id("users")),
    status: reportStatus,

    // Date range
    startDate: v.string(), // ISO date
    endDate: v.string(), // ISO date

    // Parameters
    filters: v.optional(v.any()),

    // Output
    fileUrl: v.optional(v.string()),
    fileSizeBytes: v.optional(v.number()),

    // Processing
    processingStartedAt: v.optional(v.number()),
    processingCompletedAt: v.optional(v.number()),
    errorMessage: v.optional(v.string()),

    // Migration
    supabaseId: v.optional(v.string()),

    // Timestamp
    createdAt: v.number(),
  })
    .index("by_dispensary", ["dispensaryId"])
    .index("by_type", ["reportType"])
    .index("by_status", ["status"])
    .index("by_date_range", ["startDate", "endDate"])
    .index("by_created", ["createdAt"])
    .index("by_supabase_id", ["supabaseId"]),

  // -------------------------------------------------------------------------
  // RATE_LIMITS - Prevent abuse of sensitive operations
  // -------------------------------------------------------------------------
  rateLimits: defineTable({
    // Identifier (userId or IP for unauthenticated)
    identifier: v.string(),

    // Action being rate limited
    action: v.string(), // e.g., "bulkImport", "createSale", "exportData"

    // Window tracking
    windowStart: v.number(), // Unix ms when window started
    requestCount: v.number(), // Number of requests in current window

    // Timestamp
    updatedAt: v.number(),
  })
    .index("by_identifier_action", ["identifier", "action"])
    .index("by_window", ["windowStart"]),

  // =========================================================================
  // DELIVERY ORDERS (Hazy Moose Integration)
  // =========================================================================

  // -------------------------------------------------------------------------
  // ORDERS - Customer delivery orders with real-time status tracking
  // -------------------------------------------------------------------------
  orders: defineTable({
    dispensaryId: v.id("dispensaries"),

    // Customer info
    customerName: v.string(),
    customerPhone: v.optional(v.string()),
    customerEmail: v.optional(v.string()),

    // Driver assignment
    driverId: v.optional(v.string()),
    driverName: v.optional(v.string()),

    // Order items
    items: v.array(v.object({
      productId: v.optional(v.string()),
      name: v.string(),
      category: v.optional(v.string()),
      quantity: v.number(),
      price: v.number(),
    })),

    // Financials
    subtotal: v.number(),
    tax: v.number(),
    total: v.number(),
    tipAmount: v.optional(v.number()),
    preTipAmount: v.optional(v.number()), // For debit pre-tip at checkout

    // Payment tracking
    paymentMethod: v.optional(paymentMethod),
    paymentStatus: v.optional(paymentStatus),
    paymentId: v.optional(v.id("payments")),

    // Status: pending → accepted → picked_up → en_route → delivered | cancelled
    status: v.string(),

    // Delivery details
    deliveryAddress: v.string(),
    deliveryNotes: v.optional(v.string()),
    pickupTime: v.string(), // "ASAP" or specific time
    estimatedDeliveryTime: v.optional(v.number()), // Unix ms

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
    acceptedAt: v.optional(v.number()),
    pickedUpAt: v.optional(v.number()),
    deliveredAt: v.optional(v.number()),
    cancelledAt: v.optional(v.number()),

    // Cancellation
    cancellationReason: v.optional(v.string()),
  })
    .index("by_dispensary", ["dispensaryId"])
    .index("by_status", ["status"])
    .index("by_driver", ["driverId"])
    .index("by_dispensary_status", ["dispensaryId", "status"])
    .index("by_created", ["createdAt"]),

  // -------------------------------------------------------------------------
  // DRIVERS - Driver profiles for delivery
  // -------------------------------------------------------------------------
  drivers: defineTable({
    dispensaryId: v.id("dispensaries"),

    // Profile
    driverId: v.string(), // Login ID like "DRV-001"
    name: v.string(),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),

    // Status
    isOnline: v.boolean(),
    isActive: v.boolean(),

    // Stats
    completedDeliveries: v.number(),
    totalTips: v.number(),
    rating: v.number(), // 0-5

    // Current location (optional)
    lastLatitude: v.optional(v.number()),
    lastLongitude: v.optional(v.number()),
    lastLocationUpdate: v.optional(v.number()),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
    lastLoginAt: v.optional(v.number()),
  })
    .index("by_dispensary", ["dispensaryId"])
    .index("by_driver_id", ["driverId"])
    .index("by_online", ["isOnline"])
    .index("by_dispensary_online", ["dispensaryId", "isOnline"]),

  // =========================================================================
  // PAYMENT PLATFORM (Multi-POS Architecture)
  // =========================================================================

  // -------------------------------------------------------------------------
  // PAYMENTS - Universal payment records (works with any POS)
  // -------------------------------------------------------------------------
  payments: defineTable({
    // Core identifiers
    dispensaryId: v.id("dispensaries"),
    orderId: v.id("orders"),
    driverId: v.optional(v.string()),

    // Payment details (universal)
    paymentMethod: paymentMethod,
    amount: v.number(),
    tipAmount: v.optional(v.number()),

    // Status tracking
    status: paymentStatus,

    // Cash-specific
    cashTendered: v.optional(v.number()),
    changeGiven: v.optional(v.number()),

    // Card-specific
    cardLastFour: v.optional(v.string()),
    cardBrand: v.optional(v.string()),
    approvalCode: v.optional(v.string()),
    terminalId: v.optional(v.string()),

    // POS sync (universal - works for ANY POS)
    posProvider: v.optional(v.string()), // "flowhub", "budtrack", "dutchie"
    posSyncStatus: v.optional(posSyncStatus),
    posTransactionId: v.optional(v.string()),
    posErrorMessage: v.optional(v.string()),
    posSyncAttempts: v.optional(v.number()),
    posSyncedAt: v.optional(v.number()),

    // Extensible metadata (POS-specific data)
    metadata: v.optional(v.any()),

    // Timestamps
    createdAt: v.number(),
    collectedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  })
    .index("by_order", ["orderId"])
    .index("by_dispensary", ["dispensaryId"])
    .index("by_driver", ["driverId"])
    .index("by_status", ["status"])
    .index("by_pos_sync", ["posSyncStatus"])
    .index("by_dispensary_date", ["dispensaryId", "createdAt"]),

  // -------------------------------------------------------------------------
  // DISPENSARY_PAYMENT_CONFIG - Per-dispensary payment & POS settings
  // -------------------------------------------------------------------------
  dispensaryPaymentConfig: defineTable({
    dispensaryId: v.id("dispensaries"),

    // POS Integration
    posProvider: v.string(), // "flowhub", "budtrack", etc.
    posApiKey: v.optional(v.string()), // Encrypted
    posLocationId: v.optional(v.string()),
    posWebhookSecret: v.optional(v.string()),

    // Payment Methods Allowed
    supportedMethods: v.array(v.string()), // ["cash", "debit"]
    defaultMethod: v.optional(v.string()),

    // Compliance (state-specific)
    region: v.string(), // "maine_medical", "maine_adult", "vermont"
    taxRate: v.number(), // 0.0, 0.08, 0.10
    requireIdVerification: v.boolean(),
    metrcEnabled: v.boolean(),

    // Tip Configuration
    tipPresets: v.optional(v.array(v.number())), // [0, 5, 10, 15]
    tipEnabled: v.boolean(),

    // Sync Settings
    syncMode: syncMode,
    syncRetryAttempts: v.optional(v.number()),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_dispensary", ["dispensaryId"]),

  // -------------------------------------------------------------------------
  // DRIVER_EARNINGS - Track driver earnings across ALL dispensaries
  // -------------------------------------------------------------------------
  driverEarnings: defineTable({
    driverId: v.string(),
    dispensaryId: v.id("dispensaries"),
    paymentId: v.id("payments"),
    orderId: v.id("orders"),

    // Earnings breakdown
    deliveryFee: v.optional(v.number()),
    tipAmount: v.number(),
    totalEarned: v.number(),

    // Payout tracking
    payoutStatus: payoutStatus,
    payoutBatchId: v.optional(v.string()),
    paidAt: v.optional(v.number()),

    // Timestamp
    earnedAt: v.number(),
  })
    .index("by_driver", ["driverId"])
    .index("by_driver_date", ["driverId", "earnedAt"])
    .index("by_dispensary", ["dispensaryId"])
    .index("by_payout_status", ["payoutStatus"]),

  // =========================================================================
  // OCP COMPLIANCE ALERT SYSTEM
  // =========================================================================

  // -------------------------------------------------------------------------
  // OCP_ADVISORIES - Maine Office of Cannabis Policy patient advisories
  // -------------------------------------------------------------------------
  ocpAdvisories: defineTable({
    // Unique identifier from OCP
    ocpAdvisoryId: v.string(), // e.g., "ADVISORY-2024-001"

    // Advisory details
    title: v.string(),
    description: v.string(),
    severity: advisorySeverity,
    advisoryType: advisoryType, // recall, safety_alert, contamination, labeling, other
    status: advisoryStatus,

    // Issue date from OCP
    issuedAt: v.number(), // Unix ms
    expiresAt: v.optional(v.number()), // Unix ms (if specified)

    // Regulatory info
    recommendedAction: v.optional(v.string()), // e.g., "Return to place of purchase"
    regulatoryReference: v.optional(v.string()), // e.g., "28-A MRSA § 1501"

    // Affected items (for cross-referencing)
    affectedProducts: v.optional(v.array(v.string())), // Product names
    affectedStrains: v.optional(v.array(v.string())), // Strain names
    affectedBrands: v.optional(v.array(v.string())), // Brand names
    affectedBatchNumbers: v.optional(v.array(v.string())), // Batch numbers
    affectedLicenses: v.optional(v.array(v.string())), // Cultivator/processor licenses

    // Contaminant info
    contaminants: v.optional(v.array(v.string())), // e.g., ["aspergillus", "pesticides"]
    contaminantDetails: v.optional(v.string()), // Additional info about contaminants

    // Source tracking
    sourceUrl: v.optional(v.string()), // Link to original OCP advisory
    rawData: v.optional(v.any()), // Original webhook payload

    // Processing status
    processedAt: v.optional(v.number()), // When cross-reference completed
    matchCount: v.optional(v.number()), // Total matches across all dispensaries

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_ocp_id", ["ocpAdvisoryId"])
    .index("by_status", ["status"])
    .index("by_severity", ["severity"])
    .index("by_issued", ["issuedAt"])
    .index("by_severity_status", ["severity", "status"]),

  // -------------------------------------------------------------------------
  // ADVISORY_PRODUCT_MATCHES - Links advisories to matched inventory products
  // -------------------------------------------------------------------------
  advisoryProductMatches: defineTable({
    // References
    advisoryId: v.id("ocpAdvisories"),
    productId: v.id("products"),
    dispensaryId: v.id("dispensaries"),

    // Match details
    matchType: v.string(), // "product_name", "strain", "brand", "batch_number", "license"
    matchedValue: v.string(), // The value that matched
    matchConfidence: v.number(), // 0-100 (fuzzy match score)

    // Status tracking
    status: matchStatus,
    flaggedAt: v.number(), // When product was flagged
    acknowledgedAt: v.optional(v.number()),
    acknowledgedBy: v.optional(v.id("users")),
    resolvedAt: v.optional(v.number()),
    resolvedBy: v.optional(v.id("users")),

    // Resolution info
    resolutionAction: v.optional(resolutionAction),
    resolutionNotes: v.optional(v.string()),
    resolutionEvidence: v.optional(v.any()), // JSON: photos, documents, etc.

    // Quantity tracking
    quantityAffected: v.optional(v.number()), // Units affected
    quantityResolved: v.optional(v.number()), // Units handled

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_advisory", ["advisoryId"])
    .index("by_product", ["productId"])
    .index("by_dispensary", ["dispensaryId"])
    .index("by_status", ["status"])
    .index("by_dispensary_status", ["dispensaryId", "status"])
    .index("by_advisory_dispensary", ["advisoryId", "dispensaryId"]),

  // -------------------------------------------------------------------------
  // ALERT_NOTIFICATIONS - Track all notifications sent
  // -------------------------------------------------------------------------
  alertNotifications: defineTable({
    // References
    advisoryId: v.id("ocpAdvisories"),
    matchId: v.optional(v.id("advisoryProductMatches")),
    dispensaryId: v.id("dispensaries"),
    userId: v.optional(v.id("users")), // If targeted at specific user

    // Notification details
    channel: notificationChannel,
    status: notificationStatus,
    subject: v.string(),
    body: v.string(),

    // Delivery info
    recipientEmail: v.optional(v.string()),
    recipientPhone: v.optional(v.string()),

    // Tracking
    sentAt: v.optional(v.number()),
    deliveredAt: v.optional(v.number()),
    readAt: v.optional(v.number()),
    failureReason: v.optional(v.string()),

    // Retry tracking
    retryCount: v.optional(v.number()),
    lastRetryAt: v.optional(v.number()),

    // External service IDs
    externalId: v.optional(v.string()), // Resend message ID, etc.

    // Timestamps
    createdAt: v.number(),
  })
    .index("by_advisory", ["advisoryId"])
    .index("by_dispensary", ["dispensaryId"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_channel", ["channel"]),

  // -------------------------------------------------------------------------
  // COMPLIANCE_RESOLUTION_LOGS - Audit trail for all resolution actions
  // -------------------------------------------------------------------------
  complianceResolutionLogs: defineTable({
    // References
    advisoryId: v.id("ocpAdvisories"),
    matchId: v.optional(v.id("advisoryProductMatches")),
    productId: v.optional(v.id("products")),
    dispensaryId: v.id("dispensaries"),

    // Who did what
    userId: v.id("users"),
    userEmail: v.string(),
    userRole: userRole,

    // Action details
    action: v.string(), // "flagged", "acknowledged", "resolved", "dismissed", "locked", "unlocked"
    previousStatus: v.optional(v.string()),
    newStatus: v.string(),

    // Context
    notes: v.optional(v.string()),
    evidence: v.optional(v.any()), // JSON: supporting documents

    // Request context
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),

    // Timestamps
    createdAt: v.number(),
  })
    .index("by_advisory", ["advisoryId"])
    .index("by_match", ["matchId"])
    .index("by_dispensary", ["dispensaryId"])
    .index("by_user", ["userId"])
    .index("by_product", ["productId"])
    .index("by_action", ["action"])
    .index("by_created", ["createdAt"]),

  // =========================================================================
  // SUPPLIER RISK SCORING SYSTEM
  // =========================================================================

  // -------------------------------------------------------------------------
  // SUPPLIERS - Master supplier/grower registry
  // -------------------------------------------------------------------------
  suppliers: defineTable({
    // Identification
    name: v.string(),
    licenseNumber: v.string(), // State license number
    licenseType: supplierLicenseType,

    // Contact info (optional)
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    website: v.optional(v.string()),

    // Activity tracking
    firstSeenAt: v.number(), // First appearance in system
    lastActivityAt: v.optional(v.number()), // Last activity timestamp

    // Status
    isActive: v.optional(v.boolean()), // Default: true

    // Metadata
    notes: v.optional(v.string()),
    metadata: v.optional(v.any()),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_license", ["licenseNumber"])
    .index("by_license_type", ["licenseType"])
    .index("by_name", ["name"])
    .index("by_active", ["isActive"]),

  // -------------------------------------------------------------------------
  // SUPPLIER_RISK_PROFILES - Calculated risk scores per supplier per dispensary
  // -------------------------------------------------------------------------
  supplierRiskProfiles: defineTable({
    // References
    supplierId: v.id("suppliers"),
    dispensaryId: v.id("dispensaries"), // Tenant isolation

    // Risk metrics
    riskScore: v.number(), // 0-100 (higher = more risk)
    riskTier: riskTier, // "low" | "medium" | "high" | "critical"

    // Counts
    totalBatches: v.number(), // Total batches received from this supplier
    contaminationCount: v.number(), // Number of contamination incidents
    recallCount: v.number(), // Number of recalls
    labelingIssueCount: v.number(), // Number of labeling issues
    qualityIssueCount: v.optional(v.number()), // Number of quality issues

    // Timing
    lastIncidentDate: v.optional(v.number()), // Date of most recent incident
    daysSinceLastIncident: v.optional(v.number()), // Days since last problem

    // Trend analysis
    trend: riskTrend, // "improving" | "stable" | "worsening"
    trendDirection: v.number(), // -1 (improving) to +1 (worsening)
    previousScore: v.optional(v.number()), // Score from previous calculation
    scoreChange: v.optional(v.number()), // Difference from previous score

    // Rate metrics
    incidentRate: v.number(), // Incidents per 100 batches

    // Calculation tracking
    calculatedAt: v.number(), // Last score calculation
    calculationVersion: v.optional(v.string()), // Algorithm version used

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_supplier", ["supplierId"])
    .index("by_dispensary", ["dispensaryId"])
    .index("by_supplier_dispensary", ["supplierId", "dispensaryId"])
    .index("by_risk_tier", ["riskTier"])
    .index("by_risk_score", ["riskScore"])
    .index("by_dispensary_tier", ["dispensaryId", "riskTier"]),

  // -------------------------------------------------------------------------
  // SUPPLIER_INCIDENTS - Historical record of supplier issues
  // -------------------------------------------------------------------------
  supplierIncidents: defineTable({
    // References
    supplierId: v.id("suppliers"),
    advisoryId: v.optional(v.id("ocpAdvisories")), // Related OCP advisory (if any)
    dispensaryId: v.id("dispensaries"), // Tenant who reported/received

    // Incident details
    incidentType: incidentType, // "contamination" | "recall" | "labeling" | "quality" | "documentation" | "other"
    severity: advisorySeverity, // "critical" | "high" | "medium" | "low"
    title: v.string(),
    description: v.string(),

    // Affected items
    affectedBatches: v.optional(v.array(v.string())), // Batch numbers affected
    affectedProducts: v.optional(v.array(v.string())), // Product names affected
    affectedQuantity: v.optional(v.number()), // Units affected

    // Contaminant info (for contamination incidents)
    contaminants: v.optional(v.array(v.string())), // Contaminants found
    contaminantDetails: v.optional(v.string()),

    // Dates
    incidentDate: v.number(), // When incident occurred
    reportedAt: v.number(), // When reported/discovered
    resolvedAt: v.optional(v.number()), // When resolved

    // Resolution
    resolutionNotes: v.optional(v.string()),
    resolutionAction: v.optional(resolutionAction),

    // Source tracking
    sourceType: v.optional(v.string()), // "ocp_advisory", "manual", "lab_report", "customer_complaint"
    sourceReference: v.optional(v.string()), // Reference to source

    // Evidence
    evidence: v.optional(v.any()), // JSON: documents, photos, lab reports

    // User tracking
    reportedBy: v.optional(v.id("users")),
    resolvedBy: v.optional(v.id("users")),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_supplier", ["supplierId"])
    .index("by_advisory", ["advisoryId"])
    .index("by_dispensary", ["dispensaryId"])
    .index("by_supplier_dispensary", ["supplierId", "dispensaryId"])
    .index("by_incident_type", ["incidentType"])
    .index("by_severity", ["severity"])
    .index("by_incident_date", ["incidentDate"])
    .index("by_supplier_date", ["supplierId", "incidentDate"]),

  // =========================================================================
  // COLD EMAIL CAMPAIGN SYSTEM
  // =========================================================================

  // -------------------------------------------------------------------------
  // COLD_EMAIL_PROSPECTS - Dispensary prospect list for outreach
  // -------------------------------------------------------------------------
  coldEmailProspects: defineTable({
    // From license data
    dispensaryName: v.string(),
    licenseNumber: v.optional(v.string()),
    licenseExpiration: v.optional(v.string()), // ISO date

    // Enriched contact data
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    city: v.optional(v.string()),
    website: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),

    // Email campaign tracking
    status: v.string(), // "pending", "active", "paused", "completed", "replied", "unsubscribed", "bounced"
    emailSequencePosition: v.number(), // 1-6 (which email in sequence)
    lastEmailSent: v.optional(v.number()), // Unix ms
    nextEmailDate: v.optional(v.number()), // Unix ms - when to send next email

    // Engagement tracking
    totalEmailsSent: v.optional(v.number()),
    totalOpens: v.optional(v.number()),
    totalClicks: v.optional(v.number()),
    lastOpenedAt: v.optional(v.number()),
    lastClickedAt: v.optional(v.number()),
    repliedAt: v.optional(v.number()),

    // Source & notes
    source: v.optional(v.string()), // "maine_ocp", "apollo", "manual", "linkedin"
    notes: v.optional(v.string()),
    tags: v.optional(v.array(v.string())), // ["pilot_candidate", "multi_location", etc.]

    // Maine OCP enrichment (cross-referenced from OCP data)
    licenseStatus: v.optional(v.string()), // "active", "conditional", etc.
    hasComplianceIssues: v.optional(v.boolean()), // From violations data
    matchConfidence: v.optional(v.union(
      v.literal("high"),
      v.literal("medium"),
      v.literal("low")
    )), // How confident the OCP match is
    licenseExpirationAlert: v.optional(v.boolean()), // True if expiring within 30 days
    licenseExpiresInDays: v.optional(v.number()), // Days until expiration

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_email", ["email"])
    .index("by_next_email", ["status", "nextEmailDate"])
    .index("by_license", ["licenseNumber"])
    .index("by_license_alert", ["licenseExpirationAlert"]),

  // -------------------------------------------------------------------------
  // COLD_EMAIL_LOGS - Record of all emails sent
  // -------------------------------------------------------------------------
  coldEmailLogs: defineTable({
    prospectId: v.id("coldEmailProspects"),

    // Email details
    emailNumber: v.number(), // 1-6
    subject: v.string(),
    templateUsed: v.optional(v.string()), // "email_1_hook", "email_2_story", etc.

    // Delivery status
    status: v.string(), // "sent", "delivered", "opened", "clicked", "bounced", "complained"
    sentAt: v.number(),
    deliveredAt: v.optional(v.number()),
    openedAt: v.optional(v.number()),
    clickedAt: v.optional(v.number()),
    bouncedAt: v.optional(v.number()),

    // External tracking
    resendMessageId: v.optional(v.string()), // Resend API message ID
    errorMessage: v.optional(v.string()),
    clickedUrl: v.optional(v.string()), // URL clicked (if any)
    bounceType: v.optional(v.string()), // "hard", "soft", etc.

    // Timestamps
    createdAt: v.number(),
  })
    .index("by_prospect", ["prospectId"])
    .index("by_sent", ["sentAt"])
    .index("by_status", ["status"])
    .index("by_resend_id", ["resendMessageId"]),

  // =========================================================================
  // MAINE CANNABIS DATA LAYER (OCP Integration)
  // =========================================================================

  // -------------------------------------------------------------------------
  // MAINE_REGULATIONS - Static regulatory reference data
  // -------------------------------------------------------------------------
  maineRegulations: defineTable({
    category: v.string(), // "possession", "cultivation", "tax", "licensing"
    programType: v.union(v.literal("medical"), v.literal("adult_use"), v.literal("both")),

    // Regulation details
    name: v.string(), // "Patient Possession Limit"
    value: v.string(), // "8 pounds harvested"
    numericValue: v.optional(v.number()), // 8 (for calculations)
    unit: v.optional(v.string()), // "pounds", "plants", "percent"

    // Source
    sourceUrl: v.optional(v.string()),
    statute: v.optional(v.string()), // "22 M.R.S. § 2423-A"
    effectiveDate: v.optional(v.number()),

    // Timestamps
    lastVerified: v.number(),
    createdAt: v.number(),
  })
    .index("by_category", ["category"])
    .index("by_program", ["programType"]),

  // -------------------------------------------------------------------------
  // MAINE_MEDICAL_CAREGIVERS - From OCP monthly CSV exports
  // -------------------------------------------------------------------------
  maineMedicalCaregivers: defineTable({
    // OCP identifiers
    registrationNumber: v.string(), // "CGR32365"
    registrationType: v.string(), // "CGR", "RIC", "CGE"

    // Basic info (from CSV) - NOTE: Names often redacted for privacy
    name: v.optional(v.string()), // Often null/redacted - "Individual" common
    businessType: v.optional(v.string()), // "Individual" or "Organization"
    town: v.optional(v.string()),
    county: v.optional(v.string()),

    // Status
    status: v.union(
      v.literal("active"),
      v.literal("suspended"),
      v.literal("revoked"),
      v.literal("expired")
    ),
    issuedAt: v.optional(v.number()),
    expiresAt: v.optional(v.number()),

    // Compliance flags (cross-referenced from violations)
    hasViolations: v.boolean(),
    violationCount: v.optional(v.number()),
    lastViolationDate: v.optional(v.number()),

    // Sync metadata
    syncSource: v.literal("maine_ocp_csv"),
    lastSyncedAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_registration", ["registrationNumber"])
    .index("by_town", ["town"])
    .index("by_status", ["status"])
    .index("by_violations", ["hasViolations"])
    .index("by_expiration", ["expiresAt"]),

  // -------------------------------------------------------------------------
  // MAINE_MEDICAL_DISPENSARIES - From OCP monthly CSV exports
  // -------------------------------------------------------------------------
  maineMedicalDispensaries: defineTable({
    // OCP identifiers
    registrationNumber: v.string(), // "DSP116"

    // Business info
    businessName: v.string(),
    dba: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.string(),
    county: v.optional(v.string()),
    zipCode: v.optional(v.string()),

    // Status
    status: v.union(
      v.literal("active"),
      v.literal("conditional"),
      v.literal("pending"),
      v.literal("suspended"),
      v.literal("revoked")
    ),
    issuedAt: v.optional(v.number()),
    expiresAt: v.optional(v.number()),

    // Contact (for sales outreach cross-reference)
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    website: v.optional(v.string()),

    // Officers/owners (from CSV)
    officers: v.optional(v.array(v.object({
      name: v.string(),
      title: v.optional(v.string()),
    }))),

    // Compliance
    hasViolations: v.boolean(),
    violationCount: v.optional(v.number()),

    // Link to our prospects (if they're in cold email list)
    coldEmailProspectId: v.optional(v.id("coldEmailProspects")),

    // Sync metadata
    lastSyncedAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_registration", ["registrationNumber"])
    .index("by_city", ["city"])
    .index("by_status", ["status"])
    .index("by_prospect", ["coldEmailProspectId"])
    .index("by_expiration", ["expiresAt"]),

  // -------------------------------------------------------------------------
  // MAINE_COMPLIANCE_VIOLATIONS - From OCP enforcement data
  // Matches OCP table structure: https://www.maine.gov/dafs/ocp/open-data/medical-use/compliance-data
  // -------------------------------------------------------------------------
  maineComplianceViolations: defineTable({
    // Identifiers (from OCP table)
    registrationNumber: v.string(), // OCP's unique identifier
    registrantName: v.string(), // Natural person or business entity
    programType: v.union(v.literal("medical"), v.literal("adult_use")),

    // Violation details (from OCP table)
    violationDate: v.number(), // Date of final agency action
    action: v.string(), // "Monetary penalty", "Suspension", "Revocation", or combination
    settledFineAmount: v.optional(v.number()), // Settled fine amount agreed upon

    // Legacy field for backwards compatibility
    violationType: v.optional(v.union(
      v.literal("minor"),
      v.literal("major"),
      v.literal("major_public_safety")
    )),

    // Documentation (Final Action Documentation from OCP)
    documentUrl: v.optional(v.string()), // Link to redacted Notice/Settlement PDF
    documentType: v.optional(v.string()), // "Notice of Administrative Action" or "Settlement"

    // Timestamps
    syncedAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_registration", ["registrationNumber"])
    .index("by_program", ["programType"])
    .index("by_date", ["violationDate"])
    .index("by_action", ["action"]),

  // -------------------------------------------------------------------------
  // MAINE_SALES_DATA - Market analytics from mainecannabis.org
  // -------------------------------------------------------------------------
  maineSalesData: defineTable({
    year: v.number(),
    month: v.number(), // 1-12

    // Data type - reflects actual reporting frequency
    dataType: v.union(
      v.literal("preliminary"), // Adult-use monthly (preliminary)
      v.literal("official"), // Medical quarterly (official)
      v.literal("blended") // Combined data
    ),

    // Medical sales (quarterly official data)
    medicalSales: v.optional(v.number()),

    // Adult use sales (monthly preliminary data)
    adultUseSales: v.optional(v.number()),

    // Calculated
    totalSales: v.number(),
    monthOverMonthChange: v.optional(v.number()), // Percentage
    yearOverYearChange: v.optional(v.number()),

    // Source
    sourceUrl: v.string(),
    syncedAt: v.number(),
  })
    .index("by_year_month", ["year", "month"])
    .index("by_year", ["year"])
    .index("by_data_type", ["dataType"]),

  // -------------------------------------------------------------------------
  // MAINE_ADULT_USE_LICENSEES - From OCP monthly CSV exports
  // -------------------------------------------------------------------------
  maineAdultUseLicensees: defineTable({
    // OCP identifiers
    licenseNumber: v.string(), // "AMS235", "ACD608"
    licenseType: v.string(), // "AMS" (store), "ACD" (cultivation), "AMF" (manufacturing)

    // Business info
    businessName: v.string(),
    dba: v.optional(v.string()),
    city: v.string(),
    county: v.optional(v.string()),

    // Status
    status: v.union(
      v.literal("active"),
      v.literal("conditional"),
      v.literal("conditional_jurisdiction_approved"),
      v.literal("pending_conditional"),
      v.literal("suspended"),
      v.literal("revoked")
    ),
    issuedAt: v.optional(v.number()),
    expiresAt: v.optional(v.number()),

    // Compliance
    hasViolations: v.boolean(),
    violationCount: v.optional(v.number()),

    // Sync metadata
    lastSyncedAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_license", ["licenseNumber"])
    .index("by_type", ["licenseType"])
    .index("by_city", ["city"])
    .index("by_status", ["status"]),
});
