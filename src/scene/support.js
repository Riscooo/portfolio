// Comprobación previa, sin three.js: así se decide si cargar la escena antes de descargarla.

/** Los atributos del contexto de la escena (sin antialias ni stencil: el postprocesado ya suaviza). */
export const CONTEXT_ATTRIBUTES = { alpha: false, antialias: false, stencil: false, depth: true, powerPreference: 'high-performance' }

/**
 * El contexto WebGL 2 del lienzo, si sirve para la nube (texturas de punto flotante en las que se pueda
 * dibujar); si no, null. Es el mismo que luego usa three.js: crear uno solo para comprobar cuesta caro.
 */
export function sceneContext(canvas) {
  try {
    const gl = canvas.getContext('webgl2', CONTEXT_ATTRIBUTES)
    return gl && gl.getExtension('EXT_color_buffer_float') ? gl : null
  } catch { return null }
}
