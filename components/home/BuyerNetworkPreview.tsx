"use client";

import { type KeyboardEvent, useState } from "react";
import Link from "next/link";

type PreviewTab = "Buyer Network" | "Risk Cycles" | "Market Radar";

const previewCopy: Record<PreviewTab, { title: string; text: string; metric: string; label: string }> = {
  "Buyer Network": {
    title: "Follow the buyers, not just the price.",
    text: "Detectá compradores conectados por rutas repetidas, flips sincronizados y patrones de acumulación.",
    metric: "18",
    label: "linked buyers",
  },
  "Risk Cycles": {
    title: "Suspicious routes become visible.",
    text: "Identificá ciclos donde una misma instancia vuelve a aparecer con precios anómalos y ownership circular.",
    metric: "7",
    label: "risk cycles",
  },
  "Market Radar": {
    title: "Surface opportunities with context.",
    text: "Priorizá spreads por confianza, liquidez, marketplace y calidad del trader path.",
    metric: "42",
    label: "opportunities",
  },
};

const tabs: PreviewTab[] = ["Buyer Network", "Risk Cycles", "Market Radar"];

function toTabId(tab: PreviewTab) {
  return tab.toLowerCase().replaceAll(" ", "-");
}

function getTabButtonId(tab: PreviewTab) {
  return `preview-tab-${toTabId(tab)}`;
}

function getTabPanelId(tab: PreviewTab) {
  return `preview-panel-${toTabId(tab)}`;
}

export function BuyerNetworkPreview() {
  const [activeTab, setActiveTab] = useState<PreviewTab>("Buyer Network");
  const active = previewCopy[activeTab];

  function selectTab(tab: PreviewTab) {
    setActiveTab(tab);
    document.getElementById(getTabButtonId(tab))?.focus();
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, tab: PreviewTab) {
    const currentIndex = tabs.indexOf(tab);
    let nextTab: PreviewTab | undefined;

    if (event.key === "ArrowRight") {
      nextTab = tabs[(currentIndex + 1) % tabs.length];
    } else if (event.key === "ArrowLeft") {
      nextTab = tabs[(currentIndex - 1 + tabs.length) % tabs.length];
    } else if (event.key === "Home") {
      nextTab = tabs[0];
    } else if (event.key === "End") {
      nextTab = tabs[tabs.length - 1];
    }

    if (!nextTab) return;

    event.preventDefault();
    selectTab(nextTab);
  }

  return (
    <section id="preview" className="buyer-preview">
      <div className="buyer-preview-copy">
        <p className="home-kicker">Product preview</p>
        <h2>{active.title}</h2>
        <p>{active.text}</p>
        <div className="preview-tabs" role="tablist" aria-label="SkinGraph preview modes">
          {tabs.map((tab) => (
            <button
              key={tab}
              id={getTabButtonId(tab)}
              type="button"
              role="tab"
              aria-controls={getTabPanelId(tab)}
              aria-selected={activeTab === tab}
              tabIndex={activeTab === tab ? 0 : -1}
              className={activeTab === tab ? "active" : ""}
              onClick={() => setActiveTab(tab)}
              onKeyDown={(event) => handleTabKeyDown(event, tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        <Link className="home-secondary-link preview-link" href="/dashboard">
          Explore in dashboard
        </Link>
      </div>

      {tabs.map((tab) => {
        const copy = previewCopy[tab];

        return (
          <div
            key={tab}
            className="preview-panel"
            role="tabpanel"
            id={getTabPanelId(tab)}
            aria-labelledby={getTabButtonId(tab)}
            hidden={activeTab !== tab}
          >
            <div className="preview-network" aria-hidden="true">
              <span className="preview-node node-main">{copy.metric}</span>
              <span className="preview-node node-a">Buyer</span>
              <span className="preview-node node-b">Trade</span>
              <span className="preview-node node-c">Skin</span>
              <span className="preview-node node-d">Market</span>
              <svg viewBox="0 0 620 420" className="preview-lines" role="presentation">
                <path d="M310 206 C240 136 164 112 104 136" />
                <path d="M310 206 C408 114 490 104 538 146" />
                <path d="M310 206 C218 274 178 334 108 318" />
                <path d="M310 206 C390 296 468 330 534 286" />
              </svg>
            </div>
            <div className="preview-stat">
              <strong>{copy.metric}</strong>
              <span>{copy.label}</span>
            </div>
          </div>
        );
      })}
    </section>
  );
}
