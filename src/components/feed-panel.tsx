import type { FeedSnapshot } from "@/lib/feeds";

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

export function FeedPanel({ snapshot, heading }: FeedPanelProps) {
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
            {heading}
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {snapshot.note ?? `${snapshot.mode} feed`}
          </p>
        </div>
        <span className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
          {snapshot.mode}
        </span>
      </div>

      <ul className="divide-y divide-[var(--line)]">
        {snapshot.items.map((item) => (
          <li key={item.id} className="py-4 first:pt-0 last:pb-0">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
              <div>
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
          </li>
        ))}
      </ul>
    </section>
  );
}
