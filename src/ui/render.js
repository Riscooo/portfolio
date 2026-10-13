// El HTML de la página a partir del contenido. Lo usa Vite al compilar (la página llega ya escrita, en
// castellano) y el cambio de idioma reescribe solo los textos (data-t y data-p).
import { projects } from '../content/projects.js'
import { t } from '../content/i18n.js'

const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const pad = index => String(index + 1).padStart(2, '0')
const EMAILS = ['elminirsk@gmail.com', 'manuelunai03@gmail.com']
const STACK = ['three.js', 'WebGL / GLSL', 'JavaScript', 'React · Next.js', 'Python', 'Rust', 'C# · .NET', 'QML', 'Gecko', 'Electron', 'Supabase', 'Linux']

function links(project, lang) {
  const items = []
  if (project.links.web) items.push(`<a class="button primary" href="${escape(project.links.web)}" target="_blank" rel="noopener"><span data-t="web">${escape(t(lang, 'web'))}</span><svg aria-hidden="true" viewBox="0 0 16 16"><path d="M5 11 11 5M6 5h5v5"/></svg></a>`)
  if (project.links.github) items.push(`<a class="button" href="${escape(project.links.github)}" target="_blank" rel="noopener"><span data-t="github">${escape(t(lang, 'github'))}</span></a>`)
  if (!items.length) items.push(`<span class="badge" data-t="noLinks">${escape(t(lang, 'noLinks'))}</span>`)
  return items.join('')
}

export function renderProject(project, index, lang = 'es') {
  const text = project[lang]
  const p = field => `data-p="${project.id}.${field}"`
  return `
  <section class="project" id="${project.id}" data-index="${index}" style="--tint:${project.color}; --chars:${[...project.name].length}" aria-labelledby="${project.id}-name">
    <div class="pin">
      <article class="card">
        <p class="kicker"><span class="num">${pad(index)}</span><span class="rule"></span><span ${p('category')}>${escape(text.category)}</span></p>
        <h2 class="name" id="${project.id}-name">${escape(project.name)}</h2>
        <p class="tagline" ${p('tagline')}>${escape(text.tagline)}</p>
        <p class="desc" ${p('description')}>${escape(text.description)}</p>
        <ul class="tech" aria-label="Tecnologías">${text.tech.map(item => `<li>${escape(item)}</li>`).join('')}</ul>
        <div class="links">${links(project, lang)}</div>
        ${project.withDani ? `<p class="dani"><span class="dot"></span><span data-t="withDani">${escape(t(lang, 'withDani'))}</span> · <a href="https://github.com/dap0ry" target="_blank" rel="noopener">dap0ry</a></p>` : ''}
      </article>
      <figure class="shot">
        <div class="frame">${project.image
          ? `<img src="${escape(project.image)}" alt="${escape(text.alt)}" ${p('alt')} loading="lazy" decoding="async" width="1600" height="1000">`
          : `<img alt="" data-placeholder width="1600" height="1000">`}</div>
      </figure>
    </div>
  </section>`
}

export function renderPage(lang = 'es') {
  const tt = key => escape(t(lang, key))
  return `
  <section class="intro" id="inicio" aria-labelledby="brand">
    <div class="pin">
      <p class="eyebrow"><span class="pulse"></span>Portfolio · 2026</p>
      <h1 class="brand" id="brand" aria-label="Risco">${'RISCO'.split('').map((c, i) => `<span style="--i:${i}">${c}</span>`).join('')}</h1>
      <div class="intro-copy">
        <p class="fullname" data-t="fullName">${tt('fullName')}</p>
        <p class="lede" data-t="tagline">${tt('tagline')}</p>
      </div>
      <p class="hint"><span class="wheel" aria-hidden="true"></span><span data-t="scrollHint">${tt('scrollHint')}</span></p>
    </div>
  </section>
  <section class="opening" id="proyectos" aria-labelledby="opening-title">
    <div class="pin">
      <h2 class="section-title" id="opening-title" data-t="openingTitle">${tt('openingTitle')}</h2>
      <p class="section-body" data-t="openingBody">${tt('openingBody')}</p>
    </div>
  </section>
  ${projects.map((project, index) => renderProject(project, index, lang)).join('')}
  <section class="about" id="sobre-mi" aria-labelledby="about-title">
    <div class="pin">
      <div class="panel">
        <h2 class="section-title" id="about-title" data-t="aboutTitle">${tt('aboutTitle')}</h2>
        <p class="section-body" data-t="aboutBody">${tt('aboutBody')}</p>
        <p class="label" data-t="aboutStack">${tt('aboutStack')}</p>
        <ul class="stack">${STACK.map(item => `<li>${escape(item)}</li>`).join('')}</ul>
      </div>
    </div>
  </section>
  <section class="contact" id="contacto" aria-labelledby="contact-title">
    <div class="pin">
      <h2 class="section-title big" id="contact-title" data-t="contactTitle">${tt('contactTitle')}</h2>
      <p class="section-body" data-t="contactBody">${tt('contactBody')}</p>
      <div class="panel contact-panel">
      <ul class="emails">${EMAILS.map(email => `<li><a href="mailto:${email}">${email}</a><button type="button" class="copy" data-copy="${email}"><span data-t="copy">${tt('copy')}</span></button></li>`).join('')}</ul>
      <a class="button github" href="https://github.com/Riscooo" target="_blank" rel="noopener"><svg aria-hidden="true" viewBox="0 0 16 16"><path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38v-1.33c-2.23.48-2.7-1.07-2.7-1.07-.36-.92-.89-1.17-.89-1.17-.73-.5.06-.49.06-.49.8.06 1.23.83 1.23.83.72 1.22 1.87.87 2.33.66.07-.52.28-.87.5-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.2c0 .21.15.46.55.38A8 8 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/></svg>github.com/Riscooo</a>
      </div>
      <p class="footer" data-t="footer">${tt('footer')}</p>
    </div>
  </section>`
}

/** El índice lateral 01–08. */
export function renderIndex(lang = 'es') {
  return `<p class="index-label" data-t="indexLabel">${escape(t(lang, 'indexLabel'))}</p><ol>${projects.map((project, index) => `
    <li><a href="#${project.id}" data-index="${index}" style="--tint:${project.color}"><span class="num">${pad(index)}</span><span class="label">${escape(project.name)}</span></a></li>`).join('')}</ol>`
}

/** Los nombres que flotan junto a cada constelación. */
export function renderLabels() {
  return projects.map((project, index) => `<span class="constellation-label" data-index="${index}" style="--tint:${project.color}">${escape(project.name)}</span>`).join('')
}
