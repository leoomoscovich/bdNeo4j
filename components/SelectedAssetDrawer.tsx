"use client";

import type { Opportunity, RiskCycle } from "@/lib/types";

interface SelectedAssetDrawerProps {
  selectedOpportunity?: Opportunity | null;
  selectedRiskCycle?: RiskCycle | null;
  onClose: () => void;
  onTrack?: () => void;
  onCompare?: () => void;
  onOpenGraph?: () => void;
  onExport?: () => void;
}

function severityColor(severity: string) {
  switch (severity) {
    case "CRITICAL":
      return "bg-red-500/20 text-red-400 border-red-500/40";
    case "HIGH":
      return "bg-orange-500/20 text-orange-400 border-orange-500/40";
    case "MEDIUM":
      return "bg-amber-500/20 text-amber-400 border-amber-500/40";
    default:
      return "bg-green-500/20 text-green-400 border-green-500/40";
  }
}

function signalColor(signal: string) {
  switch (signal) {
    case "UNDERPRICED":
    case "FAST_FLIP":
      return "bg-green-500/20 text-green-400 border-green-500/40";
    case "STICKER_PREMIUM":
    case "LOW_FLOAT_PREMIUM":
      return "bg-cyan-500/20 text-cyan-400 border-cyan-500/40";
    case "THIN_MARKET":
      return "bg-amber-500/20 text-amber-400 border-amber-500/40";
    case "RISK_ADJUSTED":
      return "bg-red-500/20 text-red-400 border-red-500/40";
    default:
      return "bg-white/10 text-gray-300 border-white/20";
  }
}

function scoreColor(score: number) {
  if (score >= 80) return "text-green-400";
  if (score >= 60) return "text-amber-400";
  return "text-red-400";
}

function scoreRingColor(score: number) {
  if (score >= 80) return "border-green-400/40";
  if (score >= 60) return "border-amber-400/40";
  return "border-red-400/40";
}

function scoreRingBg(score: number) {
  if (score >= 80) return "from-green-400/14";
  if (score >= 60) return "from-amber-400/14";
  return "from-red-400/14";
}

function riskScoreBarColor(score: number) {
  if (score >= 80) return "bg-red-500";
  if (score >= 60) return "bg-orange-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-green-500";
}

export function SelectedAssetDrawer({
  selectedOpportunity,
  selectedRiskCycle,
  onClose,
  onTrack,
  onCompare,
  onOpenGraph,
  onExport,
}: SelectedAssetDrawerProps) {
  const hasSelection = !!selectedOpportunity || !!selectedRiskCycle;

  return (
    <>
      {/* Mobile overlay backdrop */}
      {hasSelection && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={`
          fixed right-0 top-0 z-50 h-full w-full max-w-[380px]
          overflow-y-auto border-l border-white/10
          bg-[rgba(7,11,17,0.95)] backdrop-blur-md
          transition-transform duration-300 ease-in-out
          lg:w-[380px]
          ${hasSelection ? "translate-x-0" : "translate-x-full"}
        `}
        aria-label="Detalle seleccionado"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-white/10 p-5">
          {hasSelection ? (
            <div className="min-w-0">
              <h2 className="truncate text-xl font-extrabold tracking-tight text-white">
                {selectedOpportunity?.skinName ?? selectedRiskCycle?.title}
              </h2>
              <p className="mt-1 truncate text-sm text-[var(--text-muted)]">
                {selectedOpportunity
                  ? `${selectedOpportunity.wear} · Float ${selectedOpportunity.float}`
                  : selectedRiskCycle
                    ? `${selectedRiskCycle.skinName} · ${selectedRiskCycle.timeWindowHours}h window`
                    : ""}
              </p>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-white">
                Asset Details
              </h2>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Select an opportunity or risk cycle
              </p>
            </div>
          )}

          {/* Score ring or close button */}
          <div className="flex shrink-0 items-center gap-3">
            {selectedOpportunity && (
              <div
                className={`
                  grid h-16 w-16 place-items-center rounded-full
                  border bg-gradient-to-b to-transparent font-black
                  ${scoreRingColor(selectedOpportunity.confidenceScore)}
                  ${scoreRingBg(selectedOpportunity.confidenceScore)}
                  ${scoreColor(selectedOpportunity.confidenceScore)}
                `}
              >
                {selectedOpportunity.confidenceScore}
              </div>
            )}
            {selectedRiskCycle && (
              <div
                className={`
                  grid h-16 w-16 place-items-center rounded-full
                  border bg-gradient-to-b to-transparent font-black
                  ${scoreRingColor(selectedRiskCycle.riskScore)}
                  ${scoreRingBg(selectedRiskCycle.riskScore)}
                  ${scoreColor(selectedRiskCycle.riskScore)}
                `}
              >
                {selectedRiskCycle.riskScore}
              </div>
            )}
            <button
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 text-lg text-[var(--text-muted)] transition hover:border-white/20 hover:text-white"
              aria-label="Cerrar panel"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* No selection state */}
          {!hasSelection && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-3xl">
                ◎
              </div>
              <p className="text-sm font-semibold text-white">
                No asset selected
              </p>
              <p className="mt-2 max-w-[260px] text-sm text-[var(--text-muted)]">
                Select an opportunity from the feed or a risk cycle card to view
                details here.
              </p>
            </div>
          )}

          {/* Opportunity selected */}
          {selectedOpportunity && (
            <>
              {/* Market Read */}
              <section className="border-b border-white/10 py-4">
                <h3 className="mb-3 text-xs font-extrabold uppercase tracking-widest text-[var(--text-muted)]">
                  Market read
                </h3>
                <div className="grid grid-cols-2 gap-2.5">
                  <Stat
                    label="Current ask"
                    value={`$${selectedOpportunity.currentAskUsd.toFixed(2)}`}
                  />
                  <Stat
                    label="Fair value"
                    value={`$${selectedOpportunity.fairValueUsd.toFixed(2)}`}
                  />
                  <Stat
                    label="Spread"
                    value={`${selectedOpportunity.spreadPct >= 0 ? "+" : ""}${selectedOpportunity.spreadPct.toFixed(1)}%`}
                    valueClass={
                      selectedOpportunity.spreadPct >= 0
                        ? "text-green-400"
                        : "text-red-400"
                    }
                  />
                  <Stat
                    label="Risk"
                    value={
                      selectedOpportunity.riskScore >= 70
                        ? "High"
                        : selectedOpportunity.riskScore >= 40
                          ? "Medium"
                          : "Low"
                    }
                  />
                </div>
              </section>

              {/* Signal */}
              <section className="border-b border-white/10 py-4">
                <h3 className="mb-3 text-xs font-extrabold uppercase tracking-widest text-[var(--text-muted)]">
                  Detected signal
                </h3>
                <span
                  className={`
                    inline-flex items-center rounded-full border px-3 py-1
                    text-xs font-black
                    ${signalColor(selectedOpportunity.signal)}
                  `}
                >
                  {selectedOpportunity.signal.replace(/_/g, " ")}
                </span>
              </section>

              {/* Trader Path */}
              <section className="border-b border-white/10 py-4">
                <h3 className="mb-3 text-xs font-extrabold uppercase tracking-widest text-[var(--text-muted)]">
                  Trader path
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedOpportunity.traderPath.map((trader, i) => (
                    <span
                      key={`${trader}-${i}`}
                      className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-extrabold text-[var(--text-muted)]"
                    >
                      {trader}
                    </span>
                  ))}
                </div>
              </section>

              {/* Event Timeline */}
              <section className="border-b border-white/10 py-4">
                <h3 className="mb-3 text-xs font-extrabold uppercase tracking-widest text-[var(--text-muted)]">
                  Event timeline
                </h3>
                <div className="grid gap-2.5">
                  {selectedOpportunity.eventTimeline.map((event, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-white/10 bg-white/5 p-3"
                    >
                      <strong className="block text-sm text-white">
                        {event.title}
                      </strong>
                      <span className="mt-1 block text-xs text-[var(--text-muted)]">
                        {event.description}
                      </span>
                      {event.timestamp && (
                        <span className="mt-1 block text-[11px] text-[var(--text-muted)] opacity-70">
                          {event.timestamp}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2.5 pt-4">
                {onTrack && (
                  <button
                    onClick={onTrack}
                    className="rounded-xl border-0 bg-gradient-to-r from-green-400 to-cyan-400 px-4 py-2.5 text-sm font-black text-[#031018] transition hover:opacity-90"
                  >
                    Track
                  </button>
                )}
                {onOpenGraph && (
                  <button
                    onClick={onOpenGraph}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-black text-white transition hover:border-white/20"
                  >
                    Open graph
                  </button>
                )}
                {onCompare && (
                  <button
                    onClick={onCompare}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-black text-white transition hover:border-white/20"
                  >
                    Compare
                  </button>
                )}
                {onExport && (
                  <button
                    onClick={onExport}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-black text-white transition hover:border-white/20"
                  >
                    Export
                  </button>
                )}
              </div>
            </>
          )}

          {/* Risk Cycle selected */}
          {selectedRiskCycle && (
            <>
              {/* Risk Assessment */}
              <section className="border-b border-white/10 py-4">
                <h3 className="mb-3 text-xs font-extrabold uppercase tracking-widest text-[var(--text-muted)]">
                  Risk assessment
                </h3>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="col-span-2 rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-xs text-[var(--text-muted)]">
                        Risk score
                      </span>
                      <span
                        className={`text-sm font-black ${scoreColor(selectedRiskCycle.riskScore)}`}
                      >
                        {selectedRiskCycle.riskScore}/100
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${riskScoreBarColor(selectedRiskCycle.riskScore)}`}
                        style={{
                          width: `${selectedRiskCycle.riskScore}%`,
                        }}
                      />
                    </div>
                  </div>
                  <Stat
                    label="Severity"
                    value={selectedRiskCycle.severity}
                    valueClass={severityColor(selectedRiskCycle.severity)}
                    isBadge
                  />
                  <Stat
                    label="Value moved"
                    value={`$${selectedRiskCycle.valueMovedUsd.toFixed(2)}`}
                  />
                  <Stat
                    label="Time window"
                    value={`${selectedRiskCycle.timeWindowHours}h`}
                  />
                </div>
              </section>

              {/* Trader Path */}
              <section className="border-b border-white/10 py-4">
                <h3 className="mb-3 text-xs font-extrabold uppercase tracking-widest text-[var(--text-muted)]">
                  Trader path
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  {selectedRiskCycle.traderPath.map((trader, i) => (
                    <span key={`${trader}-${i}`} className="flex items-center gap-2">
                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-extrabold text-[var(--text-muted)]">
                        {trader}
                      </span>
                      {i < selectedRiskCycle.traderPath.length - 1 && (
                        <span className="text-xs text-[var(--text-muted)]">→</span>
                      )}
                    </span>
                  ))}
                </div>
              </section>

              {/* Evidence */}
              <section className="border-b border-white/10 py-4">
                <h3 className="mb-3 text-xs font-extrabold uppercase tracking-widest text-[var(--text-muted)]">
                  Evidence
                </h3>
                <div className="grid gap-2.5">
                  {selectedRiskCycle.evidence.map((item, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-white/10 bg-white/5 p-3"
                    >
                      <strong className="block text-sm text-white">
                        {item.title}
                      </strong>
                      <span className="mt-1 block text-xs text-[var(--text-muted)]">
                        {item.description}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2.5 pt-4">
                {onOpenGraph && (
                  <button
                    onClick={onOpenGraph}
                    className="rounded-xl border-0 bg-gradient-to-r from-green-400 to-cyan-400 px-4 py-2.5 text-sm font-black text-[#031018] transition hover:opacity-90"
                  >
                    Open graph
                  </button>
                )}
                {onExport && (
                  <button
                    onClick={onExport}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-black text-white transition hover:border-white/20"
                  >
                    Export
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
}

function Stat({
  label,
  value,
  valueClass,
  isBadge,
}: {
  label: string;
  value: string;
  valueClass?: string;
  isBadge?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <span className="block text-xs text-[var(--text-muted)]">{label}</span>
      {isBadge ? (
        <span className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-xs font-black ${valueClass}`}>
          {value}
        </span>
      ) : (
        <strong className={`mt-1 block text-lg tracking-tight ${valueClass ?? "text-white"}`}>
          {value}
        </strong>
      )}
    </div>
  );
}
