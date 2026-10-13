// Velocidad de cada partícula: un muelle amortiguado hacia su objetivo, el campo de ruido que la mueve
// como humo, un remolino mientras forma la captura y la onda del puntero. (#include del ruido delante.)
uniform float uTime;
uniform float uDelta;
uniform float uOpen;        // 0 esfera → 1 constelaciones
uniform float uForm;        // 0 constelación → 1 captura (solo el proyecto activo)
uniform float uActive;      // proyecto de frente, o -1
uniform float uRingAngle;   // giro del anillo de constelaciones
uniform float uRingRadius;
uniform float uDrift;       // la nube se aleja (sobre mí, contacto)
uniform float uMotion;      // 1 normal, 0 con movimiento reducido
uniform float uIntro;       // 1 → 0 al cargar: la nube se condensa
uniform float uFocus;       // 1 con un proyecto de frente: las demás constelaciones se retiran
uniform vec3 uPlaneCenter;
uniform vec3 uPlaneRight;
uniform vec3 uPlaneUp;
uniform vec2 uPlaneSize;
uniform vec3 uPointer;
uniform float uPointerForce;
uniform sampler2D tSphere;
uniform sampler2D tCluster;
uniform sampler2D tImage;

#define TAU 6.28318530718

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec3 pos = texture2D(texturePosition, uv).xyz;
  vec3 vel = texture2D(textureVelocity, uv).xyz;
  vec4 sphere = texture2D(tSphere, uv);
  vec4 cluster = texture2D(tCluster, uv);
  vec4 image = texture2D(tImage, uv);
  float seed = sphere.w;
  float project = cluster.w;

  // La esfera respira; cada constelación flota en su sitio del anillo.
  vec3 sphereTarget = sphere.xyz * (1.0 + 0.035 * sin(uTime * 1.1 + seed * TAU));
  float angle = project * TAU / 8.0 + uRingAngle;
  vec3 center = vec3(sin(angle) * uRingRadius, 0.45 * sin(project * 2.1 + uTime * 0.35), cos(angle) * uRingRadius);
  float other = uFocus * (1.0 - step(abs(project - uActive), 0.5));
  center = center * (1.0 + other * 0.45) + vec3(0.0, -0.2 * other, -3.2 * other);
  vec3 clusterTarget = center + cluster.xyz * (1.0 + 0.08 * sin(uTime * 1.7 + seed * 40.0));
  float opening = smoothstep(0.0, 1.0, clamp(uOpen * 1.35 - seed * 0.35, 0.0, 1.0));
  vec3 base = mix(sphereTarget, clusterTarget, opening);
  base = base * (1.0 + uDrift * 0.55) - vec3(0.0, 0.0, uDrift * 3.0);
  base *= 1.0 + uIntro * (2.5 + seed * 3.0);

  // El proyecto activo forma su captura en el plano que marca la ficha (escalonado por semilla).
  float isActive = step(abs(project - uActive), 0.5) * image.w;
  float form = isActive * smoothstep(0.0, 1.0, clamp(uForm * 1.4 - seed * 0.4, 0.0, 1.0));
  vec3 normal = normalize(cross(uPlaneRight, uPlaneUp));
  vec3 planeTarget = uPlaneCenter + uPlaneRight * image.x * uPlaneSize.x + uPlaneUp * image.y * uPlaneSize.y + normal * image.z;
  vec3 target = mix(base, planeTarget, form);

  // Muelle: más firme cuanto más formada está la imagen, para que quede nítida.
  float stiffness = mix(mix(4.2, 7.5, opening), 26.0, form);
  float damping = mix(2.8, 11.0, form);
  vec3 acc = (target - pos) * stiffness - vel * damping;

  // Humo: campo de ruido sin divergencia, más fuerte en la esfera; nada en la imagen formada.
  float flow = (1.0 - form) * mix(0.62, 0.16, opening) * uMotion;
  acc += bitangentNoise(pos * 0.42 + vec3(0.0, uTime * 0.06, uTime * 0.04)) * flow;

  // Remolino mientras viaja a la captura: gira alrededor del eje del plano.
  float swirl = sin(form * 3.14159) * isActive * uMotion;
  acc += cross(normal, pos - uPlaneCenter) * swirl * 2.4;

  // El puntero aparta las partículas como una onda.
  vec3 away = pos - uPointer;
  float dist2 = dot(away, away);
  acc += normalize(away + 1e-5) * uPointerForce * exp(-dist2 * 2.2) * 14.0 * (1.0 - form) * uMotion;

  vel += acc * uDelta;
  gl_FragColor = vec4(vel, 1.0);
}
