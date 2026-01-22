<script lang="ts">
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
  // GPS "snap": uses locally-hosted milepost coordinates (generated from the ANST centerline)
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

  type Milepost = { mile: number; lat: number; lon: number };
  let mileposts: Milepost[] | null = null;

  async function loadMileposts(): Promise<Milepost[]> {
    if (mileposts) return mileposts;
    const resp = await fetch('/at-mileposts.json', { method: 'GET' });
    if (!resp.ok) throw new Error('Could not load milepost data.');
    const data = (await resp.json()) as { mileposts?: Milepost[] };
    if (!data?.mileposts || !Array.isArray(data.mileposts)) throw new Error('Invalid milepost data.');
    mileposts = data.mileposts;
    return mileposts;
  }

  async function snapToNearestMile(lat: number, lon: number) {
    const posts = await loadMileposts();

    let best: { mile: number; dist: number } | null = null;
    for (const p of posts) {
      const dist = haversineMiles(lat, lon, p.lat, p.lon);
      if (!best || dist < best.dist) best = { mile: p.mile, dist };
    }

    const maxSnapMiles = 50;

    if (!best) {
      gpsState = 'error';
      gpsMessage = 'Couldn’t match your location to the trail.';
      return;
    }

    if (best.dist > maxSnapMiles) {
      gpsState = 'error';
      gpsMessage = `Not within ${maxSnapMiles} miles of the trail (closest mile: ${best.mile}, ~${best.dist.toFixed(1)} mi).`;
      return;
    }

    commit(best.mile);
    gpsState = 'done';
    gpsMessage = `Snapped to mile ${best.mile} (~${best.dist.toFixed(1)} mi away).`;
  }

  async function useGps() {
    gpsState = 'loading';
    gpsMessage = 'Locating…';

    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      gpsState = 'error';
      gpsMessage = 'Geolocation isn’t available in this browser.';
      return;
    }

    function formatGeoError(err: GeolocationPositionError): string {
      const raw = (err?.message || '').trim();
      if (/permissions policy/i.test(raw)) return 'GPS is blocked by site settings right now.';
      if (err.code === 1) return 'Location permission denied. Enable it and try again.';
      if (err.code === 2) return 'Location unavailable. Try again in a moment.';
      if (err.code === 3) return 'Location timed out. Try again.';
      return raw || 'Couldn’t get your location.';
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await snapToNearestMile(pos.coords.latitude, pos.coords.longitude);
        } catch (e) {
          gpsState = 'error';
          gpsMessage = e instanceof Error ? e.message : 'Couldn’t use your location.';
        }
      },
      (err) => {
        gpsState = 'error';
        gpsMessage = formatGeoError(err);
      },
      { enableHighAccuracy: true, maximumAge: 15_000, timeout: 10_000 },
    );
  }
</script>

<div class="mile-control" class:compact>
  <div class="stepper" role="group" aria-label="Mile marker controls">
    <button class="step big" type="button" onclick={() => step(-10)} aria-label="Decrease mile by 10">
      −10
    </button>
    <button class="step" type="button" onclick={() => step(-1)} aria-label="Decrease mile by 1">−</button>

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

    <button class="step" type="button" onclick={() => step(1)} aria-label="Increase mile by 1">+</button>
    <button class="step big" type="button" onclick={() => step(10)} aria-label="Increase mile by 10">
      +10
    </button>
  </div>

  {#if showTotal}
    <span class="total">/ {maxMile}</span>
  {/if}

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
    --h: 44px;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .mile-control.compact {
    --h: 34px;
    gap: 0.4rem;
  }

  .stepper {
    display: inline-flex;
    align-items: stretch;
    border: 1px solid rgba(255, 255, 255, 0.22);
    background: rgba(0, 0, 0, 0.18);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
  }

  .mile-control.compact .stepper {
    border-radius: 10px;
  }

  .stepper:focus-within {
    outline: 3px solid rgba(240, 224, 0, 0.7);
    outline-offset: 2px;
  }

  .stepper > * + * {
    border-left: 1px solid rgba(255, 255, 255, 0.12);
  }

  .step {
    height: var(--h);
    border: none;
    background: transparent;
    color: rgba(255, 255, 255, 0.9);
    padding: 0 0.6rem;
    font-family: Oswald, sans-serif;
    font-weight: 700;
    letter-spacing: 0.02em;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
  }

  .step.big {
    min-width: 3.1rem;
  }

  .step:hover {
    background: rgba(255, 255, 255, 0.10);
  }

  .input-wrap {
    display: inline-flex;
    align-items: stretch;
  }

  .mile-input {
    height: var(--h);
    width: 6ch;
    text-align: center;
    border: none;
    background: rgba(255, 255, 255, 0.06);
    color: #fff;
    padding: 0 0.65rem;
    font-family: Oswald, sans-serif;
    font-weight: 800;
    font-size: 1.4rem;
    line-height: 1;
  }

  .mile-control.compact .mile-input {
    font-size: 1rem;
    padding: 0 0.55rem;
  }

  .mile-control.compact .step {
    padding: 0 0.5rem;
    font-size: 0.85rem;
  }

  .mile-control.compact .step.big {
    min-width: 2.7rem;
  }

  .mile-input:focus {
    outline: none;
  }

  .total {
    font-family: Oswald, sans-serif;
    color: rgba(255, 255, 255, 0.65);
    margin: 0 0.1rem 0 0;
  }

  .gps {
    border: 1px solid rgba(240, 224, 0, 0.35);
    background: rgba(240, 224, 0, 0.12);
    color: #fff;
    border-radius: 10px;
    height: var(--h);
    padding: 0 0.7rem;
    font-family: Oswald, sans-serif;
    font-weight: 700;
    cursor: pointer;
    line-height: 1;
  }

  .mile-control.compact .gps {
    border-radius: 8px;
    padding: 0 0.55rem;
    font-size: 0.85rem;
  }

  .gps:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .gps-msg {
    margin-top: 0.5rem;
    padding: 0.45rem 0.6rem;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(0, 0, 0, 0.18);
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.82rem;
  }

  .gps-msg.error {
    border-color: rgba(240, 224, 0, 0.28);
    color: rgba(255, 255, 255, 0.9);
  }

  .gps-msg.ok {
    border-color: rgba(74, 222, 128, 0.28);
    color: rgba(255, 255, 255, 0.9);
  }
</style>
