/**
 * Enriches Neo4j skin data with real market prices.
 *
 * Primary source: market.csgo.com public price feed (no auth, 24k+ items, USD)
 *   → Prices similar to CSFloat (~20-30% below Steam Market)
 * Fallback: Steam Market priceoverview API
 *
 * Run: npm run enrich
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

// ─── skin → canonical Steam market_hash_name ──────────────────────────────────

const STEAM_NAMES: Record<string, string> = {
  "AK-47 | Redline":             "AK-47 | Redline (Field-Tested)",
  "AK-47 | Case Hardened":       "AK-47 | Case Hardened (Field-Tested)",
  "AK-47 | Vulcan":              "AK-47 | Vulcan (Field-Tested)",
  "AK-47 | Fire Serpent":        "AK-47 | Fire Serpent (Field-Tested)",
  "AK-47 | Bloodsport":          "AK-47 | Bloodsport (Factory New)",
  "AK-47 | Neon Revolution":     "AK-47 | Neon Revolution (Factory New)",
  "AK-47 | Fuel Injector":       "AK-47 | Fuel Injector (Factory New)",
  "AK-47 | Asiimov":             "AK-47 | Asiimov (Field-Tested)",
  "AK-47 | Slate":               "AK-47 | Slate (Factory New)",
  "AK-47 | Wasteland Rebel":     "AK-47 | Wasteland Rebel (Field-Tested)",
  "AWP | Asiimov":               "AWP | Asiimov (Field-Tested)",
  "AWP | Dragon Lore":           "AWP | Dragon Lore (Field-Tested)",
  "AWP | Medusa":                "AWP | Medusa (Field-Tested)",
  "AWP | Hyper Beast":           "AWP | Hyper Beast (Field-Tested)",
  "AWP | Wildfire":              "AWP | Wildfire (Field-Tested)",
  "AWP | Oni Taiji":             "AWP | Oni Taiji (Factory New)",
  "AWP | Neo-Noir":              "AWP | Neo-Noir (Field-Tested)",
  "AWP | Atheris":               "AWP | Atheris (Field-Tested)",
  "AWP | BOOM":                  "AWP | BOOM (Factory New)",
  "M4A1-S | Printstream":        "M4A1-S | Printstream (Field-Tested)",
  "M4A1-S | Hot Rod":            "M4A1-S | Hot Rod (Factory New)",
  "M4A1-S | Knight":             "M4A1-S | Knight (Factory New)",
  "M4A1-S | Nightmare":          "M4A1-S | Nightmare (Factory New)",
  "M4A1-S | Mecha Industries":   "M4A1-S | Mecha Industries (Field-Tested)",
  "M4A4 | Howl":                 "M4A4 | Howl (Field-Tested)",
  "M4A4 | The Emperor":          "M4A4 | The Emperor (Factory New)",
  "M4A4 | Neo-Noir":             "M4A4 | Neo-Noir (Field-Tested)",
  "M4A4 | Spider Lily":          "M4A4 | Spider Lily (Factory New)",
  "USP-S | Kill Confirmed":      "USP-S | Kill Confirmed (Factory New)",
  "USP-S | Orion":               "USP-S | Orion (Factory New)",
  "USP-S | Monster Mashup":      "USP-S | Monster Mashup (Factory New)",
  "Desert Eagle | Printstream":  "Desert Eagle | Printstream (Field-Tested)",
  "Desert Eagle | Blaze":        "Desert Eagle | Blaze (Factory New)",
  "Desert Eagle | Sunset Storm": "Desert Eagle | Sunset Storm 壱 (Field-Tested)",
  "Glock-18 | Fade":             "Glock-18 | Fade (Factory New)",
  "Glock-18 | Gamma Doppler":    "Glock-18 | Gamma Doppler (Factory New)",
  "Glock-18 | Water Elemental":  "Glock-18 | Water Elemental (Field-Tested)",
  "Karambit | Doppler":          "★ Karambit | Doppler (Factory New)",
  "Karambit | Fade":             "★ Karambit | Fade (Factory New)",
  "Karambit | Case Hardened":    "★ Karambit | Case Hardened (Field-Tested)",
  "Butterfly Knife | Doppler":   "★ Butterfly Knife | Doppler (Factory New)",
  "M9 Bayonet | Lore":           "★ M9 Bayonet | Lore (Field-Tested)",
  "SG 553 | Integrale":          "SG 553 | Integrale (Field-Tested)",
  "SSG 08 | Blood in the Water": "SSG 08 | Blood in the Water (Factory New)",
  "SSG 08 | Dragonfire":         "SSG 08 | Dragonfire (Field-Tested)",
  "FAMAS | Mecha Industries":    "FAMAS | Mecha Industries (Field-Tested)",
  "AUG | Akihabara Accept":      "AUG | Akihabara Accept (Field-Tested)",
  "MAC-10 | Neon Rider":         "MAC-10 | Neon Rider (Factory New)",
  "MP9 | Featherweight":         "MP9 | Featherweight (Field-Tested)",
  "P90 | Asiimov":               "P90 | Asiimov (Field-Tested)",
};

// ─── fetch price feed ──────────────────────────────────────────────────────────

interface MarketItem {
  market_hash_name: string;
  volume: string;
  price: string;
}

interface MarketPriceFeed {
  success: boolean;
  items: MarketItem[];
}

async function fetchMarketPriceFeed(): Promise<Map<string, number>> {
  console.log("📡 Fetching market.csgo.com price feed (public API)...");
  const res = await fetch("https://market.csgo.com/api/v2/prices/USD.json", {
    headers: { "User-Agent": "SkinGraph-Radar/1.0 (university-project)" },
    signal: AbortSignal.timeout(20_000),
  });

  if (!res.ok) throw new Error(`market.csgo.com responded ${res.status}`);

  const json: MarketPriceFeed = await res.json();
  if (!json.success) throw new Error("market.csgo.com returned success:false");

  const map = new Map<string, number>();
  for (const item of json.items) {
    const price = parseFloat(item.price);
    if (!isNaN(price) && price > 0) {
      map.set(item.market_hash_name, price);
    }
  }

  console.log(`  ✓ Loaded ${map.size} item prices\n`);
  return map;
}

// Steam fallback for items not in the third-party feed
async function fetchSteamPrice(marketHashName: string): Promise<number | null> {
  const url = `https://steamcommunity.com/market/priceoverview/?appid=730&currency=1&market_hash_name=${encodeURIComponent(marketHashName)}`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const json = await res.json() as { success: boolean; median_price?: string; lowest_price?: string };
    if (!json.success) return null;
    const text = json.median_price ?? json.lowest_price;
    if (!text) return null;
    const price = parseFloat(text.replace(/[^0-9.]/g, ""));
    // Apply ~80% factor to convert Steam price → third-party market price
    return isNaN(price) ? null : Math.round(price * 0.80 * 100) / 100;
  } catch {
    return null;
  }
}

async function fetchSteamImageUrl(marketHashName: string): Promise<string | null> {
  const url = `https://steamcommunity.com/market/search/render/?appid=730&norender=1&start=0&count=1&query=${encodeURIComponent(marketHashName)}`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const json = await res.json() as { success: boolean; results?: Array<{ asset_description?: { icon_url?: string } }> };
    const iconUrl = json.results?.[0]?.asset_description?.icon_url;
    if (!iconUrl) return null;
    return `https://community.cloudflare.steamstatic.com/economy/image/${iconUrl}/256fx256f`;
  } catch {
    return null;
  }
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── enrich Neo4j ─────────────────────────────────────────────────────────────

async function enrichAll() {
  const priceMap = await fetchMarketPriceFeed();
  const session = driver.session();

  const skinNames = Object.keys(STEAM_NAMES);
  let enriched = 0;
  let fromSteam = 0;
  let skipped = 0;

  for (let i = 0; i < skinNames.length; i++) {
    const skinName = skinNames[i];
    const steamHashName = STEAM_NAMES[skinName];

    process.stdout.write(`  [${String(i + 1).padStart(2, "0")}/${skinNames.length}] ${skinName.padEnd(36)} `);

    // 1. Try market.csgo.com feed first (fast, no rate limit)
    let realPrice = priceMap.get(steamHashName) ?? null;
    let source = "market.csgo.com";

    // 2. Fallback to Steam API (with 80% factor applied)
    if (!realPrice) {
      realPrice = await fetchSteamPrice(steamHashName);
      source = "Steam×0.80";
      if (realPrice) await sleep(1200); // respect Steam rate limit
    }

    if (!realPrice) {
      console.log("— (sin datos)");
      skipped++;
      continue;
    }

    // Get image from Steam CDN (only for non-knives to avoid rate limits)
    let imageUrl: string | null = null;
    if (!steamHashName.includes("Karambit") && !steamHashName.includes("Butterfly") && !steamHashName.includes("Bayonet")) {
      imageUrl = await fetchSteamImageUrl(steamHashName);
      if (imageUrl) await sleep(400);
    }

    // Update Skin node
    await session.run(
      `MATCH (s:Skin {name: $name})
       SET s.imageUrl = CASE WHEN $imageUrl <> '' THEN $imageUrl ELSE s.imageUrl END`,
      { name: skinName, imageUrl: imageUrl ?? "" }
    );

    // Scale transaction prices: preserve relative spread, anchor to real price
    await session.run(
      `MATCH (s:Skin {name: $name})<-[:INSTANCE_OF]-(i:SkinInstance)<-[:FOR_INSTANCE]-(tx:Transaction)
       WITH i, collect(tx) AS txList
       ORDER BY (txList[-1]).priceUsd DESC
       WITH i, txList,
            toFloat((txList[-1]).priceUsd) AS currentLast,
            $realPrice AS target
       WHERE currentLast > 0
       UNWIND range(0, size(txList)-1) AS idx
       WITH txList[idx] AS tx, currentLast, target, idx, size(txList) AS total
       SET tx.priceUsd = round(
         (toFloat(tx.priceUsd) / currentLast) * target * 100
       ) / 100`,
      { name: skinName, realPrice }
    );

    console.log(`$${realPrice.toFixed(2)} ✓  [${source}]`);
    enriched++;
    if (source.startsWith("Steam")) fromSteam++;
  }

  await session.close();
  await driver.close();

  console.log(`\n✅ ${enriched} skins enriched (${enriched - fromSteam} from market.csgo.com, ${fromSteam} from Steam fallback), ${skipped} sin datos.`);
}

enrichAll().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
