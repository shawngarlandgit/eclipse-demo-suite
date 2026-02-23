import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

const EMAIL_TEMPLATES = {
  1: {
    subject: "Founder pricing — Friday only",
    templateName: "email_1_invitation",
    daysUntilNext: 2,
  },
  2: {
    subject: "One spot left (closing today)",
    templateName: "email_2_urgency",
    daysUntilNext: 3,
  },
  3: {
    subject: "Pilot's full — February cohort?",
    templateName: "email_3_waitlist",
    daysUntilNext: null, // End of sequence
  },
} as const;

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get all prospects with optional status filter
 */
export const listProspects = query({
  args: {
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("coldEmailProspects");

    if (args.status) {
      q = q.withIndex("by_status", (q) => q.eq("status", args.status));
    }

    const prospects = await q.order("desc").take(args.limit || 100);
    return prospects;
  },
});

/**
 * Get prospects due for email today
 */
export const getDueProspects = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Get active prospects where nextEmailDate <= now
    const prospects = await ctx.db
      .query("coldEmailProspects")
      .withIndex("by_next_email")
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), "active"),
          q.lte(q.field("nextEmailDate"), now)
        )
      )
      .take(50);

    return prospects;
  },
});

/**
 * Get prospect by ID
 */
export const getProspect = query({
  args: { id: v.id("coldEmailProspects") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get email logs for a prospect
 */
export const getProspectLogs = query({
  args: { prospectId: v.id("coldEmailProspects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("coldEmailLogs")
      .withIndex("by_prospect", (q) => q.eq("prospectId", args.prospectId))
      .order("desc")
      .take(20);
  },
});

/**
 * Get campaign stats
 */
export const getCampaignStats = query({
  args: {},
  handler: async (ctx) => {
    const allProspects = await ctx.db.query("coldEmailProspects").collect();

    const stats = {
      total: allProspects.length,
      pending: 0,
      active: 0,
      completed: 0,
      replied: 0,
      bounced: 0,
      unsubscribed: 0,
      withEmail: 0,
      withoutEmail: 0,
    };

    for (const p of allProspects) {
      if (p.email) stats.withEmail++;
      else stats.withoutEmail++;

      switch (p.status) {
        case "pending": stats.pending++; break;
        case "active": stats.active++; break;
        case "completed": stats.completed++; break;
        case "replied": stats.replied++; break;
        case "bounced": stats.bounced++; break;
        case "unsubscribed": stats.unsubscribed++; break;
      }
    }

    return stats;
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Import prospects from CSV data
 */
export const importProspects = mutation({
  args: {
    prospects: v.array(v.object({
      dispensaryName: v.string(),
      licenseNumber: v.optional(v.string()),
      licenseExpiration: v.optional(v.string()),
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      email: v.optional(v.string()),
      phone: v.optional(v.string()),
      city: v.optional(v.string()),
      website: v.optional(v.string()),
      source: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
    })),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let imported = 0;
    let skipped = 0;

    for (const prospect of args.prospects) {
      // Check for duplicate by license number
      if (prospect.licenseNumber) {
        const existing = await ctx.db
          .query("coldEmailProspects")
          .withIndex("by_license", (q) => q.eq("licenseNumber", prospect.licenseNumber))
          .first();

        if (existing) {
          skipped++;
          continue;
        }
      }

      await ctx.db.insert("coldEmailProspects", {
        ...prospect,
        status: "pending",
        emailSequencePosition: 1,
        totalEmailsSent: 0,
        totalOpens: 0,
        totalClicks: 0,
        createdAt: now,
      });

      imported++;
    }

    return { imported, skipped };
  },
});

/**
 * Update prospect with enriched data
 */
export const updateProspect = mutation({
  args: {
    id: v.id("coldEmailProspects"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    city: v.optional(v.string()),
    website: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    notes: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    // Filter out undefined values
    const cleanUpdates: Record<string, any> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        cleanUpdates[key] = value;
      }
    }

    await ctx.db.patch(id, cleanUpdates);
    return await ctx.db.get(id);
  },
});

/**
 * Activate prospect for email campaign
 */
export const activateProspect = mutation({
  args: {
    id: v.id("coldEmailProspects"),
    startDate: v.optional(v.number()), // Unix ms, defaults to now
  },
  handler: async (ctx, args) => {
    const prospect = await ctx.db.get(args.id);
    if (!prospect) throw new Error("Prospect not found");
    if (!prospect.email) throw new Error("Prospect has no email address");

    const startDate = args.startDate || Date.now();

    await ctx.db.patch(args.id, {
      status: "active",
      emailSequencePosition: 1,
      nextEmailDate: startDate,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.id);
  },
});

/**
 * Activate multiple prospects at once
 */
export const bulkActivate = mutation({
  args: {
    ids: v.array(v.id("coldEmailProspects")),
    startDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const startDate = args.startDate || Date.now();
    let activated = 0;
    let skipped = 0;

    for (const id of args.ids) {
      const prospect = await ctx.db.get(id);
      if (!prospect || !prospect.email) {
        skipped++;
        continue;
      }

      await ctx.db.patch(id, {
        status: "active",
        emailSequencePosition: 1,
        nextEmailDate: startDate,
        updatedAt: Date.now(),
      });

      activated++;
    }

    return { activated, skipped };
  },
});

/**
 * Record email sent and advance sequence
 */
export const recordEmailSent = mutation({
  args: {
    prospectId: v.id("coldEmailProspects"),
    emailNumber: v.number(),
    subject: v.string(),
    resendMessageId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const prospect = await ctx.db.get(args.prospectId);
    if (!prospect) throw new Error("Prospect not found");

    // Log the email
    await ctx.db.insert("coldEmailLogs", {
      prospectId: args.prospectId,
      emailNumber: args.emailNumber,
      subject: args.subject,
      templateUsed: EMAIL_TEMPLATES[args.emailNumber as keyof typeof EMAIL_TEMPLATES]?.templateName,
      status: "sent",
      sentAt: now,
      resendMessageId: args.resendMessageId,
      createdAt: now,
    });

    // Get next email timing
    const template = EMAIL_TEMPLATES[args.emailNumber as keyof typeof EMAIL_TEMPLATES];
    const nextPosition = args.emailNumber + 1;
    const isComplete = !template?.daysUntilNext || nextPosition > 3;

    // Update prospect
    await ctx.db.patch(args.prospectId, {
      emailSequencePosition: isComplete ? args.emailNumber : nextPosition,
      lastEmailSent: now,
      nextEmailDate: isComplete ? undefined : now + (template.daysUntilNext! * 24 * 60 * 60 * 1000),
      totalEmailsSent: (prospect.totalEmailsSent || 0) + 1,
      status: isComplete ? "completed" : "active",
      updatedAt: now,
    });

    return { success: true, isComplete };
  },
});

/**
 * Mark prospect as replied
 */
export const markReplied = mutation({
  args: {
    id: v.id("coldEmailProspects"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    await ctx.db.patch(args.id, {
      status: "replied",
      repliedAt: now,
      nextEmailDate: undefined, // Stop sequence
      notes: args.notes,
      updatedAt: now,
    });

    return await ctx.db.get(args.id);
  },
});

/**
 * Mark prospect as bounced
 */
export const markBounced = mutation({
  args: {
    id: v.id("coldEmailProspects"),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "bounced",
      nextEmailDate: undefined,
      notes: args.errorMessage,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Mark prospect as unsubscribed
 */
export const markUnsubscribed = mutation({
  args: { id: v.id("coldEmailProspects") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "unsubscribed",
      nextEmailDate: undefined,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Pause prospect's sequence
 */
export const pauseProspect = mutation({
  args: { id: v.id("coldEmailProspects") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "paused",
      updatedAt: Date.now(),
    });
  },
});

/**
 * Resume paused prospect
 */
export const resumeProspect = mutation({
  args: {
    id: v.id("coldEmailProspects"),
    nextEmailDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "active",
      nextEmailDate: args.nextEmailDate || Date.now(),
      updatedAt: Date.now(),
    });
  },
});

/**
 * Get email template for a prospect
 */
export const getEmailTemplate = query({
  args: {
    prospectId: v.id("coldEmailProspects"),
    emailNumber: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const prospect = await ctx.db.get(args.prospectId);
    if (!prospect) throw new Error("Prospect not found");

    const emailNum = args.emailNumber || prospect.emailSequencePosition;
    const template = EMAIL_TEMPLATES[emailNum as keyof typeof EMAIL_TEMPLATES];

    if (!template) return null;

    // Personalize subject
    let subject = template.subject;
    if (prospect.firstName) {
      subject = subject.replace("{{first_name}}", prospect.firstName);
    }

    return {
      emailNumber: emailNum,
      subject,
      templateName: template.templateName,
      prospect: {
        firstName: prospect.firstName || "there",
        dispensaryName: prospect.dispensaryName,
        city: prospect.city,
      },
    };
  },
});
