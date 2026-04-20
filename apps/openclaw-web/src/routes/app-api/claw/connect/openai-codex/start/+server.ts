import type { RequestHandler } from './$types';
import {
  OPENAI_CODEX_LOCAL_REDIRECT_URI,
  resolveOpenAICodexRedirectUri,
  startOpenAICodexAuthorization
} from '$lib/server/claw-openai-codex';
import { requireWorkspace, ok } from '$lib/server/workspace-endpoint';
import { setWorkspacePendingOpenAICodexAuth } from '$lib/server/workspace-store';

export const POST: RequestHandler = async (event) => {
  const { workspaceId, betaProfile } = requireWorkspace(event);
  const redirectUri = resolveOpenAICodexRedirectUri(event.url.origin);
  const auth = startOpenAICodexAuthorization({
    originator: 'hoggcountry-cloud',
    redirectUri
  });
  const createdAt = new Date().toISOString();
  const mode = redirectUri === OPENAI_CODEX_LOCAL_REDIRECT_URI ? 'manual_callback' : 'cloud_callback';

  await setWorkspacePendingOpenAICodexAuth(workspaceId, betaProfile, {
    state: auth.state,
    verifier: auth.verifier,
    authorizeUrl: auth.authorizeUrl,
    redirectUri: auth.redirectUri,
    createdAt
  });

  return ok({
    authorizeUrl: auth.authorizeUrl,
    createdAt,
    mode,
    redirectUri: auth.redirectUri,
    instructions:
      mode === 'cloud_callback'
        ? [
            'Open the auth page and complete ChatGPT login.',
            'After approval, you should return to Scout automatically in the browser.',
            'If the redirect stalls or lands somewhere unexpected, copy the full callback URL or just the code and use the manual finish field below.'
          ]
        : [
            'Open the auth page in a new tab and complete ChatGPT login.',
            'OpenAI will redirect to localhost. When that happens, copy the full callback URL from the address bar.',
            'Paste that URL back into Hogg Country to finish the cloud connection.'
          ]
  });
};
