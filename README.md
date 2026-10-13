# Risco — portfolio

Mis proyectos, en una sola página: una nube de partículas que se abre en ocho constelaciones y, al bajar, cada
una forma la captura de su proyecto antes de fundirse con la imagen real.

**En vivo:** https://risco-portfolio.vercel.app

## Cómo está hecho

- **Vite** sin framework. La página se escribe al compilar (`src/ui/render.js`), así que llega entera aunque no
  haya JavaScript ni WebGL, y el cambio de idioma (castellano / inglés) solo reescribe textos.
- **three.js** con una simulación GPGPU (`GPUComputationRenderer`): la posición y la velocidad de cada partícula
  viven en texturas y se calculan en la tarjeta gráfica (`src/shaders/`). Muelles amortiguados, un campo de ruido
  sin divergencia para el humo, remolino al formar la captura y la onda del puntero.
- **postprocessing** para el bloom, la viñeta, el tono ACES, una pizca de aberración cromática y el grano.
- **Lenis** para el scroll suave; con movimiento reducido no se usa y la escena no hace remolinos.
- El número de partículas se elige según el equipo, y la resolución de dibujo baja sola si no llega a 60 fps.
- La escena se descarga aparte: la página abre con 32 kB de JavaScript.

## Desarrollo

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # Vitest: línea de tiempo del scroll, objetivos de las partículas, calidad y contenido
npm run e2e        # Playwright: sin WebGL, movimiento reducido, recarga, idioma, teclado, móvil…
npm run build      # dist/
```

Los textos de cada proyecto están en `src/content/projects.js`; los de la interfaz, en `src/content/i18n.js`. Las
capturas van en `public/shots/` a 1600×1000 y 800×500 (`<id>.webp` y `<id>-800.webp`). Un proyecto sin captura
(`image: null`) muestra una tarjeta con su nombre.
