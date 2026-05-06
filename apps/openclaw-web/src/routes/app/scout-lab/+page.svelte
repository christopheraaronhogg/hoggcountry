<script lang="ts">
  import { resolve } from '$app/paths';
  import { SCOUT_LAB_VARIANTS } from '$lib/scout-lab';
</script>

<section class="card hero-panel">
  <div>
    <p class="eyebrow">Scout lab</p>
    <h1>Four single-page control panels for Scout and the docs locker.</h1>
    <p class="lede">
      Same workspace, same connected Scout, four different ways to hold the conversation and documents together on one page.
    </p>
  </div>
</section>

<section class="stack" style="margin-top:1rem;">
  <a class="card panel-copy" href={resolve('/app/scout-lab/reliability')}>
    <p class="eyebrow">QA console</p>
    <h2>Reliability Results</h2>
    <p class="muted">Inspect Scout AT planning scenarios, deterministic checks, raw run artifacts, patch notes, and run-to-run changes.</p>
  </a>

  {#each SCOUT_LAB_VARIANTS as variant (variant.id)}
    <a class="card panel-copy" href={resolve('/app/scout-lab/[variant]', { variant: variant.id })}>
      <p class="eyebrow">{variant.eyebrow}</p>
      <h2>{variant.name}</h2>
      <p class="muted">{variant.summary}</p>
    </a>
  {/each}
</section>
