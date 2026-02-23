# Dispensary Prospect Enrichment Guide

## The Problem

Your Maine dispensary license CSV has **business names but no contact info**:
- No email addresses
- No phone numbers
- No physical addresses (in this export)
- No owner/contact names

You need to enrich this data before cold outreach.

---

## Enrichment Methods (Ranked by Effectiveness)

### 1. Apollo.io (Recommended)
**Cost**: Free tier = 50 exports/month, $49/mo for 500+
**Data**: Owner names, emails, LinkedIn profiles, company size

**How to use:**
1. Create Apollo account: https://apollo.io
2. Search: "cannabis dispensary Maine" or company names directly
3. Export contacts with emails
4. Cross-reference with your license list

**Pros**: Most accurate for B2B, includes LinkedIn profiles
**Cons**: Cannabis companies sometimes hidden due to platform policies

---

### 2. LinkedIn Sales Navigator + Hunter.io
**Cost**: Sales Nav $99/mo + Hunter $49/mo
**Data**: Owner names → email patterns

**How to use:**
1. Search each dispensary name on LinkedIn
2. Find owner/GM profiles
3. Use Hunter.io to find email pattern (e.g., first@company.com)
4. Verify emails with Hunter

**Pros**: High accuracy for owner-level contacts
**Cons**: Manual process, time-consuming

---

### 3. Google Maps + Website Scraping
**Cost**: Free (manual) or ~$20 for scraping tools
**Data**: Phone, address, website, sometimes email

**How to use:**
1. Search each dispensary on Google Maps
2. Get: address, phone, website URL
3. Visit website → look for contact page, About page
4. Extract owner names, emails from website

**Tools**:
- Instant Data Scraper (Chrome extension)
- Phantombuster
- Manual spreadsheet work

---

### 4. Weedmaps/Leafly Directories
**Cost**: Free
**Data**: Address, phone, hours, sometimes email

**How to use:**
1. Search each dispensary on Weedmaps
2. Copy contact details
3. Many list email or contact form

**Note**: Not all Maine medical dispensaries are listed

---

### 5. Maine OCP Records Request
**Cost**: Free (public records)
**Data**: Owner names, registered agent, business address

**How to use:**
1. File public records request with Maine Office of Cannabis Policy
2. Request: "Contact information for licensed medical dispensaries"
3. May include owner names and registered business addresses

---

## Recommended Workflow

```
Step 1: Dedupe your license list (remove duplicates)
        → ~80 unique dispensaries

Step 2: Google search "[Dispensary Name] Maine owner"
        → Get owner first/last names for ~60%

Step 3: Apollo.io search for remaining
        → Get emails for ~40%

Step 4: Hunter.io email finder for the rest
        → Verify and find patterns

Step 5: Manual website/LinkedIn for stragglers
        → Fill in gaps

Expected result: 60-70% email coverage
```

---

## Data Schema for Supabase

```sql
-- Run this in Supabase SQL editor

CREATE TABLE cold_email_prospects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- From license data
  dispensary_name TEXT NOT NULL,
  license_number TEXT,
  license_expiration DATE,

  -- Enriched data
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  city TEXT,
  website TEXT,
  linkedin_url TEXT,

  -- Email campaign tracking
  status TEXT DEFAULT 'pending', -- pending, active, completed, replied, unsubscribed, bounced
  email_sequence_position INT DEFAULT 1,
  last_email_sent TIMESTAMP,
  next_email_date DATE,

  -- Metadata
  source TEXT, -- 'maine_ocp', 'apollo', 'manual'
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Email send log
CREATE TABLE cold_email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prospect_id UUID REFERENCES cold_email_prospects(id),
  email_number INT,
  subject TEXT,
  sent_at TIMESTAMP DEFAULT NOW(),
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,
  replied_at TIMESTAMP,
  bounced BOOLEAN DEFAULT FALSE
);

-- Index for daily sends
CREATE INDEX idx_prospects_next_email ON cold_email_prospects(status, next_email_date);
```

---

## Exclusion List

Remove these from outreach (MSOs / chains):

| Company | Reason |
|---------|--------|
| Curaleaf | National MSO |
| Marijuanaville | 10+ locations (Berenyi family) |
| Wellness Connection | Large chain |

---

## Import Script

After enrichment, import to Supabase:

```javascript
// n8n Code node or standalone script
const prospects = [
  {
    dispensary_name: "Hazy Hill Farm",
    license_number: "DSP204",
    first_name: "Owner",
    last_name: "Name",
    email: "owner@hazyhillfarm.com",
    city: "Location",
    status: "pending",
    email_sequence_position: 1,
    next_email_date: "2025-01-28" // Start date
  },
  // ... more prospects
];

// Insert via Supabase client
const { data, error } = await supabase
  .from('cold_email_prospects')
  .insert(prospects);
```

---

## Email Warmup (Critical!)

**Do NOT send from a new domain immediately.**

Before launching:
1. Set up email on cannaconnect.io (or new domain like `mail.cannaconnect.io`)
2. Use warmup service for 2-3 weeks:
   - Instantly.ai (built-in warmup)
   - Warmup Inbox ($9/mo)
   - Lemwarm (free with Lemlist)
3. Start with 5-10 emails/day, increase gradually
4. Set up SPF, DKIM, DMARC records

**Sending limits:**
- Week 1-2: 10 emails/day max
- Week 3-4: 25 emails/day
- Week 5+: 50 emails/day (safe limit)

---

## Quick Start Checklist

- [ ] Dedupe license CSV → unique dispensary list
- [ ] Create Apollo.io account
- [ ] Enrich 20 prospects (test batch)
- [ ] Create Supabase tables (SQL above)
- [ ] Import test batch
- [ ] Set up email domain + warmup
- [ ] Test n8n workflow with 5 prospects
- [ ] Launch to remaining list
