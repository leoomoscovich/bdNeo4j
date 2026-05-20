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

    return NextResponse.json(
      mapMarketPulse(baseResult.records, dealsResult.records, cyclesResult.records),
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "No se pudo obtener el pulso de mercado." }, { status: 500 });
  }
}
