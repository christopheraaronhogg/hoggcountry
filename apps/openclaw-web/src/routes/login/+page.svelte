<script lang="ts">
  import { onMount } from 'svelte';
  import { purgePrivateAppData } from '$lib/offline-field-pack';
  import type { ActionData, PageData } from './$types';

  const { data, form } = $props<{ data: PageData; form: ActionData }>();
  const message = $derived(form?.message || data.message);
  const redirectTo = $derived(form?.redirectTo || data.redirectTo || '/app');

  onMount(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('signed_out') !== '1') return;

    void purgePrivateAppData().finally(() => {
      url.searchParams.delete('signed_out');
      window.history.replaceState(
        window.history.state,
        '',
        `${url.pathname}${url.search}${url.hash}`
      );
    });
  });
</script>

<svelte:head>
  <title>Sign in | Hogg Country</title>
  <meta name="description" content="Sign in to the private Scout web beta." />
</svelte:head>

<section class="auth-shell">
  <div class="auth-copy">
    <p class="eyebrow">Scout account</p>
    <h1>Sign in to your trail workspace.</h1>
    <p class="lede">Use your private beta email and password. New hosted accounts are closed while Dad tests Scout.</p>
  </div>

  <div class="auth-panel">
    {#if data.chatgptUrl}
      <a class="chatgpt-button" href={data.chatgptUrl}>
        Continue with ChatGPT
        <span class="chatgpt-note">also connects Scout's brain</span>
      </a>
    {/if}

    {#if data.chatgptUrl}
      <div class="divider"><span>or</span></div>
    {/if}

    <form method="POST" class="auth-form">
      <input type="hidden" name="redirectTo" value={redirectTo} />

      <label>
        <span>Email</span>
        <input name="email" type="email" autocomplete="email" required value={form?.email ?? ''} />
      </label>

      <label>
        <span>Password</span>
        <input name="password" type="password" autocomplete="current-password" required />
      </label>

      {#if message}
        <p class="status" data-type={form?.message ? 'error' : data.messageType}>{message}</p>
      {/if}

      <button class="primary-button" type="submit">Sign in</button>
    </form>

    <div class="auth-links">
      <a href={`/forgot-password?email=${encodeURIComponent(form?.email ?? '')}`}>Forgot password?</a>
      <a href={`/signup?redirect=${encodeURIComponent(redirectTo)}`}>Join launch list</a>
    </div>
  </div>
</section>

<style>
  .auth-shell {
    display: grid;
    gap: 1.2rem;
    max-width: 860px;
    margin: 0 auto;
    padding: clamp(2rem, 7vw, 4.5rem) 1rem;
  }

  .auth-copy {
    display: grid;
    gap: 0.55rem;
    text-align: center;
  }

  .auth-copy h1 {
    margin: 0;
    color: var(--ink);
    font-family: Oswald, Impact, sans-serif;
    font-size: clamp(2rem, 5vw, 3.4rem);
    line-height: 1;
  }

  .lede {
    max-width: 36rem;
    margin: 0 auto;
    color: var(--muted);
  }

  .auth-panel {
    display: grid;
    gap: 1rem;
    max-width: 440px;
    width: 100%;
    margin: 0 auto;
    padding: 1rem;
    border: 1px solid rgba(77, 89, 74, 0.16);
    border-radius: 8px;
    background: #fffdf8;
    box-shadow: 0 16px 34px rgba(31, 41, 55, 0.08);
  }

  .auth-form {
    display: grid;
    gap: 0.85rem;
  }

  label {
    display: grid;
    gap: 0.35rem;
    color: var(--muted);
    font-weight: 800;
  }

  input {
    min-height: 2.9rem;
    width: 100%;
    border: 1px solid rgba(77, 89, 74, 0.18);
    border-radius: 8px;
    padding: 0 0.8rem;
    background: white;
    color: var(--ink);
    font: inherit;
  }

  .primary-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 2.95rem;
    border-radius: 8px;
    padding: 0 0.9rem;
    font-weight: 900;
    text-decoration: none;
  }

  .chatgpt-button {
    display: grid;
    justify-items: center;
    gap: 0.1rem;
    min-height: 3.3rem;
    border: 0;
    border-radius: 8px;
    padding: 0.5rem 0.9rem;
    background: #0d0d0d;
    color: white;
    font-weight: 900;
    text-decoration: none;
  }

  .chatgpt-note {
    color: rgba(255, 255, 255, 0.66);
    font-size: 0.72rem;
    font-weight: 700;
  }

  .primary-button {
    border: 0;
    background: var(--pine);
    color: white;
    cursor: pointer;
  }

  .divider {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 0.65rem;
    color: var(--muted);
    font-size: 0.82rem;
    font-weight: 800;
  }

  .divider::before,
  .divider::after {
    content: '';
    height: 1px;
    background: rgba(77, 89, 74, 0.16);
  }

  .status {
    margin: 0;
    color: var(--muted);
    font-weight: 800;
  }

  .status[data-type='error'] {
    color: #9f1239;
  }

  .auth-links {
    display: flex;
    justify-content: space-between;
    gap: 0.8rem;
    flex-wrap: wrap;
    color: var(--pine);
    font-weight: 850;
  }

  @media (min-width: 760px) {
    .auth-shell {
      grid-template-columns: minmax(0, 1fr) 440px;
      align-items: center;
    }

    .auth-copy {
      text-align: left;
    }

    .lede {
      margin: 0;
    }
  }
</style>
