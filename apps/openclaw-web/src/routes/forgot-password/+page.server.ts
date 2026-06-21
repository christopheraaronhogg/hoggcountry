import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { authApi } from '$lib/server/auth';

export const load: PageServerLoad = async ({ url }) => {
  return {
    email: String(url.searchParams.get('email') ?? '').trim()
  };
};

export const actions: Actions = {
  default: async ({ fetch, request, url }) => {
    const formData = await request.formData();
    const email = String(formData.get('email') ?? '').trim();

    const result = await authApi<{ message?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    }, fetch, url.origin);

    if (!result.ok) {
      return fail(400, {
        email,
        message: result.error?.message || 'Password recovery failed. Check the email and try again.'
      });
    }

    return {
      email,
      sent: true,
      message: 'If an account exists for that email, a recovery link is on the way.'
    };
  }
};
