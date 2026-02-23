/**
 * Tour Styles Configuration
 * Dark theme styling for driver.js (slate.800 background)
 * Migrated from react-joyride to driver.js
 */

import type { Config } from 'driver.js';

// Dark theme colors matching the app's design
export const tourColors = {
  background: '#1e293b', // slate.800
  text: '#f8fafc', // slate.50
  textSecondary: '#94a3b8', // slate.400
  primary: '#22c55e', // brand green (green.500)
  primaryHover: '#16a34a', // green.600
  overlay: 'rgba(15, 23, 42, 0.85)', // slate.900 with 85% opacity
  border: '#334155', // slate.700
  spotlight: '#22c55e', // green glow
};

/**
 * Driver.js configuration with dark theme
 */
export const driverConfig: Partial<Config> = {
  showProgress: true,
  showButtons: ['next', 'previous', 'close'],
  nextBtnText: 'Next',
  prevBtnText: 'Back',
  doneBtnText: 'Finish',
  progressText: '{{current}} of {{total}}',
  allowClose: true,
  overlayColor: tourColors.overlay,
  stagePadding: 8,
  stageRadius: 8,
  popoverClass: 'cannabis-tour-popover',
  overlayOpacity: 0.85,
  smoothScroll: true,
  animate: true,
};

/**
 * CSS styles for the tour popover
 * These should be added to the global CSS or a style tag
 */
export const tourCSS = `
  .cannabis-tour-popover {
    background-color: ${tourColors.background} !important;
    color: ${tourColors.text} !important;
    border-radius: 12px !important;
    padding: 0 !important;
    box-shadow: 0 0 0 2px ${tourColors.border}, 0 25px 50px -12px rgba(0, 0, 0, 0.5) !important;
    max-width: 380px !important;
  }

  .cannabis-tour-popover .driver-popover-title {
    color: ${tourColors.text} !important;
    font-size: 18px !important;
    font-weight: 600 !important;
    margin-bottom: 8px !important;
    padding: 20px 20px 0 20px !important;
  }

  .cannabis-tour-popover .driver-popover-description {
    color: ${tourColors.textSecondary} !important;
    font-size: 14px !important;
    line-height: 1.6 !important;
    padding: 8px 20px !important;
  }

  .cannabis-tour-popover .driver-popover-progress-text {
    color: ${tourColors.textSecondary} !important;
    font-size: 12px !important;
  }

  .cannabis-tour-popover .driver-popover-footer {
    padding: 16px 20px 20px 20px !important;
    border-top: none !important;
    background: transparent !important;
  }

  .cannabis-tour-popover .driver-popover-navigation-btns {
    gap: 8px !important;
  }

  .cannabis-tour-popover .driver-popover-next-btn {
    background-color: ${tourColors.primary} !important;
    color: #ffffff !important;
    border-radius: 8px !important;
    padding: 10px 20px !important;
    font-size: 14px !important;
    font-weight: 500 !important;
    border: none !important;
    cursor: pointer !important;
    transition: background-color 0.2s !important;
    text-shadow: none !important;
  }

  .cannabis-tour-popover .driver-popover-next-btn:hover {
    background-color: ${tourColors.primaryHover} !important;
  }

  .cannabis-tour-popover .driver-popover-prev-btn {
    color: ${tourColors.textSecondary} !important;
    background: transparent !important;
    padding: 10px 16px !important;
    font-size: 14px !important;
    font-weight: 500 !important;
    border: none !important;
    cursor: pointer !important;
    text-shadow: none !important;
  }

  .cannabis-tour-popover .driver-popover-prev-btn:hover {
    color: ${tourColors.text} !important;
  }

  .cannabis-tour-popover .driver-popover-close-btn {
    color: ${tourColors.textSecondary} !important;
    width: 28px !important;
    height: 28px !important;
    padding: 0 !important;
    background: transparent !important;
    border: none !important;
    cursor: pointer !important;
    top: 12px !important;
    right: 12px !important;
  }

  .cannabis-tour-popover .driver-popover-close-btn:hover {
    color: ${tourColors.text} !important;
  }

  .cannabis-tour-popover .driver-popover-arrow {
    border-color: ${tourColors.background} !important;
  }

  .cannabis-tour-popover .driver-popover-arrow-side-left {
    border-left-color: ${tourColors.background} !important;
  }

  .cannabis-tour-popover .driver-popover-arrow-side-right {
    border-right-color: ${tourColors.background} !important;
  }

  .cannabis-tour-popover .driver-popover-arrow-side-top {
    border-top-color: ${tourColors.background} !important;
  }

  .cannabis-tour-popover .driver-popover-arrow-side-bottom {
    border-bottom-color: ${tourColors.background} !important;
  }

  /* Highlight styling */
  .driver-active-element {
    border-radius: 8px !important;
    box-shadow: 0 0 0 4px ${tourColors.spotlight}40 !important;
  }
`;
