import { NextResponse } from "next/server";
import { isParamError, parseMarketplaces, parseNumberParam, parseSeverity } from "@/lib/api-params";
import { mapRiskCycles } from "@/lib/graph-mappers";
import { runQuery } from "@/lib/neo4j";
import { riskCyclesQuery } from "@/lib/queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const minRiskScoreResult = parseNumberParam(searchParams, "minRiskScore", 60);
  const timeWindowResult = parseNumberParam(searchParams, "timeWindowHours", 0);
  const marketplacesResult = parseMarketplaces(searchParams);
  const severityResult = parseSeverity(searchParams);

  if (isParamError(minRiskScoreResult)) {
    return NextResponse.json({ error: minRiskScoreResult.error }, { status: 400 });
  }
  if (isParamError(timeWindowResult)) {
    return NextResponse.json({ error: timeWindowResult.error }, { status: 400 });
  }
  if (isParamError(marketplacesResult)) {
    return NextResponse.json({ error: marketplacesResult.error }, { status: 400 });
  }
  if (isParamError(severityResult)) {
    return NextResponse.json({ error: severityResult.error }, { status: 400 });
  }

  try {
    const result = await runQuery(riskCyclesQuery, {});
    const query = (searchParams.get("q") || "").trim().toLowerCase();
    const cycles = mapRiskCycles(result.records, minRiskScoreResult.value)
      .filter((cycle) => severityResult.value === "ALL" || cycle.severity === severityResult.value)
      .filter((cycle) => timeWindowResult.value <= 0 || cycle.timeWindowHours <= timeWindowResult.value)
      .filter((cycle) => {
        if (!query) return true;
        return [cycle.title, cycle.skinName, cycle.severity, ...cycle.traderPath]
          .join(" ")
          .toLowerCase()
          .includes(query);
      });

    void marketplacesResult;
    return NextResponse.json(cycles);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "No se pudieron obtener ciclos sospechosos." }, { status: 500 });
  }
}
