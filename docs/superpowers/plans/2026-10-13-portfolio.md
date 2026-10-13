# Portfolio de Risco — plan

> Ejecución en línea en la sesión que lo escribe (Risco aprobó seguir hasta publicar). Pasos con casillas.

**Objetivo:** el portfolio de la spec: nube GPGPU que se abre en 8 constelaciones, fichas que se forman con
partículas, ES/EN, publicado en Vercel.

**Spec:** `docs/superpowers/specs/2026-10-13-portfolio-design.md`

## Restricciones globales

- Vite + three.js `0.170.0` (versión fijada), `postprocessing`, `gsap` y `lenis`. Sin framework.
- Todo el texto en HTML real; la escena es decoración, nunca la única fuente de información.
- 60 fps de objetivo; calidad adaptable (512²/384²/256²).
- Sin datos inventados: enlaces y textos sacados de los README, que Risco revisa antes de publicar.

## Puntos de revisión

- Recargar a mitad de página: la escena arranca en el tramo de ese scroll, sin saltos → prueba de `timeline`
  (progreso → estado, idempotente) y prueba de navegador recargando con scroll.
- Ventana muy estrecha (móvil en vertical): la ficha va encima y la captura debajo, sin taparse → captura de
  Playwright a 390×844.
- Sin WebGL o con `prefers-reduced-motion`: todo se lee y se navega → pruebas de navegador con WebGL apagado y
  con movimiento reducido.
- Imagen de proyecto que no carga: la constelación se queda como nube, sin error → prueba de `targets` con una
  imagen ausente.
- Cambiar de idioma a mitad del recorrido: no se pierde la posición → prueba de navegador.

---

### Task 1: Arranque del proyecto
- [ ] `package.json` (Vite, three, postprocessing, gsap, lenis, Vitest, Playwright), estructura `src/`, `index.html`
  y `vercel.json`. `npm run build` vacío y en verde. Commit.

### Task 2: Contenido e idiomas
- Produce: `projects` (8, con `id`, `color`, `image`, `links`, `withDani`, `es`/`en`) y `t(lang, key)`.
- [ ] Tests (8 proyectos, claves completas en ambas lenguas, enlaces https), implementación y commit.

### Task 3: Línea de tiempo del scroll
- Produce: `sections` y `stateAt(progress)` → `{ phase, project, open, form, camera }`, puros.
- [ ] Tests (límites de cada tramo, continuidad, idempotencia), implementación y commit.

### Task 4: Objetivos de las partículas
- Produce: `sphereTargets(size)`, `constellationTargets(size, centers)` e `imageTargets(size, imageData, frame)`
  → `Float32Array` RGBA.
- [ ] Tests (cantidades, radios, colores de imagen, imagen ausente), implementación y commit.

### Task 5: Escena — partículas GPGPU, postprocesado y fondo
- [ ] `particles.js` + shaders (simulación de velocidad y posición, puntos), `post.js`, `background.js` y
  `quality.js`. Prueba de navegador: dibuja sin errores y mantiene los fps. Commit.

### Task 6: Interfaz y recorrido
- [ ] Secciones HTML/CSS (entrada, fichas, sobre mí, contacto), índice, ES/EN, copiar correo, `scroll.js`
  (Lenis + ScrollTrigger) y puntero. Commit.

### Task 7: Capturas y textos
- [ ] Capturas en oscuro de las 8 apps (WebP 1600×1000) y textos ES/EN de cada ficha. Commit.

### Task 8: Respaldo, accesibilidad y pruebas de navegador
- [ ] Sin WebGL, movimiento reducido, pausa en segundo plano, metadatos y Open Graph. Playwright con todos los
  puntos de revisión y capturas por tramo. Lighthouse. Commit.

### Task 9: Publicación
- [ ] Repo público `Riscooo/portfolio`, proyecto de Vercel `risco-portfolio` conectado y comprobación de la URL.
