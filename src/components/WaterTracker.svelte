<script lang="ts">
  import { onMount } from 'svelte';
  import atWaterSources from '../data/at-water-sources.json';

  type WaterSource = { mile: number; name: string; type: string; offTrail: number };

  interface Props {
    trailContext?: { currentMile?: number };
  }

  let { trailContext = {} }: Props = $props();

  let mounted = $state(false);
  const CARRY_KEY = 'at-water-carry-v1';

  // Carry calculator (persisted)
  let waterCapacityL = $state(3); // typical capacity: 2–4L
  let litersPer10Mi = $state(1.2);
  let bufferPct = $state(20);

  const typeMeta: Record<string, { label: string; icon: string }> = {
    spring: { label: 'Spring', icon: '💧' },
    stream: { label: 'Stream', icon: '🏞️' },
    river: { label: 'River', icon: '🌊' },
    piped: { label: 'Piped', icon: '🚰' },
    town: { label: 'Town', icon: '🏪' },
  };

  function asNumber(value: unknown, fallback: number = 0): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function formatMiles(value: unknown): string {
    const n = asNumber(value, 0);
    const fixed = n.toFixed(1);
    return fixed.endsWith('.0') ? fixed.slice(0, -2) : fixed;
  }

  const sourcesSorted: WaterSource[] = (Array.isArray(atWaterSources) ? atWaterSources : [])
    .filter((s) => typeof s?.mile === 'number' && typeof s?.name === 'string' && typeof s?.type === 'string')
    .map((s) => ({
      mile: s.mile,
      name: s.name,
      type: s.type,
      offTrail: typeof s.offTrail === 'number' ? s.offTrail : 0,
    }))
    .sort((a, b) => a.mile - b.mile);

  function loadCarryPrefs() {
    if (typeof localStorage === 'undefined') return;
    const raw = localStorage.getItem(CARRY_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed.waterCapacityL === 'number') waterCapacityL = parsed.waterCapacityL;
      if (typeof parsed.litersPer10Mi === 'number') litersPer10Mi = parsed.litersPer10Mi;
      if (typeof parsed.bufferPct === 'number') bufferPct = parsed.bufferPct;
    } catch {}
  }

  function saveCarryPrefs() {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(
      CARRY_KEY,
      JSON.stringify({ waterCapacityL, litersPer10Mi, bufferPct }),
    );
  }

  onMount(() => {
    loadCarryPrefs();
    mounted = true;
  });

  $effect(() => {
    if (mounted) saveCarryPrefs();
  });

  let currentMile = $derived(asNumber(trailContext.currentMile, 0));

  let upcomingSources = $derived.by(() => sourcesSorted.filter((s) => s.mile > currentMile).slice(0, 12));
  let recentSources = $derived.by(() => sourcesSorted.filter((s) => s.mile <= currentMile).slice(-6).reverse());

  function clampNumber(value: number, min: number, max: number): number {
    if (!Number.isFinite(value)) return min;
    return Math.max(min, Math.min(max, value));
  }

  function calcLiters(distanceMiles: number): number {
    const dist = clampNumber(distanceMiles, 0, 999);
    const rate = clampNumber(litersPer10Mi, 0.1, 5);
    const buffer = clampNumber(bufferPct, 0, 100) / 100;
    const raw = (dist / 10) * rate;
    return raw * (1 + buffer);
  }

  function round1(value: number): number {
    return Math.round(value * 10) / 10;
  }

  let carryPlan = $derived.by(() => {
    const next = upcomingSources[0];
    if (!next) return null;

    const distToNext = next.mile - currentMile;
    const distToSecond = upcomingSources[1]?.mile ? upcomingSources[1].mile - currentMile : null;

    const litersToNext = calcLiters(distToNext);
    const litersToSecond = distToSecond !== null ? calcLiters(distToSecond) : null;

    const safeMilesAtCapacity = waterCapacityL > 0 ? (waterCapacityL / (litersPer10Mi / 10)) / (1 + bufferPct / 100) : 0;

    // Largest gap among the visible upcoming sources (quick heuristic)
    let maxGap = 0;
    let maxGapFrom: typeof next | null = null;
    let maxGapTo: typeof next | null = null;
    for (let i = 0; i < upcomingSources.length - 1; i++) {
      const a = upcomingSources[i];
      const b = upcomingSources[i + 1];
      const gap = b.mile - a.mile;
      if (gap > maxGap) {
        maxGap = gap;
        maxGapFrom = a;
        maxGapTo = b;
      }
    }

    return {
      next,
      distToNext,
      litersToNext,
      distToSecond,
      litersToSecond,
      safeMilesAtCapacity,
      maxGap: maxGapFrom && maxGapTo ? { miles: maxGap, from: maxGapFrom, to: maxGapTo } : null,
    };
  });
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

  <section class="carry-card">
    <div class="carry-head">
      <h3>Carry Plan</h3>
      <p>Quick math for “how much water should I leave with?”</p>
    </div>

    <div class="carry-controls">
      <label class="carry-field">
        <span class="carry-label">Capacity</span>
        <div class="carry-input">
          <input type="range" min="0.5" max="6" step="0.1" bind:value={waterCapacityL} />
          <span class="carry-val">{round1(waterCapacityL)} L</span>
        </div>
      </label>

      <label class="carry-field">
        <span class="carry-label">Use rate</span>
        <div class="carry-input">
          <input type="range" min="0.5" max="3" step="0.1" bind:value={litersPer10Mi} />
          <span class="carry-val">{round1(litersPer10Mi)} L / 10 mi</span>
        </div>
      </label>

      <label class="carry-field">
        <span class="carry-label">Buffer</span>
        <div class="carry-input">
          <input type="range" min="0" max="50" step="5" bind:value={bufferPct} />
          <span class="carry-val">{bufferPct}%</span>
        </div>
      </label>
    </div>

    {#if carryPlan}
      <div class="carry-results">
        <div class="carry-result">
          <div class="carry-k">To next source</div>
          <div class="carry-v">{round1(carryPlan.litersToNext)} L</div>
          <div class="carry-s">+{formatMiles(carryPlan.distToNext)} mi</div>
        </div>

        <div class="carry-result">
          <div class="carry-k">Capacity covers</div>
          <div class="carry-v">{formatMiles(carryPlan.safeMilesAtCapacity)} mi</div>
          <div class="carry-s">at current rate</div>
        </div>

        {#if carryPlan.maxGap}
          <div class="carry-gap">
            Largest gap ahead: <strong>{formatMiles(carryPlan.maxGap.miles)} mi</strong>
            <span class="gap-note">({carryPlan.maxGap.from.name} → {carryPlan.maxGap.to.name})</span>
          </div>
        {/if}

        {#if carryPlan.distToSecond !== null && carryPlan.litersToSecond !== null}
          <div class="carry-skip">
            If you skip the next source: <strong>{round1(carryPlan.litersToSecond)} L</strong>
            <span class="gap-note">(+{formatMiles(carryPlan.distToSecond)} mi)</span>
          </div>
        {/if}
      </div>
    {:else}
      <p class="carry-empty">No upcoming sources in the list.</p>
    {/if}
  </section>

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

  /* Carry plan */
  .carry-card {
    padding: 1rem 1.25rem 1.1rem;
    border-bottom: 1px solid var(--border);
    background: linear-gradient(180deg, rgba(2,132,199,0.06) 0%, rgba(255,255,255,0) 100%);
  }

  .carry-head h3 {
    margin: 0;
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    color: var(--pine, #4a5a44);
  }

  .carry-head p {
    margin: 0.25rem 0 0;
    font-size: 0.85rem;
    color: var(--muted, #6b7280);
  }

  .carry-controls {
    margin-top: 0.85rem;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.75rem;
  }

  .carry-field {
    display: grid;
    gap: 0.35rem;
  }

  .carry-label {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--muted, #6b7280);
  }

  .carry-input {
    display: flex;
    gap: 0.6rem;
    align-items: center;
  }

  .carry-input input[type="range"] {
    flex: 1;
    accent-color: #0284c7;
  }

  .carry-val {
    font-family: Oswald, sans-serif;
    font-weight: 700;
    color: var(--ink, #111);
    white-space: nowrap;
    font-size: 0.9rem;
  }

  .carry-results {
    margin-top: 0.9rem;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
    align-items: start;
  }

  .carry-result {
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 0.75rem 0.85rem;
    background: rgba(255,255,255,0.9);
  }

  .carry-k {
    color: var(--muted, #6b7280);
    font-size: 0.78rem;
    margin-bottom: 0.25rem;
  }

  .carry-v {
    font-family: Oswald, sans-serif;
    font-size: 1.6rem;
    font-weight: 800;
    color: #075985;
    line-height: 1.05;
  }

  .carry-s {
    margin-top: 0.15rem;
    color: var(--muted, #6b7280);
    font-size: 0.8rem;
  }

  .carry-gap,
  .carry-skip {
    grid-column: 1 / -1;
    border: 1px dashed rgba(2,132,199,0.35);
    border-radius: 12px;
    padding: 0.75rem 0.85rem;
    background: rgba(2,132,199,0.06);
    color: #075985;
    font-size: 0.9rem;
  }

  .gap-note {
    color: rgba(7,89,133,0.75);
    margin-left: 0.35rem;
  }

  .carry-empty {
    margin: 0.85rem 0 0;
    color: var(--muted, #6b7280);
    font-size: 0.85rem;
  }

  @media (max-width: 820px) {
    .carry-controls {
      grid-template-columns: 1fr;
    }
    .carry-results {
      grid-template-columns: 1fr;
    }
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
