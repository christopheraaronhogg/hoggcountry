import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// The legacy Today page was folded into /app. Anything still pointing at
// /app/today (old bookmarks, cached service-worker entries) lands there.
export const load: PageServerLoad = () => {
  throw redirect(307, '/app');
};
