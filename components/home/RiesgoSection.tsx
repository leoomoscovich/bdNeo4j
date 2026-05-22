export function RiesgoSection() {
  const risks = [
    { num: "R/01", title: "Ciclo cerrado", copy: "Transacciones A→B→C→A. El mismo item circula entre cuentas. 4 saltos, 34h, +22% ganancia." },
    { num: "R/02", title: "Precio anómalo", copy: "3.4× sobre la mediana. Outlier estadístico en BUFF163. Puede indicar error o manipulación." },
    { num: "R/03", title: "Reaparición", copy: "4 listados del mismo item con 2 horas de intervalo. Patrón de relisting artificial." },
    { num: "R/04", title: "Conexión indirecta", copy: "2 cuentas comparten 6 transacciones. Red de traders potencialmente coordinados." },
  ];

  return (
    <section className="section section--dark reveal" id="riesgo">
      <header className="section__head grid">
        <div className="rail rail--inv">
          <span className="rail__num">04</span>
          <span className="rail__label">Movimientos sospechosos</span>
        </div>
        <div className="section__title-wrap">
          <h2 className="section__title section__title--inv">Algunas rutas vuelven sobre sí mismas. El radar las marca para <em>revisión</em>.</h2>
        </div>
      </header>

      <div className="risks">
        {risks.map((risk) => (
          <article key={risk.num} className="risk">
            <div className="risk__head">
              <span className="mono mono--red">{risk.num}</span>
            </div>
            <h3 className="risk__title">{risk.title}</h3>
            <p className="risk__copy">{risk.copy}</p>
            <div className="risk__data">
              <div>
                <dt className="mono">Señal</dt>
                <dd className="mono">Revisar</dd>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="riskstrip">
        <span className="mono mono--red">Lenguaje del radar</span>
        <span className="riskstrip__tag">Movimientos sospechosos</span>
        <span className="riskstrip__tag">Patrones anómalos</span>
        <span className="riskstrip__tag">Rutas de riesgo</span>
        <span className="riskstrip__tag">Señales para revisar</span>
      </div>
    </section>
  );
}
