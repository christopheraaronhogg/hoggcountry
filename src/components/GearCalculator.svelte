<script>
  import { onMount } from 'svelte';
  import gearData from '../data/gear.json';

  let mounted = false;

  onMount(() => {
    mounted = true;
  });

  // State
  let targetWeight = 28; // lbs
  let season = 'winter'; // 'winter' | 'summer'

  // Convert oz to lbs
  const ozToLbs = (oz) => oz / 16;
  const lbsToOz = (lbs) => lbs * 16;

  // Get items for current season
  $: seasonItems = gearData.items.filter(item => {
    if (item.season === 'all') return true;
    if (item.season === season) return true;
    return false;
  }).filter(item => {
    // Handle swap groups - only include one item from each swap group
    if (item.swapGroup) {
      const groupItems = gearData.items.filter(i => i.swapGroup === item.swapGroup);
      const seasonMatch = groupItems.find(i => i.season === season) || groupItems.find(i => i.season === 'all');
      return item.id === seasonMatch?.id;
    }
    return true;
  });

  // Sort by tier (priority), then by weight descending within tier
  $: sortedItems = [...seasonItems].sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier;
    return b.weight - a.weight;
  });

  // Calculate which items fit
  $: activeItems = (() => {
    const targetOz = lbsToOz(targetWeight);
    const active = [];
    let running = 0;

    for (const item of sortedItems) {
      if (running + item.weight <= targetOz) {
        active.push(item.id);
        running += item.weight;
      } else if (item.tier === 1) {
        // Tier 1 items are always included (essential)
        active.push(item.id);
        running += item.weight;
      }
    }
    return new Set(active);
  })();

  // Calculate totals
  $: totalWeight = sortedItems
    .filter(item => activeItems.has(item.id))
    .reduce((sum, item) => sum + item.weight, 0);

  $: carriedWeight = sortedItems
    .filter(item => activeItems.has(item.id) && !item.worn)
    .reduce((sum, item) => sum + item.weight, 0);

  $: wornWeight = sortedItems
    .filter(item => activeItems.has(item.id) && item.worn)
    .reduce((sum, item) => sum + item.weight, 0);

  // Weight classification
  $: weightClass = (() => {
    const lbs = ozToLbs(carriedWeight);
    if (lbs <= 10) return { label: 'Ultralight', color: '#22c55e', icon: '🪶' };
    if (lbs <= 15) return { label: 'Lightweight', color: '#a6b589', icon: '🎒' };
    if (lbs <= 20) return { label: 'Traditional', color: '#d97706', icon: '⚖️' };
    return { label: 'Heavy', color: '#dc2626', icon: '🏋️' };
  })();

  // Category breakdown
  $: categoryBreakdown = (() => {
    const breakdown = {};
    for (const item of sortedItems) {
      if (activeItems.has(item.id)) {
        const cat = item.category;
        if (!breakdown[cat]) {
          breakdown[cat] = { weight: 0, count: 0, ...gearData.categories[cat] };
        }
        breakdown[cat].weight += item.weight;
        breakdown[cat].count++;
      }
    }
    return Object.entries(breakdown).sort((a, b) => b[1].weight - a[1].weight);
  })();

  // Items that don't fit
  $: excludedItems = sortedItems.filter(item => !activeItems.has(item.id));

  // Format weight display
  const formatWeight = (oz) => {
    const lbs = ozToLbs(oz);
    if (lbs >= 1) {
      return `${lbs.toFixed(1)} lbs`;
    }
    return `${oz.toFixed(1)} oz`;
  };

  // Group items by category for display
  $: groupedItems = (() => {
    const groups = {};
    for (const item of sortedItems) {
      const cat = item.category;
      if (!groups[cat]) {
        groups[cat] = {
          items: [],
          ...gearData.categories[cat]
        };
      }
      groups[cat].items.push(item);
    }
    return Object.entries(groups);
  })();

  // Weight gauge percentage (0-35 lbs scale)
  $: gaugePercent = Math.min((ozToLbs(carriedWeight) / 35) * 100, 100);
</script>

<div class="gear-calc" class:mounted>
  <!-- Header -->
  <div class="calc-header">
    <div class="header-topo"></div>
    <div class="header-content">
      <span class="header-badge">{season === 'winter' ? '❄️ WINTER' : '☀️ SUMMER'}</span>
      <h2 class="header-title">Gear Weight Calculator</h2>
      <p class="header-sub">Optimize your base weight for the trail</p>
    </div>
  </div>

  <!-- Season Toggle -->
  <div class="season-bar">
    <button
      class="season-btn"
      class:active={season === 'winter'}
      on:click={() => season = 'winter'}
    >
      <span class="btn-icon">❄️</span>
      <span class="btn-text">Winter Start</span>
      <span class="btn-note">Feb–Mar gear</span>
    </button>
    <button
      class="season-btn"
      class:active={season === 'summer'}
      on:click={() => season = 'summer'}
    >
      <span class="btn-icon">☀️</span>
      <span class="btn-text">Post-Damascus</span>
      <span class="btn-note">Apr–Jul gear</span>
    </button>
  </div>

  <!-- Weight Control -->
  <div class="weight-control">
    <div class="control-header">
      <label class="control-label">
        <span class="label-icon">⚖️</span>
        <span>Target Base Weight</span>
      </label>
      <span class="weight-value">{targetWeight} lbs</span>
    </div>

    <div class="slider-track">
      <input
        type="range"
        min="10"
        max="35"
        step="0.5"
        bind:value={targetWeight}
        class="weight-slider"
      />
      <div class="slider-labels">
        <span class="label-ultra">10 lb<br><small>Ultralight</small></span>
        <span class="label-light">15 lb<br><small>Light</small></span>
        <span class="label-trad">20 lb<br><small>Trad</small></span>
        <span class="label-heavy">30 lb<br><small>Heavy</small></span>
      </div>
    </div>
  </div>

  <!-- Weight Summary -->
  <div class="weight-summary">
    <div class="weight-gauge">
      <div class="gauge-ring">
        <svg viewBox="0 0 120 120">
          <!-- Background arc -->
          <circle
            cx="60" cy="60" r="52"
            fill="none"
            stroke="var(--stone, #d4d0c4)"
            stroke-width="12"
            stroke-linecap="round"
            stroke-dasharray="245 82"
            transform="rotate(135 60 60)"
          />
          <!-- Progress arc -->
          <circle
            cx="60" cy="60" r="52"
            fill="none"
            stroke={weightClass.color}
            stroke-width="12"
            stroke-linecap="round"
            stroke-dasharray="{gaugePercent * 2.45} {245 - gaugePercent * 2.45 + 82}"
            transform="rotate(135 60 60)"
            class="gauge-progress"
          />
        </svg>
        <div class="gauge-center">
          <span class="gauge-icon">{weightClass.icon}</span>
          <span class="gauge-value">{ozToLbs(carriedWeight).toFixed(1)}</span>
          <span class="gauge-unit">lbs</span>
        </div>
      </div>
      <div class="gauge-label" style="color: {weightClass.color}">{weightClass.label}</div>
    </div>

    <div class="weight-stats">
      <div class="stat-row">
        <span class="stat-icon">🎒</span>
        <span class="stat-name">Base Weight</span>
        <span class="stat-value">{formatWeight(carriedWeight)}</span>
      </div>
      <div class="stat-row">
        <span class="stat-icon">👕</span>
        <span class="stat-name">Worn Weight</span>
        <span class="stat-value">{formatWeight(wornWeight)}</span>
      </div>
      <div class="stat-row total">
        <span class="stat-icon">📦</span>
        <span class="stat-name">Total System</span>
        <span class="stat-value">{formatWeight(totalWeight)}</span>
      </div>
    </div>
  </div>

  <!-- Category Breakdown -->
  <div class="category-section">
    <h3 class="section-title">
      <span class="title-blaze"></span>
      <span>Weight by Category</span>
    </h3>

    <div class="category-bars">
      {#each categoryBreakdown as [catId, cat]}
        <div class="cat-row">
          <div class="cat-info">
            <span class="cat-icon">{cat.icon}</span>
            <span class="cat-name">{cat.name}</span>
          </div>
          <div class="cat-bar-wrapper">
            <div
              class="cat-bar-fill"
              style="width: {(cat.weight / totalWeight) * 100}%; background: {cat.color}"
            ></div>
          </div>
          <span class="cat-weight">{formatWeight(cat.weight)}</span>
        </div>
      {/each}
    </div>
  </div>

  <!-- Gear Items by Category -->
  <div class="items-section">
    <h3 class="section-title">
      <span class="title-blaze"></span>
      <span>Your Gear List</span>
      <span class="item-count">{activeItems.size} items</span>
    </h3>

    {#each groupedItems as [catId, category]}
      <div class="category-group">
        <div class="category-header">
          <span class="cat-icon">{category.icon}</span>
          <span class="cat-name">{category.name}</span>
        </div>

        <div class="items-grid">
          {#each category.items as item}
            <div
              class="gear-item"
              class:active={activeItems.has(item.id)}
              class:essential={item.tier === 1}
              class:worn={item.worn}
            >
              <div class="item-main">
                <span class="item-name">{item.name}</span>
                {#if item.worn}
                  <span class="worn-badge">worn</span>
                {/if}
              </div>
              <div class="item-meta">
                <span class="item-weight">{item.weight} oz</span>
                {#if item.tier === 1}
                  <span class="tier-badge essential">Essential</span>
                {:else if item.tier === 4}
                  <span class="tier-badge luxury">Luxury</span>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/each}
  </div>

  <!-- Excluded Items -->
  {#if excludedItems.length > 0}
    <div class="excluded-section">
      <h3 class="section-title warning">
        <span class="title-icon">⚠️</span>
        <span>Doesn't Fit at {targetWeight} lbs</span>
      </h3>
      <div class="excluded-list">
        {#each excludedItems as item}
          <div class="excluded-item">
            <span class="ex-name">{item.name}</span>
            <span class="ex-weight">{item.weight} oz</span>
          </div>
        {/each}
      </div>
      <p class="excluded-tip">Increase target weight or swap items to include these.</p>
    </div>
  {/if}
</div>

<style>
  .gear-calc {
    background: var(--card, #fff);
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    opacity: 0;
    transform: translateY(10px);
    transition: opacity 0.4s ease, transform 0.4s ease;
  }

  .gear-calc.mounted {
    opacity: 1;
    transform: translateY(0);
  }

  /* Header */
  .calc-header {
    position: relative;
    padding: 2rem 1.5rem 1.5rem;
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
    letter-spacing: 0.15em;
    background: var(--marker, #f0e000);
    color: #2b2f26;
    padding: 0.25rem 0.6rem;
    border-radius: 3px;
    margin-bottom: 0.75rem;
  }

  .header-title {
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0 0 0.25rem;
    letter-spacing: -0.01em;
  }

  .header-sub {
    font-size: 0.85rem;
    opacity: 0.8;
    margin: 0;
  }

  /* Season Toggle */
  .season-bar {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
    background: var(--bg, #f5f2e8);
    border-bottom: 1px solid var(--border, #e6e1d4);
  }

  .season-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.15rem;
    padding: 1rem;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
  }

  .season-btn::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 3px;
    background: var(--pine, #4d594a);
    transition: width 0.2s ease;
    border-radius: 3px 3px 0 0;
  }

  .season-btn.active::after {
    width: 60%;
  }

  .season-btn:hover:not(.active) {
    background: rgba(166, 181, 137, 0.1);
  }

  .season-btn.active {
    background: rgba(166, 181, 137, 0.15);
  }

  .btn-icon {
    font-size: 1.25rem;
  }

  .btn-text {
    font-family: Oswald, sans-serif;
    font-weight: 600;
    font-size: 0.9rem;
    color: var(--pine, #4d594a);
  }

  .btn-note {
    font-size: 0.7rem;
    color: var(--muted, #5c665a);
  }

  /* Weight Control */
  .weight-control {
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid var(--border, #e6e1d4);
  }

  .control-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
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

  .weight-value {
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--pine, #4d594a);
  }

  .slider-track {
    position: relative;
  }

  .weight-slider {
    width: 100%;
    height: 10px;
    -webkit-appearance: none;
    background: linear-gradient(90deg,
      #22c55e 0%, #22c55e 20%,
      #a6b589 20%, #a6b589 40%,
      #d97706 40%, #d97706 60%,
      #dc2626 60%, #dc2626 100%
    );
    border-radius: 5px;
    cursor: pointer;
  }

  .weight-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 24px;
    height: 24px;
    background: var(--marker, #f0e000);
    border: 3px solid var(--pine, #4d594a);
    border-radius: 50%;
    cursor: grab;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  }

  .weight-slider::-webkit-slider-thumb:active {
    cursor: grabbing;
  }

  .slider-labels {
    display: flex;
    justify-content: space-between;
    margin-top: 0.5rem;
    font-size: 0.65rem;
    color: var(--muted, #5c665a);
    text-align: center;
  }

  .slider-labels small {
    display: block;
    font-size: 0.6rem;
    opacity: 0.7;
  }

  /* Weight Summary */
  .weight-summary {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 1.5rem;
    padding: 1.5rem;
    background: linear-gradient(to bottom, rgba(166, 181, 137, 0.08), transparent);
    border-bottom: 1px solid var(--border, #e6e1d4);
  }

  @media (max-width: 500px) {
    .weight-summary {
      grid-template-columns: 1fr;
      gap: 1rem;
    }
  }

  .weight-gauge {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .gauge-ring {
    position: relative;
    width: 120px;
    height: 120px;
  }

  .gauge-ring svg {
    width: 100%;
    height: 100%;
  }

  .gauge-progress {
    transition: stroke-dasharray 0.4s ease, stroke 0.4s ease;
  }

  .gauge-center {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding-top: 8px;
  }

  .gauge-icon {
    font-size: 1.25rem;
  }

  .gauge-value {
    font-family: Oswald, sans-serif;
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--ink, #2b2f26);
    line-height: 1;
  }

  .gauge-unit {
    font-size: 0.7rem;
    color: var(--muted, #5c665a);
    text-transform: uppercase;
  }

  .gauge-label {
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .weight-stats {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 0.5rem;
  }

  .stat-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 0.75rem;
    background: var(--card, #fff);
    border-radius: 8px;
    border: 1px solid var(--border, #e6e1d4);
  }

  .stat-row.total {
    background: var(--marker, #f0e000);
    border-color: #e0d400;
  }

  .stat-row .stat-icon {
    font-size: 1rem;
  }

  .stat-row .stat-name {
    flex: 1;
    font-size: 0.8rem;
    color: var(--pine, #4d594a);
  }

  .stat-row .stat-value {
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 600;
    color: var(--ink, #2b2f26);
  }

  /* Category Section */
  .category-section {
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid var(--border, #e6e1d4);
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--pine, #4d594a);
    margin: 0 0 1rem;
  }

  .title-blaze {
    width: 6px;
    height: 14px;
    background: var(--marker, #f0e000);
    border-radius: 2px;
  }

  .title-icon {
    font-size: 1rem;
  }

  .item-count {
    margin-left: auto;
    font-size: 0.75rem;
    font-weight: 400;
    color: var(--muted, #5c665a);
    text-transform: none;
    letter-spacing: 0;
  }

  .category-bars {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .cat-row {
    display: grid;
    grid-template-columns: 100px 1fr 60px;
    align-items: center;
    gap: 0.75rem;
  }

  .cat-info {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .cat-icon {
    font-size: 1rem;
  }

  .cat-name {
    font-size: 0.75rem;
    color: var(--pine, #4d594a);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .cat-bar-wrapper {
    height: 16px;
    background: var(--bg, #f5f2e8);
    border-radius: 8px;
    overflow: hidden;
  }

  .cat-bar-fill {
    height: 100%;
    border-radius: 8px;
    transition: width 0.4s ease;
    min-width: 4px;
  }

  .cat-weight {
    font-family: Oswald, sans-serif;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--muted, #5c665a);
    text-align: right;
  }

  /* Items Section */
  .items-section {
    padding: 1.25rem 1.5rem;
  }

  .category-group {
    margin-bottom: 1.25rem;
  }

  .category-group:last-child {
    margin-bottom: 0;
  }

  .category-header {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--pine, #4d594a);
    margin-bottom: 0.5rem;
    padding-bottom: 0.35rem;
    border-bottom: 1px dashed var(--border, #e6e1d4);
  }

  .items-grid {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .gear-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0.65rem;
    background: var(--bg, #f5f2e8);
    border-radius: 6px;
    border-left: 3px solid transparent;
    opacity: 0.4;
    transition: all 0.2s ease;
  }

  .gear-item.active {
    opacity: 1;
    border-left-color: var(--alpine, #a6b589);
  }

  .gear-item.active.essential {
    border-left-color: var(--pine, #4d594a);
    background: rgba(77, 89, 74, 0.08);
  }

  .gear-item.worn {
    background: rgba(166, 181, 137, 0.1);
  }

  .item-main {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .item-name {
    font-size: 0.8rem;
    color: var(--ink, #2b2f26);
  }

  .worn-badge {
    font-size: 0.55rem;
    text-transform: uppercase;
    padding: 0.15rem 0.35rem;
    background: var(--alpine, #a6b589);
    color: #fff;
    border-radius: 3px;
    font-weight: 600;
    letter-spacing: 0.02em;
  }

  .item-meta {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .item-weight {
    font-family: Oswald, sans-serif;
    font-size: 0.75rem;
    color: var(--muted, #5c665a);
  }

  .tier-badge {
    font-size: 0.5rem;
    padding: 0.15rem 0.35rem;
    border-radius: 3px;
    text-transform: uppercase;
    font-weight: 600;
    letter-spacing: 0.02em;
  }

  .tier-badge.essential {
    background: var(--pine, #4d594a);
    color: #fff;
  }

  .tier-badge.luxury {
    background: var(--terra, #d97706);
    color: #fff;
  }

  /* Excluded Section */
  .excluded-section {
    margin: 0 1.5rem 1.5rem;
    padding: 1rem;
    background: linear-gradient(135deg, rgba(220, 38, 38, 0.06), rgba(220, 38, 38, 0.02));
    border: 1px solid rgba(220, 38, 38, 0.2);
    border-radius: 10px;
  }

  .section-title.warning {
    color: #b91c1c;
  }

  .excluded-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }

  .excluded-item {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.35rem 0.6rem;
    background: #fff;
    border-radius: 5px;
    border: 1px solid rgba(220, 38, 38, 0.15);
  }

  .ex-name {
    font-size: 0.75rem;
    color: #7f1d1d;
  }

  .ex-weight {
    font-size: 0.65rem;
    color: #991b1b;
    opacity: 0.7;
  }

  .excluded-tip {
    font-size: 0.75rem;
    color: #991b1b;
    margin: 0.75rem 0 0;
    opacity: 0.8;
  }

  /* Mobile */
  @media (max-width: 600px) {
    .calc-header {
      padding: 1.5rem 1rem 1.25rem;
    }

    .header-title {
      font-size: 1.35rem;
    }

    .weight-control,
    .category-section,
    .items-section {
      padding-left: 1rem;
      padding-right: 1rem;
    }

    .cat-row {
      grid-template-columns: 80px 1fr 50px;
    }

    .cat-name {
      font-size: 0.7rem;
    }

    .excluded-section {
      margin-left: 1rem;
      margin-right: 1rem;
    }
  }
</style>
