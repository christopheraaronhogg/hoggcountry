<script lang="ts">
  import type { PageData } from './$types';
  import YouTubeEmbed from '$components/YouTubeEmbed.svelte';

  const { data } = $props<{ data: PageData }>();
  const trip = $derived(data.trip);

  function formatDate(value: string): string {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
</script>

<svelte:head>
  <title>{trip.title} | Hogg Country</title>
  <meta name="description" content={trip.description} />
</svelte:head>

<section class="hero">
  <div class="container">
    <a href="/trips" class="back-link">← Trips</a>
    <h1>{trip.title}</h1>
    <div class="trip-date">{formatDate(trip.date)}</div>
    <div class="badges">
      {#if trip.state}<span class="badge"><strong>State</strong> {trip.state}</span>{/if}
      {#if trip.trailName}<span class="badge"><strong>Trail</strong> {trip.trailName}</span>{/if}
      {#if trip.distanceMiles}<span class="badge"><strong>Distance</strong> {trip.distanceMiles} mi</span>{/if}
      {#if trip.elevationGainFt}<span class="badge"><strong>Gain</strong> {trip.elevationGainFt} ft</span>{/if}
      {#if trip.difficulty}<span class="badge"><strong>Difficulty</strong> {trip.difficulty}</span>{/if}
      {#each trip.tags as tag}<span class="badge">#{tag}</span>{/each}
    </div>
  </div>
</section>

<section>
  <div class="container trip-detail">
    <article class="card prose-card">
      <div class="prose">
        {@html trip.html}
      </div>
    </article>

    {#if trip.gallery.length}
      <section class="card gallery-card">
        <h2>Gallery</h2>
        <div class="gallery-grid">
          {#each trip.gallery as src}
            <img {src} alt="" loading="lazy" />
          {/each}
        </div>
      </section>
    {/if}

    {#if trip.youtube.length}
      <section>
        <h2>Clips</h2>
        <div class="clip-grid">
          {#each trip.youtube as url}
            <article class="card video-card">
              <YouTubeEmbed {url} title={trip.title} />
            </article>
          {/each}
        </div>
      </section>
    {/if}
  </div>
</section>

<style>
  .hero {
    padding: 3rem 1rem 1rem;
    text-align: center;
  }

  .back-link {
    color: var(--pine);
    font-weight: 800;
    text-decoration: none;
  }

  h1 {
    margin: 0.4rem 0 0;
    font-size: clamp(2.4rem, 5vw, 4rem);
  }

  .trip-date {
    color: var(--muted);
  }

  .trip-detail {
    display: grid;
    gap: 1rem;
  }

  .prose-card,
  .gallery-card {
    padding: 1rem;
  }

  .prose {
    line-height: 1.75;
  }

  .prose :global(img),
  .gallery-grid img {
    max-width: 100%;
    border-radius: 14px;
  }

  .gallery-grid,
  .clip-grid {
    display: grid;
    gap: 1rem;
  }

  .gallery-grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  }

  .gallery-grid img {
    width: 100%;
    aspect-ratio: 4 / 3;
    object-fit: cover;
  }

  @media (min-width: 820px) {
    .clip-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
