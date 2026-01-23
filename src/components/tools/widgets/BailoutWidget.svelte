<script lang="ts">
  import type { RoadCrossingInfo } from '../../../lib/trailRecommendations';

  interface Props {
    crossing: RoadCrossingInfo | null;
  }

  let { crossing }: Props = $props();

  function formatMiles(value: number): string {
    const fixed = value.toFixed(1);
    return fixed.endsWith('.0') ? fixed.slice(0, -2) : fixed;
  }
</script>

<a href="/tools/emergency/" class="widget bailout-widget">
  <div class="widget-header">
    <span class="widget-icon">🚗</span>
    <span class="widget-title">Next Exit</span>
  </div>

  {#if crossing}
    <div class="widget-body">
      <span class="exit-name">{crossing.name}</span>
      <span class="exit-distance">in {formatMiles(crossing.distance)} mi</span>
    </div>

    <div class="exit-meta">
      <span class="exit-road">{crossing.road}</span>
      <span class="exit-dot">•</span>
      <span class="exit-town">{crossing.nearestTown}</span>
    </div>

    {#if crossing.hospital}
      <p class="exit-note">Hospital: {crossing.hospital}</p>
    {/if}
  {:else}
    <div class="widget-body">
      <span class="exit-name">No exits ahead</span>
      <span class="exit-distance">—</span>
    </div>
  {/if}

  <span class="widget-link">Emergency card →</span>
</a>

<style>
  .widget {
    display: flex;
    flex-direction: column;
    padding: 1rem;
    background: #fff;
    border: 1px solid var(--border, #e5e5e5);
    border-radius: 12px;
    text-decoration: none;
    color: inherit;
    transition: all 0.2s ease;
  }

  .widget:hover {
    border-color: var(--alpine, #7b9e6b);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  .widget-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .widget-icon {
    font-size: 1.25rem;
  }

  .widget-title {
    font-family: Oswald, sans-serif;
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--muted, #888);
  }

  .widget-body {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.75rem;
    flex-wrap: wrap;
    margin-bottom: 0.5rem;
  }

  .exit-name {
    font-family: Oswald, sans-serif;
    font-size: 1.05rem;
    font-weight: 600;
    color: var(--pine, #4a5a44);
    line-height: 1.2;
  }

  .exit-distance {
    font-size: 0.8rem;
    color: var(--muted, #888);
    background: var(--bg, #f5f5f5);
    padding: 0.15rem 0.45rem;
    border-radius: 4px;
    white-space: nowrap;
  }

  .exit-meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    font-size: 0.75rem;
    color: var(--muted, #888);
    margin-bottom: 0.35rem;
  }

  .exit-dot {
    color: rgba(0, 0, 0, 0.25);
  }

  .exit-note {
    font-size: 0.75rem;
    font-style: italic;
    color: var(--alpine, #7b9e6b);
    margin: 0 0 0.5rem;
  }

  .widget-link {
    margin-top: auto;
    font-size: 0.75rem;
    color: var(--alpine, #7b9e6b);
    font-weight: 500;
  }
</style>

