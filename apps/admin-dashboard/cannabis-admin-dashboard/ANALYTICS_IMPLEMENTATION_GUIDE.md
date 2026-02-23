# Analytics Module - Quick Start Implementation Guide

This guide provides step-by-step instructions for implementing the Analytics module in your Cannabis Admin Dashboard.

---

## Prerequisites

Ensure you have the following already installed (should be from your existing setup):
- React 18+
- TypeScript
- Vite
- Chakra UI v2
- Recharts
- TanStack Query (React Query)
- Zustand
- Supabase client

---

## Phase 1: Foundation Setup (Day 1-2)

### Step 1.1: Install Additional Dependencies

```bash
cd /Users/shawngarland/cannabis-admin-dashboard

# Install export libraries (optional for Phase 5)
npm install papaparse jspdf html2canvas
npm install --save-dev @types/papaparse

# Install date utilities if not already installed
npm install date-fns
```

### Step 1.2: Add Analytics Types

Open `/Users/shawngarland/cannabis-admin-dashboard/src/types/index.ts` and add the analytics types at the end:

```typescript
// Copy the entire "Analytics Module Types" section from ANALYTICS_MODULE_ARCHITECTURE.md
// Starting from line "// ============================================================================"
// Through all the analytics interfaces
```

### Step 1.3: Create Analytics Store

Create file: `/Users/shawngarland/cannabis-admin-dashboard/src/stores/analyticsStore.ts`

```typescript
// Copy the complete store code from ANALYTICS_MODULE_ARCHITECTURE.md
```

### Step 1.4: Create Analytics Service

Create file: `/Users/shawngarland/cannabis-admin-dashboard/src/services/api/analytics.service.ts`

```typescript
// Copy the complete service code from ANALYTICS_MODULE_ARCHITECTURE.md
// Start with just getSalesAnalytics() for Phase 1
```

### Step 1.5: Create Analytics Hooks

Create file: `/Users/shawngarland/cannabis-admin-dashboard/src/hooks/useAnalytics.ts`

```typescript
// Copy the complete hooks code from ANALYTICS_MODULE_ARCHITECTURE.md
// Start with just useSalesAnalytics() for Phase 1
```

### Step 1.6: Update Query Client Config

Open `/Users/shawngarland/cannabis-admin-dashboard/src/config/queryClient.ts` and add analytics query keys:

```typescript
export const queryKeys = {
  // ... existing keys
  analytics: {
    all: ['analytics'] as const,
    sales: (from: string, to: string, comparison: boolean) =>
      [...queryKeys.analytics.all, 'sales', from, to, comparison] as const,
    customers: (from: string, to: string, comparison: boolean) =>
      [...queryKeys.analytics.all, 'customers', from, to, comparison] as const,
    products: (from: string, to: string, filters?: any) =>
      [...queryKeys.analytics.all, 'products', from, to, filters] as const,
    time: (from: string, to: string) =>
      [...queryKeys.analytics.all, 'time', from, to] as const,
  },
};
```

---

## Phase 2: Core Components (Day 3-5)

### Step 2.1: Create Module Directory Structure

```bash
cd /Users/shawngarland/cannabis-admin-dashboard/src

mkdir -p modules/analytics/components/charts
mkdir -p modules/analytics/components/sections
mkdir -p modules/analytics/utils
```

### Step 2.2: Create DateRangePicker Component

Create file: `/Users/shawngarland/cannabis-admin-dashboard/src/modules/analytics/components/DateRangePicker.tsx`

```typescript
import { Box, Button, Menu, MenuButton, MenuList, MenuItem, HStack } from '@chakra-ui/react';
import { CalendarIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useAnalyticsStore } from '../../../stores/analyticsStore';
import type { DateRangePreset } from '../../../types';

const presets: Array<{ value: DateRangePreset; label: string }> = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last_7_days', label: 'Last 7 days' },
  { value: 'last_30_days', label: 'Last 30 days' },
  { value: 'this_month', label: 'This month' },
  { value: 'last_month', label: 'Last month' },
  { value: 'this_year', label: 'This year' },
];

export function DateRangePicker() {
  const dateRange = useAnalyticsStore((state) => state.dateRange);
  const setDateRangePreset = useAnalyticsStore((state) => state.setDateRangePreset);

  return (
    <Menu>
      <MenuButton
        as={Button}
        leftIcon={<CalendarIcon className="w-5 h-5" />}
        rightIcon={<ChevronDownIcon className="w-4 h-4" />}
        variant="outline"
        colorScheme="slate"
        size="md"
      >
        {dateRange.label || 'Select date range'}
      </MenuButton>
      <MenuList bg="slate.800" borderColor="slate.700">
        {presets.map((preset) => (
          <MenuItem
            key={preset.value}
            onClick={() => setDateRangePreset(preset.value)}
            bg={dateRange.preset === preset.value ? 'slate.700' : 'slate.800'}
            _hover={{ bg: 'slate.700' }}
            color="white"
          >
            {preset.label}
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
}
```

### Step 2.3: Create ComparisonToggle Component

Create file: `/Users/shawngarland/cannabis-admin-dashboard/src/modules/analytics/components/ComparisonToggle.tsx`

```typescript
import { Button, HStack, Text, Icon } from '@chakra-ui/react';
import { ArrowsRightLeftIcon } from '@heroicons/react/24/outline';
import { useAnalyticsStore } from '../../../stores/analyticsStore';

export function ComparisonToggle() {
  const comparison = useAnalyticsStore((state) => state.comparison);
  const toggleComparison = useAnalyticsStore((state) => state.toggleComparison);

  const isActive = comparison?.enabled || false;

  return (
    <Button
      leftIcon={<ArrowsRightLeftIcon className="w-5 h-5" />}
      onClick={toggleComparison}
      variant={isActive ? 'solid' : 'outline'}
      colorScheme={isActive ? 'blue' : 'slate'}
      size="md"
    >
      {isActive ? 'Comparing' : 'Compare'}
    </Button>
  );
}
```

### Step 2.4: Create MetricCard Component

Create file: `/Users/shawngarland/cannabis-admin-dashboard/src/modules/analytics/components/MetricCard.tsx`

```typescript
import { Box, Text, HStack, Skeleton } from '@chakra-ui/react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';
import type { MetricWithChange } from '../../../types';

interface MetricCardProps {
  label: string;
  value: number;
  format: 'currency' | 'number' | 'percentage';
  metric?: MetricWithChange;
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export function MetricCard({
  label,
  value,
  format,
  metric,
  isLoading = false,
  icon,
}: MetricCardProps) {
  const formatValue = (val: number) => {
    if (format === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(val);
    } else if (format === 'percentage') {
      return `${val.toFixed(1)}%`;
    } else {
      return new Intl.NumberFormat('en-US').format(val);
    }
  };

  if (isLoading) {
    return (
      <Box bg="slate.800" p={6} borderRadius="lg" border="1px solid" borderColor="slate.700">
        <Skeleton height="20px" mb={2} />
        <Skeleton height="32px" mb={2} />
        <Skeleton height="16px" width="60%" />
      </Box>
    );
  }

  const percentChange = metric?.percentChange || 0;
  const isPositive = percentChange > 0;
  const isNegative = percentChange < 0;

  return (
    <Box
      bg="slate.800"
      p={6}
      borderRadius="lg"
      border="1px solid"
      borderColor="slate.700"
      _hover={{ borderColor: 'slate.600' }}
      transition="border-color 0.2s"
    >
      <HStack justify="space-between" mb={2}>
        <Text fontSize="sm" color="slate.400" fontWeight="medium">
          {label}
        </Text>
        {icon && <Box color="slate.500">{icon}</Box>}
      </HStack>

      <Text fontSize="3xl" fontWeight="bold" color="white" mb={1}>
        {formatValue(value)}
      </Text>

      {metric && (
        <HStack spacing={1}>
          {isPositive && <ArrowUpIcon className="w-4 h-4 text-green-500" />}
          {isNegative && <ArrowDownIcon className="w-4 h-4 text-red-500" />}
          <Text
            fontSize="sm"
            fontWeight="medium"
            color={isPositive ? 'green.500' : isNegative ? 'red.500' : 'slate.400'}
          >
            {Math.abs(percentChange).toFixed(1)}%
          </Text>
          <Text fontSize="sm" color="slate.500">
            vs previous
          </Text>
        </HStack>
      )}
    </Box>
  );
}
```

### Step 2.5: Create RevenueLineChart Component

Create file: `/Users/shawngarland/cannabis-admin-dashboard/src/modules/analytics/components/charts/RevenueLineChart.tsx`

```typescript
import { Box, Text, Skeleton } from '@chakra-ui/react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format } from 'date-fns';

interface RevenueLineChartProps {
  data: Array<{
    date: string;
    revenue: number;
    comparisonRevenue?: number;
  }>;
  isLoading?: boolean;
  showComparison?: boolean;
}

export function RevenueLineChart({
  data,
  isLoading = false,
  showComparison = false,
}: RevenueLineChartProps) {
  if (isLoading) {
    return (
      <Box bg="slate.800" p={6} borderRadius="lg" border="1px solid" borderColor="slate.700">
        <Skeleton height="300px" />
      </Box>
    );
  }

  // Format data for chart
  const chartData = data.map((item) => ({
    ...item,
    formattedDate: format(new Date(item.date), 'MMM dd'),
  }));

  return (
    <Box bg="slate.800" p={6} borderRadius="lg" border="1px solid" borderColor="slate.700">
      <Text fontSize="lg" fontWeight="semibold" color="white" mb={4}>
        Revenue Trend
      </Text>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="formattedDate"
            stroke="#94a3b8"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
          />
          <YAxis
            stroke="#94a3b8"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            tickFormatter={(value) =>
              new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(value)
            }
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
            }}
            labelStyle={{ color: '#cbd5e1' }}
            formatter={(value: number) =>
              new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
              }).format(value)
            }
          />
          <Legend wrapperStyle={{ color: '#cbd5e1' }} />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: '#10b981', r: 4 }}
            activeDot={{ r: 6 }}
            name="Current Period"
          />
          {showComparison && (
            <Line
              type="monotone"
              dataKey="comparisonRevenue"
              stroke="#64748b"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Previous Period"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}
```

### Step 2.6: Create SalesAnalyticsSection Component

Create file: `/Users/shawngarland/cannabis-admin-dashboard/src/modules/analytics/components/sections/SalesAnalyticsSection.tsx`

```typescript
import { Box, Heading, SimpleGrid, VStack } from '@chakra-ui/react';
import { BanknotesIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import { useSalesAnalytics } from '../../../../hooks/useAnalytics';
import { MetricCard } from '../MetricCard';
import { RevenueLineChart } from '../charts/RevenueLineChart';
import { useAnalyticsComparison } from '../../../../stores/analyticsStore';

export function SalesAnalyticsSection() {
  const { data: salesData, isLoading } = useSalesAnalytics();
  const comparison = useAnalyticsComparison();

  return (
    <VStack spacing={6} align="stretch">
      <Heading size="md" color="white">
        Sales Analytics
      </Heading>

      {/* Key Metrics */}
      <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
        <MetricCard
          label="Total Revenue"
          value={salesData?.revenue.current || 0}
          format="currency"
          metric={salesData?.revenue}
          isLoading={isLoading}
          icon={<BanknotesIcon className="w-6 h-6" />}
        />

        <MetricCard
          label="Transactions"
          value={salesData?.transactions.current || 0}
          format="number"
          metric={salesData?.transactions}
          isLoading={isLoading}
          icon={<ShoppingCartIcon className="w-6 h-6" />}
        />

        <MetricCard
          label="Avg Transaction Value"
          value={salesData?.avgTransactionValue.current || 0}
          format="currency"
          metric={salesData?.avgTransactionValue}
          isLoading={isLoading}
        />
      </SimpleGrid>

      {/* Revenue Trend Chart */}
      <RevenueLineChart
        data={salesData?.revenueTrend || []}
        isLoading={isLoading}
        showComparison={comparison?.enabled || false}
      />
    </VStack>
  );
}
```

---

## Phase 3: Update Analytics Page (Day 6)

### Step 3.1: Update AnalyticsPage

Open `/Users/shawngarland/cannabis-admin-dashboard/src/pages/AnalyticsPage.tsx` and replace with:

```typescript
import { Box, Heading, Text, HStack, VStack } from '@chakra-ui/react';
import { DateRangePicker } from '../modules/analytics/components/DateRangePicker';
import { ComparisonToggle } from '../modules/analytics/components/ComparisonToggle';
import { SalesAnalyticsSection } from '../modules/analytics/components/sections/SalesAnalyticsSection';

/**
 * AnalyticsPage
 * Advanced analytics dashboard with sales insights, customer analytics, and business intelligence
 */
function AnalyticsPage() {
  return (
    <Box>
      {/* Page Header */}
      <Box mb={6}>
        <Heading size="lg" mb={2} color="white">
          Analytics
        </Heading>
        <Text color="slate.400">
          Advanced sales insights and business intelligence
        </Text>
      </Box>

      {/* Filters & Controls */}
      <HStack spacing={4} mb={8}>
        <DateRangePicker />
        <ComparisonToggle />
      </HStack>

      {/* Analytics Sections */}
      <VStack spacing={10} align="stretch">
        <SalesAnalyticsSection />
        {/* More sections will be added in future phases */}
      </VStack>
    </Box>
  );
}

export default AnalyticsPage;
```

---

## Phase 4: Test & Verify (Day 7)

### Step 4.1: Start Development Server

```bash
cd /Users/shawngarland/cannabis-admin-dashboard
npm run dev
```

### Step 4.2: Navigate to Analytics Page

Open browser to `http://localhost:5173/analytics`

### Step 4.3: Verify Functionality

Test the following:
1. Date range picker shows correct options
2. Selecting different date ranges updates the data
3. Comparison toggle works (shows comparison data)
4. Metric cards display with proper formatting
5. Revenue chart renders with data points
6. Loading skeletons appear during data fetch
7. Mobile responsive layout (resize browser)

### Step 4.4: Debug Common Issues

**Issue: "No dispensary ID found"**
- Solution: Ensure you're logged in and user has dispensary_id in the users table

**Issue: "Materialized view not found"**
- Solution: Create materialized views in Supabase (see Database Setup below)

**Issue: Charts not rendering**
- Solution: Check browser console for errors, ensure Recharts is installed

**Issue: Date range not updating**
- Solution: Check Zustand store is properly configured and imported

---

## Database Setup

### Create Materialized Views in Supabase

Go to Supabase Dashboard > SQL Editor and run:

```sql
-- Daily Sales Summary
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_daily_sales_summary AS
SELECT
  dispensary_id,
  DATE(transaction_date) AS sale_date,
  SUM(total) AS total_revenue,
  COUNT(*) AS total_transactions,
  COUNT(DISTINCT customer_hash) AS unique_customers,
  AVG(total) AS avg_transaction_value
FROM transactions
GROUP BY dispensary_id, DATE(transaction_date);

CREATE INDEX idx_mv_daily_sales_dispensary_date
ON mv_daily_sales_summary(dispensary_id, sale_date);

-- Product Performance
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_product_performance AS
SELECT
  p.dispensary_id,
  p.id AS product_id,
  p.name AS product_name,
  p.product_type,
  COALESCE(SUM((item->>'quantity')::int), 0) AS units_sold,
  COALESCE(SUM((item->>'quantity')::int * (item->>'price')::numeric), 0) AS total_revenue,
  COUNT(DISTINCT t.id) AS times_sold,
  MAX(t.transaction_date) AS last_sale_date
FROM products p
LEFT JOIN transactions t ON t.dispensary_id = p.dispensary_id
LEFT JOIN LATERAL jsonb_array_elements(t.products) AS item ON (item->>'product_id') = p.id
GROUP BY p.dispensary_id, p.id, p.name, p.product_type;

CREATE INDEX idx_mv_product_perf_dispensary
ON mv_product_performance(dispensary_id);

-- Refresh views (run this or set up a cron job)
REFRESH MATERIALIZED VIEW mv_daily_sales_summary;
REFRESH MATERIALIZED VIEW mv_product_performance;
```

### Set Up Hourly Refresh (Optional)

```sql
-- Install pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule hourly refresh
SELECT cron.schedule(
  'refresh-analytics-views',
  '0 * * * *',
  $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_sales_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_product_performance;
  $$
);
```

---

## Deployment Checklist

Before deploying to production:

- [ ] All TypeScript types are properly defined
- [ ] Analytics store is working correctly
- [ ] Service functions handle errors gracefully
- [ ] React Query hooks have proper caching configured
- [ ] Charts render on all screen sizes (mobile, tablet, desktop)
- [ ] Loading states are implemented
- [ ] Error states are handled
- [ ] Empty states are shown when no data exists
- [ ] Materialized views are created in production Supabase
- [ ] Edge Function `/calculate-analytics` is deployed (if used)
- [ ] Analytics page is added to navigation/routing
- [ ] Permissions check: Only authorized roles can access analytics
- [ ] Performance tested with large datasets

---

## Next Steps After Phase 1

Once Phase 1 is working, continue with:

**Phase 2: Sales Deep Dive**
- Add category breakdown chart (pie/donut)
- Add product ranking chart (horizontal bar)
- Add time-of-day heatmap
- Implement salesByDayOfWeek and salesByHour aggregations

**Phase 3: Customer Analytics**
- Implement customer growth trends
- Add customer cohort analysis
- Build CLV (Customer Lifetime Value) metrics
- Add retention rate calculations

**Phase 4: Product Analytics**
- Cannabinoid preference charts (THC vs CBD)
- Price elasticity analysis
- Inventory turnover metrics
- Product profitability dashboard

**Phase 5: Export & Polish**
- CSV export functionality
- PDF report generation
- PNG chart export
- Mobile optimization
- Accessibility improvements

---

## Troubleshooting

### Common Errors

**Error: "Cannot find module 'date-fns'"**
```bash
npm install date-fns
```

**Error: "Property 'analytics' does not exist on type 'QueryKeys'"**
- Make sure you updated queryClient.ts with analytics query keys

**Error: "Hook call outside of component"**
- Ensure you're using hooks inside React components, not in service files

**Error: "Cannot read property 'from' of undefined"**
- Check that analyticsStore is properly initialized with default date range

**Error: "Supabase RPC function not found"**
- Verify materialized views are created in your Supabase instance
- Check you're connected to the correct Supabase project

### Performance Issues

**Charts rendering slowly:**
- Limit data points (aggregate to daily/weekly for long ranges)
- Use useMemo for chart data transformations
- Implement pagination for long lists

**Page loading slowly:**
- Check React Query cache is working (should use cached data)
- Verify materialized views are refreshed
- Check network tab for slow API calls

---

## Support Resources

- **Chakra UI Docs:** https://chakra-ui.com/docs
- **Recharts Docs:** https://recharts.org/en-US/
- **TanStack Query Docs:** https://tanstack.com/query/latest
- **Zustand Docs:** https://docs.pmnd.rs/zustand/getting-started/introduction
- **Supabase Docs:** https://supabase.com/docs

---

## File Checklist

After Phase 1, you should have these files:

```
✓ /src/types/index.ts (updated with analytics types)
✓ /src/stores/analyticsStore.ts
✓ /src/services/api/analytics.service.ts
✓ /src/hooks/useAnalytics.ts
✓ /src/modules/analytics/components/DateRangePicker.tsx
✓ /src/modules/analytics/components/ComparisonToggle.tsx
✓ /src/modules/analytics/components/MetricCard.tsx
✓ /src/modules/analytics/components/charts/RevenueLineChart.tsx
✓ /src/modules/analytics/components/sections/SalesAnalyticsSection.tsx
✓ /src/pages/AnalyticsPage.tsx (updated)
✓ /src/config/queryClient.ts (updated with analytics query keys)
```

---

**Ready to start? Begin with Phase 1, Step 1.1!**
