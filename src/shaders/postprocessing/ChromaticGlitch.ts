export const ChromaticGlitchShader = {
  uniforms: {
    tDiffuse: { value: null },
    uDistortion: { value: 0.0 },
    uTime: { value: 0.0 }
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
    uniform float uDistortion;
    uniform float uTime;
    varying vec2 vUv;

    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    void main() {
      vec2 uv = vUv;

      float scanline = sin(uv.y * 800.0 + uTime * 20.0) * 0.02 * uDistortion;
      
      float tear = 0.0;
      if (uDistortion > 0.4) {
        float slice = step(0.98, random(vec2(floor(uv.y * 30.0), floor(uTime * 15.0))));
        tear = (random(vec2(uTime)) - 0.5) * 0.08 * slice * uDistortion;
      }

      vec2 uvR = uv + vec2(0.015 * uDistortion + scanline + tear, 0.0);
      vec2 uvG = uv + vec2(scanline, 0.0);
      vec2 uvB = uv - vec2(0.015 * uDistortion - scanline, 0.0);

      float r = texture2D(tDiffuse, uvR).r;
      float g = texture2D(tDiffuse, uvG).g;
      float b = texture2D(tDiffuse, uvB).b;

      float grain = (random(uv + uTime) - 0.5) * 0.2 * uDistortion;

      gl_FragColor = vec4(vec3(r, g, b) + grain, 1.0);
    }
  `
};
