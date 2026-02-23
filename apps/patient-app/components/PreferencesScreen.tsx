import React, { useState } from 'react';
import { AVAILABLE_EFFECTS, PRODUCT_CATEGORIES, UserPreferences } from '../types';
import { ProductCategoryIcons } from './icons/ProductIcons';

interface PreferencesScreenProps {
  preferences: UserPreferences;
  onSave: (newPrefs: UserPreferences) => void;
  onBack: () => void;
}

export const PreferencesScreen: React.FC<PreferencesScreenProps> = ({ preferences, onSave, onBack }) => {
  const [selectedEffects, setSelectedEffects] = useState<string[]>(preferences.effects);
  const [selectedProductTypes, setSelectedProductTypes] = useState<string[]>(preferences.productTypes || []);
  const [priceRange, setPriceRange] = useState(preferences.priceRange);
  const [notifications, setNotifications] = useState(preferences.notifications);

  const toggleEffect = (id: string) => {
    setSelectedEffects(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleProductType = (id: string) => {
    setSelectedProductTypes(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    onSave({
      effects: selectedEffects,
      productTypes: selectedProductTypes,
      priceRange,
      notifications
    });
    onBack();
  };

  return (
    <div className="flex flex-col h-full bg-[#1C1630] text-white">
      {/* Header */}
      <div className="p-4 border-b border-[#2D3748] flex items-center space-x-4">
        <button onClick={onBack} className="p-1 text-[#718096]">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-[#F26A2E]">My Preferences</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-8 pb-24">
        {/* Preferred Product Types */}
        <section>
          <h2 className="text-[#A0AEC0] text-xs font-bold uppercase tracking-wider mb-4">Preferred Product Types</h2>
          <div className="grid grid-cols-2 gap-3">
            {PRODUCT_CATEGORIES.map(category => {
              const IconComponent = ProductCategoryIcons[category.id];
              return (
                <button
                  key={category.id}
                  onClick={() => toggleProductType(category.id)}
                  className={`p-4 rounded-xl text-sm font-medium border transition-all flex items-center gap-3 ${
                    selectedProductTypes.includes(category.id)
                      ? 'bg-[#F26A2E]/20 border-[#F26A2E] text-white shadow-lg shadow-[#F26A2E]/20'
                      : 'bg-[#232C33] border-[#2D3748] text-[#A0AEC0]'
                  }`}
                >
                  {IconComponent && (
                    <IconComponent
                      size={28}
                      className={selectedProductTypes.includes(category.id) ? 'text-[#F26A2E]' : 'text-[#718096]'}
                    />
                  )}
                  <span>{category.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Preferred Effects */}
        <section>
          <h2 className="text-[#A0AEC0] text-xs font-bold uppercase tracking-wider mb-4">Preferred Effects</h2>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_EFFECTS.map(effect => (
              <button
                key={effect.id}
                onClick={() => toggleEffect(effect.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                  selectedEffects.includes(effect.id)
                    ? 'bg-[#F26A2E] border-[#F26A2E] text-white shadow-lg shadow-[#F26A2E]/20'
                    : 'bg-[#232C33] border-[#2D3748] text-[#A0AEC0]'
                }`}
              >
                {effect.label}
              </button>
            ))}
          </div>
        </section>

        {/* Price Range */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[#A0AEC0] text-xs font-bold uppercase tracking-wider">Price Range</h2>
            <span className="text-[#F26A2E] font-bold">${priceRange.min} - ${priceRange.max}</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="200" 
            value={priceRange.max}
            onChange={(e) => setPriceRange(prev => ({ ...prev, max: parseInt(e.target.value) }))}
            className="w-full h-2 bg-[#232C33] rounded-lg appearance-none cursor-pointer accent-[#F26A2E]"
          />
          <div className="flex justify-between mt-2 text-[10px] text-[#718096]">
            <span>$0</span>
            <span>$200+</span>
          </div>
        </section>

        {/* Notifications */}
        <section className="bg-[#232C33] p-4 rounded-xl border border-[#2D3748] flex items-center justify-between">
          <div>
            <h3 className="font-bold">Stock Notifications</h3>
            <p className="text-xs text-[#718096]">Get alerted when your favorites are low.</p>
          </div>
          <button 
            onClick={() => setNotifications(!notifications)}
            className={`w-12 h-6 rounded-full relative transition-colors ${notifications ? 'bg-[#F26A2E]' : 'bg-[#2D3748]'}`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notifications ? 'right-1' : 'left-1'}`}></div>
          </button>
        </section>
      </div>

      {/* Save Button */}
      <div className="p-4 bg-[#1C1630]/95 backdrop-blur-md border-t border-[#2D3748] absolute bottom-20 w-full left-0">
        <button 
          onClick={handleSave}
          className="w-full py-4 bg-[#F26A2E] hover:bg-[#E24A2A] text-white rounded-xl font-bold shadow-lg shadow-black/30 transition-all active:scale-95"
        >
          Save Preferences
        </button>
      </div>
    </div>
  );
};