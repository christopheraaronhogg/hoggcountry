<script lang="ts">
  import { loadCharacter, character, updateCharacter } from '../stores/character.svelte';

  let { trailContext = {} as any } = $props<{ trailContext?: any }>();

  loadCharacter();

  let caloriesPerDay = $state(character.consumables.food.caloriesPerDay ?? 4200);
  let caloriesPerOz = $state(character.consumables.food.caloriesPerOz ?? 120); // typical: 110–140 cal/oz
  let daysBetweenResupply = $state(character.consumables.food.daysBetweenResupply ?? 4);

  // Optional one-time heuristic if the character is still on defaults.
  function applyContextDefaultsIfStillDefault() {
    if (caloriesPerDay !== 4200) return;
    const pace = Number(trailContext?.pace ?? trailContext?.targetPace ?? 0);
    if (Number.isFinite(pace) && pace > 0) {
      caloriesPerDay = Math.round(3200 + pace * 70);
    }
  }

  applyContextDefaultsIfStillDefault();

  // Persist into the unified Character model
  $effect(() => {
    updateCharacter({
      consumables: {
        food: {
          caloriesPerDay,
          caloriesPerOz,
          daysBetweenResupply,
        },
      },
    });
  });

  let ouncesPerDay = $derived(caloriesPerOz > 0 ? caloriesPerDay / caloriesPerOz : 0);
  let poundsPerDay = $derived(ouncesPerDay / 16);
  let poundsForCarry = $derived(poundsPerDay * daysBetweenResupply);
</script>

<section class="card" style="padding: 1rem;">
  <div class="controls">
    <label class="ctrl">
      <span class="label">Calories per day</span>
      <input type="number" min="2000" max="8000" step="50" bind:value={caloriesPerDay} />
    </label>

    <label class="ctrl">
      <span class="label">Calories per ounce</span>
      <input type="number" min="60" max="180" step="1" bind:value={caloriesPerOz} />
    </label>

    <label class="ctrl">
      <span class="label">Days between resupply</span>
      <input type="number" min="1" max="10" step="1" bind:value={daysBetweenResupply} />
    </label>
  </div>

  <div class="results">
    <div class="card result">
      <div class="k">Per day</div>
      <div class="v">{ouncesPerDay.toFixed(1)} oz</div>
      <div class="s">{poundsPerDay.toFixed(2)} lb</div>
    </div>

    <div class="card result">
      <div class="k">Carry</div>
      <div class="v">{poundsForCarry.toFixed(2)} lb</div>
      <div class="s">{daysBetweenResupply} days</div>
    </div>
  </div>
</section>

<style>
  .controls {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  @media (max-width: 820px) {
    .controls {
      grid-template-columns: 1fr;
    }
  }

  .ctrl {
    display: grid;
    gap: 0.4rem;
  }

  .label {
    font-weight: 800;
    color: var(--pine);
  }

  input[type="number"] {
    padding: 0.55rem 0.65rem;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: #fff;
    font-family: inherit;
  }

  .results {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
  }

  @media (max-width: 560px) {
    .results {
      grid-template-columns: 1fr;
    }
  }

  .result {
    padding: 0.85rem;
    box-shadow: none;
  }

  .k {
    color: var(--muted);
    font-size: 0.85rem;
    margin-bottom: 0.25rem;
  }

  .v {
    font-family: Oswald, sans-serif;
    font-weight: 800;
    font-size: 1.6rem;
    color: var(--ink);
    line-height: 1.1;
  }

  .s {
    color: var(--muted);
    margin-top: 0.15rem;
  }
</style>
