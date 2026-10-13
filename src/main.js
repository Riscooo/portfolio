import '@fontsource-variable/unbounded'
import '@fontsource-variable/space-grotesk'
import '@fontsource-variable/jetbrains-mono'
import './styles.css'
import Lenis from 'lenis'
import { SECTIONS, sectionAt, storyState } from './story/timeline.js'
import { initialLang } from './content/i18n.js'
import { applyLang, savedLang } from './ui/lang.js'
import { setupCopy } from './ui/copy.js'
import { createStage, webglReady } from './scene/stage.js'

const root = document.documentElement
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
const sections = [...document.querySelectorAll('#story > section')]
const projectSections = sections.filter(section => section.classList.contains('project'))
const navLinks = [...document.querySelectorAll('.index a')]
const labels = [...document.querySelectorAll('.constellation-label')]
const progressBar = document.querySelector('.progress')
const nav = document.querySelector('.index')

// Idioma: el guardado, si no el del navegador.
let lang = initialLang(savedLang(), navigator.languages)
if (lang !== 'es') applyLang(lang)
document.querySelector('[data-lang-switch]').addEventListener('click', event => {
  lang = event.currentTarget.dataset.next ?? (lang === 'es' ? 'en' : 'es')
  applyLang(lang)
})
setupCopy()

// Medidas de cada tramo (cambian al redimensionar).
let bounds = []
const measure = () => { bounds = sections.map(section => ({ top: section.offsetTop, height: section.offsetHeight })) }
measure()
addEventListener('resize', measure)
new ResizeObserver(measure).observe(document.body)

// Scroll suave (Lenis), salvo con movimiento reducido.
let scrollY = window.scrollY
const lenis = reducedMotion ? null : new Lenis({ duration: 1.25, easing: t => 1 - Math.pow(1 - t, 3.2), smoothWheel: true, touchMultiplier: 1.4 })
if (lenis) {
  lenis.on('scroll', ({ scroll }) => { scrollY = scroll })
  const raf = time => { lenis.raf(time); requestAnimationFrame(raf) }
  requestAnimationFrame(raf)
} else {
  addEventListener('scroll', () => { scrollY = window.scrollY }, { passive: true })
}
const scrollTo = y => lenis ? lenis.scrollTo(y, { duration: 1.6 }) : window.scrollTo({ top: y, behavior: reducedMotion ? 'auto' : 'smooth' })

// Puntos de parada: donde cada tramo se ve entero (en un proyecto, con la captura formada).
const restOf = index => {
  const { top, height } = bounds[index]
  const span = Math.max(1, height - innerHeight)
  const at = { intro: 0, opening: 0.45, project: 0.55, about: 0.6, contact: 1 }[SECTIONS[index].kind]
  return top + span * at
}
for (const link of navLinks) {
  link.addEventListener('click', event => {
    event.preventDefault()
    scrollTo(restOf(2 + Number(link.dataset.index)))
    history.replaceState(null, '', link.hash)
  })
}
addEventListener('keydown', event => {
  if (event.target.closest('input, textarea, [contenteditable]') || event.altKey || event.ctrlKey || event.metaKey) return
  const step = { ArrowDown: 1, PageDown: 1, ' ': event.shiftKey ? -1 : 1, ArrowUp: -1, PageUp: -1 }[event.key]
  if (!step) return
  event.preventDefault()
  const { index } = sectionAt(scrollY + 2, innerHeight, bounds)
  const here = restOf(index)
  const next = step > 0 ? (scrollY < here - 4 ? index : index + 1) : (scrollY > here + 4 ? index : index - 1)
  scrollTo(restOf(Math.min(SECTIONS.length - 1, Math.max(0, next))))
})
// Un enlace directo (#kitsune) lleva a su proyecto con la captura formada.
if (location.hash) {
  const index = sections.findIndex(section => `#${section.id}` === location.hash)
  if (index > 0) requestAnimationFrame(() => window.scrollTo(0, restOf(index)))
}

const target = () => storyState(scrollY, innerHeight, bounds)

// La interfaz sigue al estado: posición de cada tramo, ficha, índice, progreso y nombres.
const clamp01 = value => Math.min(1, Math.max(0, value))
let lastSection = -1
function syncUi(scene, positions) {
  const story = target()
  const section = sections[story.section]
  section.style.setProperty('--p', story.t.toFixed(4))
  if (story.section !== lastSection) {
    for (const other of sections) if (other !== section) other.style.setProperty('--p', other.offsetTop < section.offsetTop ? '1' : '0')
    lastSection = story.section
  }
  const total = document.documentElement.scrollHeight - innerHeight
  progressBar.style.setProperty('--progress', clamp01(scrollY / Math.max(1, total)).toFixed(4))

  // Ficha y captura del proyecto: siguen a la imagen que forman las partículas.
  for (const [index, element] of projectSections.entries()) {
    const visible = scene ? (scene.active === index ? scene.form : 0) : (story.active === index ? story.form : 0)
    element.style.setProperty('--form', clamp01((visible - 0.3) / 0.55).toFixed(3))
    element.style.setProperty('--formed', (scene ? clamp01((visible - 0.88) / 0.1) : clamp01(visible * 1.4)).toFixed(3))
  }
  const current = story.active
  for (const link of navLinks) link.setAttribute('aria-current', String(Number(link.dataset.index) === current))
  const showNav = story.section >= 1 && story.section <= SECTIONS.length - 2
  nav.style.setProperty('--nav', showNav ? '1' : '0')
  nav.classList.toggle('visible', showNav)

  if (scene && positions) {
    for (const [index, label] of labels.entries()) {
      const { x, y, depth } = positions[index]
      const front = clamp01((depth + 3.4) / 4.5)
      const own = scene.active === index ? 1 - clamp01(scene.form * 3) : 1
      const others = scene.active >= 0 && scene.active !== index ? 0.35 : 1
      const alpha = clamp01(scene.open * 1.4 - 0.4) * clamp01(1 - scene.drift * 1.8) * own * others * (0.35 + 0.65 * front)
      label.style.opacity = alpha.toFixed(3)
      label.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -100%) scale(${(0.85 + 0.25 * front).toFixed(3)})`
    }
  }
}

let stage = null
if (webglReady()) {
  try {
    stage = createStage(document.getElementById('scene'), {
      getTarget: target,
      frameFor: index => projectSections[index]?.querySelector('.frame')?.getBoundingClientRect() ?? null,
      onFrame: syncUi,
      reducedMotion,
    })
    root.dataset.quality = String(stage.quality.size)
  } catch (error) {
    console.warn('La escena 3D no ha podido arrancar; se muestra la versión sin WebGL.', error)
    stage = null
  }
}
if (!stage) {
  root.classList.add('no-webgl')
  const loop = () => { syncUi(null, null); requestAnimationFrame(loop) }
  requestAnimationFrame(loop)
}
