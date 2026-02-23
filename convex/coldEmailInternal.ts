import { v } from "convex/values";
import { internalQuery, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ============================================================================
// EMAIL TEMPLATES (duplicated for internal use)
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
    daysUntilNext: null,
  },
} as const;

// ============================================================================
// INTERNAL QUERIES (called by HTTP routes)
// ============================================================================

export const getDueProspectsInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Get all active prospects
    const allActive = await ctx.db
      .query("coldEmailProspects")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    // Filter for those due today
    const dueProspects = allActive.filter(
      (p) => p.nextEmailDate && p.nextEmailDate <= now
    );

    // Return with email template info
    return dueProspects.map((p) => {
      const template = EMAIL_TEMPLATES[p.emailSequencePosition as keyof typeof EMAIL_TEMPLATES];
      let subject = template?.subject || "";

      // Personalize subject
      if (p.firstName) {
        subject = subject.replace("{{first_name}}", p.firstName);
      }

      return {
        _id: p._id,
        dispensaryName: p.dispensaryName,
        firstName: p.firstName || "there",
        lastName: p.lastName,
        email: p.email,
        city: p.city,
        emailNumber: p.emailSequencePosition,
        subject,
        templateName: template?.templateName,
      };
    });
  },
});

export const getCampaignStatsInternal = internalQuery({
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
      paused: 0,
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
        case "paused": stats.paused++; break;
      }
    }

    return stats;
  },
});

// ============================================================================
// INTERNAL MUTATIONS (called by HTTP routes)
// ============================================================================

export const recordEmailSentInternal = internalMutation({
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

    return { success: true, isComplete, nextPosition: isComplete ? null : nextPosition };
  },
});

export const markBouncedInternal = internalMutation({
  args: {
    prospectId: v.id("coldEmailProspects"),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.prospectId, {
      status: "bounced",
      nextEmailDate: undefined,
      notes: args.errorMessage,
      updatedAt: Date.now(),
    });
  },
});

export const markRepliedInternal = internalMutation({
  args: {
    prospectId: v.id("coldEmailProspects"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    await ctx.db.patch(args.prospectId, {
      status: "replied",
      repliedAt: now,
      nextEmailDate: undefined,
      notes: args.notes,
      updatedAt: now,
    });
  },
});

// ============================================================================
// RESEND WEBHOOK HANDLER
// ============================================================================

export const handleResendWebhook = internalMutation({
  args: {
    eventType: v.string(),
    emailId: v.optional(v.string()),
    toEmail: v.optional(v.string()),
    timestamp: v.number(),
    clickedUrl: v.optional(v.string()),
    bounceType: v.optional(v.string()),
    rawPayload: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { eventType, emailId, toEmail, timestamp, clickedUrl, bounceType } = args;

    // Find the prospect by email
    let prospect = null;
    if (toEmail) {
      prospect = await ctx.db
        .query("coldEmailProspects")
        .withIndex("by_email", (q) => q.eq("email", toEmail))
        .first();
    }

    // Find the most recent log entry for this prospect or email ID
    let logEntry = null;
    if (emailId) {
      logEntry = await ctx.db
        .query("coldEmailLogs")
        .filter((q) => q.eq(q.field("resendMessageId"), emailId))
        .first();
    } else if (prospect) {
      logEntry = await ctx.db
        .query("coldEmailLogs")
        .withIndex("by_prospect", (q) => q.eq("prospectId", prospect._id))
        .order("desc")
        .first();
    }

    // Handle different event types
    switch (eventType) {
      case "email.delivered":
        if (logEntry) {
          await ctx.db.patch(logEntry._id, {
            status: "delivered",
            deliveredAt: timestamp,
          });
        }
        break;

      case "email.opened":
        if (logEntry) {
          await ctx.db.patch(logEntry._id, {
            status: "opened",
            openedAt: timestamp,
          });
        }
        if (prospect) {
          await ctx.db.patch(prospect._id, {
            totalOpens: (prospect.totalOpens || 0) + 1,
            lastOpenedAt: timestamp,
            updatedAt: Date.now(),
          });
        }
        break;

      case "email.clicked":
        if (logEntry) {
          await ctx.db.patch(logEntry._id, {
            status: "clicked",
            clickedAt: timestamp,
            clickedUrl: clickedUrl,
          });
        }
        if (prospect) {
          await ctx.db.patch(prospect._id, {
            totalClicks: (prospect.totalClicks || 0) + 1,
            lastClickedAt: timestamp,
            updatedAt: Date.now(),
          });
        }
        break;

      case "email.bounced":
        if (logEntry) {
          await ctx.db.patch(logEntry._id, {
            status: "bounced",
            bouncedAt: timestamp,
            bounceType: bounceType,
          });
        }
        if (prospect) {
          await ctx.db.patch(prospect._id, {
            status: "bounced",
            nextEmailDate: undefined,
            notes: `Bounced: ${bounceType || "unknown"}`,
            updatedAt: Date.now(),
          });
        }
        break;

      case "email.complained":
        if (prospect) {
          await ctx.db.patch(prospect._id, {
            status: "unsubscribed",
            nextEmailDate: undefined,
            notes: "Marked as spam/complained",
            updatedAt: Date.now(),
          });
        }
        break;

      default:
        console.log(`Unhandled Resend event: ${eventType}`);
    }

    return { processed: true, eventType };
  },
});
