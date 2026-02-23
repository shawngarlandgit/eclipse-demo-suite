/**
 * Alert Summary Cards
 * Displays key compliance metrics in card format
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
  Skeleton,
  useColorModeValue,
} from "@chakra-ui/react";
import {
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  ShieldExclamationIcon,
} from "@heroicons/react/24/outline";
import type { ComplianceDashboardSummary } from "../types";

interface AlertSummaryCardsProps {
  summary: ComplianceDashboardSummary | undefined;
  isLoading?: boolean;
}

export function AlertSummaryCards({ summary, isLoading }: AlertSummaryCardsProps) {
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  const cards = [
    {
      label: "Active Alerts",
      value: summary?.totalActiveMatches ?? 0,
      helpText: `${summary?.criticalCount ?? 0} critical, ${summary?.highCount ?? 0} high`,
      icon: ExclamationTriangleIcon,
      iconColor: "red.500",
      iconBg: "red.50",
    },
    {
      label: "Pending Review",
      value: summary?.pendingCount ?? 0,
      helpText: "Awaiting staff review",
      icon: ClockIcon,
      iconColor: "yellow.500",
      iconBg: "yellow.50",
    },
    {
      label: "Products Affected",
      value: summary?.productsAffected ?? 0,
      helpText: `${summary?.confirmedCount ?? 0} confirmed matches`,
      icon: ShieldExclamationIcon,
      iconColor: "orange.500",
      iconBg: "orange.50",
    },
    {
      label: "Resolved",
      value: summary?.resolvedCount ?? 0,
      helpText: summary?.avgResolutionTimeHours
        ? `Avg ${summary.avgResolutionTimeHours.toFixed(1)}h resolution`
        : "No resolutions yet",
      icon: CheckCircleIcon,
      iconColor: "green.500",
      iconBg: "green.50",
    },
  ];

  if (isLoading) {
    return (
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={4} data-tour="alert-summary-cards">
        {[...Array(4)].map((_, i) => (
          <Box
            key={i}
            bg={cardBg}
            p={6}
            borderRadius="lg"
            border="1px solid"
            borderColor={borderColor}
          >
            <Skeleton height="80px" />
          </Box>
        ))}
      </SimpleGrid>
    );
  }

  return (
    <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={4} data-tour="alert-summary-cards">
      {cards.map((card, index) => (
        <Box
          key={index}
          bg={cardBg}
          p={6}
          borderRadius="lg"
          border="1px solid"
          borderColor={borderColor}
          _hover={{ shadow: "md" }}
          transition="shadow 0.2s"
        >
          <Flex justify="space-between" align="flex-start">
            <Stat>
              <StatLabel color="gray.500" fontSize="sm" fontWeight="medium">
                {card.label}
              </StatLabel>
              <StatNumber fontSize="3xl" fontWeight="bold" mt={1}>
                {card.value}
              </StatNumber>
              <StatHelpText fontSize="xs" color="gray.500" mb={0}>
                {card.helpText}
              </StatHelpText>
            </Stat>
            <Box
              p={3}
              borderRadius="lg"
              bg={useColorModeValue(card.iconBg, `${card.iconColor.split('.')[0]}.900`)}
            >
              <Icon
                as={card.icon}
                boxSize={6}
                color={card.iconColor}
              />
            </Box>
          </Flex>
        </Box>
      ))}
    </SimpleGrid>
  );
}
