<script lang="ts">
  import WaitlistSignup from '$lib/components/WaitlistSignup.svelte';
  import type { ActionData, PageData } from './$types';

  const { data, form } = $props<{ data: PageData; form: ActionData }>();
  const redirectTo = $derived(form?.redirectTo || data.redirectTo || '/app');
</script>

<svelte:head>
  <title>Scout launch list | Hogg Country</title>
  <meta name="robots" content="noindex,nofollow" />
</svelte:head>

<section class="auth-shell">
  <div class="auth-copy">
    <p class="eyebrow">Private web beta</p>
    <h1>Scout accounts are invite-only right now.</h1>
    <p class="lede">
      The hosted beta is using real AI usage, so new accounts are closed while Dad tests the trail workspace.
      Join the launch list and we will let you know when the app opens.
    </p>
  </div>

  <div class="auth-panel">
    {#if form?.message}
      <p class="status" data-type="error">{form.message}</p>
    {/if}

    <WaitlistSignup source="closed-signup" />

    <div class="auth-links">
      <a href={`/login?redirect=${encodeURIComponent(redirectTo)}`}>Already have a login?</a>
      <a href="/forgot-password">Recover login</a>
    </div>
  </div>
</section>

<style>
  .auth-shell {
    display: grid;
    gap: 1.2rem;
    max-width: 900px;
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
    max-width: 38rem;
    margin: 0 auto;
    color: var(--muted);
  }

  .auth-panel {
    display: grid;
    gap: 1rem;
    max-width: 460px;
    width: 100%;
    margin: 0 auto;
    padding: 1rem;
    border: 1px solid rgba(77, 89, 74, 0.16);
    border-radius: 8px;
    background: #fffdf8;
    box-shadow: 0 16px 34px rgba(31, 41, 55, 0.08);
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
      grid-template-columns: minmax(0, 1fr) 460px;
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
