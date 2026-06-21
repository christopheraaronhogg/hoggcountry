<script lang="ts">
  import { onMount } from 'svelte';
  import {
    LOADOUT_CATEGORIES,
    computeLoadoutSummary,
    formatOz,
    type LoadoutCategory,
    type LoadoutItemInput
  } from '$lib/loadout';

  // The persisted item type lives in server-only workspace-store code, so we
  // mirror the wire shape here: LoadoutItemInput plus server-assigned metadata.
  type WorkspaceLoadoutItem = LoadoutItemInput & {
    readonly id: string;
    readonly createdAt: string;
    readonly updatedAt: string;
  };

  let items = $state<WorkspaceLoadoutItem[]>([]);
  let loading = $state(true);
  let loadFailed = $state(false);
  let busy = $state(false);
  let error = $state('');

  let selectedId = $state('');
  let confirmingDelete = $state(false);
  let addOpen = $state(false);

  let draftName = $state('');
  let draftCategory = $state<LoadoutCategory>(LOADOUT_CATEGORIES[0].id);
  let draftWeightOz = $state(0);
  let draftQuantity = $state(1);
  let draftWorn = $state(false);
  let draftConsumable = $state(false);
  let draftNotes = $state('');
  // Not editable in this form yet, but carried through so PATCH never drops it.
  let draftLink = $state<string | null>(null);

  const summary = $derived(computeLoadoutSummary(items));
  const groups = $derived.by(() => {
    const categorized: Array<{ id: string; label: string; items: WorkspaceLoadoutItem[] }> = LOADOUT_CATEGORIES.map(
      (category) => ({
        id: category.id as string,
        label: category.label,
        items: items.filter((item) => item.category === category.id)
      })
    );

    // Defensive: keep items visible even if their stored category is unknown.
    const known = new Set<string>(LOADOUT_CATEGORIES.map((category) => category.id));
    const leftovers = items.filter((item) => !known.has(item.category));
    if (leftovers.length > 0) {
      categorized.push({ id: 'uncategorized', label: 'Uncategorized', items: leftovers });
    }

    return categorized.filter((group) => group.items.length > 0);
  });

  async function jsonOrThrow(response: Response): Promise<Record<string, unknown>> {
    let payload: unknown = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (response.ok) {
      return (payload && typeof payload === 'object' ? payload : {}) as Record<string, unknown>;
    }

    const message =
      payload && typeof payload === 'object' && typeof (payload as { message?: unknown }).message === 'string'
        ? ((payload as { message: string }).message).trim()
        : '';
    throw new Error(message || `Request failed (${response.status}).`);
  }

  function applyPayload(payload: Record<string, unknown>): boolean {
    const workspace = (payload.workspace ?? payload) as { loadout?: unknown };
    if (Array.isArray(workspace.loadout)) {
      items = workspace.loadout as WorkspaceLoadoutItem[];
      return true;
    }
    return false;
  }

  async function refresh(): Promise<void> {
    loading = true;
    loadFailed = false;

    try {
      const payload = await jsonOrThrow(
        await fetch('/app-api/workspace/loadout', {
          cache: 'no-store',
          headers: { accept: 'application/json' }
        })
      );
      if (!applyPayload(payload)) throw new Error('Unexpected loadout payload.');
    } catch (caught) {
      console.error(caught);
      loadFailed = true;
    } finally {
      loading = false;
    }
  }

  function resetDraft(): void {
    draftName = '';
    draftCategory = LOADOUT_CATEGORIES[0].id;
    draftWeightOz = 0;
    draftQuantity = 1;
    draftWorn = false;
    draftConsumable = false;
    draftNotes = '';
    draftLink = null;
  }

  function openAdd(): void {
    error = '';
    selectedId = '';
    resetDraft();
    addOpen = true;
  }

  function toggleItem(item: WorkspaceLoadoutItem): void {
    error = '';
    addOpen = false;

    confirmingDelete = false;

    if (selectedId === item.id) {
      selectedId = '';
      return;
    }

    selectedId = item.id;
    draftName = item.name;
    draftCategory = item.category;
    draftWeightOz = item.weightOz;
    draftQuantity = item.quantity;
    draftWorn = item.worn;
    draftConsumable = item.consumable;
    draftNotes = item.notes ?? '';
    draftLink = item.link ?? null;
  }

  function draftInput(): LoadoutItemInput {
    return {
      name: draftName.trim(),
      category: draftCategory,
      weightOz: Math.max(0, Number(draftWeightOz) || 0),
      quantity: Math.max(1, Math.round(Number(draftQuantity) || 1)),
      worn: draftWorn,
      consumable: draftConsumable,
      notes: draftNotes.trim(),
      link: draftLink
    };
  }

  async function handleCreate(): Promise<void> {
    const input = draftInput();
    if (!input.name) {
      error = 'Give the item a name first.';
      return;
    }

    busy = true;
    error = '';

    try {
      const payload = await jsonOrThrow(
        await fetch('/app-api/workspace/loadout', {
          method: 'POST',
          headers: { 'content-type': 'application/json', accept: 'application/json' },
          body: JSON.stringify({ item: input })
        })
      );
      if (!applyPayload(payload)) await refresh();
      addOpen = false;
      resetDraft();
    } catch (caught) {
      console.error(caught);
      error = caught instanceof Error ? caught.message : 'Could not save that item.';
    } finally {
      busy = false;
    }
  }

  async function handleUpdate(): Promise<void> {
    const itemId = selectedId;
    const input = draftInput();
    if (!itemId) return;
    if (!input.name) {
      error = 'Give the item a name first.';
      return;
    }

    busy = true;
    error = '';

    try {
      const payload = await jsonOrThrow(
        await fetch(`/app-api/workspace/loadout/${itemId}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json', accept: 'application/json' },
          body: JSON.stringify({ patch: input })
        })
      );
      if (!applyPayload(payload)) await refresh();
      selectedId = '';
    } catch (caught) {
      console.error(caught);
      error = caught instanceof Error ? caught.message : 'Could not save that item.';
    } finally {
      busy = false;
    }
  }

  async function handleDelete(itemId: string): Promise<void> {
    busy = true;
    error = '';

    try {
      const payload = await jsonOrThrow(
        await fetch(`/app-api/workspace/loadout/${itemId}`, {
          method: 'DELETE',
          headers: { accept: 'application/json' }
        })
      );
      if (!applyPayload(payload)) await refresh();
      if (selectedId === itemId) selectedId = '';
    } catch (caught) {
      console.error(caught);
      error = caught instanceof Error ? caught.message : 'Could not delete that item.';
    } finally {
      busy = false;
    }
  }

  async function handleSeed(): Promise<void> {
    busy = true;
    error = '';

    try {
      const payload = await jsonOrThrow(
        await fetch('/app-api/workspace/loadout/seed', {
          method: 'POST',
          headers: { accept: 'application/json' }
        })
      );
      if (!applyPayload(payload)) await refresh();
    } catch (caught) {
      console.error(caught);
      error = caught instanceof Error ? caught.message : 'Could not seed the starter kit.';
    } finally {
      busy = false;
    }
  }

  onMount(() => {
    void refresh();
  });
</script>

{#snippet itemForm(mode: 'add' | 'edit', itemId: string)}
  <div class="loadout-form">
    <label>
      <span class="eyebrow">Name</span>
      <input bind:value={draftName} placeholder="Example: Rain shell" />
    </label>

    <div class="grid-two">
      <label>
        <span class="eyebrow">Category</span>
        <select bind:value={draftCategory}>
          {#each LOADOUT_CATEGORIES as category (category.id)}
            <option value={category.id}>{category.label}</option>
          {/each}
        </select>
      </label>

      <label>
        <span class="eyebrow">Weight (oz)</span>
        <input type="number" min="0" step="0.1" bind:value={draftWeightOz} />
      </label>
    </div>

    <div class="grid-two">
      <label>
        <span class="eyebrow">Quantity</span>
        <input type="number" min="1" step="1" bind:value={draftQuantity} />
      </label>

      <div class="loadout-flags">
        <label class="loadout-check"><input type="checkbox" bind:checked={draftWorn} /> Worn on body</label>
        <label class="loadout-check"><input type="checkbox" bind:checked={draftConsumable} /> Consumable</label>
      </div>
    </div>

    <label>
      <span class="eyebrow">Notes</span>
      <textarea rows="2" bind:value={draftNotes} placeholder="Sizing, condition, swap plans"></textarea>
    </label>

    {#if error}
      <p role="alert" style="margin:0; color:#8a2f2f; font-weight:700;">{error}</p>
    {/if}

    <div class="subtle-actions">
      <button
        class="btn btn-primary"
        type="button"
        disabled={busy}
        onclick={() => (mode === 'edit' ? handleUpdate() : handleCreate())}
      >
        <span role={busy ? 'status' : undefined}>{busy ? 'Saving...' : mode === 'edit' ? 'Save' : 'Save item'}</span>
      </button>
      {#if mode === 'edit'}
        <button
          class="btn btn-secondary"
          type="button"
          disabled={busy}
          onclick={() => {
            selectedId = '';
            confirmingDelete = false;
            error = '';
          }}
        >
          Cancel
        </button>
        <button
          class="btn btn-secondary"
          type="button"
          disabled={busy}
          onclick={() => {
            if (confirmingDelete) {
              confirmingDelete = false;
              void handleDelete(itemId);
            } else {
              confirmingDelete = true;
            }
          }}
        >
          {confirmingDelete ? 'Confirm delete' : 'Delete'}
        </button>
      {:else}
        <button
          class="btn btn-secondary"
          type="button"
          disabled={busy}
          onclick={() => {
            addOpen = false;
            error = '';
          }}
        >
          Cancel
        </button>
      {/if}
    </div>
  </div>
{/snippet}

<section class="card hero-panel">
  <div>
    <p class="eyebrow">Loadout</p>
    <h1>Your pack, weighed and ready.</h1>
    <p class="lede">
      Every piece of gear lives here with an honest weight, so base weight is a number you trust instead of a guess.
    </p>
  </div>
</section>

{#if loading}
  <section class="card empty-state" style="margin-top:1rem;">
    <p class="muted">Weighing your pack...</p>
  </section>
{:else if loadFailed}
  <section class="card empty-state" style="margin-top:1rem; display:grid; gap:0.6rem; justify-items:center;">
    <p class="muted" role="alert" style="margin:0;">Couldn't load your loadout. Try again.</p>
    <button class="btn btn-secondary" type="button" onclick={() => void refresh()}>Try again</button>
  </section>
{:else}
  {#if items.length === 0}
    <section class="card empty-state" style="margin-top:1rem; display:grid; gap:0.6rem; justify-items:center;">
      <h2 style="margin:0;">Nothing in the pack yet.</h2>
      <p class="muted" style="margin:0;">
        Start from a sensible AT starter kit and correct the weights as you confirm them, or add gear one piece at a
        time.
      </p>
      {#if error && !addOpen}
        <p role="alert" style="margin:0; color:#8a2f2f; font-weight:700;">{error}</p>
      {/if}
      {#if addOpen}
        <div style="width:100%; text-align:left;">
          {@render itemForm('add', '')}
        </div>
      {:else}
        <div class="subtle-actions" style="justify-content:center;">
          <button class="btn btn-primary" type="button" disabled={busy} onclick={handleSeed}>
            {busy ? 'Packing the kit...' : 'Load the starter kit'}
          </button>
          <button class="btn btn-secondary" type="button" disabled={busy} onclick={openAdd}>+ Add your first item</button>
        </div>
      {/if}
    </section>
  {:else}
    <section
      class="stats-grid"
      style="margin-top:1rem; grid-template-columns:repeat(auto-fit, minmax(9.5rem, 1fr));"
      aria-label="Pack weight summary"
    >
      <article class="card panel-copy">
        <p class="eyebrow">Base weight</p>
        <strong>{formatOz(summary.baseWeightOz)}</strong>
        <p class="meta-line">Pack only, no worn or consumable</p>
      </article>
      <article class="card panel-copy">
        <p class="eyebrow">Total with consumables</p>
        <strong>{formatOz(summary.totalWeightOz)}</strong>
        <p class="meta-line">Everything you carry</p>
      </article>
      <article class="card panel-copy">
        <p class="eyebrow">Worn on body</p>
        <strong>{formatOz(summary.wornWeightOz)}</strong>
        <p class="meta-line">Clothes and gear you wear</p>
      </article>
      <article class="card panel-copy">
        <p class="eyebrow">Item count</p>
        <strong>{summary.itemCount}</strong>
        <p class="meta-line">Total pieces, quantities included</p>
      </article>
    </section>

    <section class="stack" style="margin-top:1rem;">
      {#each groups as group (group.id)}
        <article class="card panel-copy">
          <p class="eyebrow">{group.label}</p>
          <ul class="list-clean" style="padding-left:0; list-style:none;">
            {#each group.items as item (item.id)}
              <li>
                <button
                  type="button"
                  class="loadout-row"
                  aria-expanded={selectedId === item.id}
                  onclick={() => toggleItem(item)}
                >
                  <span class="loadout-row-name">
                    <strong>{item.name}</strong>
                    {#if item.worn}<span class="badge">Worn</span>{/if}
                    {#if item.consumable}<span class="badge">Consumable</span>{/if}
                  </span>
                  <span class="muted loadout-row-weight">
                    {formatOz(item.weightOz)}{item.quantity > 1 ? ` × ${item.quantity}` : ''}
                  </span>
                </button>
                {#if selectedId === item.id}
                  {@render itemForm('edit', item.id)}
                {/if}
              </li>
            {/each}
          </ul>
        </article>
      {/each}
    </section>
  {/if}

  {#if items.length > 0}
  <section class="card panel-copy" style="margin-top:1rem;">
    {#if addOpen}
      <div class="page-intro" style="margin-bottom:0.25rem;">
        <p class="eyebrow">Add item</p>
        <h2>Weigh it once, trust it all trail.</h2>
      </div>
      {@render itemForm('add', '')}
    {:else}
      <div class="subtle-actions">
        <button class="btn btn-secondary" type="button" onclick={openAdd}>+ Add item</button>
      </div>
    {/if}
  </section>
  {/if}
{/if}

<style>
  .loadout-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    width: 100%;
    padding: 0.55rem 0.15rem;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  .loadout-row-name {
    display: inline-flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.45rem;
    min-width: 0;
  }

  .loadout-row-weight {
    flex: 0 0 auto;
    white-space: nowrap;
  }

  .loadout-form {
    display: grid;
    gap: 0.8rem;
    margin: 0.35rem 0 0.6rem;
    padding: 0.85rem;
    border: 1px solid rgba(77, 89, 74, 0.14);
    border-radius: 14px;
    background: rgba(255, 253, 248, 0.7);
  }

  .loadout-flags {
    display: grid;
    gap: 0.4rem;
    align-content: end;
  }

  .loadout-check {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    font-weight: 700;
  }

  @media (max-width: 620px) {
    :global(.hero-panel) {
      border-radius: 22px;
      padding: 1rem;
    }

    :global(.hero-panel h1) {
      font-size: clamp(2rem, 11vw, 3rem);
      line-height: 0.98;
    }

    :global(.hero-panel .lede) {
      font-size: 0.9rem;
      line-height: 1.42;
    }

    :global(.stats-grid) {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      gap: 0.55rem;
    }

    :global(.stats-grid .card) {
      border-radius: 17px;
      padding: 0.78rem;
    }

    :global(.stats-grid strong) {
      font-size: 1.55rem;
      line-height: 1;
    }

    .loadout-row {
      align-items: flex-start;
      min-height: 3.25rem;
      padding: 0.72rem 0.1rem;
    }

    .loadout-row-name {
      align-items: flex-start;
      flex-direction: column;
      gap: 0.32rem;
    }

    .loadout-row-weight {
      padding-top: 0.1rem;
      font-size: 0.86rem;
      font-weight: 850;
    }

    .loadout-form {
      gap: 0.72rem;
      margin-top: 0.55rem;
      border-radius: 17px;
      padding: 0.72rem;
    }

    .loadout-flags {
      grid-template-columns: 1fr;
    }

    .loadout-check,
    .loadout-form input,
    .loadout-form select,
    .loadout-form textarea,
    .subtle-actions .btn {
      min-height: 44px;
    }

    .subtle-actions {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.55rem;
      width: 100%;
    }
  }
</style>
