<script lang="ts">
  import { onMount } from 'svelte';

  interface TrailUpdate {
    id?: string;
    title?: string;
    body?: string;
    sourceLabel?: string;
    sourceType?: string;
    mediaType?: string;
    mediaUrl?: string;
    previewUrl?: string;
    thumbnailUrl?: string;
    externalUrl?: string;
    publishedAt?: string;
    createdAt?: string;
    location?: string;
    trailMile?: string | number;
  }

  interface Props {
    apiBase: string;
    limit?: number;
    compact?: boolean;
    showHeader?: boolean;
  }

  const { apiBase, limit = 12, compact = false, showHeader = true } = $props<Props>();
  let updates = $state<TrailUpdate[]>([]);
  let stateMessage = $state('Loading trail updates...');

  onMount(() => {
    void loadUpdates();
  });

  async function loadUpdates() {
    try {
      const response = await fetch(`${apiBase.replace(/\/+$/u, '')}/trail-updates?limit=${limit}`);
      if (!response.ok) throw new Error('Could not load updates');
      const payload = await response.json();
      updates = Array.isArray(payload?.data?.updates)
        ? payload.data.updates
        : Array.isArray(payload?.updates)
          ? payload.updates
          : [];
      stateMessage = updates.length ? '' : 'No trail updates posted yet. Check back soon.';
    } catch {
      stateMessage = 'Trail updates are temporarily unavailable.';
    }
  }

  function formatDate(value: string | undefined): string {
    if (!value) return 'Trail update';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Trail update';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function originalMediaUrl(update: TrailUpdate): string {
    return update.mediaUrl || update.previewUrl || update.thumbnailUrl || '';
  }

  function youtubeId(update: TrailUpdate): string {
    const externalUrl = String(update.externalUrl || '');
    const thumbnailUrl = String(update.thumbnailUrl || update.mediaUrl || '');
    const shortMatch = externalUrl.match(/\/shorts\/([^/?#]+)/iu);
    if (shortMatch?.[1]) return shortMatch[1];
    const videoMatch = externalUrl.match(/[?&]v=([^&#]+)/iu);
    if (videoMatch?.[1]) return videoMatch[1];
    const thumbMatch = thumbnailUrl.match(/\/vi\/([^/]+)\//iu);
    return thumbMatch?.[1] || '';
  }

  function thumbnailMediaUrl(update: TrailUpdate): string {
    const id = youtubeId(update);
    if (update.sourceType === 'youtube_short' && id) return `https://i.ytimg.com/vi/${encodeURIComponent(id)}/oardefault.jpg`;
    if (update.sourceType === 'youtube_video' && id) return `https://img.youtube.com/vi/${encodeURIComponent(id)}/hqdefault.jpg`;
    return update.thumbnailUrl || update.previewUrl || originalMediaUrl(update);
  }

  function metaBits(update: TrailUpdate): string[] {
    const bits = [formatDate(update.publishedAt || update.createdAt)];
    if (update.sourceLabel) bits.unshift(update.sourceLabel);
    if (update.location) bits.push(update.location);
    if (update.trailMile) bits.push(`Mile ${update.trailMile}`);
    return bits;
  }
</script>

<section class="trail-updates-widget" class:is-compact={compact}>
  {#if showHeader}
    <div class="updates-head">
      <div>
        <p class="eyebrow">Latest From The Trail</p>
        <h2>Trail updates for folks not on Facebook.</h2>
      </div>
      <a href="/updates" class="updates-link">View all updates</a>
    </div>
  {/if}

  {#if stateMessage}
    <div class="updates-state">{stateMessage}</div>
  {/if}

  {#if updates.length}
    <div class="updates-grid">
      {#each updates as update}
        <article class="update-card" class:is-youtube-short={update.sourceType === 'youtube_short'}>
          {#if originalMediaUrl(update)}
            {#if String(update.mediaType || '').startsWith('video/') && (!thumbnailMediaUrl(update) || thumbnailMediaUrl(update) === originalMediaUrl(update))}
              <video
                class="update-media"
                class:update-media--short={update.sourceType === 'youtube_short'}
                src={originalMediaUrl(update)}
                controls
                playsinline
                preload="metadata"
              >
                <track kind="captions" />
              </video>
            {:else}
              <img
                class="update-media"
                class:update-media--short={update.sourceType === 'youtube_short'}
                src={thumbnailMediaUrl(update) || originalMediaUrl(update)}
                alt={update.title || update.body || 'Hogg Country trail update'}
                loading="lazy"
              />
            {/if}
          {/if}

          <div class="update-copy">
            <div class="update-meta">
              {#each metaBits(update) as bit, index}
                {#if index > 0}<span>•</span>{/if}
                <span>{bit}</span>
              {/each}
            </div>
            <h3>{update.title || 'Trail update'}</h3>
            {#if update.body}<p>{update.body}</p>{/if}
            {#if update.externalUrl}
              <a class="update-action" href={update.externalUrl} target="_blank" rel="noopener noreferrer">
                {update.sourceType === 'youtube_short' ? 'Watch Short on YouTube' : update.sourceType === 'youtube_video' ? 'Watch on YouTube' : 'Open update'}
              </a>
            {/if}
          </div>
        </article>
      {/each}
    </div>
  {/if}
</section>

<style>
  .trail-updates-widget {
    margin-block: 2rem;
  }

  .updates-head {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .updates-head h2 {
    max-width: 12ch;
    margin: 0;
    font-size: clamp(2rem, 4vw, 3.4rem);
    line-height: 1.05;
  }

  .updates-link,
  .update-action {
    color: var(--pine);
    font-weight: 800;
    text-decoration: none;
  }

  .updates-link {
    display: inline-flex;
    min-height: 44px;
    align-items: center;
    justify-content: center;
    padding: 0.75rem 1rem;
    border: 1px solid rgba(48, 65, 54, 0.14);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.78);
  }

  .updates-state {
    padding: 1rem;
    border: 1px dashed rgba(48, 65, 54, 0.24);
    border-radius: 22px;
    background: rgba(255, 255, 255, 0.58);
    color: var(--muted);
  }

  .updates-grid {
    display: grid;
    align-items: start;
    gap: 1rem;
  }

  .update-card {
    overflow: hidden;
    border: 1px solid rgba(48, 65, 54, 0.12);
    border-radius: 28px;
    background: rgba(255, 255, 255, 0.86);
    box-shadow: 0 22px 50px rgba(60, 44, 25, 0.08);
  }

  .update-media {
    display: block;
    width: 100%;
    aspect-ratio: 4 / 3;
    object-fit: cover;
    background: linear-gradient(135deg, rgba(166, 181, 137, 0.22), rgba(240, 224, 0, 0.12));
  }

  .update-media--short {
    aspect-ratio: 9 / 16;
    height: auto;
    min-height: 0;
    object-position: center;
  }

  video.update-media {
    background: #111827;
  }

  .update-copy {
    padding: 1rem;
  }

  .update-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-bottom: 0.65rem;
    color: var(--terra);
    font-size: 0.78rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .update-card h3 {
    margin: 0;
    color: var(--ink);
    font-size: 1.35rem;
    line-height: 1.1;
  }

  .update-card p {
    color: var(--muted);
    line-height: 1.65;
    white-space: pre-wrap;
  }

  .update-action {
    display: inline-flex;
    margin-top: 0.2rem;
  }

  @media (min-width: 760px) {
    .updates-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
</style>
