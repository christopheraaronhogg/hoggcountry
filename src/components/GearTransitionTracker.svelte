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
      description: 'Major transition. Daytime 50s-60s. Nights rarely freezing.',
      drop: [
        { item: 'Merino 250 Sleep Top', weight: 8.5, reason: 'Too warm for summer nights' },
        { item: 'Merino 250 Sleep Pants', weight: 8.7, reason: 'Too warm for summer nights' },
        { item: 'Heavy Winter Quilt', weight: 29.5, reason: 'Swap for 3-season quilt' },
        { item: 'R-8 Sleeping Pad', weight: 25, reason: 'R-value overkill for summer' },
      ],
      add: [
        { item: 'Lightweight sleep layers', weight: 8, reason: 'Thin merino or synthetic' },
        { item: 'Vesper Quilt (40°)', weight: 18, reason: '3-season warmth, lighter' },
        { item: 'R-3 or R-4 Pad', weight: 14, reason: 'Adequate for warm ground' },
      ],
      swap: [],
      weightSaved: 31.7,
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
      weightSaved: -14, // Actually adding weight
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
</script>

<div class="gear-tracker" class:mounted>
  <!-- Header -->
  <header class="tracker-header">
    <div class="header-icon">🎒</div>
    <div class="header-content">
      <h2>Gear Transitions</h2>
      <p>Optimize your pack as conditions change</p>
    </div>
    {#if totalWeightSaved > 0}
      <div class="weight-saved">
        <span class="ws-value">-{(totalWeightSaved / 16).toFixed(1)}</span>
        <span class="ws-label">lbs saved</span>
      </div>
    {/if}
  </header>

  <!-- Current Phase -->
  <section class="phase-section">
    <div class="current-phase" style="--phase-color: {currentPhase.color}">
      <span class="phase-icon">{currentPhase.icon}</span>
      <div class="phase-info">
        <span class="phase-name">{currentPhase.name}</span>
        <span class="phase-range">Mile {currentPhase.start} - {currentPhase.end}</span>
      </div>
    </div>

    <!-- Phase Progress -->
    <div class="phase-bar">
      {#each gearPhases as phase, i}
        <div
          class="phase-segment"
          class:active={phase.id === currentPhase.id}
          class:complete={currentMile >= phase.end}
          style="background: {currentMile >= phase.start ? phase.color : 'var(--border)'}; flex: {phase.end - phase.start}"
        >
          <span class="phase-label">{phase.icon}</span>
        </div>
      {/each}
    </div>
  </section>

  <!-- Next Transition -->
  {#if nextTransition}
  <section class="next-transition">
    <div class="nt-header">
      <h3>Next Gear Transition</h3>
      <span class="nt-miles">{milesToNext} mi away</span>
    </div>

    <div class="nt-card" class:critical={nextTransition.critical}>
      <div class="nt-town">
        <span class="nt-icon">📍</span>
        <span class="nt-name">{nextTransition.town}</span>
        <span class="nt-mile">Mile {nextTransition.mile}</span>
      </div>
      <div class="nt-phase">{nextTransition.phase}</div>
      <p class="nt-desc">{nextTransition.description}</p>

      {#if nextTransition.drop.length > 0}
      <div class="nt-section drop">
        <h4>📦 Mail Home</h4>
        <div class="item-list">
          {#each nextTransition.drop as item}
            <div class="gear-item">
              <span class="item-name">{item.item}</span>
              <span class="item-weight">-{item.weight} oz</span>
            </div>
            <p class="item-reason">{item.reason}</p>
          {/each}
        </div>
      </div>
      {/if}

      {#if nextTransition.add.length > 0}
      <div class="nt-section add">
        <h4>📥 Pick Up</h4>
        <div class="item-list">
          {#each nextTransition.add as item}
            <div class="gear-item">
              <span class="item-name">{item.item}</span>
              {#if item.weight > 0}
                <span class="item-weight">+{item.weight} oz</span>
              {/if}
            </div>
            <p class="item-reason">{item.reason}</p>
          {/each}
        </div>
      </div>
      {/if}

      {#if nextTransition.swap.length > 0}
      <div class="nt-section swap">
        <h4>🔄 Swap</h4>
        <div class="item-list">
          {#each nextTransition.swap as item}
            <div class="swap-item">
              <span class="swap-from">{item.from}</span>
              <span class="swap-arrow">→</span>
              <span class="swap-to">{item.to}</span>
            </div>
            <p class="item-reason">{item.reason}</p>
          {/each}
        </div>
      </div>
      {/if}

      {#if nextTransition.notes}
      <div class="nt-notes">
        <span class="notes-icon">⚠️</span>
        <span>{nextTransition.notes}</span>
      </div>
      {/if}

      {#if nextTransition.weightSaved !== 0}
      <div class="nt-weight" class:negative={nextTransition.weightSaved < 0}>
        <span>Net weight change:</span>
        <strong>{nextTransition.weightSaved > 0 ? '-' : '+'}{Math.abs(nextTransition.weightSaved / 16).toFixed(1)} lbs</strong>
      </div>
      {/if}
    </div>
  </section>
  {:else}
  <section class="no-transitions">
    <div class="nt-complete">
      <span class="complete-icon">✓</span>
      <h3>All Transitions Complete</h3>
      <p>Push to Katahdin with your current loadout!</p>
    </div>
  </section>
  {/if}

  <!-- Past Transitions -->
  {#if pastTransitions.length > 0}
  <section class="past-transitions">
    <h3>Completed Transitions</h3>
    <div class="past-list">
      {#each pastTransitions as trans}
        <div class="past-item" class:done={completedTransitions[trans.id]}>
          <button class="check-btn" onclick={() => toggleTransition(trans.id)}>
            {completedTransitions[trans.id] ? '✓' : '○'}
          </button>
          <div class="past-info">
            <span class="past-town">{trans.town}</span>
            <span class="past-phase">{trans.phase}</span>
          </div>
          {#if trans.weightSaved > 0 && completedTransitions[trans.id]}
            <span class="past-saved">-{(trans.weightSaved / 16).toFixed(1)} lb</span>
          {/if}
        </div>
      {/each}
    </div>
  </section>
  {/if}

  <!-- All Transitions Timeline -->
  <section class="timeline-section">
    <h3>Transition Timeline</h3>
    <div class="timeline">
      {#each transitions as trans, i}
        <div
          class="timeline-item"
          class:past={trans.mile <= currentMile}
          class:next={nextTransition && trans.id === nextTransition.id}
          class:critical={trans.critical}
        >
          <div class="tl-marker">
            {#if trans.mile <= currentMile}
              <span class="marker-icon">{completedTransitions[trans.id] ? '✓' : '○'}</span>
            {:else}
              <span class="marker-mile">{trans.mile}</span>
            {/if}
          </div>
          <div class="tl-content">
            <span class="tl-town">{trans.town}</span>
            <span class="tl-phase">{trans.phase}</span>
          </div>
        </div>
      {/each}
      <div class="timeline-item final">
        <div class="tl-marker">
          <span class="marker-icon">🏔️</span>
        </div>
        <div class="tl-content">
          <span class="tl-town">Katahdin</span>
          <span class="tl-phase">Mile 2198</span>
        </div>
      </div>
    </div>
  </section>

  <!-- Tips -->
  <div class="tips-section">
    <h4>Gear Transition Tips</h4>
    <ul>
      <li><strong>Mail ahead</strong> — Ship gear to yourself at transition towns</li>
      <li><strong>Use hostels</strong> — Many hold packages for hikers</li>
      <li><strong>Don't skip Whites prep</strong> — People die from hypothermia above treeline</li>
      <li><strong>Test new gear</strong> — Don't debut untested items before hard sections</li>
    </ul>
  </div>
</div>

<style>
  .gear-tracker {
    background: var(--card, #fff);
    border-radius: 16px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    border: 1px solid var(--border);
    overflow: hidden;
    opacity: 0;
    transform: translateY(10px);
    transition: all 0.5s ease;
  }

  .gear-tracker.mounted {
    opacity: 1;
    transform: translateY(0);
  }

  /* Header */
  .tracker-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem;
    background: linear-gradient(135deg, #8b5cf6, #7c3aed);
    color: #fff;
  }

  .header-icon {
    font-size: 2rem;
  }

  .header-content h2 {
    margin: 0;
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
  }

  .header-content p {
    margin: 0.25rem 0 0;
    font-size: 0.9rem;
    opacity: 0.9;
  }

  .weight-saved {
    text-align: center;
    background: rgba(255,255,255,0.2);
    padding: 0.5rem 1rem;
    border-radius: 10px;
  }

  .ws-value {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 1.25rem;
    font-weight: 700;
  }

  .ws-label {
    font-size: 0.7rem;
    opacity: 0.9;
  }

  /* Phase Section */
  .phase-section {
    padding: 1.5rem;
    border-bottom: 1px solid var(--border);
  }

  .current-phase {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: linear-gradient(90deg, rgba(139, 92, 246, 0.1), transparent);
    border-left: 4px solid var(--phase-color);
    border-radius: 0 10px 10px 0;
    margin-bottom: 1rem;
  }

  .phase-icon {
    font-size: 2rem;
  }

  .phase-name {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--ink);
  }

  .phase-range {
    font-size: 0.85rem;
    color: var(--muted);
  }

  .phase-bar {
    display: flex;
    height: 24px;
    border-radius: 12px;
    overflow: hidden;
    gap: 2px;
  }

  .phase-segment {
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    opacity: 0.3;
  }

  .phase-segment.active {
    opacity: 1;
  }

  .phase-segment.complete {
    opacity: 0.7;
  }

  .phase-label {
    font-size: 0.8rem;
  }

  /* Next Transition */
  .next-transition {
    padding: 1.5rem;
    border-bottom: 1px solid var(--border);
  }

  .nt-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .nt-header h3 {
    margin: 0;
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    color: var(--ink);
  }

  .nt-miles {
    font-family: Oswald, sans-serif;
    font-weight: 600;
    color: var(--pine);
    background: rgba(61, 90, 70, 0.1);
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.85rem;
  }

  .nt-card {
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1.25rem;
  }

  .nt-card.critical {
    border-color: #fca5a5;
    background: #fef2f2;
  }

  .nt-town {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .nt-icon {
    font-size: 1.25rem;
  }

  .nt-name {
    font-family: Oswald, sans-serif;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--ink);
  }

  .nt-mile {
    font-size: 0.8rem;
    color: var(--muted);
  }

  .nt-phase {
    font-size: 0.85rem;
    color: #8b5cf6;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }

  .nt-desc {
    margin: 0 0 1rem;
    font-size: 0.9rem;
    color: var(--muted);
  }

  .nt-section {
    margin-bottom: 1rem;
    padding: 0.75rem;
    border-radius: 8px;
  }

  .nt-section.drop {
    background: rgba(239, 68, 68, 0.08);
  }

  .nt-section.add {
    background: rgba(34, 197, 94, 0.08);
  }

  .nt-section.swap {
    background: rgba(59, 130, 246, 0.08);
  }

  .nt-section h4 {
    margin: 0 0 0.5rem;
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    color: var(--ink);
  }

  .item-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .gear-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .item-name {
    font-weight: 600;
    color: var(--ink);
    font-size: 0.9rem;
  }

  .item-weight {
    font-family: Oswald, sans-serif;
    font-weight: 600;
    font-size: 0.85rem;
  }

  .nt-section.drop .item-weight {
    color: #16a34a;
  }

  .nt-section.add .item-weight {
    color: #dc2626;
  }

  .item-reason {
    margin: 0;
    font-size: 0.75rem;
    color: var(--muted);
    font-style: italic;
  }

  .swap-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
  }

  .swap-from {
    color: var(--muted);
    text-decoration: line-through;
  }

  .swap-arrow {
    color: #3b82f6;
  }

  .swap-to {
    font-weight: 600;
    color: var(--ink);
  }

  .nt-notes {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background: rgba(245, 158, 11, 0.15);
    border-radius: 8px;
    font-size: 0.85rem;
    color: #92400e;
    margin-bottom: 1rem;
  }

  .nt-weight {
    display: flex;
    justify-content: space-between;
    padding: 0.75rem;
    background: rgba(34, 197, 94, 0.1);
    border-radius: 8px;
    font-size: 0.9rem;
    color: var(--ink);
  }

  .nt-weight.negative {
    background: rgba(239, 68, 68, 0.1);
  }

  .nt-weight strong {
    color: #16a34a;
  }

  .nt-weight.negative strong {
    color: #dc2626;
  }

  /* No Transitions */
  .no-transitions {
    padding: 2rem 1.5rem;
    border-bottom: 1px solid var(--border);
  }

  .nt-complete {
    text-align: center;
    padding: 2rem;
    background: linear-gradient(135deg, #dcfce7, #bbf7d0);
    border-radius: 12px;
  }

  .complete-icon {
    display: inline-block;
    width: 48px;
    height: 48px;
    line-height: 48px;
    background: #16a34a;
    color: #fff;
    border-radius: 50%;
    font-size: 1.5rem;
    margin-bottom: 0.75rem;
  }

  .nt-complete h3 {
    margin: 0 0 0.25rem;
    font-family: Oswald, sans-serif;
    color: #166534;
  }

  .nt-complete p {
    margin: 0;
    color: #15803d;
    font-size: 0.9rem;
  }

  /* Past Transitions */
  .past-transitions {
    padding: 1.25rem 1.5rem;
    background: var(--bg);
    border-bottom: 1px solid var(--border);
  }

  .past-transitions h3 {
    margin: 0 0 1rem;
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .past-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .past-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 10px;
    transition: all 0.2s;
  }

  .past-item.done {
    background: rgba(34, 197, 94, 0.05);
    border-color: #86efac;
  }

  .check-btn {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 2px solid var(--border);
    background: #fff;
    color: var(--muted);
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .past-item.done .check-btn {
    background: #16a34a;
    border-color: #16a34a;
    color: #fff;
  }

  .past-info {
    flex: 1;
  }

  .past-town {
    display: block;
    font-weight: 600;
    color: var(--ink);
    font-size: 0.9rem;
  }

  .past-phase {
    font-size: 0.75rem;
    color: var(--muted);
  }

  .past-saved {
    font-family: Oswald, sans-serif;
    font-weight: 600;
    color: #16a34a;
  }

  /* Timeline */
  .timeline-section {
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid var(--border);
  }

  .timeline-section h3 {
    margin: 0 0 1rem;
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .timeline {
    position: relative;
    padding-left: 40px;
  }

  .timeline::before {
    content: '';
    position: absolute;
    left: 15px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: var(--border);
  }

  .timeline-item {
    position: relative;
    padding: 0.75rem 0;
  }

  .timeline-item.past .tl-marker {
    background: var(--alpine);
    color: #fff;
  }

  .timeline-item.next .tl-marker {
    background: #8b5cf6;
    color: #fff;
    box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.2);
  }

  .timeline-item.critical .tl-content::after {
    content: '⚠️';
    margin-left: 0.5rem;
  }

  .timeline-item.final .tl-marker {
    background: #16a34a;
    font-size: 1rem;
  }

  .tl-marker {
    position: absolute;
    left: -40px;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: var(--bg);
    border: 2px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--muted);
  }

  .marker-icon {
    font-size: 0.9rem;
  }

  .tl-content {
    padding-left: 0.5rem;
  }

  .tl-town {
    display: block;
    font-weight: 600;
    color: var(--ink);
    font-size: 0.9rem;
  }

  .tl-phase {
    font-size: 0.75rem;
    color: var(--muted);
  }

  /* Tips */
  .tips-section {
    padding: 1.25rem 1.5rem;
    background: #faf5ff;
  }

  .tips-section h4 {
    margin: 0 0 0.75rem;
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    color: #7c3aed;
  }

  .tips-section ul {
    margin: 0;
    padding-left: 1.25rem;
    font-size: 0.85rem;
    color: var(--ink);
  }

  .tips-section li {
    margin-bottom: 0.35rem;
  }

  .tips-section strong {
    color: #7c3aed;
  }

  /* Responsive */
  @media (max-width: 640px) {
    .phase-bar {
      height: 20px;
    }

    .phase-label {
      font-size: 0.7rem;
    }
  }
</style>
