/**
 * Ingests real skin listings from CSFloat public API into Neo4j.
 * Run AFTER npm run seed to supplement seed data with real prices.
 *
 * CSFloat public endpoint: GET /api/v1/listings (no auth required for basic queries)
 * Falls back to Skinport public API if CSFloat is unavailable.
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

// ─── CSFloat API types ────────────────────────────────────────────────────────

interface CSFloatListing {
  id: string;
  price: number; // in cents
  seller: { username: string; away: boolean; stall_private?: boolean };
  item: {
    market_hash_name: string;
    wear_name: string;
    float_value: number;
    paint_seed?: number;
    rarity_name?: string;
    type_name?: string;
    icon_url?: string;
  };
  created_at: string;
}

interface CSFloatResponse {
  data: CSFloatListing[];
  count: number;
}

// ─── fetch listings ───────────────────────────────────────────────────────────

async function fetchCSFloatListings(limit = 100): Promise<CSFloatListing[]> {
  console.log("📡 Fetching from CSFloat public API...");
  const url = `https://csfloat.com/api/v1/listings?limit=${limit}&sort_by=lowest_price`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "SkinGraph-Radar/1.0 (university-project)",
      "Accept": "application/json",
    },
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    throw new Error(`CSFloat API ${res.status}: ${res.statusText}`);
  }

  const json: CSFloatResponse = await res.json();
  console.log(`  ✓ Got ${json.data?.length ?? 0} listings from CSFloat`);
  return json.data ?? [];
}

// Skinport public API as fallback (returns current market listings)
async function fetchSkinportListings(limit = 100): Promise<CSFloatListing[]> {
  console.log("📡 Fetching from Skinport public API (fallback)...");
  const url = `https://skinport.com/api/v1/items?app_id=730&currency=USD&tradable=0`;

  const res = await fetch(url, {
    headers: { "Accept": "application/json" },
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) throw new Error(`Skinport API ${res.status}`);

  const items: Array<{
    market_hash_name: string;
    min_price: number;
    quantity: number;
    item_page?: string;
  }> = await res.json();

  // Convert to CSFloat-like shape
  return items.slice(0, limit).map((item, i) => ({
    id: `skinport-${i}`,
    price: Math.round(item.min_price * 100),
    seller: { username: `skinport_seller_${i}`, away: false },
    item: {
      market_hash_name: item.market_hash_name,
      wear_name: parseWearFromName(item.market_hash_name),
      float_value: Math.random() * 0.3,
      rarity_name: "",
      icon_url: "",
    },
    created_at: new Date().toISOString(),
  }));
}

function parseWearFromName(name: string): string {
  if (name.includes("Factory New")) return "Factory New";
  if (name.includes("Minimal Wear")) return "Minimal Wear";
  if (name.includes("Field-Tested")) return "Field-Tested";
  if (name.includes("Well-Worn")) return "Well-Worn";
  if (name.includes("Battle-Scarred")) return "Battle-Scarred";
  return "Field-Tested";
}

function parseWeaponFromName(marketHashName: string): string {
  const knownWeapons = [
    "AK-47", "AWP", "M4A1-S", "M4A4", "USP-S", "Desert Eagle", "Glock-18",
    "Karambit", "Butterfly Knife", "M9 Bayonet", "SSG 08", "SG 553",
    "MAC-10", "MP9", "FAMAS", "AUG", "P90", "MP5-SD", "UMP-45",
    "P250", "Five-SeveN", "Tec-9", "CZ75-Auto", "Dual Berettas",
    "SCAR-20", "G3SG1", "Nova", "XM1014", "MAG-7", "Sawed-Off",
    "M249", "Negev", "R8 Revolver",
  ];

  for (const w of knownWeapons) {
    if (marketHashName.startsWith(w)) return w;
  }
  const pipe = marketHashName.indexOf(" | ");
  return pipe > 0 ? marketHashName.slice(0, pipe) : marketHashName.split(" ")[0];
}

// ─── ingest into Neo4j ────────────────────────────────────────────────────────

async function ingestListings(listings: CSFloatListing[]) {
  const session = driver.session();
  let ingested = 0;

  try {
    for (const listing of listings) {
      const skinName = listing.item.market_hash_name.replace(/ \(Factory New\)| \(Minimal Wear\)| \(Field-Tested\)| \(Well-Worn\)| \(Battle-Scarred\)/g, "");
      const weaponName = parseWeaponFromName(skinName);
      const priceUsd = listing.price / 100;
      if (priceUsd <= 0) continue;

      const skinId = `skin-${skinName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
      const weaponId = `w-${weaponName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
      const sellerId = `trader-ext-${listing.seller.username.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
      const instanceId = `inst-ext-${listing.id}`;
      const txId = `tx-ext-${listing.id}`;

      await session.run(
        `MERGE (w:Weapon {id: $weaponId}) SET w.name = $weaponName
         MERGE (s:Skin {id: $skinId})
           ON CREATE SET s.name = $skinName, s.rarity = $rarity, s.imageUrl = $imageUrl
         MERGE (s)-[:FOR_WEAPON]->(w)
         MERGE (t:Trader {id: $sellerId})
           ON CREATE SET t.name = $sellerName, t.handle = $sellerName, t.country = 'EXT',
                         t.reputation = 0.6, t.riskScore = 20
         MERGE (i:SkinInstance {id: $instanceId})
           ON CREATE SET i.floatValue = $floatValue, i.wear = $wear, i.serial = $instanceId
         MERGE (i)-[:INSTANCE_OF]->(s)
         MERGE (tx:Transaction {id: $txId})
           ON CREATE SET tx.priceUsd = $priceUsd, tx.timestamp = $timestamp
         MERGE (tx)-[:FOR_INSTANCE]->(i)
         MERGE (t)-[:SOLD]->(tx)
         WITH tx
         MATCH (mp:Marketplace {id: 'mp-csfloat'})
         MERGE (tx)-[:ON_MARKETPLACE]->(mp)`,
        {
          weaponId,
          weaponName,
          skinId,
          skinName,
          rarity: listing.item.rarity_name ?? "",
          imageUrl: listing.item.icon_url ?? "",
          sellerId,
          sellerName: listing.seller.username,
          instanceId,
          floatValue: listing.item.float_value ?? 0.15,
          wear: listing.item.wear_name ?? "Field-Tested",
          txId,
          priceUsd,
          timestamp: listing.created_at ?? new Date().toISOString(),
        }
      );
      ingested++;
    }
  } finally {
    await session.close();
  }

  return ingested;
}

// ─── main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌐 CSFloat / Skinport ingester\n");

  let listings: CSFloatListing[] = [];

  try {
    listings = await fetchCSFloatListings(100);
  } catch (err) {
    console.warn(`  ⚠ CSFloat failed: ${err instanceof Error ? err.message : err}`);
    try {
      listings = await fetchSkinportListings(100);
    } catch (err2) {
      console.error(`  ❌ Skinport also failed: ${err2 instanceof Error ? err2.message : err2}`);
      console.log("\nTip: verificá tu conexión a internet o corré solo el seed base con npm run seed.");
      process.exit(1);
    }
  }

  if (listings.length === 0) {
    console.log("No listings received. Exiting.");
    process.exit(0);
  }

  console.log(`\n💾 Ingesting ${listings.length} listings into Neo4j...`);
  const ingested = await ingestListings(listings);
  console.log(`\n✅ Ingested ${ingested} real listings from external API.`);

  await driver.close();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
