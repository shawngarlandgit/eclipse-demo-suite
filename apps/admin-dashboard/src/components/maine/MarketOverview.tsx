import {
  Box,
  Flex,
  Grid,
  Heading,
  HStack,
  Icon,
  Stat,
  StatArrow,
  StatHelpText,
  StatLabel,
  StatNumber,
  Text,
  VStack,
  Skeleton,
  Badge,
  Tooltip,
} from "@chakra-ui/react";
import {
  Building2,
  Users,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Clock,
  Store,
} from "lucide-react";
import { useMaineMarketStats } from "../../hooks/useMaineData";

/**
 * Format currency for display
 */
function formatCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

/**
 * Format relative time for last sync
 */
function formatLastSync(timestamp: number | null): string {
  if (!timestamp) return "Never";
  const now = Date.now();
  const diff = now - timestamp;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return "Just now";
}

/**
 * Individual stat card component
 */
interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  gradient: string;
  subValue?: string;
  trend?: number;
  isLoading?: boolean;
}

function StatCard({
  label,
  value,
  icon,
  gradient,
  subValue,
  trend,
  isLoading,
}: StatCardProps) {
  return (
    <Box
      bg={gradient}
      borderRadius="xl"
      p={5}
      position="relative"
      overflow="hidden"
      _hover={{ transform: "translateY(-2px)" }}
      transition="transform 0.2s"
    >
      {/* Background decoration */}
      <Box
        position="absolute"
        right={-4}
        bottom={-4}
        opacity={0.1}
      >
        <Icon as={icon} boxSize={24} color="white" />
      </Box>

      {/* Content */}
      <VStack align="start" spacing={1} position="relative" zIndex={1}>
        <HStack spacing={2}>
          <Icon as={icon} boxSize={5} color="whiteAlpha.800" />
          <Text fontSize="sm" color="whiteAlpha.800" fontWeight="medium">
            {label}
          </Text>
        </HStack>

        {isLoading ? (
          <Skeleton height="36px" width="100px" />
        ) : (
          <Text fontSize="2xl" fontWeight="bold" color="white">
            {value}
          </Text>
        )}

        {(subValue || trend !== undefined) && (
          <HStack spacing={2}>
            {subValue && (
              <Text fontSize="xs" color="whiteAlpha.700">
                {subValue}
              </Text>
            )}
            {trend !== undefined && (
              <HStack spacing={0}>
                <StatArrow
                  type={trend >= 0 ? "increase" : "decrease"}
                  color={trend >= 0 ? "green.200" : "red.200"}
                />
                <Text fontSize="xs" color={trend >= 0 ? "green.200" : "red.200"}>
                  {Math.abs(trend).toFixed(1)}%
                </Text>
              </HStack>
            )}
          </HStack>
        )}
      </VStack>
    </Box>
  );
}

/**
 * Maine Market Overview Component
 *
 * Displays comprehensive Maine cannabis market statistics including:
 * - Medical dispensary counts
 * - Caregiver counts
 * - YTD sales data
 * - Compliance violation stats
 */
export function MarketOverview() {
  const { data: stats, isLoading } = useMaineMarketStats();

  return (
    <Box
      bg="slate.800"
      borderRadius="xl"
      border="1px solid"
      borderColor="slate.700"
      overflow="hidden"
    >
      {/* Header */}
      <Flex
        justify="space-between"
        align="center"
        px={6}
        py={4}
        borderBottom="1px solid"
        borderColor="slate.700"
        bg="slate.800/50"
      >
        <HStack spacing={3}>
          <Box
            bg="emerald.500/20"
            p={2}
            borderRadius="lg"
          >
            <Icon as={TrendingUp} boxSize={5} color="emerald.400" />
          </Box>
          <VStack align="start" spacing={0}>
            <Heading size="sm" color="white">
              Maine Cannabis Market
            </Heading>
            <Text fontSize="xs" color="slate.400">
              OCP Official Data
            </Text>
          </VStack>
        </HStack>

        {stats?.lastSyncTimes && (
          <Tooltip
            label={`Last synced: Dispensaries ${formatLastSync(stats.lastSyncTimes.dispensaries)}, Caregivers ${formatLastSync(stats.lastSyncTimes.caregivers)}`}
            placement="left"
          >
            <HStack spacing={1} cursor="help">
              <Icon as={Clock} boxSize={3} color="slate.500" />
              <Text fontSize="xs" color="slate.500">
                {formatLastSync(stats.lastSyncTimes.dispensaries)}
              </Text>
            </HStack>
          </Tooltip>
        )}
      </Flex>

      {/* Stats Grid */}
      <Box p={6}>
        <Grid
          templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }}
          gap={4}
        >
          {/* Medical Dispensaries */}
          <StatCard
            label="Medical Dispensaries"
            value={stats?.medicalDispensaryStats?.active || 0}
            icon={Building2}
            gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)"
            subValue={`${stats?.medicalDispensaryStats?.total || 0} total`}
            isLoading={isLoading}
          />

          {/* Medical Caregivers */}
          <StatCard
            label="Active Caregivers"
            value={stats?.caregiverStats?.active?.toLocaleString() || "0"}
            icon={Users}
            gradient="linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
            subValue={`${stats?.caregiverStats?.total?.toLocaleString() || 0} total`}
            isLoading={isLoading}
          />

          {/* YTD Sales */}
          <StatCard
            label="YTD Total Sales"
            value={formatCurrency(stats?.salesStats?.ytdTotal || 0)}
            icon={DollarSign}
            gradient="linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)"
            subValue={`${stats?.salesStats?.monthsReported || 0} months`}
            isLoading={isLoading}
          />

          {/* Compliance */}
          <StatCard
            label="Violations (90d)"
            value={stats?.violationStats?.last90Days || 0}
            icon={AlertTriangle}
            gradient="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
            subValue={`${stats?.violationStats?.totalAllTime || 0} all time`}
            isLoading={isLoading}
          />
        </Grid>

        {/* Detailed breakdown */}
        <Grid
          templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
          gap={4}
          mt={4}
        >
          {/* Sales Breakdown */}
          <Box
            bg="slate.700/50"
            borderRadius="lg"
            p={4}
            border="1px solid"
            borderColor="slate.600"
          >
            <Text fontSize="sm" fontWeight="medium" color="slate.300" mb={3}>
              YTD Sales Breakdown
            </Text>
            <Grid templateColumns="repeat(2, 1fr)" gap={4}>
              <Stat size="sm">
                <StatLabel color="slate.400">Medical</StatLabel>
                <StatNumber color="emerald.400" fontSize="lg">
                  {formatCurrency(stats?.salesStats?.ytdMedical || 0)}
                </StatNumber>
              </Stat>
              <Stat size="sm">
                <StatLabel color="slate.400">Adult Use</StatLabel>
                <StatNumber color="blue.400" fontSize="lg">
                  {formatCurrency(stats?.salesStats?.ytdAdultUse || 0)}
                </StatNumber>
              </Stat>
            </Grid>
          </Box>

          {/* Violation Breakdown */}
          <Box
            bg="slate.700/50"
            borderRadius="lg"
            p={4}
            border="1px solid"
            borderColor="slate.600"
          >
            <Text fontSize="sm" fontWeight="medium" color="slate.300" mb={3}>
              Enforcement Actions
            </Text>
            <HStack spacing={4}>
              <VStack align="start" spacing={1}>
                <Badge colorScheme="orange" fontSize="xs">Suspensions</Badge>
                <Text color="white" fontWeight="bold">
                  {stats?.violationStats?.byAction?.suspended || 0}
                </Text>
              </VStack>
              <VStack align="start" spacing={1}>
                <Badge colorScheme="red" fontSize="xs">Revocations</Badge>
                <Text color="white" fontWeight="bold">
                  {stats?.violationStats?.byAction?.revoked || 0}
                </Text>
              </VStack>
              <VStack align="start" spacing={1}>
                <Badge colorScheme="yellow" fontSize="xs">Total Fines</Badge>
                <Text color="white" fontWeight="bold">
                  {formatCurrency(stats?.violationStats?.totalFines || 0)}
                </Text>
              </VStack>
            </HStack>
          </Box>
        </Grid>
      </Box>
    </Box>
  );
}

export default MarketOverview;
