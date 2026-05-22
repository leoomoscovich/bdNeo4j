export function SignalsSection() {
  const signals = [
    { num: "S/01", title: "Spreads entre marketplaces", copy: "Diferencia entre el mejor precio listado y el mejor precio de compra, ajustada por fees y tiempo de venta esperado.", delta: "+11.8%", deltaRed: true },
    { num: "S/02", title: "Skins por debajo del precio esperado", copy: "Listados desviados de la mediana ponderada. Filtramos las ofertas legítimas de los listados que esconden urgencia o señal.", delta: "182", deltaRed: true },
    { num: "S/03", title: "Float clustering", copy: "Agrupamiento anómalo de transacciones alrededor de ciertos rangos de float.", delta: "+34.2×", deltaRed: false },
    { num: "S/04", title: "Disparidad de stickers", copy: "Variación de precio entre ítems idénticos con diferentes combinaciones de stickers.", delta: "61%", deltaRed: false },
    { num: "S/05", title: "Velocidad de rotación", copy: "Tiempo promedio entre compra y venta. Identifica skins que ciclan rápidamente.", delta: "−18%", deltaRed: true },
    { num: "S/06", title: "Convergencia de venues", copy: "Velocidad de alineación de precios entre plataformas. Mide eficiencia del arbitraje.", delta: "±4.2%", deltaRed: false },
  ];

  return (
    <section className="section section--signals reveal" id="senales">
      <span className="reg reg--tl" aria-hidden="true"></span>
      <span className="reg reg--tr" aria-hidden="true"></span>

      <header className="section__head grid">
        <div className="rail">
          <span className="rail__num">02</span>
          <span className="rail__label">Señales de mercado</span>
        </div>
        <div className="section__title-wrap">
          <h2 className="section__title">Lo que el radar observa <em>en este momento</em>.</h2>
          <p className="section__dek">Seis tipos de señales recorren el mercado en paralelo. Cada una se mide, se compara entre marketplaces y se cruza con la red de compradores.</p>
        </div>
      </header>

      <ol className="signals">
        {signals.map((signal) => (
          <li key={signal.num} className="signal">
            <div className="signal__num mono">{signal.num}</div>
            <h3 className="signal__title">{signal.title}</h3>
            <p className="signal__copy">{signal.copy}</p>
            <div className="signal__viz" aria-hidden="true">
              <div className="signal__metric">
                <span className="mono mono--muted">Δ promedio</span>
                <span className={`signal__delta ${signal.deltaRed ? "signal__delta--red" : ""}`}>
                  {signal.delta}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
