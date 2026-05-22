import Image from 'next/image';
import { Clock, ScrollReveal, CounterRolls } from '@/components/inicio/InicioClient';
import NetworkGraph from '@/components/inicio/NetworkGraph';
import HeroSequence from '@/components/inicio/HeroSequence';
import SignalsSection from '@/components/inicio/SignalsSection';
import './inicio/inicio.css';

export default function HomePage() {
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
            <span className="kv__k mono">Skins observadas</span>
            <span className="kv__v">412.918</span>
          </div>
          <div className="kv">
            <span className="kv__k mono">Transacciones diarias</span>
            <span className="kv__v">87.4K</span>
          </div>
          <div className="kv">
            <span className="kv__k mono">Marketplaces conectados</span>
            <span className="kv__v">06</span>
          </div>
          <div className="kv">
            <span className="kv__k mono">Latencia de actualización</span>
            <span className="kv__v">38<span className="kv__unit">s</span></span>
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
            <p className="section__dek">El valor no está solo en la skin. Está en quién la compra, quién la vende y cómo esas conexiones se vuelven a cruzar dos, cinco, doce veces.</p>
          </div>
        </header>
        <NetworkGraph />
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
          <article className="risk">
            <header className="risk__head">
              <span className="mono mono--red">R/01</span>
              <span className="mono mono--mutedi">Ciclo cerrado</span>
            </header>
            <div className="risk__viz">
              <svg viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="68" fill="none" stroke="rgba(255,255,255,0.18)" strokeDasharray="2 4" />
                <circle className="ringdash" cx="100" cy="100" r="68" fill="none" stroke="#EE2E2E" strokeWidth="1.4" strokeDasharray="320 80" />
                <circle cx="100" cy="32"  r="6" fill="#fff" />
                <circle cx="159" cy="100" r="6" fill="#fff" />
                <circle cx="100" cy="168" r="6" fill="#fff" />
                <circle cx="41"  cy="100" r="6" fill="#EE2E2E" />
              </svg>
            </div>
            <h3 className="risk__title">A → B → C → A</h3>
            <p className="risk__copy">Una misma instancia atraviesa cuatro carteras y vuelve a su punto de origen en menos de 36 h.</p>
            <dl className="risk__data">
              <div><dt>Saltos</dt><dd>4</dd></div>
              <div><dt>Duración</dt><dd>34 h 12 m</dd></div>
              <div><dt>Δ precio</dt><dd className="num--up">+22%</dd></div>
            </dl>
          </article>

          <article className="risk">
            <header className="risk__head">
              <span className="mono mono--red">R/02</span>
              <span className="mono mono--mutedi">Precio anómalo</span>
            </header>
            <div className="risk__viz">
              <svg viewBox="0 0 200 200">
                <line x1="20" y1="170" x2="180" y2="170" stroke="rgba(255,255,255,0.2)" />
                <line x1="20" y1="170" x2="20"  y2="30"  stroke="rgba(255,255,255,0.2)" />
                <polyline points="20,140 50,128 80,132 110,118 140,124 170,120" fill="none" stroke="#fff" strokeWidth="1.4" />
                <circle cx="120" cy="58" r="6" fill="#EE2E2E" />
                <line x1="120" y1="58" x2="120" y2="170" stroke="rgba(238,46,46,0.4)" strokeDasharray="2 4" />
              </svg>
            </div>
            <h3 className="risk__title">Listado fuera del rango razonable</h3>
            <p className="risk__copy">Una instancia aparece 3,4× sobre la mediana de 30 días sin justificación visible en stickers ni float.</p>
            <dl className="risk__data">
              <div><dt>Desviación</dt><dd>+3,4σ</dd></div>
              <div><dt>Venue</dt><dd>BUFF163</dd></div>
              <div><dt>Vendedor</dt><dd>nuevo (12 d)</dd></div>
            </dl>
          </article>

          <article className="risk">
            <header className="risk__head">
              <span className="mono mono--red">R/03</span>
              <span className="mono mono--mutedi">Reaparición</span>
            </header>
            <div className="risk__viz">
              <svg viewBox="0 0 200 200">
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
              </svg>
            </div>
            <h3 className="risk__title">Misma instancia, cuatro listados</h3>
            <p className="risk__copy">El mismo float, los mismos stickers y el mismo paint seed aparecen en cuatro listados consecutivos.</p>
            <dl className="risk__data">
              <div><dt>Apariciones</dt><dd>4</dd></div>
              <div><dt>Ventana</dt><dd>11 d</dd></div>
              <div><dt>Δ precio</dt><dd className="num--up">+58%</dd></div>
            </dl>
          </article>

          <article className="risk">
            <header className="risk__head">
              <span className="mono mono--red">R/04</span>
              <span className="mono mono--mutedi">Conexión indirecta</span>
            </header>
            <div className="risk__viz">
              <svg viewBox="0 0 200 200">
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
              </svg>
            </div>
            <h3 className="risk__title">Dos compradores, dos traders en común</h3>
            <p className="risk__copy">Sin contacto directo entre sí, comparten dos traders intermediarios en seis transacciones consecutivas.</p>
            <dl className="risk__data">
              <div><dt>Distancia</dt><dd>2 saltos</dd></div>
              <div><dt>Coincidencias</dt><dd>6</dd></div>
              <div><dt>Última</dt><dd>hace 2 d</dd></div>
            </dl>
          </article>
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
            <span className="mono mono--muted">12 piezas seleccionadas · ÚLT 24 h</span>
          </header>
          <ol className="obs">
            <li className="obs__card">
              <div className="obs__media obs__media--rifle">
                <Image src="/hero.png" alt="" fill style={{ objectFit: 'cover', objectPosition: '60% center' }} />
              </div>
              <div className="obs__meta">
                <span className="obs__label">AK-47 │ VOLTAIC</span>
                <span className="obs__wear">FN 0.018</span>
              </div>
              <div className="obs__row">
                <span className="num">$1.842</span>
                <span className="num num--up">+14,4%</span>
              </div>
            </li>
            <li className="obs__card">
              <div className="obs__media obs__media--white">
                <Image src="/karambit-emerald.webp" alt="" fill style={{ objectFit: 'contain', padding: '8%', mixBlendMode: 'multiply' }} />
              </div>
              <div className="obs__meta">
                <span className="obs__label">KARAMBIT │ EMERALD</span>
                <span className="obs__wear">FN 0.012</span>
              </div>
              <div className="obs__row">
                <span className="num">$2.940</span>
                <span className="num num--up">+12,6%</span>
              </div>
            </li>
            <li className="obs__card">
              <div className="obs__media">
                <Image src="/butterfly-doppler.png" alt="" fill style={{ objectFit: 'cover' }} />
              </div>
              <div className="obs__meta">
                <span className="obs__label">BUTTERFLY │ DOPPLER</span>
                <span className="obs__wear">MW 0.094</span>
              </div>
              <div className="obs__row">
                <span className="num">$1.610</span>
                <span className="num">+7,2%</span>
              </div>
            </li>
            <li className="obs__card">
              <div className="obs__media obs__media--pov">
                <Image src="/karambit-fire-pov.jpg" alt="" fill style={{ objectFit: 'cover', objectPosition: 'center' }} />
              </div>
              <div className="obs__meta">
                <span className="obs__label">KARAMBIT │ FIRE SERPENT</span>
                <span className="obs__wear">FT 0.221</span>
              </div>
              <div className="obs__row">
                <span className="num">$612</span>
                <span className="num num--up">+11,4%</span>
              </div>
            </li>
          </ol>
          <footer className="interlude__foot mono mono--muted">
            <span>Selección editorial</span>
            <span>→ ver las 412.918 piezas</span>
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
              <span>Spread medio · ÚLT 24 h</span><span>Outliers · 12</span><span>Velocidad · alta</span>
            </footer>
          </article>

          <article className="desk__tile">
            <header className="desk__tilehead">
              <span className="mono mono--muted">I/02 · Risk Cycles</span>
              <span className="mono mono--red">4 nuevos</span>
            </header>
            <h3 className="desk__title">Ciclos de riesgo</h3>
            <ul className="desk__list">
              <li><span className="mono mono--muted">C-088</span> AK-47 │ Voltaic <span className="num num--up">+22%</span></li>
              <li><span className="mono mono--muted">C-091</span> AWP │ Wildfire <span className="num num--up">+11%</span></li>
              <li><span className="mono mono--muted">C-094</span> Karambit │ Dop. <span className="num num--up">+58%</span></li>
              <li><span className="mono mono--muted">C-099</span> M4A1 │ Print. <span className="num">+7%</span></li>
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
              <span>Nodos · 2.1K</span><span>Aristas · 5.8K</span>
            </footer>
          </article>

          <article className="desk__tile">
            <header className="desk__tilehead">
              <span className="mono mono--muted">I/04 · Traders</span>
            </header>
            <h3 className="desk__title">Mapa de traders</h3>
            <table className="desk__table">
              <tbody>
                <tr><td className="mono">T-118</td><td>118 tx</td><td className="num num--up">+14%</td></tr>
                <tr><td className="mono">T-204</td><td>71 tx</td><td className="num num--up">+9%</td></tr>
                <tr><td className="mono">T-309</td><td>54 tx</td><td className="num">+3%</td></tr>
                <tr><td className="mono">T-412</td><td>49 tx</td><td className="num num--up">+18%</td></tr>
              </tbody>
            </table>
          </article>

          <article className="desk__tile">
            <header className="desk__tilehead">
              <span className="mono mono--muted">I/05 · Watchlist</span>
            </header>
            <h3 className="desk__title">Lista de seguimiento</h3>
            <ul className="desk__list desk__list--tight">
              <li>AK-47 │ Voltaic <span className="mono mono--muted">FN</span></li>
              <li>AWP │ Wildfire <span className="mono mono--muted">FT</span></li>
              <li>Glock-18 │ Fade <span className="mono mono--muted">FN</span></li>
              <li>USP-S │ Kill Confirmed</li>
              <li>M4A1-S │ Printstream</li>
            </ul>
          </article>

          <article className="desk__tile desk__tile--wide">
            <header className="desk__tilehead">
              <span className="mono mono--muted">I/06 · Compare</span>
            </header>
            <h3 className="desk__title">Comparar entre venues</h3>
            <div className="compare">
              <div className="compare__row">
                <span className="mono mono--muted">CSFLOAT</span>
                <span className="compare__bar"><span style={{'--w': '.78'} as React.CSSProperties} /></span>
                <span className="num">$1.842</span>
              </div>
              <div className="compare__row">
                <span className="mono mono--muted">BUFF163</span>
                <span className="compare__bar"><span style={{'--w': '.62'} as React.CSSProperties} className="bar--red" /></span>
                <span className="num">$1.610</span>
              </div>
              <div className="compare__row">
                <span className="mono mono--muted">SKINPORT</span>
                <span className="compare__bar"><span style={{'--w': '.71'} as React.CSSProperties} /></span>
                <span className="num">$1.789</span>
              </div>
            </div>
            <footer className="desk__foot mono mono--muted">
              <span>Pieza · AK-47 │ Voltaic FN</span><span>Spread · +14,4%</span>
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
          <a className="btn btn--red btn--lg" href="#">
            Abrir dashboard
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 13L13 3M13 3H6M13 3V10" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </a>
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
