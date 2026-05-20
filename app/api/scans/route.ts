import { NextResponse } from "next/server";
import { isParamError, parseMarketplaces } from "@/lib/api-params";
import { mapOpportunities, mapRiskCycles, mapScan } from "@/lib/graph-mappers";
import { runQuery } from "@/lib/neo4j";
import { createScanQuery, opportunitiesQuery, riskCyclesQuery } from "@/lib/queries";

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const body = await request.json().catch(() => ({}));
  const bodyMarketplaces = Array.isArray(body.marketplaces) ? body.marketplaces.join(",") : "";
  if (bodyMarketplaces) {
    searchParams.set("marketplaces", bodyMarketplaces);
  }

  const marketplacesResult = parseMarketplaces(searchParams);
  if (isParamError(marketplacesResult)) {
    return NextResponse.json({ error: marketplacesResult.error }, { status: 400 });
  }

  try {
    const [opportunityResult, cycleResult] = await Promise.all([
      runQuery(opportunitiesQuery, { minSpreadPct: 5 }),
      runQuery(riskCyclesQuery, {}),
    ]);

    const now = new Date().toISOString();
    const result = await runQuery(createScanQuery, {
      id: `scan-${Date.now()}`,
      startedAt: now,
      completedAt: now,
      opportunitiesFound: mapOpportunities(opportunityResult.records).length,
      riskCyclesFound: mapRiskCycles(cycleResult.records, 60).length,
      marketplacesScanned: marketplacesResult.value,
    });

    return NextResponse.json(mapScan(result.records), { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "No se pudo ejecutar el deep scan." }, { status: 500 });
  }
}
