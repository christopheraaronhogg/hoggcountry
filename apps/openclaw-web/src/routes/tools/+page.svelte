<svelte:head>
  <title>Trail Tools Moved | Hogg Country</title>
  <meta name="description" content="The old multi-tool dashboard has been folded into the personal field manual workspace." />
</svelte:head>

<section class="container tools-moved">
  <div class="card moved-card">
    <p class="eyebrow">Merged</p>
    <h1>Trail tools now live inside the workspace.</h1>
    <p>
      The old dashboard is no longer a standalone public surface. The important parts are being folded into Today and
      Plan so hikers get fewer, calmer screens.
    </p>
    <div class="actions">
      <a href="/app/today" class="btn btn-primary">Open Today</a>
      <a href="/app" class="btn btn-ghost">Open Scout</a>
    </div>
  </div>
</section>

<style>
  .tools-moved {
    padding-top: 3rem;
  }

  .moved-card {
    max-width: 760px;
    padding: 1.4rem;
  }

  h1 {
    max-width: 12ch;
    margin: 0;
    font-size: clamp(2.6rem, 6vw, 4.8rem);
    line-height: 0.98;
  }

  p {
    max-width: 58ch;
    color: var(--muted);
    line-height: 1.75;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }
</style>
