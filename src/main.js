import '@fontsource-variable/unbounded'
import '@fontsource-variable/space-grotesk'
import '@fontsource-variable/jetbrains-mono'
import './styles.css'
import Lenis from 'lenis'
import { SECTIONS, sectionAt, storyState } from './story/timeline.js'
import { initialLang } from './content/i18n.js'
import { applyLang, savedLang } from './ui/lang.js'
import { setupCopy } from './ui/copy.js'
import { fillWithPlaceholder } from './ui/placeholder.js'
import { projects } from './content/projects.js'
import { sceneContext } from './scene/support.js'

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

// Fichas sin captura (o con la captura rota): la tarjeta con el nombre del proyecto.
for (const [index, section] of projectSections.entries()) {
  const img = section.querySelector('.frame img')
  if (img.hasAttribute('data-placeholder')) fillWithPlaceholder(img, projects[index])
  else img.addEventListener('error', () => { img.alt = ''; fillWithPlaceholder(img, projects[index]) }, { once: true })
}

// Medidas de cada tramo y del recorrido (cambian al redimensionar).
// innerHeight también se guarda: leerlo en cada fotograma puede forzar un recálculo del diseño.
let bounds = []
let total = 1
let viewHeight = innerHeight
const measure = () => {
  viewHeight = innerHeight
  bounds = sections.map(section => ({ top: section.offsetTop, height: section.offsetHeight }))
  total = Math.max(1, document.documentElement.scrollHeight - viewHeight)
}
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

const target = () => storyState(scrollY, viewHeight, bounds)

// La interfaz sigue al estado: posición de cada tramo, ficha, índice, progreso y nombres. Se ejecuta en cada
// fotograma, así que solo toca el DOM cuando un valor cambia de verdad (cada cambio recalcula estilos).
const clamp01 = value => Math.min(1, Math.max(0, value))
const written = new Map()
const write = (element, key, value, apply) => {
  let last = written.get(element)
  if (!last) written.set(element, last = {})
  if (last[key] === value) return
  last[key] = value
  apply(value)
}
const setVar = (element, name, value) => write(element, name, value, v => element.style.setProperty(name, v))

function syncUi(scene, positions) {
  const story = target()
  for (const [index, section] of sections.entries()) {
    setVar(section, '--p', index === story.section ? story.t.toFixed(3) : index < story.section ? '1' : '0')
  }
  setVar(progressBar, '--progress', clamp01(scrollY / total).toFixed(3))

  // Ficha y captura del proyecto: siguen a la imagen que forman las partículas.
  for (const [index, element] of projectSections.entries()) {
    const visible = scene ? (scene.active === index ? scene.form : 0) : (story.active === index ? story.form : 0)
    setVar(element, '--form', clamp01((visible - 0.3) / 0.55).toFixed(3))
    setVar(element, '--formed', (scene ? clamp01((visible - 0.88) / 0.1) : clamp01(visible * 1.4)).toFixed(3))
  }
  for (const link of navLinks) write(link, 'current', String(Number(link.dataset.index) === story.active), v => link.setAttribute('aria-current', v))
  const showNav = story.section >= 1 && story.section <= SECTIONS.length - 2
  write(nav, 'visible', showNav, v => { nav.style.setProperty('--nav', v ? '1' : '0'); nav.classList.toggle('visible', v) })

  if (scene && positions) {
    for (const [index, label] of labels.entries()) {
      const { x, y, depth } = positions[index]
      const front = clamp01((depth + 3.4) / 4.5)
      const own = scene.active === index ? 1 - clamp01(scene.form * 3) : 1
      const others = scene.active >= 0 && scene.active !== index ? 0.35 : 1
      const alpha = clamp01(scene.open * 2.2 - 1.2) * clamp01(1 - scene.drift * 1.8) * own * others * (0.35 + 0.65 * front)
      write(label, 'opacity', alpha.toFixed(2), v => { label.style.opacity = v })
      if (alpha < 0.005) continue
      write(label, 'transform', `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -100%) scale(${(0.85 + 0.25 * front).toFixed(3)})`, v => { label.style.transform = v })
    }
  }
}

// La escena (three.js y el postprocesado) se descarga aparte, mientras la página ya se ve. Hasta que llega,
// o si no hay WebGL, la interfaz sigue al scroll sola.
let idle = 0
const followScroll = () => { syncUi(null, null); idle = requestAnimationFrame(followScroll) }
idle = requestAnimationFrame(followScroll)
const withoutScene = error => {
  if (error) console.warn('La escena 3D no ha podido arrancar; se muestra la versión sin WebGL.', error)
  root.classList.add('no-webgl')
}
const canvas = document.getElementById('scene')
const context = sceneContext(canvas)
if (context) {
  import('./scene/stage.js').then(({ createStage }) => {
    const stage = createStage(canvas, {
      context,
      getTarget: target,
      frameFor: index => projectSections[index]?.querySelector('.frame')?.getBoundingClientRect() ?? null,
      onFrame: syncUi,
      reducedMotion,
    })
    cancelAnimationFrame(idle)
    root.dataset.quality = String(stage.quality.size)
  }).catch(withoutScene)
} else {
  withoutScene()
}
