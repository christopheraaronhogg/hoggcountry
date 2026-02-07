import type { Handler } from '@netlify/functions';
import { clearSessionCookie } from './_auth';

function jsonHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...extra,
  };
}

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: jsonHeaders(),
      body: JSON.stringify({ error: 'Method not allowed. Use POST.' }),
    };
  }

  return {
    statusCode: 200,
    headers: jsonHeaders({
      'Set-Cookie': clearSessionCookie(event),
    }),
    body: JSON.stringify({ ok: true }),
  };
};

export { handler };
