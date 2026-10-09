import * as THREE from 'three';

const degToRad = Math.PI / 180;
const euler = new THREE.Euler();
const q0 = new THREE.Quaternion();
const q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)); // -90 deg around X
const zee = new THREE.Vector3(0, 0, 1);

export function computeOrientationQuaternion(
  alpha: number,
  beta: number,
  gamma: number,
  screenOrientation: number = 0
): THREE.Quaternion {
  const result = new THREE.Quaternion();

  const alphaRad = alpha * degToRad;
  const betaRad = beta * degToRad;
  const gammaRad = gamma * degToRad;
  const orientRad = (screenOrientation || 0) * degToRad;

  // Three.js device coordinate convention: YXZ order
  euler.set(betaRad, alphaRad, -gammaRad, 'YXZ');
  result.setFromEuler(euler);

  // Compensate for camera base offset
  result.multiply(q1);

  // Compensate for screen orientation rotation
  q0.setFromAxisAngle(zee, -orientRad);
  result.multiply(q0);

  return result;
}
