import { createHash } from 'node:crypto';
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
  authApi,
  authUserToBetaProfile,
  setAuthCookie,
  type AuthUser
} from '$lib/server/auth';
import {
  clearChatGptLoginPending,
  readChatGptLoginPending
} from '$lib/server/chatgpt-login';
import {
  buildOpenAICodexLabel,
  exchangeOpenAICodexAuthorizationCodeWithIdentity
} from '$lib/server/claw-openai-codex';
import { encryptProviderJson } from '$lib/server/provider-crypto';
import { saveWorkspaceOpenAICodexConnection } from '$lib/server/workspace-store';

interface ExchangePayload {
  token: string;
  user: AuthUser;
  provider?: string;
}

function loginRedirect(event: Parameters<RequestHandler>[0], message: string): never {
  const nextUrl = new URL('/login', event.url);
  nextUrl.searchParams.set('chatgpt_error', message);
  throw redirect(303, nextUrl.toString());
}

export const GET: RequestHandler = async (event) => {
  const secure = event.url.protocol === 'https:';
  const oauthError = event.url.searchParams.get('error');
  const oauthErrorDescription = event.url.searchParams.get('error_description');
  const code = event.url.searchParams.get('code');
  const state = event.url.searchParams.get('state');

  if (oauthError) {
    clearChatGptLoginPending(event.cookies, secure);
    loginRedirect(event, oauthErrorDescription || oauthError);
  }

  const pending = readChatGptLoginPending(event.cookies);
  if (!pending) {
    loginRedirect(event, 'ChatGPT login expired. Try again from this page.');
  }

  if (!code || !state || state !== pending.state) {
    clearChatGptLoginPending(event.cookies, secure);
    loginRedirect(event, 'ChatGPT login could not be completed. Try again.');
  }

  let credentials;
  let idToken: string | null;
  try {
    ({ credentials, idToken } = await exchangeOpenAICodexAuthorizationCodeWithIdentity(
      code,
      pending.verifier,
      pending.redirectUri
    ));
  } catch (error) {
    clearChatGptLoginPending(event.cookies, secure);
    console.error('[chatgpt-login] token exchange failed', error);
    loginRedirect(event, 'ChatGPT login could not be completed. Try again.');
  }

  clearChatGptLoginPending(event.cookies, secure);

  if (!idToken) {
    loginRedirect(event, 'ChatGPT did not return a sign-in identity. Use email login instead.');
  }

  const result = await authApi<ExchangePayload>(
    '/auth/openai/exchange',
    {
      method: 'POST',
      body: JSON.stringify({ id_token: idToken, device_name: 'Scout web (ChatGPT login)' })
    },
    event.fetch
  );

  if (!result.ok || !result.data?.token || !result.data.user) {
    loginRedirect(event, result.error?.message || 'ChatGPT login was rejected. Use email login instead.');
  }

  setAuthCookie(event.cookies, event.url, result.data.token);

  // Same OAuth grant doubles as Scout's model lane: store it against the
  // workspace so the brain is connected the moment the account exists.
  // Login must still succeed if this part fails — the settings page can
  // reconnect the lane later.
  try {
    const betaProfile = authUserToBetaProfile(result.data.user);
    const workspaceId = createHash('sha256').update(betaProfile.email).digest('hex');
    await saveWorkspaceOpenAICodexConnection(workspaceId, betaProfile, {
      encryptedCredentials: encryptProviderJson(credentials),
      accountId: credentials.accountId ?? null,
      expiresAt: new Date(credentials.expires).toISOString(),
      label: credentials.label || buildOpenAICodexLabel(credentials.accountId ?? null)
    });
  } catch (error) {
    console.error('[chatgpt-login] connected lane save failed; login continues', error);
  }

  throw redirect(303, pending.redirectTo || '/app/scout');
};
