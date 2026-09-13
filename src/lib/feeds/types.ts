/** Known external feed sources the dashboard can surface. */
export type FeedSource = "bukz" | "fampoll";

/** Normalized item shape shared by feed widgets. */
export type FeedItem = {
  id: string;
  source: FeedSource;
  title: string;
  summary?: string;
  /** ISO-8601 timestamp */
  occurredAt: string;
  href?: string;
  status?: "ok" | "stub" | "error";
  meta?: Record<string, string>;
};

export type FeedListOptions = {
  limit?: number;
};

/**
 * Typed client contract for a feed source.
 * Live integrations should implement this; MVP uses stubs.
 */
export interface FeedClient {
  readonly source: FeedSource;
  listRecent(options?: FeedListOptions): Promise<FeedItem[]>;
}

export type FeedSnapshot = {
  source: FeedSource;
  items: FeedItem[];
  fetchedAt: string;
  mode: "stub" | "live";
  note?: string;
};
