import type { PageServerLoad } from './$types';
import { loadGuideIndex } from '$lib/server/guide';

export const load: PageServerLoad = async () => {
  return {
    chapters: await loadGuideIndex()
  };
};
