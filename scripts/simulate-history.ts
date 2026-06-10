/**
 * SIMULACIÓN de historial de transacciones sobre las piezas REALES.
 *
 * El historial de compra-venta de Steam es privado: no existe fuente pública.
 * Para que el grafo pueda demostrar rutas, recorridos y detección de ciclos,
 * este script genera un historial plausible y CLARAMENTE MARCADO:
 *   - Cada Transaction lleva kind:'sale' y source:'simulated'.
 *   - Los traders inventados llevan simulated:true.
 *   - Las cadenas terminan en el vendedor real actual de CSFloat y los precios
 *     convergen al precio real listado hoy (la historia es coherente con lo real).
 *   - Se plantan ciclos de wash-trading (A→B→C→A, ventana corta, precio inflado)
 *     para que la detección con Cypher tenga patrones que encontrar.
 *
 * Idempotente: borra la simulación anterior antes de regenerar.
 * Uso:  npx tsx scripts/simulate-history.ts [--cycles 8]
 */

import neo4j from "neo4j-driver";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const driver = neo4j.driver(
  process.env.NEO4J_URI || "bolt://localhost:7687",
  neo4j.auth.basic(process.env.NEO4J_USERNAME || "neo4j", process.env.NEO4J_PASSWORD || "password")
);

const argv = process.argv.slice(2);
const N_CYCLES = parseInt(argv[argv.indexOf("--cycles") + 1] || "8", 10) || 8;

const rnd = (min: number, max: number) => Math.random() * (max - min) + min;
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const MARKETPLACES = ["mp-csfloat", "mp-skinport", "mp-market-csgo", "mp-steam"];

/* Pool de traders sintéticos (nombres claramente de gamer-tag, simulated:true). */
const POOL = [
  { id: "sim-nordic-vault", name: "nordic_vault", rep: 0.93, risk: 9 },
  { id: "sim-float-monk", name: "float_monk", rep: 0.88, risk: 14 },
  { id: "sim-kato-archive", name: "kato_archive", rep: 0.96, risk: 6 },
  { id: "sim-quick-resell", name: "quick_resell", rep: 0.71, risk: 33 },
  { id: "sim-pattern-zero", name: "pattern_zero", rep: 0.9, risk: 12 },
  { id: "sim-mid-market", name: "mid_market", rep: 0.83, risk: 21 },
  { id: "sim-steady-stock", name: "steady_stock", rep: 0.79, risk: 25 },
  { id: "sim-blue-gem-fan", name: "blue_gem_fan", rep: 0.86, risk: 17 },
  { id: "sim-craft-lover", name: "craft_lover", rep: 0.84, risk: 19 },
  { id: "sim-inv-builder", name: "inv_builder", rep: 0.91, risk: 11 },
  { id: "sim-margin-hawk", name: "margin_hawk", rep: 0.76, risk: 29 },
  { id: "sim-paris-flip", name: "paris_flip", rep: 0.81, risk: 23 },
];

/* Traders de los ciclos de wash-trading: riesgo alto, simulated:true. */
const SHADOW = [
  { id: "sim-shadow-loop-a", name: "loop_runner_a", rep: 0.34, risk: 84 },
  { id: "sim-shadow-loop-b", name: "loop_runner_b", rep: 0.31, risk: 88 },
  { id: "sim-shadow-loop-c", name: "loop_runner_c", rep: 0.28, risk: 91 },
  { id: "sim-shadow-mirror", name: "mirror_trade", rep: 0.4, risk: 78 },
];

async function main() {
  const s = driver.session();
  try {
    console.log("🧹 Borrando simulación anterior (si existe) ...");
    await s.run("MATCH (tx:Transaction {source:'simulated'}) DETACH DELETE tx");
    await s.run("MATCH ()-[r:CONNECTED_TO {source:'simulated'}]-() DELETE r");
    await s.run("MATCH (t:Trader {simulated:true}) DETACH DELETE t");

    console.log("👥 Creando pool de traders simulados ...");
    for (const t of [...POOL, ...SHADOW]) {
      await s.run(
        `MERGE (t:Trader {id: $id})
         SET t.name = $name, t.handle = $name, t.reputation = $rep,
             t.riskScore = $risk, t.simulated = true, t.source = 'simulated',
             t.totalTrades = $trades, t.stallPublic = true`,
        { id: t.id, name: t.name, rep: t.rep, risk: neo4j.int(t.risk), trades: neo4j.int(Math.round(rnd(20, 400))) }
      );
    }

    // piezas reales con su listing actual (precio real + vendedor real)
    const inst = await s.run(`
      MATCH (seller:Trader)-[:SOLD]->(l:Transaction {kind:'listing'})-[:FOR_INSTANCE]->(i:SkinInstance)-[:INSTANCE_OF]->(sk:Skin)
      RETURN i.id AS instanceId, sk.name AS skinName, l.priceUsd AS askUsd,
             l.timestamp AS listedAt, seller.id AS currentSellerId
      ORDER BY l.priceUsd DESC
    `);

    console.log(`📜 Generando historial para ${inst.records.length} piezas reales ...`);
    let sales = 0;
    let cyclesPlanted = 0;

    for (const [idx, rec] of inst.records.entries()) {
      const instanceId = String(rec.get("instanceId"));
      const ask = Number(rec.get("askUsd"));
      const currentSellerId = String(rec.get("currentSellerId"));
      const listedAtMs = new Date(String(rec.get("listedAt"))).getTime() || Date.now();

      const isCycle = idx < N_CYCLES; // las piezas más valiosas llevan el ciclo plantado
      const hops = isCycle ? 3 : 1 + Math.floor(rnd(0, 3)); // 1-3 ventas normales

      // cadena de dueños: sintéticos … y el último comprador es el vendedor real actual
      const chain: string[] = [];
      if (isCycle) {
        const trio = [SHADOW[0], SHADOW[1], SHADOW[2]].map((t) => t.id);
        chain.push(trio[0], trio[1], trio[2], trio[0], currentSellerId);
      } else {
        let prev = "";
        for (let k = 0; k < hops; k++) {
          let t = pick(POOL).id;
          while (t === prev) t = pick(POOL).id;
          chain.push(t);
          prev = t;
        }
        chain.push(currentSellerId);
      }

      // timestamps hacia atrás desde el listado real; ciclos en ventana corta (24-72h)
      const nSales = chain.length - 1;
      const windowMs = isCycle ? rnd(24, 72) * 3600_000 : rnd(30, 180) * 86400_000;
      const startMs = listedAtMs - windowMs - rnd(1, 5) * 86400_000;

      // precios: convergen al precio real listado; en ciclos, escalada artificial
      let price = isCycle ? ask * rnd(0.5, 0.65) : ask * rnd(0.7, 0.9);

      for (let k = 0; k < nSales; k++) {
        const sellerId = chain[k];
        const buyerId = chain[k + 1];
        const ts = new Date(startMs + ((k + 1) / nSales) * windowMs).toISOString();
        price = isCycle ? price * rnd(1.15, 1.3) : Math.min(ask * rnd(0.92, 1.02), price * rnd(1.0, 1.18));

        await s.run(
          `MATCH (i:SkinInstance {id: $instanceId})
           MATCH (seller:Trader {id: $sellerId})
           MATCH (buyer:Trader {id: $buyerId})
           MATCH (mp:Marketplace {id: $mpId})
           CREATE (tx:Transaction {
             id: $txId, kind: 'sale', source: 'simulated',
             priceUsd: $price, timestamp: datetime($ts)
           })
           CREATE (seller)-[:SOLD]->(tx)
           CREATE (buyer)-[:BOUGHT]->(tx)
           CREATE (tx)-[:FOR_INSTANCE]->(i)
           CREATE (tx)-[:ON_MARKETPLACE]->(mp)
           MERGE (seller)-[c:CONNECTED_TO]-(buyer)
           ON CREATE SET c.source = 'simulated'`,
          {
            instanceId,
            sellerId,
            buyerId,
            mpId: pick(MARKETPLACES),
            txId: `tx-sim-${instanceId}-${k}`,
            price: Math.round(price * 100) / 100,
            ts,
          }
        );
        sales++;
      }
      if (isCycle) cyclesPlanted++;
    }

    console.log(`\n✅ ${sales} ventas simuladas, ${cyclesPlanted} ciclos de wash-trading plantados.`);
    console.log("   Todo marcado con source:'simulated' / simulated:true.");
  } finally {
    await s.close();
    await driver.close();
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
