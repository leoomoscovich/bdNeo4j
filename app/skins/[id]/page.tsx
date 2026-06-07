"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { SkinDetailResponse, JourneyStep, TraderReputation, InstanceSummary } from "@/lib/types";

// ─── reputation badge ──────────────────────────────────────────────────────────

function ReputationBadge({ label }: { label: TraderReputation["reputationLabel"] }) {
  const config = {
    trusted:    { text: "✓ Confiable",   cls: "bg-green-500/15 text-green-400 border-green-500/30" },
    neutral:    { text: "◐ Neutral",     cls: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
    suspicious: { text: "⚠ Sospechoso", cls: "bg-red-500/15 text-red-400 border-red-500/30" },
  }[label];
  return (
    <span className={`inline-flex items-center gap-1 border rounded px-2 py-0.5 text-xs font-mono ${config.cls}`}>
      {config.text}
    </span>
  );
}

// ─── journey graph (cytoscape) ────────────────────────────────────────────────

function JourneyGraph({ steps }: { steps: JourneyStep[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<unknown>(null);

  useEffect(() => {
    if (!containerRef.current || steps.length === 0) return;

    import("cytoscape").then(({ default: cytoscape }) => {
      if (cyRef.current) (cyRef.current as { destroy: () => void }).destroy();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nodes = new Map<string, any>();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const edges: any[] = [];

      steps.forEach((step, i) => {
        const sellerId = step.seller.id;
        const buyerId = step.buyer?.id;
        const txId = `tx-${i}`;

        if (!nodes.has(sellerId)) {
          nodes.set(sellerId, {
            data: {
              id: sellerId,
              label: step.seller.name,
              type: "trader",
              reputation: step.seller.reputation,
              riskScore: step.seller.riskScore,
            },
          });
        }
        if (buyerId && !nodes.has(buyerId)) {
          nodes.set(buyerId, {
            data: {
              id: buyerId,
              label: step.buyer!.name,
              type: "trader",
              reputation: 0.5,
              riskScore: 0,
            },
          });
        }
        nodes.set(txId, {
          data: {
            id: txId,
            label: `$${step.priceUsd.toLocaleString("en-US", { maximumFractionDigits: 0 })}\n${step.marketplace}`,
            type: "tx",
            timestamp: step.timestamp,
          },
        });

        edges.push({ data: { id: `e-s-${i}`, source: sellerId, target: txId, label: "SOLD" } });
        if (buyerId) edges.push({ data: { id: `e-b-${i}`, source: txId, target: buyerId, label: "BOUGHT" } });
      });

      cyRef.current = cytoscape({
        container: containerRef.current!,
        elements: {
          nodes: [...nodes.values()],
          edges,
        },
        layout: { name: "breadthfirst", directed: true, spacingFactor: 1.4 },
        style: [
          {
            selector: "node[type='trader']",
            style: {
              "background-color": (ele: { data: (k: string) => number }) =>
                ele.data("riskScore") > 60 ? "#ef4444" : ele.data("reputation") > 0.75 ? "#22c55e" : "#a3a3a3",
              "label": "data(label)",
              "color": "#fff",
              "font-size": "10px",
              "font-family": "monospace",
              "text-valign": "bottom",
              "text-margin-y": 4,
              "width": 28,
              "height": 28,
              "border-width": 2,
              "border-color": "#ffffff22",
            },
          },
          {
            selector: "node[type='tx']",
            style: {
              "background-color": "#1e1e2e",
              "border-width": 1.5,
              "border-color": "#6366f1",
              "label": "data(label)",
              "color": "#a5b4fc",
              "font-size": "9px",
              "font-family": "monospace",
              "text-valign": "center",
              "text-wrap": "wrap",
              "width": 64,
              "height": 30,
              "shape": "round-rectangle",
            },
          },
          {
            selector: "edge",
            style: {
              "width": 1.5,
              "line-color": "#334155",
              "target-arrow-color": "#334155",
              "target-arrow-shape": "triangle",
              "curve-style": "bezier",
              "label": "data(label)",
              "font-size": "8px",
              "font-family": "monospace",
              "color": "#64748b",
              "text-rotation": "autorotate",
            },
          },
        ],
      });
    });

    return () => {
      if (cyRef.current) (cyRef.current as { destroy: () => void }).destroy();
    };
  }, [steps]);

  if (steps.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-[var(--c-muted)] text-sm font-mono">
        Sin historial de transacciones
      </div>
    );
  }

  return <div ref={containerRef} className="w-full h-64 rounded" />;
}

// ─── instance selector ────────────────────────────────────────────────────────

function InstanceSelector({
  instances,
  selected,
  onSelect,
}: {
  instances: InstanceSummary[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {instances.map((inst) => (
        <button
          key={inst.id}
          onClick={() => onSelect(inst.id)}
          className={`border rounded px-3 py-1.5 text-xs font-mono transition-colors ${
            inst.id === selected
              ? "border-[var(--c-accent)] bg-[var(--c-accent)]/10 text-[var(--c-accent)]"
              : "border-[var(--c-border)] hover:border-[var(--c-accent)] text-[var(--c-muted)]"
          }`}
        >
          {inst.wear} · {inst.floatValue.toFixed(4)}
        </button>
      ))}
    </div>
  );
}

// ─── price timeline table ─────────────────────────────────────────────────────

function PriceTimeline({ steps }: { steps: JourneyStep[] }) {
  if (steps.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs font-mono">
        <thead>
          <tr className="text-[var(--c-muted)] border-b border-[var(--c-border)]">
            <th className="text-left py-2 pr-4">#</th>
            <th className="text-left py-2 pr-4">Precio</th>
            <th className="text-left py-2 pr-4">Marketplace</th>
            <th className="text-left py-2 pr-4">Vendedor</th>
            <th className="text-left py-2 pr-4">Comprador</th>
            <th className="text-left py-2">Fecha</th>
          </tr>
        </thead>
        <tbody>
          {steps.map((step, i) => {
            const prev = steps[i - 1];
            const delta = prev ? ((step.priceUsd - prev.priceUsd) / prev.priceUsd) * 100 : null;
            return (
              <tr key={step.txId} className="border-b border-[var(--c-border)]/50 hover:bg-[var(--c-surface)]">
                <td className="py-2 pr-4 text-[var(--c-muted)]">{i + 1}</td>
                <td className="py-2 pr-4">
                  <span className="font-semibold">${step.priceUsd.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                  {delta !== null && (
                    <span className={`ml-2 text-[10px] ${delta >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {delta >= 0 ? "+" : ""}{delta.toFixed(1)}%
                    </span>
                  )}
                </td>
                <td className="py-2 pr-4 text-[var(--c-muted)]">{step.marketplace || "—"}</td>
                <td className={`py-2 pr-4 ${step.seller.riskScore > 60 ? "text-red-400" : ""}`}>
                  {step.seller.name}
                </td>
                <td className="py-2 pr-4 text-[var(--c-muted)]">{step.buyer?.name ?? "—"}</td>
                <td className="py-2 text-[var(--c-muted)]">
                  {step.timestamp ? new Date(step.timestamp).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "2-digit" }) : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function SkinDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<SkinDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInstance, setSelectedInstance] = useState<string>("");

  async function loadDetail(instanceId?: string) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (instanceId) params.set("instanceId", instanceId);
      const res = await fetch(`/api/skins/${id}?${params}`);
      if (!res.ok) throw new Error("Skin no encontrada");
      const json: SkinDetailResponse = await res.json();
      setData(json);
      if (!instanceId && json.skin.instances[0]) {
        setSelectedInstance(json.skin.instances[0].id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { loadDetail(); }, [id]);

  function handleInstanceChange(instId: string) {
    setSelectedInstance(instId);
    loadDetail(instId);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--c-bg)] flex items-center justify-center">
        <span className="text-[var(--c-muted)] font-mono animate-pulse">Consultando Neo4j...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[var(--c-bg)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 font-mono mb-4">{error ?? "No se encontró la skin"}</p>
          <Link href="/skins" className="text-[var(--c-muted)] hover:text-[var(--c-fg)] text-sm">← Volver al catálogo</Link>
        </div>
      </div>
    );
  }

  const { skin, journey, currentSeller } = data;
  const currentInstance = skin.instances.find((i) => i.id === selectedInstance) ?? skin.instances[0];
  const latestTx = currentInstance?.txHistory[currentInstance.txHistory.length - 1];

  return (
    <div className="min-h-screen bg-[var(--c-bg)]">
      {/* Header */}
      <header className="border-b border-[var(--c-border)] px-6 py-4">
        <div className="max-w-5xl mx-auto">
          <Link href="/skins" className="text-[var(--c-muted)] text-sm hover:text-[var(--c-fg)] transition-colors">
            ← Catálogo
          </Link>
          <div className="flex flex-wrap items-start justify-between gap-4 mt-2">
            {skin.imageUrl && (
              <div className="relative h-24 w-36 shrink-0 overflow-hidden rounded border border-[var(--c-border)] bg-black/20">
                <Image
                  src={skin.imageUrl}
                  alt={skin.name}
                  fill
                  sizes="144px"
                  priority
                  style={{ objectFit: "contain", padding: 10 }}
                />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-mono text-[var(--c-muted)]">{skin.weapon} · {skin.rarity}</p>
              <h1 className="text-2xl font-semibold">{skin.name}</h1>
              {skin.collection && <p className="text-xs text-[var(--c-muted)] mt-0.5">{skin.collection}</p>}
            </div>
            {latestTx && (
              <div className="text-right">
                <p className="text-2xl font-mono font-bold">${latestTx.priceUsd.toLocaleString("en-US", { maximumFractionDigits: 0 })}</p>
                <p className="text-xs font-mono text-[var(--c-muted)]">{latestTx.marketplace}</p>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6 space-y-8">
        {/* Instance selector */}
        {skin.instances.length > 1 && (
          <section>
            <h2 className="text-xs font-mono text-[var(--c-muted)] uppercase tracking-wider mb-3">
              Instancias disponibles ({skin.instances.length})
            </h2>
            <InstanceSelector
              instances={skin.instances}
              selected={selectedInstance}
              onSelect={handleInstanceChange}
            />
          </section>
        )}

        {/* Seller reputation */}
        {currentSeller && (
          <section className="border border-[var(--c-border)] rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold">Vendedor actual</h2>
              <ReputationBadge label={currentSeller.reputationLabel} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs font-mono text-[var(--c-muted)]">Handle</p>
                <p className="text-sm font-mono font-semibold">{currentSeller.name}</p>
              </div>
              <div>
                <p className="text-xs font-mono text-[var(--c-muted)]">Transacciones</p>
                <p className="text-sm font-mono font-semibold">{currentSeller.txCount}</p>
              </div>
              <div>
                <p className="text-xs font-mono text-[var(--c-muted)]">Reputación</p>
                <p className="text-sm font-mono font-semibold">{(currentSeller.reputation * 100).toFixed(0)}%</p>
              </div>
              <div>
                <p className="text-xs font-mono text-[var(--c-muted)]">Riesgo</p>
                <p className={`text-sm font-mono font-semibold ${currentSeller.riskScore > 60 ? "text-red-400" : currentSeller.riskScore > 30 ? "text-yellow-400" : "text-green-400"}`}>
                  {currentSeller.riskScore}/100
                </p>
              </div>
            </div>
            {currentSeller.reputationLabel === "suspicious" && (
              <p className="mt-3 text-xs text-red-400 font-mono border border-red-500/20 bg-red-500/5 rounded px-3 py-2">
                ⚠ Este trader ha sido marcado como sospechoso por su historial de transacciones y sus conexiones.
              </p>
            )}
          </section>
        )}

        {/* Journey graph */}
        <section className="border border-[var(--c-border)] rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Recorrido de la instancia</h2>
            <span className="text-xs font-mono text-[var(--c-muted)]">{journey.length} transacciones</span>
          </div>
          <JourneyGraph steps={journey} />
          <p className="text-[10px] text-[var(--c-muted)] font-mono mt-2">
            Verde = confiable · Rojo = sospechoso · Morado = transacción
          </p>
        </section>

        {/* Price timeline */}
        {journey.length > 0 && (
          <section className="border border-[var(--c-border)] rounded-lg p-5">
            <h2 className="text-sm font-semibold mb-4">Historial de precios</h2>
            <PriceTimeline steps={journey} />
          </section>
        )}
      </main>
    </div>
  );
}
