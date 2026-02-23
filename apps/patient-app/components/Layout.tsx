import React from 'react';

export const Layout: React.FC<{
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (t: string) => void;
  cartCount: number;
}> = ({ children, activeTab, onTabChange, cartCount }) => (
  <div className="min-h-screen bg-[#1C1630] text-white flex flex-col w-full md:max-w-md md:mx-auto md:border-x border-[#2D3748] shadow-2xl relative">
    {/* Top Navigation */}
    <nav className="sticky top-0 w-full bg-[#1C1630]/95 backdrop-blur-md border-b border-[#2D3748] px-4 py-3 z-20" aria-label="Main navigation">
      <div className="flex items-center justify-between">
        {/* Left Nav Buttons */}
        <div className="flex items-center gap-1" role="tablist">
          <button
            onClick={() => onTabChange('inventory')}
            role="tab"
            aria-selected={activeTab === 'inventory'}
            aria-controls="main-content"
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#F26A2E] focus:ring-offset-2 focus:ring-offset-[#1C1630] ${
              activeTab === 'inventory'
                ? 'bg-[#F26A2E]/20 text-[#F26A2E]'
                : 'text-[#94A3B8] hover:text-white hover:bg-[#232C33]'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <span className="text-sm font-medium">Menu</span>
          </button>

          <button
            onClick={() => onTabChange('more')}
            role="tab"
            aria-selected={activeTab === 'more'}
            aria-controls="main-content"
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#F26A2E] focus:ring-offset-2 focus:ring-offset-[#1C1630] ${
              activeTab === 'more'
                ? 'bg-[#F26A2E]/20 text-[#F26A2E]'
                : 'text-[#94A3B8] hover:text-white hover:bg-[#232C33]'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span className="text-sm font-medium">More</span>
          </button>
        </div>

        {/* Cart Button with Badge */}
        <button
          onClick={() => onTabChange('cart')}
          data-walkthrough="cart-tab"
          role="tab"
          aria-selected={activeTab === 'cart'}
          aria-controls="main-content"
          aria-label={`Cart${cartCount > 0 ? `, ${cartCount} items` : ', empty'}`}
          className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#F26A2E] focus:ring-offset-2 focus:ring-offset-[#1C1630] ${
            activeTab === 'cart'
              ? 'bg-[#F26A2E] text-white'
              : 'bg-[#232C33] text-white hover:bg-[#F26A2E]/80 border border-[#2D3748]'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <span className="text-sm font-medium">Cart</span>
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#1C1630]" aria-hidden="true">
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </nav>

    {/* Main Content Area */}
    <main id="main-content" className="flex-1 overflow-y-auto scrollbar-hide relative z-0" role="tabpanel">
      {children}
    </main>
  </div>
);
