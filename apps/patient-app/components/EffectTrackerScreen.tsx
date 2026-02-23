import React, { useState } from 'react';
import { AVAILABLE_EFFECTS, EffectOption } from '../types';

interface EffectTrackerProps {
  productName?: string;
  onSubmit: (data: { rating: number; effects: string[]; comment: string }) => void;
  onCancel: () => void;
}

const EffectIcon: React.FC<{ id: string; className?: string }> = ({ id, className }) => {
  switch (id) {
    case 'euphoric': // Star/Sparkles
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      );
    case 'sleepy': // Moon
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      );
    case 'focused': // Target
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2a10 10 0 1010 10A10 10 0 0012 2zm0 18a8 8 0 118-8 8 8 0 01-8 8zm0-14a6 6 0 106 6 6 6 0 00-6-6zm0 10a4 4 0 114-4 4 4 0 01-4 4z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8a4 4 0 100 8 4 4 0 000-8z" />
        </svg>
      );
    case 'relaxed': // Smile/Calm
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'creative': // Lightbulb
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      );
    case 'energetic': // Lightning
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    default:
      return null;
  }
};

export const EffectTrackerScreen: React.FC<EffectTrackerProps> = ({ 
  productName = "Blue Dream", // Default for demo
  onSubmit, 
  onCancel 
}) => {
  const [rating, setRating] = useState<number>(3);
  const [selectedEffects, setSelectedEffects] = useState<string[]>([]);
  const [comment, setComment] = useState<string>("");

  const toggleEffect = (effectId: string) => {
    setSelectedEffects(prev => 
      prev.includes(effectId) 
        ? prev.filter(id => id !== effectId)
        : [...prev, effectId]
    );
  };

  const handleSubmit = () => {
    onSubmit({ rating, effects: selectedEffects, comment });
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 p-4 max-w-md mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-sm font-medium text-emerald-400 uppercase tracking-wider mb-1">
          Track Your Experience
        </h2>
        <h1 className="text-2xl font-bold text-white mb-2">
          How was the {productName}?
        </h1>
        <p className="text-slate-400 text-sm">
          Your feedback helps us recommend better products for you.
        </p>
      </div>

      {/* Rating Slider */}
      <div className="mb-8 bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-700">
        <div className="flex justify-between items-end mb-4">
          <label className="text-lg font-semibold">Rating</label>
          <span className="text-3xl font-bold text-emerald-400">{rating}<span className="text-lg text-slate-500">/5</span></span>
        </div>
        <input 
          type="range" 
          min="1" 
          max="5" 
          step="1"
          value={rating} 
          onChange={(e) => setRating(parseInt(e.target.value))}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
        />
        <div className="flex justify-between mt-2 text-xs text-slate-500">
          <span>Poor</span>
          <span>Average</span>
          <span>Excellent</span>
        </div>
      </div>

      {/* Effects Grid */}
      <div className="mb-8 flex-1">
        <label className="block text-lg font-semibold mb-4">What did you feel?</label>
        <div className="grid grid-cols-2 gap-3">
          {AVAILABLE_EFFECTS.map((effect: EffectOption) => {
            const isSelected = selectedEffects.includes(effect.id);
            return (
              <button
                key={effect.id}
                onClick={() => toggleEffect(effect.id)}
                className={`
                  relative flex items-center justify-start p-4 rounded-xl border-2 transition-all duration-200
                  ${isSelected 
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750 hover:border-slate-600'}
                `}
              >
                <div className="mr-3">
                  <EffectIcon id={effect.id} className="w-6 h-6" />
                </div>
                <span className="font-medium">{effect.label}</span>
                {isSelected && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Comment Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-300 mb-2">Notes (Optional)</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Taste, duration, specific relief..."
          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none h-24 resize-none"
        />
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-4 mt-auto">
        <button 
          onClick={onCancel}
          className="py-4 rounded-xl font-bold text-slate-400 hover:text-white transition-colors"
        >
          Cancel
        </button>
        <button 
          onClick={handleSubmit}
          className="py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-900/50 transition-all active:scale-95"
        >
          Submit Review
        </button>
      </div>
    </div>
  );
};