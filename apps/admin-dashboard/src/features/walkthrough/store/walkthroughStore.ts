/**
 * Walkthrough Store
 * Zustand store for managing product tour state with persistence
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TourId = 'compliance-risk-overview' | null;

interface WalkthroughState {
  isRunning: boolean;
  currentTourId: TourId;
  stepIndex: number;
  completedTours: string[];
  skippedAt: Record<string, number>;

  // Actions
  startTour: (tourId: TourId) => void;
  stopTour: () => void;
  setStepIndex: (index: number) => void;
  completeTour: () => void;
  skipTour: () => void;
  hasCompletedTour: (tourId: string) => boolean;
}

export const useWalkthroughStore = create<WalkthroughState>()(
  persist(
    (set, get) => ({
      isRunning: false,
      currentTourId: null,
      stepIndex: 0,
      completedTours: [],
      skippedAt: {},

      startTour: (tourId) =>
        set({
          isRunning: true,
          currentTourId: tourId,
          stepIndex: 0,
        }),

      stopTour: () =>
        set({
          isRunning: false,
          currentTourId: null,
          stepIndex: 0,
        }),

      setStepIndex: (index) =>
        set({
          stepIndex: index,
        }),

      completeTour: () => {
        const { currentTourId, completedTours } = get();
        if (currentTourId && !completedTours.includes(currentTourId)) {
          set({
            completedTours: [...completedTours, currentTourId],
            isRunning: false,
            currentTourId: null,
            stepIndex: 0,
          });
        } else {
          set({
            isRunning: false,
            currentTourId: null,
            stepIndex: 0,
          });
        }
      },

      skipTour: () => {
        const { currentTourId, skippedAt } = get();
        if (currentTourId) {
          set({
            skippedAt: { ...skippedAt, [currentTourId]: Date.now() },
            isRunning: false,
            currentTourId: null,
            stepIndex: 0,
          });
        }
      },

      hasCompletedTour: (tourId) => get().completedTours.includes(tourId),
    }),
    {
      name: 'walkthrough-storage',
      partialize: (state) => ({
        completedTours: state.completedTours,
        skippedAt: state.skippedAt,
      }),
    }
  )
);
