import { clerkMiddleware } from "@clerk/nextjs/server";

/**
 * Clerk session attachment for matched routes.
 * Authorization (sign-in + allowlist) is enforced in dashboard/layout server code.
 */
export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
