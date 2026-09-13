import type { FeedClient, FeedItem, FeedListOptions, FeedSnapshot } from "./types";

/**
 * Placeholder FamPoll client.
 * Swap implementation when FAMPOLL_API_BASE_URL / FAMPOLL_API_KEY are available.
 * Do not hard-wire secrets here.
 */
export class FamPollFeedClient implements FeedClient {
  readonly source = "fampoll" as const;

  async listRecent(options: FeedListOptions = {}): Promise<FeedItem[]> {
    const limit = options.limit ?? 5;
    const now = Date.now();

    const stubs: FeedItem[] = Array.from({ length: limit }, (_, index) => ({
      id: `fampoll-stub-${index + 1}`,
      source: "fampoll",
      title: `FamPoll placeholder poll ${index + 1}`,
      summary:
        "Stub feed — replace FamPollFeedClient with a live API client when credentials are ready.",
      occurredAt: new Date(now - index * 7_200_000).toISOString(),
      status: "stub",
      meta: { integration: "fampoll", mode: "stub" },
    }));

    return stubs;
  }
}

export async function fetchFamPollSnapshot(
  options?: FeedListOptions,
): Promise<FeedSnapshot> {
  const client = new FamPollFeedClient();
  const items = await client.listRecent(options);
  return {
    source: "fampoll",
    items,
    fetchedAt: new Date().toISOString(),
    mode: "stub",
    note: "Using stub client. Set FAMPOLL_API_* env vars and implement live fetch later.",
  };
}
