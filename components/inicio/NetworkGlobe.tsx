"use client"

import { useState } from "react"
import { Globe } from "@/components/ui/cobe-globe"

type NodeType = "buyer" | "trader" | "mkt"

interface CS2Node {
  id: string
  type: NodeType
  label: string
  location: [number, number]
  city: string
  country: string
  meta: { conn: number; vol: string; mkts: string; note: string }
}

const NODES: CS2Node[] = [
  {
    id: "M-CSF", type: "mkt", label: "CSFloat", location: [37.7749, -122.4194], city: "San Francisco", country: "USA",
    meta: { conn: 42, vol: "—", mkts: "CSFloat", note: "Principal venue para floats raros. Mayor velocidad de cierre del mercado." },
  },
  {
    id: "M-BUF", type: "mkt", label: "BUFF163", location: [31.2304, 121.4737], city: "Shanghái", country: "China",
    meta: { conn: 51, vol: "—", mkts: "BUFF163", note: "Mayor volumen global. Punto de entrada para el mercado asiático." },
  },
  {
    id: "M-SKP", type: "mkt", label: "Skinport", location: [52.5200, 13.4050], city: "Berlín", country: "Alemania",
    meta: { conn: 24, vol: "—", mkts: "Skinport", note: "Tempo más lento. Suele rezagarse 2–4 h sobre BUFF163." },
  },
  {
    id: "T-118", type: "trader", label: "T-118", location: [1.3521, 103.8198], city: "Singapur", country: "Singapur",
    meta: { conn: 42, vol: "$184.300", mkts: "CSFloat · BUFF163 · Skinport", note: "Trader de mayor densidad. 22 ciclos cerrados sobre AK-47, AWP y Karambit en 30 días." },
  },
  {
    id: "T-204", type: "trader", label: "T-204", location: [35.6762, 139.6503], city: "Tokio", country: "Japón",
    meta: { conn: 28, vol: "$71.500", mkts: "BUFF163 · Skinport", note: "Tempo más lento que T-118 pero comparte cinco compradores en común." },
  },
  {
    id: "B-2071", type: "buyer", label: "B-2071", location: [40.7128, -74.006], city: "Nueva York", country: "USA",
    meta: { conn: 14, vol: "$48.210", mkts: "CSFloat · BUFF163", note: "Aparece en seis cadenas distintas comprando AK-47 Voltaic. Tres terminan en T-118." },
  },
  {
    id: "B-1042", type: "buyer", label: "B-1042", location: [51.5074, -0.1278], city: "Londres", country: "Reino Unido",
    meta: { conn: 9, vol: "$22.870", mkts: "BUFF163", note: "Tres compras consecutivas de Karambit Doppler en menos de 72 h con stickers similares." },
  },
  {
    id: "B-3318", type: "buyer", label: "B-3318", location: [-33.8688, 151.2093], city: "Sídney", country: "Australia",
    meta: { conn: 6, vol: "$11.420", mkts: "CSFloat", note: "Comprador nuevo. Ya cruzó con dos traders del cluster T-118." },
  },
]

const ARCS = [
  { id: "b2071-t118",    from: NODES[5].location, to: NODES[3].location },
  { id: "t118-csfloat",  from: NODES[3].location, to: NODES[0].location },
  { id: "b2071-t204",    from: NODES[5].location, to: NODES[4].location },
  { id: "t204-t118",     from: NODES[4].location, to: NODES[3].location },
  { id: "b1042-buff",    from: NODES[6].location, to: NODES[1].location },
  { id: "t118-buff",     from: NODES[3].location, to: NODES[1].location },
  { id: "b3318-t118",    from: NODES[7].location, to: NODES[3].location },
]

const TYPE_LABEL: Record<NodeType, string> = {
  buyer: "Comprador", trader: "Trader", mkt: "Marketplace",
}

const TYPE_DOT: Record<NodeType, string> = {
  buyer: "#c8c8cc", trader: "#cc1818", mkt: "#555570",
}

const MARKER_SIZE: Record<NodeType, number> = {
  mkt: 0.055, trader: 0.045, buyer: 0.028,
}

export default function NetworkGlobe() {
  const [sel, setSel] = useState<CS2Node>(NODES[3]) // T-118 default

  const globeMarkers = NODES.map(n => ({
    id: n.id,
    location: n.location,
    size: MARKER_SIZE[n.type],
  }))

  return (
    <div className="netglobe">
      {/* Globe */}
      <div className="netglobe__canvas">
        <Globe
          markers={globeMarkers}
          arcs={ARCS}
          dark={1}
          baseColor={[0.05, 0.05, 0.09]}
          markerColor={[0.95, 0.92, 0.88]}
          arcColor={[0.78, 0.1, 0.1]}
          glowColor={[0.35, 0.04, 0.04]}
          mapBrightness={2.2}
          diffuse={1.3}
          speed={0.0018}
          theta={0.28}
          mapSamples={22000}
          arcHeight={0.32}
          arcWidth={0.5}
          className="w-full h-full"
        />
      </div>

      {/* Node list + inspector */}
      <aside className="netglobe__side">
        <div className="netglobe__nodes">
          {NODES.map(n => (
            <button
              key={n.id}
              className={`netglobe__node${sel.id === n.id ? " netglobe__node--active" : ""}`}
              onClick={() => setSel(n)}
            >
              <span className="netglobe__dot" style={{ background: TYPE_DOT[n.type] }} />
              <span className="netglobe__node-label">{n.label}</span>
              <span className="netglobe__node-city">{n.city}</span>
            </button>
          ))}
        </div>

        <div className="netglobe__inspector">
          <div className="netglobe__insp-id">{sel.id}</div>
          <div className="netglobe__insp-type">{TYPE_LABEL[sel.type]}</div>
          <div className="netglobe__insp-loc">{sel.city}, {sel.country}</div>
          <dl className="netglobe__insp-list">
            <div><dt>Conexiones</dt><dd>{sel.meta.conn}</dd></div>
            {sel.meta.vol !== "—" && <div><dt>Volumen 30 d</dt><dd>{sel.meta.vol}</dd></div>}
            <div><dt>Marketplaces</dt><dd>{sel.meta.mkts}</dd></div>
          </dl>
          <p className="netglobe__insp-note">{sel.meta.note}</p>
        </div>
      </aside>
    </div>
  )
}
