import type { PageServerLoad } from './$types';
import { loadTags } from '$lib/server/public-content';

export const load: PageServerLoad = async () => {
  return {
    tags: await loadTags()
  };
};
