<script lang="ts">
  import type { PageData } from './$types';
  import YouTubeEmbed from '$components/YouTubeEmbed.svelte';
  import YouTubeThumbnail from '$components/YouTubeThumbnail.svelte';

  const { data } = $props<{ data: PageData }>();
  const channelUrl = 'https://www.youtube.com/@hoggcountry7483';
  const featuredVideo = $derived(data.videos[0] ?? null);
  const libraryVideos = $derived(featuredVideo ? data.videos.slice(1) : data.videos);
  const longFormVideos = $derived(libraryVideos.filter((video: PageData['videos'][number]) => !isShort(video)));
  const shortVideos = $derived(libraryVideos.filter((video: PageData['videos'][number]) => isShort(video)));

  function isShort(video: PageData['videos'][number]) {
    return video.kind === 'short' || video.link.includes('/shorts/');
  }

  function formatDate(value: string): string {
    if (!value) return 'Recent upload';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return 'Recent upload';
    return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function clipText(value: string, max = 160): string {
    const cleaned = String(value || '').replace(/\s+/g, ' ').trim();
    if (!cleaned) return '';
    return cleaned.length <= max ? cleaned : `${cleaned.slice(0, max).trimEnd()}...`;
  }
</script>

<svelte:head>
  <title>Videos | Hogg Country</title>
  <meta name="description" content="Trail dispatches, Shorts, daily Appalachian Trail updates, and latest uploads from Hogg Country." />
</svelte:head>

<section class="videos-hero">
  <div class="container">
    <div class="videos-hero__copy">
      <div class="videos-hero__topline">
        <p class="eyebrow">Videos</p>
        <p class="videos-status">{data.videos.length ? `${data.videos.length} recent uploads` : 'Feed temporarily unavailable'}</p>
      </div>
      <h1>Hogg Country on the Appalachian Trail.</h1>
      <p class="lede">Latest trail videos and Shorts, newest first.</p>
      <div class="videos-hero__actions">
        {#if featuredVideo}<a href={`#video-${featuredVideo.id}`} class="hero-button hero-button--primary">Latest upload</a>{/if}
        <a href={channelUrl} target="_blank" rel="noopener noreferrer" class="hero-button hero-button--secondary">YouTube channel</a>
      </div>
    </div>
  </div>
</section>

{#if featuredVideo}
  <section class="featured-section">
    <div class="container">
      <div class="section-heading">
        <p class="section-kicker">Latest upload</p>
        <h2>Fresh from the trail.</h2>
      </div>

      <article id={`video-${featuredVideo.id}`} class="featured-card" class:is-short={isShort(featuredVideo)}>
        <div class="featured-card__frame">
          <YouTubeEmbed id={featuredVideo.id} title={featuredVideo.title} aspect={isShort(featuredVideo) ? '9-16' : '16-9'} />
        </div>
        <div class="featured-card__copy">
          <p class="featured-meta">{isShort(featuredVideo) ? 'YouTube Short' : 'YouTube Video'} • {formatDate(featuredVideo.published)}</p>
          <h3>{featuredVideo.title}</h3>
          {#if clipText(featuredVideo.description, 280)}
            <p class="featured-description">{clipText(featuredVideo.description, 280)}</p>
          {/if}
          <div class="featured-actions">
            <a class="featured-link" href={featuredVideo.link} target="_blank" rel="noopener noreferrer">Watch on YouTube</a>
            <a class="featured-link featured-link--ghost" href="#recent-videos">Jump to recent videos</a>
          </div>
        </div>
      </article>
    </div>
  </section>
{/if}

{#if longFormVideos.length}
  <section class="library-section" id="recent-videos">
    <div class="container">
      <div class="section-heading">
        <p class="section-kicker">Trail videos</p>
        <h2>The long way, documented.</h2>
      </div>

      <div class="videos-grid">
        {#each longFormVideos as video (video.id)}
          <article class="video-card">
            <a class="video-card__media" href={video.link} target="_blank" rel="noopener noreferrer" aria-label={`Watch ${video.title} on YouTube`}>
              <YouTubeThumbnail id={video.id} alt={video.title} provided={video.thumbnail} />
              <span class="video-card__play">▶ Watch</span>
            </a>
            <div class="video-card__copy">
              <p class="video-card__meta">{formatDate(video.published)}</p>
              <h3>{video.title}</h3>
              {#if clipText(video.description, 110)}<p>{clipText(video.description, 110)}</p>{/if}
            </div>
          </article>
        {/each}
      </div>
    </div>
  </section>
{/if}

{#if shortVideos.length}
  <section class="library-section shorts-section">
    <div class="container">
      <div class="section-heading">
        <p class="section-kicker">Shorts</p>
        <h2>Quick hits from the trail.</h2>
      </div>

      <ul class="shorts-strip">
        {#each shortVideos as video (video.id)}
          <li class="short-card-item">
            <a
              class="short-card"
              href={video.link}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Watch ${video.title} on YouTube`}
            >
              <span class="short-card__media">
                <YouTubeThumbnail id={video.id} alt={video.title} provided={video.thumbnail} portrait />
                <span class="short-card__badge">Short</span>
              </span>
              <span class="short-card__title">{video.title}</span>
              <span class="short-card__date">{formatDate(video.published)}</span>
            </a>
          </li>
        {/each}
      </ul>
    </div>
  </section>
{/if}

<style>
  .videos-hero {
    padding: 2.2rem 0 1rem;
  }

  .videos-hero__copy {
    max-width: 760px;
  }

  .videos-hero__topline,
  .videos-hero__actions,
  .featured-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
  }

  .videos-status {
    color: var(--muted);
    font-weight: 800;
  }

  h1 {
    max-width: 12ch;
    margin: 0;
    font-size: clamp(3rem, 8vw, 6.4rem);
    line-height: 0.92;
  }

  .lede {
    max-width: 48ch;
    color: var(--muted);
    font-size: 1.15rem;
  }

  .hero-button,
  .featured-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 46px;
    padding: 0.75rem 1rem;
    border-radius: 999px;
    font-weight: 900;
    text-decoration: none;
  }

  .hero-button--primary,
  .featured-link {
    background: var(--marker);
    color: #2b2f26;
  }

  .hero-button--secondary,
  .featured-link--ghost {
    border: 1px solid rgba(48, 65, 54, 0.14);
    background: rgba(255, 255, 255, 0.78);
    color: var(--pine);
  }

  .featured-section,
  .library-section {
    padding: 1rem 0 2rem;
  }

  .section-heading {
    margin-bottom: 1rem;
  }

  .section-kicker,
  .featured-meta,
  .video-card__meta {
    margin: 0 0 0.35rem;
    color: var(--terra);
    font-size: 0.76rem;
    font-weight: 900;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .section-heading h2 {
    margin: 0;
    font-size: clamp(1.8rem, 4vw, 3rem);
  }

  .featured-card,
  .video-card {
    overflow: hidden;
    border: 1px solid rgba(48, 65, 54, 0.12);
    border-radius: 28px;
    background: rgba(255, 255, 255, 0.86);
    box-shadow: 0 22px 50px rgba(60, 44, 25, 0.08);
  }

  .featured-card {
    display: grid;
    gap: 0;
  }

  .featured-card__frame {
    background: #111827;
  }

  .featured-card__copy,
  .video-card__copy {
    padding: 1rem;
  }

  .featured-card h3,
  .video-card h3 {
    margin: 0;
    color: var(--ink);
    line-height: 1.1;
  }

  .featured-description,
  .video-card p {
    color: var(--muted);
    line-height: 1.6;
  }

  .videos-grid {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
  }

  .video-card__media {
    position: relative;
    display: block;
    overflow: hidden;
    color: white;
    background: #111827;
    text-decoration: none;
  }

  .video-card__media :global(img) {
    display: block;
    width: 100%;
    aspect-ratio: 16 / 9;
    object-fit: cover;
  }

  .video-card h3,
  .video-card p {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
  }

  .shorts-strip {
    display: flex;
    gap: 0.85rem;
    margin: 0;
    overflow-x: auto;
    padding-bottom: 0.75rem;
    list-style: none;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
  }

  .short-card-item {
    flex: 0 0 168px;
    scroll-snap-align: start;
  }

  .short-card {
    display: grid;
    gap: 0.4rem;
    text-decoration: none;
  }

  .short-card__media {
    position: relative;
    display: block;
    overflow: hidden;
    border: 1px solid rgba(48, 65, 54, 0.12);
    border-radius: 18px;
    background: #111827;
  }

  .short-card__media :global(img) {
    display: block;
    width: 100%;
    aspect-ratio: 9 / 16;
    object-fit: cover;
  }

  .short-card__badge {
    position: absolute;
    top: 0.55rem;
    left: 0.55rem;
    border-radius: 999px;
    padding: 0.25rem 0.55rem;
    background: rgba(17, 24, 39, 0.72);
    color: white;
    font-size: 0.68rem;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .short-card__title {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
    color: var(--ink);
    font-weight: 800;
    line-height: 1.25;
  }

  .short-card__date {
    color: var(--muted);
    font-size: 0.82rem;
    font-weight: 700;
  }

  .video-card__play {
    position: absolute;
    border-radius: 999px;
    background: rgba(17, 24, 39, 0.72);
    color: white;
    font-weight: 900;
  }

  .video-card__play {
    right: 0.75rem;
    bottom: 0.75rem;
    padding: 0.45rem 0.7rem;
  }

  @media (min-width: 820px) {
    .featured-card {
      grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr);
    }

    .featured-card.is-short {
      grid-template-columns: minmax(280px, 0.5fr) minmax(0, 1fr);
    }


  }
</style>
