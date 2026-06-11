"use client";

/* eslint-disable react-hooks/set-state-in-effect -- Watchlist hydrates from localStorage and API requests after mount. */

import { useEffect, useState } from "react";
import { getWatchlistIds, setWatchlistIds } from "@/lib/local-preferences";
import type { Opportunity } from "@/lib/types";
import type { AppFilters } from "@/lib/ui-state";
import { serializeMarketplaces } from "@/lib/ui-state";
import { Eye, GitCompare, Network, Trash2 } from "lucide-react";

type WatchlistWorkspaceProps = {
  filters: AppFilters;
  onSelect: (opp: Opportunity) => void;
  onOpenGraph: (opp: Opportunity) => void;
  onCompare: (opp: Opportunity) => void;
};

function SignalBadge({ signal }: { signal: string }) {
  const color =
    signal === "buy"  ? "#4ade80" :
    signal === "sell" ? "var(--d-red)" :
    "var(--d-muted)";
  return (
    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color }}>
      {signal}
    </span>
  );
}

export function WatchlistWorkspace({ filters, onSelect, onOpenGraph, onCompare }: WatchlistWorkspaceProps) {
  const [ids,     setIds]     = useState<string[]>([]);
  const [items,   setItems]   = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIds(getWatchlistIds());
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      marketplaces: serializeMarketplaces(filters.marketplaces),
      minSpreadPct: "0",
      maxRiskScore: String(filters.maxRiskScore),
    });

    fetch(`/api/opportunities?${params}`)
      .then((res) => res.json())
      .then((data: Opportunity[]) =>
        setItems(data.filter((opp) => ids.includes(opp.id) || ids.includes(opp.instanceId)))
      )
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [filters, ids]);

  function remove(id: string) {
    const next = ids.filter((item) => item !== id);
    setIds(next);
    setWatchlistIds(next);
  }

  return (
    <section className="table-panel" style={{ marginTop: 16 }}>
      <div className="panel-header">
        <div>
          <h2>Seguimiento</h2>
          <p>Oportunidades bajo observación personal. Guardadas localmente, actualizadas con datos de mercado en tiempo real.</p>
        </div>
        {ids.length > 0 && (
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--d-muted)", alignSelf: "center" }}>
            {ids.length} {ids.length === 1 ? "elemento" : "elementos"}
          </div>
        )}
      </div>

      {loading && (
        <div className="feed-skeleton" style={{ padding: "12px 16px" }} aria-busy="true" aria-label="Cargando seguimiento">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton-row" />)}
        </div>
      )}

      {!loading && ids.length === 0 && (
        <div className="feed-empty">
          <p>No hay oportunidades en seguimiento.</p>
          <p style={{ marginTop: 6, fontSize: 11, color: "var(--d-muted)" }}>
            Abrí el panel de detalle de cualquier oportunidad y usá &ldquo;Agregar a seguimiento&rdquo;.
          </p>
        </div>
      )}

      {!loading && ids.length > 0 && items.length === 0 && (
        <div className="feed-empty">
          <p>Las oportunidades rastreadas no coinciden con los filtros actuales.</p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="table-scroll">
          <table className="opp-table" aria-label="Oportunidades en seguimiento">
            <thead>
              <tr>
                <th>Skin</th>
                <th>Marketplace</th>
                <th style={{ textAlign: "right" }}>Ask</th>
                <th style={{ textAlign: "right" }}>Spread</th>
                <th style={{ textAlign: "center" }}>Señal</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((opp) => (
                <tr
                  key={opp.id}
                  className="opp-row"
                  onClick={() => onSelect(opp)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(opp); } }}
                  aria-label={`Ver detalle de ${opp.skinName}`}
                >
                  <td className="opp-skin-name">{opp.skinName}</td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--d-muted)" }}>{opp.marketplace}</td>
                  <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12 }}>${opp.currentAskUsd.toFixed(2)}</td>
                  <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12, color: opp.spreadPct >= 10 ? "#4ade80" : "var(--d-ink)" }}>
                    +{opp.spreadPct.toFixed(1)}%
                  </td>
                  <td style={{ textAlign: "center" }}><SignalBadge signal={opp.signal} /></td>
                  <td>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button
                        className="ghost-action"
                        aria-label={`Ver grafo de ${opp.skinName}`}
                        title="Ver grafo"
                        onClick={(e) => { e.stopPropagation(); onOpenGraph(opp); }}
                      >
                        <Network size={13} />
                      </button>
                      <button
                        className="ghost-action"
                        aria-label={`Comparar ${opp.skinName}`}
                        title="Comparar"
                        onClick={(e) => { e.stopPropagation(); onCompare(opp); }}
                      >
                        <GitCompare size={13} />
                      </button>
                      <button
                        className="ghost-action"
                        aria-label={`Quitar ${opp.skinName} del seguimiento`}
                        title="Quitar"
                        onClick={(e) => { e.stopPropagation(); remove(opp.id); }}
                        style={{ color: "var(--d-red)" }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div style={{ padding: "10px 18px", borderTop: "1px solid var(--d-hair)", display: "flex", gap: 8, alignItems: "center" }}>
          <Eye size={13} style={{ color: "var(--d-muted)" }} />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--d-muted)", letterSpacing: "0.08em" }}>
            Watchlist local · no requiere cuenta · se sincroniza con el mercado actual
          </span>
        </div>
      )}
    </section>
  );
}
