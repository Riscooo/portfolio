// Cuando un proyecto aún no tiene captura (o no carga): una tarjeta con su nombre y sus colores, dibujada en
// el momento. La usan la ficha (como imagen) y las partículas (como objetivo), así que se hace una vez.
import { projects } from '../content/projects.js'

const WIDTH = 1600
const HEIGHT = 1000
const cache = new Map()

function draw(project) {
  const canvas = Object.assign(document.createElement('canvas'), { width: WIDTH, height: HEIGHT })
  const c = canvas.getContext('2d')
  const tint = project.color

  c.fillStyle = '#070a14'
  c.fillRect(0, 0, WIDTH, HEIGHT)
  const glow = (x, y, radius, alpha) => {
    const gradient = c.createRadialGradient(x, y, 0, x, y, radius)
    gradient.addColorStop(0, tint + alpha)
    gradient.addColorStop(1, tint + '00')
    c.fillStyle = gradient
    c.fillRect(0, 0, WIDTH, HEIGHT)
  }
  glow(WIDTH * 0.78, HEIGHT * 0.22, 900, '66')
  glow(WIDTH * 0.1, HEIGHT * 1.05, 700, '2a')

  // Rejilla de puntos, más visible hacia la luz.
  for (let y = 40; y < HEIGHT; y += 40) {
    for (let x = 40; x < WIDTH; x += 40) {
      const light = Math.max(0, 1 - Math.hypot(x / WIDTH - 0.78, y / HEIGHT - 0.22) * 1.4)
      c.fillStyle = `rgb(255 255 255 / ${(0.05 + light * 0.18).toFixed(3)})`
      c.fillRect(x - 1, y - 1, 2, 2)
    }
  }

  const index = String(projects.indexOf(project) + 1).padStart(2, '0')
  c.textBaseline = 'alphabetic'
  c.font = '500 30px "JetBrains Mono Variable", monospace'
  if ('letterSpacing' in c) c.letterSpacing = '8px'
  c.fillStyle = tint
  c.fillText(index, 120, 470)
  c.fillRect(190, 459, 90, 2)
  c.fillStyle = '#c9d6ee'
  c.fillText(project.es.tech.join(' · ').toUpperCase(), 310, 470)

  // El nombre, tan grande como quepa.
  if ('letterSpacing' in c) c.letterSpacing = '-6px'
  let size = 226
  do { size -= 6; c.font = `800 ${size}px "Unbounded Variable", sans-serif` } while (c.measureText(project.name).width > WIDTH - 240 && size > 80)
  const name = c.createLinearGradient(0, 520, 0, 520 + size)
  name.addColorStop(0, '#ffffff')
  name.addColorStop(1, tint)
  c.fillStyle = name
  c.shadowColor = tint + '88'
  c.shadowBlur = 60
  c.fillText(project.name, 112, 520 + size * 0.86)
  c.shadowBlur = 0
  return canvas
}

/** La tarjeta del proyecto en un lienzo de 1600×1000, con sus fuentes ya cargadas. */
export function placeholderCard(project) {
  if (!cache.has(project.id)) {
    const fonts = [`800 200px "Unbounded Variable"`, `500 30px "JetBrains Mono Variable"`]
    cache.set(project.id, Promise.all(fonts.map(font => document.fonts.load(font, project.name).catch(() => null))).then(() => draw(project)))
  }
  return cache.get(project.id)
}

/** Pone la tarjeta en una <img> de la ficha (sin captura o con la captura rota). */
export async function fillWithPlaceholder(img, project) {
  const canvas = await placeholderCard(project)
  img.removeAttribute('loading')
  img.src = canvas.toDataURL('image/webp', 0.92)
}
