import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
  buildOpenAICodexLabel,
  exchangeOpenAICodexAuthorizationCode
} from '$lib/server/claw-openai-codex';
import { encryptProviderJson } from '$lib/server/provider-crypto';
import {
  clearWorkspacePendingOpenAICodexAuth,
  getWorkspacePendingOpenAICodexAuth,
  saveWorkspaceOpenAICodexConnection
} from '$lib/server/workspace-store';

function clawRedirect(event: Parameters<RequestHandler>[0], params: Record<string, string>): never {
  const nextUrl = new URL('/app/scout', event.url);
  for (const [key, value] of Object.entries(params)) {
    nextUrl.searchParams.set(key, value);
  }
  throw redirect(303, nextUrl.toString());
}

export const GET: RequestHandler = async (event) => {
  const oauthError = event.url.searchParams.get('error');
  const oauthErrorDescription = event.url.searchParams.get('error_description');
  const code = event.url.searchParams.get('code');
  const state = event.url.searchParams.get('state');

  if (oauthError) {
    clawRedirect(event, {
      chatgpt_connect_error: oauthErrorDescription || oauthError
    });
  }

  if (!code || !state) {
    clawRedirect(event, {
      chatgpt_connect_error: 'ChatGPT callback was missing a code or state.'
    });
  }

  if (!event.locals.betaProfile || !event.locals.workspaceId) {
    clawRedirect(event, {
      chatgpt_connect_error: 'Start ChatGPT connect from the same Hogg Country browser session.'
    });
  }

  const pending = await getWorkspacePendingOpenAICodexAuth(event.locals.workspaceId, event.locals.betaProfile);
  if (!pending) {
    clawRedirect(event, {
      chatgpt_connect_error: 'Start a new ChatGPT connect flow first.'
    });
  }

  if (pending.state !== state) {
    clawRedirect(event, {
      chatgpt_connect_error: 'That ChatGPT callback does not match the latest connect attempt.'
    });
  }

  try {
    const credentials = await exchangeOpenAICodexAuthorizationCode(code, pending.verifier, pending.redirectUri);
    await saveWorkspaceOpenAICodexConnection(event.locals.workspaceId, event.locals.betaProfile, {
      encryptedCredentials: encryptProviderJson(credentials),
      accountId: credentials.accountId ?? null,
      expiresAt: new Date(credentials.expires).toISOString(),
      label: credentials.label || buildOpenAICodexLabel(credentials.accountId ?? null)
    });
    await clearWorkspacePendingOpenAICodexAuth(event.locals.workspaceId, event.locals.betaProfile);
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : 'Could not finish ChatGPT connect.';
    clawRedirect(event, {
      chatgpt_connect_error: message
    });
  }

  clawRedirect(event, {
    chatgpt_connected: '1'
  });
};
