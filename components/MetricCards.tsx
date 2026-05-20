"use client";

import { useEffect, useState } from "react";
import type { MetricsResponse } from "@/lib/types";

const fallbackMetrics: MetricsResponse = {
  skinsIndexed: 0,
  transactionsTracked: 0,
  activeTraders: 0,
  estimatedVolumeUsd: 0,
};

function compact(value: number, prefix = "") {
  return `${prefix}${Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value)}`;
}

export function MetricCards() {
  const [metrics, setMetrics] = useState<MetricsResponse>(fallbackMetrics);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/metrics")
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("metrics")))
      .then(setMetrics)
      .catch(() => setError("Neo4j no esta disponible. Ejecuta el seed cuando levantes la DB."));
  }, []);

  const items = [
    [compact(metrics.skinsIndexed), "skins indexadas"],
    [compact(metrics.transactionsTracked), "transacciones conectadas"],
    [compact(metrics.activeTraders), "traders activos"],
    [compact(metrics.estimatedVolumeUsd, "$"), "volumen estimado"],
  ];

  return (
    <section className="section" aria-label="Metricas del mercado">
      <div className="metrics">
        {items.map(([value, label]) => <div className="metric" key={label}><strong>{value}</strong><span>{label}</span></div>)}
      </div>
      {error ? <p className="inline-error">{error}</p> : null}
    </section>
  );
}
