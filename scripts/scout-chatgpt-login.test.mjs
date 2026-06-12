import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');

test('ChatGPT login routes exist with PKCE start and same-origin callback', () => {
  assert.equal(existsSync(new URL('apps/openclaw-web/src/routes/auth/chatgpt/start/+server.ts', root)), true);
  assert.equal(existsSync(new URL('apps/openclaw-web/src/routes/auth/chatgpt/callback/+server.ts', root)), true);

  const start = read('apps/openclaw-web/src/routes/auth/chatgpt/start/+server.ts');
  assert.match(start, /startOpenAICodexAuthorization/u);
  assert.match(start, /hoggcountry-login/u);
  assert.match(start, /\/auth\/chatgpt\/callback/u);
  assert.match(start, /httpOnly: true/u);

  const callback = read('apps/openclaw-web/src/routes/auth/chatgpt/callback/+server.ts');
  assert.match(callback, /exchangeOpenAICodexAuthorizationCodeWithIdentity/u);
  assert.match(callback, /\/auth\/openai\/exchange/u);
  assert.match(callback, /setAuthCookie/u);
  assert.match(callback, /saveWorkspaceOpenAICodexConnection/u);
  assert.match(callback, /state !== pending\.state/u);
});

test('login flow keeps lane storage non-fatal so auth still succeeds', () => {
  const callback = read('apps/openclaw-web/src/routes/auth/chatgpt/callback/+server.ts');
  assert.match(callback, /connected lane save failed; login continues/u);
});

test('login and signup ChatGPT buttons exist but are gated off by default', () => {
  const login = read('apps/openclaw-web/src/routes/login/+page.svelte');
  assert.match(login, /Continue with ChatGPT/u);
  assert.match(login, /\{#if data\.chatgptUrl\}/u);

  const loginServer = read('apps/openclaw-web/src/routes/login/+page.server.ts');
  assert.match(loginServer, /PUBLIC_CHATGPT_LOGIN_ENABLED/u);

  const signup = read('apps/openclaw-web/src/routes/signup/+page.svelte');
  assert.match(signup, /Continue with ChatGPT/u);
  assert.match(signup, /\{#if data\.chatgptEnabled\}/u);
  assert.match(signup, /\/auth\/chatgpt\/start/u);
});

test('OAuth redirect defaults to the registered localhost URI (cloud rejected by OpenAI)', async () => {
  const { resolveOpenAICodexRedirectUri, OPENAI_CODEX_LOCAL_REDIRECT_URI } = await import(
    '../apps/openclaw-web/src/lib/server/claw-openai-codex.ts'
  );

  assert.equal(resolveOpenAICodexRedirectUri('https://hoggcountry.com'), OPENAI_CODEX_LOCAL_REDIRECT_URI);

  process.env.SCOUT_OPENAI_CODEX_REDIRECT_URI = 'https://example.com/cb';
  try {
    assert.equal(resolveOpenAICodexRedirectUri('https://hoggcountry.com'), 'https://example.com/cb');
  } finally {
    delete process.env.SCOUT_OPENAI_CODEX_REDIRECT_URI;
  }
});

test('Laravel exchange endpoint is registered and verifies tokens via JWKS', () => {
  const routes = read('backend/routes/api.php');
  assert.match(routes, /auth\/openai\/exchange|\/openai\/exchange/u);
  assert.match(routes, /openaiExchange/u);

  const controller = read('backend/app/Http/Controllers/Api/V1/AuthController.php');
  assert.match(controller, /OpenAIIdToken::verify/u);
  assert.match(controller, /'provider' => 'openai'/u);

  const verifier = read('backend/app/Support/OpenAIIdToken.php');
  assert.match(verifier, /app_EMoamEEZ73f0CkXaXp7hrann/u);
  assert.match(verifier, /jwks\.json/u);
  assert.match(verifier, /JWK::parseKeySet/u);
});

test('token exchange exposes the OIDC id_token for login flows', () => {
  const lib = read('apps/openclaw-web/src/lib/server/claw-openai-codex.ts');
  assert.match(lib, /exchangeOpenAICodexAuthorizationCodeWithIdentity/u);
  assert.match(lib, /id_token/u);
});
