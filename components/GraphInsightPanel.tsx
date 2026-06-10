"use client";

/* eslint-disable react-hooks/set-state-in-effect -- Data fetching pattern required for graph visualization */

import { useEffect, useState } from "react";
import { Graph3D } from "./Graph3D";
import { NodeDetailsPanel } from "./NodeDetailsPanel";
import type { GraphNode, GraphResponse } from "@/lib/types";
import type { GraphTarget } from "@/lib/ui-state";

interface GraphInsightPanelProps {
  selectedOpportunity?: { instanceId: string; skinName: string; riskScore?: number } | null;
  selectedRiskCycle?: { instanceId: string; skinName: string; riskScore: number } | null;
  graphTarget?: GraphTarget | null;
}

function riskColor(riskScore: number): string {
  if (riskScore >= 80) return "#EE2E2E";
  if (riskScore >= 60) return "#c0392b";
  return "#8c5a5a";
}

export function GraphInsightPanel({ selectedOpportunity, selectedRiskCycle, graphTarget }: GraphInsightPanelProps) {
  const [graph, setGraph] = useState<GraphResponse | null>(null);
  const [error, setError] = useState("");
  const [fetchingId, setFetchingId] = useState<string | null>(null);
  const [inspectedNode, setInspectedNode] = useState<GraphNode | null>(null);

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
    setInspectedNode(null);

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

  if (!activeSelection) {
    return (
      <div className="insight-panel">
        <div className="empty-state">Seleccioná una oportunidad o un ciclo de riesgo para ver el grafo.</div>
      </div>
    );
  }

  return (
    <div className="insight-panel">
      <div className="insight-header">
        <h3 className="insight-title">
          {isRiskMode ? "Ciclo de riesgo" : graphTarget ? "Grafo" : "Oportunidad"}: {activeLabel}
        </h3>
        {isRiskMode && (
          <span className="risk-badge" style={{ background: riskColor(riskScore) }}>
            Riesgo: {riskScore}
          </span>
        )}
      </div>

      {loading && <div className="empty-state">Cargando grafo…</div>}
      {error && <div className="empty-state error-state">{error}</div>}
      {!loading && !error && !graph && <div className="empty-state">Sin datos de grafo para esta instancia.</div>}

      {!loading && !error && graph && (
        <>
          <Graph3D
            graph={graph}
            height={420}
            riskMode={isRiskMode}
            onNodeClick={setInspectedNode}
          />
          <div className="graph3d-legend">
            <span><i style={{ background: "#EE2E2E" }} />Skin / riesgo</span>
            <span><i style={{ background: "#EDEAE2" }} />Instancia</span>
            <span><i style={{ background: "#9a9a96" }} />Trader</span>
            <span><i style={{ background: "#c98a2a" }} />Marketplace</span>
            <span><i style={{ background: "#5b5b60" }} />Transacción</span>
            <span className="graph3d-hint">Arrastrá para rotar · scroll para zoom · click para inspeccionar</span>
          </div>
          {inspectedNode && <NodeDetailsPanel node={inspectedNode} />}
        </>
      )}
    </div>
  );
}
