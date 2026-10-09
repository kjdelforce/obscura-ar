import { useState, useRef, useCallback, useEffect } from 'react';

export interface CameraTorchState {
  hasCamera: boolean;
  hasTorch: boolean;
  isTorchOn: boolean;
  batteryLevel: number;
  error: string | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  toggleTorch: () => Promise<void>;
  startCamera: () => Promise<void>;
}

export function useCameraTorch(): CameraTorchState {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null);

  const [hasCamera, setHasCamera] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      const track = stream.getVideoTracks()[0];
      trackRef.current = track;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setHasCamera(true);

      const capabilities = track.getCapabilities?.() as { torch?: boolean } | undefined;
      if (capabilities && 'torch' in capabilities) {
        setHasTorch(Boolean(capabilities.torch));
      } else {
        setHasTorch(false);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Camera initialization failed';
      setError(message);
    }
  }, []);

  const toggleTorch = useCallback(async () => {
    if (!trackRef.current || !hasTorch || batteryLevel <= 0) return;

    try {
      const nextState = !isTorchOn;
      await (trackRef.current as unknown as { applyConstraints: (c: unknown) => Promise<void> }).applyConstraints({
        advanced: [{ torch: nextState }]
      });
      setIsTorchOn(nextState);
    } catch (err) {
      console.error('Torch hardware toggle failed:', err);
    }
  }, [hasTorch, isTorchOn, batteryLevel]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isTorchOn) {
        setBatteryLevel((prev) => {
          if (prev <= 1) {
            if (trackRef.current && hasTorch) {
              (trackRef.current as unknown as { applyConstraints: (c: unknown) => Promise<void> }).applyConstraints({
                advanced: [{ torch: false }]
              }).catch(() => {});
            }
            setIsTorchOn(false);
            return 0;
          }
          return Math.max(0, prev - 1.5);
        });
      } else {
        setBatteryLevel((prev) => Math.min(100, prev + 0.5));
      }
    }, 250);

    return () => clearInterval(interval);
  }, [isTorchOn, hasTorch]);

  return {
    hasCamera,
    hasTorch,
    isTorchOn,
    batteryLevel,
    error,
    videoRef,
    toggleTorch,
    startCamera
  };
}
