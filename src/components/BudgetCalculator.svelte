<script>
  import { onMount } from "svelte";
  import { fade, slide, scale } from "svelte/transition";

  let { trailContext = {} } = $props();

  const categories = [
    { id: "food", name: "Food & Resupply", icon: "🛒", color: "#22c55e" },
    { id: "lodging", name: "Hotels & Hostels", icon: "🏨", color: "#3b82f6" },
    { id: "gear", name: "Gear & Repairs", icon: "🎒", color: "#f59e0b" },
    { id: "services", name: "Town Services", icon: "🧺", color: "#a855f7" },
    {
      id: "transport",
      name: "Shuttles & Hitching",
      icon: "🚗",
      color: "#ef4444",
    },
    { id: "entertainment", name: "Town Fun", icon: "🍺", color: "#ec4899" },
    { id: "other", name: "Other / Bills", icon: "📦", color: "#6b7280" },
  ];

  // Helper: Month Key (YYYY-MM)
  const getMonthKey = (date = new Date()) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  };

  let mounted = $state(false);
  let currentMonthKey = $state(getMonthKey()); // YYYY-MM

  // Data structure: { "2026-03": { food: 1200, ... } }
  let monthlyBudgets = $state({});
  let expenses = $state([]); // Flat array, filtered by monthKey reactively

  let showEnvelopeSettings = $state(false);

  // Form State
  let newAmount = $state("");
  let newCategory = $state("food");
  let newNote = $state("");
  let newDate = $state(new Date().toISOString().split("T")[0]);

  onMount(() => {
    mounted = true;
    const saved = localStorage.getItem("at-budget-v3");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        monthlyBudgets = data.monthlyBudgets || {};
        expenses = data.expenses || [];
        // Keep currentMonthKey as today unless it should be something else
      } catch (e) {
        console.error("Failed to load budget data:", e);
      }
    } else {
      // Migrate from v2
      const legacy = localStorage.getItem("at-budget-v2");
      if (legacy) {
        try {
          const data = JSON.parse(legacy);
          expenses = data.expenses || [];
          // Initialize current month budget from legacy v2 global budget
          if (data.envelopes) {
            monthlyBudgets[currentMonthKey] = data.envelopes;
          }
        } catch (e) {}
      }
    }

    // Ensure current month has a budget template
    ensureBudgetTemplate(currentMonthKey);
  });

  function ensureBudgetTemplate(key) {
    if (!monthlyBudgets[key]) {
      // Look for previous month to copy from
      const keys = Object.keys(monthlyBudgets).sort();
      const lastKey = keys[keys.length - 1];

      if (lastKey) {
        monthlyBudgets[key] = { ...monthlyBudgets[lastKey] };
      } else {
        // Default Ramsey-style starter budget
        monthlyBudgets[key] = {
          food: 1200,
          lodging: 800,
          gear: 200,
          services: 150,
          transport: 150,
          entertainment: 300,
          other: 200,
        };
      }
    }
  }

  function saveData() {
    if (!mounted) return;
    const data = { monthlyBudgets, expenses };
    localStorage.setItem("at-budget-v3", JSON.stringify(data));
  }

  function changeMonth(delta) {
    const [year, month] = currentMonthKey.split("-").map(Number);
    const date = new Date(year, month - 1 + delta, 1);
    const newKey = getMonthKey(date);
    currentMonthKey = newKey;
    ensureBudgetTemplate(newKey);
    saveData();
  }

  // Reactive calculations
  let currentEnvelopes = $derived(monthlyBudgets[currentMonthKey] || {});
  let totalMonthlyBudget = $derived(
    Object.values(currentEnvelopes).reduce((a, b) => a + b, 0),
  );

  let monthlyExpenses = $derived(
    expenses.filter((e) => e.date.startsWith(currentMonthKey)),
  );
  let totalSpentInMonth = $derived(
    monthlyExpenses.reduce((sum, e) => sum + e.amount, 0),
  );

  let totalAllTimeSpent = $derived(
    expenses.reduce((sum, e) => sum + e.amount, 0),
  );

  let categoryStats = $derived(
    categories.map((cat) => {
      const spent = monthlyExpenses
        .filter((e) => e.category === cat.id)
        .reduce((sum, e) => sum + (e.amount || 0), 0);
      const budget = currentEnvelopes[cat.id] || 0;
      const remaining = budget - spent;
      const percent = budget > 0 ? (spent / budget) * 100 : 0;
      return { ...cat, spent, budget, remaining, percent };
    }),
  );

  let displayedTransactions = $derived(
    [...monthlyExpenses].sort((a, b) => new Date(b.date) - new Date(a.date)),
  );

  function addExpense() {
    const amount = parseFloat(newAmount);
    if (isNaN(amount) || amount <= 0) return;

    // Use currentMonthKey for default date if it doesn't match
    let entryDate = newDate;
    if (!entryDate.startsWith(currentMonthKey)) {
      // If they enter a date for a different month while looking at this month,
      // it will "disappear" from current view but be in history
    }

    const expense = {
      id: crypto.randomUUID(),
      amount,
      category: newCategory,
      note: newNote.trim(),
      date: entryDate,
    };

    expenses = [expense, ...expenses];
    newAmount = "";
    newNote = "";
    saveData();
  }

  function deleteExpense(id) {
    expenses = expenses.filter((e) => e.id !== id);
    saveData();
  }

  function formatMoney(amount) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  }

  function getMonthDisplayName(key) {
    const [year, month] = key.split("-").map(Number);
    return new Date(year, month - 1).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  }

  // Pie Chart Calculations
  let pieData = $derived(() => {
    const data = categoryStats.filter((c) => c.spent > 0);
    if (data.length === 0) return [];

    let cumulativePercent = 0;
    return data.map((cat) => {
      const p = cat.spent / totalSpentInMonth;
      const startX = Math.cos(2 * Math.PI * cumulativePercent);
      const startY = Math.sin(2 * Math.PI * cumulativePercent);
      cumulativePercent += p;
      const endX = Math.cos(2 * Math.PI * cumulativePercent);
      const endY = Math.sin(2 * Math.PI * cumulativePercent);

      const largeArcFlag = p > 0.5 ? 1 : 0;
      const pathData = [
        `M ${startX} ${startY}`,
        `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
        `L 0 0`,
      ].join(" ");

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
      <span class="icon">💰</span>
      <div>
        <h2>Trail Envelopes</h2>
        <p>Every dollar has a name, every mile.</p>
      </div>
    </div>
    <div class="month-selector">
      <button onclick={() => changeMonth(-1)} class="month-nav">◀</button>
      <span class="current-month">{getMonthDisplayName(currentMonthKey)}</span>
      <button onclick={() => changeMonth(1)} class="month-nav">▶</button>
    </div>
  </header>

  <div class="stats-bar">
    <div class="stat-main">
      <span class="stat-label"
        >Spent in {new Date(currentMonthKey + "-01").toLocaleDateString(
          "en-US",
          { month: "short" },
        )}</span
      >
      <span class="stat-value">{formatMoney(totalSpentInMonth)}</span>
    </div>
    <div class="stat-sub">
      <div class="sub-item">
        <span class="sub-label">Plan</span>
        <span class="sub-value">{formatMoney(totalMonthlyBudget)}</span>
      </div>
      <div class="sub-item">
        <span class="sub-label">Remaining</span>
        <span
          class="sub-value"
          class:warn={totalMonthlyBudget - totalSpentInMonth < 0}
        >
          {formatMoney(Math.max(0, totalMonthlyBudget - totalSpentInMonth))}
        </span>
      </div>
    </div>
  </div>

  <div class="layout-grid">
    <!-- LEFT COLUMN: Input & Chart -->
    <div class="actions-panel">
      <!-- Add Expense Form -->
      <section class="card add-expense">
        <h3>New Transaction</h3>
        <div class="form-grid">
          <div class="input-group">
            <label for="amount">Amount</label>
            <div class="currency-input">
              <span>$</span>
              <input
                type="number"
                id="amount"
                bind:value={newAmount}
                placeholder="0.00"
                step="0.01"
              />
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
            <input
              type="text"
              id="note"
              bind:value={newNote}
              placeholder="Resupply, Hostel, Shuttle..."
            />
          </div>
          <div class="input-group">
            <label for="date">Date</label>
            <input type="date" id="date" bind:value={newDate} />
          </div>
          <button
            class="btn-primary"
            onclick={addExpense}
            disabled={!newAmount}
          >
            Post to Envelope
          </button>
        </div>
      </section>

      <!-- Pie Chart Section -->
      <section class="card spending-viz">
        <h3>Monthly Breakdown</h3>
        {#if totalSpentInMonth > 0}
          <div class="chart-container">
            <div class="pie-wrapper">
              <svg viewBox="-1.1 -1.1 2.2 2.2" class="pie-chart">
                {#each pieData() as slice}
                  <path
                    d={slice.pathData}
                    fill={slice.color}
                    stroke="white"
                    stroke-width="0.02"
                  >
                    <title>{slice.name}: {formatMoney(slice.spent)}</title>
                  </path>
                {/each}
                <circle r="0.65" fill="white" />
                <!-- Donut hole -->
              </svg>
              <div class="pie-center">
                <span class="pct-total">100%</span>
              </div>
            </div>
            <div class="chart-labels">
              {#each categoryStats
                .filter((c) => c.spent > 0)
                .sort((a, b) => b.spent - a.spent) as cat}
                <div class="chart-label-item">
                  <span class="dot" style="background: {cat.color}"></span>
                  <span class="name">{cat.name}</span>
                  <span class="val"
                    >{((cat.spent / totalSpentInMonth) * 100).toFixed(0)}%</span
                  >
                </div>
              {/each}
              <div class="all-time">
                Total Trail Spending: {formatMoney(totalAllTimeSpent)}
              </div>
            </div>
          </div>
        {:else}
          <div class="empty-state mini">
            <p>No transactions yet for this month.</p>
          </div>
        {/if}
      </section>
    </div>

    <!-- RIGHT COLUMN: Envelopes & History -->
    <div class="data-panel">
      <!-- Envelope Management -->
      <section class="card envelope-list">
        <div class="section-header">
          <h3>Active Envelopes</h3>
          <button
            class="btn-refine"
            onclick={() => (showEnvelopeSettings = !showEnvelopeSettings)}
          >
            {showEnvelopeSettings ? "Lock Budget" : "Adjust Envelopes"}
          </button>
        </div>

        <div class="envelopes-stack">
          {#each categoryStats as cat}
            <div class="envelope-row" class:is-over={cat.remaining < 0}>
              <div class="row-top">
                <div class="env-title">
                  <span class="icon">{cat.icon}</span>
                  <span class="name">{cat.name}</span>
                </div>
                {#if showEnvelopeSettings}
                  <div class="inline-edit">
                    <span>$</span>
                    <input
                      type="number"
                      bind:value={monthlyBudgets[currentMonthKey][cat.id]}
                      step="50"
                      onchange={saveData}
                    />
                  </div>
                {:else}
                  <div class="env-values">
                    <span class="spent">{formatMoney(cat.spent)}</span>
                    <span class="slash">/</span>
                    <span class="budget">{formatMoney(cat.budget)}</span>
                  </div>
                {/if}
              </div>

              <div class="row-middle">
                <div class="progress-track">
                  <div
                    class="progress-fill"
                    style="width: {Math.min(
                      100,
                      cat.percent,
                    )}%; background: {cat.color}"
                  ></div>
                </div>
              </div>

              <div class="row-bottom">
                {#if cat.remaining < 0}
                  <span class="rem-label alert"
                    >Over by {formatMoney(Math.abs(cat.remaining))}</span
                  >
                {:else}
                  <span class="rem-label"
                    >{formatMoney(cat.remaining)} left</span
                  >
                {/if}
                <span class="pct-label">{cat.percent.toFixed(0)}% used</span>
              </div>
            </div>
          {/each}
        </div>
      </section>

      <!-- History -->
      <section class="card transaction-history">
        <h3>
          {new Date(currentMonthKey + "-01").toLocaleDateString("en-US", {
            month: "long",
          })} Activity
        </h3>
        {#if displayedTransactions.length > 0}
          <div class="ticker">
            {#each displayedTransactions as exp (exp.id)}
              {@const cat = categories.find((c) => c.id === exp.category)}
              <div class="ticker-item" transition:slide>
                <div class="t-date">
                  <span class="d-day">{new Date(exp.date).getDate()}</span>
                  <span class="d-mon"
                    >{new Date(exp.date).toLocaleDateString("en-US", {
                      month: "short",
                    })}</span
                  >
                </div>
                <div class="t-icon" style="background: {cat?.color || '#eee'}">
                  {cat?.icon || "💰"}
                </div>
                <div class="t-details">
                  <span class="t-note">{exp.note || cat?.name}</span>
                  <span class="t-cat">{cat?.name}</span>
                </div>
                <div class="t-amount">{formatMoney(exp.amount)}</div>
                <button class="t-del" onclick={() => deleteExpense(exp.id)}
                  >×</button
                >
              </div>
            {/each}
          </div>
        {:else}
          <div class="empty-state">
            <p>Your ledger for this month is quiet.</p>
          </div>
        {/if}
      </section>
    </div>
  </div>
</div>

<style>
  /* Hogg Country Design System Tokens */
  .trail-budget {
    --pine-green: #2d3a28;
    --alpine-green: #3d4a38;
    --ink: #1a1a1a;
    --marker-gold: #d4a373;
    --cream: #fefae0;
    --muted-green: #a3b18a;
    --alert-red: #8b0000;

    font-family: "Inter", system-ui, sans-serif;
    color: var(--ink);
    background: #fdfdf5;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    opacity: 0;
    transition: opacity 0.8s;
    border: 1px solid #e0e0d0;
  }
  .trail-budget.mounted {
    opacity: 1;
  }

  /* Typography Overrides */
  h2,
  h3,
  .current-month,
  .stat-value,
  .btn-primary,
  .env-title .name {
    font-family: "Oswald", sans-serif;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* Header */
  .budget-header {
    background: var(--pine-green);
    color: white;
    padding: 1.25rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 4px solid var(--marker-gold);
  }

  .header-main {
    display: flex;
    gap: 1rem;
    align-items: center;
  }
  .header-main .icon {
    font-size: 2.2rem;
  }
  .header-main h2 {
    margin: 0;
    font-size: 1.4rem;
  }
  .header-main p {
    margin: 0;
    opacity: 0.7;
    font-size: 0.8rem;
    font-style: italic;
  }

  .month-selector {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    background: rgba(255, 255, 255, 0.1);
    padding: 0.5rem 1rem;
    border-radius: 30px;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  .current-month {
    min-width: 140px;
    text-align: center;
    font-size: 1rem;
  }
  .month-nav {
    background: none;
    border: none;
    color: var(--marker-gold);
    cursor: pointer;
    font-size: 1.2rem;
    transition: transform 0.2s;
    padding: 0 5px;
  }
  .month-nav:hover {
    transform: scale(1.2);
  }

  /* Stats Bar */
  .stats-bar {
    background: white;
    padding: 1.5rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid #f0f0e0;
  }
  .stat-main {
    display: flex;
    flex-direction: column;
  }
  .stat-label {
    font-size: 0.75rem;
    color: #666;
    text-transform: uppercase;
    font-weight: 700;
  }
  .stat-value {
    font-size: 2.5rem;
    color: var(--pine-green);
    line-height: 1;
  }

  .stat-sub {
    display: flex;
    gap: 3rem;
  }
  .sub-item {
    display: flex;
    flex-direction: column;
    text-align: right;
  }
  .sub-label {
    font-size: 0.65rem;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .sub-value {
    font-family: "Oswald", sans-serif;
    font-size: 1.2rem;
    color: #444;
  }
  .sub-value.warn {
    color: var(--alert-red);
  }

  /* Layout */
  .layout-grid {
    display: grid;
    grid-template-columns: 380px 1fr;
    gap: 2rem;
    padding: 2rem;
  }
  @media (max-width: 1000px) {
    .layout-grid {
      grid-template-columns: 1fr;
    }
  }

  /* Cards */
  .card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
    margin-bottom: 2rem;
    padding: 1.5rem;
    border: 1px solid #f0f0e0;
  }
  h3 {
    margin: 0 0 1.5rem;
    font-size: 1rem;
    color: var(--pine-green);
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  h3::after {
    content: "";
    flex: 1;
    height: 1px;
    background: #eee;
  }

  /* Forms */
  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.25rem;
  }
  .input-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .full {
    grid-column: span 2;
  }
  label {
    font-size: 0.7rem;
    font-weight: 800;
    color: #888;
    text-transform: uppercase;
  }
  input,
  select {
    padding: 0.8rem;
    border: 2px solid #f0f0e0;
    border-radius: 8px;
    font-size: 0.95rem;
    transition: border-color 0.2s;
    background: #fafaf5;
  }
  input:focus,
  select:focus {
    border-color: var(--muted-green);
    outline: none;
  }

  .currency-input {
    position: relative;
    display: flex;
    align-items: center;
  }
  .currency-input span {
    position: absolute;
    left: 0.8rem;
    font-weight: bold;
    color: #aaa;
  }
  .currency-input input {
    padding-left: 1.8rem;
    width: 100%;
    font-weight: bold;
  }

  .btn-primary {
    grid-column: span 2;
    background: var(--pine-green);
    color: white;
    border: none;
    padding: 1.1rem;
    border-radius: 8px;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s;
    margin-top: 0.5rem;
    box-shadow: 0 4px 0 #1a2318;
  }
  .btn-primary:hover {
    background: var(--alpine-green);
    transform: translateY(-1px);
  }
  .btn-primary:active {
    transform: translateY(2px);
    box-shadow: none;
  }
  .btn-primary:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    box-shadow: none;
  }

  /* Visualization */
  .chart-container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    align-items: center;
  }
  .pie-wrapper {
    position: relative;
    width: 180px;
    height: 180px;
  }
  .pie-chart {
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
  }
  .pie-center {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .pct-total {
    font-family: "Oswald", sans-serif;
    font-size: 1.2rem;
    color: #888;
  }

  .chart-labels {
    width: 100%;
    display: grid;
    gap: 0.6rem;
  }
  .chart-label-item {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    font-size: 0.8rem;
    font-weight: 500;
  }
  .chart-label-item .dot {
    width: 12px;
    height: 12px;
    border-radius: 3px;
  }
  .chart-label-item .val {
    margin-left: auto;
    font-family: "Oswald", sans-serif;
    font-size: 0.9rem;
  }
  .all-time {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px dashed #eee;
    font-size: 0.7rem;
    color: #aaa;
    text-align: center;
    font-style: italic;
  }

  /* Envelopes Stack */
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.5rem;
  }
  .btn-refine {
    background: #f0f0e0;
    border: none;
    padding: 0.4rem 0.8rem;
    border-radius: 20px;
    font-size: 0.7rem;
    font-weight: 800;
    text-transform: uppercase;
    color: #666;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn-refine:hover {
    background: var(--muted-green);
    color: white;
  }

  .envelopes-stack {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }
  .envelope-row {
    padding: 1.25rem;
    border-radius: 12px;
    background: #fafaf5;
    border-left: 6px solid var(--muted-green);
    transition:
      transform 0.2s,
      box-shadow 0.2s;
  }
  .envelope-row:hover {
    transform: translateX(5px);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.04);
  }
  .envelope-row.is-over {
    border-left-color: var(--alert-red);
    background: #fff5f5;
  }

  .row-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }
  .env-title {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }
  .env-title .icon {
    font-size: 1.2rem;
  }
  .env-title .name {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--pine-green);
  }

  .env-values {
    font-size: 0.95rem;
    font-weight: 700;
  }
  .env-values .slash {
    color: #ccc;
    margin: 0 0.2rem;
  }
  .env-values .budget {
    color: #888;
    font-family: "Inter", sans-serif;
    font-weight: 400;
    font-size: 0.8rem;
  }

  .inline-edit {
    display: flex;
    align-items: center;
    gap: 0.2rem;
  }
  .inline-edit input {
    padding: 0.2rem 0.5rem;
    width: 70px;
    font-size: 0.85rem;
    border-width: 1px;
  }

  .progress-track {
    height: 10px;
    background: #eee;
    border-radius: 10px;
    overflow: hidden;
    margin: 1rem 0;
  }
  .progress-fill {
    height: 100%;
    border-radius: 10px;
    transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .row-bottom {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
  }
  .rem-label {
    color: #666;
  }
  .rem-label.alert {
    color: var(--alert-red);
  }
  .pct-label {
    color: #aaa;
  }

  /* Ticker (History) */
  .ticker {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .ticker-item {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    padding: 1rem;
    background: white;
    border-radius: 10px;
    border: 1px solid #f0f0e0;
    transition: all 0.2s;
  }
  .ticker-item:hover {
    border-color: var(--muted-green);
    background: #fafaf5;
  }

  .t-date {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 40px;
    color: #888;
    border-right: 1px solid #eee;
    padding-right: 1rem;
  }
  .d-day {
    font-family: "Oswald", sans-serif;
    font-size: 1.2rem;
    line-height: 1;
    color: var(--pine-green);
  }
  .d-mon {
    font-size: 0.6rem;
    text-transform: uppercase;
    font-weight: 800;
  }

  .t-icon {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    border: 2px solid white;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  }
  .t-details {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .t-note {
    font-weight: 700;
    font-size: 0.95rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .t-cat {
    font-size: 0.7rem;
    color: #999;
    text-transform: uppercase;
    font-weight: 800;
    letter-spacing: 0.5px;
  }

  .t-amount {
    font-family: "Oswald", sans-serif;
    font-weight: bold;
    font-size: 1.1rem;
    color: var(--pine-green);
  }
  .t-del {
    background: none;
    border: none;
    color: #eee;
    font-size: 1.2rem;
    cursor: pointer;
    padding: 0.5rem;
  }
  .t-del:hover {
    color: var(--alert-red);
  }

  .empty-state {
    padding: 3rem;
    text-align: center;
    color: #aaa;
    font-style: italic;
    background: #fafaf5;
    border: 2px dashed #e0e0d0;
    border-radius: 12px;
  }
  .empty-state.mini {
    padding: 1.5rem;
    font-size: 0.8rem;
  }
</style>
