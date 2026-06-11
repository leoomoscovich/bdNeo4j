import { NextResponse } from "next/server";
import { mapInstanceJourney, mapSkinDetail, mapTraderReputation } from "@/lib/graph-mappers";
import { runQuery } from "@/lib/neo4j";
import { instanceJourneyQuery, skinDetailQuery, stickerDetailQuery, traderReputationQuery } from "@/lib/queries";
import { getListings, normalizeWear, toMarketHashName } from "@/lib/csfloat";
import type { SkinDetailResponse, VenuePrice } from "@/lib/types";

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
      // Try as a Sticker node
      const stickerResult = await runQuery(stickerDetailQuery, { skinId: id });
      const rec = stickerResult.records[0];
      if (!rec) return NextResponse.json({ error: "Skin no encontrada" }, { status: 404 });

      const str = (k: string) => rec.get(k) as string ?? "";
      const price = (() => { const v = rec.get("valueUsd"); return v?.toNumber?.() ?? Number(v) ?? 0; })();
      const stickerData: SkinDetailResponse = {
        skin: {
          id: str("id"), name: str("name"),
          weapon: "Sticker", collection: str("tournament"),
          rarity: str("rarity"), imageUrl: str("imageUrl"),
          instances: [],
          venuePrices: price > 0 ? [{ marketplace: "Mercado histórico", wear: "N/A", priceUsd: price, quantity: null, observedAt: "" }] : [],
        },
        journey: [],
        currentSeller: null,
      };
      return NextResponse.json(stickerData);
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

    // Enrich venuePrices with live CsFloat listings (best-effort, non-blocking)
    const liveListings = await getListings(toMarketHashName(skinDetailData.skin.name));
    if (liveListings.length > 0) {
      const livePrices: VenuePrice[] = liveListings.map((l) => ({
        marketplace: "CSFloat (live)",
        wear: normalizeWear(l.wear_name),
        priceUsd: Math.round(l.price) / 100,
        quantity: null,
        observedAt: l.created_at,
      }));
      // Merge: live listings go first so the UI shows them at the top
      skinDetailData.skin.venuePrices = [
        ...livePrices,
        ...skinDetailData.skin.venuePrices.filter((v) => v.marketplace !== "CSFloat (live)"),
      ];
    }

    return NextResponse.json(skinDetailData);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al obtener detalle de skin" }, { status: 500 });
  }
}
