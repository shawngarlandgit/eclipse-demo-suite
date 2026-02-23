import React, { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import type { Id } from '../convex/_generated/dataModel';
import { CartItem } from '../types';
import { AddressAutocomplete } from './AddressAutocomplete';

type PaymentMethod = 'cash' | 'debit';

interface CheckoutScreenProps {
  items: CartItem[];
  total: number;
  onPlaceOrder: (pickupTime: string, orderId?: string, orderType?: 'pickup' | 'delivery') => void;
  onBack: () => void;
}

const LOCATIONS = [
  { id: 'raymond', name: 'Raymond', address: '1259 Roosevelt Trail, Raymond, ME 04071' },
  { id: 'mechanic-falls', name: 'Mechanic Falls', address: '44 Pigeon Hill Road, Mechanic Falls, ME 04256' },
];

export const CheckoutScreen: React.FC<CheckoutScreenProps> = ({ items, total, onPlaceOrder, onBack }) => {
  const [orderType, setOrderType] = useState<'pickup' | 'delivery'>('delivery');
  const [pickupTime, setPickupTime] = useState('ASAP');
  const [selectedLocation, setSelectedLocation] = useState(LOCATIONS[0]);
  const [loading, setLoading] = useState(false);

  // Delivery form state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // Payment method selection
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');

  // Delivery orders must be synced to Convex so dispatch + driver apps see them.
  const defaultDispensaryId = import.meta.env.VITE_DEFAULT_DISPENSARY_ID as Id<"dispensaries"> | undefined;

  // Mutations
  const createOrder = useMutation(api.orders.createOrder);
  const createPayment = useMutation(api.payments.createPayment);

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.055; // 5.5% Maine tax

  const handlePlaceOrder = async () => {
    if (orderType === 'delivery' && (!customerName.trim() || !deliveryAddress.trim())) {
      alert('Please fill in your name and delivery address');
      return;
    }

    setLoading(true);

    try {
      if (orderType === 'delivery') {
        if (!defaultDispensaryId) {
          alert('Delivery is temporarily unavailable: missing dispensary configuration.');
          setLoading(false);
          return;
        }

        try {
          const orderId = await createOrder({
            dispensaryId: defaultDispensaryId,
            customerName: customerName.trim(),
            customerPhone: customerPhone.trim() || undefined,
            items: items.map(item => ({
              productId: item._id,
              name: item.name,
              category: item.category,
              quantity: item.quantity,
              price: item.price,
            })),
            subtotal,
            tax,
            total,
            deliveryAddress: deliveryAddress.trim(),
            deliveryNotes: deliveryNotes.trim() || undefined,
            pickupTime,
          });

          try {
            await createPayment({
              orderId,
              paymentMethod,
            });
          } catch (paymentError) {
            console.warn('Failed to create payment record:', paymentError);
          }

          onPlaceOrder(pickupTime, orderId, 'delivery');
          setLoading(false);
          return;
        } catch (convexError) {
          console.error('Convex delivery flow failed:', convexError);
          alert('Could not submit this delivery order to dispatch. Please try again.');
          setLoading(false);
          return;
        }

        // Unreachable by design, but keeps flow explicit if logic changes.
        setLoading(false);
        return;
      }

      // Pickup order (local)
      setTimeout(() => {
        onPlaceOrder(pickupTime, undefined, 'pickup');
        setLoading(false);
      }, 1200);
      return;
    } catch (error) {
      console.error('Failed to create order:', error);
      alert('Failed to place order. Please try again.');
    }

    setLoading(false);
  };

  const timeOptions = ['ASAP', 'In 30 min', 'In 1 hour', 'In 2 hours'];

  return (
    <div className="flex flex-col h-full bg-[#1C1630] p-4 text-white">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={onBack}
          aria-label="Go back to cart"
          className="p-3 min-w-[44px] min-h-[44px] -ml-2 text-[#718096] hover:text-white transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#F26A2E] rounded-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold ml-2">Checkout</h1>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-visible pr-1 scrollbar-hide pb-40">
        {/* Order Type Selection */}
        <fieldset className="mb-6">
          <legend className="text-xs font-bold text-[#A0AEC0] mb-3 uppercase tracking-wider">Order Type</legend>
          <div className="flex gap-3" role="radiogroup" aria-label="Order type selection">
            <button
              onClick={() => setOrderType('delivery')}
              role="radio"
              aria-checked={orderType === 'delivery'}
              className={`flex-1 py-3.5 rounded-xl border text-sm font-bold transition-all flex items-center justify-center gap-2 min-h-[48px] focus:outline-none focus:ring-2 focus:ring-[#F26A2E] focus:ring-offset-2 focus:ring-offset-[#1C1630] ${
                orderType === 'delivery'
                  ? 'bg-[#F26A2E] border-[#F26A2E] text-white shadow-lg shadow-[#F26A2E]/20'
                  : 'bg-[#232C33] border-[#2D3748] text-[#718096] hover:border-[#F26A2E]/30'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
              Delivery
            </button>
            <button
              onClick={() => setOrderType('pickup')}
              role="radio"
              aria-checked={orderType === 'pickup'}
              className={`flex-1 py-3.5 rounded-xl border text-sm font-bold transition-all flex items-center justify-center gap-2 min-h-[48px] focus:outline-none focus:ring-2 focus:ring-[#F26A2E] focus:ring-offset-2 focus:ring-offset-[#1C1630] ${
                orderType === 'pickup'
                  ? 'bg-[#F26A2E] border-[#F26A2E] text-white shadow-lg shadow-[#F26A2E]/20'
                  : 'bg-[#232C33] border-[#2D3748] text-[#718096] hover:border-[#F26A2E]/30'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Pickup
            </button>
          </div>
        </fieldset>

        {/* Delivery Form */}
        {orderType === 'delivery' && (
          <div className="mb-6 space-y-4">
            <h3 className="text-xs font-bold text-[#A0AEC0] mb-3 uppercase tracking-wider">Delivery Information</h3>

            <div>
              <label className="text-xs text-[#718096] mb-1.5 block">Your Name *</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="John Doe"
                className="w-full bg-[#232C33] border border-[#2D3748] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#F26A2E] transition-colors placeholder:text-[#4A5568]"
              />
            </div>

            <div>
              <label className="text-xs text-[#718096] mb-1.5 block">Phone Number</label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="(207) 555-0123"
                className="w-full bg-[#232C33] border border-[#2D3748] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#F26A2E] transition-colors placeholder:text-[#4A5568]"
              />
            </div>

            <div>
              <label className="text-xs text-[#718096] mb-1.5 block">Delivery Address *</label>
              <AddressAutocomplete
                value={deliveryAddress}
                onChange={setDeliveryAddress}
                placeholder="Start typing your address..."
                className="w-full bg-[#232C33] border border-[#2D3748] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#F26A2E] transition-colors placeholder:text-[#4A5568]"
              />
              <p className="text-[10px] text-[#718096] mt-1.5 ml-1">Select from suggestions for accurate delivery</p>
            </div>

            <div>
              <label className="text-xs text-[#718096] mb-1.5 block">Delivery Notes (optional)</label>
              <textarea
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                placeholder="Ring doorbell, leave at side door, etc."
                rows={2}
                className="w-full bg-[#232C33] border border-[#2D3748] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#F26A2E] transition-colors placeholder:text-[#4A5568] resize-none"
              />
            </div>
          </div>
        )}

        {/* Pickup Location Selection */}
        {orderType === 'pickup' && (
          <div className="mb-6">
            <h3 className="text-xs font-bold text-[#A0AEC0] mb-3 uppercase tracking-wider">Pickup Location</h3>
            <div className="space-y-2">
              {LOCATIONS.map(loc => (
                <button
                  key={loc.id}
                  onClick={() => setSelectedLocation(loc)}
                  className={`w-full flex items-center p-3.5 rounded-xl border transition-all ${
                    selectedLocation.id === loc.id
                      ? 'bg-[#232C33] border-[#F26A2E] shadow-lg shadow-[#F26A2E]/10'
                      : 'bg-[#232C33]/50 border-[#2D3748] hover:border-[#F26A2E]/30'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                    selectedLocation.id === loc.id ? 'border-[#F26A2E]' : 'border-[#2D3748]'
                  }`}>
                    {selectedLocation.id === loc.id && <div className="w-2 h-2 bg-[#F26A2E] rounded-full" />}
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-white text-sm">{loc.name}</h4>
                    <p className="text-[10px] text-[#718096]">{loc.address}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Payment Method Selection */}
        {orderType === 'delivery' && (
          <div className="mb-6">
            <h3 className="text-xs font-bold text-[#A0AEC0] mb-3 uppercase tracking-wider">Payment Method</h3>
            <div className="flex gap-3">
              <button
                onClick={() => setPaymentMethod('cash')}
                className={`flex-1 py-3.5 rounded-xl border text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  paymentMethod === 'cash'
                    ? 'bg-[#F26A2E] border-[#F26A2E] text-white shadow-lg shadow-[#F26A2E]/20'
                    : 'bg-[#232C33] border-[#2D3748] text-[#718096] hover:border-[#F26A2E]/30'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Cash
              </button>
              <button
                onClick={() => setPaymentMethod('debit')}
                className={`flex-1 py-3.5 rounded-xl border text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  paymentMethod === 'debit'
                    ? 'bg-[#F26A2E] border-[#F26A2E] text-white shadow-lg shadow-[#F26A2E]/20'
                    : 'bg-[#232C33] border-[#2D3748] text-[#718096] hover:border-[#F26A2E]/30'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Debit Card
              </button>
            </div>
            <p className="text-[10px] text-[#718096] mt-2 ml-1">
              {paymentMethod === 'cash'
                ? 'Have exact change ready for faster delivery'
                : 'Driver will process debit on delivery'}
            </p>
          </div>
        )}

        {/* Timing Selection */}
        <div className="mb-6">
          <h3 className="text-xs font-bold text-[#A0AEC0] mb-3 uppercase tracking-wider">
            {orderType === 'delivery' ? 'Delivery Time' : 'Pickup Time'}
          </h3>
          <div className="flex flex-wrap gap-2">
            {timeOptions.map(time => (
              <button
                key={time}
                onClick={() => setPickupTime(time)}
                className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                  pickupTime === time
                    ? 'bg-[#F26A2E] border-[#F26A2E] text-white shadow-md'
                    : 'bg-[#232C33] border-[#2D3748] text-[#718096] hover:border-[#F26A2E]/30'
                }`}
              >
                {time}
              </button>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="mb-6">
          <h3 className="text-xs font-bold text-[#A0AEC0] mb-3 uppercase tracking-wider">Order Summary</h3>
          <div className="bg-[#232C33] rounded-2xl overflow-hidden border border-[#2D3748]">
            <div className="divide-y divide-[#2D3748]">
              {items.map(item => (
                <div key={item._id} className="p-3 flex justify-between items-center text-xs">
                  <div className="flex items-center">
                    <span className="w-6 h-6 rounded bg-[#1C1630] flex items-center justify-center text-[10px] font-bold mr-3 border border-[#2D3748]">{item.quantity}</span>
                    <span className="text-[#E2E8F0] font-medium">{item.name}</span>
                  </div>
                  <span className="text-white font-bold">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="p-3 bg-[#1C1630]/50 space-y-2 text-xs">
              <div className="flex justify-between text-[#A0AEC0]">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[#A0AEC0]">
                <span>Tax (5.5%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-white pt-2 border-t border-[#2D3748]">
                <span>Total</span>
                <span className="text-[#F26A2E] text-base">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Info */}
        <div className="mb-6 bg-[#F26A2E]/10 p-4 rounded-xl border border-[#F26A2E]/20 flex items-start">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#F26A2E] mt-0.5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-[11px] text-[#A0AEC0] leading-relaxed">
            <p className="font-bold text-[#F26A2E] mb-1 uppercase tracking-wide">Payment Info</p>
            {orderType === 'delivery' ? (
              <p>
                {paymentMethod === 'cash'
                  ? 'Have cash ready upon delivery. Your driver will provide change if needed. Please have your ID ready for verification.'
                  : 'Your driver will process your debit card upon delivery using a mobile terminal. Please have your ID ready for verification.'}
              </p>
            ) : (
              <p>
                Payment is collected in-store upon pickup. Cash and Debit accepted. Please have your ID ready.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Bottom Button */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#1C1630] via-[#1C1630] to-transparent z-20">
        <button
          onClick={handlePlaceOrder}
          disabled={loading || (orderType === 'delivery' && (!customerName.trim() || !deliveryAddress.trim()))}
          className="w-full py-4 bg-[#F26A2E] hover:bg-[#E24A2A] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-lg shadow-black/40 flex justify-center items-center active:scale-95 transition-all"
        >
          {loading ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <div className="flex items-center justify-between w-full px-2">
              <span>{orderType === 'delivery' ? 'Place Delivery Order' : 'Place Pickup Order'}</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </button>
      </div>
    </div>
  );
};
