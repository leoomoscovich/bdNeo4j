export type NodeType =
  | "skin"
  | "instance"
  | "trader"
  | "transaction"
  | "marketplace"
  | "collection"
  | "weapon"
  | "sticker"
  | "price";

export type JsonValue = string | number | boolean | null;

export type SkinSearchResult = {
  id: string;
  name: string;
  weapon: string;
  collection: string;
  rarity: string;
  imageUrl?: string;
};

export type GraphNode = {
  id: string;
  label: string;
  type: NodeType;
  data: Record<string, JsonValue>;
};

export type GraphEdge = {
  id: string;
  source: string;
  target: string;
  label: string;
  type: string;
};

export type GraphResponse = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export type MetricsResponse = {
  skinsIndexed: number;
  transactionsTracked: number;
  activeTraders: number;
  estimatedVolumeUsd: number;
};

export type NodeDetailsResponse = {
  id: string;
  type: NodeType;
  label: string;
  properties: Record<string, JsonValue>;
  timeline: Array<{
    title: string;
    description: string;
  }>;
};

export type SignalType =
  | "UNDERPRICED"
  | "FAST_FLIP"
  | "STICKER_PREMIUM"
  | "LOW_FLOAT_PREMIUM"
  | "THIN_MARKET"
  | "RISK_ADJUSTED";

export type Opportunity = {
  id: string;
  skinId: string;
  instanceId: string;
  skinName: string;
  weapon: string;
  rarity: string;
  wear: string;
  float: number;
  marketplace: string;
  currentAskUsd: number;
  fairValueUsd: number;
  spreadPct: number;
  confidenceScore: number;
  riskScore: number;
  signal: SignalType;
  traderPath: string[];
  eventTimeline: Array<{
    title: string;
    description: string;
    timestamp?: string;
  }>;
};

export type RiskCycle = {
  id: string;
  title: string;
  instanceId: string;
  skinName: string;
  traderPath: string[];
  valueMovedUsd: number;
  timeWindowHours: number;
  riskScore: number;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  evidence: Array<{
    title: string;
    description: string;
  }>;
};

export type MarketPulse = {
  trackedVolumeUsd: number;
  dealsDetected: number;
  averageSpreadPct: number;
  suspiciousCycles: number;
  activeTraders: number;
};

export type TraderSummary = {
  id: string;
  handle: string;
  transactionCount: number;
  volumeUsd: number;
  avgMarginPct: number;
  riskScore: number;
  marketplaces: string[];
};

export type TraderProfile = TraderSummary & {
  country: string;
  reputation: number;
  firstSeenAt: string;
};

export type ScanSummary = {
  id: string;
  status: "COMPLETED" | "RUNNING" | "FAILED";
  startedAt: string;
  completedAt?: string;
  opportunitiesFound: number;
  riskCyclesFound: number;
  marketplacesScanned: string[];
};

export type SkinCatalogItem = {
  id: string;
  name: string;
  weapon: string;
  collection: string;
  rarity: string;
  imageUrl: string;
  instanceCount: number;
  latestPrice: number | null;
  latestMarketplace: string | null;
};

export type InstanceSummary = {
  id: string;
  floatValue: number;
  wear: string;
  serial: string;
  txHistory: Array<{
    priceUsd: number;
    marketplace: string;
    timestamp: string;
    sellerId: string;
    sellerName: string;
  }>;
};

export type SkinDetail = {
  id: string;
  name: string;
  weapon: string;
  collection: string;
  rarity: string;
  imageUrl: string;
  instances: InstanceSummary[];
};

export type JourneyStep = {
  txId: string;
  priceUsd: number;
  timestamp: string;
  marketplace: string;
  seller: { id: string; name: string; reputation: number; riskScore: number };
  buyer: { id: string; name: string } | null;
};

export type TraderReputation = {
  id: string;
  name: string;
  reputation: number;
  riskScore: number;
  country: string;
  txCount: number;
  volumeUsd: number;
  avgPeerReputation: number;
  reputationLabel: "trusted" | "neutral" | "suspicious";
};

export type SkinDetailResponse = {
  skin: SkinDetail;
  journey: JourneyStep[];
  currentSeller: TraderReputation | null;
};

export type CompareItem = {
  id: string;
  label: string;
  marketplace: string;
  askUsd: number;
  fairValueUsd: number;
  spreadPct: number;
  riskScore: number;
  signal: string;
};

export type CompareResponse = {
  items: CompareItem[];
};
