import Link from "next/link";
import { BuyerNetworkPreview } from "./BuyerNetworkPreview";

export function DashboardPreview() {
  return (
    <section id="preview" className="dashboard-preview">
      <div className="dashboard-preview-inner">
        <p className="dashboard-preview-eyebrow">Live Intelligence</p>
        <h2 className="dashboard-preview-headline">
          See the network behind every transaction.
        </h2>
        <p className="dashboard-preview-sub">
          Buyers, cycles, and market signals — connected in real time by the graph.
        </p>
        <BuyerNetworkPreview />
        <Link href="/dashboard" className="dashboard-preview-cta">
          Open Dashboard →
        </Link>
      </div>
    </section>
  );
}
