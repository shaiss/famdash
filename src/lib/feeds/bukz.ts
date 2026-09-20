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

/**
 * This-week family view order. Priority kinds first, then variance flags.
 * Not a new kind list — same locked v0 kinds, different projection order.
 */
const THIS_WEEK_KIND_ORDER: readonly BukzV0Kind[] = [
  "uncategorized",
  "cash_outlook",
  "bill_coverage",
  "budget_funding",
  "variance_flag",
];

const THIS_WEEK_KIND_RANK = new Map<string, number>(
  THIS_WEEK_KIND_ORDER.map((kind, index) => [kind, index]),
);

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

/** Words that are not personal names, so they do not start a name run. */
const NAME_GLUE = /^[\s'’\-]+$/;

const MONEY_TERMS =
  "balance|balances|amount|amounts|total|spent|paid|due|remaining|shortfall|surplus|owed|saved|cost|costs|price|savings|saving|income|expense|expenses|outflow|inflow|deposit|withdrawal|payment|payments|fee|fees|interest|principal|debt|credit|debit|funds|fund|deficit|net|gross|worth|allocation|transfer|payroll|rent|mortgage|invoice";

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

/**
 * Drop unlabelled 2+ word names in any casing.
 * Allowlisted Bukz title words (Cash outlook, Bill coverage, …) stay.
 */
function stripUnlabelledNames(text: string): string {
  const wordRe = /\b[A-Za-z]+\b/g;
  const words: { start: number; end: number }[] = [];
  let match: RegExpExecArray | null;
  while ((match = wordRe.exec(text)) !== null) {
    words.push({
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  const groups: number[][] = [];
  for (let index = 0; index < words.length; index += 1) {
    const previous = words[index - 1];
    const gap = previous ? text.slice(previous.end, words[index].start) : "";
    if (previous && NAME_GLUE.test(gap)) {
      groups[groups.length - 1].push(index);
    } else {
      groups.push([index]);
    }
  }

  const drop = new Set<number>();
  for (const group of groups) {
    let index = 0;
    while (index < group.length) {
      const nameLike = (wordIndex: number) =>
        !SAFE_TITLE_WORDS.has(text.slice(words[group[wordIndex]].start, words[group[wordIndex]].end).toLowerCase());
      if (!nameLike(index)) {
        index += 1;
        continue;
      }
      let end = index;
      while (end < group.length && nameLike(end)) {
        end += 1;
      }
      if (end - index >= 2) {
        for (let cursor = index; cursor < end; cursor += 1) {
          drop.add(group[cursor]);
        }
      }
      index = end;
    }
  }

  if (drop.size === 0) {
    return text;
  }

  let out = "";
  let cursor = 0;
  for (let index = 0; index < words.length; index += 1) {
    if (!drop.has(index)) {
      continue;
    }
    out += text.slice(cursor, words[index].start);
    cursor = words[index].end;
  }
  return out + text.slice(cursor);
}

function stripPii(text: string): string {
  return stripUnlabelledNames(
    text
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
      .replace(/\b[A-Za-z0-9_-]{32,}\b/g, ""),
  );
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
      new RegExp(
        `\\b(?:${MONEY_TERMS})\\b[^\\d\\n]{0,16}-?\\d[\\d,]*(?:\\.\\d+)?`,
        "gi",
      ),
      (match) => match.replace(/-?\d[\d,]*(?:\.\d+)?/g, ""),
    )
    .replace(/\b\d{1,3}(?:,\d{3})+(?:\.\d+)?\b/g, "")
    .replace(/\b\d+\.\d+\b/g, "")
    // Bare integers, including amounts after terms the list still missed.
    .replace(/-?\d[\d,]*/g, "")
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
  // v0: if a figure might remain, drop the field instead of guessing.
  if (/[$€£¥@]/.test(cleaned) || /\d/.test(cleaned)) {
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

function occurredAtMillis(iso: string): number {
  const parsed = Date.parse(iso);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/** Priority kinds, then variance flags; newest `occurredAt` first within a kind. */
function orderForThisWeek(items: FeedItem[]): FeedItem[] {
  return [...items].sort((a, b) => {
    const aRank =
      THIS_WEEK_KIND_RANK.get(a.meta?.kind ?? "") ?? THIS_WEEK_KIND_ORDER.length;
    const bRank =
      THIS_WEEK_KIND_RANK.get(b.meta?.kind ?? "") ?? THIS_WEEK_KIND_ORDER.length;
    if (aRank !== bRank) {
      return aRank - bRank;
    }
    return occurredAtMillis(b.occurredAt) - occurredAtMillis(a.occurredAt);
  });
}

function stubItems(limit: number): FeedItem[] {
  const now = Date.now();
  const stubs = Array.from({ length: limit }, (_, index) => {
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
  return orderForThisWeek(stubs);
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

  return orderForThisWeek(items).slice(0, limit);
}

/**
 * Bukz finance feed client.
 * Live path when BUKZ_API_BASE_URL and BUKZ_API_KEY are both set;
 * otherwise fails closed to stub items (never throws for missing env).
 * v0 projection never emits money figures, PII, or liability prose.
 * Returned items are ordered for the this-week family view.
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
      note: "This week is on placeholder items. Set BUKZ_API_BASE_URL and BUKZ_API_KEY for the live feed.",
    };
  }

  try {
    const items = await fetchLiveItems(credentials, options?.limit ?? 5);
    return {
      source: "bukz",
      items,
      fetchedAt,
      mode: "live",
      note: "Live Bukz feed for this week.",
    };
  } catch {
    return {
      source: "bukz",
      items: errorItems("Live Bukz feed request failed."),
      fetchedAt,
      mode: "live",
      note: "This week could not load the live Bukz feed.",
    };
  }
}
