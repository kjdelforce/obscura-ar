'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { soundEngine } from '@/lib/audio/SoundManager';
import { computeOrientationQuaternion } from '@/lib/math/sensorToQuaternion';
import { SigilUVShader } from '@/shaders/materials/SigilUVMaterial';

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
  const mountRef = useRef<HTMLDivElement>(null);
  const torchRef = useRef(isTorchOn);
  torchRef.current = isTorchOn;

  const exorcisedRef = useRef(sigilExorcised);
  exorcisedRef.current = sigilExorcised;

  useEffect(() => {
    if (!mountRef.current) return;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 50);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    // 2. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.03);
    scene.add(ambientLight);

    const torchLight = new THREE.PointLight(0xffffff, 0, 12);
    torchLight.position.set(0, 0, 0);
    scene.add(torchLight);

    // 3. Entity: The Watcher
    const entityGroup = new THREE.Group();
    entityGroup.position.set(0, -0.4, -8);

    const headGeo = new THREE.SphereGeometry(0.3, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.95 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.35;
    entityGroup.add(head);

    const eyeGeo = new THREE.SphereGeometry(0.04, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0022 });
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.1, 1.37, 0.25);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.1, 1.37, 0.25);
    entityGroup.add(eyeL);
    entityGroup.add(eyeR);

    const bodyGeo = new THREE.CylinderGeometry(0.15, 0.35, 1.4, 16);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.9 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.55;
    entityGroup.add(body);

    scene.add(entityGroup);

    // 4. Demonic Sigil
    const sigilCanvas = document.createElement('canvas');
    sigilCanvas.width = 512;
    sigilCanvas.height = 512;
    const sCtx = sigilCanvas.getContext('2d');
    if (sCtx) {
      sCtx.strokeStyle = '#39ff14';
      sCtx.lineWidth = 6;
      sCtx.shadowBlur = 18;
      sCtx.shadowColor = '#39ff14';
      sCtx.beginPath();
      sCtx.arc(256, 256, 180, 0, Math.PI * 2);
      sCtx.stroke();
      sCtx.beginPath();
      sCtx.arc(256, 256, 210, 0, Math.PI * 2);
      sCtx.stroke();
      for (let i = 0; i < 5; i++) {
        const a1 = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const a2 = ((i + 1) * 4 * Math.PI) / 5 - Math.PI / 2;
        sCtx.beginPath();
        sCtx.moveTo(256 + Math.cos(a1) * 180, 256 + Math.sin(a1) * 180);
        sCtx.lineTo(256 + Math.cos(a2) * 180, 256 + Math.sin(a2) * 180);
        sCtx.stroke();
      }
    }

    const sigilTex = new THREE.CanvasTexture(sigilCanvas);
    const sigilMat = new THREE.MeshBasicMaterial({
      map: sigilTex,
      transparent: true,
      side: THREE.DoubleSide
    });
    const sigilMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), sigilMat);
    sigilMesh.position.set(0, 0, -4);
    scene.add(sigilMesh);

    // 5. Gyroscope Orientation & Fallback Controls
    let hasOrientation = false;
    let targetQuat = new THREE.Quaternion();

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.alpha !== null && e.beta !== null && e.gamma !== null) {
        hasOrientation = true;
        const screenAngle = (window.screen.orientation && window.screen.orientation.angle) || 0;
        targetQuat = computeOrientationQuaternion(e.alpha, e.beta, e.gamma, screenAngle);
      }
    };
    window.addEventListener('deviceorientation', handleOrientation, true);

    // Touch / Mouse drag fallback for look controls
    let isDragging = false;
    let yaw = 0, pitch = 0;
    let touchStartX = 0, touchStartY = 0;

    const onMouseDown = () => { isDragging = true; };
    const onMouseUp = () => { isDragging = false; };
    const onMouseMove = (e: MouseEvent) => {
      if (isDragging && !hasOrientation) {
        yaw -= e.movementX * 0.003;
        pitch -= e.movementY * 0.003;
        pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, pitch));
        camera.rotation.set(pitch, yaw, 0, 'YXZ');
      }
    };
    const onTouchStart = (e: TouchEvent) => {
      if (!hasOrientation && e.touches.length > 0) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!hasOrientation && e.touches.length > 0) {
        const dx = e.touches[0].clientX - touchStartX;
        const dy = e.touches[0].clientY - touchStartY;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        yaw -= dx * 0.005;
        pitch -= dy * 0.005;
        pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, pitch));
        camera.rotation.set(pitch, yaw, 0, 'YXZ');
      }
    };

    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchstart', onTouchStart);
    window.addEventListener('touchmove', onTouchMove);

    // 6. Game Loop
    let lastTime = performance.now();
    let animId: number;
    let sigilCharge = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const now = performance.now();
      const delta = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;

      const torchOn = torchRef.current;
      ambientLight.intensity = torchOn ? 0.35 : 0.03;
      torchLight.intensity = torchOn ? 4.5 : 0;

      if (hasOrientation) {
        camera.quaternion.slerp(targetQuat, 0.15);
      }

      const camDir = new THREE.Vector3();
      camera.getWorldDirection(camDir);

      // Entity AI
      const toEntity = new THREE.Vector3().subVectors(entityGroup.position, camera.position).normalize();
      const dot = camDir.dot(toEntity);
      const isObserved = dot > 0.45;
      const currentDist = entityGroup.position.distanceTo(camera.position);

      onDistanceChange(currentDist);
      soundEngine.updateEntityPosition(entityGroup.position.x, entityGroup.position.y, entityGroup.position.z);
      soundEngine.setEMFIntensity(currentDist);

      if (isObserved && torchOn) {
        entityGroup.position.x += (Math.random() - 0.5) * 0.01;
      } else {
        const speed = torchOn ? 0.35 : 1.75;
        entityGroup.position.addScaledVector(toEntity, speed * delta);
        entityGroup.lookAt(camera.position.x, entityGroup.position.y, camera.position.z);
      }

      if (currentDist < 1.15) {
        onJumpscare();
        soundEngine.triggerJumpscare();
        const angle = Math.random() * Math.PI * 2;
        entityGroup.position.set(Math.cos(angle) * 8, -0.4, Math.sin(angle) * 8);
      }

      // Sigil deciphering
      if (!exorcisedRef.current) {
        sigilMat.opacity = torchOn ? 0.08 : 0.95;
        sigilMesh.rotation.z += 0.01;

        const toSigil = new THREE.Vector3().subVectors(sigilMesh.position, camera.position).normalize();
        const sigilDot = camDir.dot(toSigil);

        if (!torchOn && sigilDot > 0.95) {
          sigilCharge = Math.min(4.0, sigilCharge + delta);
        } else {
          sigilCharge = Math.max(0.0, sigilCharge - delta * 0.6);
        }

        onSigilProgress(sigilCharge / 4.0);

        if (sigilCharge >= 4.0) {
          onSigilExorcised();
          soundEngine.triggerJumpscare(); // Exorcism pulse
          sigilCharge = 0;
        }
      } else {
        sigilMat.opacity = 0;
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('deviceorientation', handleOrientation, true);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [onDistanceChange, onJumpscare, onSigilExorcised, onSigilProgress]);

  return <div ref={mountRef} className="absolute inset-0 pointer-events-none" />;
}
