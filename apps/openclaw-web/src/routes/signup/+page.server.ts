import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { BETA_COOKIE, encodeBetaProfile } from '$lib/beta';

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.betaProfile) {
    throw redirect(302, '/app');
  }

  return {};
};

export const actions: Actions = {
  default: async ({ cookies, request }) => {
    const formData = await request.formData();
    const name = String(formData.get('name') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim();
    const trailName = String(formData.get('trailName') ?? '').trim();

    if (!name || !email || !trailName) {
      return fail(400, {
        message: 'Name, email, and trail name are all required.'
      });
    }

    cookies.set(
      BETA_COOKIE,
      encodeBetaProfile({
        name,
        email,
        trailName
      }),
      {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        maxAge: 60 * 60 * 24 * 30
      }
    );

    throw redirect(303, '/app/setup');
  }
};
