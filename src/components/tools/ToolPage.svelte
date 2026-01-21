<script lang="ts">
  import { onMount } from 'svelte';
  import { loadContext, trailContext } from '../../stores/trailContext.svelte';
  import ContextBanner from './ContextBanner.svelte';

  let { toolId, title } = $props<{ toolId: string; title: string }>();

  const toolLoaders: Record<string, () => Promise<{ default: unknown }>> = {
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

  let ToolComponent = $state<unknown>(null);
  let loading = $state(true);
  let loadError = $state<string | null>(null);

  async function loadTool(id: string) {
    loading = true;
    loadError = null;

    const loader = toolLoaders[id];
    if (!loader) {
      ToolComponent = null;
      loading = false;
      loadError = `Unknown tool: ${id}`;
      return;
    }

    try {
      const mod = await loader();
      ToolComponent = mod.default;
    } catch (err) {
      ToolComponent = null;
      loadError = err instanceof Error ? err.message : 'Failed to load tool.';
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    loadContext();
    loadTool(toolId);
  });
</script>

<div class="tool-page">
  <ContextBanner {title} />

  {#if loading}
    <div class="card loading" aria-busy="true">Loading…</div>
  {:else if loadError}
    <div class="card loading">
      <p><strong>Couldn’t load this tool.</strong></p>
      <p class="muted">{loadError}</p>
      <p><a href="/tools/">Back to tools</a></p>
    </div>
  {:else if ToolComponent}
    <div class="tool-shell">
      <svelte:component this={ToolComponent} trailContext={trailContext} />
    </div>
  {/if}
</div>

<style>
  .tool-page {
    padding-bottom: 4rem;
  }

  .tool-shell {
    max-width: 100%;
    overflow-x: clip;
  }

  .loading {
    padding: 1rem;
  }

  .muted {
    color: var(--muted);
  }
</style>

