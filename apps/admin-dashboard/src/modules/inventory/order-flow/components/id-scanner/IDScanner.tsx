/**
 * ID Scanner Component
 *
 * Uses device camera to scan driver's license barcodes (PDF417)
 * using @zxing/browser for iOS compatibility.
 *
 * This is the main component that orchestrates all scanner functionality
 * by composing smaller, focused sub-components.
 */

import { Box } from '@chakra-ui/react';
import { useIDScanner } from './hooks';
import {
  ScannerOverlay,
  ScannerIdleState,
  ScannerSuccessState,
  ScannerErrorState,
  PhotoReviewState,
  ScanningState,
} from './components';
import type { IDScannerProps } from './types';

function IDScanner({ onScanSuccess, onScanError, onCancel }: IDScannerProps) {
  const { state, actions, refs } = useIDScanner({
    onScanSuccess,
    onScanError,
    onCancel,
  });

  const { status, errorMessage, scannedData, debugInfo, capturedPhoto, showCamera } = state;
  const {
    startScanning,
    retryScanning,
    handleCancel,
    handlePhotoCapture,
    confirmPhotoVerification,
    clearPhoto,
  } = actions;
  const { videoRef, photoInputRef, containerRef } = refs;

  return (
    <Box ref={containerRef} w="full">
      {/* Hidden photo input for fallback */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePhotoCapture}
        style={{ display: 'none' }}
      />

      {/* Video element - ALWAYS mounted unconditionally for ref availability */}
      {/* Positioned off-screen when not scanning, moved into view when scanning */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          position: showCamera ? 'relative' : 'absolute',
          left: showCamera ? 'auto' : '-9999px',
          width: showCamera ? '100%' : '1px',
          height: showCamera ? '300px' : '1px',
          objectFit: 'cover',
          borderRadius: '8px',
          maxWidth: '400px',
          margin: showCamera ? '0 auto' : '0',
          display: 'block',
          backgroundColor: 'black',
        }}
      />

      {/* Scanning overlay - appears on top of video when scanning */}
      <ScannerOverlay isVisible={status === 'scanning'} />

      {/* Idle State - Show start button */}
      {status === 'idle' && <ScannerIdleState onStartScanning={startScanning} />}

      {/* Photo Review State */}
      {status === 'photo' && capturedPhoto && (
        <PhotoReviewState
          capturedPhoto={capturedPhoto}
          onConfirm={confirmPhotoVerification}
          onRetake={clearPhoto}
        />
      )}

      {/* Requesting/Scanning State - Controls only, video is above */}
      {(status === 'requesting' || status === 'scanning') && (
        <ScanningState status={status} debugInfo={debugInfo} onCancel={handleCancel} />
      )}

      {/* Success State */}
      {status === 'success' && scannedData && (
        <ScannerSuccessState scannedData={scannedData} />
      )}

      {/* Error State */}
      {status === 'error' && (
        <ScannerErrorState
          errorMessage={errorMessage}
          scannedData={scannedData}
          onRetry={retryScanning}
          onCancel={handleCancel}
        />
      )}
    </Box>
  );
}

export default IDScanner;
