<script>
  import { onMount } from 'svelte';
  import { fade, slide } from 'svelte/transition';

  // Static import for default tool (ensures CSS is in SSR output)
  import MilestoneCalculator from './MilestoneCalculator.svelte';
  import QuickLog from './QuickLog.svelte';

  // Dynamic loaders for other tools (code-split with CSS)
  const toolLoaders = {
    milestone: null, // Static import above
    layers: () => import('./LayeringAdvisor.svelte'),
    shelter: () => import('./ShelterDecision.svelte'),
    weather: () => import('./WeatherAssessor.svelte'),
    pack: () => import('./PackBuilder.svelte'),
    resupply: () => import('./ResupplyCalculator.svelte'),
    water: () => import('./WaterTracker.svelte'),
    budget: () => import('./BudgetCalculator.svelte'),
    mail: () => import('./MailDropPlanner.svelte'),
    power: () => import('./PowerManager.svelte'),
    food: () => import('./FoodCalculator.svelte'),
    geartrans: () => import('./GearTransitionTracker.svelte'),
    training: () => import('./TrainingPlanner.svelte'),
    emergency: () => import('./EmergencyCard.svelte'),
  };

  // Cache for loaded components
  let loadedTools = $state({ milestone: MilestoneCalculator });
  let isToolLoading = $state(false);

  // Trail landmarks for mile context
  const landmarks = [
    { mile: 0, name: 'Springer Mountain' },
    { mile: 31, name: 'Neels Gap' },
    { mile: 78, name: 'NC Border' },
    { mile: 110, name: 'Franklin' },
    { mile: 166, name: 'Fontana Dam' },
    { mile: 206, name: 'Newfound Gap' },
    { mile: 274, name: 'Hot Springs' },
    { mile: 386, name: 'Damascus' },
    { mile: 550, name: 'Pearisburg' },
    { mile: 702, name: 'Waynesboro' },
    { mile: 1025, name: 'Harpers Ferry' },
    { mile: 1099, name: 'Halfway Point' },
    { mile: 1290, name: 'Delaware Water Gap' },
    { mile: 1525, name: 'CT Border' },
    { mile: 1630, name: 'VT Border' },
    { mile: 1791, name: 'White Mountains' },
    { mile: 1912, name: 'Maine Border' },
    { mile: 2090, name: 'Monson' },
    { mile: 2198, name: 'Katahdin' },
  ];

  // Consolidated 14 high-leverage tools - Milestone is foundational
  const tools = [
    { id: 'milestone', name: 'Journey', icon: '🗺️', desc: 'Plan your timeline & track progress' },
    { id: 'layers', name: 'Layers', icon: '🧥', desc: 'What to wear for conditions' },
    { id: 'shelter', name: 'Shelter', icon: '🏠', desc: 'Tent vs shelter decision' },
    { id: 'weather', name: 'Weather', icon: '🌤️', desc: 'Weather, heat zones & daylight' },
    { id: 'pack', name: 'Pack', icon: '🎒', desc: 'Build & weigh your kit' },
    { id: 'resupply', name: 'Resupply', icon: '🍽️', desc: 'Towns, food & mail drops' },
    { id: 'water', name: 'Water', icon: '💧', desc: 'Water sources & carry calc' },
    { id: 'budget', name: 'Budget', icon: '💰', desc: 'Track trail spending' },
    { id: 'mail', name: 'Mail', icon: '📬', desc: 'Plan resupply mail drops' },
    { id: 'power', name: 'Power', icon: '🔋', desc: 'Manage battery & devices' },
    { id: 'food', name: 'Food', icon: '🍽️', desc: 'Calorie & weight calculator' },
    { id: 'geartrans', name: 'Swap', icon: '🔄', desc: 'Gear transition planner' },
    { id: 'training', name: 'Train', icon: '🏋️', desc: 'Pre-trail preparation' },
    { id: 'emergency', name: 'Emergency', icon: '🆘', desc: 'Emergency info & bailouts' },
  ];

  // ========== GLOBAL TRAIL CONTEXT (Svelte 5 $state) ==========
  let contextExpanded = $state(true);

  // Unified state - mode is derived from data
  let currentMile = $state(0);
  let startDate = $state('2026-03-01');
  let targetPace = $state(15);
  let zeroDaysPerMonth = $state(4);  // For planning projections

  // Derived: are we on trail or planning?
  function isPastDate(dateStr) {
    return new Date(dateStr) <= new Date();
  }
  let isOnTrail = $derived(currentMile > 0 || isPastDate(startDate));
  let mode = $derived(isOnTrail ? 'trail' : 'planning');

  // Tool navigation state
  let activeTool = $state('milestone');
  let isTransitioning = $state(false);
  let mounted = $state(false);

  // Track pending transition timeouts to cancel on rapid switching
  let transitionTimeoutId = null;
  let completeTimeoutId = null;
  let pendingToolId = null; // Track which tool we're actually trying to switch to

  // QuickLog modal state
  let showQuickLog = $state(false);

  onMount(async () => {
    mounted = true;
    const hash = window.location.hash.slice(1);
    if (tools.some(t => t.id === hash && !t.disabled)) {
      // Load the tool from hash if it's not the default
      if (hash !== 'milestone' && toolLoaders[hash]) {
        isToolLoading = true;
        try {
          const module = await toolLoaders[hash]();
          loadedTools = { ...loadedTools, [hash]: module.default };
        } catch (e) {
          console.error('Failed to load tool from hash:', hash, e);
        }
        isToolLoading = false;
      }
      activeTool = hash;
    }
    // Load saved context from localStorage
    const saved = localStorage.getItem('trailContext');
    if (saved) {
      try {
        const ctx = JSON.parse(saved);
        currentMile = ctx.currentMile ?? 0;
        startDate = ctx.startDate || ctx.tripStartDate || startDate;
        targetPace = ctx.targetPace || ctx.pace || targetPace;
        zeroDaysPerMonth = ctx.zeroDaysPerMonth ?? 4;
        contextExpanded = ctx.contextExpanded ?? true;
      } catch (e) {}
    }
  });

  // Save context to localStorage when it changes
  $effect(() => {
    if (mounted) {
      localStorage.setItem('trailContext', JSON.stringify({
        currentMile, startDate, targetPace,
        zeroDaysPerMonth, contextExpanded
      }));
    }
  });

  // Get nearest landmark
  function getNearestLandmark(mile) {
    let closest = landmarks[0];
    let minDist = Math.abs(mile - landmarks[0].mile);
    for (const lm of landmarks) {
      const dist = Math.abs(mile - lm.mile);
      if (dist < minDist) {
        minDist = dist;
        closest = lm;
      }
    }
    return closest;
  }

  // Trail mode calculations
  function getTodayStr() {
    return new Date().toISOString().split('T')[0];
  }

  function daysBetween(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
  }

  // Derived values (Svelte 5 $derived)
  let nearestLandmark = $derived(getNearestLandmark(currentMile));
  let daysOnTrail = $derived(isOnTrail ? Math.max(1, daysBetween(startDate, getTodayStr())) : 0);
  let actualPace = $derived(isOnTrail && daysOnTrail > 0 ? (currentMile / daysOnTrail).toFixed(1) : targetPace); // Calendar pace includes zeros
  let percentComplete = $derived(((currentMile / 2198) * 100).toFixed(0));

  // Planning calculations (always available for projections)
  let hikingDaysPlanned = $derived(Math.ceil(2198 / targetPace));
  let totalDaysPlanned = $derived(Math.ceil(hikingDaysPlanned / (1 - zeroDaysPerMonth / 30)));

  // Effective date for projections: use today if start date has passed, otherwise use start date
  let effectiveDate = $derived(isPastDate(startDate) ? getTodayStr() : startDate);

  // Miles remaining (for on-trail projections)
  let milesRemaining = $derived(2198 - currentMile);

  // Days needed for remaining miles
  function getCalendarDaysForMiles(miles) {
    const hikingDays = Math.ceil(miles / targetPace);
    return Math.ceil(hikingDays / (1 - zeroDaysPerMonth / 30));
  }
  let daysToFinish = $derived(isOnTrail ? getCalendarDaysForMiles(milesRemaining) : totalDaysPlanned);

  // Projected finish date
  function addDaysToDate(dateStr, days) {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date;
  }
  // Use effective date + days to finish
  let projectedFinish = $derived(addDaysToDate(effectiveDate, daysToFinish));

  async function switchTool(toolId) {
    if (toolId === activeTool || tools.find(t => t.id === toolId)?.disabled) return;

    // Cancel any pending transitions from previous rapid clicks
    if (transitionTimeoutId) {
      clearTimeout(transitionTimeoutId);
      transitionTimeoutId = null;
    }
    if (completeTimeoutId) {
      clearTimeout(completeTimeoutId);
      completeTimeoutId = null;
    }

    // Track which tool we're switching to (for stale async detection)
    pendingToolId = toolId;

    // Start transition
    isTransitioning = true;
    window.history.replaceState(null, '', `#${toolId}`);

    // Load tool if not already loaded
    if (!loadedTools[toolId] && toolLoaders[toolId]) {
      isToolLoading = true;
      try {
        const module = await toolLoaders[toolId]();
        // Check if we're still trying to switch to this tool (user may have clicked another)
        if (pendingToolId !== toolId) {
          // User clicked a different tool while loading - abort this transition
          return;
        }
        loadedTools = { ...loadedTools, [toolId]: module.default };
      } catch (e) {
        console.error('Failed to load tool:', toolId, e);
        if (pendingToolId === toolId) {
          isToolLoading = false;
          isTransitioning = false;
        }
        return;
      }
      if (pendingToolId === toolId) {
        isToolLoading = false;
      }
    }

    // Switch after brief transition (with cancellable timeouts)
    transitionTimeoutId = setTimeout(() => {
      // Double-check we're still switching to this tool
      if (pendingToolId === toolId) {
        activeTool = toolId;
        pendingToolId = null;
      }
      transitionTimeoutId = null;
      completeTimeoutId = setTimeout(() => {
        isTransitioning = false;
        completeTimeoutId = null;
      }, 50);
    }, 150);
  }

  // Handle QuickLog save - update currentMile
  function handleQuickLogSave(newMile) {
    currentMile = newMile;
    showQuickLog = false;
  }

  let activeToolData = $derived(tools.find(t => t.id === activeTool));

  // Arrow key navigation for tabs (WCAG 2.1.1)
  function handleTabKeydown(e, currentIndex) {
    const enabledTools = tools.filter(t => !t.disabled);
    const currentEnabledIndex = enabledTools.findIndex(t => t.id === tools[currentIndex].id);
    if (currentEnabledIndex === -1) return;

    let nextIndex = -1;
    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        nextIndex = currentEnabledIndex - 1;
        if (nextIndex < 0) nextIndex = enabledTools.length - 1;
        break;
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        nextIndex = currentEnabledIndex + 1;
        if (nextIndex >= enabledTools.length) nextIndex = 0;
        break;
      case 'Home':
        e.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        nextIndex = enabledTools.length - 1;
        break;
      default:
        return;
    }

    const nextTool = enabledTools[nextIndex];
    switchTool(nextTool.id);
    // Focus the new tab
    requestAnimationFrame(() => {
      const tabElement = document.getElementById(`tab-${nextTool.id}`);
      if (tabElement) tabElement.focus();
    });
  }

  // Build context object for child components
  let trailContext = $derived({
    mode,
    isOnTrail,
    // Core inputs
    currentMile,
    startDate,
    targetPace,
    zeroDaysPerMonth,
    // Computed
    effectiveDate, // Today if past start date, otherwise start date
    daysOnTrail,
    actualPace: parseFloat(actualPace), // Calendar pace (includes zeros implicitly)
    percentComplete: parseFloat(percentComplete),
    nearestLandmark,
    projectedFinish,
    hikingDaysPlanned,
    totalDaysPlanned,
    milesRemaining,
    daysToFinish,
    // Legacy aliases for compatibility
    pace: targetPace,
    tripStartDate: startDate,
  });
</script>

<div class="tools-app" class:mounted>
  <!-- Trail Context Bar - Simplified, mile-focused -->
  <div class="context-bar" class:expanded={contextExpanded}>
    <!-- Topographic texture overlay -->
    <div class="topo-texture"></div>

    <!-- Header with mile + landmark -->
    <div class="context-header">
      <div class="mile-quick">
        <span class="mile-current">{currentMile}</span>
        <span class="mile-label">mi</span>
        <span class="mile-landmark-quick">
          {#if currentMile === 0}
            at Springer
          {:else}
            near {nearestLandmark.name}
          {/if}
        </span>
        {#if isOnTrail}
          <span class="mile-status on-trail">hiking</span>
        {:else}
          <span class="mile-status planning">planning</span>
        {/if}
      </div>

      <div class="header-right">
        <div class="projected-finish">
          <span class="finish-icon">🏔️</span>
          <span class="finish-date">{projectedFinish.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        </div>

        <button class="expand-toggle" onclick={() => contextExpanded = !contextExpanded}>
          <span class="toggle-chevron" class:flipped={contextExpanded}>▼</span>
        </button>
      </div>
    </div>

    <!-- Collapsed Summary -->
    {#if !contextExpanded}
      <div class="context-summary" transition:fade={{ duration: 150 }}>
        <span class="summary-item">
          <span class="sum-val">{percentComplete}%</span>
          <span class="sum-unit">complete</span>
        </span>
        <span class="summary-divider">•</span>
        <span class="summary-item">
          <span class="sum-val">{targetPace}</span>
          <span class="sum-unit">mi/day</span>
        </span>
        <span class="summary-divider">•</span>
        <span class="summary-item">
          <span class="sum-val">{totalDaysPlanned}</span>
          <span class="sum-unit">days</span>
        </span>
        {#if isOnTrail}
          <span class="summary-divider">•</span>
          <span class="summary-item">
            <span class="sum-val">{actualPace}</span>
            <span class="sum-unit">actual</span>
          </span>
        {/if}
      </div>
    {/if}

    <!-- Expanded Settings Panel -->
    {#if contextExpanded}
      <div class="context-panel" transition:slide={{ duration: 200 }}>
        <!-- Mile slider with progress ring -->
        <div class="mile-slider-row">
          <div class="mile-pct">
            <svg viewBox="0 0 36 36" class="progress-ring-small">
              <circle cx="18" cy="18" r="15.5" class="ring-bg-small" />
              <circle cx="18" cy="18" r="15.5" class="ring-fill-small"
                style="stroke-dasharray: {97.4 * (percentComplete / 100)} 97.4" />
            </svg>
            <span class="pct-text">{percentComplete}%</span>
          </div>
          <div class="mile-slider-wrap">
            <div class="mile-slider-container">
              <label for="current-mile" class="visually-hidden">Current mile marker</label>
              <input type="range" id="current-mile" min="0" max="2198" step="1" bind:value={currentMile} class="mile-slider" aria-valuemin="0" aria-valuemax="2198" aria-valuenow={currentMile} aria-valuetext="Mile {currentMile} of 2198" />
              <div class="mile-progress-bar" style="width: {(currentMile / 2198) * 100}%" aria-hidden="true"></div>
            </div>
            <div class="mile-endpoints">
              <span>Springer</span>
              <span>Katahdin</span>
            </div>
          </div>
        </div>

        <!-- Unified controls -->
        <div class="control-grid unified">
          <div class="ctrl-item">
            <label class="ctrl-label" for="start-date">{isOnTrail ? 'Started' : 'Start Date'}</label>
            <input type="date" id="start-date" bind:value={startDate} class="ctrl-date" />
          </div>

          <div class="ctrl-item">
            <div class="ctrl-header">
              <label class="ctrl-label" for="target-pace">Target Pace</label>
              <span class="ctrl-val" aria-hidden="true">{targetPace} <small>mi/day</small></span>
            </div>
            <input type="range" id="target-pace" min="8" max="25" step="0.5" bind:value={targetPace} class="ctrl-slider" aria-valuemin="8" aria-valuemax="25" aria-valuenow={targetPace} aria-valuetext="{targetPace} miles per day" />
          </div>

          <div class="ctrl-item">
            <div class="ctrl-header">
              <label class="ctrl-label" for="zeros-planned">Zero Days</label>
              <span class="ctrl-val" aria-hidden="true">{zeroDaysPerMonth} <small>/month</small></span>
            </div>
            <input type="range" id="zeros-planned" min="0" max="10" step="1" bind:value={zeroDaysPerMonth} class="ctrl-slider zero" aria-valuemin="0" aria-valuemax="10" aria-valuenow={zeroDaysPerMonth} aria-valuetext="{zeroDaysPerMonth} zero days per month" />
          </div>
        </div>

        <!-- Stats row adapts to mode -->
        <div class="context-stat-row">
          {#if isOnTrail}
            <div class="ctx-stat">
              <span class="ctx-stat-val">{daysOnTrail}</span>
              <span class="ctx-stat-label">Days Out</span>
            </div>
            <div class="ctx-stat">
              <span class="ctx-stat-val">{milesRemaining}</span>
              <span class="ctx-stat-label">Miles Left</span>
            </div>
            <div class="ctx-stat highlight">
              <span class="ctx-stat-val">{daysToFinish}</span>
              <span class="ctx-stat-label">Days to Go</span>
            </div>
          {:else}
            <div class="ctx-stat">
              <span class="ctx-stat-val">{hikingDaysPlanned}</span>
              <span class="ctx-stat-label">Hiking Days</span>
            </div>
            <div class="ctx-stat">
              <span class="ctx-stat-val">{totalDaysPlanned}</span>
              <span class="ctx-stat-label">Total Days</span>
            </div>
            <div class="ctx-stat">
              <span class="ctx-stat-val">{totalDaysPlanned - hikingDaysPlanned}</span>
              <span class="ctx-stat-label">Zero Days</span>
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </div>

  <!-- Tool Navigation -->
  <nav class="tools-nav" role="tablist" aria-label="Trail tools">
    {#each tools as tool, index}
      <button
        class="nav-tab"
        class:active={activeTool === tool.id}
        class:disabled={tool.disabled}
        onclick={() => switchTool(tool.id)}
        onkeydown={(e) => handleTabKeydown(e, index)}
        disabled={tool.disabled}
        role="tab"
        id="tab-{tool.id}"
        aria-selected={activeTool === tool.id}
        aria-controls="tabpanel-{tool.id}"
        tabindex={activeTool === tool.id ? 0 : -1}
      >
        <span class="tab-content">
          <span class="tab-icon" aria-hidden="true">{tool.icon}</span>
          <span class="tab-name">{tool.name}</span>
        </span>
        {#if tool.disabled}
          <span class="tab-badge" aria-label="Coming soon">Soon</span>
        {/if}
        {#if activeTool === tool.id}
          <div class="active-indicator" transition:fade></div>
        {/if}
      </button>
    {/each}
  </nav>

  <!-- Tool Content - Dynamic loading with code-split CSS -->
  <div
    class="tool-viewport"
    role="tabpanel"
    id="tabpanel-{activeTool}"
    aria-labelledby="tab-{activeTool}"
    tabindex="0"
  >
    <div class="tool-container" class:transitioning={isTransitioning}>
      {#if isToolLoading}
        <div class="tool-loading" aria-live="polite">
          <div class="loading-spinner" aria-hidden="true"></div>
          <span class="loading-text">Loading tool...</span>
        </div>
      {:else if loadedTools[activeTool]}
        <div class="tool-panel">
          <svelte:component this={loadedTools[activeTool]} {trailContext} />
        </div>
      {/if}
    </div>
  </div>

  <!-- Quick Log FAB (Trail Mode Only) -->
  {#if mode === 'trail'}
    <button class="quick-log-fab" onclick={() => showQuickLog = true} transition:fade>
      <span class="fab-icon">📝</span>
      <span class="fab-label">Log Day</span>
    </button>
  {/if}

  <!-- Quick Log Modal -->
  <QuickLog
    isOpen={showQuickLog}
    {currentMile}
    onClose={() => showQuickLog = false}
    onSave={handleQuickLogSave}
  />

  <!-- Quick Links -->
  <div class="quick-links">
    <a href="/guide" class="quick-link">
      <div class="link-content">
        <span class="link-icon">📖</span>
        <div class="link-text">
          <span class="link-title">Field Guide</span>
          <span class="link-desc">Read the full breakdown</span>
        </div>
      </div>
      <span class="link-arrow">→</span>
    </a>
  </div>
</div>

<style>
  .tools-app {
    max-width: 960px;
    width: 100%;
    margin: 0 auto;
    opacity: 0;
    transform: translateY(10px);
    transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    box-sizing: border-box;
  }

  .tools-app *,
  .tools-app *::before,
  .tools-app *::after {
    box-sizing: border-box;
  }

  .tools-app.mounted {
    opacity: 1;
    transform: translateY(0);
  }

  /* ========== TRAIL CONTEXT BAR ========== */
  .context-bar {
    position: relative;
    background: linear-gradient(135deg, #3d4a38 0%, #2c362a 100%);
    border-radius: 16px;
    margin-bottom: 1.5rem;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.05);
  }

  .topo-texture {
    position: absolute;
    inset: 0;
    opacity: 0.04;
    background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 50 Q25 30 50 50 T100 50' stroke='%23fff' fill='none' stroke-width='0.5'/%3E%3Cpath d='M0 30 Q25 10 50 30 T100 30' stroke='%23fff' fill='none' stroke-width='0.5'/%3E%3Cpath d='M0 70 Q25 50 50 70 T100 70' stroke='%23fff' fill='none' stroke-width='0.5'/%3E%3C/svg%3E");
    background-size: 80px 80px;
    pointer-events: none;
  }

  .context-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.25rem;
    position: relative;
    z-index: 1;
  }

  /* Mile Quick Display */
  .mile-quick {
    display: flex;
    align-items: baseline;
    gap: 0.35rem;
  }

  .mile-current {
    font-family: Oswald, sans-serif;
    font-size: 1.75rem;
    font-weight: 700;
    color: #fff;
    line-height: 1;
  }

  .mile-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: rgba(255,255,255,0.6);
    text-transform: uppercase;
  }

  .mile-status {
    font-family: Oswald, sans-serif;
    font-size: 0.65rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    margin-left: 0.5rem;
  }

  .mile-status.planning {
    background: rgba(240, 224, 0, 0.2);
    color: var(--marker);
  }

  .mile-status.on-trail {
    background: rgba(34, 197, 94, 0.2);
    color: #4ade80;
  }

  .mile-landmark-quick {
    font-size: 0.85rem;
    color: rgba(255,255,255,0.5);
    font-style: italic;
    margin-left: 0.25rem;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .projected-finish {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.4rem 0.75rem;
    background: rgba(255,255,255,0.1);
    border-radius: 8px;
  }

  .finish-icon {
    font-size: 1rem;
  }

  .finish-date {
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    color: #fff;
  }

  .control-grid.unified {
    grid-template-columns: 1fr 1.5fr 1fr;
  }

  .expand-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: rgba(255,255,255,0.1);
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .expand-toggle:hover {
    background: rgba(255,255,255,0.15);
  }

  .toggle-chevron {
    font-size: 0.7rem;
    color: rgba(255,255,255,0.7);
    transition: transform 0.3s ease;
  }

  .toggle-chevron.flipped {
    transform: rotate(180deg);
  }

  /* Context Summary (collapsed) */
  .context-summary {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0 1.25rem 1rem;
    flex-wrap: wrap;
  }

  .summary-item {
    display: flex;
    align-items: baseline;
    gap: 0.25rem;
  }

  .summary-item.primary .sum-val {
    font-size: 1.25rem;
    color: var(--marker);
  }

  .sum-icon {
    font-size: 0.85rem;
    margin-right: 0.15rem;
  }

  .sum-val {
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 600;
    color: #fff;
  }

  .sum-unit {
    font-size: 0.7rem;
    color: rgba(255,255,255,0.5);
  }

  .summary-divider {
    color: rgba(255,255,255,0.2);
    font-size: 0.8rem;
  }

  /* Context Panel (expanded) */
  .context-panel {
    padding: 0 1.25rem 1.25rem;
    position: relative;
    z-index: 1;
  }

  .control-grid {
    display: grid;
    gap: 1rem;
  }

  .control-grid.planning {
    grid-template-columns: 1fr 1.5fr 1fr;
  }

  .control-grid.trail {
    grid-template-columns: repeat(3, 1fr);
  }

  .ctrl-item {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .ctrl-label {
    font-family: Oswald, sans-serif;
    font-size: 0.65rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: rgba(255,255,255,0.5);
  }

  .ctrl-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 0.25rem;
  }

  .ctrl-val {
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 600;
    color: var(--marker);
  }

  .ctrl-val small {
    font-size: 0.7rem;
    font-weight: 400;
    color: rgba(255,255,255,0.4);
  }

  .ctrl-date {
    padding: 0.5rem 0.75rem;
    background: rgba(0,0,0,0.2);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px;
    color: #fff;
    font-family: inherit;
    font-size: 0.9rem;
  }

  .ctrl-date::-webkit-calendar-picker-indicator {
    filter: invert(1);
  }

  .ctrl-slider {
    width: 100%;
    height: 24px;
    -webkit-appearance: none;
    background: transparent;
    cursor: pointer;
  }

  .ctrl-slider::-webkit-slider-runnable-track {
    height: 6px;
    background: rgba(255,255,255,0.15);
    border-radius: 3px;
  }

  .ctrl-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--marker);
    margin-top: -7px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    cursor: grab;
  }

  .ctrl-slider.zero::-webkit-slider-thumb {
    background: var(--terra);
  }

  .ctrl-num-wrap {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .ctrl-num {
    width: 70px;
    padding: 0.5rem;
    background: rgba(0,0,0,0.2);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px;
    color: #fff;
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    text-align: center;
  }

  .ctrl-num-unit {
    font-size: 0.75rem;
    color: rgba(255,255,255,0.4);
  }

  /* Mile Slider Row */
  .mile-slider-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 0.5rem;
  }

  .mile-slider-wrap {
    flex: 1;
  }

  .mile-pct {
    position: relative;
    width: 48px;
    height: 48px;
  }

  .progress-ring-small {
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
  }

  .ring-bg-small {
    fill: none;
    stroke: rgba(255,255,255,0.1);
    stroke-width: 3;
  }

  .ring-fill-small {
    fill: none;
    stroke: var(--marker);
    stroke-width: 3;
    stroke-linecap: round;
    transition: stroke-dasharray 0.3s ease;
  }

  .pct-text {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: Oswald, sans-serif;
    font-size: 0.7rem;
    font-weight: 700;
    color: #fff;
  }

  .mile-slider-container {
    position: relative;
    height: 32px;
    background: rgba(0,0,0,0.2);
    border-radius: 8px;
    overflow: hidden;
  }

  .mile-slider {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
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
    width: 12px;
    height: 28px;
    border-radius: 4px;
    background: #fff;
    margin-top: 2px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.4);
    cursor: grab;
  }

  .mile-progress-bar {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    background: linear-gradient(90deg, var(--alpine), var(--pine));
    pointer-events: none;
    z-index: 1;
  }

  .mile-endpoints {
    display: flex;
    justify-content: space-between;
    margin-top: 0.35rem;
    font-size: 0.65rem;
    color: rgba(255,255,255,0.4);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* Context Stats Row */
  .context-stat-row {
    display: flex;
    justify-content: center;
    gap: 1.5rem;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(255,255,255,0.08);
  }

  .ctx-stat {
    text-align: center;
  }

  .ctx-stat.highlight .ctx-stat-val {
    color: var(--marker);
  }

  .ctx-stat-val {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 1.25rem;
    font-weight: 700;
    color: #fff;
    line-height: 1.1;
  }

  .ctx-stat-label {
    font-size: 0.65rem;
    color: rgba(255,255,255,0.4);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* ========== NAVIGATION ========== */
  .tools-nav {
    display: grid;
    grid-template-columns: repeat(14, 1fr);
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 0.35rem;
    margin-bottom: 2rem;
    box-shadow: 0 4px 12px rgba(0,0,0,0.03);
  }

  .nav-tab {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0.75rem 0.5rem;
    background: transparent;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    color: var(--muted);
    transition: all 0.2s ease;
    overflow: hidden;
  }

  .nav-tab:hover:not(.disabled):not(.active) {
    background: rgba(166, 181, 137, 0.1);
    color: var(--pine);
  }

  .nav-tab:focus-visible {
    outline: 3px solid var(--alpine);
    outline-offset: 2px;
    z-index: 2;
  }

  .nav-tab.active {
    color: var(--pine);
  }

  .active-indicator {
    position: absolute;
    inset: 0;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    z-index: 0;
  }

  .tab-content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.35rem;
  }

  .tab-icon {
    font-size: 1.25rem;
    transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .nav-tab.active .tab-icon {
    transform: scale(1.1);
  }

  .tab-name {
    font-family: Oswald, sans-serif;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .tab-badge {
    position: absolute;
    top: 0.25rem;
    right: 0.25rem;
    font-size: 0.5rem;
    font-weight: 700;
    padding: 0.1rem 0.3rem;
    background: var(--terra);
    color: #fff;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    z-index: 2;
  }

  .nav-tab.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Viewport */
  .tool-viewport {
    min-height: 600px;
    max-width: 100%;
    overflow-x: hidden;
  }

  .tool-container {
    transition: opacity 0.2s ease, transform 0.2s ease;
    max-width: 100%;
  }

  .tool-panel {
    max-width: 100%;
    overflow-x: hidden;
  }

  .tool-container.transitioning {
    opacity: 0;
    transform: translateY(10px);
    pointer-events: none;
  }

  /* Loading state for dynamic tool loading */
  .tool-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    min-height: 300px;
    color: var(--muted);
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--border);
    border-top-color: var(--alpine);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .loading-text {
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* Quick Links */
  .quick-links {
    margin-top: 3rem;
    display: flex;
    justify-content: center;
  }

  .quick-link {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
    padding: 1rem 1.5rem;
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 12px;
    text-decoration: none;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    transition: all 0.2s ease;
    width: 100%;
    max-width: 400px;
  }

  .quick-link:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.08);
    border-color: var(--alpine);
  }

  .link-content {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .link-icon {
    font-size: 1.75rem;
  }

  .link-text {
    display: flex;
    flex-direction: column;
  }

  .link-title {
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 600;
    color: var(--ink);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .link-desc {
    font-size: 0.85rem;
    color: var(--muted);
  }

  .link-arrow {
    font-size: 1.25rem;
    color: var(--alpine);
    transition: transform 0.2s ease;
  }

  .quick-link:hover .link-arrow {
    transform: translateX(4px);
  }

  /* ========== QUICK LOG FAB ========== */
  .quick-log-fab {
    position: fixed;
    bottom: 24px;
    right: 24px;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.875rem 1.5rem;
    background: linear-gradient(135deg, var(--pine), #3a4538);
    border: none;
    border-radius: 50px;
    color: #fff;
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 20px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.15);
    z-index: 100;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .quick-log-fab:hover {
    transform: scale(1.05) translateY(-2px);
    box-shadow: 0 8px 30px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.2);
  }

  .quick-log-fab:active {
    transform: scale(0.98);
  }

  .fab-icon {
    font-size: 1.25rem;
  }

  .fab-label {
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* ========== RESPONSIVE ========== */
  @media (max-width: 640px) {
    .tools-app {
      overflow-x: hidden;
      max-width: 100%;
      width: 100%;
    }

    .context-bar {
      border-radius: 12px;
      margin-bottom: 1rem;
      max-width: 100%;
    }

    .context-header {
      padding: 0.75rem 1rem;
    }

    .mode-switch {
      flex: 1;
      max-width: 280px;
    }

    .mode-btn {
      padding: 0.5rem 0.6rem;
      flex: 1;
    }

    .mode-icon {
      font-size: 0.9rem;
    }

    .mode-text {
      font-size: 0.65rem;
    }

    .context-panel {
      padding: 0 1rem 1rem;
    }

    .control-grid.planning,
    .control-grid.trail {
      grid-template-columns: 1fr;
      gap: 0.75rem;
    }

    .ctrl-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.15rem;
    }

    .ctrl-val {
      font-size: 1.1rem;
    }

    .ctrl-date,
    .ctrl-num {
      width: 100%;
      max-width: 100%;
      box-sizing: border-box;
    }

    .ctrl-num-wrap {
      width: 100%;
    }

    .context-panel {
      overflow-x: hidden;
    }

    .mile-display {
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .mile-main {
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .mile-num {
      font-size: 2.25rem;
    }

    .mile-landmark {
      font-size: 0.85rem;
    }

    .context-stat-row {
      flex-wrap: wrap;
      gap: 0.75rem;
      justify-content: space-around;
    }

    .ctx-stat {
      flex: 0 0 auto;
      min-width: 60px;
    }

    .ctx-stat-val {
      font-size: 1.1rem;
    }

    .ctx-stat-label {
      font-size: 0.6rem;
    }

    .context-summary {
      flex-wrap: wrap;
      gap: 0.35rem;
      padding: 0 1rem 0.75rem;
    }

    .sum-val {
      font-size: 0.9rem;
    }

    .tools-nav {
      display: flex;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
      gap: 0.2rem;
      padding: 0.25rem;
      border-radius: 10px;
      margin-bottom: 1.5rem;
      max-width: 100%;
    }

    .tools-nav::-webkit-scrollbar {
      display: none;
    }

    .nav-tab {
      flex: 0 0 auto;
      min-width: 56px;
      padding: 0.5rem 0.25rem;
    }

    .tab-icon {
      font-size: 1rem;
    }

    .tab-name {
      font-size: 0.6rem;
    }

    .quick-log-fab {
      bottom: 16px;
      right: 16px;
      padding: 0.75rem 1.25rem;
    }

    .fab-icon {
      font-size: 1.1rem;
    }

    .fab-label {
      font-size: 0.9rem;
    }

    .tool-viewport {
      min-height: 400px;
    }

    .quick-links {
      margin-top: 2rem;
    }

    .quick-link {
      padding: 0.75rem 1rem;
      gap: 1rem;
    }
  }

  /* Extra small screens */
  @media (max-width: 380px) {
    .mode-text {
      display: none;
    }

    .mode-btn {
      padding: 0.5rem 0.75rem;
    }

    .mode-icon {
      font-size: 1.1rem;
    }

    .nav-tab {
      min-width: 50px;
    }

    .tab-name {
      font-size: 0.55rem;
    }

    .quick-log-fab {
      bottom: 12px;
      right: 12px;
      padding: 0.6rem 1rem;
      font-size: 0.9rem;
    }
  }
</style>
