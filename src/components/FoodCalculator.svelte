<script>
  import { onMount } from 'svelte';

  let { trailContext = {} } = $props();

  let mounted = $state(false);

  // Core inputs
  let daysUntilResupply = $state(4);
  let dailyMileage = $state(15);
  let effortLevel = $state('moderate');
  let calorieEfficiency = $state(110);

  // Sync with trail context
  $effect(() => {
    if (trailContext?.pace) {
      dailyMileage = trailContext.pace;
    }
  });

  onMount(() => {
    mounted = true;
    const saved = localStorage.getItem('at-food-calculator');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.calorieEfficiency) calorieEfficiency = data.calorieEfficiency;
        if (data.effortLevel) effortLevel = data.effortLevel;
      } catch (e) {}
    }
  });

  $effect(() => {
    if (mounted) {
      localStorage.setItem('at-food-calculator', JSON.stringify({
        calorieEfficiency,
        effortLevel,
      }));
    }
  });

  // Effort level data
  const effortLevels = {
    easy: {
      name: 'Easy',
      desc: 'Flat terrain, low mileage, good weather',
      baseCalories: 2500,
      color: '#22c55e',
    },
    moderate: {
      name: 'Moderate',
      desc: 'Typical trail day, some climbs',
      baseCalories: 3000,
      color: '#eab308',
    },
    hard: {
      name: 'Hard',
      desc: 'Big climbs, long days, rough terrain',
      baseCalories: 3500,
      color: '#f97316',
    },
    extreme: {
      name: 'Extreme',
      desc: 'Whites/Maine terrain, 20+ miles, bad weather',
      baseCalories: 4000,
      color: '#ef4444',
    },
  };

  // Calculations
  let mileageBonus = $derived(Math.max(0, (dailyMileage - 12) * 100));
  let dailyCalories = $derived(effortLevels[effortLevel].baseCalories + mileageBonus);
  let totalCalories = $derived(dailyCalories * daysUntilResupply);
  let foodOunces = $derived(totalCalories / calorieEfficiency);
  let foodPounds = $derived(foodOunces / 16);
  let weightPerDay = $derived(foodPounds / daysUntilResupply);

  // Gauge calculation (0-20 lbs scale)
  let gaugePercent = $derived(Math.min(100, (foodPounds / 20) * 100));
  let gaugeColor = $derived.by(() => {
    if (foodPounds <= 6) return '#22c55e';
    if (foodPounds <= 10) return '#eab308';
    if (foodPounds <= 14) return '#f97316';
    return '#ef4444';
  });

  // Efficiency rating
  let efficiencyRating = $derived.by(() => {
    if (calorieEfficiency >= 125) return { label: 'EXCELLENT', color: '#22c55e', pct: 100 };
    if (calorieEfficiency >= 110) return { label: 'GOOD', color: '#84cc16', pct: 75 };
    if (calorieEfficiency >= 100) return { label: 'AVERAGE', color: '#eab308', pct: 50 };
    return { label: 'HEAVY', color: '#ef4444', pct: 25 };
  });

  // Weight status
  let weightStatus = $derived.by(() => {
    if (foodPounds > 14) return { label: 'OVERLOADED', color: '#ef4444', msg: 'Consider shorter resupply interval' };
    if (foodPounds > 10) return { label: 'HEAVY', color: '#f97316', msg: 'Normal for 100-Mile Wilderness' };
    if (foodPounds < 4) return { label: 'LIGHT', color: '#3b82f6', msg: 'Make sure you have enough' };
    return { label: 'OPTIMAL', color: '#22c55e', msg: 'Good balance of weight and fuel' };
  });

  // Food reference
  const foodReference = [
    { name: 'Olive oil', cal: 250, category: 'fat' },
    { name: 'Peanut butter', cal: 170, category: 'fat' },
    { name: 'Nutella', cal: 155, category: 'fat' },
    { name: 'Snickers', cal: 135, category: 'snack' },
    { name: 'Trail mix', cal: 130, category: 'snack' },
    { name: 'Tortillas', cal: 125, category: 'carb' },
    { name: 'Instant oatmeal', cal: 110, category: 'carb' },
    { name: 'Ramen noodles', cal: 105, category: 'carb' },
    { name: 'Knorr sides', cal: 100, category: 'carb' },
    { name: 'Energy bars', cal: 100, category: 'snack' },
    { name: 'Mashed potatoes', cal: 95, category: 'carb' },
    { name: 'Summer sausage', cal: 90, category: 'protein' },
    { name: 'Jerky', cal: 80, category: 'protein' },
    { name: 'Tuna packet', cal: 45, category: 'protein' },
  ];

  const categoryColors = {
    fat: '#f59e0b',
    snack: '#a855f7',
    carb: '#3b82f6',
    protein: '#ef4444',
  };

  // Meal breakdown
  let mealBreakdown = $derived.by(() => {
    const dailyCal = dailyCalories;
    return [
      { name: 'Breakfast', pct: 20, cal: Math.round(dailyCal * 0.20), icon: 'B' },
      { name: 'Lunch', pct: 25, cal: Math.round(dailyCal * 0.25), icon: 'L' },
      { name: 'Dinner', pct: 30, cal: Math.round(dailyCal * 0.30), icon: 'D' },
      { name: 'Snacks', pct: 25, cal: Math.round(dailyCal * 0.25), icon: 'S' },
    ];
  });

  // SVG gauge arc calculation
  function describeArc(x, y, radius, startAngle, endAngle) {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return [
      "M", start.x, start.y,
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(" ");
  }

  function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  }
</script>

<div class="food-calculator" class:mounted>
  <!-- Header -->
  <header class="calc-header">
    <div class="header-flame">
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 23c-3.9 0-7-3.1-7-7 0-2.8 1.6-5.5 4.2-7.2-.4 1.3-.2 2.7.6 3.8 1-2.9 3.2-5.1 5.8-6.6-.6 2.1-.2 4.4 1.2 6.2.4-1.1 1-2.1 1.8-3 1.5 2.4 2.4 5.1 2.4 7.8 0 3.9-3.1 7-7 7z"/>
      </svg>
    </div>
    <div class="header-content">
      <h2>TRAIL FUEL STATION</h2>
      <p>Calculate your caloric payload</p>
    </div>
    <div class="header-stat">
      <span class="stat-value">{dailyCalories.toLocaleString()}</span>
      <span class="stat-label">cal/day</span>
    </div>
  </header>

  <!-- Main Grid: Gauge + Inputs -->
  <div class="main-grid">
    <!-- Gauge Column -->
    <div class="gauge-column">
      <div class="gauge-container">
        <svg viewBox="0 0 200 130" class="weight-gauge">
          <!-- Background arc -->
          <path
            d={describeArc(100, 100, 80, -135, 135)}
            fill="none"
            stroke="var(--border)"
            stroke-width="16"
            stroke-linecap="round"
          />
          <!-- Colored arc -->
          <path
            d={describeArc(100, 100, 80, -135, -135 + (gaugePercent * 2.7))}
            fill="none"
            stroke={gaugeColor}
            stroke-width="16"
            stroke-linecap="round"
            class="gauge-fill"
          />
          <!-- Center reading -->
          <text x="100" y="85" text-anchor="middle" class="gauge-value">{foodPounds.toFixed(1)}</text>
          <text x="100" y="105" text-anchor="middle" class="gauge-unit">LBS</text>
          <!-- Scale markers -->
          <text x="35" y="115" class="gauge-marker">0</text>
          <text x="100" y="25" class="gauge-marker">10</text>
          <text x="165" y="115" class="gauge-marker">20</text>
        </svg>
        <div class="gauge-status" style="--status-color: {weightStatus.color}">
          <span class="status-label">{weightStatus.label}</span>
          <span class="status-msg">{weightStatus.msg}</span>
        </div>
      </div>

      <!-- Secondary Stats -->
      <div class="stats-row">
        <div class="stat-box">
          <span class="stat-num">{foodOunces.toFixed(0)}</span>
          <span class="stat-lbl">oz total</span>
        </div>
        <div class="stat-box">
          <span class="stat-num">{weightPerDay.toFixed(1)}</span>
          <span class="stat-lbl">lbs/day</span>
        </div>
        <div class="stat-box">
          <span class="stat-num">{totalCalories.toLocaleString()}</span>
          <span class="stat-lbl">total cal</span>
        </div>
      </div>
    </div>

    <!-- Inputs Column -->
    <div class="inputs-column">
      <div class="input-block">
        <label class="input-label">DAYS UNTIL RESUPPLY</label>
        <div class="stepper">
          <button class="step-btn" onclick={() => daysUntilResupply = Math.max(1, daysUntilResupply - 1)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12h14"/></svg>
          </button>
          <span class="step-value">{daysUntilResupply}</span>
          <button class="step-btn" onclick={() => daysUntilResupply = Math.min(10, daysUntilResupply + 1)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M12 5v14M5 12h14"/></svg>
          </button>
        </div>
      </div>

      <div class="input-block">
        <label class="input-label">DAILY MILEAGE</label>
        <div class="stepper">
          <button class="step-btn" onclick={() => dailyMileage = Math.max(5, dailyMileage - 1)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12h14"/></svg>
          </button>
          <span class="step-value">{dailyMileage}</span>
          <button class="step-btn" onclick={() => dailyMileage = Math.min(30, dailyMileage + 1)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M12 5v14M5 12h14"/></svg>
          </button>
        </div>
      </div>

      <div class="input-block">
        <label class="input-label">TERRAIN EFFORT</label>
        <div class="effort-grid">
          {#each Object.entries(effortLevels) as [key, level]}
            <button
              class="effort-btn"
              class:active={effortLevel === key}
              style="--effort-color: {level.color}"
              onclick={() => effortLevel = key}
            >
              <span class="effort-dot"></span>
              <span class="effort-name">{level.name}</span>
            </button>
          {/each}
        </div>
        <p class="effort-desc">{effortLevels[effortLevel].desc}</p>
      </div>
    </div>
  </div>

  <!-- Efficiency Section -->
  <section class="efficiency-section">
    <div class="efficiency-header">
      <h3>CALORIE EFFICIENCY</h3>
      <div class="efficiency-badge" style="background: {efficiencyRating.color}">
        {efficiencyRating.label}
      </div>
    </div>
    <div class="efficiency-gauge">
      <div class="eff-track">
        <div class="eff-fill" style="width: {((calorieEfficiency - 80) / 70) * 100}%; background: {efficiencyRating.color}"></div>
        <div class="eff-thumb" style="left: {((calorieEfficiency - 80) / 70) * 100}%">
          <span class="thumb-value">{calorieEfficiency}</span>
        </div>
      </div>
      <input
        type="range"
        bind:value={calorieEfficiency}
        min="80"
        max="150"
        step="5"
        class="eff-slider"
      />
      <div class="eff-labels">
        <span>80 cal/oz</span>
        <span>Heavy foods</span>
        <span class="eff-divider">|</span>
        <span>Dense foods</span>
        <span>150 cal/oz</span>
      </div>
    </div>
  </section>

  <!-- Meal Breakdown -->
  <section class="meals-section">
    <h3>DAILY FUEL BREAKDOWN</h3>
    <div class="meals-bar">
      {#each mealBreakdown as meal, i}
        <div
          class="meal-segment"
          style="flex: {meal.pct}; --meal-hue: {i * 60}"
          title="{meal.name}: {meal.cal} cal"
        >
          <span class="segment-icon">{meal.icon}</span>
        </div>
      {/each}
    </div>
    <div class="meals-grid">
      {#each mealBreakdown as meal, i}
        <div class="meal-card" style="--meal-hue: {i * 60}">
          <span class="meal-icon">{meal.icon}</span>
          <span class="meal-name">{meal.name}</span>
          <span class="meal-cal">{meal.cal} cal</span>
          <span class="meal-pct">{meal.pct}%</span>
        </div>
      {/each}
    </div>
  </section>

  <!-- Food Reference -->
  <section class="reference-section">
    <div class="ref-header">
      <h3>CALORIE DENSITY REFERENCE</h3>
      <div class="ref-legend">
        {#each Object.entries(categoryColors) as [cat, color]}
          <span class="legend-item" style="--cat-color: {color}">{cat}</span>
        {/each}
      </div>
    </div>
    <p class="ref-target">Target: {calorieEfficiency}+ cal/oz for optimal weight</p>
    <div class="food-grid">
      {#each foodReference as food}
        {@const isGood = food.cal >= calorieEfficiency}
        {@const isBad = food.cal < calorieEfficiency - 20}
        <div
          class="food-item"
          class:good={isGood}
          class:bad={isBad}
          style="--cat-color: {categoryColors[food.category]}"
        >
          <span class="food-cat"></span>
          <span class="food-name">{food.name}</span>
          <span class="food-cal">{food.cal}</span>
        </div>
      {/each}
    </div>
  </section>

  <!-- Tips -->
  <section class="tips-section">
    <div class="tip-icon">
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
      </svg>
    </div>
    <div class="tips-content">
      <strong>Resupply Strategy</strong>
      <ul>
        <li>Target 1.5-2 lbs/day for most thru-hikers</li>
        <li>Add calorie-dense fats to boost efficiency</li>
        <li>Fresh food on day 1 only — weight penalty is real</li>
        <li>Don't fear hunger — towns come faster than expected</li>
      </ul>
    </div>
  </section>

  <!-- Guide Link -->
  <a href="/guide/08-food-and-resupply" class="guide-link">
    <span>Read the full Food & Resupply Guide</span>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  </a>
</div>

<style>
  .food-calculator {
    background: var(--bg);
    border: 2px solid var(--border);
    border-radius: 16px;
    overflow: hidden;
    opacity: 0;
    transform: translateY(12px);
    transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .food-calculator.mounted {
    opacity: 1;
    transform: translateY(0);
  }

  /* Header */
  .calc-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.25rem 1.5rem;
    background: linear-gradient(135deg, #b45309 0%, #d97706 100%);
    border-bottom: 2px solid #92400e;
  }

  .header-flame {
    width: 48px;
    height: 48px;
    background: rgba(0,0,0,0.2);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fef3c7;
  }

  .header-flame svg {
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
    color: #fef3c7;
    opacity: 0.9;
  }

  .header-stat {
    text-align: right;
    padding: 0.5rem 0.75rem;
    background: rgba(0,0,0,0.15);
    border-radius: 8px;
  }

  .header-stat .stat-value {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: #fff;
  }

  .header-stat .stat-label {
    font-size: 0.7rem;
    color: #fef3c7;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* Main Grid */
  .main-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
  }

  /* Gauge Column */
  .gauge-column {
    padding: 1.5rem;
    background: #fff;
    border-right: 2px solid var(--border);
  }

  .gauge-container {
    text-align: center;
  }

  .weight-gauge {
    width: 100%;
    max-width: 200px;
    height: auto;
  }

  .gauge-fill {
    transition: all 0.5s ease;
  }

  .gauge-value {
    font-family: Oswald, sans-serif;
    font-size: 36px;
    font-weight: 700;
    fill: var(--ink);
  }

  .gauge-unit {
    font-family: Oswald, sans-serif;
    font-size: 14px;
    font-weight: 600;
    fill: var(--muted);
    letter-spacing: 0.1em;
  }

  .gauge-marker {
    font-size: 10px;
    fill: var(--muted);
  }

  .gauge-status {
    margin-top: 0.5rem;
    padding: 0.5rem 1rem;
    background: color-mix(in srgb, var(--status-color) 10%, transparent);
    border: 2px solid var(--status-color);
    border-radius: 8px;
    display: inline-block;
  }

  .status-label {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--status-color);
    letter-spacing: 0.05em;
  }

  .status-msg {
    font-size: 0.75rem;
    color: var(--muted);
  }

  .stats-row {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .stat-box {
    flex: 1;
    text-align: center;
    padding: 0.5rem;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 6px;
  }

  .stat-num {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--ink);
  }

  .stat-lbl {
    font-size: 0.65rem;
    color: var(--muted);
    text-transform: uppercase;
  }

  /* Inputs Column */
  .inputs-column {
    padding: 1.5rem;
    background: #fff;
  }

  .input-block {
    margin-bottom: 1.25rem;
  }

  .input-block:last-child {
    margin-bottom: 0;
  }

  .input-label {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--muted);
    letter-spacing: 0.08em;
    margin-bottom: 0.5rem;
  }

  .stepper {
    display: flex;
    align-items: center;
    background: var(--bg);
    border: 2px solid var(--border);
    border-radius: 10px;
    overflow: hidden;
  }

  .step-btn {
    width: 44px;
    height: 44px;
    border: none;
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--pine);
    transition: all 0.2s;
  }

  .step-btn:hover {
    background: var(--alpine);
    color: #fff;
  }

  .step-btn svg {
    width: 18px;
    height: 18px;
  }

  .step-value {
    flex: 1;
    text-align: center;
    font-family: Oswald, sans-serif;
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--ink);
  }

  .effort-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
  }

  .effort-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.35rem;
    padding: 0.6rem 0.4rem;
    border: 2px solid var(--border);
    border-radius: 8px;
    background: #fff;
    cursor: pointer;
    transition: all 0.2s;
  }

  .effort-btn:hover {
    border-color: var(--effort-color);
  }

  .effort-btn.active {
    border-color: var(--effort-color);
    background: color-mix(in srgb, var(--effort-color) 10%, white);
  }

  .effort-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--effort-color);
  }

  .effort-name {
    font-family: Oswald, sans-serif;
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--ink);
  }

  .effort-desc {
    margin: 0.5rem 0 0;
    font-size: 0.8rem;
    color: var(--muted);
    text-align: center;
  }

  /* Efficiency Section */
  .efficiency-section {
    padding: 1.5rem;
    background: #fffbeb;
    border-top: 2px solid var(--border);
    border-bottom: 2px solid var(--border);
  }

  .efficiency-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .efficiency-header h3 {
    margin: 0;
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--ink);
    letter-spacing: 0.05em;
  }

  .efficiency-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-family: Oswald, sans-serif;
    font-size: 0.75rem;
    font-weight: 700;
    color: #fff;
    letter-spacing: 0.05em;
  }

  .efficiency-gauge {
    position: relative;
    margin-bottom: 0.5rem;
  }

  .eff-track {
    height: 32px;
    position: relative;
    overflow: visible;
  }

  .eff-track::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 12px;
    transform: translateY(-50%);
    background: var(--border);
    border-radius: 6px;
  }

  .eff-fill {
    position: absolute;
    top: 50%;
    left: 0;
    height: 12px;
    transform: translateY(-50%);
    border-radius: 6px;
    transition: all 0.3s ease;
  }

  .eff-thumb {
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 32px;
    height: 32px;
    background: #fff;
    border: 3px solid var(--ink);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    z-index: 2;
  }

  .thumb-value {
    font-family: Oswald, sans-serif;
    font-size: 0.7rem;
    font-weight: 700;
  }

  .eff-slider {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 32px;
    opacity: 0;
    cursor: pointer;
    z-index: 3;
  }

  .eff-labels {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 0.5rem;
    font-size: 0.7rem;
    color: var(--muted);
  }

  .eff-divider {
    color: var(--border);
  }

  /* Meals Section */
  .meals-section {
    padding: 1.5rem;
    background: #fff;
    border-bottom: 2px solid var(--border);
  }

  .meals-section h3 {
    margin: 0 0 1rem;
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--ink);
    letter-spacing: 0.05em;
  }

  .meals-bar {
    display: flex;
    height: 24px;
    border-radius: 12px;
    overflow: hidden;
    margin-bottom: 1rem;
    border: 2px solid var(--border);
  }

  .meal-segment {
    background: hsl(var(--meal-hue), 65%, 55%);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .meal-segment:hover {
    filter: brightness(1.1);
  }

  .segment-icon {
    font-family: Oswald, sans-serif;
    font-size: 0.7rem;
    font-weight: 700;
    color: #fff;
  }

  .meals-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
  }

  .meal-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.15rem;
    padding: 0.6rem;
    background: var(--bg);
    border: 2px solid hsl(var(--meal-hue), 50%, 75%);
    border-radius: 8px;
  }

  .meal-icon {
    width: 24px;
    height: 24px;
    background: hsl(var(--meal-hue), 65%, 55%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: Oswald, sans-serif;
    font-size: 0.7rem;
    font-weight: 700;
    color: #fff;
  }

  .meal-name {
    font-size: 0.7rem;
    color: var(--muted);
  }

  .meal-cal {
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--ink);
  }

  .meal-pct {
    font-size: 0.65rem;
    color: var(--muted);
  }

  /* Reference Section */
  .reference-section {
    padding: 1.5rem;
    background: #fff;
    border-bottom: 2px solid var(--border);
  }

  .ref-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .ref-header h3 {
    margin: 0;
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--ink);
    letter-spacing: 0.05em;
  }

  .ref-legend {
    display: flex;
    gap: 0.75rem;
  }

  .legend-item {
    font-size: 0.65rem;
    font-weight: 600;
    color: var(--cat-color);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .legend-item::before {
    content: '';
    display: inline-block;
    width: 8px;
    height: 8px;
    background: var(--cat-color);
    border-radius: 2px;
    margin-right: 0.25rem;
    vertical-align: middle;
  }

  .ref-target {
    margin: 0 0 1rem;
    font-size: 0.8rem;
    color: var(--muted);
  }

  .food-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.4rem;
  }

  .food-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: var(--bg);
    border: 2px solid var(--border);
    border-radius: 6px;
    transition: all 0.2s;
  }

  .food-item.good {
    border-color: #86efac;
    background: rgba(34, 197, 94, 0.08);
  }

  .food-item.bad {
    opacity: 0.5;
  }

  .food-cat {
    width: 8px;
    height: 8px;
    border-radius: 2px;
    background: var(--cat-color);
    flex-shrink: 0;
  }

  .food-name {
    flex: 1;
    font-size: 0.8rem;
    color: var(--ink);
  }

  .food-cal {
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--cat-color);
  }

  /* Tips Section */
  .tips-section {
    display: flex;
    gap: 1rem;
    padding: 1.25rem 1.5rem;
    background: #f0fdf4;
    border-bottom: 2px solid var(--border);
  }

  .tip-icon {
    width: 32px;
    height: 32px;
    color: #16a34a;
    flex-shrink: 0;
  }

  .tip-icon svg {
    width: 100%;
    height: 100%;
  }

  .tips-content {
    flex: 1;
  }

  .tips-content strong {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    color: #166534;
    margin-bottom: 0.35rem;
  }

  .tips-content ul {
    margin: 0;
    padding-left: 1.25rem;
    font-size: 0.8rem;
    color: var(--ink);
  }

  .tips-content li {
    margin-bottom: 0.2rem;
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
    .main-grid {
      grid-template-columns: 1fr;
    }

    .gauge-column {
      border-right: none;
      border-bottom: 2px solid var(--border);
    }

    .effort-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .meals-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .food-grid {
      grid-template-columns: 1fr;
    }

    .header-stat {
      display: none;
    }

    .ref-legend {
      width: 100%;
      justify-content: flex-start;
    }
  }
</style>
