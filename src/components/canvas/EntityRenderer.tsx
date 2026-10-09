'use client';
import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { soundEngine } from '@/lib/audio/SoundManager';
import { SpectralEntityShader } from '@/shaders/materials/SpectralEntityMaterial';

interface EntityProps {
  torchOn: boolean;
  onJumpscare: () => void;
  onDistanceChange?: (dist: number) => void;
}

export function EntityRenderer({ torchOn, onJumpscare, onDistanceChange }: EntityProps) {
  const meshRef = useRef<THREE.Group>(null);
  const shaderMatRef = useRef<THREE.ShaderMaterial>(null);
  const { camera } = useThree();

  const entityState = useRef<'STALKING' | 'FROZEN' | 'ATTACK'>('STALKING');
  const distanceRef = useRef(8);

  const shaderConfig = useMemo(() => ({
    uniforms: THREE.UniformsUtils.clone(SpectralEntityShader.uniforms),
    vertexShader: SpectralEntityShader.vertexShader,
    fragmentShader: SpectralEntityShader.fragmentShader,
    transparent: true,
    depthWrite: false
  }), []);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    const entityPos = meshRef.current.position;
    const camPos = camera.position;

    const toEntity = new THREE.Vector3().subVectors(entityPos, camPos).normalize();
    const cameraForward = new THREE.Vector3();
    camera.getWorldDirection(cameraForward);

    const dot = cameraForward.dot(toEntity);
    const isObserved = dot > 0.45;

    const currentDist = entityPos.distanceTo(camPos);
    distanceRef.current = currentDist;
    onDistanceChange?.(currentDist);

    soundEngine.updateEntityPosition(entityPos.x, entityPos.y, entityPos.z);
    soundEngine.setEMFIntensity(currentDist);

    if (shaderMatRef.current) {
      shaderMatRef.current.uniforms.uTime.value += delta;
      shaderMatRef.current.uniforms.uTorchActive.value = torchOn ? 1.0 : 0.0;
    }

    if (isObserved && torchOn) {
      entityState.current = 'FROZEN';
    } else {
      entityState.current = 'STALKING';
      const speed = torchOn ? 0.35 : 1.8;
      entityPos.addScaledVector(toEntity, -speed * delta);
      meshRef.current.lookAt(camPos.x, entityPos.y, camPos.z);
    }

    if (currentDist < 1.1) {
      soundEngine.triggerJumpscare();
      onJumpscare();
      entityPos.set((Math.random() - 0.5) * 10, -0.5, -(6 + Math.random() * 6));
    }
  });

  return (
    <group ref={meshRef} position={[0, -0.5, -8]}>
      <mesh position={[0, 1.3, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <shaderMaterial ref={shaderMatRef} {...shaderConfig} />
      </mesh>
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.2, 0.35, 1.3, 16]} />
        <meshStandardMaterial color="#0d0d0d" roughness={0.9} />
      </mesh>
    </group>
  );
}
