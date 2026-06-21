<script lang="ts">
  import { onMount } from 'svelte';
  import { buildTodayCards, getTrailPhase, TRAIL_FACTS, type TodayCard } from '@hoggcountry/trail-data';
  import { getProfile, listImportedDocuments, listWorkspaceResources, setCurrentMile } from '$lib/manual-db';
  import {
    offlineFieldPackSummary,
    readOfflineFieldPack,
    refreshOfflineFieldPack,
    type OfflineScoutDailyBrief
  } from '$lib/offline-field-pack';
  import type { ManualProfile } from '@hoggcountry/manual-core';
  import type { PageData } from './$types';

  const { data } = $props<{ data: PageData }>();

  interface BeforeInstallPromptEvent extends Event {
    readonly platforms?: string[];
    readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
    prompt(): Promise<void>;
  }

  interface LocationUpdatePayload {
    readonly location?: {
      readonly nearestMile?: number;
      readonly distanceToTrailMiles?: number;
    };
    readonly profileUpdated?: boolean;
    readonly profileUpdateReason?: string | null;
    readonly workspace?: {
      readonly profile?: ManualProfile | null;
    };
  }

  interface TrailAheadWaypoint {
    readonly name: string;
    readonly mile: number;
    readonly milesAhead: number;
    readonly type: string;
  }

  interface TrailAheadWeatherDay {
    readonly date: string;
    readonly label: string;
    readonly highF: number | null;
    readonly lowF: number | null;
    readonly precipChancePct: number | null;
    readonly windMaxMph: number | null;
  }

  interface TrailAheadTerrain {
    readonly lookaheadMiles: number;
    readonly gainFt: number | null;
    readonly lossFt: number | null;
    readonly maxGradePercent: number | null;
    readonly difficultyScore: number | null;
    readonly difficultyLabel: string | null;
  }

  interface TrailAheadContext {
    readonly mile: number;
    readonly mileSource: 'profile' | 'tracker';
    readonly weather: readonly TrailAheadWeatherDay[];
    readonly weatherError: string | null;
    readonly next: {
      readonly shelter: TrailAheadWaypoint | null;
      readonly water: TrailAheadWaypoint | null;
      readonly town: TrailAheadWaypoint | null;
      readonly road: TrailAheadWaypoint | null;
    };
    readonly terrainAhead: TrailAheadTerrain | null;
  }

  let profile = $state<ManualProfile | null>(null);
  let todayCards = $state.raw<readonly TodayCard[]>([]);
  let dailyBrief = $state.raw<OfflineScoutDailyBrief | null>(null);
  let docCount = $state(0);
  let resourceCount = $state(0);
  let prompt = $state('');
  let mileDraft = $state('');
  let fieldPackStatus = $state('No field pack saved');
  let fieldPackBusy = $state(false);
  let fieldPackError = $state('');
  let installPrompt = $state<BeforeInstallPromptEvent | null>(null);
  let online = $state(true);
  let locationBusy = $state(false);
  let locationNotice = $state('');
  let locationError = $state('');
  let mileBusy = $state(false);
  let mileNotice = $state('');
  let mileError = $state('');
  let trailAhead = $state<TrailAheadContext | null>(null);
  let trailAheadLoading = $state(true);
  let trailAheadError = $state('');
  let trailAheadUnavailable = $state(false);

  const currentMile = $derived(profile && Number.isFinite(profile.currentMile) ? Math.max(0, profile.currentMile) : 0);
  const hasMile = $derived(currentMile > 0);
  const phase = $derived(profile ? getTrailPhase(currentMile) : null);
  const targetPace = $derived(profile && profile.targetPace > 0 ? profile.targetPace : 12);
  const targetMile = $derived(Math.min(TRAIL_FACTS.totalMiles, currentMile + targetPace));
  const progressPercent = $derived(Math.max(2, Math.min(98, (currentMile / TRAIL_FACTS.totalMiles) * 100)));
  const waterCard = $derived(todayCards.find((card) => card.id === 'water') ?? null);
  const shelterCard = $derived(todayCards.find((card) => card.id === 'shelter') ?? null);
  const paceCard = $derived(todayCards.find((card) => card.id === 'pace') ?? null);
  const primaryRisk = $derived(dailyBrief?.risks.find((risk) => risk.severity === 'urgent' || risk.severity === 'watch') ?? dailyBrief?.risks[0] ?? null);
  const contextCount = $derived(docCount + resourceCount);
  const sourceLine = $derived(dailyBrief ? `Brief ${formatShortDate(dailyBrief.generatedAt)}` : fieldPackStatus);
  const briefPrompt = $derived(dailyBrief?.scoutPrompt ?? buildFallbackBriefPrompt());
  const trailAheadMileLine = $derived(trailAhead
    ? `at mile ${trailAhead.mile.toFixed(1)} — ${trailAhead.mileSource === 'tracker' ? 'Garmin tracker (profile mile not set)' : 'your profile mile'}`
    : '');
  const trailAheadRows = $derived.by(() => {
    if (!trailAhead) return [];
    const rows: { readonly label: string; readonly waypoint: TrailAheadWaypoint }[] = [];
    if (trailAhead.next.shelter) rows.push({ label: 'Shelter', waypoint: trailAhead.next.shelter });
    if (trailAhead.next.water) rows.push({ label: 'Water', waypoint: trailAhead.next.water });
    if (trailAhead.next.town) rows.push({ label: 'Town', waypoint: trailAhead.next.town });
    if (trailAhead.next.road) rows.push({ label: 'Road', waypoint: trailAhead.next.road });
    return rows;
  });
  const hudCues = $derived.by(() => [
    {
      label: 'Elevation',
      value: profile ? `${targetPace.toFixed(0)} mi window` : 'Set mile',
      detail: 'Ask Scout for the climb profile before committing to the day.'
    },
    {
      label: 'Water',
      value: profile && profile.waterCapacityLiters > 0 ? `${profile.waterCapacityLiters.toFixed(1)}L carry` : 'Capacity unset',
      detail: waterCard?.detail ?? 'Treat water as a current-source check until your profile is set.'
    },
    {
      label: 'Shelter',
      value: profile ? profile.shelterPreference.replace('-', ' ') : 'Unset',
      detail: shelterCard?.detail ?? 'Pick a conservative sleep target before the day gets late.'
    },
    {
      label: 'Risk',
      value: primaryRisk ? primaryRisk.severity : online ? 'live check' : 'saved only',
      detail: primaryRisk?.detail ?? paceCard?.detail ?? 'Use the saved brief offline and refresh sources when service returns.'
    }
  ]);

  onMount(() => {
    online = navigator.onLine;
    fieldPackStatus = offlineFieldPackSummary();
    dailyBrief = readOfflineFieldPack()?.dailyBrief ?? null;

    const handleOnline = () => {
      online = true;
      if (trailAheadError || trailAheadUnavailable) void loadTrailAhead();
    };
    const handleOffline = () => {
      online = false;
    };
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      installPrompt = event as BeforeInstallPromptEvent;
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    void loadHudState();
    void loadTrailAhead();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  });

  async function loadHudState() {
    const [workspaceProfile, docs, resources] = await Promise.all([
      getProfile().catch(() => null),
      listImportedDocuments().catch(() => []),
      listWorkspaceResources().catch(() => [])
    ]);

    applyProfile(workspaceProfile);
    docCount = docs.length;
    resourceCount = resources.length;

    const idle = window.requestIdleCallback ?? ((callback: IdleRequestCallback) => window.setTimeout(() => callback({ didTimeout: false, timeRemaining: () => 0 }), 1));
    if (navigator.onLine) idle(() => void saveFieldPack(true));
  }

  function applyProfile(nextProfile: ManualProfile | null | undefined) {
    profile = nextProfile ?? null;
    todayCards = profile ? buildTodayCards(profile) : [];
    mileDraft = profile && profile.currentMile > 0 ? profile.currentMile.toFixed(1) : '';
  }

  async function saveFieldPack(quiet = false) {
    fieldPackBusy = true;
    if (!quiet) {
      fieldPackError = '';
      locationNotice = '';
    }

    try {
      const pack = await refreshOfflineFieldPack();
      fieldPackStatus = offlineFieldPackSummary(pack);
      dailyBrief = pack.dailyBrief;
    } catch (caught) {
      if (!quiet) {
        fieldPackError = caught instanceof Error ? caught.message : 'Could not save field pack.';
      }
    } finally {
      fieldPackBusy = false;
    }
  }

  async function installApp() {
    if (!installPrompt) return;
    const promptEvent = installPrompt;
    installPrompt = null;
    await promptEvent.prompt();
    await promptEvent.userChoice.catch(() => null);
  }

  async function saveMile() {
    const nextMile = Number(mileDraft);
    if (!Number.isFinite(nextMile) || nextMile < 0) {
      mileError = 'Enter a valid AT mile.';
      return;
    }

    mileBusy = true;
    mileNotice = '';
    mileError = '';
    locationNotice = '';
    locationError = '';

    try {
      const nextProfile = await setCurrentMile(nextMile);
      if (!nextProfile) throw new Error('Set up your hiker profile before saving a mile.');
      applyProfile(nextProfile);
      mileNotice = `Manual mile saved: AT mile ${nextProfile.currentMile.toFixed(1)}.`;
      if (online) void saveFieldPack(true);
      void loadTrailAhead();
    } catch (caught) {
      mileError = caught instanceof Error ? caught.message : 'Could not save mile.';
    } finally {
      mileBusy = false;
    }
  }

  async function updateFromGps() {
    locationError = '';
    locationNotice = '';
    mileNotice = '';
    mileError = '';

    if (!navigator.geolocation) {
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
      const payload = (await response.json().catch(() => null)) as LocationUpdatePayload | null;
      if (!response.ok) throw new Error(payload?.profileUpdateReason || 'Could not update current mile from GPS.');

      applyProfile(payload?.workspace?.profile ?? profile);
      const nearestMile = payload?.location?.nearestMile;
      locationNotice = payload?.profileUpdated
        ? `GPS set Scout to AT mile ${typeof nearestMile === 'number' ? nearestMile.toFixed(1) : currentMile.toFixed(1)}.`
        : payload?.profileUpdateReason || 'GPS checked, but the profile mile was not changed.';
      if (online) void saveFieldPack(true);
      void loadTrailAhead();
    } catch (caught) {
      locationError = caught instanceof Error ? caught.message : 'Could not read GPS location.';
    } finally {
      locationBusy = false;
    }
  }

  async function loadTrailAhead() {
    trailAheadLoading = true;
    trailAheadError = '';
    trailAheadUnavailable = false;

    try {
      const response = await fetch('/app-api/scout/today-context', { cache: 'no-store' });
      const payload = (await response.json().catch(() => null)) as (TrailAheadContext & { unavailable?: boolean }) | { unavailable?: boolean } | null;
      if (!response.ok) throw new Error('Could not load the trail-ahead brief.');

      if (!payload || payload.unavailable) {
        trailAhead = null;
        trailAheadUnavailable = true;
      } else {
        trailAhead = payload as TrailAheadContext;
      }
    } catch (caught) {
      trailAheadError = caught instanceof Error ? caught.message : 'Could not load the trail-ahead brief.';
    } finally {
      trailAheadLoading = false;
    }
  }

  function weekdayLabel(isoDate: string): string {
    const [yearS, monthS, dayS] = isoDate.split('-');
    const year = Number(yearS);
    const month = Number(monthS);
    const day = Number(dayS);
    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return isoDate;
    return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
  }

  function terrainLine(terrain: TrailAheadTerrain): string {
    const parts: string[] = [];
    const climb = [
      terrain.gainFt !== null && Math.round(terrain.gainFt) !== 0 ? `+${Math.round(terrain.gainFt).toLocaleString()} ft` : null,
      terrain.lossFt !== null && Math.round(terrain.lossFt) !== 0 ? `-${Math.round(terrain.lossFt).toLocaleString()} ft` : null
    ].filter(Boolean).join(' / ');
    if (climb) parts.push(`${climb} over next ${terrain.lookaheadMiles} mi`);
    if (terrain.maxGradePercent !== null) {
      parts.push(`max grade ${terrain.maxGradePercent > 35 ? '35%+' : `${terrain.maxGradePercent.toFixed(0)}%`}`);
    }
    if (terrain.difficultyScore !== null) {
      parts.push(`difficulty ${terrain.difficultyScore.toFixed(1)}/10${terrain.difficultyLabel ? ` (${terrain.difficultyLabel})` : ''}`);
    } else if (terrain.difficultyLabel) {
      parts.push(`difficulty ${terrain.difficultyLabel}`);
    }
    return parts.join(' — ');
  }

  function formatShortDate(value: string | null | undefined): string {
    if (!value) return 'not saved';
    const parsed = Date.parse(value);
    if (!Number.isFinite(parsed)) return value;
    return new Date(parsed).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  }

  function routeLabel(): string {
    const direction = profile?.direction?.trim() || 'NOBO';
    if (!hasMile) return `AT - ${direction.toUpperCase()} - SET MILE`;
    return `AT - ${direction.toUpperCase()} - MILE ${currentMile.toFixed(1)}`;
  }

  function targetLabel(): string {
    if (!hasMile) return 'Set a mile to load the next window.';
    return `Working window: mile ${currentMile.toFixed(1)} to ${targetMile.toFixed(1)}.`;
  }

  function askHref(text = prompt): string {
    const url = new URL('/app/scout', 'https://hoggcountry.local');
    if (text.trim()) url.searchParams.set('prompt', text.trim());
    return `${url.pathname}${url.search}`;
  }

  function buildFallbackBriefPrompt(): string {
    if (!profile) {
      return 'Build a conservative Scout trail brief. I have not set my profile yet, so ask only for the smallest missing facts needed for today.';
    }

    return [
      `Build my Today HUD from AT mile ${profile.currentMile.toFixed(1)} ${profile.direction}.`,
      `Use a ${profile.targetPace.toFixed(1)} mile planning pace and ${profile.waterCapacityLiters.toFixed(1)}L water capacity.`,
      'Include upcoming elevation/terrain concerns, water, shelter, resupply pressure, risk, and what needs a current source check.'
    ].join(' ');
  }
</script>

<section class="today-hud" aria-label="Scout Today HUD">
  <header class="hud-hero">
    <div class="hud-status-row">
      <span class:online class:offline={!online}>{online ? 'Online' : 'Offline ready'}</span>
      <span>{sourceLine}</span>
      {#if installPrompt}
        <button type="button" onclick={installApp}>Install</button>
      {/if}
    </div>

    <div class="hero-grid">
      <div class="hero-copy">
        <p class="home-kicker">Today HUD</p>
        <h1>Scout</h1>
        <p class="route-chip">{routeLabel()}</p>
      </div>

      <article class="mile-dial" aria-label="Current AT mile">
        <span>Current mile</span>
        <strong>{hasMile ? currentMile.toFixed(1) : '--'}</strong>
        <small>{phase?.label ?? 'Profile not set'}</small>
      </article>
    </div>

    <div class="trail-progress" aria-hidden="true">
      <span style={`width:${progressPercent}%`}></span>
    </div>
    <a class="journey-link" href="/app/progress">
      Your journey — {hasMile ? `mile ${currentMile.toFixed(1)} of ${TRAIL_FACTS.totalMiles.toLocaleString()}` : 'see the whole trail'} →
    </a>
  </header>

  <section class="hud-strip" aria-label="Trail status">
    <article>
      <span>Next target</span>
      <strong>{hasMile ? targetMile.toFixed(1) : '--'}</strong>
      <small>{targetLabel()}</small>
    </article>
    <article>
      <span>Risk</span>
      <strong>{primaryRisk ? primaryRisk.severity : 'Check'}</strong>
      <small>{primaryRisk?.label ?? 'Refresh live sources before relying on weather, closures, or town details.'}</small>
    </article>
    <article>
      <span>Context</span>
      <strong>{contextCount > 0 ? contextCount : '--'}</strong>
      <small>{contextCount > 0 ? 'Saved docs and sources' : 'No saved docs yet'}</small>
    </article>
  </section>

  <form class="ask-card" action="/app/scout" method="get" aria-label="Ask Scout">
    <label class="sr-only" for="home-prompt">Ask Scout</label>
    <input id="home-prompt" name="prompt" bind:value={prompt} placeholder="Ask Scout about today" autocomplete="off" />
    <button type="submit" aria-label="Send to Scout" disabled={!prompt.trim()}>
      <span aria-hidden="true">Go</span>
    </button>
  </form>

  <div class="primary-actions">
    <a class="primary-link" href={askHref(briefPrompt)}>Build trail brief</a>
    <button type="button" onclick={updateFromGps} disabled={locationBusy}>{locationBusy ? 'Checking GPS' : 'Use GPS'}</button>
    <button type="button" onclick={() => saveFieldPack()} disabled={fieldPackBusy}>{fieldPackBusy ? 'Saving pack' : 'Save pack'}</button>
  </div>

  <section class="mile-editor" id="manual-mile" aria-label="Manual mile update">
    <div>
      <strong>Manual mile</strong>
      <small>Use this when GPS is noisy or off trail.</small>
    </div>
    <input type="number" inputmode="decimal" min="0" max={TRAIL_FACTS.totalMiles} step="0.1" bind:value={mileDraft} placeholder="0.0" />
    <button type="button" onclick={saveMile} disabled={mileBusy}>{mileBusy ? 'Saving' : 'Set'}</button>
  </section>

  {#if locationNotice}<p class="hud-note success-note">{locationNotice}</p>{/if}
  {#if locationError}<p class="hud-note error-note">{locationError}</p>{/if}
  {#if mileNotice}<p class="hud-note success-note">{mileNotice}</p>{/if}
  {#if mileError}<p class="hud-note error-note">{mileError}</p>{/if}
  {#if fieldPackError}<p class="hud-note error-note">{fieldPackError}</p>{/if}

  <section class="cue-panel" aria-label="Heads-up cues">
    <div class="section-heading">
      <p class="home-kicker">Up next</p>
      <h2>Trail cues</h2>
      <span>{sourceLine}</span>
    </div>

    <div class="cue-grid">
      {#each hudCues as cue}
        <article class="cue-card">
          <span>{cue.label}</span>
          <strong>{cue.value}</strong>
          <p>{cue.detail}</p>
        </article>
      {/each}
    </div>
  </section>

  <section class="trail-ahead" aria-label="Trail ahead brief">
    <div class="section-heading">
      <p class="home-kicker">Trail ahead</p>
      {#if trailAhead}<span>{trailAheadMileLine}</span>{/if}
    </div>

    {#if trailAheadLoading}
      <p class="trail-ahead-note">Checking weather and waypoints ahead...</p>
    {:else if trailAheadError}
      <p role="alert" style="margin:0; color:#8a2f2f; font-weight:700;">{trailAheadError}</p>
      <button class="btn btn-secondary" type="button" style="margin-top:0.6rem;" onclick={() => void loadTrailAhead()}>Try again</button>
    {:else if trailAheadUnavailable}
      <p class="trail-ahead-note">Set your mile to unlock the trail-ahead brief. Use the <a href="#manual-mile">manual mile editor</a> above.</p>
    {:else if trailAhead}
      {#if trailAhead.weather.length > 0}
        <div class="wx-strip">
          {#each trailAhead.weather.slice(0, 3) as day (day.date)}
            <article class="wx-day">
              <span>{weekdayLabel(day.date)}</span>
              <strong>{day.highF !== null ? Math.round(day.highF) : '--'}° / {day.lowF !== null ? Math.round(day.lowF) : '--'}°</strong>
              <small>{day.label}</small>
              <small>{day.precipChancePct !== null ? `${Math.round(day.precipChancePct)}% precip` : '-- precip'}{day.windMaxMph !== null ? ` · ${Math.round(day.windMaxMph)} mph wind` : ''}</small>
            </article>
          {/each}
        </div>
      {:else if trailAhead.weatherError}
        <p class="trail-ahead-note">{trailAhead.weatherError}</p>
      {/if}

      {#if trailAheadRows.length > 0}
        <div class="next-rows">
          <p class="home-kicker">Next on trail</p>
          <ul>
            {#each trailAheadRows as row (row.label)}
              <li>
                <span>{row.label}</span>
                <strong>{row.waypoint.name}</strong>
                <small>{row.waypoint.milesAhead.toFixed(1)} mi ahead</small>
              </li>
            {/each}
          </ul>
        </div>
      {/if}

      {#if trailAhead.terrainAhead}
        <p class="terrain-line">{terrainLine(trailAhead.terrainAhead)}</p>
      {/if}
    {/if}
  </section>

  <section class="quick-list" aria-label="Quick Scout prompts">
    <a class="quick-card" href={askHref('What is the safest next move from my current mile? Include water, terrain, shelter, and bailout checks.')}>
      <strong>Safe move</strong>
      <small>Next decision</small>
    </a>
    <a class="quick-card" href={askHref('Plan my next resupply from my current mile. Show food carry, town options, and what needs current confirmation.')}>
      <strong>Resupply</strong>
      <small>Food carry</small>
    </a>
    <a class="quick-card" href={askHref('Give me the next route hazards to watch for: elevation, rocky tread, water crossings, weather exposure, and bailout options.')}>
      <strong>Hazards</strong>
      <small>HUD scan</small>
    </a>
  </section>

  <section class="field-pack" aria-label="Offline field pack">
    <div>
      <strong>Field pack</strong>
      <small>{fieldPackStatus}</small>
    </div>
    <a href="/app/docs">Docs</a>
    <a href="/app/map">Map</a>
  </section>
</section>

<style>
  .today-hud {
    display: grid;
    gap: 0.82rem;
    width: min(100%, 760px);
    margin: 0 auto;
    padding: clamp(0.2rem, 2vw, 1rem) 0 1rem;
  }

  .hud-hero,
  .hud-strip article,
  .ask-card,
  .mile-editor,
  .cue-panel,
  .trail-ahead,
  .quick-card,
  .field-pack {
    border: 1px solid rgba(77, 89, 74, 0.13);
    background: rgba(255, 253, 248, 0.91);
    box-shadow: 0 14px 32px rgba(31, 41, 55, 0.07);
    color: #27332b;
  }

  .hud-hero {
    display: grid;
    gap: 1rem;
    overflow: hidden;
    border-radius: 28px;
    padding: clamp(0.82rem, 3vw, 1.1rem);
    background:
      radial-gradient(circle at 76% 18%, rgba(95, 128, 144, 0.16), transparent 11rem),
      linear-gradient(180deg, rgba(255, 253, 248, 0.96), rgba(241, 237, 224, 0.92));
  }

  .hud-status-row {
    display: flex;
    align-items: center;
    gap: 0.46rem;
    min-width: 0;
    color: #52604d;
    font-size: 0.74rem;
    font-weight: 900;
  }

  .hud-status-row span,
  .hud-status-row button {
    min-height: 2rem;
    border: 1px solid rgba(77, 89, 74, 0.12);
    border-radius: 999px;
    background: rgba(255, 253, 248, 0.82);
    padding: 0.42rem 0.68rem;
    white-space: nowrap;
  }

  .hud-status-row span:nth-child(2) {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .hud-status-row .online {
    color: #22573e;
    background: rgba(65, 130, 87, 0.12);
  }

  .hud-status-row .offline {
    color: #7f1d1d;
    background: rgba(127, 29, 29, 0.08);
  }

  .hud-status-row button {
    margin-left: auto;
    color: #27332b;
    cursor: pointer;
    font-weight: 900;
  }

  .hero-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(8.6rem, 0.42fr);
    align-items: end;
    gap: 0.8rem;
  }

  .hero-copy {
    display: grid;
    gap: 0.35rem;
    min-width: 0;
  }

  .home-kicker,
  .cue-card span,
  .hud-strip span,
  .mile-editor strong,
  .field-pack strong {
    margin: 0;
    color: var(--pine);
    font-family: Oswald, Impact, sans-serif;
    font-size: 0.72rem;
    font-weight: 900;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .hero-copy h1 {
    margin: 0;
    color: #2c2116;
    font-size: clamp(3.4rem, 14vw, 6.2rem);
    font-weight: 900;
    letter-spacing: 0.035em;
    line-height: 0.86;
    text-transform: uppercase;
  }

  .route-chip {
    width: fit-content;
    max-width: 100%;
    margin: 0;
    border: 1px solid rgba(77, 89, 74, 0.14);
    border-radius: 999px;
    background: rgba(255, 253, 248, 0.72);
    color: #52604d;
    font-size: 0.72rem;
    font-weight: 900;
    letter-spacing: 0.07em;
    overflow: hidden;
    padding: 0.36rem 0.68rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .mile-dial {
    display: grid;
    justify-items: end;
    gap: 0.18rem;
    min-width: 0;
    text-align: right;
  }

  .mile-dial span,
  .mile-dial small {
    color: #52604d;
    font-size: 0.74rem;
    font-weight: 850;
  }

  .mile-dial strong {
    color: #24362c;
    font-size: clamp(2.6rem, 10vw, 4.4rem);
    letter-spacing: -0.055em;
    line-height: 0.9;
  }

  .trail-progress {
    height: 0.55rem;
    overflow: hidden;
    border-radius: 999px;
    background: rgba(77, 89, 74, 0.12);
  }

  .trail-progress span {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #24362c, #7c8c64);
  }

  .journey-link {
    display: inline-block;
    margin-top: 0.5rem;
    color: var(--terra, #d97706);
    font-weight: 800;
    font-size: 0.82rem;
    text-decoration: none;
  }
  .journey-link:hover { text-decoration: underline; }

  .hud-strip,
  .cue-grid,
  .quick-list {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.58rem;
  }

  .hud-strip article {
    display: grid;
    gap: 0.22rem;
    min-height: 6.2rem;
    border-radius: 18px;
    padding: 0.78rem;
  }

  .hud-strip strong {
    color: #27332b;
    font-family: Oswald, Impact, sans-serif;
    font-size: 1.35rem;
    font-weight: 900;
    letter-spacing: 0.035em;
    line-height: 1;
    text-transform: uppercase;
  }

  .hud-strip small,
  .cue-card p,
  .field-pack small,
  .quick-card small,
  .mile-editor small,
  .section-heading span {
    color: var(--muted);
    font-size: 0.76rem;
    font-weight: 760;
    line-height: 1.28;
  }

  .ask-card {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.55rem;
    border-radius: 24px;
    padding: 0.72rem;
  }

  .ask-card input,
  .mile-editor input {
    min-width: 0;
    border: 1.5px solid rgba(51, 51, 51, 0.22);
    background: rgba(255, 255, 255, 0.82);
    color: #27332b;
    font-weight: 820;
  }

  .ask-card input {
    min-height: 3.65rem;
    border-radius: 16px;
    font-size: clamp(1rem, 3.5vw, 1.22rem);
    padding: 0.8rem 0.9rem;
  }

  .ask-card button,
  .primary-actions button,
  .mile-editor button {
    cursor: pointer;
    font-family: Oswald, Impact, sans-serif;
    font-weight: 900;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .ask-card button {
    display: grid;
    place-items: center;
    width: 3.35rem;
    height: 3.35rem;
    border-radius: 14px;
    background: var(--pine);
    color: #fffdf8;
  }

  .ask-card button:disabled,
  .primary-actions button:disabled,
  .mile-editor button:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  .primary-actions {
    display: grid;
    grid-template-columns: minmax(0, 1.25fr) repeat(2, minmax(0, 0.75fr));
    gap: 0.58rem;
  }

  .primary-link,
  .primary-actions button,
  .mile-editor button,
  .field-pack a {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 3rem;
    border-radius: 17px;
    text-decoration: none;
  }

  .primary-link {
    background: #24362c;
    color: #fffdf8;
    box-shadow: 0 12px 26px rgba(36, 54, 44, 0.14);
    font-family: Oswald, Impact, sans-serif;
    font-weight: 900;
    letter-spacing: 0.075em;
    text-transform: uppercase;
  }

  .primary-actions button,
  .mile-editor button,
  .field-pack a {
    border: 1px solid rgba(77, 89, 74, 0.14);
    background: #eef1e8;
    color: #27332b;
  }

  .mile-editor {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(6.4rem, 0.4fr) auto;
    align-items: center;
    gap: 0.54rem;
    border-radius: 18px;
    padding: 0.68rem 0.72rem;
  }

  .mile-editor div {
    display: grid;
    gap: 0.1rem;
    min-width: 0;
  }

  .mile-editor input {
    min-height: 2.55rem;
    border-radius: 12px;
    padding: 0 0.72rem;
  }

  .mile-editor button {
    min-height: 2.55rem;
    padding: 0 0.82rem;
  }

  .hud-note {
    margin: 0;
    border-radius: 16px;
    font-size: 0.84rem;
    font-weight: 820;
    padding: 0.7rem 0.82rem;
  }

  .success-note {
    background: rgba(237, 243, 229, 0.9);
    color: #27332b;
  }

  .error-note {
    background: rgba(127, 29, 29, 0.08);
    color: #7f1d1d;
  }

  .cue-panel {
    display: grid;
    gap: 0.72rem;
    border-radius: 24px;
    padding: 0.88rem;
  }

  .section-heading {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 0.8rem;
  }

  .section-heading h2 {
    margin: 0;
    color: #2c2116;
    font-size: clamp(1.7rem, 5vw, 2.55rem);
    line-height: 0.95;
  }

  .section-heading span {
    text-align: right;
  }

  .cue-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .cue-card {
    display: grid;
    gap: 0.24rem;
    min-height: 8.15rem;
    border: 1px solid rgba(77, 89, 74, 0.11);
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.54);
    padding: 0.78rem;
  }

  .cue-card strong {
    color: #27332b;
    font-family: Oswald, Impact, sans-serif;
    font-size: 1.24rem;
    font-weight: 900;
    letter-spacing: 0.04em;
    line-height: 1;
    text-transform: uppercase;
  }

  .cue-card p {
    margin: 0;
  }

  .trail-ahead {
    display: grid;
    gap: 0.62rem;
    border-radius: 24px;
    padding: 0.88rem;
  }

  .trail-ahead-note {
    margin: 0;
    color: var(--muted);
    font-size: 0.8rem;
    font-weight: 760;
    line-height: 1.3;
  }

  .trail-ahead-note a {
    color: #24362c;
    font-weight: 900;
  }

  .wx-strip {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.42rem;
  }

  .wx-day {
    display: grid;
    gap: 0.16rem;
    border: 1px solid rgba(77, 89, 74, 0.11);
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.54);
    padding: 0.56rem;
  }

  .wx-day span,
  .next-rows li span {
    color: var(--pine);
    font-family: Oswald, Impact, sans-serif;
    font-size: 0.62rem;
    font-weight: 900;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .wx-day strong {
    color: #27332b;
    font-family: Oswald, Impact, sans-serif;
    font-size: 1rem;
    font-weight: 900;
    letter-spacing: 0.03em;
    line-height: 1;
  }

  .wx-day small {
    color: var(--muted);
    font-size: 0.64rem;
    font-weight: 740;
    line-height: 1.25;
  }

  .next-rows {
    display: grid;
    gap: 0.34rem;
  }

  .next-rows ul {
    display: grid;
    gap: 0.3rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .next-rows li {
    display: grid;
    grid-template-columns: 4.1rem minmax(0, 1fr) auto;
    align-items: baseline;
    gap: 0.42rem;
  }

  .next-rows li strong {
    overflow: hidden;
    color: #27332b;
    font-size: 0.85rem;
    font-weight: 850;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .next-rows li small {
    color: var(--muted);
    font-size: 0.72rem;
    font-weight: 800;
    white-space: nowrap;
  }

  .terrain-line {
    margin: 0;
    color: #27332b;
    font-size: 0.78rem;
    font-weight: 800;
    line-height: 1.3;
  }

  .quick-card {
    display: grid;
    align-content: center;
    gap: 0.16rem;
    min-height: 4.5rem;
    border-radius: 16px;
    padding: 0.66rem;
    text-align: center;
    text-decoration: none;
  }

  .quick-card strong {
    color: #27332b;
    font-family: Oswald, Impact, sans-serif;
    font-size: 0.94rem;
    font-weight: 900;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .field-pack {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    align-items: center;
    gap: 0.48rem;
    border-radius: 16px;
    padding: 0.68rem 0.72rem;
  }

  .field-pack div {
    display: grid;
    gap: 0.1rem;
    min-width: 0;
  }

  .field-pack small {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .field-pack a {
    min-height: 2.2rem;
    border-radius: 12px;
    font-size: 0.82rem;
    font-weight: 900;
    padding: 0 0.76rem;
  }

  .sr-only {
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

  @media (max-width: 620px) {
    .today-hud {
      gap: 0.58rem;
      padding-top: max(0.2rem, env(safe-area-inset-top));
      padding-bottom: calc(5.8rem + env(safe-area-inset-bottom));
    }

    .hud-hero {
      border-radius: 22px;
      padding: 0.76rem;
    }

    .hud-status-row {
      gap: 0.34rem;
      font-size: 0.68rem;
    }

    .hud-status-row span,
    .hud-status-row button {
      padding-inline: 0.54rem;
    }

    .hero-grid {
      grid-template-columns: minmax(0, 1fr) minmax(6.7rem, 0.38fr);
      gap: 0.5rem;
    }

    .hero-copy h1 {
      font-size: clamp(2.8rem, 18vw, 4.25rem);
    }

    .mile-dial strong {
      font-size: clamp(2.25rem, 13vw, 3.3rem);
    }

    .route-chip {
      font-size: 0.66rem;
      letter-spacing: 0.045em;
    }

    .hud-strip,
    .quick-list {
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 0.42rem;
    }

    .hud-strip article {
      min-height: 5.05rem;
      border-radius: 15px;
      padding: 0.56rem 0.5rem;
    }

    .hud-strip span,
    .cue-card span,
    .mile-editor strong,
    .field-pack strong {
      font-size: 0.62rem;
      letter-spacing: 0.095em;
    }

    .hud-strip strong {
      font-size: 1.04rem;
    }

    .hud-strip small,
    .quick-card small,
    .cue-card p,
    .mile-editor small,
    .field-pack small {
      font-size: 0.66rem;
    }

    .ask-card {
      border-radius: 20px;
      padding: 0.58rem;
    }

    .ask-card input {
      min-height: 3.35rem;
      border-radius: 13px;
      font-size: 0.95rem;
      padding-inline: 0.78rem;
    }

    .ask-card button {
      width: 3rem;
      height: 3rem;
      border-radius: 12px;
      font-size: 0.82rem;
    }

    .primary-actions {
      grid-template-columns: minmax(0, 1fr) 0.72fr;
      gap: 0.42rem;
    }

    .primary-actions button:last-child {
      display: none;
    }

    .primary-link,
    .primary-actions button {
      min-height: 2.8rem;
      border-radius: 15px;
      font-size: 0.84rem;
    }

    .mile-editor {
      grid-template-columns: minmax(0, 1fr) minmax(5.4rem, 0.38fr) auto;
      gap: 0.42rem;
      padding: 0.58rem;
    }

    .mile-editor input,
    .mile-editor button {
      min-height: 2.35rem;
    }

    .cue-panel {
      border-radius: 20px;
      padding: 0.68rem;
    }

    .section-heading {
      align-items: start;
    }

    .section-heading h2 {
      font-size: 1.65rem;
    }

    .section-heading span {
      max-width: 12ch;
      font-size: 0.65rem;
    }

    .cue-grid {
      gap: 0.42rem;
    }

    .cue-card {
      min-height: 7.2rem;
      border-radius: 15px;
      padding: 0.58rem;
    }

    .cue-card strong {
      font-size: 1rem;
    }

    .trail-ahead {
      border-radius: 20px;
      padding: 0.68rem;
    }

    .wx-strip {
      gap: 0.34rem;
    }

    .wx-day {
      padding: 0.5rem 0.44rem;
    }

    .next-rows li {
      grid-template-columns: 3.5rem minmax(0, 1fr) auto;
    }

    .quick-card {
      min-height: 4.05rem;
      border-radius: 14px;
      padding: 0.52rem 0.42rem;
    }

    .quick-card strong {
      font-size: 0.76rem;
      letter-spacing: 0.035em;
    }

    .field-pack {
      grid-template-columns: minmax(0, 1fr) auto auto;
      padding: 0.58rem;
    }

    .field-pack a {
      min-height: 2.05rem;
      padding-inline: 0.58rem;
    }
  }

  @media (max-width: 390px) {
    .hud-strip article:nth-child(3) {
      display: none;
    }

    .hud-strip {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
