import { ClerkProvider, Show, SignInButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import type { ReactNode } from "react";

export function AppHeader({ variant = "public" }: { variant?: "public" | "app" }) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-[var(--line)] px-4 py-4 sm:px-8">
      <Link
        href={variant === "app" ? "/dashboard" : "/"}
        className="font-[family-name:var(--font-display)] text-xl tracking-tight text-[var(--ink)]"
      >
        famdash
      </Link>
      <nav className="flex items-center gap-3 text-sm">
        {variant === "public" ? (
          <>
            <Show when="signed-out">
              <SignInButton mode="redirect">
                <button
                  type="button"
                  className="rounded-md bg-[var(--accent)] px-3 py-1.5 font-medium text-[var(--accent-ink)] transition hover:opacity-90"
                >
                  Sign in
                </button>
              </SignInButton>
            </Show>
            <Show when="signed-in">
              <Link
                href="/dashboard"
                className="rounded-md bg-[var(--accent)] px-3 py-1.5 font-medium text-[var(--accent-ink)] transition hover:opacity-90"
              >
                Open dashboard
              </Link>
              <UserButton />
            </Show>
          </>
        ) : (
          <UserButton />
        )}
      </nav>
    </header>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return <ClerkProvider>{children}</ClerkProvider>;
}
