import React from 'react';
import { MapPin, Package, ChevronRight } from 'lucide-react';
import type { Order } from '../App';

interface DeliveryCardProps {
  order: Order;
  onAccept: () => void;
  onViewDetails?: () => void;
  isActive?: boolean;
}

export const DeliveryCard: React.FC<DeliveryCardProps> = ({ order, onAccept, onViewDetails, isActive }) => {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const getTimeSince = (timestamp: number) => {
    const minutes = Math.floor((Date.now() - timestamp) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  };

  return (
    <div
      onClick={onViewDetails}
      className={`rounded-2xl overflow-hidden transition-all fade-in cursor-pointer ${
        isActive
          ? 'bg-gradient-to-br from-[#2A2443] to-[#1C1630] border border-[#2CBFAE]/60 shadow-xl shadow-[#2CBFAE]/10'
          : 'bg-gradient-to-br from-[#26203f] to-[#1F1B35] border border-white/10 hover:border-[#F26A2E]/50 active:scale-[0.98] shadow-lg shadow-black/20'
      }`}
    >
      {/* Header */}
      <div className="p-4 pb-2.5">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                isActive
                  ? 'bg-[#2CBFAE]/20 text-[#8FE6DC] border border-[#2CBFAE]/30'
                  : 'bg-[#F26A2E]/15 text-[#FFB082] border border-[#F26A2E]/30'
              }`}
            >
              {isActive ? 'In Progress' : 'Ready for Pickup'}
            </span>
            <span className="text-[#8E8AA0] text-xs">
              {getTimeSince(order.createdAt)}
            </span>
          </div>
          <span className="text-[#FFB082] font-bold text-base">${order.total.toFixed(2)}</span>
        </div>

        {/* Customer Info */}
        <h3 className="text-white font-bold text-lg mb-1">{order.customerName}</h3>
        <div className="flex items-start gap-2 text-[#C2BED0] text-sm mb-3">
          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#2CBFAE]" />
          <span className="line-clamp-2">{order.deliveryAddress}</span>
        </div>

        {/* Order Items Preview */}
        <div className="flex items-center gap-2 text-xs text-[#8E8AA0]">
          <Package className="w-4 h-4" />
          <span>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
          <span className="text-[#595579]">•</span>
          <span className="truncate flex-1">
            {order.items.map(i => i.name.split(' ').slice(0, 2).join(' ')).join(', ')}
          </span>
        </div>
      </div>

      {/* Items List (expandable) */}
      <div className="px-4 pb-3">
        <div className="bg-black/20 rounded-xl p-3 space-y-2 border border-white/10">
          {order.items.slice(0, 3).map((item, idx) => (
            <div key={idx} className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 bg-[#F26A2E]/15 rounded text-[#FFB082] text-xs flex items-center justify-center font-bold">
                  {item.quantity}
                </span>
                <span className="text-[#C2BED0] truncate max-w-[180px]">{item.name}</span>
              </div>
              <span className="text-[#8E8AA0]">${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          {order.items.length > 3 && (
            <div className="text-xs text-[#8E8AA0] text-center pt-1">
              +{order.items.length - 3} more items
            </div>
          )}
        </div>
      </div>

      {/* Action Button */}
      {!isActive && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAccept();
          }}
          className="w-full py-3.5 bg-gradient-to-r from-[#F26A2E] to-[#E24A2A] hover:from-[#FF7A3F] hover:to-[#E24A2A] text-white font-bold text-sm transition-all flex items-center justify-center gap-2 group"
        >
          Accept Order
          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      )}
    </div>
  );
};
