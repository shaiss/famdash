# famdash

**famdash** is a family dashboard built as a **collection of small, standalone
apps**. Each app harvests its own data, works on its own, and publishes one or
more **widgets** onto a shared **dashboard**.

The dashboard is a *platform*, not a monolith. It publishes a **widget
contract** (a spec), and every app writes its widgets against that contract.
Apps own their widgets end to end — the dashboard just gives them a place to
render.

```
                 publishes a widget contract (spec)
   ┌────────────┐  ───────────────────────────────▶  ┌──────────────────┐
   │  DASHBOARD │                                     │   APPS           │
   │ (platform) │  ◀───────────────────────────────  │ (standalone)     │
   └────────────┘        publish their widgets        └──────────────────┘
        renders widgets on a shared surface                 │
                                                            │ each app also…
                                                            ▼
                                          harvests its own data + exposes a
                                          clean, documented API surface
```

## Core principles

1. **Apps are standalone.** Every app can run and be used on its own. The
   dashboard is a consumer of apps, never a dependency they need to function.
2. **Apps harvest their own data.** Each app owns its ingestion, storage, and
   domain logic. Data work is done by **agents** (see below).
3. **Apps expose a clean, documented API.** An app's API surface is how its
   widgets — and anything else — read its data.
4. **The dashboard publishes the widget contract.** The dashboard owns one
   spec that describes how a widget is declared, mounted, sized, and fed data.
5. **Apps own and publish their widgets.** Each app builds its widgets against
   the contract and publishes them; the dashboard discovers and renders them.
6. **Agents do the data work.** Every app is powered by one or more agents of a
   known type: **Scouts, Generators, Parsers, Harvesters**.

## Apps

| App | What it does | Data source / integration | Agent type |
|-----|--------------|---------------------------|------------|
| **Money** | Household finance & bookkeeping | Xero & YNAB API, bank APIs (direct) | Harvester |
| **School** | School comms & schedules | Email parsing | Parser |
| **Chores** | Chore tracking & sign-off | Apollo Sign | — |
| **Upcoming Events** | Surfaces events coming up | Scout | Scout |
| **Affirmations** | Daily affirmations | Generator | Generator |
| **Weekend Ideas** | Ideas for the weekend | Scout (web) | Scout |

See [`docs/apps.md`](docs/apps.md) for the full catalog.

## Agents

famdash apps are built on four agent types:

- **Scouts** — discover and surface new items from the outside world.
- **Generators** — create new content from context.
- **Parsers** — turn unstructured input into structured data.
- **Harvesters** — pull and sync data from authenticated external services.

See [`docs/agents.md`](docs/agents.md).

## Documentation

- [`docs/architecture.md`](docs/architecture.md) — how the platform, apps,
  APIs, widgets, and agents fit together.
- [`docs/apps.md`](docs/apps.md) — the app catalog.
- [`docs/agents.md`](docs/agents.md) — the agent taxonomy.
- [`docs/widget-contract.md`](docs/widget-contract.md) — the spec the
  dashboard publishes and apps write against.

---

> These docs capture the early product and architecture thinking for famdash.
> They are a living record — transcribed and structured from initial notes — so
> expect them to evolve as the design firms up. Items marked _(tentative)_ were
> captured from handwritten notes and may need confirmation.
