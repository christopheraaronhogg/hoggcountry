import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { BETA_COOKIE, encodeBetaProfile } from '$lib/beta';
import { betaCookieOptions } from '$lib/server/beta-cookie';
import { resolveScoutQuickLogin } from '$lib/server/scout-beta-logins';

const SCOUT_BETA_PASSCODE = '3184';

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.betaProfile) {
    throw redirect(302, '/app');
  }

  return {};
};

export const actions: Actions = {
  default: async ({ cookies, request, url }) => {
    const formData = await request.formData();
    const quickUsername = String(formData.get('quickUsername') ?? '').trim();
    const quickPassword = String(formData.get('quickPassword') ?? '').trim();
    const passcode = String(formData.get('passcode') ?? '').trim();
    const rawName = String(formData.get('name') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim();
    const rawTrailName = String(formData.get('trailName') ?? '').trim();
    const fallbackName = email.split('@')[0]?.replace(/[._-]+/g, ' ').trim() || 'Hiker';
    const name = rawName || fallbackName;
    const trailName = rawTrailName || name;

    if (quickUsername || quickPassword) {
      const profile = resolveScoutQuickLogin(quickUsername, quickPassword);
      if (!profile) {
        return fail(401, {
          message: 'Use chris or dad with the shared trail beta password.',
          quickUsername
        });
      }

      cookies.set(BETA_COOKIE, encodeBetaProfile(profile), betaCookieOptions(url));
      throw redirect(303, '/app/scout');
    }

    if (passcode !== SCOUT_BETA_PASSCODE) {
      return fail(401, {
        message: 'Enter the beta passcode to start asking Scout.',
        email,
        name: rawName,
        trailName: rawTrailName
      });
    }

    if (!email) {
      return fail(400, {
        message: 'Email is required for the private beta gate. Everything else can be filled in later.',
        name: rawName,
        trailName: rawTrailName
      });
    }

    cookies.set(
      BETA_COOKIE,
      encodeBetaProfile({
        name,
        email,
        trailName
      }),
      betaCookieOptions(url)
    );

    throw redirect(303, '/app/scout');
  }
};
