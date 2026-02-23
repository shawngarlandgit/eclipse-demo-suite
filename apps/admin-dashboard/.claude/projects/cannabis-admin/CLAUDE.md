# Cannabis Admin Dashboard

**Project Type**: React 19 + Vite + Convex SPA
**GitHub**: https://github.com/shawngarlandgit/cannabis-admin-dashboard
**Local**: `~/cannabis-admin-dashboard/`

**DO NOT USE SUPABASE** - This project uses Convex for backend (fiery-cheetah-41).

---

## Quick Start

```bash
cd ~/cannabis-admin-dashboard && npm run dev
# App runs at http://localhost:5173
```

---

## Key Features

- **8 Dashboard Layouts**: 4 Simple + 4 Detailed views
- **Role-Based Access**: Patient → Budtender → Manager → Owner → Admin
- **Multi-Tenant Architecture**: Row-Level Security (RLS)
- **Real-Time Updates**: Supabase WebSockets
- **HIPAA-Compliant**: Audit logging enabled
- **Third-Party Integrations**: Metrc, Square, Clover POS

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + TypeScript + Vite |
| UI | Chakra UI + Tailwind CSS |
| Backend | Convex (serverless functions, real-time database) |
| State | Zustand + React Query |
| Charts | Recharts |

---

## MCP Servers

No project-specific MCPs required. Uses global:
- `convex` - Backend (fiery-cheetah-41)
- `playwright` - E2E testing fallback

**DO NOT USE SUPABASE** - All data is in Convex.

---

## Important Docs

| Document | Location |
|----------|----------|
| Architecture | `docs/ARCHITECTURE.md` |
| Real-Time Strategy | `docs/REAL_TIME_STRATEGY.md` |

---

## Database Schema

Key tables with RLS:
- `dispensaries` - Multi-tenant root
- `users` - Role-based access
- `products` - Inventory management
- `transactions` - Sales tracking
- `audit_logs` - HIPAA compliance

---

## Pitfalls

- **RLS Policies**: All queries must include dispensary_id context
- **Real-time subscriptions**: Clean up on component unmount
- **Metrc integration**: Requires API key per dispensary
- **DO NOT USE SUPABASE** - Legacy code exists but is deprecated
