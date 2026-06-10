"use client";

import { useRef, useState, type ReactNode } from "react";

/**
 * Inspección 3D de la pieza: tilt con perspectiva siguiendo el puntero
 * + barrido especular, el gesto de "inspect" que cualquier jugador reconoce.
 */
export function SkinInspect3D({ children }: { children: ReactNode }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});
  const [sheen, setSheen] = useState<React.CSSProperties>({ opacity: 0 });

  function handleMove(e: React.PointerEvent) {
    const el = frameRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;   // 0..1
    const py = (e.clientY - rect.top) / rect.height;   // 0..1
    const rotY = (px - 0.5) * 22;
    const rotX = (0.5 - py) * 16;

    setStyle({
      transform: `perspective(900px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) scale(1.04)`,
      transition: "transform 60ms linear",
    });
    setSheen({
      opacity: 1,
      background: `radial-gradient(circle at ${(px * 100).toFixed(1)}% ${(py * 100).toFixed(1)}%, rgba(255,255,255,0.35), rgba(255,255,255,0.08) 35%, transparent 60%)`,
      transition: "opacity 120ms linear",
    });
  }

  function handleLeave() {
    setStyle({
      transform: "perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)",
      transition: "transform 450ms cubic-bezier(0.2, 0.7, 0.2, 1)",
    });
    setSheen({ opacity: 0, transition: "opacity 300ms linear" });
  }

  return (
    <div
      ref={frameRef}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      style={{ position: "absolute", inset: 0, cursor: "crosshair", touchAction: "none" }}
      aria-hidden
    >
      <div style={{ position: "absolute", inset: 0, willChange: "transform", ...style }}>
        {children}
        <span style={{ position: "absolute", inset: 0, pointerEvents: "none", mixBlendMode: "soft-light", ...sheen }} />
      </div>
    </div>
  );
}
