import { existsSync } from 'node:fs'
import { describe, expect, test } from 'vitest'
import { projects } from '../../src/content/projects.js'
import { LANGS, messages, t } from '../../src/content/i18n.js'

describe('projects', () => {
  test('there are exactly the eight projects, in order', () => {
    expect(projects.map(p => p.id)).toEqual(['kitsune', 'nori', 'yomi', 'vela', 'inkshadow', 'cartia', 'nitido', 'hakufu'])
    expect(projects.map(p => p.name)).toEqual(['Kitsune', 'Nori', 'Yomi', 'Vela', 'InkShadow', 'Cartia', 'Nítido', 'Hakufu'])
  })

  test('each project has a distinct neon color, a screenshot that exists (or none yet) and https links only', () => {
    expect(new Set(projects.map(p => p.color)).size).toBe(8)
    for (const project of projects) {
      expect(project.color).toMatch(/^#[0-9a-f]{6}$/)
      if (project.image !== null) {
        expect(project.image).toMatch(/^\/shots\/[a-z]+\.webp$/)
        expect(existsSync(new URL(`../../public${project.image}`, import.meta.url)), project.image).toBe(true)
      }
      for (const url of Object.values(project.links)) expect(url).toMatch(/^https:\/\/[^\s]+$/)
    }
  })

  test('Hakufu, Cartia and Nítido are made with Dani; the rest are not', () => {
    expect(projects.filter(p => p.withDani).map(p => p.id)).toEqual(['cartia', 'nitido', 'hakufu'])
  })

  test('every project text exists in Spanish and English, never empty', () => {
    for (const project of projects) {
      for (const lang of LANGS) {
        const text = project[lang]
        for (const key of ['category', 'tagline', 'description']) expect(text[key]?.trim().length, `${project.id}.${lang}.${key}`).toBeGreaterThan(8)
        expect(text.tech.length).toBeGreaterThanOrEqual(2)
        expect(text.alt.trim().length).toBeGreaterThan(8)
      }
    }
  })
})

describe('i18n', () => {
  test('Spanish and English have the same keys and none is empty', () => {
    expect(Object.keys(messages.en).sort()).toEqual(Object.keys(messages.es).sort())
    for (const lang of LANGS) for (const [key, value] of Object.entries(messages[lang])) expect(value.trim().length, `${lang}.${key}`).toBeGreaterThan(0)
  })

  test('t() falls back to Spanish and then to the key', () => {
    expect(t('es', 'contactTitle')).toBe(messages.es.contactTitle)
    expect(t('en', 'contactTitle')).toBe(messages.en.contactTitle)
    expect(t('fr', 'contactTitle')).toBe(messages.es.contactTitle)
    expect(t('en', 'no.such.key')).toBe('no.such.key')
  })

  test('the name is shown without accents, as Risco asked', () => {
    expect(messages.es.fullName).toBe('Manuel Unai Risco Vazquez')
    expect(messages.en.fullName).toBe('Manuel Unai Risco Vazquez')
  })
})

describe('initial language', () => {
  test('the saved choice wins; otherwise Spanish for es-*, English for anything else', async () => {
    const { initialLang } = await import('../../src/content/i18n.js')
    expect(initialLang('en', ['es-ES'])).toBe('en')
    expect(initialLang(null, ['es-ES', 'en'])).toBe('es')
    expect(initialLang(null, ['en-GB'])).toBe('en')
    expect(initialLang('fr', ['de-DE'])).toBe('en')
    expect(initialLang(undefined, [])).toBe('es')
  })
})
