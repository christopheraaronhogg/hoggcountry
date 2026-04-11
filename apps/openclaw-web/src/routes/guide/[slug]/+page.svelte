<script lang="ts">
  import type { PageData } from './$types';

  const { data } = $props<{ data: PageData }>();
</script>

<article class="card panel-copy" style="padding:1.5rem;">
  <p class="eyebrow">Dad’s guide</p>
  <h1>{data.entry.title}</h1>
  <p class="lede">{data.entry.description}</p>

  <div class="badge-row" style="margin:1rem 0 1.4rem;">
    <span class="badge">Part {data.entry.part}</span>
    <a class="btn btn-ghost" href="/guide">All chapters</a>
  </div>

  <div class="guide-prose">
    {@html data.entry.html}
  </div>
</article>

<style>
  .guide-prose :global(h2),
  .guide-prose :global(h3) {
    margin-top: 1.6rem;
    margin-bottom: 0.55rem;
    color: var(--pine);
  }

  .guide-prose :global(p),
  .guide-prose :global(li) {
    line-height: 1.85;
    color: var(--fg);
  }

  .guide-prose :global(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 1rem 0;
  }

  .guide-prose :global(th),
  .guide-prose :global(td) {
    padding: 0.55rem;
    border-bottom: 1px solid var(--border);
    text-align: left;
  }
</style>
