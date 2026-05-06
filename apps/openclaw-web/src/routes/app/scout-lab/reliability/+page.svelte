<script lang="ts">
  import { resolve } from '$app/paths';
  import type { PageData } from './$types';

  const { data } = $props<{ data: PageData }>();

  let difficulty = $state('all');
  let region = $state('all');
  let status = $state('all');
  let search = $state('');
  let selectedScenarioId = $state('');
  let selectedRunId = $state('');
  let compareLeftId = $state('');
  let compareRightId = $state('');

  const regions = $derived([...new Set(data.scenarios.map((scenario) => scenario.regionState))].sort());
  const difficulties = $derived([...new Set(data.scenarios.map((scenario) => scenario.difficulty))].sort((left, right) => left - right));
  const selectedRun = $derived(data.runs.find((run) => run.metadata.runId === selectedRunId) ?? data.runs[0] ?? null);
  const activeScenarioId = $derived(selectedScenarioId || selectedRun?.results[0]?.scenarioId || data.scenarios[0]?.id || '');
  const selectedScenario = $derived(data.scenarios.find((scenario) => scenario.id === activeScenarioId) ?? data.scenarios[0] ?? null);
  const selectedResult = $derived(selectedRun?.results.find((result) => result.scenarioId === selectedScenario?.id) ?? null);
  const leftRun = $derived(data.runs.find((run) => run.metadata.runId === (compareLeftId || data.runs[1]?.metadata.runId || data.runs[0]?.metadata.runId)) ?? null);
  const rightRun = $derived(data.runs.find((run) => run.metadata.runId === (compareRightId || data.runs[0]?.metadata.runId)) ?? null);

  const resultByScenario = $derived.by(() => {
    const map: Record<string, string> = {};
    for (const result of selectedRun?.results ?? []) {
      map[result.scenarioId] = result.status;
    }
    return map;
  });

  const filteredScenarios = $derived.by(() => {
    const term = search.trim().toLowerCase();
    return data.scenarios.filter((scenario) => {
      const scenarioStatus = resultByScenario[scenario.id] ?? 'not-run';
      if (difficulty !== 'all' && scenario.difficulty !== Number(difficulty)) return false;
      if (region !== 'all' && scenario.regionState !== region) return false;
      if (status !== 'all' && scenarioStatus !== status) return false;
      if (term && !`${scenario.id} ${scenario.prompt} ${scenario.regionState} ${scenario.expectedPlanType}`.toLowerCase().includes(term)) return false;
      return true;
    });
  });

  const comparisonRows = $derived.by(() => {
    if (!leftRun || !rightRun) return [];
    const left = new Map(leftRun.results.map((result) => [result.scenarioId, result.status]));
    const right = new Map(rightRun.results.map((result) => [result.scenarioId, result.status]));
    return data.scenarios.map((scenario) => {
      const before = left.get(scenario.id) ?? 'not-run';
      const after = right.get(scenario.id) ?? 'not-run';
      const change = before === after
        ? 'same'
        : before !== 'passed' && after === 'passed'
          ? 'newly passing'
          : before === 'passed' && after !== 'passed'
            ? 'regression'
            : 'changed';
      return { scenario, before, after, change };
    }).filter((row) => row.change !== 'same');
  });

  function statusLabel(value: string | undefined): string {
    if (!value) return 'not run';
    return value.replace('-', ' ');
  }
</script>

<svelte:head>
  <title>Scout Reliability Lab | Hogg Country</title>
</svelte:head>

<section class="reliability-shell">
  <header class="lab-header">
    <div>
      <p class="eyebrow">Scout lab</p>
      <h1>Reliability runs</h1>
      <p class="muted">Scenario suite, deterministic checks, raw Scout output, and run-to-run changes for AT planning QA.</p>
    </div>
    <a class="back-link" href={resolve('/app/scout-lab')}>Scout lab</a>
  </header>

  <section class="run-strip" aria-label="Reliability run summary">
    {#each data.runs as run (run.metadata.runId)}
      <button
        class:selected={selectedRun?.metadata.runId === run.metadata.runId}
        class="run-tile"
        type="button"
        onclick={() => {
          selectedRunId = run.metadata.runId;
        }}
      >
        <span>{run.metadata.environment}</span>
        <strong>{run.metadata.passFailCounts.passed}/{run.metadata.scenarioCount}</strong>
        <small>{new Date(run.metadata.timestamp).toLocaleString()}</small>
      </button>
    {/each}
    {#if data.runs.length === 0}
      <p class="empty-state">No reliability run artifacts found in {data.dataRoot}.</p>
    {/if}
  </section>

  {#if selectedRun}
    <section class="metadata-grid" aria-label="Selected run metadata">
      <div>
        <span class="label">Run id</span>
        <strong>{selectedRun.metadata.runId}</strong>
      </div>
      <div>
        <span class="label">Commit</span>
        <strong>{selectedRun.metadata.gitCommitSha.slice(0, 12)}</strong>
      </div>
      <div>
        <span class="label">Model</span>
        <strong>{selectedRun.metadata.model}</strong>
      </div>
      <div>
        <span class="label">Mode</span>
        <strong>{selectedRun.metadata.mode}</strong>
      </div>
      <div>
        <span class="label">Difficulty</span>
        <strong>{selectedRun.metadata.difficultyRangeTested?.join('-') ?? 'all'}</strong>
      </div>
      <div>
        <span class="label">Forge release</span>
        <strong>{selectedRun.metadata.forgeReleaseId ?? selectedRun.metadata.deployedRevision ?? 'not recorded'}</strong>
      </div>
    </section>
  {/if}

  <section class="workspace-grid">
    <aside class="scenario-column" aria-label="Scenario filters and list">
      <div class="filter-grid">
        <label>
          Difficulty
          <select bind:value={difficulty}>
            <option value="all">All</option>
            {#each difficulties as item (item)}
              <option value={String(item)}>{item}</option>
            {/each}
          </select>
        </label>
        <label>
          Region
          <select bind:value={region}>
            <option value="all">All</option>
            {#each regions as item (item)}
              <option value={item}>{item}</option>
            {/each}
          </select>
        </label>
        <label>
          Status
          <select bind:value={status}>
            <option value="all">All</option>
            <option value="passed">Passed</option>
            <option value="failed">Failed</option>
            <option value="skipped">Skipped</option>
            <option value="not-run">Not run</option>
          </select>
        </label>
        <label>
          Scenario id
          <input bind:value={search} placeholder="harpers, baxter, dad" />
        </label>
      </div>

      <div class="scenario-list">
        {#each filteredScenarios as scenario (scenario.id)}
          <button
            class:selected={selectedScenario?.id === scenario.id}
            class="scenario-row"
            type="button"
            onclick={() => {
              selectedScenarioId = scenario.id;
            }}
          >
            <span class:passed={resultByScenario[scenario.id] === 'passed'} class:failed={resultByScenario[scenario.id] === 'failed'} class="status-dot"></span>
            <strong>{scenario.id}</strong>
            <small>Difficulty {scenario.difficulty} · {statusLabel(resultByScenario[scenario.id])}</small>
          </button>
        {/each}
      </div>
    </aside>

    <main class="detail-column" aria-label="Scenario detail">
      {#if selectedScenario}
        <section class="detail-panel">
          <div class="panel-heading">
            <div>
              <p class="eyebrow">{selectedScenario.regionState}</p>
              <h2>{selectedScenario.id}</h2>
            </div>
            <span class="difficulty-pill">D{selectedScenario.difficulty}</span>
          </div>
          <p class="prompt-text">{selectedScenario.prompt}</p>

          <div class="facts-grid">
            <div>
              <span class="label">Expected corridor</span>
              <p>{selectedScenario.expectedCorridor}</p>
            </div>
            <div>
              <span class="label">Start / end</span>
              <p>{selectedScenario.expectedStart} -> {selectedScenario.expectedEnd}</p>
            </div>
            <div>
              <span class="label">Plan type</span>
              <p>{selectedScenario.expectedPlanType}</p>
            </div>
            <div>
              <span class="label">Strict route</span>
              <p>{selectedScenario.deterministicStrictRouteSupport}</p>
            </div>
          </div>

          <div class="split">
            <div>
              <h3>Required caveats</h3>
              <ul>
                {#each selectedScenario.requiredCaveats as caveat (caveat)}
                  <li>{caveat}</li>
                {/each}
              </ul>
            </div>
            <div>
              <h3>Disallowed mistakes</h3>
              <ul>
                {#each selectedScenario.disallowedMistakes as mistake (mistake)}
                  <li>{mistake}</li>
                {/each}
              </ul>
            </div>
          </div>
        </section>

        <section class="detail-panel">
          <div class="panel-heading">
            <h2>Run result</h2>
            <span class={`result-pill ${selectedResult?.status ?? 'not-run'}`}>{statusLabel(selectedResult?.status)}</span>
          </div>

          {#if selectedResult}
            {#if selectedResult.failureReason}
              <p class="failure">{selectedResult.failureReason}</p>
            {/if}

            <div class="assertion-list">
              {#each selectedResult.assertions as assertion (assertion.id)}
                <div class:passed={assertion.passed} class:failed={!assertion.passed} class="assertion-row">
                  <span>{assertion.passed ? 'pass' : 'fail'}</span>
                  <p>{assertion.label}</p>
                </div>
              {/each}
            </div>

            <div class="facts-grid">
              <div>
                <span class="label">Source receipts</span>
                <p>{selectedResult.sourceReceipts?.join(', ') || 'none recorded'}</p>
              </div>
              <div>
                <span class="label">Missing source classes</span>
                <p>{selectedResult.missingSourceClasses?.join(', ') || 'none recorded'}</p>
              </div>
              <div>
                <span class="label">Manual review</span>
                <p>{selectedResult.manualReview?.status ?? 'not-reviewed'}{selectedResult.manualReview?.notes ? `: ${selectedResult.manualReview.notes}` : ''}</p>
              </div>
            </div>

            <details class="raw-response" open>
              <summary>Raw Scout response</summary>
              <pre>{selectedResult.rawResponse || 'No raw response recorded.'}</pre>
            </details>
          {:else}
            <p class="empty-state">This scenario was not included in the selected run.</p>
          {/if}
        </section>
      {/if}
    </main>
  </section>

  <section class="comparison-panel" aria-label="Run comparison">
    <div class="panel-heading">
      <h2>Compare runs</h2>
      <div class="compare-controls">
        <select bind:value={compareLeftId}>
          {#each data.runs as run (run.metadata.runId)}
            <option value={run.metadata.runId}>{run.metadata.runId}</option>
          {/each}
        </select>
        <select bind:value={compareRightId}>
          {#each data.runs as run (run.metadata.runId)}
            <option value={run.metadata.runId}>{run.metadata.runId}</option>
          {/each}
        </select>
      </div>
    </div>

    {#if selectedRun}
      <div class="patch-notes">
        <div>
          <span class="label">Commit message</span>
          <p>{selectedRun.metadata.gitCommitMessage}</p>
        </div>
        <div>
          <span class="label">Patch notes</span>
          <p>{selectedRun.metadata.patchNotes || 'No patch notes recorded.'}</p>
        </div>
        <div>
          <span class="label">Changed files</span>
          <p>{selectedRun.metadata.changedFiles.length > 0 ? selectedRun.metadata.changedFiles.join(', ') : 'none recorded'}</p>
        </div>
        <div>
          <span class="label">Deployment notes</span>
          <p>{selectedRun.metadata.deploymentNotes || 'No deployment notes recorded.'}</p>
        </div>
        <div>
          <span class="label">Known remaining failures</span>
          <p>{selectedRun.metadata.knownRemainingFailures || 'None recorded for this run.'}</p>
        </div>
      </div>
    {/if}

    {#if comparisonRows.length > 0}
      <div class="comparison-list">
        {#each comparisonRows as row (row.scenario.id)}
          <div class={`comparison-row ${row.change.replace(' ', '-')}`}>
            <strong>{row.scenario.id}</strong>
            <span>{statusLabel(row.before)} -> {statusLabel(row.after)}</span>
            <em>{row.change}</em>
          </div>
        {/each}
      </div>
    {:else}
      <p class="empty-state">No pass/fail changes between the selected runs.</p>
    {/if}
  </section>
</section>

<style>
  .reliability-shell {
    display: grid;
    gap: 1rem;
  }

  .lab-header,
  .panel-heading,
  .compare-controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .lab-header h1,
  .panel-heading h2 {
    margin: 0;
  }

  .back-link {
    color: var(--color-accent, #256f4f);
    font-weight: 700;
    text-decoration: none;
  }

  .run-strip {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 0.75rem;
  }

  .run-tile,
  .scenario-row {
    border: 1px solid var(--color-border, #d8d0c2);
    border-radius: 8px;
    background: var(--color-surface, #fffaf0);
    color: inherit;
    cursor: pointer;
    text-align: left;
  }

  .run-tile {
    display: grid;
    gap: 0.2rem;
    padding: 0.85rem;
  }

  .run-tile strong {
    font-size: 1.45rem;
  }

  .selected {
    border-color: var(--color-accent, #256f4f);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-accent, #256f4f) 18%, transparent);
  }

  .metadata-grid,
  .facts-grid,
  .patch-notes {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
    gap: 0.75rem;
  }

  .metadata-grid,
  .detail-panel,
  .comparison-panel {
    border: 1px solid var(--color-border, #d8d0c2);
    border-radius: 8px;
    background: color-mix(in srgb, var(--color-surface, #fffaf0) 82%, white);
    padding: 1rem;
  }

  .label {
    display: block;
    color: var(--color-muted, #776b5c);
    font-size: 0.78rem;
    font-weight: 700;
    text-transform: uppercase;
  }

  .workspace-grid {
    display: grid;
    grid-template-columns: minmax(240px, 320px) minmax(0, 1fr);
    gap: 1rem;
    align-items: start;
  }

  .scenario-column,
  .detail-column {
    display: grid;
    gap: 1rem;
  }

  .filter-grid {
    display: grid;
    gap: 0.65rem;
  }

  label {
    display: grid;
    gap: 0.25rem;
    color: var(--color-muted, #776b5c);
    font-size: 0.85rem;
    font-weight: 700;
  }

  select,
  input {
    width: 100%;
    border: 1px solid var(--color-border, #d8d0c2);
    border-radius: 6px;
    background: white;
    color: inherit;
    padding: 0.55rem 0.65rem;
  }

  .scenario-list {
    display: grid;
    gap: 0.45rem;
    max-height: 720px;
    overflow: auto;
    padding-right: 0.15rem;
  }

  .scenario-row {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.15rem 0.55rem;
    padding: 0.7rem;
  }

  .scenario-row small {
    grid-column: 2;
    color: var(--color-muted, #776b5c);
  }

  .status-dot {
    width: 0.65rem;
    height: 0.65rem;
    border-radius: 999px;
    background: #9b8f7f;
    margin-top: 0.25rem;
  }

  .status-dot.passed,
  .result-pill.passed,
  .assertion-row.passed span {
    background: #1f7a4d;
  }

  .status-dot.failed,
  .result-pill.failed,
  .assertion-row.failed span {
    background: #b93a32;
  }

  .difficulty-pill,
  .result-pill {
    border-radius: 999px;
    padding: 0.25rem 0.55rem;
    font-size: 0.78rem;
    font-weight: 800;
  }

  .difficulty-pill {
    background: #efe3c8;
  }

  .result-pill {
    background: #8f836f;
    color: white;
  }

  .prompt-text {
    border-left: 3px solid var(--color-accent, #256f4f);
    margin: 1rem 0;
    padding-left: 0.85rem;
  }

  .split {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
  }

  .split ul {
    margin: 0.4rem 0 0;
    padding-left: 1.1rem;
  }

  .assertion-list,
  .comparison-list {
    display: grid;
    gap: 0.45rem;
    margin: 1rem 0;
  }

  .assertion-row,
  .comparison-row {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.6rem;
    align-items: center;
    border: 1px solid var(--color-border, #d8d0c2);
    border-radius: 6px;
    padding: 0.55rem;
  }

  .assertion-row span {
    border-radius: 999px;
    color: white;
    font-size: 0.7rem;
    font-weight: 800;
    padding: 0.16rem 0.42rem;
  }

  .failure {
    color: #8a2520;
    font-weight: 700;
  }

  .raw-response {
    margin-top: 1rem;
  }

  pre {
    max-height: 520px;
    overflow: auto;
    border: 1px solid var(--color-border, #d8d0c2);
    border-radius: 6px;
    background: #1f2522;
    color: #f5f0e5;
    padding: 1rem;
    white-space: pre-wrap;
  }

  .comparison-row {
    grid-template-columns: minmax(180px, 1fr) auto auto;
  }

  .comparison-row.newly-passing {
    border-color: #1f7a4d;
  }

  .comparison-row.regression {
    border-color: #b93a32;
  }

  .empty-state {
    color: var(--color-muted, #776b5c);
    margin: 0;
  }

  @media (max-width: 860px) {
    .lab-header,
    .panel-heading,
    .compare-controls {
      align-items: flex-start;
      flex-direction: column;
    }

    .workspace-grid,
    .split {
      grid-template-columns: 1fr;
    }

    .scenario-list {
      max-height: 360px;
    }

    .comparison-row {
      grid-template-columns: 1fr;
    }
  }
</style>
