<script lang="ts">
  import { loadCharacter, character, updateCharacter } from '../../../stores/character.svelte';

  loadCharacter();

  type BudgetCategory = typeof character.finance.categories[number];
  type Expense = typeof character.finance.expenses[number];

  function nowDate(): string {
    return new Date().toISOString().slice(0, 10);
  }

  function monthKey(date: string): string {
    return String(date || '').slice(0, 7);
  }

  function toNumber(value: string, fallback: number): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  const categories = $derived(character.finance.categories || []);
  const expenses = $derived(character.finance.expenses || []);

  const totalAllTime = $derived.by(() => Math.round(expenses.reduce((sum, e: any) => sum + (Number(e?.amount) || 0), 0)));

  const thisMonthKey = $derived(monthKey(nowDate()));
  const totalThisMonth = $derived.by(() => {
    const m = thisMonthKey;
    return Math.round(expenses.filter((e: any) => String(e?.date || '').startsWith(m)).reduce((sum, e: any) => sum + (Number(e?.amount) || 0), 0));
  });

  let newAmount = $state('');
  let newCategory = $state('');
  let newNote = $state('');
  let newDate = $state(nowDate());

  $effect(() => {
    if (!newCategory && categories.length) newCategory = categories[0].id;
  });

  function addExpense() {
    const amount = toNumber(newAmount, NaN);
    if (!Number.isFinite(amount) || amount <= 0) return;
    if (!newCategory) return;

    const next: Expense = {
      date: newDate || nowDate(),
      amount: Math.round(amount * 100) / 100,
      category: newCategory,
      note: (newNote || '').trim(),
    } as any;

    updateCharacter({ finance: { expenses: [...expenses, next] } } as any);
    newAmount = '';
    newNote = '';
  }

  function updateCategory(id: string, patch: Partial<BudgetCategory>) {
    const next = categories.map((c) => (c.id === id ? { ...c, ...patch } : c));
    updateCharacter({ finance: { categories: next } } as any);
  }

  function addCategory() {
    const id = (crypto as any)?.randomUUID ? (crypto as any).randomUUID() : `cat_${Date.now()}`;
    const next: BudgetCategory = {
      id,
      name: 'New Category',
      icon: '🏷️',
      color: '#6b7280',
    } as any;
    updateCharacter({ finance: { categories: [...categories, next] } } as any);
  }

  function removeCategory(id: string) {
    const nextCats = categories.filter((c) => c.id !== id);
    updateCharacter({ finance: { categories: nextCats } } as any);
  }

  const recentExpenses = $derived.by(() => {
    return expenses
      .slice()
      .sort((a: any, b: any) => String(b?.date || '').localeCompare(String(a?.date || '')))
      .slice(0, 6);
  });

  function categoryLabel(id: string): string {
    const c = categories.find((x) => x.id === id);
    if (!c) return id || '—';
    return `${c.icon} ${c.name}`;
  }
</script>

<div class="grid">
  <div class="card">
    <h2 class="h">Summary</h2>
    <p class="p">Your financial ledger lives on the character. Tools are just views.</p>

    <div class="mini" aria-label="Finance summary">
      <div class="mini-card">
        <div class="mini-k">Total spend</div>
        <div class="mini-v">${totalAllTime}</div>
      </div>
      <div class="mini-card">
        <div class="mini-k">This month</div>
        <div class="mini-v">${totalThisMonth}</div>
      </div>
      <div class="mini-card">
        <div class="mini-k">Categories</div>
        <div class="mini-v">{categories.length}</div>
      </div>
      <div class="mini-card">
        <div class="mini-k">Expenses</div>
        <div class="mini-v">{expenses.length}</div>
      </div>
    </div>

    <div class="actions" style="margin-top: 0.9rem;">
      <a class="action" href="/tools/budget/">Open Budget Tool</a>
    </div>
  </div>

  <div class="card">
    <h2 class="h">Add Expense</h2>
    <p class="p">Quick capture in the field. Categorize later if needed.</p>

    <form class="form" onsubmit={(e) => { e.preventDefault(); addExpense(); }}>
      <label class="field">
        <span class="k">Amount (USD)</span>
        <input class="in" type="number" min="0" step="0.01" bind:value={newAmount} placeholder="24.50" />
      </label>

      <label class="field">
        <span class="k">Category</span>
        {#if categories.length === 0}
          <input class="in" disabled value="Add a category first" />
        {:else}
          <select class="in" bind:value={newCategory}>
            {#each categories as c (c.id)}
              <option value={c.id}>{c.icon} {c.name}</option>
            {/each}
          </select>
        {/if}
      </label>

      <label class="field">
        <span class="k">Date</span>
        <input class="in" type="date" bind:value={newDate} />
      </label>

      <label class="field" style="grid-column: 1 / -1;">
        <span class="k">Note</span>
        <input class="in" type="text" bind:value={newNote} placeholder="resupply, hostel, shuttle…" />
      </label>

      <div class="actions" style="grid-column: 1 / -1; justify-content: flex-end;">
        <button class="action" type="submit" disabled={categories.length === 0}>Add</button>
      </div>
    </form>
  </div>

  <div class="card wide">
    <h2 class="h">Categories</h2>
    <p class="p">Tweak the labels/icons used across budgeting views.</p>

    <div class="actions" style="margin: 0 0 0.75rem;">
      <button class="action" type="button" onclick={addCategory}>Add category</button>
    </div>

    {#if categories.length === 0}
      <p class="p" style="margin-top: 0.25rem;">No categories yet. Add one, or use the Budget tool to set up a full envelope plan.</p>
    {:else}
      <div class="cat-list" aria-label="Budget categories">
        {#each categories as c (c.id)}
          <div class="cat">
            <label class="field">
              <span class="k">Icon</span>
              <input class="in" value={c.icon} onchange={(e) => updateCategory(c.id, { icon: (e.currentTarget as HTMLInputElement).value })} />
            </label>
            <label class="field">
              <span class="k">Name</span>
              <input class="in" value={c.name} onchange={(e) => updateCategory(c.id, { name: (e.currentTarget as HTMLInputElement).value })} />
            </label>
            <label class="field">
              <span class="k">Color</span>
              <input class="in" type="color" value={c.color} onchange={(e) => updateCategory(c.id, { color: (e.currentTarget as HTMLInputElement).value })} />
            </label>
            <div class="actions" style="justify-content: flex-end; align-items: end;">
              <button class="action" type="button" onclick={() => removeCategory(c.id)}>Remove</button>
            </div>
          </div>
        {/each}
      </div>
    {/if}

    {#if recentExpenses.length}
      <div class="recent">
        <h3 class="h" style="font-size: 0.95rem; margin-top: 1rem;">Recent</h3>
        <div class="recent-list">
          {#each recentExpenses as e (e.date + e.note)}
            <div class="recent-row">
              <span class="d">{e.date}</span>
              <span class="c">{categoryLabel(e.category)}</span>
              <span class="n">{e.note || '—'}</span>
              <span class="a">${Number(e.amount || 0).toFixed(0)}</span>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .cat-list {
    display: grid;
    gap: 0.75rem;
  }

  .cat {
    display: grid;
    grid-template-columns: 120px 1fr 160px 140px;
    gap: 0.75rem;
    padding: 0.85rem;
    border-radius: 14px;
    border: 1px solid rgba(0, 0, 0, 0.10);
    background: rgba(255, 255, 255, 0.62);
  }

  .recent {
    border-top: 1px dashed rgba(0, 0, 0, 0.18);
    margin-top: 1rem;
    padding-top: 0.75rem;
  }

  .recent-list {
    margin-top: 0.5rem;
    border-radius: 14px;
    border: 1px solid rgba(0, 0, 0, 0.10);
    background: rgba(255, 255, 255, 0.60);
    overflow: hidden;
  }

  .recent-row {
    display: grid;
    grid-template-columns: 110px 220px 1fr 90px;
    gap: 0.75rem;
    padding: 0.55rem 0.7rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    align-items: center;
    color: rgba(31, 41, 55, 0.85);
  }

  .recent-row:last-child {
    border-bottom: none;
  }

  .d {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    font-size: 0.85rem;
    color: rgba(31, 41, 55, 0.62);
  }

  .a {
    text-align: right;
    font-family: Oswald, sans-serif;
    font-weight: 700;
  }

  @media (max-width: 980px) {
    .cat {
      grid-template-columns: 120px 1fr;
    }
    .recent-row {
      grid-template-columns: 110px 1fr 90px;
    }
    .n {
      grid-column: 1 / -1;
    }
  }

  @media (max-width: 720px) {
    .recent-row {
      grid-template-columns: 1fr 90px;
    }
    .c,
    .n {
      grid-column: 1 / -1;
    }
  }
</style>
