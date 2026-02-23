import React from 'react';
import { PatientReview } from '../types';

// Mock User Reviews Data
const MY_REVIEWS: (PatientReview & { productName: string, productType: string })[] = [
  {
    _id: 'rev-1',
    productId: 'flower-1',
    userId: 'user-1',
    rating: 5,
    effects: ['happy', 'relaxed'],
    comment: "This Happy Deal is unbeatable. The cure on the flower is perfect and it smokes so smooth.",
    timestamp: Date.now() - 1000 * 60 * 60 * 24 * 2, // 2 days ago
    productName: "Hazy’s Happy Deal #1 • Hybrid",
    productType: "Flower"
  },
  {
    _id: 'rev-2',
    productId: 'edible-2',
    userId: 'user-1',
    rating: 5,
    effects: ['euphoric', 'sleepy'],
    comment: "Coastal Remedies gummies always hit the spot. These Apple Berry ones taste amazing.",
    timestamp: Date.now() - 1000 * 60 * 60 * 24 * 14, // 2 weeks ago
    productName: "1000mg Apple Berry Gummies",
    productType: "Edible"
  },
  {
    _id: 'rev-3',
    productId: 'vape-4',
    userId: 'user-1',
    rating: 4,
    effects: ['relaxed'],
    comment: "Solid disposable. Good flavor, but the battery died a bit before the oil was gone.",
    timestamp: Date.now() - 1000 * 60 * 60 * 24 * 45, // 1.5 months ago
    productName: "Cured Resin Disposable",
    productType: "Vape"
  }
];

export const ReviewsScreen: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-[#1C1630] p-4 text-white overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#F26A2E]">My Reviews</h1>
        <div className="flex items-center space-x-1 bg-[#232C33] px-3 py-1 rounded-full border border-[#2D3748]">
          <span className="text-[#A0AEC0] text-xs font-bold uppercase tracking-wider">Total</span>
          <span className="text-white font-bold">{MY_REVIEWS.length}</span>
        </div>
      </div>

      <div className="space-y-4 pb-20">
        {MY_REVIEWS.map((review) => (
          <div key={review._id} className="bg-[#232C33] rounded-xl p-4 border border-[#2D3748] shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-bold text-white text-sm">{review.productName}</h3>
                <span className="text-[10px] text-[#718096] uppercase tracking-wider">{review.productType}</span>
              </div>
              <div className="flex text-yellow-400 text-xs">
                {'★'.repeat(review.rating)}
                <span className="text-[#2D3748]">{'★'.repeat(5 - review.rating)}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {review.effects.map(effect => (
                <span key={effect} className="px-2 py-0.5 bg-[#1C1630] rounded text-[10px] text-[#F26A2E] border border-[#2D3748]">
                  {effect}
                </span>
              ))}
            </div>

            <p className="text-sm text-[#A0AEC0] italic leading-relaxed mb-3">"{review.comment}"</p>

            <div className="text-[10px] text-[#718096] text-right">
              {new Date(review.timestamp).toLocaleDateString()}
            </div>
          </div>
        ))}

        <div className="mt-8 text-center">
          <p className="text-[#718096] text-xs mb-4">
            Reviews help other patients find the right medicine.
          </p>
          <button className="px-6 py-3 bg-[#2D3748] text-[#A0AEC0] rounded-xl text-xs font-bold hover:bg-[#F26A2E] hover:text-white transition-colors">
            Review a Past Purchase
          </button>
        </div>
      </div>
    </div>
  );
};