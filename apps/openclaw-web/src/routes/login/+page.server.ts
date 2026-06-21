import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
  authApi,
  normalizeRedirect,
  setAuthCookie,
  type AuthUser
} from '$lib/server/auth';
import { publicApiBase } from '$lib/server/public-api';
import { env } from '$env/dynamic/public';

// One-tap ChatGPT login requires a cloud redirect URI that OpenAI's Codex
// client rejects today (verified 2026-06-12); flip this on when the official
// Sign-in-with-ChatGPT program registers one for us.
function chatgptLoginUrl(redirectTo: string): string | null {
  if (env.PUBLIC_CHATGPT_LOGIN_ENABLED !== '1') return null;
  return `/auth/chatgpt/start?redirect=${encodeURIComponent(redirectTo)}`;
}

interface LoginPayload {
  token: string;
  user: AuthUser;
  provider?: string;
}

function googleLoginUrl(origin: string, redirectTo: string): string {
  const callbackUrl = new URL('/login', origin);
  callbackUrl.searchParams.set('redirect', redirectTo);

  const oauthUrl = new URL(`${publicApiBase(origin)}/auth/google/redirect`, origin);
  oauthUrl.searchParams.set('callback', callbackUrl.toString());

  return oauthUrl.toString();
}

function authErrorMessage(status: number, message?: string): string {
  if (message) return message;
  if (status === 422 || status === 401) return 'Check your email and password, then try again.';
  return 'Sign in failed. Try again.';
}

export const load: PageServerLoad = async ({ cookies, fetch, locals, url }) => {
  const redirectTo = normalizeRedirect(url.searchParams.get('redirect'));
  const handoff = url.searchParams.get('handoff');

  if (handoff) {
    const result = await authApi<LoginPayload>('/auth/google/handoff', {
      method: 'POST',
      body: JSON.stringify({ code: handoff })
    }, fetch, url.origin);

    if (result.ok && result.data?.token) {
      setAuthCookie(cookies, url, result.data.token);
      throw redirect(303, redirectTo);
    }

    return {
      redirectTo,
      googleUrl: googleLoginUrl(url.origin, redirectTo),
      chatgptUrl: chatgptLoginUrl(redirectTo),
      message: authErrorMessage(result.status, result.error?.message),
      messageType: 'error' as const
    };
  }

  if (locals.authUser) {
    throw redirect(302, redirectTo);
  }

  const chatgptError = url.searchParams.get('chatgpt_error');

  return {
    redirectTo,
    googleUrl: googleLoginUrl(url.origin, redirectTo),
    chatgptUrl: chatgptLoginUrl(redirectTo),
    message: chatgptError ? `ChatGPT sign-in failed: ${chatgptError}` : '',
    messageType: chatgptError ? ('error' as const) : ('info' as const)
  };
};

export const actions: Actions = {
  default: async ({ cookies, fetch, request, url }) => {
    const formData = await request.formData();
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');
    const redirectTo = normalizeRedirect(String(formData.get('redirectTo') ?? ''));

    const result = await authApi<LoginPayload>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        device_name: 'Scout web'
      })
    }, fetch, url.origin);

    if (!result.ok || !result.data?.token) {
      return fail(result.status === 401 ? 401 : 400, {
        message: authErrorMessage(result.status, result.error?.message),
        email,
        redirectTo
      });
    }

    setAuthCookie(cookies, url, result.data.token);
    throw redirect(303, redirectTo);
  }
};
