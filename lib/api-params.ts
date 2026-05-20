import { marketplaceIds, type MarketplaceId, type SignalFilter } from "./ui-state";
import type { RiskCycle } from "./types";

const signals: SignalFilter[] = [
  "ALL",
  "UNDERPRICED",
  "FAST_FLIP",
  "STICKER_PREMIUM",
  "LOW_FLOAT_PREMIUM",
  "THIN_MARKET",
  "RISK_ADJUSTED",
];

const severities: RiskCycle["severity"][] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export type ParamResult<T> = { value: T } | { error: string };

export function parseNumberParam(params: URLSearchParams, name: string, defaultValue: number): ParamResult<number> {
  const raw = params.get(name);
  if (raw === null || raw === "") {
    return { value: defaultValue };
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    return { error: `El parametro ${name} debe ser un numero.` };
  }

  return { value: parsed };
}

export function parseMarketplaces(params: URLSearchParams): ParamResult<MarketplaceId[]> {
  const raw = params.get("marketplaces");
  if (!raw) {
    return { value: [...marketplaceIds] };
  }

  const parsed = raw.split(",").map((item) => item.trim()).filter(Boolean);
  const invalid = parsed.find((item) => !marketplaceIds.includes(item as MarketplaceId));
  if (invalid) {
    return { error: `Marketplace invalido: ${invalid}.` };
  }

  if (parsed.length === 0) {
    return { error: "Debe quedar al menos un marketplace activo." };
  }

  return { value: parsed as MarketplaceId[] };
}

export function parseSignal(params: URLSearchParams): ParamResult<SignalFilter> {
  const raw = params.get("signal") || "ALL";
  if (!signals.includes(raw as SignalFilter)) {
    return { error: `Signal invalida: ${raw}.` };
  }

  return { value: raw as SignalFilter };
}

export function parseSeverity(params: URLSearchParams): ParamResult<RiskCycle["severity"] | "ALL"> {
  const raw = params.get("severity") || "ALL";
  if (raw === "ALL") {
    return { value: "ALL" };
  }

  if (!severities.includes(raw as RiskCycle["severity"])) {
    return { error: `Severity invalida: ${raw}.` };
  }

  return { value: raw as RiskCycle["severity"] };
}

export function parseIds(params: URLSearchParams, min = 1, max = 4): ParamResult<string[]> {
  const ids = (params.get("ids") || "").split(",").map((item) => item.trim()).filter(Boolean);
  if (ids.length < min || ids.length > max) {
    return { error: `El parametro ids debe incluir entre ${min} y ${max} ids.` };
  }

  return { value: ids };
}

export function isParamError<T>(result: ParamResult<T>): result is { error: string } {
  return "error" in result;
}
