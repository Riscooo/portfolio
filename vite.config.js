import { defineConfig } from 'vite'
import { renderIndex, renderLabels, renderPage } from './src/ui/render.js'

// La página llega ya escrita (en castellano): buscadores, lectores de pantalla y equipos sin WebGL la
// leen entera sin esperar al JavaScript, que solo la anima y cambia de idioma.
const prerender = {
  name: 'risco-prerender',
  transformIndexHtml(html) {
    return html.replace('<!--PAGE-->', renderPage('es')).replace('<!--INDEX-->', renderIndex('es')).replace('<!--LABELS-->', renderLabels())
  },
}

export default defineConfig({
  plugins: [prerender],
  // La escena (three.js + postprocesado) va en su propio trozo, cargado aparte: ronda los 560 kB.
  build: { target: 'es2022', assetsInlineLimit: 0, chunkSizeWarningLimit: 600 },
  test: { include: ['tests/unit/**/*.test.js'] }, // las de tests/e2e son de Playwright
})
