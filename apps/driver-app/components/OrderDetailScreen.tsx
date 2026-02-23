import React from 'react';
import { MapPin, Package, Clock, Phone, FileText, ChevronLeft, DollarSign, User, Navigation } from 'lucide-react';
import type { Order } from '../App';

interface OrderDetailScreenProps {
  order: Order;
  onAccept: () => void;
  onBack: () => void;
}

export const OrderDetailScreen: React.FC<OrderDetailScreenProps> = ({ order, onAccept, onBack }) => {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const getTimeSince = (timestamp: number) => {
    const minutes = Math.floor((Date.now() - timestamp) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m ago`;
  };

  const openMaps = () => {
    const address = encodeURIComponent(order.deliveryAddress);
    window.open(`https://maps.google.com/?q=${address}`, '_blank');
  };

  const callCustomer = () => {
    if (order.customerPhone) {
      window.open(`tel:${order.customerPhone}`, '_self');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#1C1630] text-white">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#26203f]/95 to-[#1C1630]/95 p-4 pb-6 border-b border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onBack}
            className="p-2 bg-[#1C1630]/60 rounded-xl border border-[#3A3D58] hover:border-[#F26A2E]/50 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-[#C2BED0]" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">Order Details</h1>
            <p className="text-xs text-[#8E8AA0]">Review before accepting</p>
          </div>
          <span className="text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider bg-amber-500/20 text-amber-400">
            Pending
          </span>
        </div>

        {/* Order Time */}
        <div className="flex items-center gap-2 text-sm text-[#C2BED0]">
          <Clock className="w-4 h-4 text-[#2CBFAE]" />
          <span>Ordered {getTimeSince(order.createdAt)}</span>
          <span className="text-[#595579]">•</span>
          <span>{formatTime(order.createdAt)}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32">
        {/* Customer Section */}
        <div className="bg-gradient-to-b from-[#26203f] to-[#1F1B35] rounded-3xl p-4 border border-white/10 shadow-lg shadow-black/20">
          <h3 className="text-xs font-bold text-[#8E8AA0] uppercase tracking-wider mb-3 flex items-center gap-2">
            <User className="w-4 h-4" />
            Customer
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-white font-bold text-lg">{order.customerName}</p>
            </div>
            {order.customerPhone && (
              <button
                onClick={callCustomer}
                className="flex items-center gap-3 w-full p-3 bg-[#1C1630]/50 rounded-xl hover:bg-[#1C1630] transition-colors"
              >
                <div className="w-10 h-10 bg-[#2CBFAE]/20 rounded-xl flex items-center justify-center">
                  <Phone className="w-5 h-5 text-[#2CBFAE]" />
                </div>
                <div className="text-left">
                  <p className="text-white font-medium">{order.customerPhone}</p>
                  <p className="text-xs text-[#8E8AA0]">Tap to call</p>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Delivery Address Section */}
        <div className="bg-gradient-to-b from-[#26203f] to-[#1F1B35] rounded-3xl p-4 border border-white/10 shadow-lg shadow-black/20">
          <h3 className="text-xs font-bold text-[#8E8AA0] uppercase tracking-wider mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Delivery Address
          </h3>
          <button
            onClick={openMaps}
            className="w-full p-3 bg-[#1C1630]/50 rounded-xl hover:bg-[#1C1630] transition-colors text-left"
          >
            <p className="text-white font-medium mb-1">{order.deliveryAddress}</p>
            <div className="flex items-center gap-2 text-[#2CBFAE] text-sm">
              <Navigation className="w-4 h-4" />
              <span>Open in Maps</span>
            </div>
          </button>

          {order.deliveryNotes && (
            <div className="mt-3 p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
              <div className="flex items-start gap-2">
                <FileText className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">Delivery Notes</p>
                  <p className="text-sm text-[#C2BED0]">{order.deliveryNotes}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Order Items Section */}
        <div className="bg-gradient-to-b from-[#26203f] to-[#1F1B35] rounded-3xl p-4 border border-white/10 shadow-lg shadow-black/20">
          <h3 className="text-xs font-bold text-[#8E8AA0] uppercase tracking-wider mb-3 flex items-center gap-2">
            <Package className="w-4 h-4" />
            Order Items ({order.items.length})
          </h3>
          <div className="space-y-2">
            {order.items.map((item, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center p-3 bg-[#1C1630]/50 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 bg-[#F26A2E]/20 rounded-lg text-[#F26A2E] text-sm flex items-center justify-center font-bold">
                    {item.quantity}x
                  </span>
                  <div>
                    <p className="text-white font-medium text-sm">{item.name}</p>
                    {item.category && (
                      <p className="text-xs text-[#8E8AA0]">{item.category}</p>
                    )}
                  </div>
                </div>
                <span className="text-[#F26A2E] font-bold">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Order Total Section */}
        <div className="bg-gradient-to-b from-[#26203f] to-[#1F1B35] rounded-3xl p-4 border border-white/10 shadow-lg shadow-black/20">
          <h3 className="text-xs font-bold text-[#8E8AA0] uppercase tracking-wider mb-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Order Total
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#C2BED0]">Subtotal</span>
              <span className="text-white">${order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#C2BED0]">Tax</span>
              <span className="text-white">${order.tax.toFixed(2)}</span>
            </div>
            <div className="h-px bg-[#3A3D58] my-2"></div>
            <div className="flex justify-between">
              <span className="text-white font-bold">Total</span>
              <span className="text-[#F26A2E] font-bold text-xl">${order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Pickup Time */}
        <div className="bg-[#2CBFAE]/10 rounded-3xl p-4 border border-[#2CBFAE]/25">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#2CBFAE]/20 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-[#2CBFAE]" />
            </div>
            <div>
              <p className="text-xs text-[#2CBFAE] font-bold uppercase tracking-wider">Requested Time</p>
              <p className="text-white font-bold text-lg">{order.pickupTime}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Action */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#1C1630] via-[#1C1630] to-transparent">
        <button
          onClick={onAccept}
          className="w-full py-4 bg-[#F26A2E] hover:bg-[#E24A2A] text-white rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-lg shadow-[#F26A2E]/30 active:scale-[0.98]"
        >
          Accept This Order
          <span className="bg-white/20 px-3 py-1 rounded-lg text-sm">${order.total.toFixed(2)}</span>
        </button>
      </div>
    </div>
  );
};
