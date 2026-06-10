import type { ScanSummary } from "@/lib/types";
import { marketplaceIds, type MarketplaceId, type WorkspaceId } from "@/lib/ui-state";
import Link from "next/link";
import { Activity, BarChart3, DatabaseZap, Eye, GitBranch, Radar, Scale, Shield, ShieldAlert, Star, Users, Layers } from "lucide-react";
import type { ComponentType } from "react";

type SidebarNavItem = {
  id: WorkspaceId;
  label: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
  badge?: string;
};

const navItems: SidebarNavItem[] = [
  { id: "dashboard", label: "Resumen", icon: Shield },
  { id: "market-radar", label: "Mercado", icon: BarChart3, badge: "live" },
  { id: "patterns", label: "Patrones", icon: Radar },
  { id: "risk-cycles", label: "Vendedores de riesgo", icon: ShieldAlert },
  { id: "graph-explorer", label: "Explorador de grafo", icon: GitBranch },
  { id: "traders", label: "Traders", icon: Users },
  { id: "watchlist", label: "Seguimiento", icon: Star, badge: "local" },
];

const marketplaceIcons: Record<MarketplaceId, ComponentType<{ size?: number; strokeWidth?: number }>> = {
  CSFloat: Activity,
  Skinport: Scale,
  "Market.CSGO": Eye,
  "Steam Market": Layers,
};

type SidebarNavProps = {
  activeNav: WorkspaceId;
  activeMarketplaces: MarketplaceId[];
  scan?: ScanSummary | null;
  scanStatus: "idle" | "running" | "error";
  onNavChange: (id: WorkspaceId) => void;
  onMarketplaceToggle: (marketplace: MarketplaceId) => void;
  onRunScan: () => void;
};

export function SidebarNav({
  activeNav,
  activeMarketplaces,
  scan,
  scanStatus,
  onNavChange,
  onMarketplaceToggle,
  onRunScan,
}: SidebarNavProps) {
  return (
    <aside className="sidebar" aria-label="Navegacion principal">
      <div className="brand">
        <div className="brand-mark">SG</div>
        <div>
          <strong>SkinGraph Radar</strong>
          <span>Market intelligence</span>
        </div>
      </div>

      <Link href="/skins" className="nav-item" style={{ marginBottom: 4, textDecoration: "none" }}>
        <span><Layers size={16} /> Catálogo de skins</span>
      </Link>

      <div className="nav-group">
        <div className="nav-label">Workspace</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`nav-item${activeNav === item.id ? " active" : ""}`}
              onClick={() => onNavChange(item.id)}
            >
              <span>
                <Icon size={16} /> {item.label}
              </span>
              {item.badge && <small>{item.badge}</small>}
            </button>
          );
        })}
      </div>

      <div className="nav-group">
        <div className="nav-label">Filters</div>
        {marketplaceIds.map((marketplace) => {
          const active = activeMarketplaces.includes(marketplace);
          const Icon = marketplaceIcons[marketplace];
          return (
            <button
              key={marketplace}
              className={`nav-item${active ? " active" : ""}`}
              onClick={() => onMarketplaceToggle(marketplace)}
              aria-pressed={active}
            >
              <span><Icon size={16} /> {marketplace}</span>
              <small>{active ? "on" : "off"}</small>
            </button>
          );
        })}
      </div>

      <div className="sidebar-card">
        <strong>{scanStatus === "running" ? "Scan en progreso" : scan ? "Último scan" : "Scan disponible"}</strong>
        <p>
          {scanStatus === "error"
            ? "No se pudo completar el scan. Verificá Neo4j e intentá de nuevo."
            : scan
              ? `${scan.opportunitiesFound} oportunidades y ${scan.riskCyclesFound} ciclos de riesgo en ${scan.marketplacesScanned.join(", ")}.`
              : "Ejecutá un scan para actualizar oportunidades y rutas sospechosas."}
        </p>
        <button className="scan-button" onClick={onRunScan} disabled={scanStatus === "running"}>
          {scanStatus === "running" ? <><Radar size={15} /> Escaneando…</> : <><DatabaseZap size={15} /> Ejecutar scan</>}
        </button>
      </div>
    </aside>
  );
}
