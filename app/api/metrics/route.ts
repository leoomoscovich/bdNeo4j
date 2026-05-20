import { NextResponse } from "next/server";
import { mapMetrics } from "@/lib/graph-mappers";
import { runQuery } from "@/lib/neo4j";
import { metricsQuery } from "@/lib/queries";

export async function GET() {
  try {
    const result = await runQuery(metricsQuery);
    return NextResponse.json(mapMetrics(result.records));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "No se pudieron obtener las metricas." }, { status: 500 });
  }
}
