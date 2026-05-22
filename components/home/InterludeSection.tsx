export function InterludeSection() {
  const skins = [
    { name: "AK-47", skin: "Voltaic", wear: "FN 0.018", price: "$1.842", change: "+14.4%", img: "https://via.placeholder.com/400x240" },
    { name: "Karambit", skin: "Emerald", wear: "FN 0.012", price: "$2.940", change: "+12.6%", img: "https://via.placeholder.com/400x240", white: true },
    { name: "Butterfly", skin: "Doppler", wear: "MW 0.094", price: "$1.610", change: "+7.2%", img: "https://via.placeholder.com/400x240" },
    { name: "Karambit", skin: "Fire Serpent", wear: "FT 0.221", price: "$612", change: "+11.4%", img: "https://via.placeholder.com/400x240" },
  ];

  return (
    <section className="interlude reveal">
      <div className="interlude__inner">
        <header className="interlude__head">
          <span className="mono">Observatorio</span>
          <span className="mono mono--muted">4 piezas seleccionadas · Últimas 24h</span>
        </header>

        <ol className="obs">
          {skins.map((skin) => (
            <li key={`${skin.name}-${skin.skin}`} className="obs__card">
              <div className={`obs__media ${skin.white ? "obs__media--white" : ""}`}>
                <img src={skin.img} alt={`${skin.name} ${skin.skin}`} />
              </div>
              <div className="obs__meta">
                <span className="obs__label">{skin.name} │ {skin.skin}</span>
                <span className="obs__wear mono">{skin.wear}</span>
              </div>
              <div className="obs__row">
                <span className="num">{skin.price}</span>
                <span className="mono num--up">{skin.change}</span>
              </div>
            </li>
          ))}
        </ol>

        <div className="interlude__foot">
          <span className="mono mono--muted">Selección editorial</span>
          <span className="mono mono--muted">→ ver las 412.918 piezas</span>
        </div>
      </div>
    </section>
  );
}
