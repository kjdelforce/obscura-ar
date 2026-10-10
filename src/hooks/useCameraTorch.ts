import { useState, useRef, useCallback, useEffect } from 'react';
import type { RefCallback } from 'react';

export interface CameraTorchState {
  hasCamera: boolean;
  hasTorch: boolean;
  isTorchOn: boolean;
  batteryLevel: number;
  error: string | null;
  videoRef: RefCallback<HTMLVideoElement>;
  toggleTorch: () => Promise<void>;
  startCamera: () => Promise<boolean>;
}

export function useCameraTorch(): CameraTorchState {
  const streamRef = useRef<MediaStream | null>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null);
  const [hasCamera, setHasCamera] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [error, setError] = useState<string | null>(null);

  // React mounts the video AFTER the permission screen disappears.
  // A callback ref ensures the acquired stream attaches when the video exists.
  const videoRef = useCallback<RefCallback<HTMLVideoElement>>((node) => {
    if (!node || !streamRef.current) return;
    node.srcObject = streamRef.current;
    void node.play().catch((cause: unknown) => {
      console.error('Camera video playback failed:', cause);
      setError('Camera started but its video could not play. Check Safari camera permissions and try again.');
    });
  }, []);

  const startCamera = useCallback(async (): Promise<boolean> => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera access is unavailable. Open this game in Safari over HTTPS.');
      return false;
    }
    try {
      // Avoid requiring a particular resolution. Safari can select its supported mode.
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'environment' } }
      });
      const track = stream.getVideoTracks()[0];
      if (!track) {
        stream.getTracks().forEach((t) => t.stop());
        throw new Error('No video track was returned by the camera.');
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = stream;
      trackRef.current = track;
      track.addEventListener('ended', () => {
        setHasCamera(false);
        setError('Camera feed ended. Restart the game to reconnect.');
      }, { once: true });
      const capabilities = track.getCapabilities?.() as { torch?: boolean } | undefined;
      setHasTorch(Boolean(capabilities?.torch));
      setHasCamera(true);
      return true;
    } catch (cause: unknown) {
      const message = cause instanceof Error ? cause.message : 'Unknown camera failure';
      setError('Unable to start the camera: ' + message);
      setHasCamera(false);
      return false;
    }
  }, []);

  const toggleTorch = useCallback(async () => {
    if (!hasCamera || batteryLevel <= 0) return;
    const nextState = !isTorchOn;
    // iOS Safari frequently lacks hardware torch APIs. In that case this
    // controls the in-game virtual light so gameplay is still possible.
    if (hasTorch && trackRef.current) {
      try {
        await (trackRef.current as MediaStreamTrack & {
          applyConstraints: (constraints: MediaTrackConstraints) => Promise<void>
        }).applyConstraints({ advanced: [{ torch: nextState } as MediaTrackConstraintSet] });
      } catch (cause) {
        console.warn('Physical torch unavailable; using virtual torch:', cause);
        setHasTorch(false);
      }
    }
    setIsTorchOn(nextState);
  }, [hasCamera, hasTorch, isTorchOn, batteryLevel]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isTorchOn) {
        setBatteryLevel((prev) => {
          if (prev <= 1) {
            if (trackRef.current && hasTorch) {
              void trackRef.current.applyConstraints({
                advanced: [{ torch: false } as MediaTrackConstraintSet]
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

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  return { hasCamera, hasTorch, isTorchOn, batteryLevel, error, videoRef, toggleTorch, startCamera };
}
