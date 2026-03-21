/**
 * Admin email allowlist from environment variable
 */
function getAdminEmails(): string[] {
  const emails = process.env.ADMIN_EMAILS ?? "";
  return emails
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Check if an email is in the admin allowlist
 */
export function isAdminEmail(email: string | undefined): boolean {
  if (!email) return false;
  const admins = getAdminEmails();
  if (admins.length === 0) return false;
  return admins.includes(email.toLowerCase());
}
