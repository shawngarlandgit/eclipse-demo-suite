import { Grid, GridItem } from '@chakra-ui/react';
import { Users, DollarSign, Activity, Award } from 'lucide-react';
import MetricCard from '../../analytics/components/MetricCard';
import { formatCurrency, formatNumber } from '../../../utils/formatters';
import type { StaffSummary } from '../types';

interface StaffSummaryMetricsProps {
  summary: StaffSummary;
  isLoading?: boolean;
}

/**
 * StaffSummaryMetrics
 * Displays key staff performance summary metrics
 */
function StaffSummaryMetrics({ summary, isLoading = false }: StaffSummaryMetricsProps) {
  if (isLoading) {
    return (
      <Grid
        templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }}
        gap={4}
        mb={6}
      >
        {[1, 2, 3, 4].map((i) => (
          <GridItem key={i} className="skeleton" h="120px" />
        ))}
      </Grid>
    );
  }

  return (
    <Grid
      templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }}
      gap={4}
      mb={6}
    >
      <GridItem>
        <MetricCard
          title="Total Staff"
          value={summary.total_staff.toString()}
          subtitle={`${summary.active_today} active today`}
          icon={Users}
        />
      </GridItem>

      <GridItem>
        <MetricCard
          title="Team Sales"
          value={formatCurrency(summary.total_sales)}
          subtitle={`${formatCurrency(summary.total_sales / summary.total_transactions)} avg ticket`}
          icon={DollarSign}
        />
      </GridItem>

      <GridItem>
        <MetricCard
          title="Total Transactions"
          value={formatNumber(summary.total_transactions)}
          subtitle={`${(summary.total_transactions / summary.total_staff).toFixed(0)} per staff`}
          icon={Activity}
        />
      </GridItem>

      <GridItem>
        <MetricCard
          title="Avg Sales/Staff"
          value={formatCurrency(summary.avg_sales_per_staff)}
          subtitle={summary.top_performer ? `Top: ${summary.top_performer.full_name}` : undefined}
          icon={Award}
        />
      </GridItem>
    </Grid>
  );
}

export default StaffSummaryMetrics;
