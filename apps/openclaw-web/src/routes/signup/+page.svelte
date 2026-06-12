<script lang="ts">
  import type { ActionData, PageData } from './$types';

  const { data, form } = $props<{ data: PageData; form: ActionData }>();
  const redirectTo = $derived(form?.redirectTo || data.redirectTo || '/app');
</script>

<svelte:head>
  <title>Create Scout account | Hogg Country</title>
  <meta name="robots" content="noindex,nofollow" />
</svelte:head>

<section class="auth-shell">
  <div class="auth-copy">
    <p class="eyebrow">Scout account</p>
    <h1>Create your trail workspace.</h1>
    <p class="lede">One tap with ChatGPT creates your account and connects Scout's brain, or use email and password.</p>
  </div>

  <form method="POST" class="auth-panel">
    <a class="chatgpt-button" href={`/auth/chatgpt/start?redirect=${encodeURIComponent(redirectTo)}`}>
      Continue with ChatGPT
      <span class="chatgpt-note">creates your account + connects Scout's brain</span>
    </a>

    <div class="divider"><span>or</span></div>

    <input type="hidden" name="redirectTo" value={redirectTo} />

    <label>
      <span>Name</span>
      <input name="name" autocomplete="name" required value={form?.name ?? ''} />
    </label>

    <label>
      <span>Email</span>
      <input name="email" type="email" autocomplete="email" required value={form?.email ?? ''} />
    </label>

    <label>
      <span>Password</span>
      <input name="password" type="password" autocomplete="new-password" minlength="8" required />
    </label>

    <label>
      <span>Confirm password</span>
      <input name="passwordConfirmation" type="password" autocomplete="new-password" minlength="8" required />
    </label>

    {#if form?.message}
      <p class="status" data-type="error">{form.message}</p>
    {/if}

    <button class="primary-button" type="submit">Create account</button>

    <div class="auth-links">
      <a href={`/login?redirect=${encodeURIComponent(redirectTo)}`}>Already have an account?</a>
      <a href={`/forgot-password?email=${encodeURIComponent(form?.email ?? '')}`}>Recover login</a>
    </div>
  </form>
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
    gap: 0.85rem;
    max-width: 440px;
    width: 100%;
    margin: 0 auto;
    padding: 1rem;
    border: 1px solid rgba(77, 89, 74, 0.16);
    border-radius: 8px;
    background: #fffdf8;
    box-shadow: 0 16px 34px rgba(31, 41, 55, 0.08);
  }

  .chatgpt-button {
    display: grid;
    justify-items: center;
    gap: 0.1rem;
    min-height: 3.3rem;
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
    border: 0;
    border-radius: 8px;
    background: var(--pine);
    color: white;
    font-weight: 900;
    cursor: pointer;
  }

  .status {
    margin: 0;
    color: #9f1239;
    font-weight: 800;
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
