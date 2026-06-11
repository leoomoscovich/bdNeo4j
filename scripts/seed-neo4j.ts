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

function rand(min: number, max: number, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

// ─── fetch skin images from ByMykel CSGO-API (free, no auth) ─────────────────

async function fetchSkinImages(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    console.log("  Fetching skin images from ByMykel CSGO-API...");
    const res = await fetch("https://bymykel.github.io/CSGO-API/api/en/skins.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const skins = await res.json() as Array<{ name: string; image: string }>;
    for (const s of skins) {
      if (s.name && s.image) map.set(s.name, s.image);
    }
    console.log(`  ✓ ${map.size} image URLs loaded`);
  } catch (e) {
    console.log(`  ⚠  Image fetch failed (${e}) — imageUrl will be empty`);
  }
  return map;
}

// ─── static data ──────────────────────────────────────────────────────────────

const WEAPONS = [
  "AK-47", "AWP", "M4A1-S", "M4A4", "USP-S", "Desert Eagle",
  "Glock-18", "Karambit", "Butterfly Knife", "M9 Bayonet",
  "SSG 08", "SG 553", "MAC-10", "MP9", "FAMAS", "AUG", "P90",
  "Galil AR", "Five-SeveN", "CZ75-Auto", "P2000", "Tec-9",
  "Nova", "XM1014", "MAG-7", "Flip Knife", "Gut Knife",
  "Falchion Knife", "Shadow Daggers", "Stiletto Knife", "Bowie Knife",
  "Navaja Knife", "Talon Knife", "Skeleton Knife", "MP5-SD", "MP7",
  "UMP-45", "M249", "Negev",
];

const COLLECTIONS = [
  "The Phoenix Collection", "The Fracture Collection", "The Shadow Collection",
  "The Wildfire Collection", "The Arms Deal Collection", "The Cobblestone Collection",
  "The Prisma Collection", "The Danger Zone Collection", "Operation Broken Fang Collection",
  "The Riptide Collection", "The Recoil Collection", "The Revolution Collection",
  "The Clutch Collection", "The Gamma Collection", "The CS20 Collection",
  "The Falchion Collection", "The Chroma 2 Collection", "The Breakout Collection",
  "The Prisma 2 Collection", "The Dreams & Nightmares Collection",
  "The Spectrum 2 Collection", "The Canals Collection", "The Hydra Collection",
  "The St. Marc Collection", "The Rising Sun Collection",
];

const MARKETPLACES = [
  { id: "mp-csfloat",  name: "CSFloat",     feePct: 2.0,  url: "https://csfloat.com" },
  { id: "mp-buff163",  name: "BUFF163",     feePct: 2.5,  url: "https://buff.163.com" },
  { id: "mp-skinport", name: "Skinport",    feePct: 12.0, url: "https://skinport.com" },
  { id: "mp-csdeals",  name: "CS.DEALS",    feePct: 5.0,  url: "https://cs.deals" },
  { id: "mp-dmarket",  name: "DMarket",     feePct: 5.0,  url: "https://dmarket.com" },
];

// Legit traders — cluster A: high-rep regulars
const TRADERS_A = [
  { id: "trader-north-aim",      handle: "north_aim",       country: "DK", reputation: 0.94, riskScore: 8  },
  { id: "trader-float-hunter",   handle: "float_hunter",    country: "AR", reputation: 0.88, riskScore: 14 },
  { id: "trader-kato-whale",     handle: "kato_whale",      country: "DE", reputation: 0.97, riskScore: 5  },
  { id: "trader-collector-zero", handle: "collector_zero",  country: "BR", reputation: 0.91, riskScore: 11 },
  { id: "trader-steady",         handle: "steady_inventory",country: "CA", reputation: 0.79, riskScore: 24 },
  { id: "trader-razor",          handle: "razor_edge",      country: "FR", reputation: 0.86, riskScore: 16 },
  { id: "trader-prime-inv",      handle: "prime_inv",       country: "AU", reputation: 0.90, riskScore: 12 },
  { id: "trader-blade-circuit",  handle: "blade_circuit",   country: "NO", reputation: 0.85, riskScore: 18 },
  { id: "trader-pixel-trader",   handle: "pixel_trader",    country: "JP", reputation: 0.82, riskScore: 20 },
  { id: "trader-neon-hawk",      handle: "neon_hawk",       country: "KR", reputation: 0.89, riskScore: 10 },
];

// Legit traders — cluster B: arbitrageurs, medium activity
const TRADERS_B = [
  { id: "trader-fast-flip",      handle: "fast_flip",       country: "US", reputation: 0.72, riskScore: 32 },
  { id: "trader-market-maker",   handle: "market_maker",    country: "SE", reputation: 0.84, riskScore: 19 },
  { id: "trader-echo-blade",     handle: "echo_blade",      country: "PL", reputation: 0.78, riskScore: 26 },
  { id: "trader-chrome-wolf",    handle: "chrome_wolf",     country: "CZ", reputation: 0.75, riskScore: 29 },
  { id: "trader-static-sniper",  handle: "static_sniper",   country: "FI", reputation: 0.81, riskScore: 22 },
  { id: "trader-crimson-veil",   handle: "crimson_veil",    country: "RU", reputation: 0.68, riskScore: 35 },
  { id: "trader-delta-force",    handle: "delta_force99",   country: "US", reputation: 0.74, riskScore: 31 },
  { id: "trader-zenith-trade",   handle: "zenith_trade",    country: "IL", reputation: 0.77, riskScore: 27 },
  { id: "trader-axiom-skin",     handle: "axiom_skin",      country: "IN", reputation: 0.80, riskScore: 23 },
  { id: "trader-vertex-inv",     handle: "vertex_inv",      country: "TR", reputation: 0.73, riskScore: 33 },
];

// Legit traders — cluster C: newer accounts, lower volume
const TRADERS_C = [
  { id: "trader-iron-curtain",   handle: "iron_curtain_cs", country: "UA", reputation: 0.65, riskScore: 40 },
  { id: "trader-stardust",       handle: "stardust_inv",    country: "MX", reputation: 0.70, riskScore: 36 },
  { id: "trader-copper-coil",    handle: "copper_coil",     country: "ES", reputation: 0.67, riskScore: 38 },
  { id: "trader-frost-byte",     handle: "frost_byte",      country: "DK", reputation: 0.69, riskScore: 37 },
  { id: "trader-vector-prime",   handle: "vector_prime",    country: "IT", reputation: 0.63, riskScore: 42 },
  { id: "trader-onyx-trader",    handle: "onyx_trader",     country: "PT", reputation: 0.71, riskScore: 34 },
  { id: "trader-solar-wind",     handle: "solar_wind88",    country: "GR", reputation: 0.66, riskScore: 39 },
  { id: "trader-lunar-market",   handle: "lunar_market",    country: "RO", reputation: 0.64, riskScore: 41 },
  { id: "trader-apex-float",     handle: "apex_float",      country: "HU", reputation: 0.60, riskScore: 45 },
  { id: "trader-cobalt-ridge",   handle: "cobalt_ridge",    country: "NL", reputation: 0.62, riskScore: 43 },
];

// Suspicious cluster 1: AK price manipulation ring
const SHADOW_1 = [
  { id: "trader-shadow-a",  handle: "shadow_a",   country: "NL", reputation: 0.35, riskScore: 82 },
  { id: "trader-shadow-b",  handle: "shadow_b",   country: "NL", reputation: 0.31, riskScore: 88 },
  { id: "trader-shadow-c",  handle: "shadow_c",   country: "NL", reputation: 0.29, riskScore: 91 },
];

// Suspicious cluster 2: AWP wash-trading network
const SHADOW_2 = [
  { id: "trader-phantom-a", handle: "phantom_broker_1", country: "RU", reputation: 0.22, riskScore: 87 },
  { id: "trader-phantom-b", handle: "phantom_broker_2", country: "RU", reputation: 0.19, riskScore: 93 },
  { id: "trader-phantom-c", handle: "phantom_broker_3", country: "RU", reputation: 0.24, riskScore: 85 },
  { id: "trader-phantom-d", handle: "phantom_broker_4", country: "BY", reputation: 0.17, riskScore: 95 },
];

// Suspicious cluster 3: Knife flipping scheme
const SHADOW_3 = [
  { id: "trader-void-a",    handle: "void_striker_1",  country: "CN", reputation: 0.28, riskScore: 90 },
  { id: "trader-void-b",    handle: "void_striker_2",  country: "CN", reputation: 0.26, riskScore: 92 },
  { id: "trader-void-c",    handle: "void_striker_3",  country: "CN", reputation: 0.20, riskScore: 96 },
];

const ALL_TRADERS = [
  ...TRADERS_A, ...TRADERS_B, ...TRADERS_C,
  ...SHADOW_1, ...SHADOW_2, ...SHADOW_3,
];

// (name, weapon, collection, rarity, basePrice)
const SKINS: [string, string, string, string, number][] = [
  // AK-47
  ["AK-47 | Redline",             "AK-47",          "The Phoenix Collection",         "Classified",  30],
  ["AK-47 | Case Hardened",       "AK-47",          "The Arms Deal Collection",       "Classified",  210],
  ["AK-47 | Vulcan",              "AK-47",          "The Operation Breakout Weap.",   "Classified",  85],
  ["AK-47 | Fire Serpent",        "AK-47",          "The Cobblestone Collection",     "Covert",      850],
  ["AK-47 | Bloodsport",          "AK-47",          "The Danger Zone Collection",     "Covert",      55],
  ["AK-47 | Neon Revolution",     "AK-47",          "The Chroma 2 Collection",        "Covert",      45],
  ["AK-47 | Fuel Injector",       "AK-47",          "The Wildfire Collection",        "Covert",      100],
  ["AK-47 | Asiimov",             "AK-47",          "The Phoenix Collection",         "Covert",      185],
  ["AK-47 | Slate",               "AK-47",          "The Revolution Collection",      "Consumer",    3],
  ["AK-47 | The Empress",         "AK-47",          "The Spectrum 2 Collection",      "Covert",      38],
  ["AK-47 | Panthera onca",       "AK-47",          "The Fracture Collection",        "Classified",  28],
  ["AK-47 | Ice Coaled",          "AK-47",          "The Revolution Collection",      "Classified",  22],
  ["AK-47 | Wasteland Rebel",     "AK-47",          "The Chroma 2 Collection",        "Classified",  22],
  // AWP
  ["AWP | Asiimov",               "AWP",            "The Phoenix Collection",         "Covert",      72],
  ["AWP | Dragon Lore",           "AWP",            "The Cobblestone Collection",     "Covert",      2600],
  ["AWP | Medusa",                "AWP",            "The Gods and Monsters Coll.",    "Covert",      1250],
  ["AWP | Hyper Beast",           "AWP",            "The Falchion Collection",        "Covert",      88],
  ["AWP | Wildfire",              "AWP",            "The Wildfire Collection",        "Covert",      620],
  ["AWP | Oni Taiji",             "AWP",            "Operation Broken Fang Collection","Covert",     265],
  ["AWP | Neo-Noir",              "AWP",            "The Clutch Collection",          "Covert",      155],
  ["AWP | Atheris",               "AWP",            "The Prisma Collection",          "Classified",  32],
  ["AWP | BOOM",                  "AWP",            "The CS20 Collection",            "Classified",  16],
  ["AWP | Chromatic Aberration",  "AWP",            "The Prisma 2 Collection",        "Covert",      85],
  ["AWP | Mortis",                "AWP",            "The CS20 Collection",            "Covert",      62],
  ["AWP | Fever Dream",           "AWP",            "The Dreams & Nightmares Collection","Classified",32],
  ["AWP | PAW",                   "AWP",            "The Riptide Collection",         "Classified",  24],
  ["AWP | Silk Tiger",            "AWP",            "The Danger Zone Collection",     "Classified",  18],
  // M4
  ["M4A1-S | Printstream",        "M4A1-S",         "The Fracture Collection",        "Covert",      165],
  ["M4A1-S | Hot Rod",            "M4A1-S",         "The Chroma 2 Collection",        "Classified",  255],
  ["M4A1-S | Knight",             "M4A1-S",         "The Gamma Collection",           "Classified",  660],
  ["M4A1-S | Nightmare",          "M4A1-S",         "The Shadow Collection",          "Covert",      32],
  ["M4A1-S | Mecha Industries",   "M4A1-S",         "The Revolution Collection",      "Classified",  18],
  ["M4A1-S | Decimator",          "M4A1-S",         "The Gamma Collection",           "Covert",      28],
  ["M4A1-S | Golden Coil",        "M4A1-S",         "The Gamma Collection",           "Covert",      48],
  ["M4A4 | Howl",                 "M4A4",           "The Huntsman Collection",        "Contraband",  2100],
  ["M4A4 | The Emperor",          "M4A4",           "The Prisma Collection",          "Covert",      27],
  ["M4A4 | Neo-Noir",             "M4A4",           "The Clutch Collection",          "Covert",      38],
  ["M4A4 | Spider Lily",          "M4A4",           "The Recoil Collection",          "Covert",      82],
  ["M4A4 | Desolate Space",       "M4A4",           "The Revolver Case",              "Covert",      32],
  // USP / DEagle / Glock
  ["USP-S | Kill Confirmed",      "USP-S",          "The Shadow Collection",          "Covert",      185],
  ["USP-S | Orion",               "USP-S",          "The Chroma 2 Collection",        "Classified",  58],
  ["USP-S | Monster Mashup",      "USP-S",          "The Halloween Collection",       "Classified",  26],
  ["USP-S | Cortex",              "USP-S",          "The Dreams & Nightmares Collection","Covert",   32],
  ["USP-S | Caiman",              "USP-S",          "The Canals Collection",          "Classified",  18],
  ["Desert Eagle | Printstream",  "Desert Eagle",   "The Fracture Collection",        "Covert",      155],
  ["Desert Eagle | Blaze",        "Desert Eagle",   "The Arms Deal Collection",       "Restricted",  515],
  ["Desert Eagle | Sunset Storm", "Desert Eagle",   "The Recoil Collection",          "Classified",  8],
  ["Desert Eagle | Ocean Drive",  "Desert Eagle",   "The Revolution Collection",      "Classified",  26],
  ["Desert Eagle | Hand Cannon",  "Desert Eagle",   "The Shadow Collection",          "Covert",      780],
  ["Glock-18 | Fade",             "Glock-18",       "The Assault Collection",         "Restricted",  660],
  ["Glock-18 | Gamma Doppler",    "Glock-18",       "The Gamma 2 Collection",         "Covert",      310],
  ["Glock-18 | Water Elemental",  "Glock-18",       "The Breakout Collection",        "Restricted",  12],
  ["Glock-18 | Bullet Queen",     "Glock-18",       "The Clutch Collection",          "Covert",      28],
  // Knives
  ["Karambit | Doppler",          "Karambit",       "N/A",                            "Covert",      940],
  ["Karambit | Fade",             "Karambit",       "N/A",                            "Covert",      1250],
  ["Karambit | Case Hardened",    "Karambit",       "N/A",                            "Covert",      820],
  ["Butterfly Knife | Doppler",   "Butterfly Knife","N/A",                            "Covert",      1850],
  ["M9 Bayonet | Lore",           "M9 Bayonet",     "N/A",                            "Covert",      620],
  ["Flip Knife | Doppler",        "Flip Knife",     "N/A",                            "Covert",      420],
  ["Gut Knife | Crimson Web",     "Gut Knife",      "N/A",                            "Covert",      285],
  ["Falchion Knife | Gamma Doppler","Falchion Knife","N/A",                           "Covert",      380],
  ["Shadow Daggers | Doppler",    "Shadow Daggers", "N/A",                            "Covert",      195],
  ["Stiletto Knife | Tiger Tooth","Stiletto Knife", "N/A",                            "Covert",      650],
  ["Bowie Knife | Slaughter",     "Bowie Knife",    "N/A",                            "Covert",      380],
  ["Navaja Knife | Blue Steel",   "Navaja Knife",   "N/A",                            "Covert",      165],
  ["Talon Knife | Fade",          "Talon Knife",    "N/A",                            "Covert",      780],
  ["Skeleton Knife | Case Hardened","Skeleton Knife","N/A",                           "Covert",      920],
  // Rifles
  ["SG 553 | Integrale",          "SG 553",         "The Danger Zone Collection",     "Classified",  26],
  ["SG 553 | Colony IV",          "SG 553",         "The Canals Collection",          "Restricted",  6],
  ["SSG 08 | Blood in the Water", "SSG 08",         "The Riptide Collection",         "Covert",      310],
  ["SSG 08 | Dragonfire",         "SSG 08",         "The Wildfire Collection",        "Covert",      52],
  ["FAMAS | Mecha Industries",    "FAMAS",          "The Revolution Collection",      "Classified",  22],
  ["FAMAS | Commemoration",       "FAMAS",          "The CS20 Collection",            "Classified",  16],
  ["AUG | Akihabara Accept",      "AUG",            "The Operation Vanguard Coll.",   "Classified",  52],
  ["AUG | Momentum",              "AUG",            "The Spectrum 2 Collection",      "Classified",  28],
  ["Galil AR | Chatterbox",       "Galil AR",       "The Cobblestone Collection",     "Classified",  35],
  ["Galil AR | Cerberus",         "Galil AR",       "The Hydra Collection",           "Classified",  28],
  // SMGs
  ["MAC-10 | Neon Rider",         "MAC-10",         "The Prisma Collection",          "Covert",      38],
  ["MP9 | Featherweight",         "MP9",            "The Chroma Collection",          "Classified",  9],
  ["P90 | Asiimov",               "P90",            "The Phoenix Collection",         "Classified",  26],
  ["MP5-SD | Phosphor",           "MP5-SD",         "The St. Marc Collection",        "Classified",  14],
  ["MP7 | Whiteout",              "MP7",            "The Rising Sun Collection",      "Classified",  38],
  ["UMP-45 | Momentum",           "UMP-45",         "The Dreams & Nightmares Collection","Classified",18],
  // Pistols
  ["Five-SeveN | Hyper Beast",    "Five-SeveN",     "The Falchion Collection",        "Covert",      18],
  ["Five-SeveN | Flame Test",     "Five-SeveN",     "The 2018 Nuke Collection",       "Classified",  12],
  ["CZ75-Auto | Yellow Jacket",   "CZ75-Auto",      "The Breakout Collection",        "Classified",  14],
  ["P2000 | Ocean Foam",          "P2000",          "The Arms Deal 2 Collection",     "Classified",  22],
  ["Tec-9 | Titanium Bit",        "Tec-9",          "The Shadow Collection",          "Restricted",  8],
  // Shotguns/Heavy
  ["Nova | Hyper Beast",          "Nova",           "The Falchion Collection",        "Covert",      28],
  ["XM1014 | Entombed",           "XM1014",         "The Prisma 2 Collection",        "Classified",  16],
  ["MAG-7 | Praetorian",          "MAG-7",          "The Chroma 2 Collection",        "Classified",  22],
  ["M249 | Spectre",              "M249",           "The Cobblestone Collection",     "Restricted",  8],
  ["Negev | Lionfish",            "Negev",          "The Prisma Collection",          "Classified",  12],
  ["AK-47 | Head Shot",           "AK-47",          "The CS20 Collection",            "Classified",  18],
];

const WEAR_TIERS: { wear: string; floatMin: number; floatMax: number; weight: number }[] = [
  { wear: "Factory New",   floatMin: 0.00, floatMax: 0.07, weight: 15 },
  { wear: "Minimal Wear",  floatMin: 0.07, floatMax: 0.15, weight: 30 },
  { wear: "Field-Tested",  floatMin: 0.15, floatMax: 0.38, weight: 35 },
  { wear: "Well-Worn",     floatMin: 0.38, floatMax: 0.45, weight: 10 },
  { wear: "Battle-Scarred",floatMin: 0.45, floatMax: 1.00, weight: 10 },
];

function pickWear(): { wear: string; floatValue: number } {
  const totalW = WEAR_TIERS.reduce((s, t) => s + t.weight, 0);
  let r = Math.random() * totalW;
  for (const tier of WEAR_TIERS) {
    r -= tier.weight;
    if (r <= 0) return { wear: tier.wear, floatValue: rand(tier.floatMin, tier.floatMax, 4) };
  }
  const last = WEAR_TIERS[WEAR_TIERS.length - 1];
  return { wear: last.wear, floatValue: rand(last.floatMin, last.floatMax, 4) };
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
    "CREATE CONSTRAINT snapshot_id IF NOT EXISTS FOR (n:PriceSnapshot) REQUIRE n.id IS UNIQUE",
  ];
  for (const c of constraints) {
    try { await session.run(c); } catch { /* already exists */ }
  }
}

async function seedWeaponsAndCollections(session: ReturnType<typeof driver.session>) {
  await session.run(
    `UNWIND $weapons AS w MERGE (n:Weapon {id: w.id}) SET n.name = w.name`,
    { weapons: WEAPONS.map((name) => ({ id: uid("w", name), name })) }
  );
  await session.run(
    `UNWIND $cols AS c MERGE (n:Collection {id: c.id}) SET n.name = c.name`,
    { cols: COLLECTIONS.map((name) => ({ id: uid("c", name), name })) }
  );
  console.log(`  ✓ ${WEAPONS.length} weapons, ${COLLECTIONS.length} collections`);
}

async function seedMarketplaces(session: ReturnType<typeof driver.session>) {
  await session.run(
    `UNWIND $mps AS m MERGE (n:Marketplace {id: m.id})
     SET n.name = m.name, n.feePct = m.feePct, n.url = m.url`,
    { mps: MARKETPLACES }
  );
  console.log(`  ✓ ${MARKETPLACES.length} marketplaces`);
}

async function seedTraders(session: ReturnType<typeof driver.session>) {
  await session.run(
    `UNWIND $traders AS t
     MERGE (n:Trader {id: t.id})
     SET n.name = t.handle, n.handle = t.handle, n.country = t.country,
         n.reputation = t.reputation, n.riskScore = t.riskScore,
         n.firstSeenAt = t.firstSeenAt`,
    {
      traders: ALL_TRADERS.map((t) => ({
        ...t,
        firstSeenAt: daysAgo(Math.floor(Math.random() * 700 + 60)),
      })),
    }
  );

  // Legit cluster connections
  const legitConnections: [string, string][] = [];
  const allLegit = [...TRADERS_A, ...TRADERS_B, ...TRADERS_C];
  for (let i = 0; i < allLegit.length; i++) {
    for (let j = i + 1; j < allLegit.length; j++) {
      if (Math.random() < 0.25) {
        legitConnections.push([allLegit[i].id, allLegit[j].id]);
      }
    }
  }
  for (const [a, b] of legitConnections) {
    await session.run(
      `MATCH (a:Trader {id: $a}), (b:Trader {id: $b})
       MERGE (a)-[:CONNECTED_TO]->(b) MERGE (b)-[:CONNECTED_TO]->(a)`,
      { a, b }
    );
  }

  // Suspicious cluster 1: a→b→c→a
  await session.run(
    `MATCH (a:Trader {id:'trader-shadow-a'}),(b:Trader {id:'trader-shadow-b'}),(c:Trader {id:'trader-shadow-c'})
     MERGE (a)-[:CONNECTED_TO]->(b) MERGE (b)-[:CONNECTED_TO]->(c) MERGE (c)-[:CONNECTED_TO]->(a)`, {}
  );

  // Suspicious cluster 2: a→b→c→d→a (4-node ring)
  await session.run(
    `MATCH (a:Trader {id:'trader-phantom-a'}),(b:Trader {id:'trader-phantom-b'}),
           (c:Trader {id:'trader-phantom-c'}),(d:Trader {id:'trader-phantom-d'})
     MERGE (a)-[:CONNECTED_TO]->(b) MERGE (b)-[:CONNECTED_TO]->(c)
     MERGE (c)-[:CONNECTED_TO]->(d) MERGE (d)-[:CONNECTED_TO]->(a)
     MERGE (a)-[:CONNECTED_TO]->(c)`, {}
  );

  // Suspicious cluster 3: void 3-node tight mesh
  await session.run(
    `MATCH (a:Trader {id:'trader-void-a'}),(b:Trader {id:'trader-void-b'}),(c:Trader {id:'trader-void-c'})
     MERGE (a)-[:CONNECTED_TO]->(b) MERGE (b)-[:CONNECTED_TO]->(c) MERGE (c)-[:CONNECTED_TO]->(a)
     MERGE (a)-[:CONNECTED_TO]->(c) MERGE (c)-[:CONNECTED_TO]->(b)`, {}
  );

  console.log(`  ✓ ${ALL_TRADERS.length} traders + connections`);
}

async function seedSkins(session: ReturnType<typeof driver.session>, imageMap: Map<string, string>) {
  for (const [name, weapon, collection, rarity] of SKINS) {
    const skinId     = uid("skin", name);
    const weaponId   = uid("w", weapon);
    const collectionId = uid("c", collection);
    const imageUrl   = imageMap.get(name) ?? "";

    await session.run(
      `MERGE (s:Skin {id: $skinId})
       SET s.name = $name, s.rarity = $rarity, s.imageUrl = $imageUrl
       WITH s
       MATCH (w:Weapon {id: $weaponId})
       MERGE (s)-[:FOR_WEAPON]->(w)
       WITH s
       MERGE (c:Collection {id: $collectionId})
       MERGE (s)-[:BELONGS_TO]->(c)`,
      { skinId, name, rarity, imageUrl, weaponId, collectionId }
    );
  }
  const withImages = SKINS.filter(([name]) => imageMap.has(name)).length;
  console.log(`  ✓ ${SKINS.length} skins (${withImages} with images)`);
}

interface TxRecord {
  id: string;
  instanceId: string;
  sellerId: string;
  buyerId: string;
  marketplaceId: string;
  priceUsd: number;
  basePriceUsd: number;
  floatFactor: number | null;
  floatValue: number;
  kind: "listing" | "sale";
  timestamp: string;
}

function buildChain(
  instanceId: string,
  floatValue: number,
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
    const buyerId  = traderIds[(i + 1) % traderIds.length];
    const mp = pick(MARKETPLACES);
    price = Math.round(price * (1 + rand(-0.08, 0.18)) * 100) / 100;
    dayOffset -= Math.floor(Math.random() * 8 + 2);

    // Occasionally flag as rare-float listing
    const isRareFloat = floatValue < 0.01 || (floatValue > 0.44 && floatValue < 0.46);
    const floatFactor = isRareFloat ? parseFloat(rand(1.05, 1.55).toFixed(2)) : null;
    const basePriceUsd = floatFactor ? parseFloat((price / floatFactor).toFixed(2)) : price;

    txs.push({
      id: `tx-${instanceId}-${i}`,
      instanceId,
      sellerId,
      buyerId,
      marketplaceId: mp.id,
      priceUsd: price,
      basePriceUsd,
      floatFactor,
      floatValue,
      kind: i % 4 === 0 ? "listing" : "sale",
      timestamp: daysAgo(dayOffset, Math.floor(Math.random() * 12)),
    });
  }
  return txs;
}

function buildSuspiciousCycle(
  instanceId: string,
  floatValue: number,
  basePrice: number,
  cycleTraders: string[],
  startDaysAgo: number,
  extraRounds = 1
): TxRecord[] {
  const txs: TxRecord[] = [];
  let price = basePrice;
  let dayOffset = startDaysAgo;
  const n = cycleTraders.length;

  for (let round = 0; round <= extraRounds; round++) {
    for (let i = 0; i < n; i++) {
      const sellerId = cycleTraders[i % n];
      const buyerId  = cycleTraders[(i + 1) % n];
      price = Math.round(price * rand(1.10, 1.30) * 100) / 100;
      dayOffset -= Math.floor(Math.random() * 3 + 1);

      txs.push({
        id: `tx-${instanceId}-cycle-${round}-${i}`,
        instanceId,
        sellerId,
        buyerId,
        marketplaceId: pick(MARKETPLACES).id,
        priceUsd: price,
        basePriceUsd: price,
        floatFactor: null,
        floatValue,
        kind: "listing",
        timestamp: daysAgo(dayOffset, Math.floor(Math.random() * 6)),
      });
    }
  }
  return txs;
}

async function seedInstancesAndTransactions(session: ReturnType<typeof driver.session>) {
  const legitTraderIds = [...TRADERS_A, ...TRADERS_B, ...TRADERS_C].map((t) => t.id);
  const allTransactions: TxRecord[] = [];
  let instanceCount = 0;

  for (const [name, , , , basePrice] of SKINS) {
    const skinId = uid("skin", name);
    // More instances: cheap skins get 5, mid 3, expensive 2
    const instancesForSkin = basePrice > 800 ? 2 : basePrice > 150 ? 3 : 5;

    for (let inst = 0; inst < instancesForSkin; inst++) {
      const { wear, floatValue } = pickWear();
      const adjustedPrice = Math.round(basePrice * floatMultiplier(floatValue, wear) * 100) / 100;
      const instanceId = `inst-${skinId}-${inst}`;

      await session.run(
        `MERGE (i:SkinInstance {id: $instanceId})
         SET i.floatValue = $floatValue, i.wear = $wear, i.serial = $serial
         WITH i MATCH (s:Skin {id: $skinId}) MERGE (i)-[:INSTANCE_OF]->(s)`,
        { instanceId, floatValue, wear, serial: `${Math.floor(Math.random() * 99999) + 1}`, skinId }
      );
      instanceCount++;

      const txCount = Math.floor(Math.random() * 5 + 4); // 4-8
      const subset = shuffle(legitTraderIds).slice(0, 5);
      allTransactions.push(...buildChain(instanceId, floatValue, adjustedPrice, subset, 90 - inst * 5, txCount));
    }
  }

  // Suspicious instances — one per cluster, with cycle patterns
  const SUSPICIOUS: { name: string; inst: number; basePrice: number; cycleTraders: string[]; rounds: number }[] = [
    { name: "AK-47 | Case Hardened",  inst: 99, basePrice: 4200, cycleTraders: SHADOW_1.map((t) => t.id), rounds: 2 },
    { name: "AWP | Dragon Lore",      inst: 99, basePrice: 2800, cycleTraders: SHADOW_2.map((t) => t.id), rounds: 2 },
    { name: "Karambit | Fade",        inst: 99, basePrice: 1500, cycleTraders: SHADOW_3.map((t) => t.id), rounds: 3 },
    { name: "M4A4 | Howl",            inst: 99, basePrice: 2200, cycleTraders: SHADOW_1.map((t) => t.id), rounds: 1 },
    { name: "Butterfly Knife | Doppler", inst: 99, basePrice: 2000, cycleTraders: SHADOW_2.map((t) => t.id), rounds: 2 },
  ];

  for (const { name, inst, basePrice, cycleTraders, rounds } of SUSPICIOUS) {
    const skinId = uid("skin", name);
    const instanceId = `inst-${skinId}-${inst}`;
    const floatValue = rand(0.001, 0.005, 4);

    await session.run(
      `MERGE (i:SkinInstance {id: $instanceId})
       SET i.floatValue = $floatValue, i.wear = 'Factory New', i.serial = $serial
       WITH i MATCH (s:Skin {id: $skinId}) MERGE (i)-[:INSTANCE_OF]->(s)`,
      { instanceId, floatValue, serial: `SUSP-${inst}`, skinId }
    );
    instanceCount++;

    // Pre-chain: legit trader → suspicious ring entry
    const preChain = buildChain(instanceId, floatValue, basePrice * 0.7,
      [pick(legitTraderIds), cycleTraders[0]], 50, 2);
    allTransactions.push(...preChain);

    // Cycle
    allTransactions.push(...buildSuspiciousCycle(instanceId, floatValue, basePrice * 0.85, cycleTraders, 40, rounds));
  }

  console.log(`  ✓ ${instanceCount} instances, ${allTransactions.length} transactions queued`);

  // Bulk insert transactions
  const batchSize = 50;
  for (let i = 0; i < allTransactions.length; i += batchSize) {
    const batch = allTransactions.slice(i, i + batchSize);
    await session.run(
      `UNWIND $txs AS t
       MERGE (tx:Transaction {id: t.id})
       SET tx.priceUsd = t.priceUsd, tx.basePriceUsd = t.basePriceUsd,
           tx.floatFactor = t.floatFactor, tx.floatValue = t.floatValue,
           tx.kind = t.kind, tx.timestamp = t.timestamp
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

// PriceSnapshot nodes power the crossVenue patterns query
async function seedPriceSnapshots(session: ReturnType<typeof driver.session>) {
  const snapshots: Array<{
    id: string; skinId: string; marketplaceId: string;
    priceUsd: number; wear: string; timestamp: string;
  }> = [];

  // Pick skins that exist on multiple marketplaces with price variance
  const crossVenueSkins = SKINS.filter(([, , , , p]) => p >= 10 && p <= 2000).slice(0, 40);

  for (const [name, , , , basePrice] of crossVenueSkins) {
    const skinId = uid("skin", name);
    const wears = ["Factory New", "Minimal Wear", "Field-Tested"];

    for (const wear of wears.slice(0, 2)) {
      const wearMult = wear === "Factory New" ? 1.15 : wear === "Minimal Wear" ? 1.0 : 0.75;
      const baseWearPrice = Math.round(basePrice * wearMult * 100) / 100;

      // Each skin+wear appears on 2-4 different marketplaces with varying prices
      const mpSubset = shuffle(MARKETPLACES).slice(0, Math.floor(Math.random() * 3 + 2));
      for (const mp of mpSubset) {
        const priceJitter = rand(0.88, 1.18);
        const priceUsd = Math.round(baseWearPrice * priceJitter * 100) / 100;
        snapshots.push({
          id: `snap-${skinId}-${wear.replace(/\s/g, "")}-${mp.id}`,
          skinId,
          marketplaceId: mp.id,
          priceUsd,
          wear,
          timestamp: daysAgo(Math.floor(Math.random() * 3 + 1)),
        });
      }
    }
  }

  const batchSize = 50;
  for (let i = 0; i < snapshots.length; i += batchSize) {
    const batch = snapshots.slice(i, i + batchSize);
    await session.run(
      `UNWIND $snaps AS s
       MERGE (p:PriceSnapshot {id: s.id})
       SET p.priceUsd = s.priceUsd, p.wear = s.wear, p.timestamp = s.timestamp
       WITH p, s
       MATCH (sk:Skin {id: s.skinId})
       MERGE (p)-[:FOR_SKIN]->(sk)
       WITH p, s
       MATCH (mp:Marketplace {id: s.marketplaceId})
       MERGE (p)-[:ON_MARKETPLACE]->(mp)`,
      { snaps: batch }
    );
  }
  console.log(`  ✓ ${snapshots.length} price snapshots (crossVenue patterns)`);
}

// ─── main ──────────────────────────────────────────────────────────────────────

async function seedDatabase() {
  const imageMap = await fetchSkinImages();
  const session = driver.session();
  try {
    console.log("\n🌱 Seeding Neo4j database...\n");
    await clearDatabase(session);
    await createConstraints(session);
    await seedWeaponsAndCollections(session);
    await seedMarketplaces(session);
    await seedTraders(session);
    await seedSkins(session, imageMap);
    await seedInstancesAndTransactions(session);
    await seedPriceSnapshots(session);
    console.log("\n✅ Database seeding complete!");
    console.log(`   Skins: ${SKINS.length} · Traders: ${ALL_TRADERS.length} · Marketplaces: ${MARKETPLACES.length}`);
  } catch (error) {
    console.error("❌ Seeding error:", error);
    throw error;
  } finally {
    await session.close();
    await driver.close();
  }
}

seedDatabase();
