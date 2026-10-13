import { describe, expect, test } from 'vitest'
import { clusterTargets, imageTargets, layout, projectOf, random, sphereTargets } from '../../src/scene/targets.js'

const SIZE = 64 // 4096 partículas: 512 por proyecto

describe('layout', () => {
  test('the particles split into eight equal bands, one per project', () => {
    const plan = layout(SIZE)
    expect(plan.count).toBe(4096)
    expect(plan.perProject).toBe(512)
    expect(plan.cols / plan.rows).toBeCloseTo(16 / 10, 0)
    expect(plan.cols * plan.rows).toBeLessThanOrEqual(512)
    expect([0, 511, 512, 4095].map(i => projectOf(i, plan.count))).toEqual([0, 0, 1, 7])
  })
})

describe('sphere and constellations', () => {
  test('the sphere is a full ball of radius ~R, with every particle inside', () => {
    const data = sphereTargets(SIZE, random(1), 2)
    let max = 0
    for (let i = 0; i < data.length; i += 4) max = Math.max(max, Math.hypot(data[i], data[i + 1], data[i + 2]))
    expect(max).toBeLessThanOrEqual(2.0001)
    expect(max).toBeGreaterThan(1.9)
  })

  test('each constellation offset is small and carries its project index', () => {
    const data = clusterTargets(SIZE, random(2), 0.6)
    for (let i = 0; i < data.length; i += 4) {
      expect(Math.hypot(data[i], data[i + 1], data[i + 2])).toBeLessThanOrEqual(0.6001)
      expect(data[i + 3]).toBe(projectOf(i / 4, SIZE * SIZE))
    }
  })

  test('the same seed gives the same cloud', () => {
    expect(sphereTargets(SIZE, random(7), 2)).toEqual(sphereTargets(SIZE, random(7), 2))
  })
})

describe('screenshot targets', () => {
  const solid = (r, g, b, w = 32, h = 20) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4).map((_, i) => [r, g, b, 255][i % 4]) })

  test('each project band forms a 16:10 grid on the plane with the colors of its screenshot', () => {
    const images = Array.from({ length: 8 }, (_, p) => solid(p * 30, 100, 255 - p * 30))
    const { uv, color } = imageTargets(SIZE, images, random(3))
    const plan = layout(SIZE)
    for (let p = 0; p < 8; p++) {
      const i = p * plan.perProject
      expect(uv[i * 4 + 3]).toBe(1)
      expect(Math.abs(uv[i * 4])).toBeLessThanOrEqual(0.5)
      expect(Math.abs(uv[i * 4 + 1])).toBeLessThanOrEqual(0.5)
      expect(color[i * 4]).toBeCloseTo((p * 30) / 255, 5)
      expect(color[i * 4 + 2]).toBeCloseTo((255 - p * 30) / 255, 5)
    }
    // La primera fila empieza arriba a la izquierda.
    expect(uv[0]).toBeLessThan(0)
    expect(uv[1]).toBeGreaterThan(0)
  })

  test('a project without a screenshot keeps its particles as a constellation', () => {
    const images = Array(8).fill(null)
    images[2] = solid(10, 20, 30)
    const { uv } = imageTargets(SIZE, images, random(4))
    const plan = layout(SIZE)
    expect(uv[0 * plan.perProject * 4 + 3]).toBe(0)
    expect(uv[2 * plan.perProject * 4 + 3]).toBe(1)
  })
})
