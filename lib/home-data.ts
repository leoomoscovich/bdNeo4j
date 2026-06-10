import { runQuery } from "@/lib/neo4j";
import {
  metricsQuery,
  opportunitiesQuery,
  riskCyclesQuery,
  tradersQuery,
  marketPulseQuery,
  marketPulseDealsQuery,
  marketPulseCyclesQuery,
  graphAroundTraderQuery,
} from "@/lib/queries";
import {
  mapMetrics,
  mapOpportunities,
  mapRiskCycles,
  mapTraders,
  mapMarketPulse,
  mapGraph,
} from "@/lib/graph-mappers";
import type {
  GraphResponse,
  MarketPulse,
  MetricsResponse,
  Opportunity,
  RiskCycle,
  TraderSummary,
} from "@/lib/types";

const skinImagesQuery = `
MATCH (skin:Skin)
WHERE skin.id IN $ids AND skin.imageUrl IS NOT NULL
RETURN skin.id AS id, skin.imageUrl AS imageUrl
`;

const graphCountsQuery = `
MATCH (n)
WITH count(n) AS nodes
MATCH ()-[r]->()
RETURN nodes, count(r) AS edges
`;

export type HomeData = {
  metrics: MetricsResponse | null;
  opportunities: Opportunity[];
  riskCycles: RiskCycle[];
  traders: TraderSummary[];
  pulse: MarketPulse | null;
  graphCounts: { nodes: number; edges: number } | null;
  networkGraph: GraphResponse | null;
  featuredTrader: TraderSummary | null;
  skinImages: Record<string, string>;
};

export async function getHomeData(): Promise<HomeData> {
  const empty: HomeData = {
    metrics: null,
    opportunities: [],
    riskCycles: [],
    traders: [],
    pulse: null,
    graphCounts: null,
    networkGraph: null,
    featuredTrader: null,
    skinImages: {},
  };

  try {
    const [metricsRes, oppsRes, cyclesRes, tradersRes, pulseRes, dealsRes, pulseCyclesRes, countsRes] =
      await Promise.all([
        runQuery(metricsQuery, {}),
        runQuery(opportunitiesQuery, { minSpreadPct: 0 }),
        runQuery(riskCyclesQuery, {}),
        runQuery(tradersQuery, { query: "" }),
        runQuery(marketPulseQuery, {}),
        runQuery(marketPulseDealsQuery, {}),
        runQuery(marketPulseCyclesQuery, {}),
        runQuery(graphCountsQuery, {}),
      ]);

    const metrics = mapMetrics(metricsRes.records);
    const opportunities = mapOpportunities(oppsRes.records);
    const riskCycles = mapRiskCycles(cyclesRes.records, 0);
    const traders = mapTraders(tradersRes.records);
    const pulse = mapMarketPulse(pulseRes.records, dealsRes.records, pulseCyclesRes.records);

    const countsRecord = countsRes.records[0];
    const graphCounts = countsRecord
      ? {
          nodes: Number(countsRecord.get("nodes")),
          edges: Number(countsRecord.get("edges")),
        }
      : null;

    // trader con más volumen → protagonista del grafo de la sección Relaciones
    const featuredTrader = traders[0] ?? null;
    let networkGraph: GraphResponse | null = null;
    if (featuredTrader) {
      const graphRes = await runQuery(graphAroundTraderQuery, { traderId: featuredTrader.id });
      networkGraph = mapGraph(graphRes.records);
    }

    // imágenes reales para las piezas del observatorio
    const topSkinIds = [...new Set(opportunities.slice(0, 8).map((o) => o.skinId))];
    const skinImages: Record<string, string> = {};
    if (topSkinIds.length > 0) {
      const imagesRes = await runQuery(skinImagesQuery, { ids: topSkinIds });
      for (const record of imagesRes.records) {
        skinImages[String(record.get("id"))] = String(record.get("imageUrl"));
      }
    }

    return {
      metrics,
      opportunities,
      riskCycles,
      traders,
      pulse,
      graphCounts,
      networkGraph,
      featuredTrader,
      skinImages,
    };
  } catch (error) {
    console.error("home-data:", error);
    return empty;
  }
}
