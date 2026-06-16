<script lang="ts">
  import { onMount } from 'svelte';
  import { resolve } from '$app/paths';
  import { loadCharacter, character, updateCharacter } from '../stores/character.svelte';

  type FitnessLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'athlete';
  type ExperienceLevel = 'none' | 'some' | 'experienced' | 'expert';
  type BenchmarkCategory = 'endurance' | 'gear' | 'skills';

  type Benchmark = {
    id: string;
    text: string;
    category: BenchmarkCategory;
  };

  type Phase = {
    id: string;
    name: string;
    range: string;
    focus: string;
    color: string;
    description: string;
    actions: string[];
  };

  type WeekDay = {
    day: string;
    activity: string;
    duration: string;
    tone: 'work' | 'long' | 'recovery';
  };

  let { trailContext = {} } = $props<{ trailContext?: { startDate?: string } }>();

  loadCharacter();

  let mounted = $state(false);
  let currentFitness = $state<FitnessLevel>((character.training.currentFitness || 'moderate') as FitnessLevel);
  let hikingExperience = $state<ExperienceLevel>((character.training.hikingExperience || 'some') as ExperienceLevel);
  let weeklyHours = $state(Number(character.training.weeklyHours ?? 10));
  let completedBenchmarks = $state<Record<string, boolean>>(character.training.completedBenchmarks || {});

  const phases: Phase[] = [
    {
      id: 'base',
      name: 'Base',
      range: '22-15 weeks out',
      focus: 'Build durable aerobic volume',
      color: '#2563eb',
      description: 'Steady walking, easy hills, basic strength, and no heroic jumps in mileage.',
      actions: ['3 steady walks or hikes', '2 short strength sessions', '1 longer easy hike']
    },
    {
      id: 'build',
      name: 'Build',
      range: '14-7 weeks out',
      focus: 'Add load and trail specificity',
      color: '#b45309',
      description: 'Start carrying weight, stack hills, and practice the rhythm of trail days.',
      actions: ['2 loaded hikes', '1 hill or stair session', '1 long hike with trail shoes']
    },
    {
      id: 'peak',
      name: 'Peak',
      range: '6-3 weeks out',
      focus: 'Prove the real trail systems',
      color: '#b91c1c',
      description: 'Test the pack, shoes, food, rain system, and back-to-back effort while there is time to adjust.',
      actions: ['1 full-pack long hike', '1 back-to-back weekend', '1 complete gear shakedown']
    },
    {
      id: 'taper',
      name: 'Taper',
      range: '2-0 weeks out',
      focus: 'Recover and keep sharp',
      color: '#047857',
      description: 'Reduce volume, keep the body moving, and stop trying to solve fitness at the last second.',
      actions: ['2 light hikes', 'daily mobility', 'final gear and logistics review']
    }
  ];

  const benchmarks: Benchmark[] = [
    { id: 'b1', text: 'Complete a 15+ mile day with full pack', category: 'endurance' },
    { id: 'b2', text: 'Hike back-to-back 10+ mile days', category: 'endurance' },
    { id: 'b3', text: 'Complete an overnight trip with all your gear', category: 'gear' },
    { id: 'b4', text: 'Break in trail shoes for 50+ miles', category: 'gear' },
    { id: 'b5', text: 'Test rain gear in actual rain', category: 'gear' },
    { id: 'b6', text: 'Set up shelter in under 5 minutes', category: 'skills' },
    { id: 'b7', text: 'Filter water from a natural source', category: 'skills' },
    { id: 'b8', text: 'Navigate 5+ miles with map and compass', category: 'skills' }
  ];

  const fitnessOptions = [
    { value: 'sedentary', label: 'Mostly sedentary' },
    { value: 'light', label: 'Light activity' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'active', label: 'Active' },
    { value: 'athlete', label: 'Athlete' }
  ];

  const experienceOptions = [
    { value: 'none', label: 'New to hiking' },
    { value: 'some', label: 'Day-hike experience' },
    { value: 'experienced', label: 'Multi-day experience' },
    { value: 'expert', label: 'Long-distance experience' }
  ];

  const startDate = $derived(trailContext?.startDate || character.trail.startDate || '2026-03-01');

  onMount(() => {
    const hasCharacterTraining =
      character.training.currentFitness !== 'moderate' ||
      character.training.hikingExperience !== 'some' ||
      Number(character.training.weeklyHours) !== 10 ||
      Object.values(character.training.completedBenchmarks || {}).some(Boolean);

    if (!hasCharacterTraining) {
      try {
        const savedPlan = localStorage.getItem('at-training-planner');
        if (savedPlan) {
          const data = JSON.parse(savedPlan);
          currentFitness = (data.currentFitness || currentFitness) as FitnessLevel;
          hikingExperience = (data.hikingExperience || hikingExperience) as ExperienceLevel;
          weeklyHours = Number(data.weeklyHours || weeklyHours);
        }

        const savedBenchmarks = localStorage.getItem('at-training-benchmarks');
        if (savedBenchmarks) {
          completedBenchmarks = JSON.parse(savedBenchmarks) || completedBenchmarks;
        }
      } catch {}
    }

    lastPersistSignature = computePersistSignature();
    mounted = true;
  });

  const weeksUntilStart = $derived.by(() => {
    const start = new Date(startDate);
    if (Number.isNaN(start.getTime())) return 0;

    const now = new Date();
    const diff = Math.floor((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 7));
    return Math.max(0, diff);
  });

  const activePhase = $derived.by(() => {
    if (weeksUntilStart > 22) return null;
    if (weeksUntilStart > 14) return phases[0];
    if (weeksUntilStart > 6) return phases[1];
    if (weeksUntilStart > 2) return phases[2];
    return phases[3];
  });

  const doneCount = $derived.by(() => benchmarks.filter((benchmark) => completedBenchmarks[benchmark.id]).length);
  const benchmarkProgress = $derived.by(() => Math.round((doneCount / benchmarks.length) * 100));

  const readinessScore = $derived.by(() => {
    const fitnessScore: Record<FitnessLevel, number> = {
      sedentary: 4,
      light: 12,
      moderate: 22,
      active: 30,
      athlete: 35
    };

    const experienceScore: Record<ExperienceLevel, number> = {
      none: 4,
      some: 12,
      experienced: 20,
      expert: 25
    };

    const timeScore = weeksUntilStart > 20 ? 20 : weeksUntilStart > 12 ? 16 : weeksUntilStart > 6 ? 10 : weeksUntilStart > 2 ? 5 : 0;
    const hoursScore = weeklyHours >= 15 ? 12 : weeklyHours >= 10 ? 9 : weeklyHours >= 6 ? 5 : 2;
    const benchmarkScore = Math.round((doneCount / benchmarks.length) * 8);

    return Math.min(100, fitnessScore[currentFitness] + experienceScore[hikingExperience] + timeScore + hoursScore + benchmarkScore);
  });

  const readiness = $derived.by(() => {
    if (readinessScore >= 82) return { label: 'Ready to sharpen', detail: 'Hold the routine, avoid overtraining, and keep testing the actual trail kit.' };
    if (readinessScore >= 65) return { label: 'On track', detail: 'The base is good. The next gain is loaded hiking plus one honest long day.' };
    if (readinessScore >= 45) return { label: 'Needs structure', detail: 'Make the week repeatable before chasing big mileage.' };
    return { label: 'Start now', detail: 'Keep it simple: walk often, add hills, and build from a repeatable week.' };
  });

  const weeklySchedule = $derived.by<WeekDay[]>(() => {
    if (weeklyHours >= 15) {
      return [
        { day: 'Mon', activity: 'Strength + mobility', duration: '45m', tone: 'work' },
        { day: 'Tue', activity: 'Loaded walk', duration: '90m', tone: 'work' },
        { day: 'Wed', activity: 'Recovery', duration: '30m', tone: 'recovery' },
        { day: 'Thu', activity: 'Hills or stairs', duration: '45m', tone: 'work' },
        { day: 'Fri', activity: 'Easy walk', duration: '45m', tone: 'recovery' },
        { day: 'Sat', activity: 'Long hike', duration: '5-7h', tone: 'long' },
        { day: 'Sun', activity: 'Easy trail miles', duration: '2h', tone: 'recovery' }
      ];
    }

    if (weeklyHours >= 10) {
      return [
        { day: 'Mon', activity: 'Core + mobility', duration: '30m', tone: 'work' },
        { day: 'Tue', activity: 'Walk or hike', duration: '60m', tone: 'work' },
        { day: 'Wed', activity: 'Rest', duration: '-', tone: 'recovery' },
        { day: 'Thu', activity: 'Hills or stairs', duration: '30m', tone: 'work' },
        { day: 'Fri', activity: 'Easy walk', duration: '30m', tone: 'recovery' },
        { day: 'Sat', activity: 'Long hike', duration: '3-5h', tone: 'long' },
        { day: 'Sun', activity: 'Recovery walk', duration: '45m', tone: 'recovery' }
      ];
    }

    return [
      { day: 'Mon', activity: 'Walk', duration: '30m', tone: 'work' },
      { day: 'Tue', activity: 'Rest', duration: '-', tone: 'recovery' },
      { day: 'Wed', activity: 'Stairs', duration: '20m', tone: 'work' },
      { day: 'Thu', activity: 'Rest', duration: '-', tone: 'recovery' },
      { day: 'Fri', activity: 'Walk', duration: '30m', tone: 'work' },
      { day: 'Sat', activity: 'Hike', duration: '2-3h', tone: 'long' },
      { day: 'Sun', activity: 'Rest', duration: '-', tone: 'recovery' }
    ];
  });

  const nextBenchmarks = $derived.by(() => benchmarks.filter((benchmark) => !completedBenchmarks[benchmark.id]).slice(0, 3));

  function computePersistSignature() {
    return JSON.stringify({ currentFitness, hikingExperience, weeklyHours, completedBenchmarks });
  }

  const persistSignature = $derived(computePersistSignature());
  let lastPersistSignature = $state('');

  $effect(() => {
    if (!mounted || persistSignature === lastPersistSignature) return;

    lastPersistSignature = persistSignature;
    updateCharacter({
      training: {
        currentFitness,
        hikingExperience,
        weeklyHours,
        completedBenchmarks
      }
    } as any);
  });

  function setWeeklyHours(value: string) {
    const next = Number(value);
    weeklyHours = Number.isFinite(next) ? Math.max(0, Math.min(30, next)) : 10;
  }

  function toggleBenchmark(id: string) {
    completedBenchmarks = {
      ...completedBenchmarks,
      [id]: !completedBenchmarks[id]
    };
  }
</script>

<section class="training-planner" class:mounted aria-labelledby="training-title">
  <div class="hero-panel">
    <div class="hero-copy">
      <p class="eyebrow">Training planner</p>
      <h2 id="training-title">Turn prep into a weekly plan.</h2>
      <p>
        Use this as the simple readiness board for the hike: current capacity, this week's work,
        and the field tests that prove the body and gear are ready.
      </p>
    </div>

    <div class="readiness-card" aria-label="Training readiness">
      <span class="readiness-label">{readiness.label}</span>
      <strong>{readinessScore}%</strong>
      <span>{readiness.detail}</span>
    </div>
  </div>

  <div class="metric-row" aria-label="Training status">
    <div class="metric">
      <span>Weeks out</span>
      <strong>{weeksUntilStart}</strong>
    </div>
    <div class="metric">
      <span>Weekly hours</span>
      <strong>{weeklyHours}</strong>
    </div>
    <div class="metric">
      <span>Benchmarks</span>
      <strong>{doneCount}/{benchmarks.length}</strong>
    </div>
    <div class="metric">
      <span>Phase</span>
      <strong>{activePhase?.name || 'Early'}</strong>
    </div>
  </div>

  <div class="planner-grid">
    <section class="panel focus-panel" aria-labelledby="focus-title">
      <div class="section-head">
        <div>
          <p class="eyebrow">This week</p>
          <h3 id="focus-title">{activePhase?.focus || 'Keep a general fitness base'}</h3>
        </div>
        <span class="phase-pill" style:--phase-color={activePhase?.color || '#4b5563'}>
          {activePhase?.range || 'More than 22 weeks out'}
        </span>
      </div>

      <p class="panel-copy">
        {activePhase?.description || 'The start date is still far out. Stay active, keep joints happy, and start the focused block at 22 weeks.'}
      </p>

      <div class="focus-list">
        {#each activePhase?.actions || ['Walk consistently', 'Build basic strength', 'Keep shoes and pack choices realistic'] as action (action)}
          <div class="focus-item">
            <span></span>
            <p>{action}</p>
          </div>
        {/each}
      </div>
    </section>

    <section class="panel controls-panel" aria-labelledby="inputs-title">
      <div class="section-head compact">
        <div>
          <p class="eyebrow">Inputs</p>
          <h3 id="inputs-title">Defaults that drive the plan</h3>
        </div>
      </div>

      <div class="form-grid">
        <label class="field" for="current-fitness">
          <span>Current fitness</span>
          <select id="current-fitness" bind:value={currentFitness}>
            {#each fitnessOptions as option (option.value)}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
        </label>

        <label class="field" for="hiking-experience">
          <span>Hiking experience</span>
          <select id="hiking-experience" bind:value={hikingExperience}>
            {#each experienceOptions as option (option.value)}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
        </label>

        <label class="field hours-field" for="weekly-hours">
          <span>Weekly training hours</span>
          <div class="range-row">
            <input id="weekly-hours" type="range" min="0" max="30" step="1" value={weeklyHours} oninput={(event) => setWeeklyHours(event.currentTarget.value)} />
            <output for="weekly-hours">{weeklyHours}h</output>
          </div>
        </label>
      </div>
    </section>
  </div>

  <section class="panel schedule-panel" aria-labelledby="schedule-title">
    <div class="section-head">
      <div>
        <p class="eyebrow">Weekly rhythm</p>
        <h3 id="schedule-title">A workable seven-day shape</h3>
      </div>
      <p class="quiet-note">Adjust the days. Keep the pattern.</p>
    </div>

    <div class="week-grid">
      {#each weeklySchedule as day (day.day)}
        <article class:long={day.tone === 'long'} class:recovery={day.tone === 'recovery'} class="day-card">
          <span>{day.day}</span>
          <strong>{day.activity}</strong>
          <em>{day.duration}</em>
        </article>
      {/each}
    </div>
  </section>

  <div class="planner-grid lower">
    <section class="panel benchmarks-panel" aria-labelledby="benchmarks-title">
      <div class="section-head">
        <div>
          <p class="eyebrow">Field tests</p>
          <h3 id="benchmarks-title">Benchmarks that matter</h3>
        </div>
        <div class="progress-badge">{benchmarkProgress}% complete</div>
      </div>

      <div class="benchmark-list">
        {#each benchmarks as benchmark (benchmark.id)}
          <button class:done={completedBenchmarks[benchmark.id]} class="benchmark" type="button" onclick={() => toggleBenchmark(benchmark.id)}>
            <span class="check" aria-hidden="true">{completedBenchmarks[benchmark.id] ? '✓' : ''}</span>
            <span>{benchmark.text}</span>
            <em>{benchmark.category}</em>
          </button>
        {/each}
      </div>
    </section>

    <aside class="panel next-panel" aria-labelledby="next-title">
      <p class="eyebrow">Next honest checks</p>
      <h3 id="next-title">Do these before adding complexity</h3>

      {#if nextBenchmarks.length > 0}
        <ol>
          {#each nextBenchmarks as benchmark (benchmark.id)}
            <li>{benchmark.text}</li>
          {/each}
        </ol>
      {:else}
        <p class="panel-copy">All prep benchmarks are checked. Keep training steady and avoid changing too much at once.</p>
      {/if}

      <a class="guide-link" href={resolve('/guide/01-hiker-profile-and-experience')}>Open training guide</a>
    </aside>
  </div>
</section>

<style>
  .training-planner {
    display: grid;
    gap: 1rem;
    opacity: 0;
    transform: translateY(8px);
    transition:
      opacity 0.25s ease,
      transform 0.25s ease;
  }

  .training-planner.mounted {
    opacity: 1;
    transform: none;
  }

  .hero-panel,
  .panel {
    border: 1px solid rgba(61, 46, 31, 0.14);
    border-radius: 8px;
    background: #fffdf8;
    box-shadow: 0 14px 34px rgba(38, 29, 20, 0.08);
  }

  .hero-panel {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(240px, 320px);
    gap: 1rem;
    align-items: stretch;
    overflow: hidden;
    background:
      linear-gradient(135deg, rgba(18, 68, 52, 0.96), rgba(58, 80, 56, 0.94)),
      #143d32;
    color: #fff8e8;
  }

  .hero-copy {
    padding: clamp(1rem, 3vw, 1.75rem);
  }

  .eyebrow {
    margin: 0 0 0.4rem;
    color: #8b6f47;
    font-family: Oswald, sans-serif;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0;
    text-transform: uppercase;
  }

  .hero-panel .eyebrow {
    color: #d9c18b;
  }

  .hero-panel h2 {
    color: #fff8e8;
  }

  h2,
  h3,
  p {
    margin-top: 0;
  }

  h2 {
    max-width: 13ch;
    margin-bottom: 0.65rem;
    font-family: Oswald, sans-serif;
    font-size: clamp(1.85rem, 4vw, 3.2rem);
    line-height: 0.96;
    letter-spacing: 0;
    text-transform: uppercase;
  }

  h3 {
    margin-bottom: 0;
    color: #2f2519;
    font-family: Oswald, sans-serif;
    font-size: clamp(1.05rem, 2vw, 1.35rem);
    line-height: 1.05;
    letter-spacing: 0;
    text-transform: uppercase;
  }

  .hero-copy p:last-child {
    max-width: 46rem;
    margin-bottom: 0;
    color: rgba(255, 248, 232, 0.82);
    font-size: 0.98rem;
    line-height: 1.55;
  }

  .readiness-card {
    display: grid;
    align-content: center;
    gap: 0.45rem;
    min-height: 100%;
    padding: clamp(1rem, 2.4vw, 1.5rem);
    background: rgba(255, 255, 255, 0.11);
    border-left: 1px solid rgba(255, 255, 255, 0.18);
  }

  .readiness-card strong {
    font-family: Oswald, sans-serif;
    font-size: clamp(3rem, 6vw, 4.5rem);
    line-height: 0.9;
  }

  .readiness-card span:last-child {
    color: rgba(255, 248, 232, 0.78);
    font-size: 0.9rem;
    line-height: 1.45;
  }

  .readiness-label {
    color: #f1d99f;
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 700;
    text-transform: uppercase;
  }

  .metric-row {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.65rem;
  }

  .metric {
    min-width: 0;
    padding: 0.9rem;
    border: 1px solid rgba(61, 46, 31, 0.12);
    border-radius: 8px;
    background: #f6efe3;
  }

  .metric span,
  .field span,
  .quiet-note {
    color: #756552;
    font-size: 0.78rem;
  }

  .metric strong {
    display: block;
    margin-top: 0.2rem;
    color: #2f2519;
    font-family: Oswald, sans-serif;
    font-size: 1.45rem;
    line-height: 1;
    text-transform: uppercase;
  }

  .planner-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.35fr) minmax(280px, 0.85fr);
    gap: 1rem;
  }

  .planner-grid.lower {
    grid-template-columns: minmax(0, 1fr) minmax(260px, 0.45fr);
  }

  .panel {
    padding: clamp(1rem, 2.2vw, 1.35rem);
  }

  .section-head {
    display: flex;
    gap: 1rem;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 1rem;
  }

  .section-head.compact {
    margin-bottom: 0.85rem;
  }

  .panel-copy {
    color: #5c5145;
    font-size: 0.9rem;
    line-height: 1.5;
  }

  .phase-pill,
  .progress-badge {
    flex: 0 0 auto;
    padding: 0.42rem 0.62rem;
    border: 1px solid color-mix(in srgb, var(--phase-color, #4b5563) 38%, white);
    border-radius: 999px;
    background: color-mix(in srgb, var(--phase-color, #4b5563) 10%, white);
    color: var(--phase-color, #4b5563);
    font-family: Oswald, sans-serif;
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
  }

  .progress-badge {
    border-color: rgba(4, 120, 87, 0.24);
    background: #e8f5ee;
    color: #047857;
  }

  .focus-list {
    display: grid;
    gap: 0.55rem;
    margin-top: 1rem;
  }

  .focus-item {
    display: grid;
    grid-template-columns: 0.6rem minmax(0, 1fr);
    gap: 0.65rem;
    align-items: center;
    padding: 0.72rem;
    border: 1px solid rgba(61, 46, 31, 0.1);
    border-radius: 7px;
    background: #f9f4ea;
  }

  .focus-item span {
    width: 0.55rem;
    height: 0.55rem;
    border-radius: 50%;
    background: #047857;
  }

  .focus-item p {
    margin: 0;
    color: #33281d;
    font-size: 0.92rem;
    font-weight: 700;
  }

  .form-grid {
    display: grid;
    gap: 0.8rem;
  }

  .field {
    display: grid;
    gap: 0.35rem;
  }

  select,
  input[type='range'] {
    width: 100%;
  }

  select {
    min-height: 2.55rem;
    padding: 0 0.75rem;
    border: 1px solid rgba(61, 46, 31, 0.18);
    border-radius: 7px;
    background: #fff;
    color: #2f2519;
    font: inherit;
  }

  select:focus-visible,
  input[type='range']:focus-visible,
  .benchmark:focus-visible,
  .guide-link:focus-visible {
    outline: 3px solid rgba(4, 120, 87, 0.22);
    outline-offset: 2px;
  }

  .range-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 3.25rem;
    gap: 0.7rem;
    align-items: center;
  }

  output {
    display: inline-grid;
    place-items: center;
    min-height: 2.2rem;
    border: 1px solid rgba(4, 120, 87, 0.22);
    border-radius: 7px;
    background: #e8f5ee;
    color: #047857;
    font-family: Oswald, sans-serif;
    font-weight: 700;
  }

  .week-grid {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 0.55rem;
  }

  .day-card {
    display: grid;
    min-height: 8.25rem;
    align-content: space-between;
    gap: 0.45rem;
    padding: 0.75rem;
    border: 1px solid rgba(61, 46, 31, 0.12);
    border-radius: 8px;
    background: #f8f1e6;
  }

  .day-card.long {
    border-color: rgba(4, 120, 87, 0.28);
    background: #e8f5ee;
  }

  .day-card.recovery {
    background: #f5f3ef;
  }

  .day-card span {
    color: #756552;
    font-family: Oswald, sans-serif;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
  }

  .day-card strong {
    color: #2f2519;
    font-size: 0.86rem;
    line-height: 1.2;
  }

  .day-card em {
    color: #756552;
    font-size: 0.76rem;
    font-style: normal;
  }

  .benchmark-list {
    display: grid;
    gap: 0.55rem;
  }

  .benchmark {
    display: grid;
    grid-template-columns: 1.45rem minmax(0, 1fr) auto;
    gap: 0.7rem;
    align-items: center;
    width: 100%;
    padding: 0.72rem;
    border: 1px solid rgba(61, 46, 31, 0.12);
    border-radius: 7px;
    background: #fff;
    color: #2f2519;
    text-align: left;
    cursor: pointer;
  }

  .benchmark.done {
    border-color: rgba(4, 120, 87, 0.28);
    background: #eef8f2;
  }

  .check {
    display: inline-grid;
    place-items: center;
    width: 1.35rem;
    height: 1.35rem;
    border: 1px solid rgba(61, 46, 31, 0.22);
    border-radius: 5px;
    color: #fff;
    font-size: 0.8rem;
  }

  .benchmark.done .check {
    border-color: #047857;
    background: #047857;
  }

  .benchmark em {
    color: #756552;
    font-family: Oswald, sans-serif;
    font-size: 0.68rem;
    font-style: normal;
    text-transform: uppercase;
  }

  .next-panel ol {
    display: grid;
    gap: 0.6rem;
    margin: 0 0 1rem;
    padding-left: 1.2rem;
    color: #33281d;
    font-size: 0.9rem;
    line-height: 1.4;
  }

  .guide-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 2.6rem;
    padding: 0 0.9rem;
    border-radius: 7px;
    background: #1f4d3a;
    color: #fff8e8;
    font-family: Oswald, sans-serif;
    font-size: 0.82rem;
    font-weight: 700;
    text-decoration: none;
    text-transform: uppercase;
  }

  @media (max-width: 900px) {
    .hero-panel,
    .planner-grid,
    .planner-grid.lower {
      grid-template-columns: 1fr;
    }

    .readiness-card {
      border-top: 1px solid rgba(255, 255, 255, 0.18);
      border-left: 0;
    }

    .week-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 640px) {
    .metric-row {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .section-head {
      display: grid;
    }

    .phase-pill,
    .progress-badge {
      justify-self: start;
    }
  }

  @media (max-width: 480px) {
    .hero-copy,
    .readiness-card,
    .panel {
      padding: 1rem;
    }

    .week-grid {
      grid-template-columns: 1fr;
    }

    .day-card {
      min-height: auto;
    }

    .benchmark {
      grid-template-columns: 1.45rem minmax(0, 1fr);
    }

    .benchmark em {
      grid-column: 2;
    }
  }
</style>
