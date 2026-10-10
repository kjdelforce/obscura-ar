'use client';
import { useCallback, useState } from 'react';
import { useCameraTorch } from '@/hooks/useCameraTorch';
import { CameraFeed } from '@/components/canvas/CameraFeed';
import { ARScene } from '@/components/canvas/ARScene';
import { EMFMeter } from '@/components/hud/EMFMeter';
import { BatteryIndicator } from '@/components/hud/BatteryIndicator';
import { CompassRadar } from '@/components/hud/CompassRadar';
import { GlitchOverlay } from '@/components/hud/GlitchOverlay';
import { PermissionModal } from '@/components/hud/PermissionModal';
import { soundEngine } from '@/lib/audio/SoundManager';

export default function GameContainer() {
  const {
    hasTorch,
    error,
    isTorchOn,
    batteryLevel,
    videoRef,
    toggleTorch,
    startCamera
  } = useCameraTorch();

  const [hasStarted, setHasStarted] = useState(false);
  const [jumpscareActive, setJumpscareActive] = useState(false);
  const [entityDistance, setEntityDistance] = useState(8);
  const [sigilProgress, setSigilProgress] = useState(0);
  const [sigilExorcised, setSigilExorcised] = useState(false);

  const handleStartGame = async () => {
    if (typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === 'function') {
      const permission = await (DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> }).requestPermission();
      if (permission !== 'granted') {
        alert('Orientation permission is required for spatial tracking.');
        return;
      }
    }

    await soundEngine.init();
    const cameraReady = await startCamera();
    if (cameraReady) setHasStarted(true);
  };

  const handleJumpscare = useCallback(() => {
    setJumpscareActive(true);
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([100, 50, 400]);
    }
    setTimeout(() => setJumpscareActive(false), 900);
  }, []);

  const handleExorcism = useCallback(() => {
    setSigilExorcised(true);
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
  }, []);

  if (!hasStarted) {
    return <>
      <PermissionModal onStart={handleStartGame} />
      {error && <div role="alert" className="fixed bottom-6 inset-x-6 z-50 border border-red-500 bg-black/95 p-4 text-sm text-red-300 font-mono">{error}</div>}
    </>;
  }

  return (
    <div className="fixed inset-0 bg-black overflow-hidden select-none">
      <CameraFeed videoRef={videoRef} />
      {error && <div role="alert" className="absolute z-50 top-1/3 inset-x-6 border border-red-500 bg-black/95 p-4 text-red-300 font-mono text-sm">{error}</div>}

      <div className="absolute inset-0 z-10 pointer-events-none">
        <ARScene
          isTorchOn={isTorchOn}
          onJumpscare={handleJumpscare}
          onDistanceChange={setEntityDistance}
          sigilExorcised={sigilExorcised}
          onSigilProgress={setSigilProgress}
          onSigilExorcised={handleExorcism}
        />
      </div>

      <GlitchOverlay active={jumpscareActive} />

      <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between p-6 font-mono text-xs">
        <div className="flex justify-between items-start text-neutral-400">
          <div>
            <p className="font-bold text-red-500 tracking-wider">OBSCURA v0.9</p>
            <p className="text-[10px]">FEED: 1080P // SENSOR_LOCK</p>
            <div className="mt-2 w-32">
              <EMFMeter distance={entityDistance} />
            </div>
            <div className="mt-2">
              <CompassRadar entityDistance={entityDistance} />
            </div>
          </div>

          <BatteryIndicator batteryLevel={batteryLevel} />
        </div>

        <div className="self-center flex flex-col items-center">
          <div className="relative w-14 h-14 border border-white/20 rounded-full flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
            {sigilProgress > 0 && !sigilExorcised && (
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="28"
                  cy="28"
                  r="24"
                  stroke="#39ff14"
                  strokeWidth="2"
                  fill="transparent"
                  strokeDasharray="150.8"
                  strokeDashoffset={150.8 * (1 - sigilProgress)}
                />
              </svg>
            )}
          </div>
          {sigilProgress > 0 && !sigilExorcised && (
            <p className="text-[10px] text-green-400 mt-2 tracking-widest">
              DECRYPTING: {(sigilProgress * 100).toFixed(0)}%
            </p>
          )}
          {sigilExorcised && (
            <p className="text-[10px] text-red-400 mt-2 tracking-widest animate-pulse">
              SIGIL NEUTRALIZED
            </p>
          )}
        </div>

        <div className="flex justify-between items-end pointer-events-auto">
          <div className="text-neutral-500 text-[10px]">
            {hasTorch ? 'HARDWARE TORCH: READY' : 'HARDWARE TORCH: SIMULATED'}
          </div>

          <button
            onClick={toggleTorch}
            disabled={batteryLevel <= 0}
            className={`px-6 py-3 border font-bold uppercase tracking-wider text-xs transition-all ${
              isTorchOn
                ? 'border-yellow-400 bg-yellow-400/20 text-yellow-300 shadow-[0_0_15px_rgba(250,204,21,0.4)]'
                : 'border-neutral-700 bg-neutral-900/80 text-neutral-300'
            }`}
          >
            {isTorchOn ? 'Torch ON' : 'Torch OFF'}
          </button>
        </div>
      </div>
    </div>
  );
}
