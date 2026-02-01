<script lang="ts">
  import { loadCharacter, character, updateCharacter } from '../../../stores/character.svelte';

  loadCharacter();

  function toNumber(value: string, fallback: number): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  const food = $derived(character.consumables.food);
  const water = $derived(character.consumables.water);
  const power = $derived(character.consumables.power);

  const ozPerDay = $derived.by(() => {
    const cpd = Number(food.caloriesPerDay) || 0;
    const cpo = Number(food.caloriesPerOz) || 0;
    return cpo > 0 ? cpd / cpo : 0;
  });
  const lbPerDay = $derived.by(() => ozPerDay / 16);
  const carryLb = $derived.by(() => lbPerDay * (Number(food.daysBetweenResupply) || 0));

  const safeMilesAtCapacity = $derived.by(() => {
    const cap = Number(water.waterCapacityL) || 0;
    const rate = Number(water.litersPer10Mi) || 0;
    const buffer = (Number(water.bufferPct) || 0) / 100;
    if (cap <= 0 || rate <= 0) return 0;
    const litersPerMile = (rate / 10) * (1 + buffer);
    if (litersPerMile <= 0) return 0;
    return cap / litersPerMile;
  });

  function setFoodPatch(patch: Partial<typeof character.consumables.food>) {
    updateCharacter({ consumables: { food: patch } } as any);
  }

  function setWaterPatch(patch: Partial<typeof character.consumables.water>) {
    updateCharacter({ consumables: { water: patch } } as any);
  }

  function setPowerPatch(patch: Partial<typeof character.consumables.power>) {
    updateCharacter({ consumables: { power: patch } } as any);
  }
</script>

<div class="grid">
  <div class="card">
    <h2 class="h">Food</h2>
    <p class="p">Defaults for carry math. Use the Food tool for deeper planning.</p>

    <div class="mini" aria-label="Food summary">
      <div class="mini-card">
        <div class="mini-k">Calories / day</div>
        <div class="mini-v">{food.caloriesPerDay}</div>
      </div>
      <div class="mini-card">
        <div class="mini-k">Days between</div>
        <div class="mini-v">{food.daysBetweenResupply}</div>
      </div>
      <div class="mini-card">
        <div class="mini-k">Weight / day</div>
        <div class="mini-v">{lbPerDay.toFixed(2)} lb</div>
      </div>
      <div class="mini-card">
        <div class="mini-k">Carry weight</div>
        <div class="mini-v">{carryLb.toFixed(2)} lb</div>
      </div>
    </div>

    <div class="form" style="margin-top: 0.9rem;">
      <label class="field">
        <span class="k">Calories / day</span>
        <input
          class="in"
          type="number"
          min="2000"
          max="9000"
          step="50"
          value={food.caloriesPerDay}
          onchange={(e) => setFoodPatch({ caloriesPerDay: toNumber((e.currentTarget as HTMLInputElement).value, food.caloriesPerDay) })}
        />
      </label>

      <label class="field">
        <span class="k">Calories / oz</span>
        <input
          class="in"
          type="number"
          min="60"
          max="200"
          step="1"
          value={food.caloriesPerOz}
          onchange={(e) => setFoodPatch({ caloriesPerOz: toNumber((e.currentTarget as HTMLInputElement).value, food.caloriesPerOz) })}
        />
      </label>

      <label class="field">
        <span class="k">Days between resupply</span>
        <input
          class="in"
          type="number"
          min="1"
          max="10"
          step="1"
          value={food.daysBetweenResupply}
          onchange={(e) => setFoodPatch({ daysBetweenResupply: toNumber((e.currentTarget as HTMLInputElement).value, food.daysBetweenResupply) })}
        />
      </label>
    </div>

    <div class="actions" style="margin-top: 0.85rem;">
      <a class="action" href="/tools/food/">Open Food Tool</a>
    </div>
  </div>

  <div class="card">
    <h2 class="h">Water</h2>
    <p class="p">Capacity and consumption rate used by the Water tool.</p>

    <div class="mini" aria-label="Water summary">
      <div class="mini-card">
        <div class="mini-k">Capacity</div>
        <div class="mini-v">{water.waterCapacityL} L</div>
      </div>
      <div class="mini-card">
        <div class="mini-k">Rate</div>
        <div class="mini-v">{water.litersPer10Mi} / 10 mi</div>
      </div>
      <div class="mini-card">
        <div class="mini-k">Buffer</div>
        <div class="mini-v">{water.bufferPct}%</div>
      </div>
      <div class="mini-card">
        <div class="mini-k">Safe miles</div>
        <div class="mini-v">{safeMilesAtCapacity.toFixed(1)}</div>
      </div>
    </div>

    <div class="form" style="margin-top: 0.9rem;">
      <label class="field">
        <span class="k">Capacity (L)</span>
        <input
          class="in"
          type="number"
          min="0"
          max="8"
          step="0.1"
          value={water.waterCapacityL}
          onchange={(e) => setWaterPatch({ waterCapacityL: toNumber((e.currentTarget as HTMLInputElement).value, water.waterCapacityL) })}
        />
      </label>

      <label class="field">
        <span class="k">Liters per 10 mi</span>
        <input
          class="in"
          type="number"
          min="0.1"
          max="6"
          step="0.1"
          value={water.litersPer10Mi}
          onchange={(e) => setWaterPatch({ litersPer10Mi: toNumber((e.currentTarget as HTMLInputElement).value, water.litersPer10Mi) })}
        />
      </label>

      <label class="field">
        <span class="k">Buffer (%)</span>
        <input
          class="in"
          type="number"
          min="0"
          max="100"
          step="1"
          value={water.bufferPct}
          onchange={(e) => setWaterPatch({ bufferPct: toNumber((e.currentTarget as HTMLInputElement).value, water.bufferPct) })}
        />
      </label>
    </div>

    <div class="actions" style="margin-top: 0.85rem;">
      <a class="action" href="/tools/water/">Open Water Tool</a>
    </div>
  </div>

  <div class="card wide">
    <h2 class="h">Power</h2>
    <p class="p">Your bank and “days since town” drive the Power tool’s recommendations.</p>

    <div class="mini" aria-label="Power summary">
      <div class="mini-card">
        <div class="mini-k">Bank capacity</div>
        <div class="mini-v">{power.powerBankCapacityMah.toLocaleString()} mAh</div>
      </div>
      <div class="mini-card">
        <div class="mini-k">Current</div>
        <div class="mini-v">{power.powerBankCurrentPct}%</div>
      </div>
      <div class="mini-card">
        <div class="mini-k">Days since town</div>
        <div class="mini-v">{power.daysSinceTown}</div>
      </div>
      <div class="mini-card">
        <div class="mini-k">Power save</div>
        <div class="mini-v">{power.powerSaveMode ? 'ON' : 'OFF'}</div>
      </div>
    </div>

    <div class="form" style="margin-top: 0.9rem; grid-template-columns: repeat(4, minmax(0, 1fr));">
      <label class="field">
        <span class="k">Capacity (mAh)</span>
        <input
          class="in"
          type="number"
          min="0"
          max="100000"
          step="1000"
          value={power.powerBankCapacityMah}
          onchange={(e) => setPowerPatch({ powerBankCapacityMah: toNumber((e.currentTarget as HTMLInputElement).value, power.powerBankCapacityMah) })}
        />
      </label>

      <label class="field">
        <span class="k">Current (%)</span>
        <input
          class="in"
          type="number"
          min="0"
          max="100"
          step="1"
          value={power.powerBankCurrentPct}
          onchange={(e) => setPowerPatch({ powerBankCurrentPct: toNumber((e.currentTarget as HTMLInputElement).value, power.powerBankCurrentPct) })}
        />
      </label>

      <label class="field">
        <span class="k">Days since town</span>
        <input
          class="in"
          type="number"
          min="0"
          max="30"
          step="1"
          value={power.daysSinceTown}
          onchange={(e) => setPowerPatch({ daysSinceTown: toNumber((e.currentTarget as HTMLInputElement).value, power.daysSinceTown) })}
        />
      </label>

      <label class="field">
        <span class="k">Power save mode</span>
        <label class="check" style="margin-top: 0.15rem;">
          <input
            type="checkbox"
            checked={power.powerSaveMode}
            onchange={(e) => setPowerPatch({ powerSaveMode: (e.currentTarget as HTMLInputElement).checked })}
          />
          <span>Enabled</span>
        </label>
      </label>
    </div>

    <div class="actions" style="margin-top: 0.85rem;">
      <a class="action" href="/tools/power/">Open Power Tool</a>
    </div>
  </div>
</div>
