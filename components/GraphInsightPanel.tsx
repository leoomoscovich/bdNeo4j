"use client";

/* eslint-disable react-hooks/set-state-in-effect -- Data fetching pattern required for graph visualization */

import cytoscape, { type Core } from "cytoscape";
import { useEffect, useRef, useState } from "react";
import type { GraphResponse } from "@/lib/types";
import type { GraphTarget } from "@/lib/ui-state";

interface GraphInsightPanelProps {
  selectedOpportunity?: { instanceId: string; skinName: string; riskScore?: number } | null;
  selectedRiskCycle?: { instanceId: string; skinName: string; riskScore: number } | null;
  graphTarget?: GraphTarget | null;
}

const baseColors: Record<GraphResponse["nodes"][number]["type"], string> = {
  skin: "#4cc9f0",
  instance: "#06b6d4",
  trader: "#9ca3af",
  transaction: "#f4f7fb",
  marketplace: "#b388ff",
  weapon: "#ff9f1c",
  sticker: "#ff5c7a",
  collection: "#6ee7b7",
  price: "#9aa6b8",
};

const nodeShapes: Record<GraphResponse["nodes"][number]["type"], string> = {
  skin: "ellipse",
  instance: "ellipse",
  trader: "hexagon",
  transaction: "ellipse",
  marketplace: "roundrectangle",
  weapon: "triangle",
  sticker: "ellipse",
  collection: "rectangle",
  price: "ellipse",
};

const nodeSizes: Record<GraphResponse["nodes"][number]["type"], number> = {
  skin: 70,
  instance: 50,
  trader: 44,
  transaction: 30,
  marketplace: 54,
  weapon: 38,
  sticker: 28,
  collection: 48,
  price: 26,
};

function riskColor(riskScore: number): string {
  if (riskScore >= 80) return "#ef4444";
  if (riskScore >= 60) return "#f97316";
  if (riskScore >= 40) return "#f59e0b";
  return baseColors.instance;
}

export function GraphInsightPanel({ selectedOpportunity, selectedRiskCycle, graphTarget }: GraphInsightPanelProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<Core | null>(null);
  const [graph, setGraph] = useState<GraphResponse | null>(null);
  const [error, setError] = useState("");
  const [fetchingId, setFetchingId] = useState<string | null>(null);

  const activeSelection = graphTarget ?? selectedRiskCycle ?? selectedOpportunity ?? null;
  const isRiskMode = selectedRiskCycle != null || graphTarget?.type === "risk-cycle";
  const activeLabel = graphTarget?.label ?? selectedRiskCycle?.skinName ?? selectedOpportunity?.skinName ?? "";
  const riskScore = "riskScore" in (activeSelection ?? {}) ? Number((activeSelection as { riskScore?: number }).riskScore ?? 0) : 0;
  const activeId = graphTarget
    ? ("instanceId" in graphTarget ? graphTarget.instanceId : "traderId" in graphTarget ? graphTarget.traderId : "marketplaceId" in graphTarget ? graphTarget.marketplaceId : graphTarget.skinId)
    : selectedRiskCycle?.instanceId ?? selectedOpportunity?.instanceId ?? "";
  const loading = activeSelection != null && fetchingId === activeId && graph == null && error === "";

  useEffect(() => {
    if (!activeSelection || !activeId) return;

    const currentId = activeId;
    setFetchingId(currentId);

    const params = new URLSearchParams();
    if (graphTarget?.type === "trader") params.set("traderId", graphTarget.traderId);
    else if (graphTarget?.type === "marketplace") params.set("marketplaceId", graphTarget.marketplaceId);
    else if (graphTarget?.type === "skin") params.set("skinId", graphTarget.skinId);
    else params.set("instanceId", currentId);

    fetch(`/api/graph?${params}`)
      .then((response) => {
        if (!response.ok) throw new Error("graph");
        return response.json();
      })
      .then((payload: GraphResponse) => {
        setGraph(payload);
        setError("");
      })
      .catch(() => setError("No se pudo cargar el grafo para la instancia seleccionada."))
      .finally(() => setFetchingId((prev) => (prev === currentId ? null : prev)));
  }, [activeSelection, activeId, graphTarget]);

  useEffect(() => {
    if (!containerRef.current || !graph) {
      return;
    }

    cyRef.current?.destroy();

    const elements = [
      ...graph.nodes.map((node) => {
        const color = isRiskMode ? riskColor(riskScore) : baseColors[node.type];
        return { data: { ...node, color } };
      }),
      ...graph.edges.map((edge) => ({ data: edge })),
    ];

    const nodeStyles = Object.keys(baseColors).map((type) => ({
      selector: `node[type = "${type}"]`,
      style: {
        shape: nodeShapes[type as keyof typeof nodeShapes],
        width: nodeSizes[type as keyof typeof nodeSizes],
        height: nodeSizes[type as keyof typeof nodeSizes],
      },
    }));

    cyRef.current = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: "node",
          style: {
            "background-color": "data(color)",
            "border-color": "rgba(255,255,255,0.6)",
            "border-width": 1,
            color: "#f4f7fb",
            label: "data(label)",
            "font-size": 10,
            "text-outline-color": "#080a0f",
            "text-outline-width": 3,
          },
        },
        ...nodeStyles,
        {
          selector: "edge",
          style: {
            "curve-style": "bezier",
            "line-color": isRiskMode ? "rgba(239,68,68,0.5)" : "rgba(76,201,240,0.5)",
            "target-arrow-color": isRiskMode ? "rgba(239,68,68,0.5)" : "rgba(76,201,240,0.5)",
            "target-arrow-shape": "triangle",
            label: "data(label)",
            color: "#9aa6b8",
            "font-size": 8,
            "text-rotation": "autorotate",
          },
        },
      ],
      layout: { name: "cose", animate: false, fit: true, padding: 34 },
      userZoomingEnabled: true,
      userPanningEnabled: true,
    });

    return () => cyRef.current?.destroy();
  }, [graph, isRiskMode, riskScore]);

  if (!activeSelection) {
    return (
      <div className="insight-panel">
        <div className="empty-state">Selecciona una oportunidad o ciclo de riesgo para ver el grafo.</div>
      </div>
    );
  }

  return (
    <div className="insight-panel">
      <div className="insight-header">
        <h3 className="insight-title">
          {isRiskMode ? "Ciclo de riesgo" : graphTarget ? "Graph target" : "Oportunidad"}: {activeLabel}
        </h3>
        {isRiskMode && (
          <span className="risk-badge" style={{ background: riskColor(riskScore) }}>
            Riesgo: {riskScore}
          </span>
        )}
      </div>

      {loading && <div className="empty-state">Cargando grafo...</div>}
      {error && <div className="empty-state error-state">{error}</div>}
      {!loading && !error && !graph && <div className="empty-state">Sin datos de grafo para esta instancia.</div>}

      <div className="insight-cy-container" ref={containerRef} />
    </div>
  );
}
