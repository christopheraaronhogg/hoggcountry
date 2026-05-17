<script lang="ts">
  import { onMount } from 'svelte';
  import type { PageData } from './$types';

  const { data } = $props<{ data: PageData }>();
  const AUTH_KEY = 'hcApiAuth.v1';
  const REDIRECT_KEY = 'hcLoginRedirect.v1';

  interface AuthPayload {
    token: string;
    provider?: string;
    user?: { name?: string; email?: string } | null;
  }

  let status = $state('');
  let statusType = $state<'info' | 'success' | 'error'>('info');
  let user = $state<{ name?: string; email?: string } | null>(null);
  let loggedIn = $state(false);
  let busy = $state(false);
  let redirectTo = $state('/trail/');

  onMount(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const queryRedirect = normalizeRedirect(searchParams.get('redirect') || '');
    const storedRedirect = normalizeRedirect(sessionStorage.getItem(REDIRECT_KEY) || '');
    redirectTo = queryRedirect || storedRedirect || '/trail/';
    if (queryRedirect) sessionStorage.setItem(REDIRECT_KEY, queryRedirect);

    const hashParams = new URLSearchParams(window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '');
    const tokenFromHash = hashParams.get('token');
    if (tokenFromHash) {
      writeAuth({ token: tokenFromHash, provider: hashParams.get('provider') || 'google' });
      history.replaceState({}, document.title, window.location.pathname + window.location.search);
    }

    void hydrate(Boolean(tokenFromHash));
  });

  function parseJson(raw: string | null): AuthPayload | null {
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthPayload;
    } catch {
      return null;
    }
  }

  function readAuth(): AuthPayload | null {
    const auth = parseJson(localStorage.getItem(AUTH_KEY));
    return auth?.token ? auth : null;
  }

  function writeAuth(payload: AuthPayload) {
    localStorage.setItem(AUTH_KEY, JSON.stringify({
      token: payload.token,
      provider: payload.provider || 'google',
      user: payload.user || null,
      updatedAt: new Date().toISOString()
    }));
  }

  function clearAuth() {
    localStorage.removeItem(AUTH_KEY);
  }

  function normalizeRedirect(value: string): string {
    if (!value.startsWith('/') || value.startsWith('//')) return '';
    return value;
  }

  function setStatus(message: string, type: typeof statusType = 'info') {
    status = message;
    statusType = type;
  }

  async function fetchMe(token: string) {
    const response = await fetch(`${data.apiBase}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) return null;
    const payload = await response.json().catch(() => null);
    return payload?.data ?? null;
  }

  async function hydrate(returnedFromProvider = false) {
    const auth = readAuth();
    if (!auth) {
      loggedIn = false;
      setStatus('Sign in to sync your profile across devices.');
      return;
    }

    setStatus('Verifying session...');
    const me = await fetchMe(auth.token);
    if (!me) {
      clearAuth();
      loggedIn = false;
      setStatus('Your session expired. Please sign in again.', 'error');
      return;
    }

    user = me;
    loggedIn = true;
    writeAuth({ token: auth.token, provider: auth.provider, user: me });

    if (returnedFromProvider) {
      setStatus('Signed in with Google. Redirecting...', 'success');
      setTimeout(() => window.location.assign(redirectTo), 500);
    } else {
      setStatus('You are signed in.', 'success');
    }
  }

  function loginWithGoogle() {
    busy = true;
    setStatus('Redirecting to Google...');
    sessionStorage.setItem(REDIRECT_KEY, redirectTo);
    const callbackUrl = new URL('/login', window.location.origin);
    if (redirectTo !== '/trail/') callbackUrl.searchParams.set('redirect', redirectTo);
    const oauthUrl = new URL(`${data.apiBase}/auth/google/redirect`);
    oauthUrl.searchParams.set('callback', callbackUrl.toString());
    window.location.assign(oauthUrl.toString());
  }

  async function logout() {
    const auth = readAuth();
    busy = true;
    setStatus('Signing out...');
    try {
      if (auth?.token) {
        await fetch(`${data.apiBase}/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${auth.token}` }
        });
      }
    } finally {
      clearAuth();
      busy = false;
      loggedIn = false;
      user = null;
      setStatus('Signed out.', 'success');
    }
  }
</script>

<svelte:head>
  <title>Account | Hogg Country</title>
  <meta name="description" content="Sign in with Google to sync your profile and trail data across devices." />
</svelte:head>

<section class="hero">
  <span class="chapter">Account</span>
  <h1>Sign In</h1>
  <p>Use Google for a fast login. We keep your trail model local-first and sync in the background.</p>
</section>

<div class="container auth-wrap">
  <div class="auth-card">
    {#if loggedIn}
      <p class="user">Signed in as {user?.name || user?.email}</p>
      <a class="continue-link" href={redirectTo}>Continue to Trail Hub</a>
      <button type="button" class="logout-button" disabled={busy} onclick={logout}>Log Out</button>
    {:else}
      <button type="button" class="google-button" disabled={busy} onclick={loginWithGoogle}>Continue with Google</button>
    {/if}
    <p class="status" data-type={statusType} aria-live="polite">{status}</p>
  </div>
</div>

<style>
  .hero {
    padding: 3rem 1rem 2rem;
    text-align: center;
  }

  .chapter {
    display: inline-block;
    margin: 0.5rem auto 1rem;
    padding: 0.25rem 0.75rem;
    border: 2px solid var(--pine);
    border-radius: 999px;
    background: #fdfcf7;
    color: var(--pine);
    font-family: Oswald, sans-serif;
    letter-spacing: 0.02em;
  }

  h1 {
    margin: 0;
    font-size: clamp(2.4rem, 5vw, 4rem);
  }

  .hero p,
  .status,
  .user {
    color: var(--muted);
  }

  .auth-wrap {
    max-width: 560px;
    padding-bottom: 4rem;
  }

  .auth-card {
    display: grid;
    gap: 0.9rem;
    padding: 1.1rem;
    border: 1px solid var(--border);
    border-radius: 14px;
    background: var(--card);
    box-shadow: var(--shadow-soft);
  }

  button,
  .continue-link {
    min-height: 46px;
    border-radius: 10px;
    padding: 0.72rem 0.9rem;
    font-weight: 800;
    text-align: center;
  }

  .google-button,
  .logout-button {
    border: 1px solid var(--border);
    background: #fff;
    color: var(--ink);
    cursor: pointer;
  }

  .continue-link {
    background: var(--pine);
    color: #fff;
    text-decoration: none;
  }

  .status[data-type='error'] {
    color: #9f1239;
  }

  .status[data-type='success'] {
    color: var(--status-live);
  }
</style>
