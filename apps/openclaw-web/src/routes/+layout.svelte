<script lang="ts">
  import '../app.css';
  import { browser, dev } from '$app/environment';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { initSpacetimeProvider } from '$lib/spacetime';
  import WaitlistSignup from '$lib/components/WaitlistSignup.svelte';
  import type { LayoutData } from './$types';

  const { data, children } = $props<{ data: LayoutData; children: import('svelte').Snippet }>();

  const currentYear = new Date().getFullYear();
  let toolsOpen = $state(false);
  let guideHeaderHidden = $state(false);
  let isOffline = $state(false);

  const publicToolsLinks = [
    { href: '/journey', label: 'The Journey', external: false },
    { href: '/scout', label: 'Scout', external: false },
    { href: '/updates', label: 'Trail Updates', external: false },
    { href: '/guide', label: 'Field Guide', external: false },
    { href: '/videos', label: 'Videos', external: false },
    { href: '/at-map', label: 'AT Map', external: false },
    { href: '/at-weather', label: 'AT Weather', external: false },
    { href: '/trail', label: 'Trail Hub', external: false },
    { href: '/tools', label: 'Trail Tools', external: false },
    { href: '/tools/character', label: 'My Profile', external: false },
    { href: '/videohogg', label: 'VideoHogg', external: false },
    { href: '/login', label: 'Account', external: false }
  ];

  function closeTools() {
    toolsOpen = false;
  }

  const isGuidePage = $derived(
    page.url.pathname === '/guide' ||
      page.url.pathname.startsWith('/guide/manual-builder') ||
      (page.url.pathname.startsWith('/guide/') && !page.url.pathname.startsWith('/guide/personalize'))
  );
  const isHomepage = $derived(page.url.pathname === '/');

  function updateGuideHeaderState() {
    if (!browser) return;
    guideHeaderHidden = isGuidePage && window.scrollY >= 50;
  }

  function updateOnlineState() {
    if (!browser) return;
    isOffline = !navigator.onLine;
  }

  function syncServiceWorker() {
    if (!('serviceWorker' in navigator)) return;

    if (dev) {
      void navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          if (registration.scope.startsWith(window.location.origin)) {
            void registration.unregister();
          }
        }
      });
      return;
    }

    void navigator.serviceWorker.register('/service-worker.js').catch((error) => {
      console.warn('Scout service worker registration failed:', error);
    });
  }

  if (browser) {
    initSpacetimeProvider();
    syncServiceWorker();
    $effect(() => {
      updateGuideHeaderState();
    });
    $effect(() => {
      updateOnlineState();
      window.addEventListener('online', updateOnlineState);
      window.addEventListener('offline', updateOnlineState);

      return () => {
        window.removeEventListener('online', updateOnlineState);
        window.removeEventListener('offline', updateOnlineState);
      };
    });
  }
</script>

<svelte:head>
  <link rel="sitemap" href="/sitemap-index.xml" />
  <link rel="alternate" type="application/rss+xml" title="Hogg Country" href="/rss.xml" />
  <link rel="canonical" href={`${page.url.origin}${page.url.pathname}`} />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Hogg Country" />
  <meta property="og:url" content={`${page.url.origin}${page.url.pathname}`} />
  <meta property="og:image" content={`${page.url.origin}/logo.png`} />
  <meta name="twitter:card" content="summary_large_image" />
</svelte:head>

<svelte:window onscroll={updateGuideHeaderState} />

{#if page.url.pathname.startsWith('/app')}
  <div class="site-shell">
    <header class="site-header">
      <div class="container site-header-inner">
        <a class="brand-lockup" href="/app/scout">
          <span class="brand-badge">HC</span>
          <span class="brand-copy">
            <span class="brand-title">Hogg Country</span>
            <span class="brand-tag">Private Scout workspace</span>
          </span>
        </a>
      </div>
    </header>

    <main class="site-main">
      <div class="container">
        {@render children()}
      </div>
    </main>

  </div>
{:else}
  <a href="#main-content" class="skip-to-content">Skip to main content</a>

  <div class="site-shell public-shell" class:guide-shell={isGuidePage}>
    <div class:guide-header-wrapper={isGuidePage} class:is-hidden={isGuidePage && guideHeaderHidden}>
      <header class="header" id="site-header">
        <nav class="container nav">
        <a href="/" class="brand" aria-label="Hogg Country">
          <img src="/logo.png" alt="Hogg Country" class="logo" />
        </a>

        <div class="nav-controls">
          <div class="nav-ctas" aria-label="Quick links">
            <a href="/updates" class="guide-link" class:is-active={page.url.pathname.startsWith('/updates')}>
              <span>Updates</span>
            </a>

            <a href="/guide" class="guide-link" class:is-active={page.url.pathname.startsWith('/guide')}>
              <span class="guide-link__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 5.5A2.5 2.5 0 0 1 5.5 3H10a3 3 0 0 1 3 3v15a2 2 0 0 0-2-2H5.5A2.5 2.5 0 0 1 3 16.5z"></path>
                  <path d="M13 6a3 3 0 0 1 3-3h4.5A2.5 2.5 0 0 1 23 5.5v11a2.5 2.5 0 0 1-2.5 2.5H15a2 2 0 0 0-2 2z"></path>
                  <path d="M7 7h3M7 10h3"></path>
                </svg>
              </span>
              <span>Guide</span>
            </a>

            <a
              href="/at-map"
              class="live-link live-link--header"
              class:is-active={page.url.pathname === '/at-map' || page.url.pathname === '/track'}
              title="Live AT map — follow Dad"
            >
              <span class="live-dot"></span>
              <span class="live-text">Live Map</span>
            </a>
          </div>

          <button
            class="nav-toggle"
            id="nav-toggle"
            type="button"
            aria-label={toolsOpen ? 'Close tools menu' : 'Open tools menu'}
            aria-expanded={toolsOpen}
            aria-controls="mobile-drawer"
            onclick={() => (toolsOpen = !toolsOpen)}
          >
            <span class="nav-toggle__bars" aria-hidden="true">
              <span class="bar"></span>
              <span class="bar"></span>
              <span class="bar"></span>
            </span>
            <span class="nav-toggle__label">Tools</span>
          </button>

          {#if isOffline}
            <span class="connection-badge is-offline" title="No network detected. Saved guide pages may still work if cached.">Offline</span>
          {/if}
        </div>
      </nav>

      <div class="mobile-overlay" class:is-open={toolsOpen} aria-hidden={!toolsOpen} onclick={closeTools}></div>

      <aside
        class="mobile-drawer"
        class:is-open={toolsOpen}
        id="mobile-drawer"
        aria-label="Tools menu"
        aria-hidden={!toolsOpen}
        tabindex="-1"
      >
        <div class="mobile-top">
          <span class="mobile-title">Tools</span>
          <button class="mobile-close" id="nav-close" type="button" aria-label="Close menu" onclick={closeTools}>×</button>
        </div>

        <div class="mobile-links">
          <a
            href="/at-map"
            class="live-link mobile-live"
            class:is-active={page.url.pathname === '/at-map' || page.url.pathname === '/track'}
            title="Live AT map — follow Dad"
            onclick={closeTools}
          >
            <span class="live-dot"></span>
            <span class="live-text">Live Map</span>
          </a>

          {#each publicToolsLinks as link}
            <a
              href={link.href}
              class="mobile-link"
              class:is-active={!link.external && page.url.pathname.startsWith(link.href)}
              target={link.external ? '_blank' : undefined}
              rel={link.external ? 'noopener noreferrer' : undefined}
              onclick={closeTools}
            >
              {link.label}
            </a>
          {/each}
        </div>
      </aside>
      </header>
    </div>

    <main id="main-content" class="site-main public-site-main" tabindex="-1">
      {#if isGuidePage || page.url.pathname === '/' || page.url.pathname === '/at-map' || page.url.pathname === '/track'}
        {@render children()}
      {:else}
        <div class="container public-page-wrap">
          {@render children()}
        </div>
      {/if}
    </main>

    {#if page.url.pathname !== '/at-map' && page.url.pathname !== '/track'}
    <footer class="public-meta-footer" class:home-closing={isHomepage}>
      {#if isHomepage}
        <div class="home-footer-inner">
          <div class="home-footer-copy">
            <p class="home-footer-kicker">Scout for your own hike</p>
            <h2>Want this for your own hike?</h2>
            <p>
              Everything above — the mile frame, elevation profile, landmarks, and live position —
              is the foundation we're turning into Scout, the trail app we're shipping for iOS and Android.
            </p>
          </div>

          <div class="home-footer-actions">
            <a class="home-footer-link" href={resolve('/scout')}>See what Scout does</a>
            <span class="store-status-pill">App Store · not live yet</span>
            <span class="store-status-pill">Google Play · not live yet</span>
          </div>

          <div class="footer-waitlist home-waitlist">
            <p class="footer-waitlist-title">The waitlist is the only line open today</p>
            <WaitlistSignup source="homepage-launch" compact={false} />
            <p class="home-footer-note">
              We'll email you the moment the store listings are ready.
            </p>
          </div>

          <div class="footer-rule"></div>
        </div>
      {:else}
        <div class="footer-waitlist">
          <p class="footer-waitlist-title">Get the Scout app the day it drops</p>
          <WaitlistSignup source="footer" compact />
        </div>
      {/if}

      <div class="footer-copyright">&copy; {currentYear} Hogg Country. All rights reserved.</div>
      <div class="social-links">
        <a href="https://www.youtube.com/@hoggcountry7483" target="_blank" rel="noopener" aria-label="Hogg Country on YouTube">
          <svg viewBox="0 0 16 16" aria-hidden="true" width="32" height="32">
            <path fill="currentColor" d="M8.051 1.999h.089c.822.003 4.987.033 6.11.335a2.01 2.01 0 0 1 1.415 1.42c.101.38.172.883.22 1.402l.01.104.022.26.008.104c.065.914.073 1.77.074 1.957v.075c-.001.194-.01 1.108-.082 2.06l-.008.105-.009.104c-.05.572-.124 1.14-.235 1.558a2.007 2.007 0 0 1-1.415 1.42c-1.16.312-5.569.334-6.18.335h-.142c-.309 0-1.587-.006-2.927-.052l-.17-.006-.087-.004-.171-.007-.171-.007c-1.11-.049-2.167-.128-2.654-.26a2.007 2.007 0 0 1-1.415-1.419c-.111-.417-.185-.986-.235-1.558L.09 9.82l-.008-.104A31.4 31.4 0 0 1 0 7.68v-.123c.002-.215.01-.958.064-1.778l.007-.103.003-.052.008-.104.022-.26.01-.104c.048-.519.119-1.023.22-1.402a2.007 2.007 0 0 1 1.415-1.42c.487-.13 1.544-.21 2.654-.26l.17-.007.172-.006.086-.003.171-.007A99.788 99.788 0 0 1 7.858 2h.193zM6.4 5.209v4.818l4.157-2.408L6.4 5.209z"></path>
          </svg>
        </a>
        <a href="https://www.facebook.com/Hogg.Jimmy" target="_blank" rel="noopener" aria-label="Jimmy Hogg on Facebook">
          <svg viewBox="0 0 16 16" aria-hidden="true" width="32" height="32">
            <path fill="currentColor" d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951z"></path>
          </svg>
        </a>
      </div>
    </footer>
    {/if}

    <div id="version-stamp">alpha 0.7</div>
  </div>
{/if}

<style>
  .skip-to-content {
    position: absolute;
    top: -100%;
    left: 50%;
    transform: translateX(-50%);
    padding: 0.75rem 1.5rem;
    background: var(--pine);
    color: #fff;
    font-family: Oswald, sans-serif;
    font-weight: 600;
    text-decoration: none;
    border-radius: 0 0 8px 8px;
    z-index: 9999;
    transition: top 0.2s ease;
  }

  .skip-to-content:focus {
    top: 0;
    outline: 3px solid var(--marker);
    outline-offset: 2px;
  }

  .public-shell {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: url('/default-background.svg') center center / cover no-repeat fixed, var(--bg, #f5f2e8);
  }

  .public-shell .container {
    width: 100%;
    max-width: 1100px;
    margin-inline: auto;
    padding-inline: 1rem;
    box-sizing: border-box;
  }

  .public-site-main {
    flex: 1;
    padding: 0;
  }

  .public-page-wrap {
    padding-block: 1.5rem 4rem;
  }

  .guide-header-wrapper {
    width: 100%;
  }

  .guide-header-wrapper.guide-header-wrapper {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 3000;
    transition: transform 0.3s ease;
  }

  .guide-header-wrapper.is-hidden {
    transform: translateY(-100%);
  }

  .guide-shell .guide-header-wrapper .header {
    background: rgba(245, 242, 232, 0.98);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }

  .header {
    min-height: 52px;
    display: flex;
    align-items: center;
    background: var(--bg, #f5f2e8);
    border-bottom: 1px solid var(--border, #e6e1d4);
    transition: transform 0.3s ease, opacity 0.3s ease;
  }

  .nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
  }

  .brand {
    display: flex;
    align-items: center;
  }

  .guide-shell .brand {
    padding-block: 0.66rem;
  }

  .logo {
    height: 40px;
    width: auto;
  }

  .nav-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .nav-ctas {
    display: flex;
    align-items: center;
    gap: 0.45rem;
  }

  .nav-toggle {
    display: inline-flex;
    gap: 0.5rem;
    height: 42px;
    font-size: 0.833333rem;
    border-radius: 10px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(8px);
    cursor: pointer;
    align-items: center;
    justify-content: center;
    padding: 0 12px;
    color: #1f2937d9;
  }

  .nav-toggle:active {
    transform: translateY(1px);
  }

  .nav-toggle__bars {
    display: inline-flex;
    flex-direction: column;
    gap: 4px;
  }

  .bar {
    width: 18px;
    height: 2px;
    border-radius: 999px;
    background: rgba(31, 41, 55, 0.85);
  }

  .nav-toggle__label {
    font-family: Oswald, system-ui, sans-serif;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    font-size: 0.72rem;
    color: rgba(31, 41, 55, 0.86);
  }

  .mobile-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.42);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.18s ease;
    z-index: 2200;
  }

  .mobile-overlay.is-open {
    opacity: 1;
    pointer-events: auto;
  }

  .mobile-drawer {
    position: fixed;
    top: 0;
    right: 0;
    height: 100vh;
    width: min(360px, 88vw);
    background: var(--bg, #f5f2e8);
    border-left: 1px solid var(--border, #e6e1d4);
    box-shadow: -18px 0 40px rgba(0, 0, 0, 0.18);
    transform: translate(110%);
    transition: transform 0.22s ease;
    z-index: 2201;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .mobile-drawer.is-open {
    transform: translate(0);
  }

  .mobile-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 10px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  }

  .mobile-title {
    font-family: Oswald, system-ui, sans-serif;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    font-weight: 900;
    color: rgba(31, 41, 55, 0.86);
  }

  .mobile-close {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    background: rgba(255, 255, 255, 0.75);
    cursor: pointer;
    font-size: 22px;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(31, 41, 55, 0.85);
  }

  .mobile-links {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .mobile-link {
    display: flex;
    align-items: center;
    padding: 12px;
    border-radius: 12px;
    text-decoration: none;
    color: var(--pine);
    border: 1px solid rgba(0, 0, 0, 0.06);
    background: rgba(255, 255, 255, 0.55);
    font-weight: 600;
  }

  .mobile-link:hover {
    background: rgba(255, 255, 255, 0.72);
  }

  .mobile-link.is-active {
    background: rgba(166, 181, 137, 0.22);
    border-color: rgba(166, 181, 137, 0.35);
  }

  .mobile-live {
    justify-content: center;
  }

  .guide-link {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    height: 42px;
    font-size: 0.85rem;
    font-weight: 700;
    color: rgba(31, 41, 55, 0.86);
    text-decoration: none;
    padding: 0 12px;
    border-radius: 10px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    background: rgba(255, 255, 255, 0.55);
    white-space: nowrap;
    transition: background 0.15s ease, border-color 0.15s ease;
  }

  .guide-link:hover {
    background: rgba(255, 255, 255, 0.75);
    border-color: rgba(0, 0, 0, 0.14);
  }

  .guide-link.is-active {
    background: rgba(166, 181, 137, 0.22);
    border-color: rgba(166, 181, 137, 0.35);
  }

  .guide-link__icon {
    width: 16px;
    height: 16px;
    display: inline-flex;
    opacity: 0.9;
  }

  .guide-link__icon svg {
    width: 100%;
    height: 100%;
  }

  .live-link {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.85rem;
    color: var(--pine);
    text-decoration: none;
    padding: 0.25rem 0.6rem 0.25rem 0.5rem;
    border-radius: 6px;
    background: rgba(220, 38, 38, 0.08);
    border: 1px solid rgba(220, 38, 38, 0.2);
    white-space: nowrap;
    transition: all 0.15s ease;
  }

  .live-link--header {
    height: 42px;
    border-radius: 10px;
    padding: 0 12px;
  }

  .live-link:hover,
  .live-link.is-active {
    background: rgba(220, 38, 38, 0.14);
    border-color: rgba(220, 38, 38, 0.4);
  }

  .live-dot {
    width: 8px;
    height: 8px;
    background: #dc2626;
    border-radius: 50%;
    box-shadow: 0 0 6px rgba(220, 38, 38, 0.5);
    animation: pulse-dot 2s ease-in-out infinite;
  }

  .live-text {
    font-weight: 600;
    letter-spacing: 0.02em;
  }

  .connection-badge {
    display: inline-flex;
    align-items: center;
    min-height: 2rem;
    border-radius: 999px;
    padding: 0 0.75rem;
    font-size: 0.78rem;
    font-weight: 800;
    letter-spacing: 0.02em;
    white-space: nowrap;
    border: 1px solid transparent;
  }

  .connection-badge.is-offline {
    color: #8a2f2f;
    background: rgba(176, 62, 62, 0.12);
    border-color: rgba(176, 62, 62, 0.24);
  }

  .public-meta-footer {
    padding: 2.4em 1em 6em;
    background:
      linear-gradient(180deg, rgba(245, 242, 232, 0.08), rgba(0, 0, 0, 0)),
      #263226;
    color: rgba(250, 247, 237, 0.86);
    text-align: center;
    border-top: 3px solid rgba(217, 119, 6, 0.55);
  }

  .public-meta-footer.home-closing {
    padding-top: clamp(2.4rem, 6vw, 4rem);
    background:
      radial-gradient(circle at 15% 0%, rgba(244, 198, 116, 0.18), transparent 34rem),
      linear-gradient(135deg, #1f2a20 0%, #263226 56%, #354033 100%);
  }

  .home-footer-inner {
    width: min(1040px, 100%);
    margin: 0 auto 1.5rem;
    display: grid;
    gap: 1.3rem;
    justify-items: center;
  }

  .home-footer-copy {
    display: grid;
    gap: 0.6rem;
    max-width: 56rem;
    justify-items: center;
  }

  .home-footer-kicker {
    margin: 0;
    color: #f4c674;
    font-size: 0.72rem;
    font-weight: 900;
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }

  .home-footer-copy h2 {
    margin: 0;
    color: #f7f3e6;
    font-family: Oswald, Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif;
    font-size: clamp(1.85rem, 5vw, 2.8rem);
    line-height: 1.05;
    text-wrap: balance;
  }

  .home-footer-copy p {
    margin: 0;
    max-width: 58ch;
    color: rgba(250, 247, 237, 0.9);
    font-size: clamp(0.98rem, 2vw, 1.08rem);
    line-height: 1.6;
  }

  .home-footer-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
    align-items: center;
    justify-content: center;
  }

  .home-footer-link,
  .store-status-pill {
    min-height: 2.45rem;
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    padding: 0 0.95rem;
    font-size: 0.86rem;
    font-weight: 850;
    line-height: 1;
  }

  .home-footer-link {
    background: #d97706;
    color: #fffaf0;
    border: 1px solid rgba(255, 250, 240, 0.24);
    text-decoration: none;
    box-shadow: 0 10px 24px rgba(217, 119, 6, 0.2);
  }

  .home-footer-link:hover {
    background: #f09a1a;
  }

  .store-status-pill {
    color: rgba(250, 247, 237, 0.84);
    background: rgba(0, 0, 0, 0.24);
    border: 1px solid rgba(245, 242, 232, 0.22);
  }

  .footer-waitlist {
    display: grid;
    gap: 0.7rem;
    justify-items: center;
    max-width: 30rem;
    margin: 0 auto 1.6em;
  }

  .home-waitlist {
    width: min(100%, 34rem);
    max-width: 34rem;
    margin-bottom: 0;
    padding: clamp(1rem, 3vw, 1.25rem);
    border: 1px solid rgba(245, 242, 232, 0.2);
    border-radius: 0.8rem;
    background: rgba(6, 12, 7, 0.28);
    box-shadow: 0 18px 44px rgba(0, 0, 0, 0.18);
  }

  .footer-waitlist-title {
    margin: 0;
    color: #f7f3e6;
    font-family: Oswald, system-ui, sans-serif;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    font-size: 0.9rem;
  }

  .footer-waitlist :global(.waitlist-form input[type='email']) {
    background: #fffaf0;
    border-color: rgba(250, 247, 237, 0.7);
    color: #182019;
    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.18);
  }

  .footer-waitlist :global(.waitlist-form input[type='email']::placeholder) {
    color: rgba(24, 32, 25, 0.62);
  }

  .footer-waitlist :global(.waitlist-button) {
    background: #d97706;
    color: #fffaf0;
    border: 1px solid rgba(255, 250, 240, 0.22);
    box-shadow: 0 10px 24px rgba(217, 119, 6, 0.22);
  }

  .footer-waitlist :global(.waitlist-button:hover:not(:disabled)) {
    background: #f09a1a;
  }

  .footer-waitlist :global(.waitlist-done) {
    color: #f7f3e6;
  }

  .footer-waitlist :global(.waitlist-error) {
    color: #ffd1c5;
  }

  .home-waitlist :global(.waitlist-kicker) {
    color: #f4c674;
  }

  .home-waitlist :global(.waitlist-copy) {
    color: rgba(250, 247, 237, 0.86);
  }

  .home-footer-note {
    margin: 0;
    max-width: 42ch;
    color: rgba(250, 247, 237, 0.72);
    font-size: 0.82rem;
    line-height: 1.5;
  }

  .footer-rule {
    width: min(100%, 42rem);
    height: 1px;
    margin-top: 0.2rem;
    background: rgba(245, 242, 232, 0.18);
  }

  .footer-copyright {
    color: rgba(250, 247, 237, 0.78);
    font-weight: 700;
  }

  .social-links {
    display: flex;
    justify-content: center;
    gap: 1em;
    margin-top: 1em;
  }

  .social-links a {
    text-decoration: none;
    color: rgba(250, 247, 237, 0.78);
    transition:
      color 0.16s ease,
      transform 0.16s ease;
  }

  .social-links a:hover {
    color: #f4c674;
    transform: translateY(-1px);
  }

  #version-stamp {
    position: fixed;
    bottom: 4px;
    right: 4px;
    background: var(--pine, #4d594a);
    color: white;
    padding: 2px 6px;
    font-size: 10px;
    z-index: 9999;
    border-radius: 4px;
    pointer-events: none;
    opacity: 0.85;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
  }

  @keyframes pulse-dot {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }

    50% {
      opacity: 0.6;
      transform: scale(0.85);
    }
  }

  @media (max-width: 760px) {
    .logo {
      height: 32px;
    }

    .live-link,
    .guide-link {
      font-size: 0.82rem;
    }
  }

  @media (max-width: 600px) {
    .logo {
      height: 32px;
    }

    .nav-ctas {
      display: none;
    }

    .nav-controls {
      margin-left: auto;
    }
  }

  @media (max-width: 420px) {
    .nav-toggle__label {
      display: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .live-dot {
      animation: none;
    }
  }
</style>
