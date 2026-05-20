import { NextResponse } from "next/server";
import { isParamError, parseMarketplaces, parseNumberParam, parseSignal } from "@/lib/api-params";
import { mapOpportunities } from "@/lib/graph-mappers";
import { runQuery } from "@/lib/neo4j";
import { opportunitiesQuery } from "@/lib/queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const minSpreadPctResult = parseNumberParam(searchParams, "minSpreadPct", 5);
  const maxRiskScoreResult = parseNumberParam(searchParams, "maxRiskScore", 100);
  const marketplacesResult = parseMarketplaces(searchParams);
  const signalResult = parseSignal(searchParams);

  if (isParamError(minSpreadPctResult)) {
    return NextResponse.json({ error: minSpreadPctResult.error }, { status: 400 });
  }
  if (isParamError(maxRiskScoreResult)) {
    return NextResponse.json({ error: maxRiskScoreResult.error }, { status: 400 });
  }
  if (isParamError(marketplacesResult)) {
    return NextResponse.json({ error: marketplacesResult.error }, { status: 400 });
  }
  if (isParamError(signalResult)) {
    return NextResponse.json({ error: signalResult.error }, { status: 400 });
  }

  try {
    const result = await runQuery(opportunitiesQuery, { minSpreadPct: minSpreadPctResult.value });
    const query = (searchParams.get("q") || "").trim().toLowerCase();
    const opportunities = mapOpportunities(result.records)
      .filter((opp) => marketplacesResult.value.includes(opp.marketplace as typeof marketplacesResult.value[number]))
      .filter((opp) => opp.riskScore <= maxRiskScoreResult.value)
      .filter((opp) => signalResult.value === "ALL" || opp.signal === signalResult.value)
      .filter((opp) => {
        if (!query) return true;
        return [
          opp.skinName,
          opp.weapon,
          opp.rarity,
          opp.wear,
          opp.marketplace,
          opp.signal,
          ...opp.traderPath,
        ].join(" ").toLowerCase().includes(query);
      });

    return NextResponse.json(opportunities);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "No se pudieron obtener oportunidades." }, { status: 500 });
  }
}
