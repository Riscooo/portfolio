# Portfolio de Risco — diseño

Fecha: 2026-10-13 · Estado: aprobado por Risco en conversación («dale, público está bien»), con permiso para seguir hasta publicar.

## Objetivo

Un escaparate de los proyectos de Risco, oscuro y tech, «ultra currado»: una sola página fija donde el scroll mueve
una escena 3D. En ella, una nube de partículas se abre en 8 constelaciones, una por proyecto, y cada constelación se
convierte en la captura de su app. La nube tiene que estar renderizada «una barbaridad de bien».

## Decisiones de Risco

- Para qué: un escaparate de sus proyectos.
- Estilo: oscuro y tech (no la estética Tinta de sus apps).
- Escena: **nube de partículas** (elegida entre cristal, partículas y monolito, con prototipos en vivo).
- Ficha: **A** — las partículas forman la captura píxel a píxel, la imagen real se funde encima y el texto entra por
  la izquierda.
- Secciones: entrada con su nombre, los 8 proyectos, sobre mí y contacto.
- Nombre: «Risco» en grande y «Manuel Unai Risco Vazquez» debajo (sin tildes).
- Contacto: GitHub (Riscooo), elminirsk@gmail.com y manuelunai03@gmail.com.
- Hakufu, Cartia y Nítido llevan «Hecho con Dani (dap0ry)».
- Castellano e inglés, con un botón ES/EN.
- Publicado gratis en Vercel (cuenta riscooo1) con repo público `Riscooo/portfolio`.

## 1. Recorrido

La página es un único lienzo WebGL fijo a pantalla completa, con el contenido HTML encima. El scroll (Lenis, suave)
da un progreso de 0 a 1 que GSAP ScrollTrigger reparte en tramos:

| Tramo | Escena | HTML |
|---|---|---|
| Entrada | La nube, cerrada en esfera, respira (ruido curl) y se aparta del puntero | «RISCO», el nombre completo, una frase y una invitación a bajar |
| Apertura | La esfera se separa en 8 constelaciones con su color, en una órbita suave | El nombre de cada constelación junto a ella |
| Proyecto ×8 | La cámara viaja a la constelación. Sus partículas forman la captura (con un remolino) y la imagen real se funde encima. Al salir, vuelven a ser constelación | Ficha a la izquierda: número y categoría, nombre, frase, descripción, tecnologías, botones y «Hecho con Dani» si toca |
| Sobre mí | La nube se queda a la deriva, al fondo | Quién es y con qué trabaja |
| Contacto | Las constelaciones vuelven a cerrarse en la esfera | Correos (se copian al pulsar) y GitHub |

Siempre visibles: un índice 01–08 a un lado (pulsar salta a ese proyecto) y el botón ES/EN arriba a la derecha. Las
teclas ↑/↓ y Re Pág/Av Pág saltan de tramo en tramo.

## 2. Render

- **Partículas en la GPU (GPGPU).** Posición y velocidad viven en texturas de punto flotante y se actualizan con
  shaders (`GPUComputationRenderer`). Cada partícula persigue un objetivo con un muelle amortiguado y la empuja un campo
  de ruido curl. Hay tres juegos de objetivos en texturas: esfera, constelaciones y la captura de cada proyecto (la
  imagen muestreada a la resolución de la textura: posición y color por píxel). Según el tramo se mezcla de uno a otro.
- **Cantidad adaptable.** 512×512 (262.144) en equipos potentes, 384×384 en normales y 256×256 en móviles. La
  resolución de dibujo baja sola si no se llega a ~55 fps.
- **Aspecto.** Puntos con brillo suave y tamaño según la profundidad, color HDR y mezcla aditiva. Postprocesado con la
  librería `postprocessing`: bloom selectivo, aberración cromática sutil, grano de película y viñeta, con tone mapping
  ACES. El fondo es un shader de nebulosa muy tenue, para dar profundidad sin distraer.
- **Interacción.** El puntero (o el dedo) aparta las partículas como una onda, y la cámara tiene un pequeño paralaje.
- **Cuidado.** La escena se pausa con la pestaña oculta. Con `prefers-reduced-motion` no hay remolinos ni movimiento
  de cámara: solo fundidos. Sin WebGL, la página se ve igual, con las capturas como imágenes.

## 3. Contenido

`src/content/projects.js`: una lista con `id`, `color`, `image`, `links` (`web`, `github`), `withDani` y los textos
en `es`/`en` (`category`, `name`, `tagline`, `description`, `tech`). Los textos de interfaz y de las secciones van en
`src/content/i18n.js`.

| # | Proyecto | Qué es | Enlaces |
|---|---|---|---|
| 01 | Kitsune | Navegador propio: Gecko compilado desde el código de Mozilla, en castellano, con su inicio y sus usuarios | web kitsune-navegador.vercel.app · GitHub Riscooo/kitsune |
| 02 | Nori | Tablero de proyectos y tareas con panel animado y Kanban | web kizuna-steel.vercel.app |
| 03 | Yomi | Gestor de archivos comprimidos e imágenes de disco para Linux | — |
| 04 | Vela | Cliente BitTorrent de escritorio, sobrio y local | — |
| 05 | InkShadow | Su escritorio: una shell propia sobre Niri y Quickshell | — |
| 06 | Cartia (con Dani) | Carta digital de restaurante que recomienda qué pedir con IA | web cartia-zeta.vercel.app |
| 07 | Nítido (con Dani) | Restauración de artes finales de baja resolución para imprenta | web nitido-app-ruby.vercel.app |
| 08 | Hakufu (con Dani) | Gestor y lector de manga para escritorio y móvil, 100 % offline | web hakufu.vercel.app · GitHub dap0ry/Hakufu |

- **Capturas.** Las hace Claude, en oscuro y a 1600×1000, de cada app (las web, en el navegador; las de escritorio,
  abiertas en una sesión desechable o en el escritorio de Risco con su permiso). Se guardan en WebP y, para las
  partículas, se muestrean al cargar.
- **Textos.** Los escribe Claude a partir de cada README y los traduce al inglés. Risco los revisa antes de publicar.

## 4. Código

Vite + three.js sin framework.

- `src/main.js` arranca.
- `src/scene/` contiene la escena:
  - `particles.js`: la GPGPU, los objetivos y el material de los puntos;
  - `targets.js`: esfera, constelaciones e imagen a objetivos;
  - `post.js`: el postprocesado;
  - `background.js`: la nebulosa;
  - `quality.js`: el nivel de calidad y la vigilancia de fps.
- `src/story/` lleva el scroll:
  - `timeline.js`: tramos y progreso a estado de la escena; son funciones puras y se prueban;
  - `scroll.js`: Lenis y ScrollTrigger.
- `src/ui/` es el HTML: secciones, índice, idioma y copiar al portapapeles.
- Los shaders van en `src/shaders/*.glsl`.

## 5. Pruebas

- **Unitarias (Vitest):**
  - el mapeo del progreso a tramos (`timeline`) y los objetivos (cantidades, colores, imagen a puntos);
  - el contenido: los 8 proyectos y las dos lenguas completas, sin claves vacías;
  - el idioma.
- **Navegador (Playwright, Chromium y Firefox):**
  - carga sin errores y el lienzo dibuja;
  - el recorrido completo con el scroll, el índice que salta, ES/EN, copiar el correo y la versión sin WebGL;
  - capturas de cada tramo para revisar;
  - fps medidos con el nivel de calidad elegido.
- Lighthouse para rendimiento, accesibilidad y SEO del HTML.

## 6. Publicación

Repo público `Riscooo/portfolio` y proyecto de Vercel `risco-portfolio` conectado a GitHub, con la rama main en
producción (`risco-portfolio.vercel.app`). Lleva imagen para compartir (Open Graph) y favicon.

## Fuera de alcance

Dominio propio, blog, CMS, analítica y formulario de contacto.
