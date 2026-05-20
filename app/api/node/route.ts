import { NextResponse } from "next/server";
import { mapNodeDetails } from "@/lib/graph-mappers";
import { runQuery } from "@/lib/neo4j";
import { nodeDetailsQuery, nodeLabels } from "@/lib/queries";
import type { NodeType } from "@/lib/types";

function isNodeType(value: string): value is NodeType {
  return value in nodeLabels;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const type = searchParams.get("type");

  if (!id || !type) {
    return NextResponse.json({ error: "Faltan los parametros requeridos id y type." }, { status: 400 });
  }

  if (!isNodeType(type)) {
    return NextResponse.json({ error: "El parametro type no es valido." }, { status: 400 });
  }

  try {
    const result = await runQuery(nodeDetailsQuery(type), { id });
    const details = mapNodeDetails(result.records, type, id);

    if (!details) {
      return NextResponse.json({ error: "Nodo no encontrado." }, { status: 404 });
    }

    return NextResponse.json(details);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "No se pudo obtener el detalle del nodo." }, { status: 500 });
  }
}
