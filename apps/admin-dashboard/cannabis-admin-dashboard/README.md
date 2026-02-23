# Cannabis Admin Dashboard - Backend Architecture

A production-ready, enterprise-grade backend architecture for cannabis dispensary management using Supabase, featuring multi-tenant isolation, real-time updates, compliance tracking, and advanced analytics.

## Features

- **Multi-Tenant Architecture**: Complete data isolation per dispensary with Row-Level Security
- **Real-Time Updates**: Live dashboard metrics, inventory alerts, and compliance notifications
- **Advanced Analytics**: Pre-aggregated materialized views for fast analytics queries
- **Compliance Ready**: HIPAA-compliant audit logging, PII hashing, and retention policies
- **Third-Party Integrations**: Metrc (state compliance), POS systems (Square, Clover), and more
- **Type-Safe**: End-to-end TypeScript with generated Supabase types
- **Serverless**: Edge Functions for heavy compute (report generation, data sync, analytics)

## Tech Stack

- **Database**: PostgreSQL (Supabase)
- **Real-time**: Supabase Real-time (WebSockets)
- **Compute**: Supabase Edge Functions (Deno)
- **Storage**: Supabase Storage (S3-compatible)
- **Auth**: Supabase Auth (JWT-based)
- **Language**: TypeScript

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Application                      │
│                  (React/Next.js/Vue/etc)                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                             │
│  ┌──────────┐ ┌────────────┐ ┌──────────┐ ┌─────────────┐ │
│  │   Auth   │ │ Dashboard  │ │Inventory │ │  Analytics  │ │
│  │ Service  │ │  Service   │ │ Service  │ │   Service   │ │
│  └──────────┘ └────────────┘ └──────────┘ └─────────────┘ │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                  Supabase Backend                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  PostgreSQL (RLS Policies, Triggers, Materialized)    │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Real-time (WebSocket Subscriptions)                  │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Edge Functions (PDF, Sync, Analytics)                │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Storage (Reports, Documents)                         │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema

### Core Tables

- **dispensaries**: Organization/tenant data
- **users**: User profiles with roles and permissions
- **products**: Cannabis product catalog
- **customers**: PII-protected customer records
- **transactions**: Sales transactions
- **transaction_items**: Transaction line items
- **inventory_snapshots**: Historical inventory tracking
- **compliance_flags**: Compliance violations and warnings
- **audit_logs**: Complete audit trail (HIPAA-compliant)
- **api_integrations**: Third-party API configurations
- **reports**: Generated report queue

### Materialized Views

- **mv_daily_sales_summary**: Daily sales aggregates
- **mv_product_performance**: Product metrics and rankings
- **mv_customer_segments**: RFM analysis and customer segmentation
- **mv_inventory_value**: Current inventory value by category
- **mv_hourly_sales_patterns**: Sales patterns for staffing optimization
- **mv_staff_performance**: Staff sales performance metrics
- **mv_compliance_dashboard**: Compliance flag summary

## Quick Start

### Prerequisites

- Node.js 18+ or Deno 1.30+
- Supabase account (free tier works)
- Supabase CLI: `npm install -g supabase`

### 1. Setup Supabase Project

```bash
# Login to Supabase
supabase login

# Initialize project
supabase init

# Link to your Supabase project
supabase link --project-ref your-project-ref
```

### 2. Apply Database Migrations

```bash
# Run migrations in order
supabase db push

# Or manually:
psql $DATABASE_URL < supabase/migrations/00001_initial_schema.sql
psql $DATABASE_URL < supabase/migrations/00002_rls_policies.sql
psql $DATABASE_URL < supabase/migrations/00003_materialized_views.sql
```

### 3. Deploy Edge Functions

```bash
# Deploy all functions
supabase functions deploy generate-report
supabase functions deploy sync-metrc
supabase functions deploy sync-pos
supabase functions deploy calculate-analytics

# Set environment secrets
supabase secrets set APP_ENCRYPTION_KEY=your-encryption-key-here
```

### 4. Enable Realtime

In Supabase Dashboard:
1. Go to Database > Replication
2. Enable replication for these tables:
   - transactions
   - products
   - compliance_flags
   - customers (optional)
   - users (admin only)

### 5. Setup Materialized View Refresh

Option A: Using pg_cron (Supabase Pro+)
```sql
-- Refresh realtime views every 5 minutes
SELECT cron.schedule(
  'refresh-realtime-views',
  '*/5 * * * *',
  'SELECT refresh_realtime_views()'
);

-- Refresh analytics views every hour
SELECT cron.schedule(
  'refresh-analytics-views',
  '0 * * * *',
  'SELECT refresh_analytics_views()'
);

-- Refresh daily views once per day at 1 AM
SELECT cron.schedule(
  'refresh-daily-views',
  '0 1 * * *',
  'SELECT refresh_daily_views()'
);
```

Option B: Using Edge Function with cron (all tiers)
```bash
# Create cron Edge Function
supabase functions new refresh-views

# Deploy with cron config
supabase functions deploy refresh-views --cron "*/5 * * * *"
```

### 6. Configure Storage

```bash
# Create storage bucket for reports
supabase storage create reports

# Set up RLS policies for storage
# (In Supabase Dashboard > Storage > reports > Policies)
```

### 7. Environment Variables

Create `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key # Server-only

# Encryption (for API keys)
APP_ENCRYPTION_KEY=your-32-character-encryption-key

# Optional: Third-party APIs
METRC_BASE_URL=https://api-ca.metrc.com
```

### 8. Generate TypeScript Types

```bash
# Generate types from Supabase schema
supabase gen types typescript --local > src/types/supabase.ts

# Or from remote:
supabase gen types typescript --project-ref your-project-ref > src/types/supabase.ts
```

## Usage

### Initialize Services

```typescript
import { createClient } from '@supabase/supabase-js';
import { initializeAuthService } from './services/auth.service';
import DashboardService from './services/dashboard.service';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Initialize auth service
const authService = initializeAuthService(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Get current user
const user = await authService.getCurrentUser();

// Initialize dashboard service
const dashboardService = new DashboardService(supabase, user.dispensaryId);
```

### Authentication

```typescript
// Login
const user = await authService.login({
  email: 'user@example.com',
  password: 'password123',
});

// Check permissions
if (authService.hasPermission('manage_inventory')) {
  // User can manage inventory
}

if (authService.isManagerOrAbove()) {
  // User is manager, owner, or admin
}

// Logout
await authService.logout();
```

### Dashboard Data

```typescript
// Get KPIs with comparison
const kpis = await dashboardService.getDashboardKPIs({
  startDate: '2024-01-01',
  endDate: '2024-01-31',
});

console.log('Revenue:', kpis.revenue.current);
console.log('Change:', kpis.revenue.percentChange, '%');

// Get sales trend for chart
const trend = await dashboardService.getSalesTrend(
  '2024-01-01',
  '2024-01-31'
);

// Get top products
const topProducts = await dashboardService.getTopProducts(10);
```

### Real-Time Updates

```typescript
// Subscribe to dashboard updates
dashboardService.subscribeToRealtimeUpdates((metrics) => {
  console.log('New transaction! Revenue:', metrics.todayRevenue);
});

// Cleanup on unmount
dashboardService.unsubscribeFromRealtimeUpdates();
```

### Generate Reports

```typescript
// Create report request
const { data: report } = await supabase
  .from('reports')
  .insert({
    dispensary_id: user.dispensaryId,
    report_type: 'daily_sales',
    title: 'January Sales Report',
    start_date: '2024-01-01',
    end_date: '2024-01-31',
    generated_by: user.id,
    status: 'pending',
  })
  .select()
  .single();

// Trigger Edge Function to generate PDF
const { data } = await supabase.functions.invoke('generate-report', {
  body: {
    reportId: report.id,
    dispensaryId: user.dispensaryId,
    reportType: 'daily_sales',
    startDate: '2024-01-01',
    endDate: '2024-01-31',
  },
});

console.log('Report URL:', data.fileUrl);
```

### Sync Integrations

```typescript
// Sync with Metrc
const { data } = await supabase.functions.invoke('sync-metrc', {
  body: {
    dispensaryId: user.dispensaryId,
    syncType: 'full', // 'full', 'incremental', 'products', 'inventory', 'sales'
  },
});

console.log('Synced:', data.results);

// Sync with POS
const { data: posData } = await supabase.functions.invoke('sync-pos', {
  body: {
    dispensaryId: user.dispensaryId,
    posSystem: 'square',
    syncType: 'both', // 'transactions', 'inventory', 'both'
  },
});
```

## Security Best Practices

### 1. Never Expose Service Role Key
```typescript
// ❌ Never do this in client code
const supabase = createClient(url, SERVICE_ROLE_KEY);

// ✅ Use anon key in client, service role only in Edge Functions
const supabase = createClient(url, ANON_KEY);
```

### 2. Always Filter by Dispensary ID
```typescript
// ❌ Missing multi-tenant filter
const products = await supabase
  .from('products')
  .select('*');

// ✅ Always filter by dispensary
const products = await supabase
  .from('products')
  .select('*')
  .eq('dispensary_id', user.dispensaryId);
```

### 3. Validate User Permissions
```typescript
// ❌ No permission check
await supabase.from('products').insert(newProduct);

// ✅ Check permission first
if (!authService.hasPermission('manage_inventory')) {
  throw new Error('Insufficient permissions');
}
await supabase.from('products').insert(newProduct);
```

### 4. Hash PII Data
```typescript
// ❌ Storing raw email
await supabase.from('customers').insert({
  email: 'customer@example.com',
});

// ✅ Hash before storing
await supabase.from('customers').insert({
  email_hash: await hashPII('customer@example.com'),
});
```

### 5. Use Real-time Filters
```typescript
// ❌ No filter (receives all tenants' data)
supabase
  .channel('transactions')
  .on('postgres_changes', { event: 'INSERT', table: 'transactions' }, handler)
  .subscribe();

// ✅ Filter by dispensary
supabase
  .channel('transactions')
  .on('postgres_changes', {
    event: 'INSERT',
    table: 'transactions',
    filter: `dispensary_id=eq.${dispensaryId}`,
  }, handler)
  .subscribe();
```

## Performance Optimization

### 1. Use Materialized Views
```typescript
// ❌ Slow: Complex aggregation on every request
const { data } = await supabase
  .from('transaction_items')
  .select('product_id, sum(quantity), sum(line_total)')
  .groupBy('product_id');

// ✅ Fast: Use pre-aggregated materialized view
const { data } = await supabase
  .from('mv_product_performance')
  .select('*')
  .order('total_revenue', { ascending: false })
  .limit(10);
```

### 2. Implement Caching
```typescript
// Use service layer caching
const kpis = await dashboardService.getDashboardKPIs(
  dateRange,
  true // Use cache
);

// Or React Query
const { data } = useQuery(
  ['dashboard-kpis', dateRange],
  () => dashboardService.getDashboardKPIs(dateRange),
  { staleTime: 5 * 60 * 1000 } // 5 minutes
);
```

### 3. Batch Operations
```typescript
// ❌ N+1 queries
for (const item of items) {
  await supabase.from('products').update({ quantity: item.quantity }).eq('id', item.id);
}

// ✅ Single batch operation
await supabase.from('products').upsert(
  items.map((item) => ({ id: item.id, quantity: item.quantity }))
);
```

## Documentation

- [Architecture Guide](./docs/ARCHITECTURE.md) - Complete backend architecture
- [Real-Time Strategy](./docs/REAL_TIME_STRATEGY.md) - Real-time subscription patterns

## Project Structure

```
cannabis-admin-dashboard/
├── supabase/
│   ├── migrations/
│   │   ├── 00001_initial_schema.sql      # Tables, indexes, triggers
│   │   ├── 00002_rls_policies.sql        # Row-level security
│   │   └── 00003_materialized_views.sql  # Analytics views
│   └── functions/
│       ├── generate-report/              # PDF report generation
│       ├── sync-metrc/                   # Metrc integration
│       ├── sync-pos/                     # POS system sync
│       └── calculate-analytics/          # Heavy analytics
├── src/
│   ├── services/
│   │   ├── auth.service.ts               # Authentication
│   │   ├── dashboard.service.ts          # Dashboard data
│   │   ├── inventory.service.ts          # Inventory management
│   │   ├── analytics.service.ts          # Analytics
│   │   └── compliance.service.ts         # Compliance
│   ├── types/
│   │   └── supabase.ts                   # Generated types
│   └── lib/
│       └── supabase.ts                   # Supabase client
└── docs/
    ├── ARCHITECTURE.md                   # Backend architecture
    └── REAL_TIME_STRATEGY.md             # Real-time patterns
```

## Roadmap

- [ ] Implement remaining services (inventory, analytics, compliance)
- [ ] Add data export functionality (CSV, Excel)
- [ ] Implement webhook system for external integrations
- [ ] Add advanced forecasting (ML-based)
- [ ] Multi-location support (franchise management)
- [ ] Mobile app backend support
- [ ] GraphQL API layer (optional)

## License

MIT License - see [LICENSE](./LICENSE) for details

---

**Built with Supabase** 🚀
