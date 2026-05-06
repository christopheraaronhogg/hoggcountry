<script lang="ts">
  import PublicMap from '$components/PublicMap.svelte';
  import type { PageData } from './$types';

  const { data } = $props<{ data: PageData }>();
</script>

<section class="page-intro">
  <p class="eyebrow">Dad map</p>
  <h1>Track the current Garmin feed on a real map.</h1>
  <p class="lede">
    Dad’s Garmin fix now snaps to the nearest Appalachian Trail mile marker so the map can say where he is in trail
    terms, not just raw coordinates.
  </p>
</section>

{#if data.latestTrailLocation}
  <article class="card panel-copy trail-mile-card">
    <p class="eyebrow">Snapped trail location</p>
    <h2>{data.latestTrailLocation.label}</h2>
    <p class="meta-line">
      Garmin fix is {data.latestTrailLocation.distanceToTrailMiles.toFixed(1)} miles from this AT milepost.
      Snapped point: {data.latestTrailLocation.trailLatitude.toFixed(3)}, {data.latestTrailLocation.trailLongitude.toFixed(3)}.
    </p>
  </article>
{/if}

<PublicMap featureCollection={data.track} title="Dad location" />

<style>
  .trail-mile-card {
    margin: 1rem 0;
  }

  .trail-mile-card h2 {
    margin: 0;
    font-size: clamp(2rem, 6vw, 3.4rem);
    line-height: 0.95;
  }
</style>
