<script lang="ts">
  import { loadCharacter, character, updateCharacter } from '../../../stores/character.svelte';

  loadCharacter();

  const training = $derived(character.training);

  const benchmarks: Array<{ id: string; text: string; category: string }> = [
    { id: 'b1', text: 'Complete a 15+ mile day with full pack', category: 'endurance' },
    { id: 'b2', text: 'Hike back-to-back 10+ mile days', category: 'endurance' },
    { id: 'b3', text: 'Complete an overnight trip with all your gear', category: 'gear' },
    { id: 'b4', text: 'Break in your trail shoes (50+ miles)', category: 'gear' },
    { id: 'b5', text: 'Test your rain gear in actual rain', category: 'gear' },
    { id: 'b6', text: 'Successfully set up shelter in under 5 min', category: 'skills' },
    { id: 'b7', text: 'Filter/treat water from a natural source', category: 'skills' },
    { id: 'b8', text: 'Navigate 5+ miles using only map/compass', category: 'skills' },
  ];

  const doneCount = $derived.by(() => {
    const m = training.completedBenchmarks || {};
    return benchmarks.filter((b) => !!m[b.id]).length;
  });

  const pct = $derived.by(() => (benchmarks.length > 0 ? Math.round((doneCount / benchmarks.length) * 100) : 0));

  function setTrainingPatch(patch: Partial<typeof character.training>) {
    updateCharacter({ training: patch } as any);
  }

  function toggleBenchmark(id: string) {
    const current = !!training.completedBenchmarks?.[id];
    updateCharacter({ training: { completedBenchmarks: { [id]: !current } } } as any);
  }

  const FITNESS_OPTS = [
    { id: 'athlete', label: 'Athlete' },
    { id: 'active', label: 'Active' },
    { id: 'moderate', label: 'Moderate' },
    { id: 'light', label: 'Light' },
    { id: 'sedentary', label: 'Sedentary' },
  ];

  const EXP_OPTS = [
    { id: 'expert', label: 'Expert' },
    { id: 'experienced', label: 'Experienced' },
    { id: 'some', label: 'Some' },
    { id: 'none', label: 'None' },
  ];

  function toNumber(value: string, fallback: number): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }
</script>

<div class="grid">
  <div class="card">
    <h2 class="h">Training Defaults</h2>
    <p class="p">Quick edits. Use the Training tool for the full program view.</p>

    <div class="mini" aria-label="Training summary">
      <div class="mini-card">
        <div class="mini-k">Benchmarks</div>
        <div class="mini-v">{doneCount} / {benchmarks.length}</div>
      </div>
      <div class="mini-card">
        <div class="mini-k">Completion</div>
        <div class="mini-v">{pct}%</div>
      </div>
      <div class="mini-card">
        <div class="mini-k">Weekly hours</div>
        <div class="mini-v">{training.weeklyHours}</div>
      </div>
      <div class="mini-card">
        <div class="mini-k">Experience</div>
        <div class="mini-v">{String(training.hikingExperience || '—').toUpperCase()}</div>
      </div>
    </div>

    <div class="form" style="margin-top: 0.9rem;">
      <label class="field">
        <span class="k">Current fitness</span>
        <select class="in" value={training.currentFitness} onchange={(e) => setTrainingPatch({ currentFitness: (e.currentTarget as HTMLSelectElement).value })}>
          {#each FITNESS_OPTS as o (o.id)}
            <option value={o.id}>{o.label}</option>
          {/each}
        </select>
      </label>

      <label class="field">
        <span class="k">Hiking experience</span>
        <select class="in" value={training.hikingExperience} onchange={(e) => setTrainingPatch({ hikingExperience: (e.currentTarget as HTMLSelectElement).value })}>
          {#each EXP_OPTS as o (o.id)}
            <option value={o.id}>{o.label}</option>
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
          onchange={(e) => setTrainingPatch({ weeklyHours: toNumber((e.currentTarget as HTMLInputElement).value, training.weeklyHours) })}
        />
      </label>
    </div>

    <div class="actions" style="margin-top: 0.85rem;">
      <a class="action" href="/tools/training/">Open Training Tool</a>
    </div>
  </div>

  <div class="card">
    <h2 class="h">Benchmarks</h2>
    <p class="p">Simple checklist to keep your prep honest.</p>

    <div class="checks" aria-label="Training benchmarks" style="margin-top: 0.25rem;">
      {#each benchmarks as b (b.id)}
        <label class="check">
          <input type="checkbox" checked={!!training.completedBenchmarks?.[b.id]} onchange={() => toggleBenchmark(b.id)} />
          <span>{b.text}</span>
        </label>
      {/each}
    </div>
  </div>
</div>
