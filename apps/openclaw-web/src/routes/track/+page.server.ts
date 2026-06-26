import { redirect } from '@sveltejs/kit';
import { LIVE_TRACKING_URL } from '../../../../../src/lib/config';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  throw redirect(302, LIVE_TRACKING_URL);
};
