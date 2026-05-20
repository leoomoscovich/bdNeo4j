export type WorkspaceId =
  | "dashboard"
  | "market-radar"
  | "risk-cycles"
  | "graph-explorer"
  | "traders"
  | "watchlist"
  | "compare";

export type MarketplaceId = "CSFloat" | "BUFF163" | "Skinport";

export type SignalFilter =
  | "ALL"
  | "UNDERPRICED"
  | "FAST_FLIP"
  | "STICKER_PREMIUM"
  | "LOW_FLOAT_PREMIUM"
  | "THIN_MARKET"
  | "RISK_ADJUSTED";

export type AppFilters = {
  query: string;
  marketplaces: MarketplaceId[];
  signal: SignalFilter;
  minSpreadPct: number;
  maxRiskScore: number;
};

export type GraphTarget =
  | { type: "opportunity"; instanceId: string; label: string }
  | { type: "risk-cycle"; cycleId: string; instanceId: string; label: string }
  | { type: "trader"; traderId: string; label: string }
  | { type: "marketplace"; marketplaceId: string; label: string }
  | { type: "skin"; skinId: string; label: string };

export const marketplaceIds: MarketplaceId[] = ["CSFloat", "BUFF163", "Skinport"];

export const defaultFilters: AppFilters = {
  query: "",
  marketplaces: marketplaceIds,
  signal: "ALL",
  minSpreadPct: 5,
  maxRiskScore: 100,
};

export function serializeMarketplaces(marketplaces: MarketplaceId[]) {
  return marketplaces.join(",");
}
