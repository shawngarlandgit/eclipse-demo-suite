import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Box,
  HStack,
  VStack,
  Avatar,
  Text,
  Grid,
  Icon,
  Badge,
  Divider,
} from '@chakra-ui/react';
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Award,
  Calendar,
  Mail,
  Phone,
  Clock,
  Sparkles,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency, formatNumber } from '../../../utils/formatters';
import type { StaffPerformanceMetrics } from '../types';
import { useStaffPerformanceTrend } from '../../../hooks/useStaff';

interface StaffDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: StaffPerformanceMetrics | null;
  rank: number;
}

/**
 * StaffDetailModal
 * Detailed view of individual staff member performance and information
 */
function StaffDetailModal({ isOpen, onClose, staff, rank }: StaffDetailModalProps) {
  const { data: trendData } = useStaffPerformanceTrend(staff?.user_id || '');

  if (!staff) return null;

  const isPositiveChange = staff.sales_change_pct >= 0;
  const TrendIcon = isPositiveChange ? TrendingUp : TrendingDown;
  const trendColor = isPositiveChange ? 'green.400' : 'red.400';

  const getRankBadge = () => {
    if (rank === 1) {
      return (
        <Badge colorScheme="yellow" fontSize="sm" px={3} py={1}>
          <HStack spacing={1}>
            <Icon as={Award} boxSize={4} />
            <Text>Top Performer</Text>
          </HStack>
        </Badge>
      );
    }
    if (rank === 2) return <Badge colorScheme="gray" fontSize="sm" px={3} py={1}>2nd Place</Badge>;
    if (rank === 3) return <Badge colorScheme="orange" fontSize="sm" px={3} py={1}>3rd Place</Badge>;
    return <Badge colorScheme="slate" fontSize="sm" px={3} py={1}>Rank #{rank}</Badge>;
  };

  // Mock personal info - in production this would come from the API
  const personalInfo = {
    email: `${staff.full_name.toLowerCase().replace(' ', '.')}@dispensary.com`,
    phone: '(555) 123-4567',
    hire_date: '2023-03-15',
    employee_id: staff.user_id.slice(0, 8).toUpperCase(),
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" scrollBehavior="inside">
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent bg="slate.800" borderColor="slate.700" borderWidth="1px">
        <ModalHeader borderBottom="1px solid" borderColor="slate.700" pb={4}>
          <HStack spacing={4}>
            <Avatar
              size="lg"
              name={staff.full_name}
              bg={rank === 1 ? 'yellow.600' : 'cannabis.600'}
            />
            <VStack align="start" spacing={1} flex={1}>
              <HStack spacing={3}>
                <Text fontSize="xl" fontWeight="bold" color="white">
                  {staff.full_name}
                </Text>
                {getRankBadge()}
              </HStack>
              <Text fontSize="sm" color="slate.400">
                {staff.role}
              </Text>
            </VStack>
          </HStack>
        </ModalHeader>

        <ModalCloseButton color="slate.400" _hover={{ color: 'white' }} />

        <ModalBody py={6}>
          <VStack spacing={6} align="stretch">
            {/* Personal Information */}
            <Box>
              <Text fontSize="md" fontWeight="bold" color="white" mb={3}>
                Personal Information
              </Text>
              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                <HStack spacing={3} p={3} bg="slate.750" borderRadius="md">
                  <Icon as={Mail} boxSize={5} color="blue.400" />
                  <VStack align="start" spacing={0}>
                    <Text fontSize="xs" color="slate.400">Email</Text>
                    <Text fontSize="sm" color="white">{personalInfo.email}</Text>
                  </VStack>
                </HStack>

                <HStack spacing={3} p={3} bg="slate.750" borderRadius="md">
                  <Icon as={Phone} boxSize={5} color="green.400" />
                  <VStack align="start" spacing={0}>
                    <Text fontSize="xs" color="slate.400">Phone</Text>
                    <Text fontSize="sm" color="white">{personalInfo.phone}</Text>
                  </VStack>
                </HStack>

                <HStack spacing={3} p={3} bg="slate.750" borderRadius="md">
                  <Icon as={Calendar} boxSize={5} color="purple.400" />
                  <VStack align="start" spacing={0}>
                    <Text fontSize="xs" color="slate.400">Hire Date</Text>
                    <Text fontSize="sm" color="white">{new Date(personalInfo.hire_date).toLocaleDateString()}</Text>
                  </VStack>
                </HStack>

                <HStack spacing={3} p={3} bg="slate.750" borderRadius="md">
                  <Icon as={Award} boxSize={5} color="yellow.400" />
                  <VStack align="start" spacing={0}>
                    <Text fontSize="xs" color="slate.400">Employee ID</Text>
                    <Text fontSize="sm" color="white">{personalInfo.employee_id}</Text>
                  </VStack>
                </HStack>
              </Grid>
            </Box>

            <Divider borderColor="slate.700" />

            {/* Performance Metrics */}
            <Box>
              <Text fontSize="md" fontWeight="bold" color="white" mb={3}>
                Performance Metrics
              </Text>
              <Grid templateColumns="repeat(3, 1fr)" gap={4}>
                {/* Total Sales */}
                <Box p={4} bg="slate.750" borderRadius="md" borderWidth="2px" borderColor="green.600">
                  <HStack spacing={2} mb={2}>
                    <Icon as={DollarSign} boxSize={5} color="green.400" />
                    <Text fontSize="sm" color="slate.400">Total Sales</Text>
                  </HStack>
                  <Text fontSize="2xl" fontWeight="bold" color="green.400">
                    {formatCurrency(staff.sales)}
                  </Text>
                  <HStack spacing={1} mt={1}>
                    <Icon as={TrendIcon} boxSize={4} color={trendColor} />
                    <Text fontSize="sm" color={trendColor}>
                      {Math.abs(staff.sales_change_pct).toFixed(1)}% vs last period
                    </Text>
                  </HStack>
                </Box>

                {/* Transactions */}
                <Box p={4} bg="slate.750" borderRadius="md">
                  <HStack spacing={2} mb={2}>
                    <Icon as={ShoppingCart} boxSize={5} color="blue.400" />
                    <Text fontSize="sm" color="slate.400">Transactions</Text>
                  </HStack>
                  <Text fontSize="2xl" fontWeight="bold" color="white">
                    {formatNumber(staff.transaction_count)}
                  </Text>
                  <Text fontSize="sm" color="slate.400" mt={1}>
                    {formatCurrency(staff.avg_transaction_value)} avg
                  </Text>
                </Box>

                {/* Sales Per Hour */}
                <Box p={4} bg="slate.750" borderRadius="md">
                  <HStack spacing={2} mb={2}>
                    <Icon as={Clock} boxSize={5} color="purple.400" />
                    <Text fontSize="sm" color="slate.400">Sales/Hour</Text>
                  </HStack>
                  <Text fontSize="2xl" fontWeight="bold" color="white">
                    {formatCurrency(staff.sales_per_hour)}
                  </Text>
                  <Text fontSize="sm" color="slate.400" mt={1}>
                    {staff.hours_worked.toFixed(1)} hours worked
                  </Text>
                </Box>
              </Grid>
            </Box>

            {/* AI Recommendations */}
            <Box p={4} bg="purple.900" borderRadius="md" borderWidth="1px" borderColor="purple.600">
              <HStack justify="space-between" mb={3}>
                <HStack spacing={2}>
                  <Icon as={Sparkles} boxSize={5} color="purple.400" />
                  <Text fontSize="md" fontWeight="bold" color="white">
                    AI Recommendation Performance
                  </Text>
                </HStack>
                <Badge colorScheme="purple" fontSize="md" px={3} py={1}>
                  {formatNumber(staff.recommendation_count)} recommendations
                </Badge>
              </HStack>

              <Grid templateColumns="repeat(3, 1fr)" gap={4}>
                <VStack align="start" spacing={1}>
                  <Text fontSize="xs" color="purple.300">Conversion Rate</Text>
                  <Text fontSize="xl" fontWeight="bold" color="purple.400">
                    {(staff.recommendation_conversion_rate * 100).toFixed(1)}%
                  </Text>
                </VStack>

                <VStack align="start" spacing={1}>
                  <Text fontSize="xs" color="purple.300">Successful Recs</Text>
                  <Text fontSize="xl" fontWeight="bold" color="white">
                    {Math.floor(staff.recommendation_count * staff.recommendation_conversion_rate)}
                  </Text>
                </VStack>

                <VStack align="start" spacing={1}>
                  <Text fontSize="xs" color="purple.300">Top Category</Text>
                  <Badge colorScheme="green" fontSize="sm" textTransform="capitalize">
                    {staff.top_product_category}
                  </Badge>
                </VStack>
              </Grid>
            </Box>

            {/* Performance Trend Chart */}
            {trendData && trendData.length > 0 && (
              <Box>
                <Text fontSize="md" fontWeight="bold" color="white" mb={3}>
                  Sales Trend
                </Text>
                <Box p={4} bg="slate.750" borderRadius="md">
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis
                        dataKey="date"
                        stroke="#94a3b8"
                        tick={{ fill: '#94a3b8' }}
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return `${date.getMonth() + 1}/${date.getDate()}`;
                        }}
                      />
                      <YAxis
                        stroke="#94a3b8"
                        tick={{ fill: '#94a3b8' }}
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #475569',
                          borderRadius: '8px',
                        }}
                        labelStyle={{ color: '#94a3b8' }}
                        formatter={(value: number) => [formatCurrency(value), 'Sales']}
                      />
                      <Line
                        type="monotone"
                        dataKey="sales"
                        stroke="#22c55e"
                        strokeWidth={2}
                        dot={{ fill: '#22c55e', r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </Box>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

export default StaffDetailModal;
