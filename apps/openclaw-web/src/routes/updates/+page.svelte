<script lang="ts">
  import type { PageData } from './$types';
  import TrailUpdatesFeed from '$components/TrailUpdatesFeed.svelte';

  const { data } = $props<{ data: PageData }>();
</script>

<svelte:head>
  <title>Trail Updates | Hogg Country</title>
  <meta name="description" content="Fresh Hogg Country trail photos, videos, and short field notes for followers outside Facebook." />
</svelte:head>

<section class="updates-hero">
  <div class="container hero-card">
    <p class="eyebrow">Hogg Country Trail Updates</p>
    <h1>Fresh field notes from the trail.</h1>
    <p>
      Quick photos, videos, and short updates for family, friends, and followers who want to keep up without chasing
      posts on Facebook.
    </p>
  </div>
</section>

<div class="container">
  <TrailUpdatesFeed endpoint={data.updatesEndpoint} limit={50} showHeader={false} />
</div>

<style>
  .updates-hero {
    padding: 2rem 0 1rem;
    background:
      radial-gradient(circle at top left, rgba(166, 181, 137, 0.18), transparent 28%),
      linear-gradient(180deg, #f6f1e7 0%, #f5efe2 100%);
  }

  .hero-card {
    padding: 1.35rem;
    border: 1px solid rgba(48, 65, 54, 0.12);
    border-radius: 30px;
    background: rgba(255, 255, 255, 0.82);
    box-shadow: 0 22px 50px rgba(60, 44, 25, 0.08);
  }

  h1 {
    max-width: 10ch;
    margin: 0;
    color: var(--ink);
    font-size: clamp(2.6rem, 6vw, 5rem);
    line-height: 0.98;
  }

  p {
    max-width: 62ch;
    color: var(--muted);
    font-size: 1.05rem;
    line-height: 1.75;
  }
</style>
