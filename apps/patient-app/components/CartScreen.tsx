import React from 'react';
import { CartItem } from '../types';

interface CartScreenProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onCheckout: () => void;
  onBack: () => void;
  onClearCart: () => void;
}

export const CartScreen: React.FC<CartScreenProps> = ({ items, onUpdateQuantity, onCheckout, onBack, onClearCart }) => {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.055; // 5.5% Maine Medical Tax
  const total = subtotal + tax;

  if (items.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8 text-center bg-[#1C1630]">
        <div className="w-20 h-20 bg-[#232C33] rounded-full flex items-center justify-center mb-4 border border-[#2D3748]">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#718096]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Your cart is empty</h2>
        <p className="text-[#A0AEC0] text-sm mb-8">Looks like you haven't added any products yet.</p>
        <button 
          onClick={onBack}
          className="px-8 py-3 bg-[#F26A2E] rounded-xl font-bold text-white shadow-lg shadow-black/30 active:scale-95 transition-all"
        >
          Browse Inventory
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#1C1630] p-4 text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button onClick={onBack} className="p-2 -ml-2 text-[#718096] hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold ml-2">Your Cart <span className="text-[#F26A2E]">({items.length})</span></h1>
        </div>
        <button
          onClick={onClearCart}
          className="text-xs text-red-400 hover:text-red-300 font-medium px-3 py-1.5 rounded-lg hover:bg-red-400/10 transition-colors"
        >
          Clear All
        </button>
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto pr-1 scrollbar-hide">
        {items.map(item => (
          <div key={item._id} className="flex bg-[#232C33] rounded-xl p-3 mb-3 border border-[#2D3748] shadow-sm">
            <img src={item.imageUrl} alt={item.name} className="w-20 h-20 rounded-lg object-cover bg-[#1C1630]" />
            <div className="ml-4 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-white text-sm line-clamp-1">{item.name}</h3>
                <p className="text-[10px] text-[#718096] mt-0.5">{item.strainType} • {item.category}</p>
              </div>
              <div className="flex justify-between items-end">
                <span className="font-bold text-[#F26A2E]">${(item.price * item.quantity).toFixed(2)}</span>
                
                <div className="flex items-center bg-[#1C1630] rounded-lg border border-[#2D3748]">
                  <button 
                    onClick={() => onUpdateQuantity(item._id, -1)}
                    className="w-8 h-8 flex items-center justify-center text-[#718096] hover:text-white"
                  >
                    -
                  </button>
                  <span className="text-xs font-bold w-6 text-center">{item.quantity}</span>
                  <button 
                    onClick={() => onUpdateQuantity(item._id, 1)}
                    className="w-8 h-8 flex items-center justify-center text-[#718096] hover:text-white"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Footer */}
      <div className="mt-4 pt-4 border-t border-[#2D3748] bg-[#1C1630]">
        <div className="flex justify-between mb-2 text-xs text-[#718096]">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between mb-4 text-xs text-[#718096]">
          <span>Tax (5.5%)</span>
          <span>${tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between mb-6 text-lg font-bold text-white">
          <span>Total</span>
          <span className="text-[#F26A2E]">${total.toFixed(2)}</span>
        </div>
        <button
          onClick={onCheckout}
          data-walkthrough="checkout-btn"
          className="w-full py-4 bg-[#F26A2E] hover:bg-[#E24A2A] text-white rounded-xl font-bold shadow-lg shadow-black/40 flex justify-between px-6 items-center active:scale-95 transition-all"
        >
          <span>Continue to Checkout</span>
          <span className="bg-white/20 px-2 py-0.5 rounded text-sm">${total.toFixed(2)}</span>
        </button>
      </div>
    </div>
  );
};
