# Cannabis Platform - LLM Research Documentation

> Comprehensive technical documentation for AI-assisted development, feature planning, and codebase research.

**Last Updated:** January 2026
**Convex Deployment:** fiery-cheetah-41
**Repository:** Private (GitHub)

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Database Schema](#2-database-schema)
3. [Convex Backend Functions](#3-convex-backend-functions)
4. [React Components](#4-react-components)
5. [Custom Hooks](#5-custom-hooks)
6. [State Management](#6-state-management)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [External Integrations](#8-external-integrations)
9. [Types & Interfaces](#9-types--interfaces)
10. [Data Flow Patterns](#10-data-flow-patterns)
11. [Feature Areas](#11-feature-areas)
12. [Extension Points](#12-extension-points)

---

## 1. Architecture Overview

### System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND APPS                                   │
├─────────────────────┬─────────────────────┬─────────────────────────────────┤
│    Patient App      │     Driver App      │       Admin Dashboard           │
│   (hm.awknd.me)     │   (hmd.awknd.me)    │       (hma.awknd.me)            │
│                     │                     │                                 │
│ - Browse menu       │ - View queue        │ - Manage inventory              │
│ - Place orders      │ - Accept deliveries │ - View analytics                │
│ - Track delivery    │ - Update status     │ - Compliance tracking           │
│ - Order history     │ - Collect payment   │ - Staff management              │
│                     │ - Navigation        │ - Dispatch orders               │
└──────────┬──────────┴──────────┬──────────┴──────────┬──────────────────────┘
           │                     │                     │
           │    Convex React SDK (useQuery/useMutation/useAction)
           │                     │                     │
           └─────────────────────┼─────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CONVEX BACKEND                                     │
│                    (Serverless Functions + Real-time DB)                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  Queries          │  Mutations         │  Actions           │  HTTP         │
│  (Read-only)      │  (Write ops)       │  (Side effects)    │  (Webhooks)   │
│                   │                    │                    │               │
│  - listOrders     │  - createOrder     │  - syncPaymentToPOS│  - Clerk      │
│  - getProduct     │  - updateStatus    │  - sendEmail       │  - Flowhub    │
│  - getDashboard   │  - adjustInventory │  - processAdvisory │  - OCP        │
└─────────────────────────────────────────────────────────────────────────────┘
                                 │
           ┌─────────────────────┼─────────────────────┐
           │                     │                     │
           ▼                     ▼                     ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│  Convex DB      │   │  External APIs  │   │  Webhooks In    │
│  (Real-time)    │   │                 │   │                 │
│                 │   │  - Clerk Auth   │   │  - Clerk events │
│  41 tables      │   │  - Flowhub POS  │   │  - POS updates  │
│  Subscriptions  │   │  - Resend Email │   │  - OCP alerts   │
│  Indexes        │   │  - OCP API      │   │                 │
└─────────────────┘   └─────────────────┘   └─────────────────┘
```

### Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 19 + TypeScript | UI components |
| **Build** | Vite | Fast dev/build |
| **Backend** | Convex | Serverless functions, real-time DB |
| **Auth** | Clerk | User authentication |
| **Admin UI** | Chakra UI | Component library |
| **Patient/Driver UI** | TailwindCSS | Utility CSS |
| **State** | Zustand | Client state management |
| **Charts** | Recharts | Data visualization |
| **Hosting** | Cloudflare Pages | Static hosting |

### Monorepo Structure

```
cannabis-platform/
├── apps/
│   ├── admin-dashboard/     # Chakra UI + React Router
│   │   ├── src/
│   │   │   ├── components/  # UI components
│   │   │   ├── hooks/       # React Query hooks
│   │   │   ├── modules/     # Feature modules
│   │   │   ├── pages/       # Route pages
│   │   │   ├── stores/      # Zustand stores
│   │   │   └── types/       # TypeScript types
│   │   └── vite.config.ts
│   │
│   ├── patient-app/         # TailwindCSS + custom components
│   │   ├── components/      # Screen components
│   │   ├── data/            # Static data
│   │   └── convex -> ../../convex (symlink)
│   │
│   └── driver-app/          # TailwindCSS + location tracking
│       ├── components/      # Screen components
│       └── convex -> ../../convex (symlink)
│
├── convex/                  # Shared backend
│   ├── schema.ts            # Database schema
│   ├── orders.ts            # Order management
│   ├── products.ts          # Inventory
│   ├── users.ts             # User management
│   ├── payments.ts          # Payment processing
│   ├── payments/
│   │   └── gateways/        # POS integrations
│   ├── lib/
│   │   ├── auth.ts          # Auth helpers
│   │   └── ocpMatching.ts   # Fuzzy matching
│   └── http.ts              # Webhook handlers
│
├── packages/
│   ├── config/              # Shared configuration
│   │   ├── dispensary.ts    # Business settings
│   │   └── theme.ts         # Brand colors
│   └── ui/                  # Shared components
│
└── package.json             # Workspace config
```

---

## 2. Database Schema

### Entity Relationship Overview

```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  Dispensaries │────<│     Users     │     │   Products    │
│               │     │               │     │               │
│ Multi-tenant  │     │ Staff/Admin   │     │ Inventory     │
│ org container │     │ role-based    │     │ per-dispensary│
└───────────────┘     └───────────────┘     └───────┬───────┘
        │                                          │
        │                                          │
        ▼                                          ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│    Orders     │────>│   Payments    │     │ AdvisoryMatch │
│               │     │               │     │               │
│ Customer      │     │ Cash/Card     │     │ Compliance    │
│ orders        │     │ POS sync      │     │ flags         │
└───────┬───────┘     └───────────────┘     └───────────────┘
        │
        ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│    Drivers    │     │ Transactions  │     │  Audit Logs   │
│               │     │               │     │               │
│ Location      │     │ Sales records │     │ HIPAA         │
│ tracking      │     │ for analytics │     │ compliance    │
└───────────────┘     └───────────────┘     └───────────────┘
```

### Core Tables

#### Dispensaries
```typescript
{
  id: Id<"dispensaries">
  name: string                    // "Hazy Moose"
  licenseNumber: string           // State license
  email: string
  phone: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string                   // "ME"
  zipCode: string
  timezone: string                // "America/New_York"
  taxRate: number                 // 0.055 (5.5%)
  settings: object                // Flexible JSON config
  isActive: boolean
  createdAt: number
  updatedAt: number
}
```

#### Users
```typescript
{
  id: Id<"users">
  clerkId: string                 // Clerk user ID (unique)
  dispensaryId: Id<"dispensaries">
  email: string
  fullName: string
  avatarUrl?: string
  role: "staff" | "manager" | "owner" | "admin"
  permissions: {
    view_dashboard: boolean
    manage_inventory: boolean
    view_reports: boolean
    manage_staff: boolean
    manage_integrations: boolean
    view_audit_logs: boolean
  }
  employeeId?: string             // Internal ID
  hireDate?: number
  isActive: boolean
  lastLoginAt?: number
}

// Indexes: by_clerk_id, by_dispensary, by_role, by_dispensary_role
```

#### Products
```typescript
{
  id: Id<"products">
  dispensaryId: Id<"dispensaries">
  sku: string                     // Unique per dispensary
  name: string                    // "Blue Dream"
  category: "flower" | "pre_roll" | "concentrate" | "edible" |
            "topical" | "tincture" | "vape" | "accessory"
  brand?: string                  // "Hazy Moose"
  description?: string
  thcPercentage?: number          // 22.5
  cbdPercentage?: number          // 0.5
  weightGrams?: number            // 3.5
  unitType?: string               // "eighth", "gram"
  costPrice: number               // Wholesale cost
  retailPrice: number             // Customer price
  quantityOnHand: number          // Current stock
  lowStockThreshold: number       // Alert threshold
  metrcId?: string                // METRC tracking ID
  batchNumber?: string            // Production batch
  labTestResults?: object         // COA data
  complianceStatus: "clear" | "flagged" | "locked" | "under_review"
  supplierId?: Id<"suppliers">    // For risk tracking
  isActive: boolean
  lastRestockedAt?: number
}

// Indexes: by_dispensary_sku, by_category, by_compliance_status
```

#### Orders
```typescript
{
  id: Id<"orders">
  dispensaryId: Id<"dispensaries">

  // Customer info
  customerName: string
  customerPhone?: string
  customerEmail?: string

  // Driver assignment
  driverId?: string               // Driver login ID
  driverName?: string

  // Order details
  items: Array<{
    productId?: Id<"products">
    name: string
    quantity: number
    price: number
  }>
  subtotal: number
  tax: number
  total: number
  tipAmount?: number
  preTipAmount?: number           // Pre-selected tip

  // Payment
  paymentMethod?: "cash" | "debit" | "ach" | "mobile_pay"
  paymentStatus?: "pending" | "collected" | "failed"
  paymentId?: Id<"payments">

  // Status
  status: "pending" | "accepted" | "picked_up" | "en_route" |
          "delivered" | "cancelled"
  orderType: "pickup" | "delivery"

  // Delivery info
  deliveryAddress?: string
  deliveryNotes?: string
  pickupTime?: string
  estimatedDeliveryTime?: number

  // Timestamps
  createdAt: number               // _creationTime
  updatedAt?: number
  acceptedAt?: number
  pickedUpAt?: number
  deliveredAt?: number
  cancelledAt?: number
}

// Indexes: by_dispensary_status, by_driver, by_created
```

#### Drivers
```typescript
{
  id: Id<"drivers">
  dispensaryId: Id<"dispensaries">
  driverId: string                // Login ID like "DRV-001"
  name: string
  phone?: string
  email?: string

  // Status
  isOnline: boolean
  isActive: boolean

  // Performance
  completedDeliveries: number
  totalTips: number
  rating: number                  // 0-5

  // Location (real-time)
  lastLatitude?: number
  lastLongitude?: number
  lastLocationUpdate?: number

  // Timestamps
  createdAt: number
  updatedAt?: number
  lastLoginAt?: number
}

// Indexes: by_dispensary_online
```

#### Payments
```typescript
{
  id: Id<"payments">
  dispensaryId: Id<"dispensaries">
  orderId: Id<"orders">
  driverId?: string

  // Payment details
  paymentMethod: "cash" | "debit" | "ach" | "mobile_pay"
  amount: number
  tipAmount?: number

  // Status
  status: "pending" | "processing" | "collected" | "completed" |
          "failed" | "refunded"

  // Cash handling
  cashTendered?: number
  changeGiven?: number

  // Card details (encrypted)
  cardLastFour?: string
  cardBrand?: string
  approvalCode?: string
  terminalId?: string

  // POS sync
  posProvider?: string            // "flowhub"
  posSyncStatus?: "pending" | "synced" | "failed"
  posTransactionId?: string
  posErrorMessage?: string
  posSyncAttempts?: number
  posSyncedAt?: number

  // Extensible metadata
  metadata?: object

  // Timestamps
  createdAt: number
  collectedAt?: number
  completedAt?: number
}

// Indexes: by_order, by_dispensary, by_status, by_pos_sync
```

#### OCP Advisories (Compliance)
```typescript
{
  id: Id<"ocpAdvisories">
  ocpAdvisoryId: string           // External ID from OCP
  title: string
  description?: string

  severity: "critical" | "high" | "medium" | "low"
  advisoryType: "recall" | "safety_alert" | "contamination" |
                "labeling" | "other"
  status: "active" | "resolved" | "expired" | "dismissed"

  // Affected items (for fuzzy matching)
  affectedProducts?: string[]
  affectedBrands?: string[]
  affectedBatchNumbers?: string[]
  affectedLicenses?: string[]

  // Contamination details
  contaminants?: string[]
  contaminantDetails?: object

  // Metadata
  issuedAt: number
  expiresAt?: number
  sourceUrl?: string
  rawData?: object

  // Processing
  processedAt?: number
  matchCount?: number
}
```

#### Advisory Product Matches
```typescript
{
  id: Id<"advisoryProductMatches">
  advisoryId: Id<"ocpAdvisories">
  productId: Id<"products">
  dispensaryId: Id<"dispensaries">

  // Match info
  matchType: string               // "batch", "brand", "product"
  matchedValue: string            // What matched
  matchConfidence: number         // 0-100 fuzzy score

  // Status workflow
  status: "pending" | "confirmed" | "resolved" | "false_positive"
  flaggedAt: number
  acknowledgedAt?: number
  resolvedAt?: number

  // Resolution
  resolutionAction?: "removed_from_sale" | "returned_to_supplier" |
                     "destroyed" | "quarantined" | "cleared_after_test" |
                     "false_positive_confirmed" | "other"
  resolutionNotes?: string
  resolutionEvidence?: string[]   // File URLs

  // Quantity tracking
  quantityAffected?: number
  quantityResolved?: number
}

// Indexes: by_dispensary_status
```

#### Audit Logs (HIPAA Compliance)
```typescript
{
  id: Id<"auditLogs">
  dispensaryId: Id<"dispensaries">

  // Actor
  userId?: Id<"users">
  userEmail?: string
  userRole?: string

  // Action
  action: string                  // "product.create", "order.update"
  resourceType: string            // "product", "order"
  resourceId?: string

  // Context
  ipAddress?: string
  userAgent?: string
  requestMethod?: string
  requestPath?: string

  // Changes
  oldValues?: object
  newValues?: object

  // Result
  status: "success" | "failure"
  errorMessage?: string

  // Time
  logDate: string                 // "2026-01-31"
  createdAt: number
}

// Indexes: by_dispensary, by_user, by_resource, by_action, by_log_date
```

---

## 3. Convex Backend Functions

### Orders Module (`convex/orders.ts`)

#### Queries (Read-only)

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `listOrders` | none | `Order[]` | Recent 50 orders, newest first |
| `getOrder` | `orderId` | `Order \| null` | Single order by ID |
| `getCustomerOrders` | `customerEmail` | `Order[]` | Orders by customer (max 20) |
| `getPendingOrders` | `dispensaryId` | `Order[]` | Available for driver acceptance |
| `getDriverOrders` | `driverId` | `Order[]` | All orders for driver |
| `getDriverActiveOrder` | `driverId` | `Order \| null` | Current active delivery |
| `getAllOrders` | `dispensaryId, status?, limit?` | `Order[]` | Admin filtered list |
| `getDeliveryMetrics` | `dispensaryId` | `Metrics` | Dashboard KPIs |
| `getAllDrivers` | `dispensaryId` | `Driver[]` | Driver roster |

#### Mutations (Write operations)

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `createOrder` | `dispensaryId, customerName, items[], ...` | `Id<"orders">` | Create delivery order |
| `driverLogin` | `driverId, dispensaryId` | `Driver` | Login/create driver profile |
| `setDriverOnline` | `driverId, isOnline` | `void` | Toggle online status |
| `acceptOrder` | `orderId, driverId, driverName` | `void` | Driver accepts order |
| `updateOrderStatus` | `orderId, status, driverId` | `void` | Update order status |
| `completeDelivery` | `orderId, driverId, tipAmount?` | `void` | Mark delivered with tip |
| `seedOrders` | `dispensaryId` | `void` | Create test data |

#### Status Flow
```
pending → accepted → picked_up → en_route → delivered
                                          ↘ cancelled
```

### Products Module (`convex/products.ts`)

#### Queries

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `list` | `dispensaryId, category?, search?, ...` | `Product[]` | Filtered product list |
| `getById` | `productId` | `Product \| null` | Single product |
| `getBySku` | `dispensaryId, sku` | `Product \| null` | Lookup by SKU |
| `getVendors` | `dispensaryId` | `string[]` | Unique brands |
| `getSummary` | `dispensaryId` | `Summary` | Inventory stats |
| `getByCategory` | `dispensaryId` | `GroupedProducts` | Products by category |

#### Mutations

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `create` | `dispensaryId, sku, name, ...` | `Id<"products">` | Create product |
| `update` | `productId, fields...` | `void` | Update product |
| `adjustQuantity` | `productId, quantityChange, reason` | `void` | Stock adjustment |
| `bulkImport` | `dispensaryId, products[], updateExisting?` | `ImportResult` | Bulk import |
| `deactivate` | `productId` | `void` | Soft delete |
| `reactivate` | `productId` | `void` | Restore product |

### Payments Module (`convex/payments.ts`)

#### Queries

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `getPayment` | `paymentId` | `Payment \| null` | Single payment |
| `getPaymentByOrder` | `orderId` | `Payment \| null` | Payment for order |
| `getPaymentsByDispensary` | `dispensaryId, limit?, status?` | `Payment[]` | Dispensary payments |
| `getDriverEarnings` | `driverId, startDate?, endDate?` | `Earnings` | Driver earnings summary |
| `getPaymentConfig` | `dispensaryId` | `PaymentConfig` | Dispensary payment settings |

#### Mutations

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `createPayment` | `orderId, paymentMethod, preTipAmount?` | `Id<"payments">` | Create payment record |
| `collectPayment` | `paymentId, driverId, tipAmount?, ...` | `void` | Collect from customer |
| `failPayment` | `paymentId, reason` | `void` | Mark payment failed |
| `refundPayment` | `paymentId, reason` | `void` | Refund collected payment |
| `upsertPaymentConfig` | `dispensaryId, settings...` | `void` | Update payment config |

#### Actions (Side effects)

| Function | Parameters | Description |
|----------|------------|-------------|
| `syncPaymentToPOS` | `paymentId` | Sync to external POS with retry |

### Users Module (`convex/users.ts`)

#### Queries

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `me` | none | `User \| null` | Current authenticated user |
| `listByDispensary` | `dispensaryId` | `User[]` | Users in dispensary |
| `getById` | `userId` | `User \| null` | Single user |

#### Mutations

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `create` | `clerkId, dispensaryId, email, ...` | `Id<"users">` | Create user |
| `updateRole` | `userId, role` | `void` | Change user role (owner+ only) |
| `deactivate` | `userId` | `void` | Deactivate user |
| `recordLogin` | none | `void` | Update lastLoginAt |

### OCP Advisories Module (`convex/ocpAdvisories.ts`)

#### Queries

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `list` | `status?, severity?, limit?, cursor?` | `Advisory[]` | Paginated advisories |
| `getById` | `advisoryId` | `AdvisoryWithMatches` | Advisory with product matches |
| `listMatches` | `advisoryId, status?, limit?` | `Match[]` | Matches for advisory |
| `getMatchesForProduct` | `productId` | `Match[]` | Advisories affecting product |
| `getAdvisoryStats` | `dispensaryId` | `Stats` | Match counts by status |

#### Mutations

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `acknowledgeMatch` | `matchId, userId` | `void` | Acknowledge flagged product |
| `resolveMatch` | `matchId, userId, action, notes?` | `void` | Resolve with action |
| `dismissMatch` | `matchId, userId` | `void` | Mark false positive |

---

## 4. React Components

### Admin Dashboard Components

#### Layout
- `DashboardLayout.tsx` - Main shell with sidebar + topbar
- `Sidebar.tsx` - Navigation with role-based menu items
- `TopBar.tsx` - User menu, notifications, search

#### Dashboard
- `StatCard.tsx` - KPI card with icon, value, trend
- `RevenueChart.tsx` - Line chart for revenue over time
- `TopProductsCard.tsx` - Best sellers list
- `InventoryHealthCard.tsx` - Stock level summary
- `StaffLeaderboard.tsx` - Staff ranking by sales

#### Inventory
- `ProductsTable.tsx` - Sortable/filterable product grid
- `ProductFilters.tsx` - Category, brand, stock level filters
- `ProductDetailModal.tsx` - Edit product form
- `ImportProductsModal.tsx` - CSV/JSON bulk import
- `StockLevelIndicator.tsx` - Visual stock status badge
- `CannabinoidProfile.tsx` - THC/CBD bar visualization

#### Compliance
- `ComplianceFlagsTable.tsx` - Flagged products list
- `ResolutionWorkflow.tsx` - Resolution action buttons
- `AlertDetailModal.tsx` - Advisory details
- `SupplierRiskCard.tsx` - Supplier risk score

#### Dispatch
- `OrderQueue.tsx` - Pending orders list
- `DriverList.tsx` - Available drivers
- `DeliveryMap.tsx` - Live driver locations

### Patient App Components

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `InventoryScreen` | Browse menu | `onProductClick, onAddToCart, preferences` |
| `ProductDetailScreen` | Product info | `product, onAddToCart, onBack` |
| `CartScreen` | Shopping cart | `items, onUpdateQuantity, onCheckout` |
| `CheckoutScreen` | Order placement | `items, total, onPlaceOrder` |
| `MyOrdersScreen` | Order history | `onBack` |
| `OrderStatusNotification` | Status alerts | `status, driverName, onDismiss` |
| `Layout` | App shell | `activeTab, onTabChange, cartCount` |

### Driver App Components

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `DriverLogin` | Authentication | `onLogin` |
| `Dashboard` | Order queue | `driver, orders` |
| `DeliveryCard` | Order preview | `order, onAccept` |
| `ActiveDeliveryScreen` | Current delivery | `order, onStatusUpdate` |
| `PaymentCollectionModal` | Collect payment | `order, onCollect` |

---

## 5. Custom Hooks

### Data Fetching Hooks

```typescript
// useInventory.ts
useProducts(filters?: ProductFilters)     // Product list with filters
useProduct(productId: string)             // Single product
useVendors()                              // Unique brands
useInventorySummary()                     // Stock stats

// useDashboard.ts
useDashboardKPIs(dispensaryId: string)    // Revenue, orders, etc.
useSalesTrends(dispensaryId, start, end)  // Hourly sales data
useTopProducts(dispensaryId, limit?)      // Best sellers
useStaffPerformance(dispensaryId)         // Staff metrics

// useAuth.ts
useCurrentDispensary()                    // User's dispensary
useUser()                                 // Current user
useIsAuthenticated()                      // Auth status

// useCompliance.ts
useComplianceFlags(dispensaryId)          // Flagged products
useResolveFlag()                          // Resolve mutation
```

### Mutation Hooks

```typescript
// Returns { mutate, isLoading, error }
useCreateProduct()
useUpdateProduct()
useAdjustInventory()
useBulkImport()
useCreateOrder()
useUpdateOrderStatus()
useCollectPayment()
```

---

## 6. State Management

### Zustand Stores

#### Auth Store (`authStore.ts`)
```typescript
interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  login(email: string, password: string): Promise<boolean>
  logout(): Promise<void>
  refreshUser(): Promise<void>
  clearError(): void
  setUser(user: User): void
}

// Persisted to localStorage: "cannabis-admin-auth"
```

#### Dashboard Store (`dashboardStore.ts`)
```typescript
interface DashboardState {
  selectedLayout: "simple1" | "simple2" | "option1" | ...
  dateRange: { start: Date, end: Date }

  setLayout(layout: string): void
  setDateRange(start: Date, end: Date): void
}
```

#### Notification Store (`notificationStore.ts`)
```typescript
interface NotificationState {
  notifications: Notification[]

  success(message: string): void
  error(message: string): void
  warning(message: string): void
  dismiss(id: string): void
}
```

---

## 7. Authentication & Authorization

### Auth Flow

```
1. User clicks login → Clerk UI opens
2. User authenticates with Clerk
3. Clerk returns JWT token
4. Frontend calls Convex with token
5. Convex validates token via ctx.auth.getUserIdentity()
6. Convex looks up user in users table by clerkId
7. Returns user with dispensary and permissions
```

### Role Hierarchy

```
staff < manager < owner < admin

staff:   view_dashboard, view_analytics
manager: + manage_inventory, view_reports, manage_staff
owner:   + manage_integrations, view_audit_logs
admin:   All permissions
```

### Auth Helpers (`convex/lib/auth.ts`)

```typescript
// Throws if not authenticated
await requireAuth(ctx)

// Throws if no access to dispensary
await requireDispensaryAccess(ctx, dispensaryId)

// Throws if role too low
await requireRole(ctx, "manager")

// Throws if missing permission
await requirePermission(ctx, "manage_inventory")

// Returns user or null (no throw)
const user = await getCurrentUser(ctx)
```

### Bypass Mode (Development)

Set `BYPASS_AUTH=true` in Convex environment to:
- Skip Clerk authentication
- Create mock admin user
- Access all data without auth

**WARNING: Never enable in production**

---

## 8. External Integrations

### Clerk (Authentication)

**Webhook Events Handled:**
- `user.created` - Create user in Convex
- `user.updated` - Sync profile changes
- `user.deleted` - Deactivate user

**Webhook Security:**
```typescript
// Svix signature verification
const isValid = await verifyClerkWebhook(request, secret)
// Timestamp validation (5 min window)
// Fail-closed if secret not configured
```

### POS Integrations

**Supported Gateways:**
- Flowhub
- Budtrack
- Dutchie

**Gateway Pattern:**
```typescript
// convex/payments/gateways/flowhub.ts
export const flowhubGateway: PaymentGateway = {
  name: "flowhub",

  async processPayment(payment, config) {
    // POST to Flowhub API
    return { success: true, transactionId: "..." }
  },

  async refundPayment(paymentId, config) {
    // Refund via Flowhub
  },

  verifyWebhook(request, secret) {
    // HMAC verification
  }
}
```

### OCP Integration (Maine Cannabis)

**Advisory Sync:**
1. OCP publishes advisory
2. Webhook received at `/ocp-webhook`
3. Advisory stored in `ocpAdvisories`
4. Fuzzy matching against products
5. Matches stored in `advisoryProductMatches`
6. Notifications sent to dispensary

**Fuzzy Matching Algorithm:**
```typescript
// convex/lib/ocpMatching.ts
matchProductToAdvisory(product, advisory) {
  // Match by batch number (exact)
  // Match by brand (fuzzy, threshold 80%)
  // Match by product name (fuzzy, threshold 75%)
  // Match by license (exact)
  return { matchType, confidence }
}
```

### Email (Resend)

**Use Cases:**
- Compliance alert notifications
- Cold email campaigns
- Order confirmations
- Driver notifications

---

## 9. Types & Interfaces

### Core Types

```typescript
// User roles
type UserRole = "staff" | "manager" | "owner" | "admin"

// Product categories
type ProductCategory =
  | "flower" | "pre_roll" | "concentrate"
  | "edible" | "topical" | "tincture"
  | "vape" | "accessory"

// Order status
type OrderStatus =
  | "pending" | "accepted" | "picked_up"
  | "en_route" | "delivered" | "cancelled"

// Payment methods
type PaymentMethod = "cash" | "debit" | "ach" | "mobile_pay"

// Payment status
type PaymentStatus =
  | "pending" | "processing" | "collected"
  | "completed" | "failed" | "refunded"

// Compliance
type AdvisorySeverity = "critical" | "high" | "medium" | "low"
type ComplianceStatus = "clear" | "flagged" | "locked" | "under_review"
type MatchStatus = "pending" | "confirmed" | "resolved" | "false_positive"
```

### Interface Definitions

```typescript
interface Product {
  _id: Id<"products">
  dispensaryId: Id<"dispensaries">
  sku: string
  name: string
  category: ProductCategory
  brand?: string
  thcPercentage?: number
  cbdPercentage?: number
  retailPrice: number
  quantityOnHand: number
  complianceStatus: ComplianceStatus
  isActive: boolean
}

interface Order {
  _id: Id<"orders">
  dispensaryId: Id<"dispensaries">
  customerName: string
  items: OrderItem[]
  total: number
  status: OrderStatus
  orderType: "pickup" | "delivery"
  driverId?: string
  deliveryAddress?: string
}

interface OrderItem {
  productId?: Id<"products">
  name: string
  quantity: number
  price: number
}

interface Driver {
  _id: Id<"drivers">
  driverId: string
  name: string
  isOnline: boolean
  completedDeliveries: number
  rating: number
}

interface Payment {
  _id: Id<"payments">
  orderId: Id<"orders">
  paymentMethod: PaymentMethod
  amount: number
  tipAmount?: number
  status: PaymentStatus
}
```

---

## 10. Data Flow Patterns

### Real-time Order Updates

```typescript
// Patient places order
const orderId = await createOrder(orderData)

// Admin dashboard subscribes
const orders = useQuery(api.orders.getAllOrders, { dispensaryId })

// Driver accepts
await acceptOrder({ orderId, driverId, driverName })

// Patient sees update (automatic via subscription)
const myOrder = useQuery(api.orders.getOrder, { orderId })
// myOrder.status changes from "pending" to "accepted"
```

### Inventory Adjustment Flow

```typescript
// Staff adjusts quantity
await adjustQuantity({
  productId,
  quantityChange: -5,
  reason: "damaged",
  notes: "Packaging crushed in transit"
})

// Creates audit log automatically
// Updates quantityOnHand
// Checks low stock threshold
// Triggers notification if below threshold
```

### Compliance Flag Flow

```typescript
// OCP webhook received
// Advisory created
// Product matching runs
// Match created with status: "pending"

// Manager acknowledges
await acknowledgeMatch({ matchId, userId })
// status: "confirmed"

// Staff resolves
await resolveMatch({
  matchId,
  userId,
  resolutionAction: "returned_to_supplier",
  notes: "Returned 24 units on 1/31"
})
// status: "resolved"
// Product complianceStatus: "clear"
```

---

## 11. Feature Areas

### Implemented Features

| Feature | Status | Location |
|---------|--------|----------|
| Product inventory CRUD | ✅ Complete | `convex/products.ts` |
| Order management | ✅ Complete | `convex/orders.ts` |
| Driver delivery flow | ✅ Complete | `driver-app/` |
| Payment collection | ✅ Complete | `convex/payments.ts` |
| Real-time updates | ✅ Complete | Convex subscriptions |
| Role-based access | ✅ Complete | `convex/lib/auth.ts` |
| OCP compliance | ✅ Complete | `convex/ocpAdvisories.ts` |
| Audit logging | ✅ Complete | `convex/lib/auditLog.ts` |
| Multi-tenant | ✅ Complete | `dispensaryId` on all tables |

### Planned Features

| Feature | Priority | Notes |
|---------|----------|-------|
| Customer accounts | High | Loyalty points, order history |
| METRC integration | High | Seed-to-sale tracking |
| Route optimization | Medium | Multiple delivery batching |
| Inventory forecasting | Medium | ML-based reorder suggestions |
| Mobile apps (native) | Low | React Native wrappers |

---

## 12. Extension Points

### Adding a New Product Category

1. Update schema enum in `convex/schema.ts`:
```typescript
category: v.union(
  v.literal("flower"),
  // ... existing
  v.literal("new_category"),
)
```

2. Add to frontend filter options
3. Deploy Convex schema change

### Adding a New Payment Gateway

1. Create gateway file:
```typescript
// convex/payments/gateways/newgateway.ts
export const newGateway: PaymentGateway = {
  name: "newgateway",
  processPayment: async (payment, config) => { ... },
  refundPayment: async (paymentId, config) => { ... },
  verifyWebhook: (request, secret) => { ... }
}
```

2. Register in gateway factory
3. Add to payment config options

### Adding a New Webhook

1. Add handler in `convex/http.ts`:
```typescript
http.route({
  path: "/new-webhook",
  method: "POST",
  handler: async (ctx, request) => {
    // Verify signature
    // Process payload
    // Return response
  }
})
```

2. Configure external service to POST to endpoint

### Adding a New Dashboard Widget

1. Create component:
```typescript
// src/components/dashboard/NewWidget.tsx
export function NewWidget({ data }) {
  return (
    <StatCard
      title="New Metric"
      value={data.value}
      trend={data.trend}
    />
  )
}
```

2. Add to dashboard layouts
3. Create hook for data fetching if needed

### Adding a New Report

1. Create Convex query:
```typescript
// convex/reports.ts
export const newReport = query({
  args: { dispensaryId: v.id("dispensaries"), ... },
  handler: async (ctx, args) => {
    // Aggregate data
    return reportData
  }
})
```

2. Create frontend component
3. Add to reports page

---

## Appendix: Key File Reference

| Purpose | File Path |
|---------|-----------|
| Database schema | `/convex/schema.ts` |
| Order management | `/convex/orders.ts` |
| Product CRUD | `/convex/products.ts` |
| Payment processing | `/convex/payments.ts` |
| User management | `/convex/users.ts` |
| Auth helpers | `/convex/lib/auth.ts` |
| Webhook handlers | `/convex/http.ts` |
| OCP matching | `/convex/lib/ocpMatching.ts` |
| Patient checkout | `/apps/patient-app/components/CheckoutScreen.tsx` |
| Driver payment | `/apps/driver-app/components/PaymentCollectionModal.tsx` |
| Admin inventory | `/apps/admin-dashboard/src/hooks/useInventory.ts` |
| Type definitions | `/apps/admin-dashboard/src/types/index.ts` |
| Dispensary config | `/packages/config/dispensary.ts` |
| Theme colors | `/packages/config/theme.ts` |

---

*This document is intended for AI-assisted development. When adding features or making changes, reference the relevant sections for context on existing patterns and conventions.*
