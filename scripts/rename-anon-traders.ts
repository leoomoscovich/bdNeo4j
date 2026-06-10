/** One-shot: renombra traders anon_XXXX existentes con alias deterministas. */
import neo4j from "neo4j-driver";
import * as dotenv from "dotenv";
import { traderAlias } from "./trader-alias";
dotenv.config({ path: ".env.local" });

const driver = neo4j.driver(
  process.env.NEO4J_URI || "bolt://localhost:7687",
  neo4j.auth.basic(process.env.NEO4J_USERNAME || "neo4j", process.env.NEO4J_PASSWORD || "password")
);

(async () => {
  const s = driver.session();
  const res = await s.run("MATCH (t:Trader) WHERE t.name STARTS WITH 'anon_' RETURN t.id AS id, t.name AS name");
  let n = 0;
  for (const r of res.records) {
    const name = String(r.get("name"));
    const alias = traderAlias(name.slice(5)); // sufijo tras 'anon_'
    await s.run("MATCH (t:Trader {id: $id}) SET t.name = $alias, t.handle = $alias, t.aliased = true", {
      id: r.get("id"),
      alias,
    });
    n++;
  }
  await s.run("MATCH (t:Trader {source:'csfloat'}) WHERE t.aliased IS NULL SET t.aliased = false");
  const sample = await s.run("MATCH (t:Trader {aliased:true}) RETURN t.name AS n LIMIT 6");
  console.log("renombrados:", n, "| ejemplos:", sample.records.map((r) => r.get("n")).join(", "));
  await s.close();
  await driver.close();
})();
