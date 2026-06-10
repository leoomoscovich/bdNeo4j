import { NextResponse } from "next/server";
import { runQuery } from "@/lib/neo4j";

/* Patrones detectables SOLO con datos reales del grafo:
   1. crossVenue   — la misma skin+wear con precios distintos en 2+ marketplaces
   2. crowdedSkins — skins con más vendedores reales compitiendo (mercado saturado)
   3. floatPremium — listings reales donde el float raro explica el sobreprecio */

const crossVenueQuery = `
MATCH (s:Skin)<-[:FOR_SKIN]-(p:PriceSnapshot)-[:ON_MARKETPLACE]->(mp:Marketplace)
WHERE NOT s.name CONTAINS 'Doppler'
WITH s, p.wear AS wear, mp.name AS venue, min(p.priceUsd) AS price
WITH s, wear, collect({venue: venue, price: price}) AS venues
WHERE size(venues) >= 2
WITH s, wear, venues,
     reduce(mx = 0.0, v IN venues | CASE WHEN v.price > mx THEN v.price ELSE mx END) AS maxP,
     reduce(mn = 9999999.0, v IN venues | CASE WHEN v.price < mn THEN v.price ELSE mn END) AS minP
WHERE minP > 1
RETURN s.id AS skinId, s.name AS skinName, s.imageUrl AS imageUrl, wear, venues,
       round((maxP - minP) / minP * 1000) / 10 AS spreadPct
ORDER BY spreadPct DESC
LIMIT 12
`;

const crowdedSkinsQuery = `
MATCH (t:Trader)-[:SOLD]->(tx:Transaction {kind: 'listing'})-[:FOR_INSTANCE]->(:SkinInstance)-[:INSTANCE_OF]->(s:Skin)
WITH s, count(DISTINCT t) AS sellers, count(tx) AS listings,
     min(tx.priceUsd) AS minAsk, max(tx.priceUsd) AS maxAsk
WHERE sellers >= 3
RETURN s.id AS skinId, s.name AS skinName, s.imageUrl AS imageUrl,
       sellers, listings, minAsk, maxAsk,
       round((maxAsk - minAsk) / minAsk * 1000) / 10 AS askDispersionPct
ORDER BY sellers DESC
LIMIT 12
`;

const floatPremiumQuery = `
MATCH (t:Trader)-[:SOLD]->(tx:Transaction {kind: 'listing'})-[:FOR_INSTANCE]->(i:SkinInstance)-[:INSTANCE_OF]->(s:Skin)
WHERE tx.floatFactor IS NOT NULL AND tx.floatFactor >= 1.01
RETURN s.id AS skinId, s.name AS skinName, i.id AS instanceId,
       i.floatValue AS floatValue, i.wear AS wear,
       tx.priceUsd AS priceUsd, tx.basePriceUsd AS basePriceUsd,
       round((tx.floatFactor - 1) * 1000) / 10 AS premiumPct,
       t.name AS sellerName, t.id AS sellerId
ORDER BY premiumPct DESC
LIMIT 12
`;

export async function GET() {
  try {
    const [crossVenueRes, crowdedRes, floatRes] = await Promise.all([
      runQuery(crossVenueQuery, {}),
      runQuery(crowdedSkinsQuery, {}),
      runQuery(floatPremiumQuery, {}),
    ]);

    const num = (v: unknown) => (typeof v === "object" && v != null && "toNumber" in v
      ? (v as { toNumber: () => number }).toNumber()
      : Number(v ?? 0));

    return NextResponse.json({
      crossVenue: crossVenueRes.records.map((r) => ({
        skinId: String(r.get("skinId")),
        skinName: String(r.get("skinName")),
        imageUrl: String(r.get("imageUrl") ?? ""),
        wear: String(r.get("wear") ?? ""),
        venues: (r.get("venues") as Array<{ venue: string; price: number }>).map((v) => ({
          venue: String(v.venue),
          price: num(v.price),
        })),
        spreadPct: num(r.get("spreadPct")),
      })),
      crowdedSkins: crowdedRes.records.map((r) => ({
        skinId: String(r.get("skinId")),
        skinName: String(r.get("skinName")),
        imageUrl: String(r.get("imageUrl") ?? ""),
        sellers: num(r.get("sellers")),
        listings: num(r.get("listings")),
        minAsk: num(r.get("minAsk")),
        maxAsk: num(r.get("maxAsk")),
        askDispersionPct: num(r.get("askDispersionPct")),
      })),
      floatPremium: floatRes.records.map((r) => ({
        skinId: String(r.get("skinId")),
        skinName: String(r.get("skinName")),
        instanceId: String(r.get("instanceId")),
        floatValue: num(r.get("floatValue")),
        wear: String(r.get("wear") ?? ""),
        priceUsd: num(r.get("priceUsd")),
        basePriceUsd: num(r.get("basePriceUsd")),
        premiumPct: num(r.get("premiumPct")),
        sellerName: String(r.get("sellerName") ?? ""),
        sellerId: String(r.get("sellerId") ?? ""),
      })),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "No se pudieron calcular los patrones." }, { status: 500 });
  }
}
