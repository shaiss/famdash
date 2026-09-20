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
`src/lib/feeds/bukz.ts` (live + fail-closed stub).

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

Bukz owns the **domain source of truth** for family finance and the
**versioned feed** (`GET /api/feed/recent`). famdash does **not** own ledger
state. It **projects** a recent-feed slice into dashboard `FeedItem`s under
famdash permissions and UI. Same shared contract as the FamPoll consumer —
no parallel GraphQL layer.

The live path is behind `BUKZ_API_*` and **fails closed**. Do not invent
ledger numbers, balances, or sample money figures and present them as real.
Stub copy may say it is a placeholder. Live titles and summaries come only
from upstream JSON after the v0 projection rules below.

When **both** env vars are set (env-only; never commit real values):

1. `GET {BUKZ_API_BASE_URL}/api/feed/recent?limit=`
2. Header: `Authorization: Bearer {BUKZ_API_KEY}`
3. Normalize upstream JSON into `FeedItem[]` (array or thin wrappers:
   `items` / `data` / `feed` / `results`). Unknown fields are ignored.
4. Snapshot `mode: "live"`.

If either `BUKZ_API_BASE_URL` or `BUKZ_API_KEY` is missing, fail **closed**
to stub items (`mode: "stub"`). The dashboard must not throw for missing
env. Upstream request failure with credentials present stays `mode: "live"`
with an error item + note — still no key, email, or upstream body leakage.

| Variable | Role |
|----------|------|
| `BUKZ_API_BASE_URL` | Bukz API origin (placeholder in `.env.example`) |
| `BUKZ_API_KEY` | Bearer token for the feed (placeholder only in git) |

#### v0 item kinds (locked)

Every stub item and every live-normalized item sets `meta.kind` to exactly
one of:

| `meta.kind` | Label (no figures) |
|-------------|--------------------|
| `cash_outlook` | Cash outlook |
| `uncategorized` | Uncategorized |
| `bill_coverage` | Bill coverage |
| `budget_funding` | Budget funding |
| `variance_flag` | Variance flag |

famdash also sets non-sensitive bookkeeping: `meta.integration` (`bukz`) and
`meta.mode` (`stub` or `live`).

Stub mode still emits these kinds in that table order, one each, and rotates
if `limit` is larger than five. The list returned to the dashboard is then
reordered for the this-week view below. Placeholder copy has **no dollar
amounts** and no invented balances.

Items with a missing or unknown kind are dropped. They are not relabeled.

#### Projection rules (v0)

- **No `$` and no money figures** in `title` or `summary`. Strip or drop
  upstream amounts. Do not replace them with invented numbers.
- **No PII** in `title`, `summary`, or `meta`: no emails, names, account
  numbers, API keys, or tokens.
- `meta.liabilityWatch` may be kept only as the flag string `"true"` or
  `"false"`. Do **not** show liability text in title or summary.
- Ignore unknown upstream fields (forward-compatible). The producer may add
  fields without a famdash release.

#### This-week family view

famdash-only projection. After v0 copy rules, Bukz items (live and stub) are
ordered for an easy family **this week** scan:

1. Priority kinds first: `uncategorized`, `budget_funding`, `cash_outlook`,
   `bill_coverage`.
2. Then `variance_flag`.
3. Within a kind, `occurredAt` descending (newest first).

Ordering happens before the `limit` slice. No new kinds. FamPoll is not
reordered.

The Bukz panel heading is **This week**. Panel copy calls it a family view
from Bukz and states that no balances are shown. Snapshot notes say this
week on the live, stub, and error paths. Those notes do not add dollar
amounts, balances, or PII. Kind labels still render only when
`snapshot.source === "bukz"`. `meta.liabilityWatch` stays a meta flag only.

| Concern | Owner |
|---------|--------|
| Domain source-of-truth (finance) and versioned feed API | **Bukz** |
| Projection into dashboard items (`FeedItem` / `FeedSnapshot`) | **famdash** |
| Auth, allowlist, permissions for who sees the dashboard | **famdash** |

## Relationship to other docs

| Doc | Role |
|-----|------|
| This file | Feed partnership + ingest projection (Contract C consumer side) |
| [`widget-contract.md`](widget-contract.md) | How first-class app widgets plug into the dashboard (schema TBD) |
| [`architecture.md`](architecture.md) | Platform shape; feeds are an MVP host projection path |
| [`mvp.md`](mvp.md) | Runnable shell status, routes, security checklist |
| [`apps.md`](apps.md) | Standalone app catalog (Upcoming Events Scout ≠ FamPoll feed) |
