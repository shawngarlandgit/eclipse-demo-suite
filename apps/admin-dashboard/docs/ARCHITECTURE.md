# Cannabis Admin Dashboard - Backend Architecture

## Table of Contents

1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [Row-Level Security (RLS)](#row-level-security-rls)
4. [Materialized Views](#materialized-views)
5. [Edge Functions](#edge-functions)
6. [Service Layer](#service-layer)
7. [Real-Time Subscriptions](#real-time-subscriptions)
8. [Security & Compliance](#security--compliance)
9. [Performance Optimization](#performance-optimization)
10. [Deployment](#deployment)

---

## Overview

The Cannabis Admin Dashboard uses Supabase as a complete backend solution, leveraging:

- **PostgreSQL** for data storage with advanced features
- **Row-Level Security (RLS)** for multi-tenant isolation
- **Materialized Views** for analytics performance
- **Edge Functions** for serverless compute
- **Real-time Subscriptions** for live updates
- **Storage** for file uploads (reports, documents)

### Architecture Principles

1. **Multi-Tenancy**: Complete data isolation per dispensary
2. **Type Safety**: End-to-end TypeScript with Supabase types
3. **Security First**: RLS policies, encrypted credentials, audit logging
4. **Performance**: Materialized views, caching, optimized queries
5. **Compliance**: HIPAA-ready audit logs, PII hashing, data retention

---

## Database Schema

### Core Tables

#### `dispensaries`
Organization/tenant table. Each dispensary is isolated via RLS.

**Key Features:**
- Business information and settings
- Timezone handling for multi-location support
- JSONB settings for flexible configuration
- Tax rate configuration

#### `users`
Extends Supabase `auth.users` with profile and role data.

**Key Features:**
- Role-based access control (staff, manager, owner, admin)
- Granular permissions system via JSONB
- Last login tracking
- Employee ID for payroll integration

#### `products`
Product catalog with cannabis-specific attributes.

**Key Features:**
- THC/CBD percentage tracking
- Batch number for compliance
- Metrc integration (state compliance system)
- Lab test results storage (JSONB)
- Low stock threshold alerts

#### `customers`
PII-protected customer records.

**Key Features:**
- Email/phone hashed with SHA-256
- First name initial only (no full names)
- Medical card tracking
- RFM segmentation support

#### `transactions`
Sales transaction records.

**Key Features:**
- Complete financial breakdown
- Payment method tracking
- POS terminal integration
- Metrc compliance ID
- Automatic customer statistics updates via triggers

#### `transaction_items`
Line items for each transaction.

**Key Features:**
- Product snapshot (preserves data if product deleted)
- Batch tracking
- Automatic inventory adjustment via triggers

#### `inventory_snapshots`
Historical inventory tracking for audits.

**Key Features:**
- Daily automated snapshots
- Transaction-based snapshots
- Audit trail for compliance

#### `compliance_flags`
Compliance violations and warnings.

**Key Features:**
- Severity levels (compliant, warning, violation, resolved)
- Resolution tracking
- Related entity linking (products, transactions)

#### `audit_logs`
Comprehensive audit trail (HIPAA compliance).

**Key Features:**
- All CRUD operations logged
- Login/logout events
- IP address and user agent tracking
- Before/after values for updates
- Partition-ready by date

#### `api_integrations`
Third-party API configurations.

**Key Features:**
- Encrypted API keys (pgcrypto)
- Sync status and error tracking
- Auto-sync scheduling
- Support for Metrc, POS, accounting systems

#### `reports`
Generated report queue and history.

**Key Features:**
- Async report generation
- PDF storage via Supabase Storage
- Status tracking (pending, processing, completed, failed)
- Parameterized filters

### Relationships

```
dispensaries (1) ──── (N) users
dispensaries (1) ──── (N) products
dispensaries (1) ──── (N) customers
dispensaries (1) ──── (N) transactions

transactions (1) ──── (N) transaction_items
transactions (N) ──── (1) customers
transactions (N) ──── (1) users (processed_by)

transaction_items (N) ──── (1) products

products (1) ──── (N) inventory_snapshots
```

### Indexes

All foreign keys are indexed. Additional performance indexes:

- `idx_products_low_stock`: Partial index for low stock alerts
- `idx_transactions_dispensary_date`: Composite for sales reports
- `idx_audit_logs_log_date`: For partition pruning
- `idx_compliance_flags_unresolved`: Partial index for active flags

---

## Row-Level Security (RLS)

### Principles

1. **Multi-Tenant Isolation**: Users can only access their dispensary's data
2. **Role-Based Access**: Permissions enforced at database level
3. **Helper Functions**: Reusable RLS logic via `auth.*` functions

### Helper Functions

```sql
auth.user_dispensary_id() -- Returns current user's dispensary
auth.user_role()           -- Returns current user's role
auth.has_permission(TEXT)  -- Check specific permission
auth.is_admin()            -- Check if admin
auth.is_manager_or_above() -- Check if manager+
auth.is_owner_or_above()   -- Check if owner+
```

### Policy Patterns

#### SELECT Policies (Read)
```sql
-- Standard multi-tenant read
CREATE POLICY "Users can view products"
    ON products FOR SELECT
    USING (dispensary_id = auth.user_dispensary_id() OR auth.is_admin());
```

#### INSERT Policies (Create)
```sql
-- Permission-based creation
CREATE POLICY "Authorized users can create products"
    ON products FOR INSERT
    WITH CHECK (
        dispensary_id = auth.user_dispensary_id() AND
        auth.has_permission('manage_inventory')
    );
```

#### UPDATE Policies (Update)
```sql
-- Role-based update with self-restriction
CREATE POLICY "Managers can update staff"
    ON users FOR UPDATE
    USING (
        auth.is_manager_or_above() AND
        dispensary_id = auth.user_dispensary_id() AND
        id != auth.uid() -- Can't update self
    );
```

#### DELETE Policies (Delete)
```sql
-- Owner-only deletion
CREATE POLICY "Owners can delete users"
    ON users FOR DELETE
    USING (
        auth.is_owner_or_above() AND
        dispensary_id = auth.user_dispensary_id() AND
        id != auth.uid() -- Can't delete self
    );
```

### Audit Logs Access

Only admins and owners can view audit logs:

```sql
CREATE POLICY "Admins can view audit logs"
    ON audit_logs FOR SELECT
    USING (
        auth.is_admin() OR
        (auth.is_owner_or_above() AND dispensary_id = auth.user_dispensary_id())
    );
```

System triggers can insert audit logs (bypasses RLS):

```sql
CREATE POLICY "System can create audit logs"
    ON audit_logs FOR INSERT
    WITH CHECK (true); -- Triggers handle security
```

---

## Materialized Views

Materialized views provide pre-aggregated data for analytics performance.

### Refresh Strategy

1. **Real-time views** (5-15 min): `inventory_value`, `compliance_dashboard`
2. **Analytics views** (hourly): `product_performance`, `customer_segments`, `staff_performance`
3. **Daily views** (once/day): `daily_sales_summary`, `hourly_sales_patterns`

### Available Views

#### `mv_daily_sales_summary`
Daily aggregates for fast dashboard loading.

**Refresh**: Once per day (via cron or Edge Function)

```sql
SELECT * FROM mv_daily_sales_summary
WHERE dispensary_id = ? AND sale_date BETWEEN ? AND ?;
```

#### `mv_product_performance`
Product-level metrics with category rankings.

**Refresh**: Every hour

**Features:**
- Times sold, quantity sold, revenue
- Profit calculations
- Rank within category

#### `mv_customer_segments`
RFM analysis and churn prediction.

**Refresh**: Every hour

**Segments:**
- `champions`: High recency, frequency, monetary
- `loyal_customers`: Consistent performers
- `promising`: Recent but infrequent
- `at_risk`: High frequency but low recency
- `hibernating`: Inactive customers
- `big_spenders`: High monetary value

#### `mv_inventory_value`
Current inventory value by category.

**Refresh**: Every 5-15 minutes

#### `mv_hourly_sales_patterns`
Sales patterns by hour and day of week (last 90 days).

**Refresh**: Once per day

**Use Case**: Optimize staffing schedules

#### `mv_staff_performance`
Staff sales metrics and rankings.

**Refresh**: Every hour

#### `mv_compliance_dashboard`
Compliance flag summary by severity.

**Refresh**: Every 5-15 minutes

### Refresh Functions

```sql
-- Refresh all views (expensive, use sparingly)
SELECT refresh_all_materialized_views();

-- Refresh by category
SELECT refresh_realtime_views();   -- 5-15 min schedule
SELECT refresh_analytics_views();  -- Hourly schedule
SELECT refresh_daily_views();      -- Daily schedule
```

### Caching Strategy

**Frontend Application:**
- Cache materialized view queries for 5 minutes
- Invalidate cache on relevant mutations
- Use stale-while-revalidate pattern

**Edge Functions:**
- No caching (always fresh data)
- Use for report generation and heavy analytics

---

## Edge Functions

Supabase Edge Functions (Deno runtime) for serverless compute.

### Available Functions

#### `generate-report`
Generates PDF reports for sales, inventory, compliance, and audits.

**Endpoint:** `POST /functions/v1/generate-report`

**Request:**
```typescript
{
  reportId: string;
  dispensaryId: string;
  reportType: 'daily_sales' | 'inventory' | 'compliance' | 'audit';
  startDate: string;
  endDate: string;
  filters?: Record<string, any>;
}
```

**Response:**
```typescript
{
  success: true;
  reportId: string;
  fileUrl: string;
  fileSize: number;
}
```

**Features:**
- PDF generation with pdf-lib
- Async processing (updates report status)
- Storage integration (Supabase Storage)
- Audit logging

#### `sync-metrc`
Synchronizes data with Metrc state compliance system.

**Endpoint:** `POST /functions/v1/sync-metrc`

**Sync Types:**
- `full`: Complete product and inventory sync
- `incremental`: Only changes since last sync
- `products`: Product catalog sync
- `inventory`: Inventory quantities sync
- `sales`: Push sales to Metrc

**Features:**
- OAuth authentication with Metrc API
- Product mapping (Metrc categories → internal categories)
- Error handling and retry logic
- Sync status tracking

#### `sync-pos`
Integrates with POS systems (Square, Clover, Lightspeed).

**Endpoint:** `POST /functions/v1/sync-pos`

**Supported Systems:**
- Square POS
- Clover POS
- Lightspeed
- Generic REST API

**Features:**
- Transaction import with deduplication
- Inventory synchronization
- Customer creation with PII hashing
- Payment method mapping

#### `calculate-analytics`
Heavy analytics calculations offloaded from client.

**Endpoint:** `POST /functions/v1/calculate-analytics`

**Calculation Types:**
- `dashboard_kpis`: Main dashboard metrics with comparison
- `product_insights`: Top/bottom performers, category breakdown
- `customer_insights`: Segmentation, churn, lifetime value
- `staff_insights`: Performance rankings
- `forecasting`: Revenue prediction (moving average)

---

## Service Layer

TypeScript service layer for clean separation of concerns.

### Service Architecture

```
Frontend (React/Next.js)
    ↓
Service Layer (auth, dashboard, inventory, analytics, compliance)
    ↓
Supabase Client (API + Real-time)
    ↓
Supabase Backend (PostgreSQL + Edge Functions)
```

### Available Services

#### `AuthService`
Authentication and authorization.

**Methods:**
- `login(credentials)`: Email/password login
- `logout()`: Sign out and log event
- `signup(data)`: Create new user (manager+ only)
- `getCurrentUser()`: Get authenticated user
- `updateProfile(updates)`: Update user profile
- `updatePassword(newPassword)`: Change password
- `resetPassword(email)`: Send reset email
- `hasPermission(permission)`: Check permission
- `isAdmin()`, `isManagerOrAbove()`, `isOwnerOrAbove()`: Role checks

#### `DashboardService`
Real-time KPIs and metrics with caching.

**Methods:**
- `getDashboardKPIs(dateRange)`: Main dashboard metrics
- `getSalesTrend(start, end)`: Sales chart data
- `getCategoryBreakdown()`: Revenue by category
- `getTopProducts(limit)`: Best sellers
- `getRealtimeMetrics()`: Today's live data
- `getRecentTransactions(limit)`: Latest transactions
- `subscribeToRealtimeUpdates(callback)`: Real-time updates
- `unsubscribeFromRealtimeUpdates()`: Cleanup

**Caching:**
- Default 5-minute cache
- Automatic cache invalidation on mutations
- Manual cache clearing available

#### `InventoryService` (TODO)
Product and inventory management.

**Methods:**
- `getProducts(filters)`: List products with filtering
- `getProduct(id)`: Get single product
- `createProduct(data)`: Add new product
- `updateProduct(id, updates)`: Update product
- `deleteProduct(id)`: Remove product
- `adjustInventory(id, quantity, reason)`: Inventory adjustment
- `getLowStockProducts()`: Low stock alerts
- `getInventoryHistory(productId)`: Historical snapshots

#### `AnalyticsService` (TODO)
Advanced analytics and insights.

**Methods:**
- `getProductInsights(filters)`: Product performance
- `getCustomerInsights()`: Customer segmentation
- `getStaffInsights()`: Staff performance
- `getForecast(days)`: Revenue forecasting
- `getCustomerCohorts()`: Cohort analysis
- `getHourlySalesPattern()`: Sales by hour/day

#### `ComplianceService` (TODO)
Compliance flag management.

**Methods:**
- `getComplianceFlags(filters)`: List flags
- `createComplianceFlag(data)`: Create flag
- `resolveComplianceFlag(id, notes)`: Resolve flag
- `getComplianceSummary()`: Dashboard summary

#### `IntegrationService` (TODO)
Third-party API management.

**Methods:**
- `getIntegrations()`: List configured integrations
- `createIntegration(type, config)`: Add integration
- `updateIntegration(id, config)`: Update settings
- `deleteIntegration(id)`: Remove integration
- `syncIntegration(id, syncType)`: Trigger manual sync
- `testIntegration(id)`: Test connection

---

## Real-Time Subscriptions

### Subscription Strategy

Supabase Real-time uses PostgreSQL's replication log for pub/sub.

#### Tables with Real-time Enabled

1. **`transactions`**: New sales, voids, returns
2. **`products`**: Inventory changes, low stock alerts
3. **`compliance_flags`**: New flags, resolutions
4. **`users`**: Staff changes (admin only)

#### Channel Naming Convention

```typescript
`dashboard:${dispensaryId}`       // Dashboard updates
`inventory:${dispensaryId}`       // Inventory changes
`compliance:${dispensaryId}`      // Compliance alerts
`transactions:${dispensaryId}`    // Transaction updates
```

#### Filter Strategy

Always filter by `dispensary_id` to prevent cross-tenant leaks:

```typescript
supabase
  .channel(`dashboard:${dispensaryId}`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'transactions',
      filter: `dispensary_id=eq.${dispensaryId}`, // Critical!
    },
    (payload) => {
      // Handle new transaction
    }
  )
  .subscribe();
```

#### Connection Limits

Supabase limits:
- **Free tier**: 2 concurrent connections
- **Pro tier**: 500 concurrent connections

**Best Practices:**
- Reuse channels across components
- Unsubscribe on component unmount
- Use channel multiplexing for multiple tables

#### Example: Dashboard Real-time

```typescript
const channel = supabase
  .channel(`dashboard:${dispensaryId}`)
  // New transactions
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'transactions',
      filter: `dispensary_id=eq.${dispensaryId}`,
    },
    async (payload) => {
      // Update revenue counter
      const transaction = payload.new;
      updateRevenue(transaction.total_amount);
    }
  )
  // Low stock alerts
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'products',
      filter: `dispensary_id=eq.${dispensaryId}`,
    },
    (payload) => {
      const product = payload.new;
      if (product.quantity_on_hand <= product.low_stock_threshold) {
        showLowStockAlert(product);
      }
    }
  )
  .subscribe();
```

---

## Security & Compliance

### PII Protection

#### Customer Data
- Email: SHA-256 hashed
- Phone: SHA-256 hashed
- Name: First initial only

```sql
-- Hash function
CREATE FUNCTION hash_pii(input_text TEXT) RETURNS VARCHAR(64) AS $$
BEGIN
    RETURN encode(digest(input_text, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Usage
INSERT INTO customers (email_hash, phone_hash)
VALUES (hash_pii('user@example.com'), hash_pii('555-1234'));
```

### API Key Encryption

API keys encrypted with pgcrypto:

```sql
-- Encryption (requires encryption_key in session)
CREATE FUNCTION encrypt_api_key(api_key TEXT) RETURNS TEXT AS $$
BEGIN
    RETURN encode(
        pgp_sym_encrypt(api_key, current_setting('app.encryption_key', true)),
        'base64'
    );
END;
$$ LANGUAGE plpgsql;

-- Decryption (SECURITY DEFINER)
CREATE FUNCTION decrypt_api_key(encrypted_key TEXT) RETURNS TEXT AS $$
BEGIN
    RETURN pgp_sym_decrypt(
        decode(encrypted_key, 'base64'),
        current_setting('app.encryption_key', true)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Audit Logging (HIPAA Compliance)

All sensitive operations logged:

- User login/logout
- Data access (read)
- Data modifications (create, update, delete)
- Permission changes
- Integration sync events

**Audit Log Retention**: 7 years (HIPAA requirement)

**Partition Strategy** (future):
```sql
-- Partition by month
CREATE TABLE audit_logs_2025_01 PARTITION OF audit_logs
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

### Data Retention Policy

```sql
-- Delete old inventory snapshots (keep 2 years)
DELETE FROM inventory_snapshots
WHERE snapshot_date < NOW() - INTERVAL '2 years';

-- Archive old transactions (move to cold storage after 5 years)
-- Keep audit_logs for 7 years (HIPAA)
```

---

## Performance Optimization

### Query Optimization

#### Avoid N+1 Queries
```typescript
// Bad: N+1 query
const transactions = await getTransactions();
for (const t of transactions) {
  const items = await getTransactionItems(t.id); // N queries
}

// Good: Single query with join
const transactions = await supabase
  .from('transactions')
  .select('*, transaction_items(*)')
  .eq('dispensary_id', dispensaryId);
```

#### Use Materialized Views for Analytics
```typescript
// Bad: Complex aggregation on each request
const topProducts = await supabase
  .from('transaction_items')
  .select('product_id, SUM(quantity), SUM(line_total)')
  .groupBy('product_id')
  .orderBy('SUM(line_total)', { ascending: false });

// Good: Use materialized view
const topProducts = await supabase
  .from('mv_product_performance')
  .select('*')
  .order('total_revenue', { ascending: false })
  .limit(10);
```

### Caching Strategy

**Application-Level Caching:**
- Service layer: 5-minute cache for dashboard data
- React Query: Stale-while-revalidate
- Edge Functions: No caching (always fresh)

**Database-Level Caching:**
- Materialized views: Pre-aggregated data
- PostgreSQL query cache: Automatic

### Connection Pooling

Supabase automatically handles connection pooling via PgBouncer.

**Configuration** (Supabase Pro):
- Transaction mode for short-lived connections
- Session mode for long-running transactions

---

## Deployment

### Environment Variables

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key # Server-only

# Encryption
APP_ENCRYPTION_KEY=your-encryption-key # For API key encryption

# Edge Functions
METRC_BASE_URL=https://api-ca.metrc.com
```

### Migration Strategy

```bash
# Apply migrations in order
supabase migration up --db-url $DATABASE_URL

# Migrations:
# 00001_initial_schema.sql       - Tables, indexes, triggers
# 00002_rls_policies.sql         - Row-level security
# 00003_materialized_views.sql   - Analytics views
```

### Edge Function Deployment

```bash
# Deploy all functions
supabase functions deploy generate-report
supabase functions deploy sync-metrc
supabase functions deploy sync-pos
supabase functions deploy calculate-analytics

# Set secrets
supabase secrets set APP_ENCRYPTION_KEY=your-key
```

### Monitoring

**Supabase Dashboard:**
- Query performance
- Real-time connection count
- Storage usage
- Edge Function invocations

**Custom Monitoring:**
- Log materialized view refresh times
- Track Edge Function errors
- Monitor RLS policy performance

---

## OCP Compliance Alert System

The OCP (Office of Cannabis Policy) Compliance Alert System monitors regulatory advisories and automatically cross-references them against dispensary inventory.

### Architecture Overview

```
OCP Website → n8n Parser → Convex Webhook → Cross-Reference → Flag Products → Alert Staff
                                                    ↓
                              Real-time Dashboard ← Convex Subscriptions
```

### Convex Schema (New Tables)

#### `ocpAdvisories`
Stores parsed OCP regulatory alerts.

| Field | Type | Description |
|-------|------|-------------|
| `ocpAdvisoryId` | string | External advisory ID from OCP |
| `title` | string | Advisory title |
| `description` | string | Full advisory description |
| `severity` | string | "critical" \| "high" \| "medium" \| "low" |
| `advisoryType` | string | "recall" \| "safety_alert" \| "contamination" \| "labeling" \| "other" |
| `status` | string | "active" \| "resolved" \| "expired" \| "dismissed" |
| `sourceUrl` | string | Link to original OCP advisory |
| `publishedAt` | number | Timestamp of OCP publication |
| `affectedProducts` | string[] | Product names to match |
| `affectedStrains` | string[] | Strain names to match |
| `affectedBrands` | string[] | Brand names to match |
| `affectedBatchNumbers` | string[] | Batch numbers to match |
| `affectedLicenses` | string[] | License numbers to match |
| `contaminants` | string[] | List of contaminants (if applicable) |
| `recommendedAction` | string | OCP-recommended resolution |

#### `advisoryProductMatches`
Links advisories to matched inventory products with resolution workflow.

| Field | Type | Description |
|-------|------|-------------|
| `advisoryId` | Id<"ocpAdvisories"> | Reference to advisory |
| `productId` | Id<"products"> | Matched product |
| `dispensaryId` | Id<"dispensaries"> | Tenant isolation |
| `matchType` | string | "product_name" \| "strain" \| "brand" \| "batch_number" \| "license" |
| `matchedValue` | string | The value that triggered the match |
| `matchConfidence` | number | Match confidence 0-100 |
| `status` | string | "pending" \| "confirmed" \| "resolved" \| "false_positive" |
| `resolutionAction` | string | Action taken (quarantine, destroy, return, etc.) |
| `resolutionNotes` | string | Staff notes on resolution |

#### `alertNotifications`
Tracks all notifications sent for compliance alerts.

| Field | Type | Description |
|-------|------|-------------|
| `advisoryId` | Id<"ocpAdvisories"> | Related advisory |
| `matchId` | Id<"advisoryProductMatches"> | Related match (optional) |
| `dispensaryId` | Id<"dispensaries"> | Tenant isolation |
| `channel` | string | "email" \| "in_app" \| "sms" |
| `status` | string | "pending" \| "sent" \| "delivered" \| "failed" |
| `subject` | string | Notification subject |
| `body` | string | Notification body |

#### `complianceResolutionLogs`
Audit trail for all resolution actions (HIPAA compliance).

| Field | Type | Description |
|-------|------|-------------|
| `advisoryId` | Id<"ocpAdvisories"> | Related advisory |
| `matchId` | Id<"advisoryProductMatches"> | Related match |
| `userId` | Id<"users"> | User who took action |
| `userEmail` | string | Email for audit |
| `userRole` | string | Role at time of action |
| `action` | string | Action type (acknowledge, resolve, dismiss, lock) |
| `previousStatus` | string | Status before action |
| `newStatus` | string | Status after action |
| `notes` | string | Resolution notes |

### Backend Functions

#### `convex/ocpAdvisories.ts`

**Queries:**
- `list({ status?, severity?, limit? })` - Get advisories with filters
- `getById({ advisoryId })` - Advisory details with all matches
- `getActiveAlerts({})` - Active alerts for dashboard banner
- `getMatchesForDispensary({ dispensaryId, status?, limit? })` - Matches for a dispensary

**Mutations:**
- `ingest({ ...advisoryData })` - Store new advisory from webhook (internal)
- `processAdvisory({ advisoryId })` - Run cross-reference for all dispensaries (internal)
- `resolveMatch({ matchId, resolutionAction, notes?, quantityResolved? })` - Resolve a match
- `dismissMatch({ matchId, reason })` - Mark as false positive
- `lockProduct({ matchId })` - Lock product from sales
- `acknowledgeMatch({ matchId })` - Acknowledge and confirm match

#### `convex/complianceAlerts.ts`

**Queries:**
- `getDashboardSummary({ dispensaryId })` - Counts and metrics for dashboard
- `getFlaggedProducts({ dispensaryId, includeResolved? })` - Products under compliance hold
- `getNotificationHistory({ dispensaryId, limit? })` - Notification audit trail
- `getResolutionMetrics({ dispensaryId, startDate?, endDate? })` - Performance stats
- `getResolutionAuditTrail({ dispensaryId, advisoryId?, matchId? })` - Full audit log
- `getUnreadNotificationCount({ dispensaryId, userId? })` - Badge counts
- `generateComplianceReport({ dispensaryId, startDate, endDate })` - Export report data

**Mutations:**
- `createNotification({ advisoryId, matchId?, dispensaryId, channel, subject, body })` - Send alert
- `markNotificationRead({ notificationId })` - Mark as read

#### `convex/lib/ocpMatching.ts`

Utility functions for advisory-to-product matching:
- `fuzzyMatch(term, target, threshold?)` - Fuzzy string matching
- `matchProductToAdvisory(product, advisory)` - Match a single product
- `findMatchingProducts(advisory, products)` - Find all matching products
- `calculateMatchConfidence(matchType, similarity)` - Score match quality

### Webhook Endpoint

**`convex/http.ts`** - New route: `POST /ocp-advisory-webhook`

```typescript
// Accepts advisory data from n8n workflow
{
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
}
```

### Frontend Module Structure

```
src/modules/compliance-alerts/
├── types/index.ts              # TypeScript interfaces and enums
├── components/
│   ├── AlertSummaryCards.tsx   # Dashboard metric cards
│   ├── AdvisoryTable.tsx       # List of OCP advisories
│   ├── FlaggedProductsTable.tsx # Products under compliance hold
│   ├── ResolutionWorkflow.tsx  # Modal for resolving matches
│   ├── ComplianceReportGenerator.tsx # Report export
│   └── index.ts                # Component exports
└── hooks/
    └── useComplianceAlerts.ts  # Convex query hooks
```

### Page: ComplianceAlertCenterPage

**Route:** `/compliance-alerts`

**Tabs:**
1. **Overview** - AlertSummaryCards + recent matches
2. **Advisories** - AdvisoryTable with filtering
3. **Flagged Products** - FlaggedProductsTable
4. **Audit Trail** - Resolution history
5. **Reports** - ComplianceReportGenerator

### Resolution Workflow

1. **New Advisory Ingested** → Webhook creates advisory
2. **Cross-Reference Runs** → Matches products by name/strain/brand/batch
3. **Matches Created** → Status: "pending", products flagged
4. **Staff Notified** → In-app alert + optional email
5. **Staff Acknowledges** → Status: "confirmed"
6. **Staff Resolves** → Select action (quarantine/destroy/return/etc.)
7. **Audit Logged** → All actions recorded with user/timestamp

### Resolution Actions

| Action | Description |
|--------|-------------|
| `quarantine` | Move to quarantine area pending action |
| `destroy` | Dispose according to regulations |
| `return_to_vendor` | Return to supplier |
| `relabel` | Update product labels |
| `customer_notification` | Notify affected customers |
| `no_action_required` | Product verified safe |
| `other` | Custom action (notes required) |

### Dashboard Integration

- **ComplianceAlertBanner** - Shows active critical/high alerts
- **Sidebar** - Link to Compliance Alert Center
- **Product Badges** - Compliance status on inventory views

---

## Next Steps

1. **Implement remaining services** (inventory, analytics, compliance, integration)
2. **Set up automated materialized view refresh** (pg_cron or Edge Function cron)
3. **Configure backup strategy** (Supabase automatic backups + manual exports)
4. **Load testing** (test with production-scale data)
5. **Security audit** (review RLS policies, test multi-tenancy isolation)
6. **Documentation** (API docs, integration guides)
7. **CI/CD pipeline** (automated migration testing)
8. **Predictive Compliance Suite** (Supplier Risk Scoring, Inventory Age Dashboard, etc.)

---

## Support

For questions or issues:
- Review Supabase docs: https://supabase.com/docs
- Check RLS policy examples: https://supabase.com/docs/guides/auth/row-level-security
- Edge Functions guide: https://supabase.com/docs/guides/functions
