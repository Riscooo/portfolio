// Textos de la interfaz en castellano e inglés. Los de cada proyecto están en projects.js.
export const LANGS = ['es', 'en']

export const messages = {
  es: {
    title: 'Risco — proyectos',
    metaDescription: 'Los proyectos de Risco (Manuel Unai Risco Vazquez): un navegador propio, un escritorio para Linux, apps de escritorio y apps con IA.',
    fullName: 'Manuel Unai Risco Vazquez',
    tagline: 'Hago software de principio a fin: desde mi propio navegador y mi escritorio hasta apps con IA.',
    scrollHint: 'Baja para abrirlo',
    openingTitle: 'Ocho proyectos',
    openingBody: 'Cada constelación es uno. Sigue bajando y se convierten en lo que son.',
    indexLabel: 'Proyectos',
    withDani: 'Hecho con Dani',
    web: 'Ver la web',
    github: 'Código en GitHub',
    noLinks: 'App de escritorio para Linux',
    aboutTitle: 'Sobre mí',
    aboutBody: 'Soy Risco. Me gusta construir las herramientas que uso todos los días y que se vean tan bien como funcionan: compilo mi propio navegador, me hago el escritorio a medida y monto apps con IA con mi equipo.',
    aboutStack: 'Con qué trabajo',
    contactTitle: 'Hablemos',
    contactBody: 'Para un proyecto, una idea o solo para saludar.',
    copy: 'Copiar',
    copied: 'Copiado',
    langSwitch: 'English',
    skip: 'Saltar al contenido',
    footer: 'Hecho a mano con three.js. Las partículas se mueven en tu tarjeta gráfica.',
  },
  en: {
    title: 'Risco — projects',
    metaDescription: 'Projects by Risco (Manuel Unai Risco Vazquez): his own web browser, a Linux desktop, desktop apps and AI apps.',
    fullName: 'Manuel Unai Risco Vazquez',
    tagline: 'I build software end to end: from my own browser and desktop to AI apps.',
    scrollHint: 'Scroll to open it',
    openingTitle: 'Eight projects',
    openingBody: 'Each constellation is one of them. Keep scrolling and they turn into what they are.',
    indexLabel: 'Projects',
    withDani: 'Made with Dani',
    web: 'Visit the website',
    github: 'Code on GitHub',
    noLinks: 'Linux desktop app',
    aboutTitle: 'About me',
    aboutBody: 'I’m Risco. I like building the tools I use every day and making them look as good as they work: I compile my own browser, I make my own desktop and I build AI apps with my team.',
    aboutStack: 'What I work with',
    contactTitle: 'Let’s talk',
    contactBody: 'About a project, an idea or just to say hi.',
    copy: 'Copy',
    copied: 'Copied',
    langSwitch: 'Español',
    skip: 'Skip to content',
    footer: 'Handmade with three.js. The particles move on your graphics card.',
  },
}

/** Texto de interfaz: el del idioma pedido, si no el castellano y, si tampoco, la propia clave. */
export function t(lang, key) {
  return messages[lang]?.[key] ?? messages.es[key] ?? key
}

/** El idioma inicial: el guardado, si no el del navegador (inglés si no empieza por «es»). */
export function initialLang(saved, navigatorLanguages = []) {
  if (LANGS.includes(saved)) return saved
  const first = navigatorLanguages.find(Boolean) ?? 'es'
  return first.toLowerCase().startsWith('es') ? 'es' : 'en'
}
