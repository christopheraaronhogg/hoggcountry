import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { BETA_COOKIE } from '$lib/beta';
import { clearAuthCookie, authApi } from '$lib/server/auth';
import { betaCookieDeleteOptions } from '$lib/server/beta-cookie';

export const GET: RequestHandler = async ({ cookies, locals, url, fetch }) => {
  if (locals.authToken) {
    await authApi('/auth/logout', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${locals.authToken}`
      }
    }, fetch, url.origin).catch(() => null);
  }

  clearAuthCookie(cookies, url);
  cookies.delete(BETA_COOKIE, betaCookieDeleteOptions(url));

  throw redirect(303, '/login?signed_out=1');
};
