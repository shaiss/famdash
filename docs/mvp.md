# MVP implementation notes

Status of the first runnable dashboard shell. Complements
[`architecture.md`](architecture.md) (product shape) with what is in code today.

## Stack

| Piece | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS 4 |
| Auth | Clerk (`@clerk/nextjs`) via `src/proxy.ts` + server checks |
| Access control | Env allowlist: `ADMIN_EMAIL`, optional `ALLOWLIST_EMAILS` |
| Feeds | Typed clients: **bukz** stub; **FamPoll** env-gated live (`FAMPOLL_API_*`) |

Default branch for this work: prefer reviewing against the docs branch /
`main` as the team chooses; keep the repo **private**.

## Routes

| Path | Access |
|------|--------|
| `/` | Public landing |
| `/sign-in`, `/sign-up` | Clerk hosted UI |
| `/dashboard` | Signed-in **and** allowlisted |
| `/unauthorized` | Signed-in but not allowlisted |
| `/docs-hint` | Pointer to repo docs |

## Auth flow

1. `clerkMiddleware()` in `src/proxy.ts` attaches the session.
2. `src/app/dashboard/layout.tsx` calls `requireAllowlistedUser()`.
3. Missing session → Clerk sign-in redirect.
4. Signed in but email not in allowlist → `/unauthorized`.
5. Allowlist is fail-closed: if neither env var yields emails, nobody is admitted.

## Feeds

Shared types: `src/lib/feeds/types.ts` (`FeedClient`, `FeedItem`, `FeedSnapshot`).
Partnership, ownership split, href rule C, and env fail-closed behavior:
[`feeds.md`](feeds.md).

| Source | Module | Today |
|--------|--------|-------|
| bukz | `src/lib/feeds/bukz.ts` | Returns placeholder items (stub) |
| FamPoll | `src/lib/feeds/fampoll.ts` | Live when both `FAMPOLL_API_BASE_URL` and `FAMPOLL_API_KEY` are set; otherwise stub |

Do not commit secrets or real emails. Bukz remains stubbed until its env path
is implemented. Feed ingest (Contract C) is separate from the TBD
[widget contract](widget-contract.md).

## Relationship to the long-term architecture

The MVP is intentionally a **thin host**:

- Dashboard shell + auth gate
- FeedClient adapters for external partners (FamPoll live; bukz stub) — not
  first-class widget apps yet
- Existing docs remain the source of truth for standalone apps, agents, and the
  widget contract

Next increments should grow toward the widget contract (discovery, mount,
layout) rather than hard-coding more app-specific UI in the dashboard. Do not
stretch FeedClient into a parallel host integration.

## Next steps (before / after Security review)

1. **Cipher (Security) review** of auth, allowlist, and env handling — required
   before first deploy. Do not treat a Preview URL as done until cleared.
2. Create a Clerk application; put real keys only in local/hosting env.
3. Set `ADMIN_EMAIL` / `ALLOWLIST_EMAILS` in hosting env (never in git).
4. Replace the bukz stub with a live client behind the same interface (FamPoll already env-gated).
5. Flesh out widget-contract schema + discovery (see
   [`widget-contract.md`](widget-contract.md)).
6. Stand up first standalone apps (Money, School, …) per
   [`apps.md`](apps.md).

## Security checklist for deploy

- [ ] Repo remains private
- [ ] No real emails/PII/secrets in git history for this change
- [ ] Clerk + allowlist env configured in the host only
- [ ] Cipher sign-off before linking/promoting Vercel (or other) production
