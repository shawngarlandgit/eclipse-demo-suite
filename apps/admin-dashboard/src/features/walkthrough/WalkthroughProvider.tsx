/**
 * Walkthrough Provider
 * Driver.js wrapper component that provides the tour functionality
 * Migrated from react-joyride to driver.js for React 19 compatibility
 */

import { useEffect, useRef } from 'react';
import { driver, type Driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useWalkthroughStore } from './store/walkthroughStore';
import { tourConfig } from './config/tourSteps';
import { driverConfig, tourCSS } from './config/tourStyles';

interface WalkthroughProviderProps {
  children: React.ReactNode;
}

export function WalkthroughProvider({ children }: WalkthroughProviderProps) {
  const driverRef = useRef<Driver | null>(null);
  const styleRef = useRef<HTMLStyleElement | null>(null);

  const {
    isRunning,
    currentTourId,
    completeTour,
    skipTour,
    stopTour,
  } = useWalkthroughStore();

  // Inject custom CSS on mount
  useEffect(() => {
    if (!styleRef.current) {
      const style = document.createElement('style');
      style.textContent = tourCSS;
      document.head.appendChild(style);
      styleRef.current = style;
    }

    return () => {
      if (styleRef.current) {
        document.head.removeChild(styleRef.current);
        styleRef.current = null;
      }
    };
  }, []);

  // Initialize/destroy driver instance when tour starts/stops
  useEffect(() => {
    if (isRunning && currentTourId) {
      const tourSteps = tourConfig[currentTourId]?.steps ?? [];

      if (tourSteps.length === 0) {
        stopTour();
        return;
      }

      // Create driver instance with config
      driverRef.current = driver({
        ...driverConfig,
        steps: tourSteps,
        onDestroyStarted: () => {
          // User clicked close or finished
          if (driverRef.current?.isLastStep()) {
            completeTour();
          } else {
            skipTour();
          }
          driverRef.current?.destroy();
        },
        onDestroyed: () => {
          driverRef.current = null;
        },
      });

      // Start the tour
      driverRef.current.drive();
    }

    return () => {
      if (driverRef.current) {
        driverRef.current.destroy();
        driverRef.current = null;
      }
    };
  }, [isRunning, currentTourId, completeTour, skipTour, stopTour]);

  return <>{children}</>;
}
