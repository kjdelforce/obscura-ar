export const VHSVignetteShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0.0 },
    uIntensity: { value: 0.5 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uIntensity;
    varying vec2 vUv;

    void main() {
      vec2 uv = vUv;
      vec4 color = texture2D(tDiffuse, uv);

      // Vignette curve
      vec2 center = uv - 0.5;
      float dist = length(center);
      float vignette = smoothstep(0.75, 0.35, dist);

      // Scanline noise
      float scan = sin(uv.y * 500.0 + uTime * 10.0) * 0.04;
      
      vec3 finalColor = color.rgb * vignette - scan * uIntensity;
      gl_FragColor = vec4(finalColor, color.a);
    }
  `
};
