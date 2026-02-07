import type { Handler } from '@netlify/functions';
import { readSessionUser } from './_auth';

function jsonHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...extra,
  };
}

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: jsonHeaders(),
      body: JSON.stringify({ error: 'Method not allowed. Use GET.' }),
    };
  }

  const user = readSessionUser(event);
  return {
    statusCode: 200,
    headers: jsonHeaders(),
    body: JSON.stringify({
      authenticated: Boolean(user),
      user,
    }),
  };
};

export { handler };
