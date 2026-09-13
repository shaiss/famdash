/**
 * Env-based email allowlist for dashboard access.
 * Reads ADMIN_EMAIL (required in production) and optional ALLOWLIST_EMAILS
 * (comma-separated). Never hard-code real emails in source.
 */

function parseEmails(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

/** Returns the set of allowed emails from env (lowercased). */
export function getAllowlistEmails(): Set<string> {
  const admin = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const extras = parseEmails(process.env.ALLOWLIST_EMAILS);
  const emails = new Set<string>(extras);
  if (admin) emails.add(admin);
  return emails;
}

/** True when the given email is on the allowlist. */
export function isEmailAllowlisted(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowlist = getAllowlistEmails();
  if (allowlist.size === 0) {
    // Fail closed: no configured allowlist means nobody gets in.
    return false;
  }
  return allowlist.has(email.trim().toLowerCase());
}
