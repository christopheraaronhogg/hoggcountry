<script lang="ts">
  import { onMount } from 'svelte';
  import { resolve } from '$app/paths';
  import { loadContext, getContextSnapshot } from '../../stores/trailContext.svelte';
  import ContextBanner from './ContextBanner.svelte';
  import { recordToolOpened } from '../../lib/progression';
  import type { TrailTool } from '../../data/trailTools';

  interface Props {
    toolId: string;
    toolName: string;
    toolIcon?: string;
    toolDescription?: string;
    toolIntent?: string;
    toolGroup?: string;
    relatedTools?: TrailTool[];
    children?: import('svelte').Snippet;
  }

  let {
    toolId,
    toolName,
    toolIcon = '⌁',
    toolDescription = 'A Hogg Country trail tool.',
    toolIntent = 'Use this with your current trail context.',
    toolGroup = 'Trail Tools',
    relatedTools = [],
    children
  }: Props = $props();

  // Default to visible in SSR so the tool shell isn't a blank page if hydration is delayed/blocked.
  let mounted = $state(true);
  // Svelte 5 component typing varies by props; keep this permissive for dynamic tool loading.
  let ToolComponent = $state<any>(null);
  let loadError = $state<string | null>(null);
  let slowLoad = $state(false);

  // Tool component loaders
  const toolLoaders: Record<string, () => Promise<{ default: any }>> = {
    character: () => import('../CharacterSheet.svelte'),
    milestone: () => import('../MilestoneCalculator.svelte'),
    weather: () => import('../WeatherAssessor.svelte'),
    pack: () => import('../PackBuilder.svelte'),
    gear: () => import('../BudgetGearBuilder.svelte'),
    resupply: () => import('../ResupplyCalculator.svelte'),
    water: () => import('../WaterTracker.svelte'),
    budget: () => import('../BudgetCalculator.svelte'),
    mail: () => import('../MailDropPlanner.svelte'),
    power: () => import('../PowerManager.svelte'),
    food: () => import('../FoodCalculator.svelte'),
    geartrans: () => import('../GearTransitionTracker.svelte'),
    training: () => import('../TrainingPlanner.svelte'),
    shelter: () => import('../ShelterDecision.svelte'),
    layers: () => import('../LayeringAdvisor.svelte'),
    emergency: () => import('../EmergencyCard.svelte'),
  };

  onMount(async () => {
    loadContext();

    loadError = null;
    slowLoad = false;
    const slowTimer = window.setTimeout(() => {
      if (!ToolComponent && !loadError) slowLoad = true;
    }, 3500);

    // Load the tool component
    if (!toolLoaders[toolId]) {
      loadError = `Unknown toolId: ${toolId}`;
    } else {
      try {
        const module = await toolLoaders[toolId]();
        ToolComponent = module.default;
        recordToolOpened(toolId);
      } catch (e: any) {
        const msg = e?.message ? String(e.message) : String(e);
        loadError = msg;
        console.error(`Failed to load tool: ${toolId}`, e);
      }
    }

    window.clearTimeout(slowTimer);
    mounted = true;
  });

  let trailContext = $derived.by(() => getContextSnapshot());
  let milesRemaining = $derived(Math.max(0, Number(trailContext.milesRemaining) || 0));
  let contextSummary = $derived.by(() => [
    { label: 'Mile', value: Number(trailContext.currentMile || 0).toFixed(1) },
    { label: 'Nearest', value: trailContext.nearestLandmark?.name ?? 'Springer Mountain' },
    { label: 'Pace', value: `${Number(trailContext.targetPace || 0).toFixed(1)} / day` },
    { label: 'Left', value: `${milesRemaining.toLocaleString()} mi` }
  ]);

</script>

<div class="tool-page" class:mounted>
  <nav class="tool-ribbon" aria-label="Tool navigation">
    <a class="back-link" href={resolve('/tools')}>
      <span aria-hidden="true">←</span>
      Trail Tools
    </a>
    <span class="ribbon-divider" aria-hidden="true"></span>
    <span class="group-chip">{toolGroup}</span>
    <span class="intent-line">{toolIntent}</span>
  </nav>

  <header class="tool-hero">
    <div class="tool-title-block">
      <div class="tool-icon" aria-hidden="true">{toolIcon}</div>
      <div>
        <p class="eyebrow">{toolGroup}</p>
        <h1>{toolName}</h1>
        <p class="tool-description">{toolDescription}</p>
      </div>
    </div>

    <div class="context-card" aria-label="Current trail context">
      <div class="context-card-head">
        <span>Current context</span>
        <strong>{Number(trailContext.percentComplete || 0).toFixed(1)}%</strong>
      </div>
      <div class="mini-progress" aria-label={`${Number(trailContext.percentComplete || 0).toFixed(1)}% complete`}>
        <span style={`width: ${Math.max(0, Math.min(100, Number(trailContext.percentComplete || 0)))}%`}></span>
      </div>
      <div class="context-grid">
        {#each contextSummary as item (item.label)}
          <div>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        {/each}
      </div>
    </div>
  </header>

  <div class="context-dock">
    <ContextBanner />
  </div>

  <div class="tool-layout">
    <section class="tool-content" aria-label={`${toolName} workspace`}>
      {#if ToolComponent}
        <ToolComponent {trailContext} embedded={true} />
      {:else if loadError}
        <div class="error">
          <div class="error-title">Tool failed to load</div>
          <div class="error-body">
            <div><strong>{toolName}</strong></div>
            <div class="error-msg">{loadError}</div>
            <div class="error-hint">
              Try a hard refresh (Cmd/Ctrl+Shift+R). If you have offline mode enabled, clear the site cache for hoggcountry.com.
            </div>
          </div>
        </div>
      {:else}
        <div class="loading">
          <div class="spinner"></div>
          <span>Loading {toolName}...</span>
          {#if slowLoad}
            <span class="slow">Still loading… (likely a cached script/offline issue)</span>
          {/if}
        </div>
      {/if}
    </section>

    {#if relatedTools.length}
      <aside class="tool-aside" aria-label="Related trail tools">
        <div class="aside-card">
          <p class="aside-k">Next tools</p>
          <h2>Keep the context moving</h2>
          <div class="related-list">
            {#each relatedTools as tool (tool.id)}
              <a class="related-link" href={resolve(tool.href)}>
                <span class="related-icon" aria-hidden="true">{tool.icon}</span>
                <span>
                  <strong>{tool.name}</strong>
                  <small>{tool.desc}</small>
                </span>
              </a>
            {/each}
          </div>
        </div>
      </aside>
    {/if}
  </div>
</div>

<style>
  .tool-page {
    max-width: 1160px;
    margin: 0 auto;
    padding: 0 1rem;
    opacity: 0;
    transform: translateY(10px);
    transition: opacity 0.4s ease, transform 0.4s ease;
  }

  .tool-page.mounted {
    opacity: 1;
    transform: translateY(0);
  }

  .tool-ribbon {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    margin: 0 0 0.8rem;
    min-height: 2.35rem;
    color: rgba(61, 74, 56, 0.78);
    font-family: Oswald, sans-serif;
    font-size: 0.74rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    min-height: 2rem;
    color: var(--pine, #3d4a38);
    text-decoration: none;
  }

  .back-link:hover {
    text-decoration: underline;
    text-underline-offset: 0.2rem;
  }

  .ribbon-divider {
    width: 1px;
    height: 1.1rem;
    background: rgba(61, 74, 56, 0.2);
  }

  .group-chip {
    border: 1px solid rgba(123, 158, 107, 0.28);
    border-radius: 999px;
    background: rgba(123, 158, 107, 0.12);
    padding: 0.25rem 0.6rem;
    color: var(--pine, #3d4a38);
  }

  .intent-line {
    min-width: 0;
    overflow: hidden;
    color: rgba(74, 85, 70, 0.68);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tool-hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(18rem, 23rem);
    gap: 1rem;
    margin-bottom: 1rem;
    align-items: stretch;
  }

  .tool-title-block,
  .context-card,
  .aside-card {
    border: 1px solid rgba(61, 74, 58, 0.14);
    background:
      linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.72)),
      rgba(245, 242, 232, 0.72);
    border-radius: 14px;
    box-shadow: 0 16px 44px rgba(45, 54, 42, 0.08);
  }

  .tool-title-block {
    display: flex;
    gap: 0.95rem;
    padding: clamp(1rem, 3vw, 1.35rem);
  }

  .tool-icon {
    flex: 0 0 auto;
    display: grid;
    place-items: center;
    width: 3.6rem;
    height: 3.6rem;
    border: 1px solid rgba(61, 74, 56, 0.16);
    border-radius: 12px;
    background: rgba(240, 224, 0, 0.22);
    font-size: 1.7rem;
  }

  .eyebrow,
  .aside-k {
    margin: 0;
    color: rgba(61, 74, 56, 0.68);
    font-family: Oswald, sans-serif;
    font-size: 0.7rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .tool-title-block h1 {
    margin: 0.15rem 0 0;
    color: var(--pine, #3d4a38);
    font-family: Anton, sans-serif;
    font-size: clamp(2.15rem, 7vw, 4.25rem);
    font-weight: 400;
    letter-spacing: 0.03em;
    line-height: 0.95;
    text-transform: uppercase;
  }

  .tool-description {
    max-width: 58ch;
    margin: 0.6rem 0 0;
    color: rgba(45, 55, 48, 0.78);
    font-size: 0.96rem;
    line-height: 1.5;
  }

  .context-card {
    display: grid;
    align-content: start;
    gap: 0.75rem;
    padding: 1rem;
  }

  .context-card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    color: rgba(61, 74, 56, 0.7);
    font-family: Oswald, sans-serif;
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .context-card-head strong {
    color: var(--pine, #3d4a38);
    font-size: 1rem;
  }

  .mini-progress {
    height: 0.55rem;
    overflow: hidden;
    border-radius: 999px;
    background: rgba(61, 74, 56, 0.1);
  }

  .mini-progress span {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, var(--pine, #3d4a38), var(--alpine, #7b9e6b));
  }

  .context-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.55rem;
  }

  .context-grid div {
    min-width: 0;
    border: 1px solid rgba(61, 74, 56, 0.1);
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.68);
    padding: 0.55rem 0.65rem;
  }

  .context-grid span {
    display: block;
    color: rgba(61, 74, 56, 0.62);
    font-family: Oswald, sans-serif;
    font-size: 0.64rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .context-grid strong {
    display: block;
    min-width: 0;
    margin-top: 0.15rem;
    overflow: hidden;
    color: rgba(31, 41, 55, 0.92);
    font-size: 0.86rem;
    line-height: 1.18;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .context-dock {
    margin-bottom: 1rem;
  }

  .context-dock :global(.banner-wrap) {
    margin-bottom: 0;
  }

  .tool-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(15rem, 18rem);
    gap: 1rem;
    align-items: start;
  }

  .tool-content {
    min-height: 400px;
  }

  .tool-aside {
    position: sticky;
    top: 4.5rem;
  }

  .aside-card {
    padding: 1rem;
  }

  .aside-card h2 {
    margin: 0.2rem 0 0.85rem;
    color: var(--pine, #3d4a38);
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    line-height: 1.1;
    text-transform: uppercase;
  }

  .related-list {
    display: grid;
    gap: 0.55rem;
  }

  .related-link {
    display: grid;
    grid-template-columns: 2.15rem minmax(0, 1fr);
    gap: 0.6rem;
    align-items: center;
    padding: 0.65rem;
    border: 1px solid rgba(61, 74, 56, 0.12);
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.64);
    color: inherit;
    text-decoration: none;
    transition: transform 0.16s ease, border-color 0.16s ease, background 0.16s ease;
  }

  .related-link:hover,
  .related-link:focus-visible {
    border-color: rgba(123, 158, 107, 0.42);
    background: rgba(255, 255, 255, 0.88);
    transform: translateY(-1px);
  }

  .related-link:focus-visible {
    outline: 3px solid rgba(123, 158, 107, 0.45);
    outline-offset: 2px;
  }

  .related-icon {
    display: grid;
    place-items: center;
    width: 2.15rem;
    height: 2.15rem;
    border-radius: 8px;
    background: rgba(123, 158, 107, 0.12);
  }

  .related-link strong {
    display: block;
    color: var(--pine, #3d4a38);
    font-family: Oswald, sans-serif;
    font-size: 0.82rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .related-link small {
    display: block;
    margin-top: 0.1rem;
    color: rgba(74, 85, 70, 0.72);
    font-size: 0.72rem;
    line-height: 1.25;
  }

  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    min-height: 300px;
    color: var(--muted, #888);
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--border, #e5e5e5);
    border-top-color: var(--alpine, #7b9e6b);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .loading span {
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .slow {
    font-size: 0.8rem;
    color: var(--muted, #777);
    text-transform: none;
    letter-spacing: 0.01em;
  }

  .error {
    border: 1px solid rgba(220, 38, 38, 0.25);
    background: rgba(220, 38, 38, 0.06);
    border-radius: 12px;
    padding: 1rem;
  }

  .error-title {
    font-family: Oswald, sans-serif;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: rgb(153, 27, 27);
    margin-bottom: 0.5rem;
  }

  .error-body {
    color: rgba(31, 41, 55, 0.92);
    display: grid;
    gap: 0.35rem;
  }

  .error-msg {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    font-size: 0.85rem;
    white-space: pre-wrap;
  }

  .error-hint {
    color: rgba(55, 65, 81, 0.75);
    font-size: 0.9rem;
  }

  @media (max-width: 900px) {
    .tool-hero,
    .tool-layout {
      grid-template-columns: 1fr;
    }

    .tool-aside {
      position: static;
    }

    .related-list {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 640px) {
    .tool-page {
      padding: 0 0.5rem;
    }

    .tool-ribbon {
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 0.45rem;
    }

    .intent-line {
      flex-basis: 100%;
      white-space: normal;
      line-height: 1.25;
    }

    .tool-title-block {
      display: grid;
      grid-template-columns: 3rem minmax(0, 1fr);
      padding: 0.9rem;
    }

    .tool-icon {
      width: 3rem;
      height: 3rem;
      border-radius: 10px;
      font-size: 1.35rem;
    }

    .tool-title-block h1 {
      font-size: clamp(1.85rem, 12vw, 3rem);
    }

    .tool-description {
      font-size: 0.88rem;
    }

    .context-card {
      padding: 0.85rem;
    }

    .related-list {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 390px) {
    .context-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
