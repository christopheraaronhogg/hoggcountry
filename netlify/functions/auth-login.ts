import type { Handler, HandlerEvent } from '@netlify/functions';
import { authenticate, createSessionToken, getAuthSetupIssues, makeSessionCookie } from './_auth';

function jsonHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...extra,
  };
}

async function parseBody(event: HandlerEvent): Promise<{ email: string; password: string } | null> {
  if (!event.body) return null;

  let payload: unknown;
  try {
    payload = JSON.parse(event.body);
  } catch {
    return null;
  }

  if (!payload || typeof payload !== 'object') return null;
  const record = payload as Record<string, unknown>;
  const email = typeof record.email === 'string' ? record.email : '';
  const password = typeof record.password === 'string' ? record.password : '';
  return { email, password };
}

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: jsonHeaders(),
      body: JSON.stringify({ error: 'Method not allowed. Use POST.' }),
    };
  }

  const setupIssues = getAuthSetupIssues();
  if (setupIssues.length > 0) {
    return {
      statusCode: 503,
      headers: jsonHeaders(),
      body: JSON.stringify({
        error: 'Auth backend is not configured yet.',
        issues: setupIssues,
      }),
    };
  }

  const body = await parseBody(event);
  if (!body || !body.email || !body.password) {
    return {
      statusCode: 400,
      headers: jsonHeaders(),
      body: JSON.stringify({ error: 'Email and password are required.' }),
    };
  }

  const user = authenticate(body.email, body.password);
  if (!user) {
    return {
      statusCode: 401,
      headers: jsonHeaders(),
      body: JSON.stringify({ error: 'Invalid email or password.' }),
    };
  }

  const token = createSessionToken(user);
  if (!token) {
    return {
      statusCode: 503,
      headers: jsonHeaders(),
      body: JSON.stringify({ error: 'Session signing is not configured.' }),
    };
  }

  return {
    statusCode: 200,
    headers: jsonHeaders({
      'Set-Cookie': makeSessionCookie(event, token),
    }),
    body: JSON.stringify({
      authenticated: true,
      user,
    }),
  };
};

export { handler };
