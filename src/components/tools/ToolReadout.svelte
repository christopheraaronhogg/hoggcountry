<script lang="ts">
  // Compact "honest readout" used at the top of a tool: one headline answer,
  // a few supporting metrics, and a named assumption/source line. Token-only;
  // safe to import from both the Astro and SvelteKit trees (no $app/* imports).
  type Metric = { k: string; v: string | number; s?: string | number };

  interface Props {
    label?: string;
    value?: string | number | null;
    unit?: string;
    metrics?: Metric[];
    assumption?: string;
    tone?: 'neutral' | 'ok' | 'warn';
  }

  let {
    label = '',
    value = null,
    unit = '',
    metrics = [],
    assumption = '',
    tone = 'neutral',
  }: Props = $props();

  let hasHeadline = $derived(value !== null && value !== '');
</script>

<div class="readout" data-tone={tone}>
  {#if hasHeadline}
    <div class="readout-headline">
      {#if label}<p class="readout-eyebrow">{label}</p>{/if}
      <p class="readout-value">
        <span class="num">{value}</span>{#if unit}<span class="unit">{unit}</span>{/if}
      </p>
    </div>
  {/if}

  {#if metrics.length}
    <div class="readout-metrics">
      {#each metrics as m (m.k)}
        <div class="metric">
          <p class="metric-k">{m.k}</p>
          <p class="metric-v">{m.v}</p>
          {#if m.s !== undefined && m.s !== ''}<p class="metric-s">{m.s}</p>{/if}
        </div>
      {/each}
    </div>
  {/if}

  {#if assumption}
    <p class="readout-assumption">{assumption}</p>
  {/if}
</div>

<style>
  .readout {
    display: grid;
    gap: 0.85rem;
    padding: clamp(0.95rem, 3vw, 1.2rem);
    border: 1px solid color-mix(in srgb, var(--pine) 14%, transparent);
    border-radius: 14px;
    background:
      linear-gradient(135deg, color-mix(in srgb, var(--card) 90%, transparent), color-mix(in srgb, var(--card) 72%, transparent)),
      color-mix(in srgb, var(--bg) 72%, transparent);
    box-shadow: 0 16px 44px color-mix(in srgb, var(--pine) 8%, transparent);
  }

  .readout-eyebrow {
    margin: 0;
    color: color-mix(in srgb, var(--pine) 68%, transparent);
    font-family: Oswald, sans-serif;
    font-size: 0.7rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .readout-value {
    margin: 0.2rem 0 0;
    display: flex;
    align-items: baseline;
    gap: 0.35rem;
    color: var(--pine);
    line-height: 1;
  }

  .readout-value .num {
    font-family: Oswald, sans-serif;
    font-weight: 800;
    font-size: clamp(2.1rem, 6vw, 2.6rem);
    letter-spacing: 0.01em;
  }

  .readout-value .unit {
    font-family: Oswald, sans-serif;
    font-weight: 700;
    font-size: 1rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: color-mix(in srgb, var(--pine) 70%, transparent);
  }

  .readout[data-tone='warn'] .readout-value .num { color: var(--terra); }

  .readout-metrics {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(6.5rem, 1fr));
    gap: 0.6rem 0.85rem;
  }

  .metric {
    min-width: 0;
  }

  .metric-k {
    margin: 0;
    color: var(--muted-accessible);
    font-family: Oswald, sans-serif;
    font-size: 0.64rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .metric-v {
    margin: 0.15rem 0 0;
    color: var(--ink);
    font-family: Oswald, sans-serif;
    font-size: 1.15rem;
    font-weight: 800;
    line-height: 1.1;
  }

  .metric-s {
    margin: 0.1rem 0 0;
    color: var(--muted-accessible);
    font-size: 0.74rem;
    line-height: 1.25;
  }

  .readout-assumption {
    margin: 0;
    padding-left: 0.7rem;
    border-left: 3px solid color-mix(in srgb, var(--pine) 18%, transparent);
    color: var(--muted-accessible);
    font-size: 0.8rem;
    line-height: 1.4;
  }

  .readout[data-tone='ok'] .readout-assumption {
    border-left-color: var(--alpine);
  }

  .readout[data-tone='warn'] .readout-assumption {
    border-left-color: var(--terra);
  }
</style>
