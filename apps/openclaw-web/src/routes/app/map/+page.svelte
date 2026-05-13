<script lang="ts">
  import { resolve } from '$app/paths';
  import { onMount } from 'svelte';
  import { getProfile } from '$lib/manual-db';
  import type { ManualProfile } from '@hoggcountry/manual-core';

  const TOTAL_AT_MILES = 2197.4;
  const DEFAULT_WINDOW_MILES = 18;

  let profile = $state<ManualProfile | null>(null);
  let locationBusy = $state(false);
  let locationNotice = $state('');
  let locationError = $state('');

  onMount(async () => {
    profile = await getProfile().catch(() => null);
  });

  const hasMile = $derived(Boolean(profile && Number.isFinite(profile.currentMile) && profile.currentMile > 0));
  const currentMile = $derived(hasMile && profile ? Math.max(0, Math.min(TOTAL_AT_MILES, profile.currentMile)) : 0);
  const direction = $derived((profile?.direction || 'NOBO').toUpperCase());
  const corridorStart = $derived(hasMile ? currentMile : 0);
  const corridorEnd = $derived(hasMile ? Math.min(TOTAL_AT_MILES, currentMile + DEFAULT_WINDOW_MILES) : DEFAULT_WINDOW_MILES);
  const progressPercent = $derived(hasMile ? Math.max(3, Math.min(97, (currentMile / TOTAL_AT_MILES) * 100)) : 8);

  function mileLabel(mile: number): string {
    return `Mile ${mile.toFixed(0)}`;
  }

  function corridorPrompt(): string {
    if (!hasMile) {
      return 'Help me set my current AT mile and then explain what the Map page should show for my next trail corridor.';
    }

    return `From AT mile ${currentMile.toFixed(1)} ${direction}, plan the next ${DEFAULT_WINDOW_MILES} trail miles. Focus on sleep target, water checks, weather exposure, bailout roads/towns, and what must be verified from current sources.`;
  }

  async function updateFromGps() {
    locationError = '';
    locationNotice = '';

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      locationError = 'GPS is not available in this browser.';
      return;
    }

    locationBusy = true;
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          maximumAge: 60_000,
          timeout: 12_000
        });
      });

      const response = await fetch('/app-api/workspace/profile/current-location', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracyMeters: position.coords.accuracy
        })
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.message || 'Could not update current mile from GPS.');

      profile = payload.workspace?.profile ?? profile;
      locationNotice = payload.updated
        ? `Updated to AT mile ${payload.nearest?.mile?.toFixed?.(1) ?? profile?.currentMile?.toFixed?.(1) ?? 'nearby'}.`
        : payload.reason || 'GPS checked, but profile mile was not changed.';
    } catch (error) {
      locationError = error instanceof Error ? error.message : 'Could not read GPS location.';
    } finally {
      locationBusy = false;
    }
  }
</script>

<section class="map-page" aria-label="Scout map">
  <header class="map-hero">
    <p class="eyebrow">Map</p>
    <h1>Where are you, and what’s next?</h1>
    <p>Keep the map focused on the next trail decision: current mile, next stretch, water checks, and bailout options.</p>
  </header>

  <article class="mile-card" aria-label="Current trail position">
    <div>
      <span class="card-label">Current position</span>
      <strong>{hasMile ? mileLabel(currentMile) : 'Set your mile'}</strong>
      <p>{hasMile ? `${direction} · next ${DEFAULT_WINDOW_MILES} miles loaded as your working corridor.` : 'Use GPS near the AT or set your mile in Profile. Scout can still help, but the map needs a starting point.'}</p>
    </div>
    <button type="button" onclick={updateFromGps} disabled={locationBusy}>{locationBusy ? 'Checking…' : 'Use GPS'}</button>
  </article>

  {#if locationNotice}<p class="map-note success-note">{locationNotice}</p>{/if}
  {#if locationError}<p class="map-note error-note">{locationError}</p>{/if}

  <article class="corridor-card" aria-label="Next trail corridor">
    <div class="corridor-map" aria-hidden="true">
      <div class="trail-line"></div>
      <span class="pin pin-now" style={`--x: ${progressPercent}%`}>Now</span>
      <span class="pin pin-water">Water</span>
      <span class="pin pin-sleep">Sleep</span>
      <span class="pin pin-town">Bailout</span>
    </div>

    <div class="corridor-copy">
      <span class="card-label">Working corridor</span>
      <h2>{hasMile ? `${mileLabel(corridorStart)} → ${mileLabel(corridorEnd)}` : 'First 18-mile planning window'}</h2>
      <div class="check-grid" aria-label="Map checks">
        <span><strong>Water</strong><small>Needs current source check</small></span>
        <span><strong>Weather</strong><small>Forecast before relying</small></span>
        <span><strong>Sleep</strong><small>Pick conservative target</small></span>
        <span><strong>Bailout</strong><small>Road/town options</small></span>
      </div>
      <form class="scout-handoff" action={resolve('/app/scout')} method="GET">
        <input type="hidden" name="prompt" value={corridorPrompt()} />
        <button class="primary-link" type="submit">Ask Scout about this stretch</button>
      </form>
    </div>
  </article>

  <nav class="map-actions" aria-label="Map actions">
    <a href={resolve('/app/profile')}>Edit profile</a>
    <a href={resolve('/at-map')}>Open public AT map</a>
  </nav>
</section>

<style>
  .map-page {
    display: grid;
    gap: 0.85rem;
    width: min(100%, 920px);
    margin: 0 auto;
    padding-bottom: 1rem;
  }

  .map-hero {
    display: grid;
    gap: 0.35rem;
  }

  .eyebrow,
  .card-label {
    margin: 0;
    color: var(--pine);
    font-family: Oswald, Impact, sans-serif;
    font-size: 0.72rem;
    font-weight: 900;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  .map-hero h1 {
    max-width: 15ch;
    margin: 0;
    color: #2c2116;
    font-size: clamp(2.3rem, 7vw, 4.4rem);
    letter-spacing: -0.04em;
    line-height: 0.95;
  }

  .map-hero p:not(.eyebrow) {
    max-width: 48rem;
    margin: 0;
    color: var(--muted);
    font-weight: 760;
    line-height: 1.45;
  }

  .mile-card,
  .corridor-card,
  .map-actions a {
    border: 1px solid rgba(77, 89, 74, 0.12);
    background: rgba(255, 253, 248, 0.9);
    box-shadow: 0 12px 28px rgba(31, 41, 55, 0.06);
    color: #27332b;
  }

  .mile-card {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 1rem;
    align-items: center;
    border-radius: 24px;
    padding: clamp(0.9rem, 3vw, 1.25rem);
  }

  .mile-card strong {
    display: block;
    margin-top: 0.16rem;
    color: #191815;
    font-size: clamp(2rem, 6vw, 3.2rem);
    letter-spacing: -0.055em;
    line-height: 0.95;
  }

  .mile-card p {
    max-width: 44rem;
    margin: 0.35rem 0 0;
    color: #52604d;
    font-weight: 760;
    line-height: 1.38;
  }

  .mile-card button {
    min-height: 3rem;
    border-radius: 999px;
    background: #24362c;
    color: #fffdf8;
    cursor: pointer;
    font-family: Oswald, Impact, sans-serif;
    font-weight: 900;
    letter-spacing: 0.07em;
    padding: 0 1rem;
    text-transform: uppercase;
  }

  .mile-card button:disabled {
    cursor: wait;
    opacity: 0.65;
  }

  .map-note {
    margin: 0;
    border-radius: 16px;
    font-weight: 800;
    padding: 0.68rem 0.82rem;
  }

  .success-note {
    background: rgba(237, 243, 229, 0.88);
    color: #27332b;
  }

  .error-note {
    background: rgba(127, 29, 29, 0.08);
    color: #7f1d1d;
  }

  .corridor-card {
    display: grid;
    overflow: hidden;
    border-radius: 26px;
  }

  .corridor-map {
    position: relative;
    min-height: min(52vh, 420px);
    overflow: hidden;
    background:
      url('/default-background.svg') center 20% / 1800px 1200px no-repeat,
      radial-gradient(circle at 20% 25%, rgba(166, 181, 137, 0.36), transparent 13rem),
      radial-gradient(circle at 78% 68%, rgba(78, 106, 131, 0.18), transparent 13rem),
      rgba(237, 243, 229, 0.58);
  }

  .trail-line {
    position: absolute;
    inset: 18% 14%;
    border-left: 7px solid rgba(77, 89, 74, 0.62);
    border-bottom: 7px solid rgba(77, 89, 74, 0.62);
    border-radius: 0 0 0 68%;
    transform: rotate(-18deg);
  }

  .pin {
    position: absolute;
    display: grid;
    place-items: center;
    min-width: 4.35rem;
    min-height: 2.32rem;
    border: 3px solid #fffdf8;
    border-radius: 999px;
    background: #24362c;
    color: #fffdf8;
    box-shadow: 0 10px 22px rgba(31, 41, 55, 0.14);
    font-family: Oswald, Impact, sans-serif;
    font-size: 0.78rem;
    font-weight: 900;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .pin-now {
    left: min(calc(var(--x) - 2rem), calc(100% - 5rem));
    top: 18%;
  }

  .pin-water { left: 34%; top: 38%; background: #4e6a83; }
  .pin-sleep { right: 21%; bottom: 31%; background: #342316; }
  .pin-town { right: 10%; bottom: 13%; background: var(--terra); }

  .corridor-copy {
    display: grid;
    gap: 0.75rem;
    padding: clamp(0.95rem, 3vw, 1.25rem);
  }

  .corridor-copy h2 {
    margin: 0;
    color: #191815;
    font-size: clamp(1.5rem, 4vw, 2.1rem);
    letter-spacing: -0.04em;
    line-height: 1.05;
  }

  .check-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.55rem;
  }

  .check-grid span {
    display: grid;
    gap: 0.15rem;
    border: 1px solid rgba(77, 89, 74, 0.11);
    border-radius: 15px;
    background: rgba(255, 255, 255, 0.62);
    padding: 0.68rem;
  }

  .check-grid strong {
    color: #27332b;
    font-family: Oswald, Impact, sans-serif;
    font-size: 0.9rem;
    font-weight: 900;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .check-grid small {
    color: #52604d;
    font-size: 0.78rem;
    font-weight: 760;
    line-height: 1.22;
  }

  .scout-handoff {
    margin: 0;
  }

  .primary-link,
  .map-actions a {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 2.9rem;
    border-radius: 999px;
    font-family: Oswald, Impact, sans-serif;
    font-weight: 900;
    letter-spacing: 0.07em;
    text-decoration: none;
    text-transform: uppercase;
  }

  button.primary-link {
    border: 0;
    cursor: pointer;
    font-size: 0.86rem;
  }

  .primary-link {
    background: #24362c;
    color: #fffdf8;
    padding: 0 1rem;
  }

  .map-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.55rem;
  }

  .map-actions a {
    color: #394638;
    padding: 0 0.85rem;
  }

  @media (max-width: 760px) {
    .map-page {
      gap: 0.65rem;
      padding-bottom: calc(8.6rem + env(safe-area-inset-bottom));
    }

    .map-hero p:not(.eyebrow) {
      display: none;
    }

    .map-hero h1 {
      max-width: 13ch;
      font-size: clamp(2.05rem, 10vw, 3rem);
    }

    .mile-card {
      grid-template-columns: 1fr;
      gap: 0.72rem;
      border-radius: 20px;
    }

    .mile-card button {
      width: 100%;
    }

    .corridor-map {
      min-height: 36vh;
    }

    .pin {
      min-width: 3.75rem;
      min-height: 2.05rem;
      font-size: 0.7rem;
    }

    .pin-now {
      left: 13%;
    }

    .check-grid {
      grid-template-columns: 1fr 1fr;
      gap: 0.42rem;
    }

    .check-grid span {
      padding: 0.58rem;
    }

    .check-grid small {
      font-size: 0.72rem;
    }

    .primary-link {
      width: 100%;
    }
  }

  @media (min-width: 860px) {
    .corridor-card {
      grid-template-columns: minmax(0, 1.25fr) minmax(320px, 0.75fr);
    }

    .corridor-copy {
      align-content: center;
    }
  }
</style>
