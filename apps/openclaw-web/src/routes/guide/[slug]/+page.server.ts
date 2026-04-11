import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { loadGuideBySlug, loadGuideIndex } from '$lib/server/guide';

export const load: PageServerLoad = async ({ params }) => {
  const [entry, chapters] = await Promise.all([loadGuideBySlug(params.slug), loadGuideIndex()]);

  if (!entry) {
    throw error(404, 'Guide chapter not found.');
  }

  return {
    entry,
    chapters
  };
};
