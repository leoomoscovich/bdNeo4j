/**
 * CsFloat public API helper
 * Docs: https://csfloat.com/api/v1
 *
 * Rate limit: ~100 req/min on the public tier.
 * We use an in-process TTL cache keyed by market_hash_name so concurrent
 * requests for the same skin collapse into a single fetch.
 */

export type CsFloatListing = {
  id: string;
  price: number;          // cents USD
  float_value: number;
  wear_name: string;
  market_hash_name: string;
  seller_steam_id: string;
  created_at: string;
};

type CacheEntry<T> = { data: T; expiresAt: number };

const cache = new Map<string, CacheEntry<unknown>>();
const TTL_MS = 5 * 60 * 1000; // 5 min

function cached<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const hit = cache.get(key) as CacheEntry<T> | undefined;
  if (hit && Date.now() < hit.expiresAt) return Promise.resolve(hit.data);

  // Collapse concurrent requests: store the Promise itself while in-flight
  const inflight = cache.get(`__inf__${key}`) as CacheEntry<Promise<T>> | undefined;
  if (inflight && Date.now() < inflight.expiresAt) return inflight.data;

  const promise = fetcher().then((data) => {
    cache.set(key, { data, expiresAt: Date.now() + TTL_MS });
    cache.delete(`__inf__${key}`);
    return data;
  }).catch((err) => {
    cache.delete(`__inf__${key}`);
    throw err;
  });

  cache.set(`__inf__${key}`, { data: promise, expiresAt: Date.now() + 30_000 });
  return promise;
}

const BASE = "https://csfloat.com/api/v1";
const DEFAULT_TIMEOUT_MS = 5000;

async function apiFetch<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { "Accept": "application/json" },
      signal: controller.signal,
      next: { revalidate: 0 },
    });

    if (!res.ok) throw new Error(`CsFloat ${res.status}: ${res.statusText}`);
    return res.json() as Promise<T>;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetch active listings for a skin by its Steam market_hash_name.
 * Returns [] on any error so callers can fall back gracefully.
 */
export async function getListings(marketHashName: string, limit = 10): Promise<CsFloatListing[]> {
  const key = `listings:${marketHashName}:${limit}`;
  return cached(key, async () => {
    const params = new URLSearchParams({
      market_hash_name: marketHashName,
      limit: String(limit),
      sort_by: "lowest_price",
    });

    type ApiResponse = { data?: CsFloatListing[] };
    const json = await apiFetch<ApiResponse>(`/listings?${params}`);
    return json.data ?? [];
  }).catch(() => []);
}

/**
 * Convert a skin name from our graph ("AK-47 | Redline") to a
 * CsFloat/Steam market_hash_name. Wear suffix must be appended by the
 * caller if needed (e.g. "(Field-Tested)").
 */
export function toMarketHashName(skinName: string, wear?: string): string {
  return wear ? `${skinName} (${wear})` : skinName;
}

/**
 * Map CsFloat wear_name to our internal wear codes.
 */
export function normalizeWear(wearName: string): string {
  const map: Record<string, string> = {
    "Factory New": "FN",
    "Minimal Wear": "MW",
    "Field-Tested": "FT",
    "Well-Worn": "WW",
    "Battle-Scarred": "BS",
  };
  return map[wearName] ?? wearName;
}
