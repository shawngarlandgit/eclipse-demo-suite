import { useMemo, useState } from 'react';
import {
  Box,
  Grid,
  Heading,
  Text,
  Flex,
  Button,
  Avatar,
  Progress,
  StatLabel,
  StatNumber,
  StatHelpText,
  Spinner,
  useToast,
  HStack,
} from '@chakra-ui/react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { useCurrentDispensary } from '../hooks/useAuth';
import KpiStatCard from '../components/common/KpiStatCard';
import PageHeader from '../components/layout/PageHeader';
import KpiGrid from '../components/common/KpiGrid';
import StatusPill from '../components/common/StatusPill';
import {
  DispatchListCard,
  DispatchPanel,
  DispatchStatTile,
  DispatchRow,
  DispatchInline,
  DispatchStack,
  DispatchEmptyState,
  DispatchStatGrid,
} from '../modules/dispatch/components/DispatchPrimitives';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  picked_up: 'Picked Up',
  en_route: 'En Route',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const COLUMN_META = {
  pending: { label: 'Pending', amountColor: 'orange.300' },
  active: { label: 'Active', amountColor: 'orange.200' },
  completed: { label: 'Completed', amountColor: 'teal.300' },
} as const;

const DispatchPage = () => {
  const [activeTab, setActiveTab] = useState<'orders' | 'drivers'>('orders');

  const isGeneratedDriverName = (name?: string) => {
    const raw = String(name ?? '').trim();
    if (!raw) return true;
    return /^driver(\b|$)/i.test(raw);
  };

  const formatDriverCode = (code?: string) => {
    const raw = String(code ?? '').trim();
    if (!raw) return 'Code: Unassigned';
    if (raw.length > 14) return `Code: ${raw.slice(0, 6)}…${raw.slice(-4)}`;
    return `Code: ${raw}`;
  };

  const formatDeliveryCount = (count?: number) => {
    const value = count ?? 0;
    return value === 1 ? '1 delivery' : `${value} deliveries`;
  };

  const toast = useToast();
  const dispensary = useCurrentDispensary();

  const orders = useQuery(
    api.orders.getAllOrders,
    dispensary ? { dispensaryId: dispensary._id } : 'skip'
  );

  const drivers = useQuery(
    api.orders.getAllDrivers,
    dispensary ? { dispensaryId: dispensary._id } : 'skip'
  );

  const driverRoster = useMemo(() => {
    const driverDocs = Array.isArray(drivers) ? [...drivers] : [];

    return driverDocs
      .slice()
      .sort((a, b) => String(a?.driverId ?? '').localeCompare(String(b?.driverId ?? '')))
      .map((d, idx) => {
        const fallbackNum = idx + 1;
        const rawName = String(d?.name ?? '').trim();
        const displayName = isGeneratedDriverName(rawName) ? `Driver ${fallbackNum}` : rawName || `Driver ${fallbackNum}`;
        const rawId = String(d?.driverId ?? '').trim();
        const displayCode = rawId || `DRV-${String(fallbackNum).padStart(3, '0')}`;

        return {
          ...d,
          __displayName: displayName,
          __displayCode: displayCode,
          __role: 'driver',
          __onShift: Boolean(d?.isOnline),
        };
      });
  }, [drivers]);

  const metrics = useQuery(
    api.orders.getDeliveryMetrics,
    dispensary ? { dispensaryId: dispensary._id } : 'skip'
  );

  const seedOrders = useMutation(api.orders.seedOrders);

  const handleSeedOrders = async () => {
    if (!dispensary) return;
    try {
      const result = await seedOrders({ dispensaryId: dispensary._id });
      toast({
        title: 'Test Data Created',
        description: result.message,
        status: 'success',
        duration: 3000,
      });
    } catch (_error) {
      toast({
        title: 'Error',
        description: 'Failed to create test data',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const getTimeSince = (timestamp: number) => {
    const minutes = Math.floor((Date.now() - timestamp) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m ago`;
  };

  const pendingOrders = orders?.filter((o) => o.status === 'pending') || [];
  const activeOrders = orders?.filter((o) => ['accepted', 'picked_up', 'en_route'].includes(o.status)) || [];
  const completedOrders = orders?.filter((o) => o.status === 'delivered') || [];

  if (dispensary === undefined) {
    return (
      <Flex justify="center" align="center" height="400px">
        <Spinner size="xl" color="orange.500" />
      </Flex>
    );
  }

  if (dispensary === null) {
    return (
      <Flex direction="column" justify="center" align="center" height="400px">
        <Text fontSize="lg" color="slate.400" mb={2}>No dispensary found</Text>
        <Text fontSize="sm" color="slate.500">Please seed the database first</Text>
      </Flex>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Delivery Dispatch"
        description="Real-time order tracking and driver management"
        mb={6}
        actions={(
          <>
            <Button
              size="sm"
              colorScheme="gray"
              onClick={handleSeedOrders}
              isDisabled={!dispensary}
            >
              + Seed Test Data
            </Button>
            <Button
              size="sm"
              colorScheme={activeTab === 'orders' ? 'orange' : 'gray'}
              onClick={() => setActiveTab('orders')}
            >
              Orders
            </Button>
            <Button
              size="sm"
              colorScheme={activeTab === 'drivers' ? 'orange' : 'gray'}
              onClick={() => setActiveTab('drivers')}
            >
              Drivers
            </Button>
          </>
        )}
      />

      <KpiGrid mb={4}>
        <KpiStatCard label="Orders Today" value={metrics?.totalOrdersToday ?? 0} tone="info" />
        <KpiStatCard label="Pending" value={metrics?.pendingOrders ?? 0} tone="warning" />
        <KpiStatCard label="Active Deliveries" value={metrics?.activeDeliveries ?? 0} tone="info" />
        <KpiStatCard label="Completed" value={metrics?.completedToday ?? 0} tone="success" />
        <KpiStatCard label="Online Drivers" value={metrics?.onlineDrivers ?? 0} tone="secondary" />
      </KpiGrid>

      <Grid templateColumns={{ base: '1fr', lg: activeTab === 'orders' ? '320px 1fr' : '1fr' }} gap={6}>
        {activeTab === 'orders' && (
          <DispatchStack spacing={4} align="stretch">
            <DispatchPanel>
              <DispatchInline justify="space-between" mb={4}>
                <Heading size="sm" color="white">
                  Drivers ({driverRoster.length})
                </Heading>
                <StatusPill tone="default">Live</StatusPill>
              </DispatchInline>
              {driverRoster.length === 0 ? (
                <Text fontSize="sm" color="slate.400">
                  No drivers registered
                </Text>
              ) : (
                <DispatchStack
                  spacing={2}
                  align="stretch"
                  maxH={{ base: 'auto', lg: 'calc(100vh - 260px)' }}
                  overflowY={{ lg: 'auto' }}
                  pr={{ lg: 1 }}
                >
                  {driverRoster.map((driver) => (
                    <DispatchListCard key={driver._id} p={3.5}>
                      <DispatchRow align="center" justify="space-between" gap={3}>
                        <DispatchRow align="center" gap={3} minW={0} flex={1}>
                          <Avatar
                            size="sm"
                            name={driver.__displayName}
                            bg={driver.isOnline ? 'teal.500' : 'slate.600'}
                          />
                          <Box minW={0}>
                            <Text fontSize="md" fontWeight="bold" color="white" noOfLines={1}>
                              {driver.__displayName}
                            </Text>
                            <Text fontSize="sm" color="slate.300" fontFamily="mono" fontWeight="medium" noOfLines={1}>
                              {formatDriverCode(driver.__displayCode)}
                            </Text>
                            <DispatchInline spacing={2} mt={1} wrap="wrap">
                              <StatusPill tone="default" fontSize="xs">
                                {String(driver.__role || 'driver').toUpperCase()}
                              </StatusPill>
                              <StatusPill tone={driver.__onShift ? 'success' : 'offline'} fontSize="xs">
                                {driver.__onShift ? 'ON SHIFT' : 'OFF SHIFT'}
                              </StatusPill>
                            </DispatchInline>
                          </Box>
                        </DispatchRow>
                        <DispatchStack spacing={0} align="end" flexShrink={0} minW="fit-content">
                          <StatusPill tone={driver.isOnline ? 'success' : 'offline'} fontSize="xs">
                            {driver.isOnline ? 'Online' : 'Offline'}
                          </StatusPill>
                          <Text fontSize="xs" color="slate.300" whiteSpace="nowrap">
                            {formatDeliveryCount(driver.completedDeliveries)}
                          </Text>
                        </DispatchStack>
                      </DispatchRow>
                    </DispatchListCard>
                  ))}
                </DispatchStack>
              )}
            </DispatchPanel>
          </DispatchStack>
        )}

        <DispatchPanel>
          <Heading size="md" mb={4} color="white">
            {activeTab === 'orders' ? 'Dispatch Board' : 'Driver Activity'}
          </Heading>

          {activeTab === 'orders' && (
            <>
              {orders?.length === 0 ? (
                <DispatchEmptyState>
                  <Text fontSize="lg" color="slate.400" mb={2}>
                    No orders yet
                  </Text>
                  <Text fontSize="sm" color="slate.500" mb={4}>
                    Orders will appear here in real-time
                  </Text>
                  <Button colorScheme="orange" size="sm" onClick={handleSeedOrders}>
                    Create Test Orders
                  </Button>
                </DispatchEmptyState>
              ) : (
                <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={4}>
                  <DispatchPanel bg="slate.900" h="full">
                    <DispatchRow justify="space-between" align="center" mb={3}>
                      <StatusPill tone="pending">{COLUMN_META.pending.label}</StatusPill>
                      <Text color="slate.400" fontSize="sm">{pendingOrders.length}</Text>
                    </DispatchRow>
                    <DispatchStack
                      spacing={3}
                      align="stretch"
                      maxH={{ base: 'auto', lg: 'calc(100vh - 320px)' }}
                      overflowY={{ lg: 'auto' }}
                      pr={{ lg: 1 }}
                    >
                      {pendingOrders.map((order) => (
                        <DispatchListCard key={order._id}>
                          <DispatchRow justify="space-between" align="start" mb={1} gap={3}>
                            <Box minW={0}>
                              <Text fontWeight="bold" color="white" noOfLines={1}>{order.customerName}</Text>
                              <Text fontSize="xs" color="slate.400" noOfLines={1}>{order.deliveryAddress}</Text>
                            </Box>
                            <Text fontWeight="bold" color={COLUMN_META.pending.amountColor} fontSize="sm" flexShrink={0}>
                              ${order.total.toFixed(2)}
                            </Text>
                          </DispatchRow>
                          <DispatchRow justify="space-between" align="center" mt={2}>
                            <Text fontSize="xs" color="slate.400">
                              {order.items.length} item{order.items.length !== 1 ? 's' : ''} • {getTimeSince(order.createdAt)}
                            </Text>
                            <StatusPill tone="pending" fontSize="xs">Awaiting driver</StatusPill>
                          </DispatchRow>
                        </DispatchListCard>
                      ))}
                      {pendingOrders.length === 0 && (
                        <Text color="slate.500" fontSize="sm" textAlign="center" py={6}>No pending orders</Text>
                      )}
                    </DispatchStack>
                  </DispatchPanel>

                  <DispatchPanel bg="slate.900" h="full">
                    <DispatchRow justify="space-between" align="center" mb={3}>
                      <StatusPill tone="active">{COLUMN_META.active.label}</StatusPill>
                      <Text color="slate.400" fontSize="sm">{activeOrders.length}</Text>
                    </DispatchRow>
                    <DispatchStack
                      spacing={3}
                      align="stretch"
                      maxH={{ base: 'auto', lg: 'calc(100vh - 320px)' }}
                      overflowY={{ lg: 'auto' }}
                      pr={{ lg: 1 }}
                    >
                      {activeOrders.map((order) => (
                        <DispatchListCard key={order._id}>
                          <DispatchRow justify="space-between" align="start" mb={1} gap={3}>
                            <Box minW={0}>
                              <HStack spacing={2}>
                                <Text fontWeight="bold" color="white" noOfLines={1}>{order.customerName}</Text>
                                <StatusPill
                                  tone={order.status === 'cancelled' ? 'critical' : order.status === 'delivered' ? 'success' : 'active'}
                                  fontSize="xs"
                                >
                                  {STATUS_LABELS[order.status]}
                                </StatusPill>
                              </HStack>
                              <Text fontSize="xs" color="slate.400" noOfLines={1}>{order.deliveryAddress}</Text>
                            </Box>
                            <Text fontWeight="bold" color={COLUMN_META.active.amountColor} fontSize="sm" flexShrink={0}>
                              ${order.total.toFixed(2)}
                            </Text>
                          </DispatchRow>
                          <DispatchRow justify="space-between" align="center" mt={2}>
                            <Text fontSize="xs" color="slate.400">
                              {order.items.length} item{order.items.length !== 1 ? 's' : ''} • {getTimeSince(order.createdAt)}
                            </Text>
                            <Text fontSize="xs" fontWeight="bold" color="orange.300">
                              {order.driverName ? `Driver: ${order.driverName}` : 'Driver: Unassigned'}
                            </Text>
                          </DispatchRow>
                          {order.status === 'en_route' ? (
                            <Progress value={60} colorScheme="orange" size="xs" mt={2} borderRadius="full" bg="slate.700" />
                          ) : null}
                        </DispatchListCard>
                      ))}
                      {activeOrders.length === 0 && (
                        <Text color="slate.500" fontSize="sm" textAlign="center" py={6}>No active deliveries</Text>
                      )}
                    </DispatchStack>
                  </DispatchPanel>

                  <DispatchPanel bg="slate.900" h="full">
                    <DispatchRow justify="space-between" align="center" mb={3}>
                      <StatusPill tone="success">{COLUMN_META.completed.label}</StatusPill>
                      <Text color="slate.400" fontSize="sm">{completedOrders.length}</Text>
                    </DispatchRow>
                    <DispatchStack
                      spacing={3}
                      align="stretch"
                      maxH={{ base: 'auto', lg: 'calc(100vh - 320px)' }}
                      overflowY={{ lg: 'auto' }}
                      pr={{ lg: 1 }}
                    >
                      {completedOrders.slice(0, 10).map((order) => (
                        <DispatchListCard
                          key={order._id}
                          opacity={0.9}
                          _hover={{ borderColor: 'slate.600', bg: 'slate.800', opacity: 1 }}
                        >
                          <DispatchRow justify="space-between" align="start" mb={1} gap={3}>
                            <Box minW={0}>
                              <Text fontWeight="bold" color="white" noOfLines={1}>{order.customerName}</Text>
                              <Text fontSize="xs" color="slate.400" noOfLines={1}>{order.deliveryAddress}</Text>
                            </Box>
                            <Text fontWeight="bold" color={COLUMN_META.completed.amountColor} fontSize="sm" flexShrink={0}>
                              ${order.total.toFixed(2)}
                            </Text>
                          </DispatchRow>
                          <DispatchRow justify="space-between" align="center" mt={2}>
                            <Text fontSize="xs" color="slate.400">
                              {order.deliveredAt ? formatTime(order.deliveredAt) : 'Delivered'}
                            </Text>
                            <Text fontSize="xs" color="slate.400">
                              {order.driverName ? `By ${order.driverName}` : 'Driver unknown'}
                            </Text>
                          </DispatchRow>
                        </DispatchListCard>
                      ))}
                      {completedOrders.length === 0 && (
                        <Text color="slate.500" fontSize="sm" textAlign="center" py={6}>No completed orders</Text>
                      )}
                    </DispatchStack>
                  </DispatchPanel>
                </Grid>
              )}
            </>
          )}

          {activeTab === 'drivers' && (
            <DispatchStack spacing={4} align="stretch">
              {driverRoster.map((driver) => (
                <DispatchListCard key={driver._id} p={4}>
                  <DispatchRow justify="space-between" align="center">
                    <DispatchRow align="center" gap={4}>
                      <Avatar size="md" name={driver.__displayName} bg={driver.isOnline ? 'teal.500' : 'slate.600'} />
                      <Box>
                        <Text fontWeight="bold" fontSize="lg" color="white">{driver.__displayName}</Text>
                        <Text fontSize="sm" color="slate.400" fontFamily="mono">{formatDriverCode(driver.__displayCode)}</Text>
                        <DispatchInline spacing={2} mt={1} wrap="wrap">
                          <StatusPill tone="default" fontSize="xs">
                            {String(driver.__role || 'driver').toUpperCase()}
                          </StatusPill>
                          <StatusPill tone={driver.__onShift ? 'success' : 'offline'} fontSize="xs">
                            {driver.__onShift ? 'On shift' : 'Off shift'}
                          </StatusPill>
                        </DispatchInline>
                      </Box>
                    </DispatchRow>
                    <DispatchStack align="end" spacing={1}>
                      <StatusPill tone={driver.isOnline ? 'success' : 'offline'} fontSize="sm">
                        {driver.isOnline ? 'Online' : 'Offline'}
                      </StatusPill>
                      <Text fontSize="sm" color="slate.300">Rating {driver.rating.toFixed(1)}</Text>
                    </DispatchStack>
                  </DispatchRow>
                  <DispatchStatGrid>
                    <DispatchStatTile>
                      <StatLabel color="slate.400">Deliveries</StatLabel>
                      <StatNumber color="white">{formatDeliveryCount(driver.completedDeliveries)}</StatNumber>
                    </DispatchStatTile>
                    <DispatchStatTile>
                      <StatLabel color="slate.400">Tips Earned</StatLabel>
                      <StatNumber color="teal.300">${driver.totalTips}</StatNumber>
                    </DispatchStatTile>
                    <DispatchStatTile>
                      <StatLabel color="slate.400">Last Active</StatLabel>
                      <StatHelpText color="slate.400">
                        {driver.lastLoginAt ? getTimeSince(driver.lastLoginAt) : 'Never'}
                      </StatHelpText>
                    </DispatchStatTile>
                  </DispatchStatGrid>
                </DispatchListCard>
              ))}

              {driverRoster.length === 0 && (
                <DispatchEmptyState>
                  <Text fontSize="lg" color="slate.400" mb={2}>No drivers registered</Text>
                  <Text fontSize="sm" color="slate.500">Drivers will appear when they log in to the driver app</Text>
                </DispatchEmptyState>
              )}
            </DispatchStack>
          )}
        </DispatchPanel>
      </Grid>
    </Box>
  );
};

export default DispatchPage;
