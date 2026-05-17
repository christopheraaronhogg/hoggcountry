import type { PageServerLoad } from './$types';
import { loadBlogEntries } from '$lib/server/public-content';

export const load: PageServerLoad = async () => {
  return {
    posts: await loadBlogEntries()
  };
};
