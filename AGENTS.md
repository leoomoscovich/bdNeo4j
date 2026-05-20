# AGENTS.md

## Estado Actual

- Este repo ya tiene una app Next.js scaffolded y funcional con App Router, TypeScript, Tailwind CSS, Neo4j, `neo4j-driver` y Cytoscape.js.
- Ya existen `package.json`, `package-lock.json`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `app/`, `components/`, `lib/`, `data/`, `scripts/` y `docs/`.
- El proyecto dejo de estar planteado como MVP/demo. La direccion aprobada es una website real de market intelligence para skins de CS2.
- El plan visual aprobado esta en `docs/skingraph-real-website-plan.html`.
- El plan ejecutable aprobado esta en `docs/superpowers/plans/2026-05-20-skingraph-real-website.md`.
- El README fue actualizado para documentar la direccion actual, arquitectura, APIs e interacciones.
- La carpeta actual no tiene `.git`; no asumir que se puede commitear, hacer branch o ver diff con git.

## Producto Actual

- SkinGraph Radar es una website de inteligencia de mercado para skins de CS2 basada en grafo.
- El producto detecta oportunidades, spreads, flips, ciclos sospechosos, trader paths, premiums por stickers/floats y relaciones entre marketplaces.
- Todas las opciones visibles deben tener comportamiento util, no decorativo.
- Persistencia acordada:
  - Neo4j guarda datos compartidos del producto: skins, instancias, traders, transacciones, marketplaces, oportunidades calculadas, ciclos, scans y relaciones.
  - `localStorage` guarda preferencias anonimas hasta que exista login: watchlist, filtros, comparaciones y seleccion local.
- Fuera de alcance por ahora: login, pagos, scraping real, integracion live con CSFloat, deploy productivo.

## Arquitectura

- `app/page.tsx` es el contenedor principal cliente. Maneja:
  - workspace activo
  - filtros globales
  - oportunidad seleccionada
  - ciclo seleccionado
  - drawer
  - graph target
  - compare ids
  - ultimo scan
- `components/AppShell.tsx` compone sidebar y topbar.
- `components/SidebarNav.tsx` maneja navegacion, toggles de marketplaces y `Run deep scan`.
- `components/Topbar.tsx` maneja busqueda global y muestra filtros activos.
- `components/OpportunityFeed.tsx` consume `/api/opportunities` con filtros.
- `components/RiskCyclesPanel.tsx` consume `/api/risk-cycles` con filtros.
- `components/GraphInsightPanel.tsx` renderiza Cytoscape usando `/api/graph`.
- `components/TraderWorkspace.tsx` consume `/api/traders`.
- `components/WatchlistWorkspace.tsx` usa `localStorage` y rehidrata oportunidades desde API.
- `components/CompareWorkspace.tsx` consume `/api/compare`.
- `components/SelectedAssetDrawer.tsx` expone acciones reales: track, open graph, compare, export.

## Estado Compartido Frontend

- Tipos y defaults en `lib/ui-state.ts`:
  - `WorkspaceId`
  - `MarketplaceId`
  - `SignalFilter`
  - `AppFilters`
  - `GraphTarget`
  - `defaultFilters`
  - `serializeMarketplaces`
- Helpers de preferencias anonimas en `lib/local-preferences.ts`:
  - `getWatchlistIds`
  - `setWatchlistIds`
  - `toggleWatchlistId`
  - `getCompareIds`
  - `setCompareIds`

## Modelo Neo4j

Nodos actuales:

- `Skin`
- `SkinInstance`
- `Trader`
- `Transaction`
- `Marketplace`
- `Weapon`
- `Collection`
- `Sticker`
- `PriceSnapshot`
- `ScanRun`

Relaciones actuales:

- `(:Skin)-[:BELONGS_TO]->(:Collection)`
- `(:Skin)-[:FOR_WEAPON]->(:Weapon)`
- `(:SkinInstance)-[:INSTANCE_OF]->(:Skin)`
- `(:SkinInstance)-[:HAS_STICKER]->(:Sticker)`
- `(:Trader)-[:BOUGHT]->(:Transaction)`
- `(:Trader)-[:SOLD]->(:Transaction)`
- `(:Transaction)-[:FOR_INSTANCE]->(:SkinInstance)`
- `(:Transaction)-[:ON_MARKETPLACE]->(:Marketplace)`
- `(:Skin)-[:HAS_PRICE]->(:PriceSnapshot)`
- `(:Trader)-[:CONNECTED_TO]->(:Trader)`

`ScanRun` se usa como resumen persistido de deep scans. No tiene relacion obligatoria en la primera version.

## APIs Actuales

- `GET /api/skins?q=...`
- `GET /api/metrics`
- `GET /api/node?id=...&type=...`
- `GET /api/market-pulse?marketplaces=CSFloat,BUFF163`
- `GET /api/opportunities?q=&marketplaces=&signal=&minSpreadPct=&maxRiskScore=`
- `GET /api/risk-cycles?q=&marketplaces=&minRiskScore=&severity=&timeWindowHours=`
- `GET /api/graph?skinId=...`
- `GET /api/graph?instanceId=...`
- `GET /api/graph?traderId=...`
- `GET /api/graph?marketplaceId=...`
- `GET /api/traders?q=&marketplaces=...`
- `GET /api/traders/[id]`
- `POST /api/scans`
- `GET /api/scans/latest`
- `GET /api/compare?ids=id1,id2`
- `GET /api/export?type=opportunities|cycles&format=json|csv`

Reglas importantes:

- Validar query params en API routes.
- Devolver `400` para parametros invalidos o faltantes.
- Devolver errores seguros para fallos de DB.
- `/api/graph` debe recibir exactamente un target entre `skinId`, `instanceId`, `traderId`, `cycleId`, `marketplaceId`.
- `marketplaces` es allowlist: `CSFloat`, `BUFF163`, `Skinport`.

## Datos y Seed

- Seed local primero; no depender de APIs externas.
- Seed en `scripts/seed-neo4j.ts`.
- Datos base:
  - `data/seed-skins.json`
  - `data/seed-traders.json`
  - `data/seed-transactions.json`
- El seed crea:
  - constraints de ids
  - skins, weapons, collections, price snapshots
  - traders con `handle`, `riskScore`, `region`, `firstSeenAt`
  - marketplaces
  - stickers
  - skin instances
  - transactions
  - trader connections
  - un `ScanRun` inicial `scan-seed-latest`
- El seed incluye flips rentables, ciclos sospechosos y skins con stickers raros.

## Comandos

- Instalar dependencias:

```bash
npm install
```

- Levantar Neo4j local:

```powershell
docker run --name cs2-neo4j -p 7474:7474 -p 7687:7687 -e NEO4J_AUTH=neo4j/password neo4j:latest
```

- Si el contenedor ya existe:

```powershell
docker start cs2-neo4j
```

- Seed:

```bash
npm run seed
```

- Desarrollo:

```bash
npm run dev
```

- Build:

```bash
npm run build
```

- Lint:

```bash
npm run lint
```

## Verificacion Esperada

Antes de decir que algo quedo terminado, correr como minimo:

```bash
npm run lint
npm run build
```

Para cambios de datos/API, correr tambien:

```bash
npm run seed
```

Verificacion funcional recomendada:

- Abrir `http://localhost:3000`.
- Probar workspaces: `Dashboard`, `Market Radar`, `Risk Cycles`, `Graph Explorer`, `Traders`, `Watchlist`, `Compare`.
- Toggle de marketplaces debe cambiar resultados.
- Topbar search debe filtrar resultados.
- `Run deep scan` debe crear/mostrar un `ScanRun`.
- En `Market Radar`, seleccionar oportunidad debe abrir drawer.
- En drawer, probar `Track`, `Open graph`, `Compare`, `Export`.
- `Watchlist` debe persistir tras refresh por `localStorage`.
- `Compare` requiere al menos dos oportunidades.
- `/api/graph?skinId=a&instanceId=b` debe devolver `400`.

APIs utiles para smoke test:

```txt
http://localhost:3000/api/opportunities?marketplaces=CSFloat&minSpreadPct=8
http://localhost:3000/api/risk-cycles?minRiskScore=70
http://localhost:3000/api/traders
http://localhost:3000/api/export?type=opportunities&format=json
http://localhost:3000/api/graph?instanceId=inst-ak-case-01
```

## Estilo y Reglas de Trabajo

- Mantener tema oscuro CS2/market intelligence, UI densa y operacional.
- Evitar botones decorativos: todo control visible debe cambiar estado, navegar, consultar API o ejecutar una accion.
- No agregar login ni persistencia de usuario hasta que se pida explicitamente.
- No crear un driver Neo4j por request; usar `lib/neo4j.ts` como singleton.
- Preferir tipos compartidos en `lib/types.ts` y `lib/ui-state.ts`.
- Preferir validaciones compartidas de query params en `lib/api-params.ts`.
- Si se agregan endpoints, documentarlos en `README.md` y, si aplican a Cypher/modelo, en `docs/cypher-queries.md` y `docs/graph-model.md`.
- Si se modifica comportamiento frontend significativo, verificar con `npm run lint`, `npm run build` y prueba manual/API local.
