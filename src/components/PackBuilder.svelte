<script>
  import { onMount } from 'svelte';
  import { slide } from 'svelte/transition';
  import gearData from '../data/gear.json';

  let { trailContext = {} } = $props();

  // State
  let season = $state('winter');
  let mounted = $state(false);
  let expandedCategory = $state(null);
  let activeTab = $state('builder'); // 'builder' or 'loadout'

  // Consumables state
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

  // Get items for current season
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

  // Derived values
  let seasonItems = $derived(getSeasonItems(gearData.items, season));

  let baseWeightOz = $derived(
    seasonItems.filter(item => !item.worn).reduce((sum, item) => sum + item.weight, 0)
  );

  let wornWeightOz = $derived(
    seasonItems.filter(item => item.worn).reduce((sum, item) => sum + item.weight, 0)
  );

  let baseWeightLbs = $derived(baseWeightOz / 16);
  let wornWeightLbs = $derived(wornWeightOz / 16);

  // Consumables
  let foodWeight = $derived(foodDays * foodWeightPerDay);
  let waterWeight = $derived(waterLiters * WATER_WEIGHT_PER_LITER);
  let totalPackWeight = $derived(baseWeightLbs + foodWeight + waterWeight);

  // Weight classes
  let baseWeightClass = $derived(
    baseWeightLbs < 10 ? { label: 'Ultralight', color: '#22c55e' }
    : baseWeightLbs < 15 ? { label: 'Lightweight', color: 'var(--alpine)' }
    : baseWeightLbs < 20 ? { label: 'Traditional', color: 'var(--terra)' }
    : { label: 'Heavy', color: '#dc2626' }
  );

  let totalWeightClass = $derived.by(() => {
    if (totalPackWeight <= 20) return { label: 'Ultralight', color: '#16a34a', icon: '🪶', desc: 'Exceptional. Your joints will thank you.' };
    if (totalPackWeight <= 28) return { label: 'Light', color: '#22c55e', icon: '✓', desc: 'Great weight. Sustainable for big miles.' };
    if (totalPackWeight <= 35) return { label: 'Moderate', color: '#ca8a04', icon: '⚖️', desc: 'Average pack. Watch knees on descents.' };
    if (totalPackWeight <= 42) return { label: 'Heavy', color: '#ea580c', icon: '⚠️', desc: 'Above average. Consider reducing.' };
    return { label: 'Very Heavy', color: '#dc2626', icon: '🚨', desc: 'Risk of injury over time.' };
  });

  // Joint stress
  let jointStress = $derived.by(() => {
    const overBase = Math.max(0, totalPackWeight - 20);
    const stressLevel = Math.min(100, (overBase / 30) * 100);
    return {
      level: stressLevel,
      risk: stressLevel > 70 ? 'high' : stressLevel > 40 ? 'moderate' : 'low',
    };
  });

  // Weight percentages
  let weightPercents = $derived({
    base: (baseWeightLbs / totalPackWeight) * 100,
    food: (foodWeight / totalPackWeight) * 100,
    water: (waterWeight / totalPackWeight) * 100,
  });

  // Category breakdown
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

  // Big 3
  const big3Categories = ['shelter', 'sleep', 'pack'];
  let big3Weight = $derived(
    categoryWeights.filter(c => big3Categories.includes(c.id)).reduce((sum, c) => sum + c.weight, 0)
  );
  let big3WeightLbs = $derived(big3Weight / 16);
  let big3Breakdown = $derived(
    big3Categories.map(catId => {
      const cat = categoryWeights.find(c => c.id === catId);
      return cat || { id: catId, name: categories[catId]?.name || catId, weight: 0, icon: categories[catId]?.icon || '?' };
    })
  );
  let big3Percent = $derived(baseWeightOz > 0 ? (big3Weight / baseWeightOz) * 100 : 0);

  // Weight tips
  let weightTips = $derived.by(() => {
    const tips = [];
    const shelterCat = categoryWeights.find(c => c.id === 'shelter');
    const sleepCat = categoryWeights.find(c => c.id === 'sleep');
    const packCat = categoryWeights.find(c => c.id === 'pack');

    if (shelterCat && shelterCat.weight > 48) tips.push({ icon: '🏕️', text: 'Shelter over 3 lbs—consider a tarp/hammock setup or DCF tent' });
    if (sleepCat && sleepCat.weight > 56) tips.push({ icon: '😴', text: 'Sleep system over 3.5 lbs—a quilt + inflatable pad can save weight' });
    if (packCat && packCat.weight > 48) tips.push({ icon: '🎒', text: 'Pack over 3 lbs—frameless packs work once base weight drops below 15 lbs' });
    if (big3WeightLbs > 12) tips.push({ icon: '⚖️', text: 'Big 3 total over 12 lbs—focus here for biggest weight savings' });
    if (baseWeightLbs < 10 && tips.length === 0) tips.push({ icon: '🏆', text: 'Ultralight achieved! Focus on durability and comfort now' });
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
  <header class="builder-header">
    <div class="header-inner">
      <span class="header-badge">GEAR SYSTEM</span>
      <h2 class="header-title">Pack Builder</h2>
      <p class="header-sub">Build your kit, know your weight</p>
    </div>
  </header>

  <!-- Tab Navigation -->
  <div class="tab-nav">
    <button class="tab-btn" class:active={activeTab === 'builder'} onclick={() => activeTab = 'builder'}>
      <span class="tab-icon">🎒</span>
      <span>Loadout</span>
    </button>
    <button class="tab-btn" class:active={activeTab === 'loadout'} onclick={() => activeTab = 'loadout'}>
      <span class="tab-icon">⚖️</span>
      <span>Weight</span>
    </button>
  </div>

  <!-- Main Weight Display -->
  <div class="weight-hero">
    <div class="weight-main">
      <span class="weight-num" style="color: {totalWeightClass.color}">{totalPackWeight.toFixed(1)}</span>
      <span class="weight-unit">lbs</span>
    </div>
    <div class="weight-class" style="background: {totalWeightClass.color}15; color: {totalWeightClass.color}">
      {totalWeightClass.icon} {totalWeightClass.label}
    </div>
    <p class="weight-desc">{totalWeightClass.desc}</p>

    <!-- Weight Bar -->
    <div class="weight-bar">
      <div class="bar-seg base" style="width: {weightPercents.base}%"></div>
      <div class="bar-seg food" style="width: {weightPercents.food}%"></div>
      <div class="bar-seg water" style="width: {weightPercents.water}%"></div>
    </div>
    <div class="bar-legend">
      <span><span class="dot base"></span>Base {baseWeightLbs.toFixed(1)} lb</span>
      <span><span class="dot food"></span>Food {foodWeight.toFixed(1)} lb</span>
      <span><span class="dot water"></span>Water {waterWeight.toFixed(1)} lb</span>
    </div>
  </div>

  {#if activeTab === 'builder'}
    <!-- Season Toggle -->
    <div class="controls-row">
      <div class="toggle-container">
        <button class="toggle-btn" class:active={season === 'winter'} onclick={() => season = 'winter'}>
          <span class="toggle-icon">❄️</span>
          <span>Winter Start</span>
        </button>
        <button class="toggle-btn" class:active={season === 'summer'} onclick={() => season = 'summer'}>
          <span class="toggle-icon">☀️</span>
          <span>Summer</span>
        </button>
      </div>
      <div class="base-weight-pill" style="background: {baseWeightClass.color}15; color: {baseWeightClass.color}">
        Base: {baseWeightLbs.toFixed(1)} lb ({baseWeightClass.label})
      </div>
    </div>

    <!-- Big 3 Section -->
    <div class="big3-section">
      <h3 class="section-title">
        <span class="title-blaze"></span>
        <span>The Big 3</span>
        <span class="big3-tag">{big3Percent.toFixed(0)}% of base</span>
      </h3>
      <div class="big3-grid">
        {#each big3Breakdown as cat}
          <div class="big3-item">
            <span class="big3-icon">{cat.icon}</span>
            <span class="big3-name">{cat.name}</span>
            <span class="big3-weight">{(cat.weight / 16).toFixed(1)} lb</span>
          </div>
        {/each}
        <div class="big3-item total">
          <span class="big3-icon">🎯</span>
          <span class="big3-name">Total</span>
          <span class="big3-weight">{big3WeightLbs.toFixed(1)} lb</span>
        </div>
      </div>
      {#if weightTips.length > 0}
        <div class="weight-tips">
          {#each weightTips as tip}
            <div class="weight-tip">
              <span class="tip-icon">{tip.icon}</span>
              <span class="tip-text">{tip.text}</span>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Category Breakdown -->
    <div class="gear-breakdown">
      <h3 class="section-title">
        <span class="title-blaze"></span>
        <span>Gear Breakdown</span>
      </h3>
      <div class="category-list">
        {#each categoryWeights as cat}
          <div class="category-card" class:expanded={expandedCategory === cat.id}>
            <button class="category-header" onclick={() => toggleCategory(cat.id)}>
              <span class="cat-icon">{cat.icon}</span>
              <div class="cat-info">
                <div class="cat-top">
                  <span class="cat-name">{cat.name}</span>
                  <span class="cat-weight">{formatWeight(cat.weight)}</span>
                </div>
                <div class="cat-bar-bg">
                  <div class="cat-bar-fill" style="width: {(cat.weight / maxCategoryWeight) * 100}%; background: {cat.color}"></div>
                </div>
              </div>
              <span class="cat-arrow">▼</span>
            </button>
            {#if expandedCategory === cat.id}
              <div class="cat-items" transition:slide>
                {#each cat.items as item}
                  <div class="gear-row">
                    <span class="item-name">{item.name}</span>
                    {#if item.tier === 1}<span class="tag essential">Essential</span>{/if}
                    <span class="item-weight">{formatWeight(item.weight)}</span>
                  </div>
                {/each}
                {#each cat.wornItems as item}
                  <div class="gear-row worn">
                    <span class="item-name">{item.name}</span>
                    <span class="tag worn">Worn</span>
                    <span class="item-weight">{formatWeight(item.weight)}</span>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>

  {:else}
    <!-- Consumables Controls -->
    <div class="consumables-section">
      <h3 class="section-title">
        <span class="title-blaze"></span>
        <span>Consumables</span>
      </h3>
      <div class="consumable-row">
        <div class="consumable-item">
          <label>Food (days)</label>
          <div class="stepper">
            <button onclick={() => foodDays = Math.max(0, foodDays - 1)}>−</button>
            <span class="stepper-value">{foodDays}</span>
            <button onclick={() => foodDays = Math.min(10, foodDays + 1)}>+</button>
          </div>
          <span class="consumable-hint">{foodWeight.toFixed(1)} lbs @ {foodWeightPerDay} lb/day</span>
        </div>
        <div class="consumable-item">
          <label>Water (liters)</label>
          <div class="stepper">
            <button onclick={() => waterLiters = Math.max(0, waterLiters - 0.5)}>−</button>
            <span class="stepper-value">{waterLiters}</span>
            <button onclick={() => waterLiters = Math.min(6, waterLiters + 0.5)}>+</button>
          </div>
          <span class="consumable-hint">{waterWeight.toFixed(1)} lbs</span>
        </div>
      </div>
    </div>

    <!-- Joint Stress Indicator -->
    <div class="stress-section">
      <div class="stress-header">
        <h4>Joint Stress</h4>
        <span class="stress-risk {jointStress.risk}">{jointStress.risk}</span>
      </div>
      <div class="stress-bar">
        <div class="stress-fill" style="width: {jointStress.level}%"></div>
      </div>
      <p class="stress-note">
        {#if jointStress.risk === 'low'}Good weight for sustained miles
        {:else if jointStress.risk === 'moderate'}Take care on descents, especially rocky terrain
        {:else}Consider reducing weight to prevent long-term injury{/if}
      </p>
    </div>

    <!-- Quick Tips -->
    <div class="tips-section">
      <h4>Weight Reduction Tips</h4>
      <ul>
        <li><strong>Consumables first</strong> — Carry 3-4 days food, not 5-6</li>
        <li><strong>Camel up</strong> — Drink at sources, carry less water</li>
        <li><strong>Worn weight</strong> — Heavy items on body, not in pack</li>
        <li><strong>Multi-use items</strong> — Puffy is pillow, bandana is towel</li>
      </ul>
    </div>
  {/if}
</div>

<style>
  .pack-builder {
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.06);
    border: 1px solid var(--border);
    overflow: hidden;
    opacity: 0;
    transform: translateY(10px);
    transition: all 0.5s ease;
  }

  .pack-builder.mounted {
    opacity: 1;
    transform: translateY(0);
  }

  /* Header */
  .builder-header {
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

  /* Tab Nav */
  .tab-nav {
    display: flex;
    border-bottom: 1px solid var(--border);
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
    transition: all 0.2s ease;
    border-bottom: 3px solid transparent;
    margin-bottom: -1px;
  }

  .tab-btn.active {
    color: var(--pine);
    border-bottom-color: var(--alpine);
    background: rgba(166, 181, 137, 0.05);
  }

  .tab-icon { font-size: 1.1rem; }

  /* Weight Hero */
  .weight-hero {
    padding: 1.5rem 2rem;
    text-align: center;
    background: var(--bg);
    border-bottom: 1px solid var(--border);
  }

  .weight-main {
    display: inline-flex;
    align-items: baseline;
    gap: 0.25rem;
  }

  .weight-num {
    font-family: Oswald, sans-serif;
    font-size: 3.5rem;
    font-weight: 700;
    line-height: 1;
  }

  .weight-unit {
    font-size: 1.25rem;
    color: var(--muted);
  }

  .weight-class {
    display: inline-block;
    margin-top: 0.5rem;
    padding: 0.25rem 0.75rem;
    border-radius: 99px;
    font-family: Oswald, sans-serif;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .weight-desc {
    margin: 0.5rem 0 1rem;
    font-size: 0.9rem;
    color: var(--muted);
  }

  .weight-bar {
    display: flex;
    height: 24px;
    border-radius: 6px;
    overflow: hidden;
    margin-bottom: 0.5rem;
  }

  .bar-seg {
    transition: width 0.3s ease;
  }

  .bar-seg.base { background: var(--pine); }
  .bar-seg.food { background: var(--terra); }
  .bar-seg.water { background: var(--alpine); }

  .bar-legend {
    display: flex;
    justify-content: center;
    gap: 1rem;
    font-size: 0.75rem;
    color: var(--muted);
  }

  .bar-legend span {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .dot.base { background: var(--pine); }
  .dot.food { background: var(--terra); }
  .dot.water { background: var(--alpine); }

  /* Controls Row */
  .controls-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1rem 2rem;
    border-bottom: 1px solid var(--border);
    flex-wrap: wrap;
  }

  .toggle-container {
    display: flex;
    background: #f5f5f5;
    padding: 0.25rem;
    border-radius: 8px;
    gap: 0.25rem;
  }

  .toggle-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    border: none;
    background: transparent;
    border-radius: 6px;
    font-family: Oswald, sans-serif;
    font-size: 0.8rem;
    color: var(--muted);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .toggle-btn.active {
    background: #fff;
    color: var(--pine);
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    font-weight: 600;
  }

  .toggle-icon { font-size: 0.9rem; }

  .base-weight-pill {
    padding: 0.35rem 0.75rem;
    border-radius: 99px;
    font-family: Oswald, sans-serif;
    font-size: 0.75rem;
    font-weight: 600;
  }

  /* Section Titles */
  .section-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--pine);
    margin: 0 0 1rem;
  }

  .title-blaze {
    width: 6px;
    height: 14px;
    background: var(--marker);
    border-radius: 2px;
  }

  /* Big 3 Section */
  .big3-section {
    padding: 1.5rem 2rem;
    background: linear-gradient(135deg, rgba(166, 181, 137, 0.08), rgba(166, 181, 137, 0.02));
    border-bottom: 1px solid var(--border);
  }

  .big3-tag {
    margin-left: auto;
    font-size: 0.6rem;
    padding: 0.2rem 0.5rem;
    background: var(--alpine);
    color: #fff;
    border-radius: 4px;
    letter-spacing: 0.05em;
  }

  .big3-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
  }

  .big3-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.75rem;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    border: 1px solid rgba(0,0,0,0.05);
  }

  .big3-item.total {
    background: var(--pine);
  }

  .big3-item.total .big3-name,
  .big3-item.total .big3-weight {
    color: #fff;
  }

  .big3-icon { font-size: 1.25rem; }

  .big3-name {
    font-family: Oswald, sans-serif;
    font-size: 0.65rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--muted);
  }

  .big3-weight {
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 700;
    color: var(--pine);
  }

  .weight-tips {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .weight-tip {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: #fff;
    border-radius: 6px;
    border: 1px solid rgba(0,0,0,0.05);
    font-size: 0.8rem;
    color: var(--ink);
  }

  .tip-icon { flex-shrink: 0; }

  /* Gear Breakdown */
  .gear-breakdown {
    padding: 1.5rem 2rem;
    background: var(--bg);
  }

  .category-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .category-card {
    background: #fff;
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.03);
    border: 1px solid rgba(0,0,0,0.05);
    overflow: hidden;
    transition: all 0.2s ease;
  }

  .category-card.expanded {
    box-shadow: 0 4px 12px rgba(0,0,0,0.06);
    border-color: var(--alpine);
  }

  .category-header {
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

  .cat-icon { font-size: 1.25rem; width: 1.5rem; text-align: center; }
  .cat-info { flex: 1; }

  .cat-top {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.25rem;
  }

  .cat-name {
    font-family: Oswald, sans-serif;
    font-weight: 500;
    color: var(--ink);
    font-size: 0.85rem;
  }

  .cat-weight {
    font-family: Oswald, sans-serif;
    font-weight: 600;
    color: var(--pine);
    font-size: 0.8rem;
  }

  .cat-bar-bg {
    height: 3px;
    background: #f0f0f0;
    border-radius: 2px;
    overflow: hidden;
  }

  .cat-bar-fill {
    height: 100%;
    border-radius: 2px;
  }

  .cat-arrow {
    font-size: 0.6rem;
    color: var(--stone);
    transition: transform 0.2s ease;
  }

  .category-card.expanded .cat-arrow {
    transform: rotate(180deg);
    color: var(--pine);
  }

  .cat-items {
    padding: 0 1rem 0.75rem;
    border-top: 1px solid rgba(0,0,0,0.05);
    background: #fafaf9;
  }

  .gear-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.4rem 0;
    border-bottom: 1px dashed rgba(0,0,0,0.05);
    font-size: 0.8rem;
    gap: 0.5rem;
  }

  .gear-row:last-child { border-bottom: none; }

  .item-name { color: var(--ink); flex: 1; }

  .item-weight {
    font-family: Oswald, sans-serif;
    color: var(--muted);
    font-size: 0.75rem;
  }

  .tag {
    font-size: 0.55rem;
    padding: 0.1rem 0.25rem;
    border-radius: 3px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    flex-shrink: 0;
  }

  .tag.essential { background: var(--pine); color: #fff; }
  .tag.worn { background: var(--stone); color: #fff; }

  /* Consumables Section */
  .consumables-section {
    padding: 1.5rem 2rem;
    border-bottom: 1px solid var(--border);
  }

  .consumable-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
  }

  .consumable-item label {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 0.5rem;
  }

  .stepper {
    display: flex;
    align-items: center;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
  }

  .stepper button {
    width: 40px;
    height: 40px;
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
    font-size: 1.25rem;
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
    padding: 1.25rem 2rem;
    background: var(--bg);
    border-bottom: 1px solid var(--border);
  }

  .stress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  .stress-header h4 {
    margin: 0;
    font-family: Oswald, sans-serif;
    font-size: 0.8rem;
    color: var(--ink);
  }

  .stress-risk {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
  }

  .stress-risk.low { background: #dcfce7; color: #166534; }
  .stress-risk.moderate { background: #fef3c7; color: #92400e; }
  .stress-risk.high { background: #fee2e2; color: #991b1b; }

  .stress-bar {
    height: 10px;
    background: linear-gradient(90deg, #22c55e, #eab308, #dc2626);
    border-radius: 5px;
    position: relative;
    margin-bottom: 0.5rem;
  }

  .stress-fill {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    background: rgba(0,0,0,0.3);
    border-radius: 5px;
    transition: width 0.3s ease;
  }

  .stress-note {
    margin: 0;
    font-size: 0.75rem;
    color: var(--muted);
  }

  /* Tips Section */
  .tips-section {
    padding: 1.25rem 2rem;
    background: linear-gradient(135deg, rgba(166, 181, 137, 0.08), rgba(166, 181, 137, 0.02));
  }

  .tips-section h4 {
    margin: 0 0 0.75rem;
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    color: var(--pine);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .tips-section ul {
    margin: 0;
    padding-left: 1.25rem;
    font-size: 0.8rem;
    color: var(--ink);
  }

  .tips-section li { margin-bottom: 0.35rem; }
  .tips-section strong { color: var(--pine); }

  /* Responsive */
  @media (max-width: 640px) {
    .builder-header { padding: 1.5rem 1rem; }
    .header-title { font-size: 1.5rem; }
    .weight-hero { padding: 1.25rem 1rem; }
    .weight-num { font-size: 2.75rem; }
    .controls-row { padding: 1rem; flex-direction: column; align-items: stretch; }
    .big3-section { padding: 1rem; }
    .big3-grid { grid-template-columns: repeat(2, 1fr); }
    .gear-breakdown { padding: 1rem; }
    .consumables-section { padding: 1rem; }
    .consumable-row { grid-template-columns: 1fr; gap: 1rem; }
    .stress-section, .tips-section { padding: 1rem; }
  }
</style>
