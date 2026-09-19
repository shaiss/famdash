import type { FeedClient, FeedItem, FeedListOptions, FeedSnapshot } from "./types";

/** Locked v0 kinds. Every stub and live-normalized item sets `meta.kind`. */
export const BUKZ_V0_KINDS = [
  "cash_outlook",
  "uncategorized",
  "bill_coverage",
  "budget_funding",
  "variance_flag",
] as const;

export type BukzV0Kind = (typeof BUKZ_V0_KINDS)[number];

export const BUKZ_KIND_LABELS: Record<BukzV0Kind, string> = {
  cash_outlook: "Cash outlook",
  uncategorized: "Uncategorized",
  bill_coverage: "Bill coverage",
  budget_funding: "Budget funding",
  variance_flag: "Variance flag",
};

const KIND_SET = new Set<string>(BUKZ_V0_KINDS);

const SAFE_TITLE_WORDS = new Set([
  "cash",
  "outlook",
  "uncategorized",
  "bill",
  "bills",
  "coverage",
  "budget",
  "funding",
  "variance",
  "flag",
  "placeholder",
  "feed",
  "bukz",
  "weekly",
  "monthly",
  "activity",
  "status",
  "review",
  "item",
]);

type BukzCredentials = {
  baseUrl: string;
  apiKey: string;
};

/** Raw upstream fields we may see. Unknown keys are ignored. */
type RawBukzItem = {
  id?: unknown;
  title?: unknown;
  summary?: unknown;
  occurredAt?: unknown;
  status?: unknown;
  kind?: unknown;
  liabilityWatch?: unknown;
  meta?: Record<string, unknown>;
};

function readCredentials(): BukzCredentials | null {
  const baseUrl = process.env.BUKZ_API_BASE_URL?.trim();
  const apiKey = process.env.BUKZ_API_KEY?.trim();
  if (!baseUrl || !apiKey) {
    return null;
  }
  return { baseUrl: baseUrl.replace(/\/+$/, ""), apiKey };
}

function readKind(raw: RawBukzItem): BukzV0Kind | null {
  const candidates = [raw.kind, raw.meta?.kind];
  for (const candidate of candidates) {
    if (typeof candidate !== "string") {
      continue;
    }
    const normalized = candidate.trim().toLowerCase();
    if (KIND_SET.has(normalized)) {
      return normalized as BukzV0Kind;
    }
  }
  return null;
}

function readLiabilityWatch(raw: RawBukzItem): "true" | "false" | undefined {
  const value = raw.liabilityWatch ?? raw.meta?.liabilityWatch;
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "false") {
      return normalized;
    }
  }
  return undefined;
}

function stripLiabilityText(text: string): string {
  const kept = text
    .split(/(?<=[.!?])\s+/)
    .filter((sentence) => !/liabilit/i.test(sentence));
  return kept.join(" ").replace(/\bliabilit(?:y|ies)(?:\s+watch)?\b/gi, "");
}

function stripPii(text: string): string {
  return text
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "")
    .replace(
      /\b(?:name|payee|account holder|owner|member)\s*:\s*[^,.;\n]+/gi,
      "",
    )
    .replace(
      /\b(?:account|acct|a\/c)(?:\s*(?:number|no\.?|#))?\s*[:#-]?\s*\d[\d\s-]{2,}\d/gi,
      "",
    )
    .replace(/\b(?:\d[ -]?){7,}\d\b/g, "")
    .replace(/\b\*{2,}\d{2,}\b/g, "")
    .replace(/\b(?:sk|pk|rk)_(?:live|test)_[A-Za-z0-9]+\b/g, "")
    .replace(/\bBearer\s+\S+/gi, "")
    .replace(/\b[A-Za-z0-9_-]{32,}\b/g, "")
    .replace(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2}\b/g, (match) => {
      const safe = match
        .split(/\s+/)
        .every((word) => SAFE_TITLE_WORDS.has(word.toLowerCase()));
      return safe ? match : "";
    });
}

function stripMoney(text: string): string {
  return text
    .replace(/[$€£¥]\s*-?\d[\d,]*(?:\.\d+)?/g, "")
    .replace(
      /\b(?:USD|EUR|GBP|CAD|AUD|NZD)\s*-?\d[\d,]*(?:\.\d+)?\b/gi,
      "",
    )
    .replace(
      /\b-?\d[\d,]*(?:\.\d+)?\s*(?:USD|EUR|GBP|CAD|AUD|NZD|dollars?|cents?)\b/gi,
      "",
    )
    .replace(/-?\s*[$€£¥]\s*-?\d[\d,]*(?:\.\d+)?/g, "")
    .replace(
      /\b(?:balance|balances|amount|amounts|total|spent|paid|due|remaining|shortfall|surplus|owed|saved|cost|costs|price)\b\s*(?:of|by|is|:)?\s*-?\d[\d,]*(?:\.\d+)?/gi,
      (match) => match.replace(/-?\d[\d,]*(?:\.\d+)?/g, ""),
    )
    .replace(/\b\d{1,3}(?:,\d{3})+(?:\.\d+)?\b/g, "")
    .replace(/\b\d+\.\d{2}\b/g, "")
    .replace(/[$€£¥]/g, "");
}

function tidy(text: string): string {
  return text
    .replace(/[ \t]+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\(\s*\)|\[\s*\]/g, "")
    .replace(/^[,\s:;.\-–—/|]+|[,\s:;.\-–—/|]+$/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

/** Title/summary projection: no money figures, no PII, no liability text. */
function projectCopy(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const cleaned = tidy(stripMoney(stripPii(stripLiabilityText(value))));
  if (!cleaned) {
    return undefined;
  }
  if (/[$€£¥@]/.test(cleaned) || /\d{6,}/.test(cleaned)) {
    return undefined;
  }
  return cleaned;
}

function projectId(value: unknown, index: number): string {
  const fallback = `bukz-live-${index + 1}`;
  if (typeof value !== "string") {
    return fallback;
  }
  const trimmed = value.trim();
  if (!/^[A-Za-z0-9_.:-]{1,80}$/.test(trimmed)) {
    return fallback;
  }
  if (/@|\$|sk_|pk_|token|key|email|secret/i.test(trimmed)) {
    return fallback;
  }
  if (/\d{6,}/.test(trimmed)) {
    return fallback;
  }
  return trimmed;
}

function projectOccurredAt(value: unknown): string {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value.trim())) {
    const parsed = Date.parse(value.trim());
    if (!Number.isNaN(parsed)) {
      return new Date(parsed).toISOString();
    }
  }
  return new Date().toISOString();
}

function stubItems(limit: number): FeedItem[] {
  const now = Date.now();
  return Array.from({ length: limit }, (_, index) => {
    const kind = BUKZ_V0_KINDS[index % BUKZ_V0_KINDS.length];
    return {
      id: `bukz-stub-${index + 1}`,
      source: "bukz" as const,
      title: `${BUKZ_KIND_LABELS[kind]} placeholder`,
      summary:
        "Stub feed — set BUKZ_API_BASE_URL and BUKZ_API_KEY for the live client. Placeholder only; no balances.",
      occurredAt: new Date(now - index * 3_600_000).toISOString(),
      status: "stub" as const,
      meta: { integration: "bukz", mode: "stub", kind },
    };
  });
}

function errorItems(message: string): FeedItem[] {
  return [
    {
      id: "bukz-error",
      source: "bukz",
      title: "Bukz feed unavailable",
      summary: message,
      occurredAt: new Date().toISOString(),
      status: "error",
      meta: { integration: "bukz", mode: "live" },
    },
  ];
}

function normalizeItem(raw: unknown, index: number): FeedItem | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const item = raw as RawBukzItem;
  const kind = readKind(item);
  if (!kind) {
    return null;
  }

  const meta: Record<string, string> = {
    integration: "bukz",
    mode: "live",
    kind,
  };
  const liabilityWatch = readLiabilityWatch(item);
  if (liabilityWatch) {
    meta.liabilityWatch = liabilityWatch;
  }

  const normalized: FeedItem = {
    id: projectId(item.id, index),
    source: "bukz",
    title: projectCopy(item.title) ?? BUKZ_KIND_LABELS[kind],
    occurredAt: projectOccurredAt(item.occurredAt),
    status: item.status === "error" || item.status === "stub" ? item.status : "ok",
    meta,
  };

  const summary = projectCopy(item.summary);
  if (summary) {
    normalized.summary = summary;
  }

  return normalized;
}

function extractItemArray(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    for (const key of ["items", "data", "feed", "results"] as const) {
      if (Array.isArray(record[key])) {
        return record[key] as unknown[];
      }
    }
  }
  return [];
}

async function fetchLiveItems(
  credentials: BukzCredentials,
  limit: number,
): Promise<FeedItem[]> {
  const url = new URL("/api/feed/recent", `${credentials.baseUrl}/`);
  url.searchParams.set("limit", String(limit));

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${credentials.apiKey}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Bukz upstream returned ${response.status}`);
  }

  const payload: unknown = await response.json();
  const items = extractItemArray(payload)
    .map((entry, index) => normalizeItem(entry, index))
    .filter((entry): entry is FeedItem => entry !== null);

  return items.slice(0, limit);
}

/**
 * Bukz finance feed client.
 * Live path when BUKZ_API_BASE_URL and BUKZ_API_KEY are both set;
 * otherwise fails closed to stub items (never throws for missing env).
 * v0 projection never emits money figures, PII, or liability prose.
 */
export class BukzFeedClient implements FeedClient {
  readonly source = "bukz" as const;

  async listRecent(options: FeedListOptions = {}): Promise<FeedItem[]> {
    const limit = options.limit ?? 5;
    const credentials = readCredentials();
    if (!credentials) {
      return stubItems(limit);
    }

    try {
      return await fetchLiveItems(credentials, limit);
    } catch {
      // Never surface keys, emails, or upstream body details.
      return errorItems("Live Bukz feed request failed.");
    }
  }
}

export async function fetchBukzSnapshot(
  options?: FeedListOptions,
): Promise<FeedSnapshot> {
  const credentials = readCredentials();
  const client = new BukzFeedClient();
  const fetchedAt = new Date().toISOString();

  if (!credentials) {
    const items = await client.listRecent(options);
    return {
      source: "bukz",
      items,
      fetchedAt,
      mode: "stub",
      note: "Using stub client. Set BUKZ_API_BASE_URL and BUKZ_API_KEY for live feed.",
    };
  }

  try {
    const items = await fetchLiveItems(credentials, options?.limit ?? 5);
    return {
      source: "bukz",
      items,
      fetchedAt,
      mode: "live",
      note: "Live Bukz feed.",
    };
  } catch {
    return {
      source: "bukz",
      items: errorItems("Live Bukz feed request failed."),
      fetchedAt,
      mode: "live",
      note: "Live Bukz credentials are set, but the upstream feed request failed.",
    };
  }
}
