<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { buildTodayCards, getTrailPhase } from '@hoggcountry/trail-data';
  import { getProfile, setCurrentMile } from '$lib/manual-db';
  import type { ManualProfile } from '@hoggcountry/manual-core';

  let profile: ManualProfile | null = null;
  let mileDraft = 0;
  let cards = [] as ReturnType<typeof buildTodayCards>;
  let phaseLabel = '';
  let error = '';

  async function refresh() {
    const nextProfile = await getProfile();
    if (!nextProfile) {
      await goto('/setup');
      return;
    }

    profile = nextProfile;
    mileDraft = nextProfile.currentMile;
    cards = buildTodayCards(nextProfile);
    phaseLabel = getTrailPhase(nextProfile.currentMile).label;
  }

  async function handleSaveMile() {
    await setCurrentMile(Number(mileDraft));
    await refresh();
  }

  onMount(() => {
    refresh().catch((caught) => {
      console.error(caught);
      error = 'Could not load today.';
    });
  });
</script>

<section class="hero card">
  <div>
    <p class="eyebrow">Today</p>
    <h1>What matters right now.</h1>
    <p class="lede">This screen is built from your profile, your manual defaults, and audited trail facts. The goal is not more data. It is the next clear decision.</p>
  </div>

  {#if profile}
    <div class="meter">
      <span class="meter-label">Current phase</span>
      <strong>{phaseLabel}</strong>
      <span class="meter-subtle">Mile {profile.currentMile.toFixed(1)} / 2197.4</span>
    </div>
  {/if}
</section>

{#if profile}
  <section class="mile-card card">
    <div>
      <p class="eyebrow">Trail context</p>
      <h2>Update your mile marker.</h2>
    </div>
    <div class="mile-controls">
      <input type="number" min="0" step="0.1" bind:value={mileDraft} />
      <button type="button" onclick={handleSaveMile}>Save mile</button>
    </div>
  </section>

  <section class="grid">
    {#each cards as card}
      <article class={`card tone-${card.tone}`}>
        <p class="card-kicker">{card.title}</p>
        <p class="card-body">{card.detail}</p>
        <p class="citation">{card.citation}</p>
      </article>
    {/each}
  </section>
{:else if error}
  <p class="error">{error}</p>
{/if}

<style>
  .card {
    border: 1px solid rgba(48, 65, 54, 0.12);
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.84);
    box-shadow: 0 18px 44px rgba(0, 0, 0, 0.06);
  }

  .hero,
  .mile-card {
    display: grid;
    gap: 1rem;
    padding: 1.1rem;
    margin-bottom: 1rem;
  }

  .eyebrow {
    margin: 0 0 0.35rem;
    font-size: 0.76rem;
    font-weight: 800;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #b45309;
  }

  h1,
  h2 {
    margin: 0;
    color: #1f2937;
  }

  .lede {
    margin-bottom: 0;
    max-width: 60ch;
    color: #5d675c;
    line-height: 1.7;
  }

  .meter {
    display: grid;
    gap: 0.35rem;
    padding: 1rem;
    border-radius: 18px;
    background: rgba(166, 181, 137, 0.18);
    color: #304136;
  }

  .meter-label,
  .meter-subtle {
    font-size: 0.82rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .mile-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    align-items: center;
  }

  input {
    min-height: 46px;
    min-width: 180px;
    padding: 0.8rem 0.9rem;
    border-radius: 14px;
    border: 1px solid rgba(48, 65, 54, 0.12);
    font: inherit;
  }

  button {
    min-height: 46px;
    padding: 0.8rem 1rem;
    border: none;
    border-radius: 999px;
    background: #304136;
    color: white;
    font: inherit;
    font-weight: 800;
    cursor: pointer;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1rem;
  }

  .grid .card {
    padding: 1rem;
  }

  .card-kicker {
    margin: 0 0 0.5rem;
    font-size: 0.82rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    font-weight: 800;
    color: #304136;
  }

  .card-body {
    margin: 0;
    color: #1f2937;
    line-height: 1.65;
  }

  .citation {
    margin: 0.75rem 0 0;
    color: #5d675c;
    font-size: 0.84rem;
  }

  .tone-action {
    border-color: rgba(180, 83, 9, 0.18);
  }

  .tone-caution {
    border-color: rgba(159, 18, 57, 0.16);
  }

  .error {
    color: #8a2f2f;
    font-weight: 700;
  }

  @media (min-width: 860px) {
    .hero {
      grid-template-columns: minmax(0, 1.3fr) minmax(260px, 0.7fr);
      align-items: end;
    }

    .mile-card {
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
    }
  }
</style>
