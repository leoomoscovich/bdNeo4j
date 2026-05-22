# SkinGraph Real Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert SkinGraph Radar from a functional demo dashboard into a real CS2 skin market intelligence website where every visible navigation item, filter and action performs useful product work.

**Architecture:** Keep Next.js App Router as the fullstack layer and Neo4j as the shared product data store. Persist shared market data, scans, opportunities and risk signals in Neo4j; keep anonymous user preferences such as watchlist, filters and comparison selections in `localStorage` until login exists.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, Neo4j, `neo4j-driver`, Cytoscape.js, browser `localStorage`.

---

## File Structure

- Modify: `app/page.tsx`
  - Owns the active workspace, selected opportunity, selected risk cycle, filters, drawer state and comparison state.
- Modify: `components/AppShell.tsx`
  - Passes active navigation, marketplace filters and scan state into sidebar and topbar.
- Modify: `components/SidebarNav.tsx`
  - Turns workspace buttons, marketplace toggles and deep scan into real controls.
- Modify: `components/Topbar.tsx`
  - Turns search and visible filter pills into state-backed controls.
- Modify: `components/OpportunityFeed.tsx`
  - Accepts filters and search text, calls filtered `/api/opportunities`, and makes signal tabs functional.
- Modify: `components/RiskCyclesPanel.tsx`
  - Accepts filters and search text, calls filtered `/api/risk-cycles`, and drives selected risk cycle state.
- Modify: `components/GraphInsightPanel.tsx`
  - Supports graph targets for opportunity, risk cycle, trader, marketplace and skin.
- Modify: `components/SelectedAssetDrawer.tsx`
  - Makes `Track`, `Open graph`, `Compare` and `Export` actions functional.
- Create: `components/TraderWorkspace.tsx`
  - Shows trader ranking and lets users open trader graphs.
- Create: `components/WatchlistWorkspace.tsx`
  - Reads local watchlist ids, hydrates current data and supports remove/open graph/compare.
- Create: `components/CompareWorkspace.tsx`
  - Shows side-by-side selected opportunities or assets.
- Create: `lib/ui-state.ts`
  - Defines workspace ids, filter types, graph targets, local storage keys and helpers.
- Create: `lib/local-preferences.ts`
  - Wraps `localStorage` access for watchlist, filters and comparison ids.
- Modify: `lib/types.ts`
  - Adds `TraderSummary`, `ScanSummary`, `CompareResponse`, filter types and export types.
- Modify: `lib/queries.ts`
  - Adds trader, scan, compare and expanded graph queries.
- Modify: `lib/graph-mappers.ts`
  - Adds mapping for trader summaries, scan summaries and compare results.
- Create: `app/api/traders/route.ts`
  - Returns trader rankings with optional query and marketplace filters.
- Create: `app/api/traders/[id]/route.ts`
  - Returns one trader profile.
- Create: `app/api/scans/route.ts`
  - `POST` creates a scan record and returns scan summary.
- Create: `app/api/scans/latest/route.ts`
  - Returns latest scan summary.
- Create: `app/api/compare/route.ts`
  - Returns normalized comparison data for selected ids.
- Create: `app/api/export/route.ts`
  - Returns JSON or CSV for opportunities or risk cycles using current filters.
- Modify: `app/api/opportunities/route.ts`
  - Adds marketplace, signal, rarity, float, risk and query filters.
- Modify: `app/api/risk-cycles/route.ts`
  - Adds severity, marketplace, time-window and query filters.
- Modify: `app/api/graph/route.ts`
  - Adds graph targets for trader, cycle and marketplace.
- Modify: `app/api/market-pulse/route.ts`
  - Applies active marketplace and risk filters.
- Modify: `scripts/seed-neo4j.ts`
  - Seeds scan data, trader metadata and richer marketplace examples.
- Modify: `README.md`
  - Documents the real website direction, APIs and interaction contract.

---

## Task 1: Define Product UI State

**Files:**
- Create: `lib/ui-state.ts`
- Create: `lib/local-preferences.ts`
- Modify: `lib/types.ts`

- [ ] Add shared workspace and filter types in `lib/ui-state.ts`.

```ts
export type WorkspaceId =
  | "dashboard"
  | "market-radar"
  | "risk-cycles"
  | "graph-explorer"
  | "traders"
  | "watchlist"
  | "compare";

export type MarketplaceId = "CSFloat" | "BUFF163" | "Skinport";

export type SignalFilter =
  | "ALL"
  | "UNDERPRICED"
  | "FAST_FLIP"
  | "STICKER_PREMIUM"
  | "LOW_FLOAT_PREMIUM"
  | "THIN_MARKET"
  | "RISK_ADJUSTED";

export type AppFilters = {
  query: string;
  marketplaces: MarketplaceId[];
  signal: SignalFilter;
  minSpreadPct: number;
  maxRiskScore: number;
};

export type GraphTarget =
  | { type: "opportunity"; instanceId: string; label: string }
  | { type: "risk-cycle"; cycleId: string; instanceId: string; label: string }
  | { type: "trader"; traderId: string; label: string }
  | { type: "marketplace"; marketplaceId: string; label: string }
  | { type: "skin"; skinId: string; label: string };

export const defaultFilters: AppFilters = {
  query: "",
  marketplaces: ["CSFloat", "BUFF163", "Skinport"],
  signal: "ALL",
  minSpreadPct: 5,
  maxRiskScore: 100,
};
```

- [ ] Add browser preference helpers in `lib/local-preferences.ts`.

```ts
const WATCHLIST_KEY = "skingraph.watchlist.v1";
const COMPARE_KEY = "skingraph.compare.v1";

function readStringArray(key: string): string[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function writeStringArray(key: string, values: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify([...new Set(values)]));
}

export function getWatchlistIds() {
  return readStringArray(WATCHLIST_KEY);
}

export function toggleWatchlistId(id: string) {
  const current = getWatchlistIds();
  const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
  writeStringArray(WATCHLIST_KEY, next);
  return next;
}

export function getCompareIds() {
  return readStringArray(COMPARE_KEY);
}

export function setCompareIds(ids: string[]) {
  writeStringArray(COMPARE_KEY, ids.slice(0, 4));
}
```

- [ ] Extend `lib/types.ts` with product API response types.

```ts
export type TraderSummary = {
  id: string;
  handle: string;
  transactionCount: number;
  volumeUsd: number;
  avgMarginPct: number;
  riskScore: number;
  marketplaces: string[];
};

export type ScanSummary = {
  id: string;
  status: "COMPLETED" | "RUNNING" | "FAILED";
  startedAt: string;
  completedAt?: string;
  opportunitiesFound: number;
  riskCyclesFound: number;
  marketplacesScanned: string[];
};

export type CompareItem = {
  id: string;
  label: string;
  marketplace: string;
  askUsd: number;
  fairValueUsd: number;
  spreadPct: number;
  riskScore: number;
  signal: string;
};

export type CompareResponse = {
  items: CompareItem[];
};
```

- [ ] Run `npm run build`.

Expected: TypeScript accepts the new exported types even before they are consumed.

---

## Task 2: Expand Backend API Surface

**Files:**
- Modify: `lib/queries.ts`
- Modify: `lib/graph-mappers.ts`
- Create: `app/api/traders/route.ts`
- Create: `app/api/traders/[id]/route.ts`
- Create: `app/api/scans/route.ts`
- Create: `app/api/scans/latest/route.ts`
- Create: `app/api/compare/route.ts`
- Create: `app/api/export/route.ts`
- Modify: `app/api/opportunities/route.ts`
- Modify: `app/api/risk-cycles/route.ts`
- Modify: `app/api/graph/route.ts`
- Modify: `app/api/market-pulse/route.ts`

- [ ] Add request validation for all new query params.

Required behavior:

- `marketplaces` is a comma-separated allowlist of `CSFloat`, `BUFF163`, `Skinport`.
- numeric filters return `400` when not numeric.
- export `format` must be `json` or `csv`.
- compare requires at least two ids and at most four ids.
- graph requires exactly one target id: `skinId`, `instanceId`, `traderId`, `cycleId` or `marketplaceId`.

- [ ] Add filtered opportunity query support.

Required filters:

- `q`
- `marketplaces`
- `signal`
- `minSpreadPct`
- `maxRiskScore`

- [ ] Add filtered risk cycle query support.

Required filters:

- `q`
- `marketplaces`
- `minRiskScore`
- `severity`
- `timeWindowHours`

- [ ] Add trader ranking endpoint.

`GET /api/traders?q=&marketplaces=` returns `TraderSummary[]`.

- [ ] Add scan endpoints.

`POST /api/scans` creates a `ScanRun` node in Neo4j with status `COMPLETED` for the first implementation, plus counts from current opportunity and risk queries.

`GET /api/scans/latest` returns the newest scan.

- [ ] Add compare endpoint.

`GET /api/compare?ids=id1,id2` returns `CompareResponse`.

- [ ] Add export endpoint.

`GET /api/export?type=opportunities&format=csv` returns `text/csv`.

`GET /api/export?type=cycles&format=json` returns JSON.

- [ ] Run focused API checks through the browser or terminal after `npm run dev`.

Expected examples:

```txt
/api/opportunities?marketplaces=CSFloat&minSpreadPct=8
/api/risk-cycles?minRiskScore=70
/api/traders
/api/compare?ids=opp-1,opp-2
/api/export?type=opportunities&format=json
```

---

## Task 3: Make App Navigation Real

**Files:**
- Modify: `app/page.tsx`
- Modify: `components/AppShell.tsx`
- Modify: `components/SidebarNav.tsx`

- [ ] Move active workspace state into `app/page.tsx`.

Required state:

```ts
const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceId>("market-radar");
const [filters, setFilters] = useState<AppFilters>(defaultFilters);
const [graphTarget, setGraphTarget] = useState<GraphTarget | null>(null);
const [compareIds, setCompareIdsState] = useState<string[]>([]);
```

- [ ] Make sidebar workspace buttons call `setActiveWorkspace`.

Required behavior:

- `Dashboard` shows dashboard panels.
- `Market Radar` shows `OpportunityFeed`.
- `Risk Cycles` shows `RiskCyclesPanel`.
- `Graph Explorer` shows `GraphInsightPanel`.
- `Traders` shows `TraderWorkspace`.
- `Watchlist` shows `WatchlistWorkspace`.

- [ ] Make sidebar marketplace toggles update `filters.marketplaces`.

Rules:

- At least one marketplace must remain active.
- Toggling changes feed, risk cycles and market pulse.

- [ ] Make `Run deep scan` call `POST /api/scans`.

Required UI states:

- idle: button says `Run deep scan`
- running: button says `Scanning...`
- success: sidebar card shows latest scan counts
- error: sidebar card shows safe error text

- [ ] Run `npm run build`.

Expected: no prop or type errors after wiring navigation and filters.

---

## Task 4: Make Main Workspaces Functional

**Files:**
- Modify: `components/OpportunityFeed.tsx`
- Modify: `components/RiskCyclesPanel.tsx`
- Modify: `components/GraphInsightPanel.tsx`
- Create: `components/TraderWorkspace.tsx`
- Create: `components/WatchlistWorkspace.tsx`
- Create: `components/CompareWorkspace.tsx`

- [ ] Update `OpportunityFeed` props.

Required props:

```ts
type OpportunityFeedProps = {
  selectedId?: string;
  filters: AppFilters;
  onSelect: (opp: Opportunity) => void;
  onOpenGraph: (opp: Opportunity) => void;
  onCompare: (opp: Opportunity) => void;
};
```

- [ ] Make signal tabs update `filters.signal` instead of acting as static buttons.

Tabs:

- `Best` maps to `ALL`
- `Low float` maps to `LOW_FLOAT_PREMIUM`
- `Sticker premium` maps to `STICKER_PREMIUM`
- `Fast flip` maps to `FAST_FLIP`

- [ ] Update `RiskCyclesPanel` to accept `filters`.

It must pass `marketplaces`, `minRiskScore` and `q` to `/api/risk-cycles`.

- [ ] Update `GraphInsightPanel` to accept `graphTarget`.

It must call `/api/graph` with the matching id for target type.

- [ ] Create `TraderWorkspace`.

Required behavior:

- fetch `/api/traders`
- show trader handle, volume, transaction count, margin and risk score
- click trader opens drawer or graph target

- [ ] Create `WatchlistWorkspace`.

Required behavior:

- read ids from `getWatchlistIds()`
- hydrate matching opportunities through `/api/opportunities`
- show empty state when no ids exist
- support remove, open graph and compare

- [ ] Create `CompareWorkspace`.

Required behavior:

- read selected ids
- fetch `/api/compare?ids=...`
- show side-by-side metrics
- support clearing comparison

- [ ] Run `npm run build`.

Expected: all workspaces compile and navigation can render each one.

---

## Task 5: Make Topbar, Hero and Drawer Actions Real

**Files:**
- Modify: `components/Topbar.tsx`
- Modify: `app/page.tsx`
- Modify: `components/SelectedAssetDrawer.tsx`

- [ ] Make topbar search update `filters.query`.

Required behavior:

- submitting search updates active filters
- clearing the input removes query filter
- visible filter pills reflect current filters

- [ ] Wire hero actions.

Required behavior:

- `Open best opportunity`: selects the first returned opportunity and opens drawer.
- `Inspect risk cycles`: switches to `risk-cycles`.
- `Compare markets`: switches to `compare` with current comparison state.

- [ ] Wire drawer actions.

Required behavior:

- `Track`: toggles selected opportunity in local watchlist.
- `Open graph`: sets `graphTarget` and switches to `graph-explorer`.
- `Compare`: adds selected opportunity id to comparison and switches to `compare` once at least two ids exist.
- `Export`: calls `/api/export` for the selected context and downloads JSON.

- [ ] Run `npm run build`.

Expected: no unused placeholder handlers remain for visible controls.

---

## Task 6: Seed and Document Real Website Data

**Files:**
- Modify: `scripts/seed-neo4j.ts`
- Modify: `docs/graph-model.md`
- Modify: `docs/cypher-queries.md`
- Modify: `README.md`

- [ ] Add seed data for scan runs.

Create at least one `ScanRun` node with:

- `id`
- `status`
- `startedAt`
- `completedAt`
- `opportunitiesFound`
- `riskCyclesFound`

- [ ] Add trader profile metadata to seed.

Each trader should have:

- `handle`
- `riskScore`
- `region`
- `firstSeenAt`

- [ ] Document new graph labels and relationships.

Add `ScanRun` and any new relationships used by scans or comparisons.

- [ ] Document all functional controls in README.

The README should stay aligned with the interaction contract.

- [ ] Run seed and build.

```bash
npm run seed
npm run build
```

Expected:

- seed completes against local Neo4j
- build completes
- README matches actual endpoints and controls

---

## Task 7: End-to-End Verification

**Files:**
- No planned source changes unless verification finds defects.

- [ ] Start Neo4j.

```powershell
docker start cs2-neo4j
```

Expected: container starts or reports it is already running.

- [ ] Seed data.

```bash
npm run seed
```

Expected: seed script completes without Neo4j errors.

- [ ] Start app.

```bash
npm run dev
```

Expected: website runs at `http://localhost:3000`.

- [ ] Verify sidebar navigation.

Expected:

- each workspace button changes visible content
- active state follows the selected workspace

- [ ] Verify filters.

Expected:

- marketplace toggles change opportunity and risk-cycle results
- topbar search changes visible results
- signal tabs change opportunity results

- [ ] Verify actions.

Expected:

- deep scan creates and displays a scan summary
- track adds item to watchlist and survives refresh
- open graph shows the selected graph
- compare shows selected items
- export downloads valid JSON or CSV

- [ ] Run production build.

```bash
npm run build
```

Expected: build completes with no TypeScript, lint or Next.js errors.

---

## Execution Options

Plan complete and saved to `docs/superpowers/plans/2026-05-20-skingraph-real-website.md`.

1. **Subagent-Driven (recommended)** - dispatch a fresh subagent per task and review between tasks.
2. **Inline Execution** - execute tasks in this session with checkpoints.

Use Subagent-Driven when parallel implementation is approved. Use Inline Execution when keeping all edits in this one session is preferred.
