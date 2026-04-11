export const BETA_COOKIE = 'hogg_beta_profile';

export interface BetaProfileCookie {
  readonly name: string;
  readonly email: string;
  readonly trailName: string;
}

export function encodeBetaProfile(profile: BetaProfileCookie): string {
  return Buffer.from(JSON.stringify(profile), 'utf-8').toString('base64url');
}

export function decodeBetaProfile(value: string | undefined): BetaProfileCookie | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf-8')) as Partial<BetaProfileCookie>;

    if (
      typeof parsed.name !== 'string' ||
      typeof parsed.email !== 'string' ||
      typeof parsed.trailName !== 'string'
    ) {
      return null;
    }

    return {
      name: parsed.name.trim(),
      email: parsed.email.trim(),
      trailName: parsed.trailName.trim()
    };
  } catch {
    return null;
  }
}
