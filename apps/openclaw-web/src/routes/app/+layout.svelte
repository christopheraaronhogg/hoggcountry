<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import type { LayoutData } from './$types';

  const { data, children } = $props<{ data: LayoutData; children: import('svelte').Snippet }>();
  let isOffline = $state(false);

  const appTabs = [
    {
      href: '/app',
      label: 'Today',
      icon: 'home'
    },
    {
      href: '/app/scout',
      label: 'Plan',
      icon: 'plan'
    },
    {
      href: '/app/map',
      label: 'Map',
      icon: 'map'
    },
    {
      href: '/app/loadout',
      label: 'Loadout',
      icon: 'loadout'
    },
    {
      href: '/app/profile',
      label: 'Profile',
      icon: 'profile'
    }
  ];

  const visibleAppTabs = $derived(data.isAdmin
    ? [
        ...appTabs,
        {
          href: '/app/admin/resources',
          label: 'Admin',
          icon: 'admin'
        }
      ]
    : appTabs);

  function tabActive(href: string): boolean {
    const path = page.url.pathname;
    if (href === '/app') return path === '/app';
    if (href === '/app/scout') return path === '/app/scout' || path.startsWith('/app/scout/') || path.startsWith('/app/claw') || path.startsWith('/app/plan');
    if (href === '/app/profile') return path.startsWith('/app/profile') || path.startsWith('/app/setup');
    if (href === '/app/admin/resources') return path.startsWith('/app/admin');
    return path.startsWith(href);
  }

  function updateOnlineState() {
    isOffline = !navigator.onLine;
  }

  onMount(() => {
    updateOnlineState();
    window.addEventListener('online', updateOnlineState);
    window.addEventListener('offline', updateOnlineState);

    return () => {
      window.removeEventListener('online', updateOnlineState);
      window.removeEventListener('offline', updateOnlineState);
    };
  });
</script>

<svelte:head>
  <meta name="robots" content="noindex,nofollow" />
</svelte:head>

<section class="app-topbar" aria-label="Scout workspace">
  <a class="app-lockup" href="/app" aria-label="Scout home">
    <span class="app-mark">HC</span>
    <span>
      <span class="eyebrow">Scout beta</span>
      <strong>{data.betaProfile?.trailName || data.betaProfile?.name || 'Scout'}</strong>
    </span>
  </a>

  <span
    class="app-network-badge"
    class:is-online={!isOffline}
    class:is-offline={isOffline}
    title={isOffline ? 'No network detected. Cloud Scout replies and live weather/source checks will not work until service returns.' : 'Network detected. Cloud Scout and live source checks can run.'}
  >
    {isOffline ? 'Offline' : 'Online'}
  </span>

  <nav class="app-nav" aria-label="App">
    {#each visibleAppTabs as tab}
      <a href={tab.href} class:is-active={tabActive(tab.href)}>{tab.label}</a>
    {/each}
    <a href="/app/logout">Switch</a>
  </nav>
</section>

{@render children()}

<nav class="app-bottom-nav" aria-label="Primary app navigation">
  {#each visibleAppTabs.slice(0, 5) as tab}
    <a href={tab.href} class:is-active={tabActive(tab.href)}>
      <span class="nav-icon" aria-hidden="true">
        {#if tab.icon === 'home'}
          <svg viewBox="0 0 24 24"><path d="M4 11.5 12 5l8 6.5V20h-5v-5.2H9V20H4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" /></svg>
        {:else if tab.icon === 'plan'}
          <svg viewBox="0 0 24 24"><path d="M7 4h8l3 3v13H7z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" /><path d="M10 11h5M10 15h4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>
        {:else if tab.icon === 'map'}
          <svg viewBox="0 0 24 24"><path d="M8 5 3 7v13l5-2 8 2 5-2V5l-5 2z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" /><path d="M8 5v13M16 7v13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>
        {:else if tab.icon === 'loadout'}
          <svg viewBox="0 0 24 24"><path d="M7 9a5 5 0 0 1 10 0v11H7z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" /><path d="M9 15h6M9 5V3h6v2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
        {:else}
          <svg viewBox="0 0 24 24"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 8a7 7 0 0 0-14 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>
        {/if}
      </span>
      <strong>{tab.label}</strong>
    </a>
  {/each}
</nav>

<style>
  :global(.site-header) {
    display: none;
  }

  .app-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.8rem;
    margin-bottom: 1rem;
    padding: 0.78rem 0.95rem;
    border: 1px solid rgba(77, 89, 74, 0.12);
    border-radius: 24px;
    background: rgba(255, 253, 248, 0.86);
    box-shadow: 0 10px 28px rgba(31, 41, 55, 0.05);
    backdrop-filter: blur(12px);
  }

  .app-lockup {
    display: inline-flex;
    align-items: center;
    gap: 0.7rem;
    min-width: 0;
    color: var(--pine);
    text-decoration: none;
  }

  .app-lockup strong {
    display: block;
    color: var(--ink);
    font-family: Oswald, Impact, sans-serif;
    font-size: clamp(1.25rem, 2.4vw, 1.7rem);
    line-height: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .app-mark {
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    width: 2.45rem;
    height: 2.45rem;
    border-radius: 999px;
    border: 3px solid rgba(255, 255, 255, 0.9);
    background: linear-gradient(160deg, rgba(166, 181, 137, 0.95), rgba(77, 89, 74, 0.95));
    color: white;
    font-family: Oswald, sans-serif;
    font-weight: 900;
    letter-spacing: 0.03em;
    box-shadow: var(--shadow-soft);
  }

  .app-nav {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    justify-content: flex-end;
  }

  .app-network-badge {
    display: inline-flex;
    align-items: center;
    min-height: 2.15rem;
    margin-left: auto;
    border: 1px solid transparent;
    border-radius: 999px;
    padding: 0 0.72rem;
    font-size: 0.74rem;
    font-weight: 900;
    white-space: nowrap;
  }

  .app-network-badge.is-online {
    color: #22573e;
    background: rgba(65, 130, 87, 0.12);
    border-color: rgba(65, 130, 87, 0.24);
  }

  .app-network-badge.is-offline {
    color: #8a2f2f;
    background: rgba(176, 62, 62, 0.12);
    border-color: rgba(176, 62, 62, 0.24);
  }

  .app-nav a {
    display: inline-flex;
    align-items: center;
    min-height: 2.45rem;
    padding: 0 0.85rem;
    border-radius: 999px;
    border: 1px solid rgba(77, 89, 74, 0.13);
    background: rgba(255, 253, 248, 0.9);
    color: #394638;
    font-weight: 850;
    text-decoration: none;
  }

  .app-nav a:hover,
  .app-nav a.is-active {
    background: var(--pine);
    border-color: var(--pine);
    color: #fff;
  }

  .app-bottom-nav {
    position: fixed;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 40;
    display: none;
    /* Five tabs (Today / Plan / Map / Loadout / Profile) must fit at 360px. */
    grid-template-columns: repeat(5, minmax(0, 1fr));
    min-height: calc(3.15rem + env(safe-area-inset-bottom));
    border-top: 1px solid rgba(39, 51, 43, 0.14);
    background: #fffdf8;
    box-shadow: none;
    backdrop-filter: none;
    padding: 0.28rem 0.3rem max(0.28rem, env(safe-area-inset-bottom));
  }

  .app-bottom-nav a {
    display: grid;
    place-items: center;
    align-content: center;
    gap: 0.12rem;
    min-height: 2.34rem;
    border-radius: 14px;
    color: #2f382e;
    text-decoration: none;
  }

  .app-bottom-nav .nav-icon {
    display: grid;
    place-items: center;
    width: 1.35rem;
    height: 1.35rem;
  }

  .app-bottom-nav svg {
    width: 1.22rem;
    height: 1.22rem;
  }

  .app-bottom-nav strong {
    font-size: 0.6rem;
    font-weight: 850;
    letter-spacing: 0.01em;
    line-height: 1;
    white-space: nowrap;
  }

  .app-bottom-nav a.is-active {
    min-height: 2.18rem;
    margin: 0.16rem 0.24rem;
    background: #2e4334;
    color: #b8c1b7;
  }

  @media (max-width: 760px) {
    :global(.site-main) {
      padding-top: 1.15rem;
      padding-bottom: calc(6rem + env(safe-area-inset-bottom));
    }

    .app-topbar {
      display: none;
    }

    .app-bottom-nav {
      display: grid;
    }
  }
</style>
