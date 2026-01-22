<script lang="ts">
  import { RESUPPLY_STOPS, type ResupplyStop } from '../../data/resupplyStops';
  import { trailContext, updateContext, TRAIL_TOTAL_MILES } from '../../stores/trailContext.svelte';

  interface Props {
    compact?: boolean;
    showTotal?: boolean;
    showGps?: boolean;
  }

  let { compact = false, showTotal = true, showGps = true }: Props = $props();

  const maxMile = Math.round(TRAIL_TOTAL_MILES);

  let editing = $state(false);
  let draftMile = $state(trailContext.currentMile);

  let gpsState = $state<'idle' | 'loading' | 'error' | 'done'>('idle');
  let gpsMessage = $state('');

  function clampMile(value: number): number {
    if (!Number.isFinite(value)) return trailContext.currentMile;
    return Math.max(0, Math.min(maxMile, Math.round(value)));
  }

  function commit(value: number) {
    updateContext({ currentMile: clampMile(value) });
  }

  function step(delta: number) {
    commit(trailContext.currentMile + delta);
  }

  $effect(() => {
    if (!editing) draftMile = trailContext.currentMile;
  });

  function onInputKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      commit(draftMile);
      (e.currentTarget as HTMLInputElement | null)?.blur?.();
    }
  }

  // =============================================================================
  // GPS "snap" (best-effort): uses nearest cached resupply stop location
  // =============================================================================

  function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3958.8; // miles
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  }

  type GeoCacheEntry = { lat: number; lon: number };
  const GEO_CACHE_KEY = 'at-geo-cache-v1';

  function readGeoCache(): Record<string, GeoCacheEntry> {
    if (typeof localStorage === 'undefined') return {};
    try {
      const raw = localStorage.getItem(GEO_CACHE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed as Record<string, GeoCacheEntry>;
    } catch {}
    return {};
  }

  function writeGeoCache(cache: Record<string, GeoCacheEntry>) {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(GEO_CACHE_KEY, JSON.stringify(cache));
    } catch {}
  }

  async function geocodeStop(stop: ResupplyStop): Promise<GeoCacheEntry | null> {
    const cache = readGeoCache();
    if (cache[stop.name]) return cache[stop.name]!;

    // Nominatim is a best-effort free geocoder. Keep queries minimal and cache results.
    const query = `${stop.name}${stop.state ? `, ${stop.state}` : ''}, United States`;
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`;

    const resp = await fetch(url, { method: 'GET' });
    if (!resp.ok) return null;
    const data = (await resp.json()) as Array<{ lat: string; lon: string }>;
    if (!Array.isArray(data) || !data[0]?.lat || !data[0]?.lon) return null;

    const lat = Number(data[0].lat);
    const lon = Number(data[0].lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

    const entry = { lat, lon };
    cache[stop.name] = entry;
    writeGeoCache(cache);
    return entry;
  }

  async function snapToNearestStop(lat: number, lon: number) {
    const current = trailContext.currentMile;
    const candidates = RESUPPLY_STOPS
      .slice()
      .sort((a, b) => Math.abs(a.mile - current) - Math.abs(b.mile - current))
      .slice(0, 14);

    let best: { stop: ResupplyStop; dist: number } | null = null;

    for (const stop of candidates) {
      const coord = await geocodeStop(stop);
      if (!coord) continue;
      const dist = haversineMiles(lat, lon, coord.lat, coord.lon);
      if (!best || dist < best.dist) best = { stop, dist };
      if (best.dist <= 0.5) break; // close enough; stop early
    }

    if (!best) {
      gpsState = 'error';
      gpsMessage = 'Couldn’t match your location to a nearby stop.';
      return;
    }

    if (best.dist > 5) {
      gpsState = 'error';
      gpsMessage = `Not within 5 miles of a known stop (closest: ${best.stop.name}, ~${best.dist.toFixed(1)} mi).`;
      return;
    }

    commit(best.stop.mile);
    gpsState = 'done';
    gpsMessage = `Snapped to ${best.stop.name} (mile ${best.stop.mile}).`;
  }

  async function useGps() {
    gpsState = 'loading';
    gpsMessage = 'Locating…';

    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      gpsState = 'error';
      gpsMessage = 'Geolocation isn’t available in this browser.';
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await snapToNearestStop(pos.coords.latitude, pos.coords.longitude);
        } catch (e) {
          gpsState = 'error';
          gpsMessage = e instanceof Error ? e.message : 'Couldn’t use your location.';
        }
      },
      (err) => {
        gpsState = 'error';
        gpsMessage = err.message || 'Location permission denied.';
      },
      { enableHighAccuracy: true, maximumAge: 15_000, timeout: 10_000 },
    );
  }
</script>

<div class="mile-control" class:compact>
  <button class="step" type="button" onclick={() => step(-1)} aria-label="Decrease mile by 1">−</button>
  <button class="step" type="button" onclick={() => step(-10)} aria-label="Decrease mile by 10">−10</button>

  <label class="input-wrap">
    <span class="sr">Current mile</span>
    <input
      class="mile-input"
      type="number"
      min="0"
      max={maxMile}
      step="1"
      bind:value={draftMile}
      onfocus={() => (editing = true)}
      onblur={() => {
        editing = false;
        commit(draftMile);
      }}
      onkeydown={onInputKeydown}
      inputmode="numeric"
    />
  </label>

  {#if showTotal}
    <span class="total">/ {maxMile}</span>
  {/if}

  <button class="step" type="button" onclick={() => step(10)} aria-label="Increase mile by 10">+10</button>
  <button class="step" type="button" onclick={() => step(1)} aria-label="Increase mile by 1">+</button>

  {#if showGps}
    <button class="gps" type="button" onclick={useGps} disabled={gpsState === 'loading'} aria-label="Set mile from GPS">
      {#if gpsState === 'loading'}
        Locating…
      {:else}
        Use GPS
      {/if}
    </button>
  {/if}
</div>

{#if gpsMessage}
  <div class="gps-msg" class:error={gpsState === 'error'} class:ok={gpsState === 'done'} role="status">
    {gpsMessage}
  </div>
{/if}

<style>
  .sr {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .mile-control {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    flex-wrap: wrap;
  }

  .mile-control.compact {
    gap: 0.25rem;
  }

  .step {
    border: 1px solid rgba(255, 255, 255, 0.22);
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.9);
    border-radius: 10px;
    padding: 0.45rem 0.55rem;
    font-family: Oswald, sans-serif;
    font-weight: 700;
    letter-spacing: 0.02em;
    cursor: pointer;
  }

  .mile-control.compact .step {
    border-radius: 8px;
    padding: 0.35rem 0.45rem;
    font-size: 0.85rem;
  }

  .step:hover {
    background: rgba(255, 255, 255, 0.16);
  }

  .input-wrap {
    display: inline-flex;
    align-items: baseline;
  }

  .mile-input {
    width: 6.2ch;
    text-align: center;
    border: 1px solid rgba(255, 255, 255, 0.25);
    background: rgba(0, 0, 0, 0.18);
    color: #fff;
    border-radius: 12px;
    padding: 0.45rem 0.55rem;
    font-family: Oswald, sans-serif;
    font-weight: 800;
    font-size: 1.35rem;
    line-height: 1;
  }

  .mile-control.compact .mile-input {
    font-size: 1rem;
    border-radius: 10px;
    padding: 0.35rem 0.45rem;
  }

  .mile-input:focus {
    outline: 3px solid rgba(240, 224, 0, 0.7);
    outline-offset: 2px;
  }

  .total {
    font-family: Oswald, sans-serif;
    color: rgba(255, 255, 255, 0.65);
    margin: 0 0.15rem 0 0.1rem;
  }

  .gps {
    border: 1px solid rgba(240, 224, 0, 0.35);
    background: rgba(240, 224, 0, 0.12);
    color: #fff;
    border-radius: 10px;
    padding: 0.45rem 0.6rem;
    font-family: Oswald, sans-serif;
    font-weight: 700;
    cursor: pointer;
  }

  .mile-control.compact .gps {
    border-radius: 8px;
    padding: 0.35rem 0.5rem;
    font-size: 0.85rem;
  }

  .gps:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .gps-msg {
    margin-top: 0.35rem;
    color: rgba(255, 255, 255, 0.75);
    font-size: 0.85rem;
  }

  .gps-msg.error {
    color: rgba(255, 255, 255, 0.85);
  }

  .gps-msg.ok {
    color: rgba(255, 255, 255, 0.85);
  }
</style>

