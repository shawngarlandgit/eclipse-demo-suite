import { useState, useMemo } from 'react';
import { Box, Heading, Text, Flex, HStack, Divider, Grid, Badge, Tooltip, Button, Collapse, SimpleGrid, IconButton } from '@chakra-ui/react';
import { ArrowUpIcon, ArrowDownIcon, CloseIcon } from '@chakra-ui/icons';
import { Sparkles } from 'lucide-react';
import { useDashboardKPIs, useSalesTrend, useTopProducts } from '../hooks/useDashboard';
import { useStaffPerformance } from '../hooks/useStaff';
import RevenueChart from '../modules/dashboard/components/RevenueChart';
import DateRangeSelector from '../modules/analytics/components/DateRangeSelector';
import InsightCard from '../modules/analytics/components/InsightCard';
import { formatCurrency } from '../utils/formatters';
import { generateDashboardInsights, generateTimeBasedBusinessInsights, generateOperationalInsights } from '../modules/dashboard/utils/insights';

/**
 * Dashboard Option 1: Compact Metric Strips
 * Horizontal rows with inline stats instead of cards
 */
function DashboardOption1() {
  const [showInsights, setShowInsights] = useState(false);
  const { data: kpis, isLoading } = useDashboardKPIs();
  const { data: salesTrend, isLoading: trendLoading } = useSalesTrend();
  const { data: topProducts } = useTopProducts(5);
  const { data: staffPerformance } = useStaffPerformance();

  // Generate AI insights from KPIs
  const insights = useMemo(() => {
    if (!kpis) return [];
    const dashboardInsights = generateDashboardInsights(kpis);
    const timeInsights = generateTimeBasedBusinessInsights();
    const operationalInsights = generateOperationalInsights(kpis);
    // Combine and limit to top 6 insights
    return [...dashboardInsights, ...operationalInsights, ...timeInsights].slice(0, 6);
  }, [kpis]);

  const MetricItem = ({ label, value, change, prefix = '', labelColor = 'slate.400', tooltip }: { label: string; value: string | number; change?: number; prefix?: string; labelColor?: string; tooltip?: string }) => (
    <HStack spacing={2} px={4} py={2}>
      {tooltip ? (
        <Tooltip
          label={tooltip}
          placement="bottom"
          hasArrow
          bg="slate.700"
          color="white"
          px={3}
          py={2}
          borderRadius="md"
          fontSize="xs"
        >
          <Text
            fontSize="xs"
            color={labelColor}
            textTransform="uppercase"
            fontWeight="medium"
            minW="100px"
            cursor="help"
            borderBottom="1px dashed"
            borderColor={labelColor}
            _hover={{ opacity: 0.8 }}
          >
            {label}
          </Text>
        </Tooltip>
      ) : (
        <Text fontSize="xs" color={labelColor} textTransform="uppercase" fontWeight="medium" minW="100px">
          {label}
        </Text>
      )}
      <Text fontSize="md" fontWeight="bold" color="white">
        {prefix}{typeof value === 'number' ? value.toLocaleString() : value}
      </Text>
      {change !== undefined && (
        <HStack spacing={1}>
          {change >= 0 ? (
            <ArrowUpIcon boxSize={3} color="green.400" />
          ) : (
            <ArrowDownIcon boxSize={3} color="red.400" />
          )}
          <Text fontSize="xs" color={change >= 0 ? 'green.400' : 'red.400'}>
            {Math.abs(change).toFixed(1)}%
          </Text>
        </HStack>
      )}
    </HStack>
  );

  const MetricStrip = ({ children, title }: { children: React.ReactNode; title: string }) => (
    <Box bg="slate.800" borderRadius="md" mb={3}>
      <Flex
        bg="slate.750"
        px={4}
        py={3}
        borderTopRadius="md"
        borderBottom="1px"
        borderColor="slate.700"
      >
        <Text fontSize="lg" fontWeight="bold" color="white">{title}</Text>
      </Flex>
      <Flex flexWrap="wrap" divider={<Divider orientation="vertical" h="40px" borderColor="slate.700" />}>
        {children}
      </Flex>
    </Box>
  );

  return (
    <Box>
      <HStack justify="space-between" mb={4}>
        <Box>
          <Heading size="lg" color="white">Dashboard</Heading>
          <Text fontSize="sm" color="slate.400">Option 1: Compact Metric Strips</Text>
        </Box>
        <HStack spacing={3}>
          <Button
            leftIcon={<Sparkles size={16} />}
            size="sm"
            colorScheme={showInsights ? 'purple' : 'gray'}
            variant={showInsights ? 'solid' : 'outline'}
            onClick={() => setShowInsights(!showInsights)}
          >
            AI Insights {insights.length > 0 && `(${insights.length})`}
          </Button>
          <Badge colorScheme="purple" fontSize="sm" px={3} py={1}>Layout Option 1</Badge>
        </HStack>
      </HStack>

      {/* Collapsible AI Insights Section */}
      <Collapse in={showInsights} animateOpacity>
        <Box
          bg="slate.800"
          borderRadius="md"
          mb={4}
          border="1px solid"
          borderColor="purple.600"
          position="relative"
        >
          <Flex
            bg="slate.750"
            px={4}
            py={3}
            borderTopRadius="md"
            borderBottom="1px"
            borderColor="slate.700"
            justify="space-between"
            align="center"
          >
            <HStack spacing={2}>
              <Sparkles size={18} color="#A855F7" />
              <Text fontSize="lg" fontWeight="bold" color="white">AI Insights</Text>
              <Badge colorScheme="purple" fontSize="xs">Powered by AI</Badge>
            </HStack>
            <IconButton
              aria-label="Close insights"
              icon={<CloseIcon />}
              size="sm"
              variant="ghost"
              color="slate.400"
              _hover={{ color: 'white', bg: 'slate.700' }}
              onClick={() => setShowInsights(false)}
            />
          </Flex>
          <Box p={4}>
            {insights.length > 0 ? (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                {insights.map((insight) => (
                  <InsightCard key={insight.id} insight={insight} />
                ))}
              </SimpleGrid>
            ) : (
              <Text color="slate.400" textAlign="center" py={4}>
                No insights available. Data is still loading...
              </Text>
            )}
          </Box>
        </Box>
      </Collapse>

      {/* Top Section: Metrics on left, Staff Performance on right */}
      <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={4} mb={4}>
        {/* Left Column - Metric Strips */}
        <Box>
          {/* Revenue Metrics Strip */}
          <MetricStrip title="Revenue & Sales">
            <MetricItem
              label="Today"
              value={formatCurrency(kpis?.revenue_today || 0)}
              change={12.5}
              tooltip="Total revenue generated today from all completed transactions."
            />
            <MetricItem
              label="MTD"
              value={formatCurrency(kpis?.revenue_mtd || 0)}
              change={8.2}
              tooltip="Month-to-date revenue. Total sales from the 1st of the month through today."
            />
            <MetricItem
              label="Transactions"
              value={kpis?.transactions_today || 0}
              change={5.1}
              tooltip="Total number of completed sales transactions today."
            />
            <MetricItem
              label="Avg Ticket"
              value={formatCurrency(kpis?.avg_transaction_value || 0)}
              change={-2.3}
              tooltip="Average transaction value. Total revenue divided by number of transactions."
            />
          </MetricStrip>

          {/* Customer Metrics Strip */}
          <MetricStrip title="Customers">
            <MetricItem
              label="New Today"
              value={kpis?.customers_new_today || 0}
              tooltip="First-time customers who made their initial purchase today."
            />
            <MetricItem
              label="Repeat Rate"
              value={`${(kpis?.customers_repeat_pct || 0).toFixed(1)}%`}
              change={3.2}
              tooltip="Percentage of today's customers who have purchased before. Higher is better for customer loyalty."
            />
            <MetricItem
              label="Staff Count"
              value={kpis?.staff_count || 0}
              tooltip="Number of staff members currently active and on shift."
            />
          </MetricStrip>

          {/* Inventory Metrics Strip */}
          <MetricStrip title="Inventory & Compliance">
            <MetricItem
              label="Health"
              value={`${(kpis?.inventory_health_pct || 0).toFixed(0)}%`}
              labelColor="green.400"
              tooltip="Overall inventory health score based on stock levels, expiration dates, and product availability. Above 80% is considered healthy."
            />
            <MetricItem
              label="Low Stock"
              value={kpis?.low_stock_count || 0}
              labelColor="yellow.400"
              tooltip="Products below minimum stock threshold that need to be reordered soon to avoid stockouts."
            />
            <MetricItem
              label="Need Retest"
              value={kpis?.items_needing_retest || 0}
              labelColor="orange.400"
              tooltip="Batches approaching or past their testing expiration date that require lab retesting for compliance."
            />
            <MetricItem
              label="Open Flags"
              value={kpis?.compliance_flags_open || 0}
              labelColor="red.400"
              tooltip="Active compliance issues requiring attention, including labeling, packaging, or documentation discrepancies."
            />
            <MetricItem
              label="Critical"
              value={kpis?.compliance_flags_critical || 0}
              labelColor="red.500"
              tooltip="Urgent compliance violations that must be resolved immediately to avoid penalties or license issues."
            />
          </MetricStrip>
        </Box>

        {/* Right Column - Staff Performance */}
        <Box bg="slate.800" borderRadius="md" h="fit-content">
          <Flex
            bg="slate.750"
            px={4}
            py={3}
            borderTopRadius="md"
            borderBottom="1px"
            borderColor="slate.700"
          >
            <Text fontSize="lg" fontWeight="bold" color="white">Staff Performance</Text>
          </Flex>
          <Box p={4}>
            {/* Header Row */}
            <Flex justify="space-between" py={2} mb={1} borderBottom="1px" borderColor="slate.600">
              <Text fontSize="xs" color="slate.500" textTransform="uppercase" fontWeight="semibold">Name</Text>
              <HStack spacing={3}>
                <Text fontSize="xs" color="slate.500" textTransform="uppercase" fontWeight="semibold" w="60px" textAlign="center">Category</Text>
                <Text fontSize="xs" color="slate.500" textTransform="uppercase" fontWeight="semibold" w="50px" textAlign="right">Trans</Text>
                <Text fontSize="xs" color="slate.500" textTransform="uppercase" fontWeight="semibold" w="50px" textAlign="right">Conv</Text>
                <Text fontSize="xs" color="slate.500" textTransform="uppercase" fontWeight="semibold" w="65px" textAlign="right">Avg</Text>
                <Text fontSize="xs" color="slate.500" textTransform="uppercase" fontWeight="semibold" w="80px" textAlign="right">Sales</Text>
              </HStack>
            </Flex>
            {staffPerformance?.slice(0, 8).map((staff, idx) => (
              <Flex key={staff.user_id} justify="space-between" py={2} borderBottom={idx < 7 ? '1px' : 'none'} borderColor="slate.700">
                <HStack>
                  <Text fontSize="xs" color="slate.500" w="20px">{idx + 1}.</Text>
                  <Text fontSize="sm" color="white">{staff.full_name}</Text>
                </HStack>
                <HStack spacing={3}>
                  <Badge
                    colorScheme={
                      { flower: 'green', vape: 'blue', edible: 'purple', 'pre-roll': 'orange' }[staff.top_product_category] || 'gray'
                    }
                    fontSize="2xs"
                    w="60px"
                    textAlign="center"
                    textTransform="capitalize"
                  >
                    {staff.top_product_category}
                  </Badge>
                  <Text fontSize="xs" color="slate.400" w="50px" textAlign="right">{staff.transaction_count}</Text>
                  <Text fontSize="xs" color={staff.recommendation_conversion_rate > 0.5 ? 'green.400' : 'slate.400'} w="50px" textAlign="right">{((staff.recommendation_conversion_rate || 0) * 100).toFixed(0)}%</Text>
                  <Text fontSize="xs" color="slate.400" w="65px" textAlign="right">{formatCurrency(staff.avg_transaction_value)}</Text>
                  <Text fontSize="sm" fontWeight="medium" color="green.400" w="80px" textAlign="right">{formatCurrency(staff.sales)}</Text>
                </HStack>
              </Flex>
            ))}
          </Box>
        </Box>
      </Grid>

      {/* Charts in compact grid */}
      <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={4}>
        <RevenueChart data={salesTrend || []} isLoading={trendLoading} headerRight={<DateRangeSelector />} />

        {/* Compact Top Products */}
        <Box bg="slate.800" borderRadius="md" p={4}>
          <Text fontSize="sm" fontWeight="semibold" color="slate.300" mb={3}>Top Products</Text>
          {/* Header Row */}
          <Flex justify="space-between" py={2} mb={1} borderBottom="1px" borderColor="slate.600">
            <Text fontSize="xs" color="slate.500" textTransform="uppercase" fontWeight="semibold">Product</Text>
            <HStack spacing={3}>
              <Text fontSize="xs" color="slate.500" textTransform="uppercase" fontWeight="semibold" w="50px" textAlign="right">Units</Text>
              <Text fontSize="xs" color="slate.500" textTransform="uppercase" fontWeight="semibold" w="50px" textAlign="right">Stock</Text>
              <Text fontSize="xs" color="slate.500" textTransform="uppercase" fontWeight="semibold" w="55px" textAlign="right">Margin</Text>
              <Text fontSize="xs" color="slate.500" textTransform="uppercase" fontWeight="semibold" w="55px" textAlign="right">Trend</Text>
              <Text fontSize="xs" color="slate.500" textTransform="uppercase" fontWeight="semibold" w="85px" textAlign="right">Revenue</Text>
            </HStack>
          </Flex>
          {topProducts?.slice(0, 5).map((product, idx) => {
            // Generate mock stock and trend data based on product
            const stock = Math.floor(Math.random() * 150) + 20;
            const trend = (Math.random() - 0.3) * 30; // -9% to +21%
            const isLowStock = stock < 50;

            return (
              <Flex key={product.product_id} justify="space-between" py={2} borderBottom={idx < 4 ? '1px' : 'none'} borderColor="slate.700">
                <HStack>
                  <Text fontSize="xs" color="slate.500" w="20px">{idx + 1}.</Text>
                  <Text fontSize="sm" color="white" noOfLines={1}>{product.product_name}</Text>
                </HStack>
                <HStack spacing={3}>
                  <Text fontSize="xs" color="slate.400" w="50px" textAlign="right">{product.units_sold}</Text>
                  <Text fontSize="xs" color={isLowStock ? 'yellow.400' : 'slate.400'} w="50px" textAlign="right">{stock}</Text>
                  <Text fontSize="xs" color="slate.400" w="55px" textAlign="right">{(product.margin || 0).toFixed(0)}%</Text>
                  <HStack w="55px" justify="flex-end" spacing={0}>
                    {trend >= 0 ? (
                      <ArrowUpIcon boxSize={3} color="green.400" />
                    ) : (
                      <ArrowDownIcon boxSize={3} color="red.400" />
                    )}
                    <Text fontSize="xs" color={trend >= 0 ? 'green.400' : 'red.400'}>{Math.abs(trend).toFixed(0)}%</Text>
                  </HStack>
                  <Text fontSize="sm" fontWeight="medium" color="green.400" w="85px" textAlign="right">{formatCurrency(product.revenue)}</Text>
                </HStack>
              </Flex>
            );
          })}
        </Box>
      </Grid>
    </Box>
  );
}

export default DashboardOption1;
