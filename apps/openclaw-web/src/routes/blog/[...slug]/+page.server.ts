import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { loadBlogEntryBySlug } from '$lib/server/public-content';

export const load: PageServerLoad = async ({ params }) => {
  const post = await loadBlogEntryBySlug(params.slug);
  if (!post) throw error(404, 'Post not found.');

  return {
    post
  };
};
