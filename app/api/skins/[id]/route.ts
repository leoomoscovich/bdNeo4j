import { NextResponse } from "next/server";
import { mapInstanceJourney, mapSkinDetail, mapTraderReputation } from "@/lib/graph-mappers";
import { runQuery } from "@/lib/neo4j";
import { instanceJourneyQuery, skinDetailQuery, traderReputationQuery } from "@/lib/queries";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const instanceId = searchParams.get("instanceId");

  try {
    const detailResult = await runQuery(skinDetailQuery, { skinId: id });
    const skinDetailData = mapSkinDetail(detailResult.records);

    if (!skinDetailData) {
      return NextResponse.json({ error: "Skin no encontrada" }, { status: 404 });
    }

    // Resolve instance to show journey for
    const targetInstanceId = instanceId ?? skinDetailData.skin.instances[0]?.id;

    if (targetInstanceId) {
      const journeyResult = await runQuery(instanceJourneyQuery, { instanceId: targetInstanceId });
      skinDetailData.journey = mapInstanceJourney(journeyResult.records);

      // Get reputation for the current seller (last seller in journey)
      const lastStep = skinDetailData.journey.at(-1);
      if (lastStep?.seller?.id) {
        const repResult = await runQuery(traderReputationQuery, { traderId: lastStep.seller.id });
        skinDetailData.currentSeller = mapTraderReputation(repResult.records);
      }
    }

    return NextResponse.json(skinDetailData);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al obtener detalle de skin" }, { status: 500 });
  }
}
