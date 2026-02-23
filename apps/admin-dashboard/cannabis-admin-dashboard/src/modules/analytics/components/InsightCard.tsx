import { Box, HStack, Text, Icon } from '@chakra-ui/react';
import { Lightbulb, TrendingUp, AlertTriangle, Info } from 'lucide-react';
import type { Insight } from '../utils/insights';

interface InsightCardProps {
  insight: Insight;
}

/**
 * InsightCard
 * Displays AI-powered insights about analytics data
 */
function InsightCard({ insight }: InsightCardProps) {
  const getIconColor = () => {
    switch (insight.type) {
      case 'success':
        return '#10B981'; // Green
      case 'warning':
        return '#F59E0B'; // Amber
      case 'info':
        return '#3B82F6'; // Blue
      default:
        return '#94A3B8'; // Slate
    }
  };

  const getIcon = () => {
    switch (insight.type) {
      case 'success':
        return TrendingUp;
      case 'warning':
        return AlertTriangle;
      case 'info':
        return Info;
      default:
        return Lightbulb;
    }
  };

  const iconColor = getIconColor();
  const IconComponent = getIcon();

  return (
    <Box
      bg="slate.800"
      border="1px solid"
      borderColor="slate.700"
      borderRadius="lg"
      p={4}
      _hover={{ borderColor: 'slate.600', bg: 'slate.750' }}
      transition="all 0.2s"
    >
      <HStack spacing={3} align="start">
        <Icon
          as={IconComponent}
          boxSize={5}
          color={iconColor}
          mt={0.5}
          flexShrink={0}
        />
        <Box flex={1}>
          <Text
            fontSize="sm"
            fontWeight="semibold"
            color="white"
            mb={1}
          >
            {insight.title}
          </Text>
          <Text
            fontSize="xs"
            color="slate.400"
            lineHeight="1.6"
          >
            {insight.description}
          </Text>
        </Box>
      </HStack>
    </Box>
  );
}

export default InsightCard;
