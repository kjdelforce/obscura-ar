'use client';
import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { SigilUVShader } from '@/shaders/materials/SigilUVMaterial';

interface SigilProps {
  position: [number, number, number];
  torchOn: boolean;
  onExorcised: () => void;
  onProgress: (progress: number) => void;
}

export function SigilRenderer({ position, torchOn, onExorcised, onProgress }: SigilProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const shaderRef = useRef<THREE.ShaderMaterial>(null);
  const chargeRef = useRef(0);
  const { camera } = useThree();

  const shaderArgs = useMemo(() => ({
    uniforms: THREE.UniformsUtils.clone(SigilUVShader.uniforms),
    vertexShader: SigilUVShader.vertexShader,
    fragmentShader: SigilUVShader.fragmentShader,
    transparent: true,
    side: THREE.DoubleSide
  }), []);

  useFrame((_, delta) => {
    if (!meshRef.current || !shaderRef.current) return;

    shaderRef.current.uniforms.uTime.value += delta;
    shaderRef.current.uniforms.uTorchActive.value = torchOn ? 1.0 : 0.0;

    const toSigil = new THREE.Vector3().subVectors(meshRef.current.position, camera.position).normalize();
    const cameraForward = new THREE.Vector3();
    camera.getWorldDirection(cameraForward);
    const dot = cameraForward.dot(toSigil);

    if (!torchOn && dot > 0.95) {
      chargeRef.current = Math.min(4.0, chargeRef.current + delta);
    } else {
      chargeRef.current = Math.max(0.0, chargeRef.current - delta * 0.5);
    }

    const progress = chargeRef.current / 4.0;
    onProgress(progress);

    if (chargeRef.current >= 4.0) {
      onExorcised();
      chargeRef.current = 0;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <planeGeometry args={[1.2, 1.2]} />
      <shaderMaterial ref={shaderRef} {...shaderArgs} />
    </mesh>
  );
}
