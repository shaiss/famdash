# Apps

famdash is a collection of standalone apps. Each one **harvests its own data,
can stand alone, exposes a clean API, and owns the widgets it publishes** to the
dashboard.

This is the current catalog, captured from initial notes. Items marked
_(tentative)_ were transcribed from handwriting and should be confirmed.

## Catalog

| App | Domain | Data sources / integrations | Primary agent type |
|-----|--------|-----------------------------|--------------------|
| [Money](#money) | Household finance & bookkeeping | Xero & YNAB API, bank APIs (direct) | Harvester |
| [School](#school) | School comms & schedules | Email parsing | Parser |
| [Chores](#chores) | Chore tracking & sign-off | Apollo Sign _(tentative)_ | — |
| [Upcoming Events](#upcoming-events) | Events coming up | Scout | Scout |
| [Affirmations](#affirmations) | Daily affirmations | Generator | Generator |
| [Weekend Ideas](#weekend-ideas) | Weekend suggestions | Scout (web) | Scout |

---

### Money
Household finance and **bookkeeping**.

- **Data sources:** Xero & YNAB API; bank APIs (direct).
- **Agent type:** **Harvester** — syncs transactions/balances from
  authenticated financial services on a schedule.
- **Notes:** "Bank APIs direct" implies pulling straight from bank
  integrations in addition to the Xero/YNAB layer.

### School
Keeps on top of school communications and schedules.

- **Data source:** Email parsing.
- **Agent type:** **Parser** — extracts structured items (dates, events,
  actions) out of incoming school emails.

### Chores
Chore tracking and sign-off.

- **Integration:** Apollo Sign _(tentative — transcription/role to confirm)_.
- **Agent type:** _to be determined._
- **Notes:** "Sign" suggests a sign-off / approval step when a chore is marked
  done. Confirm what "Apollo Sign" refers to.

### Upcoming Events
Surfaces events that are coming up.

- **Mechanism:** Scout.
- **Agent type:** **Scout** — watches for and surfaces upcoming events.

### Affirmations
Daily affirmations for the family.

- **Mechanism:** Generator.
- **Agent type:** **Generator** — produces affirmation content.

### Weekend Ideas
Ideas for things to do on the weekend.

- **Mechanism:** Scout.
- **Agent type:** **Scout** — discovers weekend activity ideas (e.g. from the
  web) and surfaces candidates.

---

## Every app follows the same shape

Regardless of domain, each app:

1. **Harvests its own data** via one or more [agents](agents.md).
2. **Stores** it in the app's own store.
3. **Exposes** it through a clean, documented **API surface**.
4. **Owns and publishes widgets** built against the dashboard's
   [widget contract](widget-contract.md).
5. **Can stand alone** — the dashboard is an optional consumer, not a
   dependency.

See [`architecture.md`](architecture.md) for how these apps compose into the
dashboard.
