import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType, NotFoundException } from '@zxing/library';
import { parseDriverLicense, type ParsedLicenseData } from '../lib/parseDriverLicense';

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
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [scanningImage, setScanningImage] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualFirstName, setManualFirstName] = useState('');
  const [manualLastName, setManualLastName] = useState('');
  const [manualDob, setManualDob] = useState('');
  const [manualLicense, setManualLicense] = useState('');
  const [manualExpiration, setManualExpiration] = useState('');
  const [manualStreet, setManualStreet] = useState('');
  const [manualCity, setManualCity] = useState('');
  const [manualState, setManualState] = useState('');
  const [manualZip, setManualZip] = useState('');

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
        console.warn('[kiosk scanner] decode error', err);
      }
    },
    [props, minAge]
  );

  const scanFromImage = useCallback(
    async (file: File) => {
      setScanningImage(true);
      setStatus('requesting');
      setError('');
      setDebug('Reading uploaded image...');
      const objectUrl = URL.createObjectURL(file);

      const image = new Image();
      const readImage = () =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          image.onload = () => resolve(image);
          image.onerror = () => reject(new Error('Unable to load uploaded image.'));
          image.src = objectUrl;
        });

      try {
        const r = readerRef.current ?? createReader();
        readerRef.current = r;
        const loadedImage = await readImage();

        const normalizeScale = (angle: number, scaleFactor: number) => {
          const angleDeg = ((angle % 360) + 360) % 360;
          const useWidth = angleDeg === 90 || angleDeg === 270 ? loadedImage.naturalHeight : loadedImage.naturalWidth;
          const useHeight = angleDeg === 90 || angleDeg === 270 ? loadedImage.naturalWidth : loadedImage.naturalHeight;
          const baseScale = Math.max(1, Math.min(2, scaleFactor));
          return {
            scale: baseScale,
            width: Math.max(1, Math.round(useWidth * baseScale)),
            height: Math.max(1, Math.round(useHeight * baseScale)),
          };
        };

        const renderToCanvas = (angle: number, scaleFactor: number) => {
          const angleDeg = ((angle % 360) + 360) % 360;
          const radians = (angleDeg * Math.PI) / 180;
          const { scale, width, height } = normalizeScale(angleDeg, scaleFactor);
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return null;
          ctx.fillStyle = '#000';
          ctx.fillRect(0, 0, width, height);
          ctx.save();
          ctx.translate(width / 2, height / 2);
          ctx.rotate(radians);
          ctx.scale(scale, scale);
          ctx.drawImage(
            loadedImage,
            -loadedImage.naturalWidth / 2,
            -loadedImage.naturalHeight / 2,
            loadedImage.naturalWidth,
            loadedImage.naturalHeight
          );
          ctx.restore();
          return canvas;
        };

        const applyContrast = (input: HTMLCanvasElement) => {
          const out = document.createElement('canvas');
          out.width = input.width;
          out.height = input.height;
          const ctx = out.getContext('2d');
          const inputCtx = input.getContext('2d');
          if (!ctx || !inputCtx) return input;
          const data = inputCtx.getImageData(0, 0, input.width, input.height);
          for (let i = 0; i < data.data.length; i += 4) {
            const gray = 0.299 * data.data[i] + 0.587 * data.data[i + 1] + 0.114 * data.data[i + 2];
            const adjusted = Math.min(255, Math.max(0, (gray - 128) * 1.4 + 128));
            data.data[i] = adjusted;
            data.data[i + 1] = adjusted;
            data.data[i + 2] = adjusted;
          }
          ctx.putImageData(data, 0, 0);
          return out;
        };

        const cloneCanvas = (source: HTMLCanvasElement) => {
          const copy = document.createElement('canvas');
          copy.width = source.width;
          copy.height = source.height;
          const copyCtx = copy.getContext('2d');
          if (!copyCtx) return source;
          copyCtx.drawImage(source, 0, 0);
          return copy;
        };

        const renderInverted = (source: HTMLCanvasElement) => {
          const inverted = cloneCanvas(source);
          const ctx = inverted.getContext('2d');
          if (!ctx) return source;
          const imageData = ctx.getImageData(0, 0, inverted.width, inverted.height);
          for (let i = 0; i < imageData.data.length; i += 4) {
            imageData.data[i] = 255 - imageData.data[i];
            imageData.data[i + 1] = 255 - imageData.data[i + 1];
            imageData.data[i + 2] = 255 - imageData.data[i + 2];
          }
          ctx.putImageData(imageData, 0, 0);
          return inverted;
        };

        const renderThreshold = (source: HTMLCanvasElement, threshold = 140) => {
          const thresholded = cloneCanvas(source);
          const ctx = thresholded.getContext('2d');
          if (!ctx) return source;
          const data = ctx.getImageData(0, 0, thresholded.width, thresholded.height);
          for (let i = 0; i < data.data.length; i += 4) {
            const gray = 0.299 * data.data[i] + 0.587 * data.data[i + 1] + 0.114 * data.data[i + 2];
            const bw = gray >= threshold ? 255 : 0;
            data.data[i] = bw;
            data.data[i + 1] = bw;
            data.data[i + 2] = bw;
          }
          ctx.putImageData(data, 0, 0);
          return thresholded;
        };

        const renderTone = (source: HTMLCanvasElement, gamma = 1, contrast = 1, brightness = 0) => {
          const tone = document.createElement('canvas');
          tone.width = source.width;
          tone.height = source.height;
          const ctx = tone.getContext('2d');
          const sourceCtx = source.getContext('2d');
          if (!ctx || !sourceCtx) return source;
          const data = sourceCtx.getImageData(0, 0, source.width, source.height);
          const invGamma = 1 / Math.max(0.1, gamma);
          for (let i = 0; i < data.data.length; i += 4) {
            const r = data.data[i];
            const g = data.data[i + 1];
            const b = data.data[i + 2];
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            const centered = gray / 255 - 0.5;
            const contrasted = ((centered * contrast) + 0.5 + brightness / 255) * 255;
            const adjusted = Math.pow(Math.min(1, Math.max(0, contrasted / 255)), invGamma) * 255;
            data.data[i] = adjusted;
            data.data[i + 1] = adjusted;
            data.data[i + 2] = adjusted;
          }
          ctx.putImageData(data, 0, 0);
          return tone;
        };

        const cropCanvas = (
          source: HTMLCanvasElement,
          options: { x: number; y: number; w: number; h: number }
        ) => {
          const crop = document.createElement('canvas');
          const x = Math.max(0, Math.min(source.width - 1, Math.round(source.width * options.x)));
          const y = Math.max(0, Math.min(source.height - 1, Math.round(source.height * options.y)));
          const w = Math.max(1, Math.min(source.width - x, Math.round(source.width * options.w)));
          const h = Math.max(1, Math.min(source.height - y, Math.round(source.height * options.h)));
          crop.width = w;
          crop.height = h;
          const cropCtx = crop.getContext('2d');
          if (!cropCtx) return source;
          cropCtx.drawImage(source, x, y, w, h, 0, 0, w, h);
          return crop;
        };

        const tryDecode = async () => {
          const direct = await r.decodeFromImageUrl(objectUrl);
          return direct;
        };

        const tryBarcodeDetector = async () => {
          const detectorCtor = (window as Window & { BarcodeDetector?: typeof BarcodeDetector }).BarcodeDetector;
          if (!detectorCtor) {
            return null;
          }

          const detector = new detectorCtor({
            formats: ['pdf417', 'code_128', 'qr_code', 'aztec', 'data_matrix', 'itf'] as unknown as string[],
          });
          const detections = await detector.detect(loadedImage);
          if (!detections?.length) return null;
          const raw = detections[0]?.rawValue;
          if (!raw) return null;
          const parsed = parseDriverLicense(raw);
          if (!parsed?.dateOfBirth) return null;
          return { getText: () => raw } as import('@zxing/library').Result;
        };

        let result: import('@zxing/library').Result | null = null;

        try {
          setDebug('Trying image decode: image-url');
          result = await tryDecode();
        } catch {
          // try alternate decoders below
        }

        if (!result) {
          try {
            setDebug('Trying image decode: img-element');
            result = await r.decodeFromImageElement(loadedImage);
          } catch {
            // keep trying
          }
        }

        if (!result) {
          try {
            setDebug('Trying image decode: native-barcode-detector');
            const nativeResult = await tryBarcodeDetector();
            if (nativeResult) {
              result = nativeResult;
            }
          } catch {
            // keep trying
          }
        }

        if (!result) {
        const candidates: Array<{ label: string; canvas: HTMLCanvasElement | null }> = [];
        const scaleHint = 1400 / Math.max(loadedImage.naturalWidth, loadedImage.naturalHeight);
        candidates.push({ label: 'raw', canvas: renderToCanvas(0, 1) });
        candidates.push({ label: 'upscaled', canvas: renderToCanvas(0, scaleHint) });
        const contrastCanvas = candidates[1].canvas ? applyContrast(candidates[1].canvas) : null;
        if (contrastCanvas) candidates.push({ label: 'contrast', canvas: contrastCanvas });
        const upscaledCanvas = candidates[1].canvas;
        if (upscaledCanvas) {
          candidates.push({ label: 'barcode-crop-bottom', canvas: cropCanvas(upscaledCanvas, { x: 0.05, y: 0.55, w: 0.9, h: 0.42 }) });
          candidates.push({
            label: 'barcode-crop-center',
            canvas: cropCanvas(upscaledCanvas, { x: 0.06, y: 0.45, w: 0.88, h: 0.45 }),
          });
          candidates.push({
            label: 'barcode-crop-inverted',
            canvas: renderInverted(cropCanvas(upscaledCanvas, { x: 0.06, y: 0.45, w: 0.88, h: 0.45 })),
          });
          candidates.push({
            label: 'barcode-threshold',
            canvas: renderThreshold(cropCanvas(upscaledCanvas, { x: 0.06, y: 0.45, w: 0.88, h: 0.45 }), 150),
          });
          candidates.push({
            label: 'barcode-tinted-1',
            canvas: renderTone(cropCanvas(upscaledCanvas, { x: 0.05, y: 0.40, w: 0.9, h: 0.50 }), 0.9, 1.25, 0),
          });
          candidates.push({
            label: 'barcode-tinted-2',
            canvas: renderTone(cropCanvas(upscaledCanvas, { x: 0.05, y: 0.50, w: 0.9, h: 0.45 }), 1.1, 1.4, -5),
          });
          candidates.push({
            label: 'barcode-tinted-3',
            canvas: renderTone(cropCanvas(upscaledCanvas, { x: 0.02, y: 0.35, w: 0.96, h: 0.56 }), 1.2, 1.15, 0),
          });
          const slideY = [0.35, 0.45, 0.55];
          const slideH = [0.4, 0.45, 0.5, 0.55];
          slideY.forEach((y, indexY) => {
            slideH.forEach((h, indexH) => {
              const w = 0.94;
              const x = 0.03;
              candidates.push({
                label: `barcode-scan-${indexY}-${indexH}`,
                canvas: cropCanvas(upscaledCanvas, { x, y, w, h }),
              });
              candidates.push({
                label: `barcode-scan-${indexY}-${indexH}-thr`,
                canvas: renderThreshold(cropCanvas(upscaledCanvas, { x, y, w, h }), 130 + indexH * 15),
              });
              candidates.push({
                label: `barcode-scan-${indexY}-${indexH}-inv`,
                canvas: renderInverted(cropCanvas(upscaledCanvas, { x, y, w, h })),
              });
            });
          });
        }
        candidates.push({ label: 'rot90', canvas: renderToCanvas(90, 1) });
        if (upscaledCanvas) {
          candidates.push({ label: 'contrast-rot0', canvas: applyContrast(candidates[1].canvas) });
          candidates.push({ label: 'invert', canvas: renderInverted(upscaledCanvas) });
          candidates.push({ label: 'threshold', canvas: renderThreshold(upscaledCanvas, 150) });
          candidates.push({ label: 'threshold-invert', canvas: renderInverted(renderThreshold(upscaledCanvas, 150)) });
        }
        candidates.push({ label: 'rot180', canvas: renderToCanvas(180, 1) });
        candidates.push({ label: 'rot270', canvas: renderToCanvas(270, 1) });

        for (const candidate of candidates) {
          if (result) break;
          if (!candidate.canvas) continue;
          setDebug(`Trying image decode: ${candidate.label}`);
          try {
            result = r.decodeFromCanvas(candidate.canvas);
          }
          catch {
            // keep trying
          }
        }
        }

        if (!result) throw new Error('No barcode was detected in uploaded image.');
        handleResult(result, undefined);
      } catch (e: unknown) {
        const raw = String((e as Error)?.message ?? e ?? 'Failed to decode uploaded image');
        const msg = `Could not read image. ${raw}`;
        setError(msg);
        setStatus('error');
        props.onError?.(msg);
      } finally {
        URL.revokeObjectURL(objectUrl);
        setStatus('idle');
        setScanningImage(false);
      }
    },
    [handleResult, props]
  );

  const start = useCallback(async () => {
    setError('');
    setDebug('');
    processedRef.current = false;
    setStatus('requesting');

    try {
      const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
      if (!window.isSecureContext && !isLocalhost) {
        throw new Error('Camera requires HTTPS on this device/browser. Open scanner with an https:// URL or use localhost.');
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('This browser does not support camera access.');
      }

      try {
        const permission =
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (navigator.permissions?.query({ name: 'camera' as PermissionName } as any).catch(() => null));
        if (permission?.state === 'denied') {
          throw new Error('Camera permission denied for this site.');
        }
        if (permission?.state !== 'granted') {
          let requestedStream: MediaStream | null = null;
          try {
            requestedStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          } finally {
            requestedStream?.getTracks().forEach((t) => t.stop());
          }
        }
      } catch (e: any) {
        const raw = String(e?.message ?? e);
        const lower = raw.toLowerCase();
        if (lower.includes('notallowederror') || lower.includes('permission')) {
          throw new Error('Camera permission denied for this site. Enable camera access for this page and retry.');
        }
        if (lower.includes('notfounderror') || lower.includes('requested device not found')) {
          throw new Error(
            'No camera devices were found by the browser. If this is a private window, open this page in a normal tab and retry.'
          );
        }
      }

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

      const devices = await navigator.mediaDevices.enumerateDevices().catch(() => []);
      const videoDevices = devices.filter((d) => d.kind === 'videoinput');
      setCameras(videoDevices.map((d, idx) => ({ id: d.deviceId, label: d.label || `Camera ${idx + 1}` })));
      const hasSelectedCamera = selectedCameraId && videoDevices.some((d) => d.deviceId === selectedCameraId);
      const effectiveCameraId = hasSelectedCamera ? selectedCameraId : '';
      if (selectedCameraId && !hasSelectedCamera) {
        setSelectedCameraId('');
      }

      let controls: IScannerControls | null = null;
      let lastErr: unknown = null;
      const constraintsAttempts: Array<MediaTrackConstraints | boolean> = [
        true,
        { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        { facingMode: { ideal: 'user' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        { width: { ideal: 1280 }, height: { ideal: 720 } },
      ];
      if (effectiveCameraId) {
        constraintsAttempts.unshift({ deviceId: { ideal: effectiveCameraId }, width: { ideal: 1280 }, height: { ideal: 720 } });
      }

      for (const constraints of constraintsAttempts) {
        let stream: MediaStream | null = null;
        try {
          const mediaConstraints =
            constraints === true ? { video: true, audio: false } : { video: constraints, audio: false };
          stream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
          controls = await r.decodeFromStream(stream, v, handleResult);
          break;
        } catch (e) {
          lastErr = e;
          stream?.getTracks().forEach((t) => t.stop());
        }
      }

      if (!controls) {
        throw lastErr instanceof Error ? lastErr : new Error('Unable to start camera');
      }

      controlsRef.current = controls;
      setStatus('scanning');

      // Best-effort focus tuning
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const advanced: any[] = [{ focusMode: 'continuous' }];
      try {
        controls.streamVideoConstraintsApply?.({ advanced } as any);
      } catch {
        // ignore
      }
    } catch (e: any) {
      const raw = String(e?.message ?? e ?? 'Failed to access camera');
      const lower = raw.toLowerCase();
      const msg =
        lower.includes('notallowederror') || lower.includes('permission denied')
          ? 'Camera permission denied. Allow camera access in browser/site settings and retry.'
          : lower.includes('notfounderror') || lower.includes('requested device not found')
            ? 'No compatible camera was found. Disconnect/reconnect camera, reload this page, then click Start Scan again.'
          : lower.includes('secure') || lower.includes('https')
            ? raw
            : `Could not start camera. ${raw}`;
      setError(msg);
      setStatus('error');
      props.onError?.(msg);
    }
  }, [handleResult, props, selectedCameraId]);

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

  const submitManualEntry = useCallback(() => {
    const firstName = manualFirstName.trim();
    const lastName = manualLastName.trim();
    const licenseNumber = manualLicense.trim();
    const dobDate = manualDob ? new Date(`${manualDob}T00:00:00`) : null;
    const expirationDate = manualExpiration ? new Date(`${manualExpiration}T00:00:00`) : null;

    if (!firstName || !lastName || !licenseNumber || !dobDate || Number.isNaN(dobDate.getTime())) {
      const msg = 'Manual entry requires first name, last name, DOB, and license number.';
      setError(msg);
      setStatus('error');
      props.onError?.(msg);
      return;
    }

    const today = new Date();
    let age = today.getFullYear() - dobDate.getFullYear();
    const monthDiff = today.getMonth() - dobDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) age--;

    if (age < minAge) {
      const msg = `Must be ${minAge}+ (got ${age}).`;
      setError(msg);
      setStatus('error');
      props.onError?.(msg);
      return;
    }

    const isExpired = !!(expirationDate && !Number.isNaN(expirationDate.getTime()) && expirationDate < today);
    const parsed: ParsedLicenseData = {
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`.trim(),
      dateOfBirth: dobDate,
      expirationDate: expirationDate && !Number.isNaN(expirationDate.getTime()) ? expirationDate : null,
      licenseNumber,
      isExpired,
      isOver21: age >= 21,
      age,
      raw: `MANUAL_ENTRY:${licenseNumber}`,
      address:
        manualStreet.trim() || manualCity.trim() || manualState.trim() || manualZip.trim()
          ? {
              street: manualStreet.trim(),
              city: manualCity.trim(),
              state: manualState.trim().toUpperCase(),
              zip: manualZip.trim(),
            }
          : undefined,
    };

    if (parsed.isExpired) {
      const msg = 'ID is expired.';
      setError(msg);
      setStatus('error');
      props.onError?.(msg);
      return;
    }

    setError('');
    setDebug('Manual ID entry submitted.');
    setStatus('idle');
    props.onScan(parsed);
  }, [
    manualCity,
    manualDob,
    manualExpiration,
    manualFirstName,
    manualLastName,
    manualLicense,
    manualState,
    manualStreet,
    manualZip,
    minAge,
    props,
  ]);

    const overlay = useMemo(() => {
    if (status !== 'scanning') return null;
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          borderRadius: 14,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.25)',
            clipPath:
              'polygon(0% 0%, 0% 100%, 8% 100%, 8% 34%, 92% 34%, 92% 66%, 8% 66%, 8% 100%, 100% 100%, 100% 0%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '34%',
            left: '8%',
            right: '8%',
            bottom: '34%',
            border: '2px solid rgba(74, 222, 128, 0.95)',
            borderRadius: 10,
          }}
        />
      </div>
    );
  }, [status]);

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <label style={btn as React.CSSProperties}>
        Upload Driver License Photo
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => {
            const file = e.currentTarget.files?.[0];
            if (file) void scanFromImage(file);
            e.currentTarget.value = '';
          }}
          style={{ display: 'none' }}
        />
      </label>

      <button style={btn} onClick={() => setShowManualEntry((v) => !v)}>
        {showManualEntry ? 'Hide Manual Entry' : 'Enter ID Manually'}
      </button>

      {showManualEntry ? (
        <div style={{ border: '1px solid rgba(255,255,255,0.14)', borderRadius: 12, padding: 12, display: 'grid', gap: 10 }}>
          <div style={{ fontSize: 12, opacity: 0.75 }}>
            Manual fallback for demo flow when barcode detection fails.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <input style={input} placeholder="First name *" value={manualFirstName} onChange={(e) => setManualFirstName(e.target.value)} />
            <input style={input} placeholder="Last name *" value={manualLastName} onChange={(e) => setManualLastName(e.target.value)} />
            <input style={input} type="date" value={manualDob} onChange={(e) => setManualDob(e.target.value)} />
            <input style={input} placeholder="License number *" value={manualLicense} onChange={(e) => setManualLicense(e.target.value)} />
            <input style={input} type="date" value={manualExpiration} onChange={(e) => setManualExpiration(e.target.value)} />
            <input style={input} placeholder="Street" value={manualStreet} onChange={(e) => setManualStreet(e.target.value)} />
            <input style={input} placeholder="City" value={manualCity} onChange={(e) => setManualCity(e.target.value)} />
            <input style={input} placeholder="State" maxLength={2} value={manualState} onChange={(e) => setManualState(e.target.value)} />
            <input style={input} placeholder="ZIP" value={manualZip} onChange={(e) => setManualZip(e.target.value)} />
          </div>
          <button style={btnPrimary} onClick={submitManualEntry}>
            Continue With Manual Entry
          </button>
        </div>
      ) : null}

      <div
        style={{
          position: 'relative',
          background: '#000',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 14,
          overflow: 'hidden',
        }}
      >
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
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {status === 'idle' ? (
          <button style={btnPrimary} onClick={() => void start()}>
            Start Scan
          </button>
        ) : (
          <button style={btn} onClick={stop}>
            Stop
          </button>
        )}

        <div style={{ fontSize: 12, opacity: 0.75 }}>
          {status === 'requesting'
            ? 'Starting camera...'
            : status === 'scanning'
              ? 'Scanning PDF417 barcode...'
              : status === 'error'
                ? 'Scan error'
                : 'Idle'}
          {scanningImage ? <span style={{ marginLeft: 8 }}>(image scan in progress)</span> : null}
        </div>
      </div>

      {cameras.length > 1 ? (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ fontSize: 12, opacity: 0.8 }}>Camera</div>
          <select
            value={selectedCameraId}
            onChange={(e) => setSelectedCameraId(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.08)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.16)',
              borderRadius: 8,
              padding: '6px 8px',
            }}
          >
            <option value="">Auto</option>
            {cameras.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {debug ? <div style={{ fontSize: 12, color: '#FBBF24' }}>{debug}</div> : null}
      {error ? <div style={{ fontSize: 13, color: '#FCA5A5' }}>{error}</div> : null}
    </div>
  );
}

const btn: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.14)',
  background: 'rgba(255,255,255,0.06)',
  color: '#fff',
  fontWeight: 800,
  cursor: 'pointer',
};

const btnPrimary: React.CSSProperties = {
  ...btn,
  background: 'rgba(34,197,94,0.18)',
  border: '1px solid rgba(34,197,94,0.45)',
};

const input: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.06)',
  color: '#fff',
  border: '1px solid rgba(255,255,255,0.16)',
  borderRadius: 10,
  padding: '10px 12px',
  fontSize: 14,
};
