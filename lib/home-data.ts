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

/* Para el "Reporte de spreads": precio real observado de la misma skin+wear
   en 2+ marketplaces, ordenado por spread real entre venues.
   Se excluyen los Doppler: cada venue puede listar una fase/gema distinta bajo
   el mismo nombre y el spread compararía ítems que no son el mismo. */
const crossVenueQuery = `
MATCH (skin:Skin)<-[:FOR_SKIN]-(p:PriceSnapshot)-[:ON_MARKETPLACE]->(mp:Marketplace)
WHERE NOT skin.name CONTAINS 'Doppler'
WITH skin, p.wear AS wear, mp.name AS venue, min(p.priceUsd) AS price
WITH skin, wear, collect({venue: venue, price: price}) AS venues
WHERE size(venues) >= 2
WITH skin, wear, venues,
     reduce(mx = 0.0, v IN venues | CASE WHEN v.price > mx THEN v.price ELSE mx END) AS maxP,
     reduce(mn = 9999999.0, v IN venues | CASE WHEN v.price < mn THEN v.price ELSE mn END) AS minP
WHERE minP > 1
RETURN skin.name AS skinName, wear, skin.imageUrl AS imageUrl,
       venues, round((maxP - minP) / minP * 1000) / 10 AS spreadPct
ORDER BY spreadPct DESC
LIMIT 6
`;

export type CrossVenueRow = {
  skinName: string;
  wear: string;
  imageUrl: string;
  prices: Record<string, number>;
  spreadPct: number;
};

/* Pieza destacada para la sección "Capas": un listing REAL de CSFloat
   (float, paint seed, precio y stickers observados, no inventados). */
const featuredPieceQuery = `
MATCH (t:Trader)-[:SOLD]->(tx:Transaction {kind: 'listing'})-[:FOR_INSTANCE]->(i:SkinInstance)-[:INSTANCE_OF]->(s:Skin)
WHERE i.floatValue IS NOT NULL AND s.imageUrl <> ''
OPTIONAL MATCH (i)-[:HAS_STICKER]->(st:Sticker)
WITH s, i, tx, t, count(st) AS stickerCount
RETURN s.name AS skinName, s.imageUrl AS imageUrl, s.rarity AS rarity,
       i.id AS instanceId, i.floatValue AS floatValue, i.wear AS wear,
       i.paintSeed AS paintSeed, i.serial AS assetId,
       tx.priceUsd AS priceUsd, t.name AS sellerName, stickerCount
ORDER BY tx.priceUsd DESC
LIMIT 1
`;

export type FeaturedPiece = {
  skinName: string;
  imageUrl: string;
  rarity: string;
  instanceId: string;
  floatValue: number;
  wear: string;
  paintSeed: number | null;
  assetId: string;
  priceUsd: number;
  sellerName: string;
  stickerCount: number;
};

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
  crossVenue: CrossVenueRow[];
  featuredPiece: FeaturedPiece | null;
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
    crossVenue: [],
    featuredPiece: null,
  };

  try {
    const [metricsRes, oppsRes, cyclesRes, tradersRes, pulseRes, dealsRes, pulseCyclesRes, countsRes, crossVenueRes, featuredPieceRes] =
      await Promise.all([
        runQuery(metricsQuery, {}),
        runQuery(opportunitiesQuery, { minSpreadPct: 0 }),
        runQuery(riskCyclesQuery, {}),
        runQuery(tradersQuery, { query: "" }),
        runQuery(marketPulseQuery, {}),
        runQuery(marketPulseDealsQuery, {}),
        runQuery(marketPulseCyclesQuery, {}),
        runQuery(graphCountsQuery, {}),
        runQuery(crossVenueQuery, {}),
        runQuery(featuredPieceQuery, {}),
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

    const crossVenue: CrossVenueRow[] = crossVenueRes.records.map((record) => {
      const venues = record.get("venues") as Array<{ venue: string; price: number }>;
      const prices: Record<string, number> = {};
      for (const v of venues) prices[v.venue] = Number(v.price);
      return {
        skinName: String(record.get("skinName")),
        wear: String(record.get("wear") ?? ""),
        imageUrl: String(record.get("imageUrl") ?? ""),
        prices,
        spreadPct: Number(record.get("spreadPct")),
      };
    });

    const fpRecord = featuredPieceRes.records[0];
    const featuredPiece: FeaturedPiece | null = fpRecord
      ? {
          skinName: String(fpRecord.get("skinName")),
          imageUrl: String(fpRecord.get("imageUrl") ?? ""),
          rarity: String(fpRecord.get("rarity") ?? ""),
          instanceId: String(fpRecord.get("instanceId")),
          floatValue: Number(fpRecord.get("floatValue") ?? 0),
          wear: String(fpRecord.get("wear") ?? ""),
          paintSeed: fpRecord.get("paintSeed") != null ? Number(fpRecord.get("paintSeed")) : null,
          assetId: String(fpRecord.get("assetId") ?? ""),
          priceUsd: Number(fpRecord.get("priceUsd") ?? 0),
          sellerName: String(fpRecord.get("sellerName") ?? ""),
          stickerCount: Number(fpRecord.get("stickerCount") ?? 0),
        }
      : null;

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
      crossVenue,
      featuredPiece,
    };
  } catch (error) {
    console.error("home-data:", error);
    return empty;
  }
}
