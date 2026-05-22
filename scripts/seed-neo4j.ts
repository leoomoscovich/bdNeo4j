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

function daysAgo(days: number, jitterHours = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(d.getHours() - jitterHours);
  return d.toISOString();
}

function uid(prefix: string, name: string) {
  return `${prefix}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

function randomBetween(min: number, max: number, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── static data ──────────────────────────────────────────────────────────────

const WEAPONS = [
  "AK-47", "AWP", "M4A1-S", "M4A4", "USP-S", "Desert Eagle",
  "Glock-18", "Karambit", "Butterfly Knife", "M9 Bayonet",
  "SSG 08", "SG 553", "MAC-10", "MP9", "FAMAS", "AUG", "P90",
];

const COLLECTIONS = [
  "The Phoenix Collection",
  "The Fracture Collection",
  "The Shadow Collection",
  "The Wildfire Collection",
  "The Arms Deal Collection",
  "The Cobblestone Collection",
  "The Prisma Collection",
  "The Danger Zone Collection",
  "Operation Broken Fang Collection",
  "The Riptide Collection",
  "The Recoil Collection",
  "The Revolution Collection",
];

const MARKETPLACES = [
  { id: "mp-csfloat", name: "CSFloat", feePct: 2.0, url: "https://csfloat.com" },
  { id: "mp-buff163", name: "BUFF163", feePct: 2.5, url: "https://buff.163.com" },
  { id: "mp-skinport", name: "Skinport", feePct: 12.0, url: "https://skinport.com" },
];

const TRADERS = [
  { id: "trader-north-aim", name: "north_aim", handle: "north_aim", country: "DK", reputation: 0.94, riskScore: 8 },
  { id: "trader-float-hunter", name: "float_hunter", handle: "float_hunter", country: "AR", reputation: 0.88, riskScore: 14 },
  { id: "trader-kato-whale", name: "kato_whale", handle: "kato_whale", country: "DE", reputation: 0.97, riskScore: 5 },
  { id: "trader-fast-flip", name: "fast_flip", handle: "fast_flip", country: "US", reputation: 0.72, riskScore: 32 },
  { id: "trader-collector-zero", name: "collector_zero", handle: "collector_zero", country: "BR", reputation: 0.91, riskScore: 11 },
  { id: "trader-market-maker", name: "market_maker", handle: "market_maker", country: "SE", reputation: 0.84, riskScore: 19 },
  { id: "trader-shadow-a", name: "shadow_a", handle: "shadow_a", country: "NL", reputation: 0.35, riskScore: 82 },
  { id: "trader-shadow-b", name: "shadow_b", handle: "shadow_b", country: "NL", reputation: 0.31, riskScore: 88 },
  { id: "trader-shadow-c", name: "shadow_c", handle: "shadow_c", country: "NL", reputation: 0.29, riskScore: 91 },
  { id: "trader-steady", name: "steady_inventory", handle: "steady_inventory", country: "CA", reputation: 0.79, riskScore: 24 },
  { id: "trader-razor", name: "razor_edge", handle: "razor_edge", country: "FR", reputation: 0.86, riskScore: 16 },
  { id: "trader-prime-inv", name: "prime_inv", handle: "prime_inv", country: "AU", reputation: 0.90, riskScore: 12 },
];

// (name, weapon, collection, rarity, basePrice)
const SKINS: [string, string, string, string, number][] = [
  // AK-47
  ["AK-47 | Redline",           "AK-47",         "The Phoenix Collection",        "Classified",  30],
  ["AK-47 | Case Hardened",     "AK-47",         "The Arms Deal Collection",      "Classified",  210],
  ["AK-47 | Vulcan",            "AK-47",         "The Operation Breakout Weap.",  "Classified",  85],
  ["AK-47 | Fire Serpent",      "AK-47",         "The Cobblestone Collection",    "Covert",      850],
  ["AK-47 | Bloodsport",        "AK-47",         "The Danger Zone Collection",    "Covert",      55],
  ["AK-47 | Neon Revolution",   "AK-47",         "The Chroma 2 Collection",       "Covert",      45],
  ["AK-47 | Fuel Injector",     "AK-47",         "The Wildfire Collection",       "Covert",      100],
  ["AK-47 | Asiimov",           "AK-47",         "The Phoenix Collection",        "Covert",      185],
  ["AK-47 | Slate",             "AK-47",         "The Revolution Collection",     "Consumer",    3],
  // AWP
  ["AWP | Asiimov",             "AWP",           "The Phoenix Collection",        "Covert",      72],
  ["AWP | Dragon Lore",         "AWP",           "The Cobblestone Collection",    "Covert",      2600],
  ["AWP | Medusa",              "AWP",           "The Gods and Monsters Coll.",   "Covert",      1250],
  ["AWP | Hyper Beast",         "AWP",           "The Falchion Collection",       "Covert",      88],
  ["AWP | Wildfire",            "AWP",           "The Wildfire Collection",       "Covert",      620],
  ["AWP | Oni Taiji",           "AWP",           "The Operation Broken Fang Collection", "Covert", 265],
  ["AWP | Neo-Noir",            "AWP",           "The Clutch Collection",         "Covert",      155],
  ["AWP | Atheris",             "AWP",           "The Prisma Collection",         "Classified",  32],
  // M4
  ["M4A1-S | Printstream",      "M4A1-S",        "The Fracture Collection",       "Covert",      165],
  ["M4A1-S | Hot Rod",          "M4A1-S",        "The Chroma 2 Collection",       "Classified",  255],
  ["M4A1-S | Knight",           "M4A1-S",        "The Gamma Collection",          "Classified",  660],
  ["M4A1-S | Nightmare",        "M4A1-S",        "The Shadow Collection",         "Covert",      32],
  ["M4A4 | Howl",               "M4A4",          "The Huntsman Collection",       "Contraband",  2100],
  ["M4A4 | The Emperor",        "M4A4",          "The Prisma Collection",         "Covert",      27],
  ["M4A4 | Neo-Noir",           "M4A4",          "The Clutch Collection",         "Covert",      38],
  ["M4A4 | Spider Lily",        "M4A4",          "The Recoil Collection",         "Covert",      82],
  // USP / DEagle / Glock
  ["USP-S | Kill Confirmed",    "USP-S",         "The Shadow Collection",         "Covert",      185],
  ["USP-S | Orion",             "USP-S",         "The Chroma 2 Collection",       "Classified",  58],
  ["Desert Eagle | Printstream","Desert Eagle",  "The Fracture Collection",       "Covert",      155],
  ["Desert Eagle | Blaze",      "Desert Eagle",  "The Arms Deal Collection",      "Restricted",  515],
  ["Glock-18 | Fade",           "Glock-18",      "The Assault Collection",        "Restricted",  660],
  ["Glock-18 | Gamma Doppler",  "Glock-18",      "The Gamma 2 Collection",        "Covert",      310],
  // Knives
  ["Karambit | Doppler",        "Karambit",      "N/A",                           "Covert",      940],
  ["Karambit | Fade",           "Karambit",      "N/A",                           "Covert",      1250],
  ["Karambit | Case Hardened",  "Karambit",      "N/A",                           "Covert",      820],
  ["Butterfly Knife | Doppler", "Butterfly Knife","N/A",                          "Covert",      1850],
  ["M9 Bayonet | Lore",         "M9 Bayonet",    "N/A",                           "Covert",      620],
  // Rifles
  ["SG 553 | Integrale",        "SG 553",        "The Danger Zone Collection",    "Classified",  26],
  ["SSG 08 | Blood in the Water","SSG 08",       "The Riptide Collection",        "Covert",      310],
  ["FAMAS | Mecha Industries",  "FAMAS",         "The Revolution Collection",     "Classified",  22],
  ["AUG | Akihabara Accept",    "AUG",           "The Operation Vanguard Coll.",  "Classified",  52],
  // SMGs
  ["MAC-10 | Neon Rider",       "MAC-10",        "The Prisma Collection",         "Covert",      38],
  ["MP9 | Featherweight",       "MP9",           "The Chroma Collection",         "Classified",  9],
  ["P90 | Asiimov",             "P90",           "The Phoenix Collection",        "Classified",  26],
  // More
  ["AK-47 | Wasteland Rebel",   "AK-47",         "The Chroma 2 Collection",       "Classified",  22],
  ["AWP | BOOM",                "AWP",           "The CS20 Collection",           "Classified",  16],
  ["M4A1-S | Mecha Industries", "M4A1-S",        "The Revolution Collection",     "Classified",  18],
  ["USP-S | Monster Mashup",    "USP-S",         "The Halloween Collection",      "Classified",  26],
  ["Desert Eagle | Sunset Storm","Desert Eagle", "The Recoil Collection",         "Classified",  8],
  ["Glock-18 | Water Elemental","Glock-18",      "The Breakout Collection",       "Restricted",  12],
  ["SSG 08 | Dragonfire",       "SSG 08",        "The Wildfire Collection",       "Covert",      52],
];

// Wear tiers for instances
const WEAR_TIERS: { wear: string; floatMin: number; floatMax: number }[] = [
  { wear: "Factory New", floatMin: 0.00, floatMax: 0.07 },
  { wear: "Minimal Wear", floatMin: 0.07, floatMax: 0.15 },
  { wear: "Field-Tested", floatMin: 0.15, floatMax: 0.38 },
  { wear: "Well-Worn", floatMin: 0.38, floatMax: 0.45 },
  { wear: "Battle-Scarred", floatMin: 0.45, floatMax: 1.00 },
];

function pickWear(): { wear: string; floatValue: number } {
  const tier = pick(WEAR_TIERS.slice(0, 3)); // mostly FN/MW/FT
  return {
    wear: tier.wear,
    floatValue: randomBetween(tier.floatMin, tier.floatMax, 4),
  };
}

function floatMultiplier(floatValue: number, wear: string): number {
  if (wear === "Factory New" && floatValue < 0.01) return 1.6;
  if (wear === "Factory New") return 1.15;
  if (wear === "Minimal Wear") return 1.0;
  if (wear === "Field-Tested") return 0.75;
  if (wear === "Well-Worn") return 0.55;
  return 0.4;
}

// ─── seeding functions ─────────────────────────────────────────────────────────

async function clearDatabase(session: ReturnType<typeof driver.session>) {
  console.log("🗑  Clearing database...");
  await session.run("MATCH (n) DETACH DELETE n");
}

async function createConstraints(session: ReturnType<typeof driver.session>) {
  const constraints = [
    "CREATE CONSTRAINT skin_id IF NOT EXISTS FOR (n:Skin) REQUIRE n.id IS UNIQUE",
    "CREATE CONSTRAINT instance_id IF NOT EXISTS FOR (n:SkinInstance) REQUIRE n.id IS UNIQUE",
    "CREATE CONSTRAINT trader_id IF NOT EXISTS FOR (n:Trader) REQUIRE n.id IS UNIQUE",
    "CREATE CONSTRAINT transaction_id IF NOT EXISTS FOR (n:Transaction) REQUIRE n.id IS UNIQUE",
    "CREATE CONSTRAINT marketplace_id IF NOT EXISTS FOR (n:Marketplace) REQUIRE n.id IS UNIQUE",
    "CREATE CONSTRAINT weapon_id IF NOT EXISTS FOR (n:Weapon) REQUIRE n.id IS UNIQUE",
    "CREATE CONSTRAINT collection_id IF NOT EXISTS FOR (n:Collection) REQUIRE n.id IS UNIQUE",
  ];
  for (const c of constraints) {
    try { await session.run(c); } catch { /* already exists */ }
  }
}

async function seedWeaponsAndCollections(session: ReturnType<typeof driver.session>) {
  // Weapons
  await session.run(
    `UNWIND $weapons AS w
     MERGE (n:Weapon {id: w.id}) SET n.name = w.name`,
    { weapons: WEAPONS.map((name) => ({ id: uid("w", name), name })) }
  );

  // Collections
  await session.run(
    `UNWIND $cols AS c
     MERGE (n:Collection {id: c.id}) SET n.name = c.name`,
    { cols: COLLECTIONS.map((name) => ({ id: uid("c", name), name })) }
  );
  console.log(`  ✓ ${WEAPONS.length} weapons, ${COLLECTIONS.length} collections`);
}

async function seedMarketplaces(session: ReturnType<typeof driver.session>) {
  await session.run(
    `UNWIND $mps AS m
     MERGE (n:Marketplace {id: m.id})
     SET n.name = m.name, n.feePct = m.feePct, n.url = m.url`,
    { mps: MARKETPLACES }
  );
  console.log(`  ✓ ${MARKETPLACES.length} marketplaces`);
}

async function seedTraders(session: ReturnType<typeof driver.session>) {
  await session.run(
    `UNWIND $traders AS t
     MERGE (n:Trader {id: t.id})
     SET n.name = t.name, n.handle = t.handle, n.country = t.country,
         n.reputation = t.reputation, n.riskScore = t.riskScore,
         n.firstSeenAt = t.firstSeenAt`,
    {
      traders: TRADERS.map((t) => ({
        ...t,
        firstSeenAt: daysAgo(Math.floor(Math.random() * 700 + 60)),
      })),
    }
  );

  // Legitimate clusters
  const legitimateConnections = [
    ["trader-north-aim", "trader-float-hunter"],
    ["trader-float-hunter", "trader-kato-whale"],
    ["trader-kato-whale", "trader-collector-zero"],
    ["trader-fast-flip", "trader-market-maker"],
    ["trader-market-maker", "trader-steady"],
    ["trader-steady", "trader-razor"],
    ["trader-razor", "trader-prime-inv"],
    ["trader-north-aim", "trader-market-maker"],
  ];

  for (const [a, b] of legitimateConnections) {
    await session.run(
      `MATCH (a:Trader {id: $a}), (b:Trader {id: $b})
       MERGE (a)-[:CONNECTED_TO]->(b)
       MERGE (b)-[:CONNECTED_TO]->(a)`,
      { a, b }
    );
  }

  // Suspicious cycle: shadow_a → shadow_b → shadow_c → shadow_a
  await session.run(
    `MATCH (a:Trader {id: 'trader-shadow-a'}),
           (b:Trader {id: 'trader-shadow-b'}),
           (c:Trader {id: 'trader-shadow-c'})
     MERGE (a)-[:CONNECTED_TO]->(b)
     MERGE (b)-[:CONNECTED_TO]->(c)
     MERGE (c)-[:CONNECTED_TO]->(a)`,
    {}
  );

  console.log(`  ✓ ${TRADERS.length} traders + connections`);
}

async function seedSkins(session: ReturnType<typeof driver.session>) {
  for (const [name, weapon, collection] of SKINS) {
    const skinId = uid("skin", name);
    const weaponId = uid("w", weapon);
    const collectionId = uid("c", collection);
    const rarity = SKINS.find((s) => s[0] === name)![3];

    await session.run(
      `MERGE (s:Skin {id: $skinId})
       SET s.name = $name, s.rarity = $rarity, s.imageUrl = ''
       WITH s
       MATCH (w:Weapon {id: $weaponId})
       MERGE (s)-[:FOR_WEAPON]->(w)
       WITH s
       MERGE (c:Collection {id: $collectionId})
       MERGE (s)-[:BELONGS_TO]->(c)`,
      { skinId, name, rarity, weaponId, collectionId }
    );
  }
  console.log(`  ✓ ${SKINS.length} skins`);
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

function buildChain(
  instanceId: string,
  basePrice: number,
  traderIds: string[],
  startDaysAgo: number,
  txCount: number
): TxRecord[] {
  const txs: TxRecord[] = [];
  let price = basePrice;
  let dayOffset = startDaysAgo;

  for (let i = 0; i < txCount; i++) {
    const sellerId = traderIds[i % traderIds.length];
    const buyerId = traderIds[(i + 1) % traderIds.length];
    const mp = pick(MARKETPLACES);
    const priceChange = randomBetween(-0.08, 0.18);
    price = Math.round(price * (1 + priceChange) * 100) / 100;
    dayOffset -= Math.floor(Math.random() * 8 + 2);

    txs.push({
      id: `tx-${instanceId}-${i}`,
      instanceId,
      sellerId,
      buyerId,
      marketplaceId: mp.id,
      priceUsd: price,
      timestamp: daysAgo(dayOffset, Math.floor(Math.random() * 12)),
    });
  }
  return txs;
}

function buildSuspiciousCycle(
  instanceId: string,
  basePrice: number,
  startDaysAgo: number
): TxRecord[] {
  const shadow = ["trader-shadow-a", "trader-shadow-b", "trader-shadow-c"];
  const txs: TxRecord[] = [];
  let price = basePrice;
  let dayOffset = startDaysAgo;

  // shadow_a → shadow_b → shadow_c → shadow_a (price pumped each step)
  for (let i = 0; i < 4; i++) {
    const sellerId = shadow[i % 3];
    const buyerId = shadow[(i + 1) % 3];
    price = Math.round(price * randomBetween(1.12, 1.28) * 100) / 100;
    dayOffset -= Math.floor(Math.random() * 3 + 1);

    txs.push({
      id: `tx-${instanceId}-cycle-${i}`,
      instanceId,
      sellerId,
      buyerId,
      marketplaceId: pick(MARKETPLACES).id,
      priceUsd: price,
      timestamp: daysAgo(dayOffset, Math.floor(Math.random() * 6)),
    });
  }
  return txs;
}

async function seedInstancesAndTransactions(session: ReturnType<typeof driver.session>) {
  const legitimateTraders = TRADERS.filter((t) => !t.id.includes("shadow")).map((t) => t.id);
  const allTransactions: TxRecord[] = [];
  let instanceCount = 0;

  for (const [name, , , , basePrice] of SKINS) {
    const skinId = uid("skin", name);
    // 1-3 instances per skin (expensive skins get fewer)
    const instancesForSkin = basePrice > 500 ? 1 : basePrice > 100 ? 2 : 3;

    for (let inst = 0; inst < instancesForSkin; inst++) {
      const { wear, floatValue } = pickWear();
      const adjustedPrice = Math.round(basePrice * floatMultiplier(floatValue, wear) * 100) / 100;
      const instanceId = `inst-${skinId}-${inst}`;
      const serial = `${Math.floor(Math.random() * 99999) + 1}`;

      await session.run(
        `MERGE (i:SkinInstance {id: $instanceId})
         SET i.floatValue = $floatValue, i.wear = $wear, i.serial = $serial
         WITH i
         MATCH (s:Skin {id: $skinId})
         MERGE (i)-[:INSTANCE_OF]->(s)`,
        { instanceId, floatValue, wear, serial, skinId }
      );
      instanceCount++;

      // Generate transaction chain
      const txCount = Math.floor(Math.random() * 4 + 3); // 3-6 txs
      const traderSubset = legitimateTraders.sort(() => Math.random() - 0.5).slice(0, 4);
      const chain = buildChain(instanceId, adjustedPrice, traderSubset, 90 - inst * 5, txCount);
      allTransactions.push(...chain);
    }
  }

  // 3 suspicious skin instances with cycle patterns
  const SUSPICIOUS_SKINS = [
    { name: "AK-47 | Case Hardened",  inst: 99, basePrice: 4200  }, // blue gem
    { name: "AWP | Dragon Lore",       inst: 99, basePrice: 2800  },
    { name: "Karambit | Fade",         inst: 99, basePrice: 1500  },
  ];

  for (const { name, inst, basePrice } of SUSPICIOUS_SKINS) {
    const skinId = uid("skin", name);
    const instanceId = `inst-${skinId}-${inst}`;

    await session.run(
      `MERGE (i:SkinInstance {id: $instanceId})
       SET i.floatValue = $floatValue, i.wear = $wear, i.serial = $serial
       WITH i
       MATCH (s:Skin {id: $skinId})
       MERGE (i)-[:INSTANCE_OF]->(s)`,
      {
        instanceId,
        floatValue: randomBetween(0.001, 0.005, 4),
        wear: "Factory New",
        serial: `SUSPICIOUS-${inst}`,
        skinId,
      }
    );
    instanceCount++;

    // First, a legitimate buy by shadow_a
    const preChain = buildChain(instanceId, basePrice * 0.7, [
      pick(legitimateTraders),
      "trader-shadow-a",
    ], 45, 2);
    allTransactions.push(...preChain);

    // Then the suspicious cycle
    const cycleChain = buildSuspiciousCycle(instanceId, basePrice * 0.85, 35);
    allTransactions.push(...cycleChain);
  }

  console.log(`  ✓ ${instanceCount} instances, ${allTransactions.length} transactions queued`);

  // Bulk insert transactions + relationships
  const batchSize = 50;
  for (let i = 0; i < allTransactions.length; i += batchSize) {
    const batch = allTransactions.slice(i, i + batchSize);
    await session.run(
      `UNWIND $txs AS t
       MERGE (tx:Transaction {id: t.id})
       SET tx.priceUsd = t.priceUsd, tx.timestamp = t.timestamp
       WITH tx, t
       MATCH (i:SkinInstance {id: t.instanceId})
       MERGE (tx)-[:FOR_INSTANCE]->(i)
       WITH tx, t
       MATCH (seller:Trader {id: t.sellerId})
       MERGE (seller)-[:SOLD]->(tx)
       WITH tx, t
       MATCH (buyer:Trader {id: t.buyerId})
       MERGE (buyer)-[:BOUGHT]->(tx)
       WITH tx, t
       MATCH (mp:Marketplace {id: t.marketplaceId})
       MERGE (tx)-[:ON_MARKETPLACE]->(mp)`,
      { txs: batch }
    );
  }
  console.log(`  ✓ ${allTransactions.length} transactions inserted`);
}

// ─── main ──────────────────────────────────────────────────────────────────────

async function seedDatabase() {
  const session = driver.session();
  try {
    console.log("🌱 Seeding Neo4j database...\n");
    await clearDatabase(session);
    await createConstraints(session);
    await seedWeaponsAndCollections(session);
    await seedMarketplaces(session);
    await seedTraders(session);
    await seedSkins(session);
    await seedInstancesAndTransactions(session);
    console.log("\n✅ Database seeding complete!");
  } catch (error) {
    console.error("❌ Seeding error:", error);
    throw error;
  } finally {
    await session.close();
    await driver.close();
  }
}

seedDatabase();
