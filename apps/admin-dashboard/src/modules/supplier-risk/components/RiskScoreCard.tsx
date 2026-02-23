/**
 * Risk Score Card
 * Visual display of a single supplier's risk score
 */

import {
  Box,
  CircularProgress,
  CircularProgressLabel,
  Text,
  VStack,
  HStack,
  Badge,
  Icon,
  Tooltip,
  useColorModeValue,
} from "@chakra-ui/react";
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
} from "@heroicons/react/24/outline";
import type { RiskTier, RiskTrend } from "../types";
import { TIER_CONFIGS, TREND_CONFIGS } from "../types";

interface RiskScoreCardProps {
  score: number;
  tier: RiskTier;
  trend: RiskTrend;
  trendDirection: number;
  scoreChange?: number;
  size?: "sm" | "md" | "lg";
  showDetails?: boolean;
}

export function RiskScoreCard({
  score,
  tier,
  trend,
  trendDirection,
  scoreChange,
  size = "md",
  showDetails = true,
}: RiskScoreCardProps) {
  const tierConfig = TIER_CONFIGS[tier];
  const trendConfig = TREND_CONFIGS[trend];

  const sizes = {
    sm: { circle: 60, thickness: 6, fontSize: "md" },
    md: { circle: 100, thickness: 8, fontSize: "2xl" },
    lg: { circle: 140, thickness: 10, fontSize: "3xl" },
  };
  const s = sizes[size];

  const getScoreColor = () => {
    if (score >= 70) return "red.500";
    if (score >= 50) return "orange.500";
    if (score >= 25) return "yellow.500";
    return "green.500";
  };

  const TrendIcon = () => {
    const icons = {
      improving: ArrowTrendingDownIcon,
      stable: MinusIcon,
      worsening: ArrowTrendingUpIcon,
    };
    return <Icon as={icons[trend]} boxSize={4} />;
  };

  return (
    <VStack spacing={2} data-tour="risk-score-card">
      <CircularProgress
        value={score}
        size={`${s.circle}px`}
        thickness={s.thickness}
        color={getScoreColor()}
        trackColor={useColorModeValue("gray.100", "gray.700")}
      >
        <CircularProgressLabel fontSize={s.fontSize} fontWeight="bold">
          {score}
        </CircularProgressLabel>
      </CircularProgress>

      {showDetails && (
        <>
          <Badge
            colorScheme={
              tier === "critical"
                ? "red"
                : tier === "high"
                ? "orange"
                : tier === "medium"
                ? "yellow"
                : "green"
            }
            variant="subtle"
            fontSize="xs"
            px={2}
            py={1}
          >
            {tierConfig.label}
          </Badge>

          <Tooltip label={tierConfig.description}>
            <HStack spacing={1} color={trendConfig.color}>
              <TrendIcon />
              <Text fontSize="xs">
                {trendConfig.label}
                {scoreChange !== undefined && scoreChange !== 0 && (
                  <> ({scoreChange > 0 ? "+" : ""}{scoreChange})</>
                )}
              </Text>
            </HStack>
          </Tooltip>
        </>
      )}
    </VStack>
  );
}

/**
 * Compact inline risk score display
 */
interface RiskScoreBadgeProps {
  score: number;
  tier: RiskTier;
  showScore?: boolean;
}

export function RiskScoreBadge({ score, tier, showScore = true }: RiskScoreBadgeProps) {
  const tierConfig = TIER_CONFIGS[tier];

  return (
    <Badge
      colorScheme={
        tier === "critical"
          ? "red"
          : tier === "high"
          ? "orange"
          : tier === "medium"
          ? "yellow"
          : "green"
      }
      variant="subtle"
      px={2}
      py={1}
      borderRadius="md"
    >
      {showScore && <Text as="span" fontWeight="bold" mr={1}>{score}</Text>}
      {tierConfig.label}
    </Badge>
  );
}
