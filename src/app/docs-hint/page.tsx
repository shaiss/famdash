import Link from "next/link";
import { AppHeader } from "@/components/app-shell";

/** Lightweight in-app pointer to repo docs (no secrets). */
export default function DocsHintPage() {
  return (
    <div className="flex min-h-full flex-col">
      <AppHeader variant="public" />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 sm:px-8">
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">
          Where to read next
        </h1>
        <p className="mt-3 text-[var(--muted)]">
          Product architecture lives in the repo under <code>docs/</code>. Start
          with architecture, then apps, agents, and the widget contract.
        </p>
        <ul className="mt-6 list-disc space-y-2 pl-5 text-[var(--ink)]">
          <li>
            <code>docs/architecture.md</code> — platform shape
          </li>
          <li>
            <code>docs/mvp.md</code> — current MVP status and next steps
          </li>
          <li>
            <code>docs/widget-contract.md</code> — how widgets plug in
          </li>
        </ul>
        <Link
          href="/"
          className="mt-8 inline-block text-[var(--accent)] underline-offset-4 hover:underline"
        >
          Back home
        </Link>
      </main>
    </div>
  );
}
