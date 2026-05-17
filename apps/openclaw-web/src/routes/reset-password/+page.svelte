<script lang="ts">
  import type { ActionData, PageData } from './$types';

  const { data, form } = $props<{ data: PageData; form: ActionData }>();
  const token = $derived(form?.token || data.token || '');
  const email = $derived(form?.email || data.email || '');
</script>

<svelte:head>
  <title>Reset password | Hogg Country</title>
  <meta name="robots" content="noindex,nofollow" />
</svelte:head>

<section class="auth-shell">
  <div class="auth-copy">
    <p class="eyebrow">Account recovery</p>
    <h1>Set a new password.</h1>
    <p class="lede">Use this password with your Scout account. Google login will still work when it uses the same verified email.</p>
  </div>

  <form method="POST" class="auth-panel">
    <input type="hidden" name="token" value={token} />

    <label>
      <span>Email</span>
      <input name="email" type="email" autocomplete="email" required value={email} />
    </label>

    <label>
      <span>New password</span>
      <input name="password" type="password" autocomplete="new-password" minlength="8" required />
    </label>

    <label>
      <span>Confirm new password</span>
      <input name="passwordConfirmation" type="password" autocomplete="new-password" minlength="8" required />
    </label>

    {#if form?.message}
      <p class="status">{form.message}</p>
    {/if}

    <button class="primary-button" type="submit" disabled={!token}>Save password</button>

    <div class="auth-links">
      <a href="/forgot-password">Request new link</a>
      <a href="/login">Back to sign in</a>
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
    min-height: 2.95rem;
    border: 0;
    border-radius: 8px;
    background: var(--pine);
    color: white;
    font-weight: 900;
    cursor: pointer;
  }

  .primary-button:disabled {
    cursor: not-allowed;
    opacity: 0.55;
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
