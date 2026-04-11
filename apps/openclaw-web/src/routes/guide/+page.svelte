<script lang="ts">
  import type { PageData } from './$types';

  const { data } = $props<{ data: PageData }>();
</script>

<section class="page-intro">
  <p class="eyebrow">Dad’s guide</p>
  <h1>The full field guide stays in the new frontend too.</h1>
  <p class="lede">
    Dad’s guide is not a sidecar document. It is the public anchor and the example manual the gated OpenClaw workspace
    helps hikers build for themselves.
  </p>
</section>

<div class="stack">
  {#each data.chapters as chapter}
    <article class="card panel-copy">
      <div class="badge-row" style="margin-bottom:0.65rem;">
        <span class="badge">Part {chapter.part}</span>
        {#if chapter.quickRef}
          <span class="badge">Quick reference</span>
        {/if}
      </div>
      <h2><a href={`/guide/${chapter.slug}`}>{chapter.title}</a></h2>
      <p class="muted">{chapter.description}</p>
    </article>
  {/each}
</div>
