import Link from "next/link";
import { Show, SignInButton } from "@clerk/nextjs";
import { AppHeader } from "@/components/app-shell";

export default function HomePage() {
  return (
    <div className="flex min-h-full flex-col">
      <AppHeader variant="public" />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-16 sm:px-8">
        <p className="text-sm uppercase tracking-[0.18em] text-[var(--muted)]">
          Family dashboard
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-5xl leading-tight tracking-tight text-[var(--ink)] sm:text-6xl">
          famdash
        </h1>
        <p className="mt-4 max-w-xl text-lg text-[var(--muted)]">
          A shared surface for family apps. Sign in to open the MVP dashboard
          shell — bukz and FamPoll feeds are stubbed until live integrations land.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Show when="signed-out">
            <SignInButton mode="redirect">
              <button
                type="button"
                className="rounded-md bg-[var(--accent)] px-4 py-2.5 font-medium text-[var(--accent-ink)] transition hover:opacity-90"
              >
                Sign in to dashboard
              </button>
            </SignInButton>
          </Show>
          <Show when="signed-in">
            <Link
              href="/dashboard"
              className="rounded-md bg-[var(--accent)] px-4 py-2.5 font-medium text-[var(--accent-ink)] transition hover:opacity-90"
            >
              Go to dashboard
            </Link>
          </Show>
          <Link
            href="/docs-hint"
            className="rounded-md border border-[var(--line)] bg-[var(--surface)]/70 px-4 py-2.5 text-[var(--ink)] transition hover:bg-[var(--surface)]"
          >
            Architecture notes
          </Link>
        </div>
      </main>
    </div>
  );
}
