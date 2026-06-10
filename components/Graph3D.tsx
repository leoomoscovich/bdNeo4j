"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import * as THREE from "three";
import type { GraphNode, GraphResponse } from "@/lib/types";

const ForceGraph3D = dynamic(() => import("react-force-graph-3d"), { ssr: false });

/* Paleta editorial (papel oscuro) por tipo de nodo */
const NODE_COLOR: Record<string, number> = {
  skin: 0xee2e2e,
  instance: 0xedeae2,
  trader: 0x9a9a96,
  transaction: 0x5b5b60,
  marketplace: 0xc98a2a,
  weapon: 0x7a7a80,
  sticker: 0xb06fc9,
  collection: 0x4a6fa5,
  price: 0x5b8a6a,
};

const NODE_SIZE: Record<string, number> = {
  skin: 14,
  instance: 11,
  trader: 10,
  transaction: 5,
  marketplace: 12,
  weapon: 8,
  sticker: 6,
  collection: 9,
  price: 5,
};

type FGNode = GraphNode & { x?: number; y?: number; z?: number };
type FGLink = { source: string; target: string; label: string; risk: boolean };

type Graph3DProps = {
  graph: GraphResponse;
  height?: number;
  riskMode?: boolean;
  onNodeClick?: (node: GraphNode) => void;
};

function isRiskyNode(node: GraphNode): boolean {
  const risk = Number(node.data?.riskScore ?? 0);
  const suspicious = node.data?.suspicious === true;
  return risk >= 60 || suspicious;
}

export function Graph3D({ graph, height = 420, riskMode = false, onNodeClick }: Graph3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fgRef = useRef<any>(null);
  const pulseMeshes = useRef<THREE.Mesh[]>([]);
  const [width, setWidth] = useState(800);

  useEffect(() => {
    function measure() {
      if (containerRef.current) setWidth(containerRef.current.clientWidth);
    }
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  /* pulso de los nodos en riesgo: oscila emissiveIntensity */
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const t = performance.now() / 1000;
      const intensity = 0.7 + Math.sin(t * 3.2) * 0.55;
      for (const mesh of pulseMeshes.current) {
        const mat = mesh.material as THREE.MeshPhongMaterial;
        mat.emissiveIntensity = intensity;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  /* luces + encuadre apenas la escena está disponible (no esperar engineStop) */
  useEffect(() => {
    let tries = 0;
    const id = setInterval(() => {
      const fg = fgRef.current;
      tries += 1;
      if (fg?.scene) {
        const scene = fg.scene();
        if (scene && !scene.userData.sgLit) {
          scene.userData.sgLit = true;
          scene.add(new THREE.AmbientLight(0xffffff, 1.1));
          const key = new THREE.DirectionalLight(0xfff2e2, 0.9);
          key.position.set(1, 1, 1);
          scene.add(key);
          const fill = new THREE.DirectionalLight(0xffe2d2, 0.4);
          fill.position.set(-1, -0.6, 0.4);
          scene.add(fill);
        }
        if (tries > 12) {
          fg.zoomToFit(500, 50);
          clearInterval(id);
        }
      } else if (tries > 40) {
        clearInterval(id);
      }
    }, 150);
    return () => clearInterval(id);
  }, [graph]);

  const nodeThreeObject = useCallback((nodeObj: object) => {
    const node = nodeObj as FGNode;
    const risky = isRiskyNode(node) || (riskMode && node.type === "instance");
    const r = NODE_SIZE[node.type] ?? 5;
    const color = NODE_COLOR[node.type] ?? 0x9a9a96;

    const geo = node.type === "trader"
      ? new THREE.OctahedronGeometry(r, 0)
      : node.type === "marketplace"
        ? new THREE.BoxGeometry(r * 1.5, r * 1.5, r * 1.5)
        : new THREE.SphereGeometry(r, 18, 14);

    const mat = new THREE.MeshPhongMaterial({
      color: risky ? 0xee2e2e : color,
      emissive: new THREE.Color(risky ? 0xaa0e0e : 0x111114),
      emissiveIntensity: risky ? 1.0 : 0.35,
      shininess: node.type === "skin" || node.type === "instance" ? 80 : 25,
      transparent: true,
      opacity: node.type === "transaction" ? 0.55 : 0.95,
    });

    const mesh = new THREE.Mesh(geo, mat);
    if (risky) pulseMeshes.current.push(mesh);
    return mesh;
  }, [riskMode]);

  const handleEngineStop = useCallback(() => {
    const fg = fgRef.current;
    if (!fg) return;
    fg.zoomToFit(600, 60);
    const controls = fg.controls();
    if (controls) {
      controls.maxDistance = 600;
      controls.minDistance = 25;
    }
  }, []);

  const handleNodeClick = useCallback((nodeObj: object) => {
    const node = nodeObj as FGNode;
    onNodeClick?.(node);
    if (fgRef.current && node.x !== undefined && node.y !== undefined) {
      const dist = 90;
      fgRef.current.cameraPosition(
        { x: node.x + dist * 0.4, y: node.y + dist * 0.2, z: (node.z ?? 0) + dist },
        { x: node.x, y: node.y, z: node.z ?? 0 },
        700,
      );
    }
  }, [onNodeClick]);

  pulseMeshes.current = [];

  const riskTraders = new Set(
    graph.nodes.filter((n) => isRiskyNode(n)).map((n) => n.id),
  );

  const data = {
    nodes: graph.nodes.map((n) => ({ ...n })),
    links: graph.edges.map((e): FGLink => ({
      source: e.source,
      target: e.target,
      label: e.label,
      risk: riskMode || riskTraders.has(e.source) || riskTraders.has(e.target),
    })),
  };

  return (
    <div ref={containerRef} className="graph3d-wrap" style={{ height, position: "relative", overflow: "hidden" }}>
      <ForceGraph3D
        ref={fgRef}
        graphData={data}
        width={width}
        height={height}
        backgroundColor="#0E0E10"
        showNavInfo={false}
        warmupTicks={100}
        cooldownTicks={40}
        nodeLabel={(node) => {
          const n = node as FGNode;
          return `<div style="font-family:monospace;font-size:11px;padding:4px 8px;background:#141416;border:1px solid rgba(237,234,226,0.2);color:#EDEAE2">${n.label} · ${n.type}</div>`;
        }}
        nodeThreeObject={nodeThreeObject}
        nodeThreeObjectExtend={false}
        linkColor={(link) => (link as FGLink).risk ? "#EE2E2E" : "rgba(237,234,226,0.22)"}
        linkWidth={(link) => (link as FGLink).risk ? 1.4 : 0.5}
        linkOpacity={0.9}
        linkDirectionalParticles={(link) => (link as FGLink).risk ? 2 : 0}
        linkDirectionalParticleWidth={1.6}
        linkDirectionalParticleSpeed={0.006}
        linkDirectionalParticleColor={() => "#EE2E2E"}
        onNodeClick={handleNodeClick}
        onEngineStop={handleEngineStop}
      />
    </div>
  );
}
