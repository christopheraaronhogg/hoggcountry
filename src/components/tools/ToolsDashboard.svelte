<script lang="ts">
  import { onMount } from 'svelte';
  import ContextEditor from './ContextEditor.svelte';
  import ContextHero from './ContextHero.svelte';
  import ToolCard from './ToolCard.svelte';
  import AlertBanner from './widgets/AlertBanner.svelte';
  import TownWidget from './widgets/TownWidget.svelte';
  import { loadContext } from '../../stores/trailContext.svelte';

  let editorOpen = $state(false);

  const tools = [
    { id: 'milestone', name: 'Journey', icon: '🗺️', desc: 'Plan your timeline & track progress' },
    { id: 'weather', name: 'Weather', icon: '🌤️', desc: 'Weather, heat zones & daylight' },
    { id: 'pack', name: 'Pack', icon: '🎒', desc: 'Build & weigh your kit' },
    { id: 'gear', name: 'Gear', icon: '🛠️', desc: 'Build your kit by budget' },
    { id: 'resupply', name: 'Resupply', icon: '🍽️', desc: 'Towns, food & mail drops' },
    { id: 'water', name: 'Water', icon: '💧', desc: 'Water sources & carry calc' },
    { id: 'budget', name: 'Budget', icon: '💰', desc: 'Track trail spending' },
    { id: 'mail', name: 'Mail', icon: '📬', desc: 'Plan mail drops' },
    { id: 'power', name: 'Power', icon: '🔋', desc: 'Manage battery & devices' },
    { id: 'food', name: 'Food', icon: '🥣', desc: 'Calories & weight calculator' },
    { id: 'geartrans', name: 'Swap', icon: '🔄', desc: 'Gear transition planner' },
    { id: 'training', name: 'Train', icon: '🏋️', desc: 'Pre-trail preparation' },
    { id: 'shelter', name: 'Shelter', icon: '🏠', desc: 'Tent vs shelter decision' },
    { id: 'layers', name: 'Layers', icon: '🧥', desc: 'What to wear for conditions' },
    { id: 'emergency', name: 'Emergency', icon: '🆘', desc: 'Emergency info & bailouts' },
  ] as const;

  onMount(() => {
    loadContext();
  });
</script>

<div class="tools-dashboard">
  <ContextHero onEdit={() => (editorOpen = true)} />

  <div class="dashboard-row">
    <div class="dashboard-col">
      <AlertBanner />
    </div>
    <div class="dashboard-col">
      <TownWidget />
    </div>
  </div>

  <section class="tool-grid" aria-label="Trail tools">
    {#each tools as tool}
      <ToolCard href={`/tools/${tool.id}/`} icon={tool.icon} name={tool.name} desc={tool.desc} />
    {/each}
  </section>

  <ContextEditor bind:open={editorOpen} />
</div>

<style>
  .tools-dashboard {
    padding-bottom: 4rem;
  }

  .dashboard-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin: 1rem 0 1.25rem;
  }

  @media (max-width: 820px) {
    .dashboard-row {
      grid-template-columns: 1fr;
    }
  }

  .tool-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1rem;
    margin-top: 1.25rem;
  }

  @media (max-width: 980px) {
    .tool-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 560px) {
    .tool-grid {
      grid-template-columns: 1fr;
    }
  }
</style>

