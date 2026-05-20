# SkinGraph Radar

SkinGraph Radar is a CS2 skin market intelligence website powered by Neo4j. It turns skins, traders, marketplaces, transactions, stickers, price snapshots and risk paths into a graph-first product for finding opportunities, inspecting provenance and detecting suspicious market behavior.

This is no longer scoped as a static MVP. The product direction is a real interactive website with functional navigation, filters, graph exploration, scans, comparison, export and anonymous user preferences.

## Product Direction

- **Market Radar:** ranked opportunities with real filters for marketplace, spread, signal, rarity, float and risk.
- **Risk Cycles:** suspicious trader loops, abnormal prices and circular ownership paths backed by Neo4j queries.
- **Graph Explorer:** Cytoscape graph views for skins, instances, traders, marketplaces and risk cycles.
- **Trader Intelligence:** trader activity, route quality, connected accounts and market influence.
- **Watchlist:** anonymous local watchlist enriched with current graph data.
- **Deep Scan:** backend scan action that refreshes opportunity and risk signals from Neo4j.
- **Compare:** side-by-side comparison for opportunities, markets and selected assets.
- **Export:** JSON or CSV export of the current filtered result set.

Detailed product reference: [docs/skingraph-radar-product.md](docs/skingraph-radar-product.md)

Current website plan: [docs/superpowers/plans/2026-05-20-skingraph-real-website.md](docs/superpowers/plans/2026-05-20-skingraph-real-website.md)

Visual planning document: [docs/skingraph-real-website-plan.html](docs/skingraph-real-website-plan.html)

## Rutas principales

- `/` — home pública narrativa de SkinGraph Radar. Presenta la historia visual del producto, la animación frame-by-frame preparada para PNGs y CTAs hacia el dashboard.
- `/dashboard` — app operacional de market intelligence con workspaces, filtros, oportunidades, ciclos de riesgo, grafo, traders, watchlist y compare.

## Animación de home

La home está preparada para leer frames PNG desde:

```txt
public/animation/home-sequence/frame-0001.png
public/animation/home-sequence/frame-0002.png
public/animation/home-sequence/frame-0003.png
```

Mientras no existan frames reales, `ScrollSequence` muestra una visual temporal basada en nodos y conexiones.

## Architecture

The app uses Next.js App Router as the fullstack web layer. API routes validate request parameters, query Neo4j through a singleton `neo4j-driver` connection, and return plain JSON for React components.

Neo4j is the source of truth for shared product data:

- skins, instances, weapons, collections and stickers
- traders, marketplaces and transactions
- price snapshots and market metrics
- calculated opportunities
- suspicious cycles
- scan runs and scan results

The browser stores only anonymous user preferences until login exists:

- active marketplaces
- current filters
- watchlist item ids
- comparison selections
- last selected view or graph target

This keeps the website useful without inventing accounts too early, while leaving a direct path to migrate preferences to user-owned backend records later.

## Tech Stack

- **Frontend:** Next.js App Router, React, TypeScript, Tailwind CSS
- **Graph database:** Neo4j, `neo4j-driver`
- **Graph visualization:** Cytoscape.js
- **Runtime:** Node.js 20+
- **Local database:** Neo4j Docker container

## Requirements

- Node.js 20+
- Docker for local Neo4j
- PowerShell on Windows for the commands below

## Setup

Install dependencies:

```bash
npm install
```

Create local environment config:

```powershell
Copy-Item .env.local.example .env.local
```

If `.env.local` is missing, the app defaults to:

```env
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=password
```

Start Neo4j:

```powershell
docker run --name cs2-neo4j -p 7474:7474 -p 7687:7687 -e NEO4J_AUTH=neo4j/password neo4j:latest
```

If the container already exists:

```powershell
docker start cs2-neo4j
```

Seed local graph data:

```bash
npm run seed
```

Start the website locally:

```bash
npm run dev
```

Open `http://localhost:3000`.

Neo4j Browser is available at `http://localhost:7474` with user `neo4j` and password `password`.

## Scripts

- `npm run dev`: starts the development server.
- `npm run build`: creates a production build.
- `npm run start`: serves the production build.
- `npm run seed`: clears and reloads local Neo4j seed data.
- `npm run lint`: runs ESLint.

## Current APIs

- `GET /api/skins?q=redline`: search skins.
- `GET /api/graph?skinId=skin-ak-redline`: graph around a skin.
- `GET /api/graph?instanceId=inst-ak-redline-01`: graph around an instance.
- `GET /api/node?id=skin-ak-redline&type=skin`: node details.
- `GET /api/metrics`: indexed metrics.
- `GET /api/opportunities?minSpreadPct=5`: opportunity feed.
- `GET /api/risk-cycles?minRiskScore=60`: suspicious transaction cycles.
- `GET /api/market-pulse`: market pulse metrics.

## Planned Product APIs

These endpoints support the real website behavior:

- `GET /api/traders`: trader ranking and search.
- `GET /api/traders/[id]`: trader profile and graph context.
- `POST /api/scans`: run a new deep scan and persist scan metadata in Neo4j.
- `GET /api/scans/latest`: read latest scan status and summary.
- `GET /api/compare?ids=...`: compare selected opportunities or assets.
- `GET /api/export?type=opportunities|cycles&format=json|csv`: export filtered data.

Existing APIs should also be expanded:

- `/api/opportunities`: add marketplace, signal, rarity, float, risk and query filters.
- `/api/risk-cycles`: add severity, marketplace, time-window and trader filters.
- `/api/graph`: add `traderId`, `cycleId` and `marketplaceId`.
- `/api/market-pulse`: respect active marketplace and risk filters.

## Interaction Contract

Every visible control should do useful work:

- Sidebar navigation changes the active product workspace.
- Sidebar marketplace toggles update dashboard metrics, opportunities and cycles.
- `Run deep scan` calls the scan API and refreshes visible data.
- Topbar search filters or navigates to matching skins, traders, markets and graph nodes.
- Hero actions select the best opportunity, show risk cycles or open comparison.
- Table tabs filter by signal category.
- Drawer actions track, open graph, compare and export the selected item.
- Watchlist reads local ids and refreshes current data from the backend.

## Verification

Before considering a feature complete:

```bash
npm run build
```

For data-backed work, also run:

```bash
npm run seed
npm run dev
```

Then verify:

- filters change the returned data
- navigation changes the visible workspace
- graph opens for selected opportunities and cycles
- watchlist persists across refreshes
- scan action creates a visible scan result
- export returns valid JSON or CSV
