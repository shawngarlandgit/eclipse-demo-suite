import { Grid, GridItem } from '@chakra-ui/react';
import { AlertTriangle, CheckCircle, Clock, ShieldAlert } from 'lucide-react';
import MetricCard from '../../analytics/components/MetricCard';
import type { ComplianceSummary } from '../types';
import { formatNumber } from '../../../utils/formatters';

interface ComplianceSummaryMetricsProps {
  summary: ComplianceSummary;
  isLoading?: boolean;
}

/**
 * ComplianceSummaryMetrics
 * Displays key compliance metrics at the top of the page
 */
function ComplianceSummaryMetrics({ summary, isLoading = false }: ComplianceSummaryMetricsProps) {
  if (isLoading) {
    return (
      <Grid
        templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }}
        gap={4}
        mb={6}
      >
        {[1, 2, 3, 4].map((i) => (
          <GridItem key={i}>
            <div className="skeleton" style={{ height: '120px' }} />
          </GridItem>
        ))}
      </Grid>
    );
  }

  const resolvedRate = summary.total_flags > 0
    ? ((summary.total_flags - summary.open_flags) / summary.total_flags) * 100
    : 100;

  return (
    <Grid
      templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }}
      gap={4}
      mb={6}
    >
      <GridItem>
        <MetricCard
          title="Open Flags"
          value={formatNumber(summary.open_flags)}
          subtitle={`${summary.critical_flags} critical, ${summary.high_priority_flags} high priority`}
          icon={ShieldAlert}
          valueColor={summary.critical_flags > 0 ? 'red.400' : summary.open_flags > 0 ? 'yellow.400' : 'green.400'}
        />
      </GridItem>

      <GridItem>
        <MetricCard
          title="Resolved (30d)"
          value={formatNumber(summary.resolved_last_30_days)}
          subtitle={`${resolvedRate.toFixed(0)}% resolution rate`}
          icon={CheckCircle}
          valueColor="green.400"
        />
      </GridItem>

      <GridItem>
        <MetricCard
          title="Avg Resolution Time"
          value={`${summary.avg_resolution_time_hours.toFixed(1)}h`}
          subtitle="Time to resolve flags"
          icon={Clock}
        />
      </GridItem>

      <GridItem>
        <MetricCard
          title="Total Flags"
          value={formatNumber(summary.total_flags)}
          subtitle="All time tracked"
          icon={AlertTriangle}
        />
      </GridItem>
    </Grid>
  );
}

export default ComplianceSummaryMetrics;
