<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { buildTodayCards, getTrailPhase } from '@hoggcountry/trail-data';
  import { getProfile, setCurrentMile } from '$lib/manual-db';
  import type { ManualProfile } from '@hoggcountry/manual-core';

  let profile = $state<ManualProfile | null>(null);
  let mileDraft = $state(0);
  let cards = $state<ReturnType<typeof buildTodayCards>>([]);
  let phaseLabel = $state('');
  let error = $state('');

  async function refresh() {
    const nextProfile = await getProfile();
    if (!nextProfile) {
      await goto('/app/setup');
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

<section class="card hero-panel">
  <div>
    <p class="eyebrow">Today</p>
    <h1>What matters right now.</h1>
    <p class="lede">
      This screen is built from your profile, your manual defaults, and audited trail facts. It is not more data. It
      is the next clear trail decision.
    </p>
  </div>

  {#if profile}
    <article class="card card-soft panel-copy">
      <p class="eyebrow">Current phase</p>
      <strong style="font-family: Oswald, sans-serif; font-size: 1.8rem; color: var(--pine);">{phaseLabel}</strong>
      <p class="meta-line">Mile {profile.currentMile.toFixed(1)} / 2197.4</p>
    </article>
  {/if}
</section>

{#if profile}
  <section class="card panel-copy" style="margin-top:1rem;">
    <div class="grid-two" style="align-items:end;">
      <div>
        <p class="eyebrow">Trail context</p>
        <h2>Update your mile marker.</h2>
      </div>
      <div class="subtle-actions">
        <input type="number" min="0" step="0.1" bind:value={mileDraft} />
        <button class="btn btn-secondary" type="button" onclick={handleSaveMile}>Save mile</button>
      </div>
    </div>
  </section>

  <section class="grid-three" style="margin-top:1rem;">
    {#each cards as card}
      <article class="card panel-copy">
        <p class="eyebrow">{card.title}</p>
        <p style="margin:0; color:var(--ink); line-height:1.7;">{card.detail}</p>
        <p class="meta-line" style="margin-bottom:0;">{card.citation}</p>
      </article>
    {/each}
  </section>
{:else if error}
  <p style="color:#8a2f2f; font-weight:700;">{error}</p>
{/if}
