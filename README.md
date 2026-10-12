# famdash

**famdash** is a family dashboard built as a **collection of small, standalone
apps**. Each app harvests its own data, works on its own, and publishes one or
more **widgets** onto a shared **dashboard**.

This repo is **public**. The app is live at <https://famdash-inky.vercel.app>.

## Current status (MVP)

Next.js App Router dashboard shell with:

- **Clerk** auth on `/dashboard`
- **Env allowlist** via `ADMIN_EMAIL` (+ optional `ALLOWLIST_EMAILS`)
- **Typed feed clients** — Bukz and FamPoll live behind optional `BUKZ_API_*` / `FAMPOLL_API_*` env vars (fail closed to placeholders if unset)

Deployed on Vercel at <https://famdash-inky.vercel.app> after Cipher (Security) review.

## Local setup

```bash
cp .env.example .env.local
# Fill Clerk keys + ADMIN_EMAIL (placeholders only in git)
npm install
npm run dev
```

Required env (see `.env.example` — never commit real emails or secrets):

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `ADMIN_EMAIL` | Always-allowed admin email |
| `ALLOWLIST_EMAILS` | Optional comma-separated extra emails |
| `BUKZ_API_BASE_URL` | Bukz API base (optional; with key enables live feed) |
| `BUKZ_API_KEY` | Bukz API bearer token (optional; never commit real values) |
| `FAMPOLL_API_BASE_URL` | FamPoll API base (optional; with key enables live feed) |
| `FAMPOLL_API_KEY` | FamPoll API bearer token (optional; never commit real values) |

## Scripts

- `npm run dev` — local development
- `npm run build` — production build
- `npm run start` — run production build
- `npm run lint` — ESLint

## Architecture (product)

The dashboard is a *platform*, not a monolith. It publishes a **widget
contract**; apps write widgets against that contract.

```
                 publishes a widget contract (spec)
   ┌────────────┐  ───────────────────────────────▶  ┌──────────────────┐
   │  DASHBOARD │                                     │   APPS           │
   │ (platform) │  ◀───────────────────────────────  │ (standalone)     │
   └────────────┘        publish their widgets        └──────────────────┘
```

### Core principles

1. **Apps are standalone.** The dashboard is a consumer of apps, never a dependency they need to function.
2. **Apps harvest their own data** via agents (Scouts, Generators, Parsers, Harvesters).
3. **Apps expose a clean, documented API.**
4. **The dashboard publishes the widget contract.**
5. **Apps own and publish their widgets.**

### Planned apps

| App | What it does | Data source / integration | Agent type |
|-----|--------------|---------------------------|------------|
| **Money** | Household finance & bookkeeping | Xero & YNAB API, bank APIs (direct) | Harvester |
| **School** | School comms & schedules | Email parsing | Parser |
| **Chores** | Chore tracking & sign-off | Apollo Sign | — |
| **Upcoming Events** | Surfaces events coming up | Scout | Scout |
| **Affirmations** | Daily affirmations | Generator | Generator |
| **Weekend Ideas** | Ideas for the weekend | Scout (web) | Scout |

MVP surfaces **Bukz** and **FamPoll** (live FeedClient partners, optional env)
as external feeds on the dashboard shell — see [`docs/feeds.md`](docs/feeds.md).

## Documentation

- [`docs/architecture.md`](docs/architecture.md) — platform, apps, APIs, widgets, agents
- [`docs/mvp.md`](docs/mvp.md) — MVP implementation notes and next steps
- [`docs/feeds.md`](docs/feeds.md) — FamPoll and Bukz feed partnerships + `FeedClient` shape
- [`docs/apps.md`](docs/apps.md) — app catalog
- [`docs/agents.md`](docs/agents.md) — agent taxonomy
- [`docs/widget-contract.md`](docs/widget-contract.md) — widget spec (schema TBD)

## Security

- No PII, real emails, or API secrets in source or docs — placeholders only
- Allowlist is env-only
- Secrets live in Vercel env only, never in git
- Cipher (Security) reviews security-sensitive changes before they ship

---

> Architecture docs capture early product thinking and will evolve. Items marked
> _(tentative)_ may need confirmation.
