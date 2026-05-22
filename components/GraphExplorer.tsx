"use client";

import cytoscape, { type Core } from "cytoscape";
import { useEffect, useRef, useState } from "react";
import type { GraphNode, GraphResponse, SkinSearchResult } from "@/lib/types";

type GraphExplorerProps = {
  selectedSkin: SkinSearchResult | null;
  onSelectNode: (node: GraphNode) => void;
};

const colors: Record<GraphNode["type"], string> = {
  skin: "#d9d6d3",
  instance: "#ef2a2a",
  trader: "#c95a62",
  transaction: "#f2ece8",
  marketplace: "#8c434a",
  collection: "#3a090d",
  weapon: "#d9d6d3",
  sticker: "#c95a62",
  price: "#8c434a",
};

export function GraphExplorer({ selectedSkin, onSelectNode }: GraphExplorerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<Core | null>(null);
  const [graph, setGraph] = useState<GraphResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!selectedSkin) {
      return;
    }

    fetch(`/api/graph?skinId=${encodeURIComponent(selectedSkin.id)}`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("graph")))
      .then((payload: GraphResponse) => {
        setGraph(payload);
        setError("");
      })
      .catch(() => setError("No se pudo cargar el grafo para la skin seleccionada."));
  }, [selectedSkin]);

  useEffect(() => {
    if (!containerRef.current || !graph) {
      return;
    }

    cyRef.current?.destroy();
    cyRef.current = cytoscape({
      container: containerRef.current,
      elements: [
        ...graph.nodes.map((node) => ({ data: { ...node, color: colors[node.type] } })),
        ...graph.edges.map((edge) => ({ data: edge })),
      ],
      style: [
        {
          selector: "node",
          style: {
            "background-color": "data(color)",
            "border-color": "rgba(242,236,232,0.58)",
            "border-width": 1,
            color: "#f2ece8",
            label: "data(label)",
            "font-size": 10,
            "text-outline-color": "#050608",
            "text-outline-width": 3,
            width: 58,
            height: 58,
          },
        },
        {
          selector: "edge",
          style: {
            "curve-style": "bezier",
            "line-color": "rgba(201,90,98,0.68)",
            "target-arrow-color": "rgba(201,90,98,0.68)",
            "target-arrow-shape": "triangle",
            label: "data(label)",
            color: "#8c434a",
            "font-size": 8,
            "text-rotation": "autorotate",
          },
        },
      ],
      layout: { name: "cose", animate: false, fit: true, padding: 34 },
    });

    cyRef.current.on("tap", "node", (event) => {
      const id = event.target.data("id") as string;
      const node = graph.nodes.find((item) => item.id === id);

      if (node) {
        onSelectNode(node);
      }
    });

    return () => cyRef.current?.destroy();
  }, [graph, onSelectNode]);

  return (
    <div className="canvas">
      {!selectedSkin ? <div className="empty-state">Selecciona una skin para cargar el grafo.</div> : null}
      {selectedSkin && !graph && !error ? <div className="empty-state">Cargando grafo...</div> : null}
      {error ? <div className="empty-state error-state">{error}</div> : null}
      <div className="cy-container" ref={containerRef} />
    </div>
  );
}
