'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { soundEngine } from '@/lib/audio/SoundManager';
import { EncounterDirector } from '@/lib/game/EncounterDirector';
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


    // The Watcher: an emaciated, asymmetrical silhouette built from low-cost geometry.
    const skin = new THREE.MeshStandardMaterial({ color: 0x191415, roughness: 0.94, metalness: 0.05 });
    const bone = new THREE.MeshStandardMaterial({ color: 0x514740, roughness: 1 });
    const flesh = new THREE.MeshStandardMaterial({ color: 0x2a0c10, roughness: 0.9 });
    const appendage = (start: [number, number, number], end: [number, number, number], radius: number, material: THREE.Material) => {
      const a = new THREE.Vector3(...start), b = new THREE.Vector3(...end);
      const direction = b.clone().sub(a);
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.65, radius, direction.length(), 6), material);
      mesh.position.copy(a.add(b).multiplyScalar(0.5));
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
      entityGroup.add(mesh);
      return mesh;
    };
    const jaw = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.39, 7), flesh);
    jaw.rotation.z = Math.PI;
    jaw.position.set(0, 1.04, 0.25);
    entityGroup.add(jaw);
    for (const side of [-1, 1]) {
      // Uneven horns, jutting shoulders, unnaturally elongated arms and talons.
      appendage([side * 0.16, 1.57, 0], [side * 0.27, 2.02, -0.09], 0.09, bone);
      appendage([side * 0.27, 2.02, -0.09], [side * 0.38, 2.2, -0.14], 0.045, bone);
      appendage([side * 0.19, 1.11, 0], [side * 0.61, 0.98, 0.02], 0.14, skin);
      appendage([side * 0.61, 0.98, 0.02], [side * 0.69, 0.15, 0.29], 0.105, skin);
      appendage([side * 0.69, 0.15, 0.29], [side * 0.73, -0.42, 0.45], 0.075, skin);
      for (let claw = 0; claw < 3; claw++) {
        appendage([side * (0.68 + claw * 0.05), -0.39, 0.45], [side * (0.65 + claw * 0.08), -0.71, 0.66], 0.025, bone);
      }
      appendage([side * 0.12, 0.17, 0], [side * 0.22, -0.85, 0.04], 0.19, skin);
      appendage([side * 0.22, -0.85, 0.04], [side * 0.25, -1.18, 0.2], 0.11, skin);
      for (let rib = 0; rib < 4; rib++) {
        appendage([side * 0.08, 1.0 - rib * 0.14, 0.16], [side * (0.26 + rib * 0.014), 0.96 - rib * 0.14, 0.24], 0.025, bone);
      }
    }
    const eyeGlow = new THREE.PointLight(0xcc0715, 1.2, 1.9);
    eyeGlow.position.set(0, 1.38, 0.32);
    entityGroup.add(eyeGlow);
    scene.add(entityGroup);

    // The Mourner: a second distant, almost motionless apparition.
    const mourner = new THREE.Group();
    const veil = new THREE.Mesh(new THREE.ConeGeometry(0.42, 2.45, 9, 1, true), new THREE.MeshBasicMaterial({ color: 0x070707, transparent: true, opacity: 0.8, side: THREE.DoubleSide }));
    veil.rotation.z = Math.PI;
    mourner.add(veil);
    const face = new THREE.Mesh(new THREE.SphereGeometry(0.23, 10, 8), new THREE.MeshBasicMaterial({ color: 0x6e7472 }));
    face.position.set(0, 0.76, 0.06);
    face.scale.set(0.88, 1.25, 0.6);
    mourner.add(face);
    for (const side of [-1, 1]) {
      const socket = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), new THREE.MeshBasicMaterial({ color: 0x070000 }));
      socket.position.set(side * 0.095, 0.78, 0.18);
      mourner.add(socket);
    }
    mourner.position.set(-3.5, -0.1, -6.8);
    scene.add(mourner);

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
    let lastThreatAudio = 0;
    let lastHudUpdate = 0;
    const baseMourner = mourner.position.clone();
    const director = new EncounterDirector();

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

      if (now - lastHudUpdate > 100) {
        onDistanceChange(currentDist);
        lastHudUpdate = now;
      }
      soundEngine.updateEntityPosition(entityGroup.position.x, entityGroup.position.y, entityGroup.position.z);
      soundEngine.setEMFIntensity(currentDist);

      const encounter = director.update(delta, currentDist, isObserved, torchOn);
      const elapsed = now * 0.001;
      entityGroup.scale.y = 1 + Math.sin(elapsed * 2.4) * 0.024;
      eyeGlow.intensity = encounter.presence * (0.55 + Math.sin(elapsed * 8) * 0.35);
      mourner.position.y = baseMourner.y + Math.sin(elapsed * 0.9) * 0.12;
      mourner.lookAt(camera.position.x, mourner.position.y, camera.position.z);
      mourner.visible = encounter.mournerVisible && !(torchOn && Math.sin(elapsed * 5.3) > -0.25);
      if ((encounter.cue === 'whisper' || encounter.cue === 'laugh') && now - lastThreatAudio > 4500) {
        soundEngine.whisper();
        lastThreatAudio = now;
      }

      if (isObserved && torchOn && encounter.phase === 'hunting') {
        entityGroup.position.x += (Math.random() - 0.5) * 0.01;
      } else {
        const speed = encounter.speed;
        entityGroup.position.addScaledVector(toEntity, speed * delta);
        entityGroup.lookAt(camera.position.x, entityGroup.position.y, camera.position.z);
      }

      if (encounter.teleport) {
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
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      sigilTex.dispose();
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [onDistanceChange, onJumpscare, onSigilExorcised, onSigilProgress]);

  return <div ref={mountRef} className="absolute inset-0 pointer-events-none" />;
}
