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

  // One-line intent per group — keeps the workbench feeling intentional
  const groupBlurbs: Record<string, string> = {
    Planning: 'Set up the hike before you leave: kit, calories, conditioning.',
    'On Trail': 'Live decisions you make most days — water, weather, where to sleep.',
    'Town Days': 'Resupply, mail, charging, gear swaps when you hit pavement.',
    Always: 'The map of the whole trail and the upload queue, anytime.'
  };

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
    <div class="section-head">
      <h2 class="section-title">What's next on trail</h2>
      <p class="section-sub">Reads from your mile marker above.</p>
    </div>

    <div class="matters-grid">
      <!-- Town Widget -->
      <TownWidget town={nextTown} />

      <!-- Next water (always) -->
      <WaterWidget source={nextWater} />

      <!-- Next bailout / road crossing -->
      <BailoutWidget crossing={nextBailout} />

      <!-- Alerts (state line, bear, terrain) -->
      {#each alerts.slice(0, 2) as alert (alert.title + alert.type)}
        <AlertBanner {alert} />
      {/each}
    </div>
  </section>

  <!-- All Tools Section -->
  <section class="tools-section">
    <div class="section-head">
      <h2 class="section-title">The toolkit</h2>
      <p class="section-sub">Grouped by when you'll actually use them.</p>
    </div>

    {#each TRAIL_TOOL_GROUPS as group (group.name)}
      <div class="tool-group">
        <div class="group-head">
          <h3 class="group-name">{group.name}</h3>
          {#if groupBlurbs[group.name]}
            <p class="group-blurb">{groupBlurbs[group.name]}</p>
          {/if}
        </div>
        <div class="tool-grid">
          {#each group.tools as tool (tool.id)}
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
      <div class="emergency-head">
        <h3 class="emergency-label">If something goes wrong</h3>
        <p class="emergency-sub">Bailouts, hospitals, in-case-of-emergency contacts.</p>
      </div>
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

  .section-head {
    margin: 0 0 1rem;
    display: flex;
    align-items: baseline;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .section-title {
    font-family: Oswald, sans-serif;
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--pine, #4a5a44);
    margin: 0;
    letter-spacing: 0.01em;
  }

  .section-sub {
    margin: 0;
    font-size: 0.82rem;
    color: var(--muted, #888);
    line-height: 1.35;
  }

  /* What Matters Grid */
  .matters-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 0.85rem;
  }

  /* Tool Groups */
  .tool-group {
    margin-bottom: 1.75rem;
  }

  .group-head {
    display: flex;
    align-items: baseline;
    gap: 0.6rem;
    flex-wrap: wrap;
    margin: 0 0 0.65rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--border, #e5e5e5);
  }

  .group-name {
    font-family: Oswald, sans-serif;
    font-size: 0.8rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--pine, #4a5a44);
    margin: 0;
  }

  .group-blurb {
    margin: 0;
    font-size: 0.78rem;
    color: var(--muted, #888);
    line-height: 1.35;
  }

  .tool-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 0.65rem;
  }

  /* Emergency Section */
  .emergency-section {
    margin-top: 2rem;
    padding-top: 1.25rem;
    border-top: 2px solid rgba(220, 38, 38, 0.18);
  }

  .emergency-head {
    margin-bottom: 0.75rem;
  }

  .emergency-label {
    font-family: Oswald, sans-serif;
    font-size: 0.8rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #b91c1c;
    margin: 0 0 0.2rem;
  }

  .emergency-sub {
    margin: 0;
    font-size: 0.78rem;
    color: var(--muted, #888);
    line-height: 1.35;
  }

  .emergency-section :global(.tool-card) {
    max-width: 240px;
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
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.5rem;
    }

    .section-title {
      font-size: 1rem;
    }

    .section-sub,
    .group-blurb,
    .emergency-sub {
      font-size: 0.75rem;
    }

    .emergency-section :global(.tool-card) {
      max-width: 100%;
    }
  }

  @media (max-width: 380px) {
    .tool-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.4rem;
    }
  }
</style>
