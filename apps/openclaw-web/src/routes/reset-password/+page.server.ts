import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { authApi, setAuthCookie, type AuthUser } from '$lib/server/auth';

interface LoginPayload {
  token: string;
  user: AuthUser;
}

export const load: PageServerLoad = async ({ url }) => {
  return {
    token: String(url.searchParams.get('token') ?? ''),
    email: String(url.searchParams.get('email') ?? '').trim()
  };
};

export const actions: Actions = {
  default: async ({ cookies, fetch, request, url }) => {
    const formData = await request.formData();
    const token = String(formData.get('token') ?? '');
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');
    const passwordConfirmation = String(formData.get('passwordConfirmation') ?? '');

    const reset = await authApi<{ message?: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        token,
        email,
        password,
        password_confirmation: passwordConfirmation
      })
    }, fetch, url.origin);

    if (!reset.ok) {
      return fail(400, {
        token,
        email,
        message: reset.error?.message || 'Password reset failed. Request a new recovery link and try again.'
      });
    }

    const login = await authApi<LoginPayload>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        device_name: 'Scout web'
      })
    }, fetch, url.origin);

    if (!login.ok || !login.data?.token) {
      throw redirect(303, '/login');
    }

    setAuthCookie(cookies, url, login.data.token);
    throw redirect(303, '/app');
  }
};
