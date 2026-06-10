"use client";

import { useEffect, useState } from "react";
import type { GraphNode, NodeDetailsResponse } from "@/lib/types";

type NodeDetailsPanelProps = {
  node: GraphNode | null;
};

export function NodeDetailsPanel({ node }: NodeDetailsPanelProps) {
  const [details, setDetails] = useState<NodeDetailsResponse | null>(null);

  useEffect(() => {
    if (!node) {
      return;
    }

    fetch(`/api/node?id=${encodeURIComponent(node.id)}&type=${encodeURIComponent(node.type)}`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("node")))
      .then(setDetails)
      .catch(() => setDetails({ id: node.id, type: node.type, label: node.label, properties: node.data, timeline: [] }));
  }, [node]);

  const current = details ?? (node ? { label: node.label, properties: node.data, timeline: [] } : null);

  return (
    <aside className="details">
      <div className="details-title">{current?.label ?? "Sin selección"}</div>
      <p>{node ? `Tipo: ${node.type}` : "Click en un nodo del grafo para ver sus propiedades y timeline."}</p>
      {current ? <div className="property-list">{Object.entries(current.properties).map(([key, value]) => <span key={key}><strong>{key}</strong>{String(value)}</span>)}</div> : null}
      {current && (
        <div className="timeline">
          {(current.timeline.length ? current.timeline : [
            { title: "Historial", description: "Las transacciones relacionadas apareceran aca." },
          ]).map((event) => <div className="event" key={`${event.title}-${event.description}`}><strong>{event.title}</strong><span>{event.description}</span></div>)}
        </div>
      )}
    </aside>
  );
}
