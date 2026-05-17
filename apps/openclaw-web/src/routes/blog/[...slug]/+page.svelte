<script lang="ts">
  import type { PageData } from './$types';

  const { data } = $props<{ data: PageData }>();
  const post = $derived(data.post);

  function formatDate(value: string): string {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
</script>

<svelte:head>
  <title>{post.title} | Hogg Country</title>
  <meta name="description" content={post.description} />
</svelte:head>

<article class="container blog-post">
  <a href="/blog" class="back-link">← Blog</a>
  <header>
    <p class="post-date">{formatDate(post.date)}</p>
    <h1>{post.title}</h1>
    <p>{post.description}</p>
  </header>
  <div class="card prose-card">
    <div class="prose">
      {@html post.html}
    </div>
  </div>
</article>

<style>
  .blog-post {
    max-width: 780px;
    padding-top: 2rem;
  }

  .back-link {
    color: var(--pine);
    font-weight: 800;
    text-decoration: none;
  }

  header {
    padding: 1.4rem 0;
  }

  .post-date {
    color: var(--terra);
    font-size: 0.78rem;
    font-weight: 900;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  h1 {
    margin: 0;
    font-size: clamp(2.4rem, 5vw, 4rem);
    line-height: 1;
  }

  header p:not(.post-date) {
    color: var(--muted);
    line-height: 1.7;
  }

  .prose-card {
    padding: 1rem;
  }

  .prose {
    line-height: 1.75;
  }
</style>
