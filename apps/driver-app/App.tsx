import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from './convex/_generated/api';
import { DriverLogin } from './components/DriverLogin';
import { Dashboard } from './components/Dashboard';
import { ActiveDeliveryScreen } from './components/ActiveDeliveryScreen';
import { OrderDetailScreen } from './components/OrderDetailScreen';
import type { Id } from './convex/_generated/dataModel';
import type { PaymentData } from './components/PaymentCollectionModal';

// Types
export interface OrderItem {
  productId?: string;
  name: string;
  category?: string;
  quantity: number;
  price: number;
}

export interface Order {
  _id: Id<"orders">;
  _creationTime: number;
  dispensaryId: Id<"dispensaries">;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  driverId?: string;
  driverName?: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  tipAmount?: number;
  preTipAmount?: number;
  paymentMethod?: 'cash' | 'debit' | 'ach' | 'mobile_pay';
  paymentStatus?: string;
  paymentId?: Id<"payments">;
  status: string;
  deliveryAddress: string;
  deliveryNotes?: string;
  pickupTime: string;
  estimatedDeliveryTime?: number;
  createdAt: number;
  updatedAt: number;
  acceptedAt?: number;
  pickedUpAt?: number;
  deliveredAt?: number;
}

export interface Driver {
  _id: Id<"drivers">;
  dispensaryId: Id<"dispensaries">;
  driverId: string;
  name: string;
  phone?: string;
  email?: string;
  isOnline: boolean;
  isActive: boolean;
  completedDeliveries: number;
  totalTips: number;
  rating: number;
}

export default function App() {
  const [driverId, setDriverId] = useState<string | null>(() => {
    return localStorage.getItem('hazy-driver-id');
  });
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  const defaultDispensaryId = import.meta.env.VITE_DEFAULT_DISPENSARY_ID as Id<"dispensaries"> | undefined;

  // Get dispensary (prefer explicit env value to avoid runtime dependency on getFirst)
  const firstDispensary = useQuery(
    api.dispensaries.getFirst,
    defaultDispensaryId ? "skip" : {}
  );
  const dispensary = defaultDispensaryId
    ? ({ _id: defaultDispensaryId } as { _id: Id<"dispensaries"> })
    : firstDispensary;

  // Get driver profile
  const driver = useQuery(
    api.orders.getDriver,
    driverId ? { driverId } : "skip"
  );

  // Get pending orders
  const pendingOrders = useQuery(
    api.orders.getPendingOrders,
    dispensary ? { dispensaryId: dispensary._id } : "skip"
  );

  // Get driver's active order
  const driverActiveOrder = useQuery(
    api.orders.getDriverActiveOrder,
    driverId ? { driverId } : "skip"
  );

  // Mutations
  const loginDriver = useMutation(api.orders.driverLogin);
  const setOnline = useMutation(api.orders.setDriverOnline);
  const acceptOrderMutation = useMutation(api.orders.acceptOrder);
  const updateStatus = useMutation(api.orders.updateOrderStatus);
  const completeDeliveryMutation = useMutation(api.orders.completeDelivery);
  const collectPaymentMutation = useMutation(api.payments.collectPayment);

  // Sync active order from Convex
  useEffect(() => {
    if (driverActiveOrder) {
      setActiveOrder(driverActiveOrder as Order);
    }
  }, [driverActiveOrder]);

  const handleLogin = async (id: string) => {
    if (!dispensary) return;

    try {
      await loginDriver({
        driverId: id,
        dispensaryId: dispensary._id,
      });
      setDriverId(id);
      localStorage.setItem('hazy-driver-id', id);
    } catch (error) {
      console.error('Login failed:', error);
      alert('Login failed. Please try again.');
    }
  };

  const handleLogout = () => {
    if (driverId) {
      setOnline({ driverId, isOnline: false });
    }
    setDriverId(null);
    localStorage.removeItem('hazy-driver-id');
  };

  const handleToggleOnline = async (online: boolean) => {
    if (!driverId) return;
    await setOnline({ driverId, isOnline: online });
  };

  const handleAcceptOrder = async (order: Order) => {
    if (!driverId || !driver) return;

    try {
      await acceptOrderMutation({
        orderId: order._id,
        driverId,
        driverName: driver.name,
      });
      setActiveOrder(order);
      setViewingOrder(null); // Close detail view after accepting
    } catch (error) {
      console.error('Failed to accept order:', error);
      alert('Failed to accept order. It may have been taken by another driver.');
    }
  };

  const handleViewOrderDetails = (order: Order) => {
    setViewingOrder(order);
  };

  const handleUpdateStatus = async (status: string) => {
    if (!activeOrder || !driverId) return;

    await updateStatus({
      orderId: activeOrder._id,
      status,
      driverId,
    });

    // Update local state
    setActiveOrder(prev => prev ? { ...prev, status } : null);
  };

  const handleCompleteDelivery = async (paymentData: PaymentData) => {
    if (!activeOrder || !driverId) return;

    try {
      // If order has a paymentId, use the new payment collection flow
      if (activeOrder.paymentId) {
        await collectPaymentMutation({
          paymentId: activeOrder.paymentId,
          driverId,
          tipAmount: paymentData.tipAmount,
          cashTendered: paymentData.cashTendered,
          changeGiven: paymentData.changeGiven,
          approvalCode: paymentData.approvalCode,
          cardLastFour: paymentData.cardLastFour,
          cardBrand: paymentData.cardBrand,
        });
      } else {
        // Fallback to legacy flow (for orders without payment records)
        await completeDeliveryMutation({
          orderId: activeOrder._id,
          driverId,
          tipAmount: paymentData.tipAmount,
        });
      }

      setActiveOrder(null);
    } catch (error) {
      console.error('Failed to complete delivery:', error);
      alert('Failed to complete delivery. Please try again.');
    }
  };

  // Show login if not authenticated
  if (!driverId) {
    return <DriverLogin onLogin={handleLogin} isLoading={!dispensary} />;
  }

  // Show order detail screen (for viewing before accepting)
  if (viewingOrder) {
    return (
      <OrderDetailScreen
        order={viewingOrder}
        onAccept={() => handleAcceptOrder(viewingOrder)}
        onBack={() => setViewingOrder(null)}
      />
    );
  }

  // Show active delivery screen
  if (activeOrder && ['accepted', 'picked_up', 'en_route'].includes(activeOrder.status)) {
    return (
      <ActiveDeliveryScreen
        order={activeOrder}
        onUpdateStatus={handleUpdateStatus}
        onComplete={handleCompleteDelivery}
        onBack={() => setActiveOrder(null)}
      />
    );
  }

  // Show dashboard
  return (
    <Dashboard
      driver={driver as Driver | undefined}
      pendingOrders={(pendingOrders as Order[]) || []}
      onAcceptOrder={handleAcceptOrder}
      onViewOrderDetails={handleViewOrderDetails}
      onToggleOnline={handleToggleOnline}
      onLogout={handleLogout}
      onViewActiveOrder={() => driverActiveOrder && setActiveOrder(driverActiveOrder as Order)}
      activeOrder={driverActiveOrder as Order | undefined}
    />
  );
}
