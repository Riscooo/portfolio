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
  build: { target: 'es2022', assetsInlineLimit: 0 },
})
