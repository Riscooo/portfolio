// Nube: un punto de luz suave con el centro caliente (el bloom lo convierte en brillo).
// Captura: un cuadradito sólido, como un píxel, para que la imagen se lea nítida.
varying vec3 vColor;
varying float vAlpha;
varying float vForm;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  float glow = pow(smoothstep(0.5, 0.0, d), 1.7);
  float core = smoothstep(0.16, 0.0, d) * 1.6;
  float square = step(max(abs(c.x), abs(c.y)), 0.5);
  float shape = mix(glow + core, square, vForm);
  float alpha = mix(glow, square, vForm) * vAlpha;
  if (alpha < 0.003) discard;
  gl_FragColor = vec4(vColor * shape, alpha);
}
