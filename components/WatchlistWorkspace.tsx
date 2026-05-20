"use client";

/* eslint-disable react-hooks/set-state-in-effect -- Watchlist hydrates from localStorage and API requests after mount. */

import { useEffect, useState } from "react";
import { getWatchlistIds, setWatchlistIds } from "@/lib/local-preferences";
import type { Opportunity } from "@/lib/types";
import type { AppFilters } from "@/lib/ui-state";
import { serializeMarketplaces } from "@/lib/ui-state";

type WatchlistWorkspaceProps = {
  filters: AppFilters;
  onSelect: (opp: Opportunity) => void;
  onOpenGraph: (opp: Opportunity) => void;
  onCompare: (opp: Opportunity) => void;
};

export function WatchlistWorkspace({ filters, onSelect, onOpenGraph, onCompare }: WatchlistWorkspaceProps) {
  const [ids, setIds] = useState<string[]>([]);
  const [items, setItems] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIds(getWatchlistIds());
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      marketplaces: serializeMarketplaces(filters.marketplaces),
      minSpreadPct: "0",
      maxRiskScore: String(filters.maxRiskScore),
    });

    fetch(`/api/opportunities?${params}`)
      .then((res) => res.json())
      .then((data: Opportunity[]) => setItems(data.filter((opp) => ids.includes(opp.id) || ids.includes(opp.instanceId))))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [filters, ids]);

  function remove(id: string) {
    const next = ids.filter((item) => item !== id);
    setIds(next);
    setWatchlistIds(next);
  }

  return (
    <section className="table-panel">
      <div className="panel-header">
        <div>
          <h2>Watchlist</h2>
          <p>Anonymous local watchlist, hydrated with current market data.</p>
        </div>
      </div>

      {loading && <div className="feed-loading"><div className="loading-spinner" /><span>Loading watchlist...</span></div>}
      {!loading && ids.length === 0 && <div className="feed-empty"><p>No tracked opportunities yet. Use Track from the drawer.</p></div>}
      {!loading && ids.length > 0 && items.length === 0 && <div className="feed-empty"><p>Tracked ids were not found in the current filters.</p></div>}

      {!loading && items.length > 0 && (
        <div className="table-scroll">
          <table className="opp-table">
            <thead>
              <tr>
                <th>Skin</th>
                <th>Marketplace</th>
                <th>Ask</th>
                <th>Spread</th>
                <th>Signal</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((opp) => (
                <tr key={opp.id} className="opp-row" onClick={() => onSelect(opp)}>
                  <td className="opp-skin-name">{opp.skinName}</td>
                  <td>{opp.marketplace}</td>
                  <td>${opp.currentAskUsd.toFixed(2)}</td>
                  <td>{opp.spreadPct.toFixed(1)}%</td>
                  <td>{opp.signal}</td>
                  <td>
                    <button className="ghost-action" onClick={(e) => { e.stopPropagation(); onOpenGraph(opp); }}>Graph</button>
                    <button className="ghost-action" onClick={(e) => { e.stopPropagation(); onCompare(opp); }}>Compare</button>
                    <button className="ghost-action" onClick={(e) => { e.stopPropagation(); remove(opp.id); }}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
