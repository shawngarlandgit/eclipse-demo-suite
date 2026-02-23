import {
  Box,
  Heading,
  Text,
  HStack,
  VStack,
  Badge,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  SimpleGrid,
} from '@chakra-ui/react';
import { useDashboardKPIs, useSalesTrend, useTopProducts } from '../hooks/useDashboard';
import { useStaffPerformance } from '../hooks/useStaff';
import RevenueChart from '../modules/dashboard/components/RevenueChart';
import DateRangeSelector from '../modules/analytics/components/DateRangeSelector';
import { formatCurrency } from '../utils/formatters';
import { DraggableGrid, DraggableWidget, EditModeToolbar } from '../components/grid';

/**
 * Dashboard Option 5: Tabbed Panels
 * Group related info into tabs instead of stacking everything vertically
 * Now with drag-and-drop customization!
 */
function DashboardOption5() {
  const { data: kpis } = useDashboardKPIs();
  const { data: salesTrend, isLoading: trendLoading } = useSalesTrend();
  const { data: topProducts } = useTopProducts(10);
  const { data: staffPerformance } = useStaffPerformance();

  const CompactStat = ({ label, value, change, prefix = '' }: {
    label: string;
    value: string | number;
    change?: number;
    prefix?: string;
  }) => (
    <Stat>
      <StatLabel fontSize="xs" color="slate.400">{label}</StatLabel>
      <StatNumber fontSize="xl" color="white">{prefix}{typeof value === 'number' ? value.toLocaleString() : value}</StatNumber>
      {change !== undefined && (
        <StatHelpText mb={0}>
          <StatArrow type={change >= 0 ? 'increase' : 'decrease'} />
          {Math.abs(change).toFixed(1)}%
        </StatHelpText>
      )}
    </Stat>
  );

  return (
    <Box>
      <HStack justify="space-between" mb={4}>
        <Box>
          <Heading size="lg" color="white">Dashboard</Heading>
          <Text fontSize="sm" color="slate.400">Option 5: Tabbed Panels</Text>
        </Box>
        <HStack spacing={3}>
          <DateRangeSelector />
          <Badge colorScheme="green" fontSize="sm" px={3} py={1}>Layout Option 5</Badge>
          <EditModeToolbar dashboardStyle="option-5" />
        </HStack>
      </HStack>

      {/* Draggable Grid Layout */}
      <DraggableGrid dashboardStyle="option-5">
        {/* Compact Summary Row */}
        <DraggableWidget key="summary-bar" id="summary-bar" noPadding>
          <Box bg="slate.800" borderRadius="md" p={4} h="100%">
            <SimpleGrid columns={{ base: 2, md: 4, lg: 8 }} spacing={4}>
              <CompactStat label="Revenue" value={formatCurrency(kpis?.revenue_today || 0)} change={12.5} />
              <CompactStat label="MTD" value={formatCurrency(kpis?.revenue_mtd || 0)} change={8.2} />
              <CompactStat label="Transactions" value={kpis?.transactions_today || 0} change={5.1} />
              <CompactStat label="Avg Ticket" value={formatCurrency(kpis?.avg_transaction_value || 0)} change={-2.3} />
              <CompactStat label="Customers" value={kpis?.customers_new_today || 0} />
              <CompactStat label="Repeat %" value={`${(kpis?.customers_repeat_pct || 0).toFixed(0)}%`} change={3.2} />
              <CompactStat label="Inv Health" value={`${(kpis?.inventory_health_pct || 0).toFixed(0)}%`} />
              <CompactStat label="Staff" value={kpis?.staff_count || 0} />
            </SimpleGrid>
          </Box>
        </DraggableWidget>

        {/* Tabbed Content */}
        <DraggableWidget key="tab-panels" id="tab-panels" noPadding>
          <Tabs variant="soft-rounded" colorScheme="green" h="100%">
            <TabList bg="slate.800" p={2} borderRadius="md" mb={4} flexWrap="wrap" gap={2}>
              <Tab _selected={{ bg: 'green.600', color: 'white' }} color="slate.400">
                Overview
              </Tab>
              <Tab _selected={{ bg: 'green.600', color: 'white' }} color="slate.400">
                Products
              </Tab>
              <Tab _selected={{ bg: 'green.600', color: 'white' }} color="slate.400">
                Staff
              </Tab>
              <Tab _selected={{ bg: 'green.600', color: 'white' }} color="slate.400">
                Inventory
              </Tab>
              <Tab _selected={{ bg: 'green.600', color: 'white' }} color="slate.400">
                Compliance
              </Tab>
            </TabList>

            <TabPanels>
              {/* Overview Tab */}
              <TabPanel p={0}>
                <RevenueChart data={salesTrend || []} isLoading={trendLoading} />
              </TabPanel>

              {/* Products Tab */}
              <TabPanel p={0}>
                <Box bg="slate.800" borderRadius="md" overflow="hidden">
                  <Box bg="slate.750" px={4} py={3}>
                    <HStack justify="space-between">
                      <Text fontWeight="semibold" color="white">Top Products by Revenue</Text>
                      <Badge colorScheme="green">{topProducts?.length || 0} products</Badge>
                    </HStack>
                  </Box>
                  <Table size="sm">
                    <Thead>
                      <Tr>
                        <Th color="slate.400" borderColor="slate.700">Rank</Th>
                        <Th color="slate.400" borderColor="slate.700">Product</Th>
                        <Th color="slate.400" borderColor="slate.700">Type</Th>
                        <Th color="slate.400" borderColor="slate.700" isNumeric>Revenue</Th>
                        <Th color="slate.400" borderColor="slate.700" isNumeric>Units</Th>
                        <Th color="slate.400" borderColor="slate.700">Margin</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {topProducts?.map((product, idx) => (
                        <Tr key={product.product_id} _hover={{ bg: 'slate.750' }}>
                          <Td borderColor="slate.700">
                            <Badge
                              colorScheme={idx < 3 ? 'green' : 'gray'}
                              variant={idx < 3 ? 'solid' : 'subtle'}
                            >
                              #{idx + 1}
                            </Badge>
                          </Td>
                          <Td borderColor="slate.700">
                            <Text color="white" fontWeight="medium">{product.product_name}</Text>
                          </Td>
                          <Td borderColor="slate.700">
                            <Badge variant="outline" colorScheme="purple">{product.product_type}</Badge>
                          </Td>
                          <Td borderColor="slate.700" isNumeric>
                            <Text color="green.400" fontWeight="bold">{formatCurrency(product.revenue)}</Text>
                          </Td>
                          <Td borderColor="slate.700" isNumeric>
                            <Text color="slate.300">{product.units_sold}</Text>
                          </Td>
                          <Td borderColor="slate.700" w="150px">
                            <HStack>
                              <Progress value={product.margin} size="sm" colorScheme="green" flex={1} bg="slate.700" borderRadius="full" />
                              <Text fontSize="xs" color="slate.400" w="40px">{(product.margin || 0).toFixed(0)}%</Text>
                            </HStack>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              </TabPanel>

              {/* Staff Tab */}
              <TabPanel p={0}>
                <Box bg="slate.800" borderRadius="md" overflow="hidden">
                  <Box bg="slate.750" px={4} py={3}>
                    <HStack justify="space-between">
                      <Text fontWeight="semibold" color="white">Staff Performance Leaderboard</Text>
                      <Badge colorScheme="purple">{staffPerformance?.length || 0} staff</Badge>
                    </HStack>
                  </Box>
                  <Table size="sm">
                    <Thead>
                      <Tr>
                        <Th color="slate.400" borderColor="slate.700">Rank</Th>
                        <Th color="slate.400" borderColor="slate.700">Staff Member</Th>
                        <Th color="slate.400" borderColor="slate.700" isNumeric>Total Sales</Th>
                        <Th color="slate.400" borderColor="slate.700" isNumeric>Transactions</Th>
                        <Th color="slate.400" borderColor="slate.700" isNumeric>Avg Transaction</Th>
                        <Th color="slate.400" borderColor="slate.700" isNumeric>Sales/Hr</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {staffPerformance?.map((staff, idx) => (
                        <Tr key={staff.user_id} _hover={{ bg: 'slate.750' }}>
                          <Td borderColor="slate.700">
                            <Badge
                              colorScheme={idx < 3 ? 'purple' : 'gray'}
                              variant={idx < 3 ? 'solid' : 'subtle'}
                            >
                              #{idx + 1}
                            </Badge>
                          </Td>
                          <Td borderColor="slate.700">
                            <Text color="white" fontWeight="medium">{staff.full_name}</Text>
                          </Td>
                          <Td borderColor="slate.700" isNumeric>
                            <Text color="green.400" fontWeight="bold">{formatCurrency(staff.sales)}</Text>
                          </Td>
                          <Td borderColor="slate.700" isNumeric>
                            <Text color="slate.300">{staff.transaction_count}</Text>
                          </Td>
                          <Td borderColor="slate.700" isNumeric>
                            <Text color="slate.300">{formatCurrency(staff.avg_transaction_value)}</Text>
                          </Td>
                          <Td borderColor="slate.700" isNumeric>
                            <Text color="slate.300">{(staff.sales_per_hour || 0).toFixed(1)}</Text>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              </TabPanel>

              {/* Inventory Tab */}
              <TabPanel p={0}>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
                  <Box bg="slate.800" borderRadius="md" p={4}>
                    <Text fontSize="xs" color="slate.400" textTransform="uppercase" mb={2}>Inventory Health</Text>
                    <Text fontSize="3xl" fontWeight="bold" color="green.400">{(kpis?.inventory_health_pct || 0).toFixed(0)}%</Text>
                    <Progress value={kpis?.inventory_health_pct || 0} size="sm" colorScheme="green" mt={2} bg="slate.700" borderRadius="full" />
                  </Box>
                  <Box bg="slate.800" borderRadius="md" p={4}>
                    <Text fontSize="xs" color="slate.400" textTransform="uppercase" mb={2}>Low Stock Items</Text>
                    <Text fontSize="3xl" fontWeight="bold" color="yellow.400">{kpis?.low_stock_count || 0}</Text>
                    <Text fontSize="sm" color="slate.500">Require attention</Text>
                  </Box>
                  <Box bg="slate.800" borderRadius="md" p={4}>
                    <Text fontSize="xs" color="slate.400" textTransform="uppercase" mb={2}>Need Retest</Text>
                    <Text fontSize="3xl" fontWeight="bold" color="orange.400">{kpis?.items_needing_retest || 0}</Text>
                    <Text fontSize="sm" color="slate.500">Batches pending</Text>
                  </Box>
                  <Box bg="slate.800" borderRadius="md" p={4}>
                    <Text fontSize="xs" color="slate.400" textTransform="uppercase" mb={2}>Staff On Duty</Text>
                    <Text fontSize="3xl" fontWeight="bold" color="purple.400">{kpis?.staff_count || 0}</Text>
                    <Text fontSize="sm" color="slate.500">Active members</Text>
                  </Box>
                </SimpleGrid>
              </TabPanel>

              {/* Compliance Tab */}
              <TabPanel p={0}>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <Box bg="slate.800" borderRadius="md" p={6}>
                    <VStack align="start" spacing={4}>
                      <Box>
                        <Text fontSize="xs" color="slate.400" textTransform="uppercase" mb={2}>Open Compliance Flags</Text>
                        <HStack>
                          <Text fontSize="4xl" fontWeight="bold" color={kpis?.compliance_flags_open ? 'red.400' : 'green.400'}>
                            {kpis?.compliance_flags_open || 0}
                          </Text>
                          {!kpis?.compliance_flags_open && (
                            <Badge colorScheme="green" ml={2}>All Clear</Badge>
                          )}
                        </HStack>
                      </Box>
                      <Box>
                        <Text fontSize="xs" color="slate.400" textTransform="uppercase" mb={2}>Critical Flags</Text>
                        <HStack>
                          <Text fontSize="4xl" fontWeight="bold" color={kpis?.compliance_flags_critical ? 'red.400' : 'green.400'}>
                            {kpis?.compliance_flags_critical || 0}
                          </Text>
                          {!kpis?.compliance_flags_critical && (
                            <Badge colorScheme="green" ml={2}>None</Badge>
                          )}
                        </HStack>
                      </Box>
                    </VStack>
                  </Box>
                  <Box bg="slate.800" borderRadius="md" p={6}>
                    <Text fontSize="xs" color="slate.400" textTransform="uppercase" mb={4}>Compliance Status</Text>
                    <VStack align="stretch" spacing={3}>
                      <HStack justify="space-between">
                        <Text color="slate.300">License Status</Text>
                        <Badge colorScheme="green">Active</Badge>
                      </HStack>
                      <HStack justify="space-between">
                        <Text color="slate.300">Last Audit</Text>
                        <Text color="white">Dec 1, 2024</Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text color="slate.300">Next Audit Due</Text>
                        <Text color="white">Mar 1, 2025</Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text color="slate.300">METRC Sync</Text>
                        <Badge colorScheme="green">Connected</Badge>
                      </HStack>
                    </VStack>
                  </Box>
                </SimpleGrid>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </DraggableWidget>
      </DraggableGrid>
    </Box>
  );
}

export default DashboardOption5;
