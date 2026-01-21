<script lang="ts">
  import { getAlerts, getCurrentState } from '../../../lib/trailRecommendations';
  import { trailContext } from '../../../stores/trailContext.svelte';

  let alerts = $derived(getAlerts(trailContext.currentMile));
  let state = $derived(getCurrentState(trailContext.currentMile));
</script>

<section class="card widget" aria-label="Trail alerts">
  <header class="head">
    <h2 class="font-display">Trail alerts</h2>
    {#if state}
      <span class="badge"><strong>State</strong> {state.name}</span>
    {/if}
  </header>

  {#if alerts.length === 0}
    <p class="muted">No alerts for this mile marker.</p>
  {:else}
    <ul class="list">
      {#each alerts as alert}
        <li class="item {alert.kind}">
          <div class="title">{alert.title}</div>
          <div class="msg">{alert.message}</div>
        </li>
      {/each}
    </ul>
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

  .muted {
    color: var(--muted);
    margin: 0;
  }

  .list {
    list-style: none;
    padding: 0;
    margin: 0.25rem 0 0;
    display: grid;
    gap: 0.6rem;
  }

  .item {
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 0.65rem 0.75rem;
    background: rgba(255, 255, 255, 0.65);
  }

  .item.warning {
    border-color: rgba(217, 119, 6, 0.35);
    background: rgba(217, 119, 6, 0.08);
  }

  .title {
    font-weight: 800;
    color: var(--pine);
  }

  .msg {
    color: var(--muted);
    font-size: 0.95rem;
    margin-top: 0.15rem;
  }
</style>

