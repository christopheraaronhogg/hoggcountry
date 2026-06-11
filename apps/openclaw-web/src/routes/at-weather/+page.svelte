<script lang="ts">
  import { onMount } from 'svelte';

  // AtWeather was a client:only island in Astro (touches window/leaflet),
  // so it must only load in the browser.
  let AtWeather = $state<any>(null);
  let loadError = $state<string | null>(null);

  onMount(async () => {
    try {
      const module = await import('../../../../../src/components/AtWeather.svelte');
      AtWeather = module.default;
    } catch (error) {
      loadError = error instanceof Error ? error.message : String(error);
      console.error('Failed to load AT weather map', error);
    }
  });
</script>

<svelte:head>
  <title>Appalachian Trail Weather | Hogg Country</title>
  <meta
    name="description"
    content="Drag the mile marker to get the forecast along the Appalachian Trail."
  />
</svelte:head>

<section class="content">
  <h1>Appalachian Trail Weather</h1>
  <p class="lede">
    Drag the mile marker to get a forecast near that point on the A.T. (Open-Meteo).
  </p>

  {#if AtWeather}
    <AtWeather />
  {:else if loadError}
    <p class="load-state">The weather map failed to load. Refresh to try again.</p>
  {:else}
    <p class="load-state">Loading the trail weather map…</p>
  {/if}

  <p class="fineprint">
    Forecast data: <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a>.
    Map data: <a href="https://www.openstreetmap.org/relation/156553" target="_blank" rel="noreferrer">OSM relation 156553</a>.
  </p>
</section>

<style>
  .content {
    max-width: 1100px;
    margin: 0 auto;
    padding: 24px 0 56px;
  }

  .lede {
    margin-top: 0.25rem;
    color: var(--muted);
  }

  .load-state {
    padding: 2rem 0;
    color: var(--muted);
  }

  .fineprint {
    margin-top: 14px;
    font-size: 0.9rem;
    opacity: 0.8;
  }
</style>
