// Posición: integra la velocidad. w guarda la semilla de cada partícula.
uniform float uDelta;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec4 pos = texture2D(texturePosition, uv);
  vec3 vel = texture2D(textureVelocity, uv).xyz;
  gl_FragColor = vec4(pos.xyz + vel * uDelta, pos.w);
}
