// El recorrido: qué tramo se ve con cada scroll y en qué estado está la escena. Todo puro: el mismo
// scroll da siempre el mismo estado (al recargar a mitad de página, la escena aparece en su sitio).
import { projects } from '../content/projects.js'

export const SECTIONS = [
  { kind: 'intro' },
  { kind: 'opening' },
  ...projects.map((project, index) => ({ kind: 'project', index, id: project.id })),
  { kind: 'about' },
  { kind: 'contact' },
]

const TAU = Math.PI * 2
const clamp01 = value => Math.min(1, Math.max(0, value))
const smooth = value => { const x = clamp01(value); return x * x * (3 - 2 * x) }
const lerp = (a, b, t) => a + (b - a) * t
const ramp = (t, from, to) => smooth((t - from) / (to - from))

/** Giro del anillo de constelaciones que deja la del proyecto `index` de frente a la cámara. */
export const angleFor = index => -index * TAU / projects.length

/** Tramo bajo el scroll y cuánto se ha recorrido de él (0 → 1 mientras está fijado en pantalla). */
export function sectionAt(scrollY, viewportHeight, bounds) {
  let index = 0
  for (let i = 0; i < bounds.length; i++) if (scrollY >= bounds[i].top) index = i
  const { top, height } = bounds[index]
  const span = Math.max(1, height - viewportHeight)
  return { index, t: clamp01((scrollY - top) / span) }
}

/**
 * Estado de la escena en el tramo `index` a la altura `t`:
 * open (esfera → constelaciones), active (proyecto de frente o -1), form (constelación → captura),
 * ring (giro del anillo) y drift (la nube se aleja, detrás de «sobre mí» y del contacto).
 */
export function stateAt(index, t) {
  const section = SECTIONS[index]
  const last = angleFor(projects.length - 1)
  switch (section.kind) {
    case 'intro':
      return { open: 0, active: -1, form: 0, ring: Math.PI / 4, drift: 0 }
    case 'opening':
      return { open: smooth(t), active: -1, form: 0, ring: lerp(Math.PI / 4, 0, smooth(t)), drift: 0 }
    case 'project': {
      const k = section.index
      const from = k === 0 ? 0 : angleFor(k - 1)
      const form = t < 0.7 ? ramp(t, 0.12, 0.4) : 1 - ramp(t, 0.7, 0.92)
      return { open: 1, active: k, form, ring: lerp(from, angleFor(k), ramp(t, 0, 0.15)), drift: 0 }
    }
    case 'about':
      return { open: 1, active: -1, form: 0, ring: last + 0.6 * smooth(t), drift: smooth(t) }
    case 'contact':
      return { open: 1 - smooth(t), active: -1, form: 0, ring: last + 0.6 + 0.3 * smooth(t), drift: 1 - smooth(t) }
    default:
      throw new Error(`Tramo desconocido: ${section.kind}`)
  }
}

/** Todo junto: tramo, posición en él y estado de la escena para un scroll dado. */
export function storyState(scrollY, viewportHeight, bounds) {
  const { index, t } = sectionAt(scrollY, viewportHeight, bounds)
  return { section: index, t, ...stateAt(index, t) }
}
