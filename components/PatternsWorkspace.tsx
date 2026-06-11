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

const fmt = (v: number) =>
  `$${v.toLocaleString("es-AR", { maximumFractionDigits: v < 10 ? 2 : 0 })}`;

type PatternsWorkspaceProps = {
  onOpenGraph: (target: GraphTarget) => void;
};

function PanelSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="feed-skeleton" style={{ padding: "12px 18px" }} aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => <div key={i} className="skeleton-row" />)}
    </div>
  );
}

export function PatternsWorkspace({ onOpenGraph }: PatternsWorkspaceProps) {
  const [data,    setData]    = useState<PatternsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    fetch("/api/patterns")
      .then((res) => {
        if (!res.ok) throw new Error("patterns");
        return res.json();
      })
      .then((payload: PatternsPayload) => { setData(payload); })
      .catch(() => setError("No se pudieron calcular los patrones. Verificá que Neo4j esté corriendo."))
      .finally(() => setLoading(false));
  }, []);

  if (error) return <div className="feed-error" role="alert"><p>{error}</p></div>;

  const isEmpty = data && data.crossVenue.length === 0 && data.crowdedSkins.length === 0 && data.floatPremium.length === 0;

  return (
    <div className="patterns-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start", marginTop: 16 }}>

      {/* P1 — Spreads cross-venue */}
      <section className="table-panel" style={{ gridColumn: "1 / -1" }}>
        <div className="panel-header">
          <div>
            <h2>Spreads entre marketplaces</h2>
            <p>La misma skin+wear cotiza distinto en cada venue. Oportunidad de arbitraje real observable en el grafo.</p>
          </div>
          {data && <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--d-muted)", alignSelf: "center" }}>{data.crossVenue.length} skins</div>}
        </div>

        {loading && <PanelSkeleton rows={4} />}

        {!loading && !isEmpty && data && data.crossVenue.length === 0 && (
          <div className="feed-empty"><p>Sin datos cross-venue en el grafo actual.</p></div>
        )}

        {!loading && data && data.crossVenue.length > 0 && (
          <div className="table-scroll">
            <table className="opp-table" aria-label="Spreads entre marketplaces">
              <thead>
                <tr>
                  <th>Skin</th>
                  <th>Wear</th>
                  <th>Venues y precios</th>
                  <th style={{ textAlign: "right" }}>Spread</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.crossVenue.map((row) => (
                  <tr key={`${row.skinId}-${row.wear}`} className="opp-row">
                    <td className="opp-skin-name">{row.skinName}</td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--d-muted)" }}>{row.wear}</td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>
                      {row.venues.map((v) => `${v.venue}: ${fmt(v.price)}`).join("  ·  ")}
                    </td>
                    <td style={{
                      textAlign: "right",
                      fontFamily: "var(--font-mono)", fontSize: 12,
                      color: row.spreadPct >= 10 ? "#4ade80" : "var(--d-ink)",
                      fontWeight: row.spreadPct >= 10 ? 500 : undefined,
                    }}>
                      +{row.spreadPct.toFixed(1)}%
                    </td>
                    <td>
                      <button
                        className="ghost-action"
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
        )}
      </section>

      {/* P2 — Mercados saturados */}
      <section className="table-panel">
        <div className="panel-header">
          <div>
            <h2>Mercados saturados</h2>
            <p>Skins con más vendedores reales compitiendo. La dispersión de precios es la negociación visible.</p>
          </div>
        </div>

        {loading && <PanelSkeleton rows={4} />}

        {!loading && data && data.crowdedSkins.length === 0 && (
          <div className="feed-empty"><p>Sin skins con saturación detectada.</p></div>
        )}

        {!loading && data && data.crowdedSkins.length > 0 && (
          <div className="table-scroll">
            <table className="opp-table" aria-label="Mercados saturados">
              <thead>
                <tr>
                  <th>Skin</th>
                  <th style={{ textAlign: "right" }}>Vendedores</th>
                  <th>Rango Ask</th>
                  <th style={{ textAlign: "right" }}>Dispersión</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.crowdedSkins.map((row) => (
                  <tr key={row.skinId} className="opp-row">
                    <td className="opp-skin-name">{row.skinName}</td>
                    <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12 }}>{row.sellers}</td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>{fmt(row.minAsk)}–{fmt(row.maxAsk)}</td>
                    <td style={{
                      textAlign: "right",
                      fontFamily: "var(--font-mono)", fontSize: 12,
                      color: row.askDispersionPct >= 15 ? "#4ade80" : "var(--d-ink)",
                    }}>
                      ±{row.askDispersionPct.toFixed(1)}%
                    </td>
                    <td>
                      <button
                        className="ghost-action"
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
        )}
      </section>

      {/* P3 — Premium por float */}
      <section className="table-panel">
        <div className="panel-header">
          <div>
            <h2>Premium por float</h2>
            <p>Piezas con float raro que cotiza por encima del precio base. El factor lo publica el marketplace.</p>
          </div>
        </div>

        {loading && <PanelSkeleton rows={4} />}

        {!loading && data && data.floatPremium.length === 0 && (
          <div className="feed-empty"><p>Sin premiums por float detectados.</p></div>
        )}

        {!loading && data && data.floatPremium.length > 0 && (
          <div className="table-scroll">
            <table className="opp-table" aria-label="Premium por float">
              <thead>
                <tr>
                  <th>Skin</th>
                  <th style={{ textAlign: "right" }}>Float</th>
                  <th style={{ textAlign: "right" }}>Precio</th>
                  <th style={{ textAlign: "right" }}>Premium</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.floatPremium.map((row, idx) => (
                  <tr key={`${row.instanceId}-${idx}`} className="opp-row">
                    <td className="opp-skin-name">{row.skinName}</td>
                    <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--d-muted)" }}>
                      {row.floatValue.toFixed(4)}
                    </td>
                    <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12 }}>{fmt(row.priceUsd)}</td>
                    <td style={{
                      textAlign: "right",
                      fontFamily: "var(--font-mono)", fontSize: 12,
                      color: "#4ade80", fontWeight: 500,
                    }}>
                      +{row.premiumPct.toFixed(1)}%
                    </td>
                    <td>
                      <button
                        className="ghost-action"
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
        )}
      </section>

      {/* Global empty state when Neo4j has no pattern data yet */}
      {!loading && isEmpty && (
        <section className="table-panel" style={{ gridColumn: "1 / -1" }}>
          <div className="feed-empty">
            <p>No se detectaron patrones en el grafo actual.</p>
            <p style={{ marginTop: 6, fontSize: 11, color: "var(--d-muted)" }}>
              Ejecutá un scan primero o verificá que el seed de Neo4j incluyó PriceSnapshots y Transactions.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
