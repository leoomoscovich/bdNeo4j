export function CapasSection() {
  const layers = [
    { num: "L/01", title: "Skin base", desc: "La composición visual del item: colores, texturas, patrones." },
    { num: "L/02", title: "Instancia concreta", desc: "El item específico: su float, seed, stickers, historial de daño." },
    { num: "L/03", title: "Float", desc: "Nivel de desgaste: FN, MW, FT, WW, BS. Define rango de precios base." },
    { num: "L/04", title: "Stickers", desc: "Pegatinas aplicadas: pueden agregar 10-50% al valor según posición y rareza." },
    { num: "L/05", title: "Historial", desc: "Quién lo poseyó, cuándo, en qué marketplace. Ciclos de propiedad." },
    { num: "L/06", title: "Marketplace", desc: "Dónde se lista: CSFloat, BUFF163, Skinport. Precios varían por venue." },
    { num: "L/07", title: "Comprador", desc: "Quién lo compra: coleccionista, trader, especulador. Motivaciones." },
    { num: "L/08", title: "Ruta de transacciones", desc: "Cómo llegó: B1 → B2 → B3. Patrones indican ciclos o manipulación." },
    { num: "L/09", title: "Riesgo", desc: "Indicadores: sobreprecio, ciclos cerrados, reapariciones, conexiones indirectas." },
  ];

  return (
    <section className="section section--layers reveal" id="capas">
      <header className="section__head grid">
        <div className="rail">
          <span className="rail__num">05</span>
          <span className="rail__label">Capas de inteligencia</span>
        </div>
        <div className="section__title-wrap">
          <h2 className="section__title">Una skin es nueve <em>capas</em> superpuestas.</h2>
        </div>
      </header>

      <div className="dissection">
        <figure className="dissection__plate">
          <div className="plate__head">
            <span className="plate__label mono">Ficha</span>
            <span className="plate__live"><span className="dot" style={{ width: '4px', height: '4px' }}></span> Observada</span>
          </div>
          <div className="plate__art plate__art--exploded">
            <img src="https://via.placeholder.com/800x500" alt="AK-47 Voltaic" />
            <span className="plate__crop plate__crop--tl"></span>
            <span className="plate__crop plate__crop--tr"></span>
            <span className="plate__crop plate__crop--bl"></span>
            <span className="plate__crop plate__crop--br"></span>
          </div>
          <p className="plate__cap mono">AK-47 │ Voltaic · FN 0.0184 · 4× sticker</p>
          <div className="plate__data">
            <div>
              <dt>Float</dt>
              <dd className="num">0.0184</dd>
            </div>
            <div>
              <dt>Paint seed</dt>
              <dd className="num">738</dd>
            </div>
            <div>
              <dt>Tradeable</dt>
              <dd>Sí</dd>
            </div>
            <div>
              <dt>Última venta</dt>
              <dd className="num">$1.789</dd>
            </div>
          </div>
        </figure>

        <ol className="layers">
          {layers.map((layer, idx) => (
            <li key={layer.num} className="layer" style={{ '--i': idx } as React.CSSProperties}>
              <span className="layer__num mono">{layer.num}</span>
              <div>
                <h4>{layer.title}</h4>
                <p>{layer.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
