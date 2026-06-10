/* eslint-disable react-hooks/set-state-in-effect -- Controlled input mirrors externally applied global search filters. */

import { useEffect, useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import type { AppFilters, WorkspaceId } from "@/lib/ui-state";

type TopbarProps = {
  activeNav: WorkspaceId;
  filters: AppFilters;
  scanStatus: "idle" | "running" | "error";
  onNavChange: (id: WorkspaceId) => void;
  onRunScan: () => void;
  onSearch?: (query: string) => void;
};

export function Topbar({ filters, onSearch }: TopbarProps) {
  const [query, setQuery] = useState(filters.query);

  useEffect(() => {
    setQuery(filters.query);
  }, [filters.query]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSearch?.(query);
  }

  return (
    <header className="topbar">
      <form className="global-search" onSubmit={handleSubmit}>
        <Search className="search-icon" size={16} />
        <input
          aria-label="Búsqueda global"
          placeholder="Buscar skin, trader, float, sticker, marketplace…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value === "") {
              onSearch?.("");
            }
          }}
        />
      </form>
      <div className="top-actions">
        <span className="status-pill">
          <span className="status-dot" />
          En vivo
        </span>
        <span className="filter-pill">{filters.marketplaces.length} markets</span>
        <span className="filter-pill">Spread mín: {filters.minSpreadPct}%</span>
        <span className="risk-pill">Riesgo máx: {filters.maxRiskScore}</span>
      </div>
    </header>
  );
}
