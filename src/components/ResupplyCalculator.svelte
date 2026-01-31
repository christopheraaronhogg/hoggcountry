<script lang="ts">
  import { RESUPPLY_STOPS, type ResupplyStop } from '../data/resupplyStops';
  import { RESUPPLY_SERVICE_META } from '../lib/resupplyTowns';
  import { loadCharacter, character, updateCharacter } from '../stores/character.svelte';

  interface Props {
    trailContext?: { currentMile?: number; targetPace?: number; pace?: number };
  }

  let { trailContext = {} }: Props = $props();

  type ResupplyServiceKey = keyof typeof RESUPPLY_SERVICE_META;
  type StopWithDistance = ResupplyStop & { milesAway: number };

  loadCharacter();

  // Controls (persisted on Character)
  let carryDays = $state(character.logistics.resupply.carryDays ?? 4);
  let mailDropOnly = $state(!!character.logistics.resupply.mailDropOnly);
  let requireGrocery = $state(!!character.logistics.resupply.requireGrocery);
  let requireOutfitter = $state(!!character.logistics.resupply.requireOutfitter);
  let search = $state('');

  // Persist into unified Character model
  $effect(() => {
    updateCharacter({
      logistics: {
        resupply: { carryDays, mailDropOnly, requireGrocery, requireOutfitter },
      },
    });
  });

  function asNumber(value: unknown, fallback: number): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function formatMiles(value: number): string {
    const fixed = value.toFixed(1);
    return fixed.endsWith('.0') ? fixed.slice(0, -2) : fixed;
  }

  function formatMoney(value: unknown): string {
    const n = asNumber(value, NaN);
    if (!Number.isFinite(n)) return '—';
    return `$${n.toFixed(0)}`;
  }


  const stopsSorted = [...RESUPPLY_STOPS].sort((a, b) => a.mile - b.mile);

  let currentMile = $derived(asNumber(trailContext?.currentMile, 0));
  let pace = $derived(asNumber(trailContext?.targetPace ?? trailContext?.pace, 15));

  let windowMiles = $derived(Math.max(1, Math.round((pace * carryDays) * 10) / 10));
  let windowEndMile = $derived(currentMile + windowMiles);

  function withDistance(stop: ResupplyStop): StopWithDistance {
    return { ...stop, milesAway: Math.max(0, Math.round((stop.mile - currentMile) * 10) / 10) };
  }

  let upcomingStops = $derived.by(() => stopsSorted.filter((s) => s.mile > currentMile).map(withDistance));
  let nextStop = $derived.by(() => (upcomingStops[0] ? upcomingStops[0] : null));

  let windowStops = $derived.by(() => upcomingStops.filter((s) => s.mile <= windowEndMile));
  let recommendedStop = $derived.by(() => {
    if (windowStops.length > 0) return windowStops[windowStops.length - 1];
    return nextStop;
  });

  function matchesFilters(stop: ResupplyStop): boolean {
    if (mailDropOnly && !stop.mailDrop) return false;
    if (requireGrocery && !stop.services.includes('grocery')) return false;
    if (requireOutfitter && !stop.services.includes('outfitter')) return false;
    return true;
  }

  let visibleStops = $derived.by(() => {
    const q = search.trim().toLowerCase();
    const pool = q ? stopsSorted : upcomingStops;
    const filtered = pool.filter((s) => {
      if (!matchesFilters(s)) return false;
      if (!q) return true;
      const hay = `${s.name} ${s.state ?? ''} ${s.type} ${s.services.join(' ')}`.toLowerCase();
      return hay.includes(q);
    });

    // If searching, show all matches. Otherwise, keep the dashboard view tight.
    const rows = q ? filtered : filtered.slice(0, 14);
    return rows.map((s) => ('milesAway' in s ? (s as StopWithDistance) : withDistance(s)));
  });

  function serviceIcon(service: string): string {
    return RESUPPLY_SERVICE_META[service as ResupplyServiceKey]?.icon ?? '•';
  }
</script>

<section class="card hero">
  <div class="hero-top">
    <div>
      <h2 class="title">Resupply</h2>
      <p class="sub">
        Plan your next town stop fast: what’s next, what’s in range, and where to mail drops.
      </p>
    </div>
    <div class="hero-links">
      <a class="btn-link" href="/tools/mail/">Mail drops →</a>
      <a class="btn-link" href="/tools/milestone/">Journey →</a>
    </div>
  </div>

  <div class="badges">
    <span class="badge"><strong>Now</strong> Mile {formatMiles(currentMile)}</span>
    <span class="badge"><strong>Pace</strong> {formatMiles(pace)} mi/day</span>
    <span class="badge"><strong>Carry</strong> {carryDays} days</span>
    <span class="badge"><strong>Range</strong> ~{formatMiles(windowMiles)} mi</span>
  </div>

  <div class="hero-grid">
    <div class="cardlet">
      <div class="cardlet-k">Next stop</div>
      {#if nextStop}
        <div class="cardlet-v">{nextStop.name}</div>
        <div class="cardlet-s">Mile {formatMiles(nextStop.mile)} • +{formatMiles(nextStop.milesAway)} mi</div>
      {:else}
        <div class="cardlet-v">Katahdin</div>
        <div class="cardlet-s">No stops ahead</div>
      {/if}
    </div>

    <div class="cardlet">
      <div class="cardlet-k">Best in range</div>
      {#if recommendedStop}
        <div class="cardlet-v">{recommendedStop.name}</div>
        <div class="cardlet-s">
          Mile {formatMiles(recommendedStop.mile)} • +{formatMiles(recommendedStop.milesAway)} mi
        </div>
      {:else}
        <div class="cardlet-v">—</div>
        <div class="cardlet-s">Set your mile marker</div>
      {/if}
    </div>
  </div>
</section>

<section class="card controls">
  <div class="controls-head">
    <h3 class="section">Filters</h3>
    <div class="controls-meta">
      <span class="badge"><strong>Results</strong> {visibleStops.length}</span>
    </div>
  </div>

  <div class="controls-grid">
    <label class="field">
      <span class="label">Food carry (days)</span>
      <div class="range-row">
        <input
          class="range"
          type="range"
          min="2"
          max="7"
          step="1"
          bind:value={carryDays}
        />
        <span class="value">{carryDays}</span>
      </div>
    </label>

    <label class="field">
      <span class="label">Search</span>
      <input
        class="text"
        type="search"
        placeholder="e.g. Pearisburg, grocery, VA…"
        bind:value={search}
      />
    </label>

    <div class="checks">
      <label class="check">
        <input type="checkbox" bind:checked={mailDropOnly} />
        <span>Mail drop only</span>
      </label>
      <label class="check">
        <input type="checkbox" bind:checked={requireGrocery} />
        <span>Grocery</span>
      </label>
      <label class="check">
        <input type="checkbox" bind:checked={requireOutfitter} />
        <span>Outfitter</span>
      </label>
    </div>
  </div>
</section>

<section class="card list">
  <div class="list-head">
    <h3 class="section">Stops</h3>
    <p class="hint">Costs are rough planning estimates. Always verify hours and policies.</p>
  </div>

  {#if visibleStops.length === 0}
    <p class="empty">No matching stops.</p>
  {:else}
    <div class="stop-list">
      {#each visibleStops as stop (stop.mile + stop.name)}
        <article
          class="stop"
          class:is-next={nextStop?.mile === stop.mile}
          class:is-rec={recommendedStop?.mile === stop.mile}
        >
          <header class="stop-head">
            <div class="stop-title">
              <div class="stop-name">{stop.name}{stop.state ? `, ${stop.state}` : ''}</div>
              <div class="stop-sub">
                <span class="pill">{stop.type}</span>
                {#if stop.mailDrop}
                  <span class="pill pill-mail">mail drop</span>
                {/if}
              </div>
            </div>

            <div class="stop-right">
              <span class="badge"><strong>Mile</strong> {formatMiles(stop.mile)}</span>
              <span class="badge"><strong>+ </strong>{formatMiles(stop.milesAway)} mi</span>
            </div>
          </header>

          {#if stop.services?.length}
            <div class="services">
              {#each stop.services as service}
                <span class="svc" title={service}>
                  <span class="svc-i" aria-hidden="true">{serviceIcon(service)}</span>
                  <span class="svc-t">{service}</span>
                </span>
              {/each}
            </div>
          {/if}

          {#if stop.costs}
            <div class="costs">
              {#if stop.costs.resupply !== undefined}
                <span class="cost"><strong>Resupply</strong> {formatMoney(stop.costs.resupply)}</span>
              {/if}
              {#if stop.costs.meal !== undefined}
                <span class="cost"><strong>Meal</strong> {formatMoney(stop.costs.meal)}</span>
              {/if}
              {#if stop.costs.hostel !== undefined}
                <span class="cost"><strong>Hostel</strong> {formatMoney(stop.costs.hostel)}</span>
              {/if}
              {#if stop.costs.motel !== undefined}
                <span class="cost"><strong>Motel</strong> {formatMoney(stop.costs.motel)}</span>
              {/if}
              {#if stop.costs.laundry !== undefined}
                <span class="cost"><strong>Laundry</strong> {formatMoney(stop.costs.laundry)}</span>
              {/if}
            </div>
          {/if}
        </article>
      {/each}
    </div>
  {/if}
</section>

<style>
  .hero,
  .controls,
  .list {
    padding: 1rem;
  }

  .hero-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
    margin-bottom: 0.6rem;
  }

  .title {
    margin: 0 0 0.15rem;
    font-family: Oswald, sans-serif;
    font-size: 1.35rem;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    color: var(--pine);
  }

  .sub {
    margin: 0;
    color: var(--muted);
    max-width: 64ch;
  }

  .hero-links {
    display: flex;
    gap: 0.6rem;
    flex-wrap: wrap;
  }

  .btn-link {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.5rem 0.75rem;
    border-radius: 12px;
    border: 1px solid var(--border);
    background: rgba(255, 255, 255, 0.7);
    text-decoration: none;
    color: var(--pine);
    font-family: Oswald, sans-serif;
    font-weight: 700;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    font-size: 0.85rem;
  }

  .btn-link:hover {
    background: #fff;
  }

  .hero-grid {
    margin-top: 0.85rem;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
  }

  .cardlet {
    border: 1px solid var(--border);
    background: rgba(255, 255, 255, 0.75);
    border-radius: 12px;
    padding: 0.75rem 0.85rem;
  }

  .cardlet-k {
    font-family: Oswald, sans-serif;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--muted);
    margin-bottom: 0.35rem;
  }

  .cardlet-v {
    font-family: Oswald, sans-serif;
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--pine);
  }

  .cardlet-s {
    margin-top: 0.15rem;
    color: var(--muted);
    font-size: 0.85rem;
  }

  .controls {
    margin-top: 1rem;
  }

  .controls-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
    margin-bottom: 0.75rem;
  }

  .section {
    margin: 0;
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    color: var(--pine);
  }

  .controls-grid {
    display: grid;
    grid-template-columns: 1fr 1.3fr auto;
    gap: 0.9rem;
    align-items: end;
  }

  .field {
    display: grid;
    gap: 0.35rem;
  }

  .label {
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--muted);
  }

  .range-row {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .range {
    width: 100%;
    accent-color: var(--alpine);
  }

  .value {
    font-family: Oswald, sans-serif;
    font-weight: 800;
    min-width: 2ch;
    text-align: right;
    color: var(--pine);
  }

  .text {
    width: 100%;
    padding: 0.6rem 0.7rem;
    border-radius: 12px;
    border: 1px solid var(--border);
    background: #fff;
    color: var(--ink);
  }

  .text:focus {
    outline: 3px solid rgba(240, 224, 0, 0.55);
    outline-offset: 2px;
  }

  .checks {
    display: grid;
    gap: 0.4rem;
    padding: 0.2rem 0;
  }

  .check {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    font-size: 0.9rem;
    color: var(--pine);
  }

  .check input {
    width: 16px;
    height: 16px;
    accent-color: var(--alpine);
  }

  .list {
    margin-top: 1rem;
  }

  .list-head {
    margin-bottom: 0.85rem;
  }

  .hint {
    margin: 0.2rem 0 0;
    color: var(--muted);
    font-size: 0.9rem;
  }

  .stop-list {
    display: grid;
    gap: 0.75rem;
  }

  .stop {
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 0.85rem 0.9rem;
    background: rgba(255, 255, 255, 0.7);
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .stop.is-next {
    border-color: rgba(240, 224, 0, 0.55);
    box-shadow: 0 10px 22px rgba(240, 224, 0, 0.12);
  }

  .stop.is-rec {
    border-color: rgba(123, 158, 107, 0.55);
    box-shadow: 0 10px 22px rgba(123, 158, 107, 0.14);
  }

  .stop-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem;
    flex-wrap: wrap;
    margin-bottom: 0.55rem;
  }

  .stop-title {
    min-width: 12rem;
  }

  .stop-name {
    font-family: Oswald, sans-serif;
    font-size: 1.05rem;
    font-weight: 800;
    color: var(--pine);
    line-height: 1.2;
    margin-bottom: 0.25rem;
  }

  .stop-sub {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
    color: var(--muted);
    font-size: 0.9rem;
  }

  .pill {
    display: inline-flex;
    align-items: center;
    padding: 0.15rem 0.5rem;
    border-radius: 999px;
    border: 1px solid var(--border);
    background: #fff;
    color: var(--muted);
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    font-weight: 700;
  }

  .pill-mail {
    border-color: rgba(123, 158, 107, 0.35);
    color: var(--alpine);
  }

  .stop-right {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .services {
    display: flex;
    gap: 0.35rem 0.5rem;
    flex-wrap: wrap;
    margin-bottom: 0.5rem;
  }

  .svc {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid var(--border);
    border-radius: 999px;
    padding: 0.15rem 0.55rem;
    color: var(--pine);
    font-size: 0.85rem;
  }

  .svc-i {
    font-size: 0.95rem;
  }

  .svc-t {
    text-transform: capitalize;
  }

  .costs {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem 0.55rem;
  }

  .cost {
    display: inline-flex;
    align-items: baseline;
    gap: 0.35rem;
    color: var(--muted);
    font-size: 0.9rem;
    background: rgba(0, 0, 0, 0.03);
    border-radius: 10px;
    padding: 0.2rem 0.5rem;
    border: 1px solid rgba(0, 0, 0, 0.06);
  }

  .cost strong {
    color: var(--pine);
    font-family: Oswald, sans-serif;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    font-size: 0.75rem;
  }

  .empty {
    margin: 0;
    color: var(--muted);
  }

  @media (max-width: 800px) {
    .controls-grid {
      grid-template-columns: 1fr;
      align-items: stretch;
    }

    .hero-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
