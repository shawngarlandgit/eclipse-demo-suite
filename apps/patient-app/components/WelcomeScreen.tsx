import React from 'react';
import logo from '../assets/logo.svg';
import eclipseSticker from '../assets/eclipse-sticker.svg';

interface WelcomeScreenProps {
  onEnter: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onEnter }) => {
  return (
    <div className="min-h-screen bg-[#1C1630] text-white flex flex-col relative overflow-hidden">
      {/* Background Image Overlay */}
      <div className="absolute inset-0 z-0 opacity-20">
        <img
          src="https://images.weedmaps.com/brands/000/072/418/desktop_hero/1719772182-20240618_162040.jpg"
          alt="Background" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1C1630] via-transparent to-[#1C1630]"></div>
      </div>

      <div className="relative z-10 flex flex-col h-full p-6">
        <div className="flex-1 flex flex-col items-center justify-center text-center mt-10">
          <div className="w-[360px] max-w-full h-28 mb-8 px-2 transform hover:scale-105 transition-transform duration-500">
            <img src={logo} alt="Eclipse" className="w-full h-full object-contain" />
          </div>
          <div className="w-24 h-24 mb-6 rounded-2xl overflow-hidden border-2 border-[#F26A2E]/60 shadow-xl shadow-[#F26A2E]/20">
            <img src={eclipseSticker} alt="Eclipse sticker logo" className="w-full h-full object-cover" />
          </div>
          
          <h1 className="text-4xl font-bold mb-4 tracking-tight">
            Eclipse <span className="text-[#F26A2E]">Cannabis</span>
          </h1>
          <p className="text-[#A0AEC0] text-lg max-w-xs leading-relaxed">
            Curated Maine Menu
          </p>
          <div className="flex items-center space-x-2 mt-2 text-[#94A3B8] text-sm">
            <span>Flower</span>
            <span>•</span>
            <span>Vapes</span>
            <span>•</span>
            <span>Concentrates</span>
          </div>
        </div>

        <div className="mt-auto mb-10 space-y-6 pt-8">
          <div className="bg-[#232C33]/90 backdrop-blur-md rounded-2xl p-6 border border-[#2D3748] shadow-xl">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#2D3748]">
              <div className="flex items-center space-x-1">
                <span className="text-yellow-400 text-lg">★</span>
                <span className="font-bold text-xl">4.9</span>
                <span className="text-[#718096] text-sm ml-1">(45+ Reviews)</span>
              </div>
              <span className="text-[#F26A2E] text-xs font-bold uppercase tracking-wider bg-[#F26A2E]/10 px-2 py-1 rounded-md">Top Rated</span>
            </div>
            <p className="text-[#E2E8F0] text-sm italic leading-relaxed">
              "We grow and provide the highest quality craft cannabis at affordable prices to medical marijuana patients throughout Maine."
            </p>
          </div>

          <button 
            onClick={onEnter}
            className="w-full py-4 bg-[#F26A2E] hover:bg-[#E24A2A] text-white rounded-xl font-bold text-lg shadow-lg shadow-[#F26A2E]/20 transition-all active:scale-95 flex items-center justify-center group"
          >
            <span>Enter Store</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
          
          <p className="text-center text-[#718096] text-xs">
            Must be 21+ or a valid medical patient.
          </p>
        </div>
      </div>
    </div>
  );
};
