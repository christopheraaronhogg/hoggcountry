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
