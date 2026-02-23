import { useState, useMemo } from 'react';
import { Box, Heading, Text, Flex, HStack, Divider, Badge, Button, Collapse, SimpleGrid, IconButton } from '@chakra-ui/react';
import { ArrowUpIcon, ArrowDownIcon, CloseIcon } from '@chakra-ui/icons';
import { Sparkles } from 'lucide-react';
import { useDashboardKPIs, useSalesTrend } from '../hooks/useDashboard';
import { useStaffPerformance } from '../hooks/useStaff';
import RevenueChart from '../modules/dashboard/components/RevenueChart';
import DateRangeSelector from '../modules/analytics/components/DateRangeSelector';
import InsightCard from '../modules/analytics/components/InsightCard';
import { formatCurrency } from '../utils/formatters';
import { generateDashboardInsights, generateTimeBasedBusinessInsights, generateOperationalInsights } from '../modules/dashboard/utils/insights';
import { DraggableGrid, DraggableWidget, EditModeToolbar } from '../components/grid';

/**
 * Dashboard Option 1: Compact Metric Strips
 * Horizontal rows with inline stats instead of cards
 * Now with drag-and-drop customization!
 */
function DashboardOption1() {
  const [showInsights, setShowInsights] = useState(false);
  const { data: kpis } = useDashboardKPIs();
  const { data: salesTrend, isLoading: trendLoading } = useSalesTrend();
  const { data: staffPerformance } = useStaffPerformance();

  // Generate AI insights from KPIs
  const insights = useMemo(() => {
    if (!kpis) return [];
    const dashboardInsights = generateDashboardInsights(kpis);
    const timeInsights = generateTimeBasedBusinessInsights();
    const operationalInsights = generateOperationalInsights(kpis);
    return [...dashboardInsights, ...operationalInsights, ...timeInsights].slice(0, 6);
  }, [kpis]);

  // Compact metric for inline display
  const MetricItem = ({ label, value, change, labelColor = 'slate.400' }: {
    label: string;
    value: string | number;
    change?: number;
    labelColor?: string;
  }) => (
    <HStack spacing={2}>
      <Text fontSize="xs" color={labelColor} textTransform="uppercase" fontWeight="medium">
        {label}
      </Text>
      <Text fontSize="md" fontWeight="bold" color="white">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </Text>
      {change !== undefined && (
        <HStack spacing={0.5}>
          {change >= 0 ? <ArrowUpIcon boxSize={3} color="green.400" /> : <ArrowDownIcon boxSize={3} color="red.400" />}
          <Text fontSize="xs" color={change >= 0 ? 'green.400' : 'red.400'}>{Math.abs(change).toFixed(1)}%</Text>
        </HStack>
      )}
    </HStack>
  );

  return (
    <Box>
      <HStack justify="space-between" mb={4}>
        <Box>
          <Heading size="lg" color="white">Dashboard</Heading>
          <Text fontSize="sm" color="slate.400">Option 1: Compact Metric Strips</Text>
        </Box>
        <HStack spacing={3}>
          <DateRangeSelector />
          <Button
            leftIcon={<Sparkles size={16} />}
            size="sm"
            colorScheme={showInsights ? 'purple' : 'gray'}
            variant={showInsights ? 'solid' : 'outline'}
            onClick={() => setShowInsights(!showInsights)}
          >
            AI Insights {insights.length > 0 && `(${insights.length})`}
          </Button>
          <EditModeToolbar dashboardStyle="option-1" />
        </HStack>
      </HStack>

      {/* Collapsible AI Insights Section */}
      <Collapse in={showInsights} animateOpacity>
        <Box bg="slate.800" borderRadius="md" mb={4} border="1px solid" borderColor="purple.600" position="relative">
          <Flex bg="slate.750" px={4} py={3} borderTopRadius="md" borderBottom="1px" borderColor="slate.700" justify="space-between" align="center">
            <HStack spacing={2}>
              <Sparkles size={18} color="#A855F7" />
              <Text fontSize="lg" fontWeight="bold" color="white">AI Insights</Text>
              <Badge colorScheme="purple" fontSize="xs">Powered by AI</Badge>
            </HStack>
            <IconButton aria-label="Close insights" icon={<CloseIcon />} size="sm" variant="ghost" color="slate.400" _hover={{ color: 'white', bg: 'slate.700' }} onClick={() => setShowInsights(false)} />
          </Flex>
          <Box p={4}>
            {insights.length > 0 ? (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                {insights.map((insight) => <InsightCard key={insight.id} insight={insight} />)}
              </SimpleGrid>
            ) : (
              <Text color="slate.400" textAlign="center" py={4}>No insights available. Data is still loading...</Text>
            )}
          </Box>
        </Box>
      </Collapse>

      {/* Draggable Grid Layout */}
      <DraggableGrid dashboardStyle="option-1">
        {/* Revenue Metrics Strip */}
        <DraggableWidget key="revenue-strip" id="revenue-strip" noPadding>
          <HStack
            bg="slate.800"
            borderRadius="md"
            h="100%"
            px={4}
            spacing={6}
            divider={<Divider orientation="vertical" h="50%" borderColor="slate.600" />}
          >
            <Text fontSize="sm" fontWeight="bold" color="green.400" minW="120px">
              Revenue & Sales
            </Text>
            <MetricItem label="Today" value={formatCurrency(kpis?.revenue_today || 0)} change={12.5} />
            <MetricItem label="MTD" value={formatCurrency(kpis?.revenue_mtd || 0)} change={8.2} />
            <MetricItem label="Trans" value={kpis?.transactions_today || 0} change={5.1} />
            <MetricItem label="Avg Ticket" value={formatCurrency(kpis?.avg_transaction_value || 0)} change={-2.3} />
          </HStack>
        </DraggableWidget>

        {/* Staff Performance */}
        <DraggableWidget key="staff-compact" id="staff-compact" noPadding>
          <Box bg="slate.800" borderRadius="md" h="100%" overflow="hidden" display="flex" flexDir="column">
            <Flex px={4} py={2} borderBottom="1px" borderColor="slate.700" flexShrink={0}>
              <Text fontSize="sm" fontWeight="bold" color="orange.400">Staff Performance</Text>
            </Flex>
            <Box flex="1" overflow="auto" px={3} py={2}>
              <Flex justify="space-between" py={1} mb={1} borderBottom="1px" borderColor="slate.600">
                <Text fontSize="xs" color="slate.500" fontWeight="semibold">Name</Text>
                <HStack spacing={4}>
                  <Text fontSize="xs" color="slate.500" fontWeight="semibold" w="30px" textAlign="right">#</Text>
                  <Text fontSize="xs" color="slate.500" fontWeight="semibold" w="65px" textAlign="right">Sales</Text>
                </HStack>
              </Flex>
              {staffPerformance?.slice(0, 8).map((staff, idx) => (
                <Flex key={staff.user_id} justify="space-between" py={1.5} borderBottom={idx < 7 ? '1px' : 'none'} borderColor="slate.700">
                  <HStack spacing={1}>
                    <Text fontSize="xs" color="slate.500" w="14px">{idx + 1}.</Text>
                    <Text fontSize="xs" color="white" noOfLines={1}>{staff.full_name}</Text>
                  </HStack>
                  <HStack spacing={4}>
                    <Text fontSize="xs" color="slate.400" w="30px" textAlign="right">{staff.transaction_count}</Text>
                    <Text fontSize="xs" fontWeight="medium" color="green.400" w="65px" textAlign="right">{formatCurrency(staff.sales)}</Text>
                  </HStack>
                </Flex>
              ))}
            </Box>
          </Box>
        </DraggableWidget>

        {/* Customer Metrics Strip */}
        <DraggableWidget key="customer-strip" id="customer-strip" noPadding>
          <HStack
            bg="slate.800"
            borderRadius="md"
            h="100%"
            px={4}
            spacing={6}
            divider={<Divider orientation="vertical" h="50%" borderColor="slate.600" />}
          >
            <Text fontSize="sm" fontWeight="bold" color="blue.400" minW="100px">
              Customers
            </Text>
            <MetricItem label="New Today" value={kpis?.customers_new_today || 0} />
            <MetricItem label="Repeat Rate" value={`${(kpis?.customers_repeat_pct || 0).toFixed(1)}%`} change={3.2} />
            <MetricItem label="Staff On Duty" value={kpis?.staff_count || 0} />
            <MetricItem label="Trans MTD" value={(kpis?.transactions_mtd || 0).toLocaleString()} change={6.8} />
          </HStack>
        </DraggableWidget>

        {/* Inventory Metrics Strip */}
        <DraggableWidget key="inventory-strip" id="inventory-strip" noPadding>
          <HStack
            bg="slate.800"
            borderRadius="md"
            h="100%"
            px={4}
            spacing={6}
            divider={<Divider orientation="vertical" h="50%" borderColor="slate.600" />}
          >
            <Text fontSize="sm" fontWeight="bold" color="purple.400" minW="140px">
              Inventory & Compliance
            </Text>
            <MetricItem label="Health" value={`${(kpis?.inventory_health_pct || 0).toFixed(0)}%`} labelColor="green.400" />
            <MetricItem label="Low Stock" value={kpis?.low_stock_count || 0} labelColor="yellow.400" />
            <MetricItem label="Need Retest" value={kpis?.items_needing_retest || 0} labelColor="orange.400" />
            <MetricItem label="Open Flags" value={kpis?.compliance_flags_open || 0} labelColor="red.400" />
            <MetricItem label="Critical" value={kpis?.compliance_flags_critical || 0} labelColor="red.500" />
          </HStack>
        </DraggableWidget>

        {/* Charts Section */}
        <DraggableWidget key="charts-section" id="charts-section" noPadding>
          <Box h="100%">
            <RevenueChart data={salesTrend || []} isLoading={trendLoading} />
          </Box>
        </DraggableWidget>
      </DraggableGrid>
    </Box>
  );
}

export default DashboardOption1;
