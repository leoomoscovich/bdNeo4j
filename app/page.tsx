import Image from 'next/image';
import Link from 'next/link';
import { Clock, ScrollReveal, CounterRolls } from '@/components/inicio/InicioClient';
import NetworkExplorer from '@/components/inicio/NetworkExplorer';
import HeroSequence from '@/components/inicio/HeroSequence';
import SignalsSection from '@/components/inicio/SignalsSection';
import { getHomeData } from '@/lib/home-data';
import './inicio/inicio.css';

export const revalidate = 300;

const fmtUsd = (value: number) =>
  `$${Math.round(value).toLocaleString('es-AR')}`;

const severityLabel: Record<string, string> = {
  CRITICAL: 'Crítico',
  HIGH: 'Riesgo alto',
  MEDIUM: 'Riesgo medio',
  LOW: 'Riesgo bajo',
};

export default async function HomePage() {
  const { metrics, opportunities, riskCycles, traders, pulse, graphCounts, networkGraph, featuredTrader, skinImages } = await getHomeData();
  const topOpps = opportunities.slice(0, 4);
  const topCycles = riskCycles.slice(0, 4);
  const topTraders = traders.slice(0, 4);
  return (
    <div className="sg">
      <ScrollReveal />
      <CounterRolls />

      {/* ===== HERO: scroll-driven assembly sequence ===== */}
      <HeroSequence />

      {/* ===== MASTHEAD STRIP ===== */}
      <section className="masthead" aria-label="Masthead">
        <div className="masthead__inner">
          <div className="masthead__col">
            <span className="mono mono--muted">Vol. 04</span>
            <span className="mono mono--muted">Boletín de mercado</span>
          </div>
          <div className="masthead__col masthead__col--center">
            <span className="mono mono--muted">SkinGraph Radar · Inteligencia de mercado · CS2</span>
          </div>
          <div className="masthead__col masthead__col--right">
            <span className="mono"><span className="dot dot--live" /> En vivo</span>
            <Clock />
          </div>
        </div>
      </section>

      {/* ===== 01 · DECLARACIÓN ===== */}
      <section className="section section--statement reveal" id="declaracion">
        <span className="reg reg--tl" aria-hidden="true" />
        <span className="reg reg--tr" aria-hidden="true" />
        <div className="grid">
          <div className="rail">
            <span className="rail__num">01</span>
            <span className="rail__label">Declaración</span>
          </div>
          <h1 className="statement">
            El precio<br />
            es solo la<br />
            <em>superficie</em>.
          </h1>
          <aside className="statement__aside">
            <p className="statement__lede">
              Una skin no se entiende únicamente por su precio. También importan
              el <u>comprador</u>, el <u>marketplace</u>, el historial de transacciones,
              el float, los stickers, la liquidez, el timing y las rutas entre traders.
            </p>
            <p className="statement__sig mono">— Mesa de análisis · SkinGraph Radar</p>
          </aside>
        </div>
        <div className="statement__data">
          <div className="kv">
            <span className="kv__k mono">Skins indexadas</span>
            <span className="kv__v">{metrics ? metrics.skinsIndexed.toLocaleString('es-AR') : '—'}</span>
          </div>
          <div className="kv">
            <span className="kv__k mono">Transacciones registradas</span>
            <span className="kv__v">{metrics ? metrics.transactionsTracked.toLocaleString('es-AR') : '—'}</span>
          </div>
          <div className="kv">
            <span className="kv__k mono">Traders activos</span>
            <span className="kv__v">{metrics ? metrics.activeTraders.toLocaleString('es-AR') : '—'}</span>
          </div>
          <div className="kv">
            <span className="kv__k mono">Volumen estimado</span>
            <span className="kv__v">{metrics ? `$${Math.round(metrics.estimatedVolumeUsd / 1000)}K` : '—'}</span>
          </div>
        </div>
      </section>

      {/* ===== 02 · SEÑALES DE MERCADO ===== */}
      <SignalsSection />

      {/* ===== 03 · RELACIONES ===== */}
      <section className="section section--graph reveal" id="relaciones">
        <header className="section__head grid">
          <div className="rail">
            <span className="rail__num">03</span>
            <span className="rail__label">Relaciones entre compradores</span>
          </div>
          <div className="section__title-wrap">
            <h2 className="section__title section__title--editorial">
              <em>Cuando los compradores</em> se repiten,<br />
              el mercado empieza a mostrar <em>patrones</em>.
            </h2>
            <p className="section__dek">El valor no está solo en la skin. Está en quién la compra, quién la vende y cómo esas conexiones se vuelven a cruzar. Este grafo no es una ilustración: son los nodos reales de la base Neo4j.</p>
          </div>
        </header>
        {networkGraph && networkGraph.nodes.length > 0 ? (
          <NetworkExplorer graph={networkGraph} featuredTrader={featuredTrader} />
        ) : (
          <p className="section__dek">El grafo se está indexando. Volvé en unos minutos.</p>
        )}
      </section>

      {/* ===== 04 · MOVIMIENTOS SOSPECHOSOS ===== */}
      <section className="section section--dark reveal" id="riesgo">
        <header className="section__head grid">
          <div className="rail rail--inv">
            <span className="rail__num">04</span>
            <span className="rail__label">Movimientos sospechosos</span>
          </div>
          <div className="section__title-wrap">
            <h2 className="section__title section__title--inv">
              Algunas rutas <em>vuelven sobre sí mismas</em>.<br />
              El radar las marca para revisión.
            </h2>
            <p className="section__dek section__dek--inv">
              No acusamos. Señalamos. Cuando una skin reaparece, cuando un comprador y un trader cierran un círculo,
              cuando un precio se mueve fuera del rango razonable, lo dejamos marcado para que un humano lo lea.
            </p>
          </div>
        </header>

        <div className="risks">
          {topCycles.map((cycle, i) => {
            const vizzes = [
              <svg viewBox="0 0 200 200" key="v0">
                <circle cx="100" cy="100" r="68" fill="none" stroke="rgba(255,255,255,0.18)" strokeDasharray="2 4" />
                <circle className="ringdash" cx="100" cy="100" r="68" fill="none" stroke="#EE2E2E" strokeWidth="1.4" strokeDasharray="320 80" />
                <circle cx="100" cy="32"  r="6" fill="#fff" />
                <circle cx="159" cy="100" r="6" fill="#fff" />
                <circle cx="100" cy="168" r="6" fill="#fff" />
                <circle cx="41"  cy="100" r="6" fill="#EE2E2E" />
              </svg>,
              <svg viewBox="0 0 200 200" key="v1">
                <line x1="20" y1="170" x2="180" y2="170" stroke="rgba(255,255,255,0.2)" />
                <line x1="20" y1="170" x2="20"  y2="30"  stroke="rgba(255,255,255,0.2)" />
                <polyline points="20,140 50,128 80,132 110,118 140,124 170,120" fill="none" stroke="#fff" strokeWidth="1.4" />
                <circle cx="120" cy="58" r="6" fill="#EE2E2E" />
                <line x1="120" y1="58" x2="120" y2="170" stroke="rgba(238,46,46,0.4)" strokeDasharray="2 4" />
              </svg>,
              <svg viewBox="0 0 200 200" key="v2">
                <g stroke="rgba(255,255,255,0.25)" fill="none">
                  <rect x="30"  y="40"  width="42" height="42" rx="2" />
                  <rect x="80"  y="80"  width="42" height="42" rx="2" />
                  <rect x="130" y="40"  width="42" height="42" rx="2" />
                  <rect x="80"  y="120" width="42" height="42" rx="2" />
                </g>
                <g stroke="#EE2E2E" strokeWidth="1.4" fill="none">
                  <path d="M51 82 L101 80" /><path d="M122 100 L151 82" />
                  <path d="M151 82 L101 120" /><path d="M101 80 L101 120" />
                </g>
                <circle cx="101" cy="101" r="5" fill="#EE2E2E" />
              </svg>,
              <svg viewBox="0 0 200 200" key="v3">
                <g stroke="rgba(255,255,255,0.18)" fill="none">
                  <line x1="30" y1="100" x2="100" y2="60" /><line x1="100" y1="60" x2="170" y2="100" />
                  <line x1="30" y1="100" x2="100" y2="140" /><line x1="100" y1="140" x2="170" y2="100" />
                </g>
                <g stroke="#EE2E2E" strokeWidth="1.4" fill="none" strokeDasharray="3 3">
                  <path d="M30 100 Q 100 30 170 100" />
                </g>
                <circle cx="30"  cy="100" r="7" fill="#fff" />
                <circle cx="170" cy="100" r="7" fill="#fff" />
                <circle cx="100" cy="60"  r="5" fill="#EE2E2E" />
                <circle cx="100" cy="140" r="5" fill="#EE2E2E" />
              </svg>,
            ];
            const pathPreview = cycle.traderPath.slice(0, 3).join(' → ') + (cycle.traderPath.length > 3 ? ' → …' : '');
            return (
              <article className="risk" key={cycle.id}>
                <header className="risk__head">
                  <span className="mono mono--red">R/{String(i + 1).padStart(2, '0')}</span>
                  <span className="mono mono--mutedi">{severityLabel[cycle.severity] ?? cycle.severity}</span>
                </header>
                <div className="risk__viz">{vizzes[i % vizzes.length]}</div>
                <h3 className="risk__title">{cycle.skinName}</h3>
                <p className="risk__copy">
                  {cycle.evidence[0]?.description ?? `Ruta circular detectada: ${pathPreview}. La instancia vuelve sobre traders ya visitados.`}
                </p>
                <dl className="risk__data">
                  <div><dt>Traders</dt><dd>{cycle.traderPath.length}</dd></div>
                  <div><dt>Ventana</dt><dd>{cycle.timeWindowHours} h</dd></div>
                  <div><dt>Movido</dt><dd className="num--up">{fmtUsd(cycle.valueMovedUsd)}</dd></div>
                </dl>
              </article>
            );
          })}
          {topCycles.length === 0 && (
            <p className="section__dek section__dek--inv">Sin ciclos sospechosos detectados en este período.</p>
          )}
        </div>

        <div className="riskstrip">
          <span className="mono mono--red">Lenguaje del radar</span>
          <p>
            <span className="riskstrip__tag">movimientos sospechosos</span>
            <span className="riskstrip__tag">patrones anómalos</span>
            <span className="riskstrip__tag">rutas de riesgo</span>
            <span className="riskstrip__tag">señales para revisar</span>
          </p>
        </div>
      </section>

      {/* ===== INTERLUDIO · OBSERVATORIO ===== */}
      <section className="interlude reveal">
        <div className="interlude__inner">
          <header className="interlude__head">
            <span className="mono mono--muted">Observatorio</span>
            <span className="mono mono--muted">{topOpps.length} señales con mayor spread · datos en vivo</span>
          </header>
          <ol className="obs">
            {topOpps.map((opp) => (
              <li className="obs__card" key={opp.id}>
                <Link href={`/skins/${opp.skinId}`} style={{ display: 'contents' }}>
                  <div className="obs__media obs__media--white">
                    {skinImages[opp.skinId] ? (
                      <Image
                        src={skinImages[opp.skinId]}
                        alt={opp.skinName}
                        fill
                        sizes="(max-width: 800px) 50vw, 25vw"
                        style={{ objectFit: 'contain', padding: '10%' }}
                      />
                    ) : null}
                  </div>
                  <div className="obs__meta">
                    <span className="obs__label">{opp.skinName.toUpperCase()}</span>
                    <span className="obs__wear">{opp.wear} {opp.float.toFixed(3)}</span>
                  </div>
                  <div className="obs__row">
                    <span className="num">{fmtUsd(opp.currentAskUsd)}</span>
                    <span className={`num${opp.spreadPct >= 8 ? ' num--up' : ''}`}>
                      {opp.spreadPct >= 0 ? '+' : ''}{opp.spreadPct.toFixed(1).replace('.', ',')}%
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
          <footer className="interlude__foot mono mono--muted">
            <span>Ranking por spread contra valor justo</span>
            <Link href="/skins">→ ver las {metrics ? metrics.skinsIndexed.toLocaleString('es-AR') : '—'} piezas</Link>
          </footer>
        </div>
      </section>

      {/* ===== 05 · CAPAS DE INTELIGENCIA ===== */}
      <section className="section section--layers reveal" id="capas">
        <header className="section__head grid">
          <div className="rail">
            <span className="rail__num">05</span>
            <span className="rail__label">Capas de inteligencia</span>
          </div>
          <div className="section__title-wrap">
            <h2 className="section__title">Una skin es <em>nueve capas</em> superpuestas.</h2>
            <p className="section__dek">Las leemos por separado y juntas. Cada capa explica algo que el precio, por sí solo, no alcanza a contar.</p>
          </div>
        </header>

        <div className="dissection">
          <figure className="dissection__plate">
            <header className="plate__head">
              <span className="plate__label mono">Ficha · INST-#8821-471</span>
              <span className="plate__live mono"><span className="dot dot--live" />Observada</span>
            </header>
            <div className="plate__art plate__art--exploded">
              <Image src="/exploded.jpg" alt="Vista expandida del rifle AK-47 Strike Voltaic" fill style={{ objectFit: 'contain', objectPosition: 'center' }} />
              <span className="plate__crop plate__crop--tl" />
              <span className="plate__crop plate__crop--tr" />
              <span className="plate__crop plate__crop--bl" />
              <span className="plate__crop plate__crop--br" />
            </div>
            <figcaption className="plate__cap mono">AK-47 │ Voltaic · FN 0.018 · 4× sticker</figcaption>
            <dl className="plate__data">
              <div><dt>Float</dt><dd>0,0184</dd></div>
              <div><dt>Paint seed</dt><dd>738</dd></div>
              <div><dt>Tradeable</dt><dd>Sí</dd></div>
              <div><dt>Última venta</dt><dd>$1.789</dd></div>
            </dl>
          </figure>

          <ol className="layers">
            {([
              ['L/01', 'Skin base', 'Modelo, rareza y exterior. La capa más conocida y la menos informativa por sí sola.'],
              ['L/02', 'Instancia concreta', 'Un identificador único. Hace que dos AK-47 Voltaic FN no sean nunca la misma cosa.'],
              ['L/03', 'Float', 'El desgaste exacto. Donde el premium empieza a tener cuerpo medible.'],
              ['L/04', 'Stickers', 'Edición, posición, condición. El valor agregado real rara vez coincide con el teórico.'],
              ['L/05', 'Historial', 'Cada listado, cada bajada, cada cambio de manos. La memoria de la pieza.'],
              ['L/06', 'Marketplace', 'CSFloat, BUFF163, Skinport. Cada venue tiene su tempo y su sesgo.'],
              ['L/07', 'Comprador', 'Quién la compra es, muchas veces, más relevante que cuánto pagó.'],
              ['L/08', 'Ruta de transacciones', 'El recorrido completo desde el primer listado. Las rutas dejan huella.'],
              ['L/09', 'Riesgo', 'Una lectura compuesta. Resume todo lo anterior en una sola señal.'],
            ] as [string, string, string][]).map(([num, title, copy]) => (
              <li key={num} className="layer">
                <span className="layer__num mono">{num}</span>
                <div><h4>{title}</h4><p>{copy}</p></div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ===== 06 · MESA DE ANÁLISIS ===== */}
      <section className="section section--desk reveal" id="dashboard">
        <header className="section__head grid">
          <div className="rail">
            <span className="rail__num">06</span>
            <span className="rail__label">Mesa de análisis</span>
          </div>
          <div className="section__title-wrap">
            <h2 className="section__title">Seis instrumentos sobre la misma mesa.</h2>
            <p className="section__dek">El dashboard no es una colección de páginas. Es una superficie continua donde cada instrumento responde a la misma pregunta desde un ángulo distinto.</p>
          </div>
        </header>

        <div className="desk">
          <article className="desk__tile desk__tile--wide">
            <header className="desk__tilehead">
              <span className="mono mono--muted">I/01 · Market Radar</span>
              <span className="mono mono--red">Live</span>
            </header>
            <h3 className="desk__title">Radar de oportunidades</h3>
            <div className="desk__chart">
              <svg viewBox="0 0 600 200" preserveAspectRatio="none">
                <g stroke="rgba(11,11,12,0.08)">
                  <line x1="0" y1="40"  x2="600" y2="40" />
                  <line x1="0" y1="100" x2="600" y2="100" />
                  <line x1="0" y1="160" x2="600" y2="160" />
                </g>
                <polyline points="0,150 40,142 80,148 120,130 160,134 200,120 240,128 280,108 320,116 360,92 400,98 440,82 480,90 520,68 560,76 600,58" fill="none" stroke="#0B0B0C" strokeWidth="1.2" />
                <polyline points="0,160 40,154 80,158 120,148 160,150 200,142 240,148 280,138 320,142 360,130 400,134 440,124 480,128 520,118 560,120 600,112" fill="none" stroke="#EE2E2E" strokeWidth="1.2" strokeDasharray="3 3" />
                <g fill="#EE2E2E">
                  <circle cx="200" cy="120" r="3" />
                  <circle cx="360" cy="92"  r="3" />
                  <circle cx="520" cy="68"  r="3" />
                </g>
              </svg>
            </div>
            <footer className="desk__foot mono mono--muted">
              <span>Spread medio · {pulse && Number.isFinite(pulse.averageSpreadPct) ? `${pulse.averageSpreadPct.toFixed(1).replace('.', ',')}%` : '—'}</span>
              <span>Señales · {pulse ? pulse.dealsDetected : '—'}</span>
              <span>Volumen · {pulse ? fmtUsd(pulse.trackedVolumeUsd) : '—'}</span>
            </footer>
          </article>

          <article className="desk__tile">
            <header className="desk__tilehead">
              <span className="mono mono--muted">I/02 · Risk Cycles</span>
              <span className="mono mono--red">{pulse ? `${pulse.suspiciousCycles} activos` : '—'}</span>
            </header>
            <h3 className="desk__title">Ciclos de riesgo</h3>
            <ul className="desk__list">
              {topCycles.map((cycle) => (
                <li key={cycle.id}>
                  <span className="mono mono--muted">{cycle.severity}</span> {cycle.skinName}{' '}
                  <span className={`num${cycle.riskScore >= 70 ? ' num--up' : ''}`}>{cycle.riskScore}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="desk__tile">
            <header className="desk__tilehead">
              <span className="mono mono--muted">I/03 · Graph Explorer</span>
            </header>
            <h3 className="desk__title">Explorador de grafo</h3>
            <div className="desk__mini">
              <svg viewBox="0 0 200 120">
                <g stroke="#0B0B0C" fill="none" strokeWidth="0.8" opacity="0.4">
                  <line x1="30" y1="40" x2="90" y2="60" /><line x1="90" y1="60" x2="150" y2="40" />
                  <line x1="90" y1="60" x2="110" y2="100" /><line x1="150" y1="40" x2="170" y2="90" />
                </g>
                <g fill="#0B0B0C">
                  <circle cx="30" cy="40" r="4" /><circle cx="150" cy="40" r="4" />
                  <circle cx="110" cy="100" r="4" /><circle cx="170" cy="90" r="4" />
                </g>
                <circle cx="90" cy="60" r="6" fill="#EE2E2E" />
              </svg>
            </div>
            <footer className="desk__foot mono mono--muted">
              <span>Nodos · {graphCounts ? graphCounts.nodes.toLocaleString('es-AR') : '—'}</span>
              <span>Aristas · {graphCounts ? graphCounts.edges.toLocaleString('es-AR') : '—'}</span>
            </footer>
          </article>

          <article className="desk__tile">
            <header className="desk__tilehead">
              <span className="mono mono--muted">I/04 · Traders</span>
            </header>
            <h3 className="desk__title">Mapa de traders</h3>
            <table className="desk__table">
              <tbody>
                {topTraders.map((trader) => (
                  <tr key={trader.id}>
                    <td className="mono">{trader.handle}</td>
                    <td>{trader.transactionCount} tx</td>
                    <td className={`num${trader.riskScore >= 60 ? ' num--up' : ''}`}>{fmtUsd(trader.volumeUsd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>

          <article className="desk__tile">
            <header className="desk__tilehead">
              <span className="mono mono--muted">I/05 · Señales</span>
            </header>
            <h3 className="desk__title">Señales destacadas</h3>
            <ul className="desk__list desk__list--tight">
              {opportunities.slice(0, 5).map((opp) => (
                <li key={opp.id}>{opp.skinName} <span className="mono mono--muted">{opp.wear}</span></li>
              ))}
            </ul>
          </article>

          <article className="desk__tile desk__tile--wide">
            <header className="desk__tilehead">
              <span className="mono mono--muted">I/06 · Compare</span>
            </header>
            <h3 className="desk__title">Mejores spreads por venue</h3>
            <div className="compare">
              {topOpps.slice(0, 3).map((opp) => {
                const maxAsk = Math.max(...topOpps.slice(0, 3).map((o) => o.currentAskUsd), 1);
                return (
                  <div className="compare__row" key={opp.id}>
                    <span className="mono mono--muted">{opp.marketplace.toUpperCase()}</span>
                    <span className="compare__bar">
                      <span
                        style={{ '--w': String(Math.max(0.08, opp.currentAskUsd / maxAsk)) } as React.CSSProperties}
                        className={opp.spreadPct >= 10 ? 'bar--red' : undefined}
                      />
                    </span>
                    <span className="num">{fmtUsd(opp.currentAskUsd)}</span>
                  </div>
                );
              })}
            </div>
            <footer className="desk__foot mono mono--muted">
              {topOpps[0] ? (
                <>
                  <span>Pieza · {topOpps[0].skinName} {topOpps[0].wear}</span>
                  <span>Spread · +{topOpps[0].spreadPct.toFixed(1).replace('.', ',')}%</span>
                </>
              ) : (
                <span>Sin señales activas</span>
              )}
            </footer>
          </article>
        </div>
      </section>

      {/* ===== 07 · CIERRE ===== */}
      <section className="section section--cierre reveal" id="cierre">
        <span className="reg reg--tl" aria-hidden="true" />
        <span className="reg reg--tr" aria-hidden="true" />
        <div className="cierre">
          <span className="mono mono--red">Cierre</span>
          <h2 className="cierre__line">
            Un mapa para leer<br />
            <em>precios, compradores</em> y<br />
            rutas sospechosas en el<br />
            mercado de skins.
          </h2>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link className="btn btn--red btn--lg" href="/skins">
              Ver Mercado
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 13L13 3M13 3H6M13 3V10" stroke="currentColor" strokeWidth="1.4" />
              </svg>
            </Link>
          </div>
          <p className="cierre__meta mono">SkinGraph Radar · Inteligencia de mercado para CS2 · 2026</p>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="foot">
        <div className="foot__inner">
          <span className="mono">SkinGraph Radar</span>
          <span className="mono mono--muted">— observamos precios, conectamos compradores, marcamos rutas.</span>
          <span className="mono mono--muted foot__right">© 2026</span>
        </div>
      </footer>
    </div>
  );
}
