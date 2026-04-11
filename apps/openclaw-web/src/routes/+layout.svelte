<script lang="ts">
  import '../app.css';
  import { browser } from '$app/environment';
  import { page } from '$app/state';
  import { initSpacetimeProvider } from '$lib/spacetime';
  import type { LayoutData } from './$types';

  const { data, children } = $props<{ data: LayoutData; children: import('svelte').Snippet }>();

  if (browser) {
    initSpacetimeProvider();
  }
</script>

<svelte:head>
  <title>Hogg Country OpenClaw</title>
  <meta
    name="description"
    content="Dad updates, Dad's field guide, and the new OpenClaw-for-hikers workspace in one SvelteKit frontend."
  />
</svelte:head>

<div class="site-shell">
  <header class="site-header">
    <div class="container site-header-inner">
      <a class="brand-lockup" href="/">
        <span class="brand-badge">HC</span>
        <span class="brand-copy">
          <span class="brand-title">Hogg Country</span>
          <span class="brand-tag">Dad updates + manual-first hiking</span>
        </span>
      </a>

      <nav class="site-nav" aria-label="Primary">
        <a href="/dad">Dad</a>
        <a href="/guide">Guide</a>
        <a href="/openclaw">OpenClaw</a>
        {#if data.betaProfile}
          <a class="btn btn-secondary" href="/app">Open app</a>
        {:else}
          <a class="btn btn-primary" href="/signup">Join beta</a>
        {/if}
      </nav>
    </div>
  </header>

  <main class="site-main">
    <div class="container">
      {@render children()}
    </div>
  </main>

  <footer class="site-footer">
    <div class="container site-footer-inner">
      <div>
        <strong>Hogg Country</strong>
        <div class="muted">Dad's trail dispatches, field guide, and the next manual-first hiker workspace.</div>
      </div>
      <div class="muted">
        {#if $page.url.pathname.startsWith('/app') && data.betaProfile}
          Signed in for {data.betaProfile.trailName || data.betaProfile.name}
        {:else}
          Beta build on SvelteKit + SpacetimeDB patterns
        {/if}
      </div>
    </div>
  </footer>
</div>
