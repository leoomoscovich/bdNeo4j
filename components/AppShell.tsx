import type { ReactNode } from "react";
import type { ScanSummary } from "@/lib/types";
import type { AppFilters, MarketplaceId, WorkspaceId } from "@/lib/ui-state";
import { SidebarNav } from "./SidebarNav";
import { Topbar } from "./Topbar";

type AppShellProps = {
  children: ReactNode;
  activeNav: WorkspaceId;
  filters: AppFilters;
  scan?: ScanSummary | null;
  scanStatus?: "idle" | "running" | "error";
  onNavChange: (id: WorkspaceId) => void;
  onMarketplaceToggle: (marketplace: MarketplaceId) => void;
  onRunScan: () => void;
  onSearch?: (query: string) => void;
};

export function AppShell({
  children,
  activeNav,
  filters,
  scan,
  scanStatus = "idle",
  onNavChange,
  onMarketplaceToggle,
  onRunScan,
  onSearch,
}: AppShellProps) {
  return (
    <div className="app">
      <SidebarNav
        activeNav={activeNav}
        activeMarketplaces={filters.marketplaces}
        scan={scan}
        scanStatus={scanStatus}
        onNavChange={onNavChange}
        onMarketplaceToggle={onMarketplaceToggle}
        onRunScan={onRunScan}
      />
      <main className="main">
        <Topbar
          activeNav={activeNav}
          filters={filters}
          scanStatus={scanStatus}
          onNavChange={onNavChange}
          onRunScan={onRunScan}
          onSearch={onSearch}
        />
        {children}
      </main>
    </div>
  );
}
