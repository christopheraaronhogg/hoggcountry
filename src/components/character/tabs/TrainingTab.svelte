<script lang="ts">
  import { loadCharacter, character, updateCharacter } from '../../../stores/character.svelte';

  loadCharacter();

  const training = $derived(character.training);

  const benchmarks: Array<{ id: string; text: string; category: string }> = [
    { id: 'b1', text: '15+ mile full-pack day', category: 'Endurance' },
    { id: 'b2', text: 'Back-to-back 10+ mile days', category: 'Endurance' },
    { id: 'b3', text: 'Overnight with full gear', category: 'Gear' },
    { id: 'b4', text: '50+ miles in trail shoes', category: 'Gear' },
    { id: 'b5', text: 'Rain gear tested in rain', category: 'Gear' },
    { id: 'b6', text: 'Shelter setup under 5 min', category: 'Skills' },
    { id: 'b7', text: 'Water filtered from source', category: 'Skills' },
    { id: 'b8', text: '5+ miles by map/compass', category: 'Skills' }
  ];

  const doneCount = $derived.by(() => {
    const completed = training.completedBenchmarks || {};
    return benchmarks.filter((benchmark) => completed[benchmark.id]).length;
  });

  const pct = $derived.by(() => Math.round((doneCount / benchmarks.length) * 100));

  const readinessLabel = $derived.by(() => {
    if (pct >= 75) return 'Field tests mostly proven';
    if (pct >= 40) return 'Prep is taking shape';
    return 'Needs the first field tests';
  });

  const nextBenchmarks = $derived.by(() => benchmarks.filter((benchmark) => !training.completedBenchmarks?.[benchmark.id]).slice(0, 3));

  const fitnessOptions = [
    { id: 'athlete', label: 'Athlete' },
    { id: 'active', label: 'Active' },
    { id: 'moderate', label: 'Moderate' },
    { id: 'light', label: 'Light' },
    { id: 'sedentary', label: 'Sedentary' }
  ];

  const experienceOptions = [
    { id: 'expert', label: 'Expert' },
    { id: 'experienced', label: 'Experienced' },
    { id: 'some', label: 'Some' },
    { id: 'none', label: 'None' }
  ];

  function setTrainingPatch(patch: Partial<typeof character.training>) {
    updateCharacter({ training: patch } as any);
  }

  function toNumber(value: string, fallback: number): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }
</script>

<section class="training-snapshot" aria-labelledby="profile-training-title">
  <div class="snapshot-hero">
    <div>
      <p class="eyebrow">Training snapshot</p>
      <h2 id="profile-training-title">Readiness defaults</h2>
      <p>Keep the profile inputs here. Use the full Training Planner for the weekly program and benchmark work.</p>
    </div>

    <div class="score-card" aria-label="Training benchmark progress">
      <span>{readinessLabel}</span>
      <strong>{pct}%</strong>
      <em>{doneCount} of {benchmarks.length} benchmarks</em>
    </div>
  </div>

  <div class="snapshot-grid">
    <div class="card settings-card">
      <h3>Profile inputs</h3>

      <div class="form">
        <label class="field">
          <span class="k">Current fitness</span>
          <select class="in" value={training.currentFitness} onchange={(event) => setTrainingPatch({ currentFitness: event.currentTarget.value })}>
            {#each fitnessOptions as option (option.id)}
              <option value={option.id}>{option.label}</option>
            {/each}
          </select>
        </label>

        <label class="field">
          <span class="k">Hiking experience</span>
          <select class="in" value={training.hikingExperience} onchange={(event) => setTrainingPatch({ hikingExperience: event.currentTarget.value })}>
            {#each experienceOptions as option (option.id)}
              <option value={option.id}>{option.label}</option>
            {/each}
          </select>
        </label>

        <label class="field">
          <span class="k">Weekly training hours</span>
          <input
            class="in"
            type="number"
            min="0"
            max="30"
            step="1"
            value={training.weeklyHours}
            onchange={(event) => setTrainingPatch({ weeklyHours: toNumber(event.currentTarget.value, training.weeklyHours) })}
          />
        </label>
      </div>

      <a class="action primary-action" href="/tools/training">Open full Training Planner</a>
    </div>

    <div class="card next-card">
      <h3>Next checks</h3>

      {#if nextBenchmarks.length > 0}
        <div class="next-list">
          {#each nextBenchmarks as benchmark (benchmark.id)}
            <div class="next-item">
              <span>{benchmark.category}</span>
              <p>{benchmark.text}</p>
            </div>
          {/each}
        </div>
      {:else}
        <p class="empty">All listed training checks are complete.</p>
      {/if}
    </div>
  </div>
</section>

<style>
  .training-snapshot {
    display: grid;
    gap: 1rem;
  }

  .snapshot-hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(190px, 240px);
    gap: 1rem;
    align-items: stretch;
    padding: 1rem;
    border: 1px solid rgba(61, 46, 31, 0.14);
    border-radius: 8px;
    background:
      linear-gradient(135deg, rgba(31, 77, 58, 0.95), rgba(65, 82, 59, 0.92)),
      #1f4d3a;
    color: #fff8e8;
  }

  .eyebrow {
    margin: 0 0 0.35rem;
    color: #e1c98b;
    font-family: Oswald, sans-serif;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0;
    text-transform: uppercase;
  }

  h2,
  h3,
  p {
    margin-top: 0;
  }

  h2,
  h3 {
    font-family: Oswald, sans-serif;
    letter-spacing: 0;
    text-transform: uppercase;
  }

  h2 {
    margin-bottom: 0.35rem;
    font-size: clamp(1.45rem, 3vw, 2rem);
    line-height: 1;
  }

  .snapshot-hero p {
    max-width: 42rem;
    margin-bottom: 0;
    color: rgba(255, 248, 232, 0.78);
    font-size: 0.9rem;
    line-height: 1.45;
  }

  .score-card {
    display: grid;
    align-content: center;
    gap: 0.25rem;
    padding: 0.9rem;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.12);
  }

  .score-card span,
  .score-card em {
    color: rgba(255, 248, 232, 0.78);
    font-size: 0.78rem;
    font-style: normal;
  }

  .score-card strong {
    font-family: Oswald, sans-serif;
    font-size: 2.6rem;
    line-height: 0.95;
  }

  .snapshot-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(220px, 0.65fr);
    gap: 1rem;
  }

  .settings-card,
  .next-card {
    display: grid;
    gap: 0.85rem;
  }

  h3 {
    margin-bottom: 0;
    color: #2f2519;
    font-size: 1rem;
  }

  .form {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.75rem;
  }

  .primary-action {
    justify-self: start;
  }

  .next-list {
    display: grid;
    gap: 0.55rem;
  }

  .next-item {
    padding: 0.7rem;
    border: 1px solid rgba(61, 46, 31, 0.12);
    border-radius: 7px;
    background: #f9f4ea;
  }

  .next-item span {
    display: block;
    margin-bottom: 0.2rem;
    color: #8b6f47;
    font-family: Oswald, sans-serif;
    font-size: 0.68rem;
    font-weight: 700;
    text-transform: uppercase;
  }

  .next-item p,
  .empty {
    margin: 0;
    color: #33281d;
    font-size: 0.88rem;
    line-height: 1.35;
  }

  @media (max-width: 820px) {
    .snapshot-hero,
    .snapshot-grid,
    .form {
      grid-template-columns: 1fr;
    }
  }
</style>
