<script lang="ts">
  import YouTubeThumbnail from './YouTubeThumbnail.svelte';

  interface Props {
    id?: string;
    url?: string;
    title: string;
    aspect?: '16-9' | '9-16';
  }

  const { id = '', url = '', title, aspect } = $props<Props>();
  let playing = $state(false);

  function parseVideoId(inputUrl: string, fallback: string): { id: string; isShort: boolean } {
    if (!inputUrl) return { id: fallback, isShort: aspect === '9-16' };
    try {
      const parsed = new URL(inputUrl);
      if (parsed.hostname === 'youtu.be') return { id: parsed.pathname.replace(/^\/+/u, ''), isShort: false };
      if (parsed.pathname.startsWith('/shorts/')) {
        return { id: parsed.pathname.split('/').filter(Boolean)[1] ?? '', isShort: true };
      }
      return { id: parsed.searchParams.get('v') ?? fallback, isShort: false };
    } catch {
      const shortMatch = inputUrl.match(/\/shorts\/([^/?#]+)/iu);
      if (shortMatch?.[1]) return { id: shortMatch[1], isShort: true };
      const watchMatch = inputUrl.match(/[?&]v=([^&#]+)/iu);
      return { id: watchMatch?.[1] ?? fallback, isShort: aspect === '9-16' };
    }
  }

  const parsed = $derived(parseVideoId(url, id));
  const videoId = $derived(parsed.id);
  const isShort = $derived(parsed.isShort || aspect === '9-16');
  const embedUrl = $derived(`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1`);
</script>

{#if videoId}
  <div class="yt-outer" class:shorts={isShort}>
    {#if playing}
      <iframe
        src={embedUrl}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen
      ></iframe>
    {:else}
      <button class="yt-thumb" type="button" aria-label={`Play video: ${title}`} onclick={() => (playing = true)}>
        <YouTubeThumbnail id={videoId} alt={title} portrait={isShort} />
        <span class="yt-play" aria-hidden="true">▶</span>
      </button>
    {/if}
  </div>
{:else}
  <div class="invalid-video">Invalid YouTube video</div>
{/if}

<style>
  .yt-outer {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    background: #000;
    border-radius: inherit;
  }

  .yt-outer.shorts {
    aspect-ratio: 9 / 16;
  }

  .yt-outer > :global(*) {
    position: absolute;
    inset: 0;
  }

  iframe,
  .yt-thumb {
    width: 100%;
    height: 100%;
    border: 0;
  }

  .yt-thumb {
    padding: 0;
    background: #000;
    cursor: pointer;
  }

  .yt-thumb :global(img) {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
  }

  .yt-play {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    color: #fff;
    font-size: 3rem;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.6);
  }

  .invalid-video {
    padding: 1rem;
    color: var(--muted);
  }
</style>
