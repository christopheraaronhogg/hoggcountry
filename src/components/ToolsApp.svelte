<script>
  import { onMount } from 'svelte';
  import MilestoneCalculator from './MilestoneCalculator.svelte';
  import GearCalculator from './GearCalculator.svelte';
  import DaylightCalculator from './DaylightCalculator.svelte';

  const tools = [
    { id: 'milestone', name: 'Milestones', icon: '📍', desc: 'Plan your journey timeline' },
    { id: 'gear', name: 'Gear', icon: '⚖️', desc: 'Optimize pack weight' },
    { id: 'daylight', name: 'Daylight', icon: '🌅', desc: 'Sunrise & sunset times' },
    { id: 'resupply', name: 'Resupply', icon: '🍽️', desc: 'Coming soon', disabled: true },
  ];

  let activeTool = 'milestone';
  let isTransitioning = false;
  let mounted = false;

  onMount(() => {
    mounted = true;
    // Check URL hash for initial tool
    const hash = window.location.hash.slice(1);
    if (tools.some(t => t.id === hash && !t.disabled)) {
      activeTool = hash;
    }
  });

  function switchTool(toolId) {
    if (toolId === activeTool || tools.find(t => t.id === toolId)?.disabled) return;

    isTransitioning = true;

    // Update URL
    window.history.replaceState(null, '', `#${toolId}`);

    setTimeout(() => {
      activeTool = toolId;
      setTimeout(() => {
        isTransitioning = false;
      }, 50);
    }, 150);
  }

  $: activeToolData = tools.find(t => t.id === activeTool);
</script>

<div class="tools-app" class:mounted>
  <!-- Tool Navigation -->
  <nav class="tools-nav">
    <div class="nav-inner">
      {#each tools as tool}
        <button
          class="nav-tab"
          class:active={activeTool === tool.id}
          class:disabled={tool.disabled}
          on:click={() => switchTool(tool.id)}
          disabled={tool.disabled}
        >
          <span class="tab-icon">{tool.icon}</span>
          <span class="tab-name">{tool.name}</span>
          {#if tool.disabled}
            <span class="tab-badge">Soon</span>
          {/if}
        </button>
      {/each}
    </div>
    <div class="nav-indicator" style="--active-index: {tools.findIndex(t => t.id === activeTool)}"></div>
  </nav>

  <!-- Active Tool Description -->
  <div class="tool-header">
    <span class="tool-icon">{activeToolData?.icon}</span>
    <div class="tool-info">
      <h2 class="tool-title">{activeToolData?.name}</h2>
      <p class="tool-desc">{activeToolData?.desc}</p>
    </div>
  </div>

  <!-- Tool Content -->
  <div class="tool-container" class:transitioning={isTransitioning}>
    {#if activeTool === 'milestone'}
      <div class="tool-panel">
        <MilestoneCalculator />
      </div>
    {:else if activeTool === 'gear'}
      <div class="tool-panel">
        <GearCalculator />
      </div>
    {:else if activeTool === 'daylight'}
      <div class="tool-panel">
        <DaylightCalculator />
      </div>
    {:else if activeTool === 'resupply'}
      <div class="tool-panel coming-soon">
        <div class="coming-soon-content">
          <span class="coming-soon-icon">🍽️</span>
          <h3>Resupply Planner</h3>
          <p>Interactive food carry calculator with town services and mail drop planning.</p>
          <span class="coming-soon-badge">Coming Soon</span>
        </div>
      </div>
    {/if}
  </div>

  <!-- Quick Links -->
  <div class="quick-links">
    <a href="/guide" class="quick-link">
      <span class="link-icon">📖</span>
      <span class="link-text">Read the Full Field Guide</span>
      <span class="link-arrow">→</span>
    </a>
  </div>
</div>

<style>
  .tools-app {
    max-width: 900px;
    margin: 0 auto;
    opacity: 0;
    transform: translateY(10px);
    transition: opacity 0.4s ease, transform 0.4s ease;
  }

  .tools-app.mounted {
    opacity: 1;
    transform: translateY(0);
  }

  /* Navigation */
  .tools-nav {
    position: relative;
    background: var(--card, #fff);
    border-radius: 16px;
    padding: 0.5rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  }

  .nav-inner {
    display: flex;
    gap: 0.25rem;
    position: relative;
    z-index: 1;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .nav-inner::-webkit-scrollbar {
    display: none;
  }

  .nav-tab {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 0.85rem 1rem;
    background: transparent;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
  }

  .nav-tab:hover:not(.disabled) {
    background: rgba(166, 181, 137, 0.1);
  }

  .nav-tab.active {
    background: var(--pine, #4d594a);
  }

  .nav-tab.active .tab-icon {
    transform: scale(1.1);
  }

  .nav-tab.active .tab-name {
    color: #fff;
    font-weight: 600;
  }

  .nav-tab.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .tab-icon {
    font-size: 1.5rem;
    transition: transform 0.2s ease;
  }

  .tab-name {
    font-family: Oswald, sans-serif;
    font-size: 0.8rem;
    font-weight: 500;
    color: var(--muted, #5c665a);
    text-transform: uppercase;
    letter-spacing: 0.03em;
    white-space: nowrap;
    transition: color 0.2s ease;
  }

  .tab-badge {
    position: absolute;
    top: 0.4rem;
    right: 0.4rem;
    font-size: 0.55rem;
    font-weight: 600;
    padding: 0.15rem 0.35rem;
    background: var(--terra, #d97706);
    color: #fff;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }

  @media (max-width: 600px) {
    .nav-tab {
      padding: 0.7rem 0.75rem;
      min-width: 80px;
    }

    .tab-icon {
      font-size: 1.3rem;
    }

    .tab-name {
      font-size: 0.7rem;
    }
  }

  /* Tool Header */
  .tool-header {
    display: none; /* Hide on desktop, show on mobile */
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
    padding: 0 0.5rem;
  }

  @media (max-width: 600px) {
    .tool-header {
      display: flex;
    }
  }

  .tool-icon {
    font-size: 1.75rem;
  }

  .tool-title {
    font-family: Oswald, sans-serif;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--ink, #2b2f26);
    margin: 0;
  }

  .tool-desc {
    font-size: 0.85rem;
    color: var(--muted, #5c665a);
    margin: 0.1rem 0 0;
  }

  /* Tool Container */
  .tool-container {
    transition: opacity 0.15s ease, transform 0.15s ease;
  }

  .tool-container.transitioning {
    opacity: 0;
    transform: translateY(5px);
  }

  .tool-panel {
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Coming Soon */
  .coming-soon {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    background: var(--card, #fff);
    border-radius: 16px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.08);
  }

  .coming-soon-content {
    text-align: center;
    padding: 2rem;
  }

  .coming-soon-icon {
    font-size: 4rem;
    display: block;
    margin-bottom: 1rem;
    opacity: 0.8;
  }

  .coming-soon-content h3 {
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    color: var(--ink, #2b2f26);
    margin: 0 0 0.5rem;
  }

  .coming-soon-content p {
    color: var(--muted, #5c665a);
    max-width: 300px;
    margin: 0 auto 1rem;
  }

  .coming-soon-badge {
    display: inline-block;
    padding: 0.5rem 1rem;
    background: var(--bg, #f5f2e8);
    border: 2px dashed var(--border, #e6e1d4);
    border-radius: 8px;
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    color: var(--muted, #5c665a);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  /* Quick Links */
  .quick-links {
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--border, #e6e1d4);
  }

  .quick-link {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.25rem;
    background: var(--card, #fff);
    border-radius: 12px;
    text-decoration: none;
    box-shadow: 0 2px 12px rgba(0,0,0,0.05);
    transition: all 0.2s ease;
  }

  .quick-link:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  }

  .link-icon {
    font-size: 1.5rem;
  }

  .link-text {
    flex: 1;
    font-weight: 600;
    color: var(--ink, #2b2f26);
  }

  .link-arrow {
    font-size: 1.25rem;
    color: var(--alpine, #a6b589);
    transition: transform 0.2s ease;
  }

  .quick-link:hover .link-arrow {
    transform: translateX(4px);
  }
</style>
