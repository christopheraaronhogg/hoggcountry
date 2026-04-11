<script lang="ts">
  import type { PageData } from './$types';

  const { data } = $props<{ data: PageData }>();
</script>

<section class="card hero-panel">
  <div>
    <p class="eyebrow">Hogg Country beta</p>
    <h1>Dad updates on the front porch. OpenClaw for hikers behind the gate.</h1>
    <p class="lede">
      This new frontend keeps Dad’s field guide and dispatches public, then turns that same operating manual
      philosophy into a gated hiker workspace where people build their own manual from real trail documents.
    </p>
    <div class="subtle-actions">
      <a class="btn btn-primary" href="/signup">Join the beta</a>
      <a class="btn btn-ghost" href="/guide">Read Dad’s guide</a>
    </div>
  </div>

  <div class="stack">
    {#each data.dadCards as card}
      <article class="card card-soft panel-copy">
        <p class="eyebrow">{card.title}</p>
        <strong style="font-family: Oswald, sans-serif; font-size: 1.9rem; color: var(--pine);">{card.value}</strong>
        <p class="meta-line">{card.detail}</p>
      </article>
    {/each}
  </div>
</section>

<section class="split-copy" style="margin-top:1rem;">
  <article class="card panel-copy">
    <p class="eyebrow">Dad updates</p>
    <h2>Track the hike, watch the dispatches, stay close to the real trail.</h2>
    <p class="lede">
      The public half of the product stays grounded in Dad’s actual hike: a live map surface, the YouTube feed,
      and the full field guide that future hikers can read before they ever sign up.
    </p>
    <div class="subtle-actions">
      <a class="btn btn-secondary" href="/dad/map">Open map</a>
      <a class="btn btn-ghost" href="/dad/videos">Watch dispatches</a>
    </div>
  </article>

  <article class="card panel-copy">
    <p class="eyebrow">OpenClaw for hikers</p>
    <h2>Sell the workspace through the manual, not through vague AI promises.</h2>
    <ul class="list-clean">
      <li>Use Dad’s guide as the example of what a durable personal field manual can become.</li>
      <li>Let hikers upload the source docs they legally own and keep them beside the manual.</li>
      <li>Keep the gated product focused on maintaining the manual, not generic chat.</li>
    </ul>
    <div class="subtle-actions">
      <a class="btn btn-primary" href="/openclaw">See how it works</a>
      <a class="btn btn-ghost" href="/app">Open beta app</a>
    </div>
  </article>
</section>

<section style="margin-top:1rem;">
  <div class="page-intro">
    <p class="eyebrow">Latest dispatches</p>
    <h2>Fresh trail notes from the YouTube feed</h2>
  </div>

  <div class="grid-three">
    {#if data.videos.length === 0}
      <article class="card empty-state">
        <h3>Feed unavailable in this preview.</h3>
        <p class="muted">The runtime fetchers are wired. If the feed is unavailable during build, this section fills back in once the app can reach YouTube.</p>
      </article>
    {:else}
      {#each data.videos as video}
        <article class="card">
          <a href={video.link} target="_blank" rel="noreferrer" style="display:block; text-decoration:none;">
            <img
              src={video.thumbnail}
              alt={video.title}
              style="display:block; width:100%; aspect-ratio:16 / 9; object-fit:cover; border-radius:20px 20px 0 0;"
            />
          </a>
          <div class="panel-copy">
            <p class="eyebrow">Dispatch</p>
            <h3>{video.title}</h3>
            <p class="meta-line">{new Date(video.published).toLocaleDateString()}</p>
            <p class="muted">{video.description.slice(0, 140)}{video.description.length > 140 ? '...' : ''}</p>
          </div>
        </article>
      {/each}
    {/if}
  </div>
</section>

<section style="margin-top:1rem;">
  <div class="page-intro">
    <p class="eyebrow">Guide preview</p>
    <h2>Dad’s guide stays the canonical example manual</h2>
  </div>

  <div class="grid-two">
    {#each data.guidePreview as chapter}
      <article class="card panel-copy">
        <p class="eyebrow">Part {chapter.part}</p>
        <h3><a href={`/guide/${chapter.slug}`}>{chapter.title}</a></h3>
        <p class="muted">{chapter.description}</p>
      </article>
    {/each}
  </div>
</section>
