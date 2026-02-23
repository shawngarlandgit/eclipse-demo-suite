import { Box, Heading, Text, Flex, VStack, HStack, Icon, Badge, Circle } from '@chakra-ui/react';
import { CheckCircle, AlertTriangle, XCircle, DollarSign, Package, Users, Shield } from 'lucide-react';
import { useDashboardKPIs } from '../hooks/useDashboard';
import { formatCurrency } from '../utils/formatters';
import { DraggableGrid, DraggableWidget, EditModeToolbar } from '../components/grid';

/**
 * Dashboard Simple 2: "Traffic Light Dashboard"
 *
 * Color-coded status indicators that anyone can understand:
 * - Green = Good, you're doing great
 * - Yellow = Needs attention soon
 * - Red = Action required now
 *
 * Four quadrants: Sales, Inventory, Customers, Compliance
 * Each shows a simple status with plain English explanation.
 */

type StatusLevel = 'good' | 'warning' | 'critical';

interface StatusConfig {
  color: string;
  bg: string;
  icon: typeof CheckCircle;
  label: string;
}

const statusConfigs: Record<StatusLevel, StatusConfig> = {
  good: { color: 'green.400', bg: 'green.900', icon: CheckCircle, label: 'Looking Good' },
  warning: { color: 'yellow.400', bg: 'yellow.900', icon: AlertTriangle, label: 'Needs Attention' },
  critical: { color: 'red.400', bg: 'red.900', icon: XCircle, label: 'Action Required' },
};

function DashboardSimple2() {
  const { data: kpis, isLoading } = useDashboardKPIs();

  // Determine status levels based on KPIs
  const getSalesStatus = (): StatusLevel => {
    if (!kpis) return 'good';
    // Based on revenue - if we have revenue today, we're good
    if ((kpis.revenue_today ?? 0) > 2000) return 'good';
    if ((kpis.revenue_today ?? 0) > 500) return 'warning';
    return 'critical';
  };

  const getInventoryStatus = (): StatusLevel => {
    if (!kpis) return 'good';
    const lowStock = kpis.low_stock_count || 0;
    if (lowStock === 0) return 'good';
    if (lowStock <= 5) return 'warning';
    return 'critical';
  };

  const getCustomerStatus = (): StatusLevel => {
    if (!kpis) return 'good';
    const repeatRate = kpis.customers_repeat_pct || 0;
    if (repeatRate >= 60) return 'good';
    if (repeatRate >= 40) return 'warning';
    return 'critical';
  };

  const getComplianceStatus = (): StatusLevel => {
    if (!kpis) return 'good';
    const flags = kpis.compliance_flags_open || 0;
    if (flags === 0) return 'good';
    if (flags <= 2) return 'warning';
    return 'critical';
  };

  const StatusCard = ({
    title,
    icon: CardIcon,
    status,
    mainValue,
    description
  }: {
    title: string;
    icon: typeof DollarSign;
    status: StatusLevel;
    mainValue: string;
    description: string;
  }) => {
    const config = statusConfigs[status];
    const StatusIcon = config.icon;

    return (
      <Box
        bg="slate.800"
        borderRadius="xl"
        p={6}
        h="100%"
        borderLeft="4px solid"
        borderLeftColor={config.color}
        position="relative"
      >
        {/* Status Indicator */}
        <Circle
          size="40px"
          bg={config.bg}
          position="absolute"
          top={4}
          right={4}
        >
          <Icon as={StatusIcon} color={config.color} boxSize={5} />
        </Circle>

        {/* Content */}
        <VStack align="start" spacing={4}>
          <HStack>
            <Icon as={CardIcon} color="slate.400" boxSize={5} />
            <Text color="slate.400" fontSize="sm" fontWeight="medium" textTransform="uppercase">
              {title}
            </Text>
          </HStack>

          <Text fontSize="3xl" fontWeight="bold" color="white">
            {mainValue}
          </Text>

          <Text color="slate.300" fontSize="md">
            {description}
          </Text>

          <Badge
            colorScheme={status === 'good' ? 'green' : status === 'warning' ? 'yellow' : 'red'}
            px={3}
            py={1}
            borderRadius="full"
            fontSize="sm"
          >
            {config.label}
          </Badge>
        </VStack>
      </Box>
    );
  };

  if (isLoading) {
    return (
      <Flex h="80vh" align="center" justify="center">
        <Text fontSize="xl" color="slate.400">Loading...</Text>
      </Flex>
    );
  }

  const salesStatus = getSalesStatus();
  const inventoryStatus = getInventoryStatus();
  const customerStatus = getCustomerStatus();
  const complianceStatus = getComplianceStatus();

  // Count issues
  const issueCount = [salesStatus, inventoryStatus, customerStatus, complianceStatus]
    .filter(s => s !== 'good').length;

  return (
    <Box p={8} maxW="1200px" mx="auto">
      {/* Header with Overall Status */}
      <HStack justify="space-between" align="start" mb={6}>
        <VStack spacing={4} align="start">
          <Heading size="lg" color="white">Store Health Check</Heading>
          {issueCount === 0 ? (
            <HStack bg="green.900" px={6} py={3} borderRadius="full">
              <Icon as={CheckCircle} color="green.400" boxSize={6} />
              <Text color="green.400" fontSize="lg" fontWeight="medium">
                Everything is running smoothly!
              </Text>
            </HStack>
          ) : (
            <HStack bg="yellow.900" px={6} py={3} borderRadius="full">
              <Icon as={AlertTriangle} color="yellow.400" boxSize={6} />
              <Text color="yellow.400" fontSize="lg" fontWeight="medium">
                {issueCount} area{issueCount > 1 ? 's' : ''} need{issueCount === 1 ? 's' : ''} your attention
              </Text>
            </HStack>
          )}
        </VStack>
        <EditModeToolbar dashboardStyle="simple-2" />
      </HStack>

      {/* Four Status Cards - Now Draggable */}
      <DraggableGrid dashboardStyle="simple-2">
        <DraggableWidget key="sales-status" id="sales-status" noPadding>
          <StatusCard
            title="Sales"
            icon={DollarSign}
            status={salesStatus}
            mainValue={formatCurrency(kpis?.revenue_today || 0)}
            description={
              salesStatus === 'good'
                ? `Great day! ${kpis?.transactions_today || 0} transactions so far`
                : salesStatus === 'warning'
                ? "Sales are moderate - keep pushing!"
                : "Slow day - consider promotions"
            }
          />
        </DraggableWidget>

        <DraggableWidget key="inventory-status" id="inventory-status" noPadding>
          <StatusCard
            title="Inventory"
            icon={Package}
            status={inventoryStatus}
            mainValue={`${kpis?.inventory_health_pct?.toFixed(0) || 0}% Stocked`}
            description={
              inventoryStatus === 'good'
                ? "All products are well-stocked"
                : inventoryStatus === 'warning'
                ? `${kpis?.low_stock_count} products running low - order soon`
                : `${kpis?.low_stock_count} products critically low - order now!`
            }
          />
        </DraggableWidget>

        <DraggableWidget key="customer-status" id="customer-status" noPadding>
          <StatusCard
            title="Customers"
            icon={Users}
            status={customerStatus}
            mainValue={`${kpis?.customers_repeat_pct?.toFixed(0) || 0}% Return`}
            description={
              customerStatus === 'good'
                ? "Great customer loyalty - people keep coming back!"
                : customerStatus === 'warning'
                ? "Customer retention could be better"
                : "Low repeat rate - consider loyalty programs"
            }
          />
        </DraggableWidget>

        <DraggableWidget key="compliance-status" id="compliance-status" noPadding>
          <StatusCard
            title="Compliance"
            icon={Shield}
            status={complianceStatus}
            mainValue={complianceStatus === 'good' ? 'All Clear' : `${kpis?.compliance_flags_open} Issues`}
            description={
              complianceStatus === 'good'
                ? "No compliance issues - you're all set"
                : complianceStatus === 'warning'
                ? "Minor compliance items to review"
                : "Compliance issues need immediate attention"
            }
          />
        </DraggableWidget>
      </DraggableGrid>

      {/* Legend */}
      <HStack justify="center" spacing={8} mt={10}>
        <HStack>
          <Circle size="12px" bg="green.400" />
          <Text color="slate.400" fontSize="sm">Good</Text>
        </HStack>
        <HStack>
          <Circle size="12px" bg="yellow.400" />
          <Text color="slate.400" fontSize="sm">Needs Attention</Text>
        </HStack>
        <HStack>
          <Circle size="12px" bg="red.400" />
          <Text color="slate.400" fontSize="sm">Action Required</Text>
        </HStack>
      </HStack>
    </Box>
  );
}

export default DashboardSimple2;
