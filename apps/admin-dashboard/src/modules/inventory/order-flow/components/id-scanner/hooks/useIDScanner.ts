/**
 * useIDScanner Hook
 *
 * Encapsulates all ID scanner logic including:
 * - ZXing barcode reader initialization
 * - Camera stream management
 * - Barcode detection and parsing
 * - Photo capture fallback
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType, NotFoundException } from '@zxing/library';
import { parseDriverLicense } from '../../../utils/parseDriverLicense';
import type {
  ScannerStatus,
  IDScannerState,
  IDScannerActions,
  IDScannerRefs,
  ParsedLicenseData,
} from '../types';

interface UseIDScannerOptions {
  onScanSuccess: (data: ParsedLicenseData) => void;
  onScanError?: (error: string) => void;
  onCancel?: () => void;
}

interface UseIDScannerReturn {
  state: IDScannerState;
  actions: IDScannerActions;
  refs: IDScannerRefs;
}

/**
 * Create ZXing reader with barcode format hints
 */
function createCodeReader(): BrowserMultiFormatReader {
  const hints = new Map();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.PDF_417,
    BarcodeFormat.QR_CODE,
    BarcodeFormat.CODE_128,
    BarcodeFormat.CODE_39,
  ]);
  hints.set(DecodeHintType.TRY_HARDER, true);
  return new BrowserMultiFormatReader(hints);
}

/**
 * Generate a user-friendly error message from camera errors
 */
function getUserFriendlyErrorMessage(err: unknown): string {
  const message = err instanceof Error ? err.message : 'Failed to access camera';
  const errorName = err instanceof Error ? err.name : 'Unknown';

  if (message.includes('Permission denied') || message.includes('NotAllowedError')) {
    return 'Camera permission denied. Please allow camera access in browser settings.';
  }
  if (message.includes('NotFoundError')) {
    return 'No camera found. Please ensure your device has a camera.';
  }
  if (message.includes('NotReadableError') || message.includes('TrackStartError')) {
    return 'Camera may be in use by another app. Try closing other apps.';
  }
  if (message.includes('OverconstrainedError')) {
    return 'Camera settings not supported on this device.';
  }

  return `${errorName}: ${message}`;
}

export function useIDScanner({
  onScanSuccess,
  onScanError,
  onCancel,
}: UseIDScannerOptions): UseIDScannerReturn {
  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const scanProcessedRef = useRef<boolean>(false);

  // State
  const [status, setStatus] = useState<ScannerStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [scannedData, setScannedData] = useState<ParsedLicenseData | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);

  // Pre-initialize ZXing reader on mount for faster startup
  useEffect(() => {
    if (!codeReaderRef.current) {
      codeReaderRef.current = createCodeReader();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (codeReaderRef.current) {
        codeReaderRef.current = null;
      }
    };
  }, []);

  // Handle scan result from ZXing
  const handleScanResult = useCallback(
    (result: import('@zxing/library').Result | undefined, error: Error | undefined) => {
      // Show scanning activity periodically
      if (!result && Math.random() < 0.02) {
        setDebugInfo(`Scanning... ${new Date().toLocaleTimeString()}`);
      }

      if (result && !scanProcessedRef.current) {
        // Mark as processed to prevent double-handling
        scanProcessedRef.current = true;

        const barcodeText = result.getText();
        const formatName = result.getBarcodeFormat();

        // Immediately show that we detected something
        setDebugInfo(`DETECTED! Format: ${formatName}, Length: ${barcodeText.length}`);

        // Parse the license data
        const parsed = parseDriverLicense(barcodeText);

        // Stop scanner after detection
        setTimeout(() => {
          if (codeReaderRef.current) {
            codeReaderRef.current = null;
          }
        }, 100);

        if (parsed && parsed.dateOfBirth) {
          // We have DOB - that's the critical field for age verification
          // Fill in defaults for missing name fields
          if (!parsed.firstName && !parsed.lastName) {
            parsed.firstName = 'Customer';
            parsed.lastName = 'Verified';
            parsed.fullName = 'Verified Customer';
          }

          setScannedData(parsed);
          setStatus('success');

          // Check age requirement
          if (!parsed.isOver21) {
            setErrorMessage('Customer must be 21 or older');
            setStatus('error');
            onScanError?.('Customer must be 21 or older');
          } else if (parsed.isExpired) {
            setErrorMessage('ID is expired');
            setStatus('error');
            onScanError?.('ID is expired');
          } else {
            onScanSuccess(parsed);
          }
        } else {
          // Show raw data for debugging
          const hasAAMVA =
            barcodeText.includes('@') ||
            barcodeText.includes('ANSI') ||
            barcodeText.includes('DCS') ||
            barcodeText.includes('DAC');

          // Show what we found (if anything) vs what's missing
          const foundFields: string[] = [];
          const missingFields: string[] = [];

          if (parsed) {
            if (parsed.firstName) foundFields.push('name');
            else missingFields.push('name');
            if (parsed.dateOfBirth) foundFields.push('DOB');
            else missingFields.push('DOB');
            if (parsed.licenseNumber) foundFields.push('license#');
            else missingFields.push('license#');
          }

          const debugMsg =
            `Scanned ${barcodeText.length} chars. ${hasAAMVA ? 'AAMVA format' : 'Unknown format'}. ` +
            (foundFields.length > 0 ? `Found: ${foundFields.join(', ')}. ` : '') +
            (missingFields.length > 0 ? `Missing: ${missingFields.join(', ')}` : '');

          setDebugInfo(debugMsg);
          setErrorMessage('Could not read all required license info. Try again with better lighting.');
          setStatus('error');
        }
      }

      // Only log actual errors, not "not found" (normal during scanning)
      if (error && !(error instanceof NotFoundException)) {
        console.warn('[IDScanner] Decode error:', error);
      }
    },
    [onScanSuccess, onScanError]
  );

  // Start scanning with ZXing
  const startScanning = useCallback(async () => {
    setStatus('requesting');
    setErrorMessage('');
    scanProcessedRef.current = false;

    try {
      // Ensure reader is initialized
      if (!codeReaderRef.current) {
        codeReaderRef.current = createCodeReader();
      }

      if (!videoRef.current) {
        throw new Error('Video element not ready');
      }

      // Simple constraints - use back camera with reasonable resolution
      const constraints: MediaTrackConstraints = {
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 },
      };

      // Start camera directly without enumeration
      await codeReaderRef.current!.decodeFromConstraints(
        { video: constraints },
        videoRef.current!,
        handleScanResult
      );

      setStatus('scanning');
      setDebugInfo('');
    } catch (err) {
      console.error('[IDScanner] Failed to start scanner:', err);
      const userMessage = getUserFriendlyErrorMessage(err);
      setErrorMessage(userMessage);
      setStatus('error');
      onScanError?.(userMessage);
    }
  }, [handleScanResult, onScanError]);

  // Stop scanning
  const stopScanning = useCallback(() => {
    if (codeReaderRef.current) {
      codeReaderRef.current = null;
    }
    setStatus('idle');
    setScannedData(null);
    setDebugInfo('');
  }, []);

  // Retry scanning
  const retryScanning = useCallback(() => {
    // First ensure we fully stop and cleanup
    if (codeReaderRef.current) {
      codeReaderRef.current = null;
    }

    // Reset all state
    scanProcessedRef.current = false;
    setStatus('idle');
    setErrorMessage('');
    setScannedData(null);
    setDebugInfo('');

    // Wait a bit longer for camera to be released, then restart
    setTimeout(() => startScanning(), 500);
  }, [startScanning]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    stopScanning();
    onCancel?.();
  }, [stopScanning, onCancel]);

  // Photo capture for visual verification
  const handlePhotoCapture = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCapturedPhoto(event.target?.result as string);
        setStatus('photo');
      };
      reader.readAsDataURL(file);
    }
  }, []);

  // Clear captured photo
  const clearPhoto = useCallback(() => {
    setCapturedPhoto(null);
    setStatus('idle');
  }, []);

  // Confirm photo verification (budtender visually confirmed ID)
  const confirmPhotoVerification = useCallback(() => {
    try {
      onScanSuccess({
        firstName: 'Photo',
        lastName: 'Verified',
        fullName: 'Photo Verified Customer',
        dateOfBirth: new Date(1990, 0, 1),
        expirationDate: new Date(2030, 11, 31),
        licenseNumber: `PHOTO-${Date.now()}`,
        isExpired: false,
        isOver21: true,
        age: 21,
        raw: 'photo-verification',
      });
    } catch (err) {
      console.error('[IDScanner] Photo verification error:', err);
      setErrorMessage(`Verification failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setStatus('error');
    }
  }, [onScanSuccess]);

  // Determine if camera should be visible
  const showCamera = status === 'requesting' || status === 'scanning';

  return {
    state: {
      status,
      errorMessage,
      scannedData,
      debugInfo,
      capturedPhoto,
      showCamera,
    },
    actions: {
      startScanning,
      stopScanning,
      retryScanning,
      handleCancel,
      handlePhotoCapture,
      confirmPhotoVerification,
      clearPhoto,
    },
    refs: {
      videoRef,
      photoInputRef,
      containerRef,
    },
  };
}
