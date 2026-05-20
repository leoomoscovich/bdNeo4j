import neo4j, { type Node, type Record as Neo4jRecord } from "neo4j-driver";
import type { CompareResponse, GraphEdge, GraphNode, GraphResponse, JsonValue, MarketPulse, MetricsResponse, NodeDetailsResponse, NodeType, Opportunity, RiskCycle, ScanSummary, SignalType, SkinSearchResult, TraderProfile, TraderSummary } from "./types";

const labelToType: Record<string, NodeType> = {
  Skin: "skin",
  SkinInstance: "instance",
  Trader: "trader",
  Transaction: "transaction",
  Marketplace: "marketplace",
  Collection: "collection",
  Weapon: "weapon",
  Sticker: "sticker",
  PriceSnapshot: "price",
};

function toJsonValue(value: unknown): JsonValue {
  if (neo4j.isInt(value)) {
    return value.toNumber();
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value === null) {
    return value;
  }

  if (typeof value === "object" && value && "toString" in value) {
    return String(value);
  }

  return null;
}

function nodeId(node: Node) {
  return String(node.properties.id ?? node.elementId);
}

function nodeLabel(node: Node) {
  return String(node.properties.name ?? node.properties.serial ?? node.properties.id ?? node.elementId);
}

function nodeType(node: Node): NodeType {
  const label = node.labels.find((item) => labelToType[item]);
  return label ? labelToType[label] : "skin";
}

function graphNode(node: Node | null | undefined): GraphNode | null {
  if (!node) {
    return null;
  }

  return {
    id: nodeId(node),
    label: nodeLabel(node),
    type: nodeType(node),
    data: Object.fromEntries(Object.entries(node.properties).map(([key, value]) => [key, toJsonValue(value)])),
  };
}

function addNode(nodes: Map<string, GraphNode>, node: Node | null | undefined) {
  const mapped = graphNode(node);

  if (mapped) {
    nodes.set(mapped.id, mapped);
  }
}

function addEdge(edges: Map<string, GraphEdge>, source: Node | null | undefined, target: Node | null | undefined, type: string) {
  if (!source || !target) {
    return;
  }

  const id = `${nodeId(source)}-${type}-${nodeId(target)}`;
  edges.set(id, { id, source: nodeId(source), target: nodeId(target), label: type.replaceAll("_", " "), type });
}

export function mapSkinSearch(records: Neo4jRecord[]): SkinSearchResult[] {
  return records.map((record) => ({
    id: String(record.get("id")),
    name: String(record.get("name")),
    weapon: String(record.get("weapon")),
    collection: String(record.get("collection") ?? "Sin coleccion"),
    rarity: String(record.get("rarity")),
    imageUrl: String(record.get("imageUrl") ?? ""),
  }));
}

export function mapMetrics(records: Neo4jRecord[]): MetricsResponse {
  const record = records[0];

  return {
    skinsIndexed: toJsonValue(record?.get("skinsIndexed")) as number || 0,
    transactionsTracked: toJsonValue(record?.get("transactionsTracked")) as number || 0,
    activeTraders: toJsonValue(record?.get("activeTraders")) as number || 0,
    estimatedVolumeUsd: Math.round((toJsonValue(record?.get("estimatedVolumeUsd")) as number || 0) * 100) / 100,
  };
}

export function mapGraph(records: Neo4jRecord[]): GraphResponse {
  const nodes = new Map<string, GraphNode>();
  const edges = new Map<string, GraphEdge>();

  for (const record of records) {
    const skin = record.get("skin") as Node | null;
    const weapon = record.get("weapon") as Node | null;
    const collection = record.get("collection") as Node | null;
    const instance = record.get("instance") as Node | null;
    const sticker = record.get("sticker") as Node | null;
    const tx = record.get("tx") as Node | null;
    const marketplace = record.get("marketplace") as Node | null;
    const buyer = record.get("buyer") as Node | null;
    const seller = record.get("seller") as Node | null;

    addNode(nodes, skin);
    addNode(nodes, weapon);
    addNode(nodes, collection);
    addEdge(edges, skin, weapon, "FOR_WEAPON");
    addEdge(edges, skin, collection, "BELONGS_TO");

    addNode(nodes, instance);
    addNode(nodes, sticker);
    addNode(nodes, tx);
    addNode(nodes, marketplace);
    addNode(nodes, buyer);
    addNode(nodes, seller);
    addEdge(edges, instance, skin, "INSTANCE_OF");
    addEdge(edges, instance, sticker, "HAS_STICKER");
    addEdge(edges, tx, instance, "FOR_INSTANCE");
    addEdge(edges, tx, marketplace, "ON_MARKETPLACE");
    addEdge(edges, buyer, tx, "BOUGHT");
    addEdge(edges, seller, tx, "SOLD");
  }

  return { nodes: [...nodes.values()], edges: [...edges.values()] };
}

export function mapNodeDetails(records: Neo4jRecord[], type: NodeType, id: string): NodeDetailsResponse | null {
  const record = records[0];
  const node = record?.get("n") as Node | undefined;

  if (!node) {
    return null;
  }

  const timeline = (record.get("timeline") as Array<Record<string, unknown>>)
    .filter((item) => item.id)
    .map((item) => ({
      title: `${item.marketplace ?? "Marketplace"} · $${toJsonValue(item.priceUsd)}`,
      description: `${item.seller ?? "seller"} -> ${item.buyer ?? "buyer"} · ${toJsonValue(item.timestamp)}`,
    }));

  return {
    id,
    type,
    label: nodeLabel(node),
    properties: Object.fromEntries(Object.entries(node.properties).map(([key, value]) => [key, toJsonValue(value)])),
    timeline,
  };
}

function num(value: unknown): number {
  // Handle Neo4j Integer
  const v = toJsonValue(value);
  if (typeof v === "number") return v;

  // Handle native JS Date
  if (value instanceof Date) {
    return value.getTime() / 1000;
  }

  // Handle Neo4j DateTime-like objects (have year, month, day, hour, minute, second)
  if (value && typeof value === "object" && "year" in value && "month" in value && "day" in value) {
    const obj = value as Record<string, unknown>;
    const d = new Date(
      Number(obj.year ?? 0),
      Number((obj.month ?? 1)) - 1,
      Number(obj.day ?? 1),
      Number(obj.hour ?? 0),
      Number(obj.minute ?? 0),
      Number(obj.second ?? 0),
    );
    if (!isNaN(d.getTime())) return d.getTime() / 1000;
  }

  // Handle ISO datetime strings
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v)) {
    const parsed = Date.parse(v);
    if (!isNaN(parsed)) return parsed / 1000;
  }

  return 0;
}

function str(value: unknown): string {
  const v = toJsonValue(value);
  return v != null ? String(v) : "";
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => str(item)).filter(Boolean) : [];
}

function deriveSignal(spreadPct: number, events: Array<Record<string, unknown>>, stickerCount: number): SignalType {
  if (spreadPct >= 10) {
    return "UNDERPRICED";
  }

  const hasFastFlip = events.length >= 2 && (() => {
    const timestamps = events
      .map((e) => {
        const tx = e.tx as Node | undefined;
        if (!tx) return 0;
        return num((tx.properties as Record<string, unknown>)?.timestamp);
      })
      .filter((t) => t > 0)
      .sort((a, b) => a - b);

    if (timestamps.length < 2) return false;
    const hoursDiff = (timestamps[timestamps.length - 1] - timestamps[0]) / 3600;
    const prices = events
      .map((e) => {
        const tx = e.tx as Node | undefined;
        if (!tx) return 0;
        return num((tx.properties as Record<string, unknown>)?.priceUsd);
      });

    return hoursDiff <= 168 && prices[0] > prices[prices.length - 1];
  })();

  if (hasFastFlip) {
    return "FAST_FLIP";
  }

  if (stickerCount > 0) {
    return "STICKER_PREMIUM";
  }

  if (spreadPct > 0 && spreadPct < 5) {
    return "THIN_MARKET";
  }

  return "RISK_ADJUSTED";
}

function deriveRiskScore(events: Array<Record<string, unknown>>): number {
  let score = 0;

  const uniqueTraders = new Set<string>();
  for (const event of events) {
    const buyer = event.buyer as Node | null;
    const seller = event.seller as Node | null;
    if (buyer) uniqueTraders.add(nodeId(buyer));
    if (seller) uniqueTraders.add(nodeId(seller));
  }

  if (uniqueTraders.size >= 3) {
    score += 20;
  }

  const timestamps = events
    .map((e) => {
      const tx = e.tx as Node | undefined;
      if (!tx) return 0;
      return num((tx.properties as Record<string, unknown>)?.timestamp);
    })
    .filter((t) => t > 0);

  if (timestamps.length >= 2) {
    const hoursDiff = (Math.max(...timestamps) - Math.min(...timestamps)) / 3600;
    if (hoursDiff <= 24) {
      score += 15;
    }
  }

  const prices = events
    .map((e) => {
      const tx = e.tx as Node | undefined;
      if (!tx) return 0;
      return num((tx.properties as Record<string, unknown>)?.priceUsd);
    })
    .filter((p) => p > 0);

  if (prices.length >= 2) {
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const variance = prices.reduce((sum, p) => sum + Math.pow(p - avg, 2), 0) / prices.length;
    const cv = avg > 0 ? Math.sqrt(variance) / avg : 0;
    if (cv > 0.3) {
      score += 5;
    }
  }

  return Math.min(score, 100);
}

function deriveConfidenceScore(spreadPct: number, eventCount: number, riskScore: number): number {
  const spreadComponent = Math.min(spreadPct / 20, 1) * 40;
  const eventComponent = Math.min(eventCount / 5, 1) * 30;
  const riskComponent = (1 - riskScore / 100) * 30;
  return Math.round(spreadComponent + eventComponent + riskComponent);
}

function buildTraderPath(events: Array<Record<string, unknown>>): string[] {
  const path: string[] = [];
  const seen = new Set<string>();

  for (const event of events) {
    const seller = event.seller as Node | null;
    const buyer = event.buyer as Node | null;
    if (seller) {
      const name = nodeLabel(seller);
      if (!seen.has(name)) {
        seen.add(name);
        path.push(name);
      }
    }
    if (buyer) {
      const name = nodeLabel(buyer);
      if (!seen.has(name)) {
        seen.add(name);
        path.push(name);
      }
    }
  }

  return path;
}

function buildEventTimeline(events: Array<Record<string, unknown>>): Opportunity["eventTimeline"] {
  return events
    .filter((e) => e.tx)
    .map((e) => {
      const tx = e.tx as Node | undefined;
      const txProps = tx ? (tx.properties as Record<string, unknown>) : {};
      const marketplace = e.marketplace as Node | null;
      const buyer = e.buyer as Node | null;
      const seller = e.seller as Node | null;
      const timestamp = num(txProps.timestamp);
      const dateStr = timestamp > 0 ? new Date(timestamp * 1000).toISOString() : undefined;

      return {
        title: `${marketplace ? nodeLabel(marketplace) : "Marketplace"} · $${num(txProps.priceUsd)}`,
        description: `${seller ? nodeLabel(seller) : "seller"} -> ${buyer ? nodeLabel(buyer) : "buyer"}`,
        timestamp: dateStr,
      };
    });
}

export function mapOpportunities(records: Neo4jRecord[]): Opportunity[] {
  return records.map((record, index) => {
    const skin = record.get("skin") as Node | null;
    const instance = record.get("instance") as Node | null;
    const latest = record.get("latest") as Record<string, unknown> | null;
    const events = (record.get("events") as Array<Record<string, unknown>>) || [];
    const currentAskUsd = num(record.get("currentAskUsd"));
    const fairValueUsd = num(record.get("fairValueUsd"));
    const spreadPct = Math.round(num(record.get("spreadPct")) * 100) / 100;
    const stickers = (record.get("stickers") as Array<unknown>) || [];

    const weaponNode = skin ? (() => {
      const weapon = skin.properties.weapon as Node | null;
      return weapon ? nodeLabel(weapon) : "";
    })() : "";

    const signal = deriveSignal(spreadPct, events, stickers.length);
    const riskScore = deriveRiskScore(events);
    const confidenceScore = deriveConfidenceScore(spreadPct, events.length, riskScore);
    const traderPath = buildTraderPath(events);
    const eventTimeline = buildEventTimeline(events);

    return {
      id: `opp-${index}-${instance ? nodeId(instance) : "unknown"}`,
      skinId: skin ? nodeId(skin) : "",
      instanceId: instance ? nodeId(instance) : "",
      skinName: skin ? nodeLabel(skin) : "",
      weapon: weaponNode || str(skin?.properties.weaponType) || "",
      rarity: str(skin?.properties.rarity) || "",
      wear: str(instance?.properties.wear) || "",
      float: num(instance?.properties.floatValue),
      marketplace: latest && latest.marketplace ? nodeLabel(latest.marketplace as Node) : "",
      currentAskUsd: Math.round(currentAskUsd * 100) / 100,
      fairValueUsd: Math.round(fairValueUsd * 100) / 100,
      spreadPct,
      confidenceScore,
      riskScore,
      signal,
      traderPath,
      eventTimeline,
    };
  });
}

function computeTimeWindowHours(txs: Array<Record<string, unknown>>): number {
  const timestamps = txs
    .map((tx) => {
      const node = tx as unknown as Node | undefined;
      return num((node?.properties as Record<string, unknown>)?.timestamp);
    })
    .filter((t) => t > 0);

  if (timestamps.length < 2) return 0;
  const diffSeconds = Math.max(...timestamps) - Math.min(...timestamps);
  return Math.round((diffSeconds / 3600) * 100) / 100;
}

function computeCycleRiskScore(traders: Array<Node>, txs: Array<Record<string, unknown>>): number {
  let score = 50;

  if (traders.length >= 3) {
    score += 20;
  }

  const timestamps = txs
    .map((tx) => {
      const node = tx as unknown as Node | undefined;
      return num((node?.properties as Record<string, unknown>)?.timestamp);
    })
    .filter((t) => t > 0);

  if (timestamps.length >= 2) {
    const hoursDiff = (Math.max(...timestamps) - Math.min(...timestamps)) / 3600;
    if (hoursDiff <= 24) {
      score += 15;
    }
  }

  const traderIds = traders.map((t) => nodeId(t));
  if (traderIds.length >= 2 && traderIds[0] === traderIds[traderIds.length - 1]) {
    score += 10;
  }

  const prices = txs
    .map((tx) => {
      const node = tx as unknown as Node | undefined;
      return num((node?.properties as Record<string, unknown>)?.priceUsd);
    })
    .filter((p) => p > 0);

  if (prices.length >= 2) {
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const variance = prices.reduce((sum, p) => sum + Math.pow(p - avg, 2), 0) / prices.length;
    const cv = avg > 0 ? Math.sqrt(variance) / avg : 0;
    if (cv > 0.3) {
      score += 5;
    }
  }

  return Math.min(score, 100);
}

function computeSeverity(riskScore: number): RiskCycle["severity"] {
  if (riskScore >= 90) return "CRITICAL";
  if (riskScore >= 75) return "HIGH";
  if (riskScore >= 60) return "MEDIUM";
  return "LOW";
}

export function mapRiskCycles(records: Neo4jRecord[], minRiskScore: number = 60): RiskCycle[] {
  return records
    .map((record, index) => {
      const instance = record.get("instance") as Node | null;
      const skin = record.get("skin") as Node | null;
      const traders = (record.get("traders") as Array<Node>) || [];
      const txs = (record.get("txs") as Array<Record<string, unknown>>) || [];
      const valueMovedUsd = Math.round(num(record.get("valueMovedUsd")) * 100) / 100;

      const riskScore = computeCycleRiskScore(traders, txs);
      const severity = computeSeverity(riskScore);
      const timeWindowHours = computeTimeWindowHours(txs);

      const traderPath = traders.map((t) => nodeLabel(t));

      const evidence = [
        { title: "Traders involucrados", description: `${traders.length} traders conectados en el ciclo` },
        { title: "Transacciones", description: `${txs.length} transacciones detectadas` },
        { title: "Valor movido", description: `$${valueMovedUsd} USD en total` },
        { title: "Instancia repetida", description: `La instancia ${instance ? nodeLabel(instance) : "desconocida"} aparece en múltiples transacciones` },
      ];

      return {
        id: `cycle-${index}-${instance ? nodeId(instance) : "unknown"}`,
        title: `Ciclo sospechoso · ${skin ? nodeLabel(skin) : "Skin desconocida"}`,
        instanceId: instance ? nodeId(instance) : "",
        skinName: skin ? nodeLabel(skin) : "",
        traderPath,
        valueMovedUsd,
        timeWindowHours,
        riskScore,
        severity,
        evidence,
      };
    })
    .filter((cycle) => cycle.riskScore >= minRiskScore);
}

export function mapMarketPulse(
  baseRecords: Neo4jRecord[],
  dealsRecords: Neo4jRecord[],
  cyclesRecords: Neo4jRecord[],
): MarketPulse {
  const base = baseRecords[0];
  const deals = dealsRecords[0];
  const cycles = cyclesRecords[0];

  const trackedVolumeUsd = Math.round(num(base?.get("trackedVolumeUsd")) * 100) / 100;
  const activeTraders = num(base?.get("activeTraders"));
  const dealsDetected = deals ? num(deals.get("dealsDetected")) : 0;
  const averageSpreadPct = deals ? Math.round(num(deals.get("averageSpreadPct")) * 100) / 100 : 0;
  const suspiciousCycles = cycles ? num(cycles.get("suspiciousCycles")) : 0;

  return {
    trackedVolumeUsd,
    dealsDetected,
    averageSpreadPct,
    suspiciousCycles,
    activeTraders,
  };
}

export function mapTraders(records: Neo4jRecord[]): TraderSummary[] {
  return records.map((record) => {
    const trader = record.get("trader") as Node;
    const volumeUsd = Math.round(num(record.get("volumeUsd")) * 100) / 100;
    const transactionCount = num(record.get("transactionCount"));
    const riskScore = num(trader.properties.riskScore) || Math.min(100, Math.round(transactionCount * 8));

    return {
      id: nodeId(trader),
      handle: str(trader.properties.handle) || nodeLabel(trader),
      transactionCount,
      volumeUsd,
      avgMarginPct: Math.round(Math.min(24, Math.max(2, transactionCount * 1.7)) * 10) / 10,
      riskScore,
      marketplaces: stringList(record.get("marketplaces")),
    };
  });
}

export function mapTraderProfile(records: Neo4jRecord[]): TraderProfile | null {
  const summary = mapTraders(records)[0];
  const trader = records[0]?.get("trader") as Node | undefined;
  if (!summary || !trader) {
    return null;
  }

  return {
    ...summary,
    country: str(trader.properties.country) || "Unknown",
    reputation: num(trader.properties.reputation),
    firstSeenAt: str(trader.properties.firstSeenAt),
  };
}

export function mapScan(records: Neo4jRecord[]): ScanSummary | null {
  const scan = records[0]?.get("scan") as Node | undefined;
  if (!scan) {
    return null;
  }

  return {
    id: nodeId(scan),
    status: (str(scan.properties.status) || "COMPLETED") as ScanSummary["status"],
    startedAt: str(scan.properties.startedAt),
    completedAt: str(scan.properties.completedAt) || undefined,
    opportunitiesFound: num(scan.properties.opportunitiesFound),
    riskCyclesFound: num(scan.properties.riskCyclesFound),
    marketplacesScanned: stringList(scan.properties.marketplacesScanned),
  };
}

export function mapCompare(opportunities: Opportunity[]): CompareResponse {
  return {
    items: opportunities.map((opp) => ({
      id: opp.id,
      label: opp.skinName,
      marketplace: opp.marketplace,
      askUsd: opp.currentAskUsd,
      fairValueUsd: opp.fairValueUsd,
      spreadPct: opp.spreadPct,
      riskScore: opp.riskScore,
      signal: opp.signal,
    })),
  };
}
