<script lang="ts">
  import type { ActionData, PageData } from './$types';

  const { data, form } = $props<{ data: PageData; form: ActionData }>();
</script>

<svelte:head>
  <title>Recover login | Hogg Country</title>
  <meta name="robots" content="noindex,nofollow" />
</svelte:head>

<section class="auth-shell">
  <div class="auth-copy">
    <p class="eyebrow">Account recovery</p>
    <h1>Get back into Scout.</h1>
    <p class="lede">Send a recovery link to set or reset your password. This also works if you started with Google.</p>
  </div>

  <form method="POST" class="auth-panel">
    <label>
      <span>Email</span>
      <input name="email" type="email" autocomplete="email" required value={form?.email ?? data.email ?? ''} />
    </label>

    {#if form?.message}
      <p class="status" data-type={form.sent ? 'success' : 'error'}>{form.message}</p>
    {/if}

    <button class="primary-button" type="submit">Send recovery link</button>

    <div class="auth-links">
      <a href="/login">Back to sign in</a>
      <a href="/signup">Join launch list</a>
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

  .status {
    margin: 0;
    color: #9f1239;
    font-weight: 800;
  }

  .status[data-type='success'] {
    color: var(--status-live);
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
