/**
 * Risk Summary Cards
 * Dashboard summary metrics for supplier risk
 */

import {
  SimpleGrid,
  Box,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Icon,
  Flex,
  useColorModeValue,
} from "@chakra-ui/react";
import {
  ShieldExclamationIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  CubeIcon,
} from "@heroicons/react/24/outline";
import type { RiskDashboardSummary } from "../types";

interface RiskSummaryCardsProps {
  summary: RiskDashboardSummary | undefined;
  isLoading?: boolean;
}

export function RiskSummaryCards({ summary, isLoading }: RiskSummaryCardsProps) {
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  const cards = [
    {
      label: "High Risk Suppliers",
      value: summary?.highRiskCount ?? 0,
      helpText: `${summary?.tierCounts?.critical ?? 0} critical, ${summary?.tierCounts?.high ?? 0} high`,
      icon: ShieldExclamationIcon,
      color: "red.500",
      bgColor: "red.50",
    },
    {
      label: "Recent Incidents",
      value: summary?.recentIncidentCount ?? 0,
      helpText: "Last 30 days",
      icon: ExclamationTriangleIcon,
      color: "orange.500",
      bgColor: "orange.50",
    },
    {
      label: "Worsening Trends",
      value: summary?.worseningSupplierCount ?? 0,
      helpText: "Suppliers with increasing risk",
      icon: ArrowTrendingUpIcon,
      color: "yellow.600",
      bgColor: "yellow.50",
    },
    {
      label: "Products at Risk",
      value: summary?.productsAtRisk ?? 0,
      helpText: "From high-risk suppliers",
      icon: CubeIcon,
      color: "purple.500",
      bgColor: "purple.50",
    },
  ];

  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4} data-tour="risk-summary-cards">
      {cards.map((card) => (
        <Box
          key={card.label}
          bg={cardBg}
          p={5}
          borderRadius="lg"
          borderWidth="1px"
          borderColor={borderColor}
          position="relative"
          overflow="hidden"
        >
          <Flex justify="space-between" align="flex-start">
            <Stat>
              <StatLabel color="gray.500" fontSize="sm">
                {card.label}
              </StatLabel>
              <StatNumber fontSize="3xl" fontWeight="bold">
                {isLoading ? "-" : card.value}
              </StatNumber>
              <StatHelpText color="gray.500" fontSize="xs" mb={0}>
                {card.helpText}
              </StatHelpText>
            </Stat>
            <Box
              p={3}
              borderRadius="lg"
              bg={useColorModeValue(card.bgColor, `${card.color.split(".")[0]}.900`)}
            >
              <Icon
                as={card.icon}
                boxSize={6}
                color={card.color}
              />
            </Box>
          </Flex>
        </Box>
      ))}
    </SimpleGrid>
  );
}
