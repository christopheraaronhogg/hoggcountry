<script lang="ts">
  import { getNextTown } from '../../../lib/trailRecommendations';
  import { trailContext } from '../../../stores/trailContext.svelte';

  let nextTown = $derived(getNextTown(trailContext.currentMile));
</script>

<section class="card widget" aria-label="Next town">
  <header class="head">
    <h2 class="font-display">Next town</h2>
    <span class="badge"><strong>Mile</strong> {trailContext.currentMile}</span>
  </header>

  {#if !nextTown}
    <p class="muted">No town data available.</p>
  {:else}
    <div class="town">
      <div class="name">{nextTown.name}</div>
      <div class="meta">
        <span class="badge"><strong>At</strong> {nextTown.mile}</span>
        <span class="badge"><strong>Away</strong> {nextTown.milesAway} mi</span>
      </div>
      {#if nextTown.services?.length}
        <div class="muted">Services: {nextTown.services.join(', ')}</div>
      {/if}
    </div>
  {/if}
</section>

<style>
  .widget {
    padding: 1rem;
  }

  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    flex-wrap: wrap;
    margin-bottom: 0.6rem;
  }

  h2 {
    margin: 0;
    font-size: 1.25rem;
  }

  .town .name {
    font-weight: 900;
    color: var(--ink);
    margin-bottom: 0.4rem;
  }

  .meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem 0.5rem;
    margin-bottom: 0.35rem;
  }

  .muted {
    color: var(--muted);
  }
</style>

