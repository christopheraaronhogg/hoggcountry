import type { BetaProfileCookie } from '$lib/beta';

const DEFAULT_ADMIN_EMAILS = ['chris@hoggcountry.local'];

function configuredAdminEmails(): string[] {
  const configured = process.env.SCOUT_ADMIN_EMAILS?.split(',').map((value) => value.trim().toLowerCase()).filter(Boolean);
  return configured && configured.length > 0 ? configured : DEFAULT_ADMIN_EMAILS;
}

export function isScoutAdminProfile(profile: BetaProfileCookie | App.Locals['betaProfile']): boolean {
  if (!profile) return false;
  const email = profile.email.trim().toLowerCase();
  return configuredAdminEmails().includes(email);
}
