# n8n OCP Advisory Scraping Workflow

This document describes how to set up the n8n workflow that scrapes Maine Office of Cannabis Policy (OCP) advisories and posts them to the cannabis-admin-dashboard webhook.

## Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Schedule       │────▶│  HTTP Request   │────▶│  Code Node      │────▶│  HTTP Request   │
│  (Daily 8am)    │     │  (Scrape OCP)   │     │  (Parse + Sign) │     │  (POST webhook) │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Prerequisites

1. **n8n instance** running (e.g., at `https://n8n.srv787225.hstgr.cloud`)
2. **Convex deployment** with `OCP_WEBHOOK_SECRET` environment variable set
3. **Webhook URL**:
   - **Production**: `https://insightful-jackal-527.convex.cloud/http/ocp-advisory-webhook`
   - **Development**: `https://fiery-cheetah-41.convex.cloud/http/ocp-advisory-webhook`
   - **Note**: Convex HTTP routes use the `/http/` prefix

## Setup Instructions

### Step 1: Set Convex Environment Variable

```bash
# Set the webhook secret in Convex
npx convex env set OCP_WEBHOOK_SECRET "your-secure-secret-here"
```

Generate a secure secret:
```bash
# Generate a random 32-byte hex string
openssl rand -hex 32
```

### Step 2: Create n8n Workflow

Create a new workflow in n8n with the following nodes:

---

## Node 1: Schedule Trigger

**Type**: Schedule Trigger

**Settings**:
- **Trigger Times**: Every day at 8:00 AM
- **Cron Expression**: `0 8 * * *`

---

## Node 2: HTTP Request (Scrape OCP)

**Type**: HTTP Request

**Settings**:
- **Method**: GET
- **URL**: `https://www.maine.gov/dafs/ocp/consumer-resources/public-notices`
- **Response Format**: HTML

**Note**: Maine OCP may have different URL structures. Adjust based on actual page structure.

---

## Node 3: Code Node (Parse + Sign)

**Type**: Code

**Mode**: Run Once for All Items

**JavaScript Code**:

```javascript
const crypto = require('crypto');

// Webhook secret - store in n8n credentials or environment
const WEBHOOK_SECRET = 'your-secure-secret-here';
const WEBHOOK_URL = 'https://insightful-jackal-527.convex.cloud/http/ocp-advisory-webhook';

// Parse HTML from previous node
const html = items[0].json.data || items[0].json.body || '';

// Helper function to extract advisories from HTML
function parseAdvisories(htmlContent) {
  const advisories = [];

  // This regex pattern should be adjusted based on actual OCP page structure
  // Example pattern for advisory blocks
  const advisoryPattern = /<article[^>]*class="[^"]*advisory[^"]*"[^>]*>([\s\S]*?)<\/article>/gi;

  let match;
  while ((match = advisoryPattern.exec(htmlContent)) !== null) {
    const block = match[1];

    // Extract title
    const titleMatch = block.match(/<h[23][^>]*>(.*?)<\/h[23]>/i);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '';

    // Extract description
    const descMatch = block.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
    const description = descMatch ? descMatch[1].replace(/<[^>]+>/g, '').trim() : '';

    // Extract date
    const dateMatch = block.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
    const dateStr = dateMatch ? dateMatch[1] : '';
    const publishedAt = dateStr ? new Date(dateStr).getTime() : Date.now();

    // Extract link
    const linkMatch = block.match(/href="([^"]+)"/i);
    const sourceUrl = linkMatch ? linkMatch[1] : 'https://www.maine.gov/dafs/ocp/consumer-resources/public-notices';

    // Generate unique ID based on title and date
    const ocpAdvisoryId = `ocp-${crypto.createHash('md5').update(title + publishedAt).digest('hex').substring(0, 12)}`;

    // Determine severity based on keywords
    let severity = 'low';
    const lowerTitle = title.toLowerCase();
    const lowerDesc = description.toLowerCase();

    if (lowerTitle.includes('recall') || lowerTitle.includes('urgent') || lowerDesc.includes('immediate')) {
      severity = 'critical';
    } else if (lowerTitle.includes('contamination') || lowerTitle.includes('health risk')) {
      severity = 'high';
    } else if (lowerTitle.includes('alert') || lowerTitle.includes('warning')) {
      severity = 'medium';
    }

    // Determine advisory type
    let advisoryType = 'other';
    if (lowerTitle.includes('recall')) {
      advisoryType = 'recall';
    } else if (lowerTitle.includes('contamination') || lowerDesc.includes('contamination')) {
      advisoryType = 'contamination';
    } else if (lowerTitle.includes('safety') || lowerTitle.includes('alert')) {
      advisoryType = 'safety_alert';
    } else if (lowerTitle.includes('label')) {
      advisoryType = 'labeling';
    }

    // Extract affected products/strains/brands (keyword-based)
    const affectedProducts = [];
    const affectedStrains = [];
    const affectedBrands = [];
    const affectedBatchNumbers = [];

    // Look for batch numbers (common patterns: LOT#, Batch#, etc.)
    const batchMatches = block.match(/(?:lot|batch|batch\s*#|lot\s*#)[:\s]*([A-Z0-9-]+)/gi);
    if (batchMatches) {
      batchMatches.forEach(m => {
        const num = m.replace(/(?:lot|batch|batch\s*#|lot\s*#)[:\s]*/i, '').trim();
        if (num) affectedBatchNumbers.push(num);
      });
    }

    // Extract contaminants if mentioned
    const contaminants = [];
    const contaminantKeywords = ['aspergillus', 'mold', 'pesticide', 'heavy metal', 'e. coli', 'salmonella', 'yeast'];
    contaminantKeywords.forEach(c => {
      if (lowerDesc.includes(c)) contaminants.push(c);
    });

    if (title) {
      advisories.push({
        ocpAdvisoryId,
        title,
        description: description || 'See source for full details.',
        severity,
        advisoryType,
        sourceUrl: sourceUrl.startsWith('http') ? sourceUrl : `https://www.maine.gov${sourceUrl}`,
        publishedAt,
        affectedProducts: affectedProducts.length > 0 ? affectedProducts : undefined,
        affectedStrains: affectedStrains.length > 0 ? affectedStrains : undefined,
        affectedBrands: affectedBrands.length > 0 ? affectedBrands : undefined,
        affectedBatchNumbers: affectedBatchNumbers.length > 0 ? affectedBatchNumbers : undefined,
        contaminants: contaminants.length > 0 ? contaminants : undefined,
      });
    }
  }

  return advisories;
}

// Sign payload with HMAC-SHA256
function signPayload(payload) {
  const payloadString = JSON.stringify(payload);
  const signature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payloadString)
    .digest('hex');
  return { payloadString, signature };
}

// Parse advisories
const advisories = parseAdvisories(html);

// If no advisories found using article pattern, try alternative parsing
if (advisories.length === 0) {
  // Fallback: Look for list items or div blocks
  const fallbackPattern = /<li[^>]*class="[^"]*notice[^"]*"[^>]*>([\s\S]*?)<\/li>/gi;
  let match;
  while ((match = fallbackPattern.exec(html)) !== null) {
    const block = match[1];
    const titleMatch = block.match(/<a[^>]*>(.*?)<\/a>/i);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '';

    if (title) {
      const ocpAdvisoryId = `ocp-${crypto.createHash('md5').update(title + Date.now()).digest('hex').substring(0, 12)}`;

      advisories.push({
        ocpAdvisoryId,
        title,
        description: 'Advisory notice from Maine OCP. See source for details.',
        severity: 'medium',
        advisoryType: 'safety_alert',
        sourceUrl: 'https://www.maine.gov/dafs/ocp/consumer-resources/public-notices',
        publishedAt: Date.now(),
      });
    }
  }
}

// Prepare webhook requests
const webhookRequests = advisories.map(advisory => {
  const { payloadString, signature } = signPayload(advisory);
  return {
    json: {
      url: WEBHOOK_URL,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-signature': signature,
      },
      body: payloadString,
      advisory: advisory, // For logging
    }
  };
});

// Return empty array if no advisories found (prevents workflow error)
return webhookRequests.length > 0 ? webhookRequests : [{ json: { skip: true, message: 'No advisories found' } }];
```

---

## Node 4: IF Node (Skip Check)

**Type**: IF

**Conditions**:
- `{{ $json.skip }}` is not equal to `true`

This prevents errors when no advisories are found.

---

## Node 5: HTTP Request (POST Webhook)

**Type**: HTTP Request

**Settings**:
- **Method**: POST
- **URL**: `{{ $json.url }}`
- **Headers**:
  - `Content-Type`: `application/json`
  - `x-webhook-signature`: `{{ $json.headers['x-webhook-signature'] }}`
- **Body Content Type**: JSON
- **Body**: `{{ $json.body }}`

---

## Webhook Payload Format

The webhook expects this payload structure:

```typescript
interface OCPAdvisoryPayload {
  // Required fields
  ocpAdvisoryId: string;        // Unique identifier from OCP
  title: string;                // Advisory title
  description: string;          // Full description
  severity: "critical" | "high" | "medium" | "low";
  advisoryType: "recall" | "safety_alert" | "contamination" | "labeling" | "other";
  sourceUrl: string;            // Link to original advisory
  publishedAt: number;          // Unix timestamp (milliseconds)

  // Optional fields
  affectedProducts?: string[];  // Product names
  affectedStrains?: string[];   // Strain names
  affectedBrands?: string[];    // Brand names
  affectedBatchNumbers?: string[]; // Batch/lot numbers
  affectedLicenses?: string[];  // License numbers
  contaminants?: string[];      // Detected contaminants
  recommendedAction?: string;   // What to do
  regulatoryReference?: string; // Regulation citation
  expiresAt?: number;           // When advisory expires
}
```

---

## Required Headers

| Header | Value | Description |
|--------|-------|-------------|
| `Content-Type` | `application/json` | Required for JSON body |
| `x-webhook-signature` | HMAC-SHA256 hex digest | Signature of the JSON payload |

---

## Signature Generation

The signature must be an HMAC-SHA256 hex digest of the JSON payload string:

```javascript
const crypto = require('crypto');

const payload = { /* advisory data */ };
const payloadString = JSON.stringify(payload);

const signature = crypto
  .createHmac('sha256', WEBHOOK_SECRET)
  .update(payloadString)
  .digest('hex');

// Send with header: x-webhook-signature: <signature>
```

---

## Testing

### Test Webhook Manually

```bash
# Generate a test advisory
PAYLOAD='{"ocpAdvisoryId":"test-001","title":"Test Advisory","description":"This is a test advisory.","severity":"low","advisoryType":"other","sourceUrl":"https://example.com","publishedAt":1737590400000}'

# Generate signature (replace YOUR_SECRET with actual secret)
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "YOUR_SECRET" 2>/dev/null | sed 's/^.* //')

# Send to webhook
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: $SIGNATURE" \
  -d "$PAYLOAD" \
  https://insightful-jackal-527.convex.cloud/http/ocp-advisory-webhook
```

### Expected Response

**Success (200)**:
```json
{
  "success": true,
  "advisoryId": "k574d7h8x9n2m3...",
  "message": "Advisory ingested and processing scheduled"
}
```

**Error (401)** - Invalid signature:
```json
{
  "error": "Invalid webhook signature"
}
```

**Error (400)** - Missing fields:
```json
{
  "error": "Missing required fields: title, severity"
}
```

---

## Monitoring

### Check n8n Execution History

1. Open n8n dashboard
2. Go to Workflow → Executions
3. Review successful/failed runs

### Check Convex Logs

```bash
npx convex logs
```

Look for:
- `OCP Advisory webhook received: <id> - <title>`
- `OCP Advisory <id> ingested and processing scheduled`

---

## Troubleshooting

### "Invalid webhook signature"

1. Verify `OCP_WEBHOOK_SECRET` is set in Convex:
   ```bash
   npx convex env get OCP_WEBHOOK_SECRET
   ```

2. Ensure the secret in n8n matches Convex

3. Check that the signature is generated from the exact JSON string being sent

### "Webhook secret not configured"

Set the environment variable:
```bash
npx convex env set OCP_WEBHOOK_SECRET "your-secret-here"
```

### No Advisories Found

1. Maine OCP website structure may have changed
2. Adjust the HTML parsing regex patterns in the Code node
3. Consider using a headless browser node for JavaScript-rendered pages

---

## Alternative: RSS Feed

If Maine OCP provides an RSS feed, use this simpler workflow:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  RSS Read       │────▶│  Code Node      │────▶│  HTTP Request   │
│  (OCP Feed)     │     │  (Transform)    │     │  (POST webhook) │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

The RSS Read node handles parsing automatically, simplifying the workflow.

---

## Security Notes

1. **Keep webhook secret secure** - Don't commit to version control
2. **Use environment variables** - Store secrets in n8n credentials
3. **Monitor for abuse** - Check logs for unexpected webhook calls
4. **Rotate secrets periodically** - Update both n8n and Convex when rotating
