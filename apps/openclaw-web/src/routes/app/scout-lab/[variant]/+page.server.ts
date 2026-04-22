import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getScoutLabVariant } from '$lib/scout-lab';

export const load: PageServerLoad = async ({ params }) => {
  const variant = getScoutLabVariant(params.variant);

  if (!variant) {
    throw error(404, 'Scout lab variant not found.');
  }

  return {
    variant
  };
};
