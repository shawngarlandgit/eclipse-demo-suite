import {
  Box,
  Grid,
  GridItem,
  Text,
  VStack,
  HStack,
  Avatar,
  Badge,
  Flex,
  Icon,
} from '@chakra-ui/react';
import { DollarSign, ShoppingCart, TrendingUp, TrendingDown, Award } from 'lucide-react';
import { useState } from 'react';
import { formatCurrency, formatNumber } from '../../../utils/formatters';
import type { StaffPerformanceMetrics } from '../types';
import StaffDetailModal from './StaffDetailModal';

interface StaffPerformanceGridProps {
  data: StaffPerformanceMetrics[];
  isLoading?: boolean;
}

/**
 * StaffPerformanceGrid
 * Displays staff performance metrics in a card grid
 */
function StaffPerformanceGrid({ data, isLoading = false }: StaffPerformanceGridProps) {
  const [selectedStaff, setSelectedStaff] = useState<StaffPerformanceMetrics | null>(null);
  const [selectedRank, setSelectedRank] = useState<number>(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCardClick = (staff: StaffPerformanceMetrics, rank: number) => {
    setSelectedStaff(staff);
    setSelectedRank(rank);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedStaff(null);
  };

  if (isLoading) {
    return (
      <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={4}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <GridItem key={i}>
            <Box className="skeleton" h="200px" w="full" />
          </GridItem>
        ))}
      </Grid>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Box className="card" p={8} textAlign="center">
        <Text color="slate.400">No staff performance data available</Text>
      </Box>
    );
  }

  const getRankBadge = (index: number) => {
    if (index === 0) {
      return (
        <Badge colorScheme="yellow" fontSize="xs" display="flex" alignItems="center" gap={1}>
          <Icon as={Award} boxSize={3} />
          Top Performer
        </Badge>
      );
    }
    if (index === 1) {
      return (
        <Badge colorScheme="gray" fontSize="xs">
          2nd Place
        </Badge>
      );
    }
    if (index === 2) {
      return (
        <Badge colorScheme="orange" fontSize="xs">
          3rd Place
        </Badge>
      );
    }
    return null;
  };

  return (
    <>
      <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={4}>
      {data.map((staff, index) => {
        const isPositiveChange = staff.sales_change_pct >= 0;
        const TrendIcon = isPositiveChange ? TrendingUp : TrendingDown;
        const trendColor = isPositiveChange ? 'green.400' : 'red.400';

        return (
          <GridItem key={staff.user_id}>
            <Box
              className="card"
              p={5}
              borderWidth={index < 3 ? '2px' : '1px'}
              borderColor={
                index === 0
                  ? 'yellow.600'
                  : index === 1
                  ? 'gray.600'
                  : index === 2
                  ? 'orange.600'
                  : 'slate.700'
              }
              transition="all 0.2s"
              cursor="pointer"
              onClick={() => handleCardClick(staff, index + 1)}
              _hover={{
                borderColor: 'cannabis.600',
                transform: 'translateY(-2px)',
                shadow: 'lg',
              }}
            >
              {/* Header */}
              <HStack spacing={3} mb={4}>
                <Avatar
                  size="md"
                  name={staff.full_name}
                  bg={index === 0 ? 'yellow.600' : 'cannabis.600'}
                />
                <VStack align="start" spacing={0} flex={1}>
                  <Text fontSize="md" fontWeight="bold" color="white">
                    {staff.full_name}
                  </Text>
                  <Text fontSize="xs" color="slate.400">
                    {staff.role}
                  </Text>
                </VStack>
                {getRankBadge(index)}
              </HStack>

              {/* Sales Stats */}
              <VStack spacing={3} align="stretch">
                {/* Total Sales */}
                <Flex justify="space-between" align="center">
                  <HStack spacing={2}>
                    <Icon as={DollarSign} boxSize={4} color="green.400" />
                    <Text fontSize="sm" color="slate.400">
                      Total Sales
                    </Text>
                  </HStack>
                  <VStack align="end" spacing={0}>
                    <Text fontSize="lg" fontWeight="bold" color="green.400">
                      {formatCurrency(staff.sales)}
                    </Text>
                    <HStack spacing={1}>
                      <Icon as={TrendIcon} boxSize={3} color={trendColor} />
                      <Text fontSize="xs" color={trendColor}>
                        {Math.abs(staff.sales_change_pct).toFixed(1)}%
                      </Text>
                    </HStack>
                  </VStack>
                </Flex>

                {/* Transactions */}
                <Flex justify="space-between" align="center">
                  <HStack spacing={2}>
                    <Icon as={ShoppingCart} boxSize={4} color="blue.400" />
                    <Text fontSize="sm" color="slate.400">
                      Transactions
                    </Text>
                  </HStack>
                  <Text fontSize="md" fontWeight="semibold" color="white">
                    {formatNumber(staff.transaction_count)}
                  </Text>
                </Flex>

                {/* Avg Transaction */}
                <Flex justify="space-between" align="center">
                  <Text fontSize="sm" color="slate.400" pl={6}>
                    Avg Transaction
                  </Text>
                  <Text fontSize="sm" fontWeight="medium" color="slate.300">
                    {formatCurrency(staff.avg_transaction_value)}
                  </Text>
                </Flex>

                {/* Divider */}
                <Box borderTop="1px solid" borderColor="slate.700" />

                {/* Recommendations */}
                <Flex justify="space-between" align="center">
                  <Text fontSize="sm" color="slate.400">
                    AI Recommendations
                  </Text>
                  <Badge colorScheme="purple" fontSize="xs">
                    {formatNumber(staff.recommendation_count)}
                  </Badge>
                </Flex>

                {/* Conversion Rate */}
                <Flex justify="space-between" align="center">
                  <Text fontSize="sm" color="slate.400">
                    Conversion Rate
                  </Text>
                  <Text fontSize="sm" fontWeight="semibold" color="purple.400">
                    {(staff.recommendation_conversion_rate * 100).toFixed(1)}%
                  </Text>
                </Flex>

                {/* Top Category */}
                <Flex justify="space-between" align="center">
                  <Text fontSize="sm" color="slate.400">
                    Top Category
                  </Text>
                  <Badge colorScheme="green" fontSize="xs" textTransform="capitalize">
                    {staff.top_product_category}
                  </Badge>
                </Flex>

                {/* Sales Per Hour */}
                <Flex justify="space-between" align="center" pt={2} borderTop="1px solid" borderColor="slate.700">
                  <Text fontSize="sm" color="slate.400">
                    Sales/Hour
                  </Text>
                  <Text fontSize="sm" fontWeight="semibold" color="cannabis.400">
                    {formatCurrency(staff.sales_per_hour)}
                  </Text>
                </Flex>
              </VStack>
            </Box>
          </GridItem>
        );
      })}
      </Grid>

      {/* Staff Detail Modal */}
      <StaffDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        staff={selectedStaff}
        rank={selectedRank}
      />
    </>
  );
}

export default StaffPerformanceGrid;
