import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';

interface MyOrdersScreenProps {
  onBack: () => void;
}

const STATUS_LABELS: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'Pending', color: 'text-yellow-400', bgColor: 'bg-yellow-400/10' },
  accepted: { label: 'Driver Assigned', color: 'text-blue-400', bgColor: 'bg-blue-400/10' },
  picked_up: { label: 'Picked Up', color: 'text-purple-400', bgColor: 'bg-purple-400/10' },
  en_route: { label: 'On The Way', color: 'text-[#F26A2E]', bgColor: 'bg-[#F26A2E]/10' },
  delivered: { label: 'Delivered', color: 'text-green-400', bgColor: 'bg-green-400/10' },
  completed: { label: 'Completed', color: 'text-green-400', bgColor: 'bg-green-400/10' },
  cancelled: { label: 'Cancelled', color: 'text-red-400', bgColor: 'bg-red-400/10' },
};

export const MyOrdersScreen: React.FC<MyOrdersScreenProps> = ({ onBack }) => {
  // Fetch orders from Convex - using a simple query that gets recent orders
  // In production, this would filter by user ID
  const rawOrders = useQuery(api.orders.listOrders) || [];

  // Sort orders: active orders first (not delivered/completed/cancelled), then by date
  const orders = [...rawOrders].sort((a, b) => {
    const activeStatuses = ['pending', 'accepted', 'picked_up', 'en_route'];
    const aIsActive = activeStatuses.includes(a.status);
    const bIsActive = activeStatuses.includes(b.status);

    // Active orders come first
    if (aIsActive && !bIsActive) return -1;
    if (!aIsActive && bIsActive) return 1;

    // Within same group, sort by creation time (newest first)
    return b._creationTime - a._creationTime;
  });

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getStatusInfo = (status: string) => {
    return STATUS_LABELS[status] || { label: status, color: 'text-gray-400', bgColor: 'bg-gray-400/10' };
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="p-2 bg-[#232C33] rounded-xl border border-[#2D3748]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-white">My Orders</h1>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-20 h-20 bg-[#232C33] rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#718096]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h3 className="text-white font-bold mb-2">No orders yet</h3>
          <p className="text-[#718096] text-sm text-center">
            Your order history will appear here once you place your first order.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const statusInfo = getStatusInfo(order.status);
            const isActive = ['pending', 'accepted', 'picked_up', 'en_route'].includes(order.status);

            return (
              <div
                key={order._id}
                className={`bg-[#232C33] rounded-2xl p-4 border ${
                  isActive ? 'border-[#F26A2E]/50' : 'border-[#2D3748]'
                }`}
              >
                {/* Order Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-bold">
                        Order #{order._id.slice(-6).toUpperCase()}
                      </span>
                      {isActive && (
                        <span className="w-2 h-2 bg-[#F26A2E] rounded-full animate-pulse" />
                      )}
                    </div>
                    <p className="text-[#718096] text-xs">
                      {formatDate(order._creationTime)}
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full ${statusInfo.bgColor}`}>
                    <span className={`text-xs font-bold ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                </div>

                {/* Order Type Badge */}
                <div className="flex items-center gap-2 mb-3">
                  <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${
                    order.orderType === 'delivery' ? 'bg-blue-500/10' : 'bg-[#F26A2E]/10'
                  }`}>
                    {order.orderType === 'delivery' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-[#F26A2E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    )}
                    <span className={`text-xs font-medium ${
                      order.orderType === 'delivery' ? 'text-blue-400' : 'text-[#F26A2E]'
                    }`}>
                      {order.orderType === 'delivery' ? 'Delivery' : 'Pickup'}
                    </span>
                  </div>

                  {order.driverName && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#1C1630]">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-[#718096]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-xs text-[#A0AEC0]">{order.driverName}</span>
                    </div>
                  )}
                </div>

                {/* Items Summary */}
                <div className="bg-[#1C1630] rounded-xl p-3 mb-3">
                  <div className="text-[#A0AEC0] text-sm">
                    {order.items.slice(0, 2).map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center py-1">
                        <span className="truncate flex-1 mr-2">
                          {item.quantity}x {item.name}
                        </span>
                        <span className="text-white font-medium">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                    {order.items.length > 2 && (
                      <p className="text-[#718096] text-xs mt-1">
                        +{order.items.length - 2} more item{order.items.length - 2 > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between items-center pt-2 border-t border-[#2D3748]">
                  <span className="text-[#718096] text-sm">Total</span>
                  <span className="text-white font-bold text-lg">
                    ${order.total?.toFixed(2) || '0.00'}
                  </span>
                </div>

                {/* Delivery Address (if delivery) */}
                {order.orderType === 'delivery' && order.deliveryAddress && (
                  <div className="mt-3 pt-3 border-t border-[#2D3748]">
                    <div className="flex items-start gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#718096] mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <p className="text-[#A0AEC0] text-sm flex-1">{order.deliveryAddress}</p>
                    </div>
                  </div>
                )}

                {/* Progress Bar for Active Orders */}
                {isActive && (
                  <div className="mt-4">
                    <div className="flex gap-1">
                      {['pending', 'accepted', 'picked_up', 'en_route', 'delivered'].map((s, idx) => {
                        const currentIdx = ['pending', 'accepted', 'picked_up', 'en_route', 'delivered'].indexOf(order.status);
                        return (
                          <div
                            key={s}
                            className={`h-1.5 flex-1 rounded-full transition-colors ${
                              idx <= currentIdx ? 'bg-[#F26A2E]' : 'bg-[#2D3748]'
                            }`}
                          />
                        );
                      })}
                    </div>
                    <div className="flex justify-between mt-2 text-[10px] text-[#718096]">
                      <span>Placed</span>
                      <span>Assigned</span>
                      <span>Picked Up</span>
                      <span>En Route</span>
                      <span>Delivered</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
