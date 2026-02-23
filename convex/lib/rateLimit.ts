import { MutationCtx, QueryCtx } from "../_generated/server";

// ============================================================================
// RATE LIMITING CONFIGURATION
// ============================================================================

/**
 * Rate limit configurations by action
 * Format: { maxRequests: number, windowMs: number }
 */
export const RATE_LIMITS: Record<string, { maxRequests: number; windowMs: number }> = {
  // Bulk operations - very strict limits
  bulkImport: { maxRequests: 5, windowMs: 60 * 60 * 1000 }, // 5 per hour
  bulkExport: { maxRequests: 10, windowMs: 60 * 60 * 1000 }, // 10 per hour

  // Sales transactions - reasonable business limits
  createSale: { maxRequests: 100, windowMs: 60 * 1000 }, // 100 per minute
  createReturn: { maxRequests: 20, windowMs: 60 * 1000 }, // 20 per minute

  // Data modifications - moderate limits
  createProduct: { maxRequests: 50, windowMs: 60 * 1000 }, // 50 per minute
  updateProduct: { maxRequests: 100, windowMs: 60 * 1000 }, // 100 per minute
  deleteProduct: { maxRequests: 20, windowMs: 60 * 1000 }, // 20 per minute

  // User management - strict limits
  createUser: { maxRequests: 10, windowMs: 60 * 60 * 1000 }, // 10 per hour
  updateUser: { maxRequests: 30, windowMs: 60 * 1000 }, // 30 per minute

  // Report generation - resource intensive
  generateReport: { maxRequests: 10, windowMs: 60 * 60 * 1000 }, // 10 per hour

  // Default for unspecified actions
  default: { maxRequests: 60, windowMs: 60 * 1000 }, // 60 per minute
};

// ============================================================================
// RATE LIMIT ERROR
// ============================================================================

export class RateLimitError extends Error {
  public readonly retryAfterMs: number;
  public readonly action: string;

  constructor(action: string, retryAfterMs: number) {
    super(`Rate limit exceeded for action: ${action}. Retry after ${Math.ceil(retryAfterMs / 1000)} seconds.`);
    this.name = "RateLimitError";
    this.action = action;
    this.retryAfterMs = retryAfterMs;
  }
}

// ============================================================================
// RATE LIMIT CHECK
// ============================================================================

/**
 * Check if a request is allowed under rate limits
 * Must be called within a mutation context
 *
 * @param ctx - Mutation context
 * @param identifier - User ID or IP address
 * @param action - The action being rate limited
 * @throws RateLimitError if rate limit exceeded
 */
export async function checkRateLimit(
  ctx: MutationCtx,
  identifier: string,
  action: string
): Promise<void> {
  const now = Date.now();
  const config = RATE_LIMITS[action] || RATE_LIMITS.default;
  const { maxRequests, windowMs } = config;

  // Find existing rate limit record
  const existing = await ctx.db
    .query("rateLimits")
    .withIndex("by_identifier_action", (q) =>
      q.eq("identifier", identifier).eq("action", action)
    )
    .first();

  if (existing) {
    // Check if we're in the same window
    const windowEnd = existing.windowStart + windowMs;

    if (now < windowEnd) {
      // Same window - check if limit exceeded
      if (existing.requestCount >= maxRequests) {
        const retryAfterMs = windowEnd - now;
        throw new RateLimitError(action, retryAfterMs);
      }

      // Increment counter
      await ctx.db.patch(existing._id, {
        requestCount: existing.requestCount + 1,
        updatedAt: now,
      });
    } else {
      // New window - reset counter
      await ctx.db.patch(existing._id, {
        windowStart: now,
        requestCount: 1,
        updatedAt: now,
      });
    }
  } else {
    // First request - create record
    await ctx.db.insert("rateLimits", {
      identifier,
      action,
      windowStart: now,
      requestCount: 1,
      updatedAt: now,
    });
  }
}

/**
 * Get the current rate limit status for an action
 * Useful for showing remaining requests to users
 *
 * @param ctx - Query or Mutation context
 * @param identifier - User ID or IP address
 * @param action - The action to check
 */
export async function getRateLimitStatus(
  ctx: QueryCtx | MutationCtx,
  identifier: string,
  action: string
): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
}> {
  const now = Date.now();
  const config = RATE_LIMITS[action] || RATE_LIMITS.default;
  const { maxRequests, windowMs } = config;

  const existing = await ctx.db
    .query("rateLimits")
    .withIndex("by_identifier_action", (q) =>
      q.eq("identifier", identifier).eq("action", action)
    )
    .first();

  if (!existing) {
    return {
      allowed: true,
      remaining: maxRequests,
      resetAt: now + windowMs,
      limit: maxRequests,
    };
  }

  const windowEnd = existing.windowStart + windowMs;

  if (now >= windowEnd) {
    // Window expired
    return {
      allowed: true,
      remaining: maxRequests,
      resetAt: now + windowMs,
      limit: maxRequests,
    };
  }

  const remaining = Math.max(0, maxRequests - existing.requestCount);

  return {
    allowed: remaining > 0,
    remaining,
    resetAt: windowEnd,
    limit: maxRequests,
  };
}

/**
 * Clean up old rate limit records
 * Should be called periodically (e.g., via cron)
 *
 * @param ctx - Mutation context
 * @param olderThanMs - Delete records older than this (default: 24 hours)
 */
export async function cleanupRateLimits(
  ctx: MutationCtx,
  olderThanMs: number = 24 * 60 * 60 * 1000
): Promise<number> {
  const cutoff = Date.now() - olderThanMs;

  const oldRecords = await ctx.db
    .query("rateLimits")
    .withIndex("by_window", (q) => q.lt("windowStart", cutoff))
    .collect();

  for (const record of oldRecords) {
    await ctx.db.delete(record._id);
  }

  return oldRecords.length;
}
