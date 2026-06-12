<script lang="ts">
  interface Props {
    source?: string;
    compact?: boolean;
  }

  const { source = 'site', compact = false }: Props = $props();

  let email = $state('');
  let website = $state(''); // honeypot
  let busy = $state(false);
  let done = $state(false);
  let alreadyListed = $state(false);
  let error = $state('');

  async function submit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    if (busy || done) return;

    busy = true;
    error = '';

    try {
      const response = await fetch('/waitlist', {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ email, source, website })
      });
      const payload = (await response.json().catch(() => null)) as { status?: string; message?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.message || 'Could not join the waitlist. Try again.');
      }
      done = true;
      alreadyListed = payload?.status === 'already-listed';
    } catch (caught) {
      error = caught instanceof Error ? caught.message : 'Could not join the waitlist. Try again.';
    } finally {
      busy = false;
    }
  }
</script>

<div class="waitlist" class:compact>
  {#if done}
    <p class="waitlist-done" role="status">
      {alreadyListed ? "You're already on the list — we'll holler when the app drops." : "You're on the list. We'll let you know the day the app drops."}
    </p>
  {:else}
    {#if !compact}
      <p class="waitlist-kicker">The Scout app is coming</p>
      <p class="waitlist-copy">Your own guide, your own miles, your own loadout — working offline on trail. Get notified the day it drops.</p>
    {/if}
    <form class="waitlist-form" onsubmit={submit}>
      <label class="waitlist-honeypot" aria-hidden="true">
        Leave this empty
        <input type="text" bind:value={website} tabindex="-1" autocomplete="off" />
      </label>
      <input
        type="email"
        bind:value={email}
        required
        placeholder="you@trailmail.com"
        autocomplete="email"
        aria-label="Email address for app launch updates"
      />
      <button class="waitlist-button" type="submit" disabled={busy}>
        {busy ? 'Adding...' : 'Notify me'}
      </button>
    </form>
    {#if error}
      <p class="waitlist-error" role="alert">{error}</p>
    {/if}
  {/if}
</div>

<style>
  .waitlist {
    display: grid;
    gap: 0.55rem;
    width: 100%;
    max-width: 30rem;
  }

  .waitlist-kicker {
    margin: 0;
    color: var(--terra, #d97706);
    font-size: 0.76rem;
    font-weight: 800;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  .waitlist-copy {
    margin: 0;
    color: var(--muted, #5c665a);
    line-height: 1.5;
  }

  .waitlist-form {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .waitlist-form input[type='email'] {
    flex: 1 1 14rem;
    min-height: 2.9rem;
    border: 1px solid rgba(77, 89, 74, 0.22);
    border-radius: 999px;
    padding: 0 1rem;
    background: white;
    color: var(--ink, #1f2937);
    font: inherit;
  }

  .waitlist-button {
    min-height: 2.9rem;
    border: 0;
    border-radius: 999px;
    padding: 0 1.2rem;
    background: var(--pine, #4d594a);
    color: white;
    font-weight: 900;
    cursor: pointer;
  }

  .waitlist-button:disabled {
    opacity: 0.6;
    cursor: default;
  }

  .waitlist-honeypot {
    position: absolute;
    left: -9999px;
    width: 1px;
    height: 1px;
    overflow: hidden;
  }

  .waitlist-done {
    margin: 0;
    color: var(--pine, #4d594a);
    font-weight: 800;
  }

  .waitlist-error {
    margin: 0;
    color: #8a2f2f;
    font-weight: 700;
  }

  .compact .waitlist-form input[type='email'] {
    flex-basis: 11rem;
    min-height: 2.6rem;
  }

  .compact .waitlist-button {
    min-height: 2.6rem;
  }
</style>
