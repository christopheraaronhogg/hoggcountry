<script lang="ts">
  import type { TownInfo } from '../../../lib/trailRecommendations';

  interface Props {
    town: TownInfo | null;
  }

  let { town }: Props = $props();

  // Service icons
  const serviceIcons: Record<string, string> = {
    grocery: '🛒',
    hostel: '🛏️',
    outfitter: '🎒',
    restaurant: '🍽️',
    laundry: '👕',
    post_office: '📬',
  };
</script>

<a href="/tools/resupply/" class="widget town-widget">
  <div class="widget-header">
    <span class="widget-icon">🏘️</span>
    <span class="widget-title">Next Town</span>
  </div>

  {#if town}
    <div class="widget-body">
      <span class="town-name">{town.name}</span>
      <span class="town-distance">{town.distance} mi</span>
    </div>

    <div class="services">
      {#each town.services as service}
        <span class="service-badge" title={service}>
          {serviceIcons[service] || '•'}
        </span>
      {/each}
    </div>

    {#if town.note}
      <p class="town-note">{town.note}</p>
    {/if}
  {:else}
    <div class="widget-body">
      <span class="town-name">Katahdin!</span>
      <span class="town-distance">You made it!</span>
    </div>
  {/if}

  <span class="widget-link">See all towns →</span>
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
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-bottom: 0.5rem;
  }

  .town-name {
    font-family: Oswald, sans-serif;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--pine, #4a5a44);
  }

  .town-distance {
    font-size: 0.8rem;
    color: var(--muted, #888);
    background: var(--bg, #f5f5f5);
    padding: 0.15rem 0.4rem;
    border-radius: 4px;
  }

  .services {
    display: flex;
    gap: 0.35rem;
    margin-bottom: 0.5rem;
  }

  .service-badge {
    font-size: 0.9rem;
    padding: 0.2rem 0.4rem;
    background: var(--bg, #f5f5f5);
    border-radius: 4px;
  }

  .town-note {
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
