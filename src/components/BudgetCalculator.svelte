<script>
  import { onMount } from "svelte";
  import { fade, slide, scale } from "svelte/transition";

  let { trailContext = {} } = $props();

  const DEFAULT_CATEGORIES = [
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
    { id: "entertainment", name: "Misc / Fun", icon: "🎉", color: "#ec4899" },
    { id: "other", name: "Other / Bills", icon: "📦", color: "#6b7280" },
  ];

  // Colors for new categories
  const PALETTE = [
    "#22c55e",
    "#3b82f6",
    "#f59e0b",
    "#a855f7",
    "#ef4444",
    "#ec4899",
    "#6b7280",
    "#06b6d4",
    "#8b5cf6",
    "#f97316",
  ];

  // Helper: Month Key (YYYY-MM)
  const getMonthKey = (date = new Date()) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  };

  let mounted = $state(false);
  let currentMonthKey = $state(getMonthKey());

  // Data structure: { "2026-03": { food: 1200, ... } }
  let monthlyBudgets = $state({});
  let expenses = $state([]);
  let uCategories = $state([...DEFAULT_CATEGORIES]); // Dynamic categories

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
        if (data.uCategories) uCategories = data.uCategories;
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
          if (data.envelopes) {
            monthlyBudgets[currentMonthKey] = data.envelopes;
          }
        } catch (e) {}
      }
    }

    ensureBudgetTemplate(currentMonthKey);
    if (uCategories.length > 0) newCategory = uCategories[0].id;
  });

  function ensureBudgetTemplate(key) {
    if (!monthlyBudgets[key]) {
      const keys = Object.keys(monthlyBudgets).sort();
      const lastKey = keys[keys.length - 1];

      if (lastKey) {
        monthlyBudgets[key] = { ...monthlyBudgets[lastKey] };
      } else {
        // Build initial budget from current categories
        const initial = {};
        uCategories.forEach((c) => (initial[c.id] = 100));
        monthlyBudgets[key] = initial;
      }
    }
  }

  function saveData() {
    if (!mounted) return;
    const data = { monthlyBudgets, expenses, uCategories };
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

  // Category CRUD
  function addCategory() {
    const id = "cat_" + Date.now();
    const newCat = {
      id,
      name: "New Category",
      icon: "🏷️",
      color: PALETTE[uCategories.length % PALETTE.length],
    };
    uCategories = [...uCategories, newCat];
    // Add to current month budget
    if (!monthlyBudgets[currentMonthKey]) monthlyBudgets[currentMonthKey] = {};
    monthlyBudgets[currentMonthKey][id] = 100;
    saveData();
  }

  function removeCategory(id) {
    const hasExpenses = expenses.some((e) => e.category === id);
    if (hasExpenses) {
      if (
        !confirm(
          "This category has expenses. Deleting it will keep the expenses but they won't have a category icon. Proceed?",
        )
      )
        return;
    }
    uCategories = uCategories.filter((c) => c.id !== id);
    // Remove from budgets
    Object.keys(monthlyBudgets).forEach((key) => {
      delete monthlyBudgets[key][id];
    });
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
    uCategories.map((cat) => {
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

    const expense = {
      id: crypto.randomUUID(),
      amount,
      category: newCategory,
      note: newNote.trim(),
      date: newDate,
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
    if (!key) return "";
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
        >Spent in {currentMonthKey
          ? getMonthDisplayName(currentMonthKey).split(" ")[0]
          : ""}</span
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
              {#each uCategories as cat}
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
          <div class="input-group full">
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
                {#if showEnvelopeSettings}
                  <div class="env-edit-mode">
                    <input
                      type="text"
                      bind:value={cat.icon}
                      class="icon-edit"
                      placeholder="Icon"
                    />
                    <input
                      type="text"
                      bind:value={cat.name}
                      class="name-edit"
                      placeholder="Name"
                    />
                    <div class="budget-wrap">
                      <span>$</span>
                      <input
                        type="number"
                        bind:value={monthlyBudgets[currentMonthKey][cat.id]}
                        step="50"
                        onchange={saveData}
                      />
                    </div>
                    <button
                      class="btn-cat-del"
                      onclick={() => removeCategory(cat.id)}
                      title="Delete Category">×</button
                    >
                  </div>
                {:else}
                  <div class="env-title">
                    <span class="icon">{cat.icon}</span>
                    <span class="name">{cat.name}</span>
                  </div>
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

          {#if showEnvelopeSettings}
            <button class="btn-add-cat" onclick={addCategory} transition:fade>
              + Add Monthly Envelope
            </button>
          {/if}
        </div>
      </section>

      <!-- History -->
      <section class="card transaction-history">
        <h3>
          {currentMonthKey
            ? new Date(currentMonthKey + "-01").toLocaleDateString("en-US", {
                month: "long",
              })
            : ""} Activity
        </h3>
        {#if displayedTransactions.length > 0}
          <div class="ledger-container">
            <div class="ticker">
              {#each displayedTransactions as exp (exp.id)}
                {@const cat = uCategories.find((c) => c.id === exp.category)}
                <!-- Parse date ensuring we treat it as local for display if provided as YYYY-MM-DD -->
                {@const dateObj = new Date(
                  exp.date.includes("T") ? exp.date : exp.date + "T12:00:00",
                )}
                <div class="ticker-item" transition:slide>
                  <div class="t-date">
                    <span class="d-day">{dateObj.getDate()}</span>
                    <span class="d-mon"
                      >{dateObj.toLocaleDateString("en-US", {
                        month: "short",
                      })}</span
                    >
                  </div>
                  <div
                    class="t-icon"
                    style="background: {cat?.color || '#eee'}"
                  >
                    {cat?.icon || "💰"}
                  </div>
                  <div class="t-details">
                    <span class="t-note" title={exp.note || cat?.name}
                      >{exp.note || cat?.name}</span
                    >
                    <span class="t-cat">{cat?.name || "Uncategorized"}</span>
                  </div>
                  <div class="t-amount">{formatMoney(exp.amount)}</div>
                  <button class="t-del" onclick={() => deleteExpense(exp.id)}
                    >×</button
                  >
                </div>
              {/each}
            </div>
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
    width: 100%;
    max-width: 100%;
    margin: 0 auto;
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
  .env-title .name,
  .btn-add-cat {
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
    flex-wrap: wrap;
    gap: 1rem;
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
    gap: 1rem;
    background: rgba(255, 255, 255, 0.1);
    padding: 0.5rem 1rem;
    border-radius: 30px;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  .current-month {
    min-width: 120px;
    text-align: center;
    font-size: 0.9rem;
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
    flex-wrap: wrap;
    gap: 1.5rem;
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
    grid-template-columns: 350px 1fr;
    gap: 2rem;
    padding: 2rem;
  }
  @media (max-width: 900px) {
    .layout-grid {
      grid-template-columns: 1fr;
    }
    .stats-bar {
      justify-content: center;
      text-align: center;
    }
    .stat-sub {
      width: 100%;
      justify-content: space-around;
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
    gap: 1rem;
  }
  .input-group {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  .full {
    grid-column: span 2;
  }
  label {
    font-size: 0.65rem;
    font-weight: 800;
    color: #888;
    text-transform: uppercase;
  }
  input,
  select {
    padding: 0.7rem;
    border: 2px solid #f0f0e0;
    border-radius: 8px;
    font-size: 0.9rem;
    transition: border-color 0.2s;
    background: #fafaf5;
    width: 100%;
    box-sizing: border-box;
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
    width: 100%;
  }
  .currency-input span {
    position: absolute;
    left: 0.7rem;
    font-weight: bold;
    color: #aaa;
  }
  .currency-input input {
    padding-left: 1.6rem;
  }

  .btn-primary {
    grid-column: span 2;
    background: var(--pine-green);
    color: white;
    border: none;
    padding: 1rem;
    border-radius: 8px;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.2s;
    margin-top: 0.5rem;
    box-shadow: 0 4px 0 #1a2318;
  }
  .btn-primary:active {
    transform: translateY(2px);
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
    width: 160px;
    height: 160px;
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
    font-size: 1.1rem;
    color: #888;
  }

  .chart-labels {
    width: 100%;
    display: grid;
    gap: 0.5rem;
  }
  .chart-label-item {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 0.75rem;
    font-weight: 500;
  }
  .chart-label-item .dot {
    width: 10px;
    height: 10px;
    border-radius: 2px;
  }
  .chart-label-item .val {
    margin-left: auto;
    font-family: "Oswald", sans-serif;
    font-size: 0.85rem;
  }
  .all-time {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px dashed #eee;
    font-size: 0.65rem;
    color: #aaa;
    text-align: center;
  }

  /* Envelopes Stack */
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }
  .btn-refine {
    background: #f0f0e0;
    border: none;
    padding: 0.4rem 0.8rem;
    border-radius: 20px;
    font-size: 0.65rem;
    font-weight: 800;
    text-transform: uppercase;
    color: #666;
    cursor: pointer;
  }
  .btn-refine:hover {
    background: var(--muted-green);
    color: white;
  }

  .envelopes-stack {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .envelope-row {
    padding: 1.25rem;
    border-radius: 12px;
    background: #fafaf5;
    border-left: 6px solid var(--muted-green);
    transition: transform 0.2s;
  }
  .envelope-row.is-over {
    border-left-color: var(--alert-red);
    background: #fff5f5;
  }

  .row-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    min-height: 40px;
  }

  /* Edit Mode Row */
  .env-edit-mode {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
  }
  .icon-edit {
    width: 45px;
    text-align: center;
    padding: 0.4rem;
  }
  .name-edit {
    flex: 1;
    min-width: 0;
    padding: 0.4rem;
  }
  .budget-wrap {
    display: flex;
    align-items: center;
    gap: 0.2rem;
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 2px 5px;
  }
  .budget-wrap input {
    border: none;
    width: 60px;
    padding: 0.2rem;
    background: transparent;
  }
  .btn-cat-del {
    background: none;
    border: none;
    color: #ef4444;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0 5px;
  }

  .env-title {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    overflow: hidden;
  }
  .env-title .name {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--pine-green);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .env-values {
    font-size: 0.85rem;
    font-weight: 700;
    white-space: nowrap;
  }
  .env-values .budget {
    color: #888;
    font-family: "Inter", sans-serif;
    font-weight: 400;
    font-size: 0.75rem;
  }

  .progress-track {
    height: 8px;
    background: #eee;
    border-radius: 10px;
    overflow: hidden;
    margin: 0.75rem 0;
  }
  .progress-fill {
    height: 100%;
    border-radius: 10px;
    transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .row-bottom {
    display: flex;
    justify-content: space-between;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
  }
  .rem-label.alert {
    color: var(--alert-red);
  }

  .btn-add-cat {
    background: white;
    border: 2px dashed #ddd;
    border-radius: 10px;
    padding: 1rem;
    color: #888;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.8rem;
  }
  .btn-add-cat:hover {
    border-color: var(--muted-green);
    color: var(--muted-green);
    background: #fafaf5;
  }

  /* Ticker (History) */
  .ledger-container {
    width: 100%;
    overflow-x: hidden;
  }
  .ticker {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    width: 100%;
  }
  .ticker-item {
    display: grid;
    grid-template-columns: 50px 40px 1fr auto 30px;
    align-items: center;
    gap: 1rem;
    padding: 0.8rem;
    background: white;
    border-radius: 10px;
    border: 1px solid #f0f0e0;
    width: 100%;
    box-sizing: border-box;
  }
  @media (max-width: 500px) {
    .ticker-item {
      grid-template-columns: 40px 30px 1fr auto 20px;
      gap: 0.5rem;
      padding: 0.5rem;
    }
    .t-date {
      padding-right: 0.5rem;
    }
    .t-details .t-note {
      font-size: 0.8rem;
    }
  }

  .t-date {
    display: flex;
    flex-direction: column;
    align-items: center;
    color: #888;
    border-right: 1px solid #eee;
    padding-right: 0.8rem;
  }
  .d-day {
    font-family: "Oswald", sans-serif;
    font-size: 1.1rem;
    line-height: 1;
    color: var(--pine-green);
  }
  .d-mon {
    font-size: 0.55rem;
    text-transform: uppercase;
    font-weight: 800;
  }

  .t-icon {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    font-size: 0.9rem;
  }
  .t-details {
    display: flex;
    flex-direction: column;
    min-width: 0;
  } /* min-width: 0 is CRITICAL for truncation */
  .t-note {
    font-weight: 700;
    font-size: 0.9rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .t-cat {
    font-size: 0.65rem;
    color: #999;
    text-transform: uppercase;
    font-weight: 800;
  }

  .t-amount {
    font-family: "Oswald", sans-serif;
    font-weight: bold;
    font-size: 1rem;
    color: var(--pine-green);
    white-space: nowrap;
  }
  .t-del {
    background: none;
    border: none;
    color: #eee;
    font-size: 1.2rem;
    cursor: pointer;
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
</style>
