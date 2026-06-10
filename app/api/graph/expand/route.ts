import { NextResponse } from "next/server";
import { mapExpansion } from "@/lib/graph-mappers";
import { runQuery } from "@/lib/neo4j";
import { expandNodeQuery } from "@/lib/queries";

/* Vecindario inmediato de un nodo, para expandir el grafo de forma interactiva. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Falta el parámetro id." }, { status: 400 });
  }

  try {
    const result = await runQuery(expandNodeQuery, { id });
    return NextResponse.json(mapExpansion(result.records));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "No se pudo expandir el nodo." }, { status: 500 });
  }
}
