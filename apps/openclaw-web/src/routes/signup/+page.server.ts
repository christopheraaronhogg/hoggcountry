import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { normalizeRedirect } from '$lib/server/auth';

const REGISTRATION_CLOSED_MESSAGE =
  'Scout web signups are closed while the hosted AI beta is private. Join the launch list and we will holler when the app opens.';

export const load: PageServerLoad = async ({ locals, url }) => {
  const redirectTo = normalizeRedirect(url.searchParams.get('redirect'));
  if (locals.authUser) {
    throw redirect(302, redirectTo);
  }

  return { redirectTo };
};

export const actions: Actions = {
  default: async ({ request }) => {
    const formData = await request.formData();
    const redirectTo = normalizeRedirect(String(formData.get('redirectTo') ?? ''));

    return fail(403, {
      message: REGISTRATION_CLOSED_MESSAGE,
      redirectTo
    });
  }
};
