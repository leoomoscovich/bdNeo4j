# CS2 Skin Graph Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fullstack Next.js web app for visually exploring CS2 skins, traders, marketplaces and transactions using Neo4j as the core graph database.

**Architecture:** The app will use Next.js fullstack with App Router. API routes will query Neo4j through the official Neo4j JavaScript driver. The frontend will render a visual graph explorer using Cytoscape.js, plus panels for metrics, search, filters and node details.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, Neo4j, Neo4j JavaScript Driver, Cytoscape.js.

---

## 1. Product Scope

Build an MVP inspired by CSFloat, but focused on graph-based market intelligence.

The app must show:

- CS2 skin search.
- Visual graph around a selected skin.
- Traders connected to transactions.
- Marketplaces connected to sales.
- Skin instance history.
- Basic market metrics.
- Detail panel when selecting a graph node.
- Example insights powered by Neo4j relationships.

Out of scope for MVP:

- Login.
- Payments.
- Live scraping.
- Real CSFloat integration.
- User-generated watchlists.
- Production deployment.
- Advanced fraud detection.

---

## 2. Recommended Project Structure

```txt
/
  app/
    layout.tsx
    page.tsx
    api/
      graph/
        route.ts
      skins/
        route.ts
      metrics/
        route.ts
      node/
        route.ts

  components/
    HeroSection.tsx
    MetricCards.tsx
    SkinSearch.tsx
    FilterSidebar.tsx
    GraphExplorer.tsx
    NodeDetailsPanel.tsx
    Neo4jValueSection.tsx
    RoadmapSection.tsx

  lib/
    neo4j.ts
    queries.ts
    graph-mappers.ts
    types.ts

  scripts/
    seed-neo4j.ts

  data/
    seed-skins.json
    seed-traders.json
    seed-transactions.json

  docs/
    graph-model.md
    cypher-queries.md
```

---

## 3. Neo4j Graph Model

### Nodes

```txt
Skin
SkinInstance
Trader
Transaction
Marketplace
Weapon
Collection
Sticker
PriceSnapshot
```

### Relationships

```cypher
(:Skin)-[:BELONGS_TO]->(:Collection)
(:Skin)-[:FOR_WEAPON]->(:Weapon)
(:SkinInstance)-[:INSTANCE_OF]->(:Skin)
(:SkinInstance)-[:HAS_STICKER]->(:Sticker)
(:Trader)-[:BOUGHT]->(:Transaction)
(:Trader)-[:SOLD]->(:Transaction)
(:Transaction)-[:FOR_INSTANCE]->(:SkinInstance)
(:Transaction)-[:ON_MARKETPLACE]->(:Marketplace)
(:Skin)-[:HAS_PRICE]->(:PriceSnapshot)
(:Trader)-[:CONNECTED_TO]->(:Trader)
```

### Why Neo4j Matters

Neo4j is useful because the product is about relationships:

- Which traders are connected?
- How did a skin move through the market?
- Which marketplaces had the same item?
- Which skins are similar by behavior, not just name?
- Which transaction paths look suspicious?
- Which traders frequently flip skins?

---

## 4. Initial Data Strategy

Use local seed data first.

Reasons:

- Faster MVP.
- No dependency on external APIs.
- No legal or rate-limit issues.
- Easier to shape graph relationships.
- Better for validating the product idea.

Seed data should include:

- 10-20 skins.
- 20-40 skin instances.
- 10 traders.
- 3 marketplaces.
- 50-100 transactions.
- Several collections, weapons and stickers.
- A few intentionally suspicious transaction loops.
- A few profitable flip examples.

---

## 5. Main API Routes

### `GET /api/skins`

Returns searchable skins.

Response shape:

```ts
type SkinSearchResult = {
  id: string;
  name: string;
  weapon: string;
  collection: string;
  rarity: string;
  imageUrl?: string;
};
```

### `GET /api/graph?skinId=...`

Returns graph nodes and edges around a selected skin.

Response shape:

```ts
type GraphResponse = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

type GraphNode = {
  id: string;
  label: string;
  type: "skin" | "instance" | "trader" | "transaction" | "marketplace" | "collection" | "sticker";
  data: Record<string, string | number | boolean | null>;
};

type GraphEdge = {
  id: string;
  source: string;
  target: string;
  label: string;
  type: string;
};
```

### `GET /api/node?id=...&type=...`

Returns detailed data for one selected node.

### `GET /api/metrics`

Returns dashboard metrics:

```ts
type MetricsResponse = {
  skinsIndexed: number;
  transactionsTracked: number;
  activeTraders: number;
  estimatedVolumeUsd: number;
};
```

---

## 6. Core Cypher Queries

### Search skins

```cypher
MATCH (s:Skin)-[:FOR_WEAPON]->(w:Weapon)
OPTIONAL MATCH (s)-[:BELONGS_TO]->(c:Collection)
WHERE toLower(s.name) CONTAINS toLower($query)
RETURN s, w, c
LIMIT 20
```

### Graph around skin

```cypher
MATCH path = (s:Skin {id: $skinId})<-[:INSTANCE_OF]-(i:SkinInstance)
             <-[:FOR_INSTANCE]-(tx:Transaction)
             -[:ON_MARKETPLACE]->(m:Marketplace)
OPTIONAL MATCH (buyer:Trader)-[:BOUGHT]->(tx)
OPTIONAL MATCH (seller:Trader)-[:SOLD]->(tx)
RETURN path, buyer, seller
LIMIT 80
```

### Trader activity

```cypher
MATCH (t:Trader)-[:BOUGHT|SOLD]->(tx:Transaction)
RETURN t, count(tx) AS transactionCount
ORDER BY transactionCount DESC
LIMIT 10
```

### Flip detection

```cypher
MATCH (buyTx:Transaction)-[:FOR_INSTANCE]->(i:SkinInstance)<-[:FOR_INSTANCE]-(sellTx:Transaction)
WHERE buyTx.timestamp < sellTx.timestamp
  AND sellTx.priceUsd > buyTx.priceUsd
RETURN i, buyTx, sellTx, sellTx.priceUsd - buyTx.priceUsd AS profit
ORDER BY profit DESC
LIMIT 20
```

### Suspicious cycles

```cypher
MATCH cycle = (a:Trader)-[:CONNECTED_TO*2..5]-(a)
RETURN cycle
LIMIT 20
```

---

## 7. UI Components

### `HeroSection.tsx`

Purpose:

- Present the concept.
- Explain that this is a graph-based CS2 skin intelligence tool.
- Link to graph explorer section.

### `MetricCards.tsx`

Purpose:

- Show number of skins, transactions, traders and estimated volume.
- Fetch from `/api/metrics`.

### `SkinSearch.tsx`

Purpose:

- Search skins by name.
- Call `/api/skins`.
- Let user select a skin.
- Trigger graph reload.

### `FilterSidebar.tsx`

Purpose:

- Display initial visual filters.
- MVP filters can be UI-only first.
- Later filters can affect API queries.

### `GraphExplorer.tsx`

Purpose:

- Render Cytoscape graph.
- Display nodes by type with distinct colors.
- Handle node click.
- Send selected node to `NodeDetailsPanel`.

### `NodeDetailsPanel.tsx`

Purpose:

- Show selected node data.
- Show transaction timeline for skin instances.
- Show trader stats for trader nodes.
- Show marketplace stats for marketplace nodes.

### `Neo4jValueSection.tsx`

Purpose:

- Explain the concrete graph queries enabled by Neo4j.
- Show 3-4 example insights.

---

## 8. Implementation Phases

### Phase 1: Project Setup

- Create Next.js app with TypeScript.
- Install Tailwind CSS.
- Install `neo4j-driver`.
- Install `cytoscape`.
- Add `.env.local.example`.

Required env vars:

```env
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=password
```

### Phase 2: Neo4j Connection

Create `lib/neo4j.ts`.

Responsibilities:

- Create one Neo4j driver instance.
- Export `runQuery`.
- Close sessions correctly.
- Avoid creating one driver per request.

### Phase 3: Seed Script

Create `scripts/seed-neo4j.ts`.

Responsibilities:

- Clear existing demo data.
- Create constraints.
- Insert weapons, collections, skins, traders, marketplaces, transactions.
- Create relationships.

### Phase 4: API Routes

Build:

- `/api/skins`
- `/api/graph`
- `/api/node`
- `/api/metrics`

Each route should:

- Validate query params.
- Run Cypher through `lib/neo4j.ts`.
- Return typed JSON.
- Return meaningful errors.

### Phase 5: Frontend Layout

Convert the existing HTML mockup into React components.

Keep the same visual direction:

- Dark CS2-inspired theme.
- Orange/gold highlights.
- Graph-first dashboard.
- Responsive layout.

### Phase 6: Graph Integration

Use Cytoscape.js.

Graph behavior:

- Different node colors by type.
- Click node to update details panel.
- Initial selected skin appears centered.
- Edges show relationship names.
- Layout can use `cose` or `breadthfirst`.

### Phase 7: Verification

Manual checks:

- App starts locally.
- Neo4j connection works.
- Seed script creates data.
- `/api/skins` returns skins.
- `/api/graph?skinId=...` returns nodes and edges.
- Clicking graph nodes updates details panel.
- Layout works on desktop and mobile.

Automated checks:

- TypeScript build passes.
- Lint passes if configured.
- API mapping functions have basic tests if test framework is added.

---

## 9. Development Commands

Expected commands:

```bash
npm install
npm run dev
npm run build
```

Seed command to add later:

```bash
npm run seed
```

Neo4j local via Docker:

```bash
docker run \
  --name cs2-neo4j \
  -p 7474:7474 \
  -p 7687:7687 \
  -e NEO4J_AUTH=neo4j/password \
  neo4j:latest
```

Neo4j Browser:

```txt
http://localhost:7474
```

---

## 10. MVP Success Criteria

The MVP is complete when:

- The app runs locally.
- Neo4j stores the demo graph.
- The homepage visually resembles the approved mockup.
- A user can search/select a skin.
- The app renders a graph from Neo4j data.
- Clicking a node shows details.
- At least 4 Neo4j-powered insights are represented:
  - Skin history.
  - Trader connections.
  - Marketplace transaction context.
  - Flip or suspicious pattern detection.

---

## 11. Recommended First Build Order

1. Scaffold Next.js.
2. Add Tailwind and base theme.
3. Add Neo4j connection.
4. Add seed data.
5. Add seed script.
6. Add `/api/metrics`.
7. Add `/api/skins`.
8. Add `/api/graph`.
9. Build homepage layout.
10. Build graph explorer.
11. Connect search to graph.
12. Add node details panel.
13. Add docs.
14. Run full local verification.

---

## 12. Detailed Task Plan

### Task 1: Scaffold Next.js App

**Files:**

- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `app/globals.css`
- Create: `.env.local.example`

- [ ] Create a Next.js app with TypeScript and App Router.
- [ ] Install `next`, `react`, `react-dom`, `typescript`, `tailwindcss`, `neo4j-driver`, `cytoscape`.
- [ ] Add npm scripts for `dev`, `build`, `start`, `lint` and `seed`.
- [ ] Add the global dark CS2-inspired visual theme.
- [ ] Verify `npm run dev` starts the app.

### Task 2: Add Neo4j Access Layer

**Files:**

- Create: `lib/neo4j.ts`
- Create: `lib/types.ts`

- [ ] Define shared response types for skins, graph nodes, graph edges and metrics.
- [ ] Create one Neo4j driver singleton using env vars.
- [ ] Add a `runQuery` helper that opens and closes sessions safely.
- [ ] Return clear errors when required env vars are missing.

### Task 3: Add Seed Data and Seed Script

**Files:**

- Create: `data/seed-skins.json`
- Create: `data/seed-traders.json`
- Create: `data/seed-transactions.json`
- Create: `scripts/seed-neo4j.ts`

- [ ] Create demo skins, traders, marketplaces, collections and transactions.
- [ ] Include at least one profitable flip example.
- [ ] Include at least one suspicious trader loop example.
- [ ] Create constraints for stable IDs.
- [ ] Clear and reseed demo data with `npm run seed`.

### Task 4: Add Cypher Queries and Mappers

**Files:**

- Create: `lib/queries.ts`
- Create: `lib/graph-mappers.ts`

- [ ] Add query for skin search.
- [ ] Add query for graph around selected skin.
- [ ] Add query for metrics.
- [ ] Add query for node details.
- [ ] Convert Neo4j records into plain JSON safe for API responses.

### Task 5: Add API Routes

**Files:**

- Create: `app/api/skins/route.ts`
- Create: `app/api/graph/route.ts`
- Create: `app/api/metrics/route.ts`
- Create: `app/api/node/route.ts`

- [ ] Implement `/api/skins` with optional `q` parameter.
- [ ] Implement `/api/graph` with required `skinId` parameter.
- [ ] Implement `/api/metrics`.
- [ ] Implement `/api/node` with required `id` and `type` parameters.
- [ ] Return `400` for missing required query params.
- [ ] Return `500` with safe error message for unexpected database errors.

### Task 6: Convert Mockup into React Components

**Files:**

- Create: `components/HeroSection.tsx`
- Create: `components/MetricCards.tsx`
- Create: `components/SkinSearch.tsx`
- Create: `components/FilterSidebar.tsx`
- Create: `components/Neo4jValueSection.tsx`
- Create: `components/RoadmapSection.tsx`
- Modify: `app/page.tsx`
- Modify: `app/globals.css`

- [ ] Port the approved HTML style into reusable React components.
- [ ] Keep the same visual direction: dark background, orange/gold highlights, graph-first layout.
- [ ] Make the layout responsive for desktop and mobile.

### Task 7: Add Interactive Graph Explorer

**Files:**

- Create: `components/GraphExplorer.tsx`
- Create: `components/NodeDetailsPanel.tsx`
- Modify: `app/page.tsx`

- [ ] Render Cytoscape inside `GraphExplorer`.
- [ ] Fetch `/api/graph` when a skin is selected.
- [ ] Style nodes by type.
- [ ] Style edges by relationship label.
- [ ] Update `NodeDetailsPanel` when a user clicks a node.

### Task 8: Connect Search and Metrics

**Files:**

- Modify: `components/SkinSearch.tsx`
- Modify: `components/MetricCards.tsx`
- Modify: `app/page.tsx`

- [ ] Fetch skins from `/api/skins`.
- [ ] Select a default skin on initial load.
- [ ] Fetch metrics from `/api/metrics`.
- [ ] Show loading and empty states.
- [ ] Avoid crashing when Neo4j is unavailable; show a useful error state.

### Task 9: Add Documentation

**Files:**

- Create: `README.md`
- Create: `docs/graph-model.md`
- Create: `docs/cypher-queries.md`

- [ ] Document setup commands.
- [ ] Document Neo4j Docker startup.
- [ ] Document required env vars.
- [ ] Document seed command.
- [ ] Document graph model and core queries.

### Task 10: Verify MVP End-to-End

**Files:**

- No required file changes unless verification reveals issues.

- [ ] Run `npm run seed`.
- [ ] Run `npm run dev`.
- [ ] Open the app locally.
- [ ] Confirm skin search returns results.
- [ ] Confirm graph loads from Neo4j.
- [ ] Confirm node click updates details panel.
- [ ] Run `npm run build`.
- [ ] Fix any TypeScript or build errors.

---

## 13. Future Features

After MVP:

- Real market data ingestion.
- Scheduled price snapshots.
- Watchlists.
- Deal alerts.
- Trader profiles.
- Skin provenance pages.
- Advanced anomaly detection.
- Public shareable graph views.
- Authentication.
- User saved searches.
- Deployment to production.
