import { NextResponse } from "next/server";
import { isParamError, parseIds } from "@/lib/api-params";
import { mapCompare, mapOpportunities } from "@/lib/graph-mappers";
import { runQuery } from "@/lib/neo4j";
import { opportunitiesQuery } from "@/lib/queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const idsResult = parseIds(searchParams, 2, 4);

  if (isParamError(idsResult)) {
    return NextResponse.json({ error: idsResult.error }, { status: 400 });
  }

  try {
    const result = await runQuery(opportunitiesQuery, { minSpreadPct: 0 });
    const opportunities = mapOpportunities(result.records).filter((opp) =>
      idsResult.value.includes(opp.id) || idsResult.value.includes(opp.instanceId),
    );
    return NextResponse.json(mapCompare(opportunities));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "No se pudo comparar la seleccion." }, { status: 500 });
  }
}
