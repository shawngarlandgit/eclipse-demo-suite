import { Box, Heading, Text, SimpleGrid, Grid } from '@chakra-ui/react';
import { useMemo } from 'react';
import {
  BanknotesIcon,
  ShoppingCartIcon,
  UsersIcon,
  CubeIcon,
} from '@heroicons/react/24/outline';
import { useDashboardKPIs, useSalesTrend, useTopProducts } from '../hooks/useDashboard';
import { useStaffPerformance } from '../hooks/useStaff';
import StatCard from '../modules/dashboard/components/StatCard';
import RevenueChart from '../modules/dashboard/components/RevenueChart';
import ComplianceAlertBanner from '../modules/dashboard/components/ComplianceAlertBanner';
import StaffLeaderboard from '../modules/dashboard/components/StaffLeaderboard';
import TopProductsCard from '../modules/dashboard/components/TopProductsCard';
import CriticalInventoryCard from '../modules/dashboard/components/CriticalInventoryCard';
import InsightCard from '../modules/analytics/components/InsightCard';
import DateRangeSelector from '../modules/analytics/components/DateRangeSelector';
import {
  generateDashboardInsights,
  generateTimeBasedBusinessInsights,
  generateOperationalInsights,
  generateDashboardCardInsights,
} from '../modules/dashboard/utils/insights';

/**
 * DashboardPage
 * Main landing page with real-time KPIs and overview
 */
function DashboardPage() {
  // Fetch dashboard data (useSalesTrend now uses date range from store)
  const { data: kpis, isLoading: kpisLoading } = useDashboardKPIs();
  const { data: salesTrend, isLoading: trendLoading } = useSalesTrend();
  const { data: topProducts, isLoading: productsLoading } = useTopProducts(5);
  const { data: staffPerformance, isLoading: staffLoading } = useStaffPerformance();

  // Generate insights
  const insights = useMemo(() => {
    if (!kpis) return [];

    const dashboardInsights = generateDashboardInsights(kpis);
    const timeInsights = generateTimeBasedBusinessInsights();
    const operationalInsights = generateOperationalInsights(kpis);

    // Combine and prioritize insights
    const allInsights = [];

    // Add critical insights first
    if (dashboardInsights.length > 0) {
      allInsights.push(dashboardInsights[0]);
    }

    // Add time-based insight
    if (timeInsights.length > 0) {
      allInsights.push(timeInsights[0]);
    }

    // Add remaining insights
    allInsights.push(
      ...dashboardInsights.slice(1),
      ...operationalInsights,
      ...timeInsights.slice(1)
    );

    return allInsights.slice(0, 6); // Show max 6 insights
  }, [kpis]);

  // Generate card-specific insights
  const cardInsights = useMemo(() => {
    if (!kpis) return {
      revenueToday: '',
      transactionsToday: '',
      avgTicket: '',
      inventoryHealth: '',
      revenueMTD: '',
      newCustomers: '',
      repeatRate: '',
      staffCount: '',
    };
    return generateDashboardCardInsights(kpis);
  }, [kpis]);

  return (
    <Box>
      <Heading size="lg" mb={2} color="white">
        Dashboard
      </Heading>
      <Text color="slate.400" mb={4}>
        Real-time business intelligence and KPIs
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

      {/* Compliance Alert Banner */}
      {kpis && kpis.compliance_flags_open > 0 && (
        <ComplianceAlertBanner
          criticalFlagsCount={kpis.compliance_flags_critical}
          openFlagsCount={kpis.compliance_flags_open}
          isLoading={kpisLoading}
        />
      )}

      {/* KPI Cards - Row 1 */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={6} mb={6}>
        <StatCard
          label="Revenue Today"
          value={kpis?.revenue_today || 0}
          format="currency"
          icon={<BanknotesIcon className="w-6 h-6" />}
          isLoading={kpisLoading}
          insight={cardInsights.revenueToday}
        />

        <StatCard
          label="Transactions Today"
          value={kpis?.transactions_today || 0}
          format="number"
          icon={<ShoppingCartIcon className="w-6 h-6" />}
          isLoading={kpisLoading}
          insight={cardInsights.transactionsToday}
        />

        <StatCard
          label="Average Ticket"
          value={kpis?.avg_transaction_value || 0}
          format="currency"
          icon={<BanknotesIcon className="w-6 h-6" />}
          isLoading={kpisLoading}
          insight={cardInsights.avgTicket}
        />

        <StatCard
          label="Inventory Health"
          value={kpis?.inventory_health_pct || 0}
          format="percentage"
          icon={<CubeIcon className="w-6 h-6" />}
          isLoading={kpisLoading}
          insight={cardInsights.inventoryHealth}
        />
      </SimpleGrid>

      {/* KPI Cards - Row 2 */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={6} mb={6}>
        <StatCard
          label="Revenue MTD"
          value={kpis?.revenue_mtd || 0}
          format="currency"
          isLoading={kpisLoading}
          insight={cardInsights.revenueMTD}
        />

        <StatCard
          label="New Customers"
          value={kpis?.customers_new_today || 0}
          format="number"
          icon={<UsersIcon className="w-6 h-6" />}
          isLoading={kpisLoading}
          insight={cardInsights.newCustomers}
        />

        <StatCard
          label="Repeat Customer Rate"
          value={kpis?.customers_repeat_pct || 0}
          format="percentage"
          icon={<UsersIcon className="w-6 h-6" />}
          isLoading={kpisLoading}
          insight={cardInsights.repeatRate}
        />

        <StatCard
          label="Staff Count"
          value={kpis?.staff_count || 0}
          format="number"
          icon={<UsersIcon className="w-6 h-6" />}
          isLoading={kpisLoading}
          insight={cardInsights.staffCount}
        />
      </SimpleGrid>

      {/* Revenue Chart + Critical Inventory */}
      <Grid
        templateColumns={{ base: '1fr', lg: '2fr 1fr' }}
        gap={6}
        mb={6}
      >
        <Box>
          <Box mb={4}>
            <DateRangeSelector />
          </Box>
          <RevenueChart
            data={salesTrend || []}
            isLoading={trendLoading}
          />
        </Box>

        <CriticalInventoryCard
          lowStockCount={kpis?.low_stock_count || 0}
          criticalStockCount={0}
          healthPercentage={kpis?.inventory_health_pct || 0}
          needsRetestCount={kpis?.items_needing_retest || 0}
          isLoading={kpisLoading}
        />
      </Grid>

      {/* Staff Leaderboard + Top Products */}
      <Grid
        templateColumns={{ base: '1fr', lg: '1fr 1fr' }}
        gap={6}
        mb={6}
      >
        <StaffLeaderboard
          data={staffPerformance || []}
          isLoading={staffLoading}
        />

        <TopProductsCard
          data={topProducts || []}
          isLoading={productsLoading}
        />
      </Grid>
    </Box>
  );
}

export default DashboardPage;
