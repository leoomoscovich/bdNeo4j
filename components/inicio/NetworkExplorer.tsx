"use client";

import { useState } from "react";
import { Graph3D } from "@/components/Graph3D";
import type { GraphNode, GraphResponse, TraderSummary } from "@/lib/types";

const TYPE_LABEL: Record<string, string> = {
  skin: "Skin",
  instance: "Instancia",
  trader: "Trader",
  transaction: "Transacción",
  marketplace: "Marketplace",
  weapon: "Arma",
  sticker: "Sticker",
  collection: "Colección",
  price: "Precio",
};

type NetworkExplorerProps = {
  graph: GraphResponse;
  featuredTrader: TraderSummary | null;
};

export default function NetworkExplorer({ graph, featuredTrader }: NetworkExplorerProps) {
  const [sel, setSel] = useState<GraphNode | null>(null);

  const selProps = sel
    ? Object.entries(sel.data).filter(([, v]) => v !== null && v !== "" && typeof v !== "object").slice(0, 6)
    : [];

  return (
    <div className="netx">
      <div className="netx__canvas">
        <Graph3D graph={graph} height={520} onNodeClick={setSel} />
        <div className="netx__legend mono">
          <span><i style={{ background: "#EE2E2E" }} />Skin</span>
          <span><i style={{ background: "#EDEAE2", border: "1px solid #555" }} />Instancia</span>
          <span><i style={{ background: "#9a9a96" }} />Trader</span>
          <span><i style={{ background: "#c98a2a" }} />Marketplace</span>
          <span><i style={{ background: "#5b5b60" }} />Transacción</span>
        </div>
      </div>

      <aside className="netx__side">
        <div className="inspector__head mono mono--muted">Inspector · nodo seleccionado</div>
        {sel ? (
          <div className="inspector__body">
            <div className="inspector__id">{sel.label}</div>
            <div className="inspector__type">{TYPE_LABEL[sel.type] ?? sel.type}</div>
            <dl className="inspector__list">
              {selProps.map(([key, value]) => (
                <div key={key}>
                  <dt>{key}</dt>
                  <dd>{String(value)}</dd>
                </div>
              ))}
            </dl>
            <p className="inspector__note">
              Nodo real del grafo Neo4j. Cada conexión que ves es una transacción,
              una instancia o una relación de mercado registrada.
            </p>
          </div>
        ) : (
          <div className="inspector__body">
            <div className="inspector__id">{featuredTrader?.handle ?? "—"}</div>
            <div className="inspector__type">Trader con mayor volumen</div>
            {featuredTrader && (
              <dl className="inspector__list">
                <div><dt>Transacciones</dt><dd>{featuredTrader.transactionCount}</dd></div>
                <div><dt>Volumen</dt><dd>${Math.round(featuredTrader.volumeUsd).toLocaleString("es-AR")}</dd></div>
                <div><dt>Marketplaces</dt><dd>{featuredTrader.marketplaces.join(" · ")}</dd></div>
                <div><dt>Riesgo</dt><dd>{featuredTrader.riskScore}/100</dd></div>
              </dl>
            )}
            <p className="inspector__note">
              Este es el vecindario real del trader con más volumen del grafo.
              Tocá cualquier nodo para inspeccionarlo.
            </p>
          </div>
        )}
        <div className="inspector__foot mono mono--muted">Tocá un nodo del grafo para inspeccionarlo</div>
      </aside>
    </div>
  );
}
