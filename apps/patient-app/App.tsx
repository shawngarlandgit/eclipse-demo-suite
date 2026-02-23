import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from 'convex/react';
import { api } from './convex/_generated/api';
import { EffectTrackerScreen } from './components/EffectTrackerScreen';
import { CartScreen } from './components/CartScreen';
import { CheckoutScreen } from './components/CheckoutScreen';
import { OrderSuccessScreen } from './components/OrderSuccessScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { ProductDetailScreen } from './components/ProductDetailScreen';
import { AboutScreen } from './components/AboutScreen';
import { ReviewsScreen } from './components/ReviewsScreen';
import { MoreScreen } from './components/MoreScreen';
import { WelcomeScreen } from './components/WelcomeScreen';
import { InventoryScreen } from './components/InventoryScreen';
import { MyOrdersScreen } from './components/MyOrdersScreen';
import { Layout } from './components/Layout';
import { AgeGateScreen } from './components/AgeGateScreen';
import { PreferencesScreen } from './components/PreferencesScreen';
import { WalkthroughProvider, FirstTimePrompt, useWalkthrough } from './components/Walkthrough';
import { OrderStatusNotification } from './components/OrderStatusNotification';
import { Product, CartItem, UserPreferences, Order } from './types';
import type { Id } from './convex/_generated/dataModel';

// --- APP LOGIC ---

function AppContent() {
  // Mock auth for bypass
  const isSignedIn = true;
  const signOut = () => {
    setIsAgeVerified(false);
    localStorage.removeItem('eclipse-age-verified');
  };

  const [isAgeVerified, setIsAgeVerified] = useState(() => {
    return localStorage.getItem('eclipse-age-verified') === 'true';
  });
  
  const [activeTab, setActiveTab] = useState('inventory');
  const [view, setView] = useState<'welcome' | 'list' | 'detail' | 'cart' | 'checkout' | 'success' | 'more' | 'about' | 'reviews' | 'profile' | 'preferences' | 'orders'>('welcome');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [lastOrderId, setLastOrderId] = useState<string>('');
  const [lastOrderType, setLastOrderType] = useState<'pickup' | 'delivery'>('pickup');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active order tracking (Convex ID for real-time updates)
  const [activeConvexOrderId, setActiveConvexOrderId] = useState<Id<"orders"> | null>(() => {
    const stored = localStorage.getItem('eclipse-active-order-id');
    return stored ? (stored as Id<"orders">) : null;
  });
  const [statusNotification, setStatusNotification] = useState<{ status: string; driverName?: string } | null>(null);
  const previousStatusRef = useRef<string | null>(null);

  // Subscribe to active order status
  const activeOrder = useQuery(
    api.orders.getOrder,
    activeConvexOrderId ? { orderId: activeConvexOrderId } : "skip"
  );

  // Watch for status changes and show notifications
  useEffect(() => {
    if (!activeOrder) return;

    const currentStatus = activeOrder.status;
    const previousStatus = previousStatusRef.current;

    // Show notification on status change (but not on initial load if pending)
    if (previousStatus && previousStatus !== currentStatus) {
      if (['accepted', 'picked_up', 'en_route', 'delivered'].includes(currentStatus)) {
        setStatusNotification({
          status: currentStatus,
          driverName: activeOrder.driverName,
        });
      }
    }

    previousStatusRef.current = currentStatus;

    // Clear active order tracking when delivered
    if (currentStatus === 'delivered') {
      setTimeout(() => {
        setActiveConvexOrderId(null);
        localStorage.removeItem('eclipse-active-order-id');
      }, 10000); // Keep tracking for 10s after delivery to show notification
    }
  }, [activeOrder?.status, activeOrder?.driverName]);

  // --- STATE LIFTED FOR RECOMMENDATIONS ---
  const [userPreferences, setUserPreferences] = useState<UserPreferences>(() => {
    const stored = localStorage.getItem('eclipse-user-preferences');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // Fall through to defaults
      }
    }
    return {
      effects: [],
      productTypes: [],
      priceRange: { min: 0, max: 100 },
      notifications: true
    };
  });

  // Persist preferences to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('eclipse-user-preferences', JSON.stringify(userPreferences));
  }, [userPreferences]);

  const [orderHistory, setOrderHistory] = useState<Order[]>([
    {
      id: 'ord-1',
      items: [{ _id: 'flower-1', name: 'Hazy’s Happy Deal #1', category: 'Flower', price: 45, quantity: 1, strainType: 'Hybrid', thcContent: 22.5, stockLevel: 'High' }],
      subtotal: 45, tax: 2.48, total: 47.48, pickupTime: 'ASAP', status: 'completed', timestamp: Date.now() - 10000000
    }
  ]);

  // Mutations (Mocked)
  const submitReview = async (data: any) => {
    console.log("Mock Submit Review:", data);
    return Promise.resolve();
  };

  const handleAgeVerify = () => {
    setIsAgeVerified(true);
    localStorage.setItem('eclipse-age-verified', 'true');
  };

  if (view === 'welcome') {
    return <WelcomeScreen onEnter={() => setView('list')} />;
  }

  if (!isAgeVerified) {
    return <AgeGateScreen onVerify={handleAgeVerify} />;
  }

  const showToast = (msg: string) => {
    setToastMessage(msg);
    // Auto-dismiss after 5 seconds if user doesn't interact
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Cart Logic
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item._id === product._id);
      if (existing) {
        return prev.map(item => 
          item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    showToast(`Added ${product.name} to cart`);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item._id === id) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : item;
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 1.055; // 5.5% Maine Tax

  // Navigation Logic
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'inventory') {
      setView('list');
      setShowReview(false);
    }
    if (tab === 'cart') setView('cart');
    if (tab === 'more') setView('more');
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setShowReview(false); 
    setView('detail');
  };

  const handleReviewProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowReview(true);
  };

  const handleReviewSubmit = async (data: any) => {
    if (!selectedProduct) return;
    console.log("Mock Submit Review:", data);
    alert("Thanks for your feedback!");
    setShowReview(false);
    setSelectedProduct(null);
  };

  const handlePlaceOrder = (pickupTime: string, orderId?: string, orderType?: 'pickup' | 'delivery') => {
    const displayOrderId = orderId ? orderId.slice(-9).toUpperCase() : Math.random().toString(36).substr(2, 9).toUpperCase();
    setLastOrderId(displayOrderId);
    setLastOrderType(orderType || 'pickup');

    // Track delivery orders for real-time status updates
    if (orderType === 'delivery' && orderId) {
      setActiveConvexOrderId(orderId as Id<"orders">);
      localStorage.setItem('eclipse-active-order-id', orderId);
      previousStatusRef.current = 'pending'; // Initialize status tracking
    }
    
    // Add to history
    const newOrder: Order = {
      id: displayOrderId,
      items: [...cart],
      subtotal: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      tax: cartTotal - cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      total: cartTotal,
      pickupTime,
      status: 'pending',
      timestamp: Date.now()
    };
    setOrderHistory(prev => [newOrder, ...prev]);

    setCart([]); 
    setView('success');
  };

  const handleLogout = () => {
    signOut();
    setActiveTab('inventory');
    setView('list');
  };

  // Render logic...
  if (view === 'success') {
    return (
      <>
        {statusNotification && (
          <OrderStatusNotification
            status={statusNotification.status}
            driverName={statusNotification.driverName}
            onDismiss={() => setStatusNotification(null)}
          />
        )}
        <OrderSuccessScreen orderId={lastOrderId} orderType={lastOrderType} onReturnHome={() => { setView('list'); setActiveTab('inventory'); }} />
      </>
    );
  }

  if (showReview && selectedProduct) {
    return (
      <div className="min-h-screen bg-slate-900 max-w-md mx-auto border-x border-slate-800">
        <EffectTrackerScreen 
          productName={selectedProduct.name}
          onSubmit={handleReviewSubmit}
          onCancel={() => setShowReview(false)}
        />
      </div>
    );
  }

  return (
    <Layout 
      activeTab={view === 'cart' || view === 'checkout' ? 'cart' : (view === 'more' || view === 'profile' || view === 'about' || view === 'reviews' || view === 'orders' ? 'more' : 'inventory')} 
      onTabChange={handleTabChange}
      cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
    >
      {/* View Routing */}
      {view === 'list' && (
        <InventoryScreen 
          onProductClick={handleProductClick} 
          onAddToCart={addToCart}
          preferences={userPreferences}
          orderHistory={orderHistory}
        />
      )}
      
      {view === 'detail' && selectedProduct && (
        <ProductDetailScreen 
          product={selectedProduct}
          onAddToCart={addToCart}
          onBack={() => setView('list')}
        />
      )}
      
      {view === 'cart' && (
        <CartScreen
          items={cart}
          onUpdateQuantity={updateQuantity}
          onCheckout={() => setView('checkout')}
          onBack={() => setView('list')}
          onClearCart={clearCart}
        />
      )}

      {view === 'checkout' && (
        <CheckoutScreen 
          items={cart} 
          total={cartTotal} 
          onPlaceOrder={handlePlaceOrder}
          onBack={() => setView('cart')}
        />
      )}

      {view === 'more' && (
        <MoreScreen onNavigate={(target) => setView(target)} />
      )}

      {view === 'profile' && (
        <ProfileScreen onLogout={handleLogout} onReviewProduct={handleReviewProduct} />
      )}

      {view === 'about' && (
        <AboutScreen />
      )}

      {view === 'reviews' && (
        <ReviewsScreen />
      )}

      {view === 'orders' && (
        <MyOrdersScreen onBack={() => setView('more')} />
      )}

      {view === 'preferences' && (
        <PreferencesScreen 
          preferences={userPreferences} 
          onSave={setUserPreferences} 
          onBack={() => setView('more')} 
        />
      )}

      {/* Toast Notification with Action Buttons */}
      {toastMessage && (
        <div
          className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-[#1C1630] text-white px-4 py-3 rounded-xl shadow-2xl z-50 border border-[#F26A2E]/50 min-w-[280px]"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-[#F26A2E] rounded-full flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-sm font-bold">{toastMessage}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setToastMessage(null)}
              className="flex-1 py-2 px-3 bg-[#232C33] text-white rounded-lg text-xs font-bold border border-[#2D3748] hover:bg-[#2D3748] transition-colors"
            >
              Continue Shopping
            </button>
            <button
              onClick={() => {
                setToastMessage(null);
                setView('cart');
                setActiveTab('cart');
              }}
              className="flex-1 py-2 px-3 bg-[#F26A2E] text-white rounded-lg text-xs font-bold hover:bg-[#e24a2a] transition-colors"
            >
              Checkout
            </button>
          </div>
        </div>
      )}

      {/* First Time User Walkthrough Prompt */}
      <FirstTimePrompt />

      {/* Order Status Notification */}
      {statusNotification && (
        <OrderStatusNotification
          status={statusNotification.status}
          driverName={statusNotification.driverName}
          onDismiss={() => setStatusNotification(null)}
        />
      )}
    </Layout>
  );
}

// --- ROOT APP ---

export default function App() {
  return (
    <WalkthroughProvider>
      <AppContent />
    </WalkthroughProvider>
  );
}