import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { isScoutAdminProfile } from '$lib/server/scout-admin';
import { loadScoutResourceExplorerData } from '$lib/server/scout-resource-explorer';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.betaProfile || !locals.workspaceId) throw error(401, 'Beta profile required.');
  if (!isScoutAdminProfile(locals.betaProfile)) throw error(403, 'Scout admin access required.');

  return loadScoutResourceExplorerData(locals.workspaceId, locals.betaProfile);
};
