import { NextResponse } from "next/server";
import { mapTraderProfile } from "@/lib/graph-mappers";
import { runQuery } from "@/lib/neo4j";
import { traderProfileQuery } from "@/lib/queries";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    const result = await runQuery(traderProfileQuery, { id });
    const profile = mapTraderProfile(result.records);
    if (!profile) {
      return NextResponse.json({ error: "Trader no encontrado." }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "No se pudo obtener el trader." }, { status: 500 });
  }
}
