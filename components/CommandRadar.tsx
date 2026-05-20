"use client";

import { Activity, DatabaseZap, Radar, ScanLine, ShieldAlert } from "lucide-react";
import type { ScanSummary } from "@/lib/types";
import type { AppFilters } from "@/lib/ui-state";

type CommandRadarProps = {
  filters: AppFilters;
  scan: ScanSummary | null;
  scanStatus: "idle" | "running" | "error";
  onRunScan: () => void;
  onOpenBestOpportunity: () => void;
  onOpenRiskCycles: () => void;
};

const routeNodes = [
  { id: "CSFloat", x: 18, y: 34, tone: "soft-red", type: "market" },
  { id: "BUFF163", x: 50, y: 18, tone: "cream", type: "market" },
  { id: "Skinport", x: 79, y: 42, tone: "soft-red", type: "market" },
  { id: "Trader-17", x: 35, y: 68, tone: "red", type: "trader" },
  { id: "Trader-42", x: 58, y: 58, tone: "slate", type: "trader" },
  { id: "Risk loop", x: 68, y: 76, tone: "red", type: "risk" },
];

export function CommandRadar({
  filters,
  scan,
  scanStatus,
  onRunScan,
  onOpenBestOpportunity,
  onOpenRiskCycles,
}: CommandRadarProps) {
  const signals = scan ? scan.opportunitiesFound + scan.riskCyclesFound : 0;
  const lastUpdate = scan?.completedAt ?? scan?.startedAt;

  return (
    <section className="command-radar panel" aria-label="Market intelligence radar">
      <div className="radar-copy">
        <span className="module-kicker"><Radar size={14} /> Route intelligence</span>
        <h1>Market graph command surface</h1>
        <p>
          Neo4j route engine correlating listings, traders, marketplaces and suspicious ownership loops across the active watch surface.
        </p>
        <div className="route-docket" aria-label="Route preview">
          <div>
            <span>Primary route</span>
            <strong>CSFloat {"->"} BUFF163 {"->"} Skinport</strong>
          </div>
          <div>
            <span>Trader path</span>
            <strong>Trader-17 / Trader-42</strong>
          </div>
          <div>
            <span>Risk loop</span>
            <strong>Placeholder armed</strong>
          </div>
        </div>
        <div className="radar-actions">
          <button className="terminal-action primary" onClick={onRunScan} disabled={scanStatus === "running"}>
            {scanStatus === "running" ? <><ScanLine size={15} /> Scanning graph</> : <><DatabaseZap size={15} /> Execute scan</>}
          </button>
          <button className="terminal-action" onClick={onOpenBestOpportunity}><Activity size={15} /> Best route</button>
          <button className="terminal-action danger" onClick={onOpenRiskCycles}><ShieldAlert size={15} /> Risk loops</button>
        </div>
      </div>

      <div className="radar-surface" aria-hidden="true">
        <div className="radar-reticle">
          <span className="radar-sweep" />
          <span className="radar-axis horizontal" />
          <span className="radar-axis vertical" />
          {routeNodes.map((node) => (
            <span
              key={node.id}
              className={`radar-node ${node.tone} ${node.type}`}
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
            >
              <span>{node.id}</span>
            </span>
          ))}
          <svg className="radar-links" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M18 35 C 30 18, 39 18, 50 18 S 68 30, 78 43" />
            <path d="M18 34 C 24 54, 28 66, 35 68 S 49 64, 58 58" />
            <path d="M50 18 C 50 40, 51 52, 58 58 S 65 69, 68 76" />
            <path className="risk-path" d="M68 76 C 86 76, 88 44, 79 42 C 72 38, 61 47, 58 58" />
          </svg>
          <div className="route-matrix">
            <div><span>Ask spread</span><strong>12.4%</strong></div>
            <div><span>Fair value</span><strong>$842</strong></div>
            <div><span>Risk state</span><strong>Loop</strong></div>
          </div>
        </div>
      </div>

      <div className="radar-readout">
        <div>
          <span>Engine</span>
          <strong>{scanStatus === "error" ? "Degraded" : scanStatus === "running" ? "Scanning" : "Ready"}</strong>
        </div>
        <div>
          <span>Markets</span>
          <strong>{filters.marketplaces.length}</strong>
        </div>
        <div>
          <span>Signals</span>
          <strong>{signals || "Awaiting scan"}</strong>
        </div>
        <div>
          <span>Last update</span>
          <strong>{lastUpdate ? new Date(lastUpdate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "No run"}</strong>
        </div>
      </div>
    </section>
  );
}
