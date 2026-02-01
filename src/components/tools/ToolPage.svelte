<script lang="ts">
  import { onMount } from 'svelte';
  import { loadContext, getContextSnapshot } from '../../stores/trailContext.svelte';
  import ContextBanner from './ContextBanner.svelte';
  import { recordToolOpened } from '../../lib/progression';

  interface Props {
    toolId: string;
    toolName: string;
    children?: import('svelte').Snippet;
  }

  let { toolId, toolName, children }: Props = $props();

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

  // Get snapshot for passing to child tool (reactive)
  let trailContext = $derived.by(() => getContextSnapshot());
</script>

<div class="tool-page" class:mounted>
  <!-- Context Banner with Edit Button -->
  <ContextBanner />

  <!-- Tool Content -->
  <div class="tool-content">
    {#if ToolComponent}
      <svelte:component this={ToolComponent} {trailContext} />
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
  </div>

</div>

<style>
  .tool-page {
    max-width: 960px;
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

  .tool-content {
    min-height: 400px;
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
</style>
