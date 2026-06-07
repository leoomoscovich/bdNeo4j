/**
 * Enriches existing Neo4j Skin nodes with real CS2 image URLs.
 *
 * Source: ByMykel/CSGO-API static catalog, no auth required.
 * Run: npm run enrich-images
 */

import neo4j from "neo4j-driver";
import * as dotenv from "dotenv";
import { buildSkinImageMap, type ExternalSkinImageRecord } from "../lib/skin-image-catalog";

dotenv.config({ path: ".env.local" });

const CSGO_API_SKINS_URL =
  "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json";

const driver = neo4j.driver(
  process.env.NEO4J_URI || "bolt://localhost:7687",
  neo4j.auth.basic(
    process.env.NEO4J_USERNAME || "neo4j",
    process.env.NEO4J_PASSWORD || "password",
  ),
);

async function fetchExternalSkins() {
  const response = await fetch(CSGO_API_SKINS_URL, {
    headers: { "User-Agent": "SkinGraph-Radar/1.0 (university-project)" },
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    throw new Error(`ByMykel CSGO-API responded ${response.status}`);
  }

  const json = await response.json();
  if (!Array.isArray(json)) {
    throw new Error("ByMykel CSGO-API returned an unexpected response");
  }

  return json as ExternalSkinImageRecord[];
}

async function main() {
  const session = driver.session();

  try {
    console.log("Fetching existing Skin nodes from Neo4j...");
    const skinResult = await session.run("MATCH (s:Skin) RETURN s.name AS name ORDER BY s.name");
    const localSkinNames = skinResult.records
      .map((record) => record.get("name"))
      .filter((name): name is string => typeof name === "string" && name.length > 0);

    console.log(`Found ${localSkinNames.length} local skins.`);
    console.log("Fetching ByMykel CSGO-API skin catalog...");
    const externalSkins = await fetchExternalSkins();
    console.log(`Fetched ${externalSkins.length} external skin records.`);

    const imageMap = buildSkinImageMap(localSkinNames, externalSkins);
    const rows = localSkinNames.map((name) => ({
      name,
      imageUrl: imageMap.get(name) ?? "",
    }));

    const updateResult = await session.run(
      `UNWIND $rows AS row
       MATCH (s:Skin {name: row.name})
       WITH s, row
       WHERE row.imageUrl <> ''
       SET s.imageUrl = row.imageUrl
       RETURN count(s) AS updated`,
      { rows },
    );

    const updated = updateResult.records[0]?.get("updated")?.toNumber?.() ?? 0;
    const matched = rows.filter((row) => row.imageUrl).length;
    const missing = rows.length - matched;

    console.log(`Matched images: ${matched}`);
    console.log(`Updated Skin nodes: ${updated}`);
    console.log(`Missing images: ${missing}`);

    if (missing > 0) {
      const missingNames = rows
        .filter((row) => !row.imageUrl)
        .map((row) => row.name)
        .slice(0, 20);
      console.log(`First missing skins: ${missingNames.join(", ")}`);
    }
  } finally {
    await session.close();
    await driver.close();
  }
}

main().catch((error) => {
  console.error("Fatal:", error);
  process.exit(1);
});
