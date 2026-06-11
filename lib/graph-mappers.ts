import neo4j, { type Node, type Record as Neo4jRecord } from "neo4j-driver";
import type { CompareResponse, GraphEdge, GraphNode, GraphResponse, JsonValue, JourneyStep, MarketPulse, MetricsResponse, NodeDetailsResponse, NodeType, Opportunity, RiskCycle, ScanSummary, SignalType, SkinCatalogItem, SkinDetail, SkinDetailResponse, SkinSearchResult, TraderProfile, TraderReputation, TraderSummary } from "./types";

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

function getOpt(record: Neo4jRecord, key: string): Node | null {
  return record.keys.includes(key) ? (record.get(key) as Node | null) : null;
}

export function mapGraph(records: Neo4jRecord[]): GraphResponse {
  const nodes = new Map<string, GraphNode>();
  const edges = new Map<string, GraphEdge>();

  for (const record of records) {
    const skin = getOpt(record, "skin");
    const weapon = getOpt(record, "weapon");
    const collection = getOpt(record, "collection");
    const instance = getOpt(record, "instance");
    const sticker = getOpt(record, "sticker");
    const tx = getOpt(record, "tx");
    const marketplace = getOpt(record, "marketplace");
    const buyer = getOpt(record, "buyer");
    const seller = getOpt(record, "seller");
    const price = getOpt(record, "price");
    const priceMarketplace = getOpt(record, "priceMarketplace");
    const trader = getOpt(record, "trader");
    addNode(nodes, trader);

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

    addNode(nodes, price);
    addNode(nodes, priceMarketplace);
    addEdge(edges, price, skin, "FOR_SKIN");
    addEdge(edges, price, priceMarketplace, "ON_MARKETPLACE");
  }

  return { nodes: [...nodes.values()], edges: [...edges.values()] };
}

/* Vecindario inmediato de cualquier nodo (expansión interactiva del grafo). */
export function mapExpansion(records: Neo4jRecord[]): GraphResponse {
  const nodes = new Map<string, GraphNode>();
  const edges = new Map<string, GraphEdge>();

  for (const record of records) {
    const n = record.get("n") as Node;
    const m = record.get("m") as Node;
    const relType = String(record.get("relType"));
    const sourceId = String(record.get("sourceId"));

    addNode(nodes, n);
    addNode(nodes, m);
    if (nodeId(n) === sourceId) {
      addEdge(edges, n, m, relType);
    } else {
      addEdge(edges, m, n, relType);
    }
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

/* Señal derivada SOLO de propiedades observables del listing real:
   spread vs precio predicho por el mercado, factor de float, stickers, watchers. */
function deriveSignal(spreadPct: number, floatFactor: number, stickerCount: number, watchers: number, sellerRisk: number): SignalType {
  if (spreadPct >= 10) return "UNDERPRICED";
  if (floatFactor >= 1.03) return "LOW_FLOAT_PREMIUM";
  if (stickerCount > 0) return "STICKER_PREMIUM";
  if (watchers >= 3) return "FAST_FLIP";
  if (sellerRisk >= 50) return "RISK_ADJUSTED";
  return "THIN_MARKET";
}

function deriveConfidenceScore(spreadPct: number, sellerTrades: number, riskScore: number): number {
  const spreadComponent = Math.min(spreadPct / 20, 1) * 40;
  const historyComponent = Math.min(sellerTrades / 200, 1) * 30;
  const riskComponent = (1 - riskScore / 100) * 30;
  return Math.round(spreadComponent + historyComponent + riskComponent);
}

export function mapOpportunities(records: Neo4jRecord[]): Opportunity[] {
  return records.map((record, index) => {
    const skin = record.get("skin") as Node | null;
    const weapon = record.get("weapon") as Node | null;
    const instance = record.get("instance") as Node | null;
    const tx = record.get("tx") as Node | null;
    const marketplace = record.get("marketplace") as Node | null;
    const seller = record.get("seller") as Node | null;
    const stickers = (record.get("stickers") as Array<unknown>) || [];
    const currentAskUsd = num(record.get("currentAskUsd"));
    const fairValueUsd = num(record.get("fairValueUsd"));
    const spreadPct = Math.round(num(record.get("spreadPct")) * 100) / 100;

    const txProps = (tx?.properties ?? {}) as Record<string, unknown>;
    const sellerProps = (seller?.properties ?? {}) as Record<string, unknown>;
    const riskScore = num(sellerProps.riskScore);
    const sellerTrades = num(sellerProps.totalTrades);
    const floatFactor = num(txProps.floatFactor);
    const watchers = num(txProps.watchers);
    const listedAt = num(txProps.timestamp);

    const eventTimeline: Opportunity["eventTimeline"] = [
      {
        title: `${marketplace ? nodeLabel(marketplace) : "CSFloat"} · listado a $${Math.round(currentAskUsd * 100) / 100}`,
        description: `Vendedor ${seller ? nodeLabel(seller) : "anónimo"} · ${sellerTrades} trades verificables`,
        timestamp: listedAt > 0 ? new Date(listedAt * 1000).toISOString() : undefined,
      },
      {
        title: `Precio justo de mercado: $${Math.round(fairValueUsd * 100) / 100}`,
        description: `Predicción del propio marketplace (base + factor de float ${floatFactor ? floatFactor.toFixed(3) : "n/d"})`,
      },
    ];

    return {
      id: `opp-${index}-${instance ? nodeId(instance) : "unknown"}`,
      skinId: skin ? nodeId(skin) : "",
      instanceId: instance ? nodeId(instance) : "",
      skinName: skin ? nodeLabel(skin) : "",
      weapon: weapon ? nodeLabel(weapon) : "",
      rarity: str(skin?.properties.rarity) || "",
      wear: str(instance?.properties.wear) || "",
      float: num(instance?.properties.floatValue),
      marketplace: marketplace ? nodeLabel(marketplace) : "",
      currentAskUsd: Math.round(currentAskUsd * 100) / 100,
      fairValueUsd: Math.round(fairValueUsd * 100) / 100,
      spreadPct,
      confidenceScore: deriveConfidenceScore(spreadPct, sellerTrades, riskScore),
      riskScore,
      signal: deriveSignal(spreadPct, floatFactor, stickers.length, watchers, riskScore),
      traderPath: seller ? [nodeLabel(seller)] : [],
      eventTimeline,
    };
  });
}

function computeSeverity(riskScore: number): RiskCycle["severity"] {
  if (riskScore >= 80) return "CRITICAL";
  if (riskScore >= 65) return "HIGH";
  if (riskScore >= 50) return "MEDIUM";
  return "LOW";
}

/* Ciclos detectados por grafo: la cadena de dueños de una pieza vuelve sobre un
   trader anterior. La detección es Cypher real; el historial de ventas que la
   alimenta es simulado (el real es privado) y está marcado como tal. */
export function mapRiskCycles(records: Neo4jRecord[], minRiskScore: number = 40): RiskCycle[] {
  return records
    .map((record, index) => {
      const instance = record.get("instance") as Node;
      const skin = record.get("skin") as Node;
      const hops = (record.get("hops") as Array<Record<string, unknown>>) || [];
      const valueMovedUsd = Math.round(num(record.get("valueMovedUsd")) * 100) / 100;

      // ruta de dueños en orden: vendedor inicial + cada comprador
      const traderPath: string[] = [];
      for (const [i, hop] of hops.entries()) {
        if (i === 0 && hop.sellerName) traderPath.push(str(hop.sellerName));
        if (hop.buyerName) traderPath.push(str(hop.buyerName));
      }

      const timestamps = hops.map((h) => num(h.timestamp)).filter((t) => t > 0);
      const timeWindowHours = timestamps.length >= 2
        ? Math.round(((Math.max(...timestamps) - Math.min(...timestamps)) / 3600) * 10) / 10
        : 0;

      const prices = hops.map((h) => num(h.priceUsd)).filter((p) => p > 0);
      const escalationPct = prices.length >= 2 && prices[0] > 0
        ? Math.round(((prices[prices.length - 1] - prices[0]) / prices[0]) * 100)
        : 0;
      const revisits = traderPath.length !== new Set(traderPath).size;

      let riskScore = 55;
      if (revisits) riskScore += 15;
      if (timeWindowHours > 0 && timeWindowHours <= 72) riskScore += 15;
      if (escalationPct >= 40) riskScore += 10;
      if (traderPath.length >= 4) riskScore += 5;
      riskScore = Math.min(100, riskScore);

      const evidence = [
        {
          title: "Ruta circular",
          description: revisits
            ? `La pieza vuelve a un dueño anterior: ${traderPath.join(" → ")}`
            : `Cadena de ${hops.length} ventas entre ${new Set(traderPath).size} traders`,
        },
        {
          title: "Ventana temporal",
          description: timeWindowHours <= 72
            ? `Todo el recorrido ocurre en ${timeWindowHours} h — velocidad atípica`
            : `Recorrido a lo largo de ${Math.round(timeWindowHours / 24)} días`,
        },
        {
          title: "Evolución del precio",
          description: `${escalationPct >= 0 ? "+" : ""}${escalationPct}% entre la primera y la última venta`,
        },
        {
          title: "Origen del dato",
          description: "Historial simulado para demo — la detección por grafo es genuina",
        },
      ];

      return {
        id: `cycle-${index}-${nodeId(instance)}`,
        title: `Ciclo sospechoso · ${nodeLabel(skin)}`,
        instanceId: nodeId(instance),
        skinName: nodeLabel(skin),
        traderPath,
        valueMovedUsd,
        timeWindowHours,
        riskScore,
        severity: computeSeverity(riskScore),
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
    // margen real: descuento promedio de sus listings vs precio predicho por el mercado
    const avgEdge = record.keys.includes("avgEdgePct") ? record.get("avgEdgePct") : null;

    return {
      id: nodeId(trader),
      handle: str(trader.properties.handle) || nodeLabel(trader),
      transactionCount,
      volumeUsd,
      avgMarginPct: avgEdge != null ? Math.round(num(avgEdge) * 10) / 10 : 0,
      riskScore: num(trader.properties.riskScore),
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

export function mapSkinCatalog(records: Neo4jRecord[]): SkinCatalogItem[] {
  const seen = new Set<string>();
  const out: SkinCatalogItem[] = [];
  for (const r of records) {
    const id = str(r.get("id"));
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({
      id,
      name: str(r.get("name")),
      weapon: str(r.get("weapon")),
      collection: str(r.get("collection") ?? ""),
      rarity: str(r.get("rarity")),
      imageUrl: str(r.get("imageUrl") ?? ""),
      instanceCount: num(r.get("instanceCount")),
      latestPrice: r.get("latestPrice") != null ? num(r.get("latestPrice")) : null,
      latestMarketplace: r.get("latestMarketplace") ? str(r.get("latestMarketplace")) : null,
    });
  }
  return out;
}

export function mapSkinDetail(records: Neo4jRecord[]): SkinDetailResponse | null {
  const record = records[0];
  if (!record) return null;

  const skin = record.get("s") as Node;
  const weapon = record.get("w") as Node | null;
  const collection = record.get("c") as Node | null;
  const rawInstances = (record.get("instances") as Array<Record<string, unknown>>) ?? [];

  const instances = rawInstances.filter((i) => i.id).map((i) => ({
    id: str(i.id),
    floatValue: num(i.floatValue),
    wear: str(i.wear),
    serial: str(i.serial),
    txHistory: (Array.isArray(i.txHistory) ? i.txHistory : [])
      .filter((t: Record<string, unknown>) => t.priceUsd != null)
      .map((t: Record<string, unknown>) => ({
        priceUsd: num(t.priceUsd),
        marketplace: str(t.marketplace ?? ""),
        timestamp: str(t.timestamp ?? ""),
        sellerId: str(t.sellerId ?? ""),
        sellerName: str(t.sellerName ?? ""),
      })),
  }));

  const rawVenues = record.keys.includes("venuePrices")
    ? ((record.get("venuePrices") as Array<Record<string, unknown>>) ?? [])
    : [];
  const venuePrices = rawVenues
    .filter((v) => v.priceUsd != null)
    .map((v) => ({
      marketplace: str(v.marketplace),
      wear: str(v.wear),
      priceUsd: num(v.priceUsd),
      quantity: v.quantity != null ? num(v.quantity) : null,
      observedAt: str(v.observedAt),
    }))
    .sort((a, b) => a.wear.localeCompare(b.wear) || a.priceUsd - b.priceUsd);

  const skinDetail: SkinDetail = {
    id: str(skin.properties.id),
    name: str(skin.properties.name),
    weapon: weapon ? str(weapon.properties.name) : "",
    collection: collection ? str(collection.properties.name) : "",
    rarity: str(skin.properties.rarity),
    imageUrl: str(skin.properties.imageUrl ?? ""),
    instances,
    venuePrices,
  };

  return { skin: skinDetail, journey: [], currentSeller: null };
}

export function mapInstanceJourney(records: Neo4jRecord[]): JourneyStep[] {
  return records.map((r) => ({
    txId: str(r.get("txId")),
    priceUsd: num(r.get("priceUsd")),
    timestamp: str(r.get("timestamp")),
    marketplace: str(r.get("marketplace") ?? ""),
    seller: {
      id: str(r.get("sellerId")),
      name: str(r.get("sellerName")),
      reputation: num(r.get("sellerRep")),
      riskScore: num(r.get("sellerRisk")),
    },
    buyer: r.get("buyerId") ? { id: str(r.get("buyerId")), name: str(r.get("buyerName")) } : null,
  }));
}

export function mapTraderReputation(records: Neo4jRecord[]): TraderReputation | null {
  const r = records[0];
  if (!r) return null;

  const label = str(r.get("reputationLabel"));
  return {
    id: str(r.get("id")),
    name: str(r.get("name")),
    reputation: num(r.get("reputation")),
    riskScore: num(r.get("riskScore")),
    country: str(r.get("country")),
    txCount: num(r.get("txCount")),
    volumeUsd: Math.round(num(r.get("volumeUsd")) * 100) / 100,
    avgPeerReputation: num(r.get("avgPeerReputation")),
    reputationLabel: (label === "trusted" || label === "suspicious" ? label : "neutral") as TraderReputation["reputationLabel"],
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
