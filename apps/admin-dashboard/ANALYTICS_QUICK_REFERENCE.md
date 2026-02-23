# Analytics Module - Quick Reference Card

## File Paths (Absolute)

```
Types:
/Users/shawngarland/cannabis-admin-dashboard/src/types/index.ts

Store:
/Users/shawngarland/cannabis-admin-dashboard/src/stores/analyticsStore.ts

Service:
/Users/shawngarland/cannabis-admin-dashboard/src/services/api/analytics.service.ts

Hooks:
/Users/shawngarland/cannabis-admin-dashboard/src/hooks/useAnalytics.ts

Components:
/Users/shawngarland/cannabis-admin-dashboard/src/modules/analytics/components/
  ├── DateRangePicker.tsx
  ├── ComparisonToggle.tsx
  ├── MetricCard.tsx
  ├── charts/
  │   ├── RevenueLineChart.tsx
  │   ├── SalesByCategoryChart.tsx
  │   └── ...
  └── sections/
      ├── SalesAnalyticsSection.tsx
      └── ...

Page:
/Users/shawngarland/cannabis-admin-dashboard/src/pages/AnalyticsPage.tsx
```

---

## Common Code Snippets

### Using the Analytics Store

```typescript
import { useAnalyticsStore } from '@/stores/analyticsStore';

// Get current date range
const dateRange = useAnalyticsStore((state) => state.dateRange);

// Set date range preset
const setDateRangePreset = useAnalyticsStore((state) => state.setDateRangePreset);
setDateRangePreset('last_30_days');

// Toggle comparison
const toggleComparison = useAnalyticsStore((state) => state.toggleComparison);
toggleComparison();

// Get comparison state
const comparison = useAnalyticsStore((state) => state.comparison);
```

### Using Analytics Hooks

```typescript
import { useSalesAnalytics } from '@/hooks/useAnalytics';

const { data, isLoading, error, isFetching } = useSalesAnalytics();

// Access sales data
const revenue = data?.revenue.current;
const percentChange = data?.revenue.percentChange;
const trend = data?.revenue.trend; // 'up' | 'down' | 'stable'
```

### Creating a New Metric Card

```typescript
import { MetricCard } from '@/modules/analytics/components/MetricCard';
import { BanknotesIcon } from '@heroicons/react/24/outline';

<MetricCard
  label="Total Revenue"
  value={salesData?.revenue.current || 0}
  format="currency" // or 'number' or 'percentage'
  metric={salesData?.revenue} // Optional: for % change indicator
  isLoading={isLoading}
  icon={<BanknotesIcon className="w-6 h-6" />}
/>
```

### Adding a New Chart

```typescript
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

<ResponsiveContainer width="100%" height={300}>
  <LineChart data={chartData}>
    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
    <XAxis dataKey="date" stroke="#94a3b8" />
    <YAxis stroke="#94a3b8" />
    <Tooltip
      contentStyle={{
        backgroundColor: '#1e293b',
        border: '1px solid #334155',
      }}
    />
    <Line
      type="monotone"
      dataKey="revenue"
      stroke="#10b981"
      strokeWidth={2}
    />
  </LineChart>
</ResponsiveContainer>
```

---

## Color Palette

```typescript
// Backgrounds
bg="slate.800"         // Card backgrounds
borderColor="slate.700" // Card borders
bg="slate.900"         // Page background

// Text
color="white"          // Primary text
color="slate.400"      // Secondary text
color="slate.500"      // Tertiary text

// Charts
stroke="#10b981"       // Green (positive/revenue)
stroke="#ef4444"       // Red (negative/costs)
stroke="#3b82f6"       // Blue (primary metric)
stroke="#64748b"       // Gray (comparison/secondary)
stroke="#f59e0b"       // Amber (warnings)

// Status
color="green.500"      // Positive change
color="red.500"        // Negative change
color="slate.400"      // Neutral/no change
```

---

## Responsive Breakpoints

```typescript
// Chakra UI breakpoints
<SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={6}>

// base: 0px - 479px (mobile)
// sm:  480px - 767px (small tablet)
// md:  768px - 991px (tablet)
// lg:  992px - 1279px (desktop)
// xl:  1280px+ (large desktop)
```

---

## Date Range Presets

```typescript
type DateRangePreset =
  | 'today'           // Today only
  | 'yesterday'       // Yesterday only
  | 'last_7_days'     // Last 7 days including today
  | 'last_30_days'    // Last 30 days including today
  | 'this_month'      // 1st of month to today
  | 'last_month'      // Full previous month
  | 'this_year'       // Jan 1 to today
  | 'custom';         // Custom date range
```

---

## Format Helpers

```typescript
// Currency
const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

// Number
const formatNumber = (value: number) =>
  new Intl.NumberFormat('en-US').format(value);

// Percentage
const formatPercentage = (value: number) =>
  `${value.toFixed(1)}%`;

// Date
import { format } from 'date-fns';
const formatDate = (date: string) =>
  format(new Date(date), 'MMM dd, yyyy');
```

---

## React Query Configuration

```typescript
// Sales analytics query
{
  queryKey: ['analytics', 'sales', dateRange.from, dateRange.to, comparisonEnabled],
  queryFn: () => analyticsService.getSalesAnalytics(dateRange, comparison),
  staleTime: 5 * 60_000,      // 5 minutes
  gcTime: 10 * 60_000,         // 10 minutes cache retention
  refetchOnWindowFocus: false, // Don't refetch on tab switch
  refetchOnMount: false,       // Use cache if available
}
```

---

## Database Queries

### Refresh Materialized Views

```sql
-- Refresh all analytics views
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_sales_summary;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_product_performance;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_sales_by_time;
```

### Query Daily Sales

```sql
SELECT *
FROM mv_daily_sales_summary
WHERE dispensary_id = 'xxx'
  AND sale_date >= '2024-10-01'
  AND sale_date <= '2024-10-31'
ORDER BY sale_date ASC;
```

### Query Product Performance

```sql
SELECT
  product_name,
  product_type,
  total_revenue,
  units_sold
FROM mv_product_performance
WHERE dispensary_id = 'xxx'
ORDER BY total_revenue DESC
LIMIT 10;
```

---

## Common Patterns

### Loading State

```typescript
if (isLoading) {
  return <Skeleton height="300px" />;
}
```

### Error State

```typescript
if (error) {
  return (
    <Alert status="error">
      <AlertIcon />
      Failed to load analytics data
    </Alert>
  );
}
```

### Empty State

```typescript
if (!data || data.length === 0) {
  return (
    <Box textAlign="center" py={10}>
      <Text color="slate.400">No data for this period</Text>
    </Box>
  );
}
```

### Stale While Revalidate

```typescript
{isFetching && !isLoading && (
  <Box position="absolute" top={2} right={2}>
    <Spinner size="sm" color="blue.500" />
  </Box>
)}
```

---

## Useful Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Type check
npm run type-check

# Lint
npm run lint

# Run tests
npm run test

# Format code
npm run format
```

---

## Import Aliases

```typescript
// If configured in tsconfig.json
import { MetricCard } from '@/modules/analytics/components/MetricCard';
import { useSalesAnalytics } from '@/hooks/useAnalytics';
import { useAnalyticsStore } from '@/stores/analyticsStore';
import type { SalesAnalytics } from '@/types';
```

---

## Performance Tips

1. **Memoize expensive calculations:**
```typescript
const chartData = useMemo(() => {
  return salesData?.revenueTrend.map(item => ({
    ...item,
    formattedDate: format(new Date(item.date), 'MMM dd'),
  }));
}, [salesData]);
```

2. **Memo-ize components:**
```typescript
export const MetricCard = React.memo(MetricCardComponent);
```

3. **Lazy load charts:**
```typescript
const HeatmapChart = lazy(() => import('./charts/HeatmapChart'));
```

4. **Debounce inputs:**
```typescript
const debouncedSetFilters = useDebouncedCallback(
  (filters) => setFilters(filters),
  500
);
```

---

## Troubleshooting Quick Fixes

**Charts not rendering:**
```bash
npm install recharts --force
```

**Date-fns errors:**
```bash
npm install date-fns@latest
```

**Store state not updating:**
```typescript
// Check you're using the hook, not the store directly
const dateRange = useAnalyticsStore((state) => state.dateRange); // ✓
const dateRange = analyticsStore.dateRange; // ✗
```

**React Query not caching:**
```typescript
// Check staleTime is set
staleTime: 5 * 60_000, // ✓
staleTime: 0,          // ✗ (always refetch)
```

---

## Testing Examples

### Test Store Actions

```typescript
import { renderHook, act } from '@testing-library/react';
import { useAnalyticsStore } from '@/stores/analyticsStore';

test('setDateRangePreset updates date range', () => {
  const { result } = renderHook(() => useAnalyticsStore());

  act(() => {
    result.current.setDateRangePreset('last_7_days');
  });

  expect(result.current.dateRange.preset).toBe('last_7_days');
  expect(result.current.dateRange.label).toBe('Last 7 days');
});
```

### Test Component Rendering

```typescript
import { render, screen } from '@testing-library/react';
import { MetricCard } from '@/modules/analytics/components/MetricCard';

test('MetricCard displays formatted value', () => {
  render(
    <MetricCard
      label="Revenue"
      value={12345}
      format="currency"
    />
  );

  expect(screen.getByText('Revenue')).toBeInTheDocument();
  expect(screen.getByText('$12,345')).toBeInTheDocument();
});
```

---

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/analytics-module

# Stage changes
git add src/modules/analytics/
git add src/stores/analyticsStore.ts
git add src/services/api/analytics.service.ts

# Commit with descriptive message
git commit -m "feat: add analytics module with sales insights"

# Push to remote
git push origin feature/analytics-module

# Create pull request via GitHub UI
```

---

## Documentation Links

- **Full Architecture:** `/Users/shawngarland/cannabis-admin-dashboard/ANALYTICS_MODULE_ARCHITECTURE.md`
- **Data Flow Diagrams:** `/Users/shawngarland/cannabis-admin-dashboard/ANALYTICS_DATA_FLOW.md`
- **Implementation Guide:** `/Users/shawngarland/cannabis-admin-dashboard/ANALYTICS_IMPLEMENTATION_GUIDE.md`
- **Executive Summary:** `/Users/shawngarland/cannabis-admin-dashboard/ANALYTICS_SUMMARY.md`

---

**Print this page for quick reference while coding!**
