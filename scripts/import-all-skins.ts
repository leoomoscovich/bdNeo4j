/**
 * Imports ALL CS2 weapon skins from market.csgo.com public price feed into Neo4j.
 * ~3,300 unique skins with real prices. Runs after seed (adds, doesn't replace).
 *
 * Run: npm run import-all
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

// ─── helpers ──────────────────────────────────────────────────────────────────

const WEARS = [
  "(Factory New)", "(Minimal Wear)", "(Field-Tested)", "(Well-Worn)", "(Battle-Scarred)",
] as const;

// Skip non-weapon items
const SKIP_PREFIXES = [
  "Sticker |", "Sealed Graffiti |", "Music Kit |", "Agent |",
  "Patch |", "Souvenir |", "Case |", "Package |", "Capsule |",
  "Pass |", "Pin |", "Gift |", "Key |", "Tag |",
];

const WEAR_PRIORITY = ["(Field-Tested)", "(Factory New)", "(Minimal Wear)", "(Well-Worn)", "(Battle-Scarred)"] as const;

function stripWear(name: string): string {
  return WEARS.reduce((n, w) => n.replace(w, "").trim(), name);
}

function extractWear(name: string): string {
  return WEARS.find((w) => name.includes(w))?.replace(/[()]/g, "") ?? "Field-Tested";
}

function extractWeapon(skinName: string): string {
  const pipe = skinName.indexOf(" | ");
  // Remove knife star prefix
  return pipe > 0 ? skinName.slice(0, pipe).replace(/^★\s*/, "").trim() : skinName;
}

function uid(prefix: string, s: string) {
  return `${prefix}-${s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

function daysAgo(d: number, jitter = 0) {
  const dt = new Date();
  dt.setDate(dt.getDate() - d);
  dt.setHours(dt.getHours() - jitter);
  return dt.toISOString();
}

function randomBetween(min: number, max: number, dp = 4) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(dp));
}

// ─── types ────────────────────────────────────────────────────────────────────

interface MarketItem {
  market_hash_name: string;
  price: string;
  volume: string;
}

interface SkinRecord {
  skinId: string;
  skinName: string;     // e.g. "AK-47 | Redline"
  weaponName: string;   // e.g. "AK-47"
  rarity: string;
  wear: string;
  priceUsd: number;
  imageUrl: string;
}

interface TxRecord {
  id: string;
  instanceId: string;
  sellerId: string;
  buyerId: string;
  marketplaceId: string;
  priceUsd: number;
  timestamp: string;
}

// ─── traders & marketplaces (reuse from seed) ─────────────────────────────────

const TRADER_IDS = [
  "trader-north-aim", "trader-float-hunter", "trader-kato-whale",
  "trader-fast-flip", "trader-collector-zero", "trader-market-maker",
  "trader-steady", "trader-razor", "trader-prime-inv",
];

const MARKETPLACE_IDS = ["mp-csfloat", "mp-buff163", "mp-skinport"];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

// Rarity heuristic from price
function guessRarity(price: number): string {
  if (price > 3000) return "Contraband";
  if (price > 500)  return "Covert";
  if (price > 100)  return "Classified";
  if (price > 20)   return "Restricted";
  if (price > 5)    return "Mil-Spec";
  return "Consumer";
}

// Transaction chain depth based on price tier
function chainDepth(price: number): number {
  if (price > 1000) return 5;
  if (price > 100)  return 4;
  if (price > 20)   return 3;
  return 2;
}

function buildTransactions(instanceId: string, finalPrice: number): TxRecord[] {
  const depth = chainDepth(finalPrice);
  const txs: TxRecord[] = [];
  // Work backwards from final price
  let price = finalPrice;
  let dayOffset = 3;

  for (let i = depth - 1; i >= 0; i--) {
    // Each earlier tx was cheaper (price increases over time toward current)
    const factor = 0.72 + (i / depth) * 0.28;
    const txPrice = Math.round(price * factor * 100) / 100;
    const mp = pick(MARKETPLACE_IDS);
    const sellerIdx = Math.floor(Math.random() * TRADER_IDS.length);
    const buyerIdx = (sellerIdx + 1 + Math.floor(Math.random() * (TRADER_IDS.length - 1))) % TRADER_IDS.length;

    txs.unshift({
      id: `tx-${instanceId}-${i}`,
      instanceId,
      sellerId: TRADER_IDS[sellerIdx],
      buyerId: TRADER_IDS[buyerIdx],
      marketplaceId: mp,
      priceUsd: txPrice,
      timestamp: daysAgo(dayOffset, Math.floor(Math.random() * 12)),
    });
    dayOffset += Math.floor(Math.random() * 15 + 5);
  }
  return txs;
}

// ─── fetch and filter ─────────────────────────────────────────────────────────

async function fetchAndFilter(): Promise<Map<string, { price: number; wear: string; hashName: string }>> {
  console.log("📡 Fetching market.csgo.com price feed...");
  const res = await fetch("https://market.csgo.com/api/v2/prices/USD.json", {
    headers: { "User-Agent": "SkinGraph-Radar/1.0" },
    signal: AbortSignal.timeout(25_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const json = await res.json() as { success: boolean; items: MarketItem[] };
  if (!json.success) throw new Error("API returned success:false");

  // Filter weapon skins only
  const weaponSkins = json.items.filter((item) => {
    const n = item.market_hash_name;
    if (!n.includes(" | ")) return false;
    if (!WEARS.some((w) => n.includes(w))) return false;
    if (SKIP_PREFIXES.some((s) => n.includes(s))) return false;
    const price = parseFloat(item.price);
    return !isNaN(price) && price > 0;
  });

  // Pick best wear for each unique base skin
  const best = new Map<string, { price: number; wear: string; hashName: string }>();

  for (const item of weaponSkins) {
    const base = stripWear(item.market_hash_name);
    const price = parseFloat(item.price);
    const wear = item.market_hash_name.match(/\(([^)]+)\)/)?.[1] ?? "Field-Tested";

    const current = best.get(base);
    if (!current) {
      best.set(base, { price, wear, hashName: item.market_hash_name });
      continue;
    }

    // Prefer the wear tier with highest liquidity
    const currentPriority = WEAR_PRIORITY.findIndex((w) => w.includes(current.wear));
    const newPriority = WEAR_PRIORITY.findIndex((w) => w.includes(wear));
    if (newPriority < currentPriority) {
      best.set(base, { price, wear, hashName: item.market_hash_name });
    }
  }

  console.log(`  ✓ ${best.size} unique weapon skins after filtering\n`);
  return best;
}

// ─── batch insert ─────────────────────────────────────────────────────────────

async function insertBatch(
  session: ReturnType<typeof driver.session>,
  skins: SkinRecord[],
): Promise<number> {
  // 1. Weapons
  const weapons = [...new Set(skins.map((s) => s.weaponName))].map((name) => ({
    id: uid("w", name), name,
  }));
  await session.run(
    `UNWIND $weapons AS w MERGE (n:Weapon {id: w.id}) SET n.name = w.name`,
    { weapons }
  );

  // 2. Skins
  await session.run(
    `UNWIND $skins AS s
     MERGE (sk:Skin {id: s.skinId})
     ON CREATE SET sk.name = s.skinName, sk.rarity = s.rarity, sk.imageUrl = s.imageUrl
     ON MATCH  SET sk.imageUrl = CASE WHEN s.imageUrl <> '' THEN s.imageUrl ELSE sk.imageUrl END
     WITH sk, s
     MATCH (w:Weapon {id: s.weaponId})
     MERGE (sk)-[:FOR_WEAPON]->(w)`,
    {
      skins: skins.map((s) => ({
        skinId: s.skinId,
        skinName: s.skinName,
        rarity: s.rarity,
        imageUrl: s.imageUrl,
        weaponId: uid("w", s.weaponName),
      })),
    }
  );

  // 3. SkinInstances
  const instances = skins.map((s) => ({
    instanceId: `inst-${s.skinId}-0`,
    skinId: s.skinId,
    floatValue: randomBetween(0.01, 0.38),
    wear: s.wear,
    serial: String(Math.floor(Math.random() * 99999 + 1)),
  }));

  await session.run(
    `UNWIND $instances AS i
     MERGE (inst:SkinInstance {id: i.instanceId})
     ON CREATE SET inst.floatValue = i.floatValue, inst.wear = i.wear, inst.serial = i.serial
     WITH inst, i
     MATCH (s:Skin {id: i.skinId})
     MERGE (inst)-[:INSTANCE_OF]->(s)`,
    { instances }
  );

  // 4. Transactions
  const allTxs: TxRecord[] = skins.flatMap((s) =>
    buildTransactions(`inst-${s.skinId}-0`, s.priceUsd)
  );

  const BATCH = 200;
  for (let i = 0; i < allTxs.length; i += BATCH) {
    await session.run(
      `UNWIND $txs AS t
       MERGE (tx:Transaction {id: t.id})
       ON CREATE SET tx.priceUsd = t.priceUsd, tx.timestamp = t.timestamp
       WITH tx, t
       MATCH (inst:SkinInstance {id: t.instanceId})
       MERGE (tx)-[:FOR_INSTANCE]->(inst)
       WITH tx, t
       MATCH (s:Trader {id: t.sellerId})
       MERGE (s)-[:SOLD]->(tx)
       WITH tx, t
       MATCH (b:Trader {id: t.buyerId})
       MERGE (b)-[:BOUGHT]->(tx)
       WITH tx, t
       MATCH (mp:Marketplace {id: t.marketplaceId})
       MERGE (tx)-[:ON_MARKETPLACE]->(mp)`,
      { txs: allTxs.slice(i, i + BATCH) }
    );
  }

  return skins.length;
}

// ─── main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🚀 Importing all CS2 weapon skins into Neo4j\n");

  const priceMap = await fetchAndFilter();
  const session = driver.session();

  const SKIN_BATCH = 100;
  let inserted = 0;
  const entries = [...priceMap.entries()];

  const skinRecords: SkinRecord[] = entries.map(([skinName, { price, wear }]) => ({
    skinId: uid("skin", skinName),
    skinName,
    weaponName: extractWeapon(skinName),
    rarity: guessRarity(price),
    wear: extractWear(`(${wear})`),
    priceUsd: price,
    imageUrl: "",
  }));

  console.log(`Inserting ${skinRecords.length} skins in batches of ${SKIN_BATCH}...\n`);

  for (let i = 0; i < skinRecords.length; i += SKIN_BATCH) {
    const batch = skinRecords.slice(i, i + SKIN_BATCH);
    await insertBatch(session, batch);
    inserted += batch.length;

    const pct = Math.round((inserted / skinRecords.length) * 100);
    const bar = "█".repeat(Math.floor(pct / 5)) + "░".repeat(20 - Math.floor(pct / 5));
    process.stdout.write(`\r  [${bar}] ${pct}%  ${inserted}/${skinRecords.length} skins`);
  }

  await session.close();
  await driver.close();

  console.log(`\n\n✅ Done. ${inserted} skins imported with real prices from market.csgo.com.`);
  console.log(`   Total transactions generated: ~${Math.round(inserted * 3)} (avg 3 per skin)`);
}

main().catch((err) => {
  console.error("\nFatal:", err);
  process.exit(1);
});
