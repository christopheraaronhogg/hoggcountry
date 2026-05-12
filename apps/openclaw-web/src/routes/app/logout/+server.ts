import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { BETA_COOKIE } from '$lib/beta';
import { betaCookieDeleteOptions } from '$lib/server/beta-cookie';

export const GET: RequestHandler = ({ cookies, url }) => {
  cookies.delete(BETA_COOKIE, betaCookieDeleteOptions(url));

  throw redirect(303, '/signup');
};
