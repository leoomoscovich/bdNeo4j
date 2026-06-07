'use client';
import { useRef, useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import * as THREE from 'three';

const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { ssr: false });

type NodeType = 'buyer' | 'trader' | 'skin' | 'mkt' | 'tx';
interface NodeMeta {
  conn: number; match: string; last: string; mkts: string; vol: string; note: string;
}
interface GNode {
  id: string; type: NodeType; label: string; meta: NodeMeta;
  x?: number; y?: number; z?: number;
}
interface GLink { source: string; target: string; hot: boolean; }

const RAW_NODES: GNode[] = [
  { id:'B-2071', type:'buyer',  label:'B-2071', meta:{conn:14, match:'6 traders',            last:'hace 4 min',  mkts:'CSFloat · BUFF163',            vol:'$48.210',  note:'Aparece en seis cadenas distintas comprando AK-47 Voltaic. Tres terminan en el mismo trader: T-118.'} },
  { id:'B-1042', type:'buyer',  label:'B-1042', meta:{conn:9,  match:'4 traders',            last:'hace 18 min', mkts:'BUFF163',                      vol:'$22.870',  note:'Tres compras consecutivas de Karambit Doppler en menos de 72 h, todas con stickers similares.'} },
  { id:'B-3318', type:'buyer',  label:'B-3318', meta:{conn:6,  match:'2 traders',            last:'hace 1 h',    mkts:'CSFloat',                      vol:'$11.420',  note:'Comprador nuevo. Ya cruzó con dos traders del cluster T-118.'} },
  { id:'T-118',  type:'trader', label:'T-118',  meta:{conn:42, match:'18 compradores',       last:'hace 2 min',  mkts:'CSFloat · BUFF163 · Skinport', vol:'$184.300', note:'Trader denso. Aparece en 22 ciclos cerrados sobre AK-47, AWP y Karambit en los últimos 30 días.'} },
  { id:'T-204',  type:'trader', label:'T-204',  meta:{conn:28, match:'12 compradores',       last:'hace 9 min',  mkts:'BUFF163 · Skinport',           vol:'$71.500',  note:'Tempo más lento que T-118 pero comparte cinco compradores en común.'} },
  { id:'AK-V',   type:'skin',   label:'AK-47',  meta:{conn:31, match:'AK-47 │ Voltaic',      last:'hace 3 min',  mkts:'CSFloat · BUFF163',            vol:'$284.700', note:'Modelo con mayor densidad de spreads y reapariciones del mes.'} },
  { id:'KAR-D',  type:'skin',   label:'KAR',    meta:{conn:18, match:'Karambit │ Doppler P2',last:'hace 12 min', mkts:'BUFF163',                      vol:'$112.300', note:'Reaparición consecutiva en cuatro listados de un mismo float.'} },
  { id:'AWP-W',  type:'skin',   label:'AWP',    meta:{conn:12, match:'AWP │ Wildfire',       last:'hace 30 min', mkts:'CSFloat · BUFF163',            vol:'$58.220',  note:'Spread amplio entre venues sostenido por 11 días.'} },
  { id:'M-CSF',  type:'mkt',    label:'CSFloat', meta:{conn:42, match:'CSFloat',             last:'live',        mkts:'—', vol:'—',                   note:'Venue principal para floats raros.'} },
  { id:'M-BUF',  type:'mkt',    label:'BUFF163', meta:{conn:51, match:'BUFF163',             last:'live',        mkts:'—', vol:'—',                   note:'Mayor volumen pero menor velocidad de cierre.'} },
  { id:'M-SKP',  type:'mkt',    label:'Skinport',meta:{conn:24, match:'Skinport',            last:'live',        mkts:'—', vol:'—',                   note:'Tempo distinto. Suele rezagarse 2–4 h sobre BUFF.'} },
  { id:'TX-A',   type:'tx',     label:'TX-A',   meta:{conn:1,  match:'B-2071 → T-118',       last:'hace 4 min',  mkts:'—', vol:'$1.842',              note:'Transacción reciente con spread +14% sobre la mediana.'} },
  { id:'TX-B',   type:'tx',     label:'TX-B',   meta:{conn:1,  match:'B-1042 → T-204',       last:'hace 22 min', mkts:'—', vol:'$2.940',              note:'Karambit Doppler con float top 1%.'} },
  { id:'TX-C',   type:'tx',     label:'TX-C',   meta:{conn:1,  match:'T-118 → AK-V',         last:'hace 8 min',  mkts:'—', vol:'$1.789',              note:'Listado abierto en CSFloat. Sospecha de reaparición.'} },
];

const RAW_LINKS: GLink[] = [
  { source:'B-2071', target:'TX-A',  hot:true  },
  { source:'TX-A',   target:'T-118', hot:true  },
  { source:'T-118',  target:'TX-C',  hot:true  },
  { source:'TX-C',   target:'AK-V',  hot:true  },
  { source:'AK-V',   target:'M-CSF', hot:false },
  { source:'B-1042', target:'TX-B',  hot:false },
  { source:'TX-B',   target:'T-204', hot:false },
  { source:'T-204',  target:'KAR-D', hot:false },
  { source:'KAR-D',  target:'M-BUF', hot:false },
  { source:'B-3318', target:'T-118', hot:false },
  { source:'B-3318', target:'T-204', hot:false },
  { source:'T-118',  target:'M-BUF', hot:false },
  { source:'T-118',  target:'AWP-W', hot:false },
  { source:'AWP-W',  target:'M-SKP', hot:false },
  { source:'B-2071', target:'T-204', hot:true  },
  { source:'AK-V',   target:'M-BUF', hot:false },
  { source:'T-204',  target:'M-SKP', hot:false },
  { source:'B-1042', target:'T-118', hot:false },
];

const NODE_SIZES: Record<NodeType, number> = {
  buyer: 5, trader: 9, skin: 7, mkt: 4, tx: 2.5,
};

const NODE_EMISSIVE: Record<NodeType, string> = {
  buyer:  '#080818',
  trader: '#7a0000',
  skin:   '#18181e',
  mkt:    '#060610',
  tx:     '#050510',
};

function typeLabel(t: NodeType) {
  return { buyer:'Comprador', trader:'Trader', skin:'Skin', mkt:'Marketplace', tx:'Transacción' }[t];
}

export default function NetworkGraph() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ w: 800, h: 560 });
  const [sel, setSel] = useState<GNode>(RAW_NODES[0]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fgRef = useRef<any>(null);

  useEffect(() => {
    function measure() {
      if (containerRef.current) {
        setDimensions({
          w: containerRef.current.clientWidth,
          h: containerRef.current.clientHeight,
        });
      }
    }
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const handleNodeClick = useCallback((node: object) => {
    const n = node as GNode;
    setSel(n);
    if (fgRef.current && n.x !== undefined && n.y !== undefined) {
      const dist = 80;
      fgRef.current.cameraPosition(
        { x: n.x + dist * 0.4, y: n.y + dist * 0.2, z: (n.z ?? 0) + dist },
        { x: n.x, y: n.y, z: n.z ?? 0 },
        700,
      );
    }
  }, []);

  const handleEngineStop = useCallback(() => {
    const fg = fgRef.current;
    if (!fg) return;

    fg.zoomToFit(600, 80);

    // camera constraints — prevent zooming out to empty space
    const controls = fg.controls();
    if (controls) {
      controls.maxDistance = 420;
      controls.minDistance = 30;
      controls.enablePan = false;
    }

    // add fog for depth atmosphere
    const scene = fg.scene();
    if (scene && !scene.fog) {
      scene.fog = new THREE.FogExp2(0x080810, 0.007);
    }

    // boost ambient light slightly
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene?.add(ambientLight);

    // subtle blue-tinted fill light from below
    const fillLight = new THREE.DirectionalLight(0x8899ff, 0.3);
    fillLight.position.set(0, -1, 0.5);
    scene?.add(fillLight);
  }, []);

  const nodeThreeObject = useCallback((node: object) => {
    const n = node as GNode;
    const r = NODE_SIZES[n.type];
    const geo = new THREE.SphereGeometry(r, 18, 14);

    const colorMap: Record<NodeType, number> = {
      buyer:  0xc0c0c8,
      trader: 0xcc1818,
      skin:   0xf4f4f6,
      mkt:    0x44445a,
      tx:     0x2a2a38,
    };

    const mat = new THREE.MeshPhongMaterial({
      color:            colorMap[n.type],
      emissive:         new THREE.Color(NODE_EMISSIVE[n.type]),
      emissiveIntensity: n.type === 'trader' ? 1.2 : 0.4,
      shininess:        n.type === 'skin' ? 90 : n.type === 'trader' ? 40 : 15,
      transparent:      true,
      opacity:          n.type === 'tx' ? 0.45 : 0.92,
    });

    return new THREE.Mesh(geo, mat);
  }, []);

  return (
    <div className="graph3d" ref={containerRef}>
      <ForceGraph3D
        ref={fgRef}
        graphData={{ nodes: RAW_NODES, links: RAW_LINKS }}
        width={dimensions.w}
        height={dimensions.h}
        backgroundColor="#080810"
        showNavInfo={false}
        warmupTicks={120}
        cooldownTicks={0}
        nodeLabel={(node) => (node as GNode).label}
        nodeThreeObject={nodeThreeObject}
        nodeThreeObjectExtend={false}
        linkColor={(link) => (link as GLink).hot ? '#bb1414' : 'rgba(140,140,170,0.15)'}
        linkWidth={(link) => (link as GLink).hot ? 1.5 : 0.6}
        linkOpacity={1}
        onNodeClick={handleNodeClick}
        onEngineStop={handleEngineStop}
      />

      {/* legend bottom-left */}
      <div className="graph3d__legend">
        <span><span className="dotleg dotleg--buyer" />Comprador</span>
        <span><span className="dotleg dotleg--trader" />Trader</span>
        <span><span className="dotleg dotleg--skin" />Skin</span>
        <span><span className="dotleg dotleg--mkt" />Marketplace</span>
        <span><span className="dotleg dotleg--tx" />Transacción</span>
      </div>

      {/* inspector overlay right */}
      <aside className="graph3d__inspector">
        <div className="inspector__head mono mono--muted">Inspector · nodo seleccionado</div>
        <div className="inspector__body">
          <div className="inspector__id">{sel.id}</div>
          <div className="inspector__type">{typeLabel(sel.type)}</div>
          <dl className="inspector__list">
            <div><dt>Conexiones</dt><dd>{sel.meta.conn}</dd></div>
            <div><dt>Coincidencias</dt><dd>{sel.meta.match}</dd></div>
            <div><dt>Última actividad</dt><dd>{sel.meta.last}</dd></div>
            <div><dt>Marketplaces</dt><dd>{sel.meta.mkts}</dd></div>
            <div><dt>Volumen 30 d</dt><dd>{sel.meta.vol}</dd></div>
          </dl>
          <p className="inspector__note">{sel.meta.note}</p>
        </div>
        <div className="inspector__foot mono mono--muted">Tocá un nodo para inspeccionarlo</div>
      </aside>
    </div>
  );
}
