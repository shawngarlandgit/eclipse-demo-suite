/**
 * ID Scanner Types
 *
 * Type definitions for the ID Scanner component and its sub-components.
 */

import type { ParsedLicenseData } from '../../utils/parseDriverLicense';

/**
 * Scanner status states
 */
export type ScannerStatus = 'idle' | 'requesting' | 'scanning' | 'success' | 'error' | 'photo';

/**
 * Props for the main IDScanner component
 */
export interface IDScannerProps {
  /** Callback when a valid ID is successfully scanned */
  onScanSuccess: (data: ParsedLicenseData) => void;
  /** Optional callback when an error occurs during scanning */
  onScanError?: (error: string) => void;
  /** Optional callback when the user cancels scanning */
  onCancel?: () => void;
}

/**
 * State returned by the useIDScanner hook
 */
export interface IDScannerState {
  status: ScannerStatus;
  errorMessage: string;
  scannedData: ParsedLicenseData | null;
  debugInfo: string;
  capturedPhoto: string | null;
  showCamera: boolean;
}

/**
 * Actions returned by the useIDScanner hook
 */
export interface IDScannerActions {
  startScanning: () => Promise<void>;
  stopScanning: () => void;
  retryScanning: () => void;
  handleCancel: () => void;
  handlePhotoCapture: (e: React.ChangeEvent<HTMLInputElement>) => void;
  confirmPhotoVerification: () => void;
  clearPhoto: () => void;
}

/**
 * Refs used by the ID Scanner
 */
export interface IDScannerRefs {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  photoInputRef: React.RefObject<HTMLInputElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Props for scanner state components
 */
export interface ScannerIdleStateProps {
  onStartScanning: () => void;
}

export interface ScannerOverlayProps {
  isVisible: boolean;
}

export interface ScanningStateProps {
  status: ScannerStatus;
  debugInfo: string;
  onCancel: () => void;
}

export interface ScannerSuccessStateProps {
  scannedData: ParsedLicenseData;
}

export interface ScannerErrorStateProps {
  errorMessage: string;
  scannedData: ParsedLicenseData | null;
  onRetry: () => void;
  onCancel: () => void;
}

export interface PhotoReviewStateProps {
  capturedPhoto: string;
  onConfirm: () => void;
  onRetake: () => void;
}

// Re-export ParsedLicenseData for convenience
export type { ParsedLicenseData };
