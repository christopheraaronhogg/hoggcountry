<script lang="ts">
  import { DAD_HIKE_FINISH_LABEL, DAD_HIKE_COMPLETION_LABEL } from '$lib/dad-hike';
  import PublicMap from '$components/PublicMap.svelte';
  import type { PageData } from './$types';

  const { data } = $props<{ data: PageData }>();

  function isShort(video: PageData['videos'][number]) {
    return video.kind === 'short' || video.link.includes('/shorts/');
  }
</script>

<section class="card hero-panel">
  <div>
    <p class="eyebrow">Dad updates</p>
    <h1>Dad finished the Appalachian Trail — {DAD_HIKE_COMPLETION_LABEL}.</h1>
    <p>Springer to Katahdin · Completed {DAD_HIKE_FINISH_LABEL}.</p>
    <p class="lede">
      This public layer keeps the project human. The map, the videos, and the guide all stay visible so the gated
      product never floats away from the actual trail.
    </p>
    <div class="subtle-actions">
      <a class="btn btn-secondary" href="/dad/map">Open map</a>
      <a class="btn btn-ghost" href="/dad/videos">Watch all videos</a>
    </div>
  </div>

  <div class="stats-grid">
    {#each data.cards as card}
      <article class="card panel-copy">
        <p class="eyebrow">{card.title}</p>
        <strong>{card.value}</strong>
        <p class="meta-line">{card.detail}</p>
      </article>
    {/each}
  </div>
</section>

<section class="grid-two" style="margin-top:1rem;">
  <PublicMap featureCollection={data.track} title="Dad location preview" />

  <article class="card panel-copy">
    <p class="eyebrow">Video feed</p>
    <h2>Dispatches keep the trail honest.</h2>
    {#if data.videos.length === 0}
      <p class="muted">The feed is wired but unavailable in this build preview.</p>
    {:else}
      <div class="stack">
        {#each data.videos.slice(0, 3) as video}
          <a href={video.link} target="_blank" rel="noreferrer" style="display:grid; gap:0.55rem; text-decoration:none;">
            <img
              src={isShort(video) ? `https://i.ytimg.com/vi/${video.id}/oardefault.jpg` : video.thumbnail}
              alt={video.title}
              style={`width:100%; aspect-ratio:${isShort(video) ? '9 / 16' : '16 / 9'}; object-fit:cover; border-radius:16px;`}
            />
            <strong style="color:var(--pine);">{video.title}</strong>
          </a>
        {/each}
      </div>
    {/if}
  </article>
</section>
