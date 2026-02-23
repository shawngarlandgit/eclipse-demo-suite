# Cannabis Admin Dashboard - Feature Brainstorm Context

Use this document to brainstorm new features for the Cannabis Admin Dashboard application.

---

## Project Overview

**Purpose:** A dispensary management system for cannabis retailers in Maine, focused on patient management, inventory tracking, compliance, and staff performance analytics.

**Target Users:**
- Dispensary owners/managers
- Budtenders (sales staff)
- Compliance officers
- Medical patients (limited self-service portal)

**Deployment:** Web application (React SPA) with Supabase backend

---

## Current Features

### 1. Patient/Customer Management
- Import customers from Vend POS CSV exports
- PII sanitization (SHA-256 hashing for identifiers, Base64 encoding for names)
- Medical vs recreational patient tracking
- Medical card expiration tracking
- Contact info indicators (email, phone, license on file)
- Search, filter, and sort capabilities
- Total purchase history from POS

### 2. Inventory Management
- Product catalog with cannabinoid profiles (THC%, CBD%, terpenes)
- Batch tracking with expiration dates
- Stock level monitoring with low-stock alerts
- Product categories (Flower, Concentrates, Edibles, Topicals, etc.)
- CSV import for bulk product updates

### 3. Order Flow (Budtender POS Interface)
- ID scanning (driver's license barcode parsing)
- Customer lookup by license hash
- Product selection with real-time inventory
- AI-powered strain recommendations based on:
  - Customer purchase history
  - Terpene preferences
  - Desired effects (relaxation, energy, pain relief, etc.)
- Order confirmation and receipt generation
- Tax calculation (configurable rates)

### 4. Analytics Dashboard
- Revenue trends (daily, weekly, monthly)
- Top-selling products and strains
- Category breakdown charts
- Sales by time of day/day of week
- Comparative period analysis

### 5. Staff Management
- Employee profiles with roles
- Sales performance tracking
- Recommendation success rates
- Shift scheduling (basic)
- Role-based access control (RBAC)

### 6. Compliance
- License expiration tracking
- METRC integration ready (Edge Function stub)
- Audit logging for HIPAA compliance
- Daily purchase limit tracking (Maine regulations)

### 7. Patient Self-Service Portal
- Questionnaire for preference capture
- View personalized recommendations
- Basic profile management

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript 5.9, Vite 7 |
| UI | Chakra UI, Tailwind CSS |
| State | Zustand, React Query |
| Backend | Supabase (PostgreSQL 15) |
| Auth | Supabase Auth (email/password, magic link) |
| APIs | Supabase Edge Functions (Deno) |
| Charts | Recharts |
| Forms | React Hook Form + Zod validation |

---

## Database Schema (Key Tables)

```
dispensaries          - Multi-tenant parent table
├── users             - Staff accounts (linked to auth.users)
├── customers         - Patient/customer records with hashed PII
├── products          - Inventory items
│   └── batches       - Batch tracking per product
├── orders            - Transaction records
│   └── order_items   - Line items per order
├── strains           - Cannabis strain library (900+)
└── audit_logs        - HIPAA-compliant activity logging
```

**Row-Level Security:** All tables use RLS policies for multi-tenant isolation via `dispensary_id`.

---

## User Roles & Permissions

| Role | Capabilities |
|------|--------------|
| `admin` | Full system access, user management |
| `owner` | Dispensary settings, all reports, staff management |
| `manager` | Inventory, staff schedules, most reports |
| `budtender` | POS operations, customer lookup, basic inventory view |
| `compliance` | Compliance reports, audit logs, license management |

---

## Current Limitations / Known Gaps

1. **No loyalty program** - Points system not implemented
2. **No SMS/email marketing** - Customer communication not built
3. **No online ordering** - In-store POS only
4. **Basic reporting** - No custom report builder
5. **No mobile app** - Web-only, not optimized for tablets
6. **Manual inventory** - No hardware integration (scales, scanners beyond ID)
7. **Single location** - Multi-location support is scaffolded but incomplete
8. **No payment processing** - Cash-only workflow assumed
9. **Limited patient portal** - Questionnaire only, no order history view
10. **No appointment scheduling** - Walk-in only model

---

## Integration Points (Existing or Stubbed)

| System | Status | Notes |
|--------|--------|-------|
| METRC | Stubbed | Maine state compliance tracking |
| Vend/Lightspeed POS | Import only | CSV import, no real-time sync |
| Stripe/Square | Not started | Payment processing |
| Twilio | Not started | SMS notifications |
| SendGrid | Not started | Email campaigns |

---

## Maine Cannabis Regulations Context

- Medical patients: 2.5 oz flower / 14-day period
- Recreational: 2.5 oz flower per transaction
- Must verify age 21+ (recreational) or valid medical card
- Seed-to-sale tracking required (METRC)
- No consumption on premises
- Packaging/labeling requirements

---

## Feature Brainstorm Prompts

Consider features that would:

1. **Increase revenue** - Upselling, loyalty programs, marketing
2. **Improve compliance** - Automated reporting, audit trails
3. **Enhance patient experience** - Self-service, personalization
4. **Streamline operations** - Automation, integrations, efficiency
5. **Provide insights** - Advanced analytics, predictions, trends
6. **Enable growth** - Multi-location, franchising, scalability

### Questions to Explore:
- How might we increase repeat customer visits?
- What data are we collecting that we're not leveraging?
- How can budtenders serve customers faster without sacrificing quality?
- What compliance tasks are currently manual that could be automated?
- How might patients discover new products they'd enjoy?
- What would a "VIP patient" experience look like?

---

## Example Feature Ideas (Starting Points)

- **Smart reorder alerts** - Notify patients when their favorite strain is back in stock
- **Terpene matching** - "Customers who liked X also liked Y" based on terpene profiles
- **Budtender tips/education** - Surface strain knowledge during sales
- **Wait time estimation** - Queue management for busy periods
- **Purchase predictions** - Forecast demand based on historical patterns
- **Compliance calendar** - Automated reminders for license renewals, inspections

---

## How to Use This Document

1. Share this entire document with your AI assistant
2. Ask it to generate feature ideas for a specific area (e.g., "loyalty program ideas")
3. Request user stories, wireframes, or implementation approaches
4. Iterate on the most promising concepts

**Example prompt:**
> "Based on the context provided, brainstorm 5 innovative loyalty program features that would work within Maine cannabis regulations and leverage our existing patient purchase history data."

---

*Document generated: December 30, 2024*
*Project: cannabis-admin-dashboard*
*Repo: https://github.com/shawngarlandgit/cannabis-admin-dashboard*
