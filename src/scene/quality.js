// Cuántas partículas y qué resolución según el equipo, y un regulador que baja la resolución de dibujo
// si no se llega a ~55 fps (y la vuelve a subir cuando sobra).

const DEDICATED = /(nvidia|geforce|rtx|gtx|quadro|radeon rx|radeon pro|apple m\d|arc a\d)/i
const SOFTWARE = /(swiftshader|llvmpipe|softpipe|software)/i

/** info: { coarsePointer, width, height, deviceMemory, devicePixelRatio, gpu, reducedMotion } */
export function chooseQuality(info) {
  const phone = info.coarsePointer || Math.min(info.width, info.height) < 600
  let size = 384
  if (SOFTWARE.test(info.gpu ?? '') || (info.deviceMemory && info.deviceMemory <= 2)) size = 256
  else if (phone) size = 256
  else if (DEDICATED.test(info.gpu ?? '')) size = 512
  const dpr = Math.max(1, info.devicePixelRatio || 1)
  // Con gráfica dedicada se dibuja a 1,5× aunque la pantalla sea normal: puntos más finos (supersampling).
  const maxPixelRatio = phone ? Math.min(dpr, 1.5) : size === 512 ? Math.max(Math.min(dpr, 2), 1.5) : Math.min(dpr, 2)
  return { size, maxPixelRatio, phone }
}

/** El nombre de la tarjeta gráfica, si el navegador lo da (para elegir la calidad). */
export function gpuName(gl) {
  try {
    const info = gl.getExtension('WEBGL_debug_renderer_info')
    return String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER) ?? '')
  } catch { return '' }
}

export class FpsGovernor {
  constructor({ max, min = 1 }) {
    this.max = max
    this.min = Math.min(min, max)
    this.ratio = max
    this.average = 1 / 60
    this.cooldown = 0
  }

  /** Cada fotograma con su duración en segundos. Devuelve la resolución de dibujo a usar. */
  sample(delta) {
    this.average += (Math.min(delta, 0.25) - this.average) * 0.05
    if (this.cooldown > 0) { this.cooldown--; return this.ratio }
    if (this.average > 1 / 52 && this.ratio > this.min) {
      this.ratio = Math.max(this.min, +(this.ratio - 0.25).toFixed(2))
      this.cooldown = 45
    } else if (this.average < 1 / 70 && this.ratio < this.max) {
      this.ratio = Math.min(this.max, +(this.ratio + 0.25).toFixed(2))
      this.cooldown = 90
    }
    return this.ratio
  }
}
