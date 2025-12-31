<script>
  import { onMount } from 'svelte';
  import { slide } from 'svelte/transition';
  import gearData from '../data/gear.json';

  let { trailContext = {} } = $props();

  let season = $state('winter');
  let mounted = $state(false);
  let expandedCategory = $state(null);
  let activeTab = $state('builder');
  let foodDays = $state(4);
  let waterLiters = $state(2);
  let foodWeightPerDay = $state(1.75);

  onMount(() => {
    mounted = true;
    const saved = localStorage.getItem('at-pack-builder');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.season) season = data.season;
        if (data.foodDays) foodDays = data.foodDays;
        if (data.waterLiters) waterLiters = data.waterLiters;
        if (data.foodWeightPerDay) foodWeightPerDay = data.foodWeightPerDay;
      } catch (e) {}
    }
  });

  $effect(() => {
    if (mounted) {
      localStorage.setItem('at-pack-builder', JSON.stringify({
        season, foodDays, waterLiters, foodWeightPerDay
      }));
    }
  });

  const categories = gearData.categories;
  const WATER_WEIGHT_PER_LITER = 2.2;

  function getSeasonItems(items, currentSeason) {
    const swapGroups = {};
    const result = [];
    items.forEach(item => {
      if (item.swapGroup) {
        if (!swapGroups[item.swapGroup]) swapGroups[item.swapGroup] = [];
        swapGroups[item.swapGroup].push(item);
      } else {
        if (item.season === 'all' || item.season === currentSeason) result.push(item);
      }
    });
    Object.values(swapGroups).forEach(group => {
      const match = group.find(i => i.season === currentSeason) || group.find(i => i.season === 'all');
      if (match) result.push(match);
    });
    return result;
  }

  let seasonItems = $derived(getSeasonItems(gearData.items, season));
  let baseWeightOz = $derived(seasonItems.filter(item => !item.worn).reduce((sum, item) => sum + item.weight, 0));
  let wornWeightOz = $derived(seasonItems.filter(item => item.worn).reduce((sum, item) => sum + item.weight, 0));
  let baseWeightLbs = $derived(baseWeightOz / 16);
  let wornWeightLbs = $derived(wornWeightOz / 16);
  let foodWeight = $derived(foodDays * foodWeightPerDay);
  let waterWeight = $derived(waterLiters * WATER_WEIGHT_PER_LITER);
  let totalPackWeight = $derived(baseWeightLbs + foodWeight + waterWeight);

  let baseWeightClass = $derived(
    baseWeightLbs < 10 ? { label: 'Ultralight', color: '#22c55e' }
    : baseWeightLbs < 15 ? { label: 'Lightweight', color: '#84cc16' }
    : baseWeightLbs < 20 ? { label: 'Traditional', color: '#eab308' }
    : { label: 'Heavy', color: '#ef4444' }
  );

  let totalWeightClass = $derived.by(() => {
    if (totalPackWeight <= 20) return { label: 'ULTRALIGHT', color: '#22c55e', icon: '🪶', desc: 'Exceptional. Your joints will thank you.' };
    if (totalPackWeight <= 28) return { label: 'LIGHT', color: '#84cc16', icon: '✓', desc: 'Great weight. Sustainable for big miles.' };
    if (totalPackWeight <= 35) return { label: 'MODERATE', color: '#eab308', icon: '⚖️', desc: 'Average pack. Watch knees on descents.' };
    if (totalPackWeight <= 42) return { label: 'HEAVY', color: '#f97316', icon: '⚠️', desc: 'Above average. Consider reducing.' };
    return { label: 'VERY HEAVY', color: '#ef4444', icon: '🚨', desc: 'Risk of injury over time.' };
  });

  let jointStress = $derived.by(() => {
    const overBase = Math.max(0, totalPackWeight - 20);
    const stressLevel = Math.min(100, (overBase / 30) * 100);
    return {
      level: stressLevel,
      risk: stressLevel > 70 ? 'high' : stressLevel > 40 ? 'moderate' : 'low',
    };
  });

  let weightPercents = $derived({
    base: (baseWeightLbs / totalPackWeight) * 100,
    food: (foodWeight / totalPackWeight) * 100,
    water: (waterWeight / totalPackWeight) * 100,
  });

  let itemsByCategory = $derived(
    seasonItems.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {})
  );

  let categoryWeights = $derived(
    Object.entries(itemsByCategory).map(([catId, items]) => {
      const weight = items.filter(i => !i.worn).reduce((sum, i) => sum + i.weight, 0);
      return {
        id: catId,
        ...categories[catId],
        weight,
        weightLbs: weight / 16,
        items: items.filter(i => !i.worn),
        wornItems: items.filter(i => i.worn)
      };
    }).filter(c => c.weight > 0 || c.wornItems.length > 0).sort((a, b) => b.weight - a.weight)
  );

  let maxCategoryWeight = $derived(Math.max(...categoryWeights.map(c => c.weight), 1));

  const big3Categories = ['shelter', 'sleep', 'pack'];
  let big3Weight = $derived(categoryWeights.filter(c => big3Categories.includes(c.id)).reduce((sum, c) => sum + c.weight, 0));
  let big3WeightLbs = $derived(big3Weight / 16);
  let big3Breakdown = $derived(
    big3Categories.map(catId => {
      const cat = categoryWeights.find(c => c.id === catId);
      return cat || { id: catId, name: categories[catId]?.name || catId, weight: 0, icon: categories[catId]?.icon || '?' };
    })
  );
  let big3Percent = $derived(baseWeightOz > 0 ? (big3Weight / baseWeightOz) * 100 : 0);

  let weightTips = $derived.by(() => {
    const tips = [];
    const shelterCat = categoryWeights.find(c => c.id === 'shelter');
    const sleepCat = categoryWeights.find(c => c.id === 'sleep');
    const packCat = categoryWeights.find(c => c.id === 'pack');
    if (shelterCat && shelterCat.weight > 48) tips.push({ icon: '🏕️', text: 'Shelter over 3 lbs—consider a tarp/hammock or DCF tent' });
    if (sleepCat && sleepCat.weight > 56) tips.push({ icon: '😴', text: 'Sleep system over 3.5 lbs—quilt + inflatable pad saves weight' });
    if (packCat && packCat.weight > 48) tips.push({ icon: '🎒', text: 'Pack over 3 lbs—frameless packs work under 15 lb base' });
    if (big3WeightLbs > 12) tips.push({ icon: '⚖️', text: 'Big 3 over 12 lbs—focus here for biggest savings' });
    if (baseWeightLbs < 10 && tips.length === 0) tips.push({ icon: '🏆', text: 'Ultralight achieved! Focus on durability now' });
    if (tips.length === 0 && baseWeightLbs < 15) tips.push({ icon: '✅', text: 'Solid lightweight setup—enjoy the miles!' });
    return tips;
  });

  function toggleCategory(catId) {
    expandedCategory = expandedCategory === catId ? null : catId;
  }

  function formatWeight(oz) {
    if (oz >= 16) return `${(oz / 16).toFixed(1)} lb`;
    return `${oz.toFixed(1)} oz`;
  }
</script>

<div class="pack-builder" class:mounted>
  <!-- Header -->
  <header class="calc-header">
    <div class="header-icon">
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M17 6V4c0-1.1-.9-2-2-2H9c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-3zM9 4h6v2H9V4zm11 15H4V8h3v2h2V8h6v2h2V8h3v11z"/>
      </svg>
    </div>
    <div class="header-content">
      <h2>LOAD MASTER</h2>
      <p>Build your kit, know your weight</p>
    </div>
    <div class="header-stat">
      <span class="stat-val">{seasonItems.length}</span>
      <span class="stat-lbl">items</span>
    </div>
  </header>

  <!-- Tab Navigation -->
  <div class="tab-nav">
    <button class="tab-btn" class:active={activeTab === 'builder'} onclick={() => activeTab = 'builder'}>
      <span class="tab-icon">🎒</span>
      Loadout
    </button>
    <button class="tab-btn" class:active={activeTab === 'loadout'} onclick={() => activeTab = 'loadout'}>
      <span class="tab-icon">⚖️</span>
      Weight
    </button>
  </div>

  <!-- Weight Hero -->
  <section class="weight-hero">
    <div class="weight-display">
      <div class="weight-ring" style="--ring-color: {totalWeightClass.color}">
        <svg viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="52" class="ring-bg"/>
          <circle cx="60" cy="60" r="52" class="ring-fill" style="stroke-dasharray: {Math.min(100, totalPackWeight / 50 * 100) * 3.267} 326.7"/>
        </svg>
        <div class="weight-center">
          <span class="weight-num">{totalPackWeight.toFixed(1)}</span>
          <span class="weight-unit">lbs</span>
        </div>
      </div>
      <div class="weight-meta">
        <div class="weight-class" style="background: {totalWeightClass.color}">
          <span class="class-icon">{totalWeightClass.icon}</span>
          <span class="class-label">{totalWeightClass.label}</span>
        </div>
        <p class="weight-desc">{totalWeightClass.desc}</p>
      </div>
    </div>

    <!-- Weight Bar -->
    <div class="weight-bar">
      <div class="bar-track">
        <div class="bar-seg base" style="width: {weightPercents.base}%"></div>
        <div class="bar-seg food" style="width: {weightPercents.food}%"></div>
        <div class="bar-seg water" style="width: {weightPercents.water}%"></div>
      </div>
      <div class="bar-legend">
        <span class="legend-item"><span class="dot base"></span>Base {baseWeightLbs.toFixed(1)} lb</span>
        <span class="legend-item"><span class="dot food"></span>Food {foodWeight.toFixed(1)} lb</span>
        <span class="legend-item"><span class="dot water"></span>Water {waterWeight.toFixed(1)} lb</span>
      </div>
    </div>
  </section>

  {#if activeTab === 'builder'}
    <!-- Season Toggle -->
    <section class="controls-section">
      <div class="season-toggle">
        <button class="toggle-btn" class:active={season === 'winter'} onclick={() => season = 'winter'}>
          <span>❄️</span> Winter Start
        </button>
        <button class="toggle-btn" class:active={season === 'summer'} onclick={() => season = 'summer'}>
          <span>☀️</span> Summer
        </button>
      </div>
      <div class="base-pill" style="--pill-color: {baseWeightClass.color}">
        Base: {baseWeightLbs.toFixed(1)} lb ({baseWeightClass.label})
      </div>
    </section>

    <!-- Big 3 Section -->
    <section class="big3-section">
      <h3 class="section-header">
        <span class="header-bar"></span>
        THE BIG 3
        <span class="big3-badge">{big3Percent.toFixed(0)}% of base</span>
      </h3>
      <div class="big3-grid">
        {#each big3Breakdown as cat}
          <div class="big3-card">
            <span class="big3-icon">{cat.icon}</span>
            <span class="big3-name">{cat.name}</span>
            <span class="big3-weight">{(cat.weight / 16).toFixed(1)} lb</span>
          </div>
        {/each}
        <div class="big3-card total">
          <span class="big3-icon">🎯</span>
          <span class="big3-name">Total</span>
          <span class="big3-weight">{big3WeightLbs.toFixed(1)} lb</span>
        </div>
      </div>

      {#if weightTips.length > 0}
        <div class="tips-grid">
          {#each weightTips as tip}
            <div class="tip-card">
              <span class="tip-icon">{tip.icon}</span>
              <span class="tip-text">{tip.text}</span>
            </div>
          {/each}
        </div>
      {/if}
    </section>

    <!-- Category Breakdown -->
    <section class="categories-section">
      <h3 class="section-header">
        <span class="header-bar"></span>
        GEAR BREAKDOWN
      </h3>
      <div class="category-list">
        {#each categoryWeights as cat}
          <div class="category-card" class:expanded={expandedCategory === cat.id}>
            <button class="cat-header" onclick={() => toggleCategory(cat.id)}>
              <span class="cat-icon">{cat.icon}</span>
              <div class="cat-info">
                <div class="cat-top">
                  <span class="cat-name">{cat.name}</span>
                  <span class="cat-weight">{formatWeight(cat.weight)}</span>
                </div>
                <div class="cat-bar">
                  <div class="cat-fill" style="width: {(cat.weight / maxCategoryWeight) * 100}%; background: {cat.color}"></div>
                </div>
              </div>
              <span class="cat-chevron">▼</span>
            </button>
            {#if expandedCategory === cat.id}
              <div class="cat-items" transition:slide>
                {#each cat.items as item}
                  <div class="gear-item">
                    <span class="item-name">{item.name}</span>
                    {#if item.tier === 1}<span class="item-tag essential">Essential</span>{/if}
                    <span class="item-weight">{formatWeight(item.weight)}</span>
                  </div>
                {/each}
                {#each cat.wornItems as item}
                  <div class="gear-item worn">
                    <span class="item-name">{item.name}</span>
                    <span class="item-tag worn">Worn</span>
                    <span class="item-weight">{formatWeight(item.weight)}</span>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </section>

  {:else}
    <!-- Consumables Controls -->
    <section class="consumables-section">
      <h3 class="section-header">
        <span class="header-bar"></span>
        CONSUMABLES
      </h3>
      <div class="consumables-grid">
        <div class="consumable-card">
          <label>FOOD (days)</label>
          <div class="stepper">
            <button onclick={() => foodDays = Math.max(0, foodDays - 1)}>−</button>
            <span class="stepper-val">{foodDays}</span>
            <button onclick={() => foodDays = Math.min(10, foodDays + 1)}>+</button>
          </div>
          <span class="consumable-hint">{foodWeight.toFixed(1)} lbs @ {foodWeightPerDay} lb/day</span>
        </div>
        <div class="consumable-card">
          <label>WATER (liters)</label>
          <div class="stepper">
            <button onclick={() => waterLiters = Math.max(0, waterLiters - 0.5)}>−</button>
            <span class="stepper-val">{waterLiters}</span>
            <button onclick={() => waterLiters = Math.min(6, waterLiters + 0.5)}>+</button>
          </div>
          <span class="consumable-hint">{waterWeight.toFixed(1)} lbs</span>
        </div>
      </div>
    </section>

    <!-- Joint Stress -->
    <section class="stress-section">
      <div class="stress-header">
        <h4>JOINT STRESS</h4>
        <span class="stress-badge {jointStress.risk}">{jointStress.risk}</span>
      </div>
      <div class="stress-gauge">
        <div class="gauge-track">
          <div class="gauge-fill" style="width: {jointStress.level}%"></div>
        </div>
        <div class="gauge-labels">
          <span>Low</span>
          <span>Moderate</span>
          <span>High</span>
        </div>
      </div>
      <p class="stress-note">
        {#if jointStress.risk === 'low'}Good weight for sustained miles
        {:else if jointStress.risk === 'moderate'}Take care on descents, especially rocky terrain
        {:else}Consider reducing weight to prevent long-term injury{/if}
      </p>
    </section>

    <!-- Tips -->
    <section class="tips-section">
      <h4>WEIGHT REDUCTION TIPS</h4>
      <ul class="tips-list">
        <li><strong>Consumables first</strong> — Carry 3-4 days food, not 5-6</li>
        <li><strong>Camel up</strong> — Drink at sources, carry less water</li>
        <li><strong>Worn weight</strong> — Heavy items on body, not in pack</li>
        <li><strong>Multi-use items</strong> — Puffy is pillow, bandana is towel</li>
      </ul>
    </section>
  {/if}

  <!-- Guide Link -->
  <a href="/guide/03-gear-system" class="guide-link">
    <span>Read the Gear Philosophy Guide</span>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  </a>
</div>

<style>
  .pack-builder {
    background: var(--bg);
    border: 2px solid var(--border);
    border-radius: 16px;
    overflow: hidden;
    opacity: 0;
    transform: translateY(12px);
    transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .pack-builder.mounted {
    opacity: 1;
    transform: translateY(0);
  }

  /* Header */
  .calc-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.25rem 1.5rem;
    background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
    border-bottom: 2px solid #1f2937;
  }

  .header-icon {
    width: 48px;
    height: 48px;
    background: rgba(255,255,255,0.1);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #d1d5db;
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
    color: #9ca3af;
  }

  .header-stat {
    text-align: center;
    padding: 0.5rem 0.75rem;
    background: rgba(0,0,0,0.2);
    border-radius: 8px;
  }

  .stat-val {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: #fff;
  }

  .stat-lbl {
    font-size: 0.65rem;
    color: #9ca3af;
    text-transform: uppercase;
  }

  /* Tab Nav */
  .tab-nav {
    display: flex;
    border-bottom: 2px solid var(--border);
    background: #fff;
  }

  .tab-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 1rem;
    background: transparent;
    border: none;
    cursor: pointer;
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--muted);
    border-bottom: 3px solid transparent;
    margin-bottom: -2px;
    transition: all 0.2s;
  }

  .tab-btn:hover {
    color: var(--ink);
  }

  .tab-btn.active {
    color: var(--pine);
    border-bottom-color: var(--pine);
    background: rgba(77, 89, 74, 0.05);
  }

  .tab-icon {
    font-size: 1rem;
  }

  /* Weight Hero */
  .weight-hero {
    padding: 1.5rem;
    background: #fff;
    border-bottom: 2px solid var(--border);
  }

  .weight-display {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .weight-ring {
    position: relative;
    width: 120px;
    height: 120px;
    flex-shrink: 0;
  }

  .weight-ring svg {
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
  }

  .ring-bg {
    fill: none;
    stroke: var(--border);
    stroke-width: 10;
  }

  .ring-fill {
    fill: none;
    stroke: var(--ring-color);
    stroke-width: 10;
    stroke-linecap: round;
    transition: stroke-dasharray 0.5s ease;
  }

  .weight-center {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .weight-num {
    font-family: Oswald, sans-serif;
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--ink);
    line-height: 1;
  }

  .weight-unit {
    font-size: 0.7rem;
    color: var(--muted);
    text-transform: uppercase;
  }

  .weight-meta {
    flex: 1;
  }

  .weight-class {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.35rem 0.75rem;
    border-radius: 6px;
    color: #fff;
  }

  .class-icon {
    font-size: 0.9rem;
  }

  .class-label {
    font-family: Oswald, sans-serif;
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.08em;
  }

  .weight-desc {
    margin: 0.5rem 0 0;
    font-size: 0.85rem;
    color: var(--muted);
  }

  /* Weight Bar */
  .weight-bar {
    margin-top: 1rem;
  }

  .bar-track {
    display: flex;
    height: 20px;
    border-radius: 10px;
    overflow: hidden;
    border: 2px solid var(--border);
  }

  .bar-seg {
    transition: width 0.4s ease;
  }

  .bar-seg.base { background: var(--pine); }
  .bar-seg.food { background: var(--terra); }
  .bar-seg.water { background: #3b82f6; }

  .bar-legend {
    display: flex;
    justify-content: center;
    gap: 1.25rem;
    margin-top: 0.75rem;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.75rem;
    color: var(--muted);
  }

  .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }

  .dot.base { background: var(--pine); }
  .dot.food { background: var(--terra); }
  .dot.water { background: #3b82f6; }

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

  /* Controls Section */
  .controls-section {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1.25rem 1.5rem;
    background: var(--bg);
    border-bottom: 2px solid var(--border);
    flex-wrap: wrap;
  }

  .season-toggle {
    display: flex;
    background: #fff;
    border: 2px solid var(--border);
    border-radius: 10px;
    overflow: hidden;
  }

  .toggle-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 1rem;
    border: none;
    background: transparent;
    font-family: Oswald, sans-serif;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--muted);
    cursor: pointer;
    transition: all 0.2s;
  }

  .toggle-btn:first-child {
    border-right: 2px solid var(--border);
  }

  .toggle-btn.active {
    background: var(--pine);
    color: #fff;
  }

  .base-pill {
    padding: 0.4rem 0.75rem;
    background: color-mix(in srgb, var(--pill-color) 15%, white);
    border: 2px solid var(--pill-color);
    border-radius: 20px;
    font-family: Oswald, sans-serif;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--pill-color);
  }

  /* Big 3 Section */
  .big3-section {
    padding: 1.5rem;
    background: #fff;
    border-bottom: 2px solid var(--border);
  }

  .big3-badge {
    margin-left: auto;
    padding: 0.2rem 0.5rem;
    background: var(--alpine);
    color: #fff;
    border-radius: 4px;
    font-size: 0.65rem;
    letter-spacing: 0.03em;
  }

  .big3-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.75rem;
  }

  .big3-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 1rem 0.5rem;
    background: var(--bg);
    border: 2px solid var(--border);
    border-radius: 10px;
  }

  .big3-card.total {
    background: var(--pine);
    border-color: var(--pine);
  }

  .big3-card.total .big3-name,
  .big3-card.total .big3-weight {
    color: #fff;
  }

  .big3-icon {
    font-size: 1.35rem;
  }

  .big3-name {
    font-family: Oswald, sans-serif;
    font-size: 0.65rem;
    font-weight: 600;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .big3-weight {
    font-family: Oswald, sans-serif;
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--pine);
  }

  .tips-grid {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 1.25rem;
  }

  .tip-card {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: var(--bg);
    border: 2px solid var(--border);
    border-radius: 8px;
    font-size: 0.8rem;
    color: var(--ink);
  }

  .tip-icon {
    font-size: 1rem;
    flex-shrink: 0;
  }

  /* Categories Section */
  .categories-section {
    padding: 1.5rem;
    background: var(--bg);
  }

  .category-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .category-card {
    background: #fff;
    border: 2px solid var(--border);
    border-radius: 10px;
    overflow: hidden;
    transition: all 0.2s;
  }

  .category-card.expanded {
    border-color: var(--alpine);
  }

  .cat-header {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
  }

  .cat-icon {
    font-size: 1.25rem;
    width: 1.5rem;
    text-align: center;
  }

  .cat-info {
    flex: 1;
  }

  .cat-top {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.35rem;
  }

  .cat-name {
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--ink);
  }

  .cat-weight {
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--pine);
  }

  .cat-bar {
    height: 6px;
    background: var(--border);
    border-radius: 3px;
    overflow: hidden;
  }

  .cat-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.4s ease;
  }

  .cat-chevron {
    font-size: 0.6rem;
    color: var(--muted);
    transition: transform 0.2s;
  }

  .category-card.expanded .cat-chevron {
    transform: rotate(180deg);
    color: var(--pine);
  }

  .cat-items {
    padding: 0 1rem 0.75rem;
    border-top: 2px solid var(--border);
    background: var(--bg);
  }

  .gear-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0;
    border-bottom: 1px dashed var(--border);
    font-size: 0.8rem;
  }

  .gear-item:last-child {
    border-bottom: none;
  }

  .item-name {
    flex: 1;
    color: var(--ink);
  }

  .item-weight {
    font-family: Oswald, sans-serif;
    font-size: 0.75rem;
    color: var(--muted);
  }

  .item-tag {
    font-size: 0.55rem;
    padding: 0.15rem 0.35rem;
    border-radius: 4px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .item-tag.essential {
    background: var(--pine);
    color: #fff;
  }

  .item-tag.worn {
    background: var(--muted);
    color: #fff;
  }

  /* Consumables Section */
  .consumables-section {
    padding: 1.5rem;
    background: #fff;
    border-bottom: 2px solid var(--border);
  }

  .consumables-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
  }

  .consumable-card label {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 0.7rem;
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

  .stepper-val {
    flex: 1;
    text-align: center;
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--ink);
  }

  .consumable-hint {
    display: block;
    margin-top: 0.35rem;
    font-size: 0.7rem;
    color: var(--muted);
  }

  /* Stress Section */
  .stress-section {
    padding: 1.5rem;
    background: var(--bg);
    border-bottom: 2px solid var(--border);
  }

  .stress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .stress-header h4 {
    margin: 0;
    font-family: Oswald, sans-serif;
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--ink);
    letter-spacing: 0.05em;
  }

  .stress-badge {
    font-family: Oswald, sans-serif;
    font-size: 0.7rem;
    font-weight: 700;
    padding: 0.25rem 0.6rem;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .stress-badge.low {
    background: #dcfce7;
    color: #166534;
  }

  .stress-badge.moderate {
    background: #fef3c7;
    color: #92400e;
  }

  .stress-badge.high {
    background: #fee2e2;
    color: #991b1b;
  }

  .stress-gauge {
    margin-bottom: 0.75rem;
  }

  .gauge-track {
    height: 12px;
    background: linear-gradient(90deg, #22c55e, #eab308, #ef4444);
    border-radius: 6px;
    border: 2px solid var(--border);
    position: relative;
    overflow: hidden;
  }

  .gauge-fill {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    background: rgba(0,0,0,0.2);
    transition: width 0.4s ease;
  }

  .gauge-labels {
    display: flex;
    justify-content: space-between;
    font-size: 0.65rem;
    color: var(--muted);
    margin-top: 0.35rem;
  }

  .stress-note {
    margin: 0;
    font-size: 0.8rem;
    color: var(--muted);
  }

  /* Tips Section */
  .tips-section {
    padding: 1.5rem;
    background: #fff;
    border-bottom: 2px solid var(--border);
  }

  .tips-section h4 {
    margin: 0 0 1rem;
    font-family: Oswald, sans-serif;
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--pine);
    letter-spacing: 0.05em;
  }

  .tips-list {
    margin: 0;
    padding-left: 1.25rem;
    font-size: 0.85rem;
    color: var(--ink);
  }

  .tips-list li {
    margin-bottom: 0.5rem;
  }

  .tips-list strong {
    color: var(--pine);
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
    .weight-display {
      flex-direction: column;
      text-align: center;
    }

    .controls-section {
      flex-direction: column;
      align-items: stretch;
    }

    .big3-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .consumables-grid {
      grid-template-columns: 1fr;
    }

    .header-stat {
      display: none;
    }
  }
</style>
