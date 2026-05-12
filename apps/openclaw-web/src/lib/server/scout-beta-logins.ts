import type { BetaProfileCookie } from '$lib/beta';

interface ScoutQuickLogin {
  readonly username: string;
  readonly password: string;
  readonly profile: BetaProfileCookie;
}

const QUICK_LOGIN_PASSWORD = process.env.SCOUT_TRAIL_BETA_PASSWORD?.trim() || '0721';

const QUICK_LOGINS: readonly ScoutQuickLogin[] = [
  {
    username: 'chris',
    password: QUICK_LOGIN_PASSWORD,
    profile: {
      name: 'Chris',
      email: 'chris@hoggcountry.local',
      trailName: 'Chris'
    }
  },
  {
    username: 'dad',
    password: QUICK_LOGIN_PASSWORD,
    profile: {
      name: 'Dad',
      email: 'dad@hoggcountry.local',
      trailName: 'Dad'
    }
  }
];

function normalizeUsername(value: string): string {
  return value.trim().toLowerCase().replace(/^@/u, '');
}

export function resolveScoutQuickLogin(username: string, password: string): BetaProfileCookie | null {
  const normalizedUsername = normalizeUsername(username);
  const normalizedPassword = password.trim();
  const login = QUICK_LOGINS.find((entry) => entry.username === normalizedUsername);
  if (!login || login.password !== normalizedPassword) return null;
  return login.profile;
}
