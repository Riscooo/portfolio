// La escena completa: elige la calidad, monta la nube, el fondo y el postprocesado, carga las capturas,
// sigue al puntero y, en cada fotograma, lleva la escena con suavidad hacia el estado que marca el scroll.
import * as THREE from 'three'
import { projects } from '../content/projects.js'
import { createBackground } from './background.js'
import { createParticles } from './particles.js'
import { createPost } from './post.js'
import { FpsGovernor, chooseQuality, gpuName } from './quality.js'
import { layout } from './targets.js'
import { placeholderCard } from '../ui/placeholder.js'
import { smallImage } from '../content/projects.js'
import { CONTEXT_ATTRIBUTES } from './support.js'

const TAU = Math.PI * 2
const PLANE_DISTANCE = 4.6

async function decode(src) {
  const image = new Image()
  image.decoding = 'async'
  image.src = src
  await image.decode()
  return image
}

/**
 * Las capturas, reducidas a la rejilla de partículas de cada proyecto (color medio de cada celda). Sin
 * captura, o si no carga, la tarjeta con su nombre. La reducción la hace el navegador fuera del hilo
 * principal (createImageBitmap); aquí solo se lee la rejilla, que es pequeña.
 */
async function loadImages({ cols, rows }) {
  return Promise.all(projects.map(async project => {
    try {
      const source = project.image ? await decode(smallImage(project.image)).catch(() => placeholderCard(project)) : await placeholderCard(project)
      const bitmap = await createImageBitmap(source, { resizeWidth: cols, resizeHeight: rows, resizeQuality: 'high' })
      const canvas = Object.assign(document.createElement('canvas'), { width: cols, height: rows })
      const context = canvas.getContext('2d', { willReadFrequently: true })
      context.drawImage(bitmap, 0, 0, cols, rows) // por si el navegador no admite resizeWidth
      bitmap.close()
      return context.getImageData(0, 0, cols, rows)
    } catch { return null }
  }))
}

/**
 * canvas: el lienzo y context, su WebGL 2 (de sceneContext). getTarget(): estado del scroll. frameFor(i): DOMRect del hueco de la captura del
 * proyecto i. onFrame(state, labels): por fotograma, el estado real (suavizado) y dónde están las
 * constelaciones en pantalla. reducedMotion: sin remolinos ni paralaje.
 */
export function createStage(canvas, { context, getTarget, frameFor, onFrame = () => {}, reducedMotion = false }) {
  const renderer = new THREE.WebGLRenderer({ canvas, context, ...CONTEXT_ATTRIBUTES })
  renderer.toneMapping = THREE.NoToneMapping
  const quality = chooseQuality({
    coarsePointer: matchMedia('(pointer: coarse)').matches, width: innerWidth, height: innerHeight,
    deviceMemory: navigator.deviceMemory, devicePixelRatio: devicePixelRatio, gpu: gpuName(renderer.getContext()), reducedMotion,
  })
  const governor = new FpsGovernor({ max: quality.maxPixelRatio, min: 1 })
  renderer.setPixelRatio(governor.ratio)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100)
  const background = createBackground()
  scene.add(background.mesh)
  const grid = layout(quality.size)
  const particles = createParticles(renderer, { size: quality.size, images: Array(projects.length).fill(null), palette: projects.map(p => p.color) })
  scene.add(particles.points)
  const post = createPost(renderer, scene, camera, quality)
  loadImages(grid).then(images => particles.setImages(images))

  // Cámara según la forma de la ventana: en vertical, más lejos y con el anillo más cerrado.
  const view = { width: 1, height: 1, ringRadius: 3.1, base: new THREE.Vector3() }
  function resize() {
    view.width = innerWidth; view.height = innerHeight
    const aspect = view.width / view.height
    const narrow = aspect < 0.9
    camera.aspect = aspect
    camera.fov = narrow ? 52 : 40
    view.ringRadius = narrow ? 2.0 : 3.1
    view.base.set(0, 0.1, narrow ? 13.5 : 8.6)
    camera.updateProjectionMatrix()
    renderer.setSize(view.width, view.height, false)
    post.setSize(view.width, view.height)
  }
  addEventListener('resize', resize)
  resize()

  // Puntero: dónde corta el plano z = 0 y cuánto empuja (se apaga solo al dejar de moverse).
  const pointer = { ndc: new THREE.Vector2(), position: new THREE.Vector3(99, 99, 99), force: 0, last: -10 }
  const raycaster = new THREE.Raycaster()
  const floor = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
  const onPointer = event => {
    pointer.ndc.set(event.clientX / innerWidth * 2 - 1, -(event.clientY / innerHeight) * 2 + 1)
    pointer.last = clock.elapsed
  }
  addEventListener('pointermove', onPointer, { passive: true })
  addEventListener('pointerdown', onPointer, { passive: true })

  // El estado real se acerca al del scroll con suavidad. Al cambiar de proyecto, primero se deshace la
  // captura del anterior y luego se forma la del siguiente.
  const current = { open: 0, form: 0, active: -1, ring: Math.PI / 4, drift: 0, focus: 0 }
  function approach(target, delta) {
    const k = 1 - Math.exp(-delta * (reducedMotion ? 14 : 5))
    const sameProject = target.active === current.active
    current.form += ((sameProject ? target.form : 0) - current.form) * Math.min(1, k * 1.6)
    if (!sameProject && current.form < 0.04) current.active = target.active
    current.open += (target.open - current.open) * k
    current.ring += (target.ring - current.ring) * k
    current.drift += (target.drift - current.drift) * k
    current.focus += ((target.active >= 0 ? 1 : 0) - current.focus) * k * 0.8
  }

  // El plano de la captura: delante de la cámara, en el mismo sitio que su hueco en la página.
  const plane = { center: new THREE.Vector3(), right: new THREE.Vector3(), up: new THREE.Vector3(), width: 1, height: 1 }
  const forward = new THREE.Vector3()
  function placePlane(rect) {
    const visibleHeight = 2 * PLANE_DISTANCE * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)
    const visibleWidth = visibleHeight * camera.aspect
    camera.getWorldDirection(forward)
    plane.right.setFromMatrixColumn(camera.matrixWorld, 0).normalize()
    plane.up.setFromMatrixColumn(camera.matrixWorld, 1).normalize()
    const r = rect ?? { left: view.width * 0.55, top: view.height * 0.25, width: view.width * 0.38, height: view.width * 0.38 / 1.6 }
    const x = ((r.left + r.width / 2) / view.width - 0.5) * visibleWidth
    const y = (0.5 - (r.top + r.height / 2) / view.height) * visibleHeight
    plane.center.copy(camera.position).addScaledVector(forward, PLANE_DISTANCE).addScaledVector(plane.right, x).addScaledVector(plane.up, y)
    plane.width = r.width / view.width * visibleWidth
    plane.height = r.height / view.height * visibleHeight
    return r.width / grid.cols
  }

  // Dónde cae cada constelación en pantalla (para su nombre), con la misma cuenta que el shader.
  const labels = projects.map(() => ({ x: 0, y: 0, depth: 0 }))
  const probe = new THREE.Vector3()
  function placeLabels(time) {
    for (let k = 0; k < projects.length; k++) {
      const angle = k * TAU / projects.length + current.ring
      probe.set(Math.sin(angle) * view.ringRadius, 0.45 * Math.sin(k * 2.1 + time * 0.35) + 0.82, Math.cos(angle) * view.ringRadius)
      const other = current.focus * (k === current.active ? 0 : 1)
      probe.multiplyScalar(1 + other * 0.45).add(new THREE.Vector3(0, -0.2 * other, -3.2 * other))
      probe.multiplyScalar(1 + current.drift * 0.55).z -= current.drift * 3
      const depth = probe.z
      probe.project(camera)
      labels[k].x = (probe.x * 0.5 + 0.5) * view.width
      labels[k].y = (-probe.y * 0.5 + 0.5) * view.height
      labels[k].depth = depth
    }
  }

  const clock = { elapsed: 0, last: performance.now(), raf: 0 }
  const parallax = new THREE.Vector2()
  function frame(now) {
    clock.raf = requestAnimationFrame(frame)
    const delta = Math.min(0.1, Math.max(0, (now - clock.last) / 1000))
    clock.last = now
    clock.elapsed += delta
    const time = clock.elapsed

    approach(getTarget(), delta)
    const ratio = governor.sample(delta)
    if (ratio !== renderer.getPixelRatio()) { renderer.setPixelRatio(ratio); post.setSize(view.width, view.height) }

    parallax.lerp(reducedMotion ? parallax.set(0, 0) : pointer.ndc, 1 - Math.exp(-delta * 2.5))
    camera.position.copy(view.base).add(new THREE.Vector3(parallax.x * 0.35, parallax.y * 0.22, 0))
    camera.lookAt(0, 0, 0)
    camera.updateMatrixWorld()

    raycaster.setFromCamera(pointer.ndc, camera)
    raycaster.ray.intersectPlane(floor, pointer.position)
    pointer.force = Math.max(0, 1 - (time - pointer.last) * 1.2)

    const pixelSize = placePlane(current.active >= 0 ? frameFor(current.active) : null)
    const intro = reducedMotion ? 0 : Math.pow(Math.max(0, 1 - time / 2.6), 3)
    particles.update({
      time, delta, state: current, plane, pointer, motion: reducedMotion ? 0 : 1, intro,
      pixelSize, pixelRatio: renderer.getPixelRatio(), ringRadius: view.ringRadius,
    })
    background.update({ time, width: view.width, height: view.height, parallax, drift: current.drift })
    post.focus(current.form)
    post.render(delta)
    placeLabels(time)
    onFrame(current, labels)
  }
  clock.raf = requestAnimationFrame(frame)

  // Con la pestaña oculta no se dibuja nada.
  const onVisibility = () => {
    cancelAnimationFrame(clock.raf)
    if (!document.hidden) { clock.last = performance.now(); clock.raf = requestAnimationFrame(frame) }
  }
  document.addEventListener('visibilitychange', onVisibility)

  return {
    quality,
    get state() { return current },
    dispose() {
      cancelAnimationFrame(clock.raf)
      removeEventListener('resize', resize)
      removeEventListener('pointermove', onPointer)
      removeEventListener('pointerdown', onPointer)
      document.removeEventListener('visibilitychange', onVisibility)
      particles.dispose(); post.dispose(); renderer.dispose()
    },
  }
}
