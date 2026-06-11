"use client";

/* eslint-disable react-hooks/set-state-in-effect -- Trader loading state is synchronized with API requests keyed by filters. */

import { useEffect, useRef, useState } from "react";
import { Graph3D } from "@/components/Graph3D";
import type { GraphResponse, TraderProfile, TraderSummary } from "@/lib/types";
import type { AppFilters, GraphTarget } from "@/lib/ui-state";
import { serializeMarketplaces } from "@/lib/ui-state";
import { AlertTriangle, BarChart3, Shield, ShieldAlert, X } from "lucide-react";

/* ── Risk badge ── */
function RiskBadge({ score }: { score: number }) {
  const high = score >= 70;
  const mid  = score >= 40;
  const Icon = high ? ShieldAlert : mid ? AlertTriangle : Shield;
  const color = high ? "var(--d-red)" : mid ? "#c98a2a" : "#4ade80";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color, fontFamily: "var(--font-mono)", fontSize: 11 }}>
      <Icon size={13} strokeWidth={2} />
      {score}
    </span>
  );
}

/* ── Trader Profile Drawer ── */
type DrawerProps = {
  traderId: string;
  handle: string;
  onClose: () => void;
  onOpenGraph: (target: GraphTarget) => void;
};

function TraderDrawer({ traderId, handle, onClose, onOpenGraph }: DrawerProps) {
  const [profile,  setProfile]  = useState<TraderProfile | null>(null);
  const [graph,    setGraph]    = useState<GraphResponse | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [viewMode, setViewMode] = useState<"inventory" | "network">("inventory");
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/traders/${encodeURIComponent(traderId)}`).then((r) => r.ok ? r.json() : null),
      fetch(`/api/graph?traderId=${encodeURIComponent(traderId)}`).then((r) => r.ok ? r.json() : null),
    ]).then(([p, g]) => {
      setProfile(p);
      setGraph(g);
    }).finally(() => setLoading(false));
  }, [traderId]);

  /* Close on Escape */
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  /* Trap focus inside drawer */
  useEffect(() => { drawerRef.current?.focus(); }, []);

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
          zIndex: 40, backdropFilter: "blur(2px)",
        }}
      />

      {/* Panel */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Perfil de ${handle}`}
        tabIndex={-1}
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0,
          width: "min(520px, 95vw)",
          background: "var(--d-panel)",
          borderLeft: "1px solid var(--d-hair-strong)",
          zIndex: 50, overflowY: "auto",
          display: "flex", flexDirection: "column",
          animation: "drawer-slide-in 0.22s ease-out",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", borderBottom: "1px solid var(--d-hair)",
          position: "sticky", top: 0, background: "var(--d-panel)", zIndex: 1,
        }}>
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--d-muted)", marginBottom: 4 }}>
              Perfil de trader
            </div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 400, color: "var(--d-ink)" }}>{handle}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar perfil"
            style={{ background: "none", border: "none", color: "var(--d-muted)", cursor: "pointer", padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>

        {loading && (
          <div style={{ padding: 32, textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--d-muted)" }}>
            Cargando perfil…
          </div>
        )}

        {!loading && profile && (
          <>
            {/* Metrics */}
            <div style={{ padding: "16px 20px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, borderBottom: "1px solid var(--d-hair)" }}>
              {[
                { label: "Volumen total", value: `$${Math.round(profile.volumeUsd).toLocaleString("es-AR")}`, icon: <BarChart3 size={14} /> },
                { label: "Transacciones", value: String(profile.transactionCount), icon: <BarChart3 size={14} /> },
                { label: "Margen prom.", value: `${profile.avgMarginPct.toFixed(1)}%`, icon: <BarChart3 size={14} /> },
              ].map(({ label, value, icon }) => (
                <div key={label} style={{ background: "var(--d-panel-2)", padding: "10px 12px", borderRadius: 2 }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--d-muted)", marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
                    {icon}{label}
                  </div>
                  <div style={{ fontFamily: "var(--font-serif)", fontSize: 20, color: "var(--d-ink)" }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Risk + meta */}
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--d-hair)", display: "flex", gap: 24, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--d-muted)", marginBottom: 4 }}>Nivel de riesgo</div>
                <RiskBadge score={profile.riskScore} />
              </div>
              <div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--d-muted)", marginBottom: 4 }}>Marketplaces</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--d-ink)" }}>{profile.marketplaces.join(" · ")}</div>
              </div>
              {profile.firstSeenAt && (
                <div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--d-muted)", marginBottom: 4 }}>Primer registro</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--d-ink)" }}>{new Date(profile.firstSeenAt).toLocaleDateString("es-AR")}</div>
                </div>
              )}
            </div>

            {/* Mini graph with Inventory / Network toggle */}
            {graph && (
              <div style={{ padding: "14px 20px 0", borderBottom: "1px solid var(--d-hair)" }}>
                {/* Toggle header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--d-muted)" }}>
                    {viewMode === "inventory"
                      ? `Inventario · ${graph.nodes.filter((n) => n.type !== "trader" || n.id === traderId).length} nodos`
                      : `Red de conexiones · ${graph.nodes.length} nodos`}
                  </div>
                  <div style={{ display: "flex", background: "var(--d-panel-2)", borderRadius: 6, padding: 2, gap: 2 }}>
                    {(["inventory", "network"] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setViewMode(mode)}
                        style={{
                          padding: "3px 10px",
                          borderRadius: 4,
                          border: "none",
                          cursor: "pointer",
                          fontFamily: "var(--font-mono)",
                          fontSize: 10,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          background: viewMode === mode ? "var(--d-orange, #ff9f1c)" : "transparent",
                          color: viewMode === mode ? "#000" : "var(--d-muted)",
                          fontWeight: viewMode === mode ? 600 : 400,
                          transition: "all 0.15s",
                        }}
                      >
                        {mode === "inventory" ? "Inventario" : "Red"}
                      </button>
                    ))}
                  </div>
                </div>
                <Graph3D
                  chargeStrength={viewMode === "inventory" ? -280 : -120}
                  graph={
                    viewMode === "inventory"
                      ? {
                          ...graph,
                          nodes: graph.nodes.filter((n) => n.type !== "trader" || n.id === traderId),
                          edges: graph.edges.filter((e) =>
                            graph.nodes
                              .filter((n) => n.type !== "trader" || n.id === traderId)
                              .some((n) => n.id === e.source || n.id === e.target)
                          ),
                        }
                      : graph
                  }
                  height={280}
                />
              </div>
            )}

            {/* CTA */}
            <div style={{ padding: "16px 20px" }}>
              <button
                className="terminal-action primary"
                onClick={() => { onOpenGraph({ type: "trader", traderId: profile.id, label: profile.handle }); onClose(); }}
              >
                Ver grafo completo en explorador →
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

/* ── Main workspace ── */
type TraderWorkspaceProps = {
  filters: AppFilters;
  onOpenGraph: (target: GraphTarget) => void;
};

export function TraderWorkspace({ filters, onOpenGraph }: TraderWorkspaceProps) {
  const [traders, setTraders]           = useState<TraderSummary[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");
  const [selectedTrader, setSelected]   = useState<TraderSummary | null>(null);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      q: filters.query,
      marketplaces: serializeMarketplaces(filters.marketplaces),
    });

    fetch(`/api/traders?${params}`)
      .then((res) => {
        if (!res.ok) throw new Error("traders");
        return res.json();
      })
      .then((data: TraderSummary[]) => { setTraders(data); setError(""); })
      .catch(() => { setError("No se pudieron obtener traders."); setTraders([]);})
      .finally(() => setLoading(false));
  }, [filters]);

  return (
    <>
      <section className="table-panel" style={{ marginTop: 16 }}>
        <div className="panel-header">
          <div>
            <h2>Traders</h2>
            <p>Ranking por volumen, actividad, riesgo y marketplaces conectados. Clic para ver perfil.</p>
          </div>
        </div>

        {loading && (
          <div className="feed-skeleton" style={{ padding: "12px 16px" }}>
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton-row" />)}
          </div>
        )}
        {error   && <div className="feed-error" role="alert"><p>{error}</p></div>}
        {!loading && !error && traders.length === 0 && (
          <div className="feed-empty"><p>No hay traders con los filtros actuales.</p></div>
        )}

        {!loading && !error && traders.length > 0 && (
          <div className="table-scroll">
            <table className="opp-table" aria-label="Tabla de traders">
              <thead>
                <tr>
                  <th>Trader</th>
                  <th style={{ textAlign: "right" }}>Transacciones</th>
                  <th style={{ textAlign: "right" }}>Volumen</th>
                  <th style={{ textAlign: "right" }}>Margen</th>
                  <th style={{ textAlign: "center" }}>Riesgo</th>
                  <th>Marketplaces</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {traders.map((trader) => (
                  <tr
                    key={trader.id}
                    className={`opp-row${selectedTrader?.id === trader.id ? " selected" : ""}`}
                    onClick={() => setSelected(trader)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelected(trader); } }}
                    aria-label={`Ver perfil de ${trader.handle}`}
                  >
                    <td className="opp-skin-name" style={{ fontWeight: 500 }}>{trader.handle}</td>
                    <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12 }}>{trader.transactionCount}</td>
                    <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12 }}>${Math.round(trader.volumeUsd).toLocaleString("es-AR")}</td>
                    <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12 }}>{trader.avgMarginPct.toFixed(1)}%</td>
                    <td style={{ textAlign: "center" }}><RiskBadge score={trader.riskScore} /></td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--d-muted)" }}>{trader.marketplaces.join(" · ")}</td>
                    <td>
                      <button
                        className="ghost-action"
                        onClick={(e) => { e.stopPropagation(); onOpenGraph({ type: "trader", traderId: trader.id, label: trader.handle }); }}
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

      {selectedTrader && (
        <TraderDrawer
          traderId={selectedTrader.id}
          handle={selectedTrader.handle}
          onClose={() => setSelected(null)}
          onOpenGraph={onOpenGraph}
        />
      )}
    </>
  );
}
