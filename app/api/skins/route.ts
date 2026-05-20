import { NextResponse } from "next/server";
import { mapSkinSearch } from "@/lib/graph-mappers";
import { runQuery } from "@/lib/neo4j";
import { searchSkinsQuery } from "@/lib/queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  try {
    const result = await runQuery(searchSkinsQuery, { query: searchParams.get("q") ?? "" });
    return NextResponse.json(mapSkinSearch(result.records));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "No se pudieron obtener las skins." }, { status: 500 });
  }
}
