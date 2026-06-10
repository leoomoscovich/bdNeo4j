"use client";

/* eslint-disable react-hooks/set-state-in-effect -- Data fetching pattern required for graph visualization */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Graph3D } from "./Graph3D";
import { NodeDetailsPanel } from "./NodeDetailsPanel";
import type { GraphNode, GraphResponse, NodeType } from "@/lib/types";
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

/* Leyenda interactiva: cada tipo se puede apagar/prender para filtrar el grafo. */
const LEGEND: Array<{ type: NodeType; label: string; color: string }> = [
  { type: "skin", label: "Skin", color: "#EE2E2E" },
  { type: "instance", label: "Instancia", color: "#EDEAE2" },
  { type: "trader", label: "Trader", color: "#9a9a96" },
  { type: "transaction", label: "Listing/Tx", color: "#5b5b60" },
  { type: "marketplace", label: "Marketplace", color: "#c98a2a" },
  { type: "price", label: "Precio", color: "#5b8a6a" },
  { type: "sticker", label: "Sticker", color: "#b06fc9" },
  { type: "collection", label: "Colección", color: "#4a6fa5" },
  { type: "weapon", label: "Arma", color: "#7a7a80" },
];

function mergeGraphs(base: GraphResponse, extra: GraphResponse): GraphResponse {
  const nodes = new Map(base.nodes.map((n) => [n.id, n]));
  for (const n of extra.nodes) if (!nodes.has(n.id)) nodes.set(n.id, n);
  const edges = new Map(base.edges.map((e) => [e.id, e]));
  for (const e of extra.edges) if (!edges.has(e.id)) edges.set(e.id, e);
  return { nodes: [...nodes.values()], edges: [...edges.values()] };
}

export function GraphInsightPanel({ selectedOpportunity, selectedRiskCycle, graphTarget }: GraphInsightPanelProps) {
  const [graph, setGraph] = useState<GraphResponse | null>(null);
  const [error, setError] = useState("");
  const [fetchingId, setFetchingId] = useState<string | null>(null);
  const [inspectedNode, setInspectedNode] = useState<GraphNode | null>(null);
  const [hiddenTypes, setHiddenTypes] = useState<Set<NodeType>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [expanding, setExpanding] = useState(false);

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
    setExpandedIds(new Set());

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

  /* Click en un nodo: lo inspecciona y trae sus vecinos desde Neo4j (una vez). */
  const handleNodeClick = useCallback((node: GraphNode) => {
    setInspectedNode(node);
    if (expandedIds.has(node.id)) return;

    setExpanding(true);
    setExpandedIds((prev) => new Set([...prev, node.id]));
    fetch(`/api/graph/expand?id=${encodeURIComponent(node.id)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((payload: GraphResponse | null) => {
        if (payload) setGraph((current) => (current ? mergeGraphs(current, payload) : payload));
      })
      .catch(() => {})
      .finally(() => setExpanding(false));
  }, [expandedIds]);

  function toggleType(type: NodeType) {
    setHiddenTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }

  /* Grafo filtrado por la leyenda: ocultar un tipo saca nodos y aristas. */
  const visibleGraph = useMemo(() => {
    if (!graph) return null;
    if (hiddenTypes.size === 0) return graph;
    const visible = new Set(graph.nodes.filter((n) => !hiddenTypes.has(n.type)).map((n) => n.id));
    return {
      nodes: graph.nodes.filter((n) => visible.has(n.id)),
      edges: graph.edges.filter((e) => visible.has(e.source) && visible.has(e.target)),
    };
  }, [graph, hiddenTypes]);

  if (!activeSelection) {
    return (
      <div className="insight-panel">
        <div className="empty-state">Seleccioná una oportunidad, un trader o un vendedor de riesgo para ver el grafo.</div>
      </div>
    );
  }

  const presentTypes = new Set(graph?.nodes.map((n) => n.type) ?? []);

  return (
    <div className="insight-panel">
      <div className="insight-header">
        <h3 className="insight-title">
          {isRiskMode ? "Vendedor de riesgo" : graphTarget ? "Grafo" : "Oportunidad"}: {activeLabel}
        </h3>
        <span className="mono" style={{ fontSize: 11, color: "var(--muted, #9a9a96)" }}>
          {graph ? `${visibleGraph?.nodes.length ?? 0} nodos · ${visibleGraph?.edges.length ?? 0} aristas` : ""}
          {expanding ? " · expandiendo…" : ""}
        </span>
        {isRiskMode && (
          <span className="risk-badge" style={{ background: riskColor(riskScore) }}>
            Riesgo: {riskScore}
          </span>
        )}
      </div>

      {loading && <div className="empty-state">Cargando grafo…</div>}
      {error && <div className="empty-state error-state">{error}</div>}
      {!loading && !error && !graph && <div className="empty-state">Sin datos de grafo para esta instancia.</div>}

      {!loading && !error && visibleGraph && (
        <>
          <Graph3D
            graph={visibleGraph}
            height={420}
            riskMode={isRiskMode}
            onNodeClick={handleNodeClick}
          />
          <div className="graph3d-legend">
            {LEGEND.filter((item) => presentTypes.has(item.type)).map((item) => {
              const off = hiddenTypes.has(item.type);
              return (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => toggleType(item.type)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    background: "none", border: "none", cursor: "pointer",
                    padding: 0, font: "inherit", color: "inherit",
                    opacity: off ? 0.35 : 1,
                    textDecoration: off ? "line-through" : "none",
                  }}
                  aria-pressed={!off}
                  title={off ? `Mostrar ${item.label}` : `Ocultar ${item.label}`}
                >
                  <i style={{ background: item.color }} />{item.label}
                </button>
              );
            })}
            <span className="graph3d-hint">Click en un nodo expande sus vecinos · click en la leyenda filtra · arrastrá para rotar</span>
          </div>
          {inspectedNode && <NodeDetailsPanel node={inspectedNode} />}
        </>
      )}
    </div>
  );
}
