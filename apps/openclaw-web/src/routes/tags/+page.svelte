<script lang="ts">
  import type { PageData } from './$types';

  const { data } = $props<{ data: PageData }>();
</script>

<svelte:head>
  <title>Tags | Hogg Country</title>
  <meta name="description" content="Browse Hogg Country trips and posts by tag." />
</svelte:head>

<main class="container tags-page">
  <h1>Tags</h1>
  <div class="tag-grid">
    {#each data.tags as tag}
      <a href={`/tags/${encodeURIComponent(tag.tag)}`} class="tag-card">
        <strong>{tag.tag}</strong>
        <span>{tag.trips.length} trips • {tag.posts.length} posts</span>
      </a>
    {/each}
  </div>
</main>

<style>
  .tags-page {
    max-width: 860px;
    padding-top: 2rem;
  }

  h1 {
    font-size: clamp(2.4rem, 5vw, 4rem);
  }

  .tag-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 0.75rem;
  }

  .tag-card {
    display: grid;
    gap: 0.2rem;
    padding: 0.75rem;
    border: 1px solid var(--border);
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.82);
    color: inherit;
    text-decoration: none;
  }

  .tag-card span {
    color: var(--muted);
    font-size: 0.85rem;
  }
</style>
