import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center justify-between gap-4 border-b border-[var(--line)] px-4 py-4 sm:px-8">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-xl tracking-tight text-[var(--ink)]"
        >
          famdash
        </Link>
        <UserButton />
      </header>
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-16 sm:px-8">
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">
          Access not granted
        </h1>
        <p className="mt-3 text-[var(--muted)]">
          You are signed in, but your account is not on the env-based allowlist
          (<code>ADMIN_EMAIL</code> / <code>ALLOWLIST_EMAILS</code>). Ask an
          admin to add your email in deployment env — never commit real emails
          to the repo.
        </p>
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
