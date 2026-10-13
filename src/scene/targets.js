// Dónde tiene que ir cada partícula, en texturas RGBA de punto flotante (una partícula por texel):
// la esfera, su sitio dentro de la constelación de su proyecto y su píxel en la captura del proyecto.
// Las partículas se reparten en 8 franjas iguales, una por proyecto, en el orden de projects.js.

export const PROJECTS = 8
const ASPECT = 16 / 10

/** Generador pseudoaleatorio con semilla (mulberry32): la misma semilla, la misma nube. */
export function random(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function layout(size) {
  const count = size * size
  const perProject = Math.floor(count / PROJECTS)
  const rows = Math.max(1, Math.floor(Math.sqrt(perProject / ASPECT)))
  const cols = Math.max(1, Math.floor(perProject / rows))
  return { count, perProject, cols, rows }
}

export const projectOf = (index, count) => Math.min(PROJECTS - 1, Math.floor(index * PROJECTS / count))

/** Un punto al azar dentro de la bola unidad, más denso hacia fuera (la nube tiene «piel»). */
function inBall(rand, skin) {
  const u = rand() * Math.PI * 2, v = Math.acos(2 * rand() - 1)
  const r = Math.pow(rand(), skin)
  return [r * Math.sin(v) * Math.cos(u), r * Math.cos(v), r * Math.sin(v) * Math.sin(u)]
}

/** La nube cerrada: una bola de radio `radius`; w = semilla de cada partícula. */
export function sphereTargets(size, rand, radius) {
  const data = new Float32Array(size * size * 4)
  for (let i = 0; i < size * size; i++) {
    const [x, y, z] = inBall(rand, 0.35)
    data.set([x * radius, y * radius, z * radius, rand()], i * 4)
  }
  return data
}

/** Desplazamiento de cada partícula dentro de su constelación (radio `radius`); w = su proyecto. */
export function clusterTargets(size, rand, radius) {
  const count = size * size
  const data = new Float32Array(count * 4)
  for (let i = 0; i < count; i++) {
    // Núcleo denso con un halo más suelto: unas pocas partículas forman la corona.
    const [x, y, z] = inBall(rand, rand() < 0.8 ? 0.85 : 0.2)
    const scale = radius * (rand() < 0.8 ? 0.62 : 1)
    data.set([x * scale, y * scale, z * scale, projectOf(i, count)], i * 4)
  }
  return data
}

/**
 * Captura de cada proyecto → (u, v) de cada partícula en el plano de la imagen (de -0,5 a 0,5, con v hacia
 * arriba; w = 1 si forma parte de la imagen) y su color. Sin captura, w = 0: esas partículas no forman nada.
 * `images[p]` es { width, height, data } (RGBA de 8 bits) o null.
 */
export function imageTargets(size, images, rand) {
  const { count, perProject, cols, rows } = layout(size)
  const uv = new Float32Array(count * 4)
  const color = new Float32Array(count * 4)
  for (let i = 0; i < count; i++) {
    const project = projectOf(i, count)
    const local = i - project * perProject
    const image = images[project]
    // Las que sobran de la rejilla caen en un píxel al azar: refuerzan la imagen en vez de perderse.
    const cell = local < cols * rows ? local : Math.floor(rand() * cols * rows)
    const col = cell % cols, row = Math.floor(cell / cols)
    const u = (col + 0.5) / cols - 0.5, v = 0.5 - (row + 0.5) / rows
    uv.set([u, v, (rand() - 0.5) * 0.02, image ? 1 : 0], i * 4)
    if (image) {
      const px = Math.min(image.width - 1, Math.floor((u + 0.5) * image.width))
      const py = Math.min(image.height - 1, Math.floor((0.5 - v) * image.height))
      const o = (py * image.width + px) * 4
      color.set([image.data[o] / 255, image.data[o + 1] / 255, image.data[o + 2] / 255, 1], i * 4)
    } else {
      color.set([1, 1, 1, 1], i * 4)
    }
  }
  return { uv, color }
}
