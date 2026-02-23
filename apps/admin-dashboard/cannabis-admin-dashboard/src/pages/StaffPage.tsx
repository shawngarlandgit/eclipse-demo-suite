import { Box, Heading, Text, Grid, GridItem, SimpleGrid } from '@chakra-ui/react';
import { useMemo } from 'react';
import DateRangeSelector from '../modules/analytics/components/DateRangeSelector';
import InsightCard from '../modules/analytics/components/InsightCard';
import StaffSummaryMetrics from '../modules/staff/components/StaffSummaryMetrics';
import StaffPerformanceGrid from '../modules/staff/components/StaffPerformanceGrid';
import StaffSalesChart from '../modules/staff/components/charts/StaffSalesChart';
import RecommendationChart from '../modules/staff/components/charts/RecommendationChart';
import { useStaffPerformance, useStaffSummary } from '../hooks/useStaff';
import {
  generateStaffSummaryInsights,
  generateStaffPerformanceInsights,
  generateStaffTimeInsights,
} from '../modules/staff/utils/insights';

function StaffPage() {
  const { data: staffPerformance, isLoading: performanceLoading } = useStaffPerformance();
  const { data: summary, isLoading: summaryLoading } = useStaffSummary();

  // Generate insights
  const insights = useMemo(() => {
    const summaryInsights = summary ? generateStaffSummaryInsights(summary) : [];
    const performanceInsights = staffPerformance && staffPerformance.length > 0
      ? generateStaffPerformanceInsights(staffPerformance)
      : [];
    const timeInsights = generateStaffTimeInsights();

    // Combine insights strategically
    const allInsights = [];

    // Add first summary or performance insight
    if (summaryInsights.length > 0) {
      allInsights.push(summaryInsights[0]);
    } else if (performanceInsights.length > 0) {
      allInsights.push(performanceInsights[0]);
    }

    // Add time insight in the middle (position 1)
    if (timeInsights.length > 0) {
      allInsights.push(timeInsights[0]);
    }

    // Add remaining insights
    if (summaryInsights.length > 1) {
      allInsights.push(summaryInsights[1]);
    } else if (performanceInsights.length > 0) {
      const startIdx = summaryInsights.length > 0 ? 0 : 1;
      if (performanceInsights[startIdx]) {
        allInsights.push(performanceInsights[startIdx]);
      }
    }

    // Add any additional insights to fill the grid
    const remaining = [
      ...summaryInsights.slice(2),
      ...performanceInsights.slice(summaryInsights.length > 0 ? 0 : 1),
      ...timeInsights.slice(1),
    ];
    allInsights.push(...remaining);

    return allInsights;
  }, [summary, staffPerformance]);

  return (
    <Box>
      <Heading size="lg" mb={2} color="white">
        Staff Performance
      </Heading>
      <Text color="slate.400" mb={4}>
        Staff metrics, leaderboards, and recommendation tracking
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

      {/* Summary Metrics */}
      {summary && (
        <StaffSummaryMetrics summary={summary} isLoading={summaryLoading} />
      )}

      {/* Charts */}
      <Grid
        templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }}
        gap={6}
        mb={6}
      >
        <GridItem display="flex">
          <StaffSalesChart data={staffPerformance || []} isLoading={performanceLoading} />
        </GridItem>

        <GridItem display="flex">
          <RecommendationChart data={staffPerformance || []} isLoading={performanceLoading} />
        </GridItem>
      </Grid>

      {/* Staff Performance Grid */}
      <Box>
        <Heading size="md" color="white" mb={4}>
          Individual Performance
        </Heading>
        <StaffPerformanceGrid data={staffPerformance || []} isLoading={performanceLoading} />
      </Box>
    </Box>
  );
}

export default StaffPage;
