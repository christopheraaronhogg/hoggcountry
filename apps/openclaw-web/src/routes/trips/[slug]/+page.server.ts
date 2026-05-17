import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { loadTripBySlug } from '$lib/server/public-content';

export const load: PageServerLoad = async ({ params }) => {
  const trip = await loadTripBySlug(params.slug);
  if (!trip) throw error(404, 'Trip not found.');

  return {
    trip
  };
};
