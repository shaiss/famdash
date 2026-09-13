import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isEmailAllowlisted } from "@/lib/allowlist";

export type DashboardUser = {
  userId: string;
  primaryEmail: string | null;
};

/**
 * Requires a signed-in Clerk user whose primary email is allowlisted.
 * Redirects to sign-in or /unauthorized as needed.
 */
export async function requireAllowlistedUser(): Promise<DashboardUser> {
  const { userId, redirectToSignIn } = await auth();

  if (!userId) {
    return redirectToSignIn();
  }

  const user = await currentUser();
  const primaryEmail =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses[0]?.emailAddress ??
    null;

  if (!isEmailAllowlisted(primaryEmail)) {
    redirect("/unauthorized");
  }

  return { userId, primaryEmail };
}
