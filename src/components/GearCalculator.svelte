<script>
  import { onMount } from 'svelte';
  import { slide } from 'svelte/transition';
  import gearData from '../data/gear.json';

  // State
  let season = 'winter'; // 'winter' or 'summer'
  let targetWeight = 18; // Target base weight in lbs
  let mounted = false;
  let expandedCategory = null;

  onMount(() => {
    mounted = true;
  });

  // Categories from gear data
  const categories = gearData.categories;

  // Get items for current season (handle swap groups)
  function getSeasonItems(items, currentSeason) {
    const swapGroups = {};
    const result = [];

    items.forEach(item => {
      if (item.swapGroup) {
        if (!swapGroups[item.swapGroup]) {
          swapGroups[item.swapGroup] = [];
        }
        swapGroups[item.swapGroup].push(item);
      } else {
        if (item.season === 'all' || item.season === currentSeason) {
          result.push(item);
        }
      }
    });

    Object.values(swapGroups).forEach(group => {
      const match = group.find(i => i.season === currentSeason) || group.find(i => i.season === 'all');
      if (match) result.push(match);
    });

    return result;
  }

  // Calculate weights
  $: seasonItems = getSeasonItems(gearData.items, season);

  $: baseWeightOz = seasonItems
    .filter(item => !item.worn)
    .reduce((sum, item) => sum + item.weight, 0);

  $: wornWeightOz = seasonItems
    .filter(item => item.worn)
    .reduce((sum, item) => sum + item.weight, 0);

  $: baseWeightLbs = baseWeightOz / 16;
  $: wornWeightLbs = wornWeightOz / 16;
  $: totalWeightLbs = baseWeightLbs + wornWeightLbs;

  // Weight class
  $: weightClass = baseWeightLbs < 10 ? 'Ultralight'
    : baseWeightLbs < 15 ? 'Lightweight'
    : baseWeightLbs < 20 ? 'Traditional'
    : 'Heavy';

  $: weightClassColor = baseWeightLbs < 10 ? '#22c55e'
    : baseWeightLbs < 15 ? 'var(--alpine)'
    : baseWeightLbs < 20 ? 'var(--terra)'
    : '#dc2626';

  // Group items by category
  $: itemsByCategory = seasonItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  // Category weights
  $: categoryWeights = Object.entries(itemsByCategory).map(([catId, items]) => {
    const weight = items.filter(i => !i.worn).reduce((sum, i) => sum + i.weight, 0);
    return {
      id: catId,
      ...categories[catId],
      weight,
      weightLbs: weight / 16,
      items: items.filter(i => !i.worn),
      wornItems: items.filter(i => i.worn)
    };
  }).filter(c => c.weight > 0 || c.wornItems.length > 0).sort((a, b) => b.weight - a.weight);

  // Max category weight for bar scaling
  $: maxCategoryWeight = Math.max(...categoryWeights.map(c => c.weight), 1);

  // Target weight in oz
  $: targetWeightOz = targetWeight * 16;

  // Calculate fit status
  $: itemFitStatus = (() => {
    const status = {};
    let cumulative = 0;

    const sorted = [...seasonItems]
      .filter(i => !i.worn)
      .sort((a, b) => {
        if (a.tier !== b.tier) return a.tier - b.tier;
        return b.weight - a.weight;
      });

    sorted.forEach(item => {
      cumulative += item.weight;
      status[item.id] = {
        fits: cumulative <= targetWeightOz || item.tier === 1,
        essential: item.tier === 1,
        cumulative
      };
    });

    return status;
  })();

  function toggleCategory(catId) {
    expandedCategory = expandedCategory === catId ? null : catId;
  }

  function formatWeight(oz) {
    if (oz >= 16) {
      return `${(oz / 16).toFixed(1)} lb`;
    }
    return `${oz.toFixed(1)} oz`;
  }
</script>

<div class="gear-calc">
  <!-- Header -->
  <header class="calc-header">
    <div class="header-inner">
      <span class="header-badge">PACK WEIGHT</span>
      <h2 class="header-title">Gear Calculator</h2>
      <p class="header-sub">Dial in your base weight strategy</p>
    </div>
  </header>

  <!-- Controls -->
  <div class="controls-section">
    <div class="controls-grid">
      <!-- Season Selector -->
      <div class="control-group">
        <label class="control-label">Season Profile</label>
        <div class="toggle-container">
          <button 
            class="toggle-btn" 
            class:active={season === 'winter'} 
            on:click={() => season = 'winter'}
          >
            <span class="toggle-icon">❄️</span>
            <span>Winter Start</span>
          </button>
          <button 
            class="toggle-btn" 
            class:active={season === 'summer'} 
            on:click={() => season = 'summer'}
          >
            <span class="toggle-icon">☀️</span>
            <span>Summer</span>
          </button>
        </div>
      </div>

      <!-- Target Weight Slider -->
      <div class="control-group">
        <div class="pace-header">
          <label class="control-label">Target Base Weight</label>
          <span class="pace-val">{targetWeight} <small>lbs</small></span>
        </div>
        <div class="slider-container">
          <input
            type="range"
            min="8"
            max="30"
            step="0.5"
            bind:value={targetWeight}
            class="pace-slider"
          />
        </div>
        <div class="weight-zones">
          <span class="zone-label" style="color: #22c55e">Ultralight</span>
          <span class="zone-label" style="color: var(--alpine)">Light</span>
          <span class="zone-label" style="color: var(--terra)">Trad</span>
          <span class="zone-label" style="color: #dc2626">Heavy</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Big Stats -->
  <div class="stats-grid">
    <div class="stat-card">
      <span class="stat-label">Current Base Weight</span>
      <div class="stat-main">
        <span class="stat-num" style="color: {weightClassColor}">{baseWeightLbs.toFixed(1)}</span>
        <span class="stat-unit">lbs</span>
      </div>
      <div class="stat-badge" style="background: {weightClassColor}15; color: {weightClassColor}">
        {weightClass}
      </div>
    </div>
    <div class="stat-card highlight">
      <div class="mini-stats">
        <div class="mini-stat-row">
          <span class="stat-label">Worn</span>
          <span class="mini-val">{wornWeightLbs.toFixed(1)} lbs</span>
        </div>
        <div class="mini-stat-row">
          <span class="stat-label">Total Pack</span>
          <span class="mini-val total">{(baseWeightLbs + 2.2 + 2).toFixed(1)}* lbs</span>
        </div>
        <p class="stat-note">*Includes estimated food (2lb) & water (2.2lb)</p>
      </div>
    </div>
  </div>

  <!-- Category List -->
  <div class="timeline-container">
    <h3 class="section-title">
      <span class="title-blaze"></span>
      <span>Gear Breakdown</span>
    </h3>

    <div class="timeline-list">
      {#each categoryWeights as cat}
        <div class="category-card" class:expanded={expandedCategory === cat.id}>
          <button class="category-header" on:click={() => toggleCategory(cat.id)}>
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
                {@const status = itemFitStatus[item.id] || { fits: true, essential: false }}
                <div class="gear-row" class:dimmed={!status.fits}>
                  <div class="gear-col-name">
                    <span class="item-name">{item.name}</span>
                    {#if status.essential}<span class="tag essential">Essential</span>{/if}
                  </div>
                  <span class="item-weight">{formatWeight(item.weight)}</span>
                </div>
              {/each}
              {#each cat.wornItems as item}
                <div class="gear-row worn">
                  <div class="gear-col-name">
                    <span class="item-name">{item.name}</span>
                    <span class="tag worn">Worn</span>
                  </div>
                  <span class="item-weight">{formatWeight(item.weight)}</span>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .gear-calc {
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.06);
    border: 1px solid var(--border);
    overflow: hidden;
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

  /* Controls */
  .controls-section {
    padding: 1.5rem 2rem;
    border-bottom: 1px solid var(--border);
  }

  .controls-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
  }

  .control-label {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--muted);
    margin-bottom: 0.5rem;
  }

  /* Toggle Button Group */
  .toggle-container {
    display: flex;
    background: #f5f5f5;
    padding: 0.25rem;
    border-radius: 8px;
    gap: 0.25rem;
  }

  .toggle-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.5rem;
    border: none;
    background: transparent;
    border-radius: 6px;
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
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

  .toggle-icon { font-size: 1rem; }

  /* Slider (Matching MilestoneCalculator) */
  .pace-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 0.5rem;
  }

  .pace-val {
    font-family: Oswald, sans-serif;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--pine);
  }

  .pace-val small { font-size: 0.8rem; font-weight: 400; color: var(--muted); }

  .slider-container {
    position: relative;
    height: 24px;
    display: flex;
    align-items: center;
  }

  .pace-slider {
    width: 100%;
    opacity: 1;
    -webkit-appearance: none;
    background: transparent;
    cursor: pointer;
    margin: 0;
  }

  .pace-slider::-webkit-slider-runnable-track {
    width: 100%;
    height: 6px;
    background: linear-gradient(90deg, #22c55e 0%, var(--alpine) 40%, var(--terra) 70%, #dc2626 100%);
    border-radius: 3px;
  }

  .pace-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    height: 24px;
    width: 24px;
    border-radius: 50%;
    background: #fff;
    border: 2px solid var(--pine);
    margin-top: -9px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    cursor: grab;
  }

  .weight-zones {
    display: flex;
    justify-content: space-between;
    margin-top: 0.5rem;
  }

  .zone-label {
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* Stats Grid */
  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    border-bottom: 1px solid var(--border);
  }

  .stat-card {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    border-right: 1px solid var(--border);
  }

  .stat-card:last-child { border-right: none; }
  .stat-card.highlight { background: #fdfdfc; }

  .stat-label {
    font-size: 0.75rem;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.5rem;
  }

  .stat-main {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
  }

  .stat-num {
    font-family: Oswald, sans-serif;
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--ink);
    line-height: 1;
  }

  .stat-unit {
    font-size: 1rem;
    color: var(--muted);
  }

  .stat-badge {
    align-self: flex-start;
    margin-top: 0.5rem;
    padding: 0.25rem 0.75rem;
    border-radius: 99px;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .mini-stats {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .mini-stat-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }

  .mini-val {
    font-family: Oswald, sans-serif;
    font-weight: 600;
    font-size: 1.1rem;
    color: var(--ink);
  }

  .mini-val.total {
    color: var(--terra);
  }

  .stat-note {
    font-size: 0.7rem;
    color: var(--stone);
    margin: 0.5rem 0 0;
    font-style: italic;
  }

  /* Gear List */
  .timeline-container {
    padding: 2rem;
    background: var(--bg);
  }

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
    margin: 0 0 1.5rem;
  }

  .title-blaze {
    width: 8px;
    height: 16px;
    background: var(--marker);
    border-radius: 2px;
  }

  .category-card {
    background: #fff;
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.03);
    border: 1px solid rgba(0,0,0,0.05);
    margin-bottom: 0.75rem;
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
    gap: 1rem;
    padding: 1rem;
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
  }

  .cat-icon {
    font-size: 1.5rem;
    width: 2rem;
    text-align: center;
  }

  .cat-info { flex: 1; }

  .cat-top {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.35rem;
  }

  .cat-name {
    font-family: Oswald, sans-serif;
    font-weight: 500;
    color: var(--ink);
    font-size: 0.95rem;
  }

  .cat-weight {
    font-family: Oswald, sans-serif;
    font-weight: 600;
    color: var(--pine);
    font-size: 0.9rem;
  }

  .cat-bar-bg {
    height: 4px;
    background: #f0f0f0;
    border-radius: 2px;
    overflow: hidden;
  }

  .cat-bar-fill {
    height: 100%;
    border-radius: 2px;
  }

  .cat-arrow {
    font-size: 0.7rem;
    color: var(--stone);
    transition: transform 0.2s ease;
  }

  .category-card.expanded .cat-arrow {
    transform: rotate(180deg);
    color: var(--pine);
  }

  .cat-items {
    padding: 0 1rem 1rem;
    border-top: 1px solid rgba(0,0,0,0.05);
    background: #fafaf9;
  }

  .gear-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.6rem 0;
    border-bottom: 1px dashed rgba(0,0,0,0.05);
    font-size: 0.85rem;
  }

  .gear-row:last-child { border-bottom: none; }
  .gear-row.dimmed { opacity: 0.4; }

  .gear-col-name {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .item-name { color: var(--ink); }

  .item-weight {
    font-family: Oswald, sans-serif;
    color: var(--muted);
    font-size: 0.8rem;
  }

  .tag {
    font-size: 0.6rem;
    padding: 0.1rem 0.3rem;
    border-radius: 4px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .tag.essential { background: var(--pine); color: #fff; }
  .tag.worn { background: var(--stone); color: #fff; }

  @media (max-width: 600px) {
    .calc-header { padding: 1.5rem; }
    .controls-section { padding: 1.5rem; }
    .controls-grid { grid-template-columns: 1fr; gap: 1.5rem; }
    .stats-grid { grid-template-columns: 1fr; }
    .stat-card { border-right: none; border-bottom: 1px solid var(--border); }
    .stat-card:last-child { border-bottom: none; }
    .timeline-container { padding: 1rem; }
  }
</style>