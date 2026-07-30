<script lang="ts">
  import { onMount } from 'svelte';
  import guide from '$lib/data/northern-mountains-guide.json';

  type Mountain = (typeof guide.mountains)[number];

  let fromMile = $state(guide.guideStartMile);
  let search = $state('');

  const visibleMountains = $derived(
    guide.mountains.filter((mountain) =>
      mountain.summitMile >= fromMile &&
      mountain.name.toLowerCase().includes(search.trim().toLowerCase())
    )
  );

  onMount(() => {
    const raw = Number(new URLSearchParams(window.location.search).get('from'));
    if (Number.isFinite(raw)) {
      fromMile = Math.min(guide.terminusMile, Math.max(guide.guideStartMile, raw));
    }
  });

  function fmt(value: number, digits = 0): string {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    });
  }

  function mountainsForRegion(regionId: string): Mountain[] {
    return visibleMountains.filter((mountain) => mountain.regionId === regionId);
  }

  function scoreClass(score: number): string {
    if (score >= 8.5) return 'severe';
    if (score >= 7) return 'hard';
    if (score >= 5) return 'steady';
    return 'cruise';
  }

  function profilePath(points: Mountain['profile'], width = 240, height = 62): string {
    if (points.length < 2) return '';
    const elevations = points.map((point) => point.elevationFt);
    const min = Math.min(...elevations);
    const max = Math.max(...elevations);
    const span = Math.max(1, max - min);
    return points
      .map((point, index) => {
        const x = (index / (points.length - 1)) * width;
        const y = height - 5 - ((point.elevationFt - min) / span) * (height - 10);
        return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }

  function wholeProfilePath(width = 860, height = 180): string {
    const points = guide.summary.profile;
    const elevations = points.map((point) => point.elevationFt);
    const min = Math.min(...elevations);
    const max = Math.max(...elevations);
    const span = Math.max(1, max - min);
    return points
      .map((point, index) => {
        const x = (index / (points.length - 1)) * width;
        const y = height - 8 - ((point.elevationFt - min) / span) * (height - 18);
        return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }

  function expectation(mountain: Mountain): string {
    const effort = mountain.approachType === 'Ridge traverse'
      ? 'A ridge traverse rather than a fresh climb.'
      : `${mountain.inclineLabel} with about ${fmt(mountain.averageGainFtPerMile)} ft of gain per mile.`;
    const tread = mountain.rockinessScore >= 7.5
      ? 'Footing is a major pace limiter.'
      : mountain.rockinessScore >= 6
        ? 'Rocky tread will slow the clean hiking pace.'
        : 'Tread is the smaller part of the challenge here.';
    return `${effort} ${tread}`;
  }

  function setFromMile(value: number): void {
    fromMile = Math.min(guide.terminusMile, Math.max(guide.guideStartMile, value));
    const url = new URL(window.location.href);
    url.searchParams.set('from', fromMile.toFixed(1));
    history.replaceState({}, '', url);
  }
</script>

<svelte:head>
  <title>Mountains Ahead: Mile 1850 to Katahdin | Hogg Country</title>
  <meta
    name="description"
    content="A northbound Appalachian Trail mountain guide from mile 1,850 to Katahdin with calibrated miles, climb distance, elevation gain, grade, rockiness, and 1-10 difficulty."
  />
  <link rel="canonical" href="https://hoggcountry.com/mountains-ahead" />
</svelte:head>

<div class="mountain-guide">
  <header class="guide-hero">
    <div class="hero-copy">
      <a class="back-link" href="/journey">← The Journey</a>
      <p class="kicker">Dad's northern field reference · 2026 NOBO</p>
      <h1>Mountains<br /><span>ahead.</span></h1>
      <p class="lede">
        Every named mountain in the final {fmt(guide.summary.distanceMiles, 1)} miles, ordered northbound from
        mile {fmt(guide.guideStartMile)} to Baxter Peak.
      </p>
      <div class="hero-actions">
        <a class="pdf-link" href="/guides/hogg-country-at-mountains-mile-1850-to-katahdin.pdf">
          Download the PDF
        </a>
        <button type="button" onclick={() => window.print()}>Print this page</button>
      </div>
    </div>

    <div class="hero-profile" aria-label={`Elevation profile from mile ${guide.guideStartMile} to Katahdin`}>
      <svg viewBox="0 0 860 180" role="img" aria-hidden="true" preserveAspectRatio="none">
        <path class="profile-fill" d={`${wholeProfilePath()} L860,180 L0,180 Z`}></path>
        <path class="profile-line" d={wholeProfilePath()}></path>
      </svg>
      <div class="profile-axis">
        <span>Mile {fmt(guide.guideStartMile)}</span>
        <span>Katahdin · {fmt(guide.terminusMile, 1)}</span>
      </div>
    </div>

    <dl class="overview">
      <div>
        <dt>Trail ahead</dt>
        <dd>{fmt(guide.summary.distanceMiles, 1)}<small> mi</small></dd>
      </div>
      <div>
        <dt>Named mountains</dt>
        <dd>{guide.summary.mountainCount}</dd>
      </div>
      <div>
        <dt>Total climbing</dt>
        <dd>{fmt(guide.summary.gainFt / 1000, 1)}<small>k ft</small></dd>
      </div>
      <div>
        <dt>Total descent</dt>
        <dd>{fmt(guide.summary.lossFt / 1000, 1)}<small>k ft</small></dd>
      </div>
    </dl>
  </header>

  <section class="score-key" aria-labelledby="score-key-title">
    <div>
      <p class="section-number">How to read it</p>
      <h2 id="score-key-title">Difficulty is movement only.</h2>
      <p>
        The 1-10 score uses the same Hoggcountry formula as the live map: ascent first, then steep grade,
        rockiness, and descent. Weather and exposure can raise the real difficulty fast.
      </p>
    </div>
    <div class="scale" aria-label="Difficulty score key">
      <span class="cruise"><b>1-4.9</b> Cruise</span>
      <span class="steady"><b>5-6.9</b> Steady</span>
      <span class="hard"><b>7-8.4</b> Hard</span>
      <span class="severe"><b>8.5-10</b> Severe</span>
    </div>
  </section>

  <nav class="guide-controls" aria-label="Mountain guide controls">
    <label>
      <span>Start at mile</span>
      <input
        type="number"
        min={guide.guideStartMile}
        max={guide.terminusMile}
        step="0.1"
        value={fromMile}
        onchange={(event) => setFromMile(Number(event.currentTarget.value))}
      />
    </label>
    <label class="search-field">
      <span>Find a mountain</span>
      <input type="search" placeholder="Saddleback, Bigelow…" bind:value={search} />
    </label>
    <div class="region-links">
      {#each guide.regions as region}
        <a href={`#${region.id}`}>{region.name}</a>
      {/each}
    </div>
  </nav>

  <main class="mountain-sequence">
    {#if visibleMountains.length === 0}
      <section class="empty">
        <h2>No mountains match that view.</h2>
        <button type="button" onclick={() => { fromMile = guide.guideStartMile; search = ''; }}>Show the full guide</button>
      </section>
    {/if}

    {#each guide.regions as region}
      {@const regionMountains = mountainsForRegion(region.id)}
      {#if regionMountains.length}
        <section class="region" id={region.id}>
          <header class="region-header">
            <div>
              <p>{region.state} · Mile {fmt(region.startMile, 1)}-{fmt(region.endMile, 1)}</p>
              <h2>{region.name}</h2>
            </div>
            <span>{regionMountains.length} {regionMountains.length === 1 ? 'mountain' : 'mountains'}</span>
          </header>

          <div class="mountain-list">
            {#each regionMountains as mountain, index (mountain.id)}
              <article class="mountain" id={mountain.id} style={`--delay:${Math.min(index, 8) * 35}ms`}>
                <div class="mile-marker" aria-label={`Northbound mile ${fmt(mountain.summitMile, 1)}`}>
                  <span>NOBO</span>
                  <strong>{fmt(mountain.summitMile, 1)}</strong>
                </div>

                <div class="mountain-main">
                  <header class="mountain-header">
                    <div>
                      <p class="approach-type">{mountain.approachType} · {mountain.trailRelation}</p>
                      <h3>{mountain.name}</h3>
                      <p class="mountain-meta">
                        {#if mountain.summitElevationFt}{fmt(mountain.summitElevationFt)} ft · {/if}
                        {fmt(mountain.milesToKatahdin, 1)} mi to Katahdin
                      </p>
                    </div>
                    <div class={`difficulty ${scoreClass(mountain.difficultyScore)}`}>
                      <span>Difficulty</span>
                      <strong>{fmt(mountain.difficultyScore, 1)}</strong>
                      <small>{mountain.difficultyLabel}</small>
                    </div>
                  </header>

                  {#if mountain.crosses.length}
                    <p class="crosses"><strong>Sequence:</strong> {mountain.crosses.join(' · ')}</p>
                  {/if}

                  <div class="metric-row">
                    <div>
                      <span>Climb</span>
                      <strong>{fmt(mountain.climbDistanceMiles, 1)} mi</strong>
                      <small>from mi {fmt(mountain.climbStartMile, 1)}</small>
                    </div>
                    <div>
                      <span>Gain</span>
                      <strong>+{fmt(mountain.climbGainFt)} ft</strong>
                      <small>{fmt(mountain.averageGainFtPerMile)} ft/mi</small>
                    </div>
                    <div>
                      <span>Steepest</span>
                      <strong>{fmt(mountain.maxGradePercent, 1)}%</strong>
                      <small>{mountain.inclineLabel}</small>
                    </div>
                    <div>
                      <span>Rockiness</span>
                      <strong>{fmt(mountain.rockinessScore, 1)}/10</strong>
                      <small>{mountain.rockinessLabel}</small>
                    </div>
                  </div>

                  <div class="terrain-read">
                    <div>
                      <svg viewBox="0 0 240 62" role="img" aria-label={`${mountain.name} northbound climb profile`} preserveAspectRatio="none">
                        <path class="mini-fill" d={`${profilePath(mountain.profile)} L240,62 L0,62 Z`}></path>
                        <path class="mini-line" d={profilePath(mountain.profile)}></path>
                      </svg>
                      <span>mi {fmt(mountain.climbStartMile, 1)}</span>
                      <span>summit {fmt(mountain.summitMile, 1)}</span>
                    </div>
                    <p>{expectation(mountain)}</p>
                  </div>

                  <div class="score-track" aria-label={`${mountain.difficultyScore} out of 10 difficulty`}>
                    <span style={`width:${mountain.difficultyScore * 10}%`}></span>
                  </div>
                </div>
              </article>
            {/each}
          </div>
        </section>
      {/if}
    {/each}
  </main>

  <aside class="method-note">
    <div>
      <p class="section-number">Method</p>
      <h2>One consistent frame.</h2>
    </div>
    <div>
      <p>{guide.methodology.climbDefinition}</p>
      <p>{guide.methodology.difficultyDefinition}</p>
      <p><strong>Field caution:</strong> {guide.methodology.caution}</p>
    </div>
  </aside>

  <footer class="guide-sources">
    <h2>Sources and limits</h2>
    <ul>
      {#each guide.sources as source}
        <li>
          <a href={source.url}>{source.label}</a>
          <span>{source.detail}</span>
        </li>
      {/each}
    </ul>
    <p>Compiled {guide.generatedAt}. Planning aid only; not a navigation or current-conditions source.</p>
  </footer>
</div>

<style>
  :global(html) { scroll-behavior: smooth; }
  :global(.public-site-main) { padding-top: 0; }

  .mountain-guide {
    --guide-ink: #203026;
    --guide-pine: #33483a;
    --guide-moss: #84936f;
    --guide-cream: #f5f2e8;
    --guide-paper: #fffdf7;
    --guide-orange: #c86322;
    color: var(--guide-ink);
  }

  .guide-hero {
    position: relative;
    overflow: hidden;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 1.6rem;
    min-height: 37rem;
    padding: clamp(2rem, 6vw, 5rem) max(1rem, calc((100vw - 70rem) / 2)) 2.2rem;
    background:
      linear-gradient(115deg, rgba(25, 42, 31, 0.98), rgba(51, 72, 58, 0.93)),
      var(--guide-pine);
    color: #fff;
  }

  .guide-hero::after {
    content: '';
    position: absolute;
    inset: 0;
    opacity: 0.16;
    background:
      repeating-radial-gradient(ellipse at 84% 108%, transparent 0 38px, rgba(255, 255, 255, 0.35) 40px 41px, transparent 43px 64px);
    pointer-events: none;
  }

  .hero-copy,
  .hero-profile,
  .overview { position: relative; z-index: 1; }
  .hero-copy { max-width: 39rem; }

  .back-link {
    display: inline-block;
    margin-bottom: 2rem;
    color: rgba(255, 255, 255, 0.72);
    font-weight: 800;
    text-decoration: none;
  }

  .back-link:hover { color: #fff; }

  .kicker,
  .section-number,
  .approach-type {
    margin: 0;
    color: #efb273;
    font-size: 0.72rem;
    font-weight: 900;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }

  .guide-hero h1 {
    max-width: 8ch;
    margin: 0.35rem 0 1rem;
    color: #fff;
    font-size: clamp(4.5rem, 15vw, 9.5rem);
    line-height: 0.78;
    letter-spacing: -0.045em;
    text-transform: uppercase;
  }

  .guide-hero h1 span { color: #e5d9b9; }
  .lede { max-width: 43ch; margin: 0; color: rgba(255, 255, 255, 0.78); font-size: clamp(1rem, 2vw, 1.22rem); line-height: 1.6; }

  .hero-actions { display: flex; flex-wrap: wrap; gap: 0.7rem; margin-top: 1.4rem; }
  .hero-actions a,
  .hero-actions button,
  .empty button {
    min-height: 2.9rem;
    padding: 0.72rem 1.1rem;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 999px;
    background: transparent;
    color: #fff;
    font: inherit;
    font-weight: 900;
    text-decoration: none;
    cursor: pointer;
  }
  .hero-actions .pdf-link { border-color: #efb273; background: #efb273; color: #2a342c; }
  .hero-actions a:hover,
  .hero-actions button:hover { transform: translateY(-1px); border-color: #fff; }
  .hero-actions a:focus-visible,
  .hero-actions button:focus-visible,
  .guide-controls a:focus-visible,
  .guide-controls input:focus-visible { outline: 3px solid #f0e000; outline-offset: 3px; }

  .hero-profile {
    align-self: end;
    min-height: 12rem;
    margin-top: 1rem;
  }
  .hero-profile svg { width: 100%; height: 12rem; overflow: visible; }
  .profile-line { fill: none; stroke: #efb273; stroke-width: 3; vector-effect: non-scaling-stroke; }
  .profile-fill { fill: rgba(239, 178, 115, 0.12); }
  .profile-axis { display: flex; justify-content: space-between; color: rgba(255, 255, 255, 0.68); font-size: 0.74rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }

  .overview {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1px;
    border: 1px solid rgba(255, 255, 255, 0.18);
    background: rgba(255, 255, 255, 0.18);
  }
  .overview div { padding: 1rem; background: rgba(27, 46, 34, 0.92); }
  .overview dt { color: rgba(255, 255, 255, 0.6); font-size: 0.66rem; font-weight: 900; letter-spacing: 0.1em; text-transform: uppercase; }
  .overview dd { margin: 0.2rem 0 0; color: #fff; font-family: Oswald, Impact, sans-serif; font-size: clamp(1.6rem, 4vw, 2.3rem); }
  .overview small { color: #efb273; font-size: 0.55em; }

  .score-key,
  .method-note {
    display: grid;
    gap: 1.5rem;
    max-width: 70rem;
    margin: 0 auto;
    padding: clamp(2.5rem, 6vw, 5rem) 1rem;
  }
  .score-key h2,
  .method-note h2 { margin: 0.25rem 0 0; font-size: clamp(2rem, 5vw, 3.7rem); line-height: 0.95; }
  .score-key p,
  .method-note p { max-width: 58ch; margin: 0.65rem 0 0; color: var(--muted); line-height: 1.65; }
  .score-key .section-number,
  .method-note .section-number { color: var(--guide-orange); }

  .scale { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); align-self: end; }
  .scale span { display: grid; gap: 0.2rem; min-height: 4.7rem; padding: 0.8rem; border-top: 5px solid; background: rgba(255, 255, 255, 0.56); color: var(--muted); font-size: 0.8rem; font-weight: 800; }
  .scale b { color: var(--guide-ink); font-family: Oswald, Impact, sans-serif; font-size: 1.25rem; }
  .scale .cruise { border-color: #4c8a63; }
  .scale .steady { border-color: #c69a37; }
  .scale .hard { border-color: #cf6b32; }
  .scale .severe { border-color: #9f3535; }

  .guide-controls {
    position: sticky;
    top: 0;
    z-index: 12;
    display: grid;
    gap: 0.8rem;
    padding: 0.85rem max(1rem, calc((100vw - 70rem) / 2));
    border-block: 1px solid #dad4c3;
    background: rgba(245, 242, 232, 0.96);
    box-shadow: 0 10px 30px rgba(33, 48, 38, 0.08);
    backdrop-filter: blur(12px);
  }
  .guide-controls label { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: center; gap: 0.6rem; }
  .guide-controls label span { color: var(--muted); font-size: 0.68rem; font-weight: 900; letter-spacing: 0.09em; text-transform: uppercase; }
  .guide-controls input {
    width: 100%;
    min-height: 2.55rem;
    box-sizing: border-box;
    border: 1px solid #c9c2ae;
    border-radius: 0;
    background: var(--guide-paper);
    color: var(--guide-ink);
    font: inherit;
    font-weight: 800;
    padding: 0.5rem 0.65rem;
  }
  .region-links { display: flex; gap: 0.85rem; overflow-x: auto; padding: 0.15rem 0 0.2rem; scrollbar-width: thin; }
  .region-links a { flex: none; color: var(--guide-pine); font-size: 0.75rem; font-weight: 900; text-decoration: none; }

  .mountain-sequence { max-width: 70rem; margin: 0 auto; padding: 2.5rem 1rem 4rem; }
  .region { scroll-margin-top: 8rem; }
  .region + .region { margin-top: clamp(4rem, 8vw, 7rem); }
  .region-header { display: flex; align-items: end; justify-content: space-between; gap: 1rem; margin-bottom: 1.3rem; padding-bottom: 0.8rem; border-bottom: 3px solid var(--guide-pine); }
  .region-header p { margin: 0; color: var(--guide-orange); font-size: 0.72rem; font-weight: 900; letter-spacing: 0.12em; text-transform: uppercase; }
  .region-header h2 { margin: 0.2rem 0 0; font-size: clamp(2rem, 5vw, 3.2rem); line-height: 1; }
  .region-header > span { color: var(--muted); font-size: 0.78rem; font-weight: 800; white-space: nowrap; }

  .mountain-list { display: grid; }
  .mountain {
    --score-color: #4c8a63;
    display: grid;
    grid-template-columns: 4.6rem minmax(0, 1fr);
    gap: 1rem;
    padding: 1.55rem 0;
    border-bottom: 1px solid #d9d3c3;
    animation: settle 420ms both;
    animation-delay: var(--delay);
  }
  .mountain:target { background: rgba(239, 178, 115, 0.13); }
  .mile-marker { display: grid; align-content: start; justify-items: start; padding-top: 0.15rem; }
  .mile-marker span { color: var(--guide-orange); font-size: 0.6rem; font-weight: 900; letter-spacing: 0.13em; }
  .mile-marker strong { font-family: Oswald, Impact, sans-serif; font-size: 1.35rem; line-height: 1; color: var(--guide-pine); }

  .mountain-main { min-width: 0; }
  .mountain-header { display: flex; align-items: start; justify-content: space-between; gap: 0.8rem; }
  .mountain-header h3 { margin: 0.2rem 0 0; font-size: clamp(1.45rem, 4vw, 2.15rem); line-height: 1.02; }
  .approach-type { color: var(--guide-orange); letter-spacing: 0.09em; }
  .mountain-meta { margin: 0.28rem 0 0; color: var(--muted); font-size: 0.8rem; font-weight: 800; }

  .difficulty {
    flex: none;
    display: grid;
    min-width: 4.6rem;
    padding: 0.55rem 0.65rem;
    border-top: 4px solid var(--score-color);
    background: rgba(255, 255, 255, 0.75);
    text-align: right;
  }
  .difficulty span { color: var(--muted); font-size: 0.56rem; font-weight: 900; letter-spacing: 0.08em; text-transform: uppercase; }
  .difficulty strong { color: var(--score-color); font-family: Oswald, Impact, sans-serif; font-size: 1.65rem; line-height: 1; }
  .difficulty small { color: var(--muted); font-size: 0.65rem; font-weight: 900; text-transform: uppercase; }
  .difficulty.steady { --score-color: #9f731f; }
  .difficulty.hard { --score-color: #bd5729; }
  .difficulty.severe { --score-color: #9f3535; }

  .crosses { margin: 0.8rem 0 0; color: var(--muted); font-size: 0.8rem; line-height: 1.5; }
  .metric-row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); margin-top: 1rem; border-block: 1px solid #ded8c9; }
  .metric-row div { min-width: 0; padding: 0.75rem 0.45rem 0.75rem 0; }
  .metric-row span,
  .metric-row small { display: block; color: var(--muted); font-size: 0.62rem; font-weight: 900; letter-spacing: 0.06em; text-transform: uppercase; }
  .metric-row strong { display: block; margin: 0.12rem 0; color: var(--guide-ink); font-family: Oswald, Impact, sans-serif; font-size: 1.25rem; }

  .terrain-read { display: grid; gap: 0.85rem; margin-top: 0.95rem; }
  .terrain-read > div { position: relative; min-width: 0; }
  .terrain-read svg { width: 100%; height: 4.8rem; overflow: visible; }
  .terrain-read div > span { position: absolute; bottom: -0.05rem; color: var(--muted); font-size: 0.58rem; font-weight: 800; text-transform: uppercase; }
  .terrain-read div > span:last-child { right: 0; }
  .mini-fill { fill: rgba(77, 89, 74, 0.08); }
  .mini-line { fill: none; stroke: var(--guide-pine); stroke-width: 2.5; vector-effect: non-scaling-stroke; }
  .terrain-read p { margin: 0; color: var(--muted); font-size: 0.86rem; line-height: 1.55; }

  .score-track { height: 4px; margin-top: 1rem; background: #ddd6c5; }
  .score-track span { display: block; height: 100%; background: linear-gradient(90deg, #64856c, #d37a35, #9f3535); transition: width 500ms ease; }

  .empty { padding: 4rem 1rem; text-align: center; }
  .empty button { border-color: var(--guide-pine); color: var(--guide-pine); }

  .method-note { border-top: 1px solid #d8d1c0; }
  .guide-sources { padding: 2.5rem max(1rem, calc((100vw - 70rem) / 2)) 4rem; background: #e9e4d5; }
  .guide-sources h2 { margin: 0 0 1rem; font-size: 1.45rem; }
  .guide-sources ul { display: grid; gap: 0.8rem; margin: 0; padding: 0; list-style: none; }
  .guide-sources li { display: grid; gap: 0.15rem; }
  .guide-sources a { color: var(--guide-pine); font-weight: 900; }
  .guide-sources span,
  .guide-sources p { color: var(--muted); font-size: 0.78rem; line-height: 1.5; }

  @keyframes settle {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @media (min-width: 700px) {
    .guide-hero { grid-template-columns: minmax(22rem, 0.8fr) minmax(24rem, 1.2fr); align-items: end; }
    .hero-profile { margin-top: 0; }
    .overview { grid-column: 1 / -1; grid-template-columns: repeat(4, 1fr); }
    .overview div { padding: 1.2rem 1.35rem; }
    .score-key,
    .method-note { grid-template-columns: minmax(0, 0.9fr) minmax(26rem, 1.1fr); }
    .scale { grid-template-columns: repeat(4, 1fr); }
    .guide-controls { grid-template-columns: 12rem minmax(15rem, 1fr); align-items: center; }
    .region-links { grid-column: 1 / -1; }
    .mountain { grid-template-columns: 6.2rem minmax(0, 1fr); gap: 1.5rem; padding-block: 1.8rem; }
    .mile-marker strong { font-size: 1.7rem; }
    .metric-row { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .terrain-read { grid-template-columns: minmax(16rem, 0.95fr) minmax(14rem, 1.05fr); align-items: center; }
  }

  @media (min-width: 1040px) {
    .guide-controls { grid-template-columns: 11rem 17rem minmax(0, 1fr); }
    .region-links { grid-column: auto; justify-content: flex-end; }
  }

  @media (prefers-reduced-motion: reduce) {
    :global(html) { scroll-behavior: auto; }
    .mountain { animation: none; }
    .score-track span { transition: none; }
  }

  @media print {
    :global(.header),
    :global(.public-meta-footer),
    .hero-actions,
    .guide-controls,
    .back-link { display: none !important; }
    :global(.public-site-main) { padding: 0; }
    .guide-hero { min-height: 0; padding: 0.45in; background: #fff; color: #111; }
    .guide-hero h1,
    .guide-hero h1 span,
    .overview dd { color: #111; }
    .guide-hero .lede,
    .profile-axis { color: #444; }
    .guide-hero::after { display: none; }
    .overview { border-color: #bbb; background: #bbb; }
    .overview div { background: #fff; }
    .hero-profile { min-height: 7rem; }
    .hero-profile svg { height: 7rem; }
    .score-key { padding: 0.35in 0.45in; }
    .mountain-sequence { padding: 0.2in 0.45in; }
    .region { break-before: page; }
    .region:first-child { break-before: auto; }
    .mountain { break-inside: avoid; animation: none; }
    .method-note,
    .guide-sources { break-before: page; }
  }
</style>
