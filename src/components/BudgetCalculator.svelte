<script>
  import { onMount } from "svelte";
  import { fade, slide, scale } from "svelte/transition";

  let { trailContext = {} } = $props();

  const DEFAULT_CATEGORIES = [
    { id: "food", name: "Resupply (Trail Food)", icon: "🛒", color: "#22c55e" },
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

  const EMOJI_LIST = [
    "🛒",
    "🏨",
    "🎒",
    "🧺",
    "🚗",
    "🎉",
    "📦",
    "🥾",
    "🚿",
    "📱",
    "🔋",
    "🆘",
    "🛠️",
    "🏕️",
    "🍳",
    "💊",
    "🗺️",
    "💵",
    "💳",
    "🥤",
    "🍔",
    "🍦",
    "🚌",
    "✈️",
    "🛌",
    "🧖",
    "🧼",
    "👕",
    "✂️",
    "👟",
  ];

  let mounted = $state(false);
  let currentMonthKey = $state(getMonthKey());

  // Data structure: { "2026-03": { food: 1200, ... } }
  let monthlyBudgets = $state({});
  let expenses = $state([]);
  let uCategories = $state([...DEFAULT_CATEGORIES]); // Dynamic categories

  let showEnvelopeSettings = $state(false);
  let activeEmojiPicker = $state(null); // ID of category being edited

  // Form State
  let newAmount = $state("");
  let newCategory = $state("food");
  let newNote = $state("");
  let newDate = $state(new Date().toISOString().split("T")[0]);

  onMount(() => {
    mounted = true;

    // Handle clicks outside picker to close it
    const handleClick = (e) => {
      if (activeEmojiPicker && !e.target.closest(".emoji-picker-container")) {
        activeEmojiPicker = null;
      }
    };
    window.addEventListener("click", handleClick);

    const saved = localStorage.getItem("at-budget-v3");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        monthlyBudgets = data.monthlyBudgets || {};
        expenses = data.expenses || [];
        if (data.uCategories) {
          uCategories = data.uCategories.map((c) => {
            let nc = { ...c };
            if (nc.icon === "🍺") {
              nc.icon = "🎉";
              if (nc.name === "Town Fun") nc.name = "Misc / Fun";
            }
            if (nc.name === "Food & Resupply")
              nc.name = "Resupply (Trail Food)";
            return nc;
          });
        }
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

    return () => window.removeEventListener("click", handleClick);
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

  function selectEmoji(catId, emoji) {
    const cat = uCategories.find((c) => c.id === catId);
    if (cat) {
      cat.icon = emoji;
      activeEmojiPicker = null;
      saveData();
    }
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

  // Date Helpers
  const getDaysInMonth = (y, m) => new Date(y, m, 0).getDate();

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

  // Hiker's Pulse Metrics
  let burnMetrics = $derived(() => {
    if (!currentMonthKey)
      return { dailyBurn: 0, safePace: 0, projected: 0, totalDays: 0 };

    const [y, m] = currentMonthKey.split("-").map(Number);
    const totalDays = getDaysInMonth(y, m);

    // Simple Monthly Pace: Total Spent / Month Length
    // This provides a stable average vs a fluctuating live rate
    const dailyBurn = totalDays > 0 ? totalSpentInMonth / totalDays : 0;
    const safePace = totalDays > 0 ? totalMonthlyBudget / totalDays : 0;

    return { dailyBurn, safePace, totalDays };
  });

  let categoryStats = $derived(
    uCategories.map((cat) => {
      const spent = monthlyExpenses
        .filter((e) => e.category === cat.id)
        .reduce((sum, e) => sum + (e.amount || 0), 0);
      const budget = currentEnvelopes[cat.id] || 0;
      const remaining = budget - spent;
      const percent = budget > 0 ? (spent / budget) * 100 : 0;

      // Traffic Light Health
      let statusColor = "var(--pine-green)";
      if (percent > 95) statusColor = "var(--alert-red)";
      else if (percent > 75) statusColor = "var(--marker-gold)";

      return { ...cat, spent, budget, remaining, percent, statusColor };
    }),
  );

  let displayedTransactions = $derived(
    [...monthlyExpenses].sort((a, b) => new Date(b.date) - new Date(a.date)),
  );

  // Journal Grouping
  let groupedTransactions = $derived(() => {
    const groups = {};
    displayedTransactions.forEach((t) => {
      // Parse safely using local time assumption for display consistency
      const d = new Date(t.date.includes("T") ? t.date : t.date + "T12:00:00");
      const key = d.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      });

      // Check for Today/Yesterday
      const now = new Date();
      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);

      let label = key;
      if (d.toDateString() === now.toDateString()) label = "Today";
      else if (d.toDateString() === yesterday.toDateString())
        label = "Yesterday";

      if (!groups[label]) groups[label] = { date: d, items: [], total: 0 };
      groups[label].items.push(t);
      groups[label].total += t.amount;
    });
    return Object.entries(groups).sort((a, b) => b[1].date - a[1].date);
  });

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
        <h2 style="color: white">Trail Envelopes</h2>
        <p style="color: rgba(255,255,255,0.9)">
          Every dollar has a name, every mile.
        </p>
      </div>
    </div>
    <div class="month-selector">
      <button onclick={() => changeMonth(-1)} class="month-nav">◀</button>
      <span class="current-month">{getMonthDisplayName(currentMonthKey)}</span>
      <button onclick={() => changeMonth(1)} class="month-nav">▶</button>
    </div>
  </header>

  <div class="stats-bar">
    <div class="stat-group">
      <span class="stat-label">Remaining</span>
      <div class="burn-rate-display">
        <span
          class="stat-value"
          class:over={totalMonthlyBudget - totalSpentInMonth < 0}
        >
          {formatMoney(totalMonthlyBudget - totalSpentInMonth)}
        </span>
        <span class="pace-context">
          Actual Burn: {formatMoney(burnMetrics().dailyBurn)} / day
        </span>
      </div>
    </div>
    <div class="stat-group right">
      <div class="sub-item">
        <span class="sub-label"
          >Spending in {getMonthDisplayName(currentMonthKey).split(
            " ",
          )[0]}</span
        >
        <span class="sub-value">
          {formatMoney(totalSpentInMonth)}
          <span class="unit">/ {formatMoney(totalMonthlyBudget)}</span>
        </span>
        <span class="pace-context" style="text-align: right">
          Budgeted Burn: {formatMoney(burnMetrics().safePace)} / day
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
                    <div class="emoji-picker-container">
                      <button
                        class="icon-btn"
                        onclick={(e) => {
                          e.stopPropagation();
                          activeEmojiPicker = cat.id;
                        }}
                        title="Change Icon"
                      >
                        {cat.icon}
                      </button>
                      {#if activeEmojiPicker === cat.id}
                        <div
                          class="emoji-popover"
                          transition:scale={{ duration: 150, start: 0.9 }}
                        >
                          <div class="emoji-grid">
                            {#each EMOJI_LIST as emoji}
                              <button onclick={() => selectEmoji(cat.id, emoji)}
                                >{emoji}</button
                              >
                            {/each}
                          </div>
                        </div>
                      {/if}
                    </div>
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
                    )}%; background: {cat.statusColor}"
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
            : ""} Journal
        </h3>
        {#if groupedTransactions().length > 0}
          <div class="ledger-container">
            {#each groupedTransactions() as group}
              <div class="ledger-day">
                <div class="day-header">
                  <span class="day-label">{group[0]}</span>
                  <span class="day-total">{formatMoney(group[1].total)}</span>
                </div>
                <div class="ticker">
                  {#each group[1].items as exp (exp.id)}
                    {@const cat = uCategories.find(
                      (c) => c.id === exp.category,
                    )}
                    <div class="ticker-item" transition:slide>
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
                        <span class="t-cat">{cat?.name || "Uncategorized"}</span
                        >
                      </div>
                      <div class="t-amount">{formatMoney(exp.amount)}</div>
                      <button
                        class="t-del"
                        onclick={() => deleteExpense(exp.id)}>×</button
                      >
                    </div>
                  {/each}
                </div>
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
    width: 100%;
    max-width: 100%;
    margin: 0 auto;
    box-sizing: border-box;
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
    font-weight: 800;
    color: var(--marker-gold);
  }
  .header-main p {
    margin: 0;
    opacity: 0.9;
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

  /* New Stats Dashboard */
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
  .stat-group {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }
  .stat-group.right {
    flex-direction: row;
    gap: 2rem;
  }

  .burn-rate-display {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }
  .stat-value {
    font-size: 2.2rem;
    line-height: 1;
    color: var(--pine-green);
    font-family: "Oswald", sans-serif;
  }
  .stat-value.over {
    color: var(--alert-red);
  }
  .pace-context {
    font-size: 0.8rem;
    color: #555;
    margin-top: 5px;
    font-weight: 600;
  }

  .sub-item {
    display: flex;
    flex-direction: column;
    text-align: right;
  }
  .sub-label {
    font-size: 0.65rem;
    color: #555;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-weight: 800;
    margin-bottom: 3px;
  }
  .sub-value {
    font-family: "Oswald", sans-serif;
    font-size: 1.25rem;
    color: #444;
    line-height: 1;
  }
  .sub-value .unit {
    font-size: 0.75rem;
    opacity: 0.7;
    font-weight: 500;
    margin-left: 2px;
  }

  /* Journal Ledger */
  .ledger-container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  .ledger-day {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  .day-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid #f0f0e0;
    margin-top: 0.5rem;
  }
  .day-label {
    font-family: "Oswald", sans-serif;
    font-size: 0.95rem;
    color: var(--pine-green);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .day-total {
    font-size: 0.8rem;
    font-weight: 700;
    color: #555;
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
      padding: 1.5rem;
    }
    .stat-group.right {
      width: 100%;
      justify-content: space-between;
      border-top: 1px solid #eee;
      padding-top: 1rem;
    }
    .sub-item {
      text-align: left;
    }
    .sub-item:last-child {
      text-align: right;
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
    box-sizing: border-box;
    width: 100%;
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
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    width: 100%;
  }
  .input-group {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    min-width: 0;
    width: 100%;
  }
  .full {
    width: 100%;
  }
  label {
    font-size: 0.65rem;
    font-weight: 800;
    color: #888;
    text-transform: uppercase;
  }

  .currency-input {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
    min-width: 0;
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
    background: var(--pine-green);
    color: white;
    border: none;
    padding: 1rem;
    border-radius: 8px;
    font-size: 0.95rem;
    font-weight: 800;
    cursor: pointer;
    transition: all 0.2s;
    margin-top: 0.5rem;
    box-shadow: 0 4px 0 #1a2318;
    width: 100%;
    box-sizing: border-box;
    text-transform: uppercase;
    letter-spacing: 1px;
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
  /* Emoji Picker Styles */
  .emoji-picker-container {
    position: relative;
  }
  .icon-btn {
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 8px;
    width: 40px;
    height: 40px;
    font-size: 1.2rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition:
      transform 0.2s,
      border-color 0.2s;
  }
  .icon-btn:hover {
    border-color: var(--muted-green);
    transform: translateY(-1px);
  }

  .emoji-popover {
    position: absolute;
    top: calc(100% + 10px);
    left: 0;
    z-index: 100;
    background: white;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    padding: 0.75rem;
    width: 240px;
    border: 1px solid #eee;
  }
  .emoji-popover::after {
    content: "";
    position: absolute;
    bottom: 100%;
    left: 15px;
    border: 8px solid transparent;
    border-bottom-color: white;
  }

  .emoji-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 0.4rem;
  }
  .emoji-grid button {
    background: none;
    border: none;
    font-size: 1.25rem;
    padding: 0.4rem;
    cursor: pointer;
    border-radius: 6px;
    transition:
      background 0.2s,
      transform 0.1s;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .emoji-grid button:hover {
    background: #f0f0e0;
    transform: scale(1.1);
  }
  .emoji-grid button:active {
    transform: scale(0.9);
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

  input,
  select {
    padding: 0.8rem;
    border: 2px solid #f0f0e0;
    border-radius: 12px;
    font-size: 0.95rem;
    transition: all 0.2s;
    background: #fafaf5;
    width: 100%;
    box-sizing: border-box;
    min-width: 0;
    color: var(--ink);
    font-family: inherit;
    font-weight: 500;
  }
  input:focus,
  select:focus {
    border-color: var(--marker-gold);
    background: white;
    outline: none;
    box-shadow: 0 0 0 4px rgba(212, 163, 115, 0.1);
  }
  select {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 1rem center;
    background-size: 1rem;
    padding-right: 2.5rem;
    cursor: pointer;
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
    display: flex;
    justify-content: space-between;
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
    .t-details .t-note {
      font-size: 0.8rem;
    }
  }

  .t-icon {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    font-size: 0.9rem;
    flex-shrink: 0;
  }
  .t-details {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex: 1;
  }
  .t-note {
    font-weight: 700;
    font-size: 0.9rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .t-cat {
    font-size: 0.65rem;
    color: #666;
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
    padding: 0 5px;
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
