import type { FeedClient, FeedItem, FeedListOptions, FeedSnapshot } from "./types";

/**
 * Placeholder bukz client.
 * Swap implementation when BUKZ_API_BASE_URL / BUKZ_API_KEY are available.
 * Do not hard-wire secrets here.
 */
export class BukzFeedClient implements FeedClient {
  readonly source = "bukz" as const;

  async listRecent(options: FeedListOptions = {}): Promise<FeedItem[]> {
    const limit = options.limit ?? 5;
    const now = Date.now();

    const stubs: FeedItem[] = Array.from({ length: limit }, (_, index) => ({
      id: `bukz-stub-${index + 1}`,
      source: "bukz",
      title: `Bukz placeholder item ${index + 1}`,
      summary:
        "Stub feed — replace BukzFeedClient with a live API client when credentials are ready.",
      occurredAt: new Date(now - index * 3_600_000).toISOString(),
      status: "stub",
      meta: { integration: "bukz", mode: "stub" },
    }));

    return stubs;
  }
}

export async function fetchBukzSnapshot(
  options?: FeedListOptions,
): Promise<FeedSnapshot> {
  const client = new BukzFeedClient();
  const items = await client.listRecent(options);
  return {
    source: "bukz",
    items,
    fetchedAt: new Date().toISOString(),
    mode: "stub",
    note: "Using stub client. Set BUKZ_API_* env vars and implement live fetch later.",
  };
}
