import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isScoutAdminProfile } from '$lib/server/scout-admin';
import { requireWorkspace, ok } from '$lib/server/workspace-endpoint';
import { listWaitlistSignups } from '$lib/server/waitlist';

export const GET: RequestHandler = async (event) => {
  const { betaProfile } = requireWorkspace(event);
  if (!isScoutAdminProfile(betaProfile)) throw error(403, 'Scout admin access required.');

  const signups = await listWaitlistSignups();
  return ok({ count: signups.length, signups });
};
