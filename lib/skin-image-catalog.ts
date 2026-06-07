const WEAR_SUFFIX_RE = /\s+\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)$/;

export type ExternalSkinImageRecord = {
  name?: unknown;
  market_hash_name?: unknown;
  image?: unknown;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeSkinName(name: string) {
  return name
    .replace(/^StatTrak(TM|™)?\s+/i, "")
    .replace(/^Souvenir\s+/i, "")
    .replace(/^★\s*/, "")
    .replace(WEAR_SUFFIX_RE, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function buildSkinImageMap(
  localSkinNames: string[],
  externalRecords: ExternalSkinImageRecord[],
) {
  const wanted = new Set(localSkinNames.map(normalizeSkinName));
  const exactImages = new Map<string, string>();
  const fallbackImages = new Map<string, string>();

  for (const record of externalRecords) {
    if (!isNonEmptyString(record.image)) continue;

    if (isNonEmptyString(record.name)) {
      const normalizedName = normalizeSkinName(record.name);
      if (wanted.has(normalizedName)) {
        const target = localSkinNames.find((name) => normalizeSkinName(name) === normalizedName);
        if (target && !exactImages.has(target) && !WEAR_SUFFIX_RE.test(record.name)) {
          exactImages.set(target, record.image);
        }
        if (target && !fallbackImages.has(target)) {
          fallbackImages.set(target, record.image);
        }
      }
    }

    if (isNonEmptyString(record.market_hash_name)) {
      const normalizedMarketName = normalizeSkinName(record.market_hash_name);
      if (wanted.has(normalizedMarketName)) {
        const target = localSkinNames.find((name) => normalizeSkinName(name) === normalizedMarketName);
        if (target && !fallbackImages.has(target)) {
          fallbackImages.set(target, record.image);
        }
      }
    }
  }

  return new Map([...fallbackImages, ...exactImages]);
}
