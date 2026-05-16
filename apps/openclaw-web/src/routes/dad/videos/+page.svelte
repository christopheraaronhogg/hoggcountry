<script lang="ts">
  import type { PageData } from './$types';

  const { data } = $props<{ data: PageData }>();

  function isShort(video: PageData['videos'][number]) {
    return video.kind === 'short' || video.link.includes('/shorts/');
  }
</script>

<section class="page-intro">
  <p class="eyebrow">Dad videos</p>
  <h1>The YouTube dispatch feed stays right here in the new frontend.</h1>
  <p class="lede">
    This is part of the public promise: actual trail updates and actual documentation stay out front while the gated
    product handles the personal manual work.
  </p>
</section>

<div class="grid-three">
  {#if data.videos.length === 0}
    <article class="card empty-state">
      <h2>Feed unavailable in this build preview</h2>
      <p class="muted">The runtime fetcher is wired and will populate this page once the app can reach YouTube.</p>
    </article>
  {:else}
    {#each data.videos as video}
      <article class="card">
        <a href={video.link} target="_blank" rel="noreferrer" style="display:block; text-decoration:none;">
          <img
            src={isShort(video) ? `https://i.ytimg.com/vi/${video.id}/oardefault.jpg` : video.thumbnail}
            alt={video.title}
            style={`display:block; width:100%; aspect-ratio:${isShort(video) ? '9 / 16' : '16 / 9'}; object-fit:cover; border-radius:20px 20px 0 0;`}
          />
        </a>
        <div class="panel-copy">
          <p class="eyebrow">{new Date(video.published).toLocaleDateString()}</p>
          <h3>{video.title}</h3>
          <p class="muted">{video.description.slice(0, 150)}{video.description.length > 150 ? '...' : ''}</p>
          <a class="btn btn-ghost" href={video.link} target="_blank" rel="noreferrer">{isShort(video) ? 'Watch Short on YouTube' : 'Watch on YouTube'}</a>
        </div>
      </article>
    {/each}
  {/if}
</div>
