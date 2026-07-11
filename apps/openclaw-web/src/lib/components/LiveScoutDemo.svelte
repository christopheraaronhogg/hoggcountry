<script lang="ts">
  import { onMount } from 'svelte';
  import {
    summarizeLiveFieldPack,
    type LiveFieldPackSummary
  } from '$lib/live-field-pack-demo';

  let summary = $state<LiveFieldPackSummary | null>(null);
  let rawPayload = $state<unknown>(null);
  let loading = $state(true);
  let errorMessage = $state('');

  onMount(() => {
    void loadPack();
    const ageTimer = window.setInterval(() => {
      if (rawPayload) summary = summarizeLiveFieldPack(rawPayload);
    }, 60_000);
    return () => window.clearInterval(ageTimer);
  });

  async function loadPack() {
    loading = true;
    errorMessage = '';
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12_000);
    try {
      const response = await fetch('/scout/field-pack', {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
        signal: controller.signal
      });
      if (!response.ok) throw new Error(`Field pack returned ${response.status}`);
      rawPayload = await response.json();
      summary = summarizeLiveFieldPack(rawPayload);
      if (summary.status === 'unavailable') errorMessage = summary.message;
    } catch {
      errorMessage = 'Dad’s live Scout field pack could not be reached. No demo values were substituted.';
    } finally {
      window.clearTimeout(timeout);
      loading = false;
    }
  }

  function distance(value: number): string {
    return value === 0 ? 'here' : `${value.toFixed(1)} mi ahead`;
  }
</script>

<section class="live-demo" aria-labelledby="live-demo-title">
  <div class="live-head">
    <div>
      <p class="eyebrow"><span class="live-dot" aria-hidden="true"></span> Same field pack as the phone</p>
      <h2 id="live-demo-title">Dad is the live test hiker.</h2>
      <p>Scout turns his latest Garmin position into the small set of facts he needs on trail.</p>
    </div>
    <button type="button" onclick={loadPack} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh live data'}</button>
  </div>

  <div class="live-body" aria-live="polite" aria-busy={loading}>
    {#if summary?.status === 'ready'}
      <div class="status-row">
        <strong class:warning={summary.isExpired || summary.isPreview}>
          {summary.isExpired ? 'Cached pack expired' : summary.isPreview ? 'Preview location' : 'Live field pack'}
        </strong>
        <span>Pack {summary.packAgeLabel}</span>
        {#if summary.fixAgeLabel}<span>Garmin fix {summary.fixAgeLabel}</span>{/if}
      </div>

      <div class="field-grid">
        <article class="field-card position">
          <p class="card-label">Current position</p>
          <p class="mile">Mile {summary.currentMile.toFixed(1)}</p>
          <p>{summary.trailName} · {summary.direction}{summary.dayNumber ? ` · Day ${summary.dayNumber}` : ''}</p>
        </article>

        <article class="field-card">
          <p class="card-label">Next mapped water</p>
          {#if summary.nextWater}
            <h3>{summary.nextWater.name}</h3>
            <p>{distance(summary.nextWater.milesAhead)} · {summary.nextWater.reliability ?? 'unverified'}</p>
            <p class="verify">Confirm flow and potability before relying on it.</p>
          {:else}
            <h3>Not available</h3>
            <p class="verify">Scout has no verified water candidate ahead in this pack.</p>
          {/if}
        </article>

        <article class="field-card">
          <p class="card-label">Next shelter candidate</p>
          {#if summary.nextShelter}
            <h3>{summary.nextShelter.name}</h3>
            <p>{distance(summary.nextShelter.milesAhead)}</p>
            <p class="verify">Not Dad’s chosen camp. Verify status, rules, and water.</p>
          {:else}
            <h3>Not available</h3>
            <p class="verify">No shelter candidate is available in this pack.</p>
          {/if}
        </article>

        <article class="field-card">
          <p class="card-label">Current weather check</p>
          {#if summary.weather}
            <h3>{summary.weather.summary.replace(/^NWS\s+/u, '')}</h3>
            <p>{summary.weather.highF}° / {summary.weather.lowF}° · wind {summary.weather.windMph} mph</p>
            <p class="verify">{summary.weather.sourceLabel}</p>
          {:else}
            <h3>Official forecast unavailable</h3>
            <p class="verify">Scout will not substitute Dad’s old forecast.</p>
          {/if}
        </article>
      </div>

      <details>
        <summary>What Scout still needs Dad to verify</summary>
        <p>{summary.notice}</p>
      </details>
      <p class="demo-links"><a href="/journey">See Dad’s route and updates</a> · <a href="/app">Open the web app</a></p>
    {:else if loading && !summary}
      <p class="state">Reading Dad’s current field pack…</p>
    {:else}
      <div class="unavailable">
        <strong>Live data unavailable</strong>
        <p>{errorMessage || 'Dad’s live Scout field pack is unavailable right now.'}</p>
        <a href="/journey">Open the live journey instead →</a>
      </div>
    {/if}
  </div>
</section>

<style>
  .live-demo { margin-top: 1.6rem; border: 1px solid rgba(77, 89, 74, 0.18); border-radius: 1.2rem; overflow: hidden; background: #f8f5ec; box-shadow: var(--shadow-soft); }
  .live-head { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: end; gap: 1rem; padding: clamp(1.2rem, 4vw, 1.8rem); background: linear-gradient(135deg, #263326, #435343); color: #fff; }
  .live-head h2 { margin: 0.25rem 0 0.35rem; font-family: Oswald, Impact, sans-serif; font-size: clamp(1.55rem, 5vw, 2.25rem); }
  .live-head p:not(.eyebrow) { margin: 0; max-width: 48ch; color: rgba(255, 255, 255, 0.78); line-height: 1.5; }
  .eyebrow { margin: 0; display: flex; align-items: center; gap: 0.5rem; text-transform: uppercase; letter-spacing: 0.12em; font-size: 0.67rem; font-weight: 900; color: #dbe8bc; }
  .live-dot { width: 0.55rem; height: 0.55rem; border-radius: 50%; background: #b9df73; box-shadow: 0 0 0 0.25rem rgba(185, 223, 115, 0.18); }
  button { min-height: 2.65rem; padding: 0 1rem; border: 1px solid rgba(255,255,255,0.35); border-radius: 999px; background: rgba(255,255,255,0.1); color: #fff; font: inherit; font-size: 0.82rem; font-weight: 850; cursor: pointer; }
  button:disabled { opacity: 0.65; cursor: wait; }
  .live-body { padding: clamp(1rem, 3vw, 1.4rem); }
  .status-row { display: flex; flex-wrap: wrap; gap: 0.45rem 0.8rem; align-items: center; margin-bottom: 0.9rem; font-size: 0.76rem; color: #647063; }
  .status-row strong { border-radius: 999px; padding: 0.25rem 0.55rem; background: #e2efd0; color: #365326; }
  .status-row strong.warning { background: #f4dfbe; color: #70400e; }
  .field-grid { display: grid; grid-template-columns: 1fr; gap: 0.7rem; }
  .field-card { min-width: 0; padding: 1rem; border: 1px solid rgba(77,89,74,0.13); border-radius: 0.9rem; background: rgba(255,255,255,0.88); }
  .field-card p { margin: 0.25rem 0 0; color: #4a5849; font-size: 0.84rem; line-height: 1.45; }
  .field-card .card-label { margin: 0 0 0.35rem; color: #926340; text-transform: uppercase; letter-spacing: 0.09em; font-weight: 900; font-size: 0.62rem; }
  .field-card h3, .mile { margin: 0; color: #202c20; font-family: Oswald, Impact, sans-serif; font-size: 1.2rem; line-height: 1.15; }
  .field-card .mile { font-size: 1.65rem; }
  .field-card .verify { color: #7a6758; font-size: 0.74rem; }
  details { margin-top: 0.8rem; border-top: 1px solid rgba(77,89,74,0.13); padding-top: 0.8rem; }
  summary { cursor: pointer; color: #6d4b32; font-size: 0.78rem; font-weight: 850; }
  details p { margin: 0.55rem 0 0; color: #5b655b; line-height: 1.55; font-size: 0.77rem; }
  .demo-links { margin: 0.8rem 0 0; text-align: right; color: #667064; font-size: 0.78rem; }
  a { color: var(--terra, #985f38); font-weight: 800; }
  .state, .unavailable { margin: 0; padding: 1.4rem 0.4rem; text-align: center; color: #5b655b; }
  .unavailable strong { color: #6d351f; }
  .unavailable p { margin: 0.4rem auto 0.75rem; max-width: 42ch; line-height: 1.5; }

  @media (min-width: 650px) {
    .field-grid { grid-template-columns: 1fr 1fr; }
  }
</style>
