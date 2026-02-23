import { v } from "convex/values";
import { query } from "./_generated/server";

// ============================================================================
// MAINE REGULATIONS QUERIES
// ============================================================================

/**
 * List all Maine cannabis regulations
 */
export const listRegulations = query({
  args: {
    category: v.optional(v.string()),
    programType: v.optional(v.union(v.literal("medical"), v.literal("adult_use"), v.literal("both"))),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("maineRegulations");

    if (args.category) {
      q = q.withIndex("by_category", (q) => q.eq("category", args.category));
    } else if (args.programType) {
      q = q.withIndex("by_program", (q) => q.eq("programType", args.programType));
    }

    return await q.collect();
  },
});

/**
 * Get regulations by category
 */
export const getRegulationsByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("maineRegulations")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .collect();
  },
});

// ============================================================================
// MEDICAL DISPENSARY QUERIES
// ============================================================================

/**
 * List medical dispensaries with optional filters
 */
export const listMedicalDispensaries = query({
  args: {
    status: v.optional(v.string()),
    city: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("maineMedicalDispensaries");

    if (args.status) {
      q = q.withIndex("by_status", (q) => q.eq("status", args.status as any));
    } else if (args.city) {
      q = q.withIndex("by_city", (q) => q.eq("city", args.city));
    }

    const dispensaries = await q.take(args.limit || 100);
    return dispensaries;
  },
});

/**
 * Get a dispensary by registration number
 */
export const getDispensaryByRegistration = query({
  args: { registrationNumber: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("maineMedicalDispensaries")
      .withIndex("by_registration", (q) => q.eq("registrationNumber", args.registrationNumber))
      .first();
  },
});

/**
 * Get dispensaries expiring within N days
 */
export const getExpiringDispensaries = query({
  args: { daysFromNow: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const days = args.daysFromNow || 30;
    const now = Date.now();
    const futureDate = now + (days * 24 * 60 * 60 * 1000);

    const dispensaries = await ctx.db
      .query("maineMedicalDispensaries")
      .withIndex("by_expiration")
      .collect();

    return dispensaries.filter(d =>
      d.expiresAt &&
      d.expiresAt > now &&
      d.expiresAt < futureDate &&
      d.status !== "revoked"
    );
  },
});

// ============================================================================
// MEDICAL CAREGIVER QUERIES
// ============================================================================

/**
 * List medical caregivers with optional filters
 */
export const listCaregivers = query({
  args: {
    status: v.optional(v.string()),
    town: v.optional(v.string()),
    hasViolations: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("maineMedicalCaregivers");

    if (args.status) {
      q = q.withIndex("by_status", (q) => q.eq("status", args.status as any));
    } else if (args.town) {
      q = q.withIndex("by_town", (q) => q.eq("town", args.town));
    } else if (args.hasViolations !== undefined) {
      q = q.withIndex("by_violations", (q) => q.eq("hasViolations", args.hasViolations));
    }

    return await q.take(args.limit || 100);
  },
});

/**
 * Get caregiver count by status
 */
export const getCaregiverStats = query({
  args: {},
  handler: async (ctx) => {
    const caregivers = await ctx.db.query("maineMedicalCaregivers").collect();

    const stats = {
      total: caregivers.length,
      active: 0,
      suspended: 0,
      revoked: 0,
      expired: 0,
      withViolations: 0,
    };

    for (const c of caregivers) {
      if (c.status === "active") stats.active++;
      else if (c.status === "suspended") stats.suspended++;
      else if (c.status === "revoked") stats.revoked++;
      else if (c.status === "expired") stats.expired++;
      if (c.hasViolations) stats.withViolations++;
    }

    return stats;
  },
});

// ============================================================================
// LICENSE VERIFICATION
// ============================================================================

/**
 * Verify a Maine cannabis license (medical or adult use)
 * Returns license info and compliance status
 */
export const verifyLicense = query({
  args: { registrationNumber: v.string() },
  handler: async (ctx, args) => {
    const regNum = args.registrationNumber.toUpperCase().trim();

    // Check medical dispensary first
    const dispensary = await ctx.db
      .query("maineMedicalDispensaries")
      .withIndex("by_registration", (q) => q.eq("registrationNumber", regNum))
      .first();

    if (dispensary) {
      return {
        found: true,
        type: "medical_dispensary",
        registrationNumber: dispensary.registrationNumber,
        name: dispensary.businessName,
        city: dispensary.city,
        status: dispensary.status,
        expiresAt: dispensary.expiresAt,
        hasViolations: dispensary.hasViolations,
        violationCount: dispensary.violationCount,
        lastSyncedAt: dispensary.lastSyncedAt,
      };
    }

    // Check medical caregiver
    const caregiver = await ctx.db
      .query("maineMedicalCaregivers")
      .withIndex("by_registration", (q) => q.eq("registrationNumber", regNum))
      .first();

    if (caregiver) {
      return {
        found: true,
        type: "medical_caregiver",
        registrationNumber: caregiver.registrationNumber,
        registrationType: caregiver.registrationType,
        name: caregiver.name,
        town: caregiver.town,
        status: caregiver.status,
        expiresAt: caregiver.expiresAt,
        hasViolations: caregiver.hasViolations,
        violationCount: caregiver.violationCount,
        lastSyncedAt: caregiver.lastSyncedAt,
      };
    }

    // Check adult use licensee
    const adultUse = await ctx.db
      .query("maineAdultUseLicensees")
      .withIndex("by_license", (q) => q.eq("licenseNumber", regNum))
      .first();

    if (adultUse) {
      return {
        found: true,
        type: "adult_use",
        licenseType: adultUse.licenseType,
        licenseNumber: adultUse.licenseNumber,
        name: adultUse.businessName,
        city: adultUse.city,
        status: adultUse.status,
        expiresAt: adultUse.expiresAt,
        hasViolations: adultUse.hasViolations,
        violationCount: adultUse.violationCount,
        lastSyncedAt: adultUse.lastSyncedAt,
      };
    }

    return { found: false, registrationNumber: regNum };
  },
});

// ============================================================================
// SALES DATA QUERIES
// ============================================================================

/**
 * Get sales data for a specific period
 */
export const getSalesData = query({
  args: {
    year: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("maineSalesData");

    if (args.year) {
      q = q.withIndex("by_year", (q) => q.eq("year", args.year));
    }

    return await q.order("desc").take(args.limit || 24);
  },
});

/**
 * Get sales trends (YTD comparison)
 */
export const getSalesTrends = query({
  args: { year: v.number() },
  handler: async (ctx, args) => {
    const currentYearData = await ctx.db
      .query("maineSalesData")
      .withIndex("by_year", (q) => q.eq("year", args.year))
      .collect();

    const previousYearData = await ctx.db
      .query("maineSalesData")
      .withIndex("by_year", (q) => q.eq("year", args.year - 1))
      .collect();

    // Calculate YTD totals
    const currentYTD = {
      medical: currentYearData.reduce((sum, d) => sum + (d.medicalSales || 0), 0),
      adultUse: currentYearData.reduce((sum, d) => sum + (d.adultUseSales || 0), 0),
      total: currentYearData.reduce((sum, d) => sum + d.totalSales, 0),
    };

    // Get same months for previous year
    const currentMonths = currentYearData.map(d => d.month);
    const previousYTDData = previousYearData.filter(d => currentMonths.includes(d.month));

    const previousYTD = {
      medical: previousYTDData.reduce((sum, d) => sum + (d.medicalSales || 0), 0),
      adultUse: previousYTDData.reduce((sum, d) => sum + (d.adultUseSales || 0), 0),
      total: previousYTDData.reduce((sum, d) => sum + d.totalSales, 0),
    };

    // Calculate YoY change
    const yoyChange = previousYTD.total > 0
      ? ((currentYTD.total - previousYTD.total) / previousYTD.total) * 100
      : null;

    return {
      year: args.year,
      monthsReported: currentYearData.length,
      currentYTD,
      previousYTD,
      yoyChangePercent: yoyChange,
      monthlyData: currentYearData.sort((a, b) => a.month - b.month),
    };
  },
});

// ============================================================================
// COMPLIANCE / VIOLATIONS QUERIES
// ============================================================================

/**
 * List compliance violations with optional filters
 */
export const listViolations = query({
  args: {
    programType: v.optional(v.union(v.literal("medical"), v.literal("adult_use"))),
    violationType: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("maineComplianceViolations");

    if (args.programType) {
      q = q.withIndex("by_program", (q) => q.eq("programType", args.programType));
    }

    const violations = await q.order("desc").take(args.limit || 50);

    // If filtering by violationType, do it in memory (secondary filter)
    if (args.violationType) {
      return violations.filter(v => v.violationType === args.violationType);
    }

    return violations;
  },
});

/**
 * Get violations for a specific registration number
 */
export const getViolationsByRegistration = query({
  args: { registrationNumber: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("maineComplianceViolations")
      .withIndex("by_registration", (q) => q.eq("registrationNumber", args.registrationNumber))
      .collect();
  },
});

/**
 * Get recent violations (last N days)
 */
export const getRecentViolations = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const daysBack = args.days || 90;
    const cutoffDate = Date.now() - (daysBack * 24 * 60 * 60 * 1000);

    const violations = await ctx.db
      .query("maineComplianceViolations")
      .withIndex("by_date")
      .order("desc")
      .take(100);

    return violations.filter(v => v.violationDate > cutoffDate);
  },
});

// ============================================================================
// ADULT USE QUERIES
// ============================================================================

/**
 * List adult use licensees
 */
export const listAdultUseLicensees = query({
  args: {
    licenseType: v.optional(v.string()),
    status: v.optional(v.string()),
    city: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("maineAdultUseLicensees");

    if (args.licenseType) {
      q = q.withIndex("by_type", (q) => q.eq("licenseType", args.licenseType));
    } else if (args.status) {
      q = q.withIndex("by_status", (q) => q.eq("status", args.status as any));
    } else if (args.city) {
      q = q.withIndex("by_city", (q) => q.eq("city", args.city));
    }

    return await q.take(args.limit || 100);
  },
});

// ============================================================================
// MARKET OVERVIEW / STATS
// ============================================================================

/**
 * Get comprehensive Maine cannabis market statistics
 */
export const getMarketStats = query({
  args: {},
  handler: async (ctx) => {
    // Get counts from each table
    const [dispensaries, caregivers, adultUseLicensees, salesData, violations] = await Promise.all([
      ctx.db.query("maineMedicalDispensaries").collect(),
      ctx.db.query("maineMedicalCaregivers").collect(),
      ctx.db.query("maineAdultUseLicensees").collect(),
      ctx.db.query("maineSalesData").order("desc").take(12),
      ctx.db.query("maineComplianceViolations").order("desc").take(100),
    ]);

    // Medical dispensary stats
    const medicalDispensaryStats = {
      total: dispensaries.length,
      active: dispensaries.filter(d => d.status === "active").length,
      withViolations: dispensaries.filter(d => d.hasViolations).length,
    };

    // Caregiver stats
    const caregiverStats = {
      total: caregivers.length,
      active: caregivers.filter(c => c.status === "active").length,
      withViolations: caregivers.filter(c => c.hasViolations).length,
    };

    // Adult use stats by type
    const adultUseStats = {
      total: adultUseLicensees.length,
      active: adultUseLicensees.filter(l => l.status === "active").length,
      byType: {} as Record<string, number>,
    };

    for (const l of adultUseLicensees) {
      adultUseStats.byType[l.licenseType] = (adultUseStats.byType[l.licenseType] || 0) + 1;
    }

    // Sales data - get latest 12 months and calculate totals
    const currentYear = new Date().getFullYear();
    const currentYearSales = salesData.filter(s => s.year === currentYear);

    const salesStats = {
      ytdMedical: currentYearSales.reduce((sum, s) => sum + (s.medicalSales || 0), 0),
      ytdAdultUse: currentYearSales.reduce((sum, s) => sum + (s.adultUseSales || 0), 0),
      ytdTotal: currentYearSales.reduce((sum, s) => sum + s.totalSales, 0),
      monthsReported: currentYearSales.length,
      latestMonth: salesData[0] || null,
    };

    // Violation stats
    const recentViolations = violations.filter(v =>
      v.violationDate > Date.now() - (90 * 24 * 60 * 60 * 1000)
    );

    const violationStats = {
      totalRecentViolations: recentViolations.length,
      medicalViolations: recentViolations.filter(v => v.programType === "medical").length,
      adultUseViolations: recentViolations.filter(v => v.programType === "adult_use").length,
    };

    // Get last sync times
    const lastSyncTimes = {
      dispensaries: dispensaries.length > 0 ? Math.max(...dispensaries.map(d => d.lastSyncedAt)) : null,
      caregivers: caregivers.length > 0 ? Math.max(...caregivers.map(c => c.lastSyncedAt)) : null,
      adultUse: adultUseLicensees.length > 0 ? Math.max(...adultUseLicensees.map(l => l.lastSyncedAt)) : null,
    };

    return {
      medicalDispensaryStats,
      caregiverStats,
      adultUseStats,
      salesStats,
      violationStats,
      lastSyncTimes,
      generatedAt: Date.now(),
    };
  },
});
