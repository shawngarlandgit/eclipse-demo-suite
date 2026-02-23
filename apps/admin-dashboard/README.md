# Cannabis Admin Dashboard

A production-ready, enterprise-grade admin dashboard for cannabis dispensary management using React + TypeScript with **Convex** backend and **Clerk** authentication. Features multi-tenant isolation, real-time updates, compliance tracking, and advanced analytics.

**Live URL**: See main README for deployment URLs

## Features

- **8 Dashboard Layouts**: Choose from simple or detailed views based on user preference
- **Role-Based Access Control**: Patient → Budtender → Staff → Manager → Owner → Admin
- **Real-Time Updates**: Live dashboard metrics via Convex subscriptions
- **Multi-Tenant Architecture**: Complete data isolation per dispensary
- **Compliance Ready**: HIPAA-compliant audit logging and regulatory tracking
- **OCP Advisory Integration**: Track Oregon Cannabis Portal advisories and flagged products
- **Supplier Risk Scoring**: AI-powered risk assessment for supplier compliance
- **Guided Product Tour**: Interactive walkthrough using react-joyride
- **Dark Theme**: Modern slate/emerald color scheme optimized for dispensary environments
- **Persistent Settings**: User preferences saved via Zustand with localStorage persistence

## Dashboard Layouts

| Simple Layouts | Description |
|---------------|-------------|
| **The Big Three** | 3 large gradient cards - Revenue, Sales, Best Seller |
| **Health Check** | Traffic light status indicators (green/yellow/red) |
| **Cash Register** | Budtender-focused register-style display |
| **Owner's Summary** | Plain English narrative briefing |

| Detailed Layouts | Description |
|-----------------|-------------|
| **Metric Strips** | Compact horizontal rows with charts |
| **Data Tables** | Tables with sparkline trends |
| **Sidebar Layout** | Sidebar metrics with main content |
| **Tabbed Panels** | Category tabs with metric bar |

Users can switch layouts anytime via **Configuration → Dashboard Layout**.

## Compliance Alert Center

The Compliance Alert Center integrates with Oregon Cannabis Portal (OCP) advisories to help dispensaries track and resolve compliance issues.

### Key Features

- **Advisory Monitoring**: Real-time tracking of OCP advisories (recalls, contamination, labeling)
- **Flagged Products**: Automatic matching of inventory against active advisories
- **Resolution Workflow**: Quarantine, destroy, return, or dismiss flagged items
- **Audit Trail**: Complete compliance logging for regulatory inspections
- **Supplier Risk Scoring**: Historical incident tracking and risk assessment

### Guided Demo Tour

Click the **"Start Demo"** button on the Compliance Alert Center page to launch a 12-step interactive tour covering:

1. Compliance Alert Center overview
2. At-a-glance status cards
3. OCP Advisory table
4. Advisory details
5. Flagged Products workflow
6. Resolution actions
7. Audit trail
8. Supplier risk overview
9. Supplier risk table
10. Risk score algorithm
11. Incident timeline
12. Tour completion

The tour uses `react-joyride` with a dark slate theme and persists completion state in localStorage.

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Convex (serverless functions, real-time database)
- **Auth**: Clerk (JWT-based authentication)
- **UI**: Chakra UI + Tailwind CSS
- **State**: Zustand (with persist middleware)
- **Charts**: Recharts
- **Icons**: Lucide React + Heroicons
- **Routing**: React Router v7

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### 1. Clone and Install

```bash
git clone https://github.com/shawngarlandgit/cannabis-admin-dashboard.git
cd cannabis-admin-dashboard
npm install
```

### 2. Environment Setup

Create `.env.local`:

```bash
# Convex
VITE_CONVEX_URL=https://your-deployment.convex.cloud

# Clerk (optional - for production auth)
VITE_CLERK_PUBLISHABLE_KEY=pk_live_xxx

# Development bypass (NEVER use in production)
# VITE_BYPASS_AUTH=true
```

### 3. Start Development Servers

```bash
# Terminal 1: Start Convex backend
npx convex dev

# Terminal 2: Start frontend
npm run dev
```

App runs at http://localhost:5173

### 4. Seed Database (Optional)

```bash
npx convex run seed:seedDatabase
```

Creates test data: 1 dispensary, 15 products, 50 customers, ~1,200 transactions.

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

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Pages: Dashboard, Configuration, Products, etc.     │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │ useQuery / useMutation
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                    Convex Backend                           │
│  ┌────────────────────────────────────────────────────────┐│
│  │  Queries: dashboard.ts, products.ts, transactions.ts  ││
│  └────────────────────────────────────────────────────────┘│
│  ┌────────────────────────────────────────────────────────┐│
│  │  Mutations: products.ts, customers.ts                 ││
│  └────────────────────────────────────────────────────────┘│
│  ┌────────────────────────────────────────────────────────┐│
│  │  HTTP Actions: http.ts (Clerk webhooks)               ││
│  └────────────────────────────────────────────────────────┘│
│  ┌────────────────────────────────────────────────────────┐│
│  │  Schema: schema.ts (tables, indexes)                  ││
│  └────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                    Clerk (Authentication)                   │
│  ┌────────────────────────────────────────────────────────┐│
│  │  Sign In/Up, JWT Tokens, User Management              ││
│  └────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## Database Schema (Convex)

### Core Tables

| Table | Description |
|-------|-------------|
| `dispensaries` | Multi-tenant organizations |
| `products` | Cannabis inventory (strain, THC/CBD, price) |
| `customers` | Patient records |
| `transactions` | Sales records |
| `transactionItems` | Line items per transaction |
| `complianceFlags` | Regulatory violations |
| `auditLogs` | HIPAA compliance logging |
| `users` | User profiles with roles |

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
│   ├── http.ts                 # HTTP endpoints (webhooks)
│   └── lib/
│       └── auth.ts             # Auth helpers
├── src/
│   ├── components/
│   │   ├── auth/               # Auth components (ProtectedRoute, etc.)
│   │   ├── common/             # Shared components
│   │   └── layout/             # Layout components (Sidebar, TopBar)
│   ├── features/
│   │   └── walkthrough/        # Product tour feature (react-joyride)
│   │       ├── components/     # StartDemoButton
│   │       ├── config/         # Tour steps and styles
│   │       └── store/          # Zustand store for tour state
│   ├── hooks/
│   │   ├── useDashboard.ts     # Dashboard data hooks
│   │   ├── useAuth.ts          # Auth hooks
│   │   └── useStaff.ts         # Staff performance hooks
│   ├── modules/
│   │   ├── compliance-alerts/  # OCP advisory and compliance tracking
│   │   └── supplier-risk/      # Supplier risk scoring module
│   ├── pages/
│   │   ├── DashboardPage.tsx   # Dynamic dashboard router
│   │   ├── DashboardSimple1-4.tsx  # Simple layouts
│   │   ├── DashboardOption1-5.tsx  # Detailed layouts
│   │   ├── ComplianceAlertCenterPage.tsx  # Compliance management
│   │   └── ConfigurationPage.tsx   # Settings & dashboard selector
│   ├── stores/                 # Zustand state stores
│   ├── test/                   # Test files
│   ├── types/                  # TypeScript type definitions
│   └── utils/                  # Utility functions
├── marketing/                  # Sales materials
├── vitest.config.ts            # Test configuration
├── vite.config.ts              # Vite config (base: '/bko/')
└── CLAUDE.md                   # Development instructions
```

## Usage Examples

### Dashboard Queries (Convex)

```typescript
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';

// Get dashboard KPIs (real-time)
const kpis = useQuery(api.dashboard.getKPIs, { dispensaryId });

// Get top products
const topProducts = useQuery(api.dashboard.getTopProducts, {
  dispensaryId,
  limit: 5,
});

// Get sales trends (7 days)
const trends = useQuery(api.dashboard.getSalesTrends, {
  dispensaryId,
  days: 7,
});
```

### Role Hierarchy

```
patient < budtender < staff < manager < owner < admin
```

Route access is controlled by `RoleProtectedRoute`:
- `minimumRole` - user must have this role or higher
- `allowedRoles` - user must have one of these specific roles

## Deployment

### Build for Production

```bash
npm run build
```

### Deploy to VPS

```bash
# Copy dist to VPS (replace YOUR_SERVER with actual server)
rsync -avz --delete dist/ root@YOUR_SERVER:/var/www/bko/
```

### Convex Production

```bash
# Deploy to production
npx convex deploy --prod
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_CONVEX_URL` | Convex deployment URL | Yes |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk public key | Production |
| `VITE_BYPASS_AUTH` | Skip auth for testing | Dev only |

### Convex Environment Variables

Set via Convex dashboard or CLI:

| Variable | Description |
|----------|-------------|
| `CLERK_WEBHOOK_SECRET` | Svix signing secret for webhooks |

## Roadmap

- [ ] Implement inventory management UI
- [ ] Add data export functionality (CSV, Excel)
- [ ] Implement advanced forecasting
- [ ] Multi-location support (franchise management)
- [ ] Mobile app support

## License

MIT License - see [LICENSE](./LICENSE) for details

---

**Built with Convex + Clerk**
