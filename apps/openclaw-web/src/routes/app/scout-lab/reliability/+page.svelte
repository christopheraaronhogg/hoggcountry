<script lang="ts">
  import { resolve } from '$app/paths';
  import type { PageData } from './$types';

  const { data } = $props<{ data: PageData }>();

  type RunArtifact = PageData['runs'][number];
  type Scenario = PageData['scenarios'][number];
  type ScenarioResult = RunArtifact['results'][number];
  type ArenaGroup = PageData['groups'][number];

  let difficulty = $state('all');
  let region = $state('all');
  let status = $state('all');
  let model = $state('all');
  let environment = $state('all');
  let revision = $state('all');
  let executionMode = $state('all');
  let severity = $state('all');
  let search = $state('');
  let selectedScenarioId = $state('');
  let selectedGroupKey = $state('');
  let selectedRunId = $state('');
  let compareLeftId = $state('');
  let compareRightId = $state('');

  const regions = $derived([...new Set(data.scenarios.map((scenario) => scenario.regionState))].sort());
  const difficulties = $derived([...new Set(data.scenarios.map((scenario) => scenario.difficulty))].sort((left, right) => left - right));
  const models = $derived([...new Set(data.groups.map((group) => group.modelDisplayName))].sort());
  const environments = $derived([...new Set(data.groups.map((group) => group.environment))].sort());
  const revisions = $derived([...new Set(data.groups.map((group) => shortRepo(group)).filter(Boolean))].sort());
  const executionModes = $derived([...new Set(data.scenarios.map((scenario) => scenario.expectedExecutionMode ?? scenario.deterministicStrictRouteSupport))].sort());
  const hardCategories = [
    'mixed multi-part prompts',
    'ambiguous landmarks',
    'mental halfway vs true halfway',
    'impossible mileage',
    'permit-heavy areas',
    'legal camping restrictions',
    'national park rules',
    'unreliable water',
    'long food carries',
    'sparse bailout/resupply',
    'high-consequence weather',
    'closures/detours',
    'family/dad hike plus separate solo overnight'
  ];

  const filteredGroups = $derived.by(() => {
    return data.groups.filter((group) => {
      if (model !== 'all' && group.modelDisplayName !== model) return false;
      if (environment !== 'all' && group.environment !== environment) return false;
      if (revision !== 'all' && shortRepo(group) !== revision) return false;
      return true;
    });
  });

  const filteredRuns = $derived.by(() => {
    return data.runs.filter((run) => {
      if (model !== 'all' && modelLabel(run) !== model) return false;
      if (environment !== 'all' && run.metadata.environment !== environment) return false;
      if (revision !== 'all' && shortSha(run) !== revision) return false;
      return true;
    });
  });

  const selectedGroup = $derived(data.groups.find((group) => group.groupKey === selectedGroupKey) ?? filteredGroups[0] ?? data.groups[0] ?? null);
  const selectedGroupRuns = $derived(selectedGroup ? runsForGroup(selectedGroup) : filteredRuns);
  const selectedRun = $derived(
    selectedGroupRuns.find((run) => run.metadata.runId === selectedRunId) ?? selectedGroupRuns[0] ?? filteredRuns[0] ?? data.runs[0] ?? null
  );
  const matrixRuns = $derived(selectedGroupRuns.slice(0, 8));
  const activeScenarioId = $derived(selectedScenarioId || selectedRun?.results[0]?.scenarioId || data.scenarios[0]?.id || '');
  const selectedScenario = $derived(data.scenarios.find((scenario) => scenario.id === activeScenarioId) ?? data.scenarios[0] ?? null);
  const selectedResult = $derived(selectedRun?.results.find((result) => result.scenarioId === selectedScenario?.id) ?? null);
  const leftRun = $derived(data.runs.find((run) => run.metadata.runId === (compareLeftId || data.runs[1]?.metadata.runId || data.runs[0]?.metadata.runId)) ?? null);
  const rightRun = $derived(data.runs.find((run) => run.metadata.runId === (compareRightId || data.runs[0]?.metadata.runId)) ?? null);
  const leftResult = $derived(leftRun?.results.find((result) => result.scenarioId === selectedScenario?.id) ?? null);
  const rightResult = $derived(rightRun?.results.find((result) => result.scenarioId === selectedScenario?.id) ?? null);

  const leaderboard = $derived(filteredGroups.slice(0, 16));

  const selectedResultByScenario = $derived.by(() => {
    const map: Record<string, ScenarioResult> = {};
    for (const result of selectedRun?.results ?? []) {
      map[result.scenarioId] = result;
    }
    return map;
  });

  const filteredScenarios = $derived.by(() => {
    const term = search.trim().toLowerCase();
    return data.scenarios.filter((scenario) => {
      const result = selectedResultByScenario[scenario.id];
      const scenarioStatus = result?.status ?? 'not-run';
      const flags = result?.score?.severityFlags ?? [];
      if (difficulty !== 'all' && scenario.difficulty !== Number(difficulty)) return false;
      if (region !== 'all' && scenario.regionState !== region) return false;
      if (status !== 'all' && scenarioStatus !== status) return false;
      if (executionMode !== 'all' && (scenario.expectedExecutionMode ?? scenario.deterministicStrictRouteSupport) !== executionMode) return false;
      if (severity === 'safety-risk' && !flags.includes('safety risk')) return false;
      if (severity === 'wrong-corridor' && !flags.includes('wrong corridor')) return false;
      if (severity === 'blocker' && !flags.includes('blocker') && !flags.includes('not-covered')) return false;
      if (term && !`${scenario.id} ${scenario.prompt} ${scenario.regionState} ${scenario.expectedPlanType}`.toLowerCase().includes(term)) return false;
      return true;
    });
  });

  const comparisonRows = $derived.by(() => {
    if (!leftRun || !rightRun) return [];
    const left = new Map(leftRun.results.map((result) => [result.scenarioId, result]));
    const right = new Map(rightRun.results.map((result) => [result.scenarioId, result]));
    return data.scenarios.map((scenario) => {
      const before = left.get(scenario.id) ?? null;
      const after = right.get(scenario.id) ?? null;
      const beforeStatus = before?.status ?? 'not-run';
      const afterStatus = after?.status ?? 'not-run';
      const beforeScore = resultScore(before);
      const afterScore = resultScore(after);
      const scoreDelta = afterScore - beforeScore;
      const change = beforeStatus === afterStatus && scoreDelta === 0
        ? 'same'
        : beforeStatus !== 'passed' && afterStatus === 'passed'
          ? 'newly passing'
          : beforeStatus === 'passed' && afterStatus !== 'passed'
            ? 'regression'
            : scoreDelta > 0
              ? 'score up'
              : scoreDelta < 0
                ? 'score down'
                : 'changed';
      return { scenario, before, after, beforeStatus, afterStatus, beforeScore, afterScore, scoreDelta, change };
    }).filter((row) => row.change !== 'same');
  });

  function modelLabel(run: RunArtifact): string {
    return run.metadata.modelDisplayName || run.metadata.model || run.metadata.modelId || 'unknown model';
  }

  function shortSha(run: RunArtifact): string {
    return (run.metadata.siteGitSha || run.metadata.gitCommitSha || '').slice(0, 12);
  }

  function shortRepo(group: ArenaGroup): string {
    return group.repoSha.slice(0, 12);
  }

  function runsForGroup(group: ArenaGroup): RunArtifact[] {
    const ids = new Set(group.runIds);
    return data.runs.filter((run) => ids.has(run.metadata.runId));
  }

  function latestRunForGroup(group: ArenaGroup): RunArtifact | null {
    return data.runs.find((run) => run.metadata.runId === group.latestRunId) ?? null;
  }

  function resultScore(result: ScenarioResult | null | undefined): number {
    if (!result) return 0;
    if (typeof result.score?.total === 'number') return result.score.total;
    if (result.status === 'passed') return 100;
    return 0;
  }

  function scoreClass(score: number): string {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 50) return 'warn';
    return 'bad';
  }

  function runSummary(run: RunArtifact) {
    const tested = run.results.filter((result) => result.status !== 'skipped');
    const scores = tested.map(resultScore);
    const allScores = run.results.map(resultScore);
    const averageScore = run.metadata.scoreSummary?.averageScore ?? (scores.length ? Math.round(scores.reduce((total, item) => total + item, 0) / scores.length) : 0);
    const coverageScore = run.metadata.scoreSummary?.coverageScore ?? (allScores.length ? Math.round(allScores.reduce((total, item) => total + item, 0) / allScores.length) : 0);
    const blockerCount = run.metadata.scoreSummary?.blockerCount ?? run.results.filter((result) => result.score?.severityFlags?.some((flag) => flag === 'blocker' || flag === 'wrong corridor' || flag === 'not-covered')).length;
    const safetyRiskCount = run.metadata.scoreSummary?.safetyRiskCount ?? run.results.filter((result) => result.score?.severityFlags?.includes('safety risk')).length;
    const passRate = run.metadata.scoreSummary?.passRate ?? (tested.length ? Math.round((run.metadata.passFailCounts.passed / tested.length) * 100) : 0);
    return { averageScore, coverageScore, blockerCount, safetyRiskCount, passRate };
  }

  function statusLabel(value: string | undefined): string {
    if (!value) return 'not run';
    return value.replace('-', ' ');
  }

  function resultFor(run: RunArtifact, scenario: Scenario): ScenarioResult | null {
    return run.results.find((result) => result.scenarioId === scenario.id) ?? null;
  }

  function difficultyCoverage(run: RunArtifact): string {
    return run.metadata.difficultyRangeTested?.join('-') ?? 'all';
  }

  function flagsLabel(result: ScenarioResult | null | undefined): string {
    return result?.score?.severityFlags?.join(', ') || 'none';
  }

  function formatDate(value: string): string {
    return new Date(value).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  }

  function averageValues(values: number[]): number {
    return values.length > 0 ? Math.round(values.reduce((total, item) => total + item, 0) / values.length) : 0;
  }

  function bandSummary(group: ArenaGroup | null, min: number, max: number) {
    const scenarioIds = data.scenarios
      .filter((scenario) => scenario.difficulty >= min && scenario.difficulty <= max)
      .map((scenario) => scenario.id);
    const rows = group?.scenarioConsistency.filter((row) => scenarioIds.includes(row.scenarioId)) ?? [];
    return {
      label: `D${min}-${max}`,
      total: scenarioIds.length,
      covered: rows.length,
      averageScore: averageValues(rows.map((row) => row.averageScore)),
      passRate: averageValues(rows.map((row) => row.passRate)),
      riskCount: rows.filter((row) => row.severityFlags.some((flag) => flag === 'safety risk' || flag === 'wrong corridor' || flag === 'blocker')).length
    };
  }

  function hardCategoryCount(category: string): number {
    const terms = category.toLowerCase().split(/[^a-z0-9]+/u).filter((term) => term.length > 3);
    return data.scenarios.filter((scenario) => {
      const text = `${scenario.id} ${scenario.prompt} ${scenario.difficultyRationale} ${scenario.requiredCaveats.join(' ')} ${scenario.disallowedMistakes.join(' ')}`.toLowerCase();
      return terms.some((term) => text.includes(term));
    }).length;
  }
</script>

<svelte:head>
  <title>Scout Planning Arena | Hogg Country</title>
</svelte:head>

<section class="arena-shell">
  <header class="arena-header">
    <div>
      <p class="eyebrow">Scout lab</p>
      <h1>Scout Planning Arena</h1>
      <p class="muted">Compare AT planning quality across models, site revisions, runs, patch notes, scores, and raw responses.</p>
    </div>
    <a class="back-link" href={resolve('/app/scout-lab')}>Scout lab</a>
  </header>

  <section class="leaderboard" aria-label="Planning arena leaderboard">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Leaderboard</p>
        <h2>Grouped model / repo scorecards</h2>
      </div>
      <span>{data.groups.length} groups · {data.runs.length} runs · {data.scenarios.length} scenarios</span>
    </div>
    <div class="leaderboard-table" role="table" aria-label="Grouped model and revision leaderboard">
      <div class="leaderboard-row header" role="row">
        <span>Rank</span>
        <span>Model / repo / env</span>
        <span>Runs</span>
        <span>Avg</span>
        <span>Best</span>
        <span>Pass</span>
        <span>Critical failures</span>
        <span>Coverage</span>
        <span>Latest</span>
      </div>
      {#each leaderboard as group (group.groupKey)}
        {@const latestRun = latestRunForGroup(group)}
        <button
          class:active={selectedGroup?.groupKey === group.groupKey}
          class="leaderboard-row"
          type="button"
          role="row"
          onclick={() => {
            selectedGroupKey = group.groupKey;
            selectedRunId = group.latestRunId;
            compareRightId = group.latestRunId;
          }}
        >
          <span>#{group.rank}</span>
          <span>
            <strong>{group.modelDisplayName}</strong>
            <small>{shortRepo(group)} · {group.environment} · {group.modelProvider}</small>
            <em>{group.patchNotesSummary}</em>
          </span>
          <span>{group.runCount}</span>
          <span class={`score-badge ${scoreClass(group.averageScore)}`}>{group.averageScore}</span>
          <span>{group.bestScore}</span>
          <span>{group.averagePassRate}%</span>
          <span>{group.blockerCount} blockers · {group.safetyRiskCount} safety · {group.wrongCorridorCount} corridor</span>
          <span>D{group.difficultyCoverage} · ~{group.scenarioCountAverage} scenarios · {group.scenarioLevelConsistency}% consistent</span>
          <span>{formatDate(group.latestRunTimestamp)}<small>{latestRun?.metadata.gitCommitMessage ?? 'No commit message'}</small></span>
        </button>
      {/each}
      {#if leaderboard.length === 0}
        <p class="empty-state">No grouped results match the current filters.</p>
      {/if}
    </div>
  </section>

  <section class="filters-panel" aria-label="Arena filters">
    <label>
      Model
      <select bind:value={model}>
        <option value="all">All</option>
        {#each models as item (item)}
          <option value={item}>{item}</option>
        {/each}
      </select>
    </label>
    <label>
      Environment
      <select bind:value={environment}>
        <option value="all">All</option>
        {#each environments as item (item)}
          <option value={item}>{item}</option>
        {/each}
      </select>
    </label>
    <label>
      Revision
      <select bind:value={revision}>
        <option value="all">All</option>
        {#each revisions as item (item)}
          <option value={item}>{item}</option>
        {/each}
      </select>
    </label>
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
      Result
      <select bind:value={status}>
        <option value="all">All</option>
        <option value="passed">Passed</option>
        <option value="failed">Failed</option>
        <option value="skipped">Skipped</option>
        <option value="not-run">Not run</option>
      </select>
    </label>
    <label>
      Scenario type
      <select bind:value={executionMode}>
        <option value="all">All</option>
        {#each executionModes as item (item)}
          <option value={item}>{item}</option>
        {/each}
      </select>
    </label>
    <label>
      Severity
      <select bind:value={severity}>
        <option value="all">All</option>
        <option value="blocker">Blocker / not covered</option>
        <option value="safety-risk">Safety risk</option>
        <option value="wrong-corridor">Wrong corridor</option>
      </select>
    </label>
    <label class="wide">
      Search
      <input bind:value={search} placeholder="harpers, baxter, water, family" />
    </label>
  </section>

  <section class="group-summary" aria-label="Selected grouped result summary">
    {#if selectedGroup}
      <div>
        <span class="label">Selected scorecard</span>
        <strong>{selectedGroup.modelDisplayName}</strong>
        <p>{shortRepo(selectedGroup)} · {selectedGroup.environment} · {selectedGroup.runCount} run{selectedGroup.runCount === 1 ? '' : 's'}</p>
      </div>
      <div>
        <span class="label">Score range</span>
        <strong>{selectedGroup.worstScore}–{selectedGroup.bestScore}</strong>
        <p>Average {selectedGroup.averageScore}; pass {selectedGroup.averagePassRate}%</p>
      </div>
      <div>
        <span class="label">Risk frequency</span>
        <strong>{selectedGroup.blockerFrequency} blockers/run</strong>
        <p>{selectedGroup.safetyRiskFrequency} safety/run · {selectedGroup.wrongCorridorFrequency} corridor/run</p>
      </div>
      <div>
        <span class="label">Changed areas</span>
        <p>{selectedGroup.changedAreas.join(', ') || 'None recorded'}</p>
      </div>
    {/if}
  </section>

  <section class="run-strip" aria-label="Runs inside selected grouped result">
    {#each selectedGroupRuns as run (run.metadata.runId)}
      {@const summary = runSummary(run)}
      <button
        class:selected={selectedRun?.metadata.runId === run.metadata.runId}
        class="run-tile"
        type="button"
        onclick={() => {
          selectedRunId = run.metadata.runId;
        }}
      >
        <span>{run.metadata.environment}</span>
        <strong>{summary.coverageScore}</strong>
        <small>{modelLabel(run)} · {run.metadata.passFailCounts.passed}/{run.metadata.scenarioCount} · {shortSha(run)} · {formatDate(run.metadata.timestamp)}</small>
      </button>
    {/each}
    {#if selectedGroupRuns.length === 0}
      <p class="empty-state">No runs match the selected scorecard.</p>
    {/if}
  </section>

  <section class="progress-panel" aria-label="Difficulty and hard-category progress">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Progress</p>
        <h2>Difficulty ladder and hard cases</h2>
      </div>
      <span>{selectedGroup?.difficultyCoverage ?? 'none'} difficulty coverage</span>
    </div>
    <div class="band-grid">
      {#each [bandSummary(selectedGroup, 1, 3), bandSummary(selectedGroup, 4, 6), bandSummary(selectedGroup, 7, 8), bandSummary(selectedGroup, 9, 10)] as band (band.label)}
        <div class={`band-card ${scoreClass(band.averageScore)}`}>
          <strong>{band.label}</strong>
          <span>{band.averageScore} avg · {band.passRate}% pass</span>
          <small>{band.covered}/{band.total} scenarios covered · {band.riskCount} risk rows</small>
        </div>
      {/each}
    </div>
    <div class="hard-category-strip" aria-label="Hard scenario categories">
      {#each hardCategories as category (category)}
        <span>{category}<small>{hardCategoryCount(category)}</small></span>
      {/each}
    </div>
  </section>

  <section class="matrix-panel" aria-label="Scenario matrix">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Scenario matrix</p>
        <h2>Scores across runs</h2>
      </div>
      <span>{filteredScenarios.length} matching scenarios</span>
    </div>
    <div class="matrix-scroll">
      <table>
        <thead>
          <tr>
            <th>Scenario</th>
            {#each matrixRuns as run (run.metadata.runId)}
              <th>{shortSha(run)}<small>{run.metadata.environment}</small></th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each filteredScenarios as scenario (scenario.id)}
            <tr>
              <th>
                <button
                  type="button"
                  onclick={() => {
                    selectedScenarioId = scenario.id;
                  }}
                >
                  <strong>{scenario.id}</strong>
                  <small>D{scenario.difficulty} · {scenario.regionState}</small>
                </button>
              </th>
              {#each matrixRuns as run (run.metadata.runId)}
                {@const result = resultFor(run, scenario)}
                {@const score = resultScore(result)}
                <td>
                  <button
                    class={`matrix-cell ${scoreClass(score)} ${result?.status ?? 'not-run'}`}
                    type="button"
                    title={flagsLabel(result)}
                    onclick={() => {
                      selectedRunId = run.metadata.runId;
                      selectedScenarioId = scenario.id;
                    }}
                  >
                    <strong>{score}</strong>
                    <span>{statusLabel(result?.status)}</span>
                  </button>
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </section>

  <section class="workspace-grid">
    <aside class="scenario-column" aria-label="Scenario list">
      <div class="section-heading compact">
        <h2>Scenarios</h2>
        <span>{filteredScenarios.length}</span>
      </div>
      <div class="scenario-list">
        {#each filteredScenarios as scenario (scenario.id)}
          {@const result = selectedResultByScenario[scenario.id]}
          <button
            class:selected={selectedScenario?.id === scenario.id}
            class="scenario-row"
            type="button"
            onclick={() => {
              selectedScenarioId = scenario.id;
            }}
          >
            <span class={`status-dot ${result?.status ?? 'not-run'}`}></span>
            <strong>{scenario.id}</strong>
            <small>D{scenario.difficulty} · {resultScore(result)} pts · {statusLabel(result?.status)}</small>
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
              <span class="label">Expected execution</span>
              <p>{selectedScenario.expectedExecutionMode ?? selectedScenario.deterministicStrictRouteSupport}</p>
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
            <h2>Selected run result</h2>
            <div class="result-stack">
              <span class={`score-badge ${scoreClass(resultScore(selectedResult))}`}>{resultScore(selectedResult)}</span>
              <span class={`result-pill ${selectedResult?.status ?? 'not-run'}`}>{statusLabel(selectedResult?.status)}</span>
            </div>
          </div>

          {#if selectedResult}
            {#if selectedResult.failureReason}
              <p class="failure">{selectedResult.failureReason}</p>
            {/if}

            <div class="category-grid" aria-label="Score breakdown">
              {#each Object.entries(selectedResult.score?.categoryScores ?? {}) as [category, value] (category)}
                <div>
                  <span>{category}</span>
                  <strong>{value}</strong>
                </div>
              {/each}
            </div>

            <div class="flags">
              {#each selectedResult.score?.severityFlags ?? ['none'] as flag (flag)}
                <span>{flag}</span>
              {/each}
            </div>

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
      <div>
        <p class="eyebrow">Comparison</p>
        <h2>Run, response, and patch delta</h2>
      </div>
      <div class="compare-controls">
        <select bind:value={compareLeftId} aria-label="Left comparison run">
          {#each data.runs as run (run.metadata.runId)}
            <option value={run.metadata.runId}>{shortSha(run)} · {run.metadata.environment} · {new Date(run.metadata.timestamp).toLocaleString()}</option>
          {/each}
        </select>
        <select bind:value={compareRightId} aria-label="Right comparison run">
          {#each data.runs as run (run.metadata.runId)}
            <option value={run.metadata.runId}>{shortSha(run)} · {run.metadata.environment} · {new Date(run.metadata.timestamp).toLocaleString()}</option>
          {/each}
        </select>
      </div>
    </div>

    <div class="compare-summary">
      <div>
        <span class="label">Left score</span>
        <strong>{resultScore(leftResult)}</strong>
        <p>{leftRun ? `${modelLabel(leftRun)} · ${shortSha(leftRun)}` : 'No run selected'}</p>
      </div>
      <div>
        <span class="label">Right score</span>
        <strong>{resultScore(rightResult)}</strong>
        <p>{rightRun ? `${modelLabel(rightRun)} · ${shortSha(rightRun)}` : 'No run selected'}</p>
      </div>
      <div>
        <span class="label">Delta</span>
        <strong>{resultScore(rightResult) - resultScore(leftResult)}</strong>
        <p>{selectedScenario?.id}</p>
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
          <span class="label">Deployment notes</span>
          <p>{selectedRun.metadata.deploymentNotes || 'No deployment notes recorded.'}</p>
        </div>
        <div>
          <span class="label">Known remaining failures</span>
          <p>{selectedRun.metadata.knownRemainingFailures || 'None recorded for this run.'}</p>
        </div>
      </div>
    {/if}

    <div class="response-compare">
      <details open>
        <summary>Left raw response</summary>
        <pre>{leftResult?.rawResponse || 'No raw response recorded for this scenario/run.'}</pre>
      </details>
      <details open>
        <summary>Right raw response</summary>
        <pre>{rightResult?.rawResponse || 'No raw response recorded for this scenario/run.'}</pre>
      </details>
    </div>

    {#if comparisonRows.length > 0}
      <div class="comparison-list">
        {#each comparisonRows.slice(0, 24) as row (row.scenario.id)}
          <div class={`comparison-row ${row.change.replace(' ', '-')}`}>
            <strong>{row.scenario.id}</strong>
            <span>{row.beforeScore} -> {row.afterScore}</span>
            <span>{statusLabel(row.beforeStatus)} -> {statusLabel(row.afterStatus)}</span>
            <em>{row.change}</em>
          </div>
        {/each}
      </div>
    {:else}
      <p class="empty-state">No pass/fail or score changes between the selected runs.</p>
    {/if}
  </section>
</section>

<style>
  .arena-shell {
    display: grid;
    gap: 1rem;
  }

  .arena-header,
  .section-heading,
  .panel-heading,
  .compare-controls,
  .result-stack {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .arena-header h1,
  .section-heading h2,
  .panel-heading h2 {
    margin: 0;
  }

  .back-link {
    color: var(--color-accent, #256f4f);
    font-weight: 700;
    text-decoration: none;
  }

  .leaderboard,
  .filters-panel,
  .group-summary,
  .progress-panel,
  .matrix-panel,
  .detail-panel,
  .comparison-panel {
    border: 1px solid var(--color-border, #d8d0c2);
    border-radius: 8px;
    background: color-mix(in srgb, var(--color-surface, #fffaf0) 84%, white);
    padding: 1rem;
  }

  .leaderboard-table {
    display: grid;
    gap: 0.4rem;
    margin-top: 0.9rem;
  }

  .leaderboard-row {
    display: grid;
    grid-template-columns: 52px minmax(260px, 2fr) 64px 78px 70px 76px minmax(190px, 1.25fr) minmax(170px, 1fr) minmax(150px, 1fr);
    gap: 0.75rem;
    align-items: center;
    border: 1px solid var(--color-border, #d8d0c2);
    border-radius: 6px;
    background: white;
    color: inherit;
    padding: 0.65rem 0.75rem;
    text-align: left;
  }

  .leaderboard-row.header {
    background: transparent;
    border: 0;
    color: var(--color-muted, #776b5c);
    font-size: 0.78rem;
    font-weight: 800;
    text-transform: uppercase;
  }

  button.leaderboard-row {
    cursor: pointer;
  }

  .leaderboard-row.active,
  .selected {
    border-color: var(--color-accent, #256f4f);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-accent, #256f4f) 18%, transparent);
  }

  small {
    color: var(--color-muted, #776b5c);
    display: block;
  }

  .leaderboard-row em {
    color: var(--color-muted, #776b5c);
    display: block;
    font-size: 0.78rem;
    font-style: normal;
    margin-top: 0.15rem;
    max-width: 58ch;
  }

  .score-badge,
  .difficulty-pill,
  .result-pill {
    border-radius: 999px;
    color: white;
    display: inline-flex;
    font-size: 0.82rem;
    font-weight: 900;
    justify-content: center;
    min-width: 2.7rem;
    padding: 0.25rem 0.55rem;
  }

  .score-badge.excellent,
  .matrix-cell.excellent,
  .status-dot.passed,
  .result-pill.passed,
  .assertion-row.passed span {
    background: #1f7a4d;
  }

  .score-badge.good,
  .matrix-cell.good {
    background: #52733b;
  }

  .score-badge.warn,
  .matrix-cell.warn {
    background: #b9782f;
  }

  .score-badge.bad,
  .matrix-cell.bad,
  .status-dot.failed,
  .result-pill.failed,
  .assertion-row.failed span {
    background: #b93a32;
  }

  .difficulty-pill {
    background: #5b4935;
  }

  .result-pill {
    background: #8f836f;
  }

  .filters-panel {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 0.75rem;
  }

  .wide {
    grid-column: span 2;
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

  .run-strip {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 0.75rem;
  }

  .group-summary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
    gap: 0.8rem;
  }

  .group-summary div {
    min-width: 0;
  }

  .group-summary strong {
    display: block;
    font-size: 1.15rem;
  }

  .group-summary p {
    color: var(--color-muted, #776b5c);
    margin: 0.2rem 0 0;
  }

  .band-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 0.65rem;
    margin-top: 0.85rem;
  }

  .band-card {
    border-radius: 6px;
    color: white;
    display: grid;
    gap: 0.12rem;
    padding: 0.75rem;
  }

  .band-card.excellent {
    background: #1f7a4d;
  }

  .band-card.good {
    background: #52733b;
  }

  .band-card.warn {
    background: #b9782f;
  }

  .band-card.bad {
    background: #b93a32;
  }

  .band-card small {
    color: rgba(255, 255, 255, 0.8);
  }

  .hard-category-strip {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
    margin-top: 0.85rem;
  }

  .hard-category-strip span {
    align-items: center;
    border: 1px solid var(--color-border, #d8d0c2);
    border-radius: 999px;
    background: white;
    display: inline-flex;
    gap: 0.35rem;
    font-size: 0.78rem;
    font-weight: 800;
    padding: 0.28rem 0.58rem;
  }

  .hard-category-strip small {
    border-radius: 999px;
    background: #efe3c8;
    color: #4e3f2f;
    display: inline-flex;
    min-width: 1.4rem;
    justify-content: center;
    padding: 0.04rem 0.35rem;
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
    font-size: 1.6rem;
  }

  .matrix-scroll {
    overflow: auto;
  }

  table {
    border-collapse: separate;
    border-spacing: 0.35rem;
    min-width: 920px;
    width: 100%;
  }

  th,
  td {
    vertical-align: top;
  }

  thead th {
    color: var(--color-muted, #776b5c);
    font-size: 0.78rem;
    text-align: left;
    text-transform: uppercase;
  }

  tbody th {
    min-width: 260px;
  }

  tbody th button,
  .matrix-cell {
    border: 1px solid var(--color-border, #d8d0c2);
    border-radius: 6px;
    cursor: pointer;
    min-height: 3.1rem;
    padding: 0.5rem;
    text-align: left;
    width: 100%;
  }

  tbody th button {
    background: white;
    color: inherit;
  }

  .matrix-cell {
    color: white;
    display: grid;
    gap: 0.1rem;
    text-align: center;
  }

  .matrix-cell span {
    font-size: 0.72rem;
    font-weight: 800;
  }

  .workspace-grid {
    display: grid;
    grid-template-columns: minmax(240px, 330px) minmax(0, 1fr);
    gap: 1rem;
    align-items: start;
  }

  .scenario-column,
  .detail-column {
    display: grid;
    gap: 1rem;
  }

  .compact {
    align-items: baseline;
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
  }

  .status-dot {
    width: 0.65rem;
    height: 0.65rem;
    border-radius: 999px;
    background: #9b8f7f;
    margin-top: 0.25rem;
  }

  .status-dot.skipped,
  .status-dot.not-run {
    background: #8f836f;
  }

  .label {
    display: block;
    color: var(--color-muted, #776b5c);
    font-size: 0.78rem;
    font-weight: 700;
    text-transform: uppercase;
  }

  .facts-grid,
  .patch-notes,
  .compare-summary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 0.75rem;
  }

  .prompt-text {
    border-left: 3px solid var(--color-accent, #256f4f);
    margin: 1rem 0;
    padding-left: 0.85rem;
  }

  .split,
  .response-compare {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
  }

  .split ul {
    margin: 0.4rem 0 0;
    padding-left: 1.1rem;
  }

  .category-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(145px, 1fr));
    gap: 0.45rem;
    margin: 1rem 0;
  }

  .category-grid div,
  .compare-summary div {
    border: 1px solid var(--color-border, #d8d0c2);
    border-radius: 6px;
    background: white;
    padding: 0.55rem;
  }

  .category-grid span {
    color: var(--color-muted, #776b5c);
    display: block;
    font-size: 0.72rem;
  }

  .flags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-bottom: 1rem;
  }

  .flags span {
    border-radius: 999px;
    background: #efe3c8;
    color: #4e3f2f;
    font-size: 0.76rem;
    font-weight: 800;
    padding: 0.2rem 0.5rem;
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

  .raw-response,
  .response-compare {
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
    grid-template-columns: minmax(180px, 1fr) auto auto auto;
  }

  .comparison-row.newly-passing,
  .comparison-row.score-up {
    border-color: #1f7a4d;
  }

  .comparison-row.regression,
  .comparison-row.score-down {
    border-color: #b93a32;
  }

  .empty-state {
    color: var(--color-muted, #776b5c);
    margin: 0;
  }

  @media (max-width: 900px) {
    .arena-header,
    .section-heading,
    .panel-heading,
    .compare-controls,
    .result-stack {
      align-items: flex-start;
      flex-direction: column;
    }

    .leaderboard-row {
      grid-template-columns: 40px 1fr 70px;
    }

    .leaderboard-row span:nth-child(n + 4) {
      display: none;
    }

    .workspace-grid,
    .split,
    .response-compare {
      grid-template-columns: 1fr;
    }

    .scenario-list {
      max-height: 360px;
    }

    .comparison-row {
      grid-template-columns: 1fr;
    }

    .wide {
      grid-column: span 1;
    }
  }
</style>
