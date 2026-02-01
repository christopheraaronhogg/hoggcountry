<script lang="ts">
  import { loadCharacter, character, updateCharacter } from '../../../stores/character.svelte';

  loadCharacter();

  function toNumber(value: string, fallback: number): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  const items = $derived(character.equipment.inventory.items || []);
  const packItems = $derived(items.filter((i) => !i.worn));
  const wornItems = $derived(items.filter((i) => i.worn));
  const transitions = $derived(character.equipment.transitions || []);

  const baseWeightLbs = $derived.by(() => {
    const totalOz = packItems.reduce((sum, i) => sum + (Number(i.weightOz) || 0), 0);
    return Math.round((totalOz / 16) * 10) / 10;
  });

  const previewItems = $derived.by(() => {
    return packItems
      .slice()
      .sort((a, b) => (Number(b.weightOz) || 0) - (Number(a.weightOz) || 0))
      .slice(0, 8);
  });

  function setTypicalWaterCarryLiters(v: number) {
    updateCharacter({
      equipment: { packPrefs: { typicalWaterCarryLiters: v } },
    } as any);
  }

  function setFoodWeightPerDayLb(v: number) {
    updateCharacter({
      equipment: { packPrefs: { foodWeightPerDayLb: v } },
    } as any);
  }

  function setCarryDays(v: number) {
    updateCharacter({
      logistics: { resupply: { carryDays: v } },
    } as any);
  }

  function fmtOz(oz: unknown): string {
    const n = Number(oz);
    if (!Number.isFinite(n)) return '—';
    const fixed = n.toFixed(1);
    return fixed.endsWith('.0') ? fixed.slice(0, -2) : fixed;
  }
</script>

<div class="grid">
  <div class="card">
    <h2 class="h">Pack Snapshot</h2>
    <p class="p">Your current kit, at a glance. Heavy editing stays in the tools.</p>

    <div class="mini" aria-label="Equipment summary">
      <div class="mini-card">
        <div class="mini-k">Base weight</div>
        <div class="mini-v">{baseWeightLbs} lb</div>
      </div>
      <div class="mini-card">
        <div class="mini-k">Inventory</div>
        <div class="mini-v">{items.length} items</div>
      </div>
      <div class="mini-card">
        <div class="mini-k">Worn</div>
        <div class="mini-v">{wornItems.length} items</div>
      </div>
      <div class="mini-card">
        <div class="mini-k">Transitions</div>
        <div class="mini-v">{transitions.length}</div>
      </div>
    </div>

    <div class="actions" style="margin-top: 0.9rem;">
      <a class="action" href="/tools/pack/">Open Pack Builder</a>
      <a class="action" href="/tools/gear/">Budget Gear</a>
      <a class="action" href="/tools/geartrans/">Gear Transitions</a>
    </div>
  </div>

  <div class="card">
    <h2 class="h">Quick Edits</h2>
    <p class="p">High-leverage defaults used by pack math and planning tools.</p>

    <div class="form">
      <label class="field">
        <span class="k">Typical water carry (L)</span>
        <input
          class="in"
          type="number"
          min="0"
          max="6"
          step="0.1"
          value={character.equipment.packPrefs.typicalWaterCarryLiters}
          onchange={(e) => setTypicalWaterCarryLiters(toNumber((e.currentTarget as HTMLInputElement).value, character.equipment.packPrefs.typicalWaterCarryLiters))}
        />
      </label>

      <label class="field">
        <span class="k">Food weight / day (lb)</span>
        <input
          class="in"
          type="number"
          min="0"
          max="6"
          step="0.05"
          value={character.equipment.packPrefs.foodWeightPerDayLb}
          onchange={(e) => setFoodWeightPerDayLb(toNumber((e.currentTarget as HTMLInputElement).value, character.equipment.packPrefs.foodWeightPerDayLb))}
        />
      </label>

      <label class="field">
        <span class="k">Carry days (resupply)</span>
        <input
          class="in"
          type="number"
          min="1"
          max="10"
          step="1"
          value={character.logistics.resupply.carryDays}
          onchange={(e) => setCarryDays(toNumber((e.currentTarget as HTMLInputElement).value, character.logistics.resupply.carryDays))}
        />
      </label>
    </div>
  </div>

  <div class="card wide">
    <h2 class="h">Inventory Preview</h2>
    <p class="p">Top 8 pack items by weight (excludes worn items).</p>

    {#if previewItems.length === 0}
      <p class="p" style="margin-top: 0.75rem;">No pack items yet. Add them in Pack Builder.</p>
    {:else}
      <div class="preview" role="table" aria-label="Inventory preview">
        <div class="row head" role="row">
          <div class="cell" role="columnheader">Category</div>
          <div class="cell" role="columnheader">Item</div>
          <div class="cell right" role="columnheader">Weight</div>
        </div>
        {#each previewItems as it (it.id)}
          <div class="row" role="row">
            <div class="cell" role="cell"><span class="pill">{it.category}</span></div>
            <div class="cell" role="cell">{it.name || it.templateName || '—'}</div>
            <div class="cell right" role="cell">{fmtOz(it.weightOz)} oz</div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .preview {
    margin-top: 0.75rem;
    border-radius: 14px;
    border: 1px solid rgba(0, 0, 0, 0.10);
    background: rgba(255, 255, 255, 0.60);
    overflow: hidden;
  }

  .row {
    display: grid;
    grid-template-columns: 140px 1fr 110px;
    gap: 0.75rem;
    padding: 0.55rem 0.7rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    align-items: center;
  }

  .row:last-child {
    border-bottom: none;
  }

  .row.head {
    background: rgba(0, 0, 0, 0.03);
    font-family: Oswald, sans-serif;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    font-size: 0.72rem;
    color: rgba(52, 66, 58, 0.85);
  }

  .cell {
    color: rgba(31, 41, 55, 0.85);
  }

  .cell.right {
    text-align: right;
    font-family: Oswald, sans-serif;
    font-weight: 700;
  }

  .pill {
    display: inline-flex;
    align-items: center;
    height: 24px;
    padding: 0 0.55rem;
    border-radius: 999px;
    border: 1px solid rgba(0, 0, 0, 0.12);
    background: rgba(255, 255, 255, 0.70);
    font-family: Oswald, sans-serif;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    font-size: 0.68rem;
    color: rgba(31, 41, 55, 0.78);
  }

  @media (max-width: 720px) {
    .row {
      grid-template-columns: 110px 1fr 90px;
    }
  }
</style>
