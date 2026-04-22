<script lang="ts">
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
  {#each SCOUT_LAB_VARIANTS as variant}
    <a class="card panel-copy" href={`/app/scout-lab/${variant.id}`}>
      <p class="eyebrow">{variant.eyebrow}</p>
      <h2>{variant.name}</h2>
      <p class="muted">{variant.summary}</p>
    </a>
  {/each}
</section>
