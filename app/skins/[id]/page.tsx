"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Graph3D } from "@/components/Graph3D";
import { SkinInspect3D } from "@/components/SkinInspect3D";
import type { GraphResponse, SkinDetailResponse, JourneyStep, TraderReputation, InstanceSummary } from "@/lib/types";
import "../catalog.css";
import "./ficha.css";

const RARITY_VAR: Record<string, string> = {
  Consumer:    "var(--r-consumer)",
  Industrial:  "var(--r-industrial)",
  "Mil-Spec":  "var(--r-milspec)",
  Restricted:  "var(--r-restricted)",
  Classified:  "var(--r-classified)",
  Covert:      "var(--r-covert)",
  Contraband:  "var(--r-contraband)",
};

// ─── reputation badge ──────────────────────────────────────────────────────────

function ReputationBadge({ label }: { label: TraderReputation["reputationLabel"] }) {
  const config = {
    trusted:    { text: "✓ Confiable",   cls: "rep-badge--trusted" },
    neutral:    { text: "◐ Neutral",     cls: "rep-badge--neutral" },
    suspicious: { text: "⚠ Sospechoso", cls: "rep-badge--suspicious" },
  }[label];
  return <span className={`rep-badge ${config.cls}`}>{config.text}</span>;
}

// ─── journey graph (grafo 3D con datos reales de Neo4j) ──────────────────────

function JourneyGraph3D({ instanceId, steps }: { instanceId: string | undefined; steps: JourneyStep[] }) {
  const [graph, setGraph] = useState<GraphResponse | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!instanceId) return;
    setGraph(null);
    setFailed(false);
    fetch(`/api/graph?instanceId=${encodeURIComponent(instanceId)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("graph"))))
      .then((payload: GraphResponse) => setGraph(payload))
      .catch(() => setFailed(true));
  }, [instanceId]);

  if (!instanceId || steps.length === 0) {
    return <div className="ficha-graph__empty">Sin historial de transacciones</div>;
  }
  if (failed) {
    return <div className="ficha-graph__empty">No se pudo cargar el grafo</div>;
  }
  if (!graph) {
    return <div className="ficha-graph__empty">Cargando grafo…</div>;
  }

  return <Graph3D graph={graph} height={380} />;
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
    <div className="ficha-instances">
      {instances.map((inst) => (
        <button
          key={inst.id}
          onClick={() => onSelect(inst.id)}
          className={`ficha-instance${inst.id === selected ? " ficha-instance--active" : ""}`}
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
    <div className="ficha-table-wrap">
      <table className="ficha-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Precio</th>
            <th>Δ</th>
            <th>Marketplace</th>
            <th>Vendedor</th>
            <th>Comprador</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          {steps.map((step, i) => {
            const prev = steps[i - 1];
            const delta = prev ? ((step.priceUsd - prev.priceUsd) / prev.priceUsd) * 100 : null;
            return (
              <tr key={step.txId}>
                <td className="muted">{i + 1}</td>
                <td><b>${step.priceUsd.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</b></td>
                <td>
                  {delta !== null ? (
                    <span className={delta >= 0 ? "delta--up" : "delta--down"}>
                      {delta >= 0 ? "+" : ""}{delta.toFixed(1)}%
                    </span>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
                <td className="muted">{step.marketplace || "—"}</td>
                <td className={step.seller.riskScore > 60 ? "seller--risk" : ""}>{step.seller.name}</td>
                <td className="muted">{step.buyer?.name ?? "—"}</td>
                <td className="muted">
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

// ─── nav compartida (misma del catálogo) ──────────────────────────────────────

function FichaNav() {
  return (
    <nav className="cat-nav">
      <div className="cat-nav__row1">
        <Link href="/" className="brand">
          <span className="brand__mark">SG</span>
          <span>SkinGraph Radar</span>
        </Link>
        <div className="cat-nav__links">
          <Link href="/" className="cat-nav__link">← Inicio</Link>
          <Link href="/skins" className="cat-nav__link cat-nav__link--active">Catálogo</Link>
          <Link href="/dashboard" className="cat-nav__link">Dashboard</Link>
        </div>
      </div>
    </nav>
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
      <div className="catalog-page">
        <FichaNav />
        <div className="ficha-state">
          <span className="ficha-state__msg ficha-state__msg--loading">Consultando Neo4j…</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="catalog-page">
        <FichaNav />
        <div className="ficha-state">
          <div className="ficha-state__box">
            <p className="ficha-state__msg ficha-state__msg--error">{error ?? "No se encontró la skin"}</p>
            <Link href="/skins" className="ficha-state__link">← Volver al catálogo</Link>
          </div>
        </div>
      </div>
    );
  }

  const { skin, journey, currentSeller } = data;
  const currentInstance = skin.instances.find((i) => i.id === selectedInstance) ?? skin.instances[0];
  const latestTx = currentInstance?.txHistory[currentInstance.txHistory.length - 1];
  const rarityColor = RARITY_VAR[skin.rarity] ?? "var(--hair-2)";
  const skinNameOnly = skin.name.replace(`${skin.weapon} | `, "");

  return (
    <div className="catalog-page">
      <FichaNav />

      {/* ── Header ── */}
      <header className="ficha-head">
        <div className="ficha-head__inner">
          <div className="ficha-head__rail">
            <b>02 / Ficha</b>
            <span>Pieza observada</span>
            <Link href="/skins" style={{ marginTop: 6, borderBottom: "1px solid var(--red)", paddingBottom: 2, width: "fit-content" }}>
              ← Catálogo
            </Link>
          </div>
          <div>
            <p className="ficha-head__weapon">
              <span>{skin.weapon}</span>
              <span className="ficha-rarity" style={{ "--c": rarityColor } as React.CSSProperties}>
                <i />{skin.rarity}
              </span>
            </p>
            <h1 className="ficha-head__title">
              {skin.weapon} | <em>{skinNameOnly}</em>
            </h1>
            {skin.collection && <p className="ficha-head__collection">{skin.collection}</p>}
          </div>
          {latestTx && (
            <div className="ficha-head__stat">
              <span className="k">Última venta</span>
              <span className="v">
                ${latestTx.priceUsd.toLocaleString("en-US", { maximumFractionDigits: 0 })}
              </span>
              <span className="k">{latestTx.marketplace}</span>
            </div>
          )}
        </div>
      </header>

      {/* ── Cuerpo ── */}
      <main className="ficha-body">
        {/* Columna izquierda: plate */}
        <figure className="ficha-plate" style={{ margin: 0 }}>
          <div className="ficha-plate__head">
            <span>Ficha · {(currentInstance?.id ?? skin.id).slice(-12).toUpperCase()}</span>
            <span className="ficha-plate__live"><span className="dot--live" />Observada</span>
          </div>
          <div className={`ficha-plate__art${skin.imageUrl ? "" : " ficha-plate__art--empty"}`}>
            {skin.imageUrl ? (
              <>
                <SkinInspect3D>
                  <Image
                    src={skin.imageUrl}
                    alt={skin.name}
                    fill
                    sizes="(max-width: 1000px) 90vw, 480px"
                    priority
                    style={{ objectFit: "contain", padding: "8%" }}
                  />
                </SkinInspect3D>
                <span className="ficha-plate__crop ficha-plate__crop--tl" />
                <span className="ficha-plate__crop ficha-plate__crop--tr" />
                <span className="ficha-plate__crop ficha-plate__crop--bl" />
                <span className="ficha-plate__crop ficha-plate__crop--br" />
              </>
            ) : (
              <span>Sin imagen</span>
            )}
          </div>
          <dl className="ficha-plate__data">
            <div>
              <dt>Desgaste</dt>
              <dd>{currentInstance?.wear ?? "—"}</dd>
            </div>
            <div>
              <dt>Float</dt>
              <dd>{currentInstance ? currentInstance.floatValue.toFixed(4) : "—"}</dd>
            </div>
            <div>
              <dt>Instancias</dt>
              <dd>{skin.instances.length}</dd>
            </div>
            <div>
              <dt>Transacciones</dt>
              <dd>{journey.length}</dd>
            </div>
          </dl>
        </figure>

        {/* Columna derecha: secciones */}
        <div>
          {/* Instancias */}
          {skin.instances.length > 1 && (
            <section className="ficha-section">
              <div className="ficha-section__head">
                <div>
                  <span className="ficha-section__num">A/01 · Instancias</span>
                  <h2 className="ficha-section__title">Instancias disponibles</h2>
                </div>
                <span className="ficha-section__meta">{skin.instances.length} observadas</span>
              </div>
              <InstanceSelector
                instances={skin.instances}
                selected={selectedInstance}
                onSelect={handleInstanceChange}
              />
            </section>
          )}

          {/* Vendedor */}
          {currentSeller && (
            <section className="ficha-section">
              <div className="ficha-section__head">
                <div>
                  <span className="ficha-section__num">A/02 · Procedencia</span>
                  <h2 className="ficha-section__title">Vendedor actual</h2>
                </div>
                <ReputationBadge label={currentSeller.reputationLabel} />
              </div>
              <div className="ficha-seller">
                <dl className="ficha-seller__grid" style={{ margin: 0 }}>
                  <div>
                    <dt>Handle</dt>
                    <dd>{currentSeller.name}</dd>
                  </div>
                  <div>
                    <dt>Transacciones</dt>
                    <dd>{currentSeller.txCount}</dd>
                  </div>
                  <div>
                    <dt>Reputación</dt>
                    <dd>{(currentSeller.reputation * 100).toFixed(0)}%</dd>
                  </div>
                  <div>
                    <dt>Riesgo</dt>
                    <dd className={currentSeller.riskScore > 60 ? "risk-num--high" : currentSeller.riskScore > 30 ? "risk-num--mid" : "risk-num--low"}>
                      {currentSeller.riskScore}/100
                    </dd>
                  </div>
                </dl>
                {currentSeller.reputationLabel === "suspicious" && (
                  <p className="ficha-seller__warning" style={{ margin: 0 }}>
                    ⚠ Este trader fue marcado como sospechoso por su historial de transacciones y sus conexiones.
                  </p>
                )}
              </div>
            </section>
          )}

          {/* Recorrido */}
          <section className="ficha-section">
            <div className="ficha-section__head">
              <div>
                <span className="ficha-section__num">A/03 · Recorrido</span>
                <h2 className="ficha-section__title">Recorrido de la instancia</h2>
              </div>
              <span className="ficha-section__meta">{journey.length} transacciones</span>
            </div>
            <div className="ficha-graph">
              <JourneyGraph3D instanceId={currentInstance?.id} steps={journey} />
              {journey.length > 0 && (
                <div className="ficha-graph__legend">
                  <span><i style={{ background: "#EE2E2E" }} />Skin / riesgo</span>
                  <span><i style={{ background: "#EDEAE2", border: "1px solid #0B0B0C" }} />Instancia</span>
                  <span><i style={{ background: "#9a9a96" }} />Trader</span>
                  <span><i style={{ background: "#c98a2a" }} />Marketplace</span>
                  <span className="ficha-graph__hint">Arrastrá para rotar · click para enfocar</span>
                </div>
              )}
            </div>
          </section>

          {/* Historial */}
          {journey.length > 0 && (
            <section className="ficha-section">
              <div className="ficha-section__head">
                <div>
                  <span className="ficha-section__num">A/04 · Historial</span>
                  <h2 className="ficha-section__title">Historial de precios</h2>
                </div>
              </div>
              <PriceTimeline steps={journey} />
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
