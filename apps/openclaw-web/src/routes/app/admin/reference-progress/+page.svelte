<script lang="ts">
  import { resolve } from '$app/paths';
  import type { PageData } from './$types';

  const { data } = $props<{ data: PageData }>();
  let datasetQuery = $state('');

  const visibleDatasets = $derived(data.datasets.filter((dataset) => {
    const query = datasetQuery.trim().toLowerCase();
    if (!query) return true;
    return [dataset.datasetId, dataset.path, dataset.licenseStatus, dataset.aiAnswerRule]
      .some((value) => String(value).toLowerCase().includes(query));
  }));

  const safeShare = $derived(data.rc1.datasetCount === 0 ? 0 : Math.round((data.rc1.productionSafeDatasetCount / data.rc1.datasetCount) * 100));

  function formatNumber(value: number | null | undefined): string {
    return typeof value === 'number' ? value.toLocaleString() : 'n/a';
  }

  function formatSigned(value: number | null | undefined): string {
    if (typeof value !== 'number') return 'n/a';
    return `${value > 0 ? '+' : ''}${value.toLocaleString()}`;
  }

  function tone(status: string): string {
    if (status === 'green') return 'green';
    if (status === 'red') return 'red';
    if (status === 'true') return 'green';
    if (/false|mixed|pointer|test|blocked|yellow|gap|review/iu.test(status)) return 'yellow';
    return 'blue';
  }
</script>

<svelte:head>
  <title>Reference Progress | Scout Admin</title>
</svelte:head>

<section class="progress-shell">
  <header class="progress-hero">
    <div>
      <p class="eyebrow">Scout admin</p>
      <h1>Reference Progress</h1>
      <p class="lede">Full-trail RC1, regional MVP packs, source safety, validation, and production export status.</p>
    </div>
    <div class="hero-actions">
      <a class="btn btn-ghost" href={resolve('/app/admin/resources')}>Explorer</a>
      <a class="btn btn-ghost" href={resolve('/app/scout')}>Ask Scout</a>
    </div>
  </header>

  <section class="metric-grid" aria-label="Full trail RC1 summary">
    <article class="metric-tile route">
      <span>Generated open-route</span>
      <strong>{formatNumber(data.rc1.routeMiles)}</strong>
      <small>generated miles · official:false</small>
    </article>
    <article class="metric-tile official">
      <span>Official 2026 reference</span>
      <strong>{formatNumber(data.rc1.officialReferenceMiles)}</strong>
      <small>ATC total-length reference only</small>
    </article>
    <article class="metric-tile delta">
      <span>Length delta</span>
      <strong>{formatSigned(data.rc1.routeLengthDeltaMiles)}</strong>
      <small>{formatSigned(data.rc1.routeLengthDeltaPercent)}% · {data.rc1.alignmentStatus.replaceAll('_', ' ')}</small>
    </article>
    <article class="metric-tile">
      <span>Datasets</span>
      <strong>{formatNumber(data.rc1.datasetCount)}</strong>
      <small>{safeShare}% production-safe export coverage</small>
    </article>
  </section>

  <section class="alignment-panel" aria-label="Route alignment diagnostics">
    <div class="section-head">
      <div>
        <p class="eyebrow">Route alignment</p>
        <h2>Open Geometry Vs Official Reference</h2>
      </div>
      <span class="status-pill {tone(data.rc1.alignmentStatus)}">{data.rc1.alignmentStatus.replaceAll('_', ' ')}</span>
    </div>
    <div class="alignment-grid">
      <article>
        <span>Local geodesic</span>
        <strong>{formatNumber(data.rc1.geodesicRouteMiles)}</strong>
        <small>miles from route vertices</small>
      </article>
      <article>
        <span>Waymarked</span>
        <strong>{formatNumber(data.rc1.waymarkedRouteMiles)}</strong>
        <small>reported source length</small>
      </article>
      <article>
        <span>3D screen</span>
        <strong>{formatNumber(data.rc1.threeDEstimateMiles)}</strong>
        <small>coarse elevation estimate</small>
      </article>
      <article>
        <span>Max continuity gap</span>
        <strong>{formatNumber(data.rc1.maxContinuityGapMiles)}</strong>
        <small>miles between route vertices</small>
      </article>
    </div>
    <div class="cause-grid">
      <div>
        <h3>Suspected causes</h3>
        {#each data.rc1.suspectedCauses as cause}
          <p>{cause}</p>
        {:else}
          <p class="muted">No suspected causes loaded.</p>
        {/each}
      </div>
      <div>
        <h3>Unresolved</h3>
        {#each data.rc1.unresolvedCauses as cause}
          <p>{cause}</p>
        {:else}
          <p class="muted">No unresolved causes loaded.</p>
        {/each}
      </div>
    </div>
    <p class="answer-rule">Report: {data.rc1.alignmentReportPath}. Scout should say "generated/open-route mile" unless an explicitly licensed official source is in use.</p>
  </section>

  <section class="release-board" aria-label="RC1 status board">
    <div class="board-main">
      <div class="section-head">
        <div>
          <p class="eyebrow">Release candidate</p>
          <h2>{data.rc1.routeId}</h2>
        </div>
        <span class="status-pill blue">Generated {data.rc1.ragDocCount} RAG docs</span>
      </div>

      <div class="status-grid">
        {#each data.rc1.statusRows as row}
          <article class="status-row {tone(row.status)}">
            <span>{row.area}</span>
            <strong>{row.status}</strong>
            <p>{row.notes}</p>
          </article>
        {/each}
      </div>
    </div>

    <aside class="yellow-flags" aria-label="Open yellow flags">
      <p class="eyebrow">Watch list</p>
      <h2>{data.rc1.yellowFlags.length} yellow flags</h2>
      {#each data.rc1.yellowFlags as flag}
        <article>
          <strong>{flag.area}</strong>
          <p>{flag.notes}</p>
        </article>
      {:else}
        <p class="muted">No yellow or red status rows.</p>
      {/each}
    </aside>
  </section>

  <section class="regional-strip" aria-label="Regional MVP validation progress">
    <div class="section-head">
      <div>
        <p class="eyebrow">Regional packs</p>
        <h2>MVP coverage</h2>
      </div>
    </div>

    <div class="pack-grid">
      {#each data.packs as pack}
        <article class="pack-card {tone(pack.status)}">
          <div>
            <span class="status-pill {tone(pack.status)}">{pack.status}</span>
            <h3>{pack.label}</h3>
            <p>{pack.region}</p>
          </div>
          <dl>
            <div><dt>Miles</dt><dd>{formatNumber(pack.miles)}</dd></div>
            <div><dt>Water</dt><dd>{formatNumber(pack.waterCandidates)}</dd></div>
            <div><dt>Tread</dt><dd>{formatNumber(pack.treadRecords)}</dd></div>
            <div><dt>QA</dt><dd>{formatNumber(pack.behaviorQuestions)}</dd></div>
          </dl>
        </article>
      {/each}
    </div>
  </section>

  <section class="resource-split" aria-label="Datasets and source safety">
    <div class="dataset-panel">
      <div class="section-head">
        <div>
          <p class="eyebrow">RC1 datasets</p>
          <h2>Production surface</h2>
        </div>
        <label>
          <span>Filter</span>
          <input bind:value={datasetQuery} placeholder="water, tread, safe, pointer..." />
        </label>
      </div>

      <div class="dataset-list">
        {#each visibleDatasets as dataset}
          <article>
            <div>
              <strong>{dataset.datasetId}</strong>
              <small>{dataset.path}</small>
            </div>
            <span>{formatNumber(dataset.recordCount)}</span>
            <span class="status-pill {tone(String(dataset.productionSafe))}">{dataset.productionSafe ? 'safe' : 'held'}</span>
          </article>
        {/each}
      </div>
    </div>

    <aside class="source-panel">
      <p class="eyebrow">Source health</p>
      <h2>{formatNumber(data.rc1.sourceCount)} sources</h2>
      <div class="source-bars">
        <div>
          <span>Production-safe</span>
          <strong>{formatNumber(data.rc1.productionSafeSourceCount)}</strong>
        </div>
        <div>
          <span>Blocked</span>
          <strong>{formatNumber(data.rc1.blockedSourceCount)}</strong>
        </div>
        <div>
          <span>Official reference</span>
          <strong>{formatNumber(data.rc1.officialReferenceMiles)}</strong>
        </div>
      </div>
      <p class="answer-rule">Generated/open-route miles are not official ATC mileage. Static resources cannot answer current closures, weather, permits, fords, or Baxter/Katahdin status.</p>
    </aside>
  </section>

  <section class="command-band" aria-label="Useful commands">
    <div class="section-head">
      <div>
        <p class="eyebrow">Operations</p>
        <h2>Regenerate and verify</h2>
      </div>
    </div>
    <div class="command-grid">
      {#each data.commands as command}
        <article>
          <span>{command.label}</span>
          <code>{command.command}</code>
        </article>
      {/each}
    </div>
  </section>
</section>

<style>
  :global(body) {
    background:
      linear-gradient(180deg, rgba(249, 250, 246, 0.96), rgba(231, 238, 224, 0.94)),
      url('/default-background.svg') center top / cover no-repeat;
  }

  .progress-shell {
    width: min(1420px, 100%);
    margin-inline: auto;
    color: #1f261f;
  }

  .progress-hero,
  .section-head,
  .dataset-panel .section-head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 1rem;
  }

  .progress-hero {
    padding: 1rem 0 0.9rem;
  }

  .progress-hero h1,
  .section-head h2,
  .yellow-flags h2,
  .source-panel h2,
  .pack-card h3 {
    margin: 0;
    color: var(--ink);
    font-family: Oswald, Impact, sans-serif;
    line-height: 0.98;
  }

  .progress-hero h1 {
    font-size: clamp(2.2rem, 5vw, 4.5rem);
  }

  .section-head h2,
  .yellow-flags h2,
  .source-panel h2 {
    font-size: clamp(1.55rem, 3vw, 2.5rem);
  }

  .lede,
  .muted,
  .answer-rule,
  .pack-card p,
  .status-row p,
  .yellow-flags p,
  .metric-tile small,
  .dataset-list small {
    color: #596658;
    line-height: 1.45;
  }

  .lede {
    max-width: 62ch;
    margin: 0.7rem 0 0;
    font-size: 1.02rem;
  }

  .hero-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 0.5rem;
  }

  .metric-grid,
  .pack-grid,
  .command-grid {
    display: grid;
    gap: 0.75rem;
  }

  .metric-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    margin-bottom: 0.9rem;
  }

  .metric-tile,
  .alignment-panel,
  .board-main,
  .yellow-flags,
  .regional-strip,
  .dataset-panel,
  .source-panel,
  .command-band {
    border: 1px solid rgba(77, 89, 74, 0.14);
    border-radius: 8px;
    background: rgba(255, 253, 248, 0.9);
    box-shadow: 0 12px 32px rgba(31, 41, 55, 0.05);
  }

  .metric-tile {
    display: grid;
    gap: 0.2rem;
    min-width: 0;
    padding: 0.95rem;
  }

  .metric-tile.route {
    background: linear-gradient(135deg, rgba(44, 78, 58, 0.96), rgba(33, 44, 36, 0.96));
    color: #fff;
  }

  .metric-tile.route small,
  .metric-tile.route span {
    color: rgba(255, 255, 255, 0.78);
  }

  .metric-tile.official {
    background: rgba(239, 244, 234, 0.92);
  }

  .metric-tile.delta {
    border-color: rgba(188, 122, 38, 0.34);
    background: rgba(255, 248, 235, 0.92);
  }

  .metric-tile span,
  .alignment-grid span,
  .command-grid span,
  .source-bars span,
  .dataset-panel label span {
    color: #657160;
    font-size: 0.75rem;
    font-weight: 950;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .metric-tile strong {
    color: inherit;
    font-family: Oswald, Impact, sans-serif;
    font-size: clamp(1.8rem, 4vw, 3.15rem);
    line-height: 1;
  }

  .release-board,
  .resource-split {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 360px;
    gap: 0.9rem;
    align-items: start;
  }

  .board-main,
  .alignment-panel,
  .yellow-flags,
  .regional-strip,
  .dataset-panel,
  .source-panel,
  .command-band {
    padding: 1rem;
  }

  .alignment-panel {
    margin-bottom: 0.9rem;
  }

  .alignment-grid,
  .cause-grid {
    display: grid;
    gap: 0.6rem;
    margin-top: 0.85rem;
  }

  .alignment-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .cause-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .alignment-grid article,
  .cause-grid > div {
    border: 1px solid rgba(77, 89, 74, 0.12);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.72);
    padding: 0.75rem;
  }

  .alignment-grid strong {
    display: block;
    margin-top: 0.1rem;
    color: var(--pine);
    font-family: Oswald, Impact, sans-serif;
    font-size: 1.55rem;
  }

  .alignment-grid small {
    color: #596658;
  }

  .cause-grid h3 {
    margin: 0 0 0.45rem;
    color: var(--ink);
    font-size: 0.92rem;
    text-transform: uppercase;
  }

  .cause-grid p {
    margin: 0.45rem 0 0;
    color: #596658;
    line-height: 1.4;
  }

  .status-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.6rem;
    margin-top: 0.85rem;
  }

  .status-row,
  .pack-card,
  .yellow-flags article,
  .dataset-list article,
  .command-grid article,
  .source-bars div {
    border: 1px solid rgba(77, 89, 74, 0.12);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.72);
  }

  .status-row {
    padding: 0.75rem;
  }

  .status-row > span {
    color: #657160;
    font-size: 0.78rem;
    font-weight: 900;
  }

  .status-row strong {
    display: block;
    margin: 0.15rem 0;
    text-transform: capitalize;
  }

  .green {
    border-color: rgba(49, 125, 76, 0.24);
  }

  .yellow {
    border-color: rgba(188, 122, 38, 0.32);
  }

  .red {
    border-color: rgba(174, 69, 67, 0.34);
  }

  .blue {
    border-color: rgba(63, 91, 137, 0.28);
  }

  .status-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 1.9rem;
    border-radius: 999px;
    padding: 0 0.65rem;
    font-size: 0.68rem;
    font-weight: 950;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .status-pill.green,
  .status-pill.true {
    color: #1f6541;
    background: rgba(55, 135, 81, 0.14);
  }

  .status-pill.yellow,
  .status-pill.false {
    color: #7a4a12;
    background: rgba(192, 124, 36, 0.15);
  }

  .status-pill.red {
    color: #8d2d2d;
    background: rgba(176, 67, 62, 0.14);
  }

  .status-pill.blue {
    color: #304f82;
    background: rgba(63, 91, 137, 0.13);
  }

  .yellow-flags {
    display: grid;
    gap: 0.6rem;
  }

  .yellow-flags article {
    padding: 0.72rem;
  }

  .yellow-flags strong {
    color: #3b3328;
  }

  .regional-strip,
  .resource-split,
  .command-band {
    margin-top: 0.9rem;
  }

  .pack-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    margin-top: 0.85rem;
  }

  .pack-card {
    display: grid;
    gap: 0.8rem;
    padding: 0.85rem;
  }

  .pack-card h3 {
    margin-top: 0.45rem;
    font-size: 1.55rem;
  }

  .pack-card dl {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.4rem;
    margin: 0;
  }

  .pack-card div:has(> dt) {
    display: grid;
    gap: 0.12rem;
    min-width: 0;
  }

  .pack-card dt {
    color: #657160;
    font-size: 0.68rem;
    font-weight: 950;
    text-transform: uppercase;
  }

  .pack-card dd {
    margin: 0;
    color: var(--ink);
    font-family: Oswald, Impact, sans-serif;
    font-size: 1.28rem;
  }

  .dataset-panel label {
    display: grid;
    gap: 0.3rem;
    min-width: min(100%, 320px);
  }

  .dataset-panel input {
    min-height: 2.45rem;
    border: 1px solid rgba(77, 89, 74, 0.18);
    border-radius: 8px;
    background: #fff;
    color: var(--ink);
    padding: 0 0.75rem;
    font: inherit;
  }

  .dataset-list,
  .source-bars {
    display: grid;
    gap: 0.48rem;
    margin-top: 0.8rem;
  }

  .dataset-list article {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 100px 76px;
    gap: 0.75rem;
    align-items: center;
    padding: 0.72rem;
  }

  .dataset-list strong {
    display: block;
    color: var(--ink);
  }

  .dataset-list > article > span:not(.status-pill) {
    color: var(--pine);
    font-family: Oswald, Impact, sans-serif;
    font-size: 1.35rem;
    text-align: right;
  }

  .source-bars div {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.75rem;
  }

  .source-bars strong {
    color: var(--pine);
    font-family: Oswald, Impact, sans-serif;
    font-size: 1.55rem;
  }

  .answer-rule {
    margin: 1rem 0 0;
  }

  .command-grid {
    grid-template-columns: repeat(5, minmax(0, 1fr));
    margin-top: 0.85rem;
  }

  .command-grid article {
    display: grid;
    gap: 0.5rem;
    padding: 0.75rem;
  }

  code {
    min-height: 4.5rem;
    overflow-wrap: anywhere;
    border-radius: 6px;
    background: #182018;
    color: #e7f0df;
    padding: 0.65rem;
    font-size: 0.78rem;
    line-height: 1.45;
  }

  @media (max-width: 980px) {
    .metric-grid,
    .alignment-grid,
    .pack-grid,
    .command-grid,
    .status-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .release-board,
    .resource-split {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 680px) {
    .progress-hero,
    .section-head,
    .dataset-panel .section-head {
      align-items: stretch;
      flex-direction: column;
    }

    .metric-grid,
    .alignment-grid,
    .cause-grid,
    .pack-grid,
    .command-grid,
    .status-grid {
      grid-template-columns: 1fr;
    }

    .dataset-list article {
      grid-template-columns: 1fr;
    }

    .dataset-list > article > span:not(.status-pill) {
      text-align: left;
    }
  }
</style>
