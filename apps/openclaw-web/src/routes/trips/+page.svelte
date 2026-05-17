<script lang="ts">
  import type { PageData } from './$types';

  const { data } = $props<{ data: PageData }>();

  function formatDate(value: string): string {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
</script>

<svelte:head>
  <title>Trips | Hogg Country</title>
  <meta name="description" content="Hikes and adventures across Arkansas, Colorado, and beyond." />
</svelte:head>

<section class="hero">
  <div class="container">
    <h1>Trips</h1>
    <p>Hikes and adventures — Arkansas, Colorado, and beyond.</p>
  </div>
</section>

<section>
  <div class="container trip-grid">
    {#each data.trips as trip}
      <article class="card trip-card">
        <a href={`/trips/${trip.slug}`} class="trip-link">
          {#if trip.coverImage}
            <img src={trip.coverImage} alt="" loading="lazy" />
          {/if}
          <div class="trip-copy">
            <h2>{trip.title}</h2>
            <div class="trip-date">{formatDate(trip.date)}</div>
            <div class="badges">
              {#if trip.state}<span class="badge"><strong>State</strong> {trip.state}</span>{/if}
              {#if trip.distanceMiles}<span class="badge"><strong>Distance</strong> {trip.distanceMiles} mi</span>{/if}
              {#if trip.elevationGainFt}<span class="badge"><strong>Gain</strong> {trip.elevationGainFt} ft</span>{/if}
              {#if trip.difficulty}<span class="badge"><strong>Difficulty</strong> {trip.difficulty}</span>{/if}
              {#if trip.tags[0]}<span class="badge">#{trip.tags[0]}</span>{/if}
            </div>
          </div>
        </a>
      </article>
    {/each}
  </div>
</section>

<style>
  .hero {
    padding: 3rem 1rem 2rem;
    text-align: center;
  }

  .hero h1 {
    margin: 0;
    font-size: clamp(2.4rem, 5vw, 4rem);
  }

  .hero p,
  .trip-date {
    color: var(--muted);
  }

  .trip-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1rem;
  }

  .trip-card {
    overflow: hidden;
  }

  .trip-link {
    display: block;
    color: inherit;
    text-decoration: none;
  }

  img {
    display: block;
    width: 100%;
    aspect-ratio: 16 / 9;
    object-fit: cover;
  }

  .trip-copy {
    padding: 1rem;
  }

  h2 {
    margin: 0;
    line-height: 1.1;
  }
</style>
