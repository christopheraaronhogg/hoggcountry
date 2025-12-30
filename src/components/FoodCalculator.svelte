<script>
  import { onMount } from 'svelte';

  let { trailContext = {} } = $props();

  let mounted = $state(false);

  // Core inputs
  let daysUntilResupply = $state(4);
  let dailyMileage = $state(15);
  let effortLevel = $state('moderate'); // easy, moderate, hard, extreme
  let calorieEfficiency = $state(110); // calories per ounce target

  // Sync with trail context
  $effect(() => {
    if (trailContext?.pace) {
      dailyMileage = trailContext.pace;
    }
  });

  onMount(() => {
    mounted = true;
    // Load saved preferences
    const saved = localStorage.getItem('at-food-calculator');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.calorieEfficiency) calorieEfficiency = data.calorieEfficiency;
        if (data.effortLevel) effortLevel = data.effortLevel;
      } catch (e) {}
    }
  });

  // Save preferences when changed
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
      icon: '🟢',
    },
    moderate: {
      name: 'Moderate',
      desc: 'Typical trail day, some climbs',
      baseCalories: 3000,
      icon: '🟡',
    },
    hard: {
      name: 'Hard',
      desc: 'Big climbs, long days, rough terrain',
      baseCalories: 3500,
      icon: '🟠',
    },
    extreme: {
      name: 'Extreme',
      desc: 'Whites/Maine terrain, 20+ miles, bad weather',
      baseCalories: 4000,
      icon: '🔴',
    },
  };

  // Calculate mileage adjustment (+100 cal per mile over 12)
  let mileageBonus = $derived(Math.max(0, (dailyMileage - 12) * 100));

  // Daily calories needed
  let dailyCalories = $derived(effortLevels[effortLevel].baseCalories + mileageBonus);

  // Total calories for carry
  let totalCalories = $derived(dailyCalories * daysUntilResupply);

  // Food weight calculations
  let foodOunces = $derived(totalCalories / calorieEfficiency);
  let foodPounds = $derived(foodOunces / 16);

  // Weight per day
  let weightPerDay = $derived(foodPounds / daysUntilResupply);

  // Efficiency rating
  let efficiencyRating = $derived.by(() => {
    if (calorieEfficiency >= 125) return { label: 'Excellent', color: '#16a34a', desc: 'Dense, efficient food choices' };
    if (calorieEfficiency >= 110) return { label: 'Good', color: '#ca8a04', desc: 'Balanced mix of foods' };
    if (calorieEfficiency >= 100) return { label: 'Average', color: '#ea580c', desc: 'Some heavy items included' };
    return { label: 'Heavy', color: '#dc2626', desc: 'Too much water weight in food' };
  });

  // Weight warning
  let weightWarning = $derived.by(() => {
    if (foodPounds > 14) return { level: 'danger', msg: 'Very heavy carry - consider shorter resupply' };
    if (foodPounds > 10) return { level: 'warning', msg: 'Heavy carry - normal for 100-Mile Wilderness' };
    if (foodPounds < 4) return { level: 'caution', msg: 'Light carry - make sure you have enough' };
    return null;
  });

  // Trail food reference (calories per ounce)
  const foodReference = [
    { name: 'Olive oil', cal: 250, category: 'fat' },
    { name: 'Peanut butter', cal: 170, category: 'fat' },
    { name: 'Nutella', cal: 155, category: 'fat' },
    { name: 'Snickers', cal: 135, category: 'snack' },
    { name: 'Trail mix (nuts heavy)', cal: 130, category: 'snack' },
    { name: 'Tortillas', cal: 125, category: 'carb' },
    { name: 'Instant oatmeal', cal: 110, category: 'carb' },
    { name: 'Ramen noodles', cal: 105, category: 'carb' },
    { name: 'Knorr pasta sides', cal: 100, category: 'carb' },
    { name: 'Energy bars (avg)', cal: 100, category: 'snack' },
    { name: 'Instant mashed potatoes', cal: 95, category: 'carb' },
    { name: 'Summer sausage', cal: 90, category: 'protein' },
    { name: 'Jerky', cal: 80, category: 'protein' },
    { name: 'Tuna packet', cal: 45, category: 'protein' },
    { name: 'Fresh fruit', cal: 15, category: 'fresh' },
  ];

  // Meal breakdown suggestion
  let mealBreakdown = $derived.by(() => {
    const dailyCal = dailyCalories;
    return {
      breakfast: Math.round(dailyCal * 0.20),
      lunch: Math.round(dailyCal * 0.25),
      dinner: Math.round(dailyCal * 0.30),
      snacks: Math.round(dailyCal * 0.25),
    };
  });

  // Category colors
  function categoryColor(cat) {
    const colors = {
      fat: '#f59e0b',
      snack: '#8b5cf6',
      carb: '#3b82f6',
      protein: '#ef4444',
      fresh: '#22c55e',
    };
    return colors[cat] || '#6b7280';
  }
</script>

<div class="food-calculator" class:mounted>
  <!-- Header -->
  <header class="calc-header">
    <div class="header-icon">🍽️</div>
    <div class="header-content">
      <h2>Food Calculator</h2>
      <p>Plan your resupply by calories and weight</p>
    </div>
  </header>

  <!-- Main Inputs -->
  <section class="inputs-section">
    <div class="input-row">
      <div class="input-group">
        <label>Days Until Resupply</label>
        <div class="stepper">
          <button onclick={() => daysUntilResupply = Math.max(1, daysUntilResupply - 1)}>−</button>
          <span class="stepper-value">{daysUntilResupply}</span>
          <button onclick={() => daysUntilResupply = Math.min(10, daysUntilResupply + 1)}>+</button>
        </div>
      </div>
      <div class="input-group">
        <label>Daily Mileage</label>
        <div class="stepper">
          <button onclick={() => dailyMileage = Math.max(5, dailyMileage - 1)}>−</button>
          <span class="stepper-value">{dailyMileage}</span>
          <button onclick={() => dailyMileage = Math.min(30, dailyMileage + 1)}>+</button>
        </div>
      </div>
    </div>

    <div class="effort-selector">
      <label>Terrain Effort</label>
      <div class="effort-options">
        {#each Object.entries(effortLevels) as [key, level]}
          <button
            class="effort-btn"
            class:active={effortLevel === key}
            onclick={() => effortLevel = key}
          >
            <span class="effort-icon">{level.icon}</span>
            <span class="effort-name">{level.name}</span>
          </button>
        {/each}
      </div>
      <p class="effort-desc">{effortLevels[effortLevel].desc}</p>
    </div>
  </section>

  <!-- Results -->
  <section class="results-section">
    <div class="result-card primary">
      <div class="result-header">
        <span class="result-label">Total Food Weight</span>
        {#if weightWarning}
          <span class="weight-warning {weightWarning.level}">{weightWarning.level === 'danger' ? '⚠️' : '⚡'}</span>
        {/if}
      </div>
      <div class="result-value">
        <span class="big-number">{foodPounds.toFixed(1)}</span>
        <span class="unit">lbs</span>
      </div>
      <div class="result-sub">
        {weightPerDay.toFixed(1)} lbs/day • {foodOunces.toFixed(0)} oz total
      </div>
      {#if weightWarning}
        <div class="warning-msg {weightWarning.level}">{weightWarning.msg}</div>
      {/if}
    </div>

    <div class="result-row">
      <div class="result-card">
        <span class="result-label">Daily Calories</span>
        <div class="result-value">
          <span class="medium-number">{dailyCalories.toLocaleString()}</span>
          <span class="unit">cal</span>
        </div>
      </div>
      <div class="result-card">
        <span class="result-label">Total Calories</span>
        <div class="result-value">
          <span class="medium-number">{totalCalories.toLocaleString()}</span>
          <span class="unit">cal</span>
        </div>
      </div>
    </div>
  </section>

  <!-- Calorie Efficiency -->
  <section class="efficiency-section">
    <div class="efficiency-header">
      <h3>Calorie Efficiency Target</h3>
      <div class="efficiency-rating" style="color: {efficiencyRating.color}">
        {efficiencyRating.label}
      </div>
    </div>
    <div class="efficiency-slider">
      <input
        type="range"
        bind:value={calorieEfficiency}
        min="80"
        max="150"
        step="5"
      />
      <div class="slider-labels">
        <span>80</span>
        <span class="current-val">{calorieEfficiency} cal/oz</span>
        <span>150</span>
      </div>
    </div>
    <p class="efficiency-desc">{efficiencyRating.desc}</p>
  </section>

  <!-- Meal Breakdown -->
  <section class="meals-section">
    <h3>Daily Meal Targets</h3>
    <div class="meals-grid">
      <div class="meal-card">
        <span class="meal-icon">🌅</span>
        <span class="meal-name">Breakfast</span>
        <span class="meal-cal">{mealBreakdown.breakfast} cal</span>
      </div>
      <div class="meal-card">
        <span class="meal-icon">☀️</span>
        <span class="meal-name">Lunch</span>
        <span class="meal-cal">{mealBreakdown.lunch} cal</span>
      </div>
      <div class="meal-card">
        <span class="meal-icon">🌙</span>
        <span class="meal-name">Dinner</span>
        <span class="meal-cal">{mealBreakdown.dinner} cal</span>
      </div>
      <div class="meal-card">
        <span class="meal-icon">🍫</span>
        <span class="meal-name">Snacks</span>
        <span class="meal-cal">{mealBreakdown.snacks} cal</span>
      </div>
    </div>
  </section>

  <!-- Food Reference -->
  <section class="reference-section">
    <h3>Calorie Density Reference</h3>
    <p class="ref-intro">Choose foods at or above your target ({calorieEfficiency} cal/oz) to hit weight goals.</p>
    <div class="food-list">
      {#each foodReference as food}
        <div class="food-item" class:good={food.cal >= calorieEfficiency} class:poor={food.cal < calorieEfficiency - 20}>
          <span class="food-name">{food.name}</span>
          <div class="food-stats">
            <span class="food-cal" style="color: {categoryColor(food.category)}">{food.cal}</span>
            <span class="food-unit">cal/oz</span>
          </div>
        </div>
      {/each}
    </div>
  </section>

  <!-- Tips -->
  <div class="tips-section">
    <h4>Resupply Tips</h4>
    <ul>
      <li><strong>Target 1.5-2 lbs/day</strong> for most hikers</li>
      <li><strong>Add calorie-dense fats</strong> (oil, peanut butter) to boost efficiency</li>
      <li><strong>Fresh food on day 1</strong> only — weight penalty is real</li>
      <li><strong>Don't fear hunger</strong> — towns always come faster than expected</li>
    </ul>
  </div>
</div>

<style>
  .food-calculator {
    background: var(--card, #fff);
    border-radius: 16px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    border: 1px solid var(--border);
    overflow: hidden;
    opacity: 0;
    transform: translateY(10px);
    transition: all 0.5s ease;
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
    padding: 1.5rem;
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: #fff;
  }

  .header-icon {
    font-size: 2rem;
  }

  .header-content h2 {
    margin: 0;
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
  }

  .header-content p {
    margin: 0.25rem 0 0;
    font-size: 0.9rem;
    opacity: 0.9;
  }

  /* Inputs */
  .inputs-section {
    padding: 1.5rem;
    border-bottom: 1px solid var(--border);
  }

  .input-row {
    display: flex;
    gap: 1.5rem;
    margin-bottom: 1.25rem;
  }

  .input-group {
    flex: 1;
  }

  .input-group label {
    display: block;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--muted);
    margin-bottom: 0.5rem;
  }

  .stepper {
    display: flex;
    align-items: center;
    gap: 0;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 10px;
    overflow: hidden;
  }

  .stepper button {
    width: 44px;
    height: 44px;
    border: none;
    background: transparent;
    font-size: 1.25rem;
    color: var(--pine);
    cursor: pointer;
    transition: all 0.2s;
  }

  .stepper button:hover {
    background: var(--alpine);
    color: #fff;
  }

  .stepper-value {
    flex: 1;
    text-align: center;
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--ink);
  }

  .effort-selector label {
    display: block;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--muted);
    margin-bottom: 0.5rem;
  }

  .effort-options {
    display: flex;
    gap: 0.5rem;
  }

  .effort-btn {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 0.75rem 0.5rem;
    border: 2px solid var(--border);
    border-radius: 10px;
    background: #fff;
    cursor: pointer;
    transition: all 0.2s;
  }

  .effort-btn:hover {
    border-color: var(--alpine);
  }

  .effort-btn.active {
    border-color: var(--pine);
    background: rgba(61, 90, 70, 0.08);
  }

  .effort-icon {
    font-size: 1.25rem;
  }

  .effort-name {
    font-family: Oswald, sans-serif;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--ink);
  }

  .effort-desc {
    margin: 0.75rem 0 0;
    font-size: 0.85rem;
    color: var(--muted);
    text-align: center;
  }

  /* Results */
  .results-section {
    padding: 1.5rem;
    background: var(--bg);
    border-bottom: 1px solid var(--border);
  }

  .result-card {
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1rem;
  }

  .result-card.primary {
    margin-bottom: 1rem;
    border-color: var(--pine);
    border-width: 2px;
  }

  .result-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .result-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .weight-warning {
    font-size: 1rem;
  }

  .result-value {
    display: flex;
    align-items: baseline;
    gap: 0.35rem;
  }

  .big-number {
    font-family: Oswald, sans-serif;
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--pine);
  }

  .medium-number {
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--ink);
  }

  .unit {
    font-size: 0.9rem;
    color: var(--muted);
  }

  .result-sub {
    font-size: 0.85rem;
    color: var(--muted);
    margin-top: 0.25rem;
  }

  .warning-msg {
    margin-top: 0.75rem;
    padding: 0.5rem 0.75rem;
    border-radius: 8px;
    font-size: 0.8rem;
    font-weight: 500;
  }

  .warning-msg.danger {
    background: #fef2f2;
    color: #991b1b;
  }

  .warning-msg.warning {
    background: #fffbeb;
    color: #92400e;
  }

  .warning-msg.caution {
    background: #f0f9ff;
    color: #0369a1;
  }

  .result-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  /* Efficiency */
  .efficiency-section {
    padding: 1.5rem;
    border-bottom: 1px solid var(--border);
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
    font-size: 1rem;
    color: var(--ink);
  }

  .efficiency-rating {
    font-family: Oswald, sans-serif;
    font-weight: 700;
    font-size: 0.9rem;
  }

  .efficiency-slider input[type="range"] {
    width: 100%;
    height: 8px;
    border-radius: 4px;
    background: var(--border);
    -webkit-appearance: none;
  }

  .efficiency-slider input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--pine);
    cursor: pointer;
  }

  .slider-labels {
    display: flex;
    justify-content: space-between;
    margin-top: 0.5rem;
    font-size: 0.75rem;
    color: var(--muted);
  }

  .current-val {
    font-weight: 700;
    color: var(--pine);
  }

  .efficiency-desc {
    margin: 0.75rem 0 0;
    font-size: 0.85rem;
    color: var(--muted);
    text-align: center;
  }

  /* Meals */
  .meals-section {
    padding: 1.5rem;
    border-bottom: 1px solid var(--border);
  }

  .meals-section h3 {
    margin: 0 0 1rem;
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    color: var(--ink);
  }

  .meals-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.75rem;
  }

  .meal-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 0.75rem 0.5rem;
    background: var(--bg);
    border-radius: 10px;
  }

  .meal-icon {
    font-size: 1.25rem;
  }

  .meal-name {
    font-size: 0.7rem;
    color: var(--muted);
  }

  .meal-cal {
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--ink);
  }

  /* Reference */
  .reference-section {
    padding: 1.5rem;
    border-bottom: 1px solid var(--border);
  }

  .reference-section h3 {
    margin: 0 0 0.5rem;
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    color: var(--ink);
  }

  .ref-intro {
    margin: 0 0 1rem;
    font-size: 0.85rem;
    color: var(--muted);
  }

  .food-list {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .food-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0.75rem;
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 8px;
    transition: all 0.2s;
  }

  .food-item.good {
    border-color: #86efac;
    background: rgba(34, 197, 94, 0.05);
  }

  .food-item.poor {
    opacity: 0.5;
  }

  .food-name {
    font-size: 0.85rem;
    color: var(--ink);
  }

  .food-stats {
    display: flex;
    align-items: baseline;
    gap: 0.25rem;
  }

  .food-cal {
    font-family: Oswald, sans-serif;
    font-weight: 700;
    font-size: 0.9rem;
  }

  .food-unit {
    font-size: 0.65rem;
    color: var(--muted);
  }

  /* Tips */
  .tips-section {
    padding: 1.25rem 1.5rem;
    background: #fffbeb;
  }

  .tips-section h4 {
    margin: 0 0 0.75rem;
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    color: #92400e;
  }

  .tips-section ul {
    margin: 0;
    padding-left: 1.25rem;
    font-size: 0.85rem;
    color: var(--ink);
  }

  .tips-section li {
    margin-bottom: 0.35rem;
  }

  .tips-section strong {
    color: #92400e;
  }

  /* Responsive */
  @media (max-width: 640px) {
    .input-row {
      flex-direction: column;
      gap: 1rem;
    }

    .effort-options {
      flex-wrap: wrap;
    }

    .effort-btn {
      flex: 1 1 45%;
    }

    .meals-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .result-row {
      grid-template-columns: 1fr;
    }
  }
</style>
