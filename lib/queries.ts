import type { NodeType } from "./types";

export const nodeLabels: Record<NodeType, string> = {
  skin: "Skin",
  instance: "SkinInstance",
  trader: "Trader",
  transaction: "Transaction",
  marketplace: "Marketplace",
  collection: "Collection",
  weapon: "Weapon",
  sticker: "Sticker",
  price: "PriceSnapshot",
};

export const searchSkinsQuery = `
MATCH (s:Skin)-[:FOR_WEAPON]->(w:Weapon)
OPTIONAL MATCH (s)-[:BELONGS_TO]->(c:Collection)
WHERE $query = '' OR toLower(s.name) CONTAINS toLower($query)
RETURN s.id AS id, s.name AS name, w.name AS weapon, c.name AS collection, s.rarity AS rarity, s.imageUrl AS imageUrl
ORDER BY s.liquidityUsd DESC
LIMIT 20
`;

export const metricsQuery = `
MATCH (s:Skin)
WITH count(s) AS skinsIndexed
OPTIONAL MATCH (p:PriceSnapshot)
WITH skinsIndexed, count(p) AS snapshots,
     coalesce(sum(p.priceUsd * coalesce(p.quantity, 1)), 0) AS listedValue
OPTIONAL MATCH (tx:Transaction)
WITH skinsIndexed, snapshots, listedValue,
     count(tx) AS txCount, coalesce(sum(tx.priceUsd), 0) AS txValue
OPTIONAL MATCH (t:Trader)
WITH skinsIndexed, snapshots, listedValue, txCount, txValue, count(t) AS activeTraders
RETURN skinsIndexed, snapshots + txCount AS transactionsTracked, activeTraders,
       listedValue + txValue AS estimatedVolumeUsd
`;

/* ── Grafos de vecindario ──────────────────────────────────────────────────── */

export const graphAroundSkinQuery = `
MATCH (skin:Skin {id: $skinId})
OPTIONAL MATCH (skin)-[:FOR_WEAPON]->(weapon:Weapon)
OPTIONAL MATCH (skin)-[:BELONGS_TO]->(collection:Collection)
OPTIONAL MATCH (price:PriceSnapshot)-[:FOR_SKIN]->(skin)
OPTIONAL MATCH (price)-[:ON_MARKETPLACE]->(priceMarketplace:Marketplace)
OPTIONAL MATCH (instance:SkinInstance)-[:INSTANCE_OF]->(skin)
OPTIONAL MATCH (instance)-[:HAS_STICKER]->(sticker:Sticker)
OPTIONAL MATCH (tx:Transaction)-[:FOR_INSTANCE]->(instance)
OPTIONAL MATCH (tx)-[:ON_MARKETPLACE]->(marketplace:Marketplace)
OPTIONAL MATCH (buyer:Trader)-[:BOUGHT]->(tx)
OPTIONAL MATCH (seller:Trader)-[:SOLD]->(tx)
RETURN skin, weapon, collection, instance, sticker, tx, marketplace, buyer, seller, price, priceMarketplace
LIMIT 150
`;

export const graphAroundInstanceQuery = `
MATCH (instance:SkinInstance {id: $instanceId})
OPTIONAL MATCH (instance)-[:INSTANCE_OF]->(skin:Skin)
OPTIONAL MATCH (skin)-[:FOR_WEAPON]->(weapon:Weapon)
OPTIONAL MATCH (skin)-[:BELONGS_TO]->(collection:Collection)
OPTIONAL MATCH (price:PriceSnapshot)-[:FOR_SKIN]->(skin)
OPTIONAL MATCH (price)-[:ON_MARKETPLACE]->(priceMarketplace:Marketplace)
OPTIONAL MATCH (instance)-[:HAS_STICKER]->(sticker:Sticker)
OPTIONAL MATCH (tx:Transaction)-[:FOR_INSTANCE]->(instance)
OPTIONAL MATCH (tx)-[:ON_MARKETPLACE]->(marketplace:Marketplace)
OPTIONAL MATCH (buyer:Trader)-[:BOUGHT]->(tx)
OPTIONAL MATCH (seller:Trader)-[:SOLD]->(tx)
RETURN instance, skin, weapon, collection, sticker, tx, marketplace, buyer, seller, price, priceMarketplace
LIMIT 150
`;

export const graphAroundTraderQuery = `
MATCH (trader:Trader {id: $traderId})
OPTIONAL MATCH (trader)-[:BOUGHT|SOLD]->(tx:Transaction)-[:FOR_INSTANCE]->(instance:SkinInstance)-[:INSTANCE_OF]->(skin:Skin)
OPTIONAL MATCH (skin)-[:FOR_WEAPON]->(weapon:Weapon)
OPTIONAL MATCH (skin)-[:BELONGS_TO]->(collection:Collection)
OPTIONAL MATCH (instance)-[:HAS_STICKER]->(sticker:Sticker)
OPTIONAL MATCH (tx)-[:ON_MARKETPLACE]->(marketplace:Marketplace)
OPTIONAL MATCH (buyer:Trader)-[:BOUGHT]->(tx)
OPTIONAL MATCH (seller:Trader)-[:SOLD]->(tx)
RETURN skin, weapon, collection, instance, sticker, tx, marketplace, buyer, seller,
       null AS price, null AS priceMarketplace, trader
LIMIT 150
`;

export const graphAroundMarketplaceQuery = `
MATCH (marketplace:Marketplace {id: $marketplaceId})
OPTIONAL MATCH (tx:Transaction)-[:ON_MARKETPLACE]->(marketplace)
OPTIONAL MATCH (tx)-[:FOR_INSTANCE]->(instance:SkinInstance)-[:INSTANCE_OF]->(skin:Skin)
OPTIONAL MATCH (skin)-[:FOR_WEAPON]->(weapon:Weapon)
OPTIONAL MATCH (skin)-[:BELONGS_TO]->(collection:Collection)
OPTIONAL MATCH (instance)-[:HAS_STICKER]->(sticker:Sticker)
OPTIONAL MATCH (buyer:Trader)-[:BOUGHT]->(tx)
OPTIONAL MATCH (seller:Trader)-[:SOLD]->(tx)
RETURN skin, weapon, collection, instance, sticker, tx, marketplace, buyer, seller,
       null AS price, null AS priceMarketplace
LIMIT 150
`;

/* Expansión de vecinos para el grafo explorable: trae el vecindario inmediato
   de cualquier nodo por id, con tipos de nodo y relación reales. */
export const expandNodeQuery = `
MATCH (n {id: $id})-[r]-(m)
RETURN n, type(r) AS relType, startNode(r).id AS sourceId, m
LIMIT 60
`;

/* ── Oportunidades reales ──────────────────────────────────────────────────────
   Listings reales de CSFloat donde el precio pedido está por debajo del precio
   justo que predice el propio mercado (reference.predicted_price). Cada campo
   es observable: float real, stickers reales, vendedor real. */
export const opportunitiesQuery = `
MATCH (seller:Trader)-[:SOLD]->(tx:Transaction {kind: 'listing'})-[:FOR_INSTANCE]->(instance:SkinInstance)-[:INSTANCE_OF]->(skin:Skin)
MATCH (tx)-[:ON_MARKETPLACE]->(marketplace:Marketplace)
OPTIONAL MATCH (skin)-[:FOR_WEAPON]->(weapon:Weapon)
OPTIONAL MATCH (instance)-[:HAS_STICKER]->(sticker:Sticker)
WITH skin, weapon, instance, tx, marketplace, seller, collect(DISTINCT sticker) AS stickers
WHERE tx.predictedPriceUsd IS NOT NULL AND tx.priceUsd > 0
WITH skin, weapon, instance, tx, marketplace, seller, stickers,
     ((tx.predictedPriceUsd - tx.priceUsd) / tx.priceUsd) * 100 AS spreadPct
WHERE spreadPct >= $minSpreadPct
RETURN skin, weapon, instance, tx, marketplace, seller, stickers, spreadPct,
       tx.priceUsd AS currentAskUsd, tx.predictedPriceUsd AS fairValueUsd
ORDER BY spreadPct DESC
LIMIT 20
`;

/* ── Ciclos de riesgo ─────────────────────────────────────────────────────────
   Detección por grafo: una pieza cuya cadena de dueños VUELVE a un trader
   anterior (vendió y después recompró la misma instancia). El historial de
   ventas es simulado (kind:'sale', source:'simulated') porque el real es
   privado; la detección es Cypher genuino sobre el grafo. */
export const riskCyclesQuery = `
MATCH (t:Trader)-[:SOLD]->(tx1:Transaction {kind: 'sale'})-[:FOR_INSTANCE]->(instance:SkinInstance)
MATCH (t)-[:BOUGHT]->(tx2:Transaction {kind: 'sale'})-[:FOR_INSTANCE]->(instance)
WHERE tx1.timestamp < tx2.timestamp
WITH DISTINCT instance
MATCH (instance)-[:INSTANCE_OF]->(skin:Skin)
MATCH (instance)<-[:FOR_INSTANCE]-(tx:Transaction {kind: 'sale'})
MATCH (seller:Trader)-[:SOLD]->(tx)
OPTIONAL MATCH (buyer:Trader)-[:BOUGHT]->(tx)
WITH instance, skin, tx, seller, buyer
ORDER BY tx.timestamp
WITH instance, skin,
     collect({priceUsd: tx.priceUsd, timestamp: tx.timestamp,
              sellerName: seller.name, buyerName: buyer.name}) AS hops,
     sum(tx.priceUsd) AS valueMovedUsd
RETURN instance, skin, hops, valueMovedUsd
ORDER BY valueMovedUsd DESC
LIMIT 10
`;

/* Vendedores de riesgo (señales 100% reales de CSFloat): sin historial
   verificado, trades fallidos, o identidad/stall ocultos, listando valor alto. */
export const riskSellersQuery = `
MATCH (t:Trader)-[:SOLD]->(tx:Transaction {kind: 'listing'})-[:FOR_INSTANCE]->(instance:SkinInstance)-[:INSTANCE_OF]->(skin:Skin)
WHERE t.riskScore >= 40 AND t.simulated IS NULL
WITH t, collect({txId: tx.id, priceUsd: tx.priceUsd, timestamp: tx.timestamp, skinName: skin.name, instanceId: instance.id}) AS listings,
     sum(tx.priceUsd) AS valueListedUsd, count(tx) AS listingCount
RETURN t AS trader, listings, listingCount, valueListedUsd
ORDER BY t.riskScore * valueListedUsd DESC
LIMIT 10
`;

export const tradersQuery = `
MATCH (trader:Trader)-[:BOUGHT|SOLD]->(tx:Transaction)-[:ON_MARKETPLACE]->(marketplace:Marketplace)
WITH trader, collect(DISTINCT marketplace.name) AS marketplaces, count(DISTINCT tx) AS transactionCount,
     sum(tx.priceUsd) AS volumeUsd,
     avg(CASE WHEN tx.predictedPriceUsd IS NOT NULL AND tx.priceUsd > 0
              THEN (tx.predictedPriceUsd - tx.priceUsd) / tx.priceUsd * 100 END) AS avgEdgePct
WHERE $query = '' OR toLower(trader.name) CONTAINS toLower($query) OR toLower(trader.id) CONTAINS toLower($query)
RETURN trader, marketplaces, transactionCount, coalesce(volumeUsd, 0) AS volumeUsd, avgEdgePct
ORDER BY volumeUsd DESC
LIMIT 50
`;

export const traderProfileQuery = `
MATCH (trader:Trader {id: $id})
OPTIONAL MATCH (trader)-[:BOUGHT|SOLD]->(tx:Transaction)-[:ON_MARKETPLACE]->(marketplace:Marketplace)
RETURN trader, collect(DISTINCT marketplace.name) AS marketplaces, count(DISTINCT tx) AS transactionCount,
       coalesce(sum(tx.priceUsd), 0) AS volumeUsd, null AS avgEdgePct
`;

export const createScanQuery = `
CREATE (scan:ScanRun {
  id: $id,
  status: 'COMPLETED',
  startedAt: datetime($startedAt),
  completedAt: datetime($completedAt),
  opportunitiesFound: $opportunitiesFound,
  riskCyclesFound: $riskCyclesFound,
  marketplacesScanned: $marketplacesScanned
})
RETURN scan
`;

export const latestScanQuery = `
MATCH (scan:ScanRun)
RETURN scan
ORDER BY scan.startedAt DESC
LIMIT 1
`;

export const marketPulseQuery = `
OPTIONAL MATCH (p:PriceSnapshot)
WITH count(p) AS snapCount, coalesce(sum(p.priceUsd * coalesce(p.quantity, 1)), 0) AS listedValue
OPTIONAL MATCH (tx:Transaction)
WITH snapCount, listedValue, count(tx) AS txOnly, coalesce(sum(tx.priceUsd), 0) AS txValue
OPTIONAL MATCH (t:Trader)
WITH snapCount, listedValue, txOnly, txValue, count(t) AS activeTraders
RETURN listedValue + txValue AS trackedVolumeUsd, snapCount + txOnly AS txCount, activeTraders
`;

/* Deals = spreads reales entre marketplaces para la misma skin+wear.
   Sin Doppler: las fases comparten nombre y el spread sería entre ítems distintos. */
export const marketPulseDealsQuery = `
MATCH (s:Skin)<-[:FOR_SKIN]-(p:PriceSnapshot)-[:ON_MARKETPLACE]->(mp:Marketplace)
WHERE NOT s.name CONTAINS 'Doppler'
WITH s, p.wear AS wear, mp.name AS venue, min(p.priceUsd) AS price
WITH s, wear, collect({venue: venue, price: price}) AS venues
WHERE size(venues) >= 2
WITH s, wear,
     reduce(mx = 0.0, v IN venues | CASE WHEN v.price > mx THEN v.price ELSE mx END) AS maxP,
     reduce(mn = 9999999.0, v IN venues | CASE WHEN v.price < mn THEN v.price ELSE mn END) AS minP
WHERE minP > 0.5
WITH ((maxP - minP) / minP) * 100 AS spread
WHERE spread >= 5
RETURN count(*) AS dealsDetected, avg(spread) AS averageSpreadPct
`;

/* Ciclos detectados en el grafo (sobre el historial simulado). */
export const marketPulseCyclesQuery = `
MATCH (t:Trader)-[:SOLD]->(tx1:Transaction {kind: 'sale'})-[:FOR_INSTANCE]->(i:SkinInstance)
MATCH (t)-[:BOUGHT]->(tx2:Transaction {kind: 'sale'})-[:FOR_INSTANCE]->(i)
WHERE tx1.timestamp < tx2.timestamp
RETURN count(DISTINCT i) AS suspiciousCycles
`;

/* ── Catálogo ──────────────────────────────────────────────────────────────── */

export const allSkinsQuery = `
MATCH (s:Skin)-[:FOR_WEAPON]->(w:Weapon)
OPTIONAL MATCH (s)-[:BELONGS_TO]->(c:Collection)
WHERE ($query = '' OR toLower(s.name) CONTAINS toLower($query))
  AND ($rarity = '' OR s.rarity = $rarity)
  AND ($weapon = '' OR w.name = $weapon)
OPTIONAL MATCH (s)<-[:FOR_SKIN]-(p:PriceSnapshot)-[:ON_MARKETPLACE]->(mp:Marketplace)
OPTIONAL MATCH (i:SkinInstance)-[:INSTANCE_OF]->(s)
WITH s, w, c, count(DISTINCT i) AS instanceCount,
     [x IN collect(DISTINCT {price: p.priceUsd, marketplace: mp.name}) WHERE x.price IS NOT NULL] AS prices
WITH s, w, c, instanceCount, prices,
     reduce(mn = null, x IN prices |
       CASE WHEN mn IS NULL OR x.price < mn.price THEN x ELSE mn END) AS cheapest
RETURN s.id AS id, s.name AS name, w.name AS weapon, c.name AS collection,
  s.rarity AS rarity, s.imageUrl AS imageUrl,
  instanceCount,
  cheapest.price AS latestPrice,
  cheapest.marketplace AS latestMarketplace
ORDER BY coalesce(s.liquidityUsd, 0) DESC
SKIP $skip
LIMIT $limit
`;

export const skinDetailQuery = `
MATCH (s:Skin {id: $skinId})-[:FOR_WEAPON]->(w:Weapon)
OPTIONAL MATCH (s)-[:BELONGS_TO]->(c:Collection)
OPTIONAL MATCH (s)<-[:FOR_SKIN]-(p:PriceSnapshot)-[:ON_MARKETPLACE]->(pmp:Marketplace)
WITH s, w, c,
     [x IN collect(DISTINCT {marketplace: pmp.name, wear: p.wear, priceUsd: p.priceUsd,
                             quantity: p.quantity, observedAt: toString(p.observedAt)})
      WHERE x.priceUsd IS NOT NULL] AS venuePrices
OPTIONAL MATCH (i:SkinInstance)-[:INSTANCE_OF]->(s)
OPTIONAL MATCH (i)<-[:FOR_INSTANCE]-(tx:Transaction)-[:ON_MARKETPLACE]->(mp:Marketplace)
OPTIONAL MATCH (seller:Trader)-[:SOLD]->(tx)
WITH s, w, c, venuePrices, i,
  [x IN collect({
    priceUsd: tx.priceUsd,
    marketplace: mp.name,
    timestamp: toString(tx.timestamp),
    sellerId: seller.id,
    sellerName: seller.name
  }) WHERE x.priceUsd IS NOT NULL] AS txHistory
ORDER BY i.floatValue ASC
RETURN s, w, c, venuePrices,
  collect({
    id: i.id,
    floatValue: i.floatValue,
    wear: i.wear,
    serial: i.serial,
    txHistory: txHistory
  }) AS instances
`;

export const instanceJourneyQuery = `
MATCH (i:SkinInstance {id: $instanceId})<-[:FOR_INSTANCE]-(tx:Transaction)
MATCH (seller:Trader)-[:SOLD]->(tx)
OPTIONAL MATCH (tx)<-[:BOUGHT]-(buyer:Trader)
OPTIONAL MATCH (tx)-[:ON_MARKETPLACE]->(mp:Marketplace)
RETURN tx.id AS txId, tx.priceUsd AS priceUsd, toString(tx.timestamp) AS timestamp,
  seller.id AS sellerId, seller.name AS sellerName, seller.reputation AS sellerRep, seller.riskScore AS sellerRisk,
  buyer.id AS buyerId, buyer.name AS buyerName,
  mp.name AS marketplace
ORDER BY tx.timestamp ASC
`;

export const traderReputationQuery = `
MATCH (t:Trader {id: $traderId})
OPTIONAL MATCH (t)-[:SOLD|BOUGHT]->(tx:Transaction)
WITH t, count(DISTINCT tx) AS txCount, sum(tx.priceUsd) AS volumeUsd
RETURN t.id AS id, t.name AS name, t.reputation AS reputation,
  t.riskScore AS riskScore, coalesce(t.country, '') AS country,
  txCount, coalesce(volumeUsd, 0.0) AS volumeUsd,
  t.reputation AS avgPeerReputation,
  CASE
    WHEN coalesce(t.totalTrades, 0) >= 100 AND coalesce(t.riskScore, 100) < 30 THEN 'trusted'
    WHEN coalesce(t.riskScore, 0) >= 50 THEN 'suspicious'
    ELSE 'neutral'
  END AS reputationLabel
`;

export function nodeDetailsQuery(type: NodeType) {
  return `
  MATCH (n:${nodeLabels[type]} {id: $id})
  OPTIONAL MATCH (n)<-[:FOR_INSTANCE]-(tx:Transaction)-[:ON_MARKETPLACE]->(m:Marketplace)
  OPTIONAL MATCH (buyer:Trader)-[:BOUGHT]->(tx)
  OPTIONAL MATCH (seller:Trader)-[:SOLD]->(tx)
  RETURN n, collect(DISTINCT {
    id: tx.id,
    priceUsd: tx.priceUsd,
    timestamp: toString(tx.timestamp),
    marketplace: m.name,
    buyer: buyer.name,
    seller: seller.name
  }) AS timeline
  `;
}
