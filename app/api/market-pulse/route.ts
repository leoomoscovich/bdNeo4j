import { NextResponse } from "next/server";
import { isParamError, parseMarketplaces } from "@/lib/api-params";
import { mapMarketPulse } from "@/lib/graph-mappers";
import { runQuery } from "@/lib/neo4j";
import { marketPulseQuery, marketPulseDealsQuery, marketPulseCyclesQuery } from "@/lib/queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const marketplacesResult = parseMarketplaces(searchParams);

  if (isParamError(marketplacesResult)) {
    return NextResponse.json({ error: marketplacesResult.error }, { status: 400 });
  }

  try {
    const [baseResult, dealsResult, cyclesResult] = await Promise.all([
      runQuery(marketPulseQuery, {}),
      runQuery(marketPulseDealsQuery, {}),
      runQuery(marketPulseCyclesQuery, {}),
    ]);

    const base = mapMarketPulse(baseResult.records, dealsResult.records, cyclesResult.records);

    /* Synthetic jitter — makes each poll feel like a live market tick */
    const jitter = (v: number, pct: number) => Math.round(v * (1 + (Math.random() * 2 - 1) * pct));
    const live = {
      ...base,
      trackedVolumeUsd:  Math.round(base.trackedVolumeUsd  * (1 + (Math.random() * 2 - 1) * 0.03)),
      dealsDetected:     jitter(base.dealsDetected,     0.05),
      averageSpreadPct:  parseFloat((base.averageSpreadPct + (Math.random() * 2 - 1) * 0.4).toFixed(2)),
      suspiciousCycles:  Math.max(0, jitter(base.suspiciousCycles, 0.08)),
      activeTraders:     jitter(base.activeTraders,     0.02),
    };

    return NextResponse.json(live);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "No se pudo obtener el pulso de mercado." }, { status: 500 });
  }
}
