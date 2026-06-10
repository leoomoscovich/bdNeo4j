"use client";

/* eslint-disable react-hooks/set-state-in-effect -- fetch on mount */

import { useEffect, useState } from "react";
import type { GraphTarget } from "@/lib/ui-state";

type CrossVenueRow = {
  skinId: string;
  skinName: string;
  imageUrl: string;
  wear: string;
  venues: Array<{ venue: string; price: number }>;
  spreadPct: number;
};

type CrowdedSkin = {
  skinId: string;
  skinName: string;
  imageUrl: string;
  sellers: number;
  listings: number;
  minAsk: number;
  maxAsk: number;
  askDispersionPct: number;
};

type FloatPremiumRow = {
  skinId: string;
  skinName: string;
  instanceId: string;
  floatValue: number;
  wear: string;
  priceUsd: number;
  basePriceUsd: number;
  premiumPct: number;
  sellerName: string;
  sellerId: string;
};

type PatternsPayload = {
  crossVenue: CrossVenueRow[];
  crowdedSkins: CrowdedSkin[];
  floatPremium: FloatPremiumRow[];
};

const fmt = (v: number) => `$${v.toLocaleString("es-AR", { maximumFractionDigits: v < 10 ? 2 : 0 })}`;

type PatternsWorkspaceProps = {
  onOpenGraph: (target: GraphTarget) => void;
};

export function PatternsWorkspace({ onOpenGraph }: PatternsWorkspaceProps) {
  const [data, setData] = useState<PatternsPayload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/patterns")
      .then((res) => {
        if (!res.ok) throw new Error("patterns");
        return res.json();
      })
      .then(setData)
      .catch(() => setError("No se pudieron calcular los patrones."));
  }, []);

  if (error) return <div className="empty-state error-state">{error}</div>;
  if (!data) return <div className="empty-state">Detectando patrones en el grafo…</div>;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>
      {/* P1 — Spreads cross-venue */}
      <section className="panel" style={{ gridColumn: "1 / -1" }}>
        <div className="panel-header">
          <div>
            <h2>Spreads entre marketplaces</h2>
            <p>La misma skin+wear cotiza distinto en cada venue. Precios reales observados en Skinport, Market.CSGO y Steam.</p>
          </div>
        </div>
        <div style={{ padding: "0 18px 18px", overflowX: "auto" }}>
          <table className="desk__table" style={{ width: "100%" }}>
            <thead>
              <tr style={{ textAlign: "left", opacity: 0.6 }}>
                <th>Skin</th><th>Wear</th><th>Venues</th><th>Spread</th><th></th>
              </tr>
            </thead>
            <tbody>
              {data.crossVenue.map((row) => (
                <tr key={`${row.skinId}-${row.wear}`}>
                  <td>{row.skinName}</td>
                  <td className="mono">{row.wear}</td>
                  <td className="mono" style={{ fontSize: 12 }}>
                    {row.venues.map((v) => `${v.venue}: ${fmt(v.price)}`).join("  ·  ")}
                  </td>
                  <td className={row.spreadPct >= 10 ? "num--up" : undefined}>+{row.spreadPct.toFixed(1)}%</td>
                  <td>
                    <button
                      className="terminal-action"
                      onClick={() => onOpenGraph({ type: "skin", skinId: row.skinId, label: row.skinName })}
                    >
                      Ver grafo
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* P2 — Mercados saturados */}
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Mercados saturados</h2>
            <p>Skins con más vendedores reales compitiendo en CSFloat. La dispersión de precios entre ellos es la negociación visible.</p>
          </div>
        </div>
        <div style={{ padding: "0 18px 18px" }}>
          <table className="desk__table" style={{ width: "100%" }}>
            <tbody>
              {data.crowdedSkins.map((row) => (
                <tr key={row.skinId}>
                  <td>{row.skinName}</td>
                  <td className="mono">{row.sellers} vend.</td>
                  <td className="mono">{fmt(row.minAsk)}–{fmt(row.maxAsk)}</td>
                  <td className={row.askDispersionPct >= 15 ? "num--up" : undefined}>±{row.askDispersionPct.toFixed(1)}%</td>
                  <td>
                    <button
                      className="terminal-action"
                      onClick={() => onOpenGraph({ type: "skin", skinId: row.skinId, label: row.skinName })}
                    >
                      Grafo
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* P3 — Premium por float */}
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Premium por float</h2>
            <p>Piezas reales cuyo float raro les da sobreprecio sobre el precio base. El factor lo publica el propio marketplace.</p>
          </div>
        </div>
        <div style={{ padding: "0 18px 18px" }}>
          <table className="desk__table" style={{ width: "100%" }}>
            <tbody>
              {data.floatPremium.map((row) => (
                <tr key={row.instanceId}>
                  <td>{row.skinName}</td>
                  <td className="mono">{row.floatValue.toFixed(4)}</td>
                  <td className="mono">{fmt(row.priceUsd)}</td>
                  <td className="num--up">+{row.premiumPct.toFixed(1)}%</td>
                  <td>
                    <button
                      className="terminal-action"
                      onClick={() => onOpenGraph({ type: "opportunity", instanceId: row.instanceId, label: row.skinName })}
                    >
                      Grafo
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
