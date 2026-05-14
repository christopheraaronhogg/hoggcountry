import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isScoutAdminProfile } from '$lib/server/scout-admin';
import { requireWorkspace, ok } from '$lib/server/workspace-endpoint';
import { readScoutReferenceTablePage } from '$lib/server/scout-resource-explorer';

export const GET: RequestHandler = async (event) => {
  const { betaProfile } = requireWorkspace(event);
  if (!isScoutAdminProfile(betaProfile)) throw error(403, 'Scout admin access required.');

  const path = event.url.searchParams.get('path') ?? '';
  const offset = Number(event.url.searchParams.get('offset') ?? '0');
  const limit = Number(event.url.searchParams.get('limit') ?? '30');

  try {
    return ok(readScoutReferenceTablePage({ path, offset, limit }));
  } catch (caught) {
    throw error(400, caught instanceof Error ? caught.message : 'Could not load Scout reference table.');
  }
};
