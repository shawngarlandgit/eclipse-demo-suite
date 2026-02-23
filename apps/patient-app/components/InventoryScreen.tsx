import React, { useState, useMemo, useCallback } from 'react';
import { Product, UserPreferences, Order } from '../types';
import { REAL_INVENTORY } from '../data/realMenu';
import logo from '../assets/logo.svg';
import eclipseSticker from '../assets/eclipse-sticker.svg';
import coastalLogo from '../assets/coastal-remedies.webp';

// Lazy loading image component
const LazyImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
}> = ({ src, alt, className }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className={`relative ${className}`}>
      {!loaded && !error && (
        <div className="absolute inset-0 bg-[#232C33] animate-pulse flex items-center justify-center">
          <svg className="w-8 h-8 text-[#F26A2E]/30" fill="currentColor" viewBox="0 0 24 24">
            <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}
      {error ? (
        <div className="absolute inset-0 bg-[#232C33] flex items-center justify-center">
          <svg className="w-8 h-8 text-[#F26A2E]/50" fill="currentColor" viewBox="0 0 24 24">
            <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-90' : 'opacity-0'}`}
        />
      )}
    </div>
  );
};

export const InventoryScreen: React.FC<{ 
  onProductClick: (p: Product) => void;
  onAddToCart: (p: Product) => void;
  preferences: UserPreferences;
  orderHistory: Order[];
}> = ({ onProductClick, onAddToCart, preferences, orderHistory }) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  
  const categories = ['All', 'Flower', 'Pre-rolls', 'Edibles', 'Vapes', 'Concentrates'];
  
  const inventory = REAL_INVENTORY;

  // --- Recommendation Engine ---
  const recommendations = useMemo(() => {
    const hasEffects = preferences.effects.length > 0;
    const hasProductTypes = preferences.productTypes && preferences.productTypes.length > 0;
    const hasPriceRange = preferences.priceRange.max < 100 || preferences.priceRange.min > 0;
    const hasHistory = orderHistory.length > 0;

    // If no preferences set at all, don't show recommendations
    if (!hasEffects && !hasProductTypes && !hasPriceRange && !hasHistory) return [];

    const historyCategories = new Set(
      orderHistory.flatMap(o => o.items.map(i => i.category))
    );

    return inventory
      .map(product => {
        let score = 0;

        // 1. Match Effects (High Weight)
        if (product.effects && hasEffects) {
          const matchCount = product.effects.filter(e => preferences.effects.includes(e)).length;
          score += matchCount * 4;
        }

        // 2. Match Product Types (High Weight)
        if (hasProductTypes && preferences.productTypes.includes(product.category)) {
          score += 4;
        }

        // 3. Match Price Range (Medium Weight)
        if (product.price >= preferences.priceRange.min && product.price <= preferences.priceRange.max) {
          score += 2;
        } else {
          // Penalize if outside price range
          score -= 2;
        }

        // 4. Match History Category (Low Weight)
        if (historyCategories.has(product.category)) {
          score += 1;
        }

        return { product, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4) // Top 4
      .map(item => item.product);
  }, [inventory, preferences, orderHistory]);


  const filteredProducts = inventory.filter(p => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    let matchesPartner = true;
    if (selectedPartner) {
      // Use explicit partner mapping so filters don't break when product names change.
      if (selectedPartner === 'Eclipse') {
        matchesPartner = true;
      } else if (selectedPartner === 'Eclipse Reserve') {
        matchesPartner = ['Flower', 'Pre-rolls'].includes(p.category);
      } else if (selectedPartner === 'Maine Craft') {
        matchesPartner = p.category === 'Edibles' || (p.name?.toLowerCase().includes('maine craft') ?? false);
      } else if (selectedPartner === 'Eclipse Labs') {
        matchesPartner = ['Vapes', 'Concentrates'].includes(p.category);
      }
    }

    return matchesCategory && matchesSearch && matchesPartner;
  });

  const handlePartnerClick = (partnerName: string) => {
    if (selectedPartner === partnerName) {
      setSelectedPartner(null); // Deselect
    } else {
      setSelectedPartner(partnerName);
      setSelectedCategory('All'); // Reset category to show all partner products
    }
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <img
            src={logo}
            alt="Eclipse"
            className="h-14 w-auto"
          />
          <img
            src={eclipseSticker}
            alt="Eclipse sticker"
            className="w-12 h-12 rounded-lg border border-[#F26A2E]/50 object-cover"
          />
        </div>
        <div className="flex space-x-2">
          <button
            aria-label="Notifications"
            className="w-11 h-11 rounded-full bg-[#232C33] flex items-center justify-center border border-[#2D3748] focus:outline-none focus:ring-2 focus:ring-[#F26A2E] focus:ring-offset-2 focus:ring-offset-[#1C1630]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#94A3B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <label htmlFor="product-search" className="sr-only">Search products</label>
        <input
          id="product-search"
          type="search"
          placeholder="Search strains, effects, or brands..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#232C33] border border-[#2D3748] rounded-2xl py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#F26A2E] focus:ring-offset-2 focus:ring-offset-[#1C1630] transition-all min-h-[48px]"
        />
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#94A3B8] absolute left-4 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Recommended For You */}
      {searchQuery === '' && !selectedPartner && recommendations.length > 0 && (
        <div className="mb-6 -mx-4 px-4 py-4 bg-gradient-to-r from-[#F26A2E]/20 via-[#4A2748]/30 to-[#F26A2E]/20 border-y border-[#F26A2E]/30">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[#F26A2E] rounded-lg flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h2 className="text-white text-xs font-bold">Picks For You</h2>
            </div>
            <span className="text-[8px] text-[#F26A2E] font-bold bg-[#F26A2E]/20 px-2 py-0.5 rounded-full border border-[#F26A2E]/30">Personalized</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
            {recommendations.map(product => (
              <div
                key={product._id}
                onClick={() => onProductClick(product)}
                className="w-32 shrink-0 bg-[#232C33] rounded-xl overflow-hidden border border-[#F26A2E]/40 cursor-pointer shadow-lg shadow-[#F26A2E]/10 active:scale-95 transition-transform"
              >
                <div className="relative h-20 bg-[#1C1630]">
                  <LazyImage src={product.imageUrl} alt={product.name} className="w-full h-full" />
                </div>
                <div className="p-2">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-xs text-white line-clamp-1 flex-1">{product.name}</h3>
                    <span className="text-xs font-bold text-[#F26A2E] ml-1">${Math.floor(product.price)}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToCart(product);
                    }}
                    aria-label={`Add ${product.name} to cart`}
                    className="w-full py-2 bg-[#F26A2E] text-white rounded-lg text-xs font-bold active:scale-95 transition-transform min-h-[36px]"
                  >
                    + Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Featured Partners */}
      {searchQuery === '' && (
        <div className="mb-8 -mx-1 px-3 py-4 rounded-2xl bg-gradient-to-r from-[#211B2F]/72 via-[#262036]/66 to-[#211B2F]/72 border border-[#3F3552]/45">
          <h2 className="text-[#E7DDF5] text-[10px] font-bold uppercase tracking-[0.22em] mb-4">Featured Partners</h2>
          <div className="grid grid-cols-4 gap-3">
            {[
              { name: 'Eclipse', icon: logo },
              { name: 'Eclipse Reserve', icon: eclipseSticker },
              { name: 'Maine Craft', icon: coastalLogo },
              { name: 'Eclipse Labs', icon: eclipseSticker }
            ].map((partner, i) => (
              <button 
                key={i} 
                onClick={() => handlePartnerClick(partner.name)}
                className="flex flex-col items-center gap-2 w-full group"
              >
                <div className={`w-full h-20 rounded-xl flex items-center justify-center p-2 shadow-md border transition-all ${
                  selectedPartner === partner.name 
                    ? 'bg-[#F26A2E]/25 border-[#F26A2E] shadow-[#F26A2E]/35 scale-[1.03]' 
                    : 'bg-[#2A2A3D] border-[#4A355E] group-hover:border-[#F26A2E]/65 group-hover:bg-[#302743]'
                }`}>
                  <div className="w-14 h-14 flex items-center justify-center">
                    <img
                      src={partner.icon}
                      alt={partner.name}
                      className={`w-full h-full object-contain ${
                        partner.name === 'Maine Craft' ? 'mix-blend-multiply' : ''
                      }`}
                    />
                  </div>
                </div>
                <span className={`text-[11px] font-medium transition-colors text-center ${
                  selectedPartner === partner.name ? 'text-[#FFC3A9]' : 'text-[#B2A8C8] group-hover:text-[#EADAF8]'
                }`}>{partner.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="flex space-x-2 overflow-x-auto pb-4 mb-2 scrollbar-hide">
        {categories.map((cat) => (
          <button 
            key={cat} 
            onClick={() => setSelectedCategory(cat)}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === cat 
                ? 'bg-[#F26A2E] text-white shadow-lg shadow-[#F26A2E]/20' 
                : 'bg-[#232C33] text-[#718096] hover:bg-[#2D3748] border border-[#2D3748]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div data-walkthrough="inventory" className="grid grid-cols-2 gap-4 mt-2 relative z-10">
        {filteredProducts.length > 0 ? (
          filteredProducts.map(product => (
            <div 
              key={product._id} 
              onClick={() => onProductClick(product)}
              className="bg-[#232C33] rounded-2xl overflow-hidden shadow-sm active:scale-[0.98] transition-all duration-200 flex flex-col h-full cursor-pointer border border-[#2D3748] hover:border-[#F26A2E]/30"
            >
              <div className="relative h-36 bg-[#1C1630] shrink-0">
                <LazyImage src={product.imageUrl} alt={product.name} className="w-full h-full" />
                <div className="absolute top-2 right-2 bg-[#1C1630] px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-[#F26A2E]/50 text-[#F26A2E] shadow-lg">
                  {product.strainType}
                </div>
                {product.stockLevel === 'Low' && (
                  <div className="absolute bottom-2 left-2 bg-red-600 px-2 py-1 rounded-md text-xs font-bold text-white shadow-lg">
                    Low Stock
                  </div>
                )}
              </div>
              <div className="p-3.5 flex flex-col flex-1">
                <h3 className="font-bold text-sm text-white line-clamp-1 mb-1">{product.name}</h3>
                <div className="flex items-center space-x-1 mb-3">
                  <span className="text-[10px] text-[#F26A2E] font-bold">
                    {product.thcContent > 100 ? `${product.thcContent}mg` : `${product.thcContent}% THC`}
                  </span>
                </div>
                
                <div className="mt-auto flex items-center justify-between">
                  <span className="font-bold text-white text-sm">${product.price}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToCart(product);
                    }}
                    data-walkthrough="add-to-cart"
                    aria-label={`Add ${product.name} to cart`}
                    className="p-3 bg-[#F26A2E]/10 hover:bg-[#F26A2E] text-[#F26A2E] hover:text-white rounded-lg transition-all border border-[#F26A2E]/20 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 py-20 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-[#232C33] rounded-full flex items-center justify-center mb-4 text-[#718096]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-[#718096] text-sm font-medium">No matches for "{searchQuery}"</p>
            <button 
              onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
              className="mt-4 text-[#F26A2E] text-xs font-bold uppercase tracking-[0.1em]"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
