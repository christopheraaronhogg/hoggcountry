import type { Cookies, RequestEvent } from '@sveltejs/kit';
import { publicApiBase } from './public-api';

export const AUTH_COOKIE = 'hc_auth_token';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  email_verified_at?: string | null;
  profile?: {
    display_name?: string | null;
    trail_name?: string | null;
    bio?: string | null;
    avatar_url?: string | null;
  } | null;
}

export interface AuthApiError {
  code?: string;
  message?: string;
  details?: Record<string, unknown> | null;
}

export interface AuthApiResult<T> {
  ok: boolean;
  status: number;
  data: T | null;
  error: AuthApiError | null;
}

export function normalizeRedirect(value: string | null | undefined, fallback = '/app'): string {
  const redirect = String(value ?? '').trim();
  if (!redirect || !redirect.startsWith('/') || redirect.startsWith('//')) return fallback;
  return redirect;
}

export function readAuthToken(cookies: Cookies): string | null {
  const token = cookies.get(AUTH_COOKIE)?.trim();
  return token || null;
}

export function setAuthCookie(cookies: Cookies, url: URL, token: string): void {
  cookies.set(AUTH_COOKIE, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: url.protocol === 'https:',
    maxAge: 60 * 60 * 24 * 30
  });
}

export function clearAuthCookie(cookies: Cookies, url: URL): void {
  cookies.delete(AUTH_COOKIE, {
    path: '/',
    secure: url.protocol === 'https:'
  });
}

export async function authApi<T>(
  path: string,
  init: RequestInit = {},
  fetcher: typeof fetch = fetch
): Promise<AuthApiResult<T>> {
  const headers = new Headers(init.headers);
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  const response = await fetcher(`${publicApiBase()}${path}`, {
    ...init,
    headers
  });
  const payload = await response.json().catch(() => null) as {
    data?: T | null;
    error?: AuthApiError | null;
    message?: string;
  } | null;

  return {
    ok: response.ok,
    status: response.status,
    data: payload?.data ?? null,
    error: payload?.error ?? (payload?.message ? { message: payload.message } : null)
  };
}

export async function loadAuthenticatedUser(
  token: string | null,
  fetcher: typeof fetch = fetch
): Promise<AuthUser | null> {
  if (!token) return null;

  const result = await authApi<AuthUser>('/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }, fetcher).catch(() => null);

  return result?.ok ? result.data : null;
}

export function authUserToBetaProfile(user: AuthUser): NonNullable<App.Locals['betaProfile']> {
  const displayName = user.profile?.display_name?.trim() || user.name.trim() || user.email;
  const trailName = user.profile?.trail_name?.trim() || displayName;

  return {
    name: displayName,
    email: user.email.trim().toLowerCase(),
    trailName
  };
}

export function authRedirectFor(event: RequestEvent): string {
  return `/login?redirect=${encodeURIComponent(event.url.pathname + event.url.search)}`;
}
