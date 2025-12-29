<script>
  import { onMount } from 'svelte';
  import gearData from '../data/gear.json';

  let mounted = false;
  onMount(() => { mounted = true; });

  // State
  let targetWeight = 20;
  let season = 'winter';

  // Helpers
  const ozToLbs = (oz) => oz / 16;
  const lbsToOz = (lbs) => lbs * 16;

  // Filter items by season and swap groups
  $: seasonItems = gearData.items.filter(item => {
    if (item.season === 'all') return true;
    if (item.season === season) return true;
    return false;
  }).filter(item => {
    if (item.swapGroup) {
      const groupItems = gearData.items.filter(i => i.swapGroup === item.swapGroup);
      const seasonMatch = groupItems.find(i => i.season === season) || groupItems.find(i => i.season === 'all');
      return item.id === seasonMatch?.id;
    }
    return true;
  });

  // Sort by tier then weight
  $: sortedItems = [...seasonItems].sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier;
    return b.weight - a.weight;
  });

  // Determine which items fit in target weight
  $: activeItems = (() => {
    const targetOz = lbsToOz(targetWeight);
    const active = [];
    let running = 0;
    for (const item of sortedItems) {
      if (running + item.weight <= targetOz) {
        active.push(item.id);
        running += item.weight;
      } else if (item.tier === 1) {
        // Essential items always included
        active.push(item.id);
        running += item.weight;
      }
    }
    return new Set(active);
  })();

  // Weight calculations
  $: carriedWeight = sortedItems
    .filter(item => activeItems.has(item.id) && !item.worn)
    .reduce((sum, item) => sum + item.weight, 0);

  $: wornWeight = sortedItems
    .filter(item => activeItems.has(item.id) && item.worn)
    .reduce((sum, item) => sum + item.weight, 0);

  $: totalWeight = carriedWeight + wornWeight;

  // Weight class determination
  $: weightClass = (() => {
    const lbs = ozToLbs(carriedWeight);
    if (lbs <= 10) return { label: 'Ultralight', color: '#22c55e', icon: '🪶' };
    if (lbs <= 15) return { label: 'Lightweight', color: '#a6b589', icon: '🌿' };
    if (lbs <= 20) return { label: 'Traditional', color: '#d97706', icon: '🎒' };
    return { label: 'Heavy', color: '#dc2626', icon: '🏋️' };
  })();

  // Category breakdown
  $: categoryBreakdown = (() => {
    const breakdown = {};
    for (const item of sortedItems) {
      if (activeItems.has(item.id)) {
        const cat = item.category;
        if (!breakdown[cat]) {
          breakdown[cat] = {
            weight: 0,
            count: 0,
            ...gearData.categories[cat]
          };
        }
        breakdown[cat].weight += item.weight;
        breakdown[cat].count++;
      }
    }
    return Object.entries(breakdown).sort((a, b) => b[1].weight - a[1].weight);
  })();

  // Max category weight for bar scaling
  $: maxCatWeight = Math.max(...categoryBreakdown.map(([_, cat]) => cat.weight), 1);

  // Group items by category
  $: groupedItems = (() => {
    const groups = {};
    for (const item of sortedItems) {
      const cat = item.category;
      if (!groups[cat]) {
        groups[cat] = { items: [], ...gearData.categories[cat] };
      }
      groups[cat].items.push(item);
    }
    return Object.entries(groups);
  })();

  // Excluded items
  $: excludedItems = sortedItems.filter(item => !activeItems.has(item.id));

  // Format weight
  const formatWeight = (oz) => {
    const lbs = ozToLbs(oz);
    if (lbs >= 1) return `${lbs.toFixed(1)} lbs`;
    return `${oz.toFixed(1)} oz`;
  };
</script>

<div class="gear-calc" class:mounted>
  <!-- Header -->
  <div class="calc-header">
    <div class="header-topo"></div>
    <div class="header-content">
      <span class="header-badge">{season === 'winter' ? '❄️ WINTER' : '☀️ SUMMER'} LOADOUT</span>
      <h2 class="header-title">Gear Weight Calculator</h2>
      <p class="header-sub">Optimize your pack for the trail ahead</p>
    </div>
  </div>

  <!-- Controls -->
  <div class="controls">
    <div class="control-group">
      <label class="control-label">
        <span class="label-icon">🗓️</span>
        <span class="label-text">Season</span>
      </label>
      <div class="season-toggle">
        <button
          class="season-btn"
          class:active={season === 'winter'}
          on:click={() => season = 'winter'}
        >
          <span class="btn-icon">❄️</span>
          <span>Winter Start</span>
        </button>
        <button
          class="season-btn"
          class:active={season === 'summer'}
          on:click={() => season = 'summer'}
        >
          <span class="btn-icon">☀️</span>
          <span>Post-Damascus</span>
        </button>
      </div>
    </div>

    <div class="control-group">
      <label class="control-label">
        <span class="label-icon">⚖️</span>
        <span class="label-text">Target Base Weight</span>
      </label>
      <div class="weight-control">
        <input
          type="range"
          min="10"
          max="30"
          step="0.5"
          bind:value={targetWeight}
          class="weight-slider"
        />
        <span class="weight-value">{targetWeight} lbs</span>
      </div>
    </div>
  </div>

  <!-- Summary Bar -->
  <div class="summary-bar">
    <div class="stat">
      <span class="stat-value">{ozToLbs(carriedWeight).toFixed(1)}</span>
      <span class="stat-label">base weight</span>
    </div>
    <div class="stat">
      <span class="stat-value">{ozToLbs(wornWeight).toFixed(1)}</span>
      <span class="stat-label">worn</span>
    </div>
    <div class="stat total" style="--accent: {weightClass.color}">
      <span class="stat-icon">{weightClass.icon}</span>
      <div class="stat-content">
        <span class="stat-value">{ozToLbs(totalWeight).toFixed(1)}</span>
        <span class="stat-label">total lbs</span>
      </div>
      <span class="weight-badge" style="background: {weightClass.color}">{weightClass.label}</span>
    </div>
  </div>

  <!-- Weight Distribution -->
  <div class="distribution-section">
    <h3 class="section-title">
      <span class="title-blaze"></span>
      <span>Weight Distribution</span>
    </h3>
    <div class="category-bars">
      {#each categoryBreakdown as [catId, cat], i}
        <div class="cat-bar" style="animation-delay: {i * 40}ms">
          <div class="cat-info">
            <span class="cat-icon">{cat.icon}</span>
            <span class="cat-name">{cat.name}</span>
          </div>
          <div class="bar-track">
            <div
              class="bar-fill"
              style="
                width: {(cat.weight / maxCatWeight) * 100}%;
                background: {cat.color};
              "
            ></div>
          </div>
          <span class="cat-weight">{formatWeight(cat.weight)}</span>
        </div>
      {/each}
    </div>
  </div>

  <!-- Gear List -->
  <div class="gear-section">
    <h3 class="section-title">
      <span class="title-blaze"></span>
      <span>Complete Gear List</span>
      <span class="item-count">{activeItems.size} items • {formatWeight(totalWeight)}</span>
    </h3>

    {#each groupedItems as [catId, category], catIndex}
      <div class="category-group" style="animation-delay: {catIndex * 60}ms">
        <div class="category-header" style="border-color: {category.color}">
          <span class="cat-icon">{category.icon}</span>
          <span class="cat-title">{category.name}</span>
          <span class="cat-badge">{category.items.filter(i => activeItems.has(i.id)).length} items</span>
        </div>

        <div class="items-list">
          {#each category.items as item, itemIndex}
            <div
              class="gear-item"
              class:active={activeItems.has(item.id)}
              class:essential={item.tier === 1}
              style="animation-delay: {(catIndex * 60) + (itemIndex * 20)}ms"
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

  <!-- Excluded Items Warning -->
  {#if excludedItems.length > 0}
    <div class="excluded-section">
      <div class="excluded-header">
        <span class="excluded-icon">⚠️</span>
        <span>Doesn't fit at {targetWeight} lbs target</span>
      </div>
      <div class="excluded-list">
        {#each excludedItems as item}
          <span class="excluded-item">
            {item.name}
            <span class="excluded-weight">({item.weight} oz)</span>
          </span>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Footer Tip -->
  <div class="calc-footer">
    <p class="footer-tip">
      <span class="tip-icon">💡</span>
      <span>Tier 1 essentials are always included regardless of weight target.</span>
    </p>
  </div>
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

  /* Controls */
  .controls {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    padding: 1.5rem 2rem;
    background: linear-gradient(to bottom, rgba(166, 181, 137, 0.08), transparent);
    border-bottom: 1px solid var(--border, #e6e1d4);
  }

  @media (max-width: 600px) {
    .controls {
      grid-template-columns: 1fr;
      gap: 1rem;
      padding: 1.25rem 1rem;
    }
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

  .season-toggle {
    display: flex;
    gap: 0.5rem;
  }

  .season-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    padding: 0.65rem 0.75rem;
    background: #fff;
    border: 2px solid var(--border, #e6e1d4);
    border-radius: 8px;
    font-family: inherit;
    font-size: 0.8rem;
    color: var(--muted, #5c665a);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .season-btn:hover {
    border-color: var(--alpine, #a6b589);
  }

  .season-btn.active {
    background: var(--pine, #4d594a);
    border-color: var(--pine, #4d594a);
    color: #fff;
    font-weight: 600;
  }

  .btn-icon {
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
    appearance: none;
    background: linear-gradient(90deg, #22c55e 0%, #a6b589 33%, #d97706 66%, #dc2626 100%);
    border-radius: 4px;
    cursor: pointer;
  }

  .weight-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
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
    transform: scale(1.1);
  }

  .weight-slider::-moz-range-thumb {
    width: 24px;
    height: 24px;
    background: var(--marker, #f0e000);
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
    min-width: 4.5rem;
    text-align: right;
  }

  /* Summary Bar */
  .summary-bar {
    display: flex;
    justify-content: center;
    align-items: stretch;
    gap: 1.5rem;
    padding: 1.25rem 2rem;
    background: var(--bg, #f5f2e8);
    border-bottom: 1px solid var(--border, #e6e1d4);
  }

  @media (max-width: 600px) {
    .summary-bar {
      gap: 0.75rem;
      padding: 1rem;
      flex-wrap: wrap;
    }
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

  .stat.total {
    flex-direction: row;
    align-items: center;
    gap: 0.75rem;
    padding-left: 1.5rem;
    border-left: 2px solid var(--border, #e6e1d4);
  }

  .stat-icon {
    font-size: 1.5rem;
  }

  .stat-content {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .weight-badge {
    font-family: Oswald, sans-serif;
    font-size: 0.6rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #fff;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
  }

  /* Distribution Section */
  .distribution-section {
    padding: 1.5rem 2rem;
    border-bottom: 1px solid var(--border, #e6e1d4);
  }

  @media (max-width: 600px) {
    .distribution-section {
      padding: 1.25rem 1rem;
    }
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
    gap: 0.6rem;
  }

  .cat-bar {
    display: grid;
    grid-template-columns: 140px 1fr 70px;
    align-items: center;
    gap: 0.75rem;
    opacity: 0;
    animation: fadeSlideIn 0.3s ease forwards;
  }

  @keyframes fadeSlideIn {
    from {
      opacity: 0;
      transform: translateX(-10px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @media (max-width: 600px) {
    .cat-bar {
      grid-template-columns: 100px 1fr 60px;
    }
  }

  .cat-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .cat-icon {
    font-size: 1rem;
  }

  .cat-name {
    font-size: 0.8rem;
    color: var(--pine, #4d594a);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .bar-track {
    height: 12px;
    background: rgba(166, 181, 137, 0.15);
    border-radius: 6px;
    overflow: hidden;
  }

  .bar-fill {
    height: 100%;
    border-radius: 6px;
    transition: width 0.4s ease;
  }

  .cat-weight {
    font-family: Oswald, sans-serif;
    font-size: 0.8rem;
    color: var(--muted, #5c665a);
    text-align: right;
  }

  /* Gear Section */
  .gear-section {
    padding: 1.5rem 2rem 2rem;
  }

  @media (max-width: 600px) {
    .gear-section {
      padding: 1.25rem 1rem 1.5rem;
    }
  }

  .category-group {
    margin-bottom: 1.25rem;
    opacity: 0;
    animation: fadeSlideIn 0.4s ease forwards;
  }

  .category-group:last-child {
    margin-bottom: 0;
  }

  .category-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid;
    margin-bottom: 0.5rem;
  }

  .cat-title {
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--ink, #2b2f26);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .cat-badge {
    margin-left: auto;
    font-size: 0.65rem;
    color: var(--muted, #5c665a);
  }

  .items-list {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .gear-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.6rem 0.75rem;
    background: var(--bg, #f5f2e8);
    border-radius: 6px;
    border-left: 3px solid transparent;
    opacity: 0.35;
    transition: all 0.2s ease;
  }

  .gear-item.active {
    opacity: 1;
    border-left-color: var(--alpine, #a6b589);
  }

  .gear-item.essential.active {
    border-left-color: var(--pine, #4d594a);
  }

  .item-main {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 0;
  }

  .item-name {
    font-size: 0.85rem;
    color: var(--ink, #2b2f26);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .worn-badge {
    font-size: 0.55rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    background: var(--alpine, #a6b589);
    color: #fff;
    padding: 0.15rem 0.35rem;
    border-radius: 3px;
    flex-shrink: 0;
  }

  .item-meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  .item-weight {
    font-family: Oswald, sans-serif;
    font-size: 0.8rem;
    color: var(--muted, #5c665a);
  }

  .tier-badge {
    font-size: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 0.15rem 0.4rem;
    border-radius: 3px;
    font-weight: 600;
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
    margin: 0 2rem 1.5rem;
    padding: 1rem 1.25rem;
    background: rgba(220, 38, 38, 0.06);
    border: 1px solid rgba(220, 38, 38, 0.2);
    border-radius: 10px;
  }

  @media (max-width: 600px) {
    .excluded-section {
      margin: 0 1rem 1rem;
    }
  }

  .excluded-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    font-weight: 600;
    color: #b91c1c;
    margin-bottom: 0.75rem;
  }

  .excluded-icon {
    font-size: 1rem;
  }

  .excluded-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .excluded-item {
    font-size: 0.75rem;
    padding: 0.3rem 0.6rem;
    background: #fff;
    border-radius: 4px;
    color: #7f1d1d;
  }

  .excluded-weight {
    opacity: 0.7;
  }

  /* Footer */
  .calc-footer {
    padding: 1rem 2rem 1.5rem;
    border-top: 1px solid var(--border, #e6e1d4);
  }

  @media (max-width: 600px) {
    .calc-footer {
      padding: 1rem;
    }
  }

  .footer-tip {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    font-size: 0.8rem;
    color: var(--muted, #5c665a);
    margin: 0;
    font-style: italic;
  }

  .tip-icon {
    font-size: 1rem;
    flex-shrink: 0;
  }
</style>
