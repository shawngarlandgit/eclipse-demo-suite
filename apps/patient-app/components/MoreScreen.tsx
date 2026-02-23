import React from 'react';
import { useWalkthrough } from './Walkthrough';

interface MoreScreenProps {
  onNavigate: (view: 'about' | 'reviews' | 'profile' | 'preferences' | 'orders') => void;
}

export const MoreScreen: React.FC<MoreScreenProps> = ({ onNavigate }) => {
  const { startWalkthrough, hasCompletedWalkthrough } = useWalkthrough();

  return (
    <div className="flex flex-col h-full bg-[#1C1630] p-4 text-white">
      <h1 className="text-2xl font-bold mb-6 text-[#F26A2E]">More</h1>

      <div className="space-y-3">
        <button
          onClick={() => onNavigate('profile')}
          className="w-full flex items-center justify-between bg-[#232C33] p-4 rounded-xl border border-[#2D3748] active:scale-95 transition-transform"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-[#4A2748] flex items-center justify-center text-[#F26A2E]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span className="font-medium">My Profile</span>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#718096]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <button
          onClick={() => onNavigate('orders')}
          className="w-full flex items-center justify-between bg-[#232C33] p-4 rounded-xl border border-[#2D3748] active:scale-95 transition-transform"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-[#4A2748] flex items-center justify-center text-[#F26A2E]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <span className="font-medium">My Orders</span>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#718096]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <button
          onClick={() => onNavigate('preferences')}
          className="w-full flex items-center justify-between bg-[#232C33] p-4 rounded-xl border border-[#2D3748] active:scale-95 transition-transform"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-[#4A2748] flex items-center justify-center text-[#F26A2E]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <span className="font-medium">My Preferences</span>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#718096]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <button 
          onClick={() => onNavigate('about')}
          className="w-full flex items-center justify-between bg-[#232C33] p-4 rounded-xl border border-[#2D3748] active:scale-95 transition-transform"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-[#4A2748] flex items-center justify-center text-[#F26A2E]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span className="font-medium">About Us</span>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#718096]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <button
          onClick={() => onNavigate('reviews')}
          className="w-full flex items-center justify-between bg-[#232C33] p-4 rounded-xl border border-[#2D3748] active:scale-95 transition-transform"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-[#4A2748] flex items-center justify-center text-[#F26A2E]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <span className="font-medium">Patient Reviews</span>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#718096]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Tour / Tutorial Button */}
        <button
          onClick={startWalkthrough}
          className="w-full flex items-center justify-between bg-gradient-to-r from-[#F26A2E]/20 to-[#4A2748] p-4 rounded-xl border border-[#F26A2E]/30 active:scale-95 transition-transform mt-4"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-[#F26A2E] flex items-center justify-center text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <div className="text-left">
              <span className="font-medium text-white block">
                {hasCompletedWalkthrough ? 'Replay Tutorial' : 'Take the Tour'}
              </span>
              <span className="text-xs text-[#A0AEC0]">Learn how to place an order</span>
            </div>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#F26A2E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>

        {/* Reset App Data (for testing) */}
        <button
          onClick={() => {
            localStorage.removeItem('eclipse-walkthrough-complete');
            localStorage.removeItem('eclipse-age-verified');
            window.location.reload();
          }}
          className="w-full flex items-center justify-between bg-[#232C33] p-4 rounded-xl border border-[#2D3748] active:scale-95 transition-transform mt-2"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div className="text-left">
              <span className="font-medium text-white block">Reset App</span>
              <span className="text-xs text-[#718096]">Clear age gate & tutorial progress</span>
            </div>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#718096]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};
