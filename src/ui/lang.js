// Cambio de idioma: solo reescribe textos (la página ya está montada), así no se pierde la posición.
import { projects } from '../content/projects.js'
import { LANGS, t } from '../content/i18n.js'

const KEY = 'risco-lang'

export function savedLang() {
  try { return localStorage.getItem(KEY) } catch { return null }
}

export function applyLang(lang) {
  const root = document.documentElement
  root.lang = lang
  document.title = t(lang, 'title')
  document.querySelector('meta[name="description"]')?.setAttribute('content', t(lang, 'metaDescription'))
  for (const node of document.querySelectorAll('[data-t]')) node.textContent = t(lang, node.dataset.t)
  for (const node of document.querySelectorAll('[data-p]')) {
    const [id, field] = node.dataset.p.split('.')
    const text = projects.find(project => project.id === id)?.[lang]?.[field]
    if (text === undefined) continue
    if (node.tagName === 'IMG') node.alt = text
    else node.textContent = text
  }
  for (const list of document.querySelectorAll('.project .tech')) {
    const project = projects.find(p => p.id === list.closest('.project').id)
    list.replaceChildren(...project[lang].tech.map(item => Object.assign(document.createElement('li'), { textContent: item })))
  }
  const other = LANGS.find(code => code !== lang)
  const button = document.querySelector('[data-lang-switch]')
  if (button) {
    button.textContent = t(lang, 'langSwitch')
    button.lang = other
    button.dataset.next = other
  }
  try { localStorage.setItem(KEY, lang) } catch { /* sin almacenamiento */ }
}
