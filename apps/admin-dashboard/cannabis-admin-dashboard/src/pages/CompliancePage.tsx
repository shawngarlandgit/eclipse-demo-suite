import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import { useMemo } from 'react';
import DateRangeSelector from '../modules/analytics/components/DateRangeSelector';
import InsightCard from '../modules/analytics/components/InsightCard';
import ComplianceSummaryMetrics from '../modules/compliance/components/ComplianceSummaryMetrics';
import ComplianceFlagsTable from '../modules/compliance/components/ComplianceFlagsTable';
import LicensesGrid from '../modules/compliance/components/LicensesGrid';
import ComplianceScoreCard from '../modules/compliance/components/ComplianceScoreCard';
import {
  useComplianceSummary,
  useComplianceFlags,
  useLicenses,
  useComplianceMetrics,
} from '../hooks/useCompliance';
import {
  generateComplianceSummaryInsights,
  generateFlagsInsights,
  generateLicenseInsights,
  generateComplianceTimeInsights,
} from '../modules/compliance/utils/insights';

function CompliancePage() {
  const { data: summary, isLoading: summaryLoading } = useComplianceSummary();
  const { data: allFlags, isLoading: flagsLoading } = useComplianceFlags();
  const { data: openFlags } = useComplianceFlags({ status: 'open' });
  const { data: licenses, isLoading: licensesLoading } = useLicenses();
  const { data: metrics, isLoading: metricsLoading } = useComplianceMetrics();

  // Generate insights
  const insights = useMemo(() => {
    const summaryInsights = summary ? generateComplianceSummaryInsights(summary) : [];
    const flagsInsights = allFlags && allFlags.length > 0 ? generateFlagsInsights(allFlags) : [];
    const licenseInsights = licenses && licenses.length > 0 ? generateLicenseInsights(licenses) : [];
    const timeInsights = generateComplianceTimeInsights();

    // Combine insights strategically
    const allInsights = [];

    // Add first summary or flag insight
    if (summaryInsights.length > 0) {
      allInsights.push(summaryInsights[0]);
    } else if (flagsInsights.length > 0) {
      allInsights.push(flagsInsights[0]);
    }

    // Add time insight in the middle
    if (timeInsights.length > 0) {
      allInsights.push(timeInsights[0]);
    }

    // Add license insights
    if (licenseInsights.length > 0) {
      allInsights.push(licenseInsights[0]);
    }

    // Add remaining insights
    const remaining = [
      ...summaryInsights.slice(1),
      ...flagsInsights.slice(summaryInsights.length > 0 ? 0 : 1),
      ...licenseInsights.slice(1),
      ...timeInsights.slice(1),
    ];
    allInsights.push(...remaining);

    return allInsights;
  }, [summary, allFlags, licenses]);

  return (
    <Box>
      <Heading size="lg" mb={2} color="white">
        Compliance & Audit
      </Heading>
      <Text color="slate.400" mb={4}>
        Compliance flags, audit logs, license tracking, and regulatory reporting
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

      {/* Compliance Score */}
      <Box mb={6}>
        <ComplianceScoreCard
          score={metrics?.compliance_score || 0}
          isLoading={metricsLoading}
          variant="horizontal"
        />
      </Box>

      {/* Summary Metrics */}
      {summary && (
        <ComplianceSummaryMetrics summary={summary} isLoading={summaryLoading} />
      )}

      {/* Licenses & Certifications */}
      <Box mb={6}>
        <Heading size="md" color="white" mb={4}>
          Licenses & Certifications
        </Heading>
        <LicensesGrid licenses={licenses || []} isLoading={licensesLoading} />
      </Box>

      {/* Compliance Flags */}
      <Box>
        <Heading size="md" color="white" mb={4}>
          Compliance Flags
        </Heading>

        <Tabs variant="soft-rounded" colorScheme="cannabis">
          <TabList mb={4}>
            <Tab _selected={{ bg: 'cannabis.600', color: 'white' }}>
              All Flags ({allFlags?.length || 0})
            </Tab>
            <Tab _selected={{ bg: 'red.600', color: 'white' }}>
              Open ({openFlags?.length || 0})
            </Tab>
            <Tab _selected={{ bg: 'yellow.600', color: 'white' }}>
              Critical ({summary?.critical_flags || 0})
            </Tab>
          </TabList>

          <TabPanels>
            <TabPanel p={0}>
              <ComplianceFlagsTable flags={allFlags || []} isLoading={flagsLoading} />
            </TabPanel>

            <TabPanel p={0}>
              <ComplianceFlagsTable flags={openFlags || []} isLoading={flagsLoading} />
            </TabPanel>

            <TabPanel p={0}>
              <ComplianceFlagsTable
                flags={allFlags?.filter(f => f.severity === 'critical') || []}
                isLoading={flagsLoading}
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Box>
  );
}

export default CompliancePage;
