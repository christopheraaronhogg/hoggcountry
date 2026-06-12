import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { normalizeRedirect } from '$lib/server/auth';
import { CHATGPT_LOGIN_COOKIE } from '$lib/server/chatgpt-login';
import { startOpenAICodexAuthorization } from '$lib/server/claw-openai-codex';

// Pre-auth "Continue with ChatGPT" entry point: stash the PKCE state in a
// short-lived httpOnly cookie (no workspace exists yet) and hand the user
// to OpenAI. The same-origin callback finishes the round trip.
export const GET: RequestHandler = async (event) => {
  const redirectTo = normalizeRedirect(event.url.searchParams.get('redirect'), '/app/scout');
  const callbackUri = new URL('/auth/chatgpt/callback', event.url.origin).toString();

  const auth = startOpenAICodexAuthorization({
    originator: 'hoggcountry-login',
    redirectUri: callbackUri
  });

  event.cookies.set(
    CHATGPT_LOGIN_COOKIE,
    JSON.stringify({
      state: auth.state,
      verifier: auth.verifier,
      redirectUri: auth.redirectUri,
      redirectTo
    }),
    {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: event.url.protocol === 'https:',
      maxAge: 60 * 10
    }
  );

  throw redirect(302, auth.authorizeUrl);
};
