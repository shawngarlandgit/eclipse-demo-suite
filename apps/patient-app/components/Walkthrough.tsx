import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// SVG Icon Components (matching existing codebase style)
const XIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const ChevronLeftIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const SparklesIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const ShoppingBagIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
  </svg>
);

const CreditCardIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const PackageIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

// Walkthrough Steps
export interface WalkthroughStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector for highlight
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  icon: ReactNode;
  action?: string; // Action user needs to take
}

const WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Eclipse',
    description: 'Let\'s walk you through placing your first delivery order. It only takes a minute!',
    position: 'center',
    icon: <SparklesIcon className="w-8 h-8" />,
  },
  {
    id: 'browse',
    title: 'Browse Our Menu',
    description: 'Explore our selection of flower, edibles, vapes, and more. Use the category filters to find exactly what you\'re looking for.',
    position: 'center',
    icon: <PackageIcon className="w-6 h-6" />,
  },
  {
    id: 'add-to-cart',
    title: 'Add to Cart',
    description: 'Found something you like? Tap the + button on any product card to add it to your cart.',
    position: 'center',
    icon: <ShoppingBagIcon className="w-6 h-6" />,
    action: 'Add at least one item to continue',
  },
  {
    id: 'view-cart',
    title: 'Review Your Cart',
    description: 'Tap the Cart button in the top right corner to see your selections. You can adjust quantities or remove items there.',
    position: 'center',
    icon: <ShoppingBagIcon className="w-6 h-6" />,
  },
  {
    id: 'checkout',
    title: 'Checkout',
    description: 'Once you have items in your cart, tap "Continue to Checkout" to choose delivery or pickup. Payment is collected on delivery!',
    position: 'center',
    icon: <CreditCardIcon className="w-6 h-6" />,
  },
  {
    id: 'complete',
    title: 'You\'re All Set! 🎉',
    description: 'That\'s it! You\'ll receive updates as your order is prepared and delivered. Enjoy!',
    position: 'center',
    icon: <CheckCircleIcon className="w-8 h-8" />,
  },
];

// Context
interface WalkthroughContextType {
  isActive: boolean;
  currentStep: number;
  currentStepData: WalkthroughStep | null;
  startWalkthrough: () => void;
  endWalkthrough: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (stepId: string) => void;
  skipWalkthrough: () => void;
  hasCompletedWalkthrough: boolean;
}

const WalkthroughContext = createContext<WalkthroughContextType | null>(null);

export function useWalkthrough() {
  const context = useContext(WalkthroughContext);
  if (!context) {
    throw new Error('useWalkthrough must be used within WalkthroughProvider');
  }
  return context;
}

// Provider
interface WalkthroughProviderProps {
  children: ReactNode;
}

export function WalkthroughProvider({ children }: WalkthroughProviderProps) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompletedWalkthrough, setHasCompletedWalkthrough] = useState(() => {
    return localStorage.getItem('eclipse-walkthrough-complete') === 'true';
  });

  const currentStepData = isActive ? WALKTHROUGH_STEPS[currentStep] : null;

  const startWalkthrough = () => {
    setCurrentStep(0);
    setIsActive(true);
  };

  const endWalkthrough = () => {
    setIsActive(false);
    setHasCompletedWalkthrough(true);
    localStorage.setItem('eclipse-walkthrough-complete', 'true');
  };

  const nextStep = () => {
    if (currentStep < WALKTHROUGH_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      endWalkthrough();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const goToStep = (stepId: string) => {
    const index = WALKTHROUGH_STEPS.findIndex(s => s.id === stepId);
    if (index !== -1) {
      setCurrentStep(index);
    }
  };

  const skipWalkthrough = () => {
    endWalkthrough();
  };

  return (
    <WalkthroughContext.Provider
      value={{
        isActive,
        currentStep,
        currentStepData,
        startWalkthrough,
        endWalkthrough,
        nextStep,
        prevStep,
        goToStep,
        skipWalkthrough,
        hasCompletedWalkthrough,
      }}
    >
      {children}
      {isActive && <WalkthroughOverlay />}
    </WalkthroughContext.Provider>
  );
}

// Overlay Component
function WalkthroughOverlay() {
  const { currentStep, currentStepData, nextStep, prevStep, skipWalkthrough, endWalkthrough } = useWalkthrough();
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const totalSteps = WALKTHROUGH_STEPS.length;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;
  const isCenterPosition = currentStepData?.position === 'center';

  // Find and highlight target element
  useEffect(() => {
    if (currentStepData?.target) {
      const element = document.querySelector(currentStepData.target);
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetRect(rect);
        // Scroll element into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        setTargetRect(null);
      }
    } else {
      setTargetRect(null);
    }
  }, [currentStepData]);

  if (!currentStepData) return null;

  // Calculate tooltip position
  const getTooltipStyle = (): React.CSSProperties => {
    if (isCenterPosition || !targetRect) {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const padding = 16;
    const tooltipWidth = 320;

    switch (currentStepData.position) {
      case 'top':
        return {
          position: 'fixed',
          bottom: `${window.innerHeight - targetRect.top + padding}px`,
          left: `${Math.max(padding, Math.min(targetRect.left + targetRect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - padding))}px`,
        };
      case 'bottom':
        return {
          position: 'fixed',
          top: `${targetRect.bottom + padding}px`,
          left: `${Math.max(padding, Math.min(targetRect.left + targetRect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - padding))}px`,
        };
      default:
        return {
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        };
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] pointer-events-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="walkthrough-title"
      aria-describedby="walkthrough-description"
    >
      {/* Backdrop with cutout */}
      <div className="absolute inset-0 pointer-events-none">
        {targetRect && !isCenterPosition ? (
          <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
            <defs>
              <mask id="spotlight-mask">
                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                <rect
                  x={targetRect.left - 8}
                  y={targetRect.top - 8}
                  width={targetRect.width + 16}
                  height={targetRect.height + 16}
                  rx="12"
                  fill="black"
                />
              </mask>
            </defs>
            <rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill="rgba(0, 0, 0, 0.85)"
              mask="url(#spotlight-mask)"
            />
            {/* Highlight border */}
            <rect
              x={targetRect.left - 8}
              y={targetRect.top - 8}
              width={targetRect.width + 16}
              height={targetRect.height + 16}
              rx="12"
              fill="none"
              stroke="#F26A2E"
              strokeWidth="3"
              className="animate-pulse"
            />
          </svg>
        ) : (
          <div className="absolute inset-0 bg-black/85 pointer-events-none" aria-hidden="true" />
        )}
      </div>

      {/* Tooltip */}
      <div
        style={getTooltipStyle()}
        className={`w-80 bg-[#232C33] rounded-2xl shadow-2xl border border-[#F26A2E]/30 overflow-hidden z-10 pointer-events-auto ${
          isCenterPosition ? 'animate-bounce-slow' : ''
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#F26A2E] to-[#E24A2A] p-4 flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-white" aria-hidden="true">
            {currentStepData.icon}
          </div>
          <div className="flex-1">
            <h3 id="walkthrough-title" className="text-white font-bold text-lg">{currentStepData.title}</h3>
            <p className="text-white/70 text-xs" aria-live="polite">
              Step {currentStep + 1} of {totalSteps}
            </p>
          </div>
          <button
            onClick={skipWalkthrough}
            aria-label="Close tutorial"
            className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center text-white/60 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 rounded-lg"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <p id="walkthrough-description" className="text-[#A0AEC0] text-sm leading-relaxed mb-4">
            {currentStepData.description}
          </p>

          {currentStepData.action && (
            <div className="bg-[#F26A2E]/10 border border-[#F26A2E]/30 rounded-xl p-3 mb-4">
              <p className="text-[#F26A2E] text-sm font-medium flex items-center gap-2">
                <span className="w-5 h-5 bg-[#F26A2E] rounded-full flex items-center justify-center text-white text-xs">
                  !
                </span>
                {currentStepData.action}
              </p>
            </div>
          )}

          {/* Progress dots */}
          <div className="flex justify-center gap-1.5 mb-4" role="progressbar" aria-valuenow={currentStep + 1} aria-valuemin={1} aria-valuemax={totalSteps} aria-label={`Step ${currentStep + 1} of ${totalSteps}`}>
            {WALKTHROUGH_STEPS.map((_, idx) => (
              <div
                key={idx}
                aria-hidden="true"
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentStep
                    ? 'bg-[#F26A2E] w-6'
                    : idx < currentStep
                    ? 'bg-[#F26A2E]/50'
                    : 'bg-[#2D3748]'
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {!isFirstStep && (
              <button
                onClick={prevStep}
                aria-label="Previous step"
                className="flex-1 py-4 bg-[#1C1630] text-[#A0AEC0] rounded-xl font-bold text-base flex items-center justify-center gap-2 border border-[#2D3748] active:scale-95 min-h-[52px] focus:outline-none focus:ring-2 focus:ring-[#F26A2E] focus:ring-offset-2 focus:ring-offset-[#232C33]"
              >
                <ChevronLeftIcon className="w-4 h-4" aria-hidden="true" />
                Back
              </button>
            )}
            <button
              onClick={isLastStep ? endWalkthrough : nextStep}
              aria-label={isLastStep ? 'Complete tutorial and get started' : 'Next step'}
              className="flex-1 py-4 bg-[#F26A2E] hover:bg-[#E24A2A] text-white rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-colors active:scale-95 min-h-[52px] focus:outline-none focus:ring-2 focus:ring-[#F26A2E] focus:ring-offset-2 focus:ring-offset-[#232C33]"
            >
              {isLastStep ? 'Get Started' : 'Next'}
              {!isLastStep && <ChevronRightIcon className="w-4 h-4" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>

      {/* Skip button at bottom */}
      {!isLastStep && (
        <button
          onClick={skipWalkthrough}
          aria-label="Skip tutorial"
          className="fixed bottom-8 left-1/2 -translate-x-1/2 text-white/50 hover:text-white text-sm transition-colors pointer-events-auto px-6 py-3 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-white/50 rounded-lg"
        >
          Skip Tutorial
        </button>
      )}

      <style>{`
        .animate-bounce-slow {
          /* Removed animation to fix click target issues on mobile */
        }
      `}</style>
    </div>
  );
}

// Start Walkthrough Button Component
export function StartWalkthroughButton() {
  const { startWalkthrough, hasCompletedWalkthrough } = useWalkthrough();

  return (
    <button
      onClick={startWalkthrough}
      className="flex items-center gap-2 px-4 py-2 bg-[#F26A2E]/20 hover:bg-[#F26A2E]/30 text-[#F26A2E] rounded-xl text-sm font-medium transition-colors"
    >
      <SparklesIcon className="w-4 h-4" />
      {hasCompletedWalkthrough ? 'Replay Tutorial' : 'Start Tutorial'}
    </button>
  );
}

// First Time User Prompt
export function FirstTimePrompt() {
  const { startWalkthrough, hasCompletedWalkthrough, isActive } = useWalkthrough();
  const [dismissed, setDismissed] = useState(false);

  if (hasCompletedWalkthrough || dismissed || isActive) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-slide-up pointer-events-none" role="dialog" aria-labelledby="first-time-title" aria-describedby="first-time-desc">
      <div className="bg-gradient-to-r from-[#232C33] to-[#261A38] rounded-2xl p-4 shadow-2xl border border-[#F26A2E]/30 pointer-events-auto">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-[#F26A2E] rounded-xl flex items-center justify-center flex-shrink-0" aria-hidden="true">
            <SparklesIcon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h4 id="first-time-title" className="text-white font-bold mb-1">First time here?</h4>
            <p id="first-time-desc" className="text-[#A0AEC0] text-sm mb-3">
              Take a quick tour to learn how to place your first delivery order!
            </p>
            <div className="flex gap-2">
              <button
                onClick={startWalkthrough}
                className="px-4 py-3 min-h-[44px] bg-[#F26A2E] text-white rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#F26A2E] focus:ring-offset-2 focus:ring-offset-[#232C33]"
              >
                Start Tour
              </button>
              <button
                onClick={() => setDismissed(true)}
                className="px-4 py-3 min-h-[44px] bg-[#1C1630] text-[#718096] rounded-lg text-sm font-medium border border-[#2D3748] focus:outline-none focus:ring-2 focus:ring-[#F26A2E] focus:ring-offset-2 focus:ring-offset-[#232C33]"
              >
                Maybe Later
              </button>
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss"
            className="text-[#718096] hover:text-white p-3 min-w-[44px] min-h-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#F26A2E] rounded-lg"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
