import { lazy, Suspense } from 'react';
import type { JSX } from 'react';
import { Box, Flex, Spinner, Text, VStack, HStack, Select, Icon } from '@chakra-ui/react';
import { LayoutGrid } from 'lucide-react';
import { useSettingsStore, DASHBOARD_STYLES, type DashboardStyle } from '../stores/settingsStore';
import { useDashboardKPIs } from '../hooks/useDashboard';
import { useComplianceDashboardSummary } from '../modules/compliance-alerts/hooks/useComplianceAlerts';
import { useCurrentDispensary } from '../hooks/useAuth';
import ComplianceAlertBanner from '../modules/dashboard/components/ComplianceAlertBanner';
import type { Id } from '@convex/_generated/dataModel';

// Lazy load all dashboard options for code splitting
const DashboardOption1 = lazy(() => import('./DashboardOption1'));
const DashboardOption2 = lazy(() => import('./DashboardOption2'));
const DashboardOption4 = lazy(() => import('./DashboardOption4'));
const DashboardOption5 = lazy(() => import('./DashboardOption5'));
const DashboardSimple1 = lazy(() => import('./DashboardSimple1'));
const DashboardSimple2 = lazy(() => import('./DashboardSimple2'));
const DashboardSimple3 = lazy(() => import('./DashboardSimple3'));
const DashboardSimple4 = lazy(() => import('./DashboardSimple4'));

/**
 * Dashboard Loading Component
 */
function DashboardLoading() {
  return (
    <Flex h="60vh" align="center" justify="center">
      <VStack spacing={4}>
        <Spinner size="xl" color="emerald.400" thickness="4px" />
        <Text color="slate.400">Loading dashboard...</Text>
      </VStack>
    </Flex>
  );
}

/**
 * Map dashboard style to component
 */
const DASHBOARD_COMPONENTS: Record<DashboardStyle, React.LazyExoticComponent<() => JSX.Element>> = {
  'option-1': DashboardOption1,
  'option-2': DashboardOption2,
  'option-4': DashboardOption4,
  'option-5': DashboardOption5,
  'simple-1': DashboardSimple1,
  'simple-2': DashboardSimple2,
  'simple-3': DashboardSimple3,
  'simple-4': DashboardSimple4,
};

/**
 * Compact Dashboard Style Selector
 */
function DashboardStyleSelector() {
  const { dashboardStyle, setDashboardStyle } = useSettingsStore();

  const simpleStyles = DASHBOARD_STYLES.filter(s => s.category === 'simple');
  const detailedStyles = DASHBOARD_STYLES.filter(s => s.category === 'detailed');

  return (
    <HStack
      justify="flex-end"
      mb={4}
      px={2}
    >
      <HStack spacing={2}>
        <Icon as={LayoutGrid} color="slate.500" boxSize={4} />
        <Text color="slate.500" fontSize="sm" display={{ base: 'none', md: 'block' }}>
          Layout:
        </Text>
        <Select
          value={dashboardStyle}
          onChange={(e) => setDashboardStyle(e.target.value as DashboardStyle)}
          size="sm"
          bg="slate.800"
          borderColor="slate.700"
          color="white"
          _hover={{ borderColor: 'slate.600' }}
          w={{ base: '160px', md: '220px' }}
          fontSize="sm"
        >
          <optgroup label="Simple">
            {simpleStyles.map(style => (
              <option key={style.id} value={style.id}>
                {style.name}
              </option>
            ))}
          </optgroup>
          <optgroup label="Detailed">
            {detailedStyles.map(style => (
              <option key={style.id} value={style.id}>
                {style.name}
              </option>
            ))}
          </optgroup>
        </Select>
      </HStack>
    </HStack>
  );
}

/**
 * DashboardPage
 * Dynamic dashboard that renders the user's selected layout style.
 * Style preference is persisted in localStorage via settingsStore.
 */
function DashboardPage() {
  const dashboardStyle = useSettingsStore((state) => state.dashboardStyle);

  // Get dispensary and compliance data
  const dispensary = useCurrentDispensary();
  const dispensaryId = dispensary?._id as Id<"dispensaries"> | undefined;

  // Get traditional compliance flags from KPIs
  const { data: kpis, isLoading: kpisLoading } = useDashboardKPIs();

  // Get OCP compliance alert summary
  const ocpSummary = useComplianceDashboardSummary(dispensaryId);

  // Get the component for the selected style, fallback to Simple1
  const DashboardComponent = DASHBOARD_COMPONENTS[dashboardStyle] || DashboardSimple1;

  // Calculate compliance banner props
  const isComplianceLoading = kpisLoading || ocpSummary === undefined;
  const criticalFlagsCount = 0; // Traditional flags don't have severity - could enhance later
  const openFlagsCount = kpis?.compliance_flags ?? 0;

  return (
    <Box>
      {/* Compliance Alert Banner - Shows OCP advisories and compliance flags */}
      <Box px={{ base: 4, md: 8 }} pt={4}>
        <ComplianceAlertBanner
          criticalFlagsCount={criticalFlagsCount}
          openFlagsCount={openFlagsCount}
          ocpCriticalCount={ocpSummary?.criticalCount ?? 0}
          ocpHighCount={ocpSummary?.highCount ?? 0}
          ocpTotalActiveMatches={ocpSummary?.totalActiveMatches ?? 0}
          isLoading={isComplianceLoading}
        />
      </Box>

      <DashboardStyleSelector />
      <Suspense fallback={<DashboardLoading />}>
        <DashboardComponent />
      </Suspense>
    </Box>
  );
}

export default DashboardPage;
