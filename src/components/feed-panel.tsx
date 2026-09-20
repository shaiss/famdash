import type { FeedSnapshot } from "@/lib/feeds";

/** Display labels for locked Bukz v0 kinds. Unknown kinds are not rendered. */
const BUKZ_KIND_LABELS: Record<string, string> = {
  cash_outlook: "Cash outlook",
  uncategorized: "Uncategorized",
  bill_coverage: "Bill coverage",
  budget_funding: "Budget funding",
  variance_flag: "Variance flag",
};

type FeedPanelProps = {
  snapshot: FeedSnapshot;
  heading: string;
};

function formatWhen(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function kindLabel(
  source: FeedSnapshot["source"],
  meta: FeedSnapshot["items"][number]["meta"],
): string | null {
  if (source !== "bukz") {
    return null;
  }
  const kind = meta?.kind;
  if (!kind) {
    return null;
  }
  return BUKZ_KIND_LABELS[kind] ?? null;
}

export function FeedPanel({ snapshot, heading }: FeedPanelProps) {
  const isBukz = snapshot.source === "bukz";
  const title = isBukz ? "This week" : heading;

  return (
    <section
      aria-labelledby={`${snapshot.source}-heading`}
      className="border-t border-[var(--line)] pt-6"
    >
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2
            id={`${snapshot.source}-heading`}
            className="font-[family-name:var(--font-display)] text-2xl tracking-tight text-[var(--ink)]"
          >
            {title}
          </h2>
          {isBukz ? (
            <p className="mt-1 max-w-prose text-sm text-[var(--muted)]">
              Family view from Bukz. No balances.
            </p>
          ) : null}
          <p className="mt-1 text-sm text-[var(--muted)]">
            {snapshot.note ?? `${snapshot.mode} feed`}
          </p>
        </div>
        <span className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
          {snapshot.mode}
        </span>
      </div>

      <ul className="divide-y divide-[var(--line)]">
        {snapshot.items.map((item) => {
          const kind = kindLabel(snapshot.source, item.meta);
          return (
          <li key={item.id} className="first:pt-0 last:pb-0">
            {item.href ? (
              <a
                href={item.href}
                className="flex min-h-11 flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6 -mx-2 rounded-md px-2 outline-offset-2 hover:bg-[var(--surface)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
                rel="noopener noreferrer"
                target="_blank"
              >
                <div>
                  {kind ? (
                    <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                      {kind}
                    </p>
                  ) : null}
                  <span className="font-medium text-[var(--ink)] underline decoration-[var(--line)] underline-offset-4">
                    {item.title}
                  </span>
                  {item.summary ? (
                    <p className="mt-1 max-w-prose text-sm text-[var(--muted)] no-underline">
                      {item.summary}
                    </p>
                  ) : null}
                </div>
                <time
                  dateTime={item.occurredAt}
                  className="shrink-0 text-xs text-[var(--muted)]"
                >
                  {formatWhen(item.occurredAt)}
                </time>
              </a>
            ) : (
              <div className="flex min-h-11 flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                <div>
                  {kind ? (
                    <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                      {kind}
                    </p>
                  ) : null}
                  <p className="font-medium text-[var(--ink)]">{item.title}</p>
                  {item.summary ? (
                    <p className="mt-1 max-w-prose text-sm text-[var(--muted)]">
                      {item.summary}
                    </p>
                  ) : null}
                </div>
                <time
                  dateTime={item.occurredAt}
                  className="shrink-0 text-xs text-[var(--muted)]"
                >
                  {formatWhen(item.occurredAt)}
                </time>
              </div>
            )}
          </li>
          );
        })}
      </ul>
    </section>
  );
}
