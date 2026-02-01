<script lang="ts">
  import { onMount } from 'svelte';
  import { loadContext, getContextSnapshot } from '../../stores/trailContext.svelte';
  import ContextBanner from './ContextBanner.svelte';

  interface Props {
    toolId: string;
    toolName: string;
    children?: import('svelte').Snippet;
  }

  let { toolId, toolName, children }: Props = $props();

  // Default to visible in SSR so the tool shell isn't a blank page if hydration is delayed/blocked.
  let mounted = $state(true);
  let ToolComponent = $state<typeof import('svelte').SvelteComponent | null>(null);

  // Tool component loaders
  const toolLoaders: Record<string, () => Promise<{ default: typeof import('svelte').SvelteComponent }>> = {
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

    // Load the tool component
    if (toolLoaders[toolId]) {
      try {
        const module = await toolLoaders[toolId]();
        ToolComponent = module.default;
      } catch (e) {
        console.error(`Failed to load tool: ${toolId}`, e);
      }
    }

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
    {:else}
      <div class="loading">
        <div class="spinner"></div>
        <span>Loading {toolName}...</span>
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
</style>
