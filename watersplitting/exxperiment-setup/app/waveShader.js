import * as THREE from "three";
// waveShader.js
export const waveShader = {
  uniforms: {
    time: { value: 0.0 },
    resolution: { value: new THREE.Vector2() },
  },
  vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
  fragmentShader: `
      uniform float time;
      uniform vec2 resolution;
      varying vec2 vUv;
      
      void main() {
        vec2 uv = vUv;
        float distance = length(uv - 0.5);
        float wave = sin(20.0 * distance - time) * 0.05;
        vec3 color = vec3(0.0, 0.5, 1.0) * (0.5 + wave);
        gl_FragColor = vec4(color, 1.0);
      }
    `,
};
