<script lang="ts">
  import { afterNavigate } from '$app/navigation';
  import { onMount } from 'svelte';

  let pathname = '/';
  let isOnline = true;
  let offlineReady = false;

  function syncOnlineStatus() {
    isOnline = navigator.onLine;
  }

  afterNavigate(({ to }) => {
    pathname = to?.url.pathname ?? pathname;
  });

  onMount(() => {
    pathname = window.location.pathname;
    syncOnlineStatus();

    window.addEventListener('online', syncOnlineStatus);
    window.addEventListener('offline', syncOnlineStatus);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .then(() => {
          offlineReady = true;
        })
        .catch(() => {
          offlineReady = false;
        });
    }

    return () => {
      window.removeEventListener('online', syncOnlineStatus);
      window.removeEventListener('offline', syncOnlineStatus);
    };
  });

  const links = [
    { href: '/setup', label: 'Setup' },
    { href: '/today', label: 'Today' },
    { href: '/plan', label: 'Plan' },
    { href: '/manual', label: 'Manual' },
    { href: '/search', label: 'Search' },
    { href: '/docs', label: 'Docs' },
  ];
</script>

<svelte:head>
  <title>Hogg Country Workspace</title>
  <meta name="robots" content="noindex,nofollow" />
  <meta name="theme-color" content="#304136" />
</svelte:head>

<div class="workspace-shell">
  <header class="workspace-header">
    <div class="workspace-branding">
      <a href="/today" class="brand">Hogg Country Workspace</a>
      <p class="tagline">Build your personal field manual and keep it local.</p>
    </div>

    <nav class="workspace-nav" aria-label="Workspace">
      {#each links as link}
        <a href={link.href} class:active={pathname === link.href}>{link.label}</a>
      {/each}
      <a href="https://hoggcountry.com" rel="noopener noreferrer" class="public-link">Public site</a>
    </nav>

    <div class="workspace-status">
      <span class:offline={!isOnline}>{isOnline ? 'Online' : 'Offline'}</span>
      <span class:ready={offlineReady}>{offlineReady ? 'Saved locally' : 'No offline shell yet'}</span>
    </div>
  </header>

  <main class="workspace-main">
    <slot />
  </main>
</div>

<style>
  :global(body) {
    margin: 0;
    min-height: 100vh;
    background:
      radial-gradient(circle at top left, rgba(166, 181, 137, 0.12), transparent 28%),
      linear-gradient(180deg, #f6f1e7 0%, #f2ebdd 100%);
    color: #1f2937;
    font-family: Inter, system-ui, sans-serif;
  }

  .workspace-shell {
    min-height: 100vh;
  }

  .workspace-header {
    position: sticky;
    top: 0;
    z-index: 20;
    display: grid;
    gap: 1rem;
    padding: 1rem 1.25rem;
    background: rgba(250, 247, 240, 0.92);
    border-bottom: 1px solid rgba(48, 65, 54, 0.12);
    backdrop-filter: blur(12px);
  }

  .brand {
    color: #304136;
    font-size: 1.15rem;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-decoration: none;
    text-transform: uppercase;
  }

  .tagline {
    margin: 0.25rem 0 0;
    color: #5d675c;
    font-size: 0.95rem;
  }

  .workspace-nav {
    display: flex;
    flex-wrap: wrap;
    gap: 0.65rem;
  }

  .workspace-nav a {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 42px;
    padding: 0.7rem 0.95rem;
    border-radius: 999px;
    border: 1px solid rgba(48, 65, 54, 0.12);
    background: rgba(255, 255, 255, 0.74);
    color: #304136;
    font-weight: 700;
    text-decoration: none;
  }

  .workspace-nav a.active {
    background: rgba(166, 181, 137, 0.26);
    border-color: rgba(48, 65, 54, 0.24);
    color: #1f2937;
  }

  .public-link {
    background: linear-gradient(160deg, #f0e000, #f8f2b4);
  }

  .workspace-status {
    display: flex;
    flex-wrap: wrap;
    gap: 0.65rem;
    color: #5d675c;
    font-size: 0.85rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .workspace-status span {
    display: inline-flex;
    align-items: center;
    min-height: 34px;
    padding: 0.35rem 0.75rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.66);
  }

  .workspace-status span.offline {
    background: rgba(217, 119, 6, 0.16);
    color: #a35100;
  }

  .workspace-status span.ready {
    background: rgba(166, 181, 137, 0.26);
    color: #304136;
  }

  .workspace-main {
    max-width: 1120px;
    margin: 0 auto;
    padding: 1.25rem;
  }

  @media (min-width: 900px) {
    .workspace-header {
      grid-template-columns: minmax(240px, 1fr) minmax(0, 1.25fr) auto;
      align-items: center;
    }
  }
</style>
