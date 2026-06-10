/**
 * Construye el dataset REAL del grafo:
 *  - Catálogo: ByMykel/CSGO-API (nombres, rareza, colección, imágenes oficiales)
 *  - Precios:  Skinport API (min/median/suggested + cantidad listada)
 *              market.csgo.com (precio + volumen)
 *              Steam Community Market (lowest/median, top skins, rate-limited)
 *
 * Selección: las ~N skins con más liquidez real (cantidad listada × precio).
 * Modelo:    (PriceSnapshot {wear, priceUsd, ...})-[:FOR_SKIN]->(Skin)
 *            (PriceSnapshot)-[:ON_MARKETPLACE]->(Marketplace)
 *
 * Uso:  npx tsx scripts/build-real-dataset.ts [--wipe] [--skins 200] [--steam 60]
 */

import neo4j from "neo4j-driver";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const driver = neo4j.driver(
  process.env.NEO4J_URI || "bolt://localhost:7687",
  neo4j.auth.basic(
    process.env.NEO4J_USERNAME || "neo4j",
    process.env.NEO4J_PASSWORD || "password"
  )
);

const argv = process.argv.slice(2);
const WIPE = argv.includes("--wipe");
const N_SKINS = parseInt(argv[argv.indexOf("--skins") + 1] || "200", 10) || 200;
const N_STEAM = parseInt(argv[argv.indexOf("--steam") + 1] || "60", 10) || 60;

const WEARS = ["Factory New", "Minimal Wear", "Field-Tested", "Well-Worn", "Battle-Scarred"] as const;

function uid(prefix: string, s: string) {
  return `${prefix}-${s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

function stripWear(marketHashName: string): { base: string; wear: string | null } {
  for (const w of WEARS) {
    const suffix = ` (${w})`;
    if (marketHashName.endsWith(suffix)) {
      return { base: marketHashName.slice(0, -suffix.length), wear: w };
    }
  }
  return { base: marketHashName, wear: null };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─── fuentes ──────────────────────────────────────────────────────────────────

type CatalogSkin = {
  id: string;
  name: string; // "AK-47 | Redline"  /  "★ Karambit | Doppler"
  weapon?: { name: string };
  category?: { name: string };
  pattern?: { name: string };
  min_float?: number;
  max_float?: number;
  rarity?: { name: string; color?: string };
  collections?: Array<{ name: string }>;
  image?: string;
};

async function fetchCatalog(): Promise<Map<string, CatalogSkin>> {
  console.log("📚 Catálogo ByMykel/CSGO-API ...");
  const res = await fetch(
    "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json",
    { signal: AbortSignal.timeout(30_000) }
  );
  if (!res.ok) throw new Error(`catalog ${res.status}`);
  const skins: CatalogSkin[] = await res.json();
  const map = new Map<string, CatalogSkin>();
  for (const s of skins) {
    if (!map.has(s.name)) map.set(s.name, s); // primera variante (no Doppler phases duplicadas)
  }
  console.log(`  ✓ ${map.size} skins reales en catálogo`);
  return map;
}

type SkinportItem = {
  market_hash_name: string;
  min_price: number | null;
  median_price: number | null;
  suggested_price: number | null;
  quantity: number;
  item_page: string;
};

async function fetchSkinport(): Promise<SkinportItem[]> {
  console.log("📡 Skinport API ...");
  const res = await fetch("https://api.skinport.com/v1/items?app_id=730&currency=USD", {
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new Error(`skinport ${res.status}`);
  const items: SkinportItem[] = await res.json();
  console.log(`  ✓ ${items.length} ítems con precio real`);
  return items;
}

type MarketCsgoItem = { market_hash_name: string; price: string; volume: string };

async function fetchMarketCsgo(): Promise<Map<string, MarketCsgoItem>> {
  console.log("📡 market.csgo.com ...");
  const res = await fetch("https://market.csgo.com/api/v2/prices/USD.json", {
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new Error(`market.csgo ${res.status}`);
  const json: { items: MarketCsgoItem[] } = await res.json();
  const map = new Map(json.items.map((i) => [i.market_hash_name, i]));
  console.log(`  ✓ ${map.size} ítems con precio+volumen`);
  return map;
}

async function fetchSteamPrice(marketHashName: string): Promise<{ lowest: number; median: number; volume: number } | null> {
  const url =
    "https://steamcommunity.com/market/priceoverview/?appid=730&currency=1&market_hash_name=" +
    encodeURIComponent(marketHashName);
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return null;
    const j = await res.json();
    if (!j?.success) return null;
    const num = (s?: string) => (s ? parseFloat(s.replace(/[$,]/g, "")) : NaN);
    const lowest = num(j.lowest_price);
    const median = num(j.median_price);
    if (!isFinite(lowest) && !isFinite(median)) return null;
    return {
      lowest: isFinite(lowest) ? lowest : median,
      median: isFinite(median) ? median : lowest,
      volume: parseInt(String(j.volume ?? "0").replace(/,/g, ""), 10) || 0,
    };
  } catch {
    return null;
  }
}

// ─── selección ────────────────────────────────────────────────────────────────

type WearPrices = {
  wear: string;
  skinport?: SkinportItem;
  marketCsgo?: { price: number; volume: number };
};

type Selected = {
  catalog: CatalogSkin;
  baseName: string;
  liquidity: number;
  wears: WearPrices[];
};

function selectSkins(
  catalog: Map<string, CatalogSkin>,
  skinport: SkinportItem[],
  marketCsgo: Map<string, MarketCsgoItem>
): Selected[] {
  // agrupar precios por skin base (sin wear), excluyendo StatTrak/Souvenir.
  // OJO: Skinport repite el mismo market_hash_name para cada fase Doppler
  // (Ruby, Sapphire, Phase 1-4…) — hay que fusionar por base+wear tomando el
  // precio MÍNIMO real y sumando las unidades, si no el snapshot queda con
  // el precio de la última fase (p.ej. Ruby a 10× el precio base).
  const byBase = new Map<string, Map<string, WearPrices>>();
  for (const item of skinport) {
    if (item.market_hash_name.includes("StatTrak™") || item.market_hash_name.includes("Souvenir")) continue;
    const { base, wear } = stripWear(item.market_hash_name);
    if (!wear || !catalog.has(base)) continue;
    if (item.min_price == null) continue;

    const wears = byBase.get(base) ?? new Map<string, WearPrices>();
    const existing = wears.get(wear);
    if (!existing || !existing.skinport || item.min_price < (existing.skinport.min_price ?? Infinity)) {
      const mc = marketCsgo.get(item.market_hash_name);
      wears.set(wear, {
        wear,
        skinport: {
          ...item,
          quantity: (existing?.skinport?.quantity ?? 0) + (item.quantity ?? 0),
        },
        marketCsgo: mc ? { price: parseFloat(mc.price), volume: parseInt(mc.volume, 10) || 0 } : undefined,
      });
    } else if (existing.skinport) {
      existing.skinport.quantity = (existing.skinport.quantity ?? 0) + (item.quantity ?? 0);
    }
    byBase.set(base, wears);
  }

  const selected: Selected[] = [];
  for (const [base, wearMap] of byBase) {
    const cat = catalog.get(base)!;
    const wears = [...wearMap.values()];
    // liquidez: unidades listadas × precio mediano + volumen market.csgo × precio
    let liquidity = 0;
    for (const w of wears) {
      const p = w.skinport?.median_price ?? w.skinport?.min_price ?? 0;
      liquidity += (w.skinport?.quantity ?? 0) * (p ?? 0);
      if (w.marketCsgo) liquidity += w.marketCsgo.volume * w.marketCsgo.price;
    }
    if (liquidity <= 0) continue;
    selected.push({ catalog: cat, baseName: base, liquidity, wears });
  }

  selected.sort((a, b) => b.liquidity - a.liquidity);
  return selected.slice(0, N_SKINS);
}

// ─── carga en Neo4j ───────────────────────────────────────────────────────────

const MARKETPLACES = [
  { id: "mp-skinport", name: "Skinport", feePct: 12.0, url: "https://skinport.com" },
  { id: "mp-market-csgo", name: "Market.CSGO", feePct: 5.0, url: "https://market.csgo.com" },
  { id: "mp-steam", name: "Steam Market", feePct: 15.0, url: "https://steamcommunity.com/market" },
  { id: "mp-csfloat", name: "CSFloat", feePct: 2.0, url: "https://csfloat.com" },
];

async function wipe() {
  console.log("🧹 Borrando datos sintéticos ...");
  const session = driver.session();
  try {
    let deleted = 1;
    while (deleted > 0) {
      const res = await session.run(
        "MATCH (n) WITH n LIMIT 5000 DETACH DELETE n RETURN count(n) AS c"
      );
      deleted = res.records[0].get("c").toNumber();
    }
  } finally {
    await session.close();
  }
  console.log("  ✓ base vacía");
}

async function ensureConstraints() {
  const session = driver.session();
  const constraints = [
    "CREATE CONSTRAINT skin_id IF NOT EXISTS FOR (s:Skin) REQUIRE s.id IS UNIQUE",
    "CREATE CONSTRAINT weapon_id IF NOT EXISTS FOR (w:Weapon) REQUIRE w.id IS UNIQUE",
    "CREATE CONSTRAINT collection_id IF NOT EXISTS FOR (c:Collection) REQUIRE c.id IS UNIQUE",
    "CREATE CONSTRAINT marketplace_id IF NOT EXISTS FOR (m:Marketplace) REQUIRE m.id IS UNIQUE",
    "CREATE CONSTRAINT snapshot_id IF NOT EXISTS FOR (p:PriceSnapshot) REQUIRE p.id IS UNIQUE",
    "CREATE CONSTRAINT trader_id IF NOT EXISTS FOR (t:Trader) REQUIRE t.id IS UNIQUE",
    "CREATE CONSTRAINT instance_id IF NOT EXISTS FOR (i:SkinInstance) REQUIRE i.id IS UNIQUE",
    "CREATE CONSTRAINT tx_id IF NOT EXISTS FOR (tx:Transaction) REQUIRE tx.id IS UNIQUE",
  ];
  try {
    for (const c of constraints) await session.run(c);
  } finally {
    await session.close();
  }
}

async function load(selected: Selected[]) {
  const session = driver.session();
  const observedAt = new Date().toISOString();

  try {
    for (const mp of MARKETPLACES) {
      await session.run(
        `MERGE (m:Marketplace {id: $id}) SET m.name = $name, m.feePct = $feePct, m.url = $url`,
        mp
      );
    }

    let snapshots = 0;
    for (const sel of selected) {
      const cat = sel.catalog;
      const skinId = uid("skin", sel.baseName);
      const weaponName = cat.weapon?.name ?? sel.baseName.split(" | ")[0].replace(/^★\s*/, "");
      const weaponId = uid("w", weaponName);
      const collectionName = cat.collections?.[0]?.name ?? null;

      await session.run(
        `MERGE (w:Weapon {id: $weaponId}) SET w.name = $weaponName, w.category = $category
         MERGE (s:Skin {id: $skinId})
         SET s.name = $name, s.rarity = $rarity, s.rarityColor = $rarityColor,
             s.imageUrl = $imageUrl, s.minFloat = $minFloat, s.maxFloat = $maxFloat,
             s.pattern = $pattern, s.liquidityUsd = $liquidity, s.source = 'bymykel-csgo-api'
         MERGE (s)-[:FOR_WEAPON]->(w)
         FOREACH (cn IN CASE WHEN $collectionName IS NULL THEN [] ELSE [$collectionName] END |
           MERGE (c:Collection {id: $collectionId}) SET c.name = cn
           MERGE (s)-[:BELONGS_TO]->(c)
         )`,
        {
          weaponId,
          weaponName,
          category: cat.category?.name ?? "",
          skinId,
          name: sel.baseName,
          rarity: cat.rarity?.name ?? "",
          rarityColor: cat.rarity?.color ?? "",
          imageUrl: cat.image ?? "",
          minFloat: cat.min_float ?? null,
          maxFloat: cat.max_float ?? null,
          pattern: cat.pattern?.name ?? "",
          liquidity: Math.round(sel.liquidity),
          collectionName,
          collectionId: collectionName ? uid("col", collectionName) : "",
        }
      );

      for (const w of sel.wears) {
        if (w.skinport?.min_price != null) {
          await session.run(
            `MATCH (s:Skin {id: $skinId})
             MATCH (m:Marketplace {id: 'mp-skinport'})
             MERGE (p:PriceSnapshot {id: $pid})
             SET p.wear = $wear, p.priceUsd = $price, p.medianUsd = $median,
                 p.suggestedUsd = $suggested, p.quantity = $quantity,
                 p.observedAt = datetime($observedAt), p.url = $url
             MERGE (p)-[:FOR_SKIN]->(s)
             MERGE (p)-[:ON_MARKETPLACE]->(m)`,
            {
              skinId,
              pid: uid("ps-skinport", `${sel.baseName}-${w.wear}`),
              wear: w.wear,
              price: w.skinport.min_price,
              median: w.skinport.median_price ?? null,
              suggested: w.skinport.suggested_price ?? null,
              quantity: w.skinport.quantity ?? 0,
              observedAt,
              url: w.skinport.item_page ?? "",
            }
          );
          snapshots++;
        }
        if (w.marketCsgo && w.marketCsgo.price > 0) {
          await session.run(
            `MATCH (s:Skin {id: $skinId})
             MATCH (m:Marketplace {id: 'mp-market-csgo'})
             MERGE (p:PriceSnapshot {id: $pid})
             SET p.wear = $wear, p.priceUsd = $price, p.volume = $volume,
                 p.observedAt = datetime($observedAt)
             MERGE (p)-[:FOR_SKIN]->(s)
             MERGE (p)-[:ON_MARKETPLACE]->(m)`,
            {
              skinId,
              pid: uid("ps-mcsgo", `${sel.baseName}-${w.wear}`),
              wear: w.wear,
              price: w.marketCsgo.price,
              volume: w.marketCsgo.volume,
              observedAt,
            }
          );
          snapshots++;
        }
      }
    }
    console.log(`  ✓ ${selected.length} skins, ${snapshots} PriceSnapshots (Skinport + Market.CSGO)`);
  } finally {
    await session.close();
  }
}

async function loadSteam(selected: Selected[]) {
  console.log(`📡 Steam Market (top ${N_STEAM} skins, ~3.2s por request) ...`);
  const session = driver.session();
  let ok = 0;
  try {
    const top = selected.slice(0, N_STEAM);
    for (const sel of top) {
      // wear más líquido de esta skin
      const wear = [...sel.wears].sort(
        (a, b) => (b.skinport?.quantity ?? 0) - (a.skinport?.quantity ?? 0)
      )[0];
      if (!wear) continue;
      const hashName = `${sel.baseName} (${wear.wear})`;
      const price = await fetchSteamPrice(hashName);
      await sleep(3200);
      if (!price) continue;

      await session.run(
        `MATCH (s:Skin {id: $skinId})
         MATCH (m:Marketplace {id: 'mp-steam'})
         MERGE (p:PriceSnapshot {id: $pid})
         SET p.wear = $wear, p.priceUsd = $price, p.medianUsd = $median,
             p.volume = $volume, p.observedAt = datetime($observedAt)
         MERGE (p)-[:FOR_SKIN]->(s)
         MERGE (p)-[:ON_MARKETPLACE]->(m)`,
        {
          skinId: uid("skin", sel.baseName),
          pid: uid("ps-steam", `${sel.baseName}-${wear.wear}`),
          wear: wear.wear,
          price: price.lowest,
          median: price.median,
          volume: price.volume,
          observedAt: new Date().toISOString(),
        }
      );
      ok++;
      if (ok % 10 === 0) console.log(`  … ${ok}/${top.length}`);
    }
  } finally {
    await session.close();
  }
  console.log(`  ✓ ${ok} precios reales de Steam`);
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`🌐 Dataset real — ${N_SKINS} skins, ${N_STEAM} con precio Steam${WIPE ? ", WIPE previo" : ""}\n`);

  const [catalog, skinport, marketCsgo] = await Promise.all([
    fetchCatalog(),
    fetchSkinport(),
    fetchMarketCsgo(),
  ]);

  const selected = selectSkins(catalog, skinport, marketCsgo);
  console.log(`\n🎯 Seleccionadas ${selected.length} skins por liquidez real. Top 5:`);
  for (const s of selected.slice(0, 5)) {
    console.log(`   ${s.baseName}  (~$${Math.round(s.liquidity).toLocaleString()} en mercado)`);
  }

  if (WIPE) await wipe();
  await ensureConstraints();

  console.log("\n💾 Cargando en Neo4j ...");
  await load(selected);
  await loadSteam(selected);

  await driver.close();
  console.log("\n✅ Dataset real cargado.");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
