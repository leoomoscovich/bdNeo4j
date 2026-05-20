"use client";

/* eslint-disable react-hooks/set-state-in-effect -- Initial hydration from localStorage and latest scan API happens after mount. */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowDown, Globe2, Radar, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CompareWorkspace } from "@/components/CompareWorkspace";
import { GraphInsightPanel } from "@/components/GraphInsightPanel";
import { MarketPulseCards } from "@/components/MarketPulseCards";
import { OpportunityFeed } from "@/components/OpportunityFeed";
import { RiskCyclesPanel } from "@/components/RiskCyclesPanel";
import { SelectedAssetDrawer } from "@/components/SelectedAssetDrawer";
import { TraderWorkspace } from "@/components/TraderWorkspace";
import { WatchlistWorkspace } from "@/components/WatchlistWorkspace";
import { getCompareIds, setCompareIds, toggleWatchlistId } from "@/lib/local-preferences";
import type { Opportunity, RiskCycle, ScanSummary } from "@/lib/types";
import { defaultFilters, serializeMarketplaces, type AppFilters, type GraphTarget, type MarketplaceId, type SignalFilter, type WorkspaceId } from "@/lib/ui-state";

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
        <section className="workspace">
          <OpportunityFeed
            selectedId={selectedOpportunity?.id}
            filters={filters}
            onSelect={handleSelectOpportunity}
            onOpenGraph={handleOpenOpportunityGraph}
            onCompare={handleCompareOpportunity}
            onSignalChange={(signal: SignalFilter) => updateFilters({ signal })}
          />
          <div className="right-stack">
            <section className="panel graph-panel">
              <div className="panel-header">
                <div>
                  <h2>Graph Insight</h2>
                  <p>{graphTarget ? graphTarget.label : "Open a graph from any opportunity."}</p>
                </div>
              </div>
              <GraphInsightPanel graphTarget={graphTarget} />
            </section>
          </div>
        </section>
      )}

      {activeWorkspace === "risk-cycles" && (
        <section className="workspace">
          <section className="panel">
            <div className="panel-header">
              <div>
                <h2>Risk Cycles</h2>
                <p>Repeated routes, abnormal prices and circular ownership paths.</p>
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
      <section className="hero-strip">
        <motion.div
          className="hero-panel"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <span className="eyebrow">
            <Radar size={15} /> NEO4J ENGINE ONLINE - {filters.marketplaces.length} MARKETS MONITORED
          </span>
          <h1>Uncover hidden market routes before competition.</h1>
          <p className="hero-copy">
            Neo4j powers real-time detection of trader networks, price anomalies, suspicious cycles, sticker premiums and tactical arbitrage routes.
          </p>
          <div className="hero-actions">
            <button className="primary-action" onClick={handleOpenBestOpportunity}>Initiate Global Scan <Globe2 size={16} /></button>
            <button className="ghost-action" onClick={() => setActiveWorkspace("risk-cycles")}>View Intelligence <ArrowDown size={16} /></button>
            <button className="ghost-action" onClick={() => setActiveWorkspace("compare")}>Compare Markets <ShieldCheck size={16} /></button>
          </div>
          <div className="tactical-orbit" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </motion.div>

        <motion.div
          className="market-pulse"
          aria-label="Market pulse"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut", delay: 0.08 }}
        >
          <MarketPulseCards />
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
