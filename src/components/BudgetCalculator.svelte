<script>
  import { onMount } from 'svelte';

  // Accept global trail context from parent
  let { trailContext = {} } = $props();

  const categories = [
    { id: 'food', name: 'Food & Resupply', icon: '🛒', color: '#a6b589' },
    { id: 'lodging', name: 'Lodging', icon: '🏨', color: '#6b8cae' },
    { id: 'gear', name: 'Gear & Repairs', icon: '🎒', color: '#d97706' },
    { id: 'services', name: 'Town Services', icon: '🧺', color: '#9f7aea' },
    { id: 'transport', name: 'Transportation', icon: '🚗', color: '#e53e3e' },
    { id: 'entertainment', name: 'Entertainment', icon: '🍺', color: '#ed8936' },
    { id: 'other', name: 'Other', icon: '📦', color: '#718096' },
  ];

  // State
  let mounted = $state(false);
  let totalBudget = $state(5000);
  let startDate = $state('2026-02-15');
  let expenses = $state([]);

  // New expense form
  let newAmount = $state('');
  let newCategory = $state('food');
  let newNote = $state('');

  // Load from localStorage on mount, use context startDate as default if available
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
      // No saved data, use context date as default
      startDate = trailContext.tripStartDate || trailContext.startDate;
    }
  });

  // Save to localStorage whenever data changes
  function saveData() {
    const data = { totalBudget, startDate, expenses };
    localStorage.setItem('at-budget-data', JSON.stringify(data));
  }

  // Calculate days on trail
  function getDaysOnTrail() {
    const start = new Date(startDate);
    const today = new Date();
    const diff = today - start;
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  }

  // Add expense
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

  // Delete expense
  function deleteExpense(id) {
    expenses = expenses.filter(e => e.id !== id);
    saveData();
  }

  // Format currency
  function formatMoney(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  // Format date short
  function formatDateShort(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // Reactive calculations
  let daysOnTrail = $derived(getDaysOnTrail());
  let totalSpent = $derived(expenses.reduce((sum, e) => sum + e.amount, 0));
  let remaining = $derived(totalBudget - totalSpent);
  let percentSpent = $derived(totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0);
  let dailyAverage = $derived(daysOnTrail > 0 ? totalSpent / daysOnTrail : 0);
  let monthlyRate = $derived(dailyAverage * 30);

  // Projected total (assuming 150 days typical thru-hike)
  let projectedTotal = $derived(dailyAverage * 150);

  // Days of budget remaining at current rate
  let daysRemaining = $derived(dailyAverage > 0 ? Math.floor(remaining / dailyAverage) : 999);

  // Budget status
  let budgetStatus = $derived(percentSpent < 60 ? 'good' : percentSpent < 85 ? 'caution' : 'over');
  let statusLabel = $derived(budgetStatus === 'good' ? 'On Track' : budgetStatus === 'caution' ? 'Watch Spending' : 'Over Budget');

  // Category breakdown
  let categoryTotals = $derived(categories.map(cat => {
    const total = expenses.filter(e => e.category === cat.id).reduce((sum, e) => sum + e.amount, 0);
    const percent = totalSpent > 0 ? (total / totalSpent) * 100 : 0;
    return { ...cat, total, percent };
  }).filter(c => c.total > 0).sort((a, b) => b.total - a.total));

  // Recent expenses (last 10)
  let recentExpenses = $derived(expenses.slice(0, 10));

  // Trail context - where does user fall in typical range
  let trailRangePercent = $derived(Math.min(100, Math.max(0, ((projectedTotal - 4000) / 3000) * 100)));

  // Watch for changes to save
  $effect(() => {
    if (mounted && (totalBudget || startDate)) {
      saveData();
    }
  });

  function getCategoryById(id) {
    return categories.find(c => c.id === id) || categories[categories.length - 1];
  }
</script>

<div class="budget-calc" class:mounted>
  <!-- Header -->
  <header class="calc-header">
    <div class="header-inner">
      <span class="header-badge">AT 2026 NOBO</span>
      <h2 class="header-title">Budget Tracker</h2>
      <p class="header-sub">Track your spending on the trail</p>
    </div>
  </header>

  <!-- Budget Setup -->
  <div class="setup-section">
    <div class="setup-grid">
      <div class="setup-item">
        <label class="control-label">Total Budget</label>
        <div class="money-input-wrap">
          <span class="money-prefix">$</span>
          <input
            type="number"
            bind:value={totalBudget}
            min="1000"
            max="20000"
            step="100"
            class="money-input"
          />
        </div>
      </div>
      <div class="setup-item">
        <label class="control-label">Trail Start Date</label>
        <input
          type="date"
          bind:value={startDate}
          class="date-input"
        />
      </div>
    </div>
  </div>

  <!-- Budget Overview -->
  <div class="overview-section">
    <div class="budget-bar-wrap">
      <div class="budget-bar">
        <div class="budget-fill {budgetStatus}" style="width: {Math.min(100, percentSpent)}%"></div>
        <div class="budget-marker" style="left: {Math.min(100, percentSpent)}%"></div>
      </div>
      <div class="budget-labels">
        <span>{formatMoney(totalSpent)} spent</span>
        <span>{formatMoney(remaining)} remaining</span>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-card">
        <span class="stat-icon">📅</span>
        <div class="stat-content">
          <span class="stat-value">{daysOnTrail}</span>
          <span class="stat-label">Days on Trail</span>
        </div>
      </div>
      <div class="stat-card">
        <span class="stat-icon">📊</span>
        <div class="stat-content">
          <span class="stat-value">{formatMoney(dailyAverage)}</span>
          <span class="stat-label">Daily Average</span>
        </div>
      </div>
      <div class="stat-card">
        <span class="stat-icon">📈</span>
        <div class="stat-content">
          <span class="stat-value">{formatMoney(monthlyRate)}</span>
          <span class="stat-label">Monthly Rate</span>
        </div>
      </div>
      <div class="stat-card status-card {budgetStatus}">
        <span class="stat-icon">{budgetStatus === 'good' ? '✅' : budgetStatus === 'caution' ? '⚠️' : '🚨'}</span>
        <div class="stat-content">
          <span class="stat-value">{daysRemaining}</span>
          <span class="stat-label">Days Left at Pace</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Quick Add Expense -->
  <div class="add-section">
    <h3 class="section-title">
      <span class="title-blaze"></span>
      <span>Add Expense</span>
    </h3>

    <div class="add-form">
      <div class="form-row">
        <div class="form-field amount-field">
          <label class="field-label">Amount</label>
          <div class="money-input-wrap small">
            <span class="money-prefix">$</span>
            <input
              type="number"
              bind:value={newAmount}
              min="0"
              step="0.01"
              placeholder="0"
              class="money-input"
              onkeydown={(e) => e.key === 'Enter' && addExpense()}
            />
          </div>
        </div>
        <div class="form-field category-field">
          <label class="field-label">Category</label>
          <select bind:value={newCategory} class="category-select">
            {#each categories as cat}
              <option value={cat.id}>{cat.icon} {cat.name}</option>
            {/each}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-field note-field">
          <label class="field-label">Note (optional)</label>
          <input
            type="text"
            bind:value={newNote}
            placeholder="e.g., Resupply at Walmart"
            class="note-input"
            onkeydown={(e) => e.key === 'Enter' && addExpense()}
          />
        </div>
        <button class="add-btn" onclick={addExpense} disabled={!newAmount}>
          + Add
        </button>
      </div>
    </div>
  </div>

  <!-- Recent Expenses -->
  {#if recentExpenses.length > 0}
    <div class="recent-section">
      <h3 class="section-title">
        <span class="title-blaze"></span>
        <span>Recent Expenses</span>
        <span class="expense-count">{expenses.length} total</span>
      </h3>

      <div class="expense-list">
        {#each recentExpenses as expense (expense.id)}
          {@const cat = getCategoryById(expense.category)}
          <div class="expense-row">
            <div class="expense-icon" style="background: {cat.color}20; color: {cat.color}">
              {cat.icon}
            </div>
            <div class="expense-info">
              <span class="expense-cat">{cat.name}</span>
              {#if expense.note}
                <span class="expense-note">{expense.note}</span>
              {/if}
            </div>
            <div class="expense-meta">
              <span class="expense-amount">{formatMoney(expense.amount)}</span>
              <span class="expense-date">{formatDateShort(expense.date)}</span>
            </div>
            <button class="delete-btn" onclick={() => deleteExpense(expense.id)} title="Delete">
              ×
            </button>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Category Breakdown -->
  {#if categoryTotals.length > 0}
    <div class="breakdown-section">
      <h3 class="section-title">
        <span class="title-blaze"></span>
        <span>Spending by Category</span>
      </h3>

      <div class="category-list">
        {#each categoryTotals as cat}
          <div class="category-row">
            <div class="cat-header">
              <span class="cat-icon" style="background: {cat.color}20">{cat.icon}</span>
              <span class="cat-name">{cat.name}</span>
              <span class="cat-amount">{formatMoney(cat.total)}</span>
            </div>
            <div class="cat-bar-wrap">
              <div class="cat-bar" style="width: {cat.percent}%; background: {cat.color}"></div>
            </div>
            <span class="cat-percent">{cat.percent.toFixed(0)}%</span>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Trail Context -->
  <div class="context-section">
    <h3 class="section-title">
      <span class="title-blaze"></span>
      <span>Trail Spending Context</span>
    </h3>

    <div class="context-card">
      <div class="context-header">
        <span class="context-label">Your Projected Total</span>
        <span class="context-value">{formatMoney(projectedTotal)}</span>
      </div>

      <div class="range-viz">
        <div class="range-bar">
          <div class="range-fill"></div>
          <div class="range-marker" style="left: {trailRangePercent}%">
            <span class="marker-label">You</span>
          </div>
        </div>
        <div class="range-labels">
          <div class="range-point">
            <span class="point-value">$4,000</span>
            <span class="point-label">Budget</span>
          </div>
          <div class="range-point center">
            <span class="point-value">$5,500</span>
            <span class="point-label">Average</span>
          </div>
          <div class="range-point">
            <span class="point-value">$7,000</span>
            <span class="point-label">Comfortable</span>
          </div>
        </div>
      </div>

      <div class="context-tips">
        <div class="tip">
          <span class="tip-icon">💡</span>
          <span>Typical AT thru-hike: $1,000–$1,500/month</span>
        </div>
        <div class="tip">
          <span class="tip-icon">🏨</span>
          <span>Lodging is usually the biggest variable cost</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Data Management -->
  <div class="data-section">
    <button class="clear-btn" onclick={() => { if(confirm('Clear all expense data?')) { expenses = []; saveData(); }}}>
      Clear All Data
    </button>
  </div>
</div>

<style>
  .budget-calc {
    background: var(--card, #fff);
    border-radius: 16px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    border: 1px solid var(--border);
    overflow: hidden;
    opacity: 0;
    transform: translateY(10px);
    transition: all 0.5s ease;
  }

  .budget-calc.mounted {
    opacity: 1;
    transform: translateY(0);
  }

  /* Header */
  .calc-header {
    padding: 2rem 2rem 1.5rem;
    background: linear-gradient(to bottom, #fdfcf9, #f5f2e8);
    border-bottom: 1px solid var(--border);
  }

  .header-badge {
    font-family: Oswald, sans-serif;
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--terra);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    display: block;
    margin-bottom: 0.5rem;
  }

  .header-title {
    font-family: Oswald, sans-serif;
    font-size: 2rem;
    margin: 0;
    color: var(--ink);
    line-height: 1.1;
  }

  .header-sub {
    margin: 0.5rem 0 0;
    color: var(--muted);
    font-size: 0.95rem;
  }

  /* Setup Section */
  .setup-section {
    padding: 1.5rem 2rem;
    border-bottom: 1px solid var(--border);
  }

  .setup-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
  }

  .control-label, .field-label {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--muted);
    margin-bottom: 0.5rem;
  }

  .money-input-wrap {
    display: flex;
    align-items: center;
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
  }

  .money-input-wrap.small {
    max-width: 140px;
  }

  .money-prefix {
    padding: 0.75rem;
    background: var(--bg);
    color: var(--muted);
    font-weight: 600;
    border-right: 1px solid var(--border);
  }

  .money-input {
    flex: 1;
    padding: 0.75rem;
    border: none;
    font-family: Oswald, sans-serif;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--ink);
    width: 100%;
    min-width: 0;
  }

  .money-input:focus {
    outline: none;
  }

  .date-input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--border);
    border-radius: 8px;
    font-family: inherit;
    font-size: 1rem;
    color: var(--ink);
    box-sizing: border-box;
  }

  /* Overview Section */
  .overview-section {
    padding: 2rem;
    background: var(--bg);
    border-bottom: 1px solid var(--border);
  }

  .budget-bar-wrap {
    margin-bottom: 1.5rem;
  }

  .budget-bar {
    height: 24px;
    background: #e0ddd4;
    border-radius: 12px;
    position: relative;
    overflow: hidden;
  }

  .budget-fill {
    height: 100%;
    border-radius: 12px;
    transition: width 0.5s ease;
  }

  .budget-fill.good { background: linear-gradient(90deg, var(--alpine), var(--pine)); }
  .budget-fill.caution { background: linear-gradient(90deg, var(--terra), #f59e0b); }
  .budget-fill.over { background: linear-gradient(90deg, #ef4444, #dc2626); }

  .budget-marker {
    position: absolute;
    top: -4px;
    width: 4px;
    height: 32px;
    background: var(--ink);
    border-radius: 2px;
    transform: translateX(-50%);
    transition: left 0.5s ease;
  }

  .budget-labels {
    display: flex;
    justify-content: space-between;
    margin-top: 0.5rem;
    font-size: 0.85rem;
    color: var(--muted);
  }

  .stats-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
  }

  .stat-card {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background: #fff;
    border-radius: 10px;
    border: 1px solid rgba(0,0,0,0.05);
  }

  .stat-card.status-card.good { border-color: var(--alpine); background: rgba(166, 181, 137, 0.05); }
  .stat-card.status-card.caution { border-color: var(--terra); background: rgba(217, 119, 6, 0.05); }
  .stat-card.status-card.over { border-color: #ef4444; background: rgba(239, 68, 68, 0.05); }

  .stat-icon { font-size: 1.25rem; }

  .stat-content {
    display: flex;
    flex-direction: column;
  }

  .stat-value {
    font-family: Oswald, sans-serif;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--ink);
    line-height: 1.1;
  }

  .stat-label {
    font-size: 0.7rem;
    color: var(--muted);
  }

  /* Section Title */
  .section-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--pine);
    margin: 0 0 1.25rem;
  }

  .title-blaze {
    width: 8px;
    height: 16px;
    background: var(--marker);
    border-radius: 2px;
  }

  .expense-count {
    margin-left: auto;
    font-size: 0.75rem;
    font-weight: 400;
    color: var(--muted);
    text-transform: none;
    letter-spacing: normal;
  }

  /* Add Section */
  .add-section {
    padding: 2rem;
    border-bottom: 1px solid var(--border);
  }

  .add-form {
    background: #fff;
    border: 1px solid var(--border);
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

  .amount-field {
    flex: 0 0 140px;
  }

  .category-select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--border);
    border-radius: 8px;
    font-family: inherit;
    font-size: 0.95rem;
    color: var(--ink);
    background: #fff;
    cursor: pointer;
  }

  .note-input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--border);
    border-radius: 8px;
    font-family: inherit;
    font-size: 0.95rem;
    color: var(--ink);
    box-sizing: border-box;
  }

  .add-btn {
    padding: 0.75rem 1.5rem;
    background: var(--pine);
    color: #fff;
    border: none;
    border-radius: 8px;
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
    align-self: flex-end;
  }

  .add-btn:hover:not(:disabled) {
    background: var(--ink);
    transform: translateY(-2px);
  }

  .add-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Recent Expenses */
  .recent-section {
    padding: 2rem;
    background: var(--bg);
    border-bottom: 1px solid var(--border);
  }

  .expense-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .expense-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: #fff;
    border-radius: 8px;
    border: 1px solid rgba(0,0,0,0.05);
  }

  .expense-icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
    flex-shrink: 0;
  }

  .expense-info {
    flex: 1;
    min-width: 0;
  }

  .expense-cat {
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

  .expense-meta {
    text-align: right;
    flex-shrink: 0;
  }

  .expense-amount {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 600;
    color: var(--ink);
  }

  .expense-date {
    display: block;
    font-size: 0.7rem;
    color: var(--muted);
  }

  .delete-btn {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    border: none;
    background: transparent;
    color: var(--muted);
    font-size: 1.25rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .delete-btn:hover {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
  }

  /* Category Breakdown */
  .breakdown-section {
    padding: 2rem;
    border-bottom: 1px solid var(--border);
  }

  .category-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .category-row {
    display: grid;
    grid-template-columns: 1fr 120px 50px;
    gap: 1rem;
    align-items: center;
  }

  .cat-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .cat-icon {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
  }

  .cat-name {
    font-size: 0.9rem;
    color: var(--ink);
    flex: 1;
  }

  .cat-amount {
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 600;
    color: var(--ink);
  }

  .cat-bar-wrap {
    height: 8px;
    background: #e0ddd4;
    border-radius: 4px;
    overflow: hidden;
  }

  .cat-bar {
    height: 100%;
    border-radius: 4px;
    transition: width 0.5s ease;
  }

  .cat-percent {
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    color: var(--muted);
    text-align: right;
  }

  /* Context Section */
  .context-section {
    padding: 2rem;
    border-bottom: 1px solid var(--border);
  }

  .context-card {
    background: linear-gradient(135deg, rgba(166, 181, 137, 0.1), rgba(166, 181, 137, 0.02));
    border: 1px solid var(--alpine);
    border-radius: 12px;
    padding: 1.5rem;
  }

  .context-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 1.5rem;
  }

  .context-label {
    font-family: Oswald, sans-serif;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--muted);
  }

  .context-value {
    font-family: Oswald, sans-serif;
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--pine);
  }

  .range-viz {
    margin-bottom: 1.5rem;
  }

  .range-bar {
    height: 12px;
    background: linear-gradient(90deg, var(--alpine), var(--pine), var(--terra));
    border-radius: 6px;
    position: relative;
    margin-bottom: 0.75rem;
  }

  .range-fill {
    position: absolute;
    inset: 0;
    background: transparent;
  }

  .range-marker {
    position: absolute;
    top: -6px;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .range-marker::before {
    content: '';
    width: 4px;
    height: 24px;
    background: var(--ink);
    border-radius: 2px;
  }

  .marker-label {
    font-family: Oswald, sans-serif;
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--ink);
    margin-top: 4px;
    background: #fff;
    padding: 0.1rem 0.4rem;
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .range-labels {
    display: flex;
    justify-content: space-between;
  }

  .range-point {
    text-align: left;
  }

  .range-point.center {
    text-align: center;
  }

  .range-point:last-child {
    text-align: right;
  }

  .point-value {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--ink);
  }

  .point-label {
    font-size: 0.7rem;
    color: var(--muted);
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
    font-size: 0.85rem;
    color: var(--muted);
  }

  .tip-icon { font-size: 1rem; }

  /* Data Section */
  .data-section {
    padding: 1.5rem 2rem;
    text-align: center;
  }

  .clear-btn {
    padding: 0.5rem 1rem;
    background: transparent;
    border: 1px solid var(--border);
    border-radius: 6px;
    font-size: 0.85rem;
    color: var(--muted);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .clear-btn:hover {
    border-color: #ef4444;
    color: #ef4444;
  }

  /* Responsive */
  @media (max-width: 640px) {
    .budget-calc {
      overflow-x: hidden;
      border-radius: 12px;
    }
    .calc-header { padding: 1.5rem 1rem; }
    .header-title { font-size: 1.5rem; }
    .setup-section { padding: 1.5rem 1rem; }
    .setup-grid { grid-template-columns: 1fr; gap: 1rem; }
    .overview-section { padding: 1.5rem 1rem; }
    .stats-row { grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
    .stat-card { padding: 1rem; }
    .stat-num { font-size: 1.75rem; }
    .add-section { padding: 1.5rem 1rem; }
    .form-row { flex-direction: column; gap: 0.75rem; }
    .amount-field { flex: 1; width: 100%; }
    .money-input-wrap.small { max-width: none; width: 100%; }
    .add-btn { width: 100%; }
    .recent-section { padding: 1.5rem 1rem; }
    .expense-item { padding: 0.75rem 1rem; gap: 0.75rem; }
    .breakdown-section { padding: 1.5rem 1rem; }
    .category-row { grid-template-columns: 1fr 70px 35px; gap: 0.5rem; padding: 0.75rem 1rem; }
    .cat-name { font-size: 0.85rem; }
    .cat-amount { font-size: 0.9rem; }
    .context-section { padding: 1.5rem 1rem; }
    .context-card { padding: 1rem; }
    .ctx-val { font-size: 1.25rem; }
    .comparison-bar { height: 10px; }
  }

  @media (max-width: 380px) {
    .stats-row { grid-template-columns: 1fr; }
    .category-row { grid-template-columns: 1fr 60px 30px; }
  }
</style>
