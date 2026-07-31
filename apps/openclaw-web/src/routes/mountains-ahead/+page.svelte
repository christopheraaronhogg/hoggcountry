<script lang="ts">
  import { onMount } from 'svelte';
  import guide from '$lib/data/northern-mountains-guide-b.json';

  type Mountain = (typeof guide.mountains)[number];
  type ProfilePoint = Mountain['profile'][number];

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

  function profilePath(points: readonly ProfilePoint[], width = 260, height = 62): string {
    if (points.length < 2) return '';
    const elevations = points.map((point) => point.elevationFt);
    const minElevation = Math.min(...elevations);
    const maxElevation = Math.max(...elevations);
    const elevationSpan = Math.max(1, maxElevation - minElevation);
    const startMile = points[0].mile;
    const endMile = points.at(-1)?.mile ?? startMile + 1;
    const mileSpan = Math.max(0.01, endMile - startMile);

    return points
      .map((point, index) => {
        const x = ((point.mile - startMile) / mileSpan) * width;
        const y = height - 5 - ((point.elevationFt - minElevation) / elevationSpan) * (height - 10);
        return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }

  function downhillRead(mountain: Mountain): string {
    if (mountain.terminusDescentNote) return mountain.terminusDescentNote;
    if (mountain.descentDistanceMiles === 0) {
      return 'No meaningful low point appears before the next listed summit; treat this as a ridge connection.';
    }

    const footing = mountain.descentRockinessScore >= 7.5
      ? 'Very rocky footing keeps the knees loaded and the pace deliberate.'
      : mountain.descentRockinessScore >= 6
        ? 'Rocky footing adds braking and careful step placement.'
        : 'Footing is the smaller part of this descent screen.';
    return `${mountain.declineLabel}, averaging about ${fmt(mountain.averageLossFtPerMile)} ft of loss per mile. ${footing}`;
  }

  function setFromMile(value: number): void {
    fromMile = Math.min(guide.terminusMile, Math.max(guide.guideStartMile, value));
    const url = new URL(window.location.href);
    url.searchParams.set('from', fromMile.toFixed(1));
    history.replaceState({}, '', url);
  }
</script>

<svelte:head>
  <title>Mountains Ahead: Climb + Descent | Hogg Country</title>
  <meta
    name="description"
    content="A knee-aware Appalachian Trail mountain guide from mile 1,850 to Katahdin, with each climb and northbound descent shown together."
  />
  <link rel="canonical" href="https://hoggcountry.com/mountains-ahead" />
</svelte:head>

<div class="mountains-guide">
  <header class="guide-hero">
    <div class="hero-grid">
      <div class="hero-copy">
        <a class="back-link" href="/journey">← The Journey</a>
        <p class="kicker">Dad's knee-aware northern field reference</p>
        <h1>Know the up.<br /><span>Respect the down.</span></h1>
        <p class="lede">
          Every named mountain from mile {fmt(guide.guideStartMile)} to Katahdin, with the climb and the
          northbound descent treated as two equal halves of the terrain.
        </p>
        <div class="hero-actions">
          <a class="pdf-link" href="/guides/hogg-country-at-mountains-mile-1850-to-katahdin.pdf">
            Download the PDF
          </a>
          <button type="button" onclick={() => window.print()}>Print this page</button>
        </div>
      </div>

      <div class="hero-brief" aria-label="Guide summary">
        <p>Final stretch</p>
        <strong>{fmt(guide.summary.distanceMiles, 1)} miles</strong>
        <dl>
          <div>
            <dt>Climbing</dt>
            <dd>+{fmt(guide.summary.gainFt / 1000, 1)}k ft</dd>
          </div>
          <div>
            <dt>Descending</dt>
            <dd>−{fmt(guide.summary.lossFt / 1000, 1)}k ft</dd>
          </div>
          <div>
            <dt>Mountains</dt>
            <dd>{guide.summary.mountainCount}</dd>
          </div>
        </dl>
      </div>
    </div>
  </header>

  <section class="watchlist" aria-labelledby="watchlist-title">
    <div class="watchlist-heading">
      <p class="eyebrow">Downhill watchlist</p>
      <h2 id="watchlist-title">The descents most likely to matter to tired knees.</h2>
      <p>Ranked by loss rate, total loss, descending grade, and rocky footing—not by summit height.</p>
    </div>
    <ol>
      {#each guide.summary.highestKneeLoad as item, index}
        <li>
          <a href={`#${item.id}`}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <strong>{item.name}</strong>
            <small>−{fmt(item.descentLossFt)} ft · {fmt(item.kneeLoadScore, 1)}/10</small>
          </a>
        </li>
      {/each}
    </ol>
  </section>

  <section class="score-key" aria-labelledby="score-title">
    <div>
      <p class="eyebrow">How the guide scores terrain</p>
      <h2 id="score-title">The harder half sets the overall number.</h2>
      <p>
        <strong>Up</strong> keeps the current movement score. <strong>Down</strong> is a separate knee-load
        screen. Overall terrain demand is whichever score is higher, so a serious descent cannot disappear
        inside an average.
      </p>
    </div>
    <div class="formula" aria-label="Terrain score formula">
      <div><span>UP</span><strong>Climb demand</strong></div>
      <b>or</b>
      <div class="down"><span>DOWN</span><strong>Knee load</strong></div>
      <b>→</b>
      <div class="overall"><span>OVERALL</span><strong>Higher score</strong></div>
    </div>
  </section>

  <section class="guide-controls" aria-label="Filter the guide">
    <label>
      <span>Start at NOBO mile</span>
      <input
        type="number"
        min={guide.guideStartMile}
        max={guide.terminusMile}
        step="0.1"
        value={fromMile}
        onchange={(event) => setFromMile(Number(event.currentTarget.value))}
      />
    </label>
    <label>
      <span>Find a mountain</span>
      <input type="search" placeholder="Madison, Old Speck, Bigelow…" bind:value={search} />
    </label>
    <nav aria-label="Jump to a region">
      {#each guide.regions as region}
        <a href={`#region-${region.id}`}>{region.name}</a>
      {/each}
    </nav>
  </section>

  <div class="mountain-sequence">
    {#if visibleMountains.length === 0}
      <div class="empty">
        <h2>No mountains match that view.</h2>
        <button type="button" onclick={() => { search = ''; setFromMile(guide.guideStartMile); }}>Reset filters</button>
      </div>
    {/if}

    {#each guide.regions as region}
      {@const regionMountains = mountainsForRegion(region.id)}
      {#if regionMountains.length}
        <section class="region" id={`region-${region.id}`} aria-labelledby={`heading-${region.id}`}>
          <header class="region-header">
            <div>
              <p>{region.state} · Mile {fmt(region.startMile, 1)}–{fmt(region.endMile, 1)}</p>
              <h2 id={`heading-${region.id}`}>{region.name}</h2>
            </div>
            <span>{regionMountains.length} {regionMountains.length === 1 ? 'mountain' : 'mountains'}</span>
          </header>

          <div class="mountain-list">
            {#each regionMountains as mountain (mountain.id)}
              <article class="mountain" id={mountain.id}>
                <div class="mile-marker" aria-label={`Northbound mile ${fmt(mountain.summitMile, 1)}`}>
                  <span>NOBO</span>
                  <strong>{fmt(mountain.summitMile, 1)}</strong>
                </div>

                <div class="mountain-main">
                  <header class="mountain-header">
                    <div>
                      <p class="approach-type">{mountain.trailRelation}</p>
                      <h3>{mountain.name}</h3>
                      <p class="mountain-meta">
                        {#if mountain.summitElevationFt}~{fmt(mountain.summitElevationFt)} ft · {/if}
                        {fmt(mountain.milesToKatahdin, 1)} mi to Katahdin
                      </p>
                    </div>
                    <div class={`terrain-score ${scoreClass(mountain.terrainDemandScore)}`}>
                      <span>Overall terrain</span>
                      <strong>{fmt(mountain.terrainDemandScore, 1)}</strong>
                      <small>{mountain.terrainDemandLabel}</small>
                    </div>
                  </header>

                  {#if mountain.crosses.length}
                    <p class="crosses"><strong>Sequence:</strong> {mountain.crosses.join(' · ')}</p>
                  {/if}

                  <div class="two-sides">
                    <section class="side up" aria-label={`${mountain.name} climb`}>
                      <header>
                        <span aria-hidden="true">↑</span>
                        <div>
                          <p>UP · {mountain.approachType}</p>
                          <h4>Climb demand <strong>{fmt(mountain.upDifficultyScore, 1)}</strong></h4>
                        </div>
                      </header>
                      <dl>
                        <div><dt>Distance</dt><dd>{fmt(mountain.climbDistanceMiles, 1)} mi</dd></div>
                        <div><dt>Gain</dt><dd>+{fmt(mountain.climbGainFt)} ft</dd></div>
                        <div><dt>Gain rate</dt><dd>{fmt(mountain.averageGainFtPerMile)} ft/mi</dd></div>
                        <div><dt>Steepest</dt><dd>{fmt(mountain.maxGradePercent, 1)}%</dd></div>
                        <div><dt>Rockiness</dt><dd>{fmt(mountain.rockinessScore, 1)}/10</dd></div>
                      </dl>
                      <div class="mini-profile">
                        <svg viewBox="0 0 260 62" role="img" aria-label={`${mountain.name} northbound climb profile`} preserveAspectRatio="none">
                          <path class="profile-fill" d={`${profilePath(mountain.profile)} L260,62 L0,62 Z`}></path>
                          <path class="profile-line" d={profilePath(mountain.profile)}></path>
                        </svg>
                        <span>mi {fmt(mountain.climbStartMile, 1)}</span>
                        <span>summit {fmt(mountain.summitMile, 1)}</span>
                      </div>
                    </section>

                    <section class="side down" aria-label={`${mountain.name} descent`}>
                      <header>
                        <span aria-hidden="true">↓</span>
                        <div>
                          <p>DOWN · {mountain.descentType}</p>
                          <h4>Knee load <strong>{fmt(mountain.kneeLoadScore, 1)}</strong></h4>
                        </div>
                      </header>
                      <dl>
                        <div><dt>Distance</dt><dd>{fmt(mountain.descentDistanceMiles, 1)} mi</dd></div>
                        <div><dt>Loss</dt><dd>−{fmt(mountain.descentLossFt)} ft</dd></div>
                        <div><dt>Loss rate</dt><dd>{fmt(mountain.averageLossFtPerMile)} ft/mi</dd></div>
                        <div><dt>Steepest</dt><dd>{fmt(mountain.maxDescentGradePercent, 1)}%</dd></div>
                        <div><dt>Rockiness</dt><dd>{fmt(mountain.descentRockinessScore, 1)}/10</dd></div>
                      </dl>
                      {#if mountain.descentProfile.length >= 2}
                        <div class="mini-profile">
                          <svg viewBox="0 0 260 62" role="img" aria-label={`${mountain.name} northbound descent profile`} preserveAspectRatio="none">
                            <path class="profile-fill" d={`${profilePath(mountain.descentProfile)} L260,62 L0,62 Z`}></path>
                            <path class="profile-line" d={profilePath(mountain.descentProfile)}></path>
                          </svg>
                          <span>summit {fmt(mountain.summitMile, 1)}</span>
                          <span>low {fmt(mountain.descentEndMile, 1)}</span>
                        </div>
                      {:else}
                        <div class="profile-note">No post-summit segment scored.</div>
                      {/if}
                    </section>
                  </div>

                  <p class="downhill-read"><strong>Downhill read:</strong> {downhillRead(mountain)}</p>
                </div>
              </article>
            {/each}
          </div>
        </section>
      {/if}
    {/each}
  </div>

  <section class="method-note" aria-labelledby="method-title">
    <div>
      <p class="eyebrow">Methodology</p>
      <h2 id="method-title">What “down” means here.</h2>
    </div>
    <div>
      <p>{guide.methodology.descentDefinition}</p>
      <p>{guide.methodology.kneeLoadDefinition}</p>
      <p>{guide.methodology.difficultyDefinition}</p>
      <p><strong>Important:</strong> {guide.methodology.caution}</p>
    </div>
  </section>

  <footer class="guide-sources">
    <h2>Data sources</h2>
    <ul>
      {#each guide.sources as source}
        <li>
          <a href={source.url}>{source.label}</a>
          <span>{source.detail}</span>
        </li>
      {/each}
    </ul>
    <p>Compiled {guide.generatedAt}. Mountain miles remain anchor-calibrated; none are hand-entered.</p>
  </footer>
</div>

<style>
  :global(html) { scroll-behavior: smooth; }
  :global(body) { margin: 0; }

  .mountains-guide {
    --ink: #17251f;
    --pine: #28483a;
    --up: #356f52;
    --down: #a94d2d;
    --down-dark: #7c351f;
    --paper: #f7f2e6;
    --cream: #ebe2ce;
    --muted: #69716c;
    min-height: 100vh;
    color: var(--ink);
    background: var(--paper);
    font-family: Inter, system-ui, sans-serif;
  }

  .guide-hero {
    color: #fff;
    background:
      linear-gradient(120deg, rgba(19, 43, 32, 0.98), rgba(35, 69, 53, 0.94)),
      var(--pine);
  }
  .hero-grid {
    display: grid;
    gap: 2rem;
    max-width: 72rem;
    min-height: 32rem;
    margin: 0 auto;
    padding: clamp(3rem, 7vw, 6rem) 1rem clamp(2.5rem, 6vw, 4.5rem);
  }
  .back-link { display: inline-block; margin-bottom: 2.2rem; color: #ddcda9; font-size: 0.75rem; font-weight: 900; text-decoration: none; text-transform: uppercase; }
  .kicker,
  .eyebrow { margin: 0 0 0.75rem; color: var(--down); font-size: 0.7rem; font-weight: 950; letter-spacing: 0.13em; text-transform: uppercase; }
  .hero-copy .kicker { color: #eab18f; }
  h1, h2, h3, h4, p { text-wrap: pretty; }
  h1 {
    max-width: 13ch;
    margin: 0;
    color: #f7f2e6;
    font-family: Oswald, Impact, sans-serif;
    font-size: clamp(3.8rem, 10vw, 7.4rem);
    font-weight: 900;
    letter-spacing: -0.045em;
    line-height: 0.88;
    text-transform: uppercase;
  }
  h1 span { color: #efb18e; }
  .lede { max-width: 41rem; margin: 1.7rem 0 0; color: rgba(255, 255, 255, 0.78); font-size: clamp(1rem, 2vw, 1.22rem); line-height: 1.65; }
  .hero-actions { display: flex; flex-wrap: wrap; gap: 0.65rem; margin-top: 1.7rem; }
  .hero-actions a,
  .hero-actions button,
  .empty button {
    padding: 0.75rem 0.95rem;
    border: 1px solid rgba(255, 255, 255, 0.42);
    border-radius: 0;
    color: #fff;
    background: transparent;
    font: inherit;
    font-size: 0.73rem;
    font-weight: 900;
    letter-spacing: 0.04em;
    text-decoration: none;
    text-transform: uppercase;
    cursor: pointer;
  }
  .hero-actions .pdf-link { border-color: #efb18e; color: #1c2f26; background: #efb18e; }

  .hero-brief {
    align-self: end;
    padding: 1.2rem;
    border: 1px solid rgba(255, 255, 255, 0.25);
    background: rgba(11, 28, 21, 0.38);
  }
  .hero-brief > p { margin: 0; color: #eab18f; font-size: 0.68rem; font-weight: 900; letter-spacing: 0.12em; text-transform: uppercase; }
  .hero-brief > strong { display: block; margin-top: 0.35rem; font-family: Oswald, Impact, sans-serif; font-size: clamp(2.3rem, 6vw, 4.4rem); line-height: 1; }
  .hero-brief dl { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; margin: 1rem 0 0; background: rgba(255, 255, 255, 0.2); }
  .hero-brief dl div { padding: 0.75rem; background: #203e31; }
  .hero-brief dt { color: rgba(255, 255, 255, 0.58); font-size: 0.58rem; font-weight: 900; text-transform: uppercase; }
  .hero-brief dd { margin: 0.15rem 0 0; font-family: Oswald, Impact, sans-serif; font-size: 1.3rem; }

  .watchlist,
  .score-key,
  .method-note {
    display: grid;
    gap: 1.5rem;
    padding: clamp(2.5rem, 6vw, 4.5rem) max(1rem, calc((100vw - 72rem) / 2));
  }
  .watchlist { color: #fff; background: #222a26; }
  .watchlist-heading h2,
  .score-key h2,
  .method-note h2 { max-width: 18ch; margin: 0; font-family: Oswald, Impact, sans-serif; font-size: clamp(2rem, 5vw, 3.6rem); line-height: 1; text-transform: uppercase; }
  .watchlist-heading h2,
  .method-note h2 { color: #f7f2e6; }
  .score-key h2 { color: var(--ink); }
  .watchlist-heading > p:last-child,
  .score-key > div > p,
  .method-note p { color: rgba(255, 255, 255, 0.68); line-height: 1.6; }
  .watchlist ol { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1px; margin: 0; padding: 1px; background: rgba(255, 255, 255, 0.14); list-style: none; }
  .watchlist a { display: grid; grid-template-columns: 2rem minmax(0, 1fr); gap: 0.2rem 0.6rem; min-height: 4.7rem; padding: 0.8rem; color: #fff; background: #2b342f; text-decoration: none; }
  .watchlist a:hover { background: #35423b; }
  .watchlist a > span { grid-row: 1 / 3; color: #eab18f; font-family: Oswald, Impact, sans-serif; font-size: 1.25rem; }
  .watchlist strong { align-self: end; font-size: 0.85rem; }
  .watchlist small { color: rgba(255, 255, 255, 0.62); font-size: 0.68rem; }

  .score-key { color: var(--ink); background: var(--cream); }
  .score-key > div > p { max-width: 42rem; color: var(--muted); }
  .formula { display: grid; grid-template-columns: 1fr auto 1fr; gap: 0.55rem; align-items: stretch; }
  .formula div { display: grid; align-content: center; min-height: 5.2rem; padding: 0.8rem; border-top: 5px solid var(--up); background: #fffaf0; }
  .formula .down { border-color: var(--down); }
  .formula .overall { grid-column: 1 / -1; border-color: var(--ink); text-align: center; }
  .formula span { color: var(--muted); font-size: 0.58rem; font-weight: 950; letter-spacing: 0.1em; }
  .formula strong { margin-top: 0.15rem; font-family: Oswald, Impact, sans-serif; font-size: 1.25rem; text-transform: uppercase; }
  .formula b { align-self: center; color: var(--muted); }

  .guide-controls {
    display: grid;
    gap: 0.9rem;
    padding: 1.4rem max(1rem, calc((100vw - 72rem) / 2));
    border-block: 1px solid #d4cbb7;
    background: #fffaf0;
  }
  .guide-controls label span { display: block; margin-bottom: 0.3rem; color: var(--muted); font-size: 0.63rem; font-weight: 900; letter-spacing: 0.08em; text-transform: uppercase; }
  .guide-controls input { box-sizing: border-box; width: 100%; padding: 0.72rem; border: 1px solid #c9bfaa; border-radius: 0; color: var(--ink); background: #fff; font: inherit; }
  .guide-controls nav { display: flex; flex-wrap: wrap; gap: 0.4rem; align-content: end; }
  .guide-controls nav a { padding: 0.45rem 0.55rem; color: var(--pine); background: #e8e0cf; font-size: 0.63rem; font-weight: 900; text-decoration: none; text-transform: uppercase; }

  .mountain-sequence { max-width: 72rem; margin: 0 auto; padding: 2.5rem 1rem 4.5rem; }
  .region { scroll-margin-top: 5rem; }
  .region + .region { margin-top: 4rem; }
  .region-header { display: flex; align-items: end; justify-content: space-between; gap: 1rem; padding-bottom: 0.8rem; border-bottom: 4px solid var(--pine); }
  .region-header p { margin: 0; color: var(--down); font-size: 0.65rem; font-weight: 900; letter-spacing: 0.1em; text-transform: uppercase; }
  .region-header h2 { margin: 0.25rem 0 0; font-family: Oswald, Impact, sans-serif; font-size: clamp(1.8rem, 5vw, 3.25rem); line-height: 1; text-transform: uppercase; }
  .region-header > span { flex: none; color: var(--muted); font-size: 0.66rem; font-weight: 900; text-transform: uppercase; }
  .mountain-list { border-inline: 1px solid #d8cfbd; }

  .mountain {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    scroll-margin-top: 1rem;
    padding: 1.35rem 1rem 1.5rem;
    border-bottom: 1px solid #d8cfbd;
    background: #fffdf7;
  }
  .mountain:target { outline: 4px solid rgba(169, 77, 45, 0.24); outline-offset: -4px; }
  .mile-marker { display: flex; align-items: baseline; gap: 0.35rem; margin-bottom: 0.7rem; color: var(--down); }
  .mile-marker span { font-size: 0.58rem; font-weight: 950; letter-spacing: 0.08em; }
  .mile-marker strong { font-family: Oswald, Impact, sans-serif; font-size: 1.55rem; line-height: 1; }
  .mountain-header { display: flex; align-items: start; justify-content: space-between; gap: 0.7rem; }
  .approach-type { margin: 0; color: var(--up); font-size: 0.61rem; font-weight: 900; letter-spacing: 0.08em; text-transform: uppercase; }
  .mountain-header h3 { margin: 0.18rem 0 0; font-family: Oswald, Impact, sans-serif; font-size: clamp(1.55rem, 4vw, 2.35rem); line-height: 1; text-transform: uppercase; }
  .mountain-meta { margin: 0.3rem 0 0; color: var(--muted); font-size: 0.72rem; font-weight: 800; }
  .terrain-score { flex: none; min-width: 4.4rem; padding: 0.5rem 0.6rem; border-top: 5px solid var(--score); background: #f2eddf; text-align: right; }
  .terrain-score span,
  .terrain-score small { display: block; color: var(--muted); font-size: 0.52rem; font-weight: 950; text-transform: uppercase; }
  .terrain-score strong { display: block; color: var(--score); font-family: Oswald, Impact, sans-serif; font-size: 1.7rem; line-height: 1; }
  .terrain-score.cruise { --score: #64856c; }
  .terrain-score.steady { --score: #9f731f; }
  .terrain-score.hard { --score: #bd5729; }
  .terrain-score.severe { --score: #9f3535; }
  .crosses { margin: 0.8rem 0 0; color: var(--muted); font-size: 0.75rem; }

  .two-sides { display: grid; gap: 1px; margin-top: 1rem; background: #cfc6b4; }
  .side { min-width: 0; padding: 0.9rem; background: #f5f1e7; }
  .side > header { display: flex; align-items: center; gap: 0.65rem; }
  .side > header > span { color: var(--up); font-family: Oswald, Impact, sans-serif; font-size: 2.5rem; line-height: 1; }
  .side.down > header > span { color: var(--down); }
  .side header p { margin: 0; color: var(--muted); font-size: 0.56rem; font-weight: 950; letter-spacing: 0.08em; }
  .side h4 { margin: 0.12rem 0 0; font-family: Oswald, Impact, sans-serif; font-size: 1.1rem; text-transform: uppercase; }
  .side h4 strong { color: var(--up); font-size: 1.4rem; }
  .side.down h4 strong { color: var(--down); }
  .side dl { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0; margin: 0.8rem 0 0; border-block: 1px solid #d8cfbd; }
  .side dl div { padding: 0.45rem 0.2rem; border-bottom: 1px solid #e0d8c9; }
  .side dl div:last-child { border-bottom: 0; }
  .side dt { color: var(--muted); font-size: 0.53rem; font-weight: 900; text-transform: uppercase; }
  .side dd { margin: 0.08rem 0 0; font-family: Oswald, Impact, sans-serif; font-size: 1.05rem; }
  .mini-profile { position: relative; min-height: 4.9rem; margin-top: 0.65rem; padding-bottom: 0.8rem; }
  .mini-profile svg { width: 100%; height: 4.2rem; overflow: visible; }
  .mini-profile span { position: absolute; bottom: 0; left: 0; color: var(--muted); font-size: 0.52rem; font-weight: 800; text-transform: uppercase; }
  .mini-profile span:last-child { right: 0; left: auto; }
  .profile-fill { fill: rgba(53, 111, 82, 0.1); }
  .profile-line { fill: none; stroke: var(--up); stroke-width: 2.5; vector-effect: non-scaling-stroke; }
  .down .profile-fill { fill: rgba(169, 77, 45, 0.1); }
  .down .profile-line { stroke: var(--down); }
  .profile-note { display: grid; min-height: 5.5rem; margin-top: 0.65rem; place-items: center; color: var(--muted); background: #ebe5d8; font-size: 0.68rem; font-weight: 800; text-align: center; }
  .downhill-read { margin: 0; padding: 0.85rem 0.9rem; color: #5c554b; background: #efe4d6; font-size: 0.78rem; line-height: 1.5; }
  .downhill-read strong { color: var(--down-dark); text-transform: uppercase; }

  .empty { padding: 4rem 1rem; text-align: center; }
  .empty button { border-color: var(--pine); color: var(--pine); }
  .method-note { border-top: 1px solid #d8cfbd; background: var(--pine); color: #fff; }
  .method-note > div:last-child { display: grid; gap: 0.65rem; }
  .method-note p { margin: 0; }
  .guide-sources { padding: 2.5rem max(1rem, calc((100vw - 72rem) / 2)) 4rem; background: #e7decc; }
  .guide-sources h2 { margin: 0 0 1rem; font-family: Oswald, Impact, sans-serif; font-size: 1.55rem; text-transform: uppercase; }
  .guide-sources ul { display: grid; gap: 0.8rem; margin: 0; padding: 0; list-style: none; }
  .guide-sources li { display: grid; gap: 0.12rem; }
  .guide-sources a { color: var(--pine); font-weight: 900; }
  .guide-sources span,
  .guide-sources p { color: var(--muted); font-size: 0.76rem; line-height: 1.5; }

  @media (min-width: 720px) {
    .hero-grid { grid-template-columns: minmax(0, 1.2fr) minmax(19rem, 0.8fr); align-items: end; }
    .watchlist,
    .score-key,
    .method-note { grid-template-columns: minmax(18rem, 0.8fr) minmax(28rem, 1.2fr); }
    .guide-controls { grid-template-columns: 10rem 20rem minmax(0, 1fr); align-items: end; }
    .guide-controls nav { justify-content: flex-end; }
    .mountain { grid-template-columns: 6.2rem minmax(0, 1fr); gap: 1.2rem; padding: 1.6rem 1.3rem; }
    .mile-marker { display: grid; align-content: start; gap: 0; margin: 0; }
    .mile-marker strong { font-size: 1.8rem; }
    .two-sides { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .side { padding: 1rem; }
    .side dl { grid-template-columns: repeat(3, 1fr); }
  }

  @media (min-width: 1040px) {
    .watchlist ol { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  }

  @media (max-width: 520px) {
    .hero-brief dl { grid-template-columns: 1fr; }
    .watchlist ol { grid-template-columns: 1fr; }
    .mountain-header { display: grid; }
    .terrain-score { justify-self: start; text-align: left; }
  }

  @media (prefers-reduced-motion: reduce) {
    :global(html) { scroll-behavior: auto; }
  }

  @media print {
    :global(.header),
    :global(.public-meta-footer),
    .hero-actions,
    .guide-controls,
    .back-link { display: none !important; }
    :global(.public-site-main) { padding: 0; }
    .guide-hero { color: #111; background: #fff; }
    .hero-grid { min-height: 0; padding: 0.35in 0.45in; }
    .hero-copy .kicker,
    h1 span { color: #7c351f; }
    .lede { color: #444; }
    .hero-brief { color: #111; border-color: #aaa; background: #fff; }
    .hero-brief dl div { color: #111; background: #fff; }
    .watchlist,
    .score-key,
    .method-note { padding: 0.3in 0.45in; color: #111; background: #fff; }
    .watchlist-heading > p:last-child,
    .score-key > div > p,
    .method-note p { color: #444; }
    .watchlist a { color: #111; background: #fff; }
    .mountain-sequence { padding: 0.2in 0.45in; }
    .region { break-before: page; }
    .region:first-child { break-before: auto; }
    .mountain { break-inside: avoid; }
    .guide-sources { break-before: page; }
  }
</style>
