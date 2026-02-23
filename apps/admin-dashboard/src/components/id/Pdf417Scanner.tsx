import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, HStack, Text } from '@chakra-ui/react';
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType, NotFoundException } from '@zxing/library';
import { parseDriverLicense, type ParsedLicenseData } from '../../modules/inventory/order-flow/utils/parseDriverLicense';

type Props = {
  minimumAge?: number;
  onScan: (data: ParsedLicenseData) => void;
  onError?: (msg: string) => void;
};

function createReader(): BrowserMultiFormatReader {
  const hints = new Map();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.PDF_417]);
  hints.set(DecodeHintType.TRY_HARDER, true);
  return new BrowserMultiFormatReader(hints);
}

export function Pdf417Scanner(props: Props) {
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const processedRef = useRef(false);

  const [status, setStatus] = useState<'idle' | 'requesting' | 'scanning' | 'error'>('idle');
  const [error, setError] = useState<string>('');
  const [debug, setDebug] = useState<string>('');

  useEffect(() => {
    if (!readerRef.current) readerRef.current = createReader();
    return () => {
      try {
        controlsRef.current?.stop();
      } catch {
        // ignore
      }
      controlsRef.current = null;
    };
  }, []);

  const minAge = props.minimumAge ?? 18;

  const handleResult = useCallback(
    (result: import('@zxing/library').Result | undefined, err: Error | undefined) => {
      if (!result && Math.random() < 0.02) setDebug(`Scanning... ${new Date().toLocaleTimeString()}`);

      if (result && !processedRef.current) {
        processedRef.current = true;
        const raw = result.getText();
        setDebug(`DETECTED (${result.getBarcodeFormat()}) ${raw.length} chars`);

        const parsed = parseDriverLicense(raw);
        try {
          controlsRef.current?.stop();
        } catch {
          // ignore
        } finally {
          controlsRef.current = null;
        }

        if (!parsed?.dateOfBirth) {
          const msg = 'Could not read required fields (DOB). Try better lighting and hold steady.';
          setError(msg);
          setStatus('error');
          props.onError?.(msg);
          return;
        }

        if (parsed.age == null) {
          const msg = 'Could not determine age from ID.';
          setError(msg);
          setStatus('error');
          props.onError?.(msg);
          return;
        }

        if (parsed.age < minAge) {
          const msg = `Must be ${minAge}+ (got ${parsed.age}).`;
          setError(msg);
          setStatus('error');
          props.onError?.(msg);
          return;
        }

        if (parsed.isExpired) {
          const msg = 'ID is expired.';
          setError(msg);
          setStatus('error');
          props.onError?.(msg);
          return;
        }

        props.onScan(parsed);
        return;
      }

      if (err && !(err instanceof NotFoundException)) {
        // Non-fatal decode errors are expected.
        // eslint-disable-next-line no-console
        console.warn('[Pdf417Scanner] decode error', err);
      }
    },
    [props, minAge]
  );

  const start = useCallback(async () => {
    setError('');
    setDebug('');
    processedRef.current = false;
    setStatus('requesting');

    try {
      try {
        controlsRef.current?.stop();
      } catch {
        // ignore
      }
      controlsRef.current = null;

      const r = readerRef.current ?? createReader();
      readerRef.current = r;

      const v = videoRef.current;
      if (!v) throw new Error('Video element not ready');

      const constraints: MediaTrackConstraints = {
        facingMode: 'environment',
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      };

      const controls = await r.decodeFromConstraints({ video: constraints }, v, handleResult);
      controlsRef.current = controls;
      setStatus('scanning');

      // Best-effort focus tuning.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const advanced: any[] = [{ focusMode: 'continuous' }];
      try {
        controls.streamVideoConstraintsApply?.({ advanced } as any);
      } catch {
        // ignore
      }
    } catch (e: any) {
      const msg = String(e?.message ?? e ?? 'Failed to access camera');
      setError(msg);
      setStatus('error');
      props.onError?.(msg);
    }
  }, [handleResult, props]);

  const stop = useCallback(() => {
    try {
      controlsRef.current?.stop();
    } catch {
      // ignore
    }
    controlsRef.current = null;
    setStatus('idle');
    setError('');
    setDebug('');
  }, []);

  const overlay = useMemo(() => {
    if (status !== 'scanning') return null;
    return (
      <Box position="absolute" inset={0} pointerEvents="none" borderRadius="14px" overflow="hidden">
        <Box
          position="absolute"
          inset={0}
          bg="rgba(0,0,0,0.25)"
          sx={{
            clipPath:
              'polygon(0% 0%, 0% 100%, 8% 100%, 8% 34%, 92% 34%, 92% 66%, 8% 66%, 8% 100%, 100% 100%, 100% 0%)',
          }}
        />
        <Box
          position="absolute"
          top="34%"
          left="8%"
          right="8%"
          bottom="34%"
          border="2px solid rgba(74, 222, 128, 0.95)"
          borderRadius="10px"
        />
      </Box>
    );
  }, [status]);

  return (
    <Box display="grid" gap={3}>
      <Box position="relative" bg="#000" border="1px solid rgba(255,255,255,0.10)" borderRadius="14px" overflow="hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: '100%',
            height: 'min(52vh, 420px)',
            objectFit: 'contain',
            display: 'block',
            background: '#000',
          }}
        />
        {overlay}
      </Box>

      <HStack spacing={3} flexWrap="wrap">
        {status === 'idle' ? (
          <Button colorScheme="green" onClick={() => void start()}>
            Start Scan
          </Button>
        ) : (
          <Button variant="outline" onClick={stop}>
            Stop
          </Button>
        )}
        <Text fontSize="sm" opacity={0.8}>
          {status === 'requesting'
            ? 'Starting camera...'
            : status === 'scanning'
              ? 'Scanning PDF417 barcode...'
              : status === 'error'
                ? 'Scan error'
                : 'Idle'}
        </Text>
      </HStack>

      {debug ? (
        <Text fontSize="xs" color="yellow.300">
          {debug}
        </Text>
      ) : null}
      {error ? (
        <Text fontSize="sm" color="red.300">
          {error}
        </Text>
      ) : null}
    </Box>
  );
}

