/**
 * ID Scanner Module
 *
 * A barcode scanner component for driver's license verification.
 * Uses @zxing/browser for PDF417 barcode scanning with iOS compatibility.
 *
 * Module Structure:
 * - IDScanner.tsx - Main component orchestrating all scanner functionality
 * - types.ts - TypeScript type definitions
 * - hooks/useIDScanner.ts - Custom hook with scanner logic
 * - components/ - Sub-components for each scanner state
 */

// Main component
export { default as IDScanner } from './IDScanner';
export { default } from './IDScanner';

// Types
export type {
  ScannerStatus,
  IDScannerProps,
  IDScannerState,
  IDScannerActions,
  IDScannerRefs,
  ParsedLicenseData,
} from './types';

// Hook (for advanced use cases)
export { useIDScanner } from './hooks';

// Sub-components (for advanced customization)
export {
  ScannerOverlay,
  ScannerIdleState,
  ScannerSuccessState,
  ScannerErrorState,
  PhotoReviewState,
  ScanningState,
} from './components';
