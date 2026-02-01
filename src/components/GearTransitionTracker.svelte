<script lang="ts">
  import { loadCharacter, character, updateCharacter } from '../stores/character.svelte';

  let { trailContext = {} as any } = $props<{ trailContext?: any }>();

  loadCharacter();

  type Transition = {
    id: string;
    mile: number;
    action: 'pick up' | 'send home' | 'swap';
    item: string;
    note?: string;
  };

  let transitions = $derived((character.equipment.transitions || []) as Transition[]);

  let mile = $state(0);
  let action = $state<Transition['action']>('swap');
  let item = $state('');
  let note = $state('');

  function add() {
    const trimmed = item.trim();
    if (!trimmed) return;

    const next: Transition[] = [
      ...transitions,
      {
        id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()),
        mile: Math.max(0, Number(mile) || 0),
        action,
        item: trimmed,
        note: note.trim() ? note.trim() : undefined,
      },
    ].sort((a, b) => a.mile - b.mile);

    updateCharacter({ equipment: { transitions: next } } as any);

    item = '';
    note = '';
  }

  function remove(id: string) {
    const next = transitions.filter((t) => t.id !== id);
    updateCharacter({ equipment: { transitions: next } } as any);
  }

  let currentMile = $derived(Number(trailContext?.currentMile ?? 0));
  let upcoming = $derived(transitions.filter((t) => t.mile >= currentMile).slice(0, 8));
</script>

<section class="card" style="padding: 1rem;">
  <h2 class="font-display" style="margin: 0 0 0.35rem;">Gear Transition Tracker</h2>
  <p style="margin: 0; color: var(--muted);">
    Track planned swap points (send-home / pickup / swap) as your mileage changes.
  </p>
</section>

<section class="card" style="padding: 1rem; margin-top: 1rem;">
  <div class="entry-head" style="margin-bottom: 0.6rem;">
    <h3 style="margin: 0;">Add transition</h3>
    <div class="entry-meta">
      <span class="badge"><strong>Current</strong> {currentMile}</span>
    </div>
  </div>

  <div class="form">
    <label class="ctrl">
      <span class="label">Mile</span>
      <input type="number" min="0" max="2198" step="1" bind:value={mile} />
    </label>

    <label class="ctrl">
      <span class="label">Action</span>
      <select bind:value={action}>
        <option value="swap">swap</option>
        <option value="pick up">pick up</option>
        <option value="send home">send home</option>
      </select>
    </label>

    <label class="ctrl">
      <span class="label">Item</span>
      <input type="text" placeholder="microspikes, gloves, quilt…" bind:value={item} />
    </label>

    <label class="ctrl" style="grid-column: 1 / -1;">
      <span class="label">Note (optional)</span>
      <input type="text" placeholder="Gatlinburg box / after Roan Highlands…" bind:value={note} />
    </label>
  </div>

  <div style="display: flex; justify-content: flex-end; margin-top: 0.75rem;">
    <button class="btn btn-primary" type="button" onclick={add}>Add</button>
  </div>
</section>

<section class="card" style="padding: 1rem; margin-top: 1rem;">
  <div class="entry-head" style="margin-bottom: 0.5rem;">
    <h3 style="margin: 0;">Upcoming</h3>
    <div class="entry-meta">
      <span class="badge"><strong>Total</strong> {transitions.length}</span>
    </div>
  </div>

  {#if transitions.length === 0}
    <p style="margin: 0; color: var(--muted);">No transitions yet.</p>
  {:else}
    <div class="list">
      {#each upcoming as t (t.id)}
        <div class="row">
          <div class="main">
            <div class="title">{t.item}</div>
            <div class="meta">
              <span class="badge"><strong>Mile</strong> {t.mile}</span>
              <span class="badge"><strong>Action</strong> {t.action}</span>
            </div>
            {#if t.note}
              <div class="note">{t.note}</div>
            {/if}
          </div>
          <button class="btn" type="button" onclick={() => remove(t.id)} aria-label={`Remove ${t.item}`}>
            Remove
          </button>
        </div>
      {/each}
    </div>
  {/if}
</section>

<style>
  .form {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.75rem;
  }

  @media (max-width: 820px) {
    .form {
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

  input[type="number"],
  input[type="text"],
  select {
    padding: 0.55rem 0.65rem;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: #fff;
    font-family: inherit;
  }

  .list {
    display: grid;
    gap: 0.75rem;
  }

  .row {
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 0.85rem;
    background: rgba(255, 255, 255, 0.6);
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    align-items: start;
  }

  @media (max-width: 560px) {
    .row {
      flex-direction: column;
      align-items: stretch;
    }
  }

  .title {
    font-weight: 800;
    color: var(--ink);
    margin-bottom: 0.35rem;
  }

  .meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem 0.5rem;
    margin-bottom: 0.35rem;
  }

  .note {
    color: var(--muted);
    font-size: 0.92rem;
  }
</style>
