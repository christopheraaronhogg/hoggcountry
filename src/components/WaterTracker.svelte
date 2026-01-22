<script>
  import { onMount } from 'svelte';
  import atWaterSources from '../data/at-water-sources.json';

  let { trailContext = {} } = $props();

  let mounted = $state(false);

  const typeMeta = {
    spring: { label: 'Spring', icon: '💧' },
    stream: { label: 'Stream', icon: '🏞️' },
    river: { label: 'River', icon: '🌊' },
    piped: { label: 'Piped', icon: '🚰' },
    town: { label: 'Town', icon: '🏪' },
  };

  function asNumber(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function formatMiles(value) {
    const n = asNumber(value, 0);
    const fixed = n.toFixed(1);
    return fixed.endsWith('.0') ? fixed.slice(0, -2) : fixed;
  }

  const sourcesSorted = (Array.isArray(atWaterSources) ? atWaterSources : [])
    .filter((s) => typeof s?.mile === 'number' && typeof s?.name === 'string' && typeof s?.type === 'string')
    .map((s) => ({
      mile: s.mile,
      name: s.name,
      type: s.type,
      offTrail: typeof s.offTrail === 'number' ? s.offTrail : 0,
    }))
    .sort((a, b) => a.mile - b.mile);

  onMount(() => {
    mounted = true;
  });

  let currentMile = $derived(asNumber(trailContext.currentMile, 0));

  let upcomingSources = $derived.by(() => sourcesSorted.filter((s) => s.mile > currentMile).slice(0, 12));
  let recentSources = $derived.by(() => sourcesSorted.filter((s) => s.mile <= currentMile).slice(-6).reverse());
</script>

<div class="water-tool" class:mounted>
  <header class="water-header">
    <div class="water-header-top">
      <div>
        <h2>Water Sources</h2>
        <p>AWOL mileages — list is still being expanded.</p>
      </div>
      <div class="water-chips">
        <span class="badge"><strong>Now</strong> Mile {formatMiles(currentMile)}</span>
        <span class="badge"><strong>Sources</strong> {sourcesSorted.length}</span>
        {#if upcomingSources[0]}
          {@const next = upcomingSources[0]}
          <span class="badge"><strong>Next</strong> {formatMiles(next.mile)} (+{formatMiles(next.mile - currentMile)} mi)</span>
        {/if}
      </div>
    </div>
  </header>

  <div class="water-columns">
    <section class="water-section">
      <h3>Upcoming</h3>
      {#if upcomingSources.length === 0}
        <p class="water-empty">No upcoming sources in the list.</p>
      {:else}
        <ul class="water-list">
          {#each upcomingSources as source (source.mile + source.name)}
            {@const dist = source.mile - currentMile}
            <li class="water-item">
              <div class="water-main">
                <div class="water-name">
                  <span class="water-icon" aria-hidden="true">{typeMeta[source.type]?.icon ?? '💧'}</span>
                  <span>{source.name}</span>
                </div>
                <div class="water-meta">
                  <span>Mile {formatMiles(source.mile)}</span>
                  {#if source.offTrail > 0}
                    <span>+{formatMiles(source.offTrail)} off</span>
                  {/if}
                  <span>{typeMeta[source.type]?.label ?? source.type}</span>
                </div>
              </div>
              <div class="water-dist">+{formatMiles(dist)} mi</div>
            </li>
          {/each}
        </ul>
      {/if}
    </section>

    <section class="water-section">
      <h3>Recent</h3>
      {#if recentSources.length === 0}
        <p class="water-empty">No recent sources yet.</p>
      {:else}
        <ul class="water-list">
          {#each recentSources as source (source.mile + source.name)}
            {@const dist = currentMile - source.mile}
            <li class="water-item">
              <div class="water-main">
                <div class="water-name">
                  <span class="water-icon" aria-hidden="true">{typeMeta[source.type]?.icon ?? '💧'}</span>
                  <span>{source.name}</span>
                </div>
                <div class="water-meta">
                  <span>Mile {formatMiles(source.mile)}</span>
                  {#if source.offTrail > 0}
                    <span>+{formatMiles(source.offTrail)} off</span>
                  {/if}
                  <span>{typeMeta[source.type]?.label ?? source.type}</span>
                </div>
              </div>
              <div class="water-dist">−{formatMiles(dist)} mi</div>
            </li>
          {/each}
        </ul>
      {/if}
    </section>
  </div>

  <!-- Guide Links -->
  <div class="water-footer">
    <div class="guide-links">
      <a href="/guide/09-water-treatment-system" class="guide-link chapter-link">
        <span class="link-icon">📚</span>
        <span class="link-text">Full Water Treatment Guide</span>
        <span class="link-arrow">→</span>
      </a>
      <a href="/guide#09-water-treatment-system" class="guide-link field-guide-link">
        <span class="link-icon">📖</span>
        <span class="link-text">Field Guide</span>
        <span class="link-arrow">→</span>
      </a>
    </div>
  </div>
</div>

<style>
  .water-tool {
    background: #fff;
    border: 2px solid var(--border);
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    opacity: 0;
    transform: translateY(10px);
    transition: all 0.35s ease;
  }

  .water-tool.mounted {
    opacity: 1;
    transform: translateY(0);
  }

  .water-header {
    background: linear-gradient(135deg, #0284c7 0%, #0369a1 55%, #075985 100%);
    padding: 1.25rem 1.25rem 1rem;
    color: #fff;
  }

  .water-header-top {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 0.75rem 1rem;
  }

  .water-header h2 {
    margin: 0;
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: #fff;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }

  .water-header p {
    margin: 0.25rem 0 0;
    font-size: 0.9rem;
    color: rgba(255,255,255,0.85);
  }

  .water-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
    justify-content: flex-end;
  }

  .water-chips :global(.badge) {
    background: rgba(255,255,255,0.92);
    border-color: rgba(255,255,255,0.65);
  }

  .water-columns {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.25rem;
    padding: 1.25rem;
    background: var(--bg);
  }

  .water-footer {
    padding: 0 1.25rem 1.25rem;
    background: var(--bg);
  }

  .guide-links {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .guide-link {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.25rem;
    background: #fff;
    border: 2px solid var(--border);
    border-radius: 14px;
    text-decoration: none;
    transition: all 0.2s ease;
    flex: 1;
    min-width: 200px;
  }

  .guide-link:hover {
    border-color: var(--alpine);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
  }

  .field-guide-link {
    flex: 0 0 auto;
    min-width: 140px;
  }

  .link-icon { font-size: 1.25rem; }

  .link-text {
    flex: 1;
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--ink);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .link-arrow {
    font-size: 1.25rem;
    color: var(--alpine);
    transition: transform 0.2s ease;
  }

  .guide-link:hover .link-arrow { transform: translateX(4px); }

  .water-section h3 {
    margin: 0 0 0.75rem;
    font-family: Oswald, sans-serif;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: var(--ink);
  }

  .water-empty {
    margin: 0;
    color: var(--muted);
    font-size: 0.95rem;
  }

  .water-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .water-item {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 1rem;
    border: 1px solid var(--border);
    border-radius: 14px;
    background: #fff;
  }

  .water-main {
    flex: 1;
    min-width: 0;
  }

  .water-name {
    display: flex;
    gap: 0.5rem;
    align-items: baseline;
    font-weight: 700;
    color: var(--ink);
  }

  .water-icon {
    width: 1.25rem;
    display: inline-flex;
    justify-content: center;
    flex-shrink: 0;
  }

  .water-meta {
    margin-top: 0.25rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    font-size: 0.85rem;
    color: var(--muted);
  }

  .water-meta span + span::before {
    content: '•';
    margin-right: 0.5rem;
    color: var(--border);
  }

  .water-dist {
    font-family: Oswald, sans-serif;
    font-weight: 700;
    color: #0284c7;
    white-space: nowrap;
    font-size: 1.05rem;
    padding-top: 0.05rem;
  }

  @media (min-width: 900px) {
    .water-columns {
      grid-template-columns: 1fr 1fr;
      align-items: start;
    }
  }
</style>
