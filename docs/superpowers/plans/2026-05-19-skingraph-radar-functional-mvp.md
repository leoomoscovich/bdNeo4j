# SkinGraph Radar Functional MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the current explanatory CS2 graph MVP into a functional, competitive market intelligence dashboard inspired by CSFloat, with stronger visual design and graph-powered opportunity/risk analysis.

**Architecture:** The UI should be a professional app shell, not a landing page. React components consume Next.js API routes; API routes query Neo4j; Neo4j is seeded with realistic demo data now and can later be fed by ingestion jobs from CSFloat/marketplace APIs. Neo4j is used silently for trader paths, suspicious cycles, instance history, spreads, and relationship-based scores.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind/global CSS, Neo4j, `neo4j-driver`, Cytoscape.js, local seed JSON.

---

## 1. Current Project Context

The repository is at `C:\Users\msi\proyectos\tp-bd-neo4j`.

Current MVP state:

- Next.js app already exists in the repo root.
- Neo4j connection exists in `lib/neo4j.ts`.
- Seed script exists in `scripts/seed-neo4j.ts` and loads local defaults if `.env.local` is missing.
- Seed data exists in:
  - `data/seed-skins.json`
  - `data/seed-traders.json`
  - `data/seed-transactions.json`
- Current API routes exist:
  - `app/api/skins/route.ts`
  - `app/api/graph/route.ts`
  - `app/api/node/route.ts`
  - `app/api/metrics/route.ts`
- Current UI is too explanatory and should be replaced by a functional app shell.
- A static mockup for the new direction exists at `skin-graph-radar-mockup.html`.

Important product pivot:

- Do not build a web representation of the plan or “why Neo4j” sections.
- Build a product that feels useful immediately.
- Neo4j should power the app silently through relationships, cycles, paths, clusters, and derived signals.
- Competitive target: CSFloat, but with better visual hierarchy and graph/risk intelligence.

---

## 2. Product Direction

Name used in mockup: **SkinGraph Radar**.

Primary screen: **Market Radar**.

The app should combine:

- Premium market dashboard.
- Trading opportunity feed.
- Fraud/risk radar.
- Graph insight panel.
- Selected asset drawer.

Core user questions:

- Which skins are currently underpriced?
- Which skins have profitable flip signals?
- Which listings have sticker/float premium?
- Which traders are connected through repeated transactions?
- Which instances moved in suspicious cycles?
- Which price moves should be excluded from fair value due to possible wash trading?
- What path did this skin instance take through traders and marketplaces?

Out of scope for this phase:

- Login.
- Payments.
- Real scraping.
- Real CSFloat integration.
- Production deployment.
- ML-based fraud scoring.
- Watchlist persistence.

---

## 3. Data Strategy

### 3.1 MVP Data Source

Use Neo4j seeded from local JSON, not hardcoded React data.

Flow:

```txt
data/*.json
  -> npm run seed
  -> Neo4j
  -> Next.js API routes
  -> React UI
```

Hardcoded in UI is allowed only for:

- Navigation labels.
- Filter labels.
- Empty states.
- Button labels.
- Static visual legends.

Dynamic data must come from API/Neo4j:

- Opportunity feed.
- Risk cycles.
- Market pulse metrics.
- Graph nodes/edges.
- Drawer details.
- Trader paths.
- Event timeline.

### 3.2 Future Real Data Sources

Possible real ingestion sources:

- CSFloat listings/API if available and allowed by terms.
- Skinport public market data if available.
- Steam Market price history where feasible.
- BUFF-style market snapshots only if legally/technically viable.
- Paid market data provider if scraping/API limits are problematic.

Future architecture:

```txt
Ingestion jobs
  -> external marketplace data
  -> normalization layer
  -> Neo4j write model
  -> Next.js API read model
  -> UI
```

Do not couple UI directly to external APIs. UI should only call our own `/api/*` routes.

---

## 4. Target UX Structure

Replace the current page with an app shell.

### 4.1 Sidebar

Navigation items:

- Dashboard
- Market Radar
- Risk Cycles
- Graph Explorer
- Traders
- Watchlist
- Settings

Only `Market Radar` needs to be functional in this phase. Other items can be disabled/visual only.

### 4.2 Topbar

Contains:

- Global search input.
- Live market scan status.
- Quick filters:
  - marketplace
  - rarity
  - float range
  - minimum spread
  - risk mode

Filters can be UI-only initially unless easy to wire to APIs.

### 4.3 Market Pulse Cards

Dynamic metrics from API:

- tracked volume today
- deals above spread threshold
- average opportunity spread
- suspicious cycles count
- active traders or watched traders

### 4.4 Opportunity Feed

Table or dense cards with:

- Skin name.
- Wear/float.
- Source marketplace.
- Current ask.
- Fair value.
- Spread percentage.
- Confidence score.
- Signal type.
- Action button.

Signal types:

- `UNDERPRICED`
- `FAST_FLIP`
- `STICKER_PREMIUM`
- `LOW_FLOAT_PREMIUM`
- `THIN_MARKET`
- `RISK_ADJUSTED`

### 4.5 Risk Cycles Panel

Cards with:

- Cycle path summary.
- Repeated asset/instance.
- Value moved.
- Time window.
- Number of traders.
- Wash probability or risk score.
- Severity.

Examples:

- `shadow_a -> shadow_b -> shadow_c -> shadow_a`
- `fast_flip -> market_maker -> fast_flip`

### 4.6 Graph Insight Panel

Use Cytoscape for actual app implementation.

When selecting an opportunity or risk cycle, graph shows:

- central skin/instance node
- trader nodes
- transaction nodes
- marketplace nodes
- risk event node when relevant
- labeled relationships

### 4.7 Selected Asset Drawer

Right drawer with:

- selected skin/instance/trader/cycle title
- current ask
- fair value
- spread
- confidence score
- risk score
- trader path
- event timeline
- actions:
  - Track
  - Compare
  - Open Graph

---

## 5. Data Model Additions

Current model has:

- `Skin`
- `SkinInstance`
- `Trader`
- `Transaction`
- `Marketplace`
- `Weapon`
- `Collection`
- `Sticker`
- `PriceSnapshot`

For this phase, do not add unnecessary persisted nodes unless needed. Prefer derived API responses from existing graph.

Recommended response types to add in `lib/types.ts`:

```ts
export type SignalType =
  | "UNDERPRICED"
  | "FAST_FLIP"
  | "STICKER_PREMIUM"
  | "LOW_FLOAT_PREMIUM"
  | "THIN_MARKET"
  | "RISK_ADJUSTED";

export type Opportunity = {
  id: string;
  skinId: string;
  instanceId: string;
  skinName: string;
  weapon: string;
  rarity: string;
  wear: string;
  float: number;
  marketplace: string;
  currentAskUsd: number;
  fairValueUsd: number;
  spreadPct: number;
  confidenceScore: number;
  riskScore: number;
  signal: SignalType;
  traderPath: string[];
  eventTimeline: Array<{
    title: string;
    description: string;
    timestamp?: string;
  }>;
};

export type RiskCycle = {
  id: string;
  title: string;
  instanceId: string;
  skinName: string;
  traderPath: string[];
  valueMovedUsd: number;
  timeWindowHours: number;
  riskScore: number;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  evidence: Array<{
    title: string;
    description: string;
  }>;
};

export type MarketPulse = {
  trackedVolumeUsd: number;
  dealsDetected: number;
  averageSpreadPct: number;
  suspiciousCycles: number;
  activeTraders: number;
};
```

---

## 6. API Endpoints To Add

### `GET /api/opportunities`

Returns opportunity feed from Neo4j-derived calculations.

Query params:

- `minSpreadPct` optional number, default `5`.
- `signal` optional string.
- `marketplace` optional string.

Response: `Opportunity[]`.

### `GET /api/risk-cycles`

Returns suspicious transaction cycles.

Query params:

- `minRiskScore` optional number, default `60`.

Response: `RiskCycle[]`.

### `GET /api/market-pulse`

Returns dashboard metrics aligned to the new app shell.

Response: `MarketPulse`.

### Extend `GET /api/graph`

Current endpoint supports `skinId`.

Add support for one of:

- `instanceId`
- `riskCycleId`

Validation:

- Return `400` if no supported query param is provided.
- Return safe `500` on DB errors.

---

## 7. File Structure

Create/modify these files:

```txt
app/
  page.tsx                         # replace current landing-style page with app shell
  globals.css                      # replace/extend style for dense dashboard
  api/
    opportunities/route.ts         # new
    risk-cycles/route.ts           # new
    market-pulse/route.ts          # new
    graph/route.ts                 # extend

components/
  AppShell.tsx                     # new, layout wrapper with sidebar/topbar/drawer regions
  SidebarNav.tsx                   # new
  Topbar.tsx                       # new
  MarketPulseCards.tsx             # new
  OpportunityFeed.tsx              # new
  RiskCyclesPanel.tsx              # new
  GraphInsightPanel.tsx            # new or replace GraphExplorer usage
  SelectedAssetDrawer.tsx          # new or replace NodeDetailsPanel for dashboard context

lib/
  types.ts                         # add Opportunity, RiskCycle, MarketPulse types
  queries.ts                       # add opportunity/risk/pulse queries
  graph-mappers.ts                 # add mapping functions

data/
  seed-transactions.json           # extend only if more demo cases are needed

docs/
  skingraph-radar-product.md       # new product/readme doc
```

Keep the static mockup file `skin-graph-radar-mockup.html` as visual reference.

---

## 8. Cypher Query Strategy

### 8.1 Opportunities

For MVP, calculate fair value from transaction history of same skin and compare latest transaction/listing-like value.

Since there is no real `Listing` node yet, use latest transaction price as current ask proxy.

Basic query shape:

```cypher
MATCH (skin:Skin)<-[:INSTANCE_OF]-(instance:SkinInstance)<-[:FOR_INSTANCE]-(tx:Transaction)
MATCH (tx)-[:ON_MARKETPLACE]->(marketplace:Marketplace)
OPTIONAL MATCH (buyer:Trader)-[:BOUGHT]->(tx)
OPTIONAL MATCH (seller:Trader)-[:SOLD]->(tx)
WITH skin, instance, marketplace, tx, buyer, seller
ORDER BY tx.timestamp DESC
WITH skin, instance,
     collect({tx: tx, marketplace: marketplace, buyer: buyer, seller: seller}) AS events,
     avg(tx.priceUsd) AS averagePrice,
     max(tx.priceUsd) AS maxPrice
WITH skin, instance, events[0] AS latest, events, averagePrice, maxPrice
WITH skin, instance, latest, events,
     latest.tx.priceUsd AS currentAskUsd,
     CASE WHEN maxPrice > averagePrice THEN maxPrice ELSE averagePrice * 1.08 END AS fairValueUsd
WITH skin, instance, latest, events, currentAskUsd, fairValueUsd,
     ((fairValueUsd - currentAskUsd) / currentAskUsd) * 100 AS spreadPct
WHERE spreadPct >= $minSpreadPct
RETURN skin, instance, latest, events, currentAskUsd, fairValueUsd, spreadPct
ORDER BY spreadPct DESC
LIMIT 20
```

Mapper derives:

- `confidenceScore`: simple formula from spread, event count, and risk score.
- `riskScore`: initially derived from whether trader path has suspicious traders or cycles.
- `signal`: based on spread, stickers, velocity, and market depth proxy.

### 8.2 Risk Cycles

Use existing `CONNECTED_TO` plus same instance repeated transactions.

Basic query shape:

```cypher
MATCH (a:Trader)-[:CONNECTED_TO*2..4]-(a)
WITH DISTINCT a
MATCH (a)-[:SOLD|BOUGHT]->(tx:Transaction)-[:FOR_INSTANCE]->(instance:SkinInstance)-[:INSTANCE_OF]->(skin:Skin)
WITH instance, skin, collect(DISTINCT a) AS traders, collect(DISTINCT tx) AS txs
WHERE size(traders) >= 2 AND size(txs) >= 2
RETURN instance, skin, traders, txs,
       reduce(total = 0.0, tx IN txs | total + tx.priceUsd) AS valueMovedUsd
ORDER BY valueMovedUsd DESC
LIMIT 10
```

For better demo, the seed already includes a suspicious loop:

- `trader-shadow-a`
- `trader-shadow-b`
- `trader-shadow-c`
- `inst-ak-redline-risk`

Risk score formula for MVP:

```txt
base 50
+ 20 if trader count >= 3
+ 15 if transactions happen within 24h
+ 10 if same instance returns to original trader
+ 5 if price variance is abnormal
max 100
```

### 8.3 Market Pulse

Calculate:

- `trackedVolumeUsd`: sum of transaction price.
- `dealsDetected`: count opportunities above threshold.
- `averageSpreadPct`: average spread from opportunity query.
- `suspiciousCycles`: count risk cycles.
- `activeTraders`: count traders.

---

## 9. Implementation Tasks

### Task 1: Add Shared Product Types

**Files:**

- Modify: `lib/types.ts`

- [ ] Add `SignalType`, `Opportunity`, `RiskCycle`, and `MarketPulse` exactly as shown in section 5.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.

Expected: TypeScript compiles with no errors.

### Task 2: Add Opportunity Query and Mapper

**Files:**

- Modify: `lib/queries.ts`
- Modify: `lib/graph-mappers.ts`

- [ ] Add `opportunitiesQuery` using the query shape in section 8.1.
- [ ] Add `mapOpportunities(records): Opportunity[]`.
- [ ] Mapper must return plain JSON only, no Neo4j integers/datetime objects.
- [ ] Signal derivation rules:
  - If spread is `>= 10`, signal is `UNDERPRICED`.
  - If event timeline has two transactions for same instance within 7 days and price increased, signal is `FAST_FLIP`.
  - If instance has stickers, signal can be `STICKER_PREMIUM`.
  - If spread is positive but confidence is low, signal is `THIN_MARKET`.
- [ ] Run `npm run build`.

Expected: build passes.

### Task 3: Add Opportunities API Route

**Files:**

- Create: `app/api/opportunities/route.ts`

- [ ] Implement `GET`.
- [ ] Parse `minSpreadPct` from query string.
- [ ] Default `minSpreadPct` to `5`.
- [ ] Return `400` if `minSpreadPct` is present but not numeric.
- [ ] Run `opportunitiesQuery` through `runQuery`.
- [ ] Return `mapOpportunities(result.records)`.
- [ ] Catch DB errors and return `{ error: "No se pudieron obtener oportunidades." }` with status `500`.
- [ ] Verify manually with `http://localhost:3000/api/opportunities` after app is running.

Expected: JSON array of opportunities.

### Task 4: Add Risk Cycle Query and Mapper

**Files:**

- Modify: `lib/queries.ts`
- Modify: `lib/graph-mappers.ts`

- [ ] Add `riskCyclesQuery` using section 8.2 as the base.
- [ ] Add `mapRiskCycles(records): RiskCycle[]`.
- [ ] Risk score must be deterministic and capped at `100`.
- [ ] Severity mapping:
  - `>= 90`: `CRITICAL`
  - `>= 75`: `HIGH`
  - `>= 60`: `MEDIUM`
  - else: `LOW`
- [ ] Evidence array should include at least:
  - trader count
  - transaction count
  - value moved
  - repeated instance
- [ ] Run `npm run build`.

Expected: build passes.

### Task 5: Add Risk Cycles API Route

**Files:**

- Create: `app/api/risk-cycles/route.ts`

- [ ] Implement `GET`.
- [ ] Parse `minRiskScore` from query string.
- [ ] Default `minRiskScore` to `60`.
- [ ] Return `400` if `minRiskScore` is present but not numeric.
- [ ] Return risk cycles filtered by minimum score.
- [ ] Catch DB errors and return `{ error: "No se pudieron obtener ciclos sospechosos." }` with status `500`.
- [ ] Verify manually with `http://localhost:3000/api/risk-cycles` after app is running.

Expected: JSON array including the shadow trader cycle from seed.

### Task 6: Add Market Pulse API Route

**Files:**

- Modify: `lib/queries.ts`
- Modify: `lib/graph-mappers.ts`
- Create: `app/api/market-pulse/route.ts`

- [ ] Add `marketPulseQuery` for tracked volume and active traders.
- [ ] Reuse opportunity/risk logic where practical, but avoid duplicate expensive code in the route.
- [ ] Add `mapMarketPulse(records): MarketPulse`.
- [ ] Route returns `MarketPulse`.
- [ ] Catch DB errors and return `{ error: "No se pudo obtener el pulso de mercado." }` with status `500`.
- [ ] Verify manually with `http://localhost:3000/api/market-pulse`.

Expected: JSON object with numeric metrics.

### Task 7: Replace Page With App Shell

**Files:**

- Create: `components/AppShell.tsx`
- Create: `components/SidebarNav.tsx`
- Create: `components/Topbar.tsx`
- Modify: `app/page.tsx`

- [ ] Use `skin-graph-radar-mockup.html` as visual reference.
- [ ] Remove explanatory sections from `app/page.tsx`.
- [ ] Keep page as a client component if it owns selected opportunity/risk state.
- [ ] Sidebar can be visual/static for now.
- [ ] Topbar filters can be visual/static for now.
- [ ] Main page should render empty/loading/error states for API-backed sections.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.

Expected: app renders dashboard shell, no “why Neo4j” or roadmap sections.

### Task 8: Build Market Pulse Cards Component

**Files:**

- Create: `components/MarketPulseCards.tsx`

- [ ] Fetch `/api/market-pulse` in a client component.
- [ ] Render tracked volume, deals detected, average spread, suspicious cycles, active traders.
- [ ] Show loading skeleton or zero state while fetching.
- [ ] Show inline error if API fails.
- [ ] Use compact number formatting.
- [ ] Run `npm run build`.

Expected: metrics come from API, not hardcoded.

### Task 9: Build Opportunity Feed Component

**Files:**

- Create: `components/OpportunityFeed.tsx`

- [ ] Fetch `/api/opportunities`.
- [ ] Render dense table matching mockup direction.
- [ ] On row click, call `onSelectOpportunity(opportunity)`.
- [ ] Highlight selected row.
- [ ] Include loading, empty, and error states.
- [ ] Do not hardcode opportunity rows.
- [ ] Run `npm run build`.

Expected: table data comes from Neo4j through API.

### Task 10: Build Risk Cycles Panel Component

**Files:**

- Create: `components/RiskCyclesPanel.tsx`

- [ ] Fetch `/api/risk-cycles`.
- [ ] Render cycle cards with severity and risk score.
- [ ] On card click, call `onSelectRiskCycle(cycle)`.
- [ ] Highlight selected cycle.
- [ ] Include loading, empty, and error states.
- [ ] Do not hardcode cycle cards.
- [ ] Run `npm run build`.

Expected: risk cards come from Neo4j through API.

### Task 11: Build Selected Asset Drawer

**Files:**

- Create: `components/SelectedAssetDrawer.tsx`

- [ ] Accept either selected `Opportunity` or selected `RiskCycle`.
- [ ] If no selection, show a useful default state.
- [ ] For opportunity, show market read, signal, trader path, event timeline.
- [ ] For risk cycle, show severity, risk score, trader path, evidence.
- [ ] Do not fetch inside drawer initially; use selected object data.
- [ ] Run `npm run build`.

Expected: drawer updates when user selects a feed row or risk cycle card.

### Task 12: Build Graph Insight Panel

**Files:**

- Create: `components/GraphInsightPanel.tsx`
- Modify: `app/api/graph/route.ts`
- Modify: `lib/queries.ts`
- Modify: `lib/graph-mappers.ts`

- [ ] Accept selected opportunity/risk cycle from page state.
- [ ] Fetch graph by `instanceId` when available.
- [ ] Extend `/api/graph` to accept `instanceId`.
- [ ] Return `400` if no `skinId` or `instanceId` is provided.
- [ ] Use Cytoscape to render nodes by type.
- [ ] Use risk-colored styling for suspicious cycles.
- [ ] Include loading, empty, and error states.
- [ ] Run `npm run build`.

Expected: graph updates based on selected opportunity or cycle.

### Task 13: Styling Pass

**Files:**

- Modify: `app/globals.css`

- [ ] Replace landing-style visual hierarchy with app shell styles.
- [ ] Use dark premium/cyber palette:
  - near-black background
  - petroleum blue panels
  - cyan for data
  - green for opportunity
  - amber for caution
  - red for risk
- [ ] Ensure desktop layout has sidebar, main, drawer.
- [ ] Ensure mobile layout stacks sections without horizontal overflow.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.

Expected: visual direction resembles `skin-graph-radar-mockup.html` but implemented in React.

### Task 14: Extend Seed Data If Needed

**Files:**

- Modify: `data/seed-transactions.json`
- Modify: `scripts/seed-neo4j.ts` only if new properties are required.

- [ ] Run `npm run seed`.
- [ ] Confirm `/api/opportunities` returns at least 4 opportunities.
- [ ] Confirm `/api/risk-cycles` returns at least 1 high/critical cycle.
- [ ] If not enough data is returned, add more transactions to seed JSON.
- [ ] Keep fake data realistic and internally consistent.

Expected: dashboard is populated after seed.

### Task 15: Documentation Update

**Files:**

- Create: `docs/skingraph-radar-product.md`
- Modify: `README.md`

- [ ] Document the product direction.
- [ ] Document data source strategy: seed now, ingestion later.
- [ ] Document new API endpoints.
- [ ] Document how to run:
  - `docker start cs2-neo4j`
  - `npm run seed`
  - `npm run dev`
- [ ] Run `npm run build`.

Expected: another developer/model can understand how to run and continue the work.

### Task 16: End-to-End Verification

**Files:**

- No planned file changes unless verification finds issues.

- [ ] Start Neo4j:

```powershell
docker start cs2-neo4j
```

- [ ] Seed data:

```powershell
npm run seed
```

Expected: `Seed complete: ...`

- [ ] Start app:

```powershell
npm run dev
```

- [ ] Open `http://localhost:3000`.
- [ ] Confirm Market Pulse cards show non-zero metrics.
- [ ] Confirm Opportunity Feed shows API-backed rows.
- [ ] Confirm Risk Cycles shows at least one cycle.
- [ ] Click an opportunity and confirm drawer updates.
- [ ] Click a risk cycle and confirm drawer updates.
- [ ] Confirm graph updates for selected item.
- [ ] Run final checks:

```powershell
npm run lint
npm run build
```

Expected: both pass.

---

## 10. Implementation Notes For The Next Model

- Speak Spanish to the user.
- Do not build explanatory marketing sections.
- Do not mention Neo4j as a selling section in the UI.
- Do use Neo4j in the implementation for paths, cycles, relationships, and derived data.
- Preserve `skin-graph-radar-mockup.html` as a visual reference.
- Keep the current MVP working while replacing the visible homepage.
- Prefer small components and typed API responses.
- Avoid adding auth, payments, scraping, external APIs, or deployment in this phase.
- If an endpoint cannot derive perfect real-world values from seed data, create deterministic demo calculations in mappers, not hardcoded UI rows.

---

## 11. Success Criteria

The phase is complete when:

- Homepage feels like a real app shell, not a landing page.
- Opportunity Feed is populated from `/api/opportunities`.
- Risk Cycles is populated from `/api/risk-cycles`.
- Market Pulse is populated from `/api/market-pulse`.
- Drawer updates from user selection.
- Graph updates from user selection.
- Seed data demonstrates at least:
  - one profitable flip
  - one suspicious cycle
  - one sticker/collector premium case
  - one thin-market or caution case
- `npm run seed`, `npm run lint`, and `npm run build` pass with Neo4j running.

---

## 12. Suggested Execution Order

1. Types.
2. Queries/mappers.
3. API routes.
4. Verify APIs manually.
5. App shell layout.
6. Market pulse component.
7. Opportunity feed component.
8. Risk cycles component.
9. Drawer component.
10. Graph insight component.
11. Styling pass.
12. Seed adjustments.
13. Documentation.
14. Full verification.
