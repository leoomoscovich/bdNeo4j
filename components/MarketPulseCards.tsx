"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Activity, AlertTriangle, CircleDollarSign, RadioTower, TrendingUp, Users } from "lucide-react";
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

function formatPct(value: number | null | undefined) {
  return `${(value ?? 0).toFixed(1)}%`;
}

function formatNumber(value: number | null | undefined) {
  return Intl.NumberFormat("en").format(value ?? 0);
}

type MetricCardProps = {
  label: string;
  value: string;
  accent?: "red" | "soft" | "cream" | "burgundy";
  detail: string;
  icon: ReactNode;
};

function MetricCard({ label, value, accent = "soft", detail, icon }: MetricCardProps) {
  const normalized = label.toLowerCase().replace(/\s+/g, "-");

  return (
    <article className={`pulse-card ${accent} metric-${normalized}`}>
      <div className="pulse-card-top">
        <span className="pulse-label">{label}</span>
        <span className="pulse-icon">{icon}</span>
      </div>
      {/* key=value remounts the element on every change, re-triggering the CSS animation */}
      <strong key={value} className="pulse-value-live">{value}</strong>
      <span>{detail}</span>
      <div className="metric-visual" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
    </article>
  );
}

function SkeletonCard() {
  return (
    <div className="pulse-card pulse-skeleton">
      <div className="pulse-card-top">
        <div className="skeleton-line short" />
        <div className="skeleton-dot" />
      </div>
      <div className="skeleton-line value" />
      <div className="skeleton-line" />
    </div>
  );
}

async function fetchPulse(): Promise<MarketPulse> {
  const res = await fetch("/api/market-pulse");
  if (!res.ok) throw new Error("market-pulse");
  const data: Partial<MarketPulse> = await res.json();
  return { ...fallbackPulse, ...data };
}

export function MarketPulseCards() {
  const [pulse, setPulse] = useState<MarketPulse>(fallbackPulse);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    /* Initial load */
    fetchPulse()
      .then((data) => { setPulse(data); setLoading(false); })
      .catch(() => { setError("No se pudo obtener el pulso de mercado. Verificá que Neo4j esté corriendo."); setLoading(false); });

    /* Live polling every 10 s */
    const interval = setInterval(() => {
      fetchPulse().then(setPulse).catch(() => {/* keep last known values on error */});
    }, 10_000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="pulse-grid" aria-label="Cargando pulso de mercado">
        {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (error) {
    return <p className="inline-error">{error}</p>;
  }

  return (
    <div className="pulse-grid" aria-label="Pulso de mercado">
      <MetricCard label="Volumen registrado" value={formatUsd(pulse.trackedVolumeUsd)} accent="soft" detail="Flujo entre marketplaces" icon={<CircleDollarSign size={18} />} />
      <MetricCard label="Oportunidades" value={formatNumber(pulse.dealsDetected)} accent="cream" detail="Señales calificadas" icon={<TrendingUp size={18} />} />
      <MetricCard label="Spread promedio" value={formatPct(pulse.averageSpreadPct)} accent="burgundy" detail="Margen medio detectado" icon={<Activity size={18} />} />
      <MetricCard label="Ciclos sospechosos" value={formatNumber(pulse.suspiciousCycles)} accent={pulse.suspiciousCycles > 0 ? "red" : "soft"} detail="Rutas circulares" icon={<AlertTriangle size={18} />} />
      <MetricCard label="Traders en grafo" value={formatNumber(pulse.activeTraders)} accent="soft" detail="Nodos Neo4j activos" icon={pulse.activeTraders > 0 ? <Users size={18} /> : <RadioTower size={18} />} />
    </div>
  );
}
