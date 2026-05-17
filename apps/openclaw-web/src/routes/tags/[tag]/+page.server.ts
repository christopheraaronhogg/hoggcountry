import type { PageServerLoad } from './$types';
import { loadTag } from '$lib/server/public-content';

export const load: PageServerLoad = async ({ params }) => {
  return {
    bucket: await loadTag(params.tag)
  };
};
