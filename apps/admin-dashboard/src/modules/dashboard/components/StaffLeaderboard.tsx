import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Avatar,
  Badge,
} from '@chakra-ui/react';
import { formatCurrency, formatNumber } from '../../../utils/formatters';
import type { StaffPerformance } from '../../../types';

interface StaffLeaderboardProps {
  data: StaffPerformance[];
  isLoading?: boolean;
}

/**
 * StaffLeaderboard Component
 * Displays top performing staff members
 */
function StaffLeaderboard({ data, isLoading = false }: StaffLeaderboardProps) {
  if (isLoading) {
    return (
      <Box className="card" p={6}>
        <Heading size="md" mb={4} color="white">
          Staff Leaderboard
        </Heading>
        <VStack spacing={3} align="stretch">
          {[1, 2, 3, 4, 5].map((i) => (
            <Box key={i} className="skeleton" h="60px" w="full" />
          ))}
        </VStack>
      </Box>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Box className="card" p={6}>
        <Heading size="md" mb={4} color="white">
          Staff Leaderboard
        </Heading>
        <Box h="200px" display="flex" alignItems="center" justifyContent="center">
          <Text color="slate.400">No staff performance data available</Text>
        </Box>
      </Box>
    );
  }

  // Sort by sales (descending)
  const sortedStaff = [...data]
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5);

  // Medal colors for top 3
  const getMedalColor = (rank: number) => {
    if (rank === 1) return 'yellow.400'; // Gold
    if (rank === 2) return 'gray.400'; // Silver
    if (rank === 3) return 'orange.600'; // Bronze
    return 'slate.500';
  };

  return (
    <Box className="card" p={6}>
      <HStack justify="space-between" mb={4}>
        <Heading size="md" color="white">
          Staff Leaderboard
        </Heading>
        <Text fontSize="sm" color="slate.400">
          Top 5 by Sales
        </Text>
      </HStack>

      <VStack spacing={3} align="stretch">
        {sortedStaff.map((staff, index) => {
          const rank = index + 1;
          const medalColor = getMedalColor(rank);

          return (
            <HStack
              key={staff.user_id}
              spacing={4}
              p={3}
              bg={rank <= 3 ? 'slate.750' : 'transparent'}
              rounded="lg"
              borderWidth="1px"
              borderColor={rank <= 3 ? medalColor : 'slate.700'}
              _hover={{ bg: 'slate.750', borderColor: 'cannabis.600' }}
              transition="all 0.2s"
            >
              {/* Rank Badge */}
              <Box
                w={8}
                h={8}
                bg={medalColor}
                color={rank <= 3 ? 'slate.900' : 'slate.300'}
                rounded="full"
                display="flex"
                alignItems="center"
                justifyContent="center"
                fontWeight="bold"
                fontSize="sm"
              >
                {rank}
              </Box>

              {/* Avatar */}
              <Avatar
                size="sm"
                name={staff.full_name}
                bg="cannabis.600"
              />

              {/* Staff Info */}
              <VStack align="start" spacing={0} flex={1}>
                <Text fontSize="sm" fontWeight="medium" color="white">
                  {staff.full_name}
                </Text>
                <HStack spacing={2}>
                  <Text fontSize="xs" color="slate.400">
                    {formatNumber(staff.transaction_count)} transactions
                  </Text>
                  {staff.recommendation_count > 0 && (
                    <Badge colorScheme="purple" fontSize="xs">
                      {formatNumber(staff.recommendation_count)} AI recs
                    </Badge>
                  )}
                </HStack>
              </VStack>

              {/* Sales Amount */}
              <VStack align="end" spacing={0}>
                <Text fontSize="md" fontWeight="bold" color="cannabis.400">
                  {formatCurrency(staff.sales)}
                </Text>
                <Text fontSize="xs" color="slate.400">
                  {formatCurrency(staff.avg_transaction_value)} avg
                </Text>
              </VStack>
            </HStack>
          );
        })}
      </VStack>
    </Box>
  );
}

export default StaffLeaderboard;
