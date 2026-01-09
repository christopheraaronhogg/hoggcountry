<script>
  import { onMount } from 'svelte';

  let { trailContext = {} } = $props();

  let mounted = $state(false);

  const towns = [
    { mile: 0, name: 'Springer Mountain', type: 'trailhead', services: ['start'], mailDrop: false, costs: null },
    { mile: 31, name: 'Neels Gap', type: 'outfitter', services: ['outfitter', 'snacks'], mailDrop: true, costs: { resupply: 25, meal: 12 } },
    { mile: 69, name: 'Hiawassee', type: 'town', services: ['grocery', 'outfitter', 'restaurant'], mailDrop: true, costs: { hostel: 30, motel: 70, resupply: 15, meal: 12, laundry: 6 } },
    { mile: 110, name: 'Franklin', type: 'town', services: ['grocery', 'outfitter', 'restaurant'], mailDrop: true, costs: { hostel: 28, motel: 65, resupply: 14, meal: 11, laundry: 6 } },
    { mile: 165, name: 'Fontana Dam', type: 'limited', services: ['convenience', 'restaurant'], mailDrop: true, costs: { resupply: 20, meal: 14 } },
    { mile: 206, name: 'Gatlinburg', type: 'town', services: ['grocery', 'outfitter', 'restaurant'], mailDrop: true, costs: { hostel: 35, motel: 90, resupply: 16, meal: 15, laundry: 7 } },
    { mile: 274, name: 'Hot Springs', type: 'town', services: ['grocery', 'outfitter', 'restaurant'], mailDrop: true, costs: { hostel: 30, motel: 75, resupply: 15, meal: 13, laundry: 6 } },
    { mile: 342, name: 'Erwin', type: 'town', services: ['grocery', 'outfitter', 'restaurant'], mailDrop: true, costs: { hostel: 25, motel: 60, resupply: 13, meal: 10, laundry: 5 } },
    { mile: 473, name: 'Damascus', type: 'town', services: ['grocery', 'outfitter', 'restaurant'], mailDrop: true, costs: { hostel: 28, motel: 65, resupply: 14, meal: 11, laundry: 5 } },
    { mile: 509, name: 'Atkins', type: 'limited', services: ['convenience', 'restaurant'], mailDrop: false, costs: { resupply: 18, meal: 10 } },
    { mile: 636, name: 'Pearisburg', type: 'town', services: ['grocery', 'restaurant'], mailDrop: true, costs: { hostel: 25, motel: 60, resupply: 13, meal: 10, laundry: 5 } },
    { mile: 726, name: 'Daleville', type: 'limited', services: ['grocery', 'restaurant'], mailDrop: true, costs: { motel: 70, resupply: 14, meal: 12, laundry: 6 } },
    { mile: 864, name: 'Waynesboro', type: 'town', services: ['grocery', 'outfitter', 'restaurant'], mailDrop: true, costs: { hostel: 30, motel: 65, resupply: 14, meal: 11, laundry: 6 } },
    { mile: 942, name: 'Front Royal', type: 'town', services: ['grocery', 'restaurant'], mailDrop: true, costs: { motel: 75, resupply: 15, meal: 12, laundry: 6 } },
    { mile: 1025, name: 'Harpers Ferry', type: 'town', services: ['grocery', 'outfitter', 'restaurant'], mailDrop: true, costs: { hostel: 35, motel: 85, resupply: 16, meal: 14, laundry: 7 } },
    { mile: 1141, name: 'Duncannon', type: 'limited', services: ['convenience', 'restaurant'], mailDrop: true, costs: { hostel: 25, resupply: 15, meal: 10 } },
    { mile: 1207, name: 'Port Clinton', type: 'limited', services: ['convenience'], mailDrop: true, costs: { hostel: 25, resupply: 15 } },
    { mile: 1290, name: 'Delaware Water Gap', type: 'town', services: ['grocery', 'outfitter', 'restaurant'], mailDrop: true, costs: { hostel: 35, motel: 80, resupply: 16, meal: 14, laundry: 7 } },
    { mile: 1353, name: 'Unionville', type: 'limited', services: ['convenience'], mailDrop: false, costs: { resupply: 18 } },
    { mile: 1409, name: 'Bear Mountain', type: 'limited', services: ['convenience', 'restaurant'], mailDrop: false, costs: { resupply: 20, meal: 15 } },
    { mile: 1479, name: 'Kent', type: 'town', services: ['grocery', 'restaurant'], mailDrop: true, costs: { motel: 100, resupply: 18, meal: 16, laundry: 8 } },
    { mile: 1521, name: 'Salisbury', type: 'town', services: ['grocery', 'restaurant'], mailDrop: true, costs: { motel: 95, resupply: 17, meal: 15, laundry: 7 } },
    { mile: 1566, name: 'Great Barrington', type: 'town', services: ['grocery', 'restaurant'], mailDrop: true, costs: { motel: 100, resupply: 18, meal: 16, laundry: 8 } },
    { mile: 1595, name: 'Dalton', type: 'limited', services: ['convenience', 'restaurant'], mailDrop: true, costs: { resupply: 16, meal: 12 } },
    { mile: 1650, name: 'Bennington', type: 'town', services: ['grocery', 'restaurant'], mailDrop: true, costs: { motel: 85, resupply: 16, meal: 14, laundry: 7 } },
    { mile: 1699, name: 'Manchester', type: 'town', services: ['grocery', 'outfitter', 'restaurant'], mailDrop: true, costs: { hostel: 40, motel: 110, resupply: 18, meal: 16, laundry: 8 } },
    { mile: 1742, name: 'Killington', type: 'limited', services: ['convenience', 'restaurant'], mailDrop: true, costs: { motel: 90, resupply: 18, meal: 15 } },
    { mile: 1773, name: 'Hanover', type: 'town', services: ['grocery', 'outfitter', 'restaurant'], mailDrop: true, costs: { motel: 120, resupply: 18, meal: 17, laundry: 8 } },
    { mile: 1823, name: 'Lincoln', type: 'town', services: ['grocery', 'restaurant'], mailDrop: true, costs: { hostel: 35, motel: 100, resupply: 17, meal: 15, laundry: 7 } },
    { mile: 1862, name: 'Franconia', type: 'limited', services: ['convenience', 'restaurant'], mailDrop: true, costs: { hostel: 35, resupply: 18, meal: 14 } },
    { mile: 1897, name: 'Gorham', type: 'town', services: ['grocery', 'outfitter', 'restaurant'], mailDrop: true, costs: { hostel: 35, motel: 85, resupply: 16, meal: 14, laundry: 7 } },
    { mile: 1940, name: 'Andover', type: 'limited', services: ['convenience'], mailDrop: true, costs: { hostel: 30, resupply: 16 } },
    { mile: 1976, name: 'Stratton', type: 'limited', services: ['convenience', 'restaurant'], mailDrop: true, costs: { hostel: 32, resupply: 18, meal: 14 } },
    { mile: 2010, name: 'Caratunk', type: 'limited', services: ['convenience'], mailDrop: true, costs: { hostel: 30, resupply: 18 } },
    { mile: 2090, name: 'Monson', type: 'town', services: ['grocery', 'restaurant'], mailDrop: true, costs: { hostel: 35, motel: 80, resupply: 16, meal: 14, laundry: 7 } },
    { mile: 2198, name: 'Millinocket', type: 'town', services: ['grocery', 'restaurant'], mailDrop: true, costs: { motel: 75, resupply: 15, meal: 12, laundry: 6 } },
  ];

  const serviceIcons = {
    grocery: '🛒',
    outfitter: '🎒',
    convenience: '🏪',
    restaurant: '🍽️',
    start: '🏔️',
    snacks: '🍫',
  };

  let mode = $derived(trailContext.mode || 'planning');
  let pace = $derived(trailContext.pace || trailContext.targetPace || 15);
  let currentMile = $derived(trailContext.currentMile || 200);

  let startTownIndex = $state(0);
  let endTownIndex = $state(3);
  let caloriesPerDay = $state(4000);

  onMount(() => {
    mounted = true;
  });

  // Food weight: 0.6 oz per 100 calories (calorie-dense trail food standard)
  // 4000 cal/day = 24 oz = 1.5 lbs/day
  let ozPerDay = $derived((caloriesPerDay / 100) * 0.6);
  let lbsPerDay = $derived(ozPerDay / 16);
  let costPerDay = $derived(12);

  let startTown = $derived(towns[startTownIndex]);
  let endTown = $derived(towns[endTownIndex]);
  let distance = $derived(endTown.mile - startTown.mile);
  let daysToCarry = $derived(Math.ceil(distance / pace));
  let foodWeight = $derived((daysToCarry * lbsPerDay).toFixed(1));
  let estimatedCost = $derived((daysToCarry * costPerDay).toFixed(0));

  let weightClass = $derived(foodWeight <= 15 ? 'light' : foodWeight <= 25 ? 'medium' : 'heavy');
  let weightLabel = $derived(weightClass === 'light' ? 'Light Carry' : weightClass === 'medium' ? 'Moderate' : 'Heavy Carry');

  let destCosts = $derived(endTown.costs || {});

  let townStopCostBudget = $derived((destCosts.resupply || 15) * daysToCarry +
    (destCosts.meal || 12) * 2 +
    (destCosts.hostel || 30) +
    (destCosts.laundry || 5));
  let townStopCostComfort = $derived((destCosts.resupply || 15) * daysToCarry +
    (destCosts.meal || 12) * 3 +
    (destCosts.motel || destCosts.hostel || 50) +
    (destCosts.laundry || 5));

  let nextTowns = $derived(towns.filter(t => t.mile > currentMile).slice(0, 4));
  let townsBetween = $derived(towns.filter(t => t.mile > startTown.mile && t.mile < endTown.mile));

  function getTypeColor(type) {
    switch(type) {
      case 'town': return '#16a34a';
      case 'outfitter': return '#0284c7';
      case 'limited': return '#d97706';
      default: return '#6b7280';
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
    <div class="header-shelf"></div>
    <div class="header-content">
      <div class="header-icon">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.49 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
        </svg>
      </div>
      <div class="header-text">
        <h2>Resupply Planner</h2>
        <p>Plan food carries between trail towns</p>
      </div>
      <div class="weight-badge {weightClass}">
        <span class="badge-weight">{foodWeight}</span>
        <span class="badge-unit">lbs</span>
      </div>
    </div>
  </header>

  {#if mode === 'planning'}
  <!-- Town Selectors -->
  <div class="route-selectors">
    <div class="selector-box from">
      <div class="selector-label">
        <span class="label-dot"></span>
        Leaving From
      </div>
      <select bind:value={startTownIndex} class="town-select">
        {#each towns as town, i}
          {#if i < towns.length - 1}
            <option value={i}>{town.name} (mi {town.mile})</option>
          {/if}
        {/each}
      </select>
    </div>

    <div class="route-arrow">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M5 12h14M12 5l7 7-7 7"/>
      </svg>
    </div>

    <div class="selector-box to">
      <div class="selector-label">
        <span class="label-dot"></span>
        Resupply At
      </div>
      <select bind:value={endTownIndex} class="town-select">
        {#each towns as town, i}
          {#if i > startTownIndex}
            <option value={i}>{town.name} (mi {town.mile})</option>
          {/if}
        {/each}
      </select>
    </div>
  </div>

  <!-- Settings Bar -->
  <div class="settings-bar">
    <div class="setting-item">
      <label>Pace</label>
      <div class="setting-input">
        <input type="number" bind:value={pace} min="8" max="30" />
        <span>mi/day</span>
      </div>
    </div>
    <div class="setting-item">
      <label>Calories</label>
      <div class="setting-input">
        <input type="number" bind:value={caloriesPerDay} min="2500" max="6000" step="250" />
        <span>/day</span>
      </div>
    </div>
    <div class="setting-result">
      <span class="result-label">Food per day:</span>
      <span class="result-value">{lbsPerDay.toFixed(1)} lbs</span>
    </div>
  </div>

  <!-- Carry Hero -->
  <div class="carry-hero">
    <div class="hero-gauge">
      <svg viewBox="0 0 200 100" class="gauge-svg">
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#22c55e"/>
            <stop offset="40%" style="stop-color:#22c55e"/>
            <stop offset="50%" style="stop-color:#eab308"/>
            <stop offset="65%" style="stop-color:#f97316"/>
            <stop offset="80%" style="stop-color:#ef4444"/>
            <stop offset="100%" style="stop-color:#dc2626"/>
          </linearGradient>
        </defs>
        <path d="M 20 90 A 80 80 0 0 1 180 90" fill="none" stroke="#e5e7eb" stroke-width="16" stroke-linecap="round"/>
        <path d="M 20 90 A 80 80 0 0 1 180 90" fill="none" stroke="url(#gaugeGrad)" stroke-width="16" stroke-linecap="round"
              stroke-dasharray="251.3" stroke-dashoffset={251.3 - (Math.min(40, parseFloat(foodWeight)) / 40) * 251.3}
              class="gauge-arc"/>
        <circle cx={100 + 80 * Math.cos((Math.PI) + (Math.min(40, parseFloat(foodWeight)) / 40) * Math.PI)}
                cy={90 - 80 * Math.sin((Math.PI) + (Math.min(40, parseFloat(foodWeight)) / 40) * Math.PI)}
                r="8" fill="#fff" stroke="var(--pine)" stroke-width="3" class="gauge-dot"/>
      </svg>
      <div class="gauge-center">
        <span class="gauge-weight">{foodWeight}</span>
        <span class="gauge-label">lbs food</span>
      </div>
      <div class="gauge-marks">
        <span>0</span>
        <span>15</span>
        <span>25</span>
        <span>40</span>
      </div>
    </div>

    <div class="hero-stats">
      <div class="stat-card">
        <div class="stat-icon">📏</div>
        <div class="stat-data">
          <span class="stat-num">{distance}</span>
          <span class="stat-unit">miles</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📅</div>
        <div class="stat-data">
          <span class="stat-num">{daysToCarry}</span>
          <span class="stat-unit">days</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">💰</div>
        <div class="stat-data">
          <span class="stat-num">${estimatedCost}</span>
          <span class="stat-unit">~food</span>
        </div>
      </div>
    </div>

    <div class="carry-status {weightClass}">
      <span class="status-icon">
        {#if weightClass === 'light'}✓{:else if weightClass === 'medium'}⚠{:else}⬆{/if}
      </span>
      <span class="status-text">{weightLabel}</span>
      <span class="status-hint">
        {#if weightClass === 'light'}Comfortable carry
        {:else if weightClass === 'medium'}Manageable
        {:else}Consider shorter resupply{/if}
      </span>
    </div>
  </div>

  <!-- Route Map -->
  <section class="route-section">
    <h3 class="section-title">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"/>
      </svg>
      Your Route
    </h3>

    <div class="route-map">
      <div class="map-start">
        <div class="map-pin start">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
        <div class="map-info">
          <span class="map-name">{startTown.name}</span>
          <span class="map-mile">Mile {startTown.mile}</span>
        </div>
      </div>

      <div class="map-trail">
        <div class="trail-line"></div>
        <div class="trail-badge">
          <span class="trail-dist">{distance} mi</span>
          <span class="trail-days">{daysToCarry} days</span>
        </div>
        {#if townsBetween.length > 0}
          <div class="pass-through">
            <span class="pass-label">Passing:</span>
            {#each townsBetween as t}
              <span class="pass-town" style="--type-color: {getTypeColor(t.type)}">{t.name}</span>
            {/each}
          </div>
        {/if}
      </div>

      <div class="map-end">
        <div class="map-pin end">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
        <div class="map-info">
          <span class="map-name">{endTown.name}</span>
          <span class="map-mile">Mile {endTown.mile}</span>
          <div class="map-services">
            {#each endTown.services as s}
              <span class="svc-chip">{serviceIcons[s] || '📍'} {s}</span>
            {/each}
          </div>
          <div class="map-tags">
            <span class="type-tag" style="background: {getTypeColor(endTown.type)}">{getTypeLabel(endTown.type)}</span>
            {#if endTown.mailDrop}
              <span class="mail-tag">📬 Mail OK</span>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Food Tips -->
  <section class="tips-section">
    <h3 class="section-title">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z"/>
      </svg>
      Methodology
    </h3>
    <div class="tips-grid">
      <div class="tip-box">
        <span class="tip-emoji">⚖️</span>
        <span class="tip-title">Weight Ratio</span>
        <span class="tip-val">0.6 oz/100 cal</span>
      </div>
      <div class="tip-box">
        <span class="tip-emoji">🔥</span>
        <span class="tip-title">Calorie Density</span>
        <span class="tip-val">~167 cal/oz</span>
      </div>
      <div class="tip-box">
        <span class="tip-emoji">📦</span>
        <span class="tip-title">Ideal Carry</span>
        <span class="tip-val">3-5 days</span>
      </div>
    </div>
    <p class="method-note">Assumes calorie-dense trail food (nuts, bars, dehydrated meals). Real weight varies by food choices.</p>
  </section>

  <!-- Town Costs -->
  {#if endTown.costs}
  <section class="costs-section">
    <h3 class="section-title">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
      </svg>
      Town Costs: {endTown.name}
    </h3>

    <div class="costs-grid">
      {#if destCosts.hostel}
        <div class="cost-chip">
          <span class="cost-emoji">🛏️</span>
          <span class="cost-type">Hostel</span>
          <span class="cost-amt">${destCosts.hostel}</span>
        </div>
      {/if}
      {#if destCosts.motel}
        <div class="cost-chip">
          <span class="cost-emoji">🏨</span>
          <span class="cost-type">Motel</span>
          <span class="cost-amt">${destCosts.motel}</span>
        </div>
      {/if}
      {#if destCosts.resupply}
        <div class="cost-chip">
          <span class="cost-emoji">🛒</span>
          <span class="cost-type">Food/day</span>
          <span class="cost-amt">${destCosts.resupply}</span>
        </div>
      {/if}
      {#if destCosts.meal}
        <div class="cost-chip">
          <span class="cost-emoji">🍽️</span>
          <span class="cost-type">Meal</span>
          <span class="cost-amt">${destCosts.meal}</span>
        </div>
      {/if}
      {#if destCosts.laundry}
        <div class="cost-chip">
          <span class="cost-emoji">🧺</span>
          <span class="cost-type">Laundry</span>
          <span class="cost-amt">${destCosts.laundry}</span>
        </div>
      {/if}
    </div>

    <div class="estimate-cards">
      <div class="estimate-card budget">
        <div class="est-icon">💵</div>
        <div class="est-info">
          <span class="est-title">Budget Stop</span>
          <span class="est-desc">Hostel + 2 meals + laundry</span>
        </div>
        <span class="est-total">${townStopCostBudget}</span>
      </div>
      <div class="estimate-card comfort">
        <div class="est-icon">✨</div>
        <div class="est-info">
          <span class="est-title">Comfort Stop</span>
          <span class="est-desc">Motel + 3 meals + laundry</span>
        </div>
        <span class="est-total">${townStopCostComfort}</span>
      </div>
    </div>

    <p class="costs-note">Includes ${(destCosts.resupply || 15) * daysToCarry} for {daysToCarry}-day food carry. 2024 estimates.</p>
  </section>
  {/if}

  {:else}
  <!-- Trail Mode -->
  <section class="next-section">
    <h3 class="section-title">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
      </svg>
      Next Resupply Options
    </h3>

    <div class="next-grid">
      {#each nextTowns as town, i}
        {@const dist = town.mile - currentMile}
        {@const days = Math.ceil(dist / pace)}
        {@const food = (days * lbsPerDay).toFixed(1)}
        {@const wClass = food <= 15 ? 'light' : food <= 25 ? 'medium' : 'heavy'}
        <div class="next-card" class:first={i === 0}>
          {#if i === 0}
            <div class="first-badge">Nearest</div>
          {/if}
          <div class="next-header">
            <span class="next-mile">MI {town.mile}</span>
            <span class="next-type" style="background: {getTypeColor(town.type)}">{getTypeLabel(town.type)}</span>
          </div>
          <h4 class="next-name">{town.name}</h4>
          <div class="next-services">
            {#each town.services as s}
              <span>{serviceIcons[s]}</span>
            {/each}
          </div>
          <div class="next-stats">
            <div class="ns">
              <span class="ns-val">{dist}</span>
              <span class="ns-lbl">mi</span>
            </div>
            <div class="ns">
              <span class="ns-val">{days}</span>
              <span class="ns-lbl">days</span>
            </div>
            <div class="ns {wClass}">
              <span class="ns-val">{food}</span>
              <span class="ns-lbl">lbs</span>
            </div>
          </div>
          {#if town.mailDrop}
            <div class="next-mail">📬 Mail Drops OK</div>
          {/if}
        </div>
      {/each}
    </div>
  </section>

  <section class="legend-section">
    <h3 class="section-title">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
      </svg>
      Quick Reference
    </h3>
    <div class="legend-grid">
      <div class="legend-item">
        <span class="leg-icon">🛒</span>
        <span class="leg-name">Grocery</span>
        <span class="leg-desc">Full selection</span>
      </div>
      <div class="legend-item">
        <span class="leg-icon">🎒</span>
        <span class="leg-name">Outfitter</span>
        <span class="leg-desc">Gear + trail food</span>
      </div>
      <div class="legend-item">
        <span class="leg-icon">🏪</span>
        <span class="leg-name">Convenience</span>
        <span class="leg-desc">Basics only</span>
      </div>
    </div>
  </section>
  {/if}

  <!-- Guide Link -->
  <a href="/guide/14-food-and-resupply" class="guide-link">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
    Food & Resupply Guide
  </a>
</div>

<style>
  .resupply-calc {
    background: var(--bg, #faf9f6);
    border: 2px solid var(--border);
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
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
    position: relative;
    background: linear-gradient(135deg, #1e3a2f 0%, #2d5a45 100%);
    padding: 1.5rem;
    overflow: hidden;
  }

  .header-shelf {
    position: absolute;
    inset: 0;
    background:
      repeating-linear-gradient(90deg, transparent, transparent 30px, rgba(255,255,255,0.03) 30px, rgba(255,255,255,0.03) 32px);
  }

  .header-content {
    position: relative;
    display: flex;
    align-items: center;
    gap: 1rem;
    z-index: 1;
  }

  .header-icon {
    width: 52px;
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255,255,255,0.15);
    border-radius: 12px;
    color: #fff;
  }

  .header-text {
    flex: 1;
  }

  .header-text h2 {
    margin: 0;
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: #fff;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .header-text p {
    margin: 0.25rem 0 0;
    font-size: 0.85rem;
    color: rgba(255,255,255,0.7);
  }

  .weight-badge {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.75rem 1rem;
    background: rgba(0,0,0,0.3);
    border-radius: 12px;
    border: 2px solid rgba(255,255,255,0.2);
  }

  .weight-badge.light { border-color: #22c55e; }
  .weight-badge.medium { border-color: #f59e0b; }
  .weight-badge.heavy { border-color: #ef4444; }

  .badge-weight {
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: #fff;
    line-height: 1;
  }

  .badge-unit {
    font-size: 0.65rem;
    color: rgba(255,255,255,0.7);
    text-transform: uppercase;
  }

  /* Route Selectors */
  .route-selectors {
    display: flex;
    align-items: flex-end;
    gap: 1rem;
    padding: 1.25rem;
    background: #fff;
    border-bottom: 2px solid var(--border);
  }

  .selector-box {
    flex: 1;
  }

  .selector-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-family: Oswald, sans-serif;
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--muted);
    margin-bottom: 0.5rem;
  }

  .label-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }

  .from .label-dot { background: #22c55e; }
  .to .label-dot { background: var(--pine); }

  .town-select {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid var(--border);
    border-radius: 10px;
    font-family: inherit;
    font-size: 0.9rem;
    color: var(--ink);
    background: var(--bg);
    cursor: pointer;
    transition: border-color 0.2s;
  }

  .town-select:focus {
    outline: none;
    border-color: var(--alpine);
  }

  .route-arrow {
    padding-bottom: 0.5rem;
    color: var(--alpine);
  }

  /* Settings Bar */
  .settings-bar {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    padding: 0.75rem 1.25rem;
    background: #f8fafc;
    border-bottom: 2px solid var(--border);
  }

  .setting-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .setting-item label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--muted);
  }

  .setting-input {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .setting-input input {
    width: 60px;
    padding: 0.4rem;
    border: 1px solid var(--border);
    border-radius: 6px;
    font-family: inherit;
    font-size: 0.9rem;
    text-align: center;
  }

  .setting-input span {
    font-size: 0.75rem;
    color: var(--muted);
  }

  .setting-result {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .result-label {
    font-size: 0.75rem;
    color: var(--muted);
  }

  .result-value {
    font-family: Oswald, sans-serif;
    font-weight: 600;
    color: var(--pine);
  }

  /* Carry Hero */
  .carry-hero {
    padding: 1.5rem;
    background: linear-gradient(to bottom, #f0fdf4, var(--bg));
    border-bottom: 2px solid var(--border);
  }

  .hero-gauge {
    position: relative;
    max-width: 300px;
    margin: 0 auto 1.5rem;
  }

  .gauge-svg {
    width: 100%;
    height: auto;
  }

  .gauge-arc {
    transition: stroke-dashoffset 0.6s ease;
  }

  .gauge-dot {
    transition: all 0.6s ease;
  }

  .gauge-center {
    position: absolute;
    bottom: 10px;
    left: 50%;
    transform: translateX(-50%);
    text-align: center;
  }

  .gauge-weight {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--ink);
    line-height: 1;
  }

  .gauge-label {
    font-size: 0.75rem;
    color: var(--muted);
  }

  .gauge-marks {
    display: flex;
    justify-content: space-between;
    padding: 0 10%;
    font-size: 0.65rem;
    color: var(--muted);
  }

  .hero-stats {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .stat-card {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: #fff;
    border: 2px solid var(--border);
    border-radius: 10px;
  }

  .stat-icon {
    font-size: 1.25rem;
  }

  .stat-data {
    display: flex;
    flex-direction: column;
  }

  .stat-num {
    font-family: Oswald, sans-serif;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--ink);
    line-height: 1;
  }

  .stat-unit {
    font-size: 0.65rem;
    color: var(--muted);
  }

  .carry-status {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 0.75rem 1.25rem;
    border-radius: 10px;
    max-width: 400px;
    margin: 0 auto;
  }

  .carry-status.light {
    background: #dcfce7;
    border: 2px solid #86efac;
  }

  .carry-status.medium {
    background: #fef3c7;
    border: 2px solid #fcd34d;
  }

  .carry-status.heavy {
    background: #fee2e2;
    border: 2px solid #fca5a5;
  }

  .status-icon {
    font-size: 1.25rem;
  }

  .status-text {
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 600;
  }

  .carry-status.light .status-text { color: #166534; }
  .carry-status.medium .status-text { color: #92400e; }
  .carry-status.heavy .status-text { color: #991b1b; }

  .status-hint {
    font-size: 0.8rem;
    color: var(--muted);
  }

  /* Section Title */
  .section-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: var(--pine);
    margin: 0 0 1rem;
  }

  /* Route Section */
  .route-section {
    padding: 1.25rem;
    border-bottom: 2px solid var(--border);
  }

  .route-map {
    position: relative;
  }

  .map-start, .map-end {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 1rem;
    background: #fff;
    border: 2px solid var(--border);
    border-radius: 12px;
  }

  .map-pin {
    flex-shrink: 0;
  }

  .map-pin.start { color: #22c55e; }
  .map-pin.end { color: var(--pine); }

  .map-info {
    flex: 1;
  }

  .map-name {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--ink);
  }

  .map-mile {
    font-size: 0.8rem;
    color: var(--muted);
  }

  .map-services {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    margin: 0.5rem 0;
  }

  .svc-chip {
    font-size: 0.7rem;
    padding: 0.2rem 0.5rem;
    background: var(--bg);
    border-radius: 4px;
    color: var(--muted);
    text-transform: capitalize;
  }

  .map-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .type-tag {
    font-family: Oswald, sans-serif;
    font-size: 0.65rem;
    font-weight: 600;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    color: #fff;
    text-transform: uppercase;
  }

  .mail-tag {
    font-size: 0.7rem;
    padding: 0.2rem 0.5rem;
    background: #f0fdf4;
    border: 1px solid #86efac;
    border-radius: 4px;
    color: #166534;
  }

  .map-trail {
    padding: 1rem 0 1rem 2.5rem;
    position: relative;
  }

  .trail-line {
    position: absolute;
    left: 11px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: repeating-linear-gradient(
      to bottom,
      var(--marker) 0, var(--marker) 8px,
      transparent 8px, transparent 16px
    );
  }

  .trail-badge {
    display: inline-flex;
    gap: 1rem;
    padding: 0.4rem 0.75rem;
    background: #fef3c7;
    border: 1px solid #fcd34d;
    border-radius: 6px;
    margin-bottom: 0.75rem;
  }

  .trail-dist, .trail-days {
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    color: #92400e;
  }

  .pass-through {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    align-items: center;
  }

  .pass-label {
    font-size: 0.75rem;
    color: var(--muted);
  }

  .pass-town {
    font-size: 0.7rem;
    padding: 0.15rem 0.4rem;
    background: #f5f5f5;
    border-left: 3px solid var(--type-color);
    border-radius: 4px;
    color: var(--muted);
  }

  /* Tips Section */
  .tips-section {
    padding: 1.25rem;
    background: #fffbeb;
    border-bottom: 2px solid #fcd34d;
  }

  .tips-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
  }

  .tip-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1rem;
    background: #fff;
    border: 2px solid #fde68a;
    border-radius: 10px;
    text-align: center;
  }

  .tip-emoji {
    font-size: 1.5rem;
    margin-bottom: 0.35rem;
  }

  .tip-title {
    font-size: 0.65rem;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--muted);
  }

  .tip-val {
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 600;
    color: var(--pine);
  }

  .method-note {
    margin: 0.75rem 0 0;
    font-size: 0.7rem;
    color: var(--muted);
    text-align: center;
    font-style: italic;
  }

  /* Costs Section */
  .costs-section {
    padding: 1.25rem;
    background: #f0fdf4;
    border-bottom: 2px solid #86efac;
  }

  .costs-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .cost-chip {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 8px;
  }

  .cost-emoji {
    font-size: 1rem;
  }

  .cost-type {
    font-size: 0.7rem;
    color: var(--muted);
  }

  .cost-amt {
    font-family: Oswald, sans-serif;
    font-weight: 600;
    color: var(--pine);
  }

  .estimate-cards {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .estimate-card {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    border-radius: 10px;
  }

  .estimate-card.budget {
    background: #fff;
    border: 2px solid var(--border);
  }

  .estimate-card.comfort {
    background: #fff;
    border: 2px solid var(--alpine);
  }

  .est-icon {
    font-size: 1.25rem;
  }

  .est-info {
    flex: 1;
  }

  .est-title {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--ink);
  }

  .est-desc {
    font-size: 0.65rem;
    color: var(--muted);
  }

  .est-total {
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--pine);
  }

  .costs-note {
    margin: 0;
    font-size: 0.7rem;
    color: var(--muted);
    text-align: center;
    font-style: italic;
  }

  /* Trail Mode */
  .next-section {
    padding: 1.25rem;
    background: var(--bg);
    border-bottom: 2px solid var(--border);
  }

  .next-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  .next-card {
    position: relative;
    padding: 1rem;
    background: #fff;
    border: 2px solid var(--border);
    border-radius: 12px;
    transition: all 0.2s;
  }

  .next-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0,0,0,0.08);
  }

  .next-card.first {
    border-color: var(--pine);
  }

  .first-badge {
    position: absolute;
    top: -8px;
    right: 1rem;
    font-family: Oswald, sans-serif;
    font-size: 0.6rem;
    font-weight: 700;
    padding: 0.15rem 0.5rem;
    background: var(--pine);
    color: #fff;
    border-radius: 4px;
    text-transform: uppercase;
  }

  .next-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.35rem;
  }

  .next-mile {
    font-family: Oswald, sans-serif;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--muted);
  }

  .next-type {
    font-family: Oswald, sans-serif;
    font-size: 0.55rem;
    font-weight: 700;
    padding: 0.15rem 0.35rem;
    border-radius: 4px;
    color: #fff;
    text-transform: uppercase;
  }

  .next-name {
    margin: 0 0 0.5rem;
    font-family: Oswald, sans-serif;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--ink);
  }

  .next-services {
    display: flex;
    gap: 0.35rem;
    margin-bottom: 0.75rem;
  }

  .next-stats {
    display: flex;
    gap: 0.75rem;
    padding-top: 0.5rem;
    border-top: 1px solid var(--border);
  }

  .ns {
    display: flex;
    flex-direction: column;
  }

  .ns-val {
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 600;
    color: var(--ink);
    line-height: 1;
  }

  .ns.light .ns-val { color: #16a34a; }
  .ns.medium .ns-val { color: #d97706; }
  .ns.heavy .ns-val { color: #dc2626; }

  .ns-lbl {
    font-size: 0.6rem;
    color: var(--muted);
  }

  .next-mail {
    margin-top: 0.5rem;
    font-size: 0.7rem;
    color: var(--pine);
  }

  /* Legend Section */
  .legend-section {
    padding: 1.25rem;
  }

  .legend-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
  }

  .legend-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 0.75rem;
    background: #fff;
    border: 2px solid var(--border);
    border-radius: 10px;
  }

  .leg-icon {
    font-size: 1.25rem;
    margin-bottom: 0.25rem;
  }

  .leg-name {
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--ink);
  }

  .leg-desc {
    font-size: 0.65rem;
    color: var(--muted);
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
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    text-decoration: none;
    transition: background 0.2s;
  }

  .guide-link:hover {
    background: var(--alpine);
  }

  /* Responsive */
  @media (max-width: 640px) {
    .calc-header { padding: 1.25rem; }

    .header-icon {
      width: 44px;
      height: 44px;
    }

    .header-icon svg {
      width: 28px;
      height: 28px;
    }

    .header-text h2 {
      font-size: 1.25rem;
    }

    .route-selectors {
      flex-direction: column;
      gap: 0.5rem;
    }

    .route-arrow {
      transform: rotate(90deg);
      padding: 0.25rem 0;
    }

    .settings-bar {
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .setting-result {
      margin-left: 0;
      width: 100%;
      justify-content: center;
    }

    .hero-gauge {
      max-width: 240px;
    }

    .gauge-weight {
      font-size: 2rem;
    }

    .hero-stats {
      flex-wrap: wrap;
    }

    .stat-card {
      padding: 0.5rem 0.75rem;
    }

    .carry-status {
      flex-wrap: wrap;
      text-align: center;
    }

    .tips-grid {
      grid-template-columns: 1fr;
    }

    .estimate-cards {
      grid-template-columns: 1fr;
    }

    .next-grid {
      grid-template-columns: 1fr;
    }

    .legend-grid {
      grid-template-columns: 1fr;
    }

    .costs-grid {
      justify-content: center;
    }
  }
</style>
