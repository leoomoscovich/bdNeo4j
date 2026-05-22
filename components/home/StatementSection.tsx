export function StatementSection() {
  return (
    <section className="section section--statement reveal" id="declaracion">
      <span className="reg reg--tl" aria-hidden="true"></span>
      <span className="reg reg--tr" aria-hidden="true"></span>

      <div className="grid">
        <div className="rail">
          <span className="rail__num">01</span>
          <span className="rail__label">Declaración</span>
        </div>
        <h1 className="statement">
          El precio<br/>es solo la<br/><em>superficie</em>.
        </h1>
      </div>

      <div className="grid">
        <div className="rail"></div>
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
  );
}
