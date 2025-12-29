<script>
  import { onMount } from 'svelte';

  // Resupply towns with details
  const towns = [
    { mile: 0, name: 'Springer Mountain', type: 'trailhead', services: ['start'], mailDrop: false },
    { mile: 31, name: 'Neels Gap', type: 'outfitter', services: ['outfitter', 'snacks'], mailDrop: true },
    { mile: 69, name: 'Hiawassee', type: 'town', services: ['grocery', 'outfitter', 'restaurant'], mailDrop: true },
    { mile: 110, name: 'Franklin', type: 'town', services: ['grocery', 'outfitter', 'restaurant'], mailDrop: true },
    { mile: 165, name: 'Fontana Dam', type: 'limited', services: ['convenience', 'restaurant'], mailDrop: true },
    { mile: 206, name: 'Gatlinburg', type: 'town', services: ['grocery', 'outfitter', 'restaurant'], mailDrop: true },
    { mile: 274, name: 'Hot Springs', type: 'town', services: ['grocery', 'outfitter', 'restaurant'], mailDrop: true },
    { mile: 342, name: 'Erwin', type: 'town', services: ['grocery', 'outfitter', 'restaurant'], mailDrop: true },
    { mile: 473, name: 'Damascus', type: 'town', services: ['grocery', 'outfitter', 'restaurant'], mailDrop: true },
    { mile: 509, name: 'Atkins', type: 'limited', services: ['convenience', 'restaurant'], mailDrop: false },
    { mile: 636, name: 'Pearisburg', type: 'town', services: ['grocery', 'restaurant'], mailDrop: true },
    { mile: 726, name: 'Daleville', type: 'limited', services: ['grocery', 'restaurant'], mailDrop: true },
    { mile: 864, name: 'Waynesboro', type: 'town', services: ['grocery', 'outfitter', 'restaurant'], mailDrop: true },
    { mile: 942, name: 'Front Royal', type: 'town', services: ['grocery', 'restaurant'], mailDrop: true },
    { mile: 1025, name: 'Harpers Ferry', type: 'town', services: ['grocery', 'outfitter', 'restaurant'], mailDrop: true },
    { mile: 1141, name: 'Duncannon', type: 'limited', services: ['convenience', 'restaurant'], mailDrop: true },
    { mile: 1207, name: 'Port Clinton', type: 'limited', services: ['convenience'], mailDrop: true },
    { mile: 1290, name: 'Delaware Water Gap', type: 'town', services: ['grocery', 'outfitter', 'restaurant'], mailDrop: true },
    { mile: 1353, name: 'Unionville', type: 'limited', services: ['convenience'], mailDrop: false },
    { mile: 1409, name: 'Bear Mountain', type: 'limited', services: ['convenience', 'restaurant'], mailDrop: false },
    { mile: 1479, name: 'Kent', type: 'town', services: ['grocery', 'restaurant'], mailDrop: true },
    { mile: 1521, name: 'Salisbury', type: 'town', services: ['grocery', 'restaurant'], mailDrop: true },
    { mile: 1566, name: 'Great Barrington', type: 'town', services: ['grocery', 'restaurant'], mailDrop: true },
    { mile: 1595, name: 'Dalton', type: 'limited', services: ['convenience', 'restaurant'], mailDrop: true },
    { mile: 1650, name: 'Bennington', type: 'town', services: ['grocery', 'restaurant'], mailDrop: true },
    { mile: 1699, name: 'Manchester', type: 'town', services: ['grocery', 'outfitter', 'restaurant'], mailDrop: true },
    { mile: 1742, name: 'Killington', type: 'limited', services: ['convenience', 'restaurant'], mailDrop: true },
    { mile: 1773, name: 'Hanover', type: 'town', services: ['grocery', 'outfitter', 'restaurant'], mailDrop: true },
    { mile: 1823, name: 'Lincoln', type: 'town', services: ['grocery', 'restaurant'], mailDrop: true },
    { mile: 1862, name: 'Franconia', type: 'limited', services: ['convenience', 'restaurant'], mailDrop: true },
    { mile: 1897, name: 'Gorham', type: 'town', services: ['grocery', 'outfitter', 'restaurant'], mailDrop: true },
    { mile: 1940, name: 'Andover', type: 'limited', services: ['convenience'], mailDrop: true },
    { mile: 1976, name: 'Stratton', type: 'limited', services: ['convenience', 'restaurant'], mailDrop: true },
    { mile: 2010, name: 'Caratunk', type: 'limited', services: ['convenience'], mailDrop: true },
    { mile: 2090, name: 'Monson', type: 'town', services: ['grocery', 'restaurant'], mailDrop: true },
    { mile: 2198, name: 'Millinocket', type: 'town', services: ['grocery', 'restaurant'], mailDrop: true },
  ];

  const serviceIcons = {
    grocery: '🛒',
    outfitter: '🎒',
    convenience: '🏪',
    restaurant: '🍽️',
    start: '🏔️',
    snacks: '🍫',
  };

  const TOTAL_MILES = 2198;

  // Mode and state
  let mode = 'planning'; // 'planning' or 'trail'
  let mounted = false;

  // Planning mode state
  let startTownIndex = 0;
  let endTownIndex = 3;
  let pace = 15;
  let caloriesPerDay = 4000;

  // Trail mode state
  let currentMile = 200;

  onMount(() => {
    mounted = true;
  });

  // Calculations
  $: lbsPerDay = (caloriesPerDay / 1000) * 1.5; // ~1.5 lbs per 1000 calories
  $: costPerDay = 12; // Average $12/day for food

  // Planning mode calculations
  $: startTown = towns[startTownIndex];
  $: endTown = towns[endTownIndex];
  $: distance = endTown.mile - startTown.mile;
  $: daysToCarry = Math.ceil(distance / pace);
  $: foodWeight = (daysToCarry * lbsPerDay).toFixed(1);
  $: estimatedCost = (daysToCarry * costPerDay).toFixed(0);

  // Weight class
  $: weightClass = foodWeight <= 15 ? 'light' : foodWeight <= 25 ? 'medium' : 'heavy';
  $: weightLabel = weightClass === 'light' ? 'Light Carry' : weightClass === 'medium' ? 'Moderate Carry' : 'Heavy Carry';

  // Trail mode: next resupply options
  $: nextTowns = towns.filter(t => t.mile > currentMile).slice(0, 4);
  $: currentSection = towns.filter(t => t.mile <= currentMile).pop() || towns[0];

  // Get towns between start and end for planning visualization
  $: townsBetween = towns.filter(t => t.mile > startTown.mile && t.mile < endTown.mile);

  function getTypeColor(type) {
    switch(type) {
      case 'town': return 'var(--pine)';
      case 'outfitter': return 'var(--alpine)';
      case 'limited': return 'var(--terra)';
      default: return 'var(--muted)';
    }
  }

  function getTypeLabel(type) {
    switch(type) {
      case 'town': return 'Full Services';
      case 'outfitter': return 'Outfitter';
      case 'limited': return 'Limited';
      case 'trailhead': return 'Trailhead';
      default: return type;
    }
  }
</script>

<div class="resupply-calc" class:mounted>
  <!-- Header -->
  <header class="calc-header">
    <div class="header-inner">
      <span class="header-badge">AT 2026 NOBO</span>
      <h2 class="header-title">Resupply Planner</h2>
      <p class="header-sub">
        {mode === 'planning' ? 'Plan your food carries between towns' : 'Find your next resupply'}
      </p>
    </div>
    <div class="mode-toggle">
      <button
        class="mode-btn"
        class:active={mode === 'planning'}
        on:click={() => mode = 'planning'}
      >
        <span class="mode-icon">📋</span>
        <span class="mode-label">Planning</span>
      </button>
      <button
        class="mode-btn"
        class:active={mode === 'trail'}
        on:click={() => mode = 'trail'}
      >
        <span class="mode-icon">🥾</span>
        <span class="mode-label">On Trail</span>
      </button>
    </div>
  </header>

  {#if mode === 'planning'}
    <!-- Planning Mode -->
    <div class="controls-section">
      <div class="town-selectors">
        <div class="selector-group">
          <label class="control-label">Leaving From</label>
          <select bind:value={startTownIndex} class="town-select">
            {#each towns as town, i}
              {#if i < towns.length - 1}
                <option value={i}>{town.name} (mi {town.mile})</option>
              {/if}
            {/each}
          </select>
        </div>
        <div class="selector-arrow">→</div>
        <div class="selector-group">
          <label class="control-label">Resupply At</label>
          <select bind:value={endTownIndex} class="town-select">
            {#each towns as town, i}
              {#if i > startTownIndex}
                <option value={i}>{town.name} (mi {town.mile})</option>
              {/if}
            {/each}
          </select>
        </div>
      </div>

      <div class="config-row">
        <div class="config-item">
          <label class="control-label">Pace</label>
          <div class="config-value">
            <input type="number" bind:value={pace} min="8" max="30" class="num-input" />
            <span class="config-unit">mi/day</span>
          </div>
        </div>
        <div class="config-item">
          <label class="control-label">Calories</label>
          <div class="config-value">
            <input type="number" bind:value={caloriesPerDay} min="2500" max="6000" step="250" class="num-input cal-input" />
            <span class="config-unit">/day</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Carry Summary -->
    <div class="carry-summary">
      <div class="carry-hero">
        <div class="weight-gauge">
          <div class="gauge-fill {weightClass}" style="--fill-pct: {Math.min(100, (foodWeight / 40) * 100)}%"></div>
          <div class="gauge-marker" style="--marker-pos: {Math.min(100, (foodWeight / 40) * 100)}%"></div>
        </div>
        <div class="carry-stats">
          <div class="carry-main">
            <span class="carry-weight">{foodWeight}</span>
            <span class="carry-unit">lbs food</span>
          </div>
          <span class="carry-badge {weightClass}">{weightLabel}</span>
        </div>
      </div>

      <div class="carry-details">
        <div class="detail-card">
          <span class="detail-icon">📏</span>
          <div class="detail-content">
            <span class="detail-value">{distance}</span>
            <span class="detail-label">miles</span>
          </div>
        </div>
        <div class="detail-card">
          <span class="detail-icon">📅</span>
          <div class="detail-content">
            <span class="detail-value">{daysToCarry}</span>
            <span class="detail-label">days</span>
          </div>
        </div>
        <div class="detail-card">
          <span class="detail-icon">💵</span>
          <div class="detail-content">
            <span class="detail-value">${estimatedCost}</span>
            <span class="detail-label">~food cost</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Route Visualization -->
    <div class="route-section">
      <h3 class="section-title">
        <span class="title-blaze"></span>
        <span>Your Route</span>
      </h3>

      <div class="route-viz">
        <!-- Start Town -->
        <div class="route-town start">
          <div class="town-marker start-marker">
            <span class="marker-dot"></span>
          </div>
          <div class="town-info">
            <span class="town-name">{startTown.name}</span>
            <span class="town-mile">Mile {startTown.mile}</span>
          </div>
        </div>

        <!-- Path with distance -->
        <div class="route-path">
          <div class="path-line"></div>
          <div class="path-stats">
            <span class="path-distance">{distance} mi</span>
            <span class="path-days">{daysToCarry} days</span>
          </div>
          {#if townsBetween.length > 0}
            <div class="skip-towns">
              <span class="skip-label">Passing through:</span>
              {#each townsBetween as town}
                <span class="skip-town" style="--type-color: {getTypeColor(town.type)}">
                  {town.name}
                </span>
              {/each}
            </div>
          {/if}
        </div>

        <!-- End Town -->
        <div class="route-town end">
          <div class="town-marker end-marker">
            <span class="marker-dot"></span>
          </div>
          <div class="town-info">
            <span class="town-name">{endTown.name}</span>
            <span class="town-mile">Mile {endTown.mile}</span>
            <div class="town-services">
              {#each endTown.services as service}
                <span class="service-icon" title={service}>{serviceIcons[service] || '📍'}</span>
              {/each}
            </div>
            <span class="town-type" style="color: {getTypeColor(endTown.type)}">{getTypeLabel(endTown.type)}</span>
            {#if endTown.mailDrop}
              <span class="mail-badge">📬 Mail Drop OK</span>
            {/if}
          </div>
        </div>
      </div>
    </div>

    <!-- Food Planning Tips -->
    <div class="tips-section">
      <h3 class="section-title">
        <span class="title-blaze"></span>
        <span>Food Tips</span>
      </h3>
      <div class="tips-grid">
        <div class="tip-card">
          <span class="tip-icon">⚖️</span>
          <div class="tip-content">
            <span class="tip-title">Daily Need</span>
            <span class="tip-value">{lbsPerDay.toFixed(1)} lbs/day</span>
          </div>
        </div>
        <div class="tip-card">
          <span class="tip-icon">🔥</span>
          <div class="tip-content">
            <span class="tip-title">Target Density</span>
            <span class="tip-value">125+ cal/oz</span>
          </div>
        </div>
        <div class="tip-card">
          <span class="tip-icon">📦</span>
          <div class="tip-content">
            <span class="tip-title">Ideal Carry</span>
            <span class="tip-value">3-5 days</span>
          </div>
        </div>
      </div>
    </div>

  {:else}
    <!-- Trail Mode -->
    <div class="controls-section trail-mode">
      <div class="mile-input-section">
        <label class="control-label">Current Mile</label>
        <div class="mile-display">
          <span class="mile-value">{currentMile}</span>
          <span class="mile-context">near {currentSection.name}</span>
        </div>
        <div class="mile-slider-wrap">
          <input
            type="range"
            min="0"
            max="2198"
            step="1"
            bind:value={currentMile}
            class="mile-slider"
          />
          <div class="mile-progress" style="width: {(currentMile / TOTAL_MILES) * 100}%"></div>
        </div>
      </div>

      <div class="config-row single">
        <div class="config-item">
          <label class="control-label">Your Pace</label>
          <div class="config-value">
            <input type="number" bind:value={pace} min="8" max="30" class="num-input" />
            <span class="config-unit">mi/day</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Next Resupply Options -->
    <div class="next-resupply-section">
      <h3 class="section-title">
        <span class="title-blaze"></span>
        <span>Next Resupply Options</span>
      </h3>

      <div class="resupply-options">
        {#each nextTowns as town, i}
          {@const dist = town.mile - currentMile}
          {@const days = Math.ceil(dist / pace)}
          {@const food = (days * lbsPerDay).toFixed(1)}
          {@const wClass = food <= 15 ? 'light' : food <= 25 ? 'medium' : 'heavy'}
          <div class="resupply-card" class:recommended={i === 0}>
            {#if i === 0}
              <div class="recommended-badge">Nearest</div>
            {/if}
            <div class="card-header">
              <span class="card-mile">MI {town.mile}</span>
              <span class="card-type" style="background: {getTypeColor(town.type)}">{getTypeLabel(town.type)}</span>
            </div>
            <h4 class="card-name">{town.name}</h4>
            <div class="card-services">
              {#each town.services as service}
                <span class="service-tag">{serviceIcons[service] || '📍'} {service}</span>
              {/each}
            </div>
            <div class="card-stats">
              <div class="card-stat">
                <span class="stat-val">{dist}</span>
                <span class="stat-label">miles</span>
              </div>
              <div class="card-stat">
                <span class="stat-val">{days}</span>
                <span class="stat-label">days</span>
              </div>
              <div class="card-stat">
                <span class="stat-val {wClass}">{food}</span>
                <span class="stat-label">lbs food</span>
              </div>
            </div>
            {#if town.mailDrop}
              <div class="card-mail">📬 Accepts Mail Drops</div>
            {/if}
          </div>
        {/each}
      </div>

      {#if nextTowns.length === 0}
        <div class="no-towns">
          <span class="no-towns-icon">🏔️</span>
          <p>You've reached the end of the trail!</p>
        </div>
      {/if}
    </div>

    <!-- Quick Reference -->
    <div class="quick-ref-section">
      <h3 class="section-title">
        <span class="title-blaze"></span>
        <span>Quick Reference</span>
      </h3>
      <div class="ref-cards">
        <div class="ref-card">
          <span class="ref-icon">🛒</span>
          <span class="ref-label">Grocery</span>
          <span class="ref-desc">Full food selection</span>
        </div>
        <div class="ref-card">
          <span class="ref-icon">🎒</span>
          <span class="ref-label">Outfitter</span>
          <span class="ref-desc">Gear & trail food</span>
        </div>
        <div class="ref-card">
          <span class="ref-icon">🏪</span>
          <span class="ref-label">Convenience</span>
          <span class="ref-desc">Basics only</span>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .resupply-calc {
    background: var(--card, #fff);
    border-radius: 16px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    border: 1px solid var(--border);
    overflow: hidden;
    opacity: 0;
    transform: translateY(10px);
    transition: all 0.5s ease;
  }

  .resupply-calc.mounted {
    opacity: 1;
    transform: translateY(0);
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

  /* Mode Toggle */
  .mode-toggle {
    display: flex;
    gap: 0.5rem;
    margin-top: 1.25rem;
  }

  .mode-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: #fff;
    border: 2px solid var(--border);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: Oswald, sans-serif;
  }

  .mode-btn:hover:not(.active) {
    border-color: var(--alpine);
    background: rgba(166, 181, 137, 0.05);
  }

  .mode-btn.active {
    background: var(--pine);
    border-color: var(--pine);
    color: #fff;
  }

  .mode-icon { font-size: 1.1rem; }
  .mode-label {
    font-size: 0.85rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* Controls */
  .controls-section {
    padding: 1.5rem 2rem;
    border-bottom: 1px solid var(--border);
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

  .town-selectors {
    display: flex;
    align-items: flex-end;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .selector-group {
    flex: 1;
  }

  .selector-arrow {
    font-size: 1.5rem;
    color: var(--alpine);
    padding-bottom: 0.5rem;
  }

  .town-select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--border);
    border-radius: 8px;
    font-family: inherit;
    font-size: 0.95rem;
    color: var(--ink);
    background: #fff;
    cursor: pointer;
  }

  .config-row {
    display: flex;
    gap: 2rem;
  }

  .config-row.single {
    justify-content: center;
  }

  .config-item {
    flex: 1;
    max-width: 200px;
  }

  .config-value {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .num-input {
    width: 70px;
    padding: 0.75rem;
    border: 1px solid var(--border);
    border-radius: 8px;
    font-family: inherit;
    font-size: 1rem;
    text-align: center;
  }

  .cal-input {
    width: 90px;
  }

  .config-unit {
    font-size: 0.85rem;
    color: var(--muted);
  }

  /* Carry Summary */
  .carry-summary {
    padding: 2rem;
    background: var(--bg);
    border-bottom: 1px solid var(--border);
  }

  .carry-hero {
    display: flex;
    align-items: center;
    gap: 2rem;
    margin-bottom: 1.5rem;
  }

  .weight-gauge {
    flex: 1;
    height: 24px;
    background: linear-gradient(90deg,
      rgba(166, 181, 137, 0.3) 0%,
      rgba(166, 181, 137, 0.3) 37.5%,
      rgba(217, 119, 6, 0.3) 37.5%,
      rgba(217, 119, 6, 0.3) 62.5%,
      rgba(185, 28, 28, 0.3) 62.5%
    );
    border-radius: 12px;
    position: relative;
    overflow: hidden;
  }

  .gauge-fill {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: var(--fill-pct);
    border-radius: 12px;
    transition: width 0.5s ease;
  }

  .gauge-fill.light { background: var(--alpine); }
  .gauge-fill.medium { background: var(--terra); }
  .gauge-fill.heavy { background: #b91c1c; }

  .gauge-marker {
    position: absolute;
    left: var(--marker-pos);
    top: -4px;
    width: 4px;
    height: 32px;
    background: var(--ink);
    border-radius: 2px;
    transform: translateX(-50%);
    transition: left 0.5s ease;
  }

  .carry-stats {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.5rem;
    min-width: 120px;
  }

  .carry-main {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
  }

  .carry-weight {
    font-family: Oswald, sans-serif;
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--ink);
    line-height: 1;
  }

  .carry-unit {
    font-size: 0.9rem;
    color: var(--muted);
  }

  .carry-badge {
    font-family: Oswald, sans-serif;
    font-size: 0.7rem;
    font-weight: 600;
    padding: 0.25rem 0.6rem;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .carry-badge.light { background: rgba(166, 181, 137, 0.2); color: var(--pine); }
  .carry-badge.medium { background: rgba(217, 119, 6, 0.2); color: var(--terra); }
  .carry-badge.heavy { background: rgba(185, 28, 28, 0.2); color: #b91c1c; }

  .carry-details {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }

  .detail-card {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background: #fff;
    border-radius: 10px;
    border: 1px solid rgba(0,0,0,0.05);
  }

  .detail-icon { font-size: 1.25rem; }

  .detail-content {
    display: flex;
    flex-direction: column;
  }

  .detail-value {
    font-family: Oswald, sans-serif;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--ink);
    line-height: 1.1;
  }

  .detail-label {
    font-size: 0.7rem;
    color: var(--muted);
  }

  /* Section Title */
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

  /* Route Section */
  .route-section {
    padding: 2rem;
    border-bottom: 1px solid var(--border);
  }

  .route-viz {
    position: relative;
  }

  .route-town {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1rem;
    background: #fff;
    border-radius: 10px;
    border: 1px solid var(--border);
  }

  .route-town.start {
    border-left: 4px solid var(--alpine);
  }

  .route-town.end {
    border-left: 4px solid var(--pine);
  }

  .town-marker {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .marker-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--alpine);
  }

  .end-marker .marker-dot {
    background: var(--pine);
  }

  .town-info {
    flex: 1;
  }

  .town-name {
    font-family: Oswald, sans-serif;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--ink);
    display: block;
  }

  .town-mile {
    font-size: 0.85rem;
    color: var(--muted);
    display: block;
    margin-bottom: 0.5rem;
  }

  .town-services {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .service-icon {
    font-size: 1.1rem;
  }

  .town-type {
    font-family: Oswald, sans-serif;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .mail-badge {
    display: inline-block;
    margin-top: 0.5rem;
    font-size: 0.75rem;
    padding: 0.2rem 0.5rem;
    background: rgba(166, 181, 137, 0.1);
    border: 1px solid var(--alpine);
    border-radius: 4px;
    color: var(--pine);
  }

  .route-path {
    padding: 1.5rem 0 1.5rem 2rem;
    position: relative;
  }

  .path-line {
    position: absolute;
    left: 1.5rem;
    top: 0;
    bottom: 0;
    width: 2px;
    background: repeating-linear-gradient(
      to bottom,
      var(--marker) 0,
      var(--marker) 8px,
      transparent 8px,
      transparent 16px
    );
  }

  .path-stats {
    display: inline-flex;
    gap: 1rem;
    padding: 0.5rem 1rem;
    background: rgba(240, 224, 0, 0.15);
    border-radius: 6px;
    margin-bottom: 0.75rem;
  }

  .path-distance, .path-days {
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--pine);
  }

  .skip-towns {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
  }

  .skip-label {
    font-size: 0.8rem;
    color: var(--muted);
  }

  .skip-town {
    font-size: 0.75rem;
    padding: 0.2rem 0.5rem;
    background: #f5f5f5;
    border-radius: 4px;
    border-left: 3px solid var(--type-color);
    color: var(--muted);
  }

  /* Tips Section */
  .tips-section {
    padding: 2rem;
  }

  .tips-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }

  .tip-card {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background: linear-gradient(135deg, rgba(240, 224, 0, 0.08), rgba(240, 224, 0, 0.02));
    border: 1px solid rgba(240, 224, 0, 0.3);
    border-radius: 10px;
  }

  .tip-icon { font-size: 1.5rem; }

  .tip-content {
    display: flex;
    flex-direction: column;
  }

  .tip-title {
    font-size: 0.75rem;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .tip-value {
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 600;
    color: var(--pine);
  }

  /* Trail Mode */
  .trail-mode {
    padding-bottom: 2rem;
  }

  .mile-input-section {
    margin-bottom: 1.5rem;
  }

  .mile-display {
    display: flex;
    align-items: baseline;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .mile-value {
    font-family: Oswald, sans-serif;
    font-size: 3rem;
    font-weight: 700;
    color: var(--pine);
    line-height: 1;
  }

  .mile-context {
    font-size: 1rem;
    color: var(--muted);
    font-style: italic;
  }

  .mile-slider-wrap {
    position: relative;
    height: 32px;
    background: var(--bg);
    border-radius: 8px;
    overflow: hidden;
  }

  .mile-slider {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    -webkit-appearance: none;
    background: transparent;
    cursor: pointer;
    z-index: 2;
  }

  .mile-slider::-webkit-slider-runnable-track {
    height: 100%;
    background: transparent;
  }

  .mile-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    height: 28px;
    width: 12px;
    border-radius: 4px;
    background: var(--pine);
    margin-top: 2px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    cursor: grab;
  }

  .mile-slider::-moz-range-track {
    height: 100%;
    background: transparent;
    border: none;
  }

  .mile-slider::-moz-range-thumb {
    height: 24px;
    width: 10px;
    border-radius: 4px;
    background: var(--pine);
    border: none;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    cursor: grab;
  }

  .mile-progress {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    background: linear-gradient(90deg, var(--alpine), var(--pine));
    pointer-events: none;
    z-index: 1;
  }

  /* Resupply Cards */
  .next-resupply-section {
    padding: 2rem;
    background: var(--bg);
    border-bottom: 1px solid var(--border);
  }

  .resupply-options {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .resupply-card {
    position: relative;
    padding: 1.25rem;
    background: #fff;
    border-radius: 12px;
    border: 1px solid var(--border);
    transition: all 0.2s ease;
  }

  .resupply-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.08);
  }

  .resupply-card.recommended {
    border-color: var(--pine);
    border-width: 2px;
  }

  .recommended-badge {
    position: absolute;
    top: -8px;
    right: 1rem;
    font-family: Oswald, sans-serif;
    font-size: 0.65rem;
    font-weight: 700;
    padding: 0.2rem 0.5rem;
    background: var(--pine);
    color: #fff;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .card-mile {
    font-family: Oswald, sans-serif;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--muted);
  }

  .card-type {
    font-family: Oswald, sans-serif;
    font-size: 0.65rem;
    font-weight: 600;
    padding: 0.15rem 0.4rem;
    border-radius: 4px;
    color: #fff;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .card-name {
    font-family: Oswald, sans-serif;
    font-size: 1.15rem;
    font-weight: 600;
    color: var(--ink);
    margin: 0 0 0.5rem;
  }

  .card-services {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-bottom: 1rem;
  }

  .service-tag {
    font-size: 0.7rem;
    padding: 0.15rem 0.4rem;
    background: #f5f5f5;
    border-radius: 4px;
    color: var(--muted);
    text-transform: capitalize;
  }

  .card-stats {
    display: flex;
    gap: 1rem;
    padding-top: 0.75rem;
    border-top: 1px solid var(--border);
  }

  .card-stat {
    display: flex;
    flex-direction: column;
  }

  .stat-val {
    font-family: Oswald, sans-serif;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--ink);
    line-height: 1.1;
  }

  .stat-val.light { color: var(--pine); }
  .stat-val.medium { color: var(--terra); }
  .stat-val.heavy { color: #b91c1c; }

  .stat-label {
    font-size: 0.65rem;
    color: var(--muted);
  }

  .card-mail {
    margin-top: 0.75rem;
    font-size: 0.75rem;
    color: var(--pine);
  }

  .no-towns {
    text-align: center;
    padding: 3rem;
    color: var(--muted);
  }

  .no-towns-icon {
    font-size: 3rem;
    display: block;
    margin-bottom: 1rem;
  }

  /* Quick Reference */
  .quick-ref-section {
    padding: 2rem;
  }

  .ref-cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }

  .ref-card {
    text-align: center;
    padding: 1rem;
    background: #fff;
    border-radius: 10px;
    border: 1px solid var(--border);
  }

  .ref-icon {
    font-size: 1.5rem;
    display: block;
    margin-bottom: 0.5rem;
  }

  .ref-label {
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--ink);
    display: block;
  }

  .ref-desc {
    font-size: 0.75rem;
    color: var(--muted);
  }

  /* Responsive */
  @media (max-width: 640px) {
    .calc-header { padding: 1.5rem; }
    .controls-section { padding: 1.5rem; }
    .town-selectors { flex-direction: column; gap: 0.5rem; }
    .selector-arrow { text-align: center; padding: 0.25rem 0; }
    .config-row { flex-direction: column; gap: 1rem; }
    .config-item { max-width: none; }
    .carry-hero { flex-direction: column; gap: 1rem; }
    .carry-stats { align-items: center; }
    .carry-details { grid-template-columns: 1fr; }
    .tips-grid { grid-template-columns: 1fr; }
    .resupply-options { grid-template-columns: 1fr; }
    .ref-cards { grid-template-columns: 1fr; }
    .route-section { padding: 1.5rem; }
    .next-resupply-section { padding: 1.5rem; }
    .quick-ref-section { padding: 1.5rem; }
  }
</style>
