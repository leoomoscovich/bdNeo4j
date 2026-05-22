import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function CierreSection() {
  return (
    <section className="section section--cierre reveal" id="cierre">
      <div className="cierre">
        <span className="mono mono--red">Cierre</span>
        <h2 className="cierre__line">
          Un mapa para leer <em>precios, compradores</em> y rutas sospechosas en el mercado de skins.
        </h2>
        <Link href="/dashboard" className="btn btn--lg btn--red">
          Abrir dashboard <ArrowUpRight size={17} />
        </Link>
        <p className="cierre__meta mono">
          © 2026
        </p>
      </div>
    </section>
  );
}
