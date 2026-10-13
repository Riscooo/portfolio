import { defineConfig } from '@playwright/test'

// Pruebas en el navegador sobre la versión compilada (la misma que se publica). Con BASE_URL, contra esa web
// (p. ej. BASE_URL=https://risco-portfolio.vercel.app npm run e2e) y sin servidor local.
const remote = process.env.BASE_URL

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 45_000,
  fullyParallel: true,
  workers: 3,
  reporter: [['list']],
  use: {
    baseURL: remote ?? 'http://localhost:4174',
    locale: 'es-ES',
    viewport: { width: 1440, height: 900 },
    launchOptions: { args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=vulkan'] },
  },
  webServer: remote ? undefined : {
    command: 'npm run build && npx vite preview --port 4174 --strictPort',
    url: 'http://localhost:4174',
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
