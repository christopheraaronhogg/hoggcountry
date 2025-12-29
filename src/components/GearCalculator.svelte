<script>
  import { onMount } from 'svelte';
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
    : baseWeightLbs < 15 ? '#a6b589'
    : baseWeightLbs < 20 ? '#d97706'
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
    <!-- Season Selector -->
    <div class="control-block">
      <label class="block-label">Season</label>
      <div class="toggle-group">
        <button
          class="toggle-option"
          class:active={season === 'winter'}
          on:click={() => season = 'winter'}
        >
          <span class="opt-icon">❄️</span>
          <div class="opt-text">
            <span class="opt-name">Winter Start</span>
            <span class="opt-desc">Feb/Mar in GA</span>
          </div>
        </button>
        <button
          class="toggle-option"
          class:active={season === 'summer'}
          on:click={() => season = 'summer'}
        >
          <span class="opt-icon">☀️</span>
          <div class="opt-text">
            <span class="opt-name">Summer Mode</span>
            <span class="opt-desc">Post-Damascus</span>
          </div>
        </button>
      </div>
    </div>

    <!-- Target Weight Slider -->
    <div class="control-block">
      <div class="slider-header">
        <label class="block-label">Target Base Weight</label>
        <span class="slider-value">{targetWeight} lbs</span>
      </div>
      <div class="slider-container">
        <input
          type="range"
          min="8"
          max="30"
          step="0.5"
          bind:value={targetWeight}
          class="weight-slider"
        />
        <div class="slider-track-bg"></div>
      </div>
      <div class="weight-zones">
        <span class="zone ul">Ultralight</span>
        <span class="zone lw">Lightweight</span>
        <span class="zone trad">Traditional</span>
      </div>
    </div>
  </div>

  <!-- Big Stats -->
  <div class="stats-grid">
    <div class="stat-card base">
      <span class="stat-label">Base Weight</span>
      <div class="stat-number" style="color: {weightClassColor}">
        {baseWeightLbs.toFixed(1)}<span class="unit">lbs</span>
      </div>
      <div class="stat-badge" style="background: {weightClassColor}15; color: {weightClassColor}">
        {weightClass}
      </div>
    </div>
    
    <div class="stat-card other">
      <div class="mini-stat">
        <span class="mini-label">Worn</span>
        <span class="mini-val">{wornWeightLbs.toFixed(1)} lbs</span>
      </div>
      <div class="mini-stat">
        <span class="mini-label">Total</span>
        <span class="mini-val">{totalWeightLbs.toFixed(1)} lbs</span>
      </div>
    </div>
  </div>

  <!-- Target Indicator -->
  <div class="target-status">
    {#if baseWeightLbs <= targetWeight}
      <div class="status-message success">
        <span class="icon">✓</span>
        <span>You are <strong>{(targetWeight - baseWeightLbs).toFixed(1)} lbs</strong> under your target.</span>
      </div>
    {:else}
      <div class="status-message warning">
        <span class="icon">⚠️</span>
        <span>You are <strong>{(baseWeightLbs - targetWeight).toFixed(1)} lbs</strong> over your target.</span>
      </div>
    {/if}
  </div>

  <!-- Category List -->
  <div class="categories-list">
    {#each categoryWeights as cat, i}
      <div class="category-item" class:expanded={expandedCategory === cat.id}>
        <button class="category-main" on:click={() => toggleCategory(cat.id)}>
          <div class="cat-icon">{cat.icon}</div>
          <div class="cat-info">
            <div class="cat-header-row">
              <span class="cat-name">{cat.name}</span>
              <span class="cat-weight">{formatWeight(cat.weight)}</span>
            </div>
            <div class="cat-bar-track">
              <div 
                class="cat-bar-fill"
                style="width: {(cat.weight / maxCategoryWeight) * 100}%; background: {cat.color}"
              ></div>
            </div>
          </div>
          <div class="cat-arrow" class:rotated={expandedCategory === cat.id}>▼</div>
        </button>

        {#if expandedCategory === cat.id}
          <div class="cat-details" transition:slide>
            <div class="items-list">
              {#each cat.items as item}
                {@const status = itemFitStatus[item.id] || { fits: true, essential: false }}
                <div class="gear-row" class:dimmed={!status.fits}>
                  <div class="gear-name">
                    {item.name}
                    {#if status.essential}<span class="tag essential">Essential</span>{/if}
                  </div>
                  <div class="gear-weight">{formatWeight(item.weight)}</div>
                </div>
              {/each}
              {#each cat.wornItems as item}
                <div class="gear-row worn">
                  <div class="gear-name">{item.name} <span class="tag worn">Worn</span></div>
                  <div class="gear-weight">{formatWeight(item.weight)}</div>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>

<script context="module">
  import { slide } from 'svelte/transition';
</script>

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
    position: relative;
  }
  
  .header-inner {
    position: relative;
    z-index: 1;
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
    display: grid;
    gap: 1.5rem;
  }

  .block-label {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--muted);
    margin-bottom: 0.75rem;
  }

  .toggle-group {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .toggle-option {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: #fff;
    border: 1px solid var(--stone);
    border-radius: 10px;
    cursor: pointer;
    text-align: left;
    transition: all 0.2s ease;
  }

  .toggle-option:hover {
    border-color: var(--pine);
    background: rgba(166, 181, 137, 0.05);
  }

  .toggle-option.active {
    background: var(--pine);
    border-color: var(--pine);
    color: #fff;
  }
  
  .toggle-option.active .opt-desc {
    color: rgba(255,255,255,0.8);
  }

  .opt-icon { font-size: 1.5rem; }
  
  .opt-name {
    display: block;
    font-family: Oswald, sans-serif;
    font-weight: 600;
    font-size: 0.9rem;
    line-height: 1.2;
  }

  .opt-desc {
    font-size: 0.75rem;
    color: var(--muted);
    line-height: 1.2;
  }

  /* Slider */
  .slider-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 0.75rem;
  }

  .slider-header .block-label { margin: 0; }

  .slider-value {
    font-family: Oswald, sans-serif;
    font-weight: 700;
    font-size: 1.25rem;
    color: var(--pine);
  }

  .slider-container {
    position: relative;
    height: 24px;
    display: flex;
    align-items: center;
  }

  .weight-slider {
    width: 100%;
    position: absolute;
    z-index: 2;
    height: 24px;
    opacity: 0;
    cursor: pointer;
  }

  .slider-track-bg {
    width: 100%;
    height: 6px;
    background: linear-gradient(90deg, #22c55e 0%, var(--alpine) 40%, var(--terra) 70%, #dc2626 100%);
    border-radius: 3px;
  }

  /* Custom thumb styling needs to be simulated if we hide the input, 
     but keeping the native input visible is more accessible/robust. 
     Let's style the native input instead. */
  .weight-slider {
    opacity: 1;
    -webkit-appearance: none;
    background: transparent;
    margin: 0;
  }

  .weight-slider::-webkit-slider-runnable-track {
    width: 100%;
    height: 6px;
    background: linear-gradient(90deg, #22c55e 0%, var(--alpine) 40%, var(--terra) 70%, #dc2626 100%);
    border-radius: 3px;
  }

  .weight-slider::-webkit-slider-thumb {
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
    font-size: 0.7rem;
    color: var(--muted);
    text-transform: uppercase;
    font-weight: 600;
  }

  .zone.ul { color: #22c55e; }
  .zone.lw { color: var(--alpine); }
  .zone.trad { color: var(--terra); }

  /* Stats Grid */
  .stats-grid {
    display: grid;
    grid-template-columns: 1.5fr 1fr;
    border-bottom: 1px solid var(--border);
  }

  .stat-card {
    padding: 1.5rem 2rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .stat-card.base {
    border-right: 1px solid var(--border);
    align-items: flex-start;
  }

  .stat-label {
    font-size: 0.8rem;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.25rem;
  }

  .stat-number {
    font-family: Oswald, sans-serif;
    font-size: 3rem;
    font-weight: 700;
    line-height: 1;
  }

  .stat-number .unit {
    font-size: 1.25rem;
    font-weight: 600;
    margin-left: 0.25rem;
  }

  .stat-badge {
    margin-top: 0.5rem;
    padding: 0.25rem 0.75rem;
    border-radius: 99px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .stat-card.other {
    gap: 1rem;
    background: var(--bg);
  }

  .mini-stat {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }

  .mini-label {
    font-size: 0.8rem;
    color: var(--muted);
  }

  .mini-val {
    font-family: Oswald, sans-serif;
    font-weight: 600;
    font-size: 1.1rem;
    color: var(--ink);
  }

  /* Target Status */
  .target-status {
    padding: 1rem 2rem;
    background: #fdfcf9;
    border-bottom: 1px solid var(--border);
    font-size: 0.9rem;
    color: var(--ink);
  }

  .status-message {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .status-message.success .icon { color: #22c55e; }
  .status-message.warning .icon { color: var(--terra); }

  /* Categories */
  .categories-list {
    padding: 1rem;
    background: var(--bg);
  }

  .category-item {
    background: #fff;
    border: 1px solid transparent;
    border-radius: 12px;
    margin-bottom: 0.5rem;
    transition: all 0.2s ease;
    overflow: hidden;
  }
  
  .category-item:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.03);
  }

  .category-item.expanded {
    border-color: var(--alpine);
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  }

  .category-main {
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

  .cat-info {
    flex: 1;
  }

  .cat-header-row {
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

  .cat-bar-track {
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

  .cat-arrow.rotated {
    transform: rotate(180deg);
    color: var(--pine);
  }

  .cat-details {
    border-top: 1px solid var(--border);
    background: #fcfcfc;
  }

  .items-list {
    padding: 0.5rem 1rem 1rem;
  }

  .gear-row {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0;
    font-size: 0.85rem;
    border-bottom: 1px dashed rgba(0,0,0,0.05);
  }

  .gear-row:last-child {
    border-bottom: none;
  }

  .gear-row.dimmed {
    opacity: 0.5;
  }

  .gear-name {
    color: var(--ink);
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .gear-weight {
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
  }

  .tag.essential {
    background: var(--pine);
    color: #fff;
  }

  .tag.worn {
    background: var(--stone);
    color: #fff;
  }

  @media (max-width: 600px) {
    .calc-header { padding: 1.5rem; }
    .controls-section { padding: 1.5rem; grid-template-columns: 1fr; }
    .toggle-group { grid-template-columns: 1fr; }
    .stats-grid { grid-template-columns: 1fr; }
    .stat-card.base { border-right: none; border-bottom: 1px solid var(--border); padding: 1.5rem; }
    .stat-card.other { padding: 1.5rem; }
  }
</style>
