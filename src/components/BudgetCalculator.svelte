<script>
  import { onMount } from 'svelte';
  import { fade, slide, scale } from 'svelte/transition';

  let { trailContext = {} } = $props();

  const categories = [
    { id: 'food', name: 'Food & Resupply', icon: '🛒', color: '#22c55e' },
    { id: 'lodging', name: 'Hotels & Hostels', icon: '🏨', color: '#3b82f6' },
    { id: 'gear', name: 'Gear & Repairs', icon: '🎒', color: '#f59e0b' },
    { id: 'services', name: 'Town Services', icon: '🧺', color: '#a855f7' },
    { id: 'transport', name: 'Shuttles & Hitching', icon: '🚗', color: '#ef4444' },
    { id: 'entertainment', name: 'Town Fun', icon: '🍺', color: '#ec4899' },
    { id: 'other', name: 'Other / Bills', icon: '📦', color: '#6b7280' },
  ];

  let mounted = $state(false);
  let envelopes = $state({
    food: 1200,
    lodging: 800,
    gear: 200,
    services: 200,
    transport: 150,
    entertainment: 300,
    other: 150
  });

  let startDate = $state('2026-03-01');
  let expenses = $state([]);
  let showEnvelopeSettings = $state(false);

  // Form State
  let newAmount = $state('');
  let newCategory = $state('food');
  let newNote = $state('');
  let newDate = $state(new Date().toISOString().split('T')[0]);

  onMount(() => {
    mounted = true;
    const saved = localStorage.getItem('at-budget-v2');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        envelopes = data.envelopes || envelopes;
        startDate = data.startDate || trailContext.startDate || '2026-03-01';
        expenses = data.expenses || [];
      } catch (e) {
        console.error('Failed to load budget data:', e);
      }
    } else {
      // Look for migration from v1
      const legacy = localStorage.getItem('at-budget-data');
      if (legacy) {
         try {
           const data = JSON.parse(legacy);
           expenses = data.expenses || [];
           startDate = data.startDate || startDate;
         } catch(e) {}
      }
    }
  });

  function saveData() {
    if (!mounted) return;
    const data = { envelopes, startDate, expenses };
    localStorage.setItem('at-budget-v2', JSON.stringify(data));
  }

  // Reactive calculations
  let totalMonthlyBudget = $derived(Object.values(envelopes).reduce((a, b) => a + b, 0));
  let totalSpent = $derived(expenses.reduce((sum, e) => sum + e.amount, 0));
  
  let categoryStats = $derived(categories.map(cat => {
    const spent = expenses.filter(e => e.category === cat.id).reduce((sum, e) => sum + (e.amount || 0), 0);
    const budget = envelopes[cat.id] || 0;
    const remaining = budget - spent;
    const percent = budget > 0 ? (spent / budget) * 100 : 0;
    return { ...cat, spent, budget, remaining, percent };
  }));

  let topExpenses = $derived([...expenses].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 10));

  function addExpense() {
    const amount = parseFloat(newAmount);
    if (isNaN(amount) || amount <= 0) return;

    const expense = {
      id: crypto.randomUUID(),
      amount,
      category: newCategory,
      note: newNote.trim(),
      date: newDate,
    };

    expenses = [expense, ...expenses];
    newAmount = '';
    newNote = '';
    saveData();
  }

  function deleteExpense(id) {
    expenses = expenses.filter(e => e.id !== id);
    saveData();
  }

  function formatMoney(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  }

  // Pie Chart Calculations
  let pieData = $derived(() => {
    const data = categoryStats.filter(c => c.spent > 0);
    if (data.length === 0) return [];
    
    let cumulativePercent = 0;
    return data.map(cat => {
      const p = (cat.spent / totalSpent);
      const startX = Math.cos(2 * Math.PI * cumulativePercent);
      const startY = Math.sin(2 * Math.PI * cumulativePercent);
      cumulativePercent += p;
      const endX = Math.cos(2 * Math.PI * cumulativePercent);
      const endY = Math.sin(2 * Math.PI * cumulativePercent);
      
      const largeArcFlag = p > 0.5 ? 1 : 0;
      const pathData = [
        `M ${startX} ${startY}`,
        `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
        `L 0 0`
      ].join(' ');
      
      return { ...cat, pathData };
    });
  });

  $effect(() => {
    if (mounted) saveData();
  });
</script>

<div class="trail-budget" class:mounted>
  <header class="budget-header">
    <div class="header-main">
      <span class="icon">💸</span>
      <div>
        <h2>Trail Envelopes</h2>
        <p>Ramsey-style monthly budgeting for the trail</p>
      </div>
    </div>
    <div class="header-summary">
      <div class="summary-item">
        <span class="label">Total Spent</span>
        <span class="value">{formatMoney(totalSpent)}</span>
      </div>
      <div class="summary-item">
        <span class="label">Monthly Budget</span>
        <span class="value">{formatMoney(totalMonthlyBudget)}</span>
      </div>
    </div>
  </header>

  <div class="layout-grid">
    <!-- LEFT COLUMN: Input & Chart -->
    <div class="actions-panel">
      <!-- Add Expense Form -->
      <section class="card add-expense">
        <h3>Add Expense</h3>
        <div class="form-grid">
          <div class="input-group">
            <label for="amount">Amount</label>
            <div class="currency-input">
              <span>$</span>
              <input type="number" id="amount" bind:value={newAmount} placeholder="0.00" step="0.01" />
            </div>
          </div>
          <div class="input-group">
            <label for="category">Envelope</label>
            <select id="category" bind:value={newCategory}>
              {#each categories as cat}
                <option value={cat.id}>{cat.icon} {cat.name}</option>
              {/each}
            </select>
          </div>
          <div class="input-group full">
            <label for="note">Note</label>
            <input type="text" id="note" bind:value={newNote} placeholder="Walmart, Gear repair, etc." />
          </div>
          <div class="input-group">
            <label for="date">Date</label>
            <input type="date" id="date" bind:value={newDate} />
          </div>
          <button class="btn-primary" onclick={addExpense} disabled={!newAmount}>
            Add to Envelope
          </button>
        </div>
      </section>

      <!-- Pie Chart Section -->
      <section class="card spending-viz">
        <h3>Where's it going?</h3>
        {#if totalSpent > 0}
          <div class="chart-container">
            <svg viewBox="-1.1 -1.1 2.2 2.2" class="pie-chart">
              {#each pieData() as slice}
                <path d={slice.pathData} fill={slice.color}>
                  <title>{slice.name}: {formatMoney(slice.spent)}</title>
                </path>
              {/each}
              <circle r="0.6" fill="white" /> <!-- Donut hole -->
            </svg>
            <div class="chart-labels">
              {#each categoryStats.filter(c => c.spent > 0).sort((a,b) => b.spent - a.spent) as cat}
                <div class="chart-label-item">
                  <span class="dot" style="background: {cat.color}"></span>
                  <span class="name">{cat.name}</span>
                  <span class="val">{((cat.spent / totalSpent) * 100).toFixed(0)}%</span>
                </div>
              {/each}
            </div>
          </div>
        {:else}
          <div class="empty-state">
            <p>No expenses recorded yet. Start logging to see your distribution!</p>
          </div>
        {/if}
      </section>
    </div>

    <!-- RIGHT COLUMN: Envelopes & History -->
    <div class="data-panel">
      <!-- Envelope Management -->
      <section class="card envelope-list">
        <div class="section-header">
          <h3>Your Envelopes</h3>
          <button class="btn-text" onclick={() => showEnvelopeSettings = !showEnvelopeSettings}>
            {showEnvelopeSettings ? 'Done' : 'Adjust Budgets'}
          </button>
        </div>

        <div class="envelopes-grid">
          {#each categoryStats as cat}
            <div class="envelope-item" class:over={cat.remaining < 0}>
              <div class="envelope-info">
                <span class="icon">{cat.icon}</span>
                <span class="name">{cat.name}</span>
                {#if showEnvelopeSettings}
                  <div class="budget-input">
                    <span>$</span>
                    <input type="number" bind:value={envelopes[cat.id]} step="50" onchange={saveData} />
                  </div>
                {:else}
                  <span class="amount-detail">
                    {formatMoney(cat.spent)} / <span class="max">{formatMoney(cat.budget)}</span>
                  </span>
                {/if}
              </div>
              
              <div class="progress-bar">
                <div class="fill" style="width: {Math.min(100, cat.percent)}%; background: {cat.color}"></div>
              </div>
              
              <div class="envelope-footer">
                {#if cat.remaining < 0}
                  <span class="status over">Over by {formatMoney(Math.abs(cat.remaining))}! ⚠️</span>
                {:else}
                  <span class="status">{formatMoney(cat.remaining)} remaining</span>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </section>

      <!-- History -->
      <section class="card history">
        <h3>Recent Transactions</h3>
        {#if topExpenses.length > 0}
          <div class="transaction-list">
            {#each topExpenses as exp (exp.id)}
              {@const cat = categories.find(c => c.id === exp.category)}
              <div class="transaction-item" transition:slide>
                <div class="cat-icon" style="background: {cat?.color || '#eee'}">
                  {cat?.icon || '💰'}
                </div>
                <div class="details">
                  <span class="note">{exp.note || cat?.name}</span>
                  <span class="date">{exp.date}</span>
                </div>
                <div class="amount">{formatMoney(exp.amount)}</div>
                <button class="btn-del" onclick={() => deleteExpense(exp.id)} title="Delete">×</button>
              </div>
            {/each}
          </div>
        {:else}
          <div class="empty-state">
            <p>Your ledger is empty.</p>
          </div>
        {/if}
      </section>
    </div>
  </div>
</div>

<style>
  .trail-budget {
    --primary: #3d4a38;
    --accent: #d4a373;
    --bg-card: #fefae0;
    --text: #283618;
    --border: #bc6c25;
    
    font-family: 'Inter', system-ui, sans-serif;
    color: var(--text);
    opacity: 0;
    transition: opacity 0.5s;
  }
  .trail-budget.mounted { opacity: 1; }

  .budget-header {
    background: var(--primary);
    color: white;
    padding: 1.5rem 2rem;
    border-radius: 12px 12px 0 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1.5rem;
  }

  .header-main { display: flex; gap: 1rem; align-items: center; }
  .header-main .icon { font-size: 2.5rem; }
  .header-main h2 { margin: 0; font-family: 'Oswald', sans-serif; text-transform: uppercase; letter-spacing: 1px; }
  .header-main p { margin: 0; opacity: 0.8; font-size: 0.9rem; }

  .header-summary { display: flex; gap: 2rem; }
  .summary-item { display: flex; flex-direction: column; text-align: right; }
  .summary-item .label { font-size: 0.75rem; text-transform: uppercase; opacity: 0.7; }
  .summary-item .value { font-family: 'Oswald', sans-serif; font-size: 1.5rem; }

  .layout-grid {
    display: grid;
    grid-template-columns: 1fr 1.5fr;
    gap: 1.5rem;
    padding: 1.5rem;
    background: #f1f1e6;
    border-radius: 0 0 12px 12px;
  }

  @media (max-width: 900px) {
    .layout-grid { grid-template-columns: 1fr; }
  }

  .card {
    background: white;
    padding: 1.5rem;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.05);
    margin-bottom: 1.5rem;
    border: 1px solid rgba(0,0,0,0.05);
  }

  h3 {
    margin: 0 0 1.25rem;
    font-family: 'Oswald', sans-serif;
    text-transform: uppercase;
    font-size: 1.1rem;
    color: var(--primary);
    border-bottom: 2px solid var(--accent);
    display: inline-block;
    padding-bottom: 2px;
  }

  /* Form */
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  .input-group { display: flex; flex-direction: column; gap: 0.4rem; }
  .full { grid-column: span 2; }
  label { font-size: 0.75rem; font-weight: 600; color: #666; text-transform: uppercase; }
  input, select {
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 1rem;
    background: #fafafa;
  }
  .currency-input { position: relative; display: flex; align-items: center; }
  .currency-input span { position: absolute; left: 0.75rem; color: #666; font-weight: bold; }
  .currency-input input { padding-left: 1.75rem; width: 100%; }

  .btn-primary {
    grid-column: span 2;
    background: var(--primary);
    color: white;
    border: none;
    padding: 1rem;
    border-radius: 8px;
    font-family: 'Oswald', sans-serif;
    text-transform: uppercase;
    cursor: pointer;
    transition: transform 0.1s;
  }
  .btn-primary:active { transform: scale(0.98); }
  .btn-primary:disabled { opacity: 0.5; }

  /* Pie Chart */
  .chart-container {
    display: flex;
    align-items: center;
    gap: 2rem;
  }
  .pie-chart { width: 150px; height: 150px; transform: rotate(-90deg); }
  .chart-labels { flex: 1; display: grid; gap: 0.5rem; }
  .chart-label-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; }
  .dot { width: 10px; height: 10px; border-radius: 50%; }
  .val { margin-left: auto; font-weight: bold; }

  /* Envelopes */
  .section-header { display: flex; justify-content: space-between; align-items: baseline; }
  .btn-text { background: none; border: none; color: var(--border); font-weight: 600; cursor: pointer; }
  
  .envelopes-grid { display: flex; flex-direction: column; gap: 1rem; }
  .envelope-item { background: #fafafa; padding: 1rem; border-radius: 8px; border: 1px solid #eee; }
  .envelope-item.over { border-color: #ef4444; background: #fff5f5; }

  .envelope-info { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; }
  .envelope-info .name { font-weight: 600; flex: 1; }
  .amount-detail { font-size: 0.85rem; font-weight: 600; }
  .amount-detail .max { color: #999; }

  .budget-input { display: flex; align-items: center; gap: 0.25rem; }
  .budget-input input { padding: 0.25rem 0.5rem; width: 80px; font-size: 0.85rem; }

  .progress-bar { height: 8px; background: #eee; border-radius: 4px; overflow: hidden; margin-bottom: 0.5rem; }
  .progress-bar .fill { height: 100%; border-radius: 4px; transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1); }

  .envelope-footer { font-size: 0.75rem; text-align: right; color: #666; }
  .status.over { color: #ef4444; font-weight: bold; }

  /* History */
  .transaction-list { display: flex; flex-direction: column; gap: 0.5rem; }
  .transaction-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem;
    border-radius: 8px;
    background: #fafafa;
    border: 1px solid #eee;
  }
  .transaction-item .cat-icon {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    font-size: 0.9rem;
  }
  .details { flex: 1; display: flex; flex-direction: column; }
  .details .note { font-weight: 500; font-size: 0.9rem; }
  .details .date { font-size: 0.7rem; color: #999; }
  .transaction-item .amount { font-family: 'Oswald', sans-serif; font-weight: bold; }
  
  .btn-del {
    background: none;
    border: none;
    color: #ccc;
    font-size: 1.25rem;
    cursor: pointer;
    line-height: 1;
  }
  .btn-del:hover { color: #ef4444; }

  .empty-state {
    padding: 2rem;
    text-align: center;
    color: #999;
    font-style: italic;
    background: #fafafa;
    border: 2px dashed #eee;
    border-radius: 8px;
  }
</style>
