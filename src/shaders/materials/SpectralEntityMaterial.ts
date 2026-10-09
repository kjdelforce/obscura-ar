import * as THREE from 'three';

export const SpectralEntityShader = {
  uniforms: {
    uTime: { value: 0 },
    uTorchActive: { value: 0.0 },
    uFresnelBias: { value: 0.1 },
    uFresnelScale: { value: 1.0 },
    uFresnelPower: { value: 2.0 },
    uColor: { value: new THREE.Color('#ff0033') }
  },
  vertexShader: `
    varying vec3 vPositionW;
    varying vec3 vNormalW;

    void main() {
      vPositionW = vec3(modelMatrix * vec4(position, 1.0));
      vNormalW = normalize(mat3(modelMatrix) * normal);
      gl_Position = projectionMatrix * viewMatrix * vec4(vPositionW, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform float uTorchActive;
    uniform float uFresnelBias;
    uniform float uFresnelScale;
    uniform float uFresnelPower;
    uniform vec3 uColor;

    varying vec3 vPositionW;
    varying vec3 vNormalW;

    void main() {
      vec3 viewDir = normalize(cameraPosition - vPositionW);
      float fresnel = uFresnelBias + uFresnelScale * pow(1.0 - max(dot(viewDir, vNormalW), 0.0), uFresnelPower);

      float jitter = sin(uTime * 15.0 + vPositionW.y * 10.0) * 0.1;
      float alpha = clamp(fresnel + jitter, 0.15, 0.95);

      vec3 base = mix(uColor, vec3(0.05, 0.05, 0.05), uTorchActive * 0.8);
      gl_FragColor = vec4(base, alpha);
    }
  `
};
