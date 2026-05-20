import { NextResponse } from "next/server";
import { mapScan } from "@/lib/graph-mappers";
import { runQuery } from "@/lib/neo4j";
import { latestScanQuery } from "@/lib/queries";

export async function GET() {
  try {
    const result = await runQuery(latestScanQuery, {});
    return NextResponse.json(mapScan(result.records));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "No se pudo obtener el ultimo scan." }, { status: 500 });
  }
}
