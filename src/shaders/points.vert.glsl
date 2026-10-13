// Dibujo de las partículas: posición y velocidad salen de la simulación; el color, de la nube, de su
// constelación o de su píxel en la captura. Formando la imagen, cada punto mide un «píxel» de la ficha.
attribute vec2 reference;
uniform sampler2D tPosition;
uniform sampler2D tVelocity;
uniform sampler2D tCluster;
uniform sampler2D tImage;
uniform sampler2D tColor;
uniform vec3 uPalette[8];
uniform float uOpen;
uniform float uForm;
uniform float uActive;
uniform float uDrift;
uniform float uSize;
uniform float uPixelSize;   // tamaño en px de un «píxel» de la captura en pantalla
uniform float uPixelRatio;
uniform float uTime;
uniform float uFocus;
varying vec3 vColor;
varying float vAlpha;
varying float vForm;

void main() {
  vec4 pos = texture2D(tPosition, reference);
  vec3 vel = texture2D(tVelocity, reference).xyz;
  vec4 cluster = texture2D(tCluster, reference);
  vec4 image = texture2D(tImage, reference);
  float seed = pos.w;
  float project = cluster.w;
  vec3 tint = uPalette[int(project + 0.5)];

  float isActive = step(abs(project - uActive), 0.5) * image.w;
  float form = isActive * smoothstep(0.0, 1.0, clamp(uForm * 1.4 - seed * 0.4, 0.0, 1.0));

  // Nube: azul hielo a violeta según la altura, con chispas; abierta, el color de su proyecto.
  vec3 cold = mix(vec3(0.28, 0.62, 1.0), vec3(0.72, 0.42, 1.0), clamp(pos.y * 0.22 + 0.5, 0.0, 1.0));
  cold = mix(cold, vec3(1.0), step(0.985, seed) * 0.8);
  vec3 cloud = mix(cold, tint * 1.15, smoothstep(0.0, 1.0, uOpen));
  cloud *= mix(1.0, 0.16, uFocus * (1.0 - step(abs(project - uActive), 0.5)));   // las demás se apagan y se alejan
  cloud += tint * clamp(length(vel) * 0.18, 0.0, 0.9) * (1.0 - form);  // estela al moverse rápido
  vec3 pixel = texture2D(tColor, reference).rgb;
  vColor = mix(cloud, pixel * 1.08, form);

  vec4 mv = modelViewMatrix * vec4(pos.xyz, 1.0);
  gl_Position = projectionMatrix * mv;
  float cloudSize = uSize * (0.55 + seed * 0.95) * uPixelRatio / -mv.z;
  gl_PointSize = mix(cloudSize, uPixelSize * uPixelRatio * 1.06, form);
  float twinkle = 0.8 + 0.2 * sin(uTime * 2.0 + seed * 50.0);
  vAlpha = mix(0.85 * (1.0 - uDrift * 0.45) * twinkle, 1.0, form);
  vForm = form;
}
