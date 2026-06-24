export function publicApiBase(origin?: string | URL): string {
  const configured = process.env.PUBLIC_API_BASE_URL?.trim();
  if (configured) return configured.replace(/\/+$/u, '');

  if (process.env.NODE_ENV === 'development') {
    return 'http://127.0.0.1:8000/api/v1';
  }

  if (origin) {
    return new URL('/api/v1', origin).toString().replace(/\/+$/u, '');
  }

  return '/api/v1';
}

/**
 * Absolute base for server-to-server calls to our OWN Laravel API (e.g. the NPS
 * proxy at /api/v1/nps/*). Unlike publicApiBase(), this NEVER returns a relative
 * path — a Node `fetch` needs an absolute URL, so a relative base silently fails
 * server-side. Prefers PUBLIC_API_BASE_URL, then dev localhost, then the prod
 * apex. Set PUBLIC_API_BASE_URL to a localhost URL on the box to skip the public
 * round-trip.
 */
export function scoutBackendApiBase(): string {
  const configured = process.env.PUBLIC_API_BASE_URL?.trim();
  if (configured) return configured.replace(/\/+$/u, '');
  if (process.env.NODE_ENV === 'development') return 'http://127.0.0.1:8000/api/v1';
  return 'https://hoggcountry.com/api/v1';
}
