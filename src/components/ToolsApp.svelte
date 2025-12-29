<script>
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import MilestoneCalculator from './MilestoneCalculator.svelte';
  import GearCalculator from './GearCalculator.svelte';
  import DaylightCalculator from './DaylightCalculator.svelte';
  import ResupplyCalculator from './ResupplyCalculator.svelte';
  import BudgetCalculator from './BudgetCalculator.svelte';

  const tools = [
    { id: 'milestone', name: 'Milestones', icon: '📍', desc: 'Plan your journey timeline' },
    { id: 'gear', name: 'Gear', icon: '⚖️', desc: 'Optimize pack weight' },
    { id: 'daylight', name: 'Daylight', icon: '🌅', desc: 'Sunrise & sunset times' },
    { id: 'resupply', name: 'Resupply', icon: '🍽️', desc: 'Town & food planner' },
    { id: 'budget', name: 'Budget', icon: '💰', desc: 'Track trail spending' },
  ];

  let activeTool = 'milestone';
  let isTransitioning = false;
  let mounted = false;

  onMount(() => {
    mounted = true;
    const hash = window.location.hash.slice(1);
    if (tools.some(t => t.id === hash && !t.disabled)) {
      activeTool = hash;
    }
  });

  function switchTool(toolId) {
    if (toolId === activeTool || tools.find(t => t.id === toolId)?.disabled) return;

    isTransitioning = true;
    window.history.replaceState(null, '', `#${toolId}`);

    setTimeout(() => {
      activeTool = toolId;
      setTimeout(() => {
        isTransitioning = false;
      }, 50);
    }, 200);
  }

  $: activeToolData = tools.find(t => t.id === activeTool);
</script>

<div class="tools-app" class:mounted>
  <!-- Tool Navigation -->
  <nav class="tools-nav">
    {#each tools as tool}
      <button
        class="nav-tab"
        class:active={activeTool === tool.id}
        class:disabled={tool.disabled}
        on:click={() => switchTool(tool.id)}
        disabled={tool.disabled}
        aria-label={tool.name}
      >
        <span class="tab-content">
          <span class="tab-icon">{tool.icon}</span>
          <span class="tab-name">{tool.name}</span>
        </span>
        {#if tool.disabled}
          <span class="tab-badge">Soon</span>
        {/if}
        {#if activeTool === tool.id}
          <div class="active-indicator" transition:fade></div>
        {/if}
      </button>
    {/each}
  </nav>

  <!-- Tool Content - All tools render for SSR CSS extraction, hidden via CSS -->
  <div class="tool-viewport">
    <div class="tool-container" class:transitioning={isTransitioning}>
      <div class="tool-panel" class:hidden={activeTool !== 'milestone'}>
        <MilestoneCalculator />
      </div>
      <div class="tool-panel" class:hidden={activeTool !== 'gear'}>
        <GearCalculator />
      </div>
      <div class="tool-panel" class:hidden={activeTool !== 'daylight'}>
        <DaylightCalculator />
      </div>
      <div class="tool-panel" class:hidden={activeTool !== 'resupply'}>
        <ResupplyCalculator />
      </div>
      <div class="tool-panel" class:hidden={activeTool !== 'budget'}>
        <BudgetCalculator />
      </div>
    </div>
  </div>

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
    margin: 0 auto;
    opacity: 0;
    transform: translateY(10px);
    transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .tools-app.mounted {
    opacity: 1;
    transform: translateY(0);
  }

  /* Navigation */
  .tools-nav {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
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
  }

  .tool-container {
    transition: opacity 0.2s ease, transform 0.2s ease;
  }

  .tool-container.transitioning {
    opacity: 0;
    transform: translateY(10px);
    pointer-events: none;
  }

  .tool-panel.hidden {
    display: none;
  }

  /* Coming Soon */
  .coming-soon {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 16px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.04);
  }

  .coming-soon-content {
    text-align: center;
    padding: 3rem 2rem;
  }

  .coming-soon-icon {
    font-size: 4rem;
    display: block;
    margin-bottom: 1.5rem;
    filter: grayscale(1) opacity(0.5);
  }

  .coming-soon h3 {
    font-family: Oswald, sans-serif;
    font-size: 1.75rem;
    color: var(--ink);
    margin: 0 0 0.75rem;
  }

  .coming-soon p {
    color: var(--muted);
    max-width: 32ch;
    margin: 0 auto 1.5rem;
    line-height: 1.6;
  }

  .coming-soon-badge {
    display: inline-block;
    padding: 0.4rem 0.8rem;
    background: var(--bg);
    border: 1px dashed var(--pine);
    border-radius: 6px;
    font-family: Oswald, sans-serif;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--pine);
    text-transform: uppercase;
    letter-spacing: 0.1em;
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

  @media (max-width: 640px) {
    .tools-nav {
      grid-template-columns: repeat(2, 1fr);
      gap: 0.25rem;
    }

    .nav-tab {
      padding: 1rem;
    }
  }
</style>
