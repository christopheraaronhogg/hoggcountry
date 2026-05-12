import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { BETA_COOKIE } from '$lib/beta';

export const GET: RequestHandler = ({ cookies }) => {
  cookies.delete(BETA_COOKIE, {
    path: '/'
  });

  throw redirect(303, '/signup');
};
