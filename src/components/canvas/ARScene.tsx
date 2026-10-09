'use client';
import { Canvas } from '@react-three/fiber';
import { OrientationController } from './OrientationController';
import { EntityRenderer } from './EntityRenderer';
import { SigilRenderer } from './SigilRenderer';

interface ARSceneProps {
  isTorchOn: boolean;
  onJumpscare: () => void;
  onDistanceChange: (dist: number) => void;
  sigilExorcised: boolean;
  onSigilProgress: (p: number) => void;
  onSigilExorcised: () => void;
}

export function ARScene({
  isTorchOn,
  onJumpscare,
  onDistanceChange,
  sigilExorcised,
  onSigilProgress,
  onSigilExorcised
}: ARSceneProps) {
  return (
    <Canvas camera={{ fov: 75, near: 0.1, far: 50 }}>
      <ambientLight intensity={isTorchOn ? 0.35 : 0.02} />
      {isTorchOn && <pointLight position={[0, 0, 0]} intensity={4.5} distance={10} color="#ffffff" />}
      <OrientationController />
      <EntityRenderer
        torchOn={isTorchOn}
        onJumpscare={onJumpscare}
        onDistanceChange={onDistanceChange}
      />
      {!sigilExorcised && (
        <SigilRenderer
          position={[0, 0, -4]}
          torchOn={isTorchOn}
          onProgress={onSigilProgress}
          onExorcised={onSigilExorcised}
        />
      )}
    </Canvas>
  );
}
