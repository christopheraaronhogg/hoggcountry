<script lang="ts">
  import { onMount } from 'svelte';

  let CharacterPage = $state<any>(null);
  let loadError = $state<string | null>(null);

  onMount(async () => {
    try {
      const module = await import('../../../../../src/components/CharacterPage.svelte');
      CharacterPage = module.default;
    } catch (error) {
      loadError = error instanceof Error ? error.message : String(error);
      console.error('Failed to load profile page', error);
    }
  });
</script>

<svelte:head>
  <title>My Profile — Hogg Country</title>
  <meta
    name="description"
    content="My Profile: trail-ready stats, progression, and your full hiker setup."
  />
</svelte:head>

<section class="hero">
  <span class="chapter font-chapter">AT 2026</span>
  <h1 class="font-display">My Profile</h1>
  <p>Your sheet, your progression, your kit.</p>
</section>

<div class="character-container">
  {#if CharacterPage}
    <CharacterPage />
  {:else if loadError}
    <p class="load-state">Your profile failed to load. Refresh to try again.</p>
  {:else}
    <p class="load-state">Loading your profile…</p>
  {/if}
</div>

<style>
  .character-container {
    padding: 0 0 4rem;
    max-width: 100%;
    box-sizing: border-box;
    overflow-x: clip;
  }

  .load-state {
    padding: 2rem 0;
    color: var(--muted);
  }
</style>
