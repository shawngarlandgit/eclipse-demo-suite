import React, { useState } from 'react';
import { Product } from '../types';

interface ProductDetailScreenProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onBack: () => void;
}

export const ProductDetailScreen: React.FC<ProductDetailScreenProps> = ({ product, onAddToCart, onBack }) => {
  const [showLabResults, setShowLabResults] = useState(false);
  const [showLabInfoModal, setShowLabInfoModal] = useState(false);
  const lab = product.labResults;

  return (
    <div className="flex flex-col h-full bg-[#1C1630] relative">
      {/* Back Button Overlay */}
      <button
        onClick={onBack}
        aria-label="Go back"
        className="absolute top-4 left-4 z-20 w-11 h-11 bg-[#1C1630] rounded-full flex items-center justify-center text-white border border-[#2D3748] shadow-lg"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Hero Image */}
      <div className="h-72 w-full relative shrink-0">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1C1630] via-transparent to-transparent"></div>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 -mt-12 relative z-10 overflow-y-auto pb-32 scrollbar-hide">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <span className="px-2 py-0.5 rounded bg-[#F26A2E]/20 text-[#F26A2E] text-[10px] font-bold uppercase border border-[#F26A2E]/30">
                {product.strainType}
              </span>
              <span className="px-2 py-0.5 rounded bg-[#232C33] text-[#A0AEC0] text-[10px] font-bold uppercase border border-[#2D3748]">
                {product.category}
              </span>
            </div>
            <h1 className="text-xl font-bold text-white leading-tight">{product.name}</h1>
            {product.genetics && (
              <p className="text-xs text-[#718096] mt-1">Genetics: {product.genetics}</p>
            )}
          </div>
          <div className="ml-4 text-right">
             <div className="text-2xl font-bold text-[#F26A2E]">${product.price}</div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-0 my-4 py-3 border-y border-[#2D3748]">
          <div className="text-center border-r border-[#2D3748]">
            <p className="text-[9px] text-[#718096] uppercase tracking-wider mb-0.5">THC</p>
            <p className="font-bold text-white text-base">
              {product.thcContent > 100 ? `${product.thcContent}mg` : `${product.thcContent}%`}
            </p>
          </div>
          <div className="text-center border-r border-[#2D3748]">
            <p className="text-[9px] text-[#718096] uppercase tracking-wider mb-0.5">CBD</p>
            <p className="font-bold text-white text-base">
              {lab?.cbdPercentage ? `${lab.cbdPercentage}%` : '<0.1%'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[9px] text-[#718096] uppercase tracking-wider mb-0.5">Total Terps</p>
            <p className="font-bold text-white text-base">
              {lab?.totalTerpenes ? `${lab.totalTerpenes}%` : 'N/A'}
            </p>
          </div>
        </div>

        {/* Lab Results Toggle */}
        {lab && (
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setShowLabResults(!showLabResults)}
              className="flex-1 py-3 bg-[#232C33] rounded-xl border border-[#2D3748] flex items-center justify-between px-4 active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#F26A2E]/20 rounded-lg flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#F26A2E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="text-left">
                  <span className="text-sm font-bold text-white block">Lab Test Results</span>
                  <span className="text-[10px] text-[#718096]">
                    {lab.labName} • {lab.testedDate}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {lab.passed && (
                  <span className="text-[9px] font-bold text-[#F26A2E] bg-[#F26A2E]/20 px-2 py-0.5 rounded-full">PASSED</span>
                )}
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-[#718096] transition-transform ${showLabResults ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            {/* Info Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowLabInfoModal(true);
              }}
              aria-label="Learn about cannabis testing"
              className="w-11 h-11 bg-[#232C33] rounded-xl border border-[#2D3748] flex items-center justify-center active:scale-95 transition-transform"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#718096]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
        )}

        {/* Expanded Lab Results */}
        {showLabResults && lab && (
          <div className="mb-4 bg-[#232C33] rounded-xl border border-[#F26A2E]/30 overflow-hidden">
            {/* Batch Info */}
            <div className="p-3 border-b border-[#2D3748] bg-[#1C1630]/50">
              <div className="flex justify-between text-xs">
                <span className="text-[#718096]">Batch #</span>
                <span className="text-white font-mono">{lab.batchNumber}</span>
              </div>
            </div>

            {/* Cannabinoids */}
            <div className="p-3 border-b border-[#2D3748]">
              <h4 className="text-[10px] font-bold text-[#A0AEC0] uppercase tracking-wider mb-2">Cannabinoid Profile</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#E2E8F0]">THC</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-[#1C1630] rounded-full overflow-hidden">
                      <div className="h-full bg-[#F26A2E]" style={{ width: `${Math.min(lab.thcPercentage * 3, 100)}%` }}></div>
                    </div>
                    <span className="text-xs font-bold text-white w-12 text-right">{lab.thcPercentage}%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#E2E8F0]">CBD</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-[#1C1630] rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${Math.min((lab.cbdPercentage || 0) * 20, 100)}%` }}></div>
                    </div>
                    <span className="text-xs font-bold text-white w-12 text-right">{lab.cbdPercentage || 0}%</span>
                  </div>
                </div>
                {lab.totalCannabinoids && (
                  <div className="flex justify-between items-center pt-1 border-t border-[#2D3748]/50">
                    <span className="text-xs text-[#718096]">Total Cannabinoids</span>
                    <span className="text-xs font-bold text-[#F26A2E]">{lab.totalCannabinoids}%</span>
                  </div>
                )}
              </div>
            </div>

            {/* Terpenes */}
            {lab.terpenes && lab.terpenes.length > 0 && (
              <div className="p-3 border-b border-[#2D3748]">
                <h4 className="text-[10px] font-bold text-[#A0AEC0] uppercase tracking-wider mb-2">Terpene Profile</h4>
                <div className="space-y-3">
                  {lab.terpenes.map((terp, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: getTerpeneColor(terp.name) }}
                          ></span>
                          <span className="text-xs text-[#E2E8F0] font-medium">{terp.name}</span>
                          <span className="text-[9px] text-[#718096]">({getTerpeneDescription(terp.name)})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-14 h-1.5 bg-[#1C1630] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.min(terp.percentage * 50, 100)}%`,
                                backgroundColor: getTerpeneColor(terp.name)
                              }}
                            ></div>
                          </div>
                          <span className="text-[10px] text-[#A0AEC0] w-10 text-right">{terp.percentage}%</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 pl-3.5">
                        {getTerpeneMedicalBenefits(terp.name).map((benefit, j) => (
                          <span
                            key={j}
                            className="text-[8px] px-1.5 py-0.5 rounded text-[#A0AEC0]"
                            style={{ backgroundColor: `${getTerpeneColor(terp.name)}15` }}
                          >
                            {benefit}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                  {lab.totalTerpenes && (
                    <div className="flex justify-between items-center pt-2 border-t border-[#2D3748]/50">
                      <span className="text-xs text-[#718096]">Total Terpenes</span>
                      <span className="text-xs font-bold text-[#F26A2E]">{lab.totalTerpenes}%</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Safety Testing */}
            {lab.contaminants && (
              <div className="p-3">
                <h4 className="text-[10px] font-bold text-[#A0AEC0] uppercase tracking-wider mb-2">Safety Testing</h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(lab.contaminants).map(([test, passed]) => (
                    <div key={test} className="flex items-center gap-1.5">
                      {passed ? (
                        <svg className="w-3.5 h-3.5 text-[#F26A2E]" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span className="text-[10px] text-[#E2E8F0] capitalize">{test.replace(/([A-Z])/g, ' $1').trim()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Description (from menu) */}
        <div className="mb-5">
          <h3 className="text-[10px] font-bold text-[#A0AEC0] mb-2 uppercase tracking-wider">From The Menu</h3>
          <p className="text-[#E2E8F0]/80 leading-relaxed text-sm">
            {product.description || "Crafted with care in Maine. This product represents the finest in craft cannabis, grown for medical patients who demand quality and consistency."}
          </p>
        </div>

        {/* Enhanced Strain Info */}
        {product.strainInfo && (
          <div className="mb-5 bg-[#232C33] rounded-xl border border-[#2D3748] overflow-hidden">
            <div className="p-3 bg-[#F26A2E]/10 border-b border-[#2D3748]">
              <h3 className="text-xs font-bold text-[#F26A2E] flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Strain Profile
              </h3>
            </div>

            <div className="p-3 space-y-4">
              {/* Flavor & Aroma */}
              {(product.strainInfo.flavorProfile || product.strainInfo.aromas) && (
                <div className="grid grid-cols-2 gap-3">
                  {product.strainInfo.flavorProfile && (
                    <div>
                      <p className="text-[9px] text-[#718096] uppercase tracking-wider mb-1.5">Flavor</p>
                      <div className="flex flex-wrap gap-1">
                        {product.strainInfo.flavorProfile.map((f, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 bg-[#1C1630] rounded text-[#E2E8F0]">{f}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {product.strainInfo.aromas && (
                    <div>
                      <p className="text-[9px] text-[#718096] uppercase tracking-wider mb-1.5">Aroma</p>
                      <div className="flex flex-wrap gap-1">
                        {product.strainInfo.aromas.map((a, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 bg-[#1C1630] rounded text-[#E2E8F0]">{a}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Medical Uses */}
              {product.strainInfo.medicalUses && (
                <div>
                  <p className="text-[9px] text-[#718096] uppercase tracking-wider mb-1.5">Medical Uses</p>
                  <div className="flex flex-wrap gap-1.5">
                    {product.strainInfo.medicalUses.map((use, i) => (
                      <span key={i} className="text-[10px] px-2 py-1 bg-[#F26A2E]/10 border border-[#F26A2E]/30 rounded-full text-[#F26A2E]">{use}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Timing Info */}
              {(product.strainInfo.bestTimeOfUse || product.strainInfo.onset || product.strainInfo.duration) && (
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#2D3748]/50">
                  {product.strainInfo.bestTimeOfUse && (
                    <div className="text-center">
                      <p className="text-[8px] text-[#718096] uppercase mb-0.5">Best Time</p>
                      <p className="text-[10px] text-white font-medium">{product.strainInfo.bestTimeOfUse}</p>
                    </div>
                  )}
                  {product.strainInfo.onset && (
                    <div className="text-center">
                      <p className="text-[8px] text-[#718096] uppercase mb-0.5">Onset</p>
                      <p className="text-[10px] text-white font-medium">{product.strainInfo.onset}</p>
                    </div>
                  )}
                  {product.strainInfo.duration && (
                    <div className="text-center">
                      <p className="text-[8px] text-[#718096] uppercase mb-0.5">Duration</p>
                      <p className="text-[10px] text-white font-medium">{product.strainInfo.duration}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Lineage */}
              {product.strainInfo.parentage && (
                <div className="pt-2 border-t border-[#2D3748]/50">
                  <p className="text-[9px] text-[#718096] uppercase tracking-wider mb-1">Lineage</p>
                  <p className="text-[10px] text-[#A0AEC0] leading-relaxed">{product.strainInfo.parentage}</p>
                  {product.strainInfo.breeder && (
                    <p className="text-[9px] text-[#718096] mt-1">Breeder: {product.strainInfo.breeder}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Effects */}
        {product.effects && product.effects.length > 0 && (
          <div className="mb-5">
            <h3 className="text-[10px] font-bold text-[#A0AEC0] mb-2 uppercase tracking-wider">Reported Effects</h3>
            <div className="flex flex-wrap gap-2">
              {product.effects.map((effect, i) => (
                <span key={i} className="px-3 py-1.5 bg-[#232C33] rounded-lg text-xs text-white border border-[#2D3748] capitalize">
                  {effect}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Grower/Brand */}
        {product.grower && (
          <div className="bg-[#232C33] p-3 rounded-xl border border-[#2D3748] mb-5">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-[#1C1630] p-2 border border-[#F26A2E]/30 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#F26A2E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <span className="font-bold text-sm text-white block">{product.grower}</span>
                <span className="text-[10px] text-[#718096]">Maine Licensed Cultivator</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Bottom Action */}
      <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-[#1C1630] via-[#1C1630] to-transparent z-20">
        <button
          onClick={() => {
            onAddToCart(product);
          }}
          className="w-full py-4 bg-[#F26A2E] hover:bg-[#E24A2A] text-white rounded-xl font-bold shadow-lg shadow-black/40 flex items-center justify-center space-x-2 active:scale-95 transition-transform"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <span>Add to Cart • ${product.price}</span>
        </button>
      </div>

      {/* Lab Testing Info Modal */}
      {showLabInfoModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-labelledby="lab-info-title">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowLabInfoModal(false)}
            aria-hidden="true"
          />

          {/* Modal Content */}
          <div className="relative w-full max-h-[85vh] bg-[#1C1630] rounded-t-3xl overflow-hidden animate-slide-up">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-[#4A5568] rounded-full" aria-hidden="true" />
            </div>

            {/* Header */}
            <div className="px-5 pb-4 border-b border-[#2D3748]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#F26A2E]/20 rounded-xl flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#F26A2E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <h2 id="lab-info-title" className="text-lg font-bold text-white">Understanding Lab Testing</h2>
                    <p className="text-sm text-[#94A3B8]">Maine Cannabis Testing Requirements</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowLabInfoModal(false)}
                  aria-label="Close"
                  className="w-11 h-11 bg-[#232C33] rounded-lg flex items-center justify-center hover:bg-[#2D3748] transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#A0AEC0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto max-h-[calc(85vh-120px)] px-5 py-4 space-y-5">
              {/* What is a COA */}
              <div className="bg-[#232C33] rounded-xl p-4 border border-[#2D3748]">
                <h3 className="text-sm font-bold text-[#F26A2E] mb-2 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  What is a COA?
                </h3>
                <p className="text-sm text-[#E2E8F0] leading-relaxed">
                  A <span className="text-[#F26A2E] font-medium">Certificate of Analysis (COA)</span> is a report prepared by a certified testing facility showing the tests performed on a cannabis product and their results.
                </p>
              </div>

              {/* What's Tested */}
              <div className="bg-[#232C33] rounded-xl p-4 border border-[#2D3748]">
                <h3 className="text-sm font-bold text-[#F26A2E] mb-3 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                  Maine Testing Requirements
                </h3>
                <p className="text-xs text-[#A0AEC0] mb-3">Adult use cannabis undergoes mandatory testing for:</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 bg-[#1C1630] rounded-lg px-3 py-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#F26A2E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-xs text-[#E2E8F0]">Pesticides</span>
                  </div>
                  <div className="flex items-center gap-2 bg-[#1C1630] rounded-lg px-3 py-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#F26A2E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    <span className="text-xs text-[#E2E8F0]">Heavy Metals</span>
                  </div>
                  <div className="flex items-center gap-2 bg-[#1C1630] rounded-lg px-3 py-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#F26A2E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <span className="text-xs text-[#E2E8F0]">Microbials</span>
                  </div>
                  <div className="flex items-center gap-2 bg-[#1C1630] rounded-lg px-3 py-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#F26A2E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    <span className="text-xs text-[#E2E8F0]">Residual Solvents</span>
                  </div>
                  <div className="flex items-center gap-2 bg-[#1C1630] rounded-lg px-3 py-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#F26A2E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-xs text-[#E2E8F0]">Molds & Mildews</span>
                  </div>
                  <div className="flex items-center gap-2 bg-[#1C1630] rounded-lg px-3 py-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#F26A2E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span className="text-xs text-[#E2E8F0]">Foreign Materials</span>
                  </div>
                  <div className="flex items-center gap-2 bg-[#1C1630] rounded-lg px-3 py-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#F26A2E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                    <span className="text-xs text-[#E2E8F0]">Water Activity</span>
                  </div>
                  <div className="flex items-center gap-2 bg-[#1C1630] rounded-lg px-3 py-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#F26A2E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span className="text-xs text-[#E2E8F0]">THC Potency</span>
                  </div>
                </div>
              </div>

              {/* Medical vs Adult Use */}
              <div className="bg-amber-900/20 rounded-xl p-4 border border-amber-700/30">
                <h3 className="text-sm font-bold text-amber-400 mb-2 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Medical Cannabis Note
                </h3>
                <p className="text-xs text-amber-200/80 leading-relaxed">
                  Medical cannabis in Maine is <span className="font-medium">not subject to mandatory testing</span>. However, many caregivers and dispensaries voluntarily test their products. Always ask to see a COA if testing is important to you.
                </p>
              </div>

              {/* Certified Labs */}
              <div className="bg-[#232C33] rounded-xl p-4 border border-[#2D3748]">
                <h3 className="text-sm font-bold text-[#F26A2E] mb-3 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Maine Certified Testing Labs
                </h3>
                <p className="text-xs text-[#A0AEC0] mb-3">Only these labs are certified by Maine CDC to test cannabis:</p>
                <div className="space-y-2">
                  {[
                    { name: 'CATLab', location: 'Maine' },
                    { name: 'MCR Labs', location: 'Massachusetts' },
                    { name: 'Nelson Analytical', location: 'Maine' },
                    { name: 'Nova Analytic Labs', location: 'Maine' },
                  ].map((lab, i) => (
                    <div key={i} className="flex items-center justify-between bg-[#1C1630] rounded-lg px-3 py-2">
                      <span className="text-sm text-white font-medium">{lab.name}</span>
                      <span className="text-[10px] text-[#718096] bg-[#232C33] px-2 py-0.5 rounded">{lab.location}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* What to Look For */}
              <div className="bg-[#232C33] rounded-xl p-4 border border-[#2D3748]">
                <h3 className="text-sm font-bold text-[#F26A2E] mb-3 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  What to Look for on a COA
                </h3>
                <div className="space-y-2">
                  {[
                    { label: 'Test Date', desc: 'Should be recent and match the batch' },
                    { label: 'Item Type', desc: 'Should match what you\'re purchasing' },
                    { label: 'Business Name', desc: 'Should match the producer/seller' },
                    { label: 'Pass/Fail Results', desc: 'Each contaminant test should pass' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-5 h-5 bg-[#F26A2E]/20 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-[#F26A2E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <span className="text-xs text-white font-medium">{item.label}</span>
                        <p className="text-[10px] text-[#718096]">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Source Attribution */}
              <div className="text-center py-2">
                <p className="text-[10px] text-[#718096]">
                  Information provided by Maine Office of Cannabis Policy (OCP)
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function for terpene colors
function getTerpeneColor(name: string): string {
  const colors: Record<string, string> = {
    'Limonene': '#FCD34D',      // Yellow - citrus
    'Myrcene': '#A78BFA',       // Purple - earthy
    'Caryophyllene': '#F97316', // Orange - spicy
    'Linalool': '#EC4899',      // Pink - floral
    'Pinene': '#22C55E',        // Green - pine
    'Terpinolene': '#06B6D4',   // Cyan - fresh
    'Humulene': '#EAB308',      // Amber - hoppy
    'Ocimene': '#8B5CF6',       // Violet - sweet
  };
  return colors[name] || '#F26A2E';
}

// Helper function for terpene descriptions
function getTerpeneDescription(name: string): string {
  const descriptions: Record<string, string> = {
    'Limonene': 'citrus',
    'Myrcene': 'earthy',
    'Caryophyllene': 'spicy',
    'Linalool': 'floral',
    'Pinene': 'pine',
    'Terpinolene': 'fresh',
    'Humulene': 'hoppy',
    'Ocimene': 'sweet',
    'Bisabolol': 'chamomile',
    'Valencene': 'orange',
    'Geraniol': 'rose',
    'Camphene': 'herbal',
    'Nerolidol': 'woody',
    'Eucalyptol': 'minty',
    'Borneol': 'menthol',
    'Sabinene': 'peppery',
  };
  return descriptions[name] || 'aromatic';
}

// Helper function for terpene medical benefits
function getTerpeneMedicalBenefits(name: string): string[] {
  const benefits: Record<string, string[]> = {
    'Limonene': ['Mood elevation', 'Anxiety relief', 'Anti-inflammatory'],
    'Myrcene': ['Sedation', 'Muscle relaxation', 'Pain relief'],
    'Caryophyllene': ['Anti-inflammatory', 'Pain relief', 'Anxiety relief'],
    'Linalool': ['Anxiety relief', 'Sleep aid', 'Anti-convulsant'],
    'Pinene': ['Alertness', 'Memory retention', 'Anti-inflammatory'],
    'Terpinolene': ['Sedation', 'Antioxidant', 'Antibacterial'],
    'Humulene': ['Appetite suppressant', 'Anti-inflammatory', 'Antibacterial'],
    'Ocimene': ['Antiviral', 'Anti-fungal', 'Decongestant'],
    'Bisabolol': ['Skin healing', 'Anti-inflammatory', 'Antibacterial'],
    'Valencene': ['Anti-inflammatory', 'Skin protection', 'Alertness'],
    'Geraniol': ['Neuroprotection', 'Antioxidant', 'Anti-inflammatory'],
    'Camphene': ['Antioxidant', 'Pain relief', 'Cardiovascular'],
    'Nerolidol': ['Sedation', 'Anti-parasitic', 'Skin penetration'],
    'Eucalyptol': ['Respiratory relief', 'Pain relief', 'Mental clarity'],
    'Borneol': ['Pain relief', 'Anti-inflammatory', 'Calming'],
    'Sabinene': ['Antioxidant', 'Anti-inflammatory', 'Digestive aid'],
  };
  return benefits[name] || ['Therapeutic'];
}
