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
    const rawName = String(formData.get('name') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim();
    const rawTrailName = String(formData.get('trailName') ?? '').trim();
    const fallbackName = email.split('@')[0]?.replace(/[._-]+/g, ' ').trim() || 'Hiker';
    const name = rawName || fallbackName;
    const trailName = rawTrailName || name;

    if (!email) {
      return fail(400, {
        message: 'Email is required for the private beta gate. Everything else can be filled in later.'
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

    throw redirect(303, '/app/claw');
  }
};
