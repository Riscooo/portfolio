import { defineConfig } from '@playwright/test'

// Pruebas en el navegador sobre la versión compilada (la misma que se publica).
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 45_000,
  fullyParallel: true,
  workers: 3,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4174',
    locale: 'es-ES',
    viewport: { width: 1440, height: 900 },
    launchOptions: { args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=vulkan'] },
  },
  webServer: {
    command: 'npm run build && npx vite preview --port 4174 --strictPort',
    url: 'http://localhost:4174',
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
