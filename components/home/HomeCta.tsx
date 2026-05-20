import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function HomeCta() {
  return (
    <section className="home-final-cta">
      <p className="home-kicker">Open the Radar</p>
      <h2>See the network behind the market.</h2>
      <p>
        Entrá al dashboard para explorar oportunidades, ciclos de riesgo, rutas de traders y relaciones entre compradores.
      </p>
      <Link className="home-primary-link" href="/dashboard">
        Open Dashboard <ArrowUpRight size={17} />
      </Link>
    </section>
  );
}
