'use client';
import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { computeOrientationQuaternion } from '@/lib/math/sensorToQuaternion';

export function OrientationController() {
  const { camera } = useThree();
  const orientationRef = useRef<{ alpha: number; beta: number; gamma: number } | null>(null);
  const targetQuaternion = useRef(new THREE.Quaternion());

  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.alpha !== null && e.beta !== null && e.gamma !== null) {
        orientationRef.current = { alpha: e.alpha, beta: e.beta, gamma: e.gamma };
      }
    };

    window.addEventListener('deviceorientation', handleOrientation, true);
    return () => window.removeEventListener('deviceorientation', handleOrientation, true);
  }, []);

  useFrame(() => {
    if (!orientationRef.current) return;
    const { alpha, beta, gamma } = orientationRef.current;
    const screenOrient = (window.screen.orientation && window.screen.orientation.angle) || 0;

    targetQuaternion.current = computeOrientationQuaternion(alpha, beta, gamma, screenOrient);
    camera.quaternion.slerp(targetQuaternion.current, 0.15);
  });

  return null;
}
