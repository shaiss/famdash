import { ClerkProvider, Show, SignInButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import type { ReactNode } from "react";

/** Clerk avatar sized to ~44×44 so the header control is phone-tappable. */
const userButtonAppearance = {
  elements: {
    rootBox: "flex items-center justify-center",
    avatarBox: "h-11 w-11",
    userButtonTrigger:
      "touch-target rounded-full outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]",
  },
} as const;

export function AppUserButton() {
  return <UserButton appearance={userButtonAppearance} />;
}

export function AppHeader({ variant = "public" }: { variant?: "public" | "app" }) {
  return (
    <header className="relative z-10 flex items-center justify-between gap-4 border-b border-[var(--line)] px-4 py-3 sm:px-8 sm:py-4">
      <Link
        href={variant === "app" ? "/dashboard" : "/"}
        className="touch-target -ml-2 justify-start rounded-md px-2 font-[family-name:var(--font-display)] text-xl tracking-tight text-[var(--ink)]"
      >
        famdash
      </Link>
      <nav className="flex items-center gap-2 sm:gap-3 text-sm">
        {variant === "public" ? (
          <>
            <Show when="signed-out">
              <SignInButton mode="redirect">
                <button
                  type="button"
                  className="touch-target rounded-md bg-[var(--accent)] px-4 font-medium text-[var(--accent-ink)] transition hover:opacity-90"
                >
                  Sign in
                </button>
              </SignInButton>
            </Show>
            <Show when="signed-in">
              <Link
                href="/dashboard"
                className="touch-target rounded-md bg-[var(--accent)] px-4 font-medium text-[var(--accent-ink)] transition hover:opacity-90"
              >
                Open dashboard
              </Link>
              <AppUserButton />
            </Show>
          </>
        ) : (
          <AppUserButton />
        )}
      </nav>
    </header>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return <ClerkProvider>{children}</ClerkProvider>;
}
