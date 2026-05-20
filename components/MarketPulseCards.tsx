"use client";

import { useEffect, useState } from "react";
import type { MarketPulse } from "@/lib/types";

const fallbackPulse: MarketPulse = {
  trackedVolumeUsd: 0,
  dealsDetected: 0,
  averageSpreadPct: 0,
  suspiciousCycles: 0,
  activeTraders: 0,
};

function formatUsd(value: number) {
  return Intl.NumberFormat("en", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPct(value: number) {
  return `${value.toFixed(1)}%`;
}

function formatNumber(value: number) {
  return Intl.NumberFormat("en").format(value);
}

type MetricCardProps = {
  label: string;
  value: string;
  accent?: "cyan" | "green" | "red" | "amber";
  icon?: React.ReactNode;
};

function MetricCard({ label, value, accent = "cyan", icon }: MetricCardProps) {
  const accentColors: Record<string, string> = {
    cyan: "text-cyan-400",
    green: "text-green-400",
    red: "text-red-400",
    amber: "text-amber-400",
  };

  return (
    <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-[var(--text-muted)]">{label}</span>
        {icon && <span className={accentColors[accent]}>{icon}</span>}
      </div>
      <p className={`mt-1 text-lg font-bold tracking-tight ${accentColors[accent]}`}>
        {value}
      </p>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="h-3 w-16 animate-pulse rounded bg-[var(--border-default)]" />
        <div className="h-3 w-3 animate-pulse rounded bg-[var(--border-default)]" />
      </div>
      <div className="mt-1 h-6 w-20 animate-pulse rounded bg-[var(--border-default)]" />
    </div>
  );
}

const VolumeIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
);

const DealsIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
);

const SpreadIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
);

const RiskIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
);

const TradersIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);

export function MarketPulseCards() {
  const [pulse, setPulse] = useState<MarketPulse>(fallbackPulse);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/market-pulse")
      .then((response) => {
        if (!response.ok) throw new Error("market-pulse");
        return response.json();
      })
      .then((data) => {
        setPulse(data);
        setLoading(false);
      })
      .catch(() => {
        setError("No se pudo obtener el pulso de mercado. Verifica que Neo4j este corriendo.");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5" aria-label="Cargando pulso de mercado">
        {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (error) {
    return <p className="inline-error">{error}</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5" aria-label="Pulso de mercado">
      <MetricCard label="Volumen rastreado" value={formatUsd(pulse.trackedVolumeUsd)} accent="cyan" icon={VolumeIcon} />
      <MetricCard label="Operaciones" value={formatNumber(pulse.dealsDetected)} accent="green" icon={DealsIcon} />
      <MetricCard label="Spread promedio" value={formatPct(pulse.averageSpreadPct)} accent="amber" icon={SpreadIcon} />
      <MetricCard label="Ciclos sospechosos" value={formatNumber(pulse.suspiciousCycles)} accent={pulse.suspiciousCycles > 0 ? "red" : "cyan"} icon={RiskIcon} />
      <MetricCard label="Traders activos" value={formatNumber(pulse.activeTraders)} accent="cyan" icon={TradersIcon} />
    </div>
  );
}
