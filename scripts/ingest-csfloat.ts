/**
 * Ingesta REAL desde CSFloat (requiere CSFLOAT_API_KEY en .env.local).
 *
 * Por cada skin curada del grafo (las de mayor liquidez), trae listings reales:
 *   - Trader  = vendedor real de CSFloat (estadísticas de trades verificadas)
 *   - SkinInstance = ítem real (float, paint seed, wear)
 *   - Transaction {kind:'listing'} = listing real con precio real
 *   - Sticker = stickers reales aplicados, con precio de mercado real (scm)
 *
 * Uso:  npx tsx scripts/ingest-csfloat.ts [--skins 40] [--per-skin 12]
 */

import neo4j, { type Session } from "neo4j-driver";
import * as dotenv from "dotenv";
import { traderAlias } from "./trader-alias";
dotenv.config({ path: ".env.local" });

const API_KEY = process.env.CSFLOAT_API_KEY;
if (!API_KEY) {
  console.error("Falta CSFLOAT_API_KEY en .env.local");
  process.exit(1);
}

const driver = neo4j.driver(
  process.env.NEO4J_URI || "bolt://localhost:7687",
  neo4j.auth.basic(
    process.env.NEO4J_USERNAME || "neo4j",
    process.env.NEO4J_PASSWORD || "password"
  )
);

const argv = process.argv.slice(2);
const N_SKINS = parseInt(argv[argv.indexOf("--skins") + 1] || "40", 10) || 40;
const PER_SKIN = parseInt(argv[argv.indexOf("--per-skin") + 1] || "12", 10) || 12;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function uid(prefix: string, s: string) {
  return `${prefix}-${s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

// ─── CSFloat API ──────────────────────────────────────────────────────────────

type CSFloatListing = {
  id: string;
  created_at: string;
  type: string; // buy_now | auction
  price: number; // centavos
  state: string;
  watchers?: number;
  seller: {
    steam_id?: string;
    username?: string;
    obfuscated_id?: string;
    avatar?: string;
    online?: boolean;
    stall_public?: boolean;
    statistics?: {
      median_trade_time?: number;
      total_failed_trades?: number;
      total_avoided_trades?: number;
      total_trades?: number;
      total_verified_trades?: number;
    };
  };
  reference?: {
    base_price?: number;       // centavos: precio base de mercado del ítem
    predicted_price?: number;  // centavos: precio justo predicho por CSFloat
    float_factor?: number;
    quantity?: number;
  };
  item: {
    asset_id: string;
    float_value?: number;
    paint_seed?: number;
    paint_index?: number;
    market_hash_name: string;
    item_name?: string;
    wear_name?: string;
    rarity_name?: string;
    is_stattrak?: boolean;
    is_souvenir?: boolean;
    icon_url?: string;
    inspect_link?: string;
    stickers?: Array<{
      stickerId: number;
      slot: number;
      name?: string;
      icon_url?: string;
      scm?: { price?: number; volume?: number }; // dólares
    }>;
  };
};

async function fetchListings(marketHashName: string, limit: number): Promise<CSFloatListing[]> {
  const url =
    `https://csfloat.com/api/v1/listings?limit=${Math.min(limit, 50)}` +
    `&sort_by=lowest_price&type=buy_now&market_hash_name=${encodeURIComponent(marketHashName)}`;
  const res = await fetch(url, {
    headers: { Authorization: API_KEY!, Accept: "application/json" },
    signal: AbortSignal.timeout(15_000),
  });
  if (res.status === 429) {
    console.log("  ⏳ rate limit, espero 30s ...");
    await sleep(30_000);
    return fetchListings(marketHashName, limit);
  }
  if (!res.ok) throw new Error(`csfloat ${res.status}`);
  const json = await res.json();
  return (json.data ?? []) as CSFloatListing[];
}

// ─── carga ────────────────────────────────────────────────────────────────────

/** riskScore honesto, derivado SOLO de señales reales del vendedor (0-100). */
function sellerRisk(s: CSFloatListing["seller"]): number {
  const st = s.statistics ?? {};
  const total = st.total_trades ?? 0;
  const failed = (st.total_failed_trades ?? 0) + (st.total_avoided_trades ?? 0);
  let risk = 0;
  if (total === 0) risk += 45;                       // sin historial
  else if (total < 10) risk += 25;
  if (total > 0) risk += Math.min(40, (failed / total) * 400); // trades fallidos
  if (!s.stall_public) risk += 15;                   // perfil/stall privado
  if (!s.username) risk += 10;                       // identidad ofuscada
  return Math.min(100, Math.round(risk));
}

async function ingestSkin(
  session: Session,
  skinId: string,
  skinName: string,
  listings: CSFloatListing[]
): Promise<number> {
  let count = 0;
  for (const l of listings) {
    if (l.item.is_souvenir) continue;
    const priceUsd = l.price / 100;
    if (priceUsd <= 0) continue;

    const seller = l.seller;
    // sin stall público la API no da username: alias determinista marcado como tal
    const anonKey = seller.obfuscated_id ?? l.id;
    const isAlias = !seller.username;
    const sellerName = seller.username ?? traderAlias(anonKey.slice(-8));
    // el id de los anónimos mantiene el esquema histórico (anon_<8>) para que
    // re-ingestas no dupliquen traders ya existentes; solo cambia el nombre visible
    const sellerId = seller.steam_id
      ? `trader-steam-${seller.steam_id}`
      : uid("trader-cf", isAlias ? `anon_${anonKey.slice(-8)}` : sellerName);
    const st = seller.statistics ?? {};
    const totalTrades = st.total_trades ?? 0;
    const verified = st.total_verified_trades ?? 0;

    await session.run(
      `MATCH (s:Skin {id: $skinId})
       MATCH (mp:Marketplace {id: 'mp-csfloat'})
       MERGE (t:Trader {id: $sellerId})
       SET t.name = $sellerName, t.handle = $sellerName, t.aliased = $isAlias,
           t.avatar = $avatar, t.stallPublic = $stallPublic,
           t.totalTrades = $totalTrades, t.verifiedTrades = $verified,
           t.failedTrades = $failed, t.medianTradeTimeSec = $medianTradeTime,
           t.reputation = $reputation, t.riskScore = $riskScore,
           t.source = 'csfloat'
       MERGE (i:SkinInstance {id: $instanceId})
       SET i.floatValue = $floatValue, i.wear = $wear, i.paintSeed = $paintSeed,
           i.paintIndex = $paintIndex, i.serial = $assetId, i.stattrak = $stattrak,
           i.inspectLink = $inspectLink, i.source = 'csfloat'
       MERGE (i)-[:INSTANCE_OF]->(s)
       MERGE (tx:Transaction {id: $txId})
       SET tx.kind = 'listing', tx.priceUsd = $priceUsd,
           tx.basePriceUsd = $basePriceUsd, tx.predictedPriceUsd = $predictedPriceUsd,
           tx.floatFactor = $floatFactor, tx.watchers = $watchers,
           tx.timestamp = datetime($createdAt), tx.source = 'csfloat'
       MERGE (tx)-[:FOR_INSTANCE]->(i)
       MERGE (t)-[:SOLD]->(tx)
       MERGE (tx)-[:ON_MARKETPLACE]->(mp)`,
      {
        skinId,
        sellerId,
        sellerName,
        isAlias,
        avatar: seller.avatar ?? "",
        stallPublic: seller.stall_public ?? false,
        totalTrades: neo4j.int(totalTrades),
        verified: neo4j.int(verified),
        failed: neo4j.int((st.total_failed_trades ?? 0) + (st.total_avoided_trades ?? 0)),
        medianTradeTime: neo4j.int(st.median_trade_time ?? 0),
        reputation: totalTrades > 0 ? Math.round((verified / totalTrades) * 100) / 100 : 0,
        riskScore: neo4j.int(sellerRisk(seller)),
        instanceId: `inst-cf-${l.item.asset_id}`,
        floatValue: l.item.float_value ?? null,
        wear: l.item.wear_name ?? "",
        paintSeed: l.item.paint_seed != null ? neo4j.int(l.item.paint_seed) : null,
        paintIndex: l.item.paint_index != null ? neo4j.int(l.item.paint_index) : null,
        assetId: l.item.asset_id,
        stattrak: l.item.is_stattrak ?? false,
        inspectLink: l.item.inspect_link ?? "",
        txId: `tx-cf-${l.id}`,
        priceUsd,
        basePriceUsd: l.reference?.base_price != null ? l.reference.base_price / 100 : null,
        predictedPriceUsd: l.reference?.predicted_price != null ? l.reference.predicted_price / 100 : null,
        floatFactor: l.reference?.float_factor ?? null,
        watchers: neo4j.int(l.watchers ?? 0),
        createdAt: l.created_at,
      }
    );

    // stickers reales con precio real de mercado (scm)
    for (const sk of l.item.stickers ?? []) {
      if (!sk.name) continue;
      await session.run(
        `MATCH (i:SkinInstance {id: $instanceId})
         MERGE (st:Sticker {id: $stickerId})
         SET st.name = $name, st.imageUrl = $imageUrl,
             st.priceUsd = $priceUsd, st.volume = $volume, st.source = 'csfloat-scm'
         MERGE (i)-[r:HAS_STICKER]->(st)
         SET r.slot = $slot`,
        {
          instanceId: `inst-cf-${l.item.asset_id}`,
          stickerId: uid("sticker", sk.name),
          name: sk.name,
          imageUrl: sk.icon_url ?? "",
          priceUsd: sk.scm?.price ?? null,
          volume: sk.scm?.volume != null ? neo4j.int(sk.scm.volume) : null,
          slot: neo4j.int(sk.slot ?? 0),
        }
      );
    }
    count++;
  }
  return count;
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`🌐 CSFloat: listings reales para las top ${N_SKINS} skins (${PER_SKIN} c/u)\n`);

  const session = driver.session();
  try {
    // skins curadas con mayor liquidez + su wear más listado (para el hash name)
    const res = await session.run(
      `MATCH (s:Skin)<-[:FOR_SKIN]-(p:PriceSnapshot)
       WITH s, p ORDER BY p.quantity DESC
       WITH s, collect(p.wear)[0] AS topWear
       RETURN s.id AS id, s.name AS name, topWear, s.liquidityUsd AS liq
       ORDER BY liq DESC LIMIT $n`,
      { n: neo4j.int(N_SKINS) }
    );

    let totalListings = 0;
    let totalTraders = 0;
    for (const [idx, rec] of res.records.entries()) {
      const skinId = String(rec.get("id"));
      const name = String(rec.get("name"));
      const wear = rec.get("topWear") ? String(rec.get("topWear")) : "Field-Tested";
      const hashName = `${name} (${wear})`;

      try {
        const listings = await fetchListings(hashName, PER_SKIN);
        const n = await ingestSkin(session, skinId, name, listings);
        totalListings += n;
        console.log(`  [${idx + 1}/${res.records.length}] ${hashName} → ${n} listings reales`);
      } catch (err) {
        console.warn(`  ⚠ ${hashName}: ${err instanceof Error ? err.message : err}`);
      }
      await sleep(1100); // rate limit amable
    }

    const tc = await session.run(`MATCH (t:Trader {source:'csfloat'}) RETURN count(t) AS c`);
    totalTraders = tc.records[0].get("c").toNumber();
    console.log(`\n✅ ${totalListings} listings reales, ${totalTraders} traders reales de CSFloat.`);
  } finally {
    await session.close();
    await driver.close();
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
