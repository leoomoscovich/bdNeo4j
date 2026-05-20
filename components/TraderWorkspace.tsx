"use client";

/* eslint-disable react-hooks/set-state-in-effect -- Trader loading state is synchronized with API requests keyed by filters. */

import { useEffect, useState } from "react";
import type { TraderSummary } from "@/lib/types";
import type { AppFilters, GraphTarget } from "@/lib/ui-state";
import { serializeMarketplaces } from "@/lib/ui-state";

type TraderWorkspaceProps = {
  filters: AppFilters;
  onOpenGraph: (target: GraphTarget) => void;
};

export function TraderWorkspace({ filters, onOpenGraph }: TraderWorkspaceProps) {
  const [traders, setTraders] = useState<TraderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      q: filters.query,
      marketplaces: serializeMarketplaces(filters.marketplaces),
    });

    fetch(`/api/traders?${params}`)
      .then((res) => {
        if (!res.ok) throw new Error("traders");
        return res.json();
      })
      .then((data: TraderSummary[]) => {
        setTraders(data);
        setError("");
      })
      .catch(() => {
        setError("No se pudieron obtener traders.");
        setTraders([]);
      })
      .finally(() => setLoading(false));
  }, [filters]);

  return (
    <section className="table-panel">
      <div className="panel-header">
        <div>
          <h2>Traders</h2>
          <p>Ranking by volume, activity, risk and connected marketplaces.</p>
        </div>
      </div>

      {loading && <div className="feed-loading"><div className="loading-spinner" /><span>Loading traders...</span></div>}
      {error && <div className="feed-error"><p>{error}</p></div>}
      {!loading && !error && traders.length === 0 && <div className="feed-empty"><p>No traders match the current filters.</p></div>}

      {!loading && !error && traders.length > 0 && (
        <div className="table-scroll">
          <table className="opp-table">
            <thead>
              <tr>
                <th>Trader</th>
                <th>Transactions</th>
                <th>Volume</th>
                <th>Avg margin</th>
                <th>Risk</th>
                <th>Markets</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {traders.map((trader) => (
                <tr key={trader.id} className="opp-row">
                  <td className="opp-skin-name">{trader.handle}</td>
                  <td>{trader.transactionCount}</td>
                  <td>${trader.volumeUsd.toFixed(0)}</td>
                  <td>{trader.avgMarginPct.toFixed(1)}%</td>
                  <td>{trader.riskScore}</td>
                  <td>{trader.marketplaces.join(", ")}</td>
                  <td>
                    <button
                      className="ghost-action"
                      onClick={() => onOpenGraph({ type: "trader", traderId: trader.id, label: trader.handle })}
                    >
                      Open graph
                    </button>
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
