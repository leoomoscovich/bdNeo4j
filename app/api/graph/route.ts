import { NextResponse } from "next/server";
import { mapGraph } from "@/lib/graph-mappers";
import { runQuery } from "@/lib/neo4j";
import { graphAroundInstanceQuery, graphAroundMarketplaceQuery, graphAroundSkinQuery, graphAroundTraderQuery } from "@/lib/queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const skinId = searchParams.get("skinId");
  const instanceId = searchParams.get("instanceId");
  const traderId = searchParams.get("traderId");
  const cycleId = searchParams.get("cycleId");
  const marketplaceId = searchParams.get("marketplaceId");
  const targets = [skinId, instanceId, traderId, cycleId, marketplaceId].filter(Boolean);

  if (targets.length !== 1) {
    return NextResponse.json({ error: "Enviar exactamente un target: skinId, instanceId, traderId, cycleId o marketplaceId." }, { status: 400 });
  }

  try {
    if (instanceId || cycleId) {
      const result = await runQuery(graphAroundInstanceQuery, { instanceId: instanceId || cycleId });
      return NextResponse.json(mapGraph(result.records));
    }

    if (traderId) {
      const result = await runQuery(graphAroundTraderQuery, { traderId });
      return NextResponse.json(mapGraph(result.records));
    }

    if (marketplaceId) {
      const result = await runQuery(graphAroundMarketplaceQuery, { marketplaceId });
      return NextResponse.json(mapGraph(result.records));
    }

    const result = await runQuery(graphAroundSkinQuery, { skinId: skinId! });
    return NextResponse.json(mapGraph(result.records));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "No se pudo obtener el grafo." }, { status: 500 });
  }
}
