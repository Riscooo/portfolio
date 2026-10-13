import { expect, test } from '@playwright/test'

const IDS = ['kitsune', 'nori', 'yomi', 'vela', 'inkshadow', 'cartia', 'nitido', 'hakufu']

/** Errores de la página y de la consola durante la prueba. */
function collectErrors(page) {
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  return errors
}

/** Lleva el scroll a una fracción del tramo fijado de una sección (como el índice). */
async function scrollToSection(page, id, at = 0.55) {
  await page.evaluate(([id, at]) => {
    const section = document.getElementById(id)
    window.scrollTo(0, section.offsetTop + Math.max(0, section.offsetHeight - innerHeight) * at)
  }, [id, at])
}

const cssNumber = (page, selector, property) =>
  page.locator(selector).evaluate((node, property) => Number(getComputedStyle(node).getPropertyValue(property) || 0), property)

test('la página llega escrita y arranca la escena sin errores', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('/')
  await expect(page.locator('h1.brand')).toHaveAttribute('aria-label', 'Risco')
  await expect(page.locator('#story > section.project')).toHaveCount(8)
  await expect(page.locator('html')).toHaveAttribute('data-quality', /^\d+$/)
  await expect(page.locator('html')).not.toHaveClass(/no-webgl/)
  await page.waitForTimeout(2000)
  expect(errors).toEqual([])
})

test('va fluida: al menos 30 fotogramas por segundo', async ({ page }) => {
  await page.goto('/')
  await scrollToSection(page, 'kitsune')
  await page.waitForTimeout(2500)
  const fps = await page.evaluate(() => new Promise(resolve => {
    let frames = 0
    const start = performance.now()
    const tick = now => { frames++; if (now - start < 2000) requestAnimationFrame(tick); else resolve(frames / ((now - start) / 1000)) }
    requestAnimationFrame(tick)
  }))
  console.log(`fps: ${fps.toFixed(1)}`)
  expect(fps).toBeGreaterThan(30)
})

test('sin WebGL se ve todo: fichas, capturas y la tarjeta de InkShadow', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
      return /webgl/.test(type) ? null : original.call(this, type, ...rest)
    }
  })
  const errors = collectErrors(page)
  await page.goto('/')
  await expect(page.locator('html')).toHaveClass(/no-webgl/)
  for (const id of IDS) {
    await page.locator(`#${id} .card`).scrollIntoViewIfNeeded()
    await expect(page.locator(`#${id} .card`)).toHaveCSS('opacity', '1')
    await expect(page.locator(`#${id} .frame img`)).toHaveCSS('opacity', '1')
    await expect.poll(() => page.locator(`#${id} .frame img`).evaluate(img => img.complete && img.naturalWidth)).toBeGreaterThan(0)
  }
  await expect(page.locator('#inkshadow .frame img')).toHaveAttribute('src', /^data:image\//)
  expect(errors.filter(e => !/WebGL/i.test(e))).toEqual([])
})

test('con movimiento reducido no hay scroll suave y la ficha aparece igual', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.waitForTimeout(500)
  await expect(page.locator('html')).not.toHaveClass(/lenis/)
  await scrollToSection(page, 'vela')
  await expect.poll(() => cssNumber(page, '#vela', '--formed'), { timeout: 8000 }).toBeGreaterThan(0.95)
})

test('al recargar a mitad de página sigue en el mismo proyecto', async ({ page }) => {
  await page.goto('/')
  await scrollToSection(page, 'nori')
  await expect.poll(() => cssNumber(page, '#nori', '--formed'), { timeout: 8000 }).toBeGreaterThan(0.95)
  const before = await page.evaluate(() => scrollY)
  await page.reload()
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before - 5)
  await expect.poll(() => cssNumber(page, '#nori', '--formed'), { timeout: 8000 }).toBeGreaterThan(0.95)
  await expect(page.locator('.index a[aria-current="true"]')).toHaveAttribute('href', '#nori')
})

test('un enlace directo lleva al proyecto con la captura formada', async ({ page }) => {
  await page.goto('/#cartia')
  await expect.poll(() => cssNumber(page, '#cartia', '--formed'), { timeout: 8000 }).toBeGreaterThan(0.95)
  await expect(page.locator('#cartia .card')).toBeInViewport()
})

test('el índice lleva a cada proyecto', async ({ page }) => {
  await page.goto('/')
  await scrollToSection(page, 'kitsune')
  await expect(page.locator('.index')).toHaveClass(/visible/)
  await page.locator('.index a[href="#inkshadow"]').click()
  await expect.poll(() => cssNumber(page, '#inkshadow', '--formed'), { timeout: 8000 }).toBeGreaterThan(0.95)
  await expect(page).toHaveURL(/#inkshadow$/)
})

test('las flechas van de un tramo al siguiente', async ({ page }) => {
  await page.goto('/')
  await page.waitForTimeout(800)
  for (let i = 0; i < 2; i++) { await page.keyboard.press('ArrowDown'); await page.waitForTimeout(1900) }
  await expect.poll(() => cssNumber(page, '#kitsune', '--formed'), { timeout: 8000 }).toBeGreaterThan(0.95)
  await page.keyboard.press('ArrowDown')
  await expect.poll(() => cssNumber(page, '#nori', '--formed'), { timeout: 8000 }).toBeGreaterThan(0.95)
  await page.keyboard.press('ArrowUp')
  await expect.poll(() => cssNumber(page, '#kitsune', '--formed'), { timeout: 8000 }).toBeGreaterThan(0.95)
})

test('cambiar de idioma reescribe los textos sin mover la página y se recuerda', async ({ page }) => {
  await page.goto('/')
  await scrollToSection(page, 'yomi')
  await page.waitForTimeout(1500)
  const before = await page.evaluate(() => scrollY)
  await page.locator('[data-lang-switch]').click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.locator('[data-lang-switch]')).toHaveText('Español')
  await expect(page.locator('#contact-title')).toHaveText('Let’s talk')
  await expect(page.locator('#yomi .tagline')).not.toHaveText(/[áéíóúñ]/)
  await expect(page).toHaveTitle('Risco — projects')
  expect(Math.abs(await page.evaluate(() => scrollY) - before)).toBeLessThan(3)
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await page.locator('[data-lang-switch]').click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'es')
  await expect(page.locator('#contact-title')).toHaveText('Hablemos')
})

test.describe('con el navegador en inglés', () => {
  test.use({ locale: 'en-US' })
  test('abre en inglés', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(page.locator('.lede')).toHaveText(/^I build software/)
  })
})

test('copiar un correo lo deja en el portapapeles', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/')
  await scrollToSection(page, 'contacto', 1)
  await page.waitForTimeout(1500)
  const button = page.locator('[data-copy="elminirsk@gmail.com"]')
  await button.click()
  await expect(button).toHaveText('Copiado')
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('elminirsk@gmail.com')
  await expect(button).toHaveText('Copiar', { timeout: 4000 })
})

for (const [width, height] of [[1024, 768], [390, 844], [360, 740]]) {
  test(`a ${width}×${height} nada se sale de la pantalla`, async ({ page }) => {
    await page.setViewportSize({ width, height })
    await page.goto('/')
    await page.evaluate(() => document.fonts.ready)
    for (const id of IDS) {
      await scrollToSection(page, id)
      await expect.poll(() => cssNumber(page, `#${id}`, '--formed'), { timeout: 8000 }).toBeGreaterThan(0.95)
      const overflow = await page.evaluate(id => {
        const card = document.querySelector(`#${id} .card`).getBoundingClientRect()
        const name = document.createRange(); name.selectNodeContents(document.querySelector(`#${id} .name`))
        return { page: document.documentElement.scrollWidth - innerWidth, card: card.right - innerWidth, name: name.getBoundingClientRect().right - card.right }
      }, id)
      expect(overflow.page, id).toBeLessThanOrEqual(0)
      expect(overflow.card, id).toBeLessThanOrEqual(0)
      expect(overflow.name, id).toBeLessThanOrEqual(1)
    }
  })
}
