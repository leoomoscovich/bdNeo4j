"use client";

/* eslint-disable react-hooks/set-state-in-effect -- Feed loading state is synchronized with API requests keyed by filters. */

import { useEffect, useState } from "react";
import type { Opportunity, SignalType } from "@/lib/types";
import type { AppFilters, SignalFilter } from "@/lib/ui-state";
import { serializeMarketplaces } from "@/lib/ui-state";

const SIGNAL_COLORS: Record<SignalType, string> = {
  UNDERPRICED: "signal-warm strong",
  FAST_FLIP: "signal-warm",
  STICKER_PREMIUM: "signal-burgundy",
  LOW_FLOAT_PREMIUM: "signal-soft",
  THIN_MARKET: "signal-muted",
  RISK_ADJUSTED: "signal-neutral",
};

const SIGNAL_LABELS: Record<SignalType, string> = {
  UNDERPRICED: "Underpriced",
  FAST_FLIP: "Fast flip",
  STICKER_PREMIUM: "Sticker premium",
  LOW_FLOAT_PREMIUM: "Low float",
  THIN_MARKET: "Thin market",
  RISK_ADJUSTED: "Risk adjusted",
};

function spreadColor(spreadPct: number): string {
  if (spreadPct >= 10) return "spread-hot";
  if (spreadPct >= 5) return "spread-warm";
  return "spread-muted";
}

function confidenceBar(score: number): string {
  if (score >= 80) return "confidence-high";
  if (score >= 60) return "confidence-mid";
  if (score >= 40) return "confidence-low";
  return "confidence-muted";
}

type OpportunityFeedProps = {
  selectedId?: string;
  filters: AppFilters;
  onSelect: (opp: Opportunity) => void;
  onOpenGraph: (opp: Opportunity) => void;
  onCompare: (opp: Opportunity) => void;
  onSignalChange: (signal: SignalFilter) => void;
};

export function OpportunityFeed({
  selectedId,
  filters,
  onSelect,
  onOpenGraph,
  onCompare,
  onSignalChange,
}: OpportunityFeedProps) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      q: filters.query,
      marketplaces: serializeMarketplaces(filters.marketplaces),
      minSpreadPct: String(filters.minSpreadPct),
      maxRiskScore: String(filters.maxRiskScore),
      signal: filters.signal,
    });

    fetch(`/api/opportunities?${params}`)
      .then((res) => {
        if (!res.ok) throw new Error("No se pudieron obtener oportunidades.");
        return res.json();
      })
      .then((data: Opportunity[]) => {
        setOpportunities(data);
        setError("");
      })
      .catch((err) => {
        setError(err.message || "Error desconocido.");
        setOpportunities([]);
      })
      .finally(() => setLoading(false));
  }, [filters]);

  const panelHeader = (
    <div className="panel-header">
      <div>
        <h2>Oportunidades de mercado</h2>
        <p>Ordenadas por spread, confianza y calidad del camino de traders.</p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="table-panel" aria-busy="true" aria-label="Cargando oportunidades">
        {panelHeader}
        <div className="feed-skeleton">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton-row" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="table-panel">
        {panelHeader}
        <div className="feed-error" role="alert">
          <p>{error}</p>
          <button className="ghost-action" onClick={() => window.location.reload()}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (opportunities.length === 0) {
    return (
      <div className="table-panel">
        {panelHeader}
        <div className="feed-empty">
          <p>No se encontraron oportunidades con los parámetros actuales.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="table-panel">
      <div className="panel-header">
        <div>
          <h2>Oportunidades de mercado</h2>
          <p>Ordenadas por spread, confianza y calidad del camino de traders.</p>
        </div>
        <div className="mini-tabs">
          <button className={filters.signal === "ALL" ? "active" : ""} onClick={() => onSignalChange("ALL")}>Todas</button>
          <button className={filters.signal === "LOW_FLOAT_PREMIUM" ? "active" : ""} onClick={() => onSignalChange("LOW_FLOAT_PREMIUM")}>Float bajo</button>
          <button className={filters.signal === "STICKER_PREMIUM" ? "active" : ""} onClick={() => onSignalChange("STICKER_PREMIUM")}>Sticker</button>
          <button className={filters.signal === "FAST_FLIP" ? "active" : ""} onClick={() => onSignalChange("FAST_FLIP")}>Fast flip</button>
        </div>
      </div>

      <div className="table-scroll">
        <table className="opp-table" aria-label="Opportunity feed">
          <thead>
            <tr>
              <th>Skin</th>
              <th>Desgaste / Float</th>
              <th>Marketplace</th>
              <th>Precio</th>
              <th>Valor justo</th>
              <th>Spread</th>
              <th>Señal</th>
              <th>Confianza</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {opportunities.map((opp) => {
              const isSelected = opp.id === selectedId;
              return (
                <tr
                  key={opp.id}
                  className={`opp-row${isSelected ? " selected" : ""}`}
                  onClick={() => onSelect(opp)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelect(opp);
                    }
                  }}
                >
                  <td className="opp-skin">
                    <a
                      href={`/skins/${opp.skinId}`}
                      className="opp-skin-name opp-skin-link"
                      onClick={(e) => e.stopPropagation()}
                      title="Ver detalle en catálogo"
                    >
                      {opp.skinName}
                    </a>
                  </td>
                  <td className="opp-wear">
                    <span className="opp-wear-abbr">{opp.wear}</span>
                    <span className="opp-float"> · {opp.float.toFixed(2)}</span>
                  </td>
                  <td className="opp-marketplace">{opp.marketplace}</td>
                  <td className="opp-ask">${opp.currentAskUsd.toFixed(2)}</td>
                  <td className="opp-fair">${opp.fairValueUsd.toFixed(2)}</td>
                  <td className={`opp-spread ${spreadColor(opp.spreadPct)}`}>
                    {opp.spreadPct >= 0 ? "+" : ""}{opp.spreadPct.toFixed(1)}%
                  </td>
                  <td className="opp-signal">
                    <span className={`signal-badge ${SIGNAL_COLORS[opp.signal]}`}>
                      {SIGNAL_LABELS[opp.signal]}
                    </span>
                  </td>
                  <td className="opp-confidence">
                    <div className="confidence-track">
                      <div
                        className={`confidence-fill ${confidenceBar(opp.confidenceScore)}`}
                        style={{ width: `${opp.confidenceScore}%` }}
                      />
                    </div>
                    <span className="confidence-value">{opp.confidenceScore}</span>
                  </td>
                  <td>
                    <a
                      href={`/skins/${opp.skinId}`}
                      className="ghost-action"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Ver →
                    </a>
                    <button className="ghost-action" onClick={(e) => { e.stopPropagation(); onOpenGraph(opp); }}>Grafo</button>
                    <button className="ghost-action" onClick={(e) => { e.stopPropagation(); onCompare(opp); }}>Comparar</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
