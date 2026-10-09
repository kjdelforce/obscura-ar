import * as THREE from 'three';

export const SigilUVShader = {
  uniforms: {
    uTime: { value: 0 },
    uTorchActive: { value: 0.0 },
    uColor: { value: new THREE.Color('#39ff14') },
    uAlpha: { value: 1.0 }
  },
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform float uTorchActive;
    uniform vec3 uColor;
    uniform float uAlpha;
    varying vec2 vUv;
    varying vec3 vNormal;

    void main() {
      vec2 center = vUv - 0.5;
      float dist = length(center);

      float pulse = sin(uTime * 4.0 - dist * 10.0) * 0.5 + 0.5;
      float edge = smoothstep(0.48, 0.42, dist);

      float visibility = mix(1.0, 0.08, uTorchActive);

      vec3 finalColor = uColor * (1.5 + pulse * 2.0);
      float finalAlpha = edge * visibility * uAlpha;

      gl_FragColor = vec4(finalColor, finalAlpha);
    }
  `
};
