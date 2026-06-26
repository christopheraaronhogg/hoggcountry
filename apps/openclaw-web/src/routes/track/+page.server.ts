import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// /track is the long-standing share URL. It now lands on our own AT map
// (the primary map) instead of Garmin MapShare. Garmin remains the upstream
// data source the map fetches from (see $lib/server/dad.ts), just not a
// user-facing destination.
export const load: PageServerLoad = async () => {
  throw redirect(302, '/at-map');
};
