# Handoff: SkinGraph Radar — Home (rediseño bajo el hero)

## Overview

Rediseño editorial de la home de **SkinGraph Radar**, una web de inteligencia de mercado para skins de CS2. La web NO vende skins ni suscripciones — informa: precios, relaciones entre compradores, rutas de traders, oportunidades entre marketplaces y detección de movimientos sospechosos.

El hero (rifle AK-47 Voltaic con nav superior) se conserva en intención visual. El rediseño aplica a **todo lo que va debajo del hero**: una secuencia narrativa de 8 secciones que llevan al lector desde la declaración inicial hasta el CTA de abrir el dashboard.

## About the Design Files

Los archivos en `/prototype/` son **referencias de diseño en HTML/CSS/JS plano** — un prototipo de alta fidelidad que muestra el look, la tipografía, el comportamiento y las animaciones esperadas. **No son código de producción para pegar directo**.

La tarea es **recrear este diseño en el entorno existente del codebase** (React/Next, Vue, lo que ya esté en uso) siguiendo los patrones, componentes y design tokens del proyecto. Si no existe codebase aún, elegir el framework más apropiado (recomendado: Next.js + React + Tailwind o CSS Modules, dado que el diseño es estático con interacciones SVG/canvas livianas).

## Fidelity

**High-fidelity (hifi)** — colores, tipografía, espaciados, jerarquía y comportamientos son finales. Reproducir con precisión píxel a píxel, con la libertad de adaptar primitivas (botones, hairlines, tipografía) a los componentes existentes del codebase si los hay.

## Visual Direction

- Minimalista, lujosa, editorial, seria — tipo informe de inteligencia impreso, no SaaS landing.
- Paleta **blanco / negro / rojo**. Blanco es la base dominante. Negro para contraste e investigación. Rojo SOLO para señales: alerta, ruta, riesgo, spread, conexión importante.
- Mucho whitespace, hairlines, marcas de registro tipo magazine impreso, columnas guía.
- Tono de copy: serio, preciso. **Sin** frases comerciales (no "revolucionario", no "todo en uno", no "potenciá tu negocio").
- Todo el contenido en **español**.

---

## Design Tokens

### Colors

| Token | Value | Uso |
|---|---|---|
| `--paper` | `#F7F5F0` | Fondo principal (blanco cálido) |
| `--paper-2` | `#FFFFFF` | Fondo de cards y tablas |
| `--ink` | `#0B0B0C` | Texto principal, fondos investigación |
| `--ink-2` | `#1A1A1B` | Texto secundario, marketplaces (rombo) |
| `--muted` | `#6B6B6B` | Texto muted, leyendas mono |
| `--muted-2` | `#97948C` | Muted alternativo |
| `--hair` | `#E5E2DA` | Hairlines, bordes |
| `--hair-2` | `#D9D5C9` | Hairlines secundarios |
| `--red` | `#D11D1D` | Rojo señal (default) |
| `--red-dark` | `#A41414` | Hover sobre botones rojos |
| `--red-soft` | `rgba(209,29,29,0.08)` | Tints |
| `--inv-bg` | `#0B0B0C` | Fondo de sección Movimientos sospechosos |
| `--inv-fg` | `#F7F5F0` | Texto sobre fondo invertido |
| `--inv-hair` | `rgba(247,245,240,0.14)` | Hairlines sobre fondo oscuro |
| `--inv-muted` | `rgba(247,245,240,0.55)` | Muted sobre fondo oscuro |

**Variantes de rojo (tweakable)**: deep `#A41414`, signal `#D11D1D`, bright `#EE2E2E`. El proyecto ya tiene `bright` aplicado.

### Typography

3 familias, todas Google Fonts:

| Familia | Uso | Pesos |
|---|---|---|
| **Instrument Serif** | Display, títulos editoriales, números grandes | 400, 400 italic |
| **Inter Tight** | UI, párrafos, body | 300, 400, 500, 600, 700 |
| **JetBrains Mono** | Etiquetas, datos, mono, valores tabulares | 400, 500, 600 |

Escalas tipográficas (todas con `clamp()` para responsive):

| Variable | Min | Pref | Max | Uso |
|---|---|---|---|---|
| Statement (sección 01) | 72px | 11vw | 200px | "El precio es solo la superficie." |
| Section title | 40px | 5.4vw | 88px | H2 de cada sección |
| Cierre line | 48px | 7vw | 112px | Frase de cierre |
| Section dek | 15px | 1.2vw | 18px | Subtítulo bajo cada H2 |
| Stat value (`.kv__v`) | 40px | 4vw | 64px | Cifras de cabecera |
| Body | — | — | 16px | Por defecto |
| Mono small | — | — | 11px | Labels, tags, tracking 0.08em |
| Num | — | — | 13px | Mono tabular nums |

**Line heights**: `1.55` body, `1.15` para títulos serif (importante para descenders italics), `1.0` para números grandes.

**Letter spacing**: `-0.015em` títulos, `-0.025em` statement gigante, `0.08em` mono.

**Italic**: cualquier `<em>` cambia a Instrument Serif italic y, dentro del statement, además se pinta de rojo.

### Spacing

`--pad` (gutter): `clamp(20px, 4vw, 64px)`. En modo compact: `clamp(16px, 3vw, 40px)`.

`--maxw`: `1320px` (ancho máximo del contenido).

Sección padding vertical: `clamp(80px, 9vw, 140px)` (editorial), `clamp(56px, 6vw, 92px)` (compact).

### Texturas (variantes tweakables)

Aplicadas como `background-image` en secciones blancas:

- **grid** (default): 12 columnas verticales `rgba(11,11,12,0.035)` + filas de 64px `rgba(11,11,12,0.022)`.
- **dots** (aplicado actualmente): `radial-gradient(rgba(11,11,12,0.085) 1px, transparent 1.2px)` 22×22px.
- **rule**: rayas horizontales cada 32px.
- **minimal**: sin textura.

### Marcas de registro (corner crosses)

En esquinas de secciones clave (statement, signals, cierre): cruces de 14×14px, opacity .55, tinta. Como marca de impresión / referencia editorial. Ver `.reg`, `.reg--tl/tr` en CSS.

### Border radius

Casi nada. Botones: 8px (sm), 10px (lg). Cards/tiles: 0 — bordes a 90°, hairlines. Pills (`.riskstrip__tag`): 999px.

### Shadows

- Botones: ninguna por defecto.
- Tile hover: `0 12px 30px -20px rgba(11,11,12,0.25)` (sutil lift).
- Tweaks panel: `0 24px 48px -16px rgba(11,11,12,0.25)`.

---

## Layout & Screens

Una sola página, scroll vertical. Grid principal:

```
[120px rail] [1fr contenido]
gap: clamp(24px, 4vw, 64px)
```

El rail izquierdo tiene número de sección + label, con un border-top de 1px en negro. Sirve como ancla visual y numeración tipo magazine.

### 1 — HERO (preservar)
- Imagen del AK-47 Voltaic full-bleed, aspect-ratio `21/9.5`, min-height 60vh.
- Top nav absoluto: `SG` mark (32×32, rojo, radius 6px, "SG" 13px bold blanco) + "SkinGraph Radar" 15px semibold, white-space:nowrap.
- Derecha: link "Preview" + botón rojo "Dashboard".
- Background: ink (negro) por si la imagen no carga.

### 2 — MASTHEAD STRIP
Tira fina entre hero y declaración. Grid `1fr 2fr 1fr`. Izquierda: "Vol. 04 · Boletín de mercado". Centro: "SkinGraph Radar · Inteligencia de mercado · CS2". Derecha: punto rojo pulsante + "En vivo" + hora actualizada. Hairlines top/bottom.

### 3 — SECCIÓN 01 · DECLARACIÓN
Statement gigante: **"El precio / es solo la / superficie."** ("superficie" en italic rojo). Debajo, un aside con lede de 60ch y firma "— Mesa de análisis · SkinGraph Radar". Subrayados editoriales en "comprador" y "marketplace" (`<u>` con border-bottom de 1px en ink, sin text-decoration).

Cierra con una banda de 4 KPIs separados por hairlines verticales: Skins observadas (412.918), Transacciones diarias (87.4K), Marketplaces conectados (06), Latencia de actualización (38s).

### 4 — SECCIÓN 02 · SEÑALES DE MERCADO
H2 + dek. Luego grid 3×2 de 6 signal cards, cada una con:
- `S/0X` (mono muted)
- Título serif (max-width 18ch)
- Copy 14px muted
- Mini-viz arriba de hairline:
  - S/01 spread: sparkline 200×40
  - S/02 outliers: histograma de 7 barras (una roja)
  - S/03 float: barra horizontal con pin rojo
  - S/04 stickers: 4 tiles rayados (1 rojo)
  - S/05 liquidez: sparkline suave
  - S/06 venues: 3 barras horizontales CSFLOAT/BUFF163/SKINPORT

Hover: card cambia bg a paper-2; dot rojo aparece en esquina superior derecha.

Debajo, **tabla de reporte de spreads** (`.report`): hairline border, header "Reporte 04·12 · Spreads entre marketplaces" + "Actualizado hace X s" (timer). 6 filas con Skin, Wear (mono), 3 precios (mono tabular), Spread (rojo si %>10), Señal (tag pill). Hover en fila: barra roja vertical de 2px a la izquierda anima scale.

### 5 — SECCIÓN 03 · RELACIONES (protagonista)
H2 editorial en italic: **"Cuando los compradores se repiten, el mercado empieza a mostrar patrones."**

Grid `1.5fr 1fr`:
- **Izquierda** (graph viz): SVG 760×540 con grid de fondo 40×40, gradient rojo radial sutil. Edges (líneas) + Nodos posicionados a mano. Tipos:
  - Buyer: círculo negro, radio 20
  - Trader: círculo rojo, radio 22
  - Skin: círculo blanco con borde negro, radio 24
  - Marketplace: rombo (rect rotado 45°), 18×18, ink-2
  - Transaction: círculo gris muted, radio 5
  - Cada nodo con etiqueta mono blanca centrada (o ink para skins)
  - Edge "hot path": stroke rojo, dasharray 3 5, animación dashflow 1.2s linear infinite
- **Derecha** (inspector): pad 24x28, header mono, ID en mono, type en serif 42px, lista descriptiva de 5 datos con hairlines, nota editorial al pie.

Interacción: click en nodo lo selecciona; hover destaca conexiones y atenúa el resto (clase `edge--dim`).

### 6 — SECCIÓN 04 · MOVIMIENTOS SOSPECHOSOS
**Fondo negro** (`--inv-bg`). Texto invertido.

H2: **"Algunas rutas vuelven sobre sí mismas. El radar las marca para revisión."**

Grid 4 columnas (responsive a 2 y 1) con 4 risk cards:
1. R/01 Ciclo cerrado — círculo SVG con 4 nodos, anillo dasharray que rota 12s
2. R/02 Precio anómalo — gráfico con línea + outlier rojo
3. R/03 Reaparición — 4 rectángulos conectados por trazos rojos
4. R/04 Conexión indirecta — 2 nodos blancos + 2 rojos con curva dashed

Cada card: header mono rojo "R/0X" + label muted, viz cuadrada con borde inferior hairline, título serif 22px, copy muted 13.5px, footer dl con 3 datos.

Riskstrip al final: "Lenguaje del radar" + 4 pills con borde rojo: "movimientos sospechosos", "patrones anómalos", "rutas de riesgo", "señales para revisar". **Importante**: nunca usar "fraude". Siempre lenguaje de señal, no acusación.

### 7 — INTERLUDIO · OBSERVATORIO
Tira entre Movimientos sospechosos y Capas. Header con hairline negro, "Observatorio" + "12 piezas seleccionadas · ÚLT 24 h".

Grid 4 cards con piezas reales:
- AK-47 │ Voltaic (FN 0.018) — img `hero.png`, $1.842, +14.4%
- Karambit │ Emerald (FN 0.012) — img `karambit-emerald.webp`, fondo blanco + contain padding, $2.940, +12.6%
- Butterfly │ Doppler (MW 0.094) — img `butterfly-doppler.png`, $1.610, +7.2%
- Karambit │ Fire Serpent (FT 0.221) — img `karambit-fire-pov.jpg`, $612, +11.4%

Card hover: lift -2px, bg paper, imagen scale 1.04.

### 8 — SECCIÓN 05 · CAPAS DE INTELIGENCIA
H2: **"Una skin es nueve capas superpuestas."**

Grid `1fr 1fr`:
- **Izquierda** (ficha sticky, top 24px): "FICHA · INST-#8821-471" + indicador OBSERVADA live. Imagen `exploded.jpg` (vista expandida del rifle) con object-fit contain, fondo grid 32×32, crop marks de 14×14px en las 4 esquinas. Caption mono "AK-47 │ Voltaic · FN 0.018 · 4× sticker". Debajo, dl con 4 datos: Float 0,0184 · Paint seed 738 · Tradeable Sí · Última venta $1.789.
- **Derecha** (layers): 9 filas con `L/0X` (mono 60px columna) + h4 serif 24px + p muted. Hairlines entre items, top/bottom en ink (negro). Hover: h4 cambia a rojo + underline rojo anima scaleX(0→1).

Background de la sección tiene una línea vertical guía en el centro (`::before` con left:50% width:1px).

### 9 — SECCIÓN 06 · MESA DE ANÁLISIS
H2: "Seis instrumentos sobre la misma mesa."

Grid 6 columnas, cada tile span 2 (3 por fila), excepto Market Radar y Compare que span 3 (asimétrico). Cada tile:
- Header: mono muted "I/0X · Nombre" + status (mono rojo o muted)
- Title serif 28px
- Contenido específico:
  - I/01 Market Radar — chart SVG 600×200 con 2 polylines (negro continuo + rojo dashed) y 3 puntos rojos
  - I/02 Risk Cycles — lista de 4 ciclos con código, skin y delta
  - I/03 Graph Explorer — mini grafo SVG 200×120 con 5 nodos
  - I/04 Traders — tabla de 4 traders con tx count y delta
  - I/05 Watchlist — lista de 5 skins en formato compacto
  - I/06 Compare — 3 filas horizontales CSFloat/BUFF163/SKINPORT con barras animadas y precios

Tile hover: lift -2px + border ink.

### 10 — SECCIÓN 07 · CIERRE
Centrado. Big numeric watermark "07" en italic serif clamp(280px, 36vw, 560px), color `rgba(11,11,12,0.028)`, behind content.

Span "Cierre" mono rojo. H2 serif: **"Un mapa para leer precios, compradores y rutas sospechosas en el mercado de skins."** ("precios, compradores" en italic rojo). Botón rojo grande "Abrir dashboard" con flecha SVG ↗. Meta mono al pie.

### 11 — FOOTER
Tira fina: "SkinGraph Radar — observamos precios, conectamos compradores, marcamos rutas." + "© 2026" a la derecha.

---

## Interactions & Behavior

### Reloj
`#clock` actualiza cada 30s con hora en formato `HH:MM ART`.

### "Actualizado hace X s"
`#lastUpdated` incrementa cada segundo, ciclo 12→119.

### Reveal en scroll
Listener `scroll` (passive). Cada `.reveal` recibe la clase `is-in` cuando su top < vh*0.88. Las clases hijas se animan con stagger via `animation-delay`. Sin IntersectionObserver (incompatibilidad con algunos iframes — usar scroll listener directo).

### Counter rolls
Los elementos `.kv__v` con valor numérico (412.918, 87.4K, 06, 38) cuentan desde 0 con easing cubic-out, duración 1100ms, al entrar en viewport (vh*0.85).

### Network graph
Construido con SVG plain (no canvas, no librería). Datos en `app.js`:
- 14 nodos hand-tuned con `{id, type, x, y, label, meta}`
- 18 edges hand-tuned
- Set `HOT` define el ciclo rojo pulsante

Eventos:
- `click` en nodo → `selectNode(id)` → re-render inspector
- `mouseenter` → `highlightNode(id)` → atenúa edges no conectados (`edge--dim`)
- `mouseleave` → restaura highlight del seleccionado

Inspector replica los meta del nodo en el dl.

### Tweaks panel
Toggle desde toolbar (postMessage protocol). 4 controles segmentados:
- **texture**: minimal · grid · dots · rule
- **density**: editorial · compact
- **red**: deep · signal · bright (con swatches)
- **motion**: on · off

Estado persistido en `<script>` con marcadores `/*EDITMODE-BEGIN*/...{json}.../*EDITMODE-END*/`. Cada cambio emite `__edit_mode_set_keys` al host.

### Animaciones por elemento (cuando `.is-in`)
- **Sparklines**: `stroke-dasharray:600 stroke-dashoffset:600 → 0` en 1.4s
- **Dist bars**: scaleY(0→1) en .7s con stagger .06s
- **Venue bars**: scaleX(0→1) en .8s
- **Compare bars**: scaleX(0→1) en 1s
- **Float pin**: opacity 0→1
- **Stickers**: rise + fade
- **Risk viz**: scale .96→1 + opacity
- **Signal/risk/layer/tile/kv/row**: translateY(14px→0) + opacity con stagger
- **Layer hover**: h4 → red + underline scaleX(0→1)
- **Tile hover**: translateY(-2px) + shadow
- **Row hover**: barra roja vertical de 2px

### Motion off (tweak)
`body[data-motion="off"] *` con `animation:none !important; transition:none !important;`.

---

## State Management

Mínimo. Estado local en JS para:
- `currentSel` en el grafo (id del nodo seleccionado)
- Estado de tweaks (`{texture, density, red, motion}`)
- Set de nodos `done` (counters ya animados)

En un framework real (React), conviene:
- `useState` para nodo seleccionado del grafo
- `useState` + Context para tweaks (si tweaks se mantienen en producción) — o eliminarlos si era solo herramienta de exploración
- Animaciones via CSS keyframes + clase `is-in` añadida con `IntersectionObserver` (probar primero — en producción suele funcionar bien) o `useScrollPosition` hook
- Datos del grafo + reporte de spreads + watchlist deberían venir de API real, no hardcodeados como ahora

---

## Assets

Todos en `prototype/assets/`:

| Archivo | Origen | Uso |
|---|---|---|
| `hero.png` | Render existente del producto | Hero principal + card Voltaic en Observatorio |
| `exploded.jpg` | Render proporcionado por el cliente | Ficha de la sección Capas de inteligencia |
| `karambit-emerald.webp` | Render proporcionado | Card en Observatorio |
| `butterfly-doppler.png` | Render proporcionado | Card en Observatorio |
| `karambit-fire-pov.jpg` | Imagen in-game proporcionada | Card en Observatorio |

En producción reemplazar por imágenes optimizadas (AVIF/WebP responsive). Los renders deben mantenerse con calidad alta (es la moneda visual del producto).

---

## Fonts

Cargados via Google Fonts en el `<head>`:

```html
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter+Tight:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
```

En producción: self-host (subset Latino) para performance y privacidad.

---

## Files in this handoff

```
design_handoff_home/
├── README.md                          ← este documento
└── prototype/
    ├── SkinGraph Radar — Home.html    ← markup completo
    ├── styles.css                     ← todas las reglas CSS
    ├── app.js                         ← reloj, contador, grafo, tweaks, reveal
    └── assets/
        ├── hero.png
        ├── exploded.jpg
        ├── karambit-emerald.webp
        ├── butterfly-doppler.png
        └── karambit-fire-pov.jpg
```

---

## Notes para implementación

- **Mantener el tono editorial**: si una pieza de copy se siente comercial, está mal. La narrativa es "observamos, conectamos, marcamos". Nunca "el mejor", "más rápido", "más completo".
- **No saturar de rojo**: el rojo debe ser excepción. Si una sección tiene más del 5% de tinta roja, está mal.
- **Hairlines, no shadows**: la jerarquía sale de la grilla y de los rules, no de elevaciones.
- **Italic = peso narrativo**: Instrument Serif italic se reserva para tensión editorial (énfasis en un sustantivo clave). No abusar.
- **Datos placeholders**: las cifras (412.918, 87.4K, etc.), traders (T-118), y filas de la tabla son ejemplo — conectar a la API real al implementar.
- **El hero no se toca**: la imagen del AK-47 Voltaic y el nav superior se preservan como están.
- **i18n**: aunque hoy todo está en español, dejar copys en archivos de i18n para futura internacionalización.
