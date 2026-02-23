import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Seed the database with test data for development
 * Run via: npx convex run seed:seedDatabase
 */
export const seedDatabase = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existingDispensary = await ctx.db.query("dispensaries").first();
    if (existingDispensary) {
      return { message: "Database already seeded", dispensaryId: existingDispensary._id };
    }

    const now = Date.now();

    // Create dispensary
    const dispensaryId = await ctx.db.insert("dispensaries", {
      name: "Green Valley Dispensary",
      licenseNumber: "MJ-RET-2024-001234",
      email: "contact@greenvalley.com",
      phone: "(555) 420-1234",
      addressLine1: "123 Cannabis Lane",
      city: "Denver",
      state: "CO",
      zipCode: "80202",
      timezone: "America/Denver",
      taxRate: 0.15,
      isActive: true,
      createdAt: now,
    });

    // Create products
    const products = [
      { name: "Blue Dream", category: "flower" as const, thcPercentage: 21, cbdPercentage: 0.1, costPrice: 25, retailPrice: 45, quantityOnHand: 145 },
      { name: "OG Kush", category: "flower" as const, thcPercentage: 24, cbdPercentage: 0.2, costPrice: 28, retailPrice: 50, quantityOnHand: 128 },
      { name: "Sour Diesel", category: "flower" as const, thcPercentage: 22, cbdPercentage: 0.1, costPrice: 26, retailPrice: 48, quantityOnHand: 112 },
      { name: "Girl Scout Cookies", category: "flower" as const, thcPercentage: 25, cbdPercentage: 0.3, costPrice: 30, retailPrice: 55, quantityOnHand: 98 },
      { name: "Pineapple Express", category: "flower" as const, thcPercentage: 20, cbdPercentage: 0.2, costPrice: 24, retailPrice: 44, quantityOnHand: 87 },
      { name: "Northern Lights", category: "flower" as const, thcPercentage: 18, cbdPercentage: 0.5, costPrice: 22, retailPrice: 40, quantityOnHand: 5 },
      { name: "Jack Herer", category: "flower" as const, thcPercentage: 23, cbdPercentage: 0.1, costPrice: 27, retailPrice: 49, quantityOnHand: 8 },
      { name: "Granddaddy Purple", category: "flower" as const, thcPercentage: 20, cbdPercentage: 0.4, costPrice: 25, retailPrice: 45, quantityOnHand: 3 },
      { name: "Live Resin Cartridge", category: "vape" as const, thcPercentage: 85, cbdPercentage: 1, costPrice: 35, retailPrice: 65, quantityOnHand: 52 },
      { name: "Shatter - Hybrid", category: "concentrate" as const, thcPercentage: 78, cbdPercentage: 0.5, costPrice: 30, retailPrice: 55, quantityOnHand: 38 },
      { name: "Gummy Bears 10pk", category: "edible" as const, thcPercentage: 10, cbdPercentage: 0, costPrice: 12, retailPrice: 25, quantityOnHand: 156 },
      { name: "Chocolate Bar 100mg", category: "edible" as const, thcPercentage: 10, cbdPercentage: 0, costPrice: 15, retailPrice: 30, quantityOnHand: 89 },
      { name: "Pre-Roll 5pk", category: "pre_roll" as const, thcPercentage: 20, cbdPercentage: 0.2, costPrice: 18, retailPrice: 35, quantityOnHand: 72 },
      { name: "CBD Topical Cream", category: "topical" as const, thcPercentage: 0, cbdPercentage: 15, costPrice: 20, retailPrice: 45, quantityOnHand: 34 },
      { name: "THC Tincture 1000mg", category: "tincture" as const, thcPercentage: 100, cbdPercentage: 0, costPrice: 40, retailPrice: 75, quantityOnHand: 28 },
    ];

    const productIds: Id<"products">[] = [];
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      const productId = await ctx.db.insert("products", {
        dispensaryId,
        sku: `SKU-${String(i + 1).padStart(4, "0")}`,
        name: p.name,
        category: p.category,
        thcPercentage: p.thcPercentage,
        cbdPercentage: p.cbdPercentage,
        costPrice: p.costPrice,
        retailPrice: p.retailPrice,
        quantityOnHand: p.quantityOnHand,
        lowStockThreshold: 10,
        isActive: true,
        createdAt: now,
      });
      productIds.push(productId);
    }

    // Create customers
    const customerIds: Id<"customers">[] = [];
    for (let i = 0; i < 50; i++) {
      const customerId = await ctx.db.insert("customers", {
        dispensaryId,
        firstNameInitial: String.fromCharCode(65 + (i % 26)),
        hasMedicalCard: i % 3 === 0,
        totalPurchases: Math.floor(Math.random() * 2000) + 100,
        totalTransactions: Math.floor(Math.random() * 30) + 1,
        customerTier: i < 5 ? "platinum" : i < 15 ? "gold" : i < 30 ? "silver" : "standard",
        loyaltyPoints: Math.floor(Math.random() * 500),
        createdAt: now - Math.random() * 90 * 24 * 60 * 60 * 1000,
      });
      customerIds.push(customerId);
    }

    // Create transactions for the past 30 days
    const transactionIds: Id<"transactions">[] = [];
    for (let day = 0; day < 30; day++) {
      const transactionsPerDay = Math.floor(Math.random() * 20) + 30; // 30-50 per day

      for (let t = 0; t < transactionsPerDay; t++) {
        const transactionDate = now - (day * 24 * 60 * 60 * 1000) - Math.random() * 12 * 60 * 60 * 1000;
        const subtotal = Math.floor(Math.random() * 150) + 30;
        const taxAmount = Math.round(subtotal * 0.15 * 100) / 100;
        const discountAmount = Math.random() > 0.8 ? Math.floor(Math.random() * 10) + 5 : 0;
        const totalAmount = subtotal + taxAmount - discountAmount;

        const transactionId = await ctx.db.insert("transactions", {
          dispensaryId,
          customerId: customerIds[Math.floor(Math.random() * customerIds.length)],
          transactionNumber: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          transactionType: "sale",
          subtotal,
          taxAmount,
          discountAmount,
          totalAmount,
          paymentMethod: ["cash", "debit", "credit"][Math.floor(Math.random() * 3)],
          transactionDate,
          createdAt: transactionDate,
        });
        transactionIds.push(transactionId);

        // Add 1-3 items per transaction
        const itemCount = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < itemCount; i++) {
          const productId = productIds[Math.floor(Math.random() * productIds.length)];
          const quantity = Math.floor(Math.random() * 3) + 1;
          const unitPrice = products[productIds.indexOf(productId)]?.retailPrice || 45;

          await ctx.db.insert("transactionItems", {
            transactionId,
            productId,
            quantity,
            unitPrice,
            lineTotal: quantity * unitPrice,
            productSnapshot: { name: products[productIds.indexOf(productId)]?.name },
            createdAt: transactionDate,
          });
        }
      }
    }

    // Create compliance flags
    await ctx.db.insert("complianceFlags", {
      dispensaryId,
      flagType: "inventory",
      severity: "warning",
      title: "Low inventory threshold reached",
      description: "3 products below minimum stock levels",
      flaggedAt: now,
      createdAt: now,
    });

    await ctx.db.insert("complianceFlags", {
      dispensaryId,
      flagType: "documentation",
      severity: "warning",
      title: "License renewal due",
      description: "State license expires in 30 days",
      flaggedAt: now - 5 * 24 * 60 * 60 * 1000,
      createdAt: now - 5 * 24 * 60 * 60 * 1000,
    });

    return {
      message: "Database seeded successfully",
      dispensaryId,
      productsCreated: products.length,
      customersCreated: customerIds.length,
      transactionsCreated: transactionIds.length,
    };
  },
});

/**
 * Get the test dispensary ID for bypass mode
 */
export const getTestDispensary = mutation({
  args: {},
  handler: async (ctx) => {
    const dispensary = await ctx.db.query("dispensaries").first();
    return dispensary;
  },
});
