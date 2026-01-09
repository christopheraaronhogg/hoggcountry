<script>
  import { onMount } from 'svelte';

  let { trailContext = {} } = $props();

  let mounted = $state(false);

  // Current mile from context
  let currentMile = $state(trailContext?.currentMile || 0);

  // Track completed transitions
  let completedTransitions = $state({});

  // Sync with trail context
  $effect(() => {
    if (trailContext?.currentMile !== undefined) {
      currentMile = trailContext.currentMile;
    }
  });

  onMount(() => {
    mounted = true;
    // Load saved transitions
    const saved = localStorage.getItem('at-gear-transitions');
    if (saved) {
      try {
        completedTransitions = JSON.parse(saved);
      } catch (e) {}
    }
  });

  // Save when changed
  $effect(() => {
    if (mounted) {
      localStorage.setItem('at-gear-transitions', JSON.stringify(completedTransitions));
    }
  });

  // Gear transition data from guide
  const transitions = [
    {
      id: 'hot-springs',
      mile: 275,
      town: 'Hot Springs, NC',
      phase: 'Early Spring → Spring',
      description: 'Elevation drops. Freeze-thaw risk largely ends.',
      drop: [
        { item: 'Microspikes', weight: 12, reason: 'Ice risk minimal after NC highlands' },
        { item: 'Chemical water treatment', weight: 2, reason: 'Filter freeze risk manageable now' },
      ],
      add: [],
      swap: [
        { from: 'Chemical + Filter', to: 'Filter only', reason: 'Simplify water treatment' },
      ],
      weightSaved: 14,
    },
    {
      id: 'damascus',
      mile: 469,
      town: 'Damascus, VA',
      phase: 'Spring → Late Spring',
      description: 'Major transition. Daytime 50s-60s. Nights rarely freezing. Pack swap to ultralight.',
      drop: [
        { item: 'Osprey Atmos AG LT 50', weight: 67, reason: 'Heavy suspension no longer needed' },
        { item: 'Merino 250 Sleep Pants', weight: 8.7, reason: 'Too warm for summer nights' },
        { item: 'Zenbivy 10° Winter Quilt', weight: 29.5, reason: 'Swap for 3-season quilt' },
        { item: 'R-8 Sleeping Pad', weight: 25, reason: 'R-value overkill for summer' },
      ],
      add: [
        { item: 'Hyperlite Southwest 55L', weight: 29, reason: 'Dyneema, waterproof, ultralight' },
        { item: 'Lightweight sleep layers', weight: 8, reason: 'Thin merino or synthetic' },
        { item: 'Vesper Quilt (20-30°)', weight: 20, reason: '3-season warmth, lighter' },
        { item: 'R-3.5 Sleeping Pad', weight: 15, reason: 'Adequate for warm ground' },
      ],
      swap: [],
      weightSaved: 66,
      critical: true,
    },
    {
      id: 'pre-whites',
      mile: 1747,
      town: 'Hanover, NH',
      phase: 'Summer → Late Summer',
      description: 'Prepare for White Mountains. Weather changes fast above treeline.',
      drop: [],
      add: [
        { item: 'Warmer sleep layers', weight: 8, reason: 'Cold nights return at elevation' },
        { item: 'Extra insulation layer', weight: 6, reason: 'Wind and exposure above treeline' },
      ],
      swap: [
        { from: 'Vesper Quilt (40°)', to: '20-30° Quilt', reason: 'Nights can hit 30s in Whites' },
      ],
      weightSaved: -14,
      critical: true,
    },
    {
      id: 'maine-prep',
      mile: 1912,
      town: 'Gorham, NH',
      phase: 'Whites → Maine',
      description: 'Last major resupply before 100-Mile Wilderness push.',
      drop: [],
      add: [
        { item: 'Extra food capacity', weight: 0, reason: '7+ day carry for 100-Mile' },
        { item: 'Rain gear check', weight: 0, reason: 'Ensure waterproofing is intact' },
      ],
      swap: [],
      weightSaved: 0,
      notes: 'Verify all gear is functional. No bailouts for 100 miles.',
      critical: true,
    },
  ];

  // Gear phases based on mile
  const gearPhases = [
    { id: 'winter', name: 'Winter Start', start: 0, end: 275, color: '#3b82f6', icon: '❄️' },
    { id: 'spring', name: 'Spring', start: 275, end: 469, color: '#22c55e', icon: '🌱' },
    { id: 'summer', name: 'Summer', start: 469, end: 1747, color: '#f59e0b', icon: '☀️' },
    { id: 'late-summer', name: 'Late Summer', start: 1747, end: 1912, color: '#ea580c', icon: '🍂' },
    { id: 'maine', name: 'Maine Push', start: 1912, end: 2198, color: '#8b5cf6', icon: '🏔️' },
  ];

  // Current phase
  let currentPhase = $derived(
    gearPhases.find(p => currentMile >= p.start && currentMile < p.end) || gearPhases[gearPhases.length - 1]
  );

  // Next transition
  let nextTransition = $derived(
    transitions.find(t => t.mile > currentMile)
  );

  // Previous transitions
  let pastTransitions = $derived(
    transitions.filter(t => t.mile <= currentMile)
  );

  // Miles to next transition
  let milesToNext = $derived(
    nextTransition ? (nextTransition.mile - currentMile).toFixed(0) : 0
  );

  // Toggle transition complete
  function toggleTransition(id) {
    completedTransitions = {
      ...completedTransitions,
      [id]: !completedTransitions[id]
    };
  }

  // Calculate total weight saved
  let totalWeightSaved = $derived.by(() => {
    return pastTransitions
      .filter(t => completedTransitions[t.id])
      .reduce((sum, t) => sum + (t.weightSaved || 0), 0);
  });

  // Phase arc calculation for SVG
  function describeArc(cx, cy, r, startAngle, endAngle) {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  }

  function polarToCartesian(cx, cy, r, angleDeg) {
    const angleRad = (angleDeg - 90) * Math.PI / 180;
    return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
  }

  // Overall progress percentage
  let overallProgress = $derived(Math.min(100, (currentMile / 2198) * 100));

  // Progress marker position
  let markerAngle = $derived(-150 + overallProgress * 3);
  let markerPos = $derived(polarToCartesian(100, 100, 70, markerAngle));
</script>

<div class="gear-tracker" class:mounted>
  <!-- Header -->
  <header class="tracker-header">
    <div class="header-left">
      <div class="header-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <path d="M16 10a4 4 0 0 1-8 0"/>
        </svg>
      </div>
      <div class="header-text">
        <h2>GEAR DEPOT</h2>
        <p>Seasonal Transition Operations</p>
      </div>
    </div>
    {#if totalWeightSaved > 0}
      <div class="weight-badge">
        <span class="wb-value">-{(totalWeightSaved / 16).toFixed(1)}</span>
        <span class="wb-unit">LBS</span>
      </div>
    {/if}
  </header>

  <!-- Phase Arc Visualization -->
  <section class="phase-arc-section">
    <div class="arc-container">
      <svg viewBox="0 0 200 120" class="phase-arc-svg">
        <!-- Background arc -->
        <path
          d={describeArc(100, 100, 70, -150, 150)}
          fill="none"
          stroke="var(--border)"
          stroke-width="12"
          stroke-linecap="round"
        />
        <!-- Phase segments -->
        {#each gearPhases as phase, i}
          {@const segmentStart = -150 + (phase.start / 2198) * 300}
          {@const segmentEnd = -150 + (phase.end / 2198) * 300}
          {@const isActive = phase.id === currentPhase.id}
          {@const isPast = currentMile >= phase.end}
          <path
            d={describeArc(100, 100, 70, segmentStart, segmentEnd)}
            fill="none"
            stroke={phase.color}
            stroke-width="12"
            stroke-linecap="round"
            opacity={isActive ? 1 : isPast ? 0.6 : 0.25}
            class="phase-segment"
            class:active={isActive}
          />
        {/each}
      </svg>
      <!-- Progress marker overlay -->
      <svg viewBox="0 0 200 120" class="phase-arc-marker">
        <circle
          cx={markerPos.x}
          cy={markerPos.y}
          r="8"
          fill="#fff"
          stroke={currentPhase.color}
          stroke-width="3"
          class="progress-marker"
        />
      </svg>

      <div class="arc-center">
        <span class="arc-icon">{currentPhase.icon}</span>
        <span class="arc-phase">{currentPhase.name}</span>
        <span class="arc-mile">Mile {currentMile}</span>
      </div>
    </div>

    <!-- Phase Legend -->
    <div class="phase-legend">
      {#each gearPhases as phase}
        <div class="legend-item" class:active={phase.id === currentPhase.id}>
          <span class="legend-dot" style="background: {phase.color}"></span>
          <span class="legend-name">{phase.name}</span>
        </div>
      {/each}
    </div>
  </section>

  <!-- Next Operation -->
  {#if nextTransition}
  <section class="next-op">
    <div class="op-header">
      <div class="op-title">
        <span class="op-label">NEXT DEPOT</span>
        <h3>{nextTransition.town}</h3>
      </div>
      <div class="op-eta">
        <span class="eta-value">{milesToNext}</span>
        <span class="eta-unit">mi</span>
      </div>
    </div>

    <div class="op-card" class:critical={nextTransition.critical}>
      <div class="op-meta">
        <span class="op-mile">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          Mile {nextTransition.mile}
        </span>
        <span class="op-phase-change">{nextTransition.phase}</span>
      </div>

      <p class="op-brief">{nextTransition.description}</p>

      {#if nextTransition.critical}
        <div class="critical-banner">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span>CRITICAL TRANSITION</span>
        </div>
      {/if}

      <!-- Operations Grid -->
      <div class="ops-grid">
        {#if nextTransition.drop.length > 0}
        <div class="op-block ship-out">
          <div class="block-header">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="7.5 4.21 12 6.81 16.5 4.21"/>
              <polyline points="7.5 19.79 7.5 14.6 3 12"/>
              <polyline points="21 12 16.5 14.6 16.5 19.79"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
            <span>SHIP HOME</span>
          </div>
          <div class="block-items">
            {#each nextTransition.drop as item}
              <div class="item-row">
                <span class="item-name">{item.item}</span>
                <span class="item-oz">-{item.weight}oz</span>
              </div>
              <p class="item-note">{item.reason}</p>
            {/each}
          </div>
        </div>
        {/if}

        {#if nextTransition.add.length > 0}
        <div class="op-block receive">
          <div class="block-header">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
              <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
            </svg>
            <span>RECEIVE</span>
          </div>
          <div class="block-items">
            {#each nextTransition.add as item}
              <div class="item-row">
                <span class="item-name">{item.item}</span>
                {#if item.weight > 0}
                  <span class="item-oz add">+{item.weight}oz</span>
                {/if}
              </div>
              <p class="item-note">{item.reason}</p>
            {/each}
          </div>
        </div>
        {/if}

        {#if nextTransition.swap.length > 0}
        <div class="op-block exchange">
          <div class="block-header">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="17 1 21 5 17 9"/>
              <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
              <polyline points="7 23 3 19 7 15"/>
              <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
            </svg>
            <span>EXCHANGE</span>
          </div>
          <div class="block-items">
            {#each nextTransition.swap as item}
              <div class="swap-row">
                <span class="swap-out">{item.from}</span>
                <span class="swap-arrow">→</span>
                <span class="swap-in">{item.to}</span>
              </div>
              <p class="item-note">{item.reason}</p>
            {/each}
          </div>
        </div>
        {/if}
      </div>

      {#if nextTransition.notes}
      <div class="op-notes">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>{nextTransition.notes}</span>
      </div>
      {/if}

      {#if nextTransition.weightSaved !== 0}
      <div class="weight-delta" class:gain={nextTransition.weightSaved < 0}>
        <span class="delta-label">Net Weight</span>
        <span class="delta-value">
          {nextTransition.weightSaved > 0 ? '−' : '+'}{Math.abs(nextTransition.weightSaved / 16).toFixed(1)} lbs
        </span>
      </div>
      {/if}
    </div>
  </section>
  {:else}
  <section class="mission-complete">
    <div class="complete-badge">
      <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    </div>
    <h3>ALL DEPOTS CLEARED</h3>
    <p>Push to Katahdin with current loadout</p>
  </section>
  {/if}

  <!-- Completed Operations -->
  {#if pastTransitions.length > 0}
  <section class="completed-ops">
    <h3 class="section-label">COMPLETED OPERATIONS</h3>
    <div class="completed-list">
      {#each pastTransitions as trans}
        <button
          class="completed-item"
          class:checked={completedTransitions[trans.id]}
          onclick={() => toggleTransition(trans.id)}
        >
          <div class="check-box">
            {#if completedTransitions[trans.id]}
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            {/if}
          </div>
          <div class="completed-info">
            <span class="completed-town">{trans.town}</span>
            <span class="completed-phase">{trans.phase}</span>
          </div>
          {#if trans.weightSaved > 0 && completedTransitions[trans.id]}
            <span class="completed-saved">−{(trans.weightSaved / 16).toFixed(1)}lb</span>
          {/if}
        </button>
      {/each}
    </div>
  </section>
  {/if}

  <!-- Mission Timeline -->
  <section class="timeline-section">
    <h3 class="section-label">MISSION TIMELINE</h3>
    <div class="timeline">
      <div class="timeline-track"></div>
      {#each transitions as trans, i}
        {@const isPast = trans.mile <= currentMile}
        {@const isNext = nextTransition && trans.id === nextTransition.id}
        {@const isComplete = completedTransitions[trans.id]}
        <div class="timeline-node" class:past={isPast} class:next={isNext} class:critical={trans.critical}>
          <div class="node-marker">
            {#if isPast}
              {#if isComplete}
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              {:else}
                <span class="marker-dot"></span>
              {/if}
            {:else}
              <span class="marker-mile">{trans.mile}</span>
            {/if}
          </div>
          <div class="node-content">
            <span class="node-town">{trans.town}</span>
            <span class="node-phase">{trans.phase}</span>
          </div>
          {#if trans.critical}
            <span class="node-critical">!</span>
          {/if}
        </div>
      {/each}
      <!-- Katahdin -->
      <div class="timeline-node final">
        <div class="node-marker">
          <span class="marker-summit">⛰️</span>
        </div>
        <div class="node-content">
          <span class="node-town">Katahdin</span>
          <span class="node-phase">Mile 2198 • Summit</span>
        </div>
      </div>
    </div>
  </section>

  <!-- Intel Brief -->
  <section class="intel-section">
    <h3 class="section-label">FIELD INTEL</h3>
    <div class="intel-grid">
      <div class="intel-item">
        <strong>Mail ahead</strong>
        <span>Ship gear to yourself at transition towns</span>
      </div>
      <div class="intel-item">
        <strong>Use hostels</strong>
        <span>Many hold packages for hikers</span>
      </div>
      <div class="intel-item">
        <strong>Whites prep is critical</strong>
        <span>Hypothermia kills above treeline</span>
      </div>
      <div class="intel-item">
        <strong>Test new gear</strong>
        <span>Don't debut items before hard sections</span>
      </div>
    </div>
  </section>

  <!-- Guide Links -->
  <div class="guide-links">
    <a href="/guide/06-gear-system" class="guide-link chapter-link">
      <span class="link-icon">📚</span>
      <span class="link-text">Full Gear System Guide</span>
      <span class="link-arrow">→</span>
    </a>
    <a href="/guide#06-gear-system" class="guide-link field-guide-link">
      <span class="link-icon">📖</span>
      <span class="link-text">Field Guide</span>
      <span class="link-arrow">→</span>
    </a>
  </div>
</div>

<style>
  .gear-tracker {
    background: var(--bg, #f8f5f0);
    border: 2px solid var(--border, #d4c5b0);
    border-radius: 12px;
    overflow: hidden;
    opacity: 0;
    transform: translateY(12px);
    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .gear-tracker.mounted {
    opacity: 1;
    transform: translateY(0);
  }

  /* Header */
  .tracker-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 1.5rem;
    background: linear-gradient(135deg, #334155 0%, #475569 100%);
    border-bottom: 2px solid #1e293b;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .header-icon {
    width: 44px;
    height: 44px;
    background: rgba(255,255,255,0.1);
    border: 2px solid rgba(255,255,255,0.2);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fbbf24;
  }

  .header-icon svg {
    width: 24px;
    height: 24px;
  }

  .header-text h2 {
    margin: 0;
    font-family: Oswald, sans-serif;
    font-size: 1.4rem;
    font-weight: 700;
    color: #fff;
    letter-spacing: 0.08em;
  }

  .header-text p {
    margin: 0.15rem 0 0;
    font-size: 0.75rem;
    color: rgba(255,255,255,0.7);
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .weight-badge {
    background: #22c55e;
    padding: 0.5rem 0.75rem;
    border-radius: 8px;
    text-align: center;
    border: 2px solid #16a34a;
  }

  .wb-value {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 1.1rem;
    font-weight: 700;
    color: #fff;
    line-height: 1;
  }

  .wb-unit {
    font-size: 0.65rem;
    color: rgba(255,255,255,0.8);
    letter-spacing: 0.1em;
  }

  /* Phase Arc Section */
  .phase-arc-section {
    padding: 1.5rem;
    background: #fff;
    border-bottom: 2px solid var(--border);
  }

  .arc-container {
    position: relative;
    max-width: 240px;
    margin: 0 auto;
  }

  .phase-arc-svg,
  .phase-arc-marker {
    width: 100%;
    display: block;
  }

  .phase-arc-marker {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
  }

  .phase-segment {
    transition: opacity 0.3s ease;
  }

  .phase-segment.active {
    filter: drop-shadow(0 0 6px currentColor);
  }

  .progress-marker {
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
    transition: all 0.3s ease;
  }

  .arc-center {
    position: absolute;
    bottom: 10px;
    left: 50%;
    transform: translateX(-50%);
    text-align: center;
  }

  .arc-icon {
    display: block;
    font-size: 1.75rem;
    margin-bottom: 0.25rem;
  }

  .arc-phase {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 600;
    color: var(--ink, #2c2c2c);
  }

  .arc-mile {
    display: block;
    font-size: 0.75rem;
    color: var(--muted, #6b6b6b);
  }

  .phase-legend {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-top: 1rem;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.7rem;
    color: var(--muted);
    opacity: 0.6;
    transition: opacity 0.2s;
  }

  .legend-item.active {
    opacity: 1;
    font-weight: 600;
    color: var(--ink);
  }

  .legend-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  /* Next Operation */
  .next-op {
    padding: 1.5rem;
    border-bottom: 2px solid var(--border);
  }

  .op-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
  }

  .op-label {
    display: block;
    font-size: 0.65rem;
    color: var(--muted);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-bottom: 0.15rem;
  }

  .op-title h3 {
    margin: 0;
    font-family: Oswald, sans-serif;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--ink);
  }

  .op-eta {
    text-align: right;
    background: var(--pine, #3d5a46);
    padding: 0.4rem 0.75rem;
    border-radius: 8px;
    border: 2px solid var(--alpine, #2d4a36);
  }

  .eta-value {
    font-family: Oswald, sans-serif;
    font-size: 1.25rem;
    font-weight: 700;
    color: #fff;
  }

  .eta-unit {
    font-size: 0.7rem;
    color: rgba(255,255,255,0.8);
    margin-left: 0.15rem;
  }

  .op-card {
    background: #fff;
    border: 2px solid var(--border);
    border-radius: 10px;
    padding: 1.25rem;
  }

  .op-card.critical {
    border-color: #fca5a5;
    background: linear-gradient(135deg, #fef2f2 0%, #fff 100%);
  }

  .op-meta {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 0.75rem;
    flex-wrap: wrap;
  }

  .op-mile {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.8rem;
    color: var(--muted);
  }

  .op-phase-change {
    font-size: 0.75rem;
    font-weight: 600;
    color: #8b5cf6;
    background: rgba(139, 92, 246, 0.1);
    padding: 0.2rem 0.6rem;
    border-radius: 4px;
  }

  .op-brief {
    margin: 0 0 1rem;
    font-size: 0.9rem;
    color: var(--muted);
    line-height: 1.5;
  }

  .critical-banner {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 0.75rem;
    background: #fef2f2;
    border: 2px solid #fca5a5;
    border-radius: 6px;
    margin-bottom: 1rem;
    color: #dc2626;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.05em;
  }

  /* Operations Grid */
  .ops-grid {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .op-block {
    border-radius: 8px;
    padding: 1rem;
    border: 2px solid;
  }

  .op-block.ship-out {
    background: rgba(239, 68, 68, 0.05);
    border-color: rgba(239, 68, 68, 0.3);
  }

  .op-block.receive {
    background: rgba(34, 197, 94, 0.05);
    border-color: rgba(34, 197, 94, 0.3);
  }

  .op-block.exchange {
    background: rgba(59, 130, 246, 0.05);
    border-color: rgba(59, 130, 246, 0.3);
  }

  .block-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-family: Oswald, sans-serif;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    margin-bottom: 0.75rem;
  }

  .ship-out .block-header {
    color: #dc2626;
  }

  .receive .block-header {
    color: #16a34a;
  }

  .exchange .block-header {
    color: #2563eb;
  }

  .block-items {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .item-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .item-name {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--ink);
  }

  .item-oz {
    font-family: Oswald, sans-serif;
    font-size: 0.8rem;
    font-weight: 600;
    color: #16a34a;
  }

  .item-oz.add {
    color: #dc2626;
  }

  .item-note {
    margin: 0;
    font-size: 0.7rem;
    color: var(--muted);
    font-style: italic;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--border);
  }

  .item-note:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  .swap-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    flex-wrap: wrap;
  }

  .swap-out {
    color: var(--muted);
    text-decoration: line-through;
  }

  .swap-arrow {
    color: #2563eb;
    font-weight: 700;
  }

  .swap-in {
    font-weight: 600;
    color: var(--ink);
  }

  .op-notes {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    padding: 0.75rem;
    background: rgba(245, 158, 11, 0.1);
    border: 2px solid rgba(245, 158, 11, 0.3);
    border-radius: 6px;
    font-size: 0.8rem;
    color: #92400e;
    margin-bottom: 1rem;
  }

  .op-notes svg {
    flex-shrink: 0;
    margin-top: 0.1rem;
  }

  .weight-delta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    background: rgba(34, 197, 94, 0.1);
    border: 2px solid rgba(34, 197, 94, 0.3);
    border-radius: 6px;
  }

  .weight-delta.gain {
    background: rgba(239, 68, 68, 0.1);
    border-color: rgba(239, 68, 68, 0.3);
  }

  .delta-label {
    font-size: 0.8rem;
    color: var(--muted);
  }

  .delta-value {
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 700;
    color: #16a34a;
  }

  .weight-delta.gain .delta-value {
    color: #dc2626;
  }

  /* Mission Complete */
  .mission-complete {
    padding: 2.5rem 1.5rem;
    text-align: center;
    background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
    border-bottom: 2px solid var(--border);
  }

  .complete-badge {
    width: 64px;
    height: 64px;
    background: #16a34a;
    border: 3px solid #15803d;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    margin: 0 auto 1rem;
    box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);
  }

  .mission-complete h3 {
    margin: 0;
    font-family: Oswald, sans-serif;
    font-size: 1.1rem;
    color: #166534;
    letter-spacing: 0.05em;
  }

  .mission-complete p {
    margin: 0.25rem 0 0;
    font-size: 0.85rem;
    color: #15803d;
  }

  /* Completed Operations */
  .completed-ops {
    padding: 1.25rem 1.5rem;
    background: var(--bg);
    border-bottom: 2px solid var(--border);
  }

  .section-label {
    margin: 0 0 1rem;
    font-family: Oswald, sans-serif;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--muted);
    letter-spacing: 0.1em;
  }

  .completed-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .completed-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: #fff;
    border: 2px solid var(--border);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
    width: 100%;
  }

  .completed-item:hover {
    border-color: var(--alpine);
  }

  .completed-item.checked {
    background: rgba(34, 197, 94, 0.05);
    border-color: #86efac;
  }

  .check-box {
    width: 24px;
    height: 24px;
    border: 2px solid var(--border);
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background: #fff;
    transition: all 0.2s ease;
  }

  .completed-item.checked .check-box {
    background: #16a34a;
    border-color: #16a34a;
    color: #fff;
  }

  .completed-info {
    flex: 1;
    min-width: 0;
  }

  .completed-town {
    display: block;
    font-weight: 600;
    font-size: 0.9rem;
    color: var(--ink);
  }

  .completed-phase {
    display: block;
    font-size: 0.7rem;
    color: var(--muted);
  }

  .completed-saved {
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    color: #16a34a;
    flex-shrink: 0;
  }

  /* Timeline */
  .timeline-section {
    padding: 1.25rem 1.5rem;
    border-bottom: 2px solid var(--border);
  }

  .timeline {
    position: relative;
    padding-left: 2.5rem;
  }

  .timeline-track {
    position: absolute;
    left: 12px;
    top: 12px;
    bottom: 12px;
    width: 2px;
    background: var(--border);
  }

  .timeline-node {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 0;
  }

  .node-marker {
    position: absolute;
    left: -2.5rem;
    width: 24px;
    height: 24px;
    background: var(--bg);
    border: 2px solid var(--border);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.6rem;
    font-weight: 700;
    color: var(--muted);
    z-index: 1;
  }

  .timeline-node.past .node-marker {
    background: var(--alpine, #2d4a36);
    border-color: var(--alpine);
    color: #fff;
  }

  .timeline-node.next .node-marker {
    background: #8b5cf6;
    border-color: #7c3aed;
    color: #fff;
    box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.2);
  }

  .timeline-node.final .node-marker {
    background: #fbbf24;
    border-color: #f59e0b;
    font-size: 0.9rem;
  }

  .marker-dot {
    width: 8px;
    height: 8px;
    background: currentColor;
    border-radius: 50%;
  }

  .marker-mile {
    font-family: Oswald, sans-serif;
    font-size: 0.55rem;
  }

  .node-content {
    flex: 1;
  }

  .node-town {
    display: block;
    font-weight: 600;
    font-size: 0.85rem;
    color: var(--ink);
  }

  .node-phase {
    display: block;
    font-size: 0.7rem;
    color: var(--muted);
  }

  .node-critical {
    width: 18px;
    height: 18px;
    background: #fef2f2;
    border: 2px solid #fca5a5;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7rem;
    font-weight: 700;
    color: #dc2626;
  }

  /* Intel Section */
  .intel-section {
    padding: 1.25rem 1.5rem;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-bottom: 2px solid var(--border);
  }

  .intel-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  .intel-item {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    padding: 0.75rem;
    background: #fff;
    border: 2px solid var(--border);
    border-radius: 8px;
    font-size: 0.75rem;
  }

  .intel-item strong {
    color: var(--pine, #3d5a46);
    font-size: 0.8rem;
  }

  .intel-item span {
    color: var(--muted);
    line-height: 1.4;
  }

  /* Guide Link */
  /* Guide Links */
  .guide-links {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .guide-link {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.25rem;
    background: #fff;
    border: 2px solid var(--border);
    border-radius: 14px;
    text-decoration: none;
    transition: all 0.2s ease;
    flex: 1;
    min-width: 200px;
  }

  .guide-link:hover {
    border-color: var(--alpine);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
  }

  .field-guide-link {
    flex: 0 0 auto;
    min-width: 140px;
  }

  .link-icon { font-size: 1.25rem; }

  .link-text {
    flex: 1;
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--ink);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .link-arrow {
    font-size: 1.25rem;
    color: var(--alpine);
    transition: transform 0.2s ease;
  }

  .guide-link:hover .link-arrow { transform: translateX(4px); }

  /* Responsive */
  @media (max-width: 640px) {
    .header-left {
      gap: 0.75rem;
    }

    .header-icon {
      width: 40px;
      height: 40px;
    }

    .header-text h2 {
      font-size: 1.25rem;
    }

    .header-text p {
      font-size: 0.8rem;
    }

    .intel-grid {
      grid-template-columns: 1fr;
    }

    .op-meta {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }

    .phase-arc-container {
      max-width: 280px;
    }

    .phase-legend {
      flex-wrap: wrap;
      justify-content: center;
    }

    .checklist-grid {
      gap: 0.5rem;
    }

    .completed-item {
      padding: 0.6rem 0.75rem;
    }
  }
</style>
