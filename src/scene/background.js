// Fondo: el negro de un espacio profundo con una nebulosa muy tenue y estrellas lejanas que titilan.
// Se dibuja como un rectángulo a pantalla completa detrás de todo (sin cámara).
import * as THREE from 'three'

const vertexShader = `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.9999, 1.0); }`

const fragmentShader = `
uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uParallax;
uniform float uDrift;
varying vec2 vUv;

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + 17.1; a *= 0.5; } return v; }

void main() {
  vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
  vec2 p = (vUv - 0.5) * aspect;
  vec3 color = mix(vec3(0.010, 0.014, 0.030), vec3(0.020, 0.030, 0.060), smoothstep(0.9, -0.4, length(p - vec2(0.0, 0.1))));
  vec2 q = p * 1.6 + uParallax * 0.15 + vec2(uTime * 0.004, 0.0);
  float cloud = fbm(q + fbm(q * 0.7 + uTime * 0.01));
  vec3 nebula = mix(vec3(0.05, 0.16, 0.34), vec3(0.24, 0.08, 0.36), smoothstep(0.35, 0.75, fbm(q * 0.6 + 4.0)));
  color += nebula * smoothstep(0.42, 0.95, cloud) * 0.32 * (1.0 - uDrift * 0.4);
  // Estrellas: dos capas a distinta distancia (la lejana se mueve menos con el paralaje).
  for (int layer = 0; layer < 2; layer++) {
    float depth = layer == 0 ? 220.0 : 120.0;
    vec2 g = (p + uParallax * (layer == 0 ? 0.01 : 0.025)) * depth;
    vec2 cell = floor(g);
    float h = hash(cell);
    if (h > 0.985) {
      vec2 center = cell + 0.5 + (vec2(hash(cell + 1.3), hash(cell + 7.1)) - 0.5) * 0.6;
      float twinkle = 0.55 + 0.45 * sin(uTime * (1.0 + h * 3.0) + h * 40.0);
      color += vec3(0.75, 0.85, 1.0) * smoothstep(0.09, 0.0, length(g - center)) * twinkle * (layer == 0 ? 0.55 : 0.9);
    }
  }
  gl_FragColor = vec4(color, 1.0);
}`

export function createBackground() {
  const material = new THREE.ShaderMaterial({
    vertexShader, fragmentShader, depthWrite: false, depthTest: false,
    uniforms: { uTime: { value: 0 }, uResolution: { value: new THREE.Vector2(1, 1) }, uParallax: { value: new THREE.Vector2() }, uDrift: { value: 0 } },
  })
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material)
  mesh.frustumCulled = false
  mesh.renderOrder = -1
  return {
    mesh,
    update({ time, width, height, parallax, drift }) {
      const u = material.uniforms
      u.uTime.value = time; u.uResolution.value.set(width, height); u.uParallax.value.copy(parallax); u.uDrift.value = drift
    },
  }
}
