import { Box, Heading, Text, Grid, GridItem, SimpleGrid } from '@chakra-ui/react';
import { DollarSign, ShoppingCart, Users, TrendingUp } from 'lucide-react';
import DateRangeSelector from '../modules/analytics/components/DateRangeSelector';
import MetricCard from '../modules/analytics/components/MetricCard';
import InsightCard from '../modules/analytics/components/InsightCard';
import RevenueTrendChart from '../modules/analytics/components/charts/RevenueTrendChart';
import CategoryBreakdownChart from '../modules/analytics/components/charts/CategoryBreakdownChart';
import TopProductsChart from '../modules/analytics/components/charts/TopProductsChart';
import TopStrainsChart from '../modules/analytics/components/charts/TopStrainsChart';
import { useAnalyticsSummary, useCategoryBreakdown } from '../hooks/useAnalytics';
import { formatCurrency } from '../utils/formatters';
import { generateSummaryInsights, generateCategoryInsights, generateTimeInsights } from '../modules/analytics/utils/insights';
import { useMemo } from 'react';

function AnalyticsPage() {
  const { data: summary, isLoading } = useAnalyticsSummary();
  const { data: categories } = useCategoryBreakdown();

  // Generate insights
  const insights = useMemo(() => {
    const summaryInsights = summary ? generateSummaryInsights(summary) : [];
    const categoryInsights = categories && categories.length > 0 ? generateCategoryInsights(categories) : [];
    const timeInsights = generateTimeInsights();

    // Always keep time-based insights in the middle
    const allInsights = [];

    // Add first summary or category insight
    if (summaryInsights.length > 0) {
      allInsights.push(summaryInsights[0]);
    } else if (categoryInsights.length > 0) {
      allInsights.push(categoryInsights[0]);
    }

    // Add time insight in the middle (position 1)
    if (timeInsights.length > 0) {
      allInsights.push(timeInsights[0]);
    }

    // Add remaining insights
    if (summaryInsights.length > 1) {
      allInsights.push(summaryInsights[1]);
    } else if (categoryInsights.length > 0) {
      const startIdx = summaryInsights.length > 0 ? 0 : 1;
      if (categoryInsights[startIdx]) {
        allInsights.push(categoryInsights[startIdx]);
      }
    }

    // Add any additional insights to fill the grid
    const remaining = [
      ...summaryInsights.slice(2),
      ...categoryInsights.slice(summaryInsights.length > 0 ? 0 : 1),
      ...timeInsights.slice(1),
    ];
    allInsights.push(...remaining);

    return allInsights;
  }, [summary, categories]);

  return (
    <Box>
      <Heading size="lg" mb={2} color="white">
        Analytics & Insights
      </Heading>
      <Text color="slate.400" mb={4}>
        Sales analytics, customer insights, and trend analysis
      </Text>

      {/* AI Insights */}
      {insights.length > 0 && (
        <Box mb={6}>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
            {insights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </SimpleGrid>
        </Box>
      )}

      {/* Date Range Selector */}
      <Box mb={6}>
        <DateRangeSelector />
      </Box>

      {/* Key Metrics */}
      {!isLoading && summary && (
        <Grid
          templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }}
          gap={4}
          mb={6}
        >
          <GridItem>
            <MetricCard
              title="Total Revenue"
              value={formatCurrency(summary.revenue.total)}
              change={summary.revenue.change_pct}
              icon={DollarSign}
            />
          </GridItem>

          <GridItem>
            <MetricCard
              title="Transactions"
              value={summary.transactions.total.toString()}
              change={summary.transactions.change_pct}
              icon={ShoppingCart}
            />
          </GridItem>

          <GridItem>
            <MetricCard
              title="Avg Transaction"
              value={formatCurrency(summary.transactions.avg_value)}
              change={summary.transactions.avg_value_change_pct}
              icon={TrendingUp}
            />
          </GridItem>

          <GridItem>
            <MetricCard
              title="Total Customers"
              value={summary.customers.total.toString()}
              subtitle={`${summary.customers.new} new, ${summary.customers.returning} returning`}
              icon={Users}
            />
          </GridItem>
        </Grid>
      )}

      {/* Charts */}
      <Grid
        templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }}
        gap={6}
        mb={6}
      >
        {/* Revenue Trend - Full Width */}
        <GridItem colSpan={{ base: 1, lg: 2 }}>
          <RevenueTrendChart />
        </GridItem>

        {/* Sales by Category - Full Width */}
        <GridItem colSpan={{ base: 1, lg: 2 }}>
          <CategoryBreakdownChart />
        </GridItem>

        {/* Top Products - Left Column */}
        <GridItem display="flex">
          <TopProductsChart />
        </GridItem>

        {/* Top Strains - Right Column */}
        <GridItem display="flex">
          <TopStrainsChart />
        </GridItem>
      </Grid>
    </Box>
  );
}

export default AnalyticsPage;
