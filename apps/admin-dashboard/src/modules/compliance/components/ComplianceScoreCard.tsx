import {
  Box,
  Text,
  CircularProgress,
  CircularProgressLabel,
  HStack,
  VStack,
  Icon,
  Flex,
} from '@chakra-ui/react';
import { ShieldCheck, TrendingUp, TrendingDown } from 'lucide-react';

interface ComplianceScoreCardProps {
  score: number;
  isLoading?: boolean;
  variant?: 'vertical' | 'horizontal';
}

/**
 * ComplianceScoreCard
 * Displays overall compliance score with visual indicator
 */
function ComplianceScoreCard({ score, isLoading = false, variant = 'vertical' }: ComplianceScoreCardProps) {
  if (isLoading) {
    return (
      <Box className="card" p={6}>
        <Box className="skeleton" height={variant === 'horizontal' ? '140px' : '200px'} />
      </Box>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'green.400';
    if (score >= 75) return 'yellow.400';
    if (score >= 60) return 'orange.400';
    return 'red.400';
  };

  const getScoreStatus = (score: number) => {
    if (score >= 90) return { label: 'Excellent', color: 'green' };
    if (score >= 75) return { label: 'Good', color: 'yellow' };
    if (score >= 60) return { label: 'Fair', color: 'orange' };
    return { label: 'Poor', color: 'red' };
  };

  const scoreStatus = getScoreStatus(score);
  const previousScore = score - 3; // Mock trend
  const isImproving = score > previousScore;

  if (variant === 'horizontal') {
    return (
      <Box
        className="card"
        p={6}
        borderWidth="2px"
        borderColor={getScoreColor(score)}
      >
        <Flex align="center" gap={6}>
          {/* Left: Circular Progress */}
          <CircularProgress
            value={score}
            size="120px"
            color={getScoreColor(score)}
            trackColor="slate.700"
            thickness="8px"
          >
            <CircularProgressLabel>
              <VStack spacing={0}>
                <Text fontSize="3xl" fontWeight="bold" color="white">
                  {score}
                </Text>
                <Text fontSize="sm" color={scoreStatus.color + '.400'} fontWeight="semibold">
                  {scoreStatus.label}
                </Text>
              </VStack>
            </CircularProgressLabel>
          </CircularProgress>

          {/* Middle: Title and Description */}
          <VStack align="start" spacing={3} flex={1}>
            <HStack spacing={2}>
              <Icon as={ShieldCheck} boxSize={6} color={getScoreColor(score)} />
              <Text fontSize="xl" fontWeight="bold" color="white">
                Compliance Score
              </Text>
            </HStack>

            <Text fontSize="sm" color="slate.400">
              Score reflects compliance flag resolution rate, license status, and regulatory adherence
            </Text>

            <HStack spacing={2}>
              <Icon
                as={isImproving ? TrendingUp : TrendingDown}
                boxSize={4}
                color={isImproving ? 'green.400' : 'red.400'}
              />
              <Text fontSize="sm" color={isImproving ? 'green.400' : 'red.400'}>
                {isImproving ? '+' : ''}{(score - previousScore).toFixed(1)} from last period
              </Text>
            </HStack>
          </VStack>
        </Flex>
      </Box>
    );
  }

  // Vertical variant (original)
  return (
    <Box
      className="card"
      p={6}
      borderWidth="2px"
      borderColor={getScoreColor(score)}
      textAlign="center"
    >
      <HStack justify="center" mb={4}>
        <Icon as={ShieldCheck} boxSize={6} color={getScoreColor(score)} />
        <Text fontSize="lg" fontWeight="bold" color="white">
          Compliance Score
        </Text>
      </HStack>

      <CircularProgress
        value={score}
        size="160px"
        color={getScoreColor(score)}
        trackColor="slate.700"
        thickness="8px"
        mb={4}
      >
        <CircularProgressLabel>
          <VStack spacing={0}>
            <Text fontSize="4xl" fontWeight="bold" color="white">
              {score}
            </Text>
            <Text fontSize="md" color={scoreStatus.color + '.400'} fontWeight="semibold">
              {scoreStatus.label}
            </Text>
          </VStack>
        </CircularProgressLabel>
      </CircularProgress>

      <HStack justify="center" spacing={2}>
        <Icon
          as={isImproving ? TrendingUp : TrendingDown}
          boxSize={4}
          color={isImproving ? 'green.400' : 'red.400'}
        />
        <Text fontSize="sm" color={isImproving ? 'green.400' : 'red.400'}>
          {isImproving ? '+' : ''}{(score - previousScore).toFixed(1)} from last period
        </Text>
      </HStack>

      <Box mt={4} pt={4} borderTop="1px solid" borderColor="slate.700">
        <Text fontSize="xs" color="slate.400">
          Score reflects compliance flag resolution rate, license status, and regulatory adherence
        </Text>
      </Box>
    </Box>
  );
}

export default ComplianceScoreCard;
