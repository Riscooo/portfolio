import { describe, expect, test } from 'vitest'
import { SECTIONS, angleFor, sectionAt, stateAt, storyState } from '../../src/story/timeline.js'

const near = (a, b, eps = 1e-6) => Math.abs(a - b) < eps

describe('sections', () => {
  test('intro, opening, the eight projects, about and contact, in order', () => {
    expect(SECTIONS.map(s => s.kind)).toEqual(['intro', 'opening', ...Array(8).fill('project'), 'about', 'contact'])
    expect(SECTIONS.filter(s => s.kind === 'project').map(s => s.index)).toEqual([0, 1, 2, 3, 4, 5, 6, 7])
  })

  test('the position inside each section goes from 0 to 1 while it is pinned', () => {
    const bounds = [{ top: 0, height: 1400 }, { top: 1400, height: 1600 }]
    expect(sectionAt(0, 1000, bounds)).toEqual({ index: 0, t: 0 })
    expect(sectionAt(200, 1000, bounds)).toEqual({ index: 0, t: 0.5 })
    expect(sectionAt(1399, 1000, bounds).index).toBe(0)
    expect(sectionAt(1400, 1000, bounds)).toEqual({ index: 1, t: 0 })
    expect(sectionAt(99999, 1000, bounds)).toEqual({ index: 1, t: 1 })
    expect(sectionAt(-50, 1000, bounds)).toEqual({ index: 0, t: 0 })
  })

  test('a section no taller than the window does not divide by zero', () => {
    expect(sectionAt(0, 1000, [{ top: 0, height: 1000 }])).toEqual({ index: 0, t: 0 })
  })
})

describe('scene state', () => {
  test('the intro is the closed cloud; the opening opens it', () => {
    expect(stateAt(0, 0)).toMatchObject({ open: 0, active: -1, form: 0 })
    expect(stateAt(1, 0).open).toBe(0)
    expect(stateAt(1, 1).open).toBe(1)
  })

  test('in a project, its constellation comes to the front and forms the screenshot, then lets it go', () => {
    const at = t => stateAt(2 + 3, t)
    expect(at(0).form).toBe(0)
    expect(at(0.55)).toMatchObject({ open: 1, active: 3, form: 1 })
    expect(near(at(0.55).ring, angleFor(3))).toBe(true)
    expect(at(1).form).toBe(0)
  })

  test('contact closes the cloud again', () => {
    expect(stateAt(11, 1)).toMatchObject({ open: 0, active: -1, form: 0 })
  })

  test('the scene is continuous from one section to the next', () => {
    for (let i = 0; i < SECTIONS.length - 1; i++) {
      const end = stateAt(i, 1), start = stateAt(i + 1, 0)
      for (const key of ['open', 'form', 'ring', 'drift']) expect(near(end[key], start[key], 1e-9), `${SECTIONS[i].kind}→${SECTIONS[i + 1].kind}: ${key}`).toBe(true)
    }
  })

  test('the same scroll gives the same state (a reload mid-page starts in place)', () => {
    const bounds = SECTIONS.map((_, i) => ({ top: i * 2000, height: 2000 }))
    expect(storyState(12345, 900, bounds)).toEqual(storyState(12345, 900, bounds))
    expect(storyState(12345, 900, bounds).section).toBe(6)
  })
})
