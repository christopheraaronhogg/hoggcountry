import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { addWaitlistSignup } from '$lib/server/waitlist';

// Public app-launch waitlist signup. The `website` field is a honeypot:
// bots that fill it get a quiet success without a write.
export const POST: RequestHandler = async (event) => {
  const payload = (await event.request.json().catch(() => null)) as {
    email?: unknown;
    source?: unknown;
    website?: unknown;
  } | null;

  if (!payload) throw error(400, 'Signup payload is required.');
  if (typeof payload.website === 'string' && payload.website.trim() !== '') {
    return json({ status: 'added' }, { headers: { 'cache-control': 'no-store' } });
  }

  try {
    const status = await addWaitlistSignup(payload.email, payload.source);
    return json({ status }, { headers: { 'cache-control': 'no-store' } });
  } catch (caught) {
    throw error(400, caught instanceof Error ? caught.message : 'Could not join the waitlist.');
  }
};
