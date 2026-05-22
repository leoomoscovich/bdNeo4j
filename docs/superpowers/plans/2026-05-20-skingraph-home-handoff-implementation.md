# SkinGraph Home Handoff Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `/` so it closely matches `handoff/design_handoff_home` while preserving the existing operational app at `/dashboard`.

**Architecture:** Keep `app/page.tsx` as a thin home assembler and implement each editorial section as a focused React component in `components/home/`. Copy the prototype assets into `public/home/`, isolate home CSS from dashboard CSS, and implement lightweight client interactions only where the prototype requires state.

**Tech Stack:** Next.js App Router, React, TypeScript, global CSS/Tailwind runtime, `next/image`, SVG, CSS animations, browser timers, `IntersectionObserver`.

---

## File Structure

- Modify: `app/page.tsx`
  - Assemble the final home section order.
- Modify: `app/layout.tsx`
  - Keep existing fonts; only adjust metadata if needed.
- Modify: `app/globals.css`
  - Add/replace home-specific styles. Do not break dashboard styles.
- Create or replace: `components/home/home-data.ts`
  - Static typed data for KPIs, signals, spreads, graph nodes, graph edges, risks, observatory items, layers, desk tiles.
- Create: `components/home/HomeClientEffects.tsx`
  - Client wrapper for reveal-on-scroll and reduced-motion class support.
- Modify: `components/home/HomeHero.tsx`
  - Match prototype hero/nav and link CTAs to real destinations.
- Modify: `components/home/MastheadStrip.tsx`
  - Clock formatted as `HH:MM ART`.
- Modify: `components/home/StatementSection.tsx`
  - Editorial statement, rail, registration marks and KPI counters.
- Modify: `components/home/SignalsSection.tsx`
  - Six signal cards, mini visualizations and spread report.
- Create: `components/home/RelationsSection.tsx`
  - SVG graph, selected node state and inspector.
- Modify: `components/home/RiesgoSection.tsx`
  - Inverted risk section with four cards.
- Modify: `components/home/InterludeSection.tsx`
  - Observatorio image cards using `public/home/*`.
- Modify: `components/home/CapasSection.tsx`
  - Sticky image plate and nine layers.
- Modify: `components/home/DeskSection.tsx`
  - Six dashboard instruments with SVG/list previews.
- Modify: `components/home/CierreSection.tsx`
  - Final CTA and footer.
- Copy assets into: `public/home/`
  - `hero.png`, `exploded.jpg`, `karambit-emerald.webp`, `butterfly-doppler.png`, `karambit-fire-pov.jpg`.

Do not commit during this implementation. The user explicitly asked to wait until the home is perfect.

---

## Task 1: Move Prototype Assets Into Public Home Folder

**Files:**
- Create directory: `public/home/`
- Copy from: `handoff/design_handoff_home/prototype/assets/*`
- Create/modify: no TypeScript files in this task

- [ ] **Step 1: Verify asset source exists**

Run:

```powershell
Test-Path -LiteralPath "handoff\design_handoff_home\prototype\assets"
```

Expected: `True`.

- [ ] **Step 2: Create public asset directory**

Run:

```powershell
if (-not (Test-Path -LiteralPath "public")) { throw "public directory missing" }; if (-not (Test-Path -LiteralPath "public\home")) { New-Item -ItemType Directory -Path "public\home" }
```

Expected: `public/home` exists.

- [ ] **Step 3: Copy the five handoff assets**

Run:

```powershell
Copy-Item -LiteralPath "handoff\design_handoff_home\prototype\assets\hero.png" -Destination "public\home\hero.png" -Force; Copy-Item -LiteralPath "handoff\design_handoff_home\prototype\assets\exploded.jpg" -Destination "public\home\exploded.jpg" -Force; Copy-Item -LiteralPath "handoff\design_handoff_home\prototype\assets\karambit-emerald.webp" -Destination "public\home\karambit-emerald.webp" -Force; Copy-Item -LiteralPath "handoff\design_handoff_home\prototype\assets\butterfly-doppler.png" -Destination "public\home\butterfly-doppler.png" -Force; Copy-Item -LiteralPath "handoff\design_handoff_home\prototype\assets\karambit-fire-pov.jpg" -Destination "public\home\karambit-fire-pov.jpg" -Force
```

Expected: all five files are available under `/home/<filename>` at runtime.

---

## Task 2: Add Typed Home Data

**Files:**
- Create: `components/home/home-data.ts`

- [ ] **Step 1: Create `components/home/home-data.ts` with all static data**

Use this structure and content:

```ts
export type HomeKpi = { label: string; value: string; numericValue: number; suffix?: string };
export type HomeSignal = { num: string; title: string; copy: string; metricLabel: string; metric: string; variant: "spark" | "dist" | "float" | "stickers" | "liquidity" | "venues" };
export type SpreadRow = { skin: string; wear: string; csfloat: string; buff: string; skinport: string; spread: string; signal: string; hot?: boolean };
export type GraphNode = { id: string; type: "buyer" | "trader" | "skin" | "market" | "tx"; x: number; y: number; label: string; title: string; meta: [string, string][] };
export type GraphEdge = { id: string; from: string; to: string; hot?: boolean };
export type RiskCard = { num: string; label: string; title: string; copy: string; stats: [string, string][]; variant: "cycle" | "outlier" | "reappear" | "indirect" };
export type ObservatoryItem = { name: string; meta: string; image: string; price: string; delta: string; contain?: boolean };
export type LayerItem = { num: string; title: string; desc: string };
export type DeskTile = { num: string; label: string; status: string; title: string; variant: "market" | "cycles" | "graph" | "traders" | "watchlist" | "compare"; wide?: boolean };

export const homeKpis: HomeKpi[] = [
  { label: "Skins observadas", value: "412.918", numericValue: 412918 },
  { label: "Transacciones diarias", value: "87.4K", numericValue: 87400 },
  { label: "Marketplaces conectados", value: "06", numericValue: 6 },
  { label: "Latencia de actualización", value: "38", numericValue: 38, suffix: "s" },
];

export const homeSignals: HomeSignal[] = [
  { num: "S/01", title: "Spreads entre marketplaces", copy: "Diferencia entre el mejor precio listado y el mejor precio de compra, ajustada por fees y tiempo de venta esperado.", metricLabel: "Δ promedio", metric: "+11,8%", variant: "spark" },
  { num: "S/02", title: "Skins por debajo del precio esperado", copy: "Listados desviados de la mediana ponderada. Filtramos ofertas legítimas de listados que esconden urgencia o señal.", metricLabel: "Outliers hoy", metric: "182", variant: "dist" },
  { num: "S/03", title: "Premium por float", copy: "Sobreprecio que paga el mercado por floats raros sobre el rango de referencia. Cuando se desborda, suele anticipar movimiento.", metricLabel: "FN extremo", metric: "+34,2%", variant: "float" },
  { num: "S/04", title: "Premium por stickers", copy: "Combinaciones específicas pueden mover la demanda más que la skin base. El radar separa señal de decoración.", metricLabel: "4× raros", metric: "+61%", variant: "stickers" },
  { num: "S/05", title: "Liquidez relativa", copy: "Volumen listado frente a ventas recientes. Identifica piezas que parecen líquidas pero no encuentran salida real.", metricLabel: "Profundidad", metric: "−18%", variant: "liquidity" },
  { num: "S/06", title: "Dispersión de venues", copy: "Diferencias sostenidas entre CSFloat, BUFF163 y Skinport. Mide ineficiencias antes de que se cierren.", metricLabel: "Venue gap", metric: "±4,2%", variant: "venues" },
];

export const spreadRows: SpreadRow[] = [
  { skin: "AK-47 │ Voltaic", wear: "FN 0.018", csfloat: "$1.842", buff: "$1.920", skinport: "$1.780", spread: "+14,4%", signal: "spread", hot: true },
  { skin: "Karambit │ Emerald", wear: "FN 0.012", csfloat: "$2.940", buff: "$3.104", skinport: "$2.812", spread: "+12,6%", signal: "venue gap", hot: true },
  { skin: "Butterfly │ Doppler", wear: "MW 0.094", csfloat: "$1.610", buff: "$1.676", skinport: "$1.555", spread: "+7,2%", signal: "liquidez" },
  { skin: "M4A1-S │ Printstream", wear: "FT 0.211", csfloat: "$438", buff: "$462", skinport: "$421", spread: "+9,8%", signal: "float" },
  { skin: "AWP │ Fade", wear: "FN 0.031", csfloat: "$1.220", buff: "$1.292", skinport: "$1.198", spread: "+10,1%", signal: "outlier", hot: true },
  { skin: "USP-S │ Kill Confirmed", wear: "MW 0.082", csfloat: "$162", buff: "$171", skinport: "$154", spread: "+8,4%", signal: "watch" },
];

export const graphNodes: GraphNode[] = [
  { id: "B-204", type: "buyer", x: 110, y: 110, label: "B", title: "Comprador recurrente", meta: [["ID", "B-204"], ["Transacciones", "47"], ["Volumen", "$84.2K"], ["Riesgo", "medio"], ["Última actividad", "hace 18 min"]] },
  { id: "T-118", type: "trader", x: 290, y: 88, label: "T", title: "Trader puente", meta: [["ID", "T-118"], ["Conecta", "6 compradores"], ["Spread medio", "+11.8%"], ["Ruta caliente", "sí"], ["Región", "EU"]] },
  { id: "S-AK", type: "skin", x: 470, y: 142, label: "AK", title: "AK-47 Voltaic", meta: [["Float", "0.0184"], ["Stickers", "4× raros"], ["Última venta", "$1.789"], ["Listado", "$1.842"], ["Señal", "premium"]] },
  { id: "M-CSF", type: "market", x: 635, y: 90, label: "C", title: "CSFloat", meta: [["Venue", "CSFloat"], ["Precio", "$1.842"], ["Profundidad", "alta"], ["Fee", "2.0%"], ["Estado", "activo"]] },
  { id: "TX-91", type: "tx", x: 210, y: 245, label: "", title: "Transacción TX-91", meta: [["Monto", "$1.610"], ["Skin", "Butterfly Doppler"], ["Hace", "42 min"], ["Venue", "BUFF163"], ["Señal", "ruta"]] },
  { id: "B-441", type: "buyer", x: 370, y: 300, label: "B", title: "Comprador conectado", meta: [["ID", "B-441"], ["Transacciones", "19"], ["Cluster", "C-07"], ["Riesgo", "alto"], ["Reaparición", "3 veces"]] },
  { id: "M-BUF", type: "market", x: 585, y: 310, label: "B", title: "BUFF163", meta: [["Venue", "BUFF163"], ["Precio", "$1.920"], ["Diferencia", "+4.2%"], ["Profundidad", "media"], ["Estado", "activo"]] },
  { id: "T-309", type: "trader", x: 145, y: 430, label: "T", title: "Trader de salida", meta: [["ID", "T-309"], ["Ventas", "31"], ["Conexión", "indirecta"], ["Ciclo", "observado"], ["Riesgo", "medio"]] },
  { id: "S-KARA", type: "skin", x: 410, y: 450, label: "K", title: "Karambit Emerald", meta: [["Float", "0.012"], ["Precio", "$2.940"], ["Spread", "+12.6%"], ["Venue", "Skinport"], ["Señal", "outlier"]] },
];

export const graphEdges: GraphEdge[] = [
  { id: "e1", from: "B-204", to: "T-118", hot: true },
  { id: "e2", from: "T-118", to: "S-AK", hot: true },
  { id: "e3", from: "S-AK", to: "M-CSF", hot: true },
  { id: "e4", from: "T-118", to: "TX-91" },
  { id: "e5", from: "TX-91", to: "B-441", hot: true },
  { id: "e6", from: "B-441", to: "M-BUF", hot: true },
  { id: "e7", from: "B-441", to: "S-KARA" },
  { id: "e8", from: "T-309", to: "B-204" },
  { id: "e9", from: "T-309", to: "S-KARA" },
  { id: "e10", from: "M-BUF", to: "S-AK" },
];

export const riskCards: RiskCard[] = [
  { num: "R/01", label: "Ciclo cerrado", title: "La pieza vuelve al origen", copy: "Cuatro operaciones forman una ruta circular. El radar marca el patrón para revisión, sin asumir intención.", variant: "cycle", stats: [["nodos", "04"], ["tiempo", "18 h"], ["riesgo", "78"]] },
  { num: "R/02", label: "Precio anómalo", title: "Una venta sale del rango", copy: "El valor publicado queda fuera de la banda esperada por float, stickers y liquidez reciente.", variant: "outlier", stats: [["desvío", "+31%"], ["mediana", "$1.42K"], ["riesgo", "71"]] },
  { num: "R/03", label: "Reaparición", title: "La misma instancia reaparece", copy: "Una instancia específica cruza venues con intervalos cortos y compradores relacionados.", variant: "reappear", stats: [["veces", "03"], ["venues", "02"], ["riesgo", "69"]] },
  { num: "R/04", label: "Conexión indirecta", title: "Dos rutas comparten puente", copy: "Compradores sin vínculo directo convergen en un trader intermedio y repiten familia de skins.", variant: "indirect", stats: [["saltos", "02"], ["cluster", "C-07"], ["riesgo", "74"]] },
];

export const observatoryItems: ObservatoryItem[] = [
  { name: "AK-47 │ Voltaic", meta: "FN 0.018 · 4× sticker", image: "/home/hero.png", price: "$1.842", delta: "+14,4%" },
  { name: "Karambit │ Emerald", meta: "FN 0.012", image: "/home/karambit-emerald.webp", price: "$2.940", delta: "+12,6%", contain: true },
  { name: "Butterfly │ Doppler", meta: "MW 0.094", image: "/home/butterfly-doppler.png", price: "$1.610", delta: "+7,2%", contain: true },
  { name: "Karambit │ Fire Serpent", meta: "FT 0.221", image: "/home/karambit-fire-pov.jpg", price: "$612", delta: "+11,4%" },
];

export const layerItems: LayerItem[] = [
  { num: "L/01", title: "Skin base", desc: "La composición visual del item: colección, rareza, arma y demanda histórica." },
  { num: "L/02", title: "Instancia concreta", desc: "El item específico con su float, seed, stickers y recorrido propio." },
  { num: "L/03", title: "Float", desc: "El desgaste real modifica el rango de precio y el universo de compradores." },
  { num: "L/04", title: "Stickers", desc: "Combinaciones, posición y rareza pueden pesar más que el precio base." },
  { num: "L/05", title: "Historial", desc: "Quién la tuvo, cuándo cambió de manos y por qué venue circuló." },
  { num: "L/06", title: "Marketplace", desc: "Cada venue tiene liquidez, fees y asimetrías de precio distintas." },
  { num: "L/07", title: "Comprador", desc: "Coleccionista, trader o especulador: cada perfil deja una firma." },
  { num: "L/08", title: "Ruta de transacciones", desc: "El grafo revela si una pieza circula o vuelve sobre sí misma." },
  { num: "L/09", title: "Riesgo", desc: "Ciclos, reapariciones y conexiones indirectas se marcan como señales para revisar." },
];

export const deskTiles: DeskTile[] = [
  { num: "I/01", label: "Market Radar", status: "activo", title: "Spreads y presión de precio", variant: "market", wide: true },
  { num: "I/02", label: "Risk Cycles", status: "revisión", title: "Rutas que vuelven sobre sí mismas", variant: "cycles" },
  { num: "I/03", label: "Graph Explorer", status: "en vivo", title: "Explorar compradores y venues", variant: "graph" },
  { num: "I/04", label: "Traders", status: "cluster", title: "Perfiles con rutas repetidas", variant: "traders" },
  { num: "I/05", label: "Watchlist", status: "local", title: "Piezas observadas por señal", variant: "watchlist" },
  { num: "I/06", label: "Compare", status: "spread", title: "Tres venues sobre la misma pieza", variant: "compare", wide: true },
];
```

- [ ] **Step 2: Run TypeScript/build later**

No standalone test exists yet. This file is verified when components import it and `npm run build` passes.

---

## Task 3: Add Home Client Effects

**Files:**
- Create: `components/home/HomeClientEffects.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Create `HomeClientEffects.tsx`**

```tsx
"use client";

import { useEffect } from "react";

export function HomeClientEffects() {
  useEffect(() => {
    const root = document.documentElement;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

    function syncMotion() {
      root.classList.toggle("home-reduced-motion", reduce.matches);
    }

    syncMotion();
    reduce.addEventListener("change", syncMotion);

    const revealItems = Array.from(document.querySelectorAll<HTMLElement>(".home-reveal"));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -12% 0px" }
    );

    revealItems.forEach((item) => observer.observe(item));

    return () => {
      reduce.removeEventListener("change", syncMotion);
      observer.disconnect();
      root.classList.remove("home-reduced-motion");
    };
  }, []);

  return null;
}
```

- [ ] **Step 2: Import and render the effects once in `app/page.tsx`**

Expected shape:

```tsx
import { HomeClientEffects } from "@/components/home/HomeClientEffects";

export default function HomePage() {
  return (
    <main className="home-page">
      <HomeClientEffects />
      {/* existing home sections */}
    </main>
  );
}
```

---

## Task 4: Rebuild Hero and Masthead

**Files:**
- Modify: `components/home/HomeHero.tsx`
- Modify: `components/home/MastheadStrip.tsx`

- [ ] **Step 1: Replace `HomeHero.tsx` with prototype-aligned markup**

```tsx
import Image from "next/image";
import Link from "next/link";

export function HomeHero() {
  return (
    <header className="home-hero" data-screen-label="01 Hero">
      <nav className="home-topnav" aria-label="Navegación pública de SkinGraph">
        <Link href="/" className="home-brand" aria-label="SkinGraph Radar inicio">
          <span className="home-brand__mark">SG</span>
          <span className="home-brand__name">SkinGraph Radar</span>
        </Link>
        <div className="home-topnav__right">
          <a className="home-topnav__link" href="#senales">Preview</a>
          <Link className="home-btn home-btn--red home-btn--sm" href="/dashboard">Dashboard</Link>
        </div>
      </nav>
      <div className="home-hero__media">
        <Image src="/home/hero.png" alt="AK-47 Voltaic observada por SkinGraph Radar" fill priority sizes="100vw" />
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Replace `MastheadStrip.tsx` clock format**

```tsx
"use client";

import { useEffect, useState } from "react";

function formatArtTime() {
  return `${new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })} ART`;
}

export function MastheadStrip() {
  const [time, setTime] = useState("--:-- ART");

  useEffect(() => {
    setTime(formatArtTime());
    const interval = window.setInterval(() => setTime(formatArtTime()), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <section className="home-masthead" aria-label="Masthead">
      <div className="home-masthead__inner">
        <div className="home-masthead__col">
          <span className="home-mono home-mono--muted">Vol. 04</span>
          <span className="home-mono home-mono--muted">Boletín de mercado</span>
        </div>
        <div className="home-masthead__col home-masthead__col--center">
          <span className="home-mono home-mono--muted">SkinGraph Radar · Inteligencia de mercado · CS2</span>
        </div>
        <div className="home-masthead__col home-masthead__col--right">
          <span className="home-mono"><span className="home-dot home-dot--live" /> En vivo</span>
          <span className="home-mono home-mono--muted">{time}</span>
        </div>
      </div>
    </section>
  );
}
```

---

## Task 5: Statement Section With Counters

**Files:**
- Modify: `components/home/StatementSection.tsx`

- [ ] **Step 1: Replace `StatementSection.tsx`**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { homeKpis } from "./home-data";

function formatCounter(value: number, target: string) {
  if (target.includes("K")) return `${(value / 1000).toFixed(1)}K`;
  if (target.length === 2) return String(value).padStart(2, "0");
  return new Intl.NumberFormat("de-DE").format(value);
}

function CounterValue({ value, target, suffix = "" }: { value: number; target: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [display, setDisplay] = useState(target);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      const start = performance.now();
      const duration = 1100;
      const tick = (now: number) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplay(formatCounter(Math.round(value * eased), target));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      observer.disconnect();
    }, { threshold: 0.4 });

    observer.observe(node);
    return () => observer.disconnect();
  }, [target, value]);

  return <span ref={ref} className="home-kv__v">{display}<span className="home-kv__unit">{suffix}</span></span>;
}

export function StatementSection() {
  return (
    <section id="declaracion" className="home-section home-section--statement home-reveal" data-screen-label="02 Declaración">
      <span className="home-reg home-reg--tl" aria-hidden="true" />
      <span className="home-reg home-reg--tr" aria-hidden="true" />
      <div className="home-grid">
        <div className="home-rail"><span className="home-rail__num">01</span><span className="home-rail__label">Declaración</span></div>
        <h1 className="home-statement">El precio<br />es solo la<br /><em>superficie</em>.</h1>
        <aside className="home-statement__aside">
          <p className="home-statement__lede">Una skin no se entiende únicamente por su precio. También importan el <u>comprador</u>, el <u>marketplace</u>, el historial de transacciones, el float, los stickers, la liquidez, el timing y las rutas entre traders.</p>
          <p className="home-statement__sig home-mono">— Mesa de análisis · SkinGraph Radar</p>
        </aside>
      </div>
      <div className="home-statement__data">
        {homeKpis.map((kpi) => (
          <div className="home-kv" key={kpi.label}>
            <span className="home-kv__k home-mono">{kpi.label}</span>
            <CounterValue value={kpi.numericValue} target={kpi.value} suffix={kpi.suffix} />
          </div>
        ))}
      </div>
    </section>
  );
}
```

---

## Task 6: Signals and Spread Report

**Files:**
- Modify: `components/home/SignalsSection.tsx`

- [ ] **Step 1: Replace `SignalsSection.tsx`**

Implement signal cards from `homeSignals`, a local `SignalViz` switch, and a client timer for report freshness. Keep all classes prefixed `home-`.

```tsx
"use client";

import { useEffect, useState } from "react";
import { homeSignals, spreadRows, type HomeSignal } from "./home-data";

function SignalViz({ signal }: { signal: HomeSignal }) {
  if (signal.variant === "spark" || signal.variant === "liquidity") {
    return <svg className="home-spark" viewBox="0 0 200 40" preserveAspectRatio="none" aria-hidden="true"><polyline points="0,28 14,24 28,30 42,18 56,22 70,12 84,17 98,9 112,14 126,7 140,11 154,5 168,8 182,4 200,6" /></svg>;
  }
  if (signal.variant === "dist") {
    return <div className="home-dist" aria-hidden="true">{[.25,.45,.7,.95,.62,.4,.22].map((h, i) => <span key={i} className={i === 3 ? "is-red" : ""} style={{ "--h": h } as React.CSSProperties} />)}</div>;
  }
  if (signal.variant === "float") {
    return <div className="home-floatbar" aria-hidden="true"><span /><i style={{ left: "6%" }} /><i className="is-red" style={{ left: "2.8%" }} /></div>;
  }
  if (signal.variant === "stickers") {
    return <div className="home-stickers" aria-hidden="true">{[0,1,2,3].map((i) => <span key={i} className={i === 2 ? "is-red" : ""} />)}</div>;
  }
  return <div className="home-venues" aria-hidden="true"><span style={{ "--w": "82%" } as React.CSSProperties}>CSFLOAT</span><span style={{ "--w": "96%" } as React.CSSProperties}>BUFF163</span><span style={{ "--w": "68%" } as React.CSSProperties}>SKINPORT</span></div>;
}

export function SignalsSection() {
  const [seconds, setSeconds] = useState(12);

  useEffect(() => {
    const interval = window.setInterval(() => setSeconds((current) => current >= 119 ? 12 : current + 1), 1000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <section id="senales" className="home-section home-section--signals home-reveal" data-screen-label="03 Señales de mercado">
      <span className="home-reg home-reg--tl" aria-hidden="true" />
      <span className="home-reg home-reg--tr" aria-hidden="true" />
      <header className="home-section__head home-grid">
        <div className="home-rail"><span className="home-rail__num">02</span><span className="home-rail__label">Señales de mercado</span></div>
        <div className="home-section__title-wrap"><h2 className="home-section__title">Lo que el radar observa <em>en este momento</em>.</h2><p className="home-section__dek">Seis tipos de señales recorren el mercado en paralelo. Cada una se mide, se compara entre marketplaces y se cruza con la red de compradores.</p></div>
      </header>
      <ol className="home-signals">
        {homeSignals.map((signal) => <li className="home-signal" key={signal.num}><div className="home-signal__num home-mono">{signal.num}</div><h3 className="home-signal__title">{signal.title}</h3><p className="home-signal__copy">{signal.copy}</p><div className="home-signal__viz"><SignalViz signal={signal} /><div className="home-signal__metric"><span className="home-mono home-mono--muted">{signal.metricLabel}</span><strong>{signal.metric}</strong></div></div></li>)}
      </ol>
      <div className="home-report">
        <header><strong>Reporte 04·12 · Spreads entre marketplaces</strong><span className="home-mono home-mono--muted">Actualizado hace {seconds} s</span></header>
        <div className="home-report__table" role="table" aria-label="Reporte de spreads entre marketplaces">
          <div className="home-report__row home-report__row--head" role="row"><span>Skin</span><span>Wear</span><span>CSFloat</span><span>BUFF163</span><span>Skinport</span><span>Spread</span><span>Señal</span></div>
          {spreadRows.map((row) => <div className="home-report__row" role="row" key={`${row.skin}-${row.wear}`}><span>{row.skin}</span><span>{row.wear}</span><span>{row.csfloat}</span><span>{row.buff}</span><span>{row.skinport}</span><span className={row.hot ? "is-hot" : ""}>{row.spread}</span><span><b>{row.signal}</b></span></div>)}
        </div>
      </div>
    </section>
  );
}
```

---

## Task 7: Add Interactive Relations Graph

**Files:**
- Create: `components/home/RelationsSection.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Create `RelationsSection.tsx`**

Use `graphNodes` and `graphEdges`; render an SVG with clickable buttons/foreignObject avoided. Use SVG groups with `role="button"`, `tabIndex={0}`, `onClick`, `onKeyDown`.

```tsx
"use client";

import { useMemo, useState } from "react";
import { graphEdges, graphNodes, type GraphNode } from "./home-data";

const nodeById = new Map(graphNodes.map((node) => [node.id, node]));

function nodeClass(type: GraphNode["type"]) {
  return `home-network__node home-network__node--${type}`;
}

export function RelationsSection() {
  const [selectedId, setSelectedId] = useState(graphNodes[0].id);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const selected = nodeById.get(selectedId) ?? graphNodes[0];
  const activeId = hoveredId ?? selectedId;

  const connected = useMemo(() => new Set(graphEdges.filter((edge) => edge.from === activeId || edge.to === activeId).flatMap((edge) => [edge.from, edge.to])), [activeId]);

  return (
    <section id="relaciones" className="home-section home-section--relations home-reveal" data-screen-label="04 Relaciones">
      <header className="home-section__head home-grid"><div className="home-rail"><span className="home-rail__num">03</span><span className="home-rail__label">Relaciones</span></div><div className="home-section__title-wrap"><h2 className="home-section__title"><em>Cuando los compradores se repiten</em>, el mercado empieza a mostrar patrones.</h2><p className="home-section__dek">El radar cruza compradores, traders, instancias, transacciones y venues para reconstruir rutas que el precio aislado no muestra.</p></div></header>
      <div className="home-relations__body">
        <svg className="home-network" viewBox="0 0 760 540" role="img" aria-label="Grafo de relaciones entre compradores, traders, skins y marketplaces">
          <defs><radialGradient id="hotGlow" cx="50%" cy="45%" r="65%"><stop offset="0%" stopColor="rgba(238,46,46,.20)" /><stop offset="100%" stopColor="rgba(238,46,46,0)" /></radialGradient></defs>
          <rect width="760" height="540" fill="url(#hotGlow)" />
          {graphEdges.map((edge) => { const from = nodeById.get(edge.from)!; const to = nodeById.get(edge.to)!; const dim = activeId && !connected.has(edge.from) && !connected.has(edge.to); return <line key={edge.id} className={`home-network__edge ${edge.hot ? "is-hot" : ""} ${dim ? "is-dim" : ""}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y} />; })}
          {graphNodes.map((node) => { const dim = activeId && node.id !== activeId && !connected.has(node.id); return <g key={node.id} className={`${nodeClass(node.type)} ${selectedId === node.id ? "is-selected" : ""} ${dim ? "is-dim" : ""}`} transform={`translate(${node.x} ${node.y})`} role="button" tabIndex={0} aria-label={`Seleccionar ${node.title}`} onClick={() => setSelectedId(node.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") setSelectedId(node.id); }} onMouseEnter={() => setHoveredId(node.id)} onMouseLeave={() => setHoveredId(null)}>{node.type === "market" ? <rect x="-15" y="-15" width="30" height="30" transform="rotate(45)" /> : <circle r={node.type === "tx" ? 6 : node.type === "skin" ? 24 : 21} />}<text textAnchor="middle" dominantBaseline="central">{node.label}</text></g>; })}
        </svg>
        <aside className="home-inspector"><p className="home-mono home-mono--muted">INSPECTOR · {selected.id}</p><h3>{selected.title}</h3><dl>{selected.meta.map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl><p>La selección no acusa: ordena señales para que el analista revise rutas, precios y contexto.</p></aside>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Insert `RelationsSection` in `app/page.tsx` after `SignalsSection`**

```tsx
import { RelationsSection } from "@/components/home/RelationsSection";

// ...
<SignalsSection />
<RelationsSection />
<RiesgoSection />
```

---

## Task 8: Complete Risk, Observatory, Layers, Desk and Closing Sections

**Files:**
- Modify: `components/home/RiesgoSection.tsx`
- Modify: `components/home/InterludeSection.tsx`
- Modify: `components/home/CapasSection.tsx`
- Modify: `components/home/DeskSection.tsx`
- Modify: `components/home/CierreSection.tsx`

- [ ] **Step 1: Replace each simplified component with data-driven editorial markup**

Use imports from `home-data.ts`. Required class roots:

```tsx
// RiesgoSection root
<section id="riesgo" className="home-section home-section--risk home-reveal">

// InterludeSection root
<section id="observatorio" className="home-observatory home-reveal">

// CapasSection root
<section id="capas" className="home-section home-section--layers home-reveal">

// DeskSection root
<section id="mesa" className="home-section home-section--desk home-reveal">

// CierreSection root
<section id="cierre" className="home-section home-section--closing home-reveal">
```

Required behavior:

- Risk cards render all four `riskCards` and never use the word `fraude`.
- Observatory renders all four `observatoryItems` with `Image` from `next/image`.
- Layers uses `/home/exploded.jpg`, caption `AK-47 │ Voltaic · FN 0.018 · 4× sticker`, and all nine `layerItems`.
- Desk renders all six `deskTiles` with small SVG/list/bar previews.
- Closing includes `Link href="/dashboard"` with text `Abrir dashboard` and a footer line `SkinGraph Radar — observamos precios, conectamos compradores, marcamos rutas.`

- [ ] **Step 2: Verify no English copy remains in these sections**

Search:

```powershell
rg "Open Dashboard|Follow the graph|Every trade|Buyer Network|Risk Cycles|Market Radar" components\home app\page.tsx
```

Expected: no matches, except `Market Radar` is allowed only as an instrument label if intentionally kept as product workspace name.

---

## Task 9: Replace Home CSS With Handoff-Aligned Styles

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Append a new isolated home CSS block at the end of `app/globals.css`**

Add a block headed:

```css
/* ── Public Home / Handoff Editorial Redesign ───────────────── */
```

The block must define these selectors and responsive states:

```css
.home-page { ... }
.home-page :where(button, a) { ... }
.home-mono { ... }
.home-section { ... }
.home-grid { ... }
.home-rail { ... }
.home-reg { ... }
.home-reveal { ... }
.home-reveal.is-in { ... }
.home-hero, .home-topnav, .home-brand, .home-hero__media { ... }
.home-masthead, .home-masthead__inner { ... }
.home-statement, .home-statement__aside, .home-statement__data, .home-kv { ... }
.home-signals, .home-signal, .home-report, .home-report__row { ... }
.home-network, .home-network__edge, .home-network__node, .home-inspector { ... }
.home-section--risk, .home-risk-grid, .home-risk-card { ... }
.home-observatory, .home-observatory__grid, .home-ob-card { ... }
.home-section--layers, .home-layers-layout, .home-layer { ... }
.home-section--desk, .home-desk, .home-desk-tile { ... }
.home-section--closing, .home-footer { ... }
@media (max-width: 980px) { ... }
@media (max-width: 640px) { ... }
@media (prefers-reduced-motion: reduce) { ... }
.home-reduced-motion * { ... }
```

Key values:

- `.home-page` uses `background: var(--paper); color: var(--ink); font-family: var(--font-sans)`.
- `.home-section` uses vertical padding `clamp(80px, 9vw, 140px)`.
- `.home-grid` uses `grid-template-columns: 120px minmax(0, 1fr)` on desktop.
- `.home-section--risk` uses `background: var(--inv-bg); color: var(--inv-fg)`.
- `.home-statement` uses `font-family: var(--font-serif); font-size: clamp(72px, 11vw, 200px); line-height: .92`.
- `.home-section__title` uses `font-size: clamp(40px, 5.4vw, 88px)`.
- `.home-signals` is a 3-column grid on desktop, 2-column on tablet, 1-column on mobile.
- `.home-report__row` uses a seven-column grid on desktop and horizontal overflow on mobile.
- `.home-network__edge.is-hot` uses red dashed animated stroke.
- All animation selectors must be disabled under reduced motion.

- [ ] **Step 2: Remove or override old conflicting home classes if needed**

Search:

```powershell
rg "\.section|\.brand|\.masthead|\.statement|\.signals|\.signal|\.desk|\.layer" app\globals.css
```

Expected: old dashboard classes can remain, but final home components should use `home-*` classes so old generic home styles do not affect the new home.

---

## Task 10: Verify Routes, Build and Visual Behavior

**Files:**
- No planned source changes unless verification finds issues.

- [ ] **Step 1: Run lint**

Run:

```bash
npm run lint
```

Expected: exits successfully with no ESLint errors.

- [ ] **Step 2: Run production build**

Run:

```bash
npm run build
```

Expected: exits successfully with no TypeScript, Next.js or route errors.

- [ ] **Step 3: Start dev server for manual smoke**

Run:

```bash
npm run dev
```

Expected: local server starts, usually at `http://localhost:3000`.

- [ ] **Step 4: Manually verify home**

Open `http://localhost:3000` and verify:

- Hero image loads.
- Masthead clock shows `ART`.
- Scroll shows all ten narrative sections in the approved order.
- Signal cards, report table, graph inspector, risk cards, observatory, layers, desk and closing are visible.
- `Dashboard` and `Abrir dashboard` navigate to `/dashboard`.

- [ ] **Step 5: Manually verify dashboard was not broken**

Open `http://localhost:3000/dashboard` and verify:

- Sidebar/topbar render.
- Workspaces still switch.
- Dark operational UI still uses original dashboard styling.

- [ ] **Step 6: Fix any lint/build/manual issues before reporting completion**

If lint/build/manual verification fails, fix the exact issue and rerun the failing verification command. Do not claim completion until `npm run lint` and `npm run build` pass.

---

## Self-Review

- Spec coverage: routes, visual direction, assets, data, interactions, accessibility, dashboard preservation and verification are covered.
- Placeholder scan: no implementation step depends on an undefined future task. The CSS task intentionally defines required selectors and exact behavioral values instead of pasting a 1000-line CSS block.
- Type consistency: all data types are defined in Task 2 and referenced by later tasks with matching names.
- User preference: no commit steps are included because the user asked to wait until the home is perfect.
