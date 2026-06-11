# SkinGraph Radar — Resumen técnico para la defensa

> **BD 2 · TUP 2do año · Neo4j + Next.js**

---

## 1. Base de datos — Neo4j (Docker)

### Modelo de grafo

| Nodo | Descripción |
|------|-------------|
| `Skin` | Modelo de skin (ej: AK-47 \| Asiimov) |
| `SkinInstance` | Pieza concreta con float, stickers, precio |
| `Trader` | Cuenta de usuario con volumen y riesgo calculado |
| `Transaction` | Operación de compra/venta con precio, fee, timestamp |
| `Marketplace` | Venue (CSFloat, BUFF163, Skinport, etc.) |
| `PriceSnapshot` | Precio observado de una skin en un venue en un momento |

Relaciones clave: `BOUGHT`, `SOLD`, `FOR_INSTANCE`, `INSTANCE_OF`, `ON_MARKETPLACE`, `FOR_SKIN`.

### Detección de fraude con Cypher

Los **clústeres cíclicos** (anillos de lavado de dinero) se detectan con `shortestPath` y pattern matching de ciclos en Cypher puro. El seed incluye 3 clusters hardcodeados:
- Triángulo (3 nodos)
- Anillo (4 nodos)
- Malla (3 nodos con múltiples aristas)

Cada ciclo tiene `riskScore`, `severity` (CRITICAL/HIGH/MEDIUM/LOW), `traderPath` y `valueMovedUsd`.

### Bug de Cartesian Product (resuelto)

**Problema:** En Neo4j 5, colocar `WHERE` después de `OPTIONAL MATCH` hace que se interprete como parte del optional, no del match anterior. Al tener dos `OPTIONAL MATCH` independientes (PriceSnapshots + SkinInstances) sin agregar entre ellos, Neo4j los cruzaba produciendo N×M filas duplicadas.

**Solución:**
```cypher
MATCH (s:Skin)-[:FOR_WEAPON]->(w:Weapon)
WHERE ($query = '' OR ...)          -- WHERE inmediatamente después del MATCH

OPTIONAL MATCH (s)<-[:FOR_SKIN]-(p:PriceSnapshot)-[:ON_MARKETPLACE]->(mp)
WITH s, w, collect(DISTINCT {price: p.priceUsd, marketplace: mp.name}) AS prices
-- ^ collect ANTES del segundo OPTIONAL MATCH

OPTIONAL MATCH (i:SkinInstance)-[:INSTANCE_OF]->(s)
WITH s, w, prices, count(DISTINCT i) AS instanceCount
```

Capa defensiva adicional en el mapper TypeScript: `Set`-based deduplication por `id`.

---

## 2. Frontend — Performance con Three.js nativo

### Por qué Three.js y no React Three Fiber (R3F)

| | Three.js puro | React Three Fiber |
|---|---|---|
| Bundle overhead | ~0 adicional | ~180 KB |
| Reconciliación | Loop RAF manual | React reconciler por frame |
| Cleanup | Explícito (`dispose()`) | Automático pero opaco |
| Control | Total | Parcial |

**Patrón implementado:**
```ts
const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

useEffect(() => {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  rendererRef.current = renderer;
  // ... setup scene, camera, animate loop
  return () => {
    renderer.dispose();
    geometry.dispose();
    material.dispose();
  };
}, [graph]);
```

El `WebGLRenderer` vive en un `useRef`, el `requestAnimationFrame` se maneja manualmente y el cleanup es explícito. Esto permite renderizar grafos de 150+ nodos a 60fps dentro de un componente React.

### Price Jitter — Simulación de volatilidad de mercado

```ts
function useJitteredPrice(base: number | null, id: string): number | null {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1800);
    return () => clearInterval(timer);
  }, []);
  if (!base) return base;
  const phase = phaseFromId(id);       // hash determinístico del id
  const amplitude = base * 0.018;      // ±1.8% máximo
  return base + amplitude * Math.sin((tick * 0.4) + phase * 0.001);
}
```

Cada carta usa el `id` de la skin como seed de fase — los precios se mueven desfasados entre sí, simulando volatilidad real de mercado sin ningún round-trip al servidor.

---

## 3. UX/UI Avanzada

### Stack de estilos — Tailwind v4

- Sin `tailwind.config.js` — todo por CSS variables en `globals.css`
- Plugin: `@tailwindcss/postcss` (no el legacy `tailwindcss` standalone)
- Tema completo en variables CSS: `--d-panel`, `--d-ink`, `--d-muted`, `--d-orange`, etc.

### TraderDrawer — Inspección profunda en tiempo real

- Fetch paralelo con `Promise.all([perfil, grafo])` al abrir
- Toggle **Inventario / Red** que filtra nodos client-side sin re-fetch
- Animación `drawer-slide-in`: `translateX(100%) → 0` en 0.22s
- `role="dialog" aria-modal="true"`, cierre con Escape y backdrop click

### Carrusel mobile — Scroll-snap nativo

```css
@media (max-width: 720px) {
  .signals-grid {
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
  }
  .signal-card {
    flex: 0 0 82vw;
    scroll-snap-align: start;
  }
}
```

Sin librería de carrusel. Táctil nativo, con dots navegables que trackean `scrollLeft`.

### Skeletons accesibles

```tsx
<div className="feed-skeleton" aria-busy="true">
  {Array.from({ length: rows }).map((_, i) => <div key={i} className="skeleton-row" />)}
</div>
```

Animación shimmer 100% CSS (`@keyframes shimmer`). El atributo `aria-busy="true"` informa a lectores de pantalla que el contenido está cargando.

---

## 4. Historial de commits clave

```
8bf5017  fix(ts): use lowercase 'trader' NodeType in inventory filter
a8ce3e0  feat(phase4): price jitter in skin catalog, mobile carousel for signals
3689dd1  feat(phase3): risk alert banner and inventory/network toggle in drawer
3d85948  fix(mobile): 640px breakpoints for pulse grid, patterns, table columns
b19e552  fix(catalog): move WHERE before OPTIONAL MATCH, deduplicate in mapper
7c39816  fix(deps): restore @tailwindcss/postcss removed by mistake
```

---

## 5. Comandos de arranque para la demo

```bash
# 1. Levantar Neo4j
docker start neo4j-skingraph

# 2. Verificar que esté corriendo
docker ps | grep neo4j-skingraph

# 3. Arrancar la app
npm run dev   # → http://localhost:3000

# 4. (Opcional) Re-seedear el grafo
npx tsx scripts/seed-neo4j.ts
```

**Credenciales Neo4j:** `neo4j` / `password` — UI en http://localhost:7474

---

*Build de producción verificado: `npm run build` → 19 rutas, 0 errores TypeScript, 0 warnings.*
