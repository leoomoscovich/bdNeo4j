import type { ScanSummary } from "@/lib/types";
import { marketplaceIds, type MarketplaceId, type WorkspaceId } from "@/lib/ui-state";
import { Activity, BarChart3, DatabaseZap, Eye, GitBranch, LayoutDashboard, Radar, Scale, ShieldAlert, Star, Users } from "lucide-react";
import type { ComponentType } from "react";

type SidebarNavItem = {
  id: WorkspaceId;
  label: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
  badge?: string;
};

const navItems: SidebarNavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, badge: "12" },
  { id: "market-radar", label: "Market Radar", icon: BarChart3, badge: "live" },
  { id: "risk-cycles", label: "Risk Cycles", icon: ShieldAlert, badge: "7" },
  { id: "graph-explorer", label: "Graph Explorer", icon: GitBranch },
  { id: "traders", label: "Traders", icon: Users, badge: "1.2k" },
  { id: "watchlist", label: "Watchlist", icon: Star, badge: "local" },
];

const marketplaceIcons: Record<MarketplaceId, ComponentType<{ size?: number; strokeWidth?: number }>> = {
  CSFloat: Activity,
  BUFF163: Eye,
  Skinport: Scale,
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
        <strong>{scanStatus === "running" ? "Deep scan running" : scan ? "Latest deep scan" : "Live scan ready"}</strong>
        <p>
          {scanStatus === "error"
            ? "The scan could not be completed. Check Neo4j and try again."
            : scan
              ? `${scan.opportunitiesFound} opportunities and ${scan.riskCyclesFound} risk cycles across ${scan.marketplacesScanned.join(", ")}.`
              : "Run a backend scan to refresh opportunities and suspicious routes."}
        </p>
        <button className="scan-button" onClick={onRunScan} disabled={scanStatus === "running"}>
          {scanStatus === "running" ? <><Radar size={15} /> Scanning...</> : <><DatabaseZap size={15} /> Run deep scan</>}
        </button>
      </div>
    </aside>
  );
}
