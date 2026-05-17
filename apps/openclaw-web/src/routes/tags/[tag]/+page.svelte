<script lang="ts">
  import type { PageData } from './$types';

  const { data } = $props<{ data: PageData }>();
  const bucket = $derived(data.bucket);

  function formatDate(value: string): string {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
</script>

<svelte:head>
  <title>{bucket.tag} | Hogg Country</title>
  <meta name="description" content={`Trips and posts tagged ${bucket.tag}.`} />
</svelte:head>

<main class="container tag-page">
  <a href="/tags" class="back-link">← All tags</a>
  <h1>Tag: {bucket.tag}</h1>

  {#if bucket.trips.length}
    <section>
      <h2>Trips</h2>
      <ul>
        {#each bucket.trips as trip}
          <li><a href={`/trips/${trip.slug}`}>{trip.title}</a><span> — {formatDate(trip.date)}</span></li>
        {/each}
      </ul>
    </section>
  {/if}

  {#if bucket.posts.length}
    <section>
      <h2>Posts</h2>
      <ul>
        {#each bucket.posts as post}
          <li><a href={`/blog/${post.slug}`}>{post.title}</a><span> — {formatDate(post.date)}</span></li>
        {/each}
      </ul>
    </section>
  {/if}

  {#if !bucket.trips.length && !bucket.posts.length}
    <p>No entries with this tag yet.</p>
  {/if}
</main>

<style>
  .tag-page {
    max-width: 860px;
    padding-top: 2rem;
  }

  .back-link,
  a {
    color: var(--pine);
    font-weight: 800;
  }

  h1 {
    font-size: clamp(2.4rem, 5vw, 4rem);
  }

  ul {
    line-height: 1.9;
  }

  span,
  p {
    color: var(--muted);
  }
</style>
