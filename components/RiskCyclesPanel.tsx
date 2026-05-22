"use client";

/* eslint-disable react-hooks/set-state-in-effect -- Risk-cycle loading state is synchronized with API requests keyed by filters. */

import { useEffect, useState } from "react";
import type { RiskCycle } from "@/lib/types";
import type { AppFilters } from "@/lib/ui-state";
import { serializeMarketplaces } from "@/lib/ui-state";

type RiskCyclesPanelProps = {
  selectedId?: string;
  filters: AppFilters;
  onSelect: (cycle: RiskCycle) => void;
};

const severityConfig: Record<RiskCycle["severity"], { bg: string; text: string }> = {
  CRITICAL: { bg: "bg-red-600", text: "text-white" },
  HIGH: { bg: "risk-badge-high", text: "text-white" },
  MEDIUM: { bg: "risk-badge-medium", text: "text-white" },
  LOW: { bg: "risk-badge-low", text: "text-white" },
};

function riskScoreColor(score: number) {
  if (score >= 80) return "bg-red-500";
  if (score >= 60) return "risk-fill-high";
  if (score >= 40) return "risk-fill-medium";
  return "risk-fill-low";
}

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

export function RiskCyclesPanel({ selectedId, filters, onSelect }: RiskCyclesPanelProps) {
  const [cycles, setCycles] = useState<RiskCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      q: filters.query,
      marketplaces: serializeMarketplaces(filters.marketplaces),
      minRiskScore: String(Math.max(0, 100 - filters.maxRiskScore)),
    });

    fetch(`/api/risk-cycles?${params}`)
      .then((res) => {
        if (!res.ok) throw new Error("risk-cycles");
        return res.json();
      })
      .then((data: RiskCycle[]) => {
        setCycles(data);
        setLoading(false);
      })
      .catch(() => {
        setError("No se pudieron obtener los ciclos de riesgo.");
        setLoading(false);
      });
  }, [filters]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-[var(--muted)]">
        Cargando ciclos de riesgo...
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state rounded-2xl p-6 text-center text-sm">
        {error}
      </div>
    );
  }

  if (cycles.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-[var(--muted)]">
        No se detectaron ciclos sospechosos en este periodo.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {cycles.map((cycle) => {
        const isSelected = selectedId === cycle.id;
        const sev = severityConfig[cycle.severity];

        return (
          <button
            key={cycle.id}
            type="button"
            onClick={() => onSelect(cycle)}
            className={`w-full rounded-2xl border p-4 text-left transition-colors ${
              isSelected
                ? "border-[var(--orange)] bg-[rgba(255,159,28,0.08)]"
                : "border-[var(--line)] bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.06)]"
            }`}
          >
            {/* Header: title + severity badge */}
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-[15px] font-semibold leading-snug text-[var(--text)]">
                {cycle.title}
              </h3>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${sev.bg} ${sev.text}`}
              >
                {cycle.severity}
              </span>
            </div>

            {/* Risk score bar */}
            <div className="mt-3 flex items-center gap-2">
              <span className="text-[11px] font-medium text-[var(--muted)]">Riesgo</span>
              <div className="flex-1 overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]">
                <div
                  className={`h-1.5 rounded-full ${riskScoreColor(cycle.riskScore)}`}
                  style={{ width: `${Math.min(cycle.riskScore, 100)}%` }}
                />
              </div>
              <span className="text-[12px] font-bold text-[var(--text)]">{cycle.riskScore}</span>
            </div>

            {/* Trader path */}
            <div className="mt-2.5 text-[12px] text-[var(--muted)]">
              <span className="font-medium text-[var(--text)]">Path: </span>
              {cycle.traderPath.join(" \u2192 ")}
            </div>

            {/* Value moved + time window + link */}
            <div className="mt-2 flex items-center gap-4 text-[12px] text-[var(--muted)]">
              <span>
                Movido: <span className="font-semibold text-[var(--soft)]">{formatUsd(cycle.valueMovedUsd)}</span>
              </span>
              <span>
                Ventana: <span className="font-semibold text-[var(--text)]">{cycle.timeWindowHours}h</span>
              </span>
              {cycle.instanceId && (
                <a
                  href={`/skins/${cycle.instanceId.replace(/^inst-/, "").replace(/-\d+$/, "")}`}
                  className="ml-auto text-[11px] font-mono text-[var(--soft)] hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  Ver skin →
                </a>
              )}
            </div>

            {/* Evidence */}
            {cycle.evidence.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {cycle.evidence.slice(0, 3).map((ev, i) => (
                  <span
                    key={i}
                    className="rounded-lg border border-[var(--line)] bg-[rgba(255,255,255,0.04)] px-2 py-0.5 text-[11px] text-[var(--muted)]"
                  >
                    {ev.title}
                  </span>
                ))}
                {cycle.evidence.length > 3 && (
                  <span className="text-[11px] text-[var(--muted)]">+{cycle.evidence.length - 3} mas</span>
                )}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
