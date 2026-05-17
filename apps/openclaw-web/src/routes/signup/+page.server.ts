import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
  authApi,
  normalizeRedirect,
  setAuthCookie,
  type AuthUser
} from '$lib/server/auth';

interface RegisterPayload {
  token: string;
  user: AuthUser;
}

function registerMessage(status: number, message?: string): string {
  if (message) return message;
  if (status === 409) return 'An account already exists for this email. Sign in or recover your login instead.';
  if (status === 422) return 'Check the account details, then try again.';
  return 'Account creation failed. Try again.';
}

export const load: PageServerLoad = async ({ locals, url }) => {
  const redirectTo = normalizeRedirect(url.searchParams.get('redirect'));
  if (locals.authUser) {
    throw redirect(302, redirectTo);
  }

  return {
    redirectTo
  };
};

export const actions: Actions = {
  default: async ({ cookies, fetch, request, url }) => {
    const formData = await request.formData();
    const name = String(formData.get('name') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');
    const passwordConfirmation = String(formData.get('passwordConfirmation') ?? '');
    const redirectTo = normalizeRedirect(String(formData.get('redirectTo') ?? ''));

    const result = await authApi<RegisterPayload>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
        device_name: 'Scout web'
      })
    }, fetch);

    if (!result.ok || !result.data?.token) {
      return fail(result.status === 409 ? 409 : 400, {
        message: registerMessage(result.status, result.error?.message),
        name,
        email,
        redirectTo
      });
    }

    setAuthCookie(cookies, url, result.data.token);
    throw redirect(303, redirectTo);
  }
};
