export function publicApiBase(): string {
  const configured = process.env.PUBLIC_API_BASE_URL?.trim();
  if (configured) return configured.replace(/\/+$/u, '');

  if (process.env.NODE_ENV === 'development') {
    return 'http://127.0.0.1:8000/api/v1';
  }

  return '/api/v1';
}
