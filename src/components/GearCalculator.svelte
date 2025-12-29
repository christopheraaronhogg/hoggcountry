<script>
  import { onMount } from 'svelte';
  import gearData from '../data/gear.json';

  let mounted = false;
  onMount(() => { mounted = true; });

  // State
  let targetWeight = 22;
  let season = 'winter';

  const ozToLbs = (oz) => oz / 16;
  const lbsToOz = (lbs) => lbs * 16;

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

  $: sortedItems = [...seasonItems].sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier;
    return b.weight - a.weight;
  });

  $: activeItems = (() => {
    const targetOz = lbsToOz(targetWeight);
    const active = [];
    let running = 0;
    for (const item of sortedItems) {
      if (running + item.weight <= targetOz) {
        active.push(item.id);
        running += item.weight;
      } else if (item.tier === 1) {
        active.push(item.id);
        running += item.weight;
      }
    }
    return new Set(active);
  })();

  $: carriedWeight = sortedItems
    .filter(item => activeItems.has(item.id) && !item.worn)
    .reduce((sum, item) => sum + item.weight, 0);

  $: wornWeight = sortedItems
    .filter(item => activeItems.has(item.id) && item.worn)
    .reduce((sum, item) => sum + item.weight, 0);

  $: totalWeight = carriedWeight + wornWeight;

  $: weightClass = (() => {
    const lbs = ozToLbs(carriedWeight);
    if (lbs <= 10) return { label: 'Ultralight', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' };
    if (lbs <= 15) return { label: 'Lightweight', color: '#a6b589', bg: 'rgba(166,181,137,0.1)' };
    if (lbs <= 20) return { label: 'Traditional', color: '#d97706', bg: 'rgba(217,119,6,0.1)' };
    return { label: 'Heavy', color: '#dc2626', bg: 'rgba(220,38,38,0.1)' };
  })();

  $: categoryBreakdown = (() => {
    const breakdown = {};
    for (const item of sortedItems) {
      if (activeItems.has(item.id)) {
        const cat = item.category;
        if (!breakdown[cat]) breakdown[cat] = { weight: 0, count: 0, ...gearData.categories[cat] };
        breakdown[cat].weight += item.weight;
        breakdown[cat].count++;
      }
    }
    return Object.entries(breakdown).sort((a, b) => b[1].weight - a[1].weight);
  })();

  $: excludedItems = sortedItems.filter(item => !activeItems.has(item.id));

  const formatWeight = (oz) => {
    const lbs = ozToLbs(oz);
    return lbs >= 1 ? `${lbs.toFixed(1)} lbs` : `${oz.toFixed(1)} oz`;
  };

  $: groupedItems = (() => {
    const groups = {};
    for (const item of sortedItems) {
      const cat = item.category;
      if (!groups[cat]) groups[cat] = { items: [], ...gearData.categories[cat] };
      groups[cat].items.push(item);
    }
    return Object.entries(groups);
  })();
</script>

<div class="gear-calc" class:mounted>
  <div class="calc-header">
    <div class="header-topo"></div>
    <div class="header-content">
      <span class="header-badge">{season === 'winter' ? '❄️ WINTER' : '☀️ SUMMER'} GEAR</span>
      <h2 class="header-title">Gear Weight Calculator</h2>
      <p class="header-sub">Optimize your pack for {season === 'winter' ? 'cold weather starts' : 'warm weather hiking'}</p>
    </div>
  </div>

  <div class="controls">
    <div class="control-group">
      <label class="control-label">
        <span class="label-icon">🗓️</span>
        <span class="label-text">Season</span>
      </label>
      <div class="season-btns">
        <button class="season-btn" class:active={season === 'winter'} on:click={() => season = 'winter'}>
          ❄️ Winter Start
        </button>
        <button class="season-btn" class:active={season === 'summer'} on:click={() => season = 'summer'}>
          ☀️ Post-Damascus
        </button>
      </div>
    </div>

    <div class="control-group">
      <label class="control-label">
        <span class="label-icon">⚖️</span>
        <span class="label-text">Target Base Weight</span>
      </label>
      <div class="weight-slider-row">
        <input type="range" min="10" max="30" step="0.5" bind:value={targetWeight} class="weight-slider" />
        <span class="weight-value">{targetWeight} lbs</span>
      </div>
    </div>
  </div>

  <div class="summary-bar">
    <div class="stat">
      <span class="stat-value">{ozToLbs(carriedWeight).toFixed(1)}</span>
      <span class="stat-label">Base Weight</span>
    </div>
    <div class="stat">
      <span class="stat-value">{ozToLbs(wornWeight).toFixed(1)}</span>
      <span class="stat-label">Worn</span>
    </div>
    <div class="stat highlight" style="background: {weightClass.bg}; border-color: {weightClass.color}">
      <span class="stat-value" style="color: {weightClass.color}">{ozToLbs(totalWeight).toFixed(1)}</span>
      <span class="stat-label">{weightClass.label}</span>
    </div>
  </div>

  <div class="category-section">
    <h3 class="section-title">
      <span class="title-blaze"></span>
      <span>Weight Distribution</span>
    </h3>
    <div class="category-bars">
      {#each categoryBreakdown as [catId, cat]}
        <div class="cat-row">
          <span class="cat-icon">{cat.icon}</span>
          <span class="cat-name">{cat.name}</span>
          <div class="cat-bar-track">
            <div class="cat-bar-fill" style="width: {Math.min((cat.weight / totalWeight) * 100, 100)}%; background: {cat.color}"></div>
          </div>
          <span class="cat-weight">{formatWeight(cat.weight)}</span>
        </div>
      {/each}
    </div>
  </div>

  <div class="items-section">
    <h3 class="section-title">
      <span class="title-blaze"></span>
      <span>Gear List</span>
      <span class="item-count">{activeItems.size} items included</span>
    </h3>

    {#each groupedItems as [catId, category]}
      <div class="category-group">
        <div class="cat-header">
          <span class="cat-icon">{category.icon}</span>
          <span>{category.name}</span>
        </div>
        <div class="items-list">
          {#each category.items as item}
            <div class="gear-item" class:active={activeItems.has(item.id)} class:essential={item.tier === 1}>
              <span class="item-name">
                {item.name}
                {#if item.worn}<span class="worn-tag">worn</span>{/if}
              </span>
              <span class="item-weight">{item.weight} oz</span>
              {#if item.tier === 1}<span class="tier-tag essential">Essential</span>{/if}
              {#if item.tier === 4}<span class="tier-tag luxury">Luxury</span>{/if}
            </div>
          {/each}
        </div>
      </div>
    {/each}
  </div>

  {#if excludedItems.length > 0}
    <div class="excluded-section">
      <h4>⚠️ Doesn't fit at {targetWeight} lbs</h4>
      <div class="excluded-list">
        {#each excludedItems as item}
          <span class="excluded-item">{item.name} ({item.weight} oz)</span>
        {/each}
      </div>
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
  .gear-calc.mounted { opacity: 1; transform: translateY(0); }

  .calc-header {
    position: relative;
    padding: 2rem 1.5rem 1.5rem;
    background: linear-gradient(135deg, var(--pine, #4d594a) 0%, #3a4238 100%);
    color: #fff;
  }
  .header-topo {
    position: absolute; inset: 0; opacity: 0.06;
    background-image:
      repeating-linear-gradient(0deg, transparent, transparent 18px, rgba(255,255,255,0.4) 18px, rgba(255,255,255,0.4) 19px),
      repeating-linear-gradient(90deg, transparent, transparent 18px, rgba(255,255,255,0.3) 18px, rgba(255,255,255,0.3) 19px);
  }
  .header-content { position: relative; }
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
    margin-bottom: 0.5rem;
  }
  .header-title {
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0 0 0.25rem;
  }
  .header-sub { font-size: 0.85rem; opacity: 0.8; margin: 0; }

  .controls {
    display: grid;
    grid-template-columns: 1fr 1.5fr;
    gap: 1.5rem;
    padding: 1.5rem;
    background: linear-gradient(to bottom, rgba(166,181,137,0.08), transparent);
    border-bottom: 1px solid var(--border, #e6e1d4);
  }
  @media (max-width: 600px) {
    .controls { grid-template-columns: 1fr; gap: 1rem; padding: 1rem; }
  }

  .control-group { display: flex; flex-direction: column; gap: 0.5rem; }
  .control-label {
    display: flex; align-items: center; gap: 0.4rem;
    font-size: 0.8rem; font-weight: 600;
    color: var(--pine, #4d594a);
    text-transform: uppercase; letter-spacing: 0.05em;
  }
  .label-icon { font-size: 1rem; }

  .season-btns { display: flex; gap: 0.5rem; }
  .season-btn {
    flex: 1;
    padding: 0.6rem 0.75rem;
    border: 2px solid var(--border, #e6e1d4);
    background: #fff;
    border-radius: 8px;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .season-btn:hover { border-color: var(--alpine, #a6b589); }
  .season-btn.active {
    background: var(--pine, #4d594a);
    border-color: var(--pine, #4d594a);
    color: #fff;
    font-weight: 600;
  }

  .weight-slider-row { display: flex; align-items: center; gap: 1rem; }
  .weight-slider {
    flex: 1; height: 8px;
    -webkit-appearance: none;
    appearance: none;
    background: linear-gradient(90deg, #22c55e, #a6b589, #d97706, #dc2626);
    border-radius: 4px;
    cursor: pointer;
  }
  .weight-slider::-webkit-slider-thumb {
    -webkit-appearance: none; appearance: none;
    width: 22px; height: 22px;
    background: var(--marker, #f0e000);
    border: 3px solid var(--pine, #4d594a);
    border-radius: 50%;
    cursor: grab;
    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
  }
  .weight-slider::-moz-range-thumb {
    width: 22px; height: 22px;
    background: var(--marker, #f0e000);
    border: 3px solid var(--pine, #4d594a);
    border-radius: 50%;
    cursor: grab;
  }
  .weight-value {
    font-family: Oswald, sans-serif;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--pine, #4d594a);
    min-width: 4.5rem;
    text-align: right;
  }

  .summary-bar {
    display: flex;
    justify-content: center;
    gap: 1.5rem;
    padding: 1.25rem;
    background: var(--bg, #f5f2e8);
    border-bottom: 1px solid var(--border, #e6e1d4);
  }
  .stat {
    display: flex; flex-direction: column; align-items: center;
    padding: 0.75rem 1.5rem;
    background: var(--card, #fff);
    border-radius: 10px;
    border: 2px solid var(--border, #e6e1d4);
    min-width: 90px;
  }
  .stat.highlight { border-width: 2px; }
  .stat-value {
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--pine, #4d594a);
    line-height: 1;
  }
  .stat-value::after { content: ' lb'; font-size: 0.75rem; font-weight: 400; color: var(--muted); }
  .stat-label {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--muted, #5c665a);
    margin-top: 0.25rem;
  }

  .category-section, .items-section { padding: 1.25rem 1.5rem; }
  .category-section { border-bottom: 1px solid var(--border, #e6e1d4); }

  .section-title {
    display: flex; align-items: center; gap: 0.6rem;
    font-family: Oswald, sans-serif;
    font-size: 0.9rem; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.08em;
    color: var(--pine, #4d594a);
    margin: 0 0 1rem;
  }
  .title-blaze {
    width: 6px; height: 14px;
    background: var(--marker, #f0e000);
    border-radius: 2px;
  }
  .item-count {
    margin-left: auto;
    font-size: 0.75rem; font-weight: 400;
    color: var(--muted); text-transform: none;
  }

  .category-bars { display: flex; flex-direction: column; gap: 0.6rem; }
  .cat-row {
    display: grid;
    grid-template-columns: 24px 90px 1fr 60px;
    align-items: center; gap: 0.5rem;
  }
  .cat-icon { font-size: 1rem; text-align: center; }
  .cat-name { font-size: 0.8rem; color: var(--pine); }
  .cat-bar-track {
    height: 14px;
    background: var(--bg, #f5f2e8);
    border-radius: 7px;
    overflow: hidden;
  }
  .cat-bar-fill {
    height: 100%;
    border-radius: 7px;
    transition: width 0.3s ease;
  }
  .cat-weight {
    font-family: Oswald, sans-serif;
    font-size: 0.8rem;
    color: var(--muted);
    text-align: right;
  }

  .category-group { margin-bottom: 1.25rem; }
  .cat-header {
    display: flex; align-items: center; gap: 0.4rem;
    font-size: 0.85rem; font-weight: 600;
    color: var(--pine);
    padding-bottom: 0.4rem;
    border-bottom: 1px dashed var(--border);
    margin-bottom: 0.5rem;
  }

  .items-list { display: flex; flex-direction: column; gap: 0.3rem; }
  .gear-item {
    display: flex; align-items: center; gap: 0.5rem;
    padding: 0.5rem 0.65rem;
    background: var(--bg, #f5f2e8);
    border-radius: 6px;
    border-left: 3px solid transparent;
    opacity: 0.4;
    transition: all 0.15s ease;
  }
  .gear-item.active { opacity: 1; border-left-color: var(--alpine, #a6b589); }
  .gear-item.essential { border-left-color: var(--pine, #4d594a); }

  .item-name { flex: 1; font-size: 0.8rem; color: var(--ink); }
  .worn-tag {
    font-size: 0.55rem; text-transform: uppercase;
    background: var(--alpine); color: #fff;
    padding: 0.1rem 0.3rem; border-radius: 3px;
    margin-left: 0.35rem;
  }
  .item-weight {
    font-family: Oswald, sans-serif;
    font-size: 0.75rem; color: var(--muted);
  }
  .tier-tag {
    font-size: 0.5rem; text-transform: uppercase;
    padding: 0.15rem 0.35rem; border-radius: 3px;
    font-weight: 600;
  }
  .tier-tag.essential { background: var(--pine); color: #fff; }
  .tier-tag.luxury { background: var(--terra); color: #fff; }

  .excluded-section {
    margin: 0 1.5rem 1.5rem;
    padding: 1rem;
    background: rgba(220,38,38,0.06);
    border: 1px solid rgba(220,38,38,0.2);
    border-radius: 10px;
  }
  .excluded-section h4 {
    font-size: 0.85rem; color: #b91c1c;
    margin: 0 0 0.5rem;
  }
  .excluded-list { display: flex; flex-wrap: wrap; gap: 0.35rem; }
  .excluded-item {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    background: #fff;
    border-radius: 4px;
    color: #7f1d1d;
  }

  @media (max-width: 600px) {
    .calc-header { padding: 1.5rem 1rem 1.25rem; }
    .header-title { font-size: 1.35rem; }
    .category-section, .items-section { padding: 1rem; }
    .cat-row { grid-template-columns: 20px 70px 1fr 50px; }
    .summary-bar { gap: 0.75rem; flex-wrap: wrap; }
    .stat { min-width: 80px; padding: 0.6rem 1rem; }
  }
</style>
