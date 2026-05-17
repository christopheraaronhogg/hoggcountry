import type { PageServerLoad } from './$types';
import { publicApiBase } from '$lib/server/public-api';

export const load: PageServerLoad = async () => {
  return {
    apiBase: `${publicApiBase()}/trail-updates`
  };
};
