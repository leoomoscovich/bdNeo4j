# SkinGraph Home Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a new cinematic white/red public home at `/`, move the current operational app to `/dashboard`, and prepare a PNG scroll-sequence animation pipeline with temporary frame visuals.

**Architecture:** Keep the existing Next.js App Router project. Extract the current `app/page.tsx` dashboard code into a route-specific dashboard page, then make `app/page.tsx` render a new public home composed from focused `components/home/*` components. The home stays mostly static/client-light except for `ScrollSequence` and the mini preview tabs.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind/global CSS, Framer Motion already present, browser scroll APIs, local image assets under `public/animation/home-sequence/`.

---

## File Structure

- Create: `app/dashboard/page.tsx`
  - Holds the current dashboard code that currently lives in `app/page.tsx`.
- Replace: `app/page.tsx`
  - Renders the new public home.
- Create: `components/home/HomeHero.tsx`
  - Public nav, hero copy, CTAs, and sequence container.
- Create: `components/home/ScrollSequence.tsx`
  - Client component for auto intro plus scroll-controlled frame progression.
- Create: `components/home/StorySection.tsx`
  - Reusable narrative section component.
- Create: `components/home/BuyerNetworkPreview.tsx`
  - Client component with tabs for `Buyer Network`, `Risk Cycles`, and `Market Radar`.
- Create: `components/home/HomeCta.tsx`
  - Final conversion section.
- Modify: `app/globals.css`
  - Add home-specific CSS classes without breaking the current dashboard classes.
- Optional create: `public/animation/home-sequence/.gitkeep`
  - Keeps the target folder visible until real PNG files are added. If the environment does not preserve empty folders, skip this file and keep the folder convention documented.

---

## Task 1: Move Current Dashboard to `/dashboard`

**Files:**
- Create: `app/dashboard/page.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Copy the existing dashboard page into `app/dashboard/page.tsx`**

Create `app/dashboard/page.tsx` with the complete current contents of `app/page.tsx`. The first lines must remain:

```tsx
"use client";

/* eslint-disable react-hooks/set-state-in-effect -- Initial hydration from localStorage and latest scan API happens after mount. */
```

Keep the component export as:

```tsx
export default function DashboardPage() {
```

Change only the function name from `Home` to `DashboardPage`; keep all imports, state, handlers, workspace rendering, and `AppShell` usage intact.

- [ ] **Step 2: Temporarily make `/` redirect-like by rendering a simple link while home files are not ready**

Replace `app/page.tsx` with:

```tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="home-page home-page-minimal">
      <section className="home-minimal-card">
        <p className="home-kicker">SkinGraph Radar</p>
        <h1>Every trade leaves a trace.</h1>
        <p>
          La nueva home se implementa en los siguientes pasos. El dashboard operativo ya vive en /dashboard.
        </p>
        <Link className="home-primary-link" href="/dashboard">
          Open Dashboard
        </Link>
      </section>
    </main>
  );
}
```

- [ ] **Step 3: Add minimal CSS for the temporary home state**

Append to `app/globals.css`:

```css
.home-page-minimal {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 32px;
  background: #fff7f7;
  color: #160708;
}

.home-minimal-card {
  width: min(720px, 100%);
  padding: 48px;
  border: 1px solid rgba(220, 38, 38, 0.18);
  border-radius: 32px;
  background: #ffffff;
  box-shadow: 0 32px 90px rgba(127, 29, 29, 0.12);
}

.home-minimal-card h1 {
  margin: 12px 0;
  font-size: clamp(48px, 8vw, 92px);
  line-height: 0.9;
  letter-spacing: -0.08em;
}

.home-minimal-card p {
  color: #5f1f24;
  line-height: 1.7;
}

.home-kicker {
  margin: 0;
  color: #dc2626;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.home-primary-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 46px;
  margin-top: 18px;
  padding: 0 18px;
  border-radius: 999px;
  color: #ffffff;
  background: #dc2626;
  font-weight: 900;
}
```

- [ ] **Step 4: Run verification**

Run:

```bash
npm run lint
npm run build
```

Expected:

- Lint completes without errors.
- Build completes without TypeScript or routing errors.
- `/dashboard` compiles as an App Router page.

---

## Task 2: Build the Scroll Sequence Component

**Files:**
- Create: `components/home/ScrollSequence.tsx`

- [ ] **Step 1: Create `ScrollSequence.tsx`**

Create `components/home/ScrollSequence.tsx`:

```tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type ScrollSequenceProps = {
  frameCount?: number;
  frameBasePath?: string;
  className?: string;
  alt?: string;
};

function padFrame(index: number) {
  return String(index).padStart(4, "0");
}

function getFramePath(basePath: string, frameIndex: number) {
  return `${basePath}/frame-${padFrame(frameIndex)}.png`;
}

function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(media.matches);

    function handleChange() {
      setReducedMotion(media.matches);
    }

    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  return reducedMotion;
}

export function ScrollSequence({
  frameCount = 72,
  frameBasePath = "/animation/home-sequence",
  className = "",
  alt = "Animated investigation sequence connecting CS2 buyers, trades, skins and marketplaces.",
}: ScrollSequenceProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [frame, setFrame] = useState(1);
  const [hasRealFrame, setHasRealFrame] = useState(false);
  const reducedMotion = useReducedMotion();

  const frameSrc = useMemo(() => getFramePath(frameBasePath, frame), [frameBasePath, frame]);

  useEffect(() => {
    if (reducedMotion) return;

    let introFrame = 1;
    const introLimit = Math.min(18, frameCount);
    const intro = window.setInterval(() => {
      introFrame += 1;
      setFrame(introFrame);
      if (introFrame >= introLimit) {
        window.clearInterval(intro);
      }
    }, 42);

    return () => window.clearInterval(intro);
  }, [frameCount, reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return;

    let ticking = false;

    function updateFrameFromScroll() {
      const element = containerRef.current;
      if (!element) return;

      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight || 1;
      const scrollSpan = rect.height + viewportHeight;
      const rawProgress = (viewportHeight - rect.top) / scrollSpan;
      const progress = Math.min(1, Math.max(0, rawProgress));
      const nextFrame = Math.max(1, Math.min(frameCount, Math.round(progress * (frameCount - 1)) + 1));

      setFrame(nextFrame);
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        updateFrameFromScroll();
        ticking = false;
      });
    }

    updateFrameFromScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [frameCount, reducedMotion]);

  return (
    <div ref={containerRef} className={`scroll-sequence ${className}`} aria-label={alt}>
      <div className="sequence-stage">
        <img
          className={`sequence-frame${hasRealFrame ? " is-loaded" : ""}`}
          src={frameSrc}
          alt=""
          aria-hidden="true"
          onLoad={() => setHasRealFrame(true)}
          onError={() => setHasRealFrame(false)}
        />
        {!hasRealFrame && (
          <div className="sequence-fallback" aria-hidden="true">
            <div className="sequence-grid" />
            <span className="sequence-node sequence-node-a">Buyer</span>
            <span className="sequence-node sequence-node-b">Skin</span>
            <span className="sequence-node sequence-node-c">Trade</span>
            <span className="sequence-node sequence-node-d">Market</span>
            <svg viewBox="0 0 620 420" className="sequence-lines" role="presentation">
              <path d="M120 110 C220 80 260 190 326 202 C404 216 420 88 514 104" />
              <path d="M118 300 C240 270 246 214 326 202 C420 184 432 288 510 308" />
              <path d="M326 202 C300 138 384 116 514 104" />
            </svg>
            <strong>{padFrame(frame)}</strong>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run verification**

Run:

```bash
npm run lint
npm run build
```

Expected:

- No React hook lint errors.
- No TypeScript errors from DOM APIs.

---

## Task 3: Build Home Static Components

**Files:**
- Create: `components/home/HomeHero.tsx`
- Create: `components/home/StorySection.tsx`
- Create: `components/home/HomeCta.tsx`

- [ ] **Step 1: Create `HomeHero.tsx`**

Create `components/home/HomeHero.tsx`:

```tsx
import Link from "next/link";
import { ArrowDown, Network, Radar } from "lucide-react";
import { ScrollSequence } from "./ScrollSequence";

export function HomeHero() {
  return (
    <section className="home-hero" id="trace">
      <nav className="home-nav" aria-label="SkinGraph public navigation">
        <Link className="home-brand" href="/">
          <span>SG</span>
          <strong>SkinGraph Radar</strong>
        </Link>
        <div className="home-nav-actions">
          <a href="#story">Story</a>
          <a href="#preview">Preview</a>
          <Link href="/dashboard">Dashboard</Link>
        </div>
      </nav>

      <div className="home-hero-grid">
        <div className="home-hero-copy">
          <p className="home-kicker"><Radar size={15} /> Graph-based CS2 intelligence</p>
          <h1>Every trade leaves a trace.</h1>
          <p className="home-lede">
            SkinGraph Radar conecta compradores, transacciones, skins y marketplaces para revelar patrones que el precio aislado no muestra.
          </p>
          <div className="home-hero-actions">
            <Link className="home-primary-link" href="/dashboard">
              Open Dashboard <Network size={17} />
            </Link>
            <a className="home-secondary-link" href="#story">
              Follow the graph <ArrowDown size={17} />
            </a>
          </div>
        </div>

        <ScrollSequence className="home-hero-sequence" />
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create `StorySection.tsx`**

Create `components/home/StorySection.tsx`:

```tsx
import type { ReactNode } from "react";

type StorySectionProps = {
  eyebrow: string;
  title: string;
  children: ReactNode;
  visual?: ReactNode;
  align?: "left" | "right" | "center";
  id?: string;
};

export function StorySection({ eyebrow, title, children, visual, align = "left", id }: StorySectionProps) {
  return (
    <section id={id} className={`story-section story-section-${align}`}>
      <div className="story-copy">
        <p className="home-kicker">{eyebrow}</p>
        <h2>{title}</h2>
        <div className="story-body">{children}</div>
      </div>
      {visual && <div className="story-visual">{visual}</div>}
    </section>
  );
}
```

- [ ] **Step 3: Create `HomeCta.tsx`**

Create `components/home/HomeCta.tsx`:

```tsx
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function HomeCta() {
  return (
    <section className="home-final-cta">
      <p className="home-kicker">Open the Radar</p>
      <h2>See the network behind the market.</h2>
      <p>
        Entrá al dashboard para explorar oportunidades, ciclos de riesgo, rutas de traders y relaciones entre compradores.
      </p>
      <Link className="home-primary-link" href="/dashboard">
        Open Dashboard <ArrowUpRight size={17} />
      </Link>
    </section>
  );
}
```

- [ ] **Step 4: Run verification**

Run:

```bash
npm run lint
npm run build
```

Expected:

- Components compile.
- No unused imports.

---

## Task 4: Build Interactive Mini Preview

**Files:**
- Create: `components/home/BuyerNetworkPreview.tsx`

- [ ] **Step 1: Create `BuyerNetworkPreview.tsx`**

Create `components/home/BuyerNetworkPreview.tsx`:

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";

type PreviewTab = "Buyer Network" | "Risk Cycles" | "Market Radar";

const previewCopy: Record<PreviewTab, { title: string; text: string; metric: string; label: string }> = {
  "Buyer Network": {
    title: "Follow the buyers, not just the price.",
    text: "Detectá compradores conectados por rutas repetidas, flips sincronizados y patrones de acumulación.",
    metric: "18",
    label: "linked buyers",
  },
  "Risk Cycles": {
    title: "Suspicious routes become visible.",
    text: "Identificá ciclos donde una misma instancia vuelve a aparecer con precios anómalos y ownership circular.",
    metric: "7",
    label: "risk cycles",
  },
  "Market Radar": {
    title: "Surface opportunities with context.",
    text: "Priorizá spreads por confianza, liquidez, marketplace y calidad del trader path.",
    metric: "42",
    label: "opportunities",
  },
};

const tabs: PreviewTab[] = ["Buyer Network", "Risk Cycles", "Market Radar"];

export function BuyerNetworkPreview() {
  const [activeTab, setActiveTab] = useState<PreviewTab>("Buyer Network");
  const active = previewCopy[activeTab];

  return (
    <section id="preview" className="buyer-preview">
      <div className="buyer-preview-copy">
        <p className="home-kicker">Product preview</p>
        <h2>{active.title}</h2>
        <p>{active.text}</p>
        <div className="preview-tabs" role="tablist" aria-label="SkinGraph preview modes">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              className={activeTab === tab ? "active" : ""}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        <Link className="home-secondary-link preview-link" href="/dashboard">
          Explore in dashboard
        </Link>
      </div>

      <div className="preview-panel" aria-label={`${activeTab} preview`}>
        <div className="preview-network">
          <span className="preview-node node-main">{active.metric}</span>
          <span className="preview-node node-a">Buyer</span>
          <span className="preview-node node-b">Trade</span>
          <span className="preview-node node-c">Skin</span>
          <span className="preview-node node-d">Market</span>
          <svg viewBox="0 0 620 420" className="preview-lines" role="presentation">
            <path d="M310 206 C240 136 164 112 104 136" />
            <path d="M310 206 C408 114 490 104 538 146" />
            <path d="M310 206 C218 274 178 334 108 318" />
            <path d="M310 206 C390 296 468 330 534 286" />
          </svg>
        </div>
        <div className="preview-stat">
          <strong>{active.metric}</strong>
          <span>{active.label}</span>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Run verification**

Run:

```bash
npm run lint
npm run build
```

Expected:

- No accessibility lint issues for buttons.
- No type errors for the `Record<PreviewTab, ...>` mapping.

---

## Task 5: Compose the New Home Page

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Replace temporary home with composed home**

Replace `app/page.tsx` with:

```tsx
import { BuyerNetworkPreview } from "@/components/home/BuyerNetworkPreview";
import { HomeCta } from "@/components/home/HomeCta";
import { HomeHero } from "@/components/home/HomeHero";
import { StorySection } from "@/components/home/StorySection";

function SignalVisual() {
  return (
    <div className="signal-visual" aria-label="Signals scattered across the market">
      <span>AK-47 · +18%</span>
      <span>Buyer 0x41</span>
      <span>BUFF163</span>
      <span>Sticker premium</span>
      <span>Float 0.08</span>
    </div>
  );
}

function GraphRevealVisual() {
  return (
    <div className="graph-reveal-visual" aria-label="Graph connections reveal hidden market routes">
      <div className="graph-card-node primary">Buyer</div>
      <div className="graph-card-node">Transaction</div>
      <div className="graph-card-node">Skin Instance</div>
      <div className="graph-card-node">Marketplace</div>
      <div className="graph-card-node danger">Cycle</div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="home-page">
      <HomeHero />

      <StorySection
        id="story"
        eyebrow="The market looks random"
        title="Prices alone do not tell the story."
        visual={<SignalVisual />}
      >
        <p>
          En CS2, una oportunidad rara vez aparece como un número aislado. Está escondida entre compradores recurrentes, rutas de venta, marketplaces y patrones de timing.
        </p>
      </StorySection>

      <StorySection
        eyebrow="Until the graph connects them"
        title="The graph turns scattered signals into a route."
        align="right"
        visual={<GraphRevealVisual />}
      >
        <p>
          SkinGraph conecta buyer → transaction → skin instance → marketplace → buyer para revelar relaciones invisibles antes de abrir el dashboard.
        </p>
      </StorySection>

      <StorySection
        eyebrow="Follow the buyers"
        title="Buyer relationships are the product edge."
        align="center"
      >
        <p>
          El diferencial está en ver quién compra, quién vende, qué rutas se repiten y cuándo una red de traders empieza a comportarse como una señal.
        </p>
      </StorySection>

      <section className="radar-detects">
        <p className="home-kicker">What the radar detects</p>
        <h2>From suspicion to actionable intelligence.</h2>
        <div className="detect-grid">
          <article><strong>Buyer relationships</strong><span>Clusters, repeated counterparties and connected trader paths.</span></article>
          <article><strong>Suspicious cycles</strong><span>Circular ownership routes and abnormal transaction loops.</span></article>
          <article><strong>Underpriced skins</strong><span>Spreads ranked by liquidity, confidence and risk ceiling.</span></article>
          <article><strong>Premium signals</strong><span>Sticker, float and marketplace premiums with graph context.</span></article>
        </div>
      </section>

      <BuyerNetworkPreview />
      <HomeCta />
    </main>
  );
}
```

- [ ] **Step 2: Run verification**

Run:

```bash
npm run lint
npm run build
```

Expected:

- `/` compiles with new home components.
- `/dashboard` remains available.

---

## Task 6: Add Full Home Styling

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Append final home styles**

Append this block to `app/globals.css` after existing styles. If Task 1 added temporary `.home-page-minimal` styles, keep them; these final classes do not conflict.

```css
/* ── Public Home: White / Red Cinematic Landing ───────────── */

.home-page {
  min-height: 100vh;
  color: #160708;
  background:
    radial-gradient(circle at 78% 8%, rgba(220, 38, 38, 0.16), transparent 32%),
    linear-gradient(180deg, #fffafa 0%, #ffffff 44%, #fff5f5 100%);
  overflow-x: hidden;
}

.home-page::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(127, 29, 29, 0.055) 1px, transparent 1px),
    linear-gradient(90deg, rgba(127, 29, 29, 0.055) 1px, transparent 1px);
  background-size: 54px 54px;
  mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.72), transparent 70%);
}

.home-hero,
.story-section,
.radar-detects,
.buyer-preview,
.home-final-cta {
  position: relative;
  width: min(1240px, calc(100% - 40px));
  margin: 0 auto;
}

.home-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 22px 0;
}

.home-brand,
.home-nav-actions {
  display: inline-flex;
  align-items: center;
}

.home-brand {
  gap: 10px;
  font-weight: 950;
  letter-spacing: -0.04em;
}

.home-brand span {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 13px;
  color: #ffffff;
  background: #dc2626;
  box-shadow: 0 18px 40px rgba(220, 38, 38, 0.22);
}

.home-nav-actions {
  gap: 8px;
  padding: 6px;
  border: 1px solid rgba(127, 29, 29, 0.12);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(16px);
}

.home-nav-actions a {
  padding: 9px 12px;
  border-radius: 999px;
  color: #5f1f24;
  font-size: 13px;
  font-weight: 850;
}

.home-nav-actions a:last-child {
  color: #ffffff;
  background: #160708;
}

.home-hero {
  min-height: 100vh;
}

.home-hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.88fr) minmax(420px, 1.12fr);
  gap: 28px;
  align-items: center;
  min-height: calc(100vh - 92px);
  padding: 18px 0 78px;
}

.home-hero-copy h1,
.story-section h2,
.radar-detects h2,
.buyer-preview h2,
.home-final-cta h2 {
  margin: 0;
  color: #160708;
  letter-spacing: -0.085em;
}

.home-hero-copy h1 {
  max-width: 820px;
  margin-top: 16px;
  font-size: clamp(72px, 10vw, 148px);
  line-height: 0.82;
}

.home-kicker {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: #dc2626;
  font-size: 12px;
  font-weight: 950;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.home-lede {
  max-width: 620px;
  margin: 24px 0 0;
  color: #5f1f24;
  font-size: clamp(18px, 2vw, 23px);
  line-height: 1.55;
}

.home-hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 34px;
}

.home-primary-link,
.home-secondary-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  min-height: 48px;
  padding: 0 18px;
  border-radius: 999px;
  font-weight: 950;
}

.home-primary-link {
  color: #ffffff;
  background: #dc2626;
  box-shadow: 0 20px 50px rgba(220, 38, 38, 0.25);
}

.home-secondary-link {
  border: 1px solid rgba(127, 29, 29, 0.14);
  color: #160708;
  background: rgba(255, 255, 255, 0.72);
}

.scroll-sequence {
  min-height: 620px;
}

.sequence-stage {
  position: sticky;
  top: 64px;
  display: grid;
  place-items: center;
  min-height: 620px;
  border: 1px solid rgba(127, 29, 29, 0.12);
  border-radius: 44px;
  background:
    radial-gradient(circle at 50% 45%, rgba(220, 38, 38, 0.18), transparent 34%),
    rgba(255, 255, 255, 0.78);
  box-shadow: 0 40px 120px rgba(127, 29, 29, 0.14);
  overflow: hidden;
}

.sequence-frame {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
}

.sequence-frame.is-loaded {
  opacity: 1;
}

.sequence-fallback,
.sequence-grid,
.sequence-lines {
  position: absolute;
  inset: 0;
}

.sequence-grid {
  background-image:
    linear-gradient(rgba(220, 38, 38, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(220, 38, 38, 0.08) 1px, transparent 1px);
  background-size: 42px 42px;
}

.sequence-lines {
  width: 100%;
  height: 100%;
  fill: none;
  stroke: rgba(220, 38, 38, 0.62);
  stroke-width: 3;
}

.sequence-node {
  position: absolute;
  z-index: 2;
  display: grid;
  place-items: center;
  width: 98px;
  height: 98px;
  border: 1px solid rgba(220, 38, 38, 0.22);
  border-radius: 999px;
  color: #dc2626;
  background: rgba(255, 255, 255, 0.84);
  font-size: 13px;
  font-weight: 950;
  box-shadow: 0 22px 60px rgba(127, 29, 29, 0.14);
}

.sequence-node-a { left: 11%; top: 20%; }
.sequence-node-b { left: 42%; top: 42%; width: 132px; height: 132px; color: #ffffff; background: #dc2626; }
.sequence-node-c { right: 11%; top: 18%; }
.sequence-node-d { right: 14%; bottom: 18%; }

.sequence-fallback strong {
  position: absolute;
  right: 24px;
  bottom: 20px;
  color: rgba(127, 29, 29, 0.16);
  font-size: 86px;
  letter-spacing: -0.08em;
}

.story-section {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(320px, 1.1fr);
  gap: 48px;
  align-items: center;
  padding: 110px 0;
}

.story-section-right .story-copy { order: 2; }
.story-section-center { display: block; max-width: 920px; text-align: center; }

.story-section h2,
.radar-detects h2,
.buyer-preview h2,
.home-final-cta h2 {
  margin-top: 14px;
  font-size: clamp(44px, 6vw, 86px);
  line-height: 0.9;
}

.story-body p,
.buyer-preview-copy p,
.home-final-cta p {
  color: #5f1f24;
  font-size: 18px;
  line-height: 1.7;
}

.signal-visual,
.graph-reveal-visual {
  min-height: 360px;
  border: 1px solid rgba(127, 29, 29, 0.12);
  border-radius: 36px;
  background: #ffffff;
  box-shadow: 0 30px 80px rgba(127, 29, 29, 0.1);
}

.signal-visual {
  display: flex;
  flex-wrap: wrap;
  align-content: center;
  gap: 14px;
  padding: 34px;
}

.signal-visual span {
  padding: 12px 14px;
  border: 1px solid rgba(220, 38, 38, 0.16);
  border-radius: 999px;
  color: #7f1d1d;
  background: #fff5f5;
  font-weight: 850;
}

.graph-reveal-visual {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  align-items: center;
  padding: 26px;
}

.graph-card-node {
  display: grid;
  place-items: center;
  min-height: 160px;
  border: 1px solid rgba(127, 29, 29, 0.12);
  border-radius: 24px;
  color: #5f1f24;
  background: #fffafa;
  font-weight: 950;
  text-align: center;
}

.graph-card-node.primary { color: #ffffff; background: #dc2626; }
.graph-card-node.danger { color: #dc2626; background: #ffffff; border-color: rgba(220, 38, 38, 0.36); }

.radar-detects {
  padding: 110px 0;
}

.detect-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-top: 28px;
}

.detect-grid article {
  min-height: 210px;
  padding: 22px;
  border: 1px solid rgba(127, 29, 29, 0.12);
  border-radius: 28px;
  background: #ffffff;
  box-shadow: 0 24px 70px rgba(127, 29, 29, 0.08);
}

.detect-grid strong,
.detect-grid span {
  display: block;
}

.detect-grid strong {
  font-size: 18px;
  letter-spacing: -0.035em;
}

.detect-grid span {
  margin-top: 12px;
  color: #5f1f24;
  line-height: 1.55;
}

.buyer-preview {
  display: grid;
  grid-template-columns: minmax(0, 0.78fr) minmax(420px, 1.22fr);
  gap: 28px;
  align-items: stretch;
  padding: 90px 0;
}

.preview-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 24px;
}

.preview-tabs button {
  min-height: 38px;
  padding: 0 13px;
  border: 1px solid rgba(127, 29, 29, 0.14);
  border-radius: 999px;
  color: #5f1f24;
  background: #ffffff;
  font-weight: 850;
}

.preview-tabs button.active {
  color: #ffffff;
  border-color: #dc2626;
  background: #dc2626;
}

.preview-link { margin-top: 18px; }

.preview-panel {
  position: relative;
  min-height: 520px;
  border: 1px solid rgba(127, 29, 29, 0.12);
  border-radius: 40px;
  background: #160708;
  box-shadow: 0 38px 110px rgba(127, 29, 29, 0.16);
  overflow: hidden;
}

.preview-network,
.preview-lines {
  position: absolute;
  inset: 0;
}

.preview-lines {
  width: 100%;
  height: 100%;
  fill: none;
  stroke: rgba(248, 113, 113, 0.72);
  stroke-width: 3;
}

.preview-node {
  position: absolute;
  z-index: 1;
  display: grid;
  place-items: center;
  width: 92px;
  height: 92px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 999px;
  color: #fecaca;
  background: rgba(255, 255, 255, 0.08);
  font-size: 12px;
  font-weight: 900;
}

.preview-node.node-main {
  left: calc(50% - 62px);
  top: calc(50% - 62px);
  width: 124px;
  height: 124px;
  color: #ffffff;
  background: #dc2626;
  font-size: 34px;
}

.node-a { left: 10%; top: 22%; }
.node-b { right: 10%; top: 24%; }
.node-c { left: 12%; bottom: 18%; }
.node-d { right: 12%; bottom: 20%; }

.preview-stat {
  position: absolute;
  left: 24px;
  bottom: 22px;
  z-index: 2;
  color: #ffffff;
}

.preview-stat strong,
.preview-stat span { display: block; }
.preview-stat strong { font-size: 64px; line-height: 0.9; letter-spacing: -0.08em; }
.preview-stat span { margin-top: 8px; color: #fecaca; font-weight: 850; text-transform: uppercase; letter-spacing: 0.12em; font-size: 11px; }

.home-final-cta {
  display: grid;
  place-items: center;
  min-height: 72vh;
  padding: 110px 0;
  text-align: center;
}

.home-final-cta p:not(.home-kicker) {
  max-width: 680px;
}

@media (max-width: 1040px) {
  .home-hero-grid,
  .story-section,
  .buyer-preview {
    grid-template-columns: 1fr;
  }

  .story-section-right .story-copy {
    order: 0;
  }

  .detect-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 680px) {
  .home-hero,
  .story-section,
  .radar-detects,
  .buyer-preview,
  .home-final-cta {
    width: min(100% - 24px, 1240px);
  }

  .home-nav,
  .home-nav-actions {
    align-items: flex-start;
    flex-direction: column;
    border-radius: 22px;
  }

  .home-nav-actions {
    width: 100%;
  }

  .home-hero-copy h1 {
    font-size: clamp(56px, 18vw, 88px);
  }

  .scroll-sequence,
  .sequence-stage {
    min-height: 460px;
  }

  .detect-grid {
    grid-template-columns: 1fr;
  }

  .graph-reveal-visual {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 2: Run verification**

Run:

```bash
npm run lint
npm run build
```

Expected:

- CSS compiles under the existing Tailwind import setup.
- No class name issues in TypeScript.

---

## Task 7: Update Metadata and Documentation

**Files:**
- Modify: `app/layout.tsx`
- Modify: `README.md`

- [ ] **Step 1: Update app metadata**

Modify `app/layout.tsx` metadata to:

```tsx
export const metadata: Metadata = {
  title: "SkinGraph Radar | CS2 Buyer Network Intelligence",
  description: "Market intelligence para skins de CS2: relaciones entre compradores, trader paths, spreads, ciclos sospechosos y grafos Neo4j.",
};
```

- [ ] **Step 2: Update README route documentation**

In `README.md`, add or update a section with this content:

```md
## Rutas principales

- `/` — home pública narrativa de SkinGraph Radar. Presenta la historia visual del producto, la animación frame-by-frame preparada para PNGs y CTAs hacia el dashboard.
- `/dashboard` — app operacional de market intelligence con workspaces, filtros, oportunidades, ciclos de riesgo, grafo, traders, watchlist y compare.

## Animación de home

La home está preparada para leer frames PNG desde:

```txt
public/animation/home-sequence/frame-0001.png
public/animation/home-sequence/frame-0002.png
public/animation/home-sequence/frame-0003.png
```

Mientras no existan frames reales, `ScrollSequence` muestra una visual temporal basada en nodos y conexiones.
```

If README already has a route/API section, place this near the product overview so it is easy to find.

- [ ] **Step 3: Run verification**

Run:

```bash
npm run lint
npm run build
```

Expected:

- Metadata change compiles.
- Markdown update does not affect build.

---

## Task 8: Final Verification and Manual Checks

**Files:**
- No required file changes.

- [ ] **Step 1: Run full verification**

Run:

```bash
npm run lint
npm run build
```

Expected:

- Both commands pass.

- [ ] **Step 2: Start local dev server**

Run:

```bash
npm run dev
```

Expected:

- Next.js starts successfully.
- The local server prints a URL, usually `http://localhost:3000`.

- [ ] **Step 3: Manual browser checks**

Open:

```txt
http://localhost:3000
```

Expected:

- White/red home renders.
- Hero is large and visually dominant.
- Temporary sequence visual appears if PNGs are absent.
- `Follow the graph` scrolls to the story section.
- Mini preview tabs switch content.
- `Open Dashboard` navigates to `/dashboard`.

Open:

```txt
http://localhost:3000/dashboard
```

Expected:

- Existing dashboard renders.
- Workspaces still switch.
- Marketplace toggles still update state.
- Search still updates filters.
- Deep scan button still calls `/api/scans`.

- [ ] **Step 4: API smoke checks if Neo4j is available**

Run these in the browser or terminal while dev server is running:

```txt
http://localhost:3000/api/opportunities?marketplaces=CSFloat&minSpreadPct=8
http://localhost:3000/api/risk-cycles?minRiskScore=70
http://localhost:3000/api/traders
http://localhost:3000/api/graph?instanceId=inst-ak-case-01
```

Expected:

- Existing API behavior is unchanged.
- Invalid `/api/graph` target combinations still return `400`.

---

## Self-Review

### Spec coverage

- `/` home nueva: Task 5.
- `/dashboard` dashboard actual: Task 1.
- Blanco/rojo limpio e imponente: Task 6.
- Narrativa detective + graph reveal: Tasks 3, 5, 6.
- Scroll PNG sequence with temporary frame visuals: Task 2.
- Intro automática + scroll controlado: Task 2.
- Mini preview interactiva secundaria: Task 4.
- Metadata/docs: Task 7.
- Verification: Task 8.

### Placeholder scan

No unresolved implementation markers remain. The plan intentionally includes temporary frame visuals because the real PNGs are external assets that will be delivered later.

### Type consistency

- `ScrollSequence` exports `ScrollSequence` and is imported by `HomeHero`.
- `BuyerNetworkPreview`, `HomeCta`, `HomeHero`, and `StorySection` exports match imports in `app/page.tsx`.
- Route paths match the approved spec: `/` and `/dashboard`.

### Git note

This project folder has no `.git`; do not run commit steps unless a repository is initialized later.
