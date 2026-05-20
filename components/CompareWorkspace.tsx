"use client";

/* eslint-disable react-hooks/set-state-in-effect -- Comparison state is synchronized from an API request keyed by selected ids. */

import { useEffect, useState } from "react";
import type { CompareResponse } from "@/lib/types";

type CompareWorkspaceProps = {
  ids: string[];
  onClear: () => void;
};

export function CompareWorkspace({ ids, onClear }: CompareWorkspaceProps) {
  const [comparison, setComparison] = useState<CompareResponse>({ items: [] });
  const [error, setError] = useState("");

  useEffect(() => {
    if (ids.length < 2) {
      setComparison({ items: [] });
      return;
    }

    fetch(`/api/compare?ids=${ids.map(encodeURIComponent).join(",")}`)
      .then((res) => {
        if (!res.ok) throw new Error("compare");
        return res.json();
      })
      .then((data: CompareResponse) => {
        setComparison(data);
        setError("");
      })
      .catch(() => {
        setComparison({ items: [] });
        setError("No se pudo comparar la seleccion.");
      });
  }, [ids]);

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Compare</h2>
          <p>Side-by-side view for tracked opportunities and market signals.</p>
        </div>
        {ids.length > 0 && <button className="ghost-action" onClick={onClear}>Clear</button>}
      </div>

      {ids.length < 2 && <div className="feed-empty"><p>Add at least two opportunities with Compare.</p></div>}
      {error && <div className="feed-error"><p>{error}</p></div>}

      {comparison.items.length > 0 && (
        <div className="market-pulse" style={{ padding: 18 }}>
          {comparison.items.map((item) => (
            <div className="pulse-card" key={item.id}>
              <strong>{item.label}</strong>
              <span>{item.marketplace}</span>
              <span>Ask ${item.askUsd.toFixed(2)} / fair ${item.fairValueUsd.toFixed(2)}</span>
              <span>Spread {item.spreadPct.toFixed(1)}% / risk {item.riskScore}</span>
              <span>{item.signal}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
