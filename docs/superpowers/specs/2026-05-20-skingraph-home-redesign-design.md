# SkinGraph Radar Home Redesign — Design Spec

## Objetivo

Recrear en la home pública `/` el prototipo high-fidelity ubicado en `handoff/design_handoff_home`, usando componentes nativos del proyecto Next.js y manteniendo intacto el dashboard operativo en `/dashboard`.

La meta final es que la home se vea y se sienta como el prototipo: editorial, precisa, blanca/negra/roja, con lenguaje de informe de inteligencia de mercado para skins de CS2. Puede haber ajustes menores por integración, performance o mantenibilidad, pero la referencia visual principal es el handoff.

## Alcance aprobado

- Proyecto impactado: frontend del repo actual `tp-bd-neo4j`.
- Ruta pública: `/`.
- Ruta operativa existente: `/dashboard`, sin cambios funcionales.
- No se agregan endpoints ni cambios de Neo4j.
- No se toca SuperAdmin, backend externo ni DevOps.
- Los datos de la home pueden ser estáticos por ahora, estructurados para conectarse a APIs existentes más adelante.

## Dirección visual

- Estética: informe editorial premium, no SaaS landing genérica.
- Paleta: blanco cálido, negro profundo y rojo de señal.
- Rojo: usar solo para alerta, rutas, spreads, nodos importantes y CTAs. No debe dominar la pantalla.
- Jerarquía: tipografía grande, hairlines, grids, marcas de registro y whitespace.
- Bordes: casi rectos; cards sin radius o con radius mínimo según el prototipo.
- Sombras: mínimas. La profundidad sale de layout, contraste y líneas.
- Copy: todo en español, tono serio. Evitar frases comerciales como “revolucionario”, “todo en uno” o “el mejor”.
- Lenguaje de riesgo: usar “movimientos sospechosos”, “patrones anómalos”, “rutas de riesgo”, “señales para revisar”. No usar “fraude”.

## Tipografía y tokens

Usar las familias del handoff:

- `Instrument Serif`: títulos editoriales, números grandes, énfasis italic.
- `Inter Tight`: UI, párrafos y textos generales.
- `JetBrains Mono`: labels, datos, códigos y valores tabulares.

Tokens base a respetar en CSS:

- `--paper: #F7F5F0`
- `--paper-2: #FFFFFF`
- `--ink: #0B0B0C`
- `--ink-2: #1A1A1B`
- `--home-muted: #6B6B6B`
- `--home-muted-2: #97948C`
- `--hair: #E5E2DA`
- `--hair-2: #D9D5C9`
- `--home-red: #EE2E2E` o variante compatible con el prototipo
- `--inv-bg: #0B0B0C`
- `--inv-fg: #F7F5F0`

Los estilos deben aislarse con clases específicas de home cuando sea posible para evitar romper el dashboard. Hay que tener especial cuidado con clases globales existentes como `.brand`, `.section` y `.mono`.

## Arquitectura de componentes

`app/page.tsx` queda como ensamblador de la home. La implementación debe dividir secciones complejas en componentes enfocados dentro de `components/home/`.

Componentes esperados:

- `HomeHero.tsx`: hero superior preservando la intención visual del prototipo y navegación pública.
- `MastheadStrip.tsx`: tira editorial con volumen, descripción, estado en vivo y reloj.
- `StatementSection.tsx`: declaración grande, aside y KPIs con counters.
- `SignalsSection.tsx`: seis señales de mercado, mini visualizaciones y tabla de reporte de spreads.
- `RelationsSection.tsx` o equivalente: sección protagonista con grafo SVG seleccionable e inspector.
- `RiesgoSection.tsx`: sección invertida de movimientos sospechosos con cuatro risk cards.
- `InterludeSection.tsx`: observatorio con cuatro piezas visuales.
- `CapasSection.tsx`: ficha sticky con imagen `exploded.jpg` y nueve capas de inteligencia.
- `DeskSection.tsx`: seis instrumentos del dashboard en una mesa editorial.
- `CierreSection.tsx`: cierre con CTA hacia `/dashboard` y footer fino.

Se pueden crear componentes internos auxiliares para mantener archivos legibles: `ReportTable`, `MarketGraphSvg`, `RiskCard`, `LayerRow`, `HomeReveal`, `HomeCounter`.

## Estructura narrativa

La home debe seguir la secuencia del handoff:

1. **Hero**: imagen AK-47 Voltaic/nav superior preservados en intención. CTA a `/dashboard`.
2. **Masthead**: “Vol. 04 · Boletín de mercado”, centro editorial y estado “En vivo”.
3. **Declaración**: “El precio es solo la superficie.” con “superficie” en italic rojo.
4. **Señales de mercado**: seis señales con mini-viz y reporte de spreads.
5. **Relaciones**: grafo SVG de compradores, traders, skins, marketplaces y transacciones; inspector lateral.
6. **Movimientos sospechosos**: sección negra, cuatro risk cards y lenguaje cuidadoso.
7. **Observatorio**: cuatro assets reales del handoff con precios y variaciones.
8. **Capas de inteligencia**: imagen expandida y lista de nueve capas.
9. **Mesa de análisis**: seis instrumentos: Market Radar, Risk Cycles, Graph Explorer, Traders, Watchlist, Compare.
10. **Cierre**: frase editorial, botón “Abrir dashboard”, metadata y footer.

## Assets

Los assets del prototipo deben moverse/copiarse a una ruta pública de producción, preferentemente `public/home/`:

- `hero.png`
- `exploded.jpg`
- `karambit-emerald.webp`
- `butterfly-doppler.png`
- `karambit-fire-pov.jpg`

Usar `next/image` cuando aporte optimización sin dificultar el layout. Mantener buena calidad visual porque las imágenes son parte central de la identidad.

## Interacciones

Implementar interacciones livianas y progresivas, no dependientes de librerías pesadas:

- Reloj en masthead con formato `HH:MM ART`.
- “Actualizado hace X s” en tabla de spreads.
- Reveal on scroll para secciones y elementos principales.
- Counters para KPIs de declaración.
- Mini animaciones CSS: sparklines, barras, pins, pills, filas hover.
- Grafo SVG con estado local:
  - click en nodo selecciona y actualiza inspector;
  - hover destaca conexiones;
  - hot path rojo con trazo animado;
  - restore al salir del hover.

Todas las animaciones deben respetar `prefers-reduced-motion`.

No incluir el panel de tweaks del prototipo en producción salvo que se pida explícitamente.

## Datos

Primera implementación: datos estáticos locales en arrays tipados dentro de componentes o archivos auxiliares de home.

Preparar los datos de forma clara para poder migrar después a APIs existentes:

- `/api/metrics`
- `/api/opportunities`
- `/api/risk-cycles`
- `/api/market-pulse`
- `/api/graph`

Los CTAs visibles deben hacer algo real:

- “Dashboard” / “Abrir dashboard” navegan a `/dashboard`.
- “Preview” navega a la sección de señales o relaciones.
- Cards interactivas deben cambiar estado visual, seleccionar contenido o actuar como anchors.

## Responsive y accesibilidad

- Desktop: reproducir la grilla editorial con rail izquierdo y contenido amplio.
- Tablet: reducir columnas manteniendo jerarquía y legibilidad.
- Mobile: rail puede compactarse arriba; cards y tablas deben scrollear o apilar sin romper lectura.
- Mantener contraste suficiente en sección clara y sección negra.
- Los SVG decorativos deben usar `aria-hidden` cuando corresponda.
- Las interacciones clickables deben ser accesibles por teclado cuando actúen como controles.
- CTAs deben tener labels claros y navegación real.

## Riesgos y mitigaciones

- **Colisiones CSS con dashboard**: prefijar estilos de home y revisar clases compartidas.
- **Pegar HTML/CSS del prototipo sin adaptar**: evitarlo; recrear como React mantenible.
- **Home visualmente fiel pero pesada**: priorizar SVG/CSS liviano, optimizar imágenes.
- **Copy en inglés heredado**: reemplazar por español según handoff.
- **Rojo excesivo**: auditar visualmente que funcione como señal, no decoración masiva.
- **Dashboard roto por estilos globales**: verificar `/dashboard` además de `/`.

## Verificación esperada

Comandos mínimos antes de dar por terminado:

```bash
npm run lint
npm run build
```

Verificación manual recomendada:

- `/` muestra la home editorial completa.
- `/dashboard` conserva el dashboard actual.
- Links y CTAs navegan correctamente.
- Reloj, contador, actualización de segundos y grafo funcionan.
- `prefers-reduced-motion` no deja la página inutilizable.
- Mobile/tablet no rompen composición.

## Criterio de aceptación

La implementación se considera correcta si la home se aproxima de forma clara al prototipo high-fidelity del handoff, mantiene la app operativa separada en `/dashboard`, no introduce cambios de backend, y pasa lint/build.
