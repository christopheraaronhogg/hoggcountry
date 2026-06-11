<script lang="ts">
  import { onMount } from 'svelte';

  let TrailShell = $state<any>(null);
  let loadError = $state<string | null>(null);

  onMount(async () => {
    try {
      const module = await import('../../../../../src/components/trail/TrailShell.svelte');
      TrailShell = module.default;
    } catch (error) {
      loadError = error instanceof Error ? error.message : String(error);
      console.error('Failed to load Trail Hub shell', error);
    }
  });
</script>

<svelte:head>
  <title>Trail Hub — Hogg Country</title>
  <meta
    name="description"
    content="Character-first trail command center with full-screen map and contextual tool overlays."
  />
</svelte:head>

<section class="hero trail-hero">
  <span class="chapter font-chapter">Trail HQ</span>
  <h1 class="font-display">Character + Map</h1>
  <p>One local-first mobile shell for planning, live trail decisions, and social map visibility.</p>
</section>

<div class="trail-shell-wrap">
  {#if TrailShell}
    <TrailShell />
  {:else if loadError}
    <p class="load-state">The Trail Hub failed to load. Refresh to try again.</p>
  {:else}
    <p class="load-state">Loading the Trail Hub…</p>
  {/if}
</div>

<style>
  .trail-hero {
    padding-bottom: 1.1rem;
  }

  .trail-shell-wrap {
    padding-bottom: 4rem;
    max-width: 100%;
  }

  .load-state {
    padding: 2rem 0;
    color: var(--muted);
  }

  @media (max-width: 640px) {
    .trail-hero {
      padding-top: 1.35rem;
    }
  }
</style>
