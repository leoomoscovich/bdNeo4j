const WATCHLIST_KEY = "skingraph.watchlist.v1";
const COMPARE_KEY = "skingraph.compare.v1";

function readStringArray(key: string): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function writeStringArray(key: string, values: string[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify([...new Set(values)]));
}

export function getWatchlistIds() {
  return readStringArray(WATCHLIST_KEY);
}

export function setWatchlistIds(ids: string[]) {
  writeStringArray(WATCHLIST_KEY, ids);
}

export function toggleWatchlistId(id: string) {
  const current = getWatchlistIds();
  const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
  writeStringArray(WATCHLIST_KEY, next);
  return next;
}

export function getCompareIds() {
  return readStringArray(COMPARE_KEY);
}

export function setCompareIds(ids: string[]) {
  writeStringArray(COMPARE_KEY, ids.slice(0, 4));
}
