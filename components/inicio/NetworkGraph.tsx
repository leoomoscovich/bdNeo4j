'use client';
import { useEffect, useRef, useState } from 'react';

type NodeType = 'buyer' | 'trader' | 'skin' | 'mkt' | 'tx';
interface NodeMeta {
  conn: number; match: string; last: string; mkts: string; vol: string; note: string;
}
interface Node { id: string; type: NodeType; x: number; y: number; label: string; meta: NodeMeta; }

const NODES: Node[] = [
  { id:'B-2071', type:'buyer',  x:170, y:130, label:'B-2071', meta:{conn:14, match:'6 traders',       last:'hace 4 min',  mkts:'CSFloat · BUFF163',            vol:'$48.210',  note:'Aparece en seis cadenas distintas comprando AK-47 Voltaic. Tres terminan en el mismo trader: T-118.'} },
  { id:'B-1042', type:'buyer',  x:140, y:300, label:'B-1042', meta:{conn:9,  match:'4 traders',       last:'hace 18 min', mkts:'BUFF163',                      vol:'$22.870',  note:'Tres compras consecutivas de Karambit Doppler en menos de 72 h, todas con stickers similares.'} },
  { id:'B-3318', type:'buyer',  x:230, y:440, label:'B-3318', meta:{conn:6,  match:'2 traders',       last:'hace 1 h',    mkts:'CSFloat',                      vol:'$11.420',  note:'Comprador nuevo. Ya cruzó con dos traders del cluster T-118.'} },
  { id:'T-118',  type:'trader', x:380, y:210, label:'T-118',  meta:{conn:42, match:'18 compradores',  last:'hace 2 min',  mkts:'CSFloat · BUFF163 · Skinport', vol:'$184.300', note:'Trader denso. Aparece en 22 ciclos cerrados sobre AK-47, AWP y Karambit en los últimos 30 días.'} },
  { id:'T-204',  type:'trader', x:420, y:380, label:'T-204',  meta:{conn:28, match:'12 compradores',  last:'hace 9 min',  mkts:'BUFF163 · Skinport',           vol:'$71.500',  note:'Tempo más lento que T-118 pero comparte cinco compradores en común.'} },
  { id:'AK-V',   type:'skin',   x:580, y:140, label:'AK',     meta:{conn:31, match:'AK-47 │ Voltaic', last:'hace 3 min',  mkts:'CSFloat · BUFF163',            vol:'$284.700', note:'Modelo con mayor densidad de spreads y reapariciones del mes.'} },
  { id:'KAR-D',  type:'skin',   x:620, y:320, label:'KAR',    meta:{conn:18, match:'Karambit │ Doppler P2', last:'hace 12 min', mkts:'BUFF163',              vol:'$112.300', note:'Reaparición consecutiva en cuatro listados de un mismo float.'} },
  { id:'AWP-W',  type:'skin',   x:540, y:470, label:'AWP',    meta:{conn:12, match:'AWP │ Wildfire',  last:'hace 30 min', mkts:'CSFloat · BUFF163',            vol:'$58.220',  note:'Spread amplio entre venues sostenido por 11 días.'} },
  { id:'M-CSF',  type:'mkt',    x:680, y:80,  label:'CSF',    meta:{conn:42, match:'CSFloat',         last:'live',        mkts:'—', vol:'—', note:'Venue principal para floats raros.'} },
  { id:'M-BUF',  type:'mkt',    x:700, y:240, label:'BUF',    meta:{conn:51, match:'BUFF163',         last:'live',        mkts:'—', vol:'—', note:'Mayor volumen pero menor velocidad de cierre.'} },
  { id:'M-SKP',  type:'mkt',    x:670, y:430, label:'SKP',    meta:{conn:24, match:'Skinport',        last:'live',        mkts:'—', vol:'—', note:'Tempo distinto. Suele rezagarse 2–4 h sobre BUFF.'} },
  { id:'TX-A',   type:'tx',     x:290, y:170, label:'',       meta:{conn:1, match:'B-2071 → T-118', last:'hace 4 min',  mkts:'—', vol:'$1.842',  note:'Transacción reciente con spread +14% sobre la mediana.'} },
  { id:'TX-B',   type:'tx',     x:310, y:330, label:'',       meta:{conn:1, match:'B-1042 → T-204', last:'hace 22 min', mkts:'—', vol:'$2.940',  note:'Karambit Doppler con float top 1%.'} },
  { id:'TX-C',   type:'tx',     x:480, y:120, label:'',       meta:{conn:1, match:'T-118 → AK-V',   last:'hace 8 min',  mkts:'—', vol:'$1.789',  note:'Listado abierto en CSFloat. Sospecha de reaparición.'} },
];

const EDGES: [string, string][] = [
  ['B-2071','TX-A'], ['TX-A','T-118'], ['T-118','TX-C'], ['TX-C','AK-V'], ['AK-V','M-CSF'],
  ['B-1042','TX-B'], ['TX-B','T-204'], ['T-204','KAR-D'], ['KAR-D','M-BUF'],
  ['B-3318','T-118'], ['B-3318','T-204'],
  ['T-118','M-BUF'], ['T-118','AWP-W'], ['AWP-W','M-SKP'],
  ['B-2071','T-204'], ['AK-V','M-BUF'], ['T-204','M-SKP'],
  ['B-1042','T-118'],
];

const HOT = new Set(['B-2071>TX-A','TX-A>T-118','T-118>TX-C','TX-C>AK-V','B-2071>T-204','T-204>T-118']);

const NODE_BY_ID = Object.fromEntries(NODES.map(n => [n.id, n]));

function typeLabel(t: NodeType) {
  return { buyer:'Comprador', trader:'Trader', skin:'Skin', mkt:'Marketplace', tx:'Transacción' }[t];
}

function nodeRadius(t: NodeType) {
  if (t === 'trader') return 22;
  if (t === 'skin')   return 24;
  if (t === 'tx')     return 5;
  return 20;
}

function nodeFill(t: NodeType) {
  if (t === 'buyer')  return '#0B0B0C';
  if (t === 'trader') return 'var(--red, #EE2E2E)';
  if (t === 'skin')   return '#FFFFFF';
  if (t === 'mkt')    return '#1A1A1B';
  return '#6B6B6B';
}

export default function NetworkGraph() {
  const [sel, setSel] = useState<string>('B-2071');
  const [hover, setHover] = useState<string | null>(null);
  const active = hover ?? sel;

  const connected = new Set<string>([active]);
  EDGES.forEach(([a, b]) => {
    if (a === active || b === active) { connected.add(a); connected.add(b); }
  });

  const insNode = NODE_BY_ID[sel];

  return (
    <div className="graph">
      <div className="graph__viz">
        <svg id="netgraph" viewBox="0 0 760 540" aria-label="Red de compradores, traders y skins">
          <defs>
            <radialGradient id="haze" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(209,29,29,0.10)" />
              <stop offset="100%" stopColor="rgba(209,29,29,0)" />
            </radialGradient>
          </defs>
          <rect x="0" y="0" width="760" height="540" fill="url(#haze)" />

          {/* edges */}
          <g id="edges">
            {EDGES.map(([a, b]) => {
              const A = NODE_BY_ID[a], B = NODE_BY_ID[b];
              const isHot = HOT.has(`${a}>${b}`) || HOT.has(`${b}>${a}`);
              const isDim = hover !== null && !connected.has(a) && !connected.has(b);
              return (
                <line
                  key={`${a}-${b}`}
                  x1={A.x} y1={A.y} x2={B.x} y2={B.y}
                  data-from={a} data-to={b}
                  className={`${isHot ? 'edge--hot pulse' : ''} ${isDim ? 'edge--dim' : ''}`}
                />
              );
            })}
          </g>

          {/* nodes */}
          <g id="nodes">
            {NODES.map(n => {
              const isSelected = sel === n.id;
              const strokeColor = isSelected ? 'var(--red, #EE2E2E)' : (n.type === 'skin' ? '#0B0B0C' : 'none');
              const strokeW = isSelected ? 2 : (n.type === 'skin' ? 1.4 : 0);
              return (
                <g
                  key={n.id}
                  className={`node node--${n.type}${isSelected ? ' node--selected' : ''}`}
                  transform={`translate(${n.x} ${n.y})`}
                  data-id={n.id}
                  onClick={() => setSel(n.id)}
                  onMouseEnter={() => setHover(n.id)}
                  onMouseLeave={() => setHover(null)}
                  style={{ cursor: 'pointer' }}
                >
                  {n.type === 'mkt' ? (
                    <rect
                      x={-9} y={-9} width={18} height={18}
                      transform="rotate(45)"
                      fill={nodeFill(n.type)}
                      stroke={strokeColor} strokeWidth={strokeW}
                      className="node-bg"
                    />
                  ) : (
                    <circle
                      r={nodeRadius(n.type)}
                      fill={nodeFill(n.type)}
                      stroke={strokeColor} strokeWidth={strokeW}
                      className="node-bg"
                    />
                  )}
                  {n.label && (
                    <text
                      y={3}
                      textAnchor="middle"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '9.5px',
                        fill: n.type === 'skin' ? '#0B0B0C' : '#fff',
                        pointerEvents: 'none',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {n.label}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        <div className="graph__legend">
          <span><span className="dotleg dotleg--buyer" />Comprador</span>
          <span><span className="dotleg dotleg--trader" />Trader</span>
          <span><span className="dotleg dotleg--skin" />Skin</span>
          <span><span className="dotleg dotleg--mkt" />Marketplace</span>
          <span><span className="dotleg dotleg--tx" />Transacción</span>
        </div>
      </div>

      <aside className="graph__inspector">
        <div className="inspector__head mono mono--muted">Inspector · nodo seleccionado</div>
        <div className="inspector__body">
          <div className="inspector__id">{insNode.id}</div>
          <div className="inspector__type">{typeLabel(insNode.type)}</div>
          <dl className="inspector__list">
            <div><dt>Conexiones</dt><dd>{insNode.meta.conn}</dd></div>
            <div><dt>Coincidencias</dt><dd>{insNode.meta.match}</dd></div>
            <div><dt>Última actividad</dt><dd>{insNode.meta.last}</dd></div>
            <div><dt>Marketplaces</dt><dd>{insNode.meta.mkts}</dd></div>
            <div><dt>Volumen 30 d</dt><dd>{insNode.meta.vol}</dd></div>
          </dl>
          <p className="inspector__note">{insNode.meta.note}</p>
        </div>
        <div className="inspector__foot mono mono--muted">Tocá un nodo del grafo para inspeccionarlo</div>
      </aside>
    </div>
  );
}
