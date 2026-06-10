'use client';
import { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import type { CrossVenueRow } from '@/lib/home-data';

const ease = [0.2, 0.7, 0.2, 1] as const;

/* Venues reales del dataset (en este orden en la tabla). */
const VENUE_COLUMNS = ['Skinport', 'Market.CSGO', 'Steam Market'] as const;

const fmtPrice = (v: number | undefined) =>
  v == null ? '—' : `$${v.toLocaleString('es-AR', { maximumFractionDigits: v < 10 ? 2 : 0 })}`;

/* ── Animated sparkline ────────────────────────────────── */
function Sparkline({ points, soft, active }: { points: string; soft?: boolean; active: boolean }) {
  return (
    <svg viewBox="0 0 200 36" preserveAspectRatio="none" style={{ width: '100%', height: 36, display: 'block' }}>
      <motion.polyline
        points={points}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.4"
        stroke={active ? 'var(--red)' : soft ? 'var(--muted)' : 'var(--ink)'}
        strokeDasharray="600"
        initial={{ strokeDashoffset: 600 }}
        animate={{ strokeDashoffset: 0, stroke: active ? 'var(--red)' : soft ? 'var(--muted)' : 'var(--ink)' }}
        transition={{ duration: 1.4, ease: 'easeInOut' }}
      />
    </svg>
  );
}

/* ── Distribution bars ─────────────────────────────────── */
function DistBars({ bars, active }: { bars: { h: number; red?: boolean }[]; active: boolean }) {
  return (
    <div className="dist">
      {bars.map((b, i) => (
        <motion.span
          key={i}
          style={{
            flex: 1,
            borderRadius: 1,
            transformOrigin: 'bottom',
            background: b.red || active ? 'var(--red)' : 'var(--ink)',
            height: `${b.h * 100}%`,
          }}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: i * 0.06, duration: 0.7, ease }}
        />
      ))}
    </div>
  );
}

/* ── Float bar ─────────────────────────────────────────── */
function FloatBar() {
  return (
    <div style={{ position: 'relative', height: 8, background: 'var(--hair)', borderRadius: 4 }}>
      <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '7%', background: 'var(--ink-2)', borderRadius: '4px 0 0 4px' }} />
      <motion.span
        style={{ position: 'absolute', top: -4, left: '6%', width: 2, height: 16, background: 'var(--ink)', transform: 'translateX(-50%)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      />
      <motion.span
        style={{ position: 'absolute', top: -6, left: '2.8%', width: 2, height: 20, background: 'var(--red)', transform: 'translateX(-50%)' }}
        initial={{ opacity: 0, scaleY: 0 }}
        animate={{ opacity: 1, scaleY: 1 }}
        transition={{ delay: 0.5, duration: 0.4, ease }}
      />
    </div>
  );
}

/* ── Venue bars ────────────────────────────────────────── */
function VenueBars({ active }: { active: boolean }) {
  const venues = [
    { name: 'SKINPORT', w: 82, red: false },
    { name: 'MKT.CSGO', w: 94, red: true },
    { name: 'STEAM', w: 71, red: false },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {venues.map((v, i) => (
        <div key={v.name} style={{ display: 'grid', gridTemplateColumns: '68px 1fr', alignItems: 'center', gap: 10 }}>
          <span className="mono mono--muted" style={{ fontSize: 10 }}>{v.name}</span>
          <div style={{ height: 6, background: 'var(--hair)', borderRadius: 3, overflow: 'hidden' }}>
            <motion.div
              style={{ height: '100%', background: (v.red || active) ? 'var(--red)' : 'var(--ink)', borderRadius: 3 }}
              initial={{ width: '0%' }}
              animate={{ width: `${v.w}%` }}
              transition={{ delay: i * 0.1, duration: 0.8, ease }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Stickers ──────────────────────────────────────────── */
function Stickers({ active }: { active: boolean }) {
  const colors = [false, false, true, false];
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {colors.map((red, i) => (
        <motion.span
          key={i}
          style={{
            flex: 1, height: 30,
            background: (red || active)
              ? `repeating-linear-gradient(45deg, var(--red-soft), var(--red-soft) 3px, var(--paper) 3px, var(--paper) 6px)`
              : `repeating-linear-gradient(45deg, var(--hair), var(--hair) 3px, var(--paper) 3px, var(--paper) 6px)`,
            border: `1px solid ${(red || active) ? 'var(--red)' : 'var(--hair-2)'}`,
          }}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, duration: 0.4, ease }}
        />
      ))}
    </div>
  );
}

/* ── Signal data ───────────────────────────────────────── */
type VizDef =
  | { type: 'spark'; points: string; soft?: boolean; metric: string; delta: string }
  | { type: 'dist'; bars: { h: number; red?: boolean }[]; metric: string; delta: string }
  | { type: 'float'; metric: string; delta: string }
  | { type: 'stickers'; metric: string; delta: string }
  | { type: 'venues' };

interface SignalDef { id: string; title: string; copy: string; viz: VizDef }

/* Métricas reales (vienen de Neo4j vía props); el resto de las tarjetas
   describe la señal sin inventar números. */
function buildSignals(avgSpreadPct: number | null, dealsDetected: number | null): SignalDef[] {
  return [
    {
      id: 'S/01', title: 'Spreads entre marketplaces',
      copy: 'Diferencia entre el precio de la misma skin+wear en Skinport, Market.CSGO y Steam. Medida sobre snapshots reales.',
      viz: {
        type: 'spark', points: '0,28 14,24 28,30 42,18 56,22 70,12 84,17 98,9 112,14 126,7 140,11 154,5 168,8 182,4 200,6',
        metric: 'Δ promedio', delta: avgSpreadPct != null ? `+${avgSpreadPct.toFixed(1).replace('.', ',')}%` : '—',
      },
    },
    {
      id: 'S/02', title: 'Spreads accionables',
      copy: 'Pares skin+wear cuya diferencia entre venues supera el 5%: el costo de moverla de un mercado a otro.',
      viz: {
        type: 'dist', bars: [{ h:.25 },{ h:.45 },{ h:.7 },{ h:.95, red:true },{ h:.62 },{ h:.4 },{ h:.22 }],
        metric: 'Detectados hoy', delta: dealsDetected != null ? String(dealsDetected) : '—',
      },
    },
    {
      id: 'S/03', title: 'Premium por float',
      copy: 'CSFloat publica el factor de float de cada listing real: cuánto paga el mercado por el desgaste exacto.',
      viz: { type: 'float', metric: 'Fuente', delta: 'float real' },
    },
    {
      id: 'S/04', title: 'Premium por stickers',
      copy: 'Cada listing real trae sus stickers con precio de mercado observado, no valor teórico.',
      viz: { type: 'stickers', metric: 'Fuente', delta: 'SCM real' },
    },
    {
      id: 'S/05', title: 'Profundidad de mercado',
      copy: 'Unidades listadas por skin y wear en cada venue. La liquidez real, no estimada.',
      viz: { type: 'spark', soft: true, points: '0,18 20,20 40,16 60,22 80,18 100,24 120,28 140,18 160,12 180,6 200,4', metric: 'Fuente', delta: 'quantity real' },
    },
    {
      id: 'S/06', title: 'Diferencias entre venues',
      copy: 'Skinport, Market.CSGO y Steam nunca se mueven al mismo ritmo. El desfase es la oportunidad.',
      viz: { type: 'venues' },
    },
  ];
}

function SignalViz({ viz, active }: { viz: VizDef; active: boolean }) {
  if (viz.type === 'spark') return (
    <div className="signal__viz">
      <Sparkline points={viz.points} soft={viz.soft} active={active} />
      <div className="signal__metric">
        <span className="mono mono--muted">{viz.metric}</span>
        <span className="signal__delta" style={{ color: active ? 'var(--red)' : 'var(--ink)' }}>{viz.delta}</span>
      </div>
    </div>
  );
  if (viz.type === 'dist') return (
    <div className="signal__viz">
      <DistBars bars={viz.bars} active={active} />
      <div className="signal__metric">
        <span className="mono mono--muted">{viz.metric}</span>
        <span className="signal__delta" style={{ color: 'var(--red)' }}>{viz.delta}</span>
      </div>
    </div>
  );
  if (viz.type === 'float') return (
    <div className="signal__viz">
      <FloatBar />
      <div className="signal__metric">
        <span className="mono mono--muted">{viz.metric}</span>
        <span className="signal__delta" style={{ color: active ? 'var(--red)' : 'var(--ink)' }}>{viz.delta}</span>
      </div>
    </div>
  );
  if (viz.type === 'stickers') return (
    <div className="signal__viz">
      <Stickers active={active} />
      <div className="signal__metric">
        <span className="mono mono--muted">{viz.metric}</span>
        <span className="signal__delta" style={{ color: active ? 'var(--red)' : 'var(--ink)' }}>{viz.delta}</span>
      </div>
    </div>
  );
  return (
    <div className="signal__viz">
      <VenueBars active={active} />
    </div>
  );
}

/* ── Main component ────────────────────────────────────── */
type SignalsSectionProps = {
  crossVenue?: CrossVenueRow[];
  avgSpreadPct?: number | null;
  dealsDetected?: number | null;
};

export default function SignalsSection({ crossVenue = [], avgSpreadPct = null, dealsDetected = null }: SignalsSectionProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [visitedSet, setVisitedSet] = useState<Set<number>>(new Set());

  const inView = useInView(sectionRef, { once: true, margin: '0px 0px -10% 0px' });
  const tableInView = useInView(tableRef, { once: true, margin: '0px 0px -5% 0px' });

  useEffect(() => {
    function activate(idx: number) {
      setActiveIdx(idx);
      if (idx < 0) return;
      setVisitedSet(prev => {
        if (prev.has(idx)) return prev;
        return new Set([...prev, idx]);
      });
    }

    function onScroll() {
      const wrapper = wrapperRef.current;
      const section = sectionRef.current;
      if (!wrapper || !section) return;

      // Sticky mode: wrapper is significantly taller than viewport
      const isSticky = wrapper.offsetHeight > window.innerHeight * 2;

      if (isSticky) {
        const rect = wrapper.getBoundingClientRect();
        const scrolled = -rect.top;
        const scrollable = rect.height - window.innerHeight;

        if (scrolled < 0) {
          // Above section — no active card
          activate(-1);
          return;
        }
        if (scrolled > scrollable) {
          // Past section — keep last card active so visited state looks complete
          activate(5);
          return;
        }
        const progress = scrolled / scrollable;
        // clamp to [0,5], round so going back re-activates properly
        activate(Math.min(5, Math.max(0, Math.floor(progress * 6))));
      } else {
        const rect = section.getBoundingClientRect();
        const scrolled = -rect.top;
        if (scrolled < 0) { activate(-1); return; }
        if (scrolled > rect.height) { activate(5); return; }
        const progress = scrolled / rect.height;
        activate(Math.min(5, Math.max(0, Math.floor(progress * 6))));
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const allDone = visitedSet.size === 6;
  const SIGNALS_LIVE = buildSignals(avgSpreadPct, dealsDetected);

  return (
    <>
      {/* Tall wrapper — forces scroll through all 6 signal states on desktop */}
      <div className="signals-scroll-track" ref={wrapperRef}>
        <section className="section section--signals-new" id="senales" ref={sectionRef}>
          <span className="reg reg--tl" aria-hidden="true" />
          <span className="reg reg--tr" aria-hidden="true" />

          {/* Header */}
          <motion.header
            className="section__head grid"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease }}
          >
            <div className="rail">
              <span className="rail__num">02</span>
              <span className="rail__label">Señales de mercado</span>
            </div>
            <div className="section__title-wrap">
              <h2 className="section__title">
                Lo que el radar observa <em>en este momento</em>.
              </h2>
              <p className="section__dek">
                Seis señales recorren el mercado en paralelo. Cada una se mide,
                se compara entre venues y se cruza con la red de compradores.
              </p>
            </div>
          </motion.header>

          {/* 2×3 / 3×2 signal grid */}
          <ol className="signals-grid">
            {SIGNALS_LIVE.map((s, i) => {
              const active = activeIdx === i;
              const visited = visitedSet.has(i) && !active;
              return (
                <motion.li
                  key={s.id}
                  className="signal-card"
                  initial={{ opacity: 0, y: 16 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.08 + i * 0.07, duration: 0.5, ease }}
                  style={{
                    border: active
                      ? '1px solid var(--red)'
                      : visited
                        ? '1px solid var(--hair-2)'
                        : '1px solid var(--hair)',
                    boxShadow: active
                      ? '0 0 0 1px rgba(238,46,46,0.25), 0 12px 48px -16px rgba(238,46,46,0.28), inset 0 0 60px rgba(238,46,46,0.04)'
                      : 'none',
                    background: active
                      ? 'rgba(238,46,46,0.025)'
                      : visited
                        ? 'rgba(11,11,12,0.025)'
                        : 'var(--paper-2)',
                    transition: 'border-color 0.35s ease, box-shadow 0.35s ease, background 0.35s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span
                      className="mono"
                      style={{
                        color: active ? 'var(--red)' : visited ? 'var(--ink-2)' : 'var(--muted)',
                        transition: 'color 0.3s ease',
                        fontSize: 11,
                      }}
                    >
                      {s.id}
                    </span>
                    {/* State indicator dot */}
                    <motion.span
                      style={{
                        width: 5, height: 5, borderRadius: '50%',
                        background: active ? 'var(--red)' : 'var(--ink-2)',
                        display: 'block',
                      }}
                      initial={{ opacity: 0, scale: 0.4 }}
                      animate={
                        active
                          ? { opacity: 1, scale: 1 }
                          : visited
                            ? { opacity: 0.4, scale: 0.8 }
                            : { opacity: 0, scale: 0.4 }
                      }
                      transition={{ duration: 0.25, ease }}
                    />
                  </div>

                  <h3 className="signal__title">{s.title}</h3>
                  <p className="signal__copy">{s.copy}</p>
                  <SignalViz viz={s.viz} active={active} />
                </motion.li>
              );
            })}
          </ol>

          {/* Progress indicator — visible only in sticky desktop mode */}
          <div className="signals-progress">
            {SIGNALS_LIVE.map((s, i) => {
              const active = activeIdx === i;
              const visited = visitedSet.has(i);
              return (
                <span
                  key={s.id}
                  className={[
                    'signals-progress__dot',
                    active ? 'signals-progress__dot--active' : '',
                    visited && !active ? 'signals-progress__dot--visited' : '',
                  ].join(' ')}
                />
              );
            })}
            <span className={`signals-progress__count${allDone ? ' signals-progress__count--done' : ''}`}>
              {visitedSet.size} / 6
            </span>
          </div>
        </section>
      </div>

      {/* Spread report table — precios reales observados en cada venue */}
      {crossVenue.length > 0 && (
        <div style={{ padding: '0 var(--pad)', background: 'var(--paper)' }}>
          <div className="report" ref={tableRef} style={{ maxWidth: 'var(--maxw)', margin: '48px auto 0' }}>
            <div className="report__head">
              <span className="mono mono--muted">Reporte · Spreads reales entre marketplaces</span>
              <span className="mono mono--muted">Skinport · Market.CSGO · Steam — datos en vivo</span>
            </div>
            <table className="report__table" aria-label="Spreads entre marketplaces">
              <thead>
                <tr>
                  <th>Skin</th><th>Wear</th>
                  {VENUE_COLUMNS.map((v) => <th className="num" key={v}>{v.replace(' Market', '')}</th>)}
                  <th className="num">Spread</th><th>Señal</th>
                </tr>
              </thead>
              <tbody>
                {crossVenue.slice(0, 6).map((row, i) => {
                  const up = row.spreadPct >= 10;
                  const tag = row.spreadPct >= 10 ? 'Spread amplio' : row.spreadPct >= 5 ? 'Spread moderado' : 'Estable';
                  return (
                    <motion.tr
                      key={`${row.skinName}-${row.wear}`}
                      initial={{ opacity: 0, x: -8 }}
                      animate={tableInView ? { opacity: 1, x: 0 } : {}}
                      transition={{ delay: 0.1 + i * 0.06, duration: 0.45, ease }}
                      style={{ position: 'relative' }}
                    >
                      <td>{row.skinName}</td>
                      <td className="mono">{row.wear}</td>
                      {VENUE_COLUMNS.map((v) => (
                        <td className="num" key={v}>{fmtPrice(row.prices[v])}</td>
                      ))}
                      <td className={`num${up ? ' num--up' : ''}`}>+{row.spreadPct.toFixed(1).replace('.', ',')}%</td>
                      <td>
                        <span className={`tag${up ? ' tag--red' : row.spreadPct >= 5 ? ' tag--soft' : ''}`}>
                          {tag}
                        </span>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
