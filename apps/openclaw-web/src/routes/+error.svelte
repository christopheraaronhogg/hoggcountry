<script lang="ts">
  import { page } from '$app/state';

  const notFound = $derived(page.status === 404);
</script>

<svelte:head>
  <title>{notFound ? 'Trail not found' : 'Something went sideways'} | Hogg Country</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<section class="lost-shell">
  <p class="lost-kicker">{notFound ? 'Blue blaze to nowhere' : 'Trail closure'}</p>
  <h1>{notFound ? "This trail doesn't go anywhere." : 'Something went sideways out here.'}</h1>
  <p class="lost-copy">
    {notFound
      ? "The page you followed isn't on our map. Back to a marked trail:"
      : 'We hit a snag serving that page. Try again in a moment, or head back to a marked trail:'}
  </p>
  <nav class="lost-links" aria-label="Useful destinations">
    <a class="lost-link lost-link--primary" href="/">Home</a>
    <a class="lost-link" href="/guide">Field Guide</a>
    <a class="lost-link" href="/at-map">AT Map</a>
    <a class="lost-link" href="/updates">Trail Updates</a>
  </nav>
  <p class="lost-status">{page.status}{page.error?.message ? ` — ${page.error.message}` : ''}</p>
</section>

<style>
  .lost-shell {
    display: grid;
    gap: 0.9rem;
    justify-items: center;
    max-width: 36rem;
    margin: 0 auto;
    padding: clamp(3rem, 12vh, 7rem) 1rem 4rem;
    text-align: center;
  }

  .lost-kicker {
    margin: 0;
    color: var(--terra, #d97706);
    font-size: 0.78rem;
    font-weight: 900;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }

  h1 {
    margin: 0;
    color: var(--ink, #1f2937);
    font-family: Oswald, Impact, sans-serif;
    font-size: clamp(2rem, 6vw, 3.4rem);
    line-height: 1;
  }

  .lost-copy {
    margin: 0;
    color: var(--muted, #5c665a);
    line-height: 1.6;
  }

  .lost-links {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
    justify-content: center;
  }

  .lost-link {
    display: inline-flex;
    align-items: center;
    min-height: 2.8rem;
    border: 1px solid rgba(77, 89, 74, 0.2);
    border-radius: 999px;
    padding: 0 1.1rem;
    background: rgba(255, 255, 255, 0.78);
    color: var(--pine, #4d594a);
    font-weight: 900;
    text-decoration: none;
  }

  .lost-link--primary {
    border: 0;
    background: var(--marker, #f0e000);
    color: #2b2f26;
  }

  .lost-status {
    margin: 0.6rem 0 0;
    color: rgba(92, 102, 90, 0.6);
    font-size: 0.8rem;
    font-weight: 700;
  }
</style>
