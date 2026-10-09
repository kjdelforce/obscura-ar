import { useState, useEffect } from 'react';

export interface OrientationData {
  alpha: number | null;
  beta: number | null;
  gamma: number | null;
  screenOrientation: number;
}

export function useDeviceOrientation() {
  const [orientation, setOrientation] = useState<OrientationData>({
    alpha: null,
    beta: null,
    gamma: null,
    screenOrientation: 0
  });

  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      const screenAngle = (window.screen.orientation && window.screen.orientation.angle) || 0;
      setOrientation({
        alpha: e.alpha,
        beta: e.beta,
        gamma: e.gamma,
        screenOrientation: screenAngle
      });
    };

    window.addEventListener('deviceorientation', handleOrientation, true);
    return () => window.removeEventListener('deviceorientation', handleOrientation, true);
  }, []);

  return orientation;
}
