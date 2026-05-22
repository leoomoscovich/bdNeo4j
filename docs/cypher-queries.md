# Cypher Queries

## Search Skins

```cypher
MATCH (s:Skin)-[:FOR_WEAPON]->(w:Weapon)
OPTIONAL MATCH (s)-[:BELONGS_TO]->(c:Collection)
WHERE $query = '' OR toLower(s.name) CONTAINS toLower($query)
RETURN s.id AS id, s.name AS name, w.name AS weapon, c.name AS collection, s.rarity AS rarity, s.imageUrl AS imageUrl
ORDER BY s.name
LIMIT 20
```

## Graph Around Skin

```cypher
MATCH (skin:Skin {id: $skinId})
OPTIONAL MATCH (skin)-[:FOR_WEAPON]->(weapon:Weapon)
OPTIONAL MATCH (skin)-[:BELONGS_TO]->(collection:Collection)
OPTIONAL MATCH (instance:SkinInstance)-[:INSTANCE_OF]->(skin)
OPTIONAL MATCH (tx:Transaction)-[:FOR_INSTANCE]->(instance)
OPTIONAL MATCH (tx)-[:ON_MARKETPLACE]->(marketplace:Marketplace)
OPTIONAL MATCH (buyer:Trader)-[:BOUGHT]->(tx)
OPTIONAL MATCH (seller:Trader)-[:SOLD]->(tx)
RETURN skin, weapon, collection, collect(DISTINCT instance), collect(DISTINCT tx), collect(DISTINCT marketplace), collect(DISTINCT buyer) + collect(DISTINCT seller)
```

## Metrics

```cypher
MATCH (s:Skin)
WITH count(s) AS skinsIndexed
MATCH (tx:Transaction)
WITH skinsIndexed, count(tx) AS transactionsTracked, sum(tx.priceUsd) AS estimatedVolumeUsd
MATCH (t:Trader)
RETURN skinsIndexed, transactionsTracked, count(t) AS activeTraders, coalesce(estimatedVolumeUsd, 0) AS estimatedVolumeUsd
```

## Profitable Flips

```cypher
MATCH (buyTx:Transaction)-[:FOR_INSTANCE]->(i:SkinInstance)<-[:FOR_INSTANCE]-(sellTx:Transaction)
WHERE buyTx.timestamp < sellTx.timestamp AND sellTx.priceUsd > buyTx.priceUsd
RETURN i, buyTx, sellTx, sellTx.priceUsd - buyTx.priceUsd AS profit
ORDER BY profit DESC
LIMIT 20
```

## Suspicious Cycles

```cypher
MATCH cycle = (a:Trader)-[:CONNECTED_TO*2..5]-(a)
RETURN cycle
LIMIT 20
```

## Trader Ranking

```cypher
MATCH (trader:Trader)-[:BOUGHT|SOLD]->(tx:Transaction)-[:ON_MARKETPLACE]->(marketplace:Marketplace)
WITH trader, collect(DISTINCT marketplace.name) AS marketplaces, count(DISTINCT tx) AS transactionCount, sum(tx.priceUsd) AS volumeUsd
RETURN trader, marketplaces, transactionCount, coalesce(volumeUsd, 0) AS volumeUsd
ORDER BY volumeUsd DESC
LIMIT 50
```

## Latest Deep Scan

```cypher
MATCH (scan:ScanRun)
RETURN scan
ORDER BY scan.startedAt DESC
LIMIT 1
```

## Create Deep Scan Summary

```cypher
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
```
