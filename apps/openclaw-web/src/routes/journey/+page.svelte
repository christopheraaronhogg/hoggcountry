<script lang="ts">
  import WaitlistSignup from '$lib/components/WaitlistSignup.svelte';
  import type { PageData } from './$types';
  import type { JourneyState } from '$lib/server/journey';

  const { data } = $props<{ data: PageData }>();
  const journey = $derived(data.journey);
  const s = $derived(journey.summary);

  function fmtMile(m: number): string {
    return m.toLocaleString('en-US', { maximumFractionDigits: 1 });
  }
  function fmtDate(iso: string | null): string {
    if (!iso) return '';
    const t = Date.parse(iso);
    if (!Number.isFinite(t)) return '';
    return new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  function statusLabel(status: JourneyState['status']): string {
    return status === 'done' ? 'Completed' : status === 'current' ? 'On trail now' : 'Ahead';
  }
  function stateProgressLeft(state: JourneyState): number {
    // marker position within the current state's bar
    return state.percentThrough ?? 0;
  }

  // --- Elevation profile (whole-trail silhouette) ---
  const elev = $derived(data.journey.elevation);
  const EW = 1000;
  const EH = 200;
  const EPAD_T = 14;
  const EPAD_B = 2;
  const elevCeil = $derived(Math.max(500, Math.ceil((elev.maxFt || 1) / 500) * 500));
  function ex(mile: number): number {
    return s.totalMiles > 0 ? (mile / s.totalMiles) * EW : 0;
  }
  function ey(ft: number): number {
    return EPAD_T + (1 - ft / elevCeil) * (EH - EPAD_T - EPAD_B);
  }
  const elevAhead = $derived.by(() => {
    if (elev.points.length < 2) return '';
    let d = `M 0 ${EH}`;
    for (const p of elev.points) d += ` L ${ex(p.mile).toFixed(1)} ${ey(p.ft).toFixed(1)}`;
    return `${d} L ${EW} ${EH} Z`;
  });
  const elevDone = $derived.by(() => {
    if (s.isPreview || elev.points.length < 2) return '';
    const cm = s.currentMile;
    const pts = elev.points.filter((p: { mile: number; ft: number }) => p.mile <= cm);
    if (pts.length < 2) return '';
    let d = `M 0 ${EH}`;
    for (const p of pts) d += ` L ${ex(p.mile).toFixed(1)} ${ey(p.ft).toFixed(1)}`;
    return `${d} L ${ex(cm).toFixed(1)} ${EH} Z`;
  });
  const currentFt = $derived.by(() => {
    if (!elev.points.length) return 0;
    let best = elev.points[0];
    for (const p of elev.points) if (Math.abs(p.mile - s.currentMile) < Math.abs(best.mile - s.currentMile)) best = p;
    return best.ft;
  });
</script>

<svelte:head>
  <title>The Journey | Hogg Country</title>
  <meta
    name="description"
    content="Follow Dad's 2026 Appalachian Trail thru-hike, mile by mile — live position, states behind and ahead, landmarks reached, and dispatches from the trail."
  />
  <link rel="canonical" href="https://hoggcountry.com/journey" />
</svelte:head>

<div class="journey">
  <!-- HERO -->
  <header class="hero">
    <p class="kicker">The Journey · 2026 NOBO</p>
    {#if s.isPreview}
      <h1>The climb to Katahdin starts soon.</h1>
      <p class="lede">
        {fmtMile(s.totalMiles)} miles from Springer Mountain, Georgia to Katahdin, Maine — across 14 states.
        Live tracking lights up the moment Dad takes his first northbound steps.
      </p>
    {:else}
      <h1>Mile {fmtMile(s.currentMile)} of {fmtMile(s.totalMiles)}.</h1>
      <p class="lede">
        {#if s.currentStateName}Currently in <strong>{s.currentStateName}</strong>{' · '}{/if}{fmtMile(s.milesRemaining)} miles to Katahdin.
      </p>
    {/if}

    <div class="rail" role="img" aria-label={`${s.percentComplete}% of the trail complete`}>
      <div class="rail-fill" style:width={`${s.percentComplete}%`}></div>
      <div class="rail-marker" style:left={`${s.percentComplete}%`} title={`Mile ${fmtMile(s.currentMile)}`}></div>
      <span class="rail-end rail-end--start">Springer</span>
      <span class="rail-end rail-end--finish">Katahdin</span>
    </div>

    <dl class="stats">
      <div><dt>Complete</dt><dd>{s.percentComplete}%</dd></div>
      <div><dt>Miles hiked</dt><dd>{fmtMile(s.milesHiked)}</dd></div>
      <div><dt>To Katahdin</dt><dd>{fmtMile(s.milesRemaining)}</dd></div>
      {#if s.daysOnTrail > 0}<div><dt>Days on trail</dt><dd>{s.daysOnTrail}</dd></div>{/if}
      {#if s.paceMilesPerDay}<div><dt>Avg pace</dt><dd>{s.paceMilesPerDay} mi/day</dd></div>{/if}
    </dl>

    <div class="hero-links">
      <a class="btn btn--primary" href="/track">Live map</a>
      <a class="btn" href="/updates">Trail updates</a>
      <a class="btn" href="/guide">Field guide</a>
    </div>
    {#if s.latestFixAt}
      <p class="fix-note">Last Garmin fix {fmtDate(s.latestFixAt)} · {s.latestFixLabel}</p>
    {/if}
  </header>

  <!-- ELEVATION PROFILE -->
  {#if elev.points.length > 1}
    <figure class="elevation">
      <figcaption class="elev-head">
        <span class="elev-title">The whole climb</span>
        <span class="elev-sub">Springer to Katahdin · {elevCeil.toLocaleString()} ft scale</span>
      </figcaption>
      <svg viewBox={`0 0 ${EW} ${EH}`} preserveAspectRatio="none" class="elev-svg" role="img" aria-label={`Elevation profile of the full trail${s.isPreview ? '' : `, current position at mile ${fmtMile(s.currentMile)}`}`}>
        <path class="elev-ahead" d={elevAhead} />
        {#if elevDone}<path class="elev-done" d={elevDone} />{/if}
        {#if !s.isPreview}
          <line class="elev-line" x1={ex(s.currentMile)} y1="0" x2={ex(s.currentMile)} y2={EH} />
          <circle class="elev-dot" cx={ex(s.currentMile)} cy={ey(currentFt)} r="7" />
        {/if}
      </svg>
      <div class="elev-foot">
        <span>Springer · mi 0</span>
        {#if !s.isPreview}<span class="elev-here">Mile {fmtMile(s.currentMile)} · {currentFt.toLocaleString()} ft</span>{/if}
        <span>Katahdin · mi {fmtMile(s.totalMiles)}</span>
      </div>
    </figure>
  {/if}

  <!-- TIMELINE -->
  <ol class="timeline" aria-label="Appalachian Trail journey by state">
    {#each journey.states as state (state.id)}
      <li class={`station station--${state.status}`}>
        <div class="station-spine" aria-hidden="true"><span class="node"></span></div>
        <div class="station-body">
          <div class="station-head">
            <div>
              <h2>{state.name}</h2>
              <p class="miles">Mile {fmtMile(state.entryMile)} – {fmtMile(state.exitMile)} · {fmtMile(state.miles)} mi</p>
            </div>
            <span class={`pill pill--${state.status}`}>{statusLabel(state.status)}</span>
          </div>

          {#if state.status === 'current'}
            <div class="state-rail" role="img" aria-label={`${state.percentThrough}% through ${state.name}`}>
              <div class="state-rail-fill" style:width={`${stateProgressLeft(state)}%`}></div>
            </div>
            <p class="here">📍 You are here — {state.percentThrough}% through {state.name}</p>
          {/if}

          {#if state.milestones.length}
            <ul class="milestones">
              {#each state.milestones as ms (ms.mile)}
                <li class={ms.reached ? 'reached' : ''}><span class="emoji">{ms.emoji}</span> {ms.name} <small>mi {fmtMile(ms.mile)}</small></li>
              {/each}
            </ul>
          {/if}

          {#if state.landmarks.length}
            <ul class="landmarks">
              {#each state.landmarks as lm (lm.name)}
                <li class={lm.reached ? 'reached' : 'ahead'}>
                  <span class="lm-dot" aria-hidden="true"></span>
                  <span class="lm-main">
                    <strong>{lm.name}</strong>
                    <span class="lm-mile">mi {fmtMile(lm.mile)}{#if lm.elevationFt}{' · '}{lm.elevationFt.toLocaleString('en-US')} ft{/if}</span>
                    {#if lm.significance}<span class="lm-sig">{lm.significance}</span>{/if}
                  </span>
                </li>
              {/each}
            </ul>
          {/if}

          {#if state.dispatches.length}
            <div class="dispatches">
              {#each state.dispatches as d (d.id)}
                <article class="dispatch">
                  <header>
                    <span class="d-mile">mi {fmtMile(d.trailMile ?? 0)}</span>
                    {#if d.publishedAt}<time>{fmtDate(d.publishedAt)}</time>{/if}
                  </header>
                  <h3>{d.title}</h3>
                  {#if d.body}<p>{d.body}</p>{/if}
                </article>
              {/each}
            </div>
          {/if}
        </div>
      </li>
    {/each}
  </ol>

  <!-- CTA -->
  <section class="cta">
    <h2>Want this for your own hike?</h2>
    <p>Hogg Country is becoming a trail companion app — your own map, your own miles, your own loadout. Get notified when it drops.</p>
    <WaitlistSignup source="journey" />
  </section>
</div>

<style>
  .journey {
    max-width: 52rem;
    margin: 0 auto;
    padding: clamp(1.5rem, 4vw, 3rem) 1rem 5rem;
  }

  /* HERO */
  .hero {
    text-align: center;
    display: grid;
    gap: 0.9rem;
    justify-items: center;
    padding-bottom: 2rem;
  }
  .kicker {
    margin: 0;
    color: var(--terra);
    font-weight: 900;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    font-size: 0.74rem;
  }
  .hero h1 {
    margin: 0;
    font-family: Oswald, Impact, sans-serif;
    font-size: clamp(2rem, 6vw, 3.4rem);
    line-height: 1.02;
    color: var(--ink);
  }
  .lede {
    margin: 0;
    max-width: 44ch;
    color: var(--muted);
    line-height: 1.6;
  }
  .lede strong { color: var(--pine); }

  .rail {
    position: relative;
    width: min(100%, 40rem);
    height: 12px;
    margin: 0.8rem 0 1.6rem;
    border-radius: 999px;
    background: rgba(77, 89, 74, 0.14);
  }
  .rail-fill {
    position: absolute;
    inset: 0 auto 0 0;
    border-radius: 999px;
    background: linear-gradient(90deg, var(--pine), var(--alpine));
    transition: width 0.6s ease;
  }
  .rail-marker {
    position: absolute;
    top: 50%;
    width: 18px;
    height: 18px;
    transform: translate(-50%, -50%);
    border-radius: 999px;
    background: var(--terra);
    border: 3px solid #fff;
    box-shadow: 0 0 0 4px rgba(217, 119, 6, 0.25);
  }
  .rail-end {
    position: absolute;
    top: 16px;
    font-size: 0.7rem;
    font-weight: 800;
    color: rgba(74, 84, 72, 0.7);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .rail-end--start { left: 0; }
  .rail-end--finish { right: 0; }

  .stats {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 1.4rem;
    justify-content: center;
    margin: 0;
  }
  .stats div { display: grid; gap: 0.1rem; }
  .stats dt {
    font-size: 0.68rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: rgba(74, 84, 72, 0.65);
  }
  .stats dd {
    margin: 0;
    font-family: Oswald, Impact, sans-serif;
    font-size: 1.5rem;
    color: var(--pine);
  }

  .hero-links { display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center; }
  .btn {
    display: inline-flex;
    align-items: center;
    min-height: 2.6rem;
    padding: 0 1.1rem;
    border-radius: 999px;
    border: 1px solid rgba(77, 89, 74, 0.2);
    background: rgba(255, 255, 255, 0.8);
    color: var(--pine);
    font-weight: 800;
    text-decoration: none;
  }
  .btn--primary { background: var(--pine); color: #fff; border-color: var(--pine); }
  .fix-note { margin: 0; font-size: 0.78rem; color: rgba(74, 84, 72, 0.6); font-weight: 700; }

  /* ELEVATION */
  .elevation {
    margin: 0 0 2.2rem;
    padding: 0.9rem 1rem 0.7rem;
    border: 1px solid var(--border);
    border-radius: 0.9rem;
    background: rgba(255, 255, 255, 0.75);
    box-shadow: var(--shadow-soft);
  }
  .elev-head { display: flex; align-items: baseline; justify-content: space-between; gap: 0.6rem; margin-bottom: 0.5rem; }
  .elev-title { font-family: Oswald, Impact, sans-serif; font-size: 1.05rem; color: var(--ink); }
  .elev-sub { font-size: 0.72rem; font-weight: 700; color: rgba(74, 84, 72, 0.6); }
  .elev-svg { display: block; width: 100%; height: clamp(110px, 26vw, 180px); }
  .elev-ahead { fill: rgba(77, 89, 74, 0.16); stroke: rgba(77, 89, 74, 0.4); stroke-width: 1; vector-effect: non-scaling-stroke; }
  .elev-done { fill: rgba(166, 181, 137, 0.5); stroke: var(--pine); stroke-width: 1.4; vector-effect: non-scaling-stroke; }
  .elev-line { stroke: var(--terra); stroke-width: 2; vector-effect: non-scaling-stroke; opacity: 0.85; }
  .elev-dot { fill: var(--terra); stroke: #fff; stroke-width: 2; }
  .elev-foot { display: flex; justify-content: space-between; gap: 0.5rem; margin-top: 0.4rem; font-size: 0.72rem; font-weight: 700; color: rgba(74, 84, 72, 0.7); }
  .elev-here { color: var(--terra); }

  /* TIMELINE */
  .timeline { list-style: none; margin: 0; padding: 0; }
  .station {
    display: grid;
    grid-template-columns: 28px 1fr;
    gap: 0.9rem;
  }
  .station-spine { position: relative; display: flex; justify-content: center; }
  .station-spine::before {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    width: 3px;
    background: rgba(77, 89, 74, 0.18);
  }
  .station:first-child .station-spine::before { top: 14px; }
  .station:last-child .station-spine::before { bottom: calc(100% - 14px); }
  .node {
    position: relative;
    z-index: 1;
    width: 16px;
    height: 16px;
    margin-top: 6px;
    border-radius: 999px;
    background: #fff;
    border: 3px solid rgba(77, 89, 74, 0.35);
  }
  .station--done .node { background: var(--pine); border-color: var(--pine); }
  .station--done .station-spine::before { background: var(--alpine); }
  .station--current .node {
    background: var(--terra);
    border-color: #fff;
    box-shadow: 0 0 0 4px rgba(217, 119, 6, 0.25);
  }
  .station-body { padding-bottom: 2rem; min-width: 0; }

  .station-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.6rem; }
  .station-head h2 {
    margin: 0;
    font-family: Oswald, Impact, sans-serif;
    font-size: 1.4rem;
    color: var(--ink);
  }
  .station--upcoming .station-head h2 { color: rgba(31, 41, 55, 0.55); }
  .miles { margin: 0.1rem 0 0; font-size: 0.82rem; color: var(--muted); font-weight: 700; }

  .pill {
    flex: none;
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
    font-size: 0.68rem;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    white-space: nowrap;
  }
  .pill--done { background: rgba(22, 101, 52, 0.12); color: var(--status-live); }
  .pill--current { background: var(--terra); color: #fff; }
  .pill--upcoming { background: rgba(77, 89, 74, 0.1); color: rgba(74, 84, 72, 0.7); }

  .state-rail {
    height: 8px;
    margin: 0.7rem 0 0.4rem;
    border-radius: 999px;
    background: rgba(217, 119, 6, 0.15);
  }
  .state-rail-fill { height: 100%; border-radius: 999px; background: var(--terra); transition: width 0.6s ease; }
  .here { margin: 0 0 0.4rem; font-weight: 800; color: var(--terra); font-size: 0.9rem; }

  .milestones { list-style: none; display: flex; flex-wrap: wrap; gap: 0.4rem; margin: 0.6rem 0 0; padding: 0; }
  .milestones li {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.25rem 0.55rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.8);
    border: 1px solid var(--border);
    font-size: 0.8rem;
    font-weight: 700;
    color: rgba(74, 84, 72, 0.55);
  }
  .milestones li.reached { color: var(--pine); border-color: var(--alpine); background: rgba(166, 181, 137, 0.18); }
  .milestones li small { color: inherit; opacity: 0.7; font-weight: 700; }

  .landmarks { list-style: none; margin: 0.8rem 0 0; padding: 0; display: grid; gap: 0.55rem; }
  .landmarks li { display: grid; grid-template-columns: 14px 1fr; gap: 0.55rem; align-items: start; }
  .lm-dot {
    width: 9px;
    height: 9px;
    margin-top: 0.35rem;
    border-radius: 999px;
    background: var(--alpine);
    box-shadow: 0 0 0 3px rgba(166, 181, 137, 0.25);
  }
  .landmarks li.ahead .lm-dot { background: rgba(77, 89, 74, 0.3); box-shadow: none; }
  .lm-main { display: grid; gap: 0.05rem; min-width: 0; }
  .lm-main strong { color: var(--ink); }
  .landmarks li.ahead .lm-main strong { color: rgba(31, 41, 55, 0.6); }
  .lm-mile { font-size: 0.76rem; font-weight: 700; color: rgba(74, 84, 72, 0.7); }
  .lm-sig { font-size: 0.85rem; color: var(--muted); line-height: 1.45; }

  .dispatches { display: grid; gap: 0.6rem; margin-top: 0.9rem; }
  .dispatch {
    border: 1px solid var(--border);
    border-left: 3px solid var(--terra);
    border-radius: 0.6rem;
    background: rgba(255, 255, 255, 0.8);
    padding: 0.7rem 0.85rem;
    box-shadow: var(--shadow-soft);
  }
  .dispatch header { display: flex; gap: 0.6rem; align-items: center; font-size: 0.72rem; font-weight: 800; color: rgba(74, 84, 72, 0.7); }
  .d-mile { color: var(--terra); }
  .dispatch h3 { margin: 0.25rem 0 0; font-size: 1rem; color: var(--ink); }
  .dispatch p { margin: 0.3rem 0 0; font-size: 0.9rem; color: var(--muted); line-height: 1.5; }

  /* CTA */
  .cta {
    margin-top: 1.5rem;
    padding: clamp(1.4rem, 4vw, 2.2rem);
    border-radius: 1rem;
    background: linear-gradient(135deg, var(--pine), #3a4438);
    color: #fff;
    text-align: center;
    display: grid;
    gap: 0.7rem;
    justify-items: center;
  }
  .cta h2 { margin: 0; font-family: Oswald, Impact, sans-serif; font-size: clamp(1.4rem, 4vw, 2rem); }
  .cta p { margin: 0; max-width: 46ch; color: rgba(255, 255, 255, 0.85); line-height: 1.55; }

  @media (min-width: 640px) {
    .station { grid-template-columns: 36px 1fr; gap: 1.2rem; }
  }

  @media (prefers-reduced-motion: reduce) {
    .rail-fill, .state-rail-fill { transition: none; }
  }
</style>
