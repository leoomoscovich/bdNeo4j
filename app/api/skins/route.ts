import { NextResponse } from "next/server";
import { mapSkinCatalog, mapSkinSearch } from "@/lib/graph-mappers";
import { runQuery } from "@/lib/neo4j";
import { allSkinsQuery, searchSkinsQuery } from "@/lib/queries";
import neo4j from "neo4j-driver";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode");

  try {
    if (mode === "catalog") {
      const page = parseInt(searchParams.get("page") ?? "0", 10);
      const limit = parseInt(searchParams.get("limit") ?? "24", 10);
      const result = await runQuery(allSkinsQuery, {
        query: searchParams.get("q") ?? "",
        rarity: searchParams.get("rarity") ?? "",
        weapon: searchParams.get("weapon") ?? "",
        skip: neo4j.int(page * limit),
        limit: neo4j.int(limit),
      });
      return NextResponse.json(mapSkinCatalog(result.records));
    }

    const result = await runQuery(searchSkinsQuery, { query: searchParams.get("q") ?? "" });
    return NextResponse.json(mapSkinSearch(result.records));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "No se pudieron obtener las skins." }, { status: 500 });
  }
}
