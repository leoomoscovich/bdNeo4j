'use client';
import { useRef, useState, useEffect } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';

const ease = [0.2, 0.7, 0.2, 1] as const;

/* ── Animated sparkline ────────────────────────────────── */
function Sparkline({ points, soft, active }: { points: string; soft?: boolean; active: boolean }) {
  return (
    <svg viewBox="0 0 200 40" preserveAspectRatio="none" style={{ width: '100%', height: 40, display: 'block' }}>
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
function FloatBar({ active }: { active: boolean }) {
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
    { name: 'CSFLOAT', w: 82, red: false },
    { name: 'BUFF163', w: 94, red: true },
    { name: 'SKINPORT', w: 71, red: false },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {venues.map((v, i) => (
        <div key={v.name} style={{ display: 'grid', gridTemplateColumns: '76px 1fr', alignItems: 'center', gap: 10 }}>
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
            flex: 1, height: 34,
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

const SIGNALS: SignalDef[] = [
  {
    id: 'S/01', title: 'Spreads entre marketplaces',
    copy: 'Diferencia ajustada por fees entre el mejor precio listado y el mejor de compra en cada venue.',
    viz: { type: 'spark', points: '0,28 14,24 28,30 42,18 56,22 70,12 84,17 98,9 112,14 126,7 140,11 154,5 168,8 182,4 200,6', metric: 'Δ promedio', delta: '+11,8%' },
  },
  {
    id: 'S/02', title: 'Outliers bajo la mediana',
    copy: 'Listados desviados de la mediana ponderada. Filtramos urgencia de señal real.',
    viz: { type: 'dist', bars: [{ h:.25 },{ h:.45 },{ h:.7 },{ h:.95, red:true },{ h:.62 },{ h:.4 },{ h:.22 }], metric: 'Outliers hoy', delta: '182' },
  },
  {
    id: 'S/03', title: 'Premium por float',
    copy: 'Sobreprecio por floats raros sobre el rango de referencia. Anticipa movimiento.',
    viz: { type: 'float', metric: 'Float top 1%', delta: '+34,2×' },
  },
  {
    id: 'S/04', title: 'Premium por stickers',
    copy: 'Diferencia entre el valor teórico de stickers y lo que paga el comprador final.',
    viz: { type: 'stickers', metric: 'Capture rate', delta: '61%' },
  },
  {
    id: 'S/05', title: 'Cambios de liquidez',
    copy: 'Tiempo para liquidar a precio mediano. Los aceleramientos anticipan movimientos de precio.',
    viz: { type: 'spark', soft: true, points: '0,18 20,20 40,16 60,22 80,18 100,24 120,28 140,18 160,12 180,6 200,4', metric: 'Tiempo medio', delta: '−18%' },
  },
  {
    id: 'S/06', title: 'Diferencias entre venues',
    copy: 'CSFloat, BUFF163 y Skinport nunca se mueven al mismo ritmo. El desfase es la oportunidad.',
    viz: { type: 'venues' },
  },
];

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
      <FloatBar active={active} />
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

/* ── Last updated counter ──────────────────────────────── */
function LastUpdated() {
  const [s, setS] = useState(38);
  useEffect(() => {
    const id = setInterval(() => setS(p => p >= 119 ? 12 : p + 1), 1000);
    return () => clearInterval(id);
  }, []);
  return <span>hace {s} s</span>;
}

/* ── Main component ────────────────────────────────────── */
export default function SignalsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLLIElement | null)[]>(Array(6).fill(null));
  const [activeIdx, setActiveIdx] = useState(-1);

  const inView = useInView(sectionRef, { once: true, margin: '0px 0px -10% 0px' });
  const tableInView = useInView(tableRef, { once: true, margin: '0px 0px -5% 0px' });

  // Scroll-driven active signal: scroll progress dentro de la sección → índice en orden
  // de lectura (izq→der, fila por fila): S/01→S/02→S/03→S/04→S/05→S/06
  useEffect(() => {
    function onScroll() {
      const section = sectionRef.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      // scrolled = cuánto hemos avanzado dentro de la sección
      const scrolled = -rect.top;
      if (scrolled < 0 || scrolled > rect.height) {
        setActiveIdx(-1);
        return;
      }
      const progress = scrolled / rect.height;
      // 6 bandas iguales → 0..5 en reading order
      setActiveIdx(Math.min(5, Math.floor(progress * 6)));
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
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

      {/* 2 × 3 signal grid */}
      <ol className="signals-grid">
        {SIGNALS.map((s, i) => {
          const active = activeIdx === i;
          return (
            <motion.li
              key={s.id}
              ref={(el) => { cardRefs.current[i] = el; }}
              className="signal-card"
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.08 + i * 0.07, duration: 0.5, ease }}
              style={{
                border: active ? '1px solid var(--red)' : '1px solid var(--hair)',
                boxShadow: active
                  ? '0 0 0 1px rgba(238,46,46,0.25), 0 12px 48px -16px rgba(238,46,46,0.28), inset 0 0 60px rgba(238,46,46,0.04)'
                  : 'none',
                background: active ? 'rgba(238,46,46,0.025)' : 'var(--paper-2)',
                transition: 'border-color 0.35s ease, box-shadow 0.35s ease, background 0.35s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
                <span
                  className="mono"
                  style={{
                    color: active ? 'var(--red)' : 'var(--muted)',
                    transition: 'color 0.3s ease',
                    fontSize: 11,
                  }}
                >
                  {s.id}
                </span>
                {/* Active indicator dot */}
                <motion.span
                  style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: 'var(--red)',
                    display: 'block',
                  }}
                  initial={{ opacity: 0, scale: 0.4 }}
                  animate={active ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.4 }}
                  transition={{ duration: 0.25, ease }}
                />
              </div>

              <h3
                className="signal__title"
                style={{ color: active ? 'var(--ink)' : 'var(--ink)', marginBottom: 10 }}
              >
                {s.title}
              </h3>
              <p className="signal__copy">{s.copy}</p>
              <SignalViz viz={s.viz} active={active} />
            </motion.li>
          );
        })}
      </ol>

      {/* Spread report table */}
      <div className="report" ref={tableRef}>
        <div className="report__head">
          <span className="mono mono--muted">Reporte 04·12 · Spreads entre marketplaces</span>
          <span className="mono mono--muted">Actualizado <LastUpdated /></span>
        </div>
        <table className="report__table" aria-label="Spreads entre marketplaces">
          <thead>
            <tr>
              <th>Skin</th><th>Wear</th>
              <th className="num">CSFloat</th><th className="num">BUFF163</th><th className="num">Skinport</th>
              <th className="num">Spread</th><th>Señal</th>
            </tr>
          </thead>
          <tbody>
            {[
              { skin: 'AK-47 │ Voltaic',       wear: 'FN 0.018', csf: '$1.842', buf: '$1.610', skp: '$1.789', spread: '+14,4%', up: true,  tag: 'Spread amplio', rc: true,  rs: false },
              { skin: 'M4A1-S │ Printstream',  wear: 'MW 0.094', csf: '$612',   buf: '$598',   skp: '$641',   spread: '+7,2%',  up: false, tag: 'Estable',       rc: false, rs: false },
              { skin: 'AWP │ Wildfire',         wear: 'FT 0.221', csf: '$284',   buf: '$249',   skp: '$271',   spread: '+14,1%', up: true,  tag: 'Spread amplio', rc: true,  rs: false },
              { skin: 'Glock-18 │ Fade',        wear: 'FN 0.006', csf: '$1.120', buf: '$1.180', skp: '$1.144', spread: '+5,3%',  up: false, tag: 'Float premium', rc: false, rs: true  },
              { skin: 'USP-S │ Kill Confirmed', wear: 'FT 0.182', csf: '$402',   buf: '$380',   skp: '$418',   spread: '+10,0%', up: false, tag: 'Liquidez baja', rc: false, rs: false },
              { skin: 'Karambit │ Doppler P2',  wear: 'FN 0.012', csf: '$2.940', buf: '$2.610', skp: '$2.802', spread: '+12,6%', up: true,  tag: 'Reaparición',   rc: true,  rs: false },
            ].map((row, i) => (
              <motion.tr
                key={row.skin}
                initial={{ opacity: 0, x: -8 }}
                animate={tableInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.1 + i * 0.06, duration: 0.45, ease }}
                style={{ position: 'relative' }}
              >
                <td>{row.skin}</td>
                <td className="mono">{row.wear}</td>
                <td className="num">{row.csf}</td>
                <td className="num">{row.buf}</td>
                <td className="num">{row.skp}</td>
                <td className={`num${row.up ? ' num--up' : ''}`}>{row.spread}</td>
                <td>
                  <span className={`tag${row.rc ? ' tag--red' : row.rs ? ' tag--soft' : ''}`}>
                    {row.tag}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
