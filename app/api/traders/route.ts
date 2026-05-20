import { NextResponse } from "next/server";
import { isParamError, parseMarketplaces } from "@/lib/api-params";
import { mapTraders } from "@/lib/graph-mappers";
import { runQuery } from "@/lib/neo4j";
import { tradersQuery } from "@/lib/queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const marketplacesResult = parseMarketplaces(searchParams);

  if (isParamError(marketplacesResult)) {
    return NextResponse.json({ error: marketplacesResult.error }, { status: 400 });
  }

  try {
    const result = await runQuery(tradersQuery, { query: searchParams.get("q") || "" });
    const traders = mapTraders(result.records).filter((trader) =>
      trader.marketplaces.some((marketplace) => marketplacesResult.value.includes(marketplace as typeof marketplacesResult.value[number])),
    );
    return NextResponse.json(traders);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "No se pudieron obtener traders." }, { status: 500 });
  }
}
