<script lang="ts">
  import { onMount } from 'svelte';
  import { trailContext, loadContext } from '../../stores/trailContext.svelte';
  import { getAlerts, getNextTown, getNextRoadCrossing } from '../../lib/trailRecommendations';
  import ContextHero from './ContextHero.svelte';
  import ToolCard from './ToolCard.svelte';
  import AlertBanner from './widgets/AlertBanner.svelte';
  import TownWidget from './widgets/TownWidget.svelte';
  import WaterWidget from './widgets/WaterWidget.svelte';
  import BailoutWidget from './widgets/BailoutWidget.svelte';
  import atWaterSources from '../../data/at-water-sources.json';
  import { TRAIL_EMERGENCY_TOOL, TRAIL_TOOL_GROUPS } from '../../data/trailTools';

  // State
  let mounted = $state(false);

  // Derived from context
  // NOTE: use $derived.by for function-based derivations so updates track correctly
  let alerts = $derived.by(() => getAlerts(Number(trailContext.currentMile) || 0, 25));
  let nextTown = $derived.by(() => getNextTown(Number(trailContext.currentMile) || 0));
  let nextBailout = $derived.by(() => getNextRoadCrossing(Number(trailContext.currentMile) || 0));

  type WaterSource = { mile: number; name: string; type: string; offTrail?: number };
  const waterSourcesSorted: WaterSource[] = (Array.isArray(atWaterSources) ? atWaterSources : [])
    .filter((s) => typeof s?.mile === 'number' && typeof s?.name === 'string' && typeof s?.type === 'string')
    .map((s) => ({ mile: s.mile, name: s.name, type: s.type, offTrail: typeof s.offTrail === 'number' ? s.offTrail : 0 }))
    .sort((a, b) => a.mile - b.mile);

  let nextWater = $derived.by(() => {
    const mile = Number(trailContext.currentMile) || 0;
    const next = waterSourcesSorted.find((s) => s.mile > mile);
    if (!next) return null;
    const distance = Number((next.mile - mile).toFixed(1));
    return { ...next, distance };
  });

  onMount(() => {
    loadContext();
    mounted = true;
  });
</script>

<div class="dashboard" class:mounted>
  <!-- Context Hero -->
  <ContextHero />

  <!-- What Matters Now Section -->
  <section class="matters-section">
    <h2 class="section-title">What Matters Right Now</h2>

    <div class="matters-grid">
      <!-- Town Widget -->
      <TownWidget town={nextTown} />

      <!-- Next water (always) -->
      <WaterWidget source={nextWater} />

      <!-- Next bailout / road crossing -->
      <BailoutWidget crossing={nextBailout} />

      <!-- Alerts (state line, bear, terrain) -->
      {#each alerts.slice(0, 2) as alert}
        <AlertBanner {alert} />
      {/each}
    </div>
  </section>

  <!-- All Tools Section -->
  <section class="tools-section">
    <h2 class="section-title">All Tools</h2>

    {#each TRAIL_TOOL_GROUPS as group}
      <div class="tool-group">
        <h3 class="group-name">{group.name}</h3>
        <div class="tool-grid">
          {#each group.tools as tool}
            <ToolCard
              id={tool.id}
              name={tool.name}
              icon={tool.icon}
              description={tool.desc}
              href={tool.href}
            />
          {/each}
        </div>
      </div>
    {/each}

    <!-- Emergency Tool - Special Treatment -->
    <div class="emergency-section">
      <ToolCard
        id={TRAIL_EMERGENCY_TOOL.id}
        name={TRAIL_EMERGENCY_TOOL.name}
        icon={TRAIL_EMERGENCY_TOOL.icon}
        description={TRAIL_EMERGENCY_TOOL.desc}
        href={TRAIL_EMERGENCY_TOOL.href}
        isEmergency={true}
      />
    </div>
  </section>
</div>

<style>
  .dashboard {
    max-width: 960px;
    margin: 0 auto;
    padding: 0 1rem;
    opacity: 0;
    transform: translateY(10px);
    transition: opacity 0.4s ease, transform 0.4s ease;
  }

  .dashboard.mounted {
    opacity: 1;
    transform: translateY(0);
  }

  /* Section Styles */
  .matters-section,
  .tools-section {
    margin-top: 2rem;
  }

  .section-title {
    font-family: Oswald, sans-serif;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--muted, #888);
    margin: 0 0 1rem;
  }

  /* What Matters Grid */
  .matters-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1rem;
  }

  /* Tool Groups */
  .tool-group {
    margin-bottom: 1.5rem;
  }

  .group-name {
    font-family: Oswald, sans-serif;
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--pine, #4a5a44);
    margin: 0 0 0.75rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--border, #e5e5e5);
  }

  .tool-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 0.75rem;
  }

  /* Emergency Section */
  .emergency-section {
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 2px solid rgba(220, 38, 38, 0.2);
  }

  .emergency-section :global(.tool-card) {
    max-width: 200px;
  }

  /* Responsive */
  @media (max-width: 640px) {
    .dashboard {
      padding: 0 0.75rem;
    }

    .matters-grid {
      grid-template-columns: 1fr;
    }

    .tool-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 0.5rem;
    }

    .section-title {
      font-size: 0.75rem;
    }
  }

  @media (max-width: 380px) {
    .tool-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
</style>
