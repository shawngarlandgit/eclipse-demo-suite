/**
 * Supplier Risk Table
 * Sortable table of suppliers with risk data
 */

import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Text,
  HStack,
  IconButton,
  Progress,
  Tooltip,
  useColorModeValue,
  Flex,
  Icon,
} from "@chakra-ui/react";
import {
  EyeIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import type { EnrichedRiskProfile, RiskTier, RiskTrend } from "../types";
import {
  TIER_CONFIGS,
  TREND_CONFIGS,
  formatDaysSinceIncident,
  LICENSE_TYPE_LABELS,
} from "../types";
import { useSupplierRiskStore } from "../store/supplierRiskStore";

interface SupplierRiskTableProps {
  profiles: EnrichedRiskProfile[] | undefined;
  isLoading?: boolean;
  onViewDetails: (supplierId: string) => void;
}

export function SupplierRiskTable({
  profiles,
  isLoading,
  onViewDetails,
}: SupplierRiskTableProps) {
  const { sort, setSort } = useSupplierRiskStore();
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const hoverBg = useColorModeValue("gray.50", "gray.700");

  const SortIcon = ({ field }: { field: string }) => {
    if (sort.field !== field) return null;
    return sort.order === "asc" ? (
      <Icon as={ChevronUpIcon} boxSize={4} />
    ) : (
      <Icon as={ChevronDownIcon} boxSize={4} />
    );
  };

  const TrendIcon = ({ trend }: { trend: RiskTrend }) => {
    const icons = {
      improving: ArrowTrendingDownIcon,
      stable: MinusIcon,
      worsening: ArrowTrendingUpIcon,
    };
    return <Icon as={icons[trend]} boxSize={4} color={TREND_CONFIGS[trend].color} />;
  };

  const RiskBadge = ({ tier }: { tier: RiskTier }) => {
    const config = TIER_CONFIGS[tier];
    return (
      <Badge
        colorScheme={tier === "critical" ? "red" : tier === "high" ? "orange" : tier === "medium" ? "yellow" : "green"}
        variant="subtle"
        fontSize="xs"
        px={2}
        py={1}
        borderRadius="md"
      >
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Box bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor} p={8}>
        <Text color="gray.500" textAlign="center">Loading suppliers...</Text>
      </Box>
    );
  }

  if (!profiles || profiles.length === 0) {
    return (
      <Box bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor} p={8}>
        <Text color="gray.500" textAlign="center">No supplier risk data available</Text>
      </Box>
    );
  }

  return (
    <Box bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor} overflowX="auto" data-tour="supplier-risk-table">
      <Table variant="simple" size="sm">
        <Thead>
          <Tr>
            <Th
              cursor="pointer"
              onClick={() => setSort("name")}
              _hover={{ bg: hoverBg }}
            >
              <HStack spacing={1}>
                <Text>Supplier</Text>
                <SortIcon field="name" />
              </HStack>
            </Th>
            <Th>License Type</Th>
            <Th
              cursor="pointer"
              onClick={() => setSort("riskScore")}
              _hover={{ bg: hoverBg }}
              isNumeric
            >
              <HStack spacing={1} justify="flex-end">
                <Text>Risk Score</Text>
                <SortIcon field="riskScore" />
              </HStack>
            </Th>
            <Th>Risk Tier</Th>
            <Th
              cursor="pointer"
              onClick={() => setSort("trend")}
              _hover={{ bg: hoverBg }}
            >
              <HStack spacing={1}>
                <Text>Trend</Text>
                <SortIcon field="trend" />
              </HStack>
            </Th>
            <Th isNumeric>Incidents</Th>
            <Th
              cursor="pointer"
              onClick={() => setSort("lastIncident")}
              _hover={{ bg: hoverBg }}
            >
              <HStack spacing={1}>
                <Text>Last Incident</Text>
                <SortIcon field="lastIncident" />
              </HStack>
            </Th>
            <Th
              cursor="pointer"
              onClick={() => setSort("incidentRate")}
              _hover={{ bg: hoverBg }}
              isNumeric
            >
              <HStack spacing={1} justify="flex-end">
                <Text>Rate</Text>
                <SortIcon field="incidentRate" />
              </HStack>
            </Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {profiles.map((profile) => (
            <Tr key={profile._id} _hover={{ bg: hoverBg }}>
              <Td>
                <Box>
                  <Text fontWeight="medium">
                    {profile.supplier?.name ?? "Unknown Supplier"}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    {profile.supplier?.licenseNumber}
                  </Text>
                </Box>
              </Td>
              <Td>
                <Text fontSize="sm" color="gray.600">
                  {profile.supplier?.licenseType
                    ? LICENSE_TYPE_LABELS[profile.supplier.licenseType]
                    : "-"}
                </Text>
              </Td>
              <Td isNumeric>
                <Flex align="center" justify="flex-end" gap={2}>
                  <Progress
                    value={profile.riskScore}
                    size="sm"
                    w="60px"
                    colorScheme={
                      profile.riskScore >= 70
                        ? "red"
                        : profile.riskScore >= 50
                        ? "orange"
                        : profile.riskScore >= 25
                        ? "yellow"
                        : "green"
                    }
                    borderRadius="full"
                  />
                  <Text fontWeight="bold" minW="30px">
                    {profile.riskScore}
                  </Text>
                </Flex>
              </Td>
              <Td>
                <RiskBadge tier={profile.riskTier} />
              </Td>
              <Td>
                <Tooltip label={TREND_CONFIGS[profile.trend].label}>
                  <HStack spacing={1}>
                    <TrendIcon trend={profile.trend} />
                    <Text fontSize="sm" color={TREND_CONFIGS[profile.trend].color}>
                      {profile.scoreChange !== undefined && profile.scoreChange !== 0
                        ? `${profile.scoreChange > 0 ? "+" : ""}${profile.scoreChange}`
                        : ""}
                    </Text>
                  </HStack>
                </Tooltip>
              </Td>
              <Td isNumeric>
                <Tooltip
                  label={`${profile.contaminationCount} contamination, ${profile.recallCount} recalls, ${profile.labelingIssueCount} labeling`}
                >
                  <Text>
                    {profile.contaminationCount +
                      profile.recallCount +
                      profile.labelingIssueCount +
                      (profile.qualityIssueCount ?? 0)}
                  </Text>
                </Tooltip>
              </Td>
              <Td>
                <Text fontSize="sm" color="gray.600">
                  {formatDaysSinceIncident(profile.daysSinceLastIncident)}
                </Text>
              </Td>
              <Td isNumeric>
                <Tooltip label="Incidents per 100 batches">
                  <Text>{profile.incidentRate.toFixed(1)}%</Text>
                </Tooltip>
              </Td>
              <Td>
                <IconButton
                  aria-label="View details"
                  icon={<Icon as={EyeIcon} boxSize={4} />}
                  size="sm"
                  variant="ghost"
                  onClick={() => onViewDetails(profile.supplierId)}
                />
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}
