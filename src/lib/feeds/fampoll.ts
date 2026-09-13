import type { FeedClient, FeedItem, FeedListOptions, FeedSnapshot } from "./types";

const QUORUM_SHARE_HREF =
  /^https:\/\/quorum\.family\/s\/([A-Za-z0-9_-]+)\/?$/;
const APP_DECISIONS_HREF = /\/app\/decisions\//;

type FamPollCredentials = {
  baseUrl: string;
  apiKey: string;
};

/** Raw upstream fields we may see beyond the shared FeedItem shape. */
type RawFamPollItem = Partial<FeedItem> & {
  decisionStatus?: string;
  shareToken?: string;
  meta?: Record<string, string>;
};

function readCredentials(): FamPollCredentials | null {
  const baseUrl = process.env.FAMPOLL_API_BASE_URL?.trim();
  const apiKey = process.env.FAMPOLL_API_KEY?.trim();
  if (!baseUrl || !apiKey) {
    return null;
  }
  return { baseUrl: baseUrl.replace(/\/+$/, ""), apiKey };
}

function stubItems(limit: number): FeedItem[] {
  const now = Date.now();
  return Array.from({ length: limit }, (_, index) => ({
    id: `fampoll-stub-${index + 1}`,
    source: "fampoll" as const,
    title: `FamPoll placeholder poll ${index + 1}`,
    summary:
      "Stub feed — set FAMPOLL_API_BASE_URL and FAMPOLL_API_KEY for the live client.",
    occurredAt: new Date(now - index * 7_200_000).toISOString(),
    status: "stub" as const,
    meta: { integration: "fampoll", mode: "stub" },
  }));
}

function errorItems(message: string): FeedItem[] {
  return [
    {
      id: "fampoll-error",
      source: "fampoll",
      title: "FamPoll feed unavailable",
      summary: message,
      occurredAt: new Date().toISOString(),
      status: "error",
      meta: { integration: "fampoll", mode: "live" },
    },
  ];
}

/**
 * Href rule C:
 * - Do not rewrite /app links.
 * - Open decisions (or missing share token) → omit href.
 * - Decided + https://quorum.family/s/{shareToken} → keep.
 * - Strip any /app/decisions/ hrefs from upstream.
 */
export function resolveFamPollHref(raw: RawFamPollItem): string | undefined {
  const href = typeof raw.href === "string" ? raw.href.trim() : undefined;
  if (!href) {
    return undefined;
  }

  if (APP_DECISIONS_HREF.test(href)) {
    return undefined;
  }

  const decisionStatus = (
    raw.decisionStatus ??
    raw.meta?.decisionStatus ??
    ""
  ).toLowerCase();
  const shareToken =
    raw.shareToken?.trim() ||
    raw.meta?.shareToken?.trim() ||
    QUORUM_SHARE_HREF.exec(href)?.[1];

  if (decisionStatus === "open" || !shareToken) {
    return undefined;
  }

  if (decisionStatus === "decided") {
    const match = QUORUM_SHARE_HREF.exec(href);
    if (match && match[1] === shareToken) {
      return href.replace(/\/$/, "");
    }
  }

  return undefined;
}

function normalizeItem(raw: unknown, index: number): FeedItem | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const item = raw as RawFamPollItem;
  const id =
    typeof item.id === "string" && item.id.trim()
      ? item.id.trim()
      : `fampoll-live-${index + 1}`;
  const title =
    typeof item.title === "string" && item.title.trim()
      ? item.title.trim()
      : "Untitled FamPoll item";
  const occurredAt =
    typeof item.occurredAt === "string" && item.occurredAt.trim()
      ? item.occurredAt.trim()
      : new Date().toISOString();

  const meta: Record<string, string> = {
    integration: "fampoll",
    mode: "live",
  };
  // Keep only non-sensitive upstream meta keys (never copy tokens or emails).
  if (item.meta) {
    for (const [key, value] of Object.entries(item.meta)) {
      const lower = key.toLowerCase();
      if (
        lower.includes("token") ||
        lower.includes("key") ||
        lower.includes("email") ||
        lower.includes("secret")
      ) {
        continue;
      }
      meta[key] = value;
    }
  }
  if (item.decisionStatus) {
    meta.decisionStatus = item.decisionStatus;
  }

  const normalized: FeedItem = {
    id,
    source: "fampoll",
    title,
    occurredAt,
    status: item.status === "error" || item.status === "stub" ? item.status : "ok",
    meta,
  };

  if (typeof item.summary === "string" && item.summary.trim()) {
    normalized.summary = item.summary.trim();
  }

  const href = resolveFamPollHref(item);
  if (href) {
    normalized.href = href;
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
  credentials: FamPollCredentials,
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
    throw new Error(`FamPoll upstream returned ${response.status}`);
  }

  const payload: unknown = await response.json();
  const items = extractItemArray(payload)
    .map((entry, index) => normalizeItem(entry, index))
    .filter((entry): entry is FeedItem => entry !== null);

  return items.slice(0, limit);
}

/**
 * FamPoll feed client.
 * Live path when FAMPOLL_API_BASE_URL and FAMPOLL_API_KEY are both set;
 * otherwise fails closed to stub items (never throws for missing env).
 */
export class FamPollFeedClient implements FeedClient {
  readonly source = "fampoll" as const;

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
      return errorItems("Live FamPoll feed request failed.");
    }
  }
}

export async function fetchFamPollSnapshot(
  options?: FeedListOptions,
): Promise<FeedSnapshot> {
  const credentials = readCredentials();
  const client = new FamPollFeedClient();
  const fetchedAt = new Date().toISOString();

  if (!credentials) {
    const items = await client.listRecent(options);
    return {
      source: "fampoll",
      items,
      fetchedAt,
      mode: "stub",
      note: "Using stub client. Set FAMPOLL_API_BASE_URL and FAMPOLL_API_KEY for live feed.",
    };
  }

  try {
    const items = await fetchLiveItems(credentials, options?.limit ?? 5);
    return {
      source: "fampoll",
      items,
      fetchedAt,
      mode: "live",
      note: "Live FamPoll feed.",
    };
  } catch {
    return {
      source: "fampoll",
      items: errorItems("Live FamPoll feed request failed."),
      fetchedAt,
      mode: "live",
      note: "Live FamPoll credentials are set, but the upstream feed request failed.",
    };
  }
}
