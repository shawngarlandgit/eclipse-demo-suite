import React, { useState } from 'react';
import { Order, CartItem, Product } from '../types';

// Mock Data for Profile
const MOCK_USER = {
  name: "Alex Stoner",
  email: "alex@example.com",
  phone: "(555) 420-1234",
  deliveryAddress: "123 Main St, Portland, OR 97201",
  joinedDate: "Oct 2023",
  points: 420
};

const MOCK_HISTORY: Order[] = [
  {
    id: "ORD-9921",
    items: [
      {
        _id: '101',
        name: 'Orange Push Pop #5',
        quantity: 1,
        price: 45,
        category: 'Flower',
        strainType: 'Indica',
        thcContent: 24.5,
        stockLevel: 'High',
        description: "Our signature heavy-hitting Indica. Deep earthy pine notes with a relaxing body high perfect for ending the day.",
        imageUrl: 'https://images.unsplash.com/photo-1603909223429-69bb7101f420?auto=format&fit=crop&w=400&q=80'
      } as CartItem,
      {
        _id: '401',
        name: 'House Blend Pre-roll',
        quantity: 2,
        price: 8,
        category: 'Pre-rolls',
        strainType: 'Hybrid',
        thcContent: 18.0,
        stockLevel: 'High',
        description: "A convenient 1g joint rolled with a curated blend of our finest Hybrid strains.",
        imageUrl: 'https://images.unsplash.com/photo-1598514983318-2f64f8f4796c?auto=format&fit=crop&w=400&q=80'
      } as CartItem
    ],
    subtotal: 61,
    tax: 9.15,
    total: 70.15,
    pickupTime: "2023-11-15T16:30:00",
    status: 'completed',
    timestamp: 1700065800000
  },
  {
    id: "ORD-5521",
    items: [
      {
        _id: '301',
        name: 'Blue Raspberry Cartridge',
        quantity: 1,
        price: 45,
        category: 'Vapes',
        strainType: 'Sativa',
        thcContent: 85.0,
        stockLevel: 'High',
        description: "High-potency distillate with sweet blue raspberry flavor. Discrete, convenient, and stimulating.",
        imageUrl: 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?auto=format&fit=crop&w=400&q=80'
      } as CartItem,
       {
         _id: '201',
         name: 'Wild Berry Gummies',
         quantity: 1,
         price: 20,
         category: 'Edibles',
         strainType: 'Hybrid',
         thcContent: 100.0,
         stockLevel: 'High',
         description: "Delicious mixed berry flavors with a balanced Hybrid effect. 10mg per piece, 100mg total.",
         imageUrl: 'https://images.unsplash.com/photo-1582053433976-25c00369fc93?auto=format&fit=crop&w=400&q=80'
      } as CartItem
    ],
    subtotal: 65,
    tax: 9.75,
    total: 74.75,
    pickupTime: "2023-10-10T16:00:00",
    status: 'completed',
    timestamp: 1696953600000
  }
];

interface ProfileScreenProps {
  onLogout?: () => void;
  onReviewProduct?: (product: Product) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onLogout, onReviewProduct }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [email, setEmail] = useState(MOCK_USER.email);
  const [phone, setPhone] = useState(MOCK_USER.phone);
  const [deliveryAddress, setDeliveryAddress] = useState(MOCK_USER.deliveryAddress);
  const [showSaved, setShowSaved] = useState(false);

  const handleSave = () => {
    setIsEditing(false);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
    // In production, this would save to the backend
  };

  return (
    <div className="flex flex-col h-full bg-[#1C1630] p-4">
      {/* Header / User Card */}
      <div className="flex items-center justify-between mb-6 mt-2">
         <h1 className="text-2xl font-bold text-white">My Profile</h1>
         <button className="text-[#718096] hover:text-white" onClick={onLogout}>
           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
           </svg>
         </button>
      </div>

      {/* Saved Toast */}
      {showSaved && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-[#F26A2E] text-white px-4 py-2 rounded-xl font-medium text-sm shadow-lg z-50 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Profile saved!
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-[#232C33] rounded-2xl p-5 mb-6 border border-[#2D3748] shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#F26A2E]/10 rounded-bl-full -mr-10 -mt-10"></div>

        {/* Avatar and Name */}
        <div className="flex items-center mb-4 relative z-10">
          <div className="w-16 h-16 bg-gradient-to-br from-[#F26A2E] to-[#E24A2A] rounded-full flex items-center justify-center text-xl font-bold text-white shadow-lg">
            AS
          </div>
          <div className="ml-4 flex-1">
            <h2 className="text-xl font-bold text-white">{MOCK_USER.name}</h2>
            <p className="text-[#718096] text-sm">Member since {MOCK_USER.joinedDate}</p>
          </div>
          <button
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              isEditing
                ? 'bg-[#F26A2E] text-white'
                : 'bg-[#1C1630] text-[#F26A2E] border border-[#F26A2E]/30'
            }`}
          >
            {isEditing ? 'Save' : 'Edit'}
          </button>
        </div>

        {/* Editable Contact Info */}
        <div className="space-y-3 mt-4">
          {/* Email */}
          <div className="bg-[#1C1630] rounded-xl p-3 border border-[#2D3748]">
            <label className="text-[10px] text-[#718096] uppercase tracking-wider block mb-1">Email</label>
            {isEditing ? (
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent text-white text-sm focus:outline-none"
                placeholder="Enter email"
              />
            ) : (
              <p className="text-white text-sm">{email}</p>
            )}
          </div>

          {/* Phone */}
          <div className="bg-[#1C1630] rounded-xl p-3 border border-[#2D3748]">
            <label className="text-[10px] text-[#718096] uppercase tracking-wider block mb-1">Phone Number</label>
            {isEditing ? (
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-transparent text-white text-sm focus:outline-none"
                placeholder="Enter phone number"
              />
            ) : (
              <p className="text-white text-sm">{phone}</p>
            )}
          </div>

          {/* Delivery Address */}
          <div className="bg-[#1C1630] rounded-xl p-3 border border-[#2D3748]">
            <label className="text-[10px] text-[#718096] uppercase tracking-wider block mb-1">Delivery Address</label>
            {isEditing ? (
              <textarea
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="w-full bg-transparent text-white text-sm focus:outline-none resize-none"
                rows={2}
                placeholder="Enter delivery address"
              />
            ) : (
              <p className="text-white text-sm">{deliveryAddress}</p>
            )}
          </div>
        </div>

        {/* Loyalty Points */}
        <div className="flex justify-between items-center bg-[#1C1630] rounded-xl p-4 mt-4 relative z-10 border border-[#2D3748]">
           <div>
             <p className="text-[10px] text-[#718096] uppercase tracking-wider">Loyalty Points</p>
             <p className="text-2xl font-bold text-[#F26A2E]">{MOCK_USER.points}</p>
           </div>
           <div className="text-right">
             <p className="text-[10px] text-[#718096] uppercase tracking-wider">Status</p>
             <p className="text-white font-medium">Gold Member</p>
           </div>
        </div>
      </div>

      {/* Purchase History */}
      <h3 className="text-lg font-bold text-white mb-4 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[#F26A2E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Order History
      </h3>

      <div className="flex-1 overflow-y-auto -mx-2 px-2 pb-24">
        {MOCK_HISTORY.map(order => (
          <div key={order.id} className="bg-[#232C33] rounded-xl p-4 mb-4 border border-[#2D3748]">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-bold text-white text-sm">{new Date(order.timestamp).toLocaleDateString()} at {new Date(order.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                <p className="text-xs text-[#718096]">Order #{order.id}</p>
              </div>
              <span className="px-2 py-1 bg-[#F26A2E]/10 text-[#F26A2E] text-[10px] font-bold uppercase rounded-md border border-[#F26A2E]/20">
                {order.status}
              </span>
            </div>

            <div className="space-y-3 mb-3">
              {order.items.map(item => (
                <div key={item._id} className="flex justify-between items-center text-sm">
                  <div className="flex-1">
                     <span className="text-[#A0AEC0] block">{item.quantity}x {item.name}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                     <span className="text-[#718096]">${(item.price * item.quantity).toFixed(2)}</span>
                     {/* Rate Button */}
                     {onReviewProduct && (
                        <button
                          onClick={() => onReviewProduct(item)}
                          className="px-2 py-1 bg-[#1C1630] hover:bg-[#F26A2E]/20 hover:text-[#F26A2E] text-[#718096] rounded text-xs font-medium transition-colors border border-[#2D3748] hover:border-[#F26A2E]/50"
                        >
                          Rate
                        </button>
                     )}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-[#2D3748] flex justify-between items-center">
              <span className="text-[#718096] text-sm">Total</span>
              <span className="text-lg font-bold text-white">${order.total.toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>

       <button
         onClick={onLogout}
         className="mt-4 w-full py-3 border border-red-500/30 text-red-400 rounded-xl font-medium text-sm hover:bg-red-500/10 transition-colors"
       >
        Log Out
      </button>
    </div>
  );
};
