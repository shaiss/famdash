# The widget contract

The **dashboard publishes one spec — the widget contract — and every app writes
its widgets against it.** This is the single interface that lets independent
apps compose into one dashboard.

This document describes the *role* of the contract. The concrete schema and
transport are intentionally left open until the design firms up; this is the
shape it needs to have.

## Who owns what

- **The dashboard owns the contract.** It defines the shared shape a widget
  must fit, publishes it, and renders whatever conforms to it.
- **Apps own their widgets.** Each app builds widgets against the contract,
  feeds them from its **own API**, and publishes them for the dashboard to
  discover and render.

The dashboard has **no app-specific code**. It knows only the contract. This is
inversion of control: the platform defines the slot; apps fill it.

```
   DASHBOARD                                          APP
   ─────────                                          ───
   defines + publishes  ──────  widget contract  ──────▶  app builds widget
   the contract                    (the spec)             against the contract
        ▲                                                        │
        │                                                        │ publishes
        └──────────────  renders published widget  ◀─────────────┘
                         (data pulled from the app's own API)
```

## What the contract needs to cover

At minimum, the contract should define:

1. **Declaration** — how a widget announces itself (identity, owning app,
   title, description).
2. **Discovery / publishing** — how an app publishes a widget and how the
   dashboard discovers what's available.
3. **Mounting** — how the dashboard instantiates and renders a widget.
4. **Layout** — sizing, placement, and any grid constraints the dashboard
   enforces.
5. **Data** — how a widget gets its data. In famdash, a widget reads from its
   **own app's API surface**, so the contract governs the widget shell, not the
   app's data schema.
6. **Lifecycle & failure** — refresh/update behavior, and how a widget degrades
   when its app is unavailable (an app being offline must degrade only its own
   widgets).

## Why a published spec (not per-app integration)

- **Apps stay standalone.** They target one stable contract instead of
  integrating against the dashboard's internals.
- **The dashboard stays generic.** It renders anything conforming to the
  contract without knowing which apps exist.
- **New apps compose for free.** A new app joins by publishing conforming
  widgets — no dashboard changes required.

## Relationship to the app API

There are **two** contracts in famdash, and a widget sits between them:

- The **widget contract** (this doc) — how a widget plugs into the dashboard.
  Owned by the dashboard.
- The **app API** — how data leaves an app. Owned by the app.

A widget is built against the **widget contract** and pulls its data from its
**app's API**. Keeping these two interfaces clean is what keeps apps standalone
while still composing into one dashboard. See
[`architecture.md`](architecture.md#the-two-contracts).

## To define next

- The concrete contract schema (fields, types, versioning).
- The publish/discovery transport (how widgets are registered and found at
  runtime).
- Versioning strategy for evolving the contract without breaking published
  widgets.
