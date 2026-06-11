"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

/* Tipos cuyo nombre vale la pena mostrar siempre como etiqueta flotante. */
const LABELED_TYPES = new Set(["skin", "trader", "marketplace", "instance"]);

type FGNode = GraphNode & { x?: number; y?: number; z?: number };
type FGLink = { source: string; target: string; label: string; risk: boolean };

/* Sprite de texto (canvas -> textura) para etiquetar nodos sin saturar la escena. */
function makeLabelSprite(text: string, color: string): THREE.Sprite {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  const fontSize = 28;
  ctx.font = `${fontSize}px monospace`;
  const padding = 12;
  const textWidth = ctx.measureText(text).width;
  canvas.width = textWidth + padding * 2;
  canvas.height = fontSize + padding * 2;

  ctx.font = `${fontSize}px monospace`;
  ctx.fillStyle = "rgba(14,14,16,0.78)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
  ctx.fillStyle = "#EDEAE2";
  ctx.textBaseline = "middle";
  ctx.fillText(text, padding, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const material = new THREE.SpriteMaterial({ map: texture, depthWrite: false, transparent: true });
  const sprite = new THREE.Sprite(material);
  const scale = 0.18;
  sprite.scale.set(canvas.width * scale, canvas.height * scale, 1);
  return sprite;
}

type Graph3DProps = {
  graph: GraphResponse;
  height?: number;
  riskMode?: boolean;
  chargeStrength?: number;
  onNodeClick?: (node: GraphNode) => void;
};

function isRiskyNode(node: GraphNode): boolean {
  const risk = Number(node.data?.riskScore ?? 0);
  const suspicious = node.data?.suspicious === true;
  return risk >= 60 || suspicious;
}

export function Graph3D({ graph, height = 420, riskMode = false, chargeStrength = -120, onNodeClick }: Graph3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fgRef = useRef<any>(null);
  const pulseMeshes = useRef<THREE.Mesh[]>([]);
  /* Track every Three.js resource created via nodeThreeObject so we can dispose
     them when the graph changes or the component unmounts — prevents GPU memory leak
     after repeated open/close cycles of drawers or graph switches. */
  const disposablesRef = useRef<Array<{ dispose(): void }>>([]);

  useEffect(() => {
    return () => {
      for (const d of disposablesRef.current) {
        try { d.dispose(); } catch { /* already disposed by three.js internally */ }
      }
      disposablesRef.current = [];
      pulseMeshes.current = [];
    };
  }, [graph]);
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

  /* luces + encuadre apenas la escena está disponible (no esperar engineStop).
     Si el usuario interactúa antes, se cancela el encuadre para no pelearle la cámara. */
  useEffect(() => {
    let tries = 0;
    let userTookOver = false;
    const container = containerRef.current;
    const onPointerDown = () => {
      userTookOver = true;
      const controls = fgRef.current?.controls();
      if (controls) controls.autoRotate = false;
    };
    container?.addEventListener("pointerdown", onPointerDown);

    const id = setInterval(() => {
      const fg = fgRef.current;
      tries += 1;
      if (fg?.scene) {
        const scene = fg.scene();
        if (scene && !scene.userData.sgLit) {
          scene.userData.sgLit = true;
          scene.fog = new THREE.FogExp2(0x0e0e10, 0.0022);
          scene.add(new THREE.AmbientLight(0xffffff, 1.1));
          const key = new THREE.DirectionalLight(0xfff2e2, 0.9);
          key.position.set(1, 1, 1);
          scene.add(key);
          const fill = new THREE.DirectionalLight(0xffe2d2, 0.4);
          fill.position.set(-1, -0.6, 0.4);
          scene.add(fill);
        }
        if (tries > 8) {
          if (!userTookOver) fg.zoomToFit(500, 24);
          clearInterval(id);
        }
      } else if (tries > 40) {
        clearInterval(id);
      }
    }, 150);
    return () => {
      clearInterval(id);
      container?.removeEventListener("pointerdown", onPointerDown);
    };
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
    disposablesRef.current.push(geo, mat);

    const mesh = new THREE.Mesh(geo, mat);
    if (risky) pulseMeshes.current.push(mesh);

    if (LABELED_TYPES.has(node.type) && node.label) {
      const label = makeLabelSprite(node.label, risky ? "#EE2E2E" : `#${color.toString(16).padStart(6, "0")}`);
      label.position.set(0, r + 7, 0);
      const spriteMat = label.material as THREE.SpriteMaterial;
      if (spriteMat.map) disposablesRef.current.push(spriteMat.map);
      disposablesRef.current.push(spriteMat);
      mesh.add(label);
    }

    return mesh;
  }, [riskMode]);

  /* Apply charge strength whenever it changes (inventory vs network mode). */
  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const charge = (fg as any).d3Force?.("charge");
    if (charge?.strength) charge.strength(chargeStrength);
  }, [chargeStrength, graph]);

  const handleEngineStop = useCallback(() => {
    const fg = fgRef.current;
    if (!fg) return;
    fg.zoomToFit(600, 24);
    // Freeze physics — nodes stay put on subsequent re-renders that don't change graph data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (fg as any).pauseAnimation?.();
    const controls = fg.controls();
    if (controls) {
      controls.maxDistance = 600;
      controls.minDistance = 25;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.35;
    }
    // Resume Three.js render loop (only physics is frozen, not the scene)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (fg as any).resumeAnimation?.();
  }, []);

  /* Click: inspecciona el nodo y vuelve a apuntar la cámara hacia él, manteniendo
     la distancia/escala actual para no "tele-transportarse" encima del nodo. */
  const handleNodeClick = useCallback((nodeObj: object) => {
    const node = nodeObj as FGNode;
    onNodeClick?.(node);
    const fg = fgRef.current;
    if (fg && node.x !== undefined && node.y !== undefined) {
      const target = { x: node.x, y: node.y, z: node.z ?? 0 };
      const camPos = fg.camera().position;
      const controls = fg.controls();
      const lookAt = controls?.target ?? new THREE.Vector3(0, 0, 0);
      const dist = Math.max(camPos.distanceTo(lookAt), 90);
      const dir = new THREE.Vector3(camPos.x - lookAt.x, camPos.y - lookAt.y, camPos.z - lookAt.z).normalize();
      fg.cameraPosition(
        { x: target.x + dir.x * dist, y: target.y + dir.y * dist, z: target.z + dir.z * dist },
        target,
        500,
      );
    }
  }, [onNodeClick]);

  /* Identidad estable: si esto se reconstruye en cada render, react-force-graph
     interpreta "grafo nuevo" y reinicia la simulación con cada click/setState
     del padre — los nodos saltan y la interacción parece muerta. */
  const data = useMemo(() => {
    // eslint-disable-next-line react-hooks/refs -- nodeThreeObject repopulates this on each graph rebuild
    pulseMeshes.current = [];
    const riskTraders = new Set(
      graph.nodes.filter((n) => isRiskyNode(n)).map((n) => n.id),
    );
    return {
      nodes: graph.nodes.map((n) => ({ ...n })),
      links: graph.edges.map((e): FGLink => ({
        source: e.source,
        target: e.target,
        label: e.label,
        risk: riskMode || riskTraders.has(e.source) || riskTraders.has(e.target),
      })),
    };
  }, [graph, riskMode]);

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
        linkColor={(link) => (link as FGLink).risk ? "#EE2E2E" : "rgba(237,234,226,0.32)"}
        linkWidth={(link) => (link as FGLink).risk ? 1.6 : 0.6}
        linkOpacity={0.9}
        linkDirectionalArrowLength={(link) => (link as FGLink).risk ? 5 : 3}
        linkDirectionalArrowRelPos={1}
        linkDirectionalArrowColor={(link) => (link as FGLink).risk ? "#EE2E2E" : "rgba(237,234,226,0.5)"}
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
