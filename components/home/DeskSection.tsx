export function DeskSection() {
  const tiles = [
    { num: "I/01", title: "Market Radar", wide: true, content: "Evolución de precios en las últimas 24h para 50 skins top." },
    { num: "I/02", title: "Risk Cycles", content: "4 transacciones en ciclo cerrado. Montos: $840, $920, $1,200, $960." },
    { num: "I/03", title: "Graph Explorer", content: "Mini red de 8 nodos. B-204 como hub. 6 relaciones visibles." },
    { num: "I/04", title: "Traders", content: "T-118, T-204, T-309, T-412. Mayor volumen: T-118 (4.2K)." },
    { num: "I/05", title: "Watchlist", content: "5 skins en seguimiento: alertas de precio, listado nuevo, venue change." },
    { num: "I/06", title: "Compare", wide: true, content: "CSFloat $1,842 vs BUFF163 $1,920 vs Skinport $1,780. Spread: ±2.1%." },
  ];

  return (
    <section className="section section--desk reveal" id="dashboard">
      <header className="section__head grid">
        <div className="rail">
          <span className="rail__num">06</span>
          <span className="rail__label">Mesa de análisis</span>
        </div>
        <div className="section__title-wrap">
          <h2 className="section__title">Seis instrumentos sobre la misma mesa.</h2>
        </div>
      </header>

      <div className="desk">
        {tiles.map((tile) => (
          <article
            key={tile.num}
            className={`desk__tile ${tile.wide ? "desk__tile--wide" : ""}`}
          >
            <div className="desk__tilehead">
              <span className="mono mono--muted">{tile.num}</span>
              <span className="mono mono--muted">En vivo</span>
            </div>
            <h3 className="desk__title">{tile.title}</h3>
            <div className="desk__chart"></div>
            <p style={{ margin: "0", color: "var(--home-muted)", fontSize: "13px" }}>
              {tile.content}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
