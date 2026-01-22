<script lang="ts">
  interface WaterSource {
    mile: number;
    name: string;
    type?: string;
    offTrail?: number;
    distance: number;
  }

  interface Props {
    source: WaterSource | null;
  }

  let { source }: Props = $props();

  const typeMeta: Record<string, { label: string; icon: string }> = {
    spring: { label: 'Spring', icon: '💧' },
    stream: { label: 'Stream', icon: '🏞️' },
    river: { label: 'River', icon: '🌊' },
    piped: { label: 'Piped', icon: '🚰' },
    town: { label: 'Town', icon: '🏪' },
  };

  function formatMiles(value: number): string {
    const fixed = value.toFixed(1);
    return fixed.endsWith('.0') ? fixed.slice(0, -2) : fixed;
  }
</script>

<a href="/tools/water/" class="widget water-widget">
  <div class="widget-header">
    <span class="widget-icon">💧</span>
    <span class="widget-title">Next Water</span>
  </div>

  {#if source}
    <div class="widget-body">
      <span class="water-name">
        <span class="water-type" aria-hidden="true">{typeMeta[source.type ?? '']?.icon ?? '💧'}</span>
        <span>{source.name}</span>
      </span>
      <span class="water-distance">in {formatMiles(source.distance)} mi</span>
    </div>

    <div class="water-meta">
      <span>Mile {formatMiles(source.mile)}</span>
      {#if (source.offTrail ?? 0) > 0}
        <span>+{formatMiles(source.offTrail ?? 0)} off</span>
      {/if}
      {#if source.type}
        <span>{typeMeta[source.type]?.label ?? source.type}</span>
      {/if}
    </div>
  {:else}
    <div class="widget-body">
      <span class="water-name">No sources ahead</span>
      <span class="water-distance">—</span>
    </div>
    <p class="water-note">Water list coverage is still expanding.</p>
  {/if}

  <span class="widget-link">See water sources →</span>
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

  .water-name {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-family: Oswald, sans-serif;
    font-size: 1.05rem;
    font-weight: 600;
    color: var(--pine, #4a5a44);
    line-height: 1.2;
  }

  .water-type {
    font-size: 1.15rem;
  }

  .water-distance {
    font-size: 0.8rem;
    color: var(--muted, #888);
    background: var(--bg, #f5f5f5);
    padding: 0.15rem 0.45rem;
    border-radius: 4px;
    white-space: nowrap;
  }

  .water-meta {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    font-size: 0.75rem;
    color: var(--muted, #888);
    margin-bottom: 0.5rem;
  }

  .water-note {
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

