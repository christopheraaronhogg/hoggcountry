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
    content="Local-first trail command center: live mile, current mode, sync and tracker signal, Scout tools, and the map — one tap apart."
  />
</svelte:head>

<header class="trail-page-hero">
  <p class="kicker">Trail Hub · Local-first command center</p>
  <h1 class="font-display">Your Appalachian Trail HQ.</h1>
  <p class="lede">
    Live mile, mode, sync, and tracker signal at a glance — with Scout tools, the map, and your
    character one tap away. Everything keeps working offline; live data lights up the moment your
    Garmin tracker is connected. Field-verify before you bet on it.
  </p>
</header>

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
  .trail-page-hero {
    display: grid;
    gap: 0.55rem;
    justify-items: start;
    width: min(960px, 100%);
    margin: 0 auto;
    padding: 1.4rem 1rem 1.1rem;
  }

  .trail-page-hero .kicker {
    margin: 0;
    color: var(--terra);
    font-family: Oswald, Impact, sans-serif;
    font-weight: 800;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    font-size: 0.74rem;
  }

  .trail-page-hero h1 {
    margin: 0;
    font-family: Oswald, Impact, sans-serif;
    font-size: clamp(2rem, 6vw, 3rem);
    line-height: 1.02;
    color: var(--ink, #1f2937);
  }

  .trail-page-hero .lede {
    margin: 0;
    max-width: 60ch;
    color: var(--muted, #4a5448);
    line-height: 1.6;
    font-size: 0.98rem;
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
    .trail-page-hero {
      padding: 1rem 0.9rem 0.9rem;
    }

    .trail-page-hero .lede {
      font-size: 0.94rem;
    }
  }
</style>
