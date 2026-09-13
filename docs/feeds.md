# External feeds (FamPoll partnership)

Product **YES** from Dash: famdash surfaces a **live FamPoll feed** on the
dashboard shell. This document is the partnership and ingest contract note.
It is **not** the widget contract — see
[`widget-contract.md`](widget-contract.md).

## Ownership split

FamPoll remains the domain system of record for family polls / Quorum
decisions. famdash does **not** own poll state; it **projects** a recent-feed
slice into the dashboard under famdash permissions and UI. Today FamPoll is a
**FeedClient partner** (Harvester-style keyed feed), not a first-class widget
app. The catalog **Upcoming Events** Scout app is separate and can coexist on
the same surface.

| Concern | Owner |
|---------|--------|
| Domain source-of-truth (polls, votes, decisions, share tokens) | **FamPoll** |
| Versioned feed API (`/api/feed/recent`, Contract C) | **FamPoll** |
| Projection into dashboard items (`FeedItem` / `FeedSnapshot`) | **famdash** |
| Auth, allowlist, permissions for who sees the dashboard | **famdash** |
| Dashboard / widget shell rendering | **famdash** |
| Widget-contract schema & transport (discovery, mount, layout) | **famdash** (TBD) |
| Upcoming Events Scout app | **famdash** (separate; can coexist) |

**Do not invent a parallel host integration** while the widget-contract schema
is still open. Feed-ingest versioning (**Contract C**, owned by FamPoll) is
separate from future **widget-contract** versions (owned by the dashboard).

## Live `FeedClient` shape (main after PR #3)

Shared TypeScript types live in `src/lib/feeds/types.ts`. Implementations:
`src/lib/feeds/fampoll.ts` (live + fail-closed stub) and
`src/lib/feeds/bukz.ts` (stub only).

### Types

```ts
type FeedSource = "bukz" | "fampoll";

type FeedItem = {
  id: string;
  source: FeedSource;
  title: string;
  summary?: string;
  occurredAt: string; // ISO-8601
  href?: string;
  status?: "ok" | "stub" | "error";
  meta?: Record<string, string>;
};

interface FeedClient {
  readonly source: FeedSource;
  listRecent(options?: { limit?: number }): Promise<FeedItem[]>;
}

type FeedSnapshot = {
  source: FeedSource;
  items: FeedItem[];
  fetchedAt: string;
  mode: "stub" | "live";
  note?: string;
};
```

### FamPoll live path

When **both** env vars are set (env-only; never commit real values):

1. `GET {FAMPOLL_API_BASE_URL}/api/feed/recent?limit=`
2. Header: `Authorization: Bearer {FAMPOLL_API_KEY}`
3. Normalize upstream JSON into `FeedItem[]` (array or thin wrappers:
   `items` / `data` / `feed` / `results`).
4. Snapshot `mode: "live"`.

If either `FAMPOLL_API_BASE_URL` or `FAMPOLL_API_KEY` is missing, fail
**closed** to stub items (`mode: "stub"`). The dashboard must not throw for
missing env. Upstream request failure with credentials present stays
`mode: "live"` with an error item + note — still no key or email leakage.

| Variable | Role |
|----------|------|
| `FAMPOLL_API_BASE_URL` | FamPoll API origin (placeholder in `.env.example`) |
| `FAMPOLL_API_KEY` | Bearer token for the feed (placeholder only in git) |

### Href rule C

| Decision state | `href` behavior |
|----------------|-----------------|
| Open / needs vote | **Omit** `href`. Set `meta.decisionStatus=open`. Summary may say needs vote / open Quorum. |
| Decided + share token present | Keep only `https://quorum.family/s/{shareToken}` |
| Upstream `/app/decisions…` links | **Strip** (do not surface) |
| Other `/app` links | Do not rewrite as a general rule; decisions paths are stripped |

### Meta / PII

Allowed projection keys in `meta` (examples): `eventId`, `eventTitle`,
`decisionStatus`, `plan`, `voteType`, `round` — plus non-sensitive bookkeeping
such as `integration` / `mode` added by famdash.

**Do not** put PII in `meta`: no real emails, no Quorum family member names, no
API keys, no share tokens as free-form meta values.

### Forward compatibility (drift)

Ignore unknown upstream fields when normalizing. The FamPoll feed may grow
fields without a famdash release; clients must stay forward-compatible.

### Bukz

**Bukz remains stub.** Same `FeedClient` / `FeedItem` types; no live env path
yet. Placeholders `BUKZ_API_BASE_URL` / `BUKZ_API_KEY` may appear in
`.env.example` for a future client.

## Relationship to other docs

| Doc | Role |
|-----|------|
| This file | Feed partnership + ingest projection (Contract C consumer side) |
| [`widget-contract.md`](widget-contract.md) | How first-class app widgets plug into the dashboard (schema TBD) |
| [`architecture.md`](architecture.md) | Platform shape; feeds are an MVP host projection path |
| [`mvp.md`](mvp.md) | Runnable shell status, routes, security checklist |
| [`apps.md`](apps.md) | Standalone app catalog (Upcoming Events Scout ≠ FamPoll feed) |
