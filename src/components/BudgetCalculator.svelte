<script>
  import { onMount } from 'svelte';

  let { trailContext = {} } = $props();

  const categories = [
    { id: 'food', name: 'Food & Resupply', icon: '🛒', color: '#22c55e' },
    { id: 'lodging', name: 'Lodging', icon: '🏨', color: '#3b82f6' },
    { id: 'gear', name: 'Gear & Repairs', icon: '🎒', color: '#f59e0b' },
    { id: 'services', name: 'Town Services', icon: '🧺', color: '#a855f7' },
    { id: 'transport', name: 'Transportation', icon: '🚗', color: '#ef4444' },
    { id: 'entertainment', name: 'Entertainment', icon: '🍺', color: '#ec4899' },
    { id: 'other', name: 'Other', icon: '📦', color: '#6b7280' },
  ];

  let mounted = $state(false);
  let totalBudget = $state(5000);
  let startDate = $state('2026-02-15');
  let expenses = $state([]);

  let newAmount = $state('');
  let newCategory = $state('food');
  let newNote = $state('');

  onMount(() => {
    mounted = true;
    const saved = localStorage.getItem('at-budget-data');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        totalBudget = data.totalBudget || 5000;
        startDate = data.startDate || trailContext.tripStartDate || trailContext.startDate || '2026-02-15';
        expenses = data.expenses || [];
      } catch (e) {
        console.error('Failed to load budget data:', e);
      }
    } else if (trailContext.tripStartDate || trailContext.startDate) {
      startDate = trailContext.tripStartDate || trailContext.startDate;
    }
  });

  function saveData() {
    const data = { totalBudget, startDate, expenses };
    localStorage.setItem('at-budget-data', JSON.stringify(data));
  }

  function getDaysOnTrail() {
    const start = new Date(startDate);
    const today = new Date();
    const diff = today - start;
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  }

  let trailStarted = $derived(new Date(startDate) <= new Date());

  function addExpense() {
    const amount = parseFloat(newAmount);
    if (isNaN(amount) || amount <= 0) return;

    const expense = {
      id: Date.now(),
      amount,
      category: newCategory,
      note: newNote.trim(),
      date: new Date().toISOString(),
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
      maximumFractionDigits: 0,
    }).format(amount);
  }

  function formatDateShort(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  let daysOnTrail = $derived(getDaysOnTrail());
  let totalSpent = $derived(expenses.reduce((sum, e) => sum + e.amount, 0));
  let remaining = $derived(totalBudget - totalSpent);
  let percentSpent = $derived(totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0);

  let dailyAverage = $derived.by(() => {
    if (trailStarted && daysOnTrail > 0) {
      return totalSpent / daysOnTrail;
    } else if (expenses.length > 0) {
      const avgPerExpense = totalSpent / expenses.length;
      return avgPerExpense / 6;
    } else {
      return totalBudget / 150;
    }
  });

  let monthlyRate = $derived(dailyAverage * 30);

  let projectedTotal = $derived.by(() => {
    if (trailStarted && daysOnTrail > 0) {
      return dailyAverage * 150;
    } else if (expenses.length > 0) {
      return dailyAverage * 150;
    } else {
      return totalBudget;
    }
  });

  let daysRemaining = $derived(dailyAverage > 0 ? Math.floor(remaining / dailyAverage) : 999);

  let budgetStatus = $derived.by(() => {
    if (!trailStarted && expenses.length === 0) return 'good';
    const ratio = projectedTotal / totalBudget;
    if (ratio <= 1) return 'good';
    if (ratio <= 1.15) return 'caution';
    return 'over';
  });

  let statusConfig = $derived.by(() => {
    if (budgetStatus === 'good') return { label: 'ON TRACK', color: '#22c55e', icon: '✓' };
    if (budgetStatus === 'caution') return { label: 'WATCH IT', color: '#f59e0b', icon: '!' };
    return { label: 'OVER BUDGET', color: '#ef4444', icon: '✗' };
  });

  let categoryTotals = $derived(categories.map(cat => {
    const total = expenses.filter(e => e.category === cat.id).reduce((sum, e) => sum + e.amount, 0);
    const percent = totalSpent > 0 ? (total / totalSpent) * 100 : 0;
    return { ...cat, total, percent };
  }).filter(c => c.total > 0).sort((a, b) => b.total - a.total));

  let recentExpenses = $derived(expenses.slice(0, 8));

  let trailRangePercent = $derived(Math.min(100, Math.max(0, ((projectedTotal - 4000) / 3000) * 100)));

  $effect(() => {
    if (mounted && (totalBudget || startDate)) {
      saveData();
    }
  });

  function getCategoryById(id) {
    return categories.find(c => c.id === id) || categories[categories.length - 1];
  }

  // Donut chart calculations
  let donutRadius = 70;
  let donutStroke = 20;
  let donutCircumference = $derived(2 * Math.PI * donutRadius);
  let spentOffset = $derived(donutCircumference - (percentSpent / 100) * donutCircumference);
</script>

<div class="budget-calc" class:mounted>
  <!-- Header -->
  <header class="calc-header">
    <div class="header-icon">
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/>
      </svg>
    </div>
    <div class="header-content">
      <h2>TRAIL LEDGER</h2>
      <p>Track every dollar on the AT</p>
    </div>
    <div class="header-status" style="--status-color: {statusConfig.color}">
      <span class="status-icon">{statusConfig.icon}</span>
      <span class="status-text">{statusConfig.label}</span>
    </div>
  </header>

  <!-- Budget Setup -->
  <section class="setup-section">
    <div class="setup-grid">
      <div class="setup-field">
        <label>TOTAL BUDGET</label>
        <div class="money-input">
          <span class="currency">$</span>
          <input
            type="number"
            bind:value={totalBudget}
            min="1000"
            max="20000"
            step="100"
          />
        </div>
      </div>
      <div class="setup-field">
        <label>START DATE</label>
        <input
          type="date"
          bind:value={startDate}
          class="date-input"
        />
      </div>
    </div>
  </section>

  <!-- Main Dashboard -->
  <section class="dashboard-section">
    <div class="dashboard-grid">
      <!-- Donut Chart -->
      <div class="donut-container">
        <svg viewBox="0 0 180 180" class="donut-chart">
          <!-- Background circle -->
          <circle
            cx="90"
            cy="90"
            r={donutRadius}
            fill="none"
            stroke="var(--border)"
            stroke-width={donutStroke}
          />
          <!-- Spent arc -->
          <circle
            cx="90"
            cy="90"
            r={donutRadius}
            fill="none"
            stroke={statusConfig.color}
            stroke-width={donutStroke}
            stroke-dasharray={donutCircumference}
            stroke-dashoffset={spentOffset}
            stroke-linecap="round"
            transform="rotate(-90 90 90)"
            class="spent-arc"
          />
        </svg>
        <div class="donut-center">
          <span class="donut-spent">{formatMoney(totalSpent)}</span>
          <span class="donut-label">of {formatMoney(totalBudget)}</span>
          <span class="donut-percent">{percentSpent.toFixed(0)}%</span>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📅</div>
          <div class="stat-data">
            <span class="stat-value">{trailStarted ? daysOnTrail : expenses.length}</span>
            <span class="stat-label">{trailStarted ? 'Days On Trail' : 'Planned Items'}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-data">
            <span class="stat-value">{formatMoney(dailyAverage)}</span>
            <span class="stat-label">{trailStarted ? 'Daily Avg' : 'Est. Daily'}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📈</div>
          <div class="stat-data">
            <span class="stat-value">{formatMoney(monthlyRate)}</span>
            <span class="stat-label">{trailStarted ? 'Monthly Rate' : 'Est. Monthly'}</span>
          </div>
        </div>
        <div class="stat-card accent" style="--accent: {statusConfig.color}">
          <div class="stat-icon">⏱️</div>
          <div class="stat-data">
            <span class="stat-value">{daysRemaining < 999 ? daysRemaining : '—'}</span>
            <span class="stat-label">Budget Days Left</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Remaining Bar -->
    <div class="remaining-bar">
      <div class="bar-track">
        <div class="bar-fill" style="width: {Math.min(100, percentSpent)}%; background: {statusConfig.color}"></div>
      </div>
      <div class="bar-labels">
        <span class="spent-label">{formatMoney(totalSpent)} spent</span>
        <span class="remain-label">{formatMoney(remaining)} remaining</span>
      </div>
    </div>
  </section>

  <!-- Add Expense -->
  <section class="add-section">
    <h3 class="section-header">
      <span class="header-bar"></span>
      ADD EXPENSE
    </h3>
    <div class="add-form">
      <div class="form-row">
        <div class="form-field amount">
          <label>Amount</label>
          <div class="money-input small">
            <span class="currency">$</span>
            <input
              type="number"
              bind:value={newAmount}
              min="0"
              step="0.01"
              placeholder="0"
              onkeydown={(e) => e.key === 'Enter' && addExpense()}
            />
          </div>
        </div>
        <div class="form-field category">
          <label>Category</label>
          <select bind:value={newCategory}>
            {#each categories as cat}
              <option value={cat.id}>{cat.icon} {cat.name}</option>
            {/each}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-field note">
          <label>Note</label>
          <input
            type="text"
            bind:value={newNote}
            placeholder="e.g., Resupply at Walmart"
            onkeydown={(e) => e.key === 'Enter' && addExpense()}
          />
        </div>
        <button class="add-btn" onclick={addExpense} disabled={!newAmount}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Add
        </button>
      </div>
    </div>
  </section>

  <!-- Recent Expenses -->
  {#if recentExpenses.length > 0}
    <section class="expenses-section">
      <h3 class="section-header">
        <span class="header-bar"></span>
        RECENT EXPENSES
        <span class="count-badge">{expenses.length}</span>
      </h3>
      <div class="expense-list">
        {#each recentExpenses as expense (expense.id)}
          {@const cat = getCategoryById(expense.category)}
          <div class="expense-item">
            <div class="expense-cat" style="--cat-color: {cat.color}">
              {cat.icon}
            </div>
            <div class="expense-info">
              <span class="expense-name">{cat.name}</span>
              {#if expense.note}
                <span class="expense-note">{expense.note}</span>
              {/if}
            </div>
            <div class="expense-amount">{formatMoney(expense.amount)}</div>
            <div class="expense-date">{formatDateShort(expense.date)}</div>
            <button class="delete-btn" onclick={() => deleteExpense(expense.id)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        {/each}
      </div>
    </section>
  {/if}

  <!-- Category Breakdown -->
  {#if categoryTotals.length > 0}
    <section class="breakdown-section">
      <h3 class="section-header">
        <span class="header-bar"></span>
        SPENDING BY CATEGORY
      </h3>
      <div class="category-list">
        {#each categoryTotals as cat}
          <div class="category-item">
            <div class="cat-header">
              <span class="cat-icon" style="background: {cat.color}">{cat.icon}</span>
              <span class="cat-name">{cat.name}</span>
              <span class="cat-amount">{formatMoney(cat.total)}</span>
            </div>
            <div class="cat-bar">
              <div class="cat-fill" style="width: {cat.percent}%; background: {cat.color}"></div>
            </div>
            <span class="cat-percent">{cat.percent.toFixed(0)}%</span>
          </div>
        {/each}
      </div>
    </section>
  {/if}

  <!-- Trail Context -->
  <section class="context-section">
    <h3 class="section-header">
      <span class="header-bar"></span>
      TRAIL SPENDING CONTEXT
    </h3>
    <div class="context-card">
      <div class="context-top">
        <div class="projected-label">Projected Total</div>
        <div class="projected-value">{formatMoney(projectedTotal)}</div>
      </div>

      {#if trailStarted || expenses.length > 0}
        <div class="range-section">
          <div class="range-track">
            <div class="range-gradient"></div>
            <div class="range-marker" style="left: {trailRangePercent}%">
              <span class="marker-dot"></span>
              <span class="marker-label">You</span>
            </div>
          </div>
          <div class="range-labels">
            <div class="range-point">
              <span class="pt-value">$4K</span>
              <span class="pt-label">Budget</span>
            </div>
            <div class="range-point">
              <span class="pt-value">$5.5K</span>
              <span class="pt-label">Average</span>
            </div>
            <div class="range-point">
              <span class="pt-value">$7K</span>
              <span class="pt-label">Comfortable</span>
            </div>
          </div>
        </div>
      {:else}
        <div class="planning-note">
          <span class="note-icon">💡</span>
          <p>Add expected expenses to see how your plans compare to your budget.</p>
        </div>
      {/if}

      <div class="context-tips">
        <div class="tip">
          <span>💰</span>
          <span>Typical AT thru-hike: $1,000–$1,500/month</span>
        </div>
        <div class="tip">
          <span>🏨</span>
          <span>Lodging is usually the biggest variable</span>
        </div>
      </div>
    </div>
  </section>

  <!-- Data Management -->
  <div class="data-section">
    <button class="clear-btn" onclick={() => { if(confirm('Clear all expense data?')) { expenses = []; saveData(); }}}>
      Clear All Data
    </button>
  </div>

  <!-- Guide Link -->
  <a href="/guide/thru-hike-financial-planning" class="guide-link">
    <span>Read the Financial Planning Guide</span>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  </a>
</div>

<style>
  .budget-calc {
    background: var(--bg);
    border: 2px solid var(--border);
    border-radius: 16px;
    overflow: hidden;
    opacity: 0;
    transform: translateY(12px);
    transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .budget-calc.mounted {
    opacity: 1;
    transform: translateY(0);
  }

  /* Header */
  .calc-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.25rem 1.5rem;
    background: linear-gradient(135deg, #166534 0%, #15803d 100%);
    border-bottom: 2px solid #14532d;
  }

  .header-icon {
    width: 48px;
    height: 48px;
    background: rgba(255,255,255,0.15);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #bbf7d0;
  }

  .header-icon svg {
    width: 28px;
    height: 28px;
  }

  .header-content {
    flex: 1;
  }

  .header-content h2 {
    margin: 0;
    font-family: Oswald, sans-serif;
    font-size: 1.35rem;
    font-weight: 700;
    color: #fff;
    letter-spacing: 0.05em;
  }

  .header-content p {
    margin: 0.15rem 0 0;
    font-size: 0.85rem;
    color: #bbf7d0;
  }

  .header-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: rgba(0,0,0,0.2);
    border-radius: 8px;
    border: 2px solid var(--status-color);
  }

  .status-icon {
    width: 20px;
    height: 20px;
    background: var(--status-color);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7rem;
    font-weight: 700;
    color: #fff;
  }

  .status-text {
    font-family: Oswald, sans-serif;
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--status-color);
    letter-spacing: 0.05em;
  }

  /* Setup Section */
  .setup-section {
    padding: 1.5rem;
    background: #fff;
    border-bottom: 2px solid var(--border);
  }

  .setup-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
  }

  .setup-field label {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--muted);
    letter-spacing: 0.08em;
    margin-bottom: 0.5rem;
  }

  .money-input {
    display: flex;
    align-items: center;
    background: var(--bg);
    border: 2px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
  }

  .money-input .currency {
    padding: 0.75rem;
    background: var(--border);
    color: var(--muted);
    font-weight: 600;
    font-size: 1rem;
  }

  .money-input input {
    flex: 1;
    padding: 0.75rem;
    border: none;
    background: transparent;
    font-family: Oswald, sans-serif;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--ink);
    min-width: 0;
  }

  .money-input input:focus {
    outline: none;
  }

  .money-input.small {
    max-width: 140px;
  }

  .date-input {
    width: 100%;
    padding: 0.75rem;
    background: var(--bg);
    border: 2px solid var(--border);
    border-radius: 8px;
    font-size: 1rem;
    color: var(--ink);
    box-sizing: border-box;
  }

  /* Dashboard Section */
  .dashboard-section {
    padding: 1.5rem;
    background: #fff;
    border-bottom: 2px solid var(--border);
  }

  .dashboard-grid {
    display: grid;
    grid-template-columns: 180px 1fr;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
  }

  /* Donut Chart */
  .donut-container {
    position: relative;
    width: 180px;
    height: 180px;
  }

  .donut-chart {
    width: 100%;
    height: 100%;
  }

  .spent-arc {
    transition: stroke-dashoffset 0.6s ease;
  }

  .donut-center {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .donut-spent {
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--ink);
  }

  .donut-label {
    font-size: 0.7rem;
    color: var(--muted);
  }

  .donut-percent {
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--alpine);
    margin-top: 0.25rem;
  }

  /* Stats Grid */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  .stat-card {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: var(--bg);
    border: 2px solid var(--border);
    border-radius: 10px;
  }

  .stat-card.accent {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 5%, white);
  }

  .stat-icon {
    font-size: 1.25rem;
  }

  .stat-data {
    display: flex;
    flex-direction: column;
  }

  .stat-value {
    font-family: Oswald, sans-serif;
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--ink);
    line-height: 1.1;
  }

  .stat-label {
    font-size: 0.65rem;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  /* Remaining Bar */
  .remaining-bar {
    margin-top: 0.5rem;
  }

  .bar-track {
    height: 12px;
    background: var(--border);
    border-radius: 6px;
    overflow: hidden;
  }

  .bar-fill {
    height: 100%;
    border-radius: 6px;
    transition: width 0.5s ease;
  }

  .bar-labels {
    display: flex;
    justify-content: space-between;
    margin-top: 0.5rem;
    font-size: 0.75rem;
    color: var(--muted);
  }

  /* Section Headers */
  .section-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin: 0 0 1.25rem;
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--pine);
    letter-spacing: 0.08em;
  }

  .header-bar {
    width: 4px;
    height: 16px;
    background: var(--marker);
    border-radius: 2px;
  }

  .count-badge {
    margin-left: auto;
    padding: 0.15rem 0.5rem;
    background: var(--border);
    border-radius: 10px;
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--muted);
  }

  /* Add Section */
  .add-section {
    padding: 1.5rem;
    background: var(--bg);
    border-bottom: 2px solid var(--border);
  }

  .add-form {
    background: #fff;
    border: 2px solid var(--border);
    border-radius: 12px;
    padding: 1.25rem;
  }

  .form-row {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .form-row:last-child {
    margin-bottom: 0;
  }

  .form-field {
    flex: 1;
  }

  .form-field.amount {
    flex: 0 0 140px;
  }

  .form-field label {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--muted);
    letter-spacing: 0.05em;
    margin-bottom: 0.4rem;
  }

  .form-field select,
  .form-field.note input {
    width: 100%;
    padding: 0.7rem;
    background: var(--bg);
    border: 2px solid var(--border);
    border-radius: 8px;
    font-size: 0.9rem;
    color: var(--ink);
    box-sizing: border-box;
  }

  .add-btn {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.7rem 1.25rem;
    background: var(--pine);
    border: 2px solid var(--pine);
    border-radius: 8px;
    color: #fff;
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    align-self: flex-end;
    white-space: nowrap;
  }

  .add-btn svg {
    width: 16px;
    height: 16px;
  }

  .add-btn:hover:not(:disabled) {
    background: var(--alpine);
    border-color: var(--alpine);
  }

  .add-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Expenses Section */
  .expenses-section {
    padding: 1.5rem;
    background: #fff;
    border-bottom: 2px solid var(--border);
  }

  .expense-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .expense-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: var(--bg);
    border: 2px solid var(--border);
    border-radius: 8px;
  }

  .expense-cat {
    width: 36px;
    height: 36px;
    background: color-mix(in srgb, var(--cat-color) 15%, white);
    border: 2px solid var(--cat-color);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    flex-shrink: 0;
  }

  .expense-info {
    flex: 1;
    min-width: 0;
  }

  .expense-name {
    display: block;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--ink);
  }

  .expense-note {
    display: block;
    font-size: 0.75rem;
    color: var(--muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .expense-amount {
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 700;
    color: var(--ink);
    flex-shrink: 0;
  }

  .expense-date {
    font-size: 0.7rem;
    color: var(--muted);
    flex-shrink: 0;
  }

  .delete-btn {
    width: 28px;
    height: 28px;
    border: none;
    background: transparent;
    color: var(--muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    transition: all 0.2s;
    flex-shrink: 0;
  }

  .delete-btn svg {
    width: 16px;
    height: 16px;
  }

  .delete-btn:hover {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
  }

  /* Breakdown Section */
  .breakdown-section {
    padding: 1.5rem;
    background: var(--bg);
    border-bottom: 2px solid var(--border);
  }

  .category-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .category-item {
    display: grid;
    grid-template-columns: 1fr 100px 45px;
    gap: 1rem;
    align-items: center;
  }

  .cat-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .cat-icon {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.9rem;
  }

  .cat-name {
    flex: 1;
    font-size: 0.85rem;
    color: var(--ink);
  }

  .cat-amount {
    font-family: Oswald, sans-serif;
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--ink);
  }

  .cat-bar {
    height: 8px;
    background: var(--border);
    border-radius: 4px;
    overflow: hidden;
  }

  .cat-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.5s ease;
  }

  .cat-percent {
    font-family: Oswald, sans-serif;
    font-size: 0.8rem;
    color: var(--muted);
    text-align: right;
  }

  /* Context Section */
  .context-section {
    padding: 1.5rem;
    background: #fff;
    border-bottom: 2px solid var(--border);
  }

  .context-card {
    background: linear-gradient(135deg, rgba(22, 101, 52, 0.08) 0%, rgba(22, 101, 52, 0.02) 100%);
    border: 2px solid var(--alpine);
    border-radius: 12px;
    padding: 1.25rem;
  }

  .context-top {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 1.25rem;
  }

  .projected-label {
    font-family: Oswald, sans-serif;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .projected-value {
    font-family: Oswald, sans-serif;
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--pine);
  }

  .range-section {
    margin-bottom: 1.25rem;
  }

  .range-track {
    height: 12px;
    background: linear-gradient(90deg, #22c55e, #eab308, #ef4444);
    border-radius: 6px;
    position: relative;
    margin-bottom: 0.75rem;
  }

  .range-gradient {
    position: absolute;
    inset: 0;
    border-radius: 6px;
  }

  .range-marker {
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .marker-dot {
    width: 16px;
    height: 16px;
    background: #fff;
    border: 3px solid var(--ink);
    border-radius: 50%;
    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
  }

  .marker-label {
    margin-top: 0.35rem;
    font-family: Oswald, sans-serif;
    font-size: 0.65rem;
    font-weight: 700;
    color: var(--ink);
    background: #fff;
    padding: 0.1rem 0.4rem;
    border-radius: 4px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }

  .range-labels {
    display: flex;
    justify-content: space-between;
  }

  .range-point {
    text-align: left;
  }

  .range-point:nth-child(2) {
    text-align: center;
  }

  .range-point:last-child {
    text-align: right;
  }

  .pt-value {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--ink);
  }

  .pt-label {
    font-size: 0.65rem;
    color: var(--muted);
  }

  .planning-note {
    display: flex;
    gap: 0.75rem;
    padding: 1rem;
    background: rgba(250, 204, 21, 0.1);
    border-radius: 8px;
    margin-bottom: 1rem;
  }

  .note-icon {
    font-size: 1.25rem;
    flex-shrink: 0;
  }

  .planning-note p {
    margin: 0;
    font-size: 0.85rem;
    color: var(--muted);
    line-height: 1.5;
  }

  .context-tips {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .tip {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8rem;
    color: var(--muted);
  }

  /* Data Section */
  .data-section {
    padding: 1rem 1.5rem;
    text-align: center;
    background: var(--bg);
    border-bottom: 2px solid var(--border);
  }

  .clear-btn {
    padding: 0.5rem 1rem;
    background: transparent;
    border: 2px solid var(--border);
    border-radius: 6px;
    font-size: 0.8rem;
    color: var(--muted);
    cursor: pointer;
    transition: all 0.2s;
  }

  .clear-btn:hover {
    border-color: #ef4444;
    color: #ef4444;
  }

  /* Guide Link */
  .guide-link {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 1rem;
    background: var(--pine);
    color: #fff;
    text-decoration: none;
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    letter-spacing: 0.03em;
    transition: all 0.2s;
  }

  .guide-link:hover {
    background: var(--alpine);
  }

  .guide-link svg {
    width: 18px;
    height: 18px;
  }

  /* Responsive */
  @media (max-width: 640px) {
    .setup-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .dashboard-grid {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }

    .donut-container {
      margin: 0 auto;
    }

    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .form-row {
      flex-direction: column;
    }

    .form-field.amount {
      flex: 1;
    }

    .money-input.small {
      max-width: none;
    }

    .add-btn {
      width: 100%;
      justify-content: center;
    }

    .category-item {
      grid-template-columns: 1fr 80px 40px;
      gap: 0.75rem;
    }

    .header-status {
      display: none;
    }
  }
</style>
