# Graph Model

## Nodes

- `Skin`: skin base, con `id`, `name`, `rarity`, `imageUrl`.
- `SkinInstance`: instancia comerciable, con `id`, `float`, `wear`, `serial`.
- `Trader`: usuario del mercado, con `id`, `name`, `country`, `reputation`.
- `Transaction`: venta o trade, con `id`, `priceUsd`, `timestamp`.
- `Marketplace`: mercado de origen, con `id`, `name`, `feePct`.
- `Weapon`: arma asociada.
- `Collection`: colección asociada.
- `Sticker`: sticker aplicado a instancias.
- `PriceSnapshot`: snapshot de precio para extensiones futuras.
- `ScanRun`: ejecucion de deep scan, con `id`, `status`, `startedAt`, `completedAt`, `opportunitiesFound`, `riskCyclesFound`, `marketplacesScanned`.

## Relationships

- `(:Skin)-[:BELONGS_TO]->(:Collection)`
- `(:Skin)-[:FOR_WEAPON]->(:Weapon)`
- `(:SkinInstance)-[:INSTANCE_OF]->(:Skin)`
- `(:SkinInstance)-[:HAS_STICKER]->(:Sticker)`
- `(:Trader)-[:BOUGHT]->(:Transaction)`
- `(:Trader)-[:SOLD]->(:Transaction)`
- `(:Transaction)-[:FOR_INSTANCE]->(:SkinInstance)`
- `(:Transaction)-[:ON_MARKETPLACE]->(:Marketplace)`
- `(:Skin)-[:HAS_PRICE]->(:PriceSnapshot)`
- `(:Trader)-[:CONNECTED_TO]->(:Trader)`

`ScanRun` no necesita relacion obligatoria para la primera version: representa una ejecucion compartida del producto y resume resultados calculados desde el grafo.

## Demo Signals

El seed incluye:

- Flips rentables, como `inst-ak-redline-01` y `inst-awp-asiimov-01`.
- Loop sospechoso entre `shadow_a`, `shadow_b` y `shadow_c`.
- Instancia con stickers raros: `inst-ak-redline-02`.
- Scan inicial `scan-seed-latest` para alimentar el estado de la website antes de ejecutar un deep scan manual.
