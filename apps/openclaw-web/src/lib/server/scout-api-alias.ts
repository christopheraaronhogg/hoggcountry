import type { RequestEvent } from '@sveltejs/kit';

export async function proxyScoutApiToClaw(event: RequestEvent, path = ''): Promise<Response> {
  const target = new URL(event.url);
  target.pathname = `/app-api/claw${path ? `/${path.replace(/^\/+/u, '')}` : ''}`;

  const method = event.request.method.toUpperCase();
  const body = method === 'GET' || method === 'HEAD'
    ? undefined
    : await event.request.arrayBuffer();

  return event.fetch(target, {
    method,
    headers: event.request.headers,
    body,
    redirect: 'manual'
  });
}
