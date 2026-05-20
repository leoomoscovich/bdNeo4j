"use client";

import cytoscape, { type Core } from "cytoscape";
import { useEffect, useRef, useState } from "react";
import type { GraphNode, GraphResponse, SkinSearchResult } from "@/lib/types";

type GraphExplorerProps = {
  selectedSkin: SkinSearchResult | null;
  onSelectNode: (node: GraphNode) => void;
};

const colors: Record<GraphNode["type"], string> = {
  skin: "#ffd166",
  instance: "#ff9f1c",
  trader: "#4cc9f0",
  transaction: "#6ee7b7",
  marketplace: "#b388ff",
  collection: "#f4f7fb",
  weapon: "#f4f7fb",
  sticker: "#ff5c7a",
  price: "#9aa6b8",
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
            "border-color": "rgba(255,255,255,0.7)",
            "border-width": 1,
            color: "#f4f7fb",
            label: "data(label)",
            "font-size": 10,
            "text-outline-color": "#080a0f",
            "text-outline-width": 3,
            width: 58,
            height: 58,
          },
        },
        {
          selector: "edge",
          style: {
            "curve-style": "bezier",
            "line-color": "rgba(76,201,240,0.7)",
            "target-arrow-color": "rgba(76,201,240,0.7)",
            "target-arrow-shape": "triangle",
            label: "data(label)",
            color: "#9aa6b8",
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
