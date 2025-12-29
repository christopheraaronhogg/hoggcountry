<script>
  import gearData from '../data/gear.json';

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
</script>

<div class="gear-calculator">
  <div class="controls">
    <div class="slider-section">
      <label for="weight-slider">Target Base Weight</label>
      <div class="slider-row">
        <span class="slider-min">15 lbs</span>
        <input
          type="range"
          id="weight-slider"
          min="15"
          max="35"
          step="0.5"
          bind:value={targetWeight}
        />
        <span class="slider-max">35 lbs</span>
      </div>
      <div class="weight-display">
        <span class="current-target">{targetWeight} lbs</span>
      </div>
    </div>

    <div class="season-toggle">
      <span class="toggle-label">Season:</span>
      <button
        class="toggle-btn"
        class:active={season === 'winter'}
        on:click={() => season = 'winter'}
      >
        ❄️ Winter Start
      </button>
      <button
        class="toggle-btn"
        class:active={season === 'summer'}
        on:click={() => season = 'summer'}
      >
        ☀️ Post-Damascus
      </button>
    </div>
  </div>

  <div class="summary">
    <div class="stat">
      <span class="stat-value">{formatWeight(carriedWeight)}</span>
      <span class="stat-label">Base Weight</span>
    </div>
    <div class="stat">
      <span class="stat-value">{formatWeight(wornWeight)}</span>
      <span class="stat-label">Worn</span>
    </div>
    <div class="stat total">
      <span class="stat-value">{formatWeight(totalWeight)}</span>
      <span class="stat-label">Total System</span>
    </div>
  </div>

  <div class="category-bars">
    {#each categoryBreakdown as [catId, cat]}
      <div class="cat-bar">
        <span class="cat-icon">{cat.icon}</span>
        <span class="cat-name">{cat.name}</span>
        <div class="cat-bar-fill" style="width: {(cat.weight / totalWeight) * 100}%; background: {cat.color}"></div>
        <span class="cat-weight">{formatWeight(cat.weight)}</span>
      </div>
    {/each}
  </div>

  <div class="gear-grid">
    {#each sortedItems as item (item.id)}
      <div
        class="gear-item"
        class:active={activeItems.has(item.id)}
        class:essential={item.tier === 1}
        class:worn={item.worn}
      >
        <span class="item-icon">{gearData.categories[item.category]?.icon || '📦'}</span>
        <span class="item-name">{item.name}</span>
        <span class="item-weight">{item.weight} oz</span>
        {#if item.tier === 1}
          <span class="tier-badge essential">Essential</span>
        {:else if item.tier === 4}
          <span class="tier-badge luxury">Luxury</span>
        {/if}
      </div>
    {/each}
  </div>

  {#if excludedItems.length > 0}
    <div class="excluded-section">
      <h4>Doesn't Fit at {targetWeight} lbs:</h4>
      <div class="excluded-list">
        {#each excludedItems as item}
          <span class="excluded-item">{item.name} ({item.weight} oz)</span>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .gear-calculator {
    font-family: inherit;
  }

  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
    padding: 1.25rem;
    background: var(--card, #fff);
    border: 1px solid var(--border, #e6e1d4);
    border-radius: 12px;
  }

  .slider-section {
    flex: 1;
    min-width: 250px;
  }

  .slider-section label {
    display: block;
    font-weight: 600;
    color: var(--pine, #4d594a);
    margin-bottom: 0.5rem;
  }

  .slider-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .slider-min, .slider-max {
    font-size: 0.8rem;
    color: var(--muted, #5c665a);
    white-space: nowrap;
  }

  input[type="range"] {
    flex: 1;
    height: 8px;
    -webkit-appearance: none;
    background: var(--stone, #ccc);
    border-radius: 4px;
    cursor: pointer;
  }

  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 20px;
    height: 20px;
    background: var(--marker, #f0e000);
    border: 2px solid #e0d400;
    border-radius: 50%;
    cursor: grab;
  }

  input[type="range"]::-webkit-slider-thumb:active {
    cursor: grabbing;
  }

  .weight-display {
    text-align: center;
    margin-top: 0.5rem;
  }

  .current-target {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--ink, #1f2937);
    font-family: Oswald, sans-serif;
  }

  .season-toggle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .toggle-label {
    font-weight: 600;
    color: var(--pine, #4d594a);
  }

  .toggle-btn {
    padding: 0.4rem 0.75rem;
    border: 1px solid var(--stone, #ccc);
    background: #fff;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.85rem;
    transition: all 0.15s ease;
  }

  .toggle-btn:hover {
    border-color: var(--alpine, #a6b589);
  }

  .toggle-btn.active {
    background: var(--alpine, #a6b589);
    border-color: var(--pine, #4d594a);
    color: #fff;
    font-weight: 600;
  }

  .summary {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
  }

  .stat {
    flex: 1;
    min-width: 100px;
    padding: 1rem;
    background: var(--card, #fff);
    border: 1px solid var(--border, #e6e1d4);
    border-radius: 10px;
    text-align: center;
  }

  .stat.total {
    background: var(--marker, #f0e000);
    border-color: #e0d400;
  }

  .stat-value {
    display: block;
    font-size: 1.25rem;
    font-weight: 700;
    font-family: Oswald, sans-serif;
    color: var(--ink, #1f2937);
  }

  .stat-label {
    font-size: 0.75rem;
    color: var(--muted, #5c665a);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .category-bars {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: var(--card, #fff);
    border: 1px solid var(--border, #e6e1d4);
    border-radius: 10px;
  }

  .cat-bar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    position: relative;
    height: 28px;
  }

  .cat-icon {
    width: 24px;
    text-align: center;
  }

  .cat-name {
    width: 120px;
    font-size: 0.8rem;
    color: var(--pine, #4d594a);
  }

  .cat-bar-fill {
    height: 16px;
    border-radius: 4px;
    transition: width 0.3s ease;
    min-width: 4px;
  }

  .cat-weight {
    font-size: 0.75rem;
    color: var(--muted, #5c665a);
    margin-left: auto;
  }

  .gear-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }

  .gear-item {
    position: relative;
    padding: 0.75rem;
    background: var(--card, #fff);
    border: 1px solid var(--border, #e6e1d4);
    border-radius: 8px;
    opacity: 0.4;
    transform: scale(0.95);
    transition: all 0.2s ease;
  }

  .gear-item.active {
    opacity: 1;
    transform: scale(1);
    border-color: var(--alpine, #a6b589);
  }

  .gear-item.active.essential {
    border-color: var(--pine, #4d594a);
    border-width: 2px;
  }

  .gear-item.worn {
    background: #f9fafb;
  }

  .item-icon {
    display: block;
    font-size: 1.25rem;
    margin-bottom: 0.25rem;
  }

  .item-name {
    display: block;
    font-size: 0.8rem;
    font-weight: 500;
    color: var(--ink, #1f2937);
    line-height: 1.2;
    margin-bottom: 0.25rem;
  }

  .item-weight {
    font-size: 0.7rem;
    color: var(--muted, #5c665a);
  }

  .tier-badge {
    position: absolute;
    top: 4px;
    right: 4px;
    font-size: 0.55rem;
    padding: 0.15rem 0.35rem;
    border-radius: 3px;
    text-transform: uppercase;
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

  .excluded-section {
    padding: 1rem;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 10px;
  }

  .excluded-section h4 {
    margin: 0 0 0.5rem;
    font-size: 0.9rem;
    color: #991b1b;
  }

  .excluded-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .excluded-item {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    background: #fff;
    border-radius: 4px;
    color: #7f1d1d;
  }

  @media (max-width: 600px) {
    .controls {
      flex-direction: column;
    }

    .gear-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .cat-name {
      width: 80px;
      font-size: 0.7rem;
    }
  }
</style>
