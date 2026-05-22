# SkinGraph Radar — Product Direction

## 1. Product Overview

**SkinGraph Radar** is a market intelligence dashboard for CS2 skins, powered by a Neo4j graph database. It treats skins, instances, traders, transactions, and marketplaces as a connected graph — enabling opportunity detection and risk analysis that flat databases cannot provide.

The app is inspired by platforms like CSFloat but differentiates itself through **graph-powered signals**: profitable flips, suspicious wash-trade cycles, sticker premiums, and thin-market arbitrage — all surfaced as actionable insights.

**Vision:** Become the go-to tool for CS2 skin traders who want to see *relationships* in the market, not just listings.

## 2. Target User Questions

SkinGraph Radar answers:

- **What should I buy right now?** → Underpriced instances, fast flips, sticker premiums.
- **Is this deal suspicious?** → Wash-trade cycles, coordinated trader networks.
- **What's the market doing?** → Volume, spread, active traders, deal velocity.
- **How is this skin connected?** → Full graph view: instances, traders, transactions, marketplaces.
- **What's the fair value?** → Graph-derived pricing vs. current ask.

## 3. Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Next.js App                       │
│  ┌───────────┐  ┌──────────────┐  ┌───────────────┐ │
│  │  UI Pages │  │  API Routes  │  │  Cytoscape.js │ │
│  │  (React)  │◄─┤  (REST GET)  │  │  (Graph Viz)  │ │
│  └───────────┘  └──────┬───────┘  └───────────────┘ │
│                        │                             │
│              ┌─────────▼─────────┐                   │
│              │   neo4j-driver    │                   │
│              │   (singleton)     │                   │
│              └─────────┬─────────┘                   │
└────────────────────────┼────────────────────────────┘
                         │ bolt://
                ┌────────▼────────┐
                │    Neo4j DB     │
                │  (Docker local) │
                │   :7687 / :7474 │
                └─────────────────┘
```

**Data flow:** Seed data → Neo4j → API routes → React UI / Cytoscape graph.

## 4. Data Source Strategy

### Current Phase: Local Seed

- All data comes from `scripts/seed.ts`, which populates Neo4j with demo data.
- Includes realistic skins, instances, traders, transactions, and marketplaces.
- Pre-seeded signals: profitable flips, suspicious cycles, sticker premiums.
- No external APIs or scraping required for MVP.

### Future Phase: Live Ingestion

- Replace or supplement seed with real data ingestion from:
  - CSFloat API (listings, sales history)
  - Steam Community Market (pricing)
  - Third-party marketplaces (Buff, Skinport)
- Ingestion strategy: periodic sync jobs → Neo4j upserts → API serves fresh data.
- Graph relationships emerge naturally from transaction history.

### Data Model

See `docs/graph-model.md` for the complete node/relationship reference.

**Core nodes:** `Skin`, `SkinInstance`, `Trader`, `Transaction`, `Marketplace`, `Weapon`, `Collection`, `Sticker`, `PriceSnapshot`

**Core relationships:** `BELONGS_TO`, `FOR_WEAPON`, `INSTANCE_OF`, `HAS_STICKER`, `BOUGHT`, `SOLD`, `FOR_INSTANCE`, `ON_MARKETPLACE`, `HAS_PRICE`, `CONNECTED_TO`

## 5. API Endpoints

| Method | Path | Params | Description |
|--------|------|--------|-------------|
| `GET` | `/api/skins` | `q` (optional) | Search skins by name/query |
| `GET` | `/api/graph` | `skinId` or `instanceId` (required) | Get graph data (nodes + edges) around a skin or instance |
| `GET` | `/api/node` | `id` (required), `type` (required) | Get details for a specific node |
| `GET` | `/api/metrics` | — | Get indexed metrics (skins, transactions, traders, volume) |
| `GET` | `/api/opportunities` | `minSpreadPct` (default: 5) | Get trading opportunity feed with spread, signal, confidence, risk |
| `GET` | `/api/risk-cycles` | `minRiskScore` (default: 60) | Get suspicious transaction cycles with trader paths and severity |
| `GET` | `/api/market-pulse` | — | Get real-time market pulse (volume, deals, spread, cycles, traders) |

**Error handling:** Missing required params return `400`. Database failures return `500` with safe error messages (no internal details leaked).

### Key Response Types

- **`Opportunity`** — `skinName`, `weapon`, `wear`, `float`, `marketplace`, `currentAskUsd`, `fairValueUsd`, `spreadPct`, `confidenceScore`, `riskScore`, `signal` (UNDERPRICED | FAST_FLIP | STICKER_PREMIUM | LOW_FLOAT_PREMIUM | THIN_MARKET | RISK_ADJUSTED)
- **`RiskCycle`** — `skinName`, `traderPath`, `valueMovedUsd`, `timeWindowHours`, `riskScore`, `severity` (LOW | MEDIUM | HIGH | CRITICAL), `evidence`
- **`MarketPulse`** — `trackedVolumeUsd`, `dealsDetected`, `averageSpreadPct`, `suspiciousCycles`, `activeTraders`

## 6. How to Run Locally

### Prerequisites

- Node.js 20+
- Docker (for Neo4j)

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Start Neo4j (first time)
docker run --name cs2-neo4j -p 7474:7474 -p 7687:7687 -e NEO4J_AUTH=neo4j/password neo4j:latest

# 2b. Or restart existing container
docker start cs2-neo4j

# 3. Seed demo data
npm run seed

# 4. Start dev server
npm run dev
```

Open `http://localhost:3000` for the app.
Open `http://localhost:7474` for Neo4j Browser (user: `neo4j`, password: `password`).

### Environment Variables

Default values work out of the box. Override via `.env.local`:

```env
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=password
```

### Production Build

```bash
npm run build
npm run start
```

## 7. Out of Scope (Current Phase)

- User authentication / accounts
- Payment processing
- Real-time API scraping or external integrations
- CSFloat / Steam API integration
- Deployment / hosting setup
- Mobile app
- Advanced analytics / ML predictions

## 8. Future Roadmap

| Phase | Focus |
|-------|-------|
| **v0.2** | Real data ingestion from CSFloat API, automated sync jobs |
| **v0.3** | User accounts, watchlists, price alerts |
| **v0.4** | Advanced graph queries: community detection, centrality scores |
| **v0.5** | Historical trend charts, portfolio tracking |
| **v1.0** | Production deployment, rate limiting, caching layer |

## 9. Project Structure

```
├── app/                    # Next.js App Router
│   ├── api/                # API routes (skins, graph, node, metrics, opportunities, risk-cycles, market-pulse)
│   └── page.tsx            # Main dashboard page
├── components/             # React components
│   ├── AppShell.tsx        # Main layout (sidebar + topbar + content)
│   ├── SidebarNav.tsx      # Navigation sidebar
│   ├── Topbar.tsx          # Search + filters bar
│   ├── MarketPulseCards.tsx # 5 metric cards from /api/market-pulse
│   ├── OpportunityFeed.tsx # Dense table from /api/opportunities
│   ├── RiskCyclesPanel.tsx # Risk cards from /api/risk-cycles
│   ├── SelectedAssetDrawer.tsx # Right drawer for selected item
│   └── GraphInsightPanel.tsx   # Cytoscape.js graph visualization
├── lib/
│   ├── neo4j.ts            # Neo4j driver singleton
│   ├── queries.ts          # Cypher query definitions
│   ├── graph-mappers.ts    # Record → typed response mappers
│   └── types.ts            # Shared TypeScript types
├── scripts/
│   └── seed.ts             # Demo data seeder
├── docs/
│   ├── graph-model.md      # Node/relationship reference
│   ├── cypher-queries.md   # Cypher query documentation
│   └── skingraph-radar-product.md  # This file
└── README.md               # Quick start guide
```
