type RuntimeEnv = Record<string, string | undefined>;

const API_CONNECT_SOURCE_KEYS = ['PUBLIC_API_BASE_URL', 'TRAIL_UPDATES_API_BASE'] as const;

const BASE_CONNECT_SOURCES = [
  "'self'",
  'https://www.youtube.com',
  'https://api.open-meteo.com',
  'https://hoggcountry.on-forge.com',
  'https://app.hoggcountry.com',
  'wss:'
] as const;

export function configuredConnectSourceOrigins(env: RuntimeEnv = process.env): string[] {
  const origins = new Set<string>();

  for (const key of API_CONNECT_SOURCE_KEYS) {
    const configured = env[key]?.trim();
    if (!configured) continue;

    try {
      const url = new URL(configured);
      if (url.protocol === 'http:' || url.protocol === 'https:') {
        origins.add(url.origin);
      }
    } catch {
      // Invalid runtime config should not widen the policy.
    }
  }

  return [...origins];
}

export function buildContentSecurityPolicy(env: RuntimeEnv = process.env): string {
  const connectSources = [...BASE_CONNECT_SOURCES, ...configuredConnectSourceOrigins(env)];

  // Mirrors the header set netlify.toml applied while Netlify fronted the
  // public site, so protection survives the Forge cutover. CSP additions over
  // the Netlify version: tile.openstreetmap.fr (map fallbacks) stays out until
  // used; share.garmin.com is framed by /dispatch.
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://hoggcountry.on-forge.com https://i.ytimg.com https://img.youtube.com https://*.tile.openstreetmap.org https://*.tile.opentopomap.org",
    "media-src 'self' blob: https://hoggcountry.on-forge.com",
    'frame-src https://www.youtube-nocookie.com https://share.garmin.com',
    `connect-src ${connectSources.join(' ')}`,
    "worker-src 'self' blob:"
  ].join('; ');
}

export function applySecurityHeaders(headers: Headers, env: RuntimeEnv = process.env): void {
  if (!headers.has('x-frame-options')) headers.set('x-frame-options', 'SAMEORIGIN');
  if (!headers.has('x-content-type-options')) headers.set('x-content-type-options', 'nosniff');
  if (!headers.has('referrer-policy')) headers.set('referrer-policy', 'strict-origin-when-cross-origin');
  if (!headers.has('permissions-policy')) {
    headers.set('permissions-policy', 'geolocation=(self), microphone=(), camera=()');
  }
  if (!headers.has('content-security-policy')) {
    headers.set('content-security-policy', buildContentSecurityPolicy(env));
  }
}
