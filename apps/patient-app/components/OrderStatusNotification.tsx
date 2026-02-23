import React, { useEffect, useState } from 'react';

interface OrderStatusNotificationProps {
  status: string;
  driverName?: string;
  onDismiss: () => void;
}

const STATUS_CONFIG: Record<string, {
  title: string;
  message: string;
  icon: React.ReactNode;
  color: string;
}> = {
  accepted: {
    title: 'Driver Assigned!',
    message: 'Your order has been accepted and is being prepared.',
    color: 'bg-blue-500',
    icon: (
      <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  picked_up: {
    title: 'Order Picked Up!',
    message: 'Your driver has picked up your order and is heading your way.',
    color: 'bg-purple-500',
    icon: (
      <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
      </svg>
    ),
  },
  en_route: {
    title: 'On The Way!',
    message: 'Your driver is en route to your location.',
    color: 'bg-[#F26A2E]',
    icon: (
      <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
      </svg>
    ),
  },
  delivered: {
    title: 'Delivered!',
    message: 'Your order has been delivered. Enjoy!',
    color: 'bg-green-500',
    icon: (
      <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
};

export const OrderStatusNotification: React.FC<OrderStatusNotificationProps> = ({
  status,
  driverName,
  onDismiss,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const config = STATUS_CONFIG[status];

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 50);

    // Auto dismiss after 5 seconds
    const timer = setTimeout(() => {
      handleDismiss();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onDismiss();
    }, 300);
  };

  if (!config) return null;

  return (
    <div
      className={`fixed top-4 left-4 right-4 z-[200] transition-all duration-300 ${
        isVisible && !isLeaving
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 -translate-y-4'
      }`}
    >
      <div className={`${config.color} rounded-2xl p-4 shadow-2xl`}>
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            {config.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold text-lg">{config.title}</h3>
            <p className="text-white/80 text-sm mt-0.5">
              {driverName && status === 'accepted'
                ? `${driverName} has accepted your order and is preparing it.`
                : driverName && status === 'picked_up'
                ? `${driverName} has picked up your order and is on the way!`
                : driverName && status === 'en_route'
                ? `${driverName} is driving to your location now.`
                : config.message}
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1.5 text-white/60 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress indicator */}
        <div className="mt-3 flex gap-1">
          {['pending', 'accepted', 'picked_up', 'en_route', 'delivered'].map((s, idx) => {
            const currentIdx = ['pending', 'accepted', 'picked_up', 'en_route', 'delivered'].indexOf(status);
            return (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  idx <= currentIdx ? 'bg-white' : 'bg-white/30'
                }`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
