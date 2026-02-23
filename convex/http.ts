import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

// ============================================================================
// CLERK WEBHOOK TYPES
// ============================================================================

interface ClerkEmailAddress {
  id: string;
  email_address: string;
}

// ============================================================================
// WEBHOOK SIGNATURE VERIFICATION
// ============================================================================

/**
 * Verify Clerk webhook signature using Svix
 * Based on: https://clerk.com/docs/integrations/webhooks/sync-data
 */
async function verifyWebhookSignature(
  payload: string,
  headers: {
    svixId: string | null;
    svixTimestamp: string | null;
    svixSignature: string | null;
  },
  secret: string
): Promise<boolean> {
  const { svixId, svixTimestamp, svixSignature } = headers;

  if (!svixId || !svixTimestamp || !svixSignature) {
    return false;
  }

  // Check timestamp is within 5 minutes to prevent replay attacks
  const timestampMs = parseInt(svixTimestamp) * 1000;
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;

  if (Math.abs(now - timestampMs) > fiveMinutes) {
    console.error("Webhook timestamp too old or in future");
    return false;
  }

  // Construct the signed payload
  const signedPayload = `${svixId}.${svixTimestamp}.${payload}`;

  // Get the expected signature
  // Clerk webhook secrets are prefixed with "whsec_"
  const secretBytes = secret.startsWith("whsec_")
    ? Uint8Array.from(atob(secret.slice(6)), c => c.charCodeAt(0))
    : new TextEncoder().encode(secret);

  // Import the key for HMAC
  const key = await crypto.subtle.importKey(
    "raw",
    secretBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  // Compute the signature
  const signatureBytes = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(signedPayload)
  );

  // Convert to base64
  const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)));

  // Svix signature header contains multiple signatures, check if any match
  const signatures = svixSignature.split(" ");
  for (const sig of signatures) {
    const [version, signature] = sig.split(",");
    if (version === "v1" && signature === expectedSignature) {
      return true;
    }
  }

  console.error("Webhook signature verification failed");
  return false;
}

// ============================================================================
// CLERK WEBHOOK
// ============================================================================

/**
 * Handle Clerk user webhooks
 * Events: user.created, user.updated, user.deleted
 *
 * Configure in Clerk Dashboard:
 * URL: https://your-deployment.convex.cloud/clerk-webhook
 * Events: user.created, user.updated, user.deleted
 */
http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

    // SECURITY: Fail closed - require webhook secret to be configured
    if (!webhookSecret) {
      console.error(
        "CLERK_WEBHOOK_SECRET not configured. " +
        "Webhook requests will be rejected for security. " +
        "Set CLERK_WEBHOOK_SECRET in Convex environment variables."
      );
      return new Response(
        "Webhook secret not configured - request rejected for security",
        { status: 500 }
      );
    }

    // Get the raw body for signature verification
    const payloadText = await request.text();

    // Verify webhook signature - ALWAYS required
    const isValid = await verifyWebhookSignature(
      payloadText,
      {
        svixId: request.headers.get("svix-id"),
        svixTimestamp: request.headers.get("svix-timestamp"),
        svixSignature: request.headers.get("svix-signature"),
      },
      webhookSecret
    );

    if (!isValid) {
      console.error("Invalid webhook signature - request rejected");
      return new Response("Invalid webhook signature", { status: 401 });
    }

    const payload = JSON.parse(payloadText);
    const { type, data } = payload;

    console.log(`Clerk webhook received: ${type}`, data.id);

    switch (type) {
      case "user.created": {
        // Note: We don't create users automatically on signup
        // Users are created when they're added to a dispensary by an admin
        // This is for multi-tenant security
        console.log(`User created in Clerk: ${data.id}`);
        break;
      }

      case "user.updated": {
        // Update user info if they exist in our system
        await ctx.runMutation(internal.users.syncClerkUser, {
          clerkId: data.id,
          email:
            (data.email_addresses as ClerkEmailAddress[] | undefined)?.find(
              (e) => e.id === data.primary_email_address_id
            )?.email_address || "",
          fullName: `${data.first_name || ""} ${data.last_name || ""}`.trim(),
          avatarUrl: data.image_url,
        });
        break;
      }

      case "user.deleted": {
        // Deactivate user (don't delete for audit purposes)
        await ctx.runMutation(internal.users.deactivateByClerkId, {
          clerkId: data.id,
        });
        break;
      }

      default:
        console.log(`Unhandled webhook type: ${type}`);
    }

    return new Response("OK", { status: 200 });
  }),
});

// ============================================================================
// OCP ADVISORY WEBHOOK
// ============================================================================

/**
 * OCP Advisory webhook payload from n8n
 */
interface OCPAdvisoryPayload {
  ocpAdvisoryId: string;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  advisoryType: "recall" | "safety_alert" | "contamination" | "labeling" | "other";
  sourceUrl: string;
  publishedAt: number;
  affectedProducts?: string[];
  affectedStrains?: string[];
  affectedBrands?: string[];
  affectedBatchNumbers?: string[];
  affectedLicenses?: string[];
  contaminants?: string[];
  recommendedAction?: string;
  regulatoryReference?: string;
  expiresAt?: number;
}

/**
 * Verify HMAC signature for n8n webhook
 * Uses a shared secret for authentication
 */
async function verifyOCPWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string
): Promise<boolean> {
  if (!signature) {
    return false;
  }

  // Import the key for HMAC
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  // Compute the expected signature
  const signatureBytes = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );

  // Convert to hex
  const expectedSignature = Array.from(new Uint8Array(signatureBytes))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");

  // Compare signatures (constant-time comparison would be better, but this is acceptable)
  // Support both raw signature and "sha256=" prefixed format
  const cleanSignature = signature.replace(/^sha256=/, "");
  return cleanSignature === expectedSignature;
}

/**
 * Handle OCP Advisory webhooks from n8n
 * Endpoint: /ocp-advisory-webhook
 *
 * Expected headers:
 * - x-webhook-signature: HMAC-SHA256 signature of the payload
 *
 * Configure n8n to:
 * 1. Scrape Maine OCP advisories
 * 2. Parse and format as OCPAdvisoryPayload
 * 3. POST to this endpoint with signature
 */
http.route({
  path: "/ocp-advisory-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const webhookSecret = process.env.OCP_WEBHOOK_SECRET;

    // SECURITY: Fail closed - require webhook secret to be configured
    if (!webhookSecret) {
      console.error(
        "OCP_WEBHOOK_SECRET not configured. " +
        "Webhook requests will be rejected for security. " +
        "Set OCP_WEBHOOK_SECRET in Convex environment variables."
      );
      return new Response(
        JSON.stringify({ error: "Webhook secret not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get the raw body for signature verification
    const payloadText = await request.text();

    // Verify webhook signature
    const signature = request.headers.get("x-webhook-signature");
    const isValid = await verifyOCPWebhookSignature(payloadText, signature, webhookSecret);

    if (!isValid) {
      console.error("Invalid OCP webhook signature - request rejected");
      return new Response(
        JSON.stringify({ error: "Invalid webhook signature" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Parse the payload
    let payload: OCPAdvisoryPayload;
    try {
      payload = JSON.parse(payloadText);
    } catch {
      console.error("Invalid JSON payload in OCP webhook");
      return new Response(
        JSON.stringify({ error: "Invalid JSON payload" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate required fields
    const requiredFields = ["ocpAdvisoryId", "title", "description", "severity", "advisoryType", "sourceUrl", "publishedAt"];
    const missingFields = requiredFields.filter(field => !(field in payload));
    if (missingFields.length > 0) {
      console.error(`Missing required fields in OCP webhook: ${missingFields.join(", ")}`);
      return new Response(
        JSON.stringify({ error: `Missing required fields: ${missingFields.join(", ")}` }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log(`OCP Advisory webhook received: ${payload.ocpAdvisoryId} - ${payload.title}`);

    try {
      // Ingest the advisory
      const advisoryId = await ctx.runMutation(internal.ocpAdvisories.ingest, {
        ocpAdvisoryId: payload.ocpAdvisoryId,
        title: payload.title,
        description: payload.description,
        severity: payload.severity,
        advisoryType: payload.advisoryType,
        sourceUrl: payload.sourceUrl,
        publishedAt: payload.publishedAt,
        affectedProducts: payload.affectedProducts,
        affectedStrains: payload.affectedStrains,
        affectedBrands: payload.affectedBrands,
        affectedBatchNumbers: payload.affectedBatchNumbers,
        affectedLicenses: payload.affectedLicenses,
        contaminants: payload.contaminants,
        recommendedAction: payload.recommendedAction,
        regulatoryReference: payload.regulatoryReference,
        expiresAt: payload.expiresAt,
      });

      // Schedule processing to cross-reference against all dispensary inventories
      await ctx.scheduler.runAfter(0, internal.ocpAdvisories.processAdvisory, {
        advisoryId,
      });

      console.log(`OCP Advisory ${payload.ocpAdvisoryId} ingested and processing scheduled`);

      return new Response(
        JSON.stringify({
          success: true,
          advisoryId,
          message: "Advisory ingested and processing scheduled",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("Error processing OCP advisory webhook:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to process advisory",
          details: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

// ============================================================================
// POS PAYMENT WEBHOOKS
// ============================================================================

/**
 * Verify HMAC signature for POS webhooks
 * Uses dispensary-specific webhook secret
 */
async function verifyPOSWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string
): Promise<boolean> {
  if (!signature || !secret) {
    return false;
  }

  // Import the key for HMAC
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  // Compute the expected signature
  const signatureBytes = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );

  // Convert to hex
  const expectedSignature = Array.from(new Uint8Array(signatureBytes))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");

  // Support multiple signature formats
  const cleanSignature = signature.replace(/^sha256=/, "").toLowerCase();
  return cleanSignature === expectedSignature.toLowerCase();
}

/**
 * Handle Flowhub POS webhooks
 * Endpoint: /pos/flowhub/webhook
 *
 * Flowhub sends webhooks for:
 * - sale.completed - Sale finalized in POS
 * - sale.voided - Sale voided
 * - sale.refunded - Sale refunded
 *
 * Expected headers:
 * - x-flowhub-signature: HMAC-SHA256 signature
 * - x-flowhub-location: Location ID
 */
http.route({
  path: "/pos/flowhub/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const locationId = request.headers.get("x-flowhub-location");

    if (!locationId) {
      return new Response(
        JSON.stringify({ error: "Missing x-flowhub-location header" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get the raw body for signature verification
    const payloadText = await request.text();

    // Look up the dispensary config by location ID to get webhook secret
    const config = await ctx.runMutation(internal.payments.getPaymentConfigByLocationId, {
      posLocationId: locationId,
    });

    if (!config) {
      console.error(`No payment config found for Flowhub location: ${locationId}`);
      return new Response(
        JSON.stringify({ error: "Location not configured" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Verify webhook signature
    const signature = request.headers.get("x-flowhub-signature");
    if (config.posWebhookSecret) {
      const isValid = await verifyPOSWebhookSignature(
        payloadText,
        signature,
        config.posWebhookSecret
      );

      if (!isValid) {
        console.error("Invalid Flowhub webhook signature - request rejected");
        return new Response(
          JSON.stringify({ error: "Invalid webhook signature" }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    } else {
      console.warn(`Flowhub webhook secret not configured for location ${locationId}`);
    }

    // Parse the payload
    let payload;
    try {
      payload = JSON.parse(payloadText);
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON payload" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Flowhub webhook received: ${payload.event} for location ${locationId}`);

    try {
      // Process the webhook
      await ctx.runMutation(internal.payments.handlePOSWebhook, {
        posProvider: "flowhub",
        eventType: payload.event,
        posTransactionId: payload.sale_id || payload.transaction_id,
        status: payload.status,
        rawPayload: payload,
      });

      return new Response(
        JSON.stringify({ success: true }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("Error processing Flowhub webhook:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to process webhook",
          details: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

/**
 * Generic POS webhook endpoint
 * Endpoint: /pos/:provider/webhook
 *
 * Used for POS systems without a dedicated endpoint.
 * The provider is specified in the URL path.
 */
http.route({
  path: "/pos/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const provider = url.searchParams.get("provider");

    if (!provider) {
      return new Response(
        JSON.stringify({ error: "Missing provider query parameter" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const payloadText = await request.text();

    let payload;
    try {
      payload = JSON.parse(payloadText);
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON payload" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log(`POS webhook received from ${provider}:`, payload.event || "unknown event");

    try {
      await ctx.runMutation(internal.payments.handlePOSWebhook, {
        posProvider: provider,
        eventType: payload.event || payload.type || "unknown",
        posTransactionId: payload.transaction_id || payload.sale_id || payload.id,
        status: payload.status,
        rawPayload: payload,
      });

      return new Response(
        JSON.stringify({ success: true }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error(`Error processing ${provider} webhook:`, error);
      return new Response(
        JSON.stringify({
          error: "Failed to process webhook",
          details: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

http.route({
  path: "/health",
  method: "GET",
  handler: httpAction(async () => {
    return new Response(
      JSON.stringify({
        status: "ok",
        timestamp: new Date().toISOString(),
        service: "cannabis-admin-dashboard",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }),
});

// ============================================================================
// COLD EMAIL CAMPAIGN API (for n8n integration)
// ============================================================================

/**
 * Get prospects due for email today
 * Called by n8n on a schedule (daily at 9am)
 * GET /cold-email/due-prospects
 */
http.route({
  path: "/cold-email/due-prospects",
  method: "GET",
  handler: httpAction(async (ctx) => {
    const now = Date.now();

    // Get active prospects where nextEmailDate <= now
    const prospects = await ctx.runQuery(internal.coldEmailInternal.getDueProspectsInternal, {});

    return new Response(
      JSON.stringify({ prospects, count: prospects.length }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }),
});

/**
 * Record that an email was sent
 * Called by n8n after sending via Resend
 * POST /cold-email/record-sent
 */
http.route({
  path: "/cold-email/record-sent",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json() as {
        prospectId: string;
        emailNumber: number;
        subject: string;
        resendMessageId?: string;
      };

      const result = await ctx.runMutation(internal.coldEmailInternal.recordEmailSentInternal, {
        prospectId: body.prospectId as any,
        emailNumber: body.emailNumber,
        subject: body.subject,
        resendMessageId: body.resendMessageId,
      });

      return new Response(
        JSON.stringify({ success: true, ...result }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error: any) {
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

/**
 * Mark prospect as bounced
 * Called by Resend webhook or n8n
 * POST /cold-email/bounce
 */
http.route({
  path: "/cold-email/bounce",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json() as {
        prospectId: string;
        errorMessage?: string;
      };

      await ctx.runMutation(internal.coldEmailInternal.markBouncedInternal, {
        prospectId: body.prospectId as any,
        errorMessage: body.errorMessage,
      });

      return new Response(
        JSON.stringify({ success: true }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error: any) {
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

/**
 * Mark prospect as replied
 * POST /cold-email/replied
 */
http.route({
  path: "/cold-email/replied",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json() as {
        prospectId: string;
        notes?: string;
      };

      await ctx.runMutation(internal.coldEmailInternal.markRepliedInternal, {
        prospectId: body.prospectId as any,
        notes: body.notes,
      });

      return new Response(
        JSON.stringify({ success: true }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error: any) {
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

/**
 * Get campaign stats
 * GET /cold-email/stats
 */
http.route({
  path: "/cold-email/stats",
  method: "GET",
  handler: httpAction(async (ctx) => {
    const stats = await ctx.runQuery(internal.coldEmailInternal.getCampaignStatsInternal, {});

    return new Response(
      JSON.stringify(stats),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }),
});

// ============================================================================
// RESEND WEBHOOKS (Email Tracking)
// ============================================================================

/**
 * Handle Resend webhooks for email tracking
 * Events: email.sent, email.delivered, email.opened, email.clicked, email.bounced, email.complained
 *
 * Endpoint: /resend-webhook
 * Configure in Resend Dashboard: https://resend.com/webhooks
 */
http.route({
  path: "/resend-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const payloadText = await request.text();

    // Optional: Verify webhook signature if RESEND_WEBHOOK_SECRET is set
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = request.headers.get("svix-signature");
      const svixId = request.headers.get("svix-id");
      const svixTimestamp = request.headers.get("svix-timestamp");

      if (signature && svixId && svixTimestamp) {
        const isValid = await verifyWebhookSignature(
          payloadText,
          { svixId, svixTimestamp, svixSignature: signature },
          webhookSecret
        );

        if (!isValid) {
          console.error("Invalid Resend webhook signature");
          return new Response("Invalid signature", { status: 401 });
        }
      }
    }

    let payload;
    try {
      payload = JSON.parse(payloadText);
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    const { type, data } = payload;
    console.log(`Resend webhook: ${type}`, data?.email_id);

    try {
      await ctx.runMutation(internal.coldEmailInternal.handleResendWebhook, {
        eventType: type,
        emailId: data?.email_id,
        toEmail: data?.to?.[0] || data?.email,
        timestamp: data?.created_at ? new Date(data.created_at).getTime() : Date.now(),
        clickedUrl: data?.click?.link,
        bounceType: data?.bounce?.type,
        rawPayload: data,
      });

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error processing Resend webhook:", error);
      return new Response(
        JSON.stringify({ error: "Failed to process webhook" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }),
});

// ============================================================================
// MAINE DATA SYNC ENDPOINTS (for n8n integration)
// ============================================================================

/**
 * Sync medical caregivers from OCP CSV
 * POST /maine-data/sync-caregivers
 * Body: CSV text data
 */
http.route({
  path: "/maine-data/sync-caregivers",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const csvData = await request.text();

      if (!csvData || csvData.length < 100) {
        return new Response(
          JSON.stringify({ error: "Invalid or empty CSV data" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const result = await ctx.runMutation(internal.maineDataInternal.syncMedicalCaregivers, {
        csvData,
      });

      return new Response(
        JSON.stringify({ success: true, ...result }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Error syncing caregivers:", error);
      return new Response(
        JSON.stringify({ error: "Failed to sync caregivers", details: error instanceof Error ? error.message : "Unknown error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }),
});

/**
 * Sync medical dispensaries from OCP CSV
 * POST /maine-data/sync-dispensaries
 * Body: CSV text data
 */
http.route({
  path: "/maine-data/sync-dispensaries",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const csvData = await request.text();

      if (!csvData || csvData.length < 100) {
        return new Response(
          JSON.stringify({ error: "Invalid or empty CSV data" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const result = await ctx.runMutation(internal.maineDataInternal.syncMedicalDispensaries, {
        csvData,
      });

      return new Response(
        JSON.stringify({ success: true, ...result }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Error syncing dispensaries:", error);
      return new Response(
        JSON.stringify({ error: "Failed to sync dispensaries", details: error instanceof Error ? error.message : "Unknown error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }),
});

/**
 * Sync adult use licensees from OCP CSV
 * POST /maine-data/sync-adult-use
 * Body: CSV text data
 */
http.route({
  path: "/maine-data/sync-adult-use",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const csvData = await request.text();

      if (!csvData || csvData.length < 100) {
        return new Response(
          JSON.stringify({ error: "Invalid or empty CSV data" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const result = await ctx.runMutation(internal.maineDataInternal.syncAdultUseLicensees, {
        csvData,
      });

      return new Response(
        JSON.stringify({ success: true, ...result }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Error syncing adult use licensees:", error);
      return new Response(
        JSON.stringify({ error: "Failed to sync adult use licensees", details: error instanceof Error ? error.message : "Unknown error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }),
});

/**
 * Sync compliance violations from OCP
 * POST /maine-data/sync-violations
 * Body: JSON array of violations matching OCP table format
 *
 * Expected format:
 * {
 *   "violations": [
 *     {
 *       "date": "7/18/2025",
 *       "registrant": "Joseph Volvens",
 *       "registrationNumber": "CGR31667",
 *       "action": "Revoked",
 *       "settledFineAmount": "$16,500.00",
 *       "documentType": "Settlement Agreement",
 *       "documentUrl": "https://..." (optional)
 *     }
 *   ],
 *   "programType": "medical" (optional, defaults to medical)
 * }
 */
http.route({
  path: "/maine-data/sync-violations",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json() as {
        violations: Array<{
          date: string;
          registrant: string;
          registrationNumber: string;
          action: string;
          settledFineAmount: string;
          documentType: string;
          documentUrl?: string;
        }>;
        programType?: "medical" | "adult_use";
      };

      if (!body.violations || !Array.isArray(body.violations) || body.violations.length === 0) {
        return new Response(
          JSON.stringify({ error: "Invalid or empty violations array" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const result = await ctx.runMutation(internal.maineDataInternal.syncViolations, {
        violations: body.violations,
        programType: body.programType,
      });

      return new Response(
        JSON.stringify({ success: true, ...result }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Error syncing violations:", error);
      return new Response(
        JSON.stringify({ error: "Failed to sync violations", details: error instanceof Error ? error.message : "Unknown error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }),
});

/**
 * Verify a Maine cannabis license
 * GET /maine-data/verify-license?registrationNumber=CGR12345
 */
http.route({
  path: "/maine-data/verify-license",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const registrationNumber = url.searchParams.get("registrationNumber");

    if (!registrationNumber) {
      return new Response(
        JSON.stringify({ error: "Missing registrationNumber query parameter" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = await ctx.runQuery(internal.maineDataInternal.verifyLicenseInternal, {
      registrationNumber,
    });

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }),
});

/**
 * Get Maine market statistics
 * GET /maine-data/market-stats
 */
http.route({
  path: "/maine-data/market-stats",
  method: "GET",
  handler: httpAction(async (ctx) => {
    const stats = await ctx.runQuery(internal.maineDataInternal.getMarketStatsInternal, {});

    return new Response(
      JSON.stringify(stats),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }),
});

/**
 * Seed regulations and sales data
 * POST /maine-data/seed
 */
http.route({
  path: "/maine-data/seed",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json() as {
        seedType: "regulations" | "sales" | "both";
        salesData?: Array<{
          year: number;
          month: number;
          medicalSales?: number;
          adultUseSales?: number;
        }>;
      };

      const results: Record<string, any> = {};

      if (body.seedType === "regulations" || body.seedType === "both") {
        results.regulations = await ctx.runMutation(internal.maineDataInternal.seedRegulations, {});
      }

      if ((body.seedType === "sales" || body.seedType === "both") && body.salesData) {
        results.sales = await ctx.runMutation(internal.maineDataInternal.seedSalesData, {
          salesData: body.salesData,
        });
      }

      return new Response(
        JSON.stringify({ success: true, ...results }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Error seeding data:", error);
      return new Response(
        JSON.stringify({ error: "Failed to seed data", details: error instanceof Error ? error.message : "Unknown error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }),
});

/**
 * Flag expiring licenses and update prospects
 * POST /maine-data/flag-expiring
 */
http.route({
  path: "/maine-data/flag-expiring",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json() as { daysThreshold?: number };

      const result = await ctx.runMutation(internal.maineDataInternal.flagExpiringLicenses, {
        daysThreshold: body.daysThreshold,
      });

      return new Response(
        JSON.stringify({ success: true, ...result }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Error flagging expiring licenses:", error);
      return new Response(
        JSON.stringify({ error: "Failed to flag expiring licenses", details: error instanceof Error ? error.message : "Unknown error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }),
});

export default http;
