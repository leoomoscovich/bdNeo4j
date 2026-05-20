import { NextResponse } from "next/server";
import { isParamError, parseNumberParam } from "@/lib/api-params";
import { mapOpportunities, mapRiskCycles } from "@/lib/graph-mappers";
import { runQuery } from "@/lib/neo4j";
import { opportunitiesQuery, riskCyclesQuery } from "@/lib/queries";

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function toCsv(rows: Array<Record<string, unknown>>) {
  if (rows.length === 0) {
    return "";
  }

  const headers = Object.keys(rows[0]);
  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")),
  ].join("\n");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "opportunities";
  const format = searchParams.get("format") || "json";

  if (!["opportunities", "cycles"].includes(type)) {
    return NextResponse.json({ error: "El parametro type debe ser opportunities o cycles." }, { status: 400 });
  }

  if (!["json", "csv"].includes(format)) {
    return NextResponse.json({ error: "El parametro format debe ser json o csv." }, { status: 400 });
  }

  const minSpreadResult = parseNumberParam(searchParams, "minSpreadPct", 0);
  const minRiskResult = parseNumberParam(searchParams, "minRiskScore", 60);
  if (isParamError(minSpreadResult)) {
    return NextResponse.json({ error: minSpreadResult.error }, { status: 400 });
  }
  if (isParamError(minRiskResult)) {
    return NextResponse.json({ error: minRiskResult.error }, { status: 400 });
  }

  try {
    const result = type === "opportunities"
      ? await runQuery(opportunitiesQuery, { minSpreadPct: minSpreadResult.value })
      : await runQuery(riskCyclesQuery, {});

    const data = type === "opportunities"
      ? mapOpportunities(result.records)
      : mapRiskCycles(result.records, minRiskResult.value);

    if (format === "csv") {
      return new NextResponse(toCsv(data as unknown as Array<Record<string, unknown>>), {
        headers: {
          "content-type": "text/csv; charset=utf-8",
          "content-disposition": `attachment; filename="skingraph-${type}.csv"`,
        },
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "No se pudo exportar la informacion." }, { status: 500 });
  }
}
