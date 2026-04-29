import type { Handler, HandlerEvent } from '@netlify/functions';
import { clearAdminCookie, isAdminAuthed, jsonHeaders, makeAdminCookie, passcodeMatches } from './_trail-updates';

async function parsePasscode(event: HandlerEvent): Promise<string> {
  if (!event.body) return '';
  const contentType = event.headers['content-type'] || event.headers['Content-Type'] || '';
  if (contentType.includes('application/json')) {
    try {
      const parsed = JSON.parse(event.body);
      return typeof parsed?.passcode === 'string' ? parsed.passcode : '';
    } catch {
      return '';
    }
  }
  const params = new URLSearchParams(event.body);
  return params.get('passcode') || '';
}

const handler: Handler = async (event) => {
  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      headers: jsonHeaders(),
      body: JSON.stringify({ authenticated: isAdminAuthed(event) }),
    };
  }

  if (event.httpMethod === 'DELETE') {
    return {
      statusCode: 200,
      headers: jsonHeaders({ 'Set-Cookie': clearAdminCookie() }),
      body: JSON.stringify({ authenticated: false }),
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: jsonHeaders(),
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  const passcode = await parsePasscode(event);
  if (!passcodeMatches(passcode)) {
    return {
      statusCode: 401,
      headers: jsonHeaders(),
      body: JSON.stringify({ error: 'Wrong passcode' }),
    };
  }

  return {
    statusCode: 200,
    headers: jsonHeaders({ 'Set-Cookie': makeAdminCookie(event) }),
    body: JSON.stringify({ authenticated: true }),
  };
};

export { handler };
