import React from 'react';

interface OrderSuccessScreenProps {
  orderId: string;
  orderType?: 'pickup' | 'delivery';
  onReturnHome: () => void;
}

export const OrderSuccessScreen: React.FC<OrderSuccessScreenProps> = ({ orderId, orderType = 'pickup', onReturnHome }) => {
  const isDelivery = orderType === 'delivery';

  return (
    <div className="flex flex-col h-full bg-[#161521] items-center justify-center p-6 text-center relative overflow-hidden">
      {/* Background Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#F26A2E]/12 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#E24A2A]/12 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 mb-8">
        <div className="w-24 h-24 bg-[#F26A2E] rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(242,106,46,0.45)] mx-auto mb-6 animate-bounce-slow">
          {isDelivery ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">
          {isDelivery ? 'Delivery Confirmed!' : 'Order Confirmed!'}
        </h1>
        <p className="text-[#A9A3B4]">
          {isDelivery ? 'Your order is being prepared for delivery.' : "We've received your order."}
        </p>
      </div>

      <div className="relative z-10 w-full bg-[#232437]/80 backdrop-blur-sm p-6 rounded-2xl border border-[#3A3D58] mb-8">
        <p className="text-sm text-[#8E8AA0] uppercase tracking-widest mb-1">Order ID</p>
        <p className="text-2xl font-mono text-[#F26A2E] mb-4">#{orderId}</p>

        <div className="h-px bg-[#3A3D58] w-full my-4"></div>

        {isDelivery ? (
          <div className="text-[#E6E4ED] text-sm space-y-3">
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-[#F26A2E] rounded-full animate-pulse"></div>
              <span>A driver will be assigned shortly</span>
            </div>
            <p className="text-[#A9A3B4] text-xs">
              You'll receive updates as your order is prepared and delivered.<br/>
              Payment is collected upon delivery. Please have your ID ready.
            </p>
          </div>
        ) : (
          <p className="text-[#E6E4ED] text-sm">
            Head to the front desk when you arrive. <br/>
            Your order will be ready for pickup shortly.
          </p>
        )}
      </div>

      <button
        onClick={onReturnHome}
        className="relative z-10 w-full py-4 bg-[#F26A2E] hover:bg-[#E24A2A] border border-[#E24A2A] text-white rounded-xl font-bold transition-colors shadow-lg shadow-[#F26A2E]/20"
      >
        Continue Shopping
      </button>
    </div>
  );
};
