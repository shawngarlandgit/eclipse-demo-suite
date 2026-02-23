import React from 'react';

export const AboutScreen: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-[#1C1630] p-4 text-white overflow-y-auto">
      <h1 className="text-2xl font-bold mb-6 text-[#F26A2E]">About Us</h1>
      
      <div className="rounded-2xl overflow-hidden shadow-lg border border-[#2D3748] mb-6">
        <img
          src="https://images.weedmaps.com/brands/000/072/418/desktop_hero/1719772182-20240618_162040.jpg"
          alt="Eclipse Storefront" 
          className="w-full h-64 object-cover"
        />
      </div>

      <div className="space-y-4 text-[#A0AEC0] leading-relaxed">
        <p>
          <strong className="text-white">Welcome to Eclipse</strong>, a Maine-focused cannabis brand with a curated product catalog.
        </p>
        <p>
          We focus on quality flower, concentrates, vapes, and gummies selected for flavor, consistency, and patient outcomes.
        </p>
        <p>
          Our mission is to provide a welcoming, knowledgeable environment where patients can find the relief they need with the highest quality products available.
        </p>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-bold text-white mb-4">Catalog Highlights</h2>
        <div className="space-y-3">
          <div className="bg-[#232C33] p-4 rounded-xl border border-[#2D3748]">
            <h3 className="font-bold text-[#F26A2E]">Top Flower</h3>
            <p className="text-sm text-[#718096]">Orange Push Pop, Punchline, Black Maple, and more.</p>
          </div>
          <div className="bg-[#232C33] p-4 rounded-xl border border-[#2D3748]">
            <h3 className="font-bold text-[#F26A2E]">Vapes + Concentrates</h3>
            <p className="text-sm text-[#718096]">Live resin carts and premium solventless options.</p>
          </div>
          <div className="bg-[#232C33] p-4 rounded-xl border border-[#2D3748]">
            <h3 className="font-bold text-[#F26A2E]">Edibles</h3>
            <p className="text-sm text-[#718096]">Maine Craft Cannabis gummies in multiple flavors.</p>
          </div>
        </div>
      </div>

      {/* App Credits */}
      <div className="mt-8 pt-6 border-t border-[#2D3748]">
        <h2 className="text-lg font-bold text-white mb-4">About This App</h2>
        <div className="bg-[#232C33] p-4 rounded-xl border border-[#2D3748]">
          <p className="text-sm text-[#718096] mb-3">
            Built with care for the cannabis community.
          </p>
          <p className="text-xs text-[#4A5568]">
            <a
              href="https://www.vecteezy.com/free-vector/cannabis-flower"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#F26A2E] hover:underline"
            >
              Cannabis Flower Vectors by Vecteezy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
