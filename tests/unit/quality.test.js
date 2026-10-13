import { describe, expect, test } from 'vitest'
import { FpsGovernor, chooseQuality } from '../../src/scene/quality.js'

const desktop = { coarsePointer: false, width: 1920, height: 1080, deviceMemory: 16, devicePixelRatio: 1, gpu: 'NVIDIA GeForce RTX 4070', reducedMotion: false }

describe('chooseQuality', () => {
  test('a desktop with a dedicated GPU gets the full 512² cloud', () => {
    expect(chooseQuality(desktop)).toMatchObject({ size: 512, maxPixelRatio: 1.5 })
    expect(chooseQuality({ ...desktop, devicePixelRatio: 2 }).maxPixelRatio).toBe(2)
    expect(chooseQuality({ ...desktop, gpu: 'Apple M2' }).size).toBe(512)
    expect(chooseQuality({ ...desktop, gpu: 'AMD Radeon RX 7800 XT' }).size).toBe(512)
  })

  test('integrated graphics or an unknown GPU get 384²', () => {
    expect(chooseQuality({ ...desktop, gpu: 'Intel(R) UHD Graphics 620' }).size).toBe(384)
    expect(chooseQuality({ ...desktop, gpu: '' })).toMatchObject({ size: 384, maxPixelRatio: 1 })
  })

  test('phones and touch screens get 256² and a lower pixel ratio', () => {
    const phone = { coarsePointer: true, width: 390, height: 844, deviceMemory: 4, devicePixelRatio: 3, gpu: 'Apple GPU', reducedMotion: false }
    expect(chooseQuality(phone)).toMatchObject({ size: 256, maxPixelRatio: 1.5 })
  })

  test('software rendering or very little memory get the smallest cloud', () => {
    expect(chooseQuality({ ...desktop, gpu: 'llvmpipe (LLVM 17.0.6, 256 bits)' }).size).toBe(256)
    expect(chooseQuality({ ...desktop, gpu: 'Google SwiftShader' }).size).toBe(256)
    expect(chooseQuality({ ...desktop, deviceMemory: 2, gpu: 'NVIDIA GeForce RTX 4070' }).size).toBe(256)
  })
})

describe('FpsGovernor', () => {
  test('lowers the pixel ratio when frames are slow and raises it again when they recover', () => {
    const governor = new FpsGovernor({ max: 2, min: 1 })
    expect(governor.ratio).toBe(2)
    for (let i = 0; i < 120; i++) governor.sample(1 / 30)
    expect(governor.ratio).toBeLessThan(2)
    const low = governor.ratio
    for (let i = 0; i < 400; i++) governor.sample(1 / 120)
    expect(governor.ratio).toBeGreaterThan(low)
    expect(governor.ratio).toBeLessThanOrEqual(2)
  })

  test('never goes below the minimum', () => {
    const governor = new FpsGovernor({ max: 1.5, min: 1 })
    for (let i = 0; i < 2000; i++) governor.sample(1 / 10)
    expect(governor.ratio).toBe(1)
  })
})
