# Cannabis Admin Dashboard - Project Instructions

## Project Overview

A React + TypeScript admin dashboard for cannabis dispensary management. Uses **Convex** for backend (serverless functions, real-time database) and **Clerk** for authentication. Chakra UI for components and Zustand for state management.

**Live URL**: See main README for deployment URLs

## Quick Start

```bash
# Start dev server (frontend)
npm run dev
# App runs at http://localhost:5173

# Start Convex dev server (backend - in separate terminal)
npx convex dev
```

## Security

### Authentication

Authentication is handled by **Clerk** with user data synced to **Convex**.

**IMPORTANT**: Auth bypass requires explicit opt-in via `VITE_BYPASS_AUTH=true`. It is NOT automatically enabled in development mode.

### Webhook Security

The Clerk webhook endpoint (`/clerk-webhook`) uses **fail-closed** security:
- Requires `CLERK_WEBHOOK_SECRET` environment variable in Convex
- Rejects ALL requests if secret is not configured
- Validates Svix signatures on every request
- Rejects timestamps older than 5 minutes (replay attack prevention)

### Key Security Files

| File | Purpose |
|------|---------|
| `convex/http.ts` | Webhook handler with signature verification |
| `convex/lib/auth.ts` | Auth helpers (requireAuth, requireRole, etc.) |
| `src/components/auth/ProtectedRoute.tsx` | Route protection |
| `src/components/auth/RoleProtectedRoute.tsx` | Role-based access control |

## Testing

```bash
# Run tests in watch mode
npm run test

# Run tests once
npm run test:run

# Run with coverage
npm run test:coverage
```

### Test Coverage

| Area | Tests | Description |
|------|-------|-------------|
| Auth Bypass | 6 | Verify bypass requires explicit opt-in |
| Webhook Security | 11 | Verify fail-closed behavior and signature validation |

Test files:
- `src/hooks/useAuth.test.ts` - Auth bypass configuration tests
- `src/test/webhook-verification.test.ts` - Webhook security tests

## Bypass Mode (Development/Testing)

The app supports a **bypass mode** that skips authentication for testing.

**SECURITY**: Bypass mode must be explicitly enabled. It does NOT auto-enable in dev mode.

### Enabling Bypass Mode

```bash
# In .env.local (requires explicit opt-in)
VITE_BYPASS_AUTH=true
```

**WARNING**: Never enable bypass mode in production. The app will show a "DEV MODE - Auth Bypassed" badge when active.

### How Bypass Mode Works

1. **Authentication Skip**: `ProtectedRoute` and `RoleProtectedRoute` grant full access without Clerk auth
2. **Test Dispensary**: `useCurrentDispensary()` fetches the first active dispensary from Convex
3. **Public Queries**: Dashboard and product queries work without auth verification

### Key Files for Bypass Mode

- `src/components/auth/ProtectedRoute.tsx` - Skips Clerk auth check
- `src/components/auth/RoleProtectedRoute.tsx` - Skips role verification
- `src/hooks/useAuth.ts` - `useCurrentDispensary()` fetches test dispensary
- `convex/dispensaries.ts` - `getFirst` query (public, no auth)
- `convex/dashboard.ts` - KPI queries without auth checks
- `convex/products.ts` - Product queries without auth checks

## Database Seeding

To seed the Convex database with test data:

```bash
# Run the seed function
npx convex run seed:seedDatabase
```

This creates:
- 1 dispensary
- 15 products (various strains, edibles, etc.)
- 50 customers
- ~1,200 transactions (past 30 days)
- 2 compliance flags

The seed function is idempotent - it won't duplicate data if run multiple times.

## Project Structure

```
cannabis-admin-dashboard/
├── convex/                     # Convex backend
│   ├── schema.ts               # Database schema (tables, indexes)
│   ├── dashboard.ts            # Dashboard KPI queries
│   ├── products.ts             # Product CRUD operations
│   ├── transactions.ts         # Transaction queries
│   ├── dispensaries.ts         # Dispensary queries
│   ├── customers.ts            # Customer queries
│   ├── seed.ts                 # Database seeding function
│   └── lib/
│       └── auth.ts             # Auth helpers (requireDispensaryAccess, etc.)
├── src/
│   ├── components/
│   │   ├── auth/               # Auth components (ProtectedRoute, RoleProtectedRoute)
│   │   ├── common/             # Shared components (LoadingSpinner, etc.)
│   │   └── layout/             # Layout components (DashboardLayout, Sidebar)
│   ├── hooks/
│   │   ├── useDashboard.ts     # Dashboard data hooks (Convex queries)
│   │   ├── useAuth.ts          # Auth hooks (useCurrentDispensary)
│   │   └── useStaff.ts         # Staff performance hooks
│   ├── pages/
│   │   ├── DashboardPage.tsx   # Dynamic dashboard router
│   │   ├── DashboardSimple1-4.tsx  # Simple layouts
│   │   ├── DashboardOption1-5.tsx  # Detailed layouts
│   │   └── ConfigurationPage.tsx   # Settings & dashboard selector
│   ├── stores/                 # Zustand state stores
│   ├── types/                  # TypeScript type definitions
│   └── utils/                  # Utility functions
├── .env.local                  # Local environment (VITE_CONVEX_URL)
├── .env.production             # Production environment
└── vite.config.ts              # Vite config (base: '/bko/')
```

## Convex Backend

### Key Queries

```typescript
// Dashboard KPIs (real-time)
import { api } from '../convex/_generated/api';
const kpis = useQuery(api.dashboard.getKPIs, { dispensaryId });

// Top products
const topProducts = useQuery(api.dashboard.getTopProducts, {
  dispensaryId,
  limit: 5
});

// Sales trends (hourly data for charts)
const trends = useQuery(api.dashboard.getSalesTrends, {
  dispensaryId,
  startDate: startOfDay.getTime(),
  endDate: endOfDay.getTime()
});
```

### Schema Overview

| Table | Description |
|-------|-------------|
| `dispensaries` | Multi-tenant organizations |
| `products` | Cannabis inventory (strain, THC/CBD, price) |
| `customers` | Patient records |
| `transactions` | Sales records |
| `transactionItems` | Line items per transaction |
| `complianceFlags` | Regulatory violations |
| `auditLogs` | HIPAA compliance logging |

## Data Flow

```
Convex Cloud
     │
     ▼
useQuery(api.dashboard.getKPIs)  ←── Real-time subscription
     │
     ▼
useDashboardKPIs() hook
     │
     ▼
DashboardSimple1/2/3/4 or DashboardOption1/2/4/5
     │
     ▼
UI Components (Chakra UI)
```

## Dashboard Layouts

The app supports 8 dashboard layouts, switchable from Configuration:

### Simple (4 layouts)
- **Simple 1**: "The Big Three" - Revenue, Transactions, Avg Value
- **Simple 2**: "Health Check" - Key metrics at a glance
- **Simple 3**: "Cash Register" - Transaction-focused
- **Simple 4**: "Owner's Summary" - Executive overview

### Detailed (4 layouts)
- **Option 1**: "Metric Strips" - Horizontal metric bars
- **Option 2**: "Data Tables" - Tabular data display
- **Option 4**: "Sidebar Layout" - Side navigation
- **Option 5**: "Tabbed Panels" - Organized by tabs

## Deployment

### Build for Production

```bash
# Build with /bko/ base path
npm run build
```

### Deploy to VPS

```bash
# Copy dist to VPS (replace YOUR_SERVER with actual server)
rsync -avz --delete dist/ root@YOUR_SERVER:/var/www/bko/
```

### VPS Configuration

Configure your web server to serve the `/var/www/bko` directory with SPA fallback to `index.html`.

## Role Hierarchy

```
patient < budtender < staff < manager < owner < admin
```

Route access controlled by `RoleProtectedRoute`:
- `minimumRole` - user must have this role or higher
- `allowedRoles` - user must have one of these specific roles

**Note**: In bypass mode, all role checks are skipped.

## Tech Stack

- **React 19** with TypeScript
- **Vite** for build tooling
- **Convex** for backend (serverless functions, real-time database)
- **Clerk** for authentication
- **Chakra UI** for components
- **Zustand** for state management (with persist middleware)
- **React Router** for routing
- **Recharts** for charts
- **Lucide React** + **Heroicons** for icons

## Common Tasks

### View Dashboard as Different Layout
1. Go to Configuration (sidebar)
2. Select layout from dropdown or click a card
3. Navigate to Dashboard - shows selected layout

### Re-seed Database
```bash
# If you need fresh data
npx convex run seed:seedDatabase
```

### Check Convex Dashboard
```bash
npx convex dashboard
# Opens Convex dashboard in browser
```

### Deploy Schema Changes
```bash
npx convex dev --once
# Pushes schema to Convex cloud
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_CONVEX_URL` | Convex deployment URL | `https://xxx.convex.cloud` |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk public key | `pk_live_xxx` |
| `VITE_BYPASS_AUTH` | Skip auth for testing | `true` |
