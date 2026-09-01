# Agent types

Inside every famdash app, the data work is done by **agents**. The agent types
are a first-class part of the architecture: they give every app a shared
vocabulary for the kind of work it does.

There are four types.

| Type | One-liner | Direction | Example app |
|------|-----------|-----------|-------------|
| **Scout** | Discovers & surfaces new items from the outside world | Pulls in *unknown* items | Upcoming Events, Weekend Ideas |
| **Generator** | Creates new content from context | Produces *net-new* output | Affirmations |
| **Parser** | Turns unstructured input into structured data | Transforms *given* input | School (email parsing) |
| **Harvester** | Pulls & syncs data from authenticated services | Syncs *known* feeds | Money (Xero/YNAB/banks) |

## Definitions

### Scout
A Scout **discovers**. It watches the outside world — often open or public
sources — and brings back candidate items that weren't known in advance
(upcoming events, weekend ideas). Scouts are about *finding* things.

- Input: a topic/query and the open world.
- Output: a set of newly discovered candidate items.
- Cadence: scheduled or triggered polling/searching.

### Generator
A Generator **creates**. Given some context, it produces new content that
didn't exist before (affirmations). Generators are about *making* things, not
fetching them.

- Input: context / a prompt.
- Output: newly generated content.

### Parser
A Parser **structures**. Given an unstructured input — an email, a document —
it extracts and normalizes structured data (School turns emails into events and
actions). Parsers are about *transforming* an input you already have.

- Input: an unstructured artifact.
- Output: structured, normalized records.

### Harvester
A Harvester **syncs**. It connects to authenticated external services and keeps
a local, normalized copy of *known* feeds in sync (Money pulls from Xero, YNAB,
and bank APIs). Harvesters are about *ingesting* data you already have access
to.

- Input: authenticated external accounts / APIs.
- Output: a synced local copy of that data.
- Cadence: scheduled sync.

## How the types differ

Two axes separate the four cleanly:

- **Known vs. unknown source** — Harvesters and Parsers work over data you
  already have (an account, an email); Scouts go find data you don't yet know
  about; Generators create data outright.
- **Fetch vs. transform vs. create** — Scouts and Harvesters *fetch*, Parsers
  *transform*, Generators *create*.

|  | Works over *known* input | Works over *unknown*/open world |
|--|---------------------------|-------------------------------|
| **Fetch / sync** | Harvester | Scout |
| **Transform** | Parser | — |
| **Create** | — | Generator |

## Relationship to apps

An app is typically anchored by one primary agent type but may use several. The
mapping captured so far:

- **Scout:** Upcoming Events, Weekend Ideas
- **Generator:** Affirmations
- **Parser:** School
- **Harvester:** Money
- **Chores:** agent type to be determined _(see [apps.md](apps.md))_

See [`architecture.md`](architecture.md) for how agents feed each app's API and,
through it, the dashboard's widgets.
