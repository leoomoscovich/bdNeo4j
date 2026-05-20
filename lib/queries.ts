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
ORDER BY s.name
LIMIT 20
`;

export const metricsQuery = `
MATCH (s:Skin)
WITH count(s) AS skinsIndexed
MATCH (tx:Transaction)
WITH skinsIndexed, count(tx) AS transactionsTracked, sum(tx.priceUsd) AS estimatedVolumeUsd
MATCH (t:Trader)
RETURN skinsIndexed, transactionsTracked, count(t) AS activeTraders, coalesce(estimatedVolumeUsd, 0) AS estimatedVolumeUsd
`;

export const graphAroundSkinQuery = `
MATCH (skin:Skin {id: $skinId})
OPTIONAL MATCH (skin)-[:FOR_WEAPON]->(weapon:Weapon)
OPTIONAL MATCH (skin)-[:BELONGS_TO]->(collection:Collection)
OPTIONAL MATCH (instance:SkinInstance)-[:INSTANCE_OF]->(skin)
OPTIONAL MATCH (instance)-[:HAS_STICKER]->(sticker:Sticker)
OPTIONAL MATCH (tx:Transaction)-[:FOR_INSTANCE]->(instance)
OPTIONAL MATCH (tx)-[:ON_MARKETPLACE]->(marketplace:Marketplace)
OPTIONAL MATCH (buyer:Trader)-[:BOUGHT]->(tx)
OPTIONAL MATCH (seller:Trader)-[:SOLD]->(tx)
RETURN skin, weapon, collection, instance, sticker, tx, marketplace, buyer, seller
LIMIT 120
`;

export const graphAroundInstanceQuery = `
MATCH (instance:SkinInstance {id: $instanceId})
OPTIONAL MATCH (instance)-[:INSTANCE_OF]->(skin:Skin)
OPTIONAL MATCH (skin)-[:FOR_WEAPON]->(weapon:Weapon)
OPTIONAL MATCH (skin)-[:BELONGS_TO]->(collection:Collection)
OPTIONAL MATCH (instance)-[:HAS_STICKER]->(sticker:Sticker)
OPTIONAL MATCH (tx:Transaction)-[:FOR_INSTANCE]->(instance)
OPTIONAL MATCH (tx)-[:ON_MARKETPLACE]->(marketplace:Marketplace)
OPTIONAL MATCH (buyer:Trader)-[:BOUGHT]->(tx)
OPTIONAL MATCH (seller:Trader)-[:SOLD]->(tx)
RETURN instance, skin, weapon, collection, sticker, tx, marketplace, buyer, seller
LIMIT 120
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
RETURN skin, weapon, collection, instance, sticker, tx, marketplace, buyer, seller
LIMIT 120
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
RETURN skin, weapon, collection, instance, sticker, tx, marketplace, buyer, seller
LIMIT 120
`;

export const opportunitiesQuery = `
MATCH (skin:Skin)<-[:INSTANCE_OF]-(instance:SkinInstance)<-[:FOR_INSTANCE]-(tx:Transaction)
MATCH (tx)-[:ON_MARKETPLACE]->(marketplace:Marketplace)
OPTIONAL MATCH (buyer:Trader)-[:BOUGHT]->(tx)
OPTIONAL MATCH (seller:Trader)-[:SOLD]->(tx)
OPTIONAL MATCH (instance)-[:HAS_STICKER]->(sticker:Sticker)
WITH skin, instance, marketplace, tx, buyer, seller, collect(DISTINCT sticker) AS stickers
ORDER BY tx.timestamp DESC
WITH skin, instance,
     collect({tx: tx, marketplace: marketplace, buyer: buyer, seller: seller}) AS events,
     avg(tx.priceUsd) AS averagePrice,
     max(tx.priceUsd) AS maxPrice,
     stickers
WITH skin, instance, events[0] AS latest, events, averagePrice, maxPrice, stickers
WITH skin, instance, latest, events,
     latest.tx.priceUsd AS currentAskUsd,
     CASE WHEN maxPrice > averagePrice THEN maxPrice ELSE averagePrice * 1.08 END AS fairValueUsd,
     stickers
WITH skin, instance, latest, events, currentAskUsd, fairValueUsd, stickers,
     ((fairValueUsd - currentAskUsd) / currentAskUsd) * 100 AS spreadPct
WHERE spreadPct >= $minSpreadPct
RETURN skin, instance, latest, events, currentAskUsd, fairValueUsd, spreadPct, stickers
ORDER BY spreadPct DESC
LIMIT 20
`;

export const riskCyclesQuery = `
MATCH (a:Trader)-[:CONNECTED_TO*2..4]-(a)
WITH DISTINCT a
MATCH (a)-[:SOLD|BOUGHT]->(tx:Transaction)-[:FOR_INSTANCE]->(instance:SkinInstance)-[:INSTANCE_OF]->(skin:Skin)
WITH instance, skin, collect(DISTINCT a) AS traders, collect(DISTINCT tx) AS txs
WHERE size(traders) >= 2 AND size(txs) >= 2
RETURN instance, skin, traders, txs,
       reduce(total = 0.0, tx IN txs | total + tx.priceUsd) AS valueMovedUsd
ORDER BY valueMovedUsd DESC
LIMIT 10
`;

export const tradersQuery = `
MATCH (trader:Trader)-[:BOUGHT|SOLD]->(tx:Transaction)-[:ON_MARKETPLACE]->(marketplace:Marketplace)
WITH trader, collect(DISTINCT marketplace.name) AS marketplaces, count(DISTINCT tx) AS transactionCount, sum(tx.priceUsd) AS volumeUsd
WHERE $query = '' OR toLower(trader.name) CONTAINS toLower($query) OR toLower(trader.id) CONTAINS toLower($query)
RETURN trader, marketplaces, transactionCount, coalesce(volumeUsd, 0) AS volumeUsd
ORDER BY volumeUsd DESC
LIMIT 50
`;

export const traderProfileQuery = `
MATCH (trader:Trader {id: $id})
OPTIONAL MATCH (trader)-[:BOUGHT|SOLD]->(tx:Transaction)-[:ON_MARKETPLACE]->(marketplace:Marketplace)
RETURN trader, collect(DISTINCT marketplace.name) AS marketplaces, count(DISTINCT tx) AS transactionCount, coalesce(sum(tx.priceUsd), 0) AS volumeUsd
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
MATCH (tx:Transaction)
WITH sum(tx.priceUsd) AS trackedVolumeUsd, count(tx) AS txCount
MATCH (t:Trader)
RETURN trackedVolumeUsd, txCount, count(t) AS activeTraders
`;

export const marketPulseDealsQuery = `
MATCH (skin:Skin)<-[:INSTANCE_OF]-(instance:SkinInstance)<-[:FOR_INSTANCE]-(tx:Transaction)
MATCH (tx)-[:ON_MARKETPLACE]->(marketplace:Marketplace)
WITH instance,
     collect(tx.priceUsd) AS prices,
     avg(tx.priceUsd) AS averagePrice,
     max(tx.priceUsd) AS maxPrice
WITH instance, prices, averagePrice, maxPrice,
     CASE WHEN maxPrice > averagePrice THEN maxPrice ELSE averagePrice * 1.08 END AS fairValue
UNWIND prices AS currentAsk
WITH currentAsk, fairValue, ((fairValue - currentAsk) / currentAsk) * 100 AS spread
WHERE spread >= 5
RETURN count(*) AS dealsDetected, avg(spread) AS averageSpreadPct
`;

export const marketPulseCyclesQuery = `
MATCH (a:Trader)-[:CONNECTED_TO*2..4]-(a)
WITH DISTINCT a
MATCH (a)-[:SOLD|BOUGHT]->(tx:Transaction)-[:FOR_INSTANCE]->(instance:SkinInstance)-[:INSTANCE_OF]->(skin:Skin)
WITH instance, skin, collect(DISTINCT a) AS traders, collect(DISTINCT tx) AS txs
WHERE size(traders) >= 2 AND size(txs) >= 2
RETURN count(*) AS suspiciousCycles
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
