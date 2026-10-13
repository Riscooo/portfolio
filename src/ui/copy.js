// Copiar un correo al pulsar su botón, con un «Copiado» de un momento.
import { t } from '../content/i18n.js'

export function setupCopy() {
  for (const button of document.querySelectorAll('[data-copy]')) {
    button.addEventListener('click', async () => {
      const label = button.querySelector('[data-t]')
      try {
        await navigator.clipboard.writeText(button.dataset.copy)
      } catch {
        // Sin portapapeles (contexto no seguro): se selecciona el texto del enlace.
        const link = button.previousElementSibling
        const range = document.createRange(); range.selectNodeContents(link)
        getSelection().removeAllRanges(); getSelection().addRange(range)
      }
      button.classList.add('done')
      label.dataset.t = 'copied'; label.textContent = t(document.documentElement.lang, 'copied')
      clearTimeout(button.timer)
      button.timer = setTimeout(() => {
        button.classList.remove('done')
        label.dataset.t = 'copy'; label.textContent = t(document.documentElement.lang, 'copy')
      }, 1600)
    })
  }
}
