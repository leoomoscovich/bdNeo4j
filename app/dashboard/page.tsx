"use client";

/* eslint-disable react-hooks/set-state-in-effect -- Initial hydration from localStorage and latest scan API happens after mount. */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AppShell } from "@/components/AppShell";
import { CompareWorkspace } from "@/components/CompareWorkspace";
import { GraphInsightPanel } from "@/components/GraphInsightPanel";
import { MarketPulseCards } from "@/components/MarketPulseCards";
import { OpportunityFeed } from "@/components/OpportunityFeed";
import { PatternsWorkspace } from "@/components/PatternsWorkspace";
import { RiskCyclesPanel } from "@/components/RiskCyclesPanel";
import { SelectedAssetDrawer } from "@/components/SelectedAssetDrawer";
import { TraderWorkspace } from "@/components/TraderWorkspace";
import { WatchlistWorkspace } from "@/components/WatchlistWorkspace";
import { getCompareIds, setCompareIds, toggleWatchlistId } from "@/lib/local-preferences";
import type { Opportunity, RiskCycle, ScanSummary } from "@/lib/types";
import { defaultFilters, serializeMarketplaces, type AppFilters, type GraphTarget, type MarketplaceId, type SignalFilter, type WorkspaceId } from "@/lib/ui-state";
import "./dashboard.css";

export default function DashboardPage() {
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceId>("market-radar");
  const [filters, setFilters] = useState<AppFilters>(defaultFilters);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [selectedRiskCycle, setSelectedRiskCycle] = useState<RiskCycle | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [graphTarget, setGraphTarget] = useState<GraphTarget | null>(null);
  const [compareIdsState, setCompareIdsState] = useState<string[]>([]);
  const [scan, setScan] = useState<ScanSummary | null>(null);
  const [scanStatus, setScanStatus] = useState<"idle" | "running" | "error">("idle");

  useEffect(() => {
    setCompareIdsState(getCompareIds());
    fetch("/api/scans/latest")
      .then((res) => res.ok ? res.json() : null)
      .then((payload: ScanSummary | null) => setScan(payload))
      .catch(() => setScan(null));
  }, []);

  // Grafo por defecto: sin selección, el explorador muestra el vecindario
  // del trader con más volumen en vez de un estado vacío.
  useEffect(() => {
    if (graphTarget) return;
    fetch("/api/traders")
      .then((res) => (res.ok ? res.json() : []))
      .then((traders: Array<{ id: string; handle: string }>) => {
        if (traders[0]) {
          setGraphTarget((current) => current ?? { type: "trader", traderId: traders[0].id, label: traders[0].handle });
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateFilters(patch: Partial<AppFilters>) {
    setFilters((current) => ({ ...current, ...patch }));
  }

  function handleMarketplaceToggle(marketplace: MarketplaceId) {
    setFilters((current) => {
      const active = current.marketplaces.includes(marketplace);
      if (active && current.marketplaces.length === 1) {
        return current;
      }

      return {
        ...current,
        marketplaces: active
          ? current.marketplaces.filter((item) => item !== marketplace)
          : [...current.marketplaces, marketplace],
      };
    });
  }

  function handleSelectOpportunity(opp: Opportunity) {
    setSelectedOpportunity(opp);
    setSelectedRiskCycle(null);
    setDrawerOpen(true);
  }

  function handleSelectRiskCycle(cycle: RiskCycle) {
    setSelectedRiskCycle(cycle);
    setSelectedOpportunity(null);
    setDrawerOpen(true);
  }

  function handleOpenOpportunityGraph(opp: Opportunity) {
    setGraphTarget({ type: "opportunity", instanceId: opp.instanceId, label: opp.skinName });
    setActiveWorkspace("graph-explorer");
  }

  function handleOpenRiskGraph(cycle: RiskCycle) {
    setGraphTarget({ type: "risk-cycle", cycleId: cycle.id, instanceId: cycle.instanceId, label: cycle.title });
    setActiveWorkspace("graph-explorer");
  }

  function handleCompareOpportunity(opp: Opportunity) {
    const next = [...compareIdsState.filter((id) => id !== opp.id), opp.id].slice(-4);
    setCompareIdsState(next);
    setCompareIds(next);
    if (next.length >= 2) {
      setActiveWorkspace("compare");
    }
  }

  function handleClearCompare() {
    setCompareIdsState([]);
    setCompareIds([]);
  }

  async function handleRunScan() {
    setScanStatus("running");
    try {
      const res = await fetch("/api/scans", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ marketplaces: filters.marketplaces }),
      });
      if (!res.ok) throw new Error("scan");
      const payload = await res.json();
      setScan(payload);
      setScanStatus("idle");
    } catch {
      setScanStatus("error");
    }
  }

  async function handleOpenBestOpportunity() {
    const params = new URLSearchParams({
      q: filters.query,
      marketplaces: serializeMarketplaces(filters.marketplaces),
      minSpreadPct: String(filters.minSpreadPct),
      maxRiskScore: String(filters.maxRiskScore),
      signal: filters.signal,
    });
    const res = await fetch(`/api/opportunities?${params}`);
    if (!res.ok) return;
    const opportunities: Opportunity[] = await res.json();
    if (opportunities[0]) {
      handleSelectOpportunity(opportunities[0]);
    }
  }

  function handleExport(type: "opportunities" | "cycles") {
    const params = new URLSearchParams({
      type,
      format: "json",
      marketplaces: serializeMarketplaces(filters.marketplaces),
    });
    window.location.href = `/api/export?${params}`;
  }

  const workspace = (
    <>
      {activeWorkspace === "dashboard" && (
        <section className="workspace">
          <div className="table-panel">
            <div className="panel-header">
              <div>
                <h2>Dashboard</h2>
                <p>Live market pulse and scan summary for the active marketplaces.</p>
              </div>
            </div>
            <div style={{ padding: 18 }}>
              <MarketPulseCards />
            </div>
          </div>
          <div className="right-stack">
            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2>Scan Status</h2>
                  <p>{scan ? `${scan.opportunitiesFound} opportunities, ${scan.riskCyclesFound} risk cycles.` : "No scan has been run yet."}</p>
                </div>
              </div>
            </section>
            <GraphInsightPanel graphTarget={graphTarget} />
          </div>
        </section>
      )}

      {activeWorkspace === "market-radar" && (
        <section className="workspace" style={{ flexDirection: "column", gap: 16 }}>
          {/* Métricas live — vienen de Neo4j vía /api/market-pulse */}
          <MarketPulseCards />

          {/* Dos columnas: oportunidades | ciclos de riesgo */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>
            <OpportunityFeed
              selectedId={selectedOpportunity?.id}
              filters={filters}
              onSelect={handleSelectOpportunity}
              onOpenGraph={handleOpenOpportunityGraph}
              onCompare={handleCompareOpportunity}
              onSignalChange={(signal: SignalFilter) => updateFilters({ signal })}
            />

            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2>Vendedores de riesgo</h2>
                  <p>Señales reales: sin historial verificado, trades fallidos o perfil oculto.</p>
                </div>
              </div>
              <div className="compact-panel-body">
                <RiskCyclesPanel
                  selectedId={selectedRiskCycle?.id}
                  filters={filters}
                  onSelect={handleSelectRiskCycle}
                />
              </div>
            </section>
          </div>
        </section>
      )}

      {activeWorkspace === "patterns" && (
        <section style={{ marginTop: 16 }}>
          <PatternsWorkspace
            onOpenGraph={(target) => {
              setGraphTarget(target);
              setActiveWorkspace("graph-explorer");
            }}
          />
        </section>
      )}

      {activeWorkspace === "risk-cycles" && (
        <section className="workspace">
          <section className="panel">
            <div className="panel-header">
              <div>
                <h2>Vendedores de riesgo</h2>
                <p>Vendedores reales con señales de riesgo observables, ordenados por exposición.</p>
              </div>
            </div>
            <div style={{ padding: 18 }}>
              <RiskCyclesPanel
                selectedId={selectedRiskCycle?.id}
                filters={filters}
                onSelect={handleSelectRiskCycle}
              />
            </div>
          </section>
          <GraphInsightPanel graphTarget={graphTarget} selectedRiskCycle={selectedRiskCycle} />
        </section>
      )}

      {activeWorkspace === "graph-explorer" && (
        <section className="panel graph-panel" style={{ marginTop: 16 }}>
          <div className="panel-header">
            <div>
              <h2>Graph Explorer</h2>
              <p>{graphTarget ? graphTarget.label : "Select an opportunity, trader, market or risk cycle to render a graph."}</p>
            </div>
          </div>
          <GraphInsightPanel graphTarget={graphTarget} selectedOpportunity={selectedOpportunity} selectedRiskCycle={selectedRiskCycle} />
        </section>
      )}

      {activeWorkspace === "traders" && (
        <section style={{ marginTop: 16 }}>
          <TraderWorkspace
            filters={filters}
            onOpenGraph={(target) => {
              setGraphTarget(target);
              setActiveWorkspace("graph-explorer");
            }}
          />
        </section>
      )}

      {activeWorkspace === "watchlist" && (
        <section style={{ marginTop: 16 }}>
          <WatchlistWorkspace
            filters={filters}
            onSelect={handleSelectOpportunity}
            onOpenGraph={handleOpenOpportunityGraph}
            onCompare={handleCompareOpportunity}
          />
        </section>
      )}

      {activeWorkspace === "compare" && (
        <section style={{ marginTop: 16 }}>
          <CompareWorkspace ids={compareIdsState} onClear={handleClearCompare} />
        </section>
      )}
    </>
  );

  return (
    <AppShell
      activeNav={activeWorkspace}
      filters={filters}
      scan={scan}
      scanStatus={scanStatus}
      onNavChange={setActiveWorkspace}
      onMarketplaceToggle={handleMarketplaceToggle}
      onRunScan={handleRunScan}
      onSearch={(query) => updateFilters({ query })}
    >
      <section className="ops-status-band">
        <motion.div
          className="engine-strip"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <div className="engine-cell primary">
            <span>Neo4j</span>
            <strong>{scanStatus === "running" ? "Escaneando" : scanStatus === "error" ? "Error" : "Online"}</strong>
          </div>
          <div className="engine-cell">
            <span>Marketplaces</span>
            <strong>{filters.marketplaces.join(" / ")}</strong>
          </div>
          <div className="engine-cell">
            <span>Señales</span>
            <strong>{scan ? scan.opportunitiesFound + scan.riskCyclesFound : "—"}</strong>
          </div>
          <div className="engine-cell">
            <span>Último scan</span>
            <strong>{scan?.completedAt ? new Date(scan.completedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Sin scan"}</strong>
          </div>
          <div className="engine-actions">
            <button className="terminal-action primary" onClick={handleRunScan} disabled={scanStatus === "running"}>
              {scanStatus === "running" ? "Escaneando…" : "Ejecutar scan"}
            </button>
          </div>
        </motion.div>
      </section>

      {workspace}

      {drawerOpen && (
        <SelectedAssetDrawer
          selectedOpportunity={selectedOpportunity}
          selectedRiskCycle={selectedRiskCycle}
          onClose={() => {
            setDrawerOpen(false);
            setSelectedOpportunity(null);
            setSelectedRiskCycle(null);
          }}
          onTrack={selectedOpportunity ? () => toggleWatchlistId(selectedOpportunity.id) : undefined}
          onOpenGraph={
            selectedOpportunity
              ? () => handleOpenOpportunityGraph(selectedOpportunity)
              : selectedRiskCycle
                ? () => handleOpenRiskGraph(selectedRiskCycle)
                : undefined
          }
          onCompare={selectedOpportunity ? () => handleCompareOpportunity(selectedOpportunity) : undefined}
          onExport={() => handleExport(selectedRiskCycle ? "cycles" : "opportunities")}
        />
      )}
    </AppShell>
  );
}
