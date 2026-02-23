import React, { useMemo, useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Phone, MapPin, Package, Check, Navigation, Clock, DollarSign, ChevronRight } from 'lucide-react';
import type { Order } from '../App';
import { PaymentCollectionModal, PaymentData } from './PaymentCollectionModal';

interface ActiveDeliveryScreenProps {
  order: Order;
  onUpdateStatus: (status: string) => void;
  onComplete: (paymentData: PaymentData) => void;
  onBack: () => void;
}

const STATUS_STEPS = [
  { key: 'accepted', label: 'Accepted', icon: Check },
  { key: 'picked_up', label: 'Picked Up', icon: Package },
  { key: 'en_route', label: 'En Route', icon: Navigation },
  { key: 'delivered', label: 'Delivered', icon: Check },
];

export const ActiveDeliveryScreen: React.FC<ActiveDeliveryScreenProps> = ({
  order,
  onUpdateStatus,
  onComplete,
  onBack,
}) => {
  const STARTING_HUB_ADDRESS = '44 Pigeon Hill Road, Mechanic Falls, ME 04256';
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [mapPage, setMapPage] = useState<0 | 1>(0);

  // Fallback center near Raymond/Mechanic Falls service area.
  const fallbackCoords = { lat: 44.1039, lon: -70.4725 };
  const mechanicFallsFallback = { lat: 44.1131, lon: -70.3910 };

  useEffect(() => {
    let isCancelled = false;
    const controller = new AbortController();

    async function geocodeAddress() {
      setIsGeocoding(true);
      try {
        const params = new URLSearchParams({
          format: 'jsonv2',
          q: order.deliveryAddress,
          limit: '1',
          addressdetails: '0',
        });

        const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Geocoding failed: ${response.status}`);
        }

        const data: Array<{ lat: string; lon: string }> = await response.json();
        const first = data[0];
        if (!first || isCancelled) return;

        setCoords({
          lat: Number(first.lat),
          lon: Number(first.lon),
        });
      } catch (_error) {
        if (!isCancelled) setCoords(null);
      } finally {
        if (!isCancelled) setIsGeocoding(false);
      }
    }

    geocodeAddress();

    return () => {
      isCancelled = true;
      controller.abort();
    };
  }, [order.deliveryAddress]);

  useEffect(() => {
    let isCancelled = false;
    const controller = new AbortController();

    async function geocodeHub() {
      try {
        const params = new URLSearchParams({
          format: 'jsonv2',
          q: STARTING_HUB_ADDRESS,
          limit: '1',
          addressdetails: '0',
        });

        const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Hub geocoding failed: ${response.status}`);
        }

        const data: Array<{ lat: string; lon: string }> = await response.json();
        const first = data[0];
        if (!first || isCancelled) return;

        setPickupCoords({
          lat: Number(first.lat),
          lon: Number(first.lon),
        });
      } catch (_error) {
        if (!isCancelled) setPickupCoords(null);
      }
    }

    geocodeHub();

    return () => {
      isCancelled = true;
      controller.abort();
    };
  }, [STARTING_HUB_ADDRESS]);

  const deliveryCoords = coords ?? fallbackCoords;
  const tripStartCoords = pickupCoords ?? mechanicFallsFallback;

  const detailEmbedUrl = useMemo(() => {
    const lonDelta = 0.012;
    const latDelta = 0.009;
    const bbox = [
      deliveryCoords.lon - lonDelta,
      deliveryCoords.lat - latDelta,
      deliveryCoords.lon + lonDelta,
      deliveryCoords.lat + latDelta,
    ];

    const bboxValue = bbox.map((v) => v.toFixed(6)).join('%2C');
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bboxValue}&layer=mapnik&marker=${deliveryCoords.lat.toFixed(6)}%2C${deliveryCoords.lon.toFixed(6)}`;
  }, [deliveryCoords.lat, deliveryCoords.lon]);

  const overviewEmbedUrl = useMemo(() => {
    const south = Math.min(tripStartCoords.lat, deliveryCoords.lat) - 0.02;
    const north = Math.max(tripStartCoords.lat, deliveryCoords.lat) + 0.02;
    const west = Math.min(tripStartCoords.lon, deliveryCoords.lon) - 0.03;
    const east = Math.max(tripStartCoords.lon, deliveryCoords.lon) + 0.03;
    const bboxValue = [west, south, east, north]
      .map((v) => v.toFixed(6))
      .join('%2C');

    const midLat = (tripStartCoords.lat + deliveryCoords.lat) / 2;
    const midLon = (tripStartCoords.lon + deliveryCoords.lon) / 2;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bboxValue}&layer=mapnik&marker=${midLat.toFixed(6)}%2C${midLon.toFixed(6)}`;
  }, [deliveryCoords.lat, deliveryCoords.lon, tripStartCoords.lat, tripStartCoords.lon]);

  const embedUrl = mapPage === 0 ? detailEmbedUrl : overviewEmbedUrl;

  const currentStepIndex = STATUS_STEPS.findIndex(s => s.key === order.status);

  const getNextAction = () => {
    switch (order.status) {
      case 'accepted':
        return { label: 'Confirm Pickup', nextStatus: 'picked_up' };
      case 'picked_up':
        return { label: 'Start Navigation', nextStatus: 'en_route' };
      case 'en_route':
        return { label: 'Collect Payment', nextStatus: 'delivered' };
      default:
        return null;
    }
  };

  const handleAction = () => {
    const action = getNextAction();
    if (action) {
      if (action.nextStatus === 'delivered') {
        setShowPaymentModal(true);
      } else {
        onUpdateStatus(action.nextStatus);
      }
    }
  };

  const handlePaymentComplete = (paymentData: PaymentData) => {
    onComplete(paymentData);
    setShowPaymentModal(false);
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

  const action = getNextAction();

  return (
    <div className="flex flex-col h-screen bg-[#1C1630] relative">
      {/* Map Placeholder */}
      <div className="flex-1 bg-[#232437] relative overflow-hidden">
        {/* OpenStreetMap embed */}
        <iframe
          title={mapPage === 0 ? 'Delivery destination map' : 'Delivery overview map'}
          src={embedUrl}
          className="absolute inset-0 w-full h-full border-0"
          style={{ filter: 'grayscale(1) brightness(0.46) contrast(1.2) saturate(0.55) hue-rotate(165deg)' }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />

        {/* Dark mode treatment over OSM tiles */}
        <div className="absolute inset-0 bg-[#040611]/60 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(44,191,174,0.10),transparent_45%),radial-gradient(circle_at_85%_80%,rgba(242,106,46,0.10),transparent_50%)] pointer-events-none" />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#1C1630] pointer-events-none"></div>

        {isGeocoding && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-[#1C1630]/80 border border-[#3A3D58] text-[#C2BED0] text-xs">
            Loading map...
          </div>
        )}

        {/* Map page controls */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-[#1C1630]/82 border border-white/15 rounded-full px-2 py-1.5 shadow-xl backdrop-blur-md">
          <button
            onClick={() => setMapPage(0)}
            disabled={mapPage === 0}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              mapPage === 0
                ? 'bg-[#3A3D58] text-[#8E8AA0] cursor-not-allowed'
                : 'bg-[#26203f] text-white hover:bg-[#F26A2E]'
            }`}
            aria-label="Show destination map"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="px-2 min-w-[140px] text-center">
            <p className="text-[10px] text-[#8E8AA0] uppercase tracking-wider">
              {mapPage === 0 ? 'Destination' : 'Overview'}
            </p>
            <p className="text-xs text-white font-semibold">
              {mapPage === 0 ? 'Drop-off Detail' : 'Mechanic Falls → Destination'}
            </p>
          </div>

          <button
            onClick={() => setMapPage(1)}
            disabled={mapPage === 1}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              mapPage === 1
                ? 'bg-[#3A3D58] text-[#8E8AA0] cursor-not-allowed'
                : 'bg-[#26203f] text-white hover:bg-[#F26A2E]'
            }`}
            aria-label="Show overview map"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Back Button */}
        <button
          onClick={onBack}
          className="absolute top-6 left-6 w-12 h-12 bg-[#232437]/90 backdrop-blur-md rounded-2xl flex items-center justify-center text-white border border-white/15 shadow-xl hover:bg-[#3A3D58] transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        {/* Quick Actions */}
        <div className="absolute top-6 right-6 flex gap-3">
          <button
            onClick={openMaps}
            className="w-12 h-12 bg-[#232437]/90 backdrop-blur-md rounded-2xl flex items-center justify-center text-[#2CBFAE] border border-white/15 shadow-xl hover:bg-[#3A3D58] transition-colors"
          >
            <Navigation className="w-5 h-5" />
          </button>
          {order.customerPhone && (
            <button
              onClick={callCustomer}
              className="w-12 h-12 bg-[#232437]/90 backdrop-blur-md rounded-2xl flex items-center justify-center text-[#2CBFAE] border border-white/15 shadow-xl hover:bg-[#3A3D58] transition-colors"
            >
              <Phone className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Bottom Sheet */}
      <div className="bg-gradient-to-b from-[#26203f] to-[#1E1A34] rounded-t-[32px] p-6 shadow-2xl border-t border-white/10 -mt-8 relative z-10 slide-up backdrop-blur-md">
        {/* Handle */}
        <div className="w-12 h-1 bg-[#3A3D58] rounded-full mx-auto mb-6"></div>

        {/* Customer Info */}
        <div className="flex justify-between items-start mb-5">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-1">{order.customerName}</h2>
            <div className="flex items-start gap-2 text-[#C2BED0] text-sm">
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#2CBFAE]" />
              <span>{order.deliveryAddress}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-[#F26A2E]">${order.total.toFixed(2)}</div>
            <div className="text-xs text-[#8E8AA0]">{order.items.length} items</div>
          </div>
        </div>

        {/* Status Progress */}
        <div className="flex justify-between mb-6 relative">
          {/* Progress line */}
          <div className="absolute top-4 left-0 w-full h-0.5 bg-[#3A3D58]"></div>
          <div
            className="absolute top-4 left-0 h-0.5 bg-[#2CBFAE] transition-all duration-500"
            style={{ width: `${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}%` }}
          ></div>

          {STATUS_STEPS.map((step, i) => {
            const isComplete = i < currentStepIndex;
            const isCurrent = i === currentStepIndex;
            const Icon = step.icon;

            return (
              <div key={step.key} className="flex flex-col items-center z-10 px-1.5">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 transition-all ${
                    isComplete || isCurrent
                      ? 'bg-[#2CBFAE] text-white shadow-lg shadow-[#2CBFAE]/30'
                      : 'bg-[#3A3D58] text-[#8E8AA0]'
                  }`}
                >
                  {isComplete ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>
                <span
                  className={`text-[10px] font-semibold tracking-wide ${
                    isComplete || isCurrent ? 'text-[#2CBFAE]' : 'text-[#8E8AA0]'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Order Items */}
        <div className="bg-black/20 rounded-2xl p-4 mb-6 max-h-32 overflow-y-auto custom-scrollbar border border-white/10">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center py-2 border-b border-[#3A3D58] last:border-0">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 bg-[#F26A2E]/20 rounded text-[#F26A2E] text-xs flex items-center justify-center font-bold">
                  {item.quantity}
                </span>
                <span className="text-white text-sm">{item.name}</span>
              </div>
              <span className="text-[#8E8AA0] text-sm">${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>

        {/* Delivery Notes */}
        {order.deliveryNotes && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 mb-6">
            <p className="text-amber-400 text-sm">
              <span className="font-bold">Note:</span> {order.deliveryNotes}
            </p>
          </div>
        )}

        {/* Action Button */}
        {action && (
          <button
            onClick={handleAction}
          className="w-full py-4 bg-[#F26A2E] hover:bg-[#E24A2A] text-white rounded-2xl font-bold text-lg shadow-lg shadow-[#F26A2E]/20 transition-all active:scale-[0.98] flex items-center justify-between px-6 group"
        >
            <span>{action.label}</span>
            <div className="bg-white/20 p-2 rounded-xl group-hover:translate-x-1 transition-transform">
              <ChevronRight className="w-5 h-5" />
            </div>
          </button>
        )}
      </div>

      {/* Payment Collection Modal */}
      <PaymentCollectionModal
        order={order}
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onComplete={handlePaymentComplete}
      />
    </div>
  );
};
