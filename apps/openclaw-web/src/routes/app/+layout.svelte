<script lang="ts">
  import type { LayoutData } from './$types';

  const { data, children } = $props<{ data: LayoutData; children: import('svelte').Snippet }>();
</script>

<svelte:head>
  <meta name="robots" content="noindex,nofollow" />
</svelte:head>

<section class="app-topbar" aria-label="Scout workspace">
  <div>
    <p class="eyebrow">Scout beta</p>
    <h1>{data.betaProfile?.trailName || data.betaProfile?.name}</h1>
  </div>

  <nav class="app-nav" aria-label="App">
    <a href="/app/claw">Scout</a>
    <a href="/app/today">Today</a>
    <a href="/app/docs">Docs</a>
    <a href="/app/setup">Setup</a>
  </nav>
</section>

<style>
  .app-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.8rem;
    margin-bottom: 1rem;
    padding: 0.8rem 0.95rem;
    border: 1px solid rgba(77, 89, 74, 0.12);
    border-radius: 22px;
    background: rgba(255, 255, 255, 0.82);
    box-shadow: 0 10px 28px rgba(31, 41, 55, 0.05);
    backdrop-filter: blur(12px);
  }

  .app-topbar h1 {
    margin: 0;
    font-size: clamp(1.3rem, 3vw, 2rem);
    line-height: 1;
  }

  .app-nav {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    justify-content: flex-end;
  }

  .app-nav a {
    display: inline-flex;
    align-items: center;
    min-height: 2.4rem;
    padding: 0 0.75rem;
    border-radius: 999px;
    border: 1px solid rgba(77, 89, 74, 0.13);
    background: rgba(255, 253, 248, 0.92);
    color: #394638;
    font-weight: 850;
    text-decoration: none;
  }

  .app-nav a:hover {
    background: #edf3e5;
  }

  @media (max-width: 680px) {
    .app-topbar {
      align-items: flex-start;
      flex-direction: column;
    }

    .app-nav {
      width: 100%;
      justify-content: flex-start;
    }
  }
</style>

{@render children()}
