# Analytics Module - Data Flow & Architecture Diagrams

## 1. Overall Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERACTION                             │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        ANALYTICS PAGE                                │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  DateRangePicker | ComparisonToggle | ExportMenu             │  │
│  └──────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  SalesAnalyticsSection                                        │  │
│  │  CustomerAnalyticsSection                                     │  │
│  │  ProductAnalyticsSection                                      │  │
│  │  TimeAnalyticsSection                                         │  │
│  └──────────────────────────────────────────────────────────────┘  │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    REACT QUERY HOOKS (useAnalytics.ts)               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ useSales     │  │ useCustomer  │  │ useProduct   │  useTime     │
│  │ Analytics()  │  │ Analytics()  │  │ Analytics()  │  Analytics() │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                 │                  │                       │
│         └─────────────────┴──────────────────┘                       │
│                           │                                          │
│         ┌─────────────────┴─────────────────┐                       │
│         │  Query Keys & Cache Management     │                       │
│         │  - 5-15 min staleTime             │                       │
│         │  - Automatic refetch on dateRange  │                       │
│         └─────────────────┬─────────────────┘                       │
└───────────────────────────┼─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                ZUSTAND STORE (analyticsStore.ts)                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  STATE:                                                       │  │
│  │  - dateRange: AnalyticsDateRange                             │  │
│  │  - comparison: ComparisonPeriod | null                       │  │
│  │  - filters: AnalyticsFilters                                 │  │
│  │  - isRefreshing: boolean                                     │  │
│  └──────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  ACTIONS:                                                     │  │
│  │  - setDateRange(), setDateRangePreset()                      │  │
│  │  - toggleComparison(), setComparison()                       │  │
│  │  - setFilters(), resetFilters()                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│              SERVICE LAYER (analytics.service.ts)                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  getSalesAnalytics(dateRange, comparison)                    │  │
│  │  getCustomerAnalytics(dateRange, comparison)                 │  │
│  │  getProductAnalytics(dateRange, filters)                     │  │
│  │  getTimeAnalytics(dateRange)                                 │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  DECISION LOGIC:                                              │  │
│  │  - Simple queries → Materialized Views (fast)                │  │
│  │  - Complex aggregations → Edge Function (powerful)           │  │
│  │  - UI transformations → Client-side (flexible)               │  │
│  └──────────────────────────────────────────────────────────────┘  │
└───────────────────┬────────────────────────┬────────────────────────┘
                    │                        │
       ┌────────────┴────────┐    ┌──────────┴──────────┐
       │                     │    │                      │
       ▼                     ▼    ▼                      ▼
┌──────────────┐   ┌─────────────────────┐   ┌──────────────────────┐
│  SUPABASE    │   │  SUPABASE           │   │  SUPABASE            │
│  DIRECT      │   │  EDGE FUNCTION      │   │  MATERIALIZED VIEWS  │
│  QUERIES     │   │  /calculate-        │   │                      │
│              │   │  analytics          │   │  - mv_daily_sales_   │
│  - Select    │   │                     │   │    summary           │
│    from      │   │  Heavy computations:│   │  - mv_product_       │
│    tables    │   │  - Customer cohorts │   │    performance       │
│  - Filters   │   │  - CLV calculations │   │  - mv_sales_by_time  │
│  - Joins     │   │  - Forecasting      │   │                      │
│              │   │  - Staff insights   │   │  Refreshed hourly    │
└──────┬───────┘   └──────────┬──────────┘   └──────────┬───────────┘
       │                      │                          │
       └──────────────────────┴──────────────────────────┘
                              │
                              ▼
       ┌─────────────────────────────────────────────────┐
       │         SUPABASE POSTGRES DATABASE               │
       │                                                  │
       │  Tables:                                         │
       │  - transactions (sales data)                     │
       │  - products (catalog)                            │
       │  - customers (customer records)                  │
       │  - users (staff)                                 │
       │  - compliance_flags                              │
       │                                                  │
       │  Indexes:                                        │
       │  - idx_transactions_date                         │
       │  - idx_customers_hash                            │
       │  - idx_products_type                             │
       └──────────────────────────────────────────────────┘
```

---

## 2. Component Hierarchy

```
AnalyticsPage
│
├── DateRangePicker
│   └── Menu (Chakra UI)
│       └── MenuItem (Today, Last 7 days, etc.)
│
├── ComparisonToggle
│   └── Switch/Button
│
├── ExportMenu
│   └── Menu (CSV, PDF, PNG)
│
├── SalesAnalyticsSection
│   ├── MetricCard (Revenue)
│   ├── MetricCard (Transactions)
│   ├── MetricCard (Avg Ticket)
│   ├── RevenueLineChart
│   ├── SalesByCategoryChart (Pie/Donut)
│   ├── ProductRankingChart (Horizontal Bar)
│   └── HeatmapChart (Time patterns)
│
├── CustomerAnalyticsSection
│   ├── MetricCard (Total Customers)
│   ├── MetricCard (CLV)
│   ├── MetricCard (Retention Rate)
│   ├── CustomerGrowthChart (Line)
│   ├── CohortAnalysisChart
│   └── BasketSizeChart
│
├── ProductAnalyticsSection
│   ├── ProductRankingChart
│   ├── CategoryMixChart (Pie)
│   ├── CannabinoidMixChart (Donut - THC vs CBD)
│   ├── PriceElasticityChart
│   └── ProfitabilityChart
│
└── TimeAnalyticsSection
    ├── HeatmapChart (Day x Hour)
    ├── SeasonalTrendsChart (Monthly)
    └── EventImpactChart
```

---

## 3. Date Range & Comparison Flow

```
┌──────────────────────────────────────────────────────────────┐
│  USER SELECTS DATE RANGE                                      │
│  "Last 30 days"                                               │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│  analyticsStore.setDateRangePreset('last_30_days')           │
│                                                               │
│  Calculates:                                                  │
│  from: 2024-10-10                                            │
│  to:   2024-11-09                                            │
│  label: "Last 30 days"                                       │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│  USER ENABLES COMPARISON                                      │
│  Click "Compare to previous period"                           │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│  analyticsStore.toggleComparison()                           │
│                                                               │
│  Calculates comparison period:                               │
│  - Days in current range: 30 days                            │
│  - Comparison end: 2024-10-09 (day before current start)    │
│  - Comparison start: 2024-09-10 (30 days before comp end)   │
│                                                               │
│  comparison: {                                                │
│    enabled: true,                                             │
│    from: "2024-09-10",                                       │
│    to: "2024-10-09",                                         │
│    label: "vs Previous Period"                               │
│  }                                                            │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│  REACT QUERY DETECTS STATE CHANGE                            │
│                                                               │
│  Query key changes:                                           │
│  ['analytics', 'sales', '2024-10-10', '2024-11-09', true]   │
│                          ↑                                    │
│                   Comparison enabled                          │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│  REFETCH DATA WITH NEW PARAMETERS                            │
│                                                               │
│  analytics.service.getSalesAnalytics(                        │
│    dateRange: { from: '2024-10-10', to: '2024-11-09' },     │
│    comparison: { from: '2024-09-10', to: '2024-10-09' }     │
│  )                                                            │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│  SERVICE FETCHES BOTH PERIODS                                │
│                                                               │
│  Current period:  $45,000 revenue                            │
│  Previous period: $38,000 revenue                            │
│                                                               │
│  Calculates:                                                  │
│  percentChange: +18.4%                                       │
│  trend: 'up'                                                 │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│  COMPONENTS RENDER WITH COMPARISON                           │
│                                                               │
│  MetricCard shows:                                            │
│  ┌────────────────────────────────────┐                      │
│  │ Total Revenue                      │                      │
│  │ $45,000                            │                      │
│  │ ↑ 18.4% vs previous                │  (green)             │
│  └────────────────────────────────────┘                      │
│                                                               │
│  Chart shows:                                                 │
│  - Current period line (solid green)                         │
│  - Previous period line (dashed gray)                        │
└──────────────────────────────────────────────────────────────┘
```

---

## 4. Query Strategy Decision Tree

```
                    ┌─────────────────────┐
                    │  Analytics Request  │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  What type of       │
                    │  aggregation?       │
                    └──────────┬──────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
         ▼                     ▼                     ▼
┌────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  SIMPLE        │  │  COMPLEX         │  │  UI              │
│  AGGREGATION   │  │  CALCULATION     │  │  TRANSFORMATION  │
└────────┬───────┘  └────────┬─────────┘  └────────┬─────────┘
         │                   │                      │
         │                   │                      │
         ▼                   ▼                      ▼
┌────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ Use            │  │ Use              │  │ Client-side      │
│ Materialized   │  │ Edge Function    │  │ JavaScript       │
│ View           │  │                  │  │                  │
│                │  │ /calculate-      │  │ - Chart          │
│ Examples:      │  │  analytics       │  │   formatting     │
│ - Daily sales  │  │                  │  │ - Date labels    │
│ - Product      │  │ Examples:        │  │ - Color mapping  │
│   totals       │  │ - Customer CLV   │  │ - Sorting        │
│ - Category     │  │ - Cohort         │  │                  │
│   breakdown    │  │   analysis       │  │ useMemo() for    │
│                │  │ - Forecasting    │  │ memoization      │
│ Fast: <100ms   │  │ - Churn risk     │  │                  │
│ Pre-computed   │  │                  │  │ Fast: <10ms      │
│ Hourly refresh │  │ Moderate: 500ms  │  │ No network call  │
└────────────────┘  │ On-demand calc   │  └──────────────────┘
                    └──────────────────┘
```

---

## 5. Export Flow

```
┌──────────────────────────────────────────────────────────────┐
│  USER CLICKS EXPORT                                           │
│  Selects format: CSV / PDF / PNG                             │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
               ┌────────────────────────┐
               │  Export Format?        │
               └────┬─────────┬─────────┘
                    │         │
        ┌───────────┘         └───────────┐
        │                                 │
        ▼                                 ▼
┌───────────────┐                 ┌──────────────┐
│  CSV          │                 │  PDF / PNG   │
└───────┬───────┘                 └──────┬───────┘
        │                                │
        ▼                                ▼
┌───────────────────────────┐  ┌─────────────────────────┐
│ exportHelpers.exportCSV() │  │ exportHelpers.export    │
│                           │  │ PDF() / exportPNG()     │
│ 1. Get current data from  │  │                         │
│    React Query cache      │  │ 1. Render components    │
│                           │  │    to canvas            │
│ 2. Transform to rows:     │  │                         │
│    [{                     │  │ 2. Use libraries:       │
│      date: '2024-11-01',  │  │    - jsPDF (PDF)        │
│      revenue: 1234,       │  │    - html2canvas (PNG)  │
│      transactions: 45     │  │                         │
│    }]                     │  │ 3. Include:             │
│                           │  │    - Charts             │
│ 3. Use papaparse:         │  │    - Metrics            │
│    const csv =            │  │    - Date range         │
│      Papa.unparse(rows)   │  │    - Branding           │
│                           │  │                         │
│ 4. Trigger download:      │  │ 4. Trigger download     │
│    const blob =           │  │                         │
│      new Blob([csv])      │  │                         │
│    download(blob,         │  │                         │
│      'sales-analytics.csv'│  │                         │
│    )                      │  │                         │
└───────────────────────────┘  └─────────────────────────┘
                │                          │
                └──────────┬───────────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │  File Downloads      │
                │  to User             │
                └──────────────────────┘
```

---

## 6. Caching Strategy

```
┌────────────────────────────────────────────────────────────────┐
│                    REACT QUERY CACHE LAYERS                     │
└────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  LAYER 1: Fresh Data (0-5 minutes)                              │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Query Status: fresh                                       │ │
│  │  Behavior: Use cached data, no background refetch         │ │
│  │  Use case: User switches tabs and returns                 │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  LAYER 2: Stale Data (5-10 minutes)                             │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Query Status: stale                                       │ │
│  │  Behavior: Show cached data + background refetch          │ │
│  │  Use case: Analytics page stays open                      │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  LAYER 3: Garbage Collection (10+ minutes)                      │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Query Status: inactive → garbage collected               │ │
│  │  Behavior: Remove from memory                             │ │
│  │  Use case: User navigates away, memory cleanup            │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

Example Query Config:
{
  queryKey: ['analytics', 'sales', dateRange.from, dateRange.to],
  queryFn: () => getSalesAnalytics(dateRange),
  staleTime: 5 * 60_000,      // 5 minutes - data stays fresh
  gcTime: 10 * 60_000,         // 10 minutes - cache retention
  refetchOnWindowFocus: false, // Don't refetch on tab switch
  refetchOnMount: false,       // Use cache if available
}

Cache Invalidation Triggers:
1. Date range changes → New query key → New fetch
2. Comparison toggle → New query key → New fetch
3. Manual refresh button → Force refetch same query
4. Mutation (if user edits data) → Invalidate related queries
```

---

## 7. Mobile Responsiveness Strategy

```
┌──────────────────────────────────────────────────────────────┐
│                    RESPONSIVE LAYOUT                          │
└──────────────────────────────────────────────────────────────┘

DESKTOP (lg: 992px+)
┌────────────────────────────────────────────────────────────┐
│  [Date Range]  [Comparison]         [Export ▼]             │
├────────────────────────────────────────────────────────────┤
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐                   │
│  │ Rev  │  │Trans │  │ Avg  │  │ CLV  │   Metric Cards    │
│  │$45k  │  │ 234  │  │ $192 │  │$2.1k │   (4 columns)     │
│  └──────┘  └──────┘  └──────┘  └──────┘                   │
├─────────────────────────────┬──────────────────────────────┤
│  ┌─────────────────────────┐│ ┌──────────────────────────┐│
│  │                         ││ │                          ││
│  │  Revenue Line Chart     ││ │  Category Pie Chart      ││
│  │  (Large)                ││ │  (Medium)                ││
│  │                         ││ │                          ││
│  └─────────────────────────┘│ └──────────────────────────┘│
└─────────────────────────────┴──────────────────────────────┘

TABLET (md: 768px-991px)
┌────────────────────────────────────────────────────────────┐
│  [Date Range]  [Comparison]  [Export ▼]                    │
├────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐                       │
│  │ Revenue      │  │ Transactions │   Metric Cards        │
│  │ $45,000      │  │ 234          │   (2 columns)         │
│  └──────────────┘  └──────────────┘                       │
│  ┌──────────────┐  ┌──────────────┐                       │
│  │ Avg Ticket   │  │ CLV          │                       │
│  │ $192         │  │ $2,100       │                       │
│  └──────────────┘  └──────────────┘                       │
├────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────┐│
│  │  Revenue Line Chart (Full Width, Reduced Height)      ││
│  └────────────────────────────────────────────────────────┘│
├────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────┐│
│  │  Category Pie Chart (Full Width)                      ││
│  └────────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────┘

MOBILE (base: 0-479px)
┌────────────────────────────────┐
│  [Date Range ▼]                │
│  [Compare] [Export]            │
├────────────────────────────────┤
│  ┌──────────────────────────┐ │
│  │ Revenue                  │ │ Metric Cards
│  │ $45,000                  │ │ (1 column,
│  │ ↑ 18.4% vs previous      │ │  vertical
│  └──────────────────────────┘ │  stack)
│  ┌──────────────────────────┐ │
│  │ Transactions             │ │
│  │ 234                      │ │
│  │ ↑ 12.3% vs previous      │ │
│  └──────────────────────────┘ │
├────────────────────────────────┤
│  ┌──────────────────────────┐ │
│  │ Revenue Trend            │ │ Charts
│  │ ▁▂▃▅▇█ (Sparkline)      │ │ (Simplified,
│  └──────────────────────────┘ │  smaller)
├────────────────────────────────┤
│  ┌──────────────────────────┐ │
│  │ Top Categories           │ │ Lists instead
│  │ • Flower      $12k       │ │ of charts
│  │ • Edibles     $8k        │ │
│  │ • Concentrates $6k       │ │
│  └──────────────────────────┘ │
└────────────────────────────────┘

Chakra UI Implementation:
<SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={6}>
  <MetricCard />
</SimpleGrid>

<Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6}>
  <RevenueChart height={{ base: 200, md: 300, lg: 400 }} />
  <CategoryChart />
</Grid>
```

---

## 8. Performance Optimization Strategies

```
┌────────────────────────────────────────────────────────────────┐
│                   OPTIMIZATION TECHNIQUES                       │
└────────────────────────────────────────────────────────────────┘

1. DATABASE LEVEL
   ┌─────────────────────────────────────────────────────────┐
   │ • Materialized Views (pre-computed aggregations)        │
   │ • Indexes on dispensary_id + date columns              │
   │ • Limit result sets (pagination)                        │
   │ • Use EXPLAIN ANALYZE to optimize queries              │
   └─────────────────────────────────────────────────────────┘

2. API LEVEL
   ┌─────────────────────────────────────────────────────────┐
   │ • Edge Functions for heavy calculations                 │
   │ • Batch multiple queries into single request           │
   │ • Return only needed fields (SELECT specific columns)  │
   │ • Compress response with gzip                          │
   └─────────────────────────────────────────────────────────┘

3. REACT QUERY LEVEL
   ┌─────────────────────────────────────────────────────────┐
   │ • Aggressive caching (5-15 min staleTime)              │
   │ • Background refetching (keep UI responsive)           │
   │ • Prefetch likely next queries                         │
   │ • Query deduplication (prevent duplicate requests)     │
   └─────────────────────────────────────────────────────────┘

4. COMPONENT LEVEL
   ┌─────────────────────────────────────────────────────────┐
   │ • useMemo for expensive chart transformations:         │
   │   const chartData = useMemo(() => {                    │
   │     return transform(rawData)                          │
   │   }, [rawData])                                        │
   │                                                         │
   │ • React.memo for pure components:                      │
   │   export const MetricCard = React.memo(...)            │
   │                                                         │
   │ • Lazy loading:                                        │
   │   const AnalyticsPage = lazy(() => import(...))        │
   │                                                         │
   │ • Code splitting by route and section                  │
   └─────────────────────────────────────────────────────────┘

5. CHART LEVEL
   ┌─────────────────────────────────────────────────────────┐
   │ • Limit data points:                                    │
   │   - Daily data for ranges < 90 days                    │
   │   - Weekly data for ranges 90-365 days                 │
   │   - Monthly data for ranges > 365 days                 │
   │                                                         │
   │ • Simplify on mobile:                                  │
   │   - Hide grid lines                                    │
   │   - Reduce tick marks                                  │
   │   - Use sparklines instead of full charts              │
   │                                                         │
   │ • Virtualize long lists (react-window):                │
   │   <FixedSizeList height={400} itemCount={1000} />     │
   └─────────────────────────────────────────────────────────┘

6. BUNDLE SIZE
   ┌─────────────────────────────────────────────────────────┐
   │ • Tree-shake unused Recharts components                │
   │ • Use date-fns instead of moment.js                    │
   │ • Lazy load PDF/CSV export libraries                   │
   │ • Compress and minify in production                    │
   └─────────────────────────────────────────────────────────┘

PERFORMANCE TARGETS:
• Initial page load: < 2 seconds
• Chart render: < 500ms
• Date range switch: < 300ms (from cache)
• Export generation: < 3 seconds
```

---

## 9. Error Handling & Loading States

```
┌────────────────────────────────────────────────────────────────┐
│                   STATE MANAGEMENT                              │
└────────────────────────────────────────────────────────────────┘

LOADING STATE
┌──────────────────────────────┐
│  isLoading: true             │
│  isFetching: true            │
│  data: undefined             │
└──────────┬───────────────────┘
           │
           ▼
    ┌──────────────────┐
    │  Show Skeletons  │
    │  ┌────────────┐  │
    │  │ ▓▓▓▓▓▓▓▓  │  │
    │  │ ▓▓▓▓      │  │
    │  └────────────┘  │
    └──────────────────┘

SUCCESS STATE
┌──────────────────────────────┐
│  isLoading: false            │
│  isFetching: false           │
│  data: {...}                 │
│  error: null                 │
└──────────┬───────────────────┘
           │
           ▼
    ┌──────────────────┐
    │  Render Charts   │
    │  and Metrics     │
    └──────────────────┘

ERROR STATE
┌──────────────────────────────┐
│  isLoading: false            │
│  error: Error {...}          │
│  data: undefined             │
└──────────┬───────────────────┘
           │
           ▼
    ┌──────────────────────────┐
    │  ErrorBoundary or        │
    │  Error Alert:            │
    │  ┌────────────────────┐  │
    │  │ ⚠ Failed to load   │  │
    │  │   analytics data   │  │
    │  │   [Retry]          │  │
    │  └────────────────────┘  │
    └──────────────────────────┘

EMPTY STATE
┌──────────────────────────────┐
│  isLoading: false            │
│  data: []                    │
│  error: null                 │
└──────────┬───────────────────┘
           │
           ▼
    ┌──────────────────────────┐
    │  EmptyState Component:   │
    │  ┌────────────────────┐  │
    │  │  📊                │  │
    │  │  No data yet       │  │
    │  │  for this period   │  │
    │  └────────────────────┘  │
    └──────────────────────────┘

STALE WHILE REVALIDATE
┌──────────────────────────────┐
│  isLoading: false            │
│  isFetching: true            │
│  data: {...} (old data)      │
└──────────┬───────────────────┘
           │
           ▼
    ┌──────────────────────────┐
    │  Show Old Data +         │
    │  Loading Indicator:      │
    │  ┌────────────────────┐  │
    │  │  Revenue: $45k     │  │
    │  │  🔄 Updating...    │  │
    │  └────────────────────┘  │
    └──────────────────────────┘

Implementation:
const { data, isLoading, error, isFetching } = useSalesAnalytics();

if (isLoading) return <Skeleton />;
if (error) return <ErrorAlert error={error} />;
if (!data || data.length === 0) return <EmptyState />;

return (
  <>
    {isFetching && <Box position="absolute" top={2} right={2}>
      <Spinner size="sm" />
    </Box>}
    <Charts data={data} />
  </>
);
```

---

This architecture ensures your Analytics module is production-ready, performant, and maintainable!
