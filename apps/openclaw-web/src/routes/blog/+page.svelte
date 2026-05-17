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
  <title>Blog | Hogg Country</title>
  <meta name="description" content="Hogg Country trail notes, planning posts, and site updates." />
</svelte:head>

<section class="hero">
  <div class="container">
    <h1>Blog</h1>
    <p>Trail notes, planning posts, and site updates.</p>
  </div>
</section>

<section>
  <div class="container post-grid">
    {#each data.posts as post}
      <article class="card post-card">
        <a href={`/blog/${post.slug}`} class="post-link">
          {#if post.coverImage}<img src={post.coverImage} alt="" loading="lazy" />{/if}
          <div class="post-copy">
            <p class="post-date">{formatDate(post.date)}</p>
            <h2>{post.title}</h2>
            <p>{post.excerpt}</p>
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
  .post-date,
  .post-copy p {
    color: var(--muted);
  }

  .post-grid {
    display: grid;
    gap: 1rem;
  }

  .post-card {
    overflow: hidden;
  }

  .post-link {
    display: grid;
    color: inherit;
    text-decoration: none;
  }

  img {
    display: block;
    width: 100%;
    aspect-ratio: 16 / 9;
    object-fit: cover;
  }

  .post-copy {
    padding: 1rem;
  }

  h2 {
    margin: 0;
    line-height: 1.1;
  }

  @media (min-width: 760px) {
    .post-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
