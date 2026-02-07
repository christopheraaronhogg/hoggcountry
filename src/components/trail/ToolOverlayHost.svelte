<script lang="ts">
  import { onMount } from 'svelte';
  import { loadContext, getContextSnapshot } from '../../stores/trailContext.svelte';
  import TrailNotesPanel from './TrailNotesPanel.svelte';
  import type { AppMode, ToolId } from '../../lib/trail-shell-store';

  type ToolMeta = {
    id: ToolId;
    label: string;
    icon: string;
    desc: string;
    loader?: () => Promise<{ default: any }>;
  };

  interface Props {
    toolId: ToolId | null;
    mode: AppMode;
    onClose?: () => void;
    onOpenTool?: (toolId: ToolId) => void;
  }

  let {
    toolId = null,
    mode = 'prep',
    onClose = () => {},
    onOpenTool = () => {},
  }: Props = $props();

  let mounted = $state(false);
  let ToolComponent = $state<any>(null);
  let loadError = $state<string | null>(null);
  let loading = $state(false);

  const toolCatalog: Record<ToolId, ToolMeta> = {
    weather: {
      id: 'weather',
      label: 'Weather',
      icon: '🌤️',
      desc: 'Forecast and trail condition checks.',
      loader: () => import('../WeatherAssessor.svelte'),
    },
    budget: {
      id: 'budget',
      label: 'Budget',
      icon: '💰',
      desc: 'Daily spending and runway visibility.',
      loader: () => import('../BudgetCalculator.svelte'),
    },
    water: {
      id: 'water',
      label: 'Water',
      icon: '💧',
      desc: 'Carry decisions and source awareness.',
      loader: () => import('../WaterTracker.svelte'),
    },
    food: {
      id: 'food',
      label: 'Food',
      icon: '🍽️',
      desc: 'Calorie and carry-day planning.',
      loader: () => import('../FoodCalculator.svelte'),
    },
    goals: {
      id: 'goals',
      label: 'Goals',
      icon: '📈',
      desc: 'Progress projections and milestones.',
      loader: () => import('../MilestoneCalculator.svelte'),
    },
    pack: {
      id: 'pack',
      label: 'Pack',
      icon: '🎒',
      desc: 'Kit composition and base weight.',
      loader: () => import('../PackBuilder.svelte'),
    },
    notes: {
      id: 'notes',
      label: 'Notes',
      icon: '📝',
      desc: 'Fast field notes for trail decisions.',
    },
    sos: {
      id: 'sos',
      label: 'SOS',
      icon: '🆘',
      desc: 'Emergency card and bailout details.',
      loader: () => import('../EmergencyCard.svelte'),
    },
  };

  const prepToolStrip: ToolId[] = ['pack', 'budget', 'weather', 'goals'];
  const liveToolStrip: ToolId[] = ['water', 'food', 'notes', 'sos'];
  const postToolStrip: ToolId[] = ['goals', 'notes', 'sos'];

  let activeMeta = $derived.by(() => (toolId ? toolCatalog[toolId] : null));
  let toolStrip = $derived.by(() => {
    if (mode === 'live') return liveToolStrip;
    if (mode === 'post') return postToolStrip;
    return prepToolStrip;
  });

  let trailContext = $derived.by(() => getContextSnapshot());

  onMount(() => {
    loadContext();
    mounted = true;
  });

  $effect(() => {
    let cancelled = false;

    const selectedTool = toolId;

    if (!selectedTool) {
      ToolComponent = null;
      loadError = null;
      loading = false;
      return;
    }

    const meta = toolCatalog[selectedTool];
    if (!meta?.loader) {
      ToolComponent = null;
      loadError = null;
      loading = false;
      return;
    }

    ToolComponent = null;
    loadError = null;
    loading = true;

    meta
      .loader()
      .then((module) => {
        if (cancelled) return;
        ToolComponent = module.default;
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        loadError = error instanceof Error ? error.message : String(error);
      })
      .finally(() => {
        if (cancelled) return;
        loading = false;
      });

    return () => {
      cancelled = true;
    };
  });

  function handleBackdropClick(event: MouseEvent): void {
    if (event.target !== event.currentTarget) return;
    onClose();
  }
</script>

{#if toolId}
  <div class="tool-overlay" onclick={handleBackdropClick} role="presentation">
    <section class="tool-sheet" role="dialog" aria-modal="true" aria-label="Trail tool panel">
      <div class="sheet-handle" aria-hidden="true"></div>

      <header class="tool-head">
        <div class="tool-head-copy">
          <p class="mode-tag">{mode.toUpperCase()} MODE</p>
          <h2>{activeMeta?.icon} {activeMeta?.label}</h2>
          <p>{activeMeta?.desc}</p>
        </div>
        <button class="close" type="button" onclick={onClose} aria-label="Close tools">×</button>
      </header>

      <nav class="tool-strip" aria-label="Quick tools">
        {#each toolStrip as id}
          {@const item = toolCatalog[id]}
          <button
            class="tool-pill"
            class:active={id === toolId}
            type="button"
            onclick={() => onOpenTool(id)}
          >
            <span class="tool-pill-icon" aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        {/each}
      </nav>

      <div class="tool-body" class:mounted>
        {#if toolId === 'notes'}
          <TrailNotesPanel />
        {:else if ToolComponent}
          <svelte:component this={ToolComponent} {trailContext} />
        {:else if loadError}
          <div class="error-card">
            <strong>Tool failed to load.</strong>
            <p>{loadError}</p>
          </div>
        {:else if loading}
          <div class="loading">Loading {activeMeta?.label || 'tool'}...</div>
        {/if}
      </div>
    </section>
  </div>
{/if}

<style>
  .tool-overlay {
    position: fixed;
    inset: 0;
    z-index: var(--layer-tool, 85);
    background: rgba(12, 17, 20, 0.44);
    backdrop-filter: blur(3px);
    display: grid;
    align-items: end;
    animation: toolOverlayIn 180ms ease-out;
  }

  .tool-sheet {
    border-top-left-radius: 18px;
    border-top-right-radius: 18px;
    background:
      linear-gradient(180deg, rgba(255,255,255,0.96), rgba(252, 250, 245, 0.95)),
      var(--bg, #f5f2e8);
    border-top: 1px solid rgba(77, 89, 74, 0.24);
    box-shadow: 0 -18px 40px rgba(0, 0, 0, 0.2);
    max-height: min(90dvh, 920px);
    display: grid;
    grid-template-rows: auto auto 1fr;
    overflow: hidden;
  }

  .sheet-handle {
    width: 70px;
    height: 5px;
    border-radius: 999px;
    background: rgba(31, 41, 55, 0.24);
    margin: 0.55rem auto 0.3rem;
  }

  .tool-head {
    display: flex;
    justify-content: space-between;
    gap: 0.8rem;
    padding: 0 1rem 0.8rem;
    border-bottom: 1px solid rgba(77, 89, 74, 0.12);
  }

  .tool-head-copy {
    min-width: 0;
  }

  .tool-head h2 {
    margin: 0;
    font-size: 1.1rem;
    color: var(--ink, #1f2937);
  }

  .tool-head p {
    margin: 0.2rem 0 0;
    line-height: 1.4;
    color: rgba(31, 41, 55, 0.74);
    font-size: 0.84rem;
  }

  .mode-tag {
    margin: 0;
    font-family: Oswald, sans-serif;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    font-size: 0.67rem;
    color: var(--pine, #4d594a);
  }

  .close {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    border: 1px solid rgba(77, 89, 74, 0.2);
    background: rgba(255, 255, 255, 0.9);
    font-size: 1.45rem;
    line-height: 1;
    color: #1f2937;
    cursor: pointer;
  }

  .tool-strip {
    display: flex;
    gap: 0.45rem;
    overflow-x: auto;
    padding: 0.7rem 1rem 0.65rem;
    border-bottom: 1px solid rgba(77, 89, 74, 0.12);
    background: rgba(245, 242, 232, 0.7);
  }

  .tool-strip::-webkit-scrollbar {
    height: 5px;
  }

  .tool-strip::-webkit-scrollbar-thumb {
    background: rgba(77, 89, 74, 0.35);
    border-radius: 999px;
  }

  .tool-pill {
    border: 1px solid rgba(77, 89, 74, 0.2);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.82);
    padding: 0.48rem 0.72rem;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    color: #1f2937;
    font-size: 0.78rem;
    white-space: nowrap;
    cursor: pointer;
  }

  .tool-pill.active {
    border-color: rgba(166, 181, 137, 0.95);
    background: rgba(166, 181, 137, 0.22);
    color: #1f2937;
  }

  .tool-pill-icon {
    font-size: 0.95rem;
  }

  .tool-body {
    overflow: auto;
    padding: 0.9rem 0.9rem 1.3rem;
    opacity: 0;
    transform: translateY(8px);
    transition: opacity 180ms ease, transform 180ms ease;
  }

  .tool-body.mounted {
    opacity: 1;
    transform: translateY(0);
  }

  .loading {
    min-height: 160px;
    display: grid;
    place-items: center;
    color: rgba(31, 41, 55, 0.7);
    font-size: 0.88rem;
  }

  .error-card {
    border: 1px solid rgba(220, 38, 38, 0.3);
    border-radius: 12px;
    padding: 0.8rem;
    background: rgba(220, 38, 38, 0.06);
  }

  .error-card p {
    margin: 0.35rem 0 0;
    line-height: 1.4;
    font-size: 0.84rem;
  }

  @keyframes toolOverlayIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @media (min-width: 900px) {
    .tool-overlay {
      place-items: center;
      padding: 1.2rem;
    }

    .tool-sheet {
      width: min(960px, calc(100vw - 3rem));
      max-height: calc(100dvh - 3rem);
      border-radius: 18px;
      border: 1px solid rgba(77, 89, 74, 0.24);
    }

    .sheet-handle {
      display: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .tool-overlay,
    .tool-body {
      animation: none;
      transition: none;
    }
  }
</style>
