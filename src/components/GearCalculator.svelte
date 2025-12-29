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
        // Non-swap items: include if season matches or is 'all'
        if (item.season === 'all' || item.season === currentSeason) {
          result.push(item);
        }
      }
    });

    // Process swap groups - pick the item matching current season
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

  // Calculate cumulative weight to determine which items "fit"
  $: itemFitStatus = (() => {
    const status = {};
    let cumulative = 0;

    // Sort by tier (essential first) then by weight
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
  <div class="calc-header">
    <div class="header-topo"></div>
    <div class="header-content">
      <span class="header-badge">PACK WEIGHT</span>
      <h2 class="header-title">Gear Calculator</h2>
      <p class="header-sub">Optimize your base weight for the trail</p>
    </div>
  </div>

  <!-- Season Toggle -->
  <div class="season-toggle-section">
    <div class="toggle-container">
      <button
        class="toggle-btn"
        class:active={season === 'winter'}
        onclick={() => season = 'winter'}
      >
        <span class="toggle-icon">❄️</span>
        <span class="toggle-label">Winter Start</span>
        <span class="toggle-sub">February in Georgia</span>
      </button>
      <button
        class="toggle-btn"
        class:active={season === 'summer'}
        onclick={() => season = 'summer'}
      >
        <span class="toggle-icon">☀️</span>
        <span class="toggle-label">Post-Damascus</span>
        <span class="toggle-sub">Summer configuration</span>
      </button>
    </div>
  </div>

  <!-- Target Weight Slider -->
  <div class="controls">
    <div class="control-group">
      <label class="control-label">
        <span class="label-icon">🎯</span>
        <span class="label-text">Target Base Weight</span>
      </label>
      <div class="weight-control">
        <input
          type="range"
          min="8"
          max="30"
          step="0.5"
          bind:value={targetWeight}
          class="weight-slider"
        />
        <span class="weight-value">{targetWeight} lbs</span>
      </div>
      <div class="weight-scale">
        <span class="scale-label ultralight">Ultralight</span>
        <span class="scale-label lightweight">Lightweight</span>
        <span class="scale-label traditional">Traditional</span>
        <span class="scale-label heavy">Heavy</span>
      </div>
    </div>
  </div>

  <!-- Weight Summary -->
  <div class="summary-bar">
    <div class="stat">
      <span class="stat-value" style="color: {weightClassColor}">{baseWeightLbs.toFixed(1)}</span>
      <span class="stat-label">Base (lbs)</span>
    </div>
    <div class="stat">
      <span class="stat-value">{wornWeightLbs.toFixed(1)}</span>
      <span class="stat-label">Worn (lbs)</span>
    </div>
    <div class="stat">
      <span class="stat-value">{totalWeightLbs.toFixed(1)}</span>
      <span class="stat-label">Total (lbs)</span>
    </div>
    <div class="stat class-stat">
      <span class="stat-badge" style="background: {weightClassColor}">{weightClass}</span>
      <span class="stat-label">Weight Class</span>
    </div>
  </div>

  <!-- Weight vs Target Indicator -->
  <div class="target-indicator">
    <div class="target-bar">
      <div
        class="target-fill"
        style="width: {Math.min((baseWeightLbs / targetWeight) * 100, 100)}%; background: {baseWeightLbs <= targetWeight ? 'var(--alpine)' : 'var(--terra)'}"
      ></div>
      <div class="target-marker" style="left: {Math.min((targetWeight / 30) * 100, 100)}%">
        <span class="marker-line"></span>
        <span class="marker-label">Target</span>
      </div>
    </div>
    <div class="target-status">
      {#if baseWeightLbs <= targetWeight}
        <span class="status-icon">✓</span>
        <span class="status-text">{(targetWeight - baseWeightLbs).toFixed(1)} lbs under target</span>
      {:else}
        <span class="status-icon over">⚠</span>
        <span class="status-text over">{(baseWeightLbs - targetWeight).toFixed(1)} lbs over target</span>
      {/if}
    </div>
  </div>

  <!-- Category Breakdown -->
  <div class="categories-section">
    <h3 class="section-title">
      <span class="title-blaze"></span>
      <span>Weight by Category</span>
    </h3>

    <div class="categories-list">
      {#each categoryWeights as cat, i}
        <button
          class="category-row"
          class:expanded={expandedCategory === cat.id}
          class:mounted
          style="animation-delay: {i * 40}ms"
          onclick={() => toggleCategory(cat.id)}
        >
          <div class="cat-header">
            <span class="cat-icon">{cat.icon}</span>
            <span class="cat-name">{cat.name}</span>
            <span class="cat-weight">{formatWeight(cat.weight)}</span>
            <span class="cat-expand">{expandedCategory === cat.id ? '−' : '+'}</span>
          </div>

          <div class="cat-bar-container">
            <div
              class="cat-bar"
              style="width: {(cat.weight / maxCategoryWeight) * 100}%; background: {cat.color}"
            ></div>
          </div>

          {#if expandedCategory === cat.id}
            <div class="cat-items">
              {#each cat.items as item}
                {@const status = itemFitStatus[item.id] || { fits: true, essential: false }}
                <div class="item-row" class:faded={!status.fits} class:essential={status.essential}>
                  <span class="item-name">
                    {item.name}
                    {#if status.essential}<span class="essential-badge">Essential</span>{/if}
                  </span>
                  <span class="item-weight">{formatWeight(item.weight)}</span>
                </div>
              {/each}
              {#each cat.wornItems as item}
                <div class="item-row worn">
                  <span class="item-name">{item.name} <span class="worn-badge">Worn</span></span>
                  <span class="item-weight">{formatWeight(item.weight)}</span>
                </div>
              {/each}
            </div>
          {/if}
        </button>
      {/each}
    </div>
  </div>

  <!-- Tips Section -->
  <div class="tips-section">
    <h3 class="section-title">
      <span class="title-blaze"></span>
      <span>Weight-Saving Tips</span>
    </h3>
    <div class="tips-grid">
      <div class="tip-card">
        <span class="tip-icon">🎒</span>
        <p class="tip-text">Your pack is often the easiest big weight cut. Frameless packs work under 15lb base weight.</p>
      </div>
      <div class="tip-card">
        <span class="tip-icon">🛏️</span>
        <p class="tip-text">Sleep system is the "Big 3" - tent, quilt, pad. Premium down quilts save 10+ oz.</p>
      </div>
      <div class="tip-card">
        <span class="tip-icon">📱</span>
        <p class="tip-text">Electronics add up fast. Question each device - do you really need it on trail?</p>
      </div>
    </div>
  </div>
</div>

<style>
  .gear-calc {
    background: var(--card, #fff);
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 24px rgba(0,0,0,0.08);
  }

  /* Header */
  .calc-header {
    position: relative;
    padding: 2.5rem 2rem 2rem;
    background: linear-gradient(135deg, var(--pine, #4d594a) 0%, #3a4238 100%);
    color: #fff;
    overflow: hidden;
  }

  .header-topo {
    position: absolute;
    inset: 0;
    opacity: 0.08;
    background-image:
      repeating-linear-gradient(0deg, transparent, transparent 20px, rgba(255,255,255,0.5) 20px, rgba(255,255,255,0.5) 21px),
      repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(255,255,255,0.3) 20px, rgba(255,255,255,0.3) 21px);
  }

  .header-content {
    position: relative;
  }

  .header-badge {
    display: inline-block;
    font-family: Oswald, sans-serif;
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    background: var(--marker, #f0e000);
    color: #2b2f26;
    padding: 0.25rem 0.6rem;
    border-radius: 3px;
    margin-bottom: 0.75rem;
  }

  .header-title {
    font-family: Oswald, sans-serif;
    font-size: 1.75rem;
    font-weight: 700;
    margin: 0 0 0.25rem;
    letter-spacing: -0.01em;
  }

  .header-sub {
    font-size: 0.9rem;
    opacity: 0.8;
    margin: 0;
  }

  /* Season Toggle */
  .season-toggle-section {
    padding: 1.5rem 2rem;
    background: linear-gradient(to bottom, rgba(166, 181, 137, 0.08), transparent);
    border-bottom: 1px solid var(--border, #e6e1d4);
  }

  .toggle-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }

  .toggle-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 1rem;
    background: var(--bg, #f5f2e8);
    border: 2px solid var(--border, #e6e1d4);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .toggle-btn:hover {
    border-color: var(--alpine, #a6b589);
  }

  .toggle-btn.active {
    background: var(--pine, #4d594a);
    border-color: var(--pine, #4d594a);
    color: #fff;
  }

  .toggle-icon {
    font-size: 1.75rem;
  }

  .toggle-label {
    font-family: Oswald, sans-serif;
    font-size: 0.95rem;
    font-weight: 600;
  }

  .toggle-sub {
    font-size: 0.7rem;
    opacity: 0.7;
  }

  /* Controls */
  .controls {
    padding: 1.5rem 2rem;
    border-bottom: 1px solid var(--border, #e6e1d4);
  }

  .control-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .control-label {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--pine, #4d594a);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .label-icon {
    font-size: 1rem;
  }

  .weight-control {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .weight-slider {
    flex: 1;
    height: 8px;
    -webkit-appearance: none;
    background: linear-gradient(90deg, #22c55e 0%, var(--alpine, #a6b589) 35%, var(--terra, #d97706) 70%, #dc2626 100%);
    border-radius: 4px;
    cursor: pointer;
  }

  .weight-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 24px;
    height: 24px;
    background: var(--card, #fff);
    border: 3px solid var(--pine, #4d594a);
    border-radius: 50%;
    cursor: grab;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  }

  .weight-slider::-moz-range-thumb {
    width: 24px;
    height: 24px;
    background: var(--card, #fff);
    border: 3px solid var(--pine, #4d594a);
    border-radius: 50%;
    cursor: grab;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  }

  .weight-value {
    font-family: Oswald, sans-serif;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--pine, #4d594a);
    min-width: 4rem;
    text-align: right;
  }

  .weight-scale {
    display: flex;
    justify-content: space-between;
    margin-top: 0.25rem;
  }

  .scale-label {
    font-size: 0.6rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    opacity: 0.7;
  }

  .scale-label.ultralight { color: #22c55e; }
  .scale-label.lightweight { color: var(--alpine, #a6b589); }
  .scale-label.traditional { color: var(--terra, #d97706); }
  .scale-label.heavy { color: #dc2626; }

  /* Summary Bar */
  .summary-bar {
    display: flex;
    justify-content: center;
    gap: 1.5rem;
    padding: 1.25rem 2rem;
    background: var(--bg, #f5f2e8);
    border-bottom: 1px solid var(--border, #e6e1d4);
    flex-wrap: wrap;
  }

  .stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.1rem;
  }

  .stat-value {
    font-family: Oswald, sans-serif;
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--pine, #4d594a);
    line-height: 1;
  }

  .stat-label {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--muted, #5c665a);
  }

  .stat-badge {
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    color: #fff;
    padding: 0.3rem 0.75rem;
    border-radius: 6px;
  }

  .class-stat {
    padding-left: 1.5rem;
    border-left: 2px solid var(--border, #e6e1d4);
  }

  /* Target Indicator */
  .target-indicator {
    padding: 1.25rem 2rem;
    border-bottom: 1px solid var(--border, #e6e1d4);
  }

  .target-bar {
    position: relative;
    height: 12px;
    background: var(--stone, #d4d0c4);
    border-radius: 6px;
    overflow: visible;
  }

  .target-fill {
    height: 100%;
    border-radius: 6px;
    transition: width 0.3s ease, background 0.3s ease;
  }

  .target-marker {
    position: absolute;
    top: -4px;
    transform: translateX(-50%);
  }

  .marker-line {
    display: block;
    width: 3px;
    height: 20px;
    background: var(--ink, #2b2f26);
    border-radius: 2px;
  }

  .marker-label {
    position: absolute;
    top: 22px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 0.6rem;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--muted, #5c665a);
    white-space: nowrap;
  }

  .target-status {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 1rem;
    font-size: 0.85rem;
    color: var(--pine, #4d594a);
  }

  .status-icon {
    font-size: 1rem;
    color: #22c55e;
  }

  .status-icon.over {
    color: var(--terra, #d97706);
  }

  .status-text.over {
    color: var(--terra, #d97706);
  }

  /* Categories Section */
  .categories-section {
    padding: 1.5rem 2rem;
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
    color: var(--pine, #4d594a);
    margin: 0 0 1.25rem;
  }

  .title-blaze {
    width: 8px;
    height: 16px;
    background: var(--marker, #f0e000);
    border-radius: 2px;
  }

  .categories-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .category-row {
    width: 100%;
    text-align: left;
    background: var(--bg, #f5f2e8);
    border: none;
    border-radius: 10px;
    padding: 0.75rem 1rem;
    cursor: pointer;
    opacity: 0;
    transform: translateX(-10px);
    transition: opacity 0.3s ease, transform 0.3s ease, background 0.15s ease;
  }

  .category-row.mounted {
    opacity: 1;
    transform: translateX(0);
  }

  .category-row:hover {
    background: rgba(166, 181, 137, 0.15);
  }

  .category-row.expanded {
    background: rgba(166, 181, 137, 0.2);
  }

  .cat-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .cat-icon {
    font-size: 1.1rem;
  }

  .cat-name {
    flex: 1;
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--ink, #2b2f26);
  }

  .cat-weight {
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--pine, #4d594a);
    min-width: 3.5rem;
    text-align: right;
  }

  .cat-expand {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    font-weight: 600;
    color: var(--muted, #5c665a);
  }

  .cat-bar-container {
    height: 6px;
    background: rgba(0,0,0,0.08);
    border-radius: 3px;
    margin-top: 0.5rem;
    overflow: hidden;
  }

  .cat-bar {
    height: 100%;
    border-radius: 3px;
    transition: width 0.3s ease;
  }

  .cat-items {
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px dashed var(--border, #e6e1d4);
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .item-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.25rem 0;
    font-size: 0.8rem;
    transition: opacity 0.2s ease;
  }

  .item-row.faded {
    opacity: 0.35;
  }

  .item-row.essential {
    opacity: 1;
  }

  .item-row.worn {
    opacity: 0.6;
    font-style: italic;
  }

  .item-name {
    color: var(--ink, #2b2f26);
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-wrap: wrap;
  }

  .item-weight {
    color: var(--muted, #5c665a);
    font-family: Oswald, sans-serif;
  }

  .essential-badge {
    font-size: 0.55rem;
    font-weight: 600;
    text-transform: uppercase;
    background: var(--pine, #4d594a);
    color: #fff;
    padding: 0.1rem 0.35rem;
    border-radius: 3px;
  }

  .worn-badge {
    font-size: 0.55rem;
    font-weight: 600;
    text-transform: uppercase;
    background: var(--stone, #d4d0c4);
    color: var(--muted, #5c665a);
    padding: 0.1rem 0.35rem;
    border-radius: 3px;
    font-style: normal;
  }

  /* Tips Section */
  .tips-section {
    padding: 1.5rem 2rem 2rem;
    background: linear-gradient(to bottom, transparent, rgba(166, 181, 137, 0.05));
  }

  .tips-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 0.75rem;
  }

  .tip-card {
    background: var(--bg, #f5f2e8);
    border-radius: 10px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .tip-icon {
    font-size: 1.5rem;
  }

  .tip-text {
    font-size: 0.8rem;
    color: var(--muted, #5c665a);
    margin: 0;
    line-height: 1.4;
  }

  /* Mobile */
  @media (max-width: 600px) {
    .calc-header,
    .season-toggle-section,
    .controls,
    .summary-bar,
    .target-indicator,
    .categories-section,
    .tips-section {
      padding-left: 1rem;
      padding-right: 1rem;
    }

    .toggle-container {
      grid-template-columns: 1fr;
    }

    .summary-bar {
      gap: 1rem;
    }

    .stat-value {
      font-size: 1.4rem;
    }

    .class-stat {
      padding-left: 1rem;
    }
  }
</style>
