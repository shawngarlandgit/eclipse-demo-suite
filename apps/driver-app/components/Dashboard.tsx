import React, { useState } from 'react';
import { Package, TrendingUp, Star, Clock, MapPin, LogOut, Zap } from 'lucide-react';
import { DeliveryCard } from './DeliveryCard';
import type { Order, Driver } from '../App';

interface DashboardProps {
  driver?: Driver;
  pendingOrders: Order[];
  activeOrder?: Order;
  onAcceptOrder: (order: Order) => void;
  onViewOrderDetails: (order: Order) => void;
  onToggleOnline: (online: boolean) => void;
  onLogout: () => void;
  onViewActiveOrder: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  driver,
  pendingOrders,
  activeOrder,
  onAcceptOrder,
  onViewOrderDetails,
  onToggleOnline,
  onLogout,
  onViewActiveOrder,
}) => {
  const [activeTab, setActiveTab] = useState<'available' | 'history'>('available');
  const isOnline = driver?.isOnline ?? false;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="flex flex-col h-screen bg-[#1C1630] text-white">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#26203f]/95 to-[#1C1630]/95 p-5 pb-6 rounded-b-[28px] shadow-2xl border-b border-white/10 relative overflow-hidden backdrop-blur-md">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#F26A2E] rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10">
          {/* Top row */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
            <p className="text-[#8E8AA0] text-xs uppercase tracking-wider mb-1">
              {getGreeting()}
            </p>
              <h1 className="text-[28px] leading-none font-extrabold text-white">
                {driver?.name || 'Driver'}
              </h1>
              <p className="text-xs text-[#8E8AA0] mt-1 font-mono">
                ID: {driver?.driverId || '---'}
              </p>
              <p className="mt-2 inline-flex text-[10px] font-bold uppercase tracking-[0.12em] bg-[#2CBFAE]/15 text-[#8FE6DC] px-2.5 py-1 rounded-full border border-[#2CBFAE]/25">
                Driver App
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Logout button */}
              <button
                onClick={onLogout}
                className="p-2.5 bg-black/25 rounded-2xl border border-white/10 hover:border-red-500/40 transition-colors"
              >
                <LogOut className="w-5 h-5 text-[#8E8AA0]" />
              </button>

              {/* Online toggle */}
              <button
                onClick={() => onToggleOnline(!isOnline)}
                className={`px-5 py-2.5 rounded-full font-bold text-sm transition-all flex items-center gap-2 ${
                  isOnline
                    ? 'bg-gradient-to-r from-[#127A72] to-[#2CBFAE] text-white border border-[#2CBFAE]/50 shadow-lg shadow-[#2CBFAE]/25'
                    : 'bg-[#34324a] text-[#C2BED0] border border-[#4A4E6B] hover:bg-[#474B68]'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-white pulse-green' : 'bg-[#8E8AA0]'}`}></div>
                {isOnline ? 'ONLINE' : 'OFFLINE'}
              </button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="bg-black/20 backdrop-blur rounded-2xl px-3.5 py-3 border border-white/10">
              <div className="flex items-center gap-2 text-[#A9A4BC] text-[10px] uppercase tracking-[0.12em] mb-1">
                <Package className="w-3.5 h-3.5 text-[#F26A2E]" />
                Deliveries
              </div>
              <span className="text-lg font-bold text-white">{driver?.completedDeliveries ?? 0}</span>
            </div>

            <div className="bg-black/20 backdrop-blur rounded-2xl px-3.5 py-3 border border-white/10">
              <div className="flex items-center gap-2 text-[#A9A4BC] text-[10px] uppercase tracking-[0.12em] mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-[#2CBFAE]" />
                Tips
              </div>
              <span className="text-lg font-bold text-[#8FE6DC]">${driver?.totalTips ?? 0}</span>
            </div>

            <div className="bg-black/20 backdrop-blur rounded-2xl px-3.5 py-3 border border-white/10">
              <div className="flex items-center gap-2 text-[#A9A4BC] text-[10px] uppercase tracking-[0.12em] mb-1">
                <Star className="w-3.5 h-3.5 text-amber-400" />
                Rating
              </div>
              <span className="text-lg font-bold text-white">{driver?.rating?.toFixed(1) ?? '5.0'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Order Banner */}
      {activeOrder && (
        <button
          onClick={onViewActiveOrder}
          className="mx-4 mt-4 p-4 bg-gradient-to-r from-[#146F69] to-[#0E5B55] rounded-3xl shadow-xl shadow-[#2CBFAE]/20 border border-[#2CBFAE]/40 flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/16 rounded-xl border border-white/25 flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <p className="text-white font-bold">Active Delivery</p>
              <p className="text-white/90 text-sm font-medium">{activeOrder.customerName} • {activeOrder.items.length} items</p>
            </div>
          </div>
          <div className="bg-white text-[#0E5B55] px-3 py-1.5 rounded-lg text-sm font-bold group-hover:bg-[#F3FBFA] transition-colors">
            View →
          </div>
        </button>
      )}

      {/* Tabs */}
      <div className="p-4">
        <div className="flex gap-2.5 p-1.5 bg-black/20 border border-white/10 rounded-2xl backdrop-blur">
        <button
          onClick={() => setActiveTab('available')}
          className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === 'available'
              ? 'bg-[#F26A2E] text-white shadow-lg shadow-[#F26A2E]/25'
              : 'bg-transparent text-[#8E8AA0] hover:bg-white/5'
          }`}
        >
          <Clock className="w-4 h-4" />
          Available ({pendingOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === 'history'
              ? 'bg-[#F26A2E] text-white shadow-lg shadow-[#F26A2E]/25'
              : 'bg-transparent text-[#8E8AA0] hover:bg-white/5'
          }`}
        >
          <Package className="w-4 h-4" />
          History
        </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-8 custom-scrollbar">
        {!isOnline && (
          <div className="text-center py-16 fade-in">
            <div className="w-20 h-20 bg-[#232437] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#3A3D58]">
              <MapPin className="w-10 h-10 text-[#2CBFAE]/50" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">You're Offline</h3>
            <p className="text-[#8E8AA0] text-sm max-w-[200px] mx-auto">
              Go online to start receiving delivery requests
            </p>
          </div>
        )}

        {isOnline && activeTab === 'available' && (
          <>
            {pendingOrders.length === 0 ? (
              <div className="text-center py-16 fade-in">
                <div className="w-20 h-20 bg-[#232437] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#3A3D58]">
                  <Package className="w-10 h-10 text-[#F26A2E]/50" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">No Orders Yet</h3>
                <p className="text-[#8E8AA0] text-sm max-w-[200px] mx-auto">
                  New delivery requests will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingOrders.map((order) => (
                  <DeliveryCard
                    key={order._id}
                    order={order}
                    onAccept={() => onAcceptOrder(order)}
                    onViewDetails={() => onViewOrderDetails(order)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {isOnline && activeTab === 'history' && (
          <div className="text-center py-16 fade-in">
            <div className="w-20 h-20 bg-[#232437] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#3A3D58]">
              <Clock className="w-10 h-10 text-[#2CBFAE]/50" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Delivery History</h3>
            <p className="text-[#8E8AA0] text-sm max-w-[200px] mx-auto">
              Your completed deliveries will appear here
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
