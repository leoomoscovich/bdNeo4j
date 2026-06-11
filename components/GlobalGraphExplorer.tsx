"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Graph3D } from "@/components/Graph3D";
import type { GraphNode, GraphResponse, NodeType } from "@/lib/types";

/* ── Types ── */
type SearchResult = { id: string; label: string; kind: "trader" | "skin" };

const NODE_TYPES: Array<{ type: NodeType; label: string; color: string }> = [
  { type: "skin",        label: "Skin",        color: "#EE2E2E" },
  { type: "trader",      label: "Trader",       color: "#9a9a96" },
  { type: "marketplace", label: "Marketplace",  color: "#c98a2a" },
  { type: "instance",    label: "Instancia",    color: "#EDEAE2" },
  { type: "transaction", label: "Transacción",  color: "#5b5b60" },
];

const EMPTY_GRAPH: GraphResponse = { nodes: [], edges: [] };

/* ── Component ── */
export function GlobalGraphExplorer() {
  const [query, setQuery]           = useState("");
  const [results, setResults]       = useState<SearchResult[]>([]);
  const [searching, setSearching]   = useState(false);
  const [graph, setGraph]           = useState<GraphResponse>(EMPTY_GRAPH);
  const [loading, setLoading]       = useState(true);
  const [activeLabel, setActiveLabel] = useState("Trader con mayor volumen");
  const [hiddenTypes, setHiddenTypes] = useState<Set<NodeType>>(new Set());
  const [inspected, setInspected]   = useState<GraphNode | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Default: load top-volume trader graph on mount ── */
  useEffect(() => {
    fetch("/api/traders")
      .then((r) => r.ok ? r.json() : [])
      .then((traders: Array<{ id: string; handle: string }>) => {
        if (!traders[0]) { setLoading(false); return; }
        setActiveLabel(traders[0].handle);
        return fetch(`/api/graph?traderId=${encodeURIComponent(traders[0].id)}`);
      })
      .then((r) => r?.ok ? r.json() : EMPTY_GRAPH)
      .then((g: GraphResponse) => { setGraph(g); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  /* ── Search: debounced, hits /api/traders?q= + /api/skins?q= ── */
  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) { setResults([]); return; }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const [traderRes, skinRes] = await Promise.all([
          fetch(`/api/traders?q=${encodeURIComponent(value)}`),
          fetch(`/api/skins?q=${encodeURIComponent(value)}`),
        ]);
        const traders: Array<{ id: string; handle: string }> = traderRes.ok ? await traderRes.json() : [];
        const skins:   Array<{ id: string; name:   string }> = skinRes.ok   ? await skinRes.json()   : [];
        setResults([
          ...traders.slice(0, 5).map((t) => ({ id: t.id, label: t.handle, kind: "trader" as const })),
          ...skins.slice(0, 5).map((s)   => ({ id: s.id, label: s.name,   kind: "skin"   as const })),
        ]);
      } finally {
        setSearching(false);
      }
    }, 280);
  }, []);

  /* ── Select a result: fetch its graph ── */
  async function selectResult(r: SearchResult) {
    setQuery(r.label);
    setResults([]);
    setInspected(null);
    setLoading(true);
    const param = r.kind === "trader" ? "traderId" : "skinId";
    try {
      const res = await fetch(`/api/graph?${param}=${encodeURIComponent(r.id)}`);
      setGraph(res.ok ? await res.json() : EMPTY_GRAPH);
      setActiveLabel(r.label);
    } finally {
      setLoading(false);
    }
  }

  /* ── Type filter ── */
  function toggleType(type: NodeType) {
    setHiddenTypes((prev) => {
      const next = new Set(prev);
      next.has(type) ? next.delete(type) : next.add(type);
      return next;
    });
  }

  const filteredGraph: GraphResponse = {
    nodes: graph.nodes.filter((n) => !hiddenTypes.has(n.type as NodeType)),
    edges: graph.edges.filter((e) => {
      const src = graph.nodes.find((n) => n.id === e.source);
      const tgt = graph.nodes.find((n) => n.id === e.target);
      return src && tgt && !hiddenTypes.has(src.type as NodeType) && !hiddenTypes.has(tgt.type as NodeType);
    }),
  };

  const inspectedProps = inspected
    ? Object.entries(inspected.data).filter(([, v]) => v !== null && v !== "" && typeof v !== "object").slice(0, 7)
    : [];

  return (
    <section className="panel graph-panel" style={{ marginTop: 16 }}>
      {/* ── Header ── */}
      <div className="panel-header">
        <div>
          <h2>Explorador de grafo</h2>
          <p>{loading ? "Cargando…" : `${filteredGraph.nodes.length} nodos · ${filteredGraph.edges.length} aristas · ${activeLabel}`}</p>
        </div>
      </div>

      {/* ── Search bar ── */}
      <div style={{ padding: "10px 16px 0", position: "relative" }}>
        <div className="global-search" style={{ maxWidth: 480 }}>
          <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Buscar trader o skin…"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Escape") { setQuery(""); setResults([]); } }}
            aria-label="Buscar trader o skin en el grafo"
            aria-autocomplete="list"
            aria-expanded={results.length > 0}
          />
          {searching && <span style={{ fontSize: 11, color: "var(--d-muted)", fontFamily: "var(--font-mono)" }}>…</span>}
        </div>

        {/* Dropdown results */}
        {results.length > 0 && (
          <ul role="listbox" style={{
            position: "absolute", top: "calc(100% - 2px)", left: 16,
            width: 480, background: "var(--d-panel-2)",
            border: "1px solid var(--d-hair-strong)", borderTop: "none",
            listStyle: "none", margin: 0, padding: "4px 0", zIndex: 10,
          }}>
            {results.map((r) => (
              <li key={r.id} role="option"
                onClick={() => selectResult(r)}
                onKeyDown={(e) => { if (e.key === "Enter") selectResult(r); }}
                tabIndex={0}
                style={{
                  padding: "7px 14px", cursor: "pointer", display: "flex",
                  alignItems: "center", gap: 10,
                  fontFamily: "var(--font-mono)", fontSize: 12,
                  color: "var(--d-ink)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--d-hair)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span style={{
                  fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase",
                  color: r.kind === "trader" ? "var(--d-muted)" : "var(--d-red)",
                  minWidth: 52,
                }}>
                  {r.kind === "trader" ? "trader" : "skin"}
                </span>
                {r.label}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Type filters ── */}
      <div style={{
        padding: "10px 16px 0", display: "flex", gap: 8, flexWrap: "wrap",
      }}>
        {NODE_TYPES.map(({ type, label, color }) => {
          const active = !hiddenTypes.has(type);
          return (
            <button
              key={type}
              onClick={() => toggleType(type)}
              aria-pressed={active}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "3px 10px", border: "1px solid",
                borderColor: active ? color : "var(--d-hair)",
                background: active ? `${color}18` : "transparent",
                color: active ? "var(--d-ink)" : "var(--d-muted)",
                fontFamily: "var(--font-mono)", fontSize: 11,
                cursor: "pointer", borderRadius: 2,
                transition: "all 0.15s",
              }}
            >
              <span style={{
                width: 7, height: 7, borderRadius: "50%",
                background: active ? color : "var(--d-hair)",
                flexShrink: 0,
              }} />
              {label}
            </button>
          );
        })}
        {hiddenTypes.size > 0 && (
          <button
            onClick={() => setHiddenTypes(new Set())}
            style={{
              padding: "3px 10px", border: "1px solid var(--d-hair)",
              background: "transparent", color: "var(--d-muted)",
              fontFamily: "var(--font-mono)", fontSize: 11, cursor: "pointer",
              borderRadius: 2,
            }}
          >
            Mostrar todo
          </button>
        )}
      </div>

      {/* ── Graph + Inspector ── */}
      <div style={{ display: "flex", gap: 0, minHeight: 520 }}>
        <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
          {loading && (
            <div style={{
              position: "absolute", inset: 0, display: "flex",
              alignItems: "center", justifyContent: "center",
              background: "rgba(14,14,16,0.6)", zIndex: 2,
              fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--d-muted)",
            }}>
              Cargando grafo…
            </div>
          )}
          <Graph3D graph={filteredGraph} height={520} onNodeClick={setInspected} />
        </div>

        {/* Inspector */}
        <aside style={{
          width: 220, flexShrink: 0, borderLeft: "1px solid var(--d-hair)",
          padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10,
        }}>
          <div className="mono mono--muted" style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Inspector
          </div>
          {inspected ? (
            <>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--d-ink)", wordBreak: "break-all" }}>
                {inspected.label}
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--d-red)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                {inspected.type}
              </div>
              <dl style={{ margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                {inspectedProps.map(([k, v]) => (
                  <div key={k}>
                    <dt style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--d-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{k}</dt>
                    <dd style={{ margin: 0, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--d-ink)" }}>{String(v)}</dd>
                  </div>
                ))}
              </dl>
            </>
          ) : (
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--d-muted)", margin: 0 }}>
              Hacé clic en un nodo del grafo para inspeccionarlo.
            </p>
          )}
        </aside>
      </div>
    </section>
  );
}
