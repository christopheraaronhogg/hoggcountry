<script lang="ts">
  import { RESUPPLY_STOPS } from '../data/resupplyStops';

  let { trailContext = {} as any } = $props<{ trailContext?: any }>();

  let currentMile = $derived(Number(trailContext?.currentMile ?? 0));
  let nextStops = $derived(
    RESUPPLY_STOPS
      .filter((s) => s.mile >= currentMile)
      .slice(0, 8)
      .map((s) => ({ ...s, milesAway: Math.max(0, Math.round((s.mile - currentMile) * 10) / 10) })),
  );
</script>

<section class="card" style="padding: 1rem;">
  <h2 class="font-display" style="margin: 0 0 0.35rem;">Resupply</h2>
  <p style="margin: 0; color: var(--muted);">
    The old resupply planner has been folded into <a href="/tools/milestone/">Journey</a>. This page is the quick directory view.
    For mail drops, use <a href="/tools/mail/">Mail Drop Planner</a>.
  </p>
</section>

<section class="card" style="padding: 1rem; margin-top: 1rem;">
  <div class="entry-head" style="margin-bottom: 0.5rem;">
    <h3 style="margin: 0;">Next stops</h3>
    <div class="entry-meta">
      <span class="badge"><strong>Mile</strong> {currentMile}</span>
    </div>
  </div>

  {#if nextStops.length === 0}
    <p style="margin: 0; color: var(--muted);">No upcoming stops found.</p>
  {:else}
    <div class="stop-list">
      {#each nextStops as stop}
        <div class="stop">
          <div class="stop-main">
            <div class="stop-name">{stop.name}</div>
            <div class="stop-meta">
              <span class="badge"><strong>At</strong> {stop.mile}</span>
              <span class="badge"><strong>Away</strong> {stop.milesAway} mi</span>
              <span class="badge"><strong>Type</strong> {stop.type}</span>
              {#if stop.mailDrop}
                <span class="badge"><strong>Mail</strong> yes</span>
              {/if}
            </div>
            {#if stop.services?.length}
              <div class="stop-services">Services: {stop.services.join(', ')}</div>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</section>

<style>
  .stop-list {
    display: grid;
    gap: 0.75rem;
  }

  .stop {
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 0.8rem 0.85rem;
    background: rgba(255, 255, 255, 0.6);
  }

  .stop-name {
    font-weight: 800;
    color: var(--ink);
    margin-bottom: 0.35rem;
  }

  .stop-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem 0.5rem;
    margin-bottom: 0.35rem;
  }

  .stop-services {
    color: var(--muted);
    font-size: 0.92rem;
  }
</style>

