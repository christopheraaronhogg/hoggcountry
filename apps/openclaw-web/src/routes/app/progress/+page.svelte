<script lang="ts">
  import { onMount } from 'svelte';

  // Wire shapes (mirror of $lib/server/journey, kept client-local since that
  // module is server-only).
  type Landmark = { name: string; mile: number; type: string; significance: string | null; elevationFt: number | null; reached: boolean };
  type Milestone = { mile: number; name: string; emoji: string; reached: boolean };
  type JState = {
    id: string; name: string; entryMile: number; exitMile: number; miles: number;
    status: 'done' | 'current' | 'upcoming'; percentThrough: number | null;
    landmarks: Landmark[]; milestones: Milestone[];
  };
  type Summary = {
    currentMile: number; totalMiles: number; percentComplete: number; milesHiked: number;
    milesRemaining: number; currentStateName: string | null; daysOnTrail: number;
    paceMilesPerDay: number | null; startDate: string; isPreview: boolean;
  };
  type JourneyResponse = {
    journey: { summary: Summary; states: JState[] };
    targetPace: number | null;
    hasProfile: boolean;
    trailName: string | null;
  };

  let data = $state<JourneyResponse | null>(null);
  let loading = $state(true);
  let loadFailed = $state(false);
  let busy = $state(false);
  let error = $state('');
  let mileDraft = $state('');
  let editing = $state(false);

  const summary = $derived(data?.journey.summary ?? null);
  const states = $derived(data?.journey.states ?? []);
  const nextMilestone = $derived.by(() => {
    for (const st of states) for (const m of st.milestones) if (!m.reached) return m;
    return null;
  });
  const nextLandmark = $derived.by(() => {
    for (const st of states) for (const l of st.landmarks) if (!l.reached) return l;
    return null;
  });
  const paceDelta = $derived.by(() => {
    if (!summary?.paceMilesPerDay || !data?.targetPace) return null;
    return Math.round((summary.paceMilesPerDay - data.targetPace) * 10) / 10;
  });

  function miFmt(n: number | null | undefined): string {
    return typeof n === 'number' ? n.toLocaleString('en-US', { maximumFractionDigits: 1 }) : '--';
  }

  async function fetchJourney(): Promise<void> {
    try {
      const res = await fetch('/app-api/workspace/journey', { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`journey ${res.status}`);
      data = (await res.json()) as JourneyResponse;
      loadFailed = false;
      if (summary && !summary.isPreview) mileDraft = summary.currentMile.toFixed(1);
    } catch {
      loadFailed = true;
    } finally {
      loading = false;
    }
  }

  async function saveMile(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    const mile = Number(mileDraft);
    if (busy || !Number.isFinite(mile) || mile < 0 || mile > 2197.4) {
      error = 'Enter a mile between 0 and 2,197.4.';
      return;
    }
    busy = true;
    error = '';
    try {
      const res = await fetch('/app-api/workspace/profile/current-mile', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ currentMile: mile })
      });
      if (!res.ok) throw new Error('Could not save your mile. Set up your hiker profile first.');
      editing = false;
      await fetchJourney();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Could not save your mile.';
    } finally {
      busy = false;
    }
  }

  onMount(fetchJourney);
</script>

<svelte:head>
  <title>Your Journey | Hogg Country</title>
</svelte:head>

<section class="progress">
  <header class="head">
    <div>
      <p class="eyebrow">Your journey</p>
      <h1>{data?.trailName ? `${data.trailName}'s trail` : 'The whole trail, your miles'}</h1>
    </div>
    <a class="ghost" href="/app">← Today</a>
  </header>

  {#if loading}
    <p class="muted">Loading your progress…</p>
  {:else if loadFailed}
    <div class="notice">
      <p>Couldn't load your journey. <button type="button" onclick={fetchJourney}>Retry</button></p>
    </div>
  {:else if summary}
    <!-- HERO STATS -->
    <div class="hero-card">
      {#if summary.isPreview}
        <p class="big">Mile 0 — ready to start</p>
        <p class="muted">Log your current mile to light up your progress across all {miFmt(summary.totalMiles)} miles.</p>
      {:else}
        <p class="big">Mile {miFmt(summary.currentMile)} <span class="of">of {miFmt(summary.totalMiles)}</span></p>
        <p class="sub">{summary.percentComplete}% complete · {miFmt(summary.milesRemaining)} mi to Katahdin{#if summary.currentStateName}{` · ${summary.currentStateName}`}{/if}</p>
      {/if}

      <div class="rail"><span class="rail-fill" style:width={`${summary.percentComplete}%`}></span><span class="rail-marker" style:left={`${summary.percentComplete}%`}></span></div>

      <dl class="stats">
        {#if summary.daysOnTrail > 0}<div><dt>Days out</dt><dd>{summary.daysOnTrail}</dd></div>{/if}
        {#if summary.paceMilesPerDay}<div><dt>Your pace</dt><dd>{summary.paceMilesPerDay}<small>mi/day</small></dd></div>{/if}
        {#if data?.targetPace}<div><dt>Target</dt><dd>{data.targetPace}<small>mi/day</small></dd></div>{/if}
        {#if paceDelta !== null}<div class={paceDelta >= 0 ? 'good' : 'behind'}><dt>vs target</dt><dd>{paceDelta >= 0 ? '+' : ''}{paceDelta}</dd></div>{/if}
      </dl>

      {#if nextMilestone || nextLandmark}
        <p class="nextup">
          {#if nextMilestone}<span>{nextMilestone.emoji} Next milestone: <strong>{nextMilestone.name}</strong> at mi {miFmt(nextMilestone.mile)}</span>{/if}
          {#if nextLandmark}<span>Next landmark: <strong>{nextLandmark.name}</strong> at mi {miFmt(nextLandmark.mile)}</span>{/if}
        </p>
      {/if}

      <!-- LOG MILE -->
      {#if editing || summary.isPreview}
        <form class="log-form" onsubmit={saveMile}>
          <label>
            <span class="eyebrow">Your current mile</span>
            <input type="number" inputmode="decimal" step="0.1" min="0" max="2197.4" bind:value={mileDraft} placeholder="e.g. 412.5" />
          </label>
          <div class="log-actions">
            <button class="primary" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save mile'}</button>
            {#if editing && !summary.isPreview}<button class="ghost" type="button" onclick={() => (editing = false)}>Cancel</button>{/if}
          </div>
        </form>
      {:else}
        <button class="logtoggle" type="button" onclick={() => { editing = true; mileDraft = summary.currentMile.toFixed(1); }}>Log today's mile</button>
      {/if}
      {#if error}<p class="err">{error}</p>{/if}
    </div>

    <!-- TIMELINE -->
    <ol class="timeline">
      {#each states as st (st.id)}
        <li class={`station station--${st.status}`}>
          <span class="node" aria-hidden="true"></span>
          <div class="body">
            <div class="row">
              <h2>{st.name}</h2>
              <span class={`pill pill--${st.status}`}>{st.status === 'done' ? 'Done' : st.status === 'current' ? 'Here' : 'Ahead'}</span>
            </div>
            <p class="miles">Mile {miFmt(st.entryMile)}–{miFmt(st.exitMile)} · {miFmt(st.miles)} mi{#if st.percentThrough !== null}{` · ${st.percentThrough}% through`}{/if}</p>
            {#if st.landmarks.length}
              <ul class="lms">
                {#each st.landmarks as l (l.name)}
                  <li class={l.reached ? 'reached' : 'ahead'}>{l.name} <small>mi {miFmt(l.mile)}</small></li>
                {/each}
              </ul>
            {/if}
          </div>
        </li>
      {/each}
    </ol>
  {/if}
</section>

<style>
  .progress { max-width: 44rem; margin: 0 auto; padding: 1rem 0.25rem 4rem; display: grid; gap: 1.1rem; }
  .head { display: flex; align-items: flex-end; justify-content: space-between; gap: 1rem; }
  .eyebrow { margin: 0; font-size: 0.68rem; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: var(--terra, #d97706); }
  .head h1 { margin: 0.1rem 0 0; font-family: Oswald, sans-serif; font-size: clamp(1.5rem, 5vw, 2.1rem); color: var(--ink, #1f2937); }
  .ghost { color: var(--pine, #4d594a); text-decoration: none; font-weight: 700; font-size: 0.9rem; border: 1px solid rgba(77,89,74,0.2); border-radius: 999px; padding: 0.35rem 0.8rem; background: none; cursor: pointer; }
  .muted { color: var(--muted, #4a5448); }
  .notice button { background: none; border: 0; color: var(--terra); font-weight: 800; cursor: pointer; text-decoration: underline; }

  .hero-card { background: var(--card, #fff); border: 1px solid var(--border, #e6e1d4); border-radius: 1rem; padding: 1.1rem 1.2rem; box-shadow: var(--shadow-soft); display: grid; gap: 0.7rem; }
  .big { margin: 0; font-family: Oswald, sans-serif; font-size: clamp(1.6rem, 6vw, 2.4rem); color: var(--ink); }
  .big .of { color: var(--muted); font-size: 0.55em; }
  .sub { margin: 0; color: var(--muted); font-weight: 600; }

  .rail { position: relative; height: 12px; border-radius: 999px; background: rgba(77,89,74,0.14); }
  .rail-fill { position: absolute; inset: 0 auto 0 0; border-radius: 999px; background: linear-gradient(90deg, var(--pine), var(--alpine)); }
  .rail-marker { position: absolute; top: 50%; width: 18px; height: 18px; transform: translate(-50%,-50%); border-radius: 999px; background: var(--terra); border: 3px solid #fff; box-shadow: 0 0 0 4px rgba(217,119,6,0.25); }

  .stats { display: flex; flex-wrap: wrap; gap: 0.4rem 1.3rem; margin: 0; }
  .stats div { display: grid; gap: 0.05rem; }
  .stats dt { font-size: 0.62rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.07em; color: rgba(74,84,72,0.6); }
  .stats dd { margin: 0; font-family: Oswald, sans-serif; font-size: 1.4rem; color: var(--pine); }
  .stats dd small { font-size: 0.55em; color: var(--muted); margin-left: 0.15rem; }
  .stats .good dd { color: var(--status-live, #166534); }
  .stats .behind dd { color: var(--terra); }

  .nextup { margin: 0; display: grid; gap: 0.2rem; font-size: 0.85rem; color: var(--muted); }
  .nextup strong { color: var(--ink); }

  .log-form { display: grid; gap: 0.5rem; border-top: 1px solid var(--border); padding-top: 0.8rem; }
  .log-form input { width: 100%; padding: 0.6rem 0.7rem; border: 1px solid var(--border); border-radius: 0.5rem; font-size: 1rem; }
  .log-actions { display: flex; gap: 0.5rem; }
  .primary { background: var(--pine); color: #fff; border: 0; border-radius: 999px; padding: 0.55rem 1.2rem; font-weight: 800; cursor: pointer; }
  .primary:disabled { opacity: 0.6; }
  .logtoggle { justify-self: start; background: var(--marker, #f0e000); color: #2b2f26; border: 0; border-radius: 999px; padding: 0.55rem 1.2rem; font-weight: 800; cursor: pointer; }
  .err { margin: 0; color: #b91c1c; font-size: 0.85rem; font-weight: 700; }

  .timeline { list-style: none; margin: 0; padding: 0; }
  .station { display: grid; grid-template-columns: 18px 1fr; gap: 0.8rem; }
  .node { position: relative; width: 14px; height: 14px; margin-top: 5px; border-radius: 999px; background: #fff; border: 3px solid rgba(77,89,74,0.3); }
  .station::before { content: ''; grid-column: 1; grid-row: 1; justify-self: center; width: 3px; background: rgba(77,89,74,0.15); margin-top: 14px; }
  .station--done .node { background: var(--pine); border-color: var(--pine); }
  .station--current .node { background: var(--terra); border-color: #fff; box-shadow: 0 0 0 4px rgba(217,119,6,0.25); }
  .body { padding-bottom: 1.4rem; min-width: 0; }
  .row { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
  .row h2 { margin: 0; font-family: Oswald, sans-serif; font-size: 1.2rem; color: var(--ink); }
  .station--upcoming .row h2 { color: rgba(31,41,55,0.5); }
  .miles { margin: 0.1rem 0 0; font-size: 0.78rem; color: var(--muted); font-weight: 600; }
  .pill { padding: 0.15rem 0.5rem; border-radius: 999px; font-size: 0.62rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; flex: none; }
  .pill--done { background: rgba(22,101,52,0.12); color: var(--status-live, #166534); }
  .pill--current { background: var(--terra); color: #fff; }
  .pill--upcoming { background: rgba(77,89,74,0.1); color: rgba(74,84,72,0.65); }
  .lms { list-style: none; margin: 0.5rem 0 0; padding: 0; display: flex; flex-wrap: wrap; gap: 0.3rem 0.6rem; }
  .lms li { font-size: 0.8rem; color: var(--pine); font-weight: 600; }
  .lms li.ahead { color: rgba(74,84,72,0.5); }
  .lms li small { color: rgba(74,84,72,0.55); font-weight: 600; }
</style>
