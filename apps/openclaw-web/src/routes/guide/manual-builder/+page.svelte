<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import type { PageData } from './$types';
  import FullGuideNav from '../../../../../../src/components/FullGuideNav.svelte';
  import GuideInlineSearch from '../../../../../../src/components/GuideInlineSearch.svelte';
  import DownloadGuideButton from '../../../../../../src/components/DownloadGuideButton.svelte';
  import GuideHighlighter from '../../../../../../src/components/GuideHighlighter.svelte';
  import FieldManualBoot from '../../../../../../src/components/field-manual/FieldManualBoot.svelte';
  import MyManualView from '../../../../../../src/components/field-manual/MyManualView.svelte';
  import ScriptureSearch from '../../../../../../src/components/field-manual/ScriptureSearch.svelte';
  import SaveButton from '../../../../../../src/components/field-manual/SaveButton.svelte';

  const { data } = $props<{ data: PageData }>();

  type Chapter = PageData['chapters'][number];

  const manualBuilderPath = '/guide/manual-builder/';

  // Derive view/corpus state from URL params (mirrors Astro's inline script behaviour)
  const viewState = $derived(
    page.url.searchParams.get('view') === 'mine' ? 'mine' : 'library'
  );
  const corpusState = $derived(
    viewState === 'library' && page.url.searchParams.get('tab') === 'scripture'
      ? 'scripture'
      : 'trail'
  );

  // Offline card reactive state
  let offlineCardClass = $state('offline-card');
  let offlineIcon = $state('DL');
  let offlineTitle = $state('Save for Offline');
  let offlineDesc = $state('Tap to save this guide for trail use without service');
  let offlineBtnText = $state('Save');
  let offlineBtnDisabled = $state(false);
  let offlineBtnClass = $state('offline-save-btn');
  let showOfflineCard = $state(true);

  function scrollToSection(id: string) {
    const element = document.getElementById(id);
    if (!element) return;
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function showSaved() {
    offlineCardClass = 'offline-card saved';
    offlineIcon = 'OK';
    offlineTitle = 'Saved for Offline';
    offlineDesc = 'Guide & Tools ready - works without cell service';
    offlineBtnText = 'Ready';
    offlineBtnDisabled = true;
    offlineBtnClass = 'offline-save-btn saved';
  }

  function showSaving() {
    offlineCardClass = 'offline-card saving';
    offlineIcon = '...';
    offlineTitle = 'Saving...';
    offlineDesc = 'Downloading guide for offline use';
    offlineBtnText = 'Saving...';
    offlineBtnDisabled = true;
  }

  function showOffline() {
    offlineCardClass = 'offline-card saved';
    offlineIcon = 'OFF';
    offlineTitle = 'Offline Mode';
    offlineDesc = 'No service - using saved content';
    offlineBtnText = 'Offline';
    offlineBtnDisabled = true;
  }

  function showReady() {
    offlineCardClass = 'offline-card';
    offlineIcon = 'DL';
    offlineTitle = 'Save for Offline';
    offlineDesc = 'Tap to save this guide for trail use without service';
    offlineBtnText = 'Save';
    offlineBtnDisabled = false;
    offlineBtnClass = 'offline-save-btn';
  }

  function checkOfflineStatus() {
    if (!navigator.onLine) {
      showOffline();
    } else if (navigator.serviceWorker.controller) {
      showSaved();
    } else {
      showReady();
    }
  }

  // Heavy guide assets are excluded from the service worker's install-time
  // precache; fetching them routes through the SW so they land in its caches.
  const OFFLINE_WARM_URLS = [
    '/guide/manual-builder',
    '/guide-search-index.json',
    '/kjv-pce.jsonl',
    '/guide-manifest.json',
    '/guide-icon-192.svg',
    '/guide-icon-512.svg'
  ];

  async function handleOfflineSave() {
    showSaving();

    try {
      await navigator.serviceWorker.ready;
      await Promise.all(
        OFFLINE_WARM_URLS.map((url) =>
          fetch(url, { credentials: 'same-origin' }).catch((err) => {
            console.warn(`[Offline] Could not warm ${url}:`, err);
          })
        )
      );
      showSaved();
    } catch (err) {
      console.error('[Offline] Save failed:', err);
      showReady();
      alert('Could not save for offline. Please try again.');
    }
  }

  onMount(() => {
    // Register header download button trigger
    const downloadBtn = document.getElementById('download-guide-btn');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('open-download-modal'));
      });
    }

    // The site-wide service worker (/service-worker.js) is registered by
    // +layout.svelte; this page only drives the offline card UI on top of it.
    if (!('serviceWorker' in navigator)) {
      showOfflineCard = false;
      return;
    }

    window.addEventListener('online', checkOfflineStatus);
    window.addEventListener('offline', checkOfflineStatus);

    checkOfflineStatus();

    return () => {
      window.removeEventListener('online', checkOfflineStatus);
      window.removeEventListener('offline', checkOfflineStatus);
    };
  });
</script>

<svelte:head>
  <title>AT Field Manual Builder Preview - Hogg Country</title>
  <meta name="description" content="Unlisted preview of the personal Field Manual builder layered on top of the AT guide." />
  <meta name="robots" content="noindex, nofollow" />
  <link rel="manifest" href="/guide-manifest.json" />
  <meta name="theme-color" content="#4d594a" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="AT Guide" />
  <link rel="apple-touch-icon" href="/guide-icon-192.svg" />
</svelte:head>

<!--
  This page renders its own full-bleed guide layout, bypassing the normal
  container/public-page-wrap. It is structured as a standalone visual shell
  (same as the Astro original) but rendered inside the SvelteKit public route.
  The guide-specific header hide/scroll behaviour is handled within FullGuideNav.
-->
<div class="manual-builder-page" data-guide-view-state={viewState} data-guide-corpus-state={corpusState}>
  <!-- Trail-nav sidebar (rendered outside wrapper like original) -->
  {#if viewState === 'library' && corpusState === 'trail'}
    <FullGuideNav chapters={data.navChapters} markdownContent={data.markdownContent} />
  {/if}

  <FieldManualBoot />

  <div class="guide-wrapper">
    <div class="guide-content-area">
      <!-- Masthead -->
      <header class="guide-masthead">
        <span class="masthead-badge">AT 2026 | NOBO | February Start</span>
        <h1 class="masthead-title">
          Appalachian Trail<br />NOBO Field Guide
        </h1>
        <p class="masthead-subtitle">Northbound: Springer -&gt; Katahdin</p>
        <p class="masthead-meta">
          2,197.4 Miles of Trail-Tested Knowledge
        </p>
        <p class="masthead-hiker">
          <span class="hiker-label">Prepared for</span>
          <span class="hiker-name hand">HoggCountry</span>
        </p>
        <div class="masthead-divider"></div>
      </header>

      <!-- Surface tabs -->
      <nav class="guide-surface-tabs" aria-label="Field Manual view">
        <a
          href={manualBuilderPath}
          data-guide-view="library"
          class="guide-surface-tab"
          class:is-active={viewState === 'library'}
        >
          Hogg Country&apos;s Field Manual
        </a>
        <a
          href="{manualBuilderPath}?view=mine"
          data-guide-view="mine"
          class="guide-surface-tab"
          class:is-active={viewState === 'mine'}
        >
          My Field Manual
        </a>
      </nav>

      <p class="manual-surface-copy" class:is-visible={viewState === 'mine'}>
        Your saved pages live here. Reorder them, add your own trail notes, and export one portable HTML file.
      </p>

      {#if data.scriptureSearchEnabled}
        <nav
          class="guide-corpus-tabs"
          class:is-visible={viewState === 'library'}
          aria-label="Field Manual corpus"
        >
          <a
            href={manualBuilderPath}
            data-guide-corpus="trail"
            class="guide-corpus-tab"
            class:is-active={corpusState === 'trail'}
          >
            Trail wisdom
          </a>
          <a
            href="{manualBuilderPath}?tab=scripture"
            data-guide-corpus="scripture"
            class="guide-corpus-tab"
            class:is-active={corpusState === 'scripture'}
          >
            Scripture
          </a>
        </nav>
      {/if}

      <!-- Trail pane -->
      {#if viewState === 'library' && corpusState === 'trail'}
        <div class="guide-pane">
          <!-- Book-Style Table of Contents -->
          <nav id="table-of-contents" class="book-toc">
            <div class="book-toc-header">
              <h2 class="book-toc-title">Table of Contents</h2>
              <p class="book-toc-subtitle">
                {data.mainChaptersCount} Chapters + {data.quickRefsCount} Quick Reference Cards
              </p>
            </div>

            <!-- Search -->
            <div class="toc-search">
              <GuideInlineSearch chapters={data.navChapters} manualEntries={data.manualEntriesBySlug} />
            </div>

            <div class="book-toc-divider"></div>

            <ol class="toc-entries">
              {#each data.chapters.filter((c: Chapter) => !c.quickRef) as chapter, index}
                <li>
                  <button class="toc-entry" type="button" onclick={() => scrollToSection(chapter.slug)}>
                    <span class="toc-entry-number">{String(index).padStart(2, '0')}</span>
                    <div class="toc-entry-content">
                      <div class="toc-entry-title">{chapter.title}</div>
                      {#if chapter.description}
                        <div class="toc-entry-desc">{chapter.description}</div>
                      {/if}
                    </div>
                    <span class="toc-entry-leader"></span>
                    <span class="toc-entry-page">Ch. {index}</span>
                  </button>
                </li>
              {/each}
            </ol>

            <!-- Quick Reference Section -->
            {#if data.quickRefsCount > 0}
              <div class="toc-section-header">
                <span class="toc-section-label">Quick Reference Cards</span>
                <span class="toc-section-line"></span>
              </div>
              <div class="toc-quick-grid">
                {#each data.chapters.filter((c: Chapter) => c.quickRef) as ref}
                  <button class="toc-quick-card" type="button" onclick={() => scrollToSection(ref.slug)}>
                    <span class="toc-quick-title">{ref.title}</span>
                    {#if ref.description}
                      <span class="toc-quick-desc">{ref.description}</span>
                    {/if}
                  </button>
                {/each}
              </div>
            {/if}

            <!-- Download & Offline -->
            <div class="toc-downloads">
              <DownloadGuideButton variant="toc" markdownContent={data.markdownContent} />
            </div>

            <!-- Offline Status Card -->
            {#if showOfflineCard}
              <div class={offlineCardClass}>
                <div class="offline-card-icon">{offlineIcon}</div>
                <div class="offline-card-content">
                  <div class="offline-card-title">{offlineTitle}</div>
                  <div class="offline-card-desc">{offlineDesc}</div>
                </div>
                <button
                  class={offlineBtnClass}
                  type="button"
                  disabled={offlineBtnDisabled}
                  onclick={handleOfflineSave}
                >
                  {offlineBtnText}
                </button>
              </div>
            {/if}
          </nav>

          <!-- Chapters -->
          {#each data.chapters as chapter}
            {@const mainIndex = data.chapters.filter((c: Chapter) => !c.quickRef).findIndex((c: Chapter) => c.slug === chapter.slug)}
            <section
              id={chapter.slug}
              class="chapter-section"
              class:quick-ref={chapter.quickRef}
            >
              {#if !chapter.quickRef}
                <span class="chapter-number-bg">{String(mainIndex).padStart(2, '0')}</span>
              {/if}

              <div class="chapter-header">
                <div class="chapter-header-row">
                  <div class="chapter-label" class:quick-ref-label={chapter.quickRef}>
                    <span class="chapter-label-line"></span>
                    <span>
                      {chapter.quickRef
                        ? 'Quick Reference'
                        : `Chapter ${String(mainIndex).padStart(2, '0')}`}
                    </span>
                  </div>
                  {#if data.manualEntriesBySlug[chapter.slug]}
                    <SaveButton entry={data.manualEntriesBySlug[chapter.slug]} compact={true} />
                  {/if}
                </div>
              </div>

              <div class="chapter-prose manual-builder-page">
                {@html chapter.html}
              </div>
            </section>
          {/each}

          <!-- Footer -->
          <footer class="guide-footer">
            <div class="footer-trail">
              <span class="trail-blaze"></span>
              <span class="trail-blaze"></span>
              <span class="trail-blaze"></span>
            </div>
            <p class="footer-text">See you on Katahdin.</p>
            <p class="footer-subtext">Happy trails, Dad.</p>
            <div class="footer-divider"></div>
            <a href="/" class="footer-link">
              <span class="link-arrow">&lt;-</span>
              <span class="link-text">hoggcountry.com</span>
            </a>
          </footer>
        </div>
      {/if}

      <!-- Scripture pane -->
      {#if data.scriptureSearchEnabled && viewState === 'library' && corpusState === 'scripture'}
        <div class="guide-pane">
          <ScriptureSearch sourceBasePath={manualBuilderPath} />
        </div>
      {/if}

      <!-- My manual pane -->
      {#if viewState === 'mine'}
        <div class="guide-pane">
          <MyManualView />
        </div>
      {/if}
    </div>
  </div>

  <!-- Hidden download button + highlighter (trail-tools pane equivalent) -->
  {#if viewState === 'library' && corpusState === 'trail'}
    <DownloadGuideButton variant="header" markdownContent={data.markdownContent} />
    <GuideHighlighter />
  {/if}
</div>

<style>
  /* ===== Root page wrapper ===== */
  .manual-builder-page {
    /* Full-bleed override — escape the container/public-page-wrap */
    margin: -1.5rem -1rem -4rem;
  }

  /* ===== Full Guide Layout ===== */
  .guide-wrapper {
    padding-top: 110px; /* Header (52px) + Progress bar (48px) + breathing room */
  }

  @media (min-width: 1025px) {
    .guide-wrapper {
      margin-left: 220px;
    }
  }

  .guide-content-area {
    max-width: 750px;
    margin: 0 auto;
    padding: 2rem 1.5rem 6rem;
  }

  .guide-surface-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    justify-content: center;
    margin-bottom: 1.5rem;
  }

  .guide-surface-tab {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 44px;
    padding: 0.75rem 1rem;
    border-radius: 999px;
    border: 1px solid var(--border);
    background: rgba(255, 255, 255, 0.75);
    color: var(--pine);
    text-decoration: none;
    font-weight: 700;
    transition: transform 0.12s ease, box-shadow 0.12s ease, border-color 0.12s ease;
  }

  .guide-surface-tab:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 18px rgba(0, 0, 0, 0.08);
    border-color: var(--alpine);
  }

  .guide-surface-tab.is-active {
    background: rgba(166, 181, 137, 0.22);
    border-color: rgba(77, 89, 74, 0.25);
    color: var(--ink);
  }

  .manual-surface-copy {
    display: none;
    margin: 0 auto 2rem;
    max-width: 56ch;
    text-align: center;
    color: var(--muted);
  }

  .manual-surface-copy.is-visible {
    display: block;
  }

  .guide-corpus-tabs {
    display: none;
    flex-wrap: wrap;
    gap: 0.75rem;
    justify-content: center;
    margin: 0 auto 1.5rem;
  }

  .guide-corpus-tabs.is-visible {
    display: flex;
  }

  .guide-corpus-tab {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 42px;
    padding: 0.65rem 0.95rem;
    border-radius: 999px;
    border: 1px solid rgba(77, 89, 74, 0.18);
    background: rgba(255, 255, 255, 0.7);
    color: var(--pine);
    text-decoration: none;
    font-weight: 700;
    transition: transform 0.12s ease, box-shadow 0.12s ease, border-color 0.12s ease;
  }

  .guide-corpus-tab:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 18px rgba(0, 0, 0, 0.08);
    border-color: rgba(77, 89, 74, 0.28);
  }

  .guide-corpus-tab.is-active {
    background: rgba(166, 181, 137, 0.18);
    border-color: rgba(77, 89, 74, 0.25);
    color: var(--ink);
  }

  /* ===== Guide Header / Masthead ===== */
  .guide-masthead {
    text-align: center;
    padding: 3rem 0 2rem;
    margin-bottom: 2rem;
  }

  .masthead-badge {
    display: inline-block;
    font-family: Oswald, sans-serif;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    color: var(--terra);
    background: rgba(217, 119, 6, 0.1);
    padding: 0.35rem 0.75rem;
    border-radius: 4px;
    margin-bottom: 1rem;
  }

  .masthead-title {
    font-family: Oswald, sans-serif;
    font-size: clamp(2.25rem, 5vw, 3.5rem);
    font-weight: 700;
    line-height: 1.1;
    color: var(--ink);
    margin: 0 0 0.5rem;
  }

  .masthead-subtitle {
    font-family: Caveat, cursive;
    font-size: 1.5rem;
    color: var(--pine);
    margin: 0 0 1.5rem;
  }

  .masthead-meta {
    font-size: 0.85rem;
    color: var(--muted);
    line-height: 1.8;
    margin: 0;
  }

  .masthead-hiker {
    margin: 1rem 0 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.15rem;
  }

  .hiker-label {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: var(--muted);
  }

  .hiker-name {
    font-size: 1.75rem;
    color: var(--pine);
    font-weight: 600;
    letter-spacing: 0.05em;
  }

  .masthead-divider {
    width: 60px;
    height: 3px;
    background: var(--alpine);
    margin: 2rem auto 0;
    border-radius: 2px;
  }

  /* ===== Book-Style Table of Contents ===== */
  .book-toc {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.8), rgba(245, 242, 232, 0.9));
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 2.5rem 2rem;
    margin-bottom: 3rem;
    position: relative;
    overflow: hidden;
  }

  .book-toc::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, var(--alpine), var(--pine), var(--terra));
  }

  .book-toc-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .book-toc-title {
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--pine);
    margin: 0 0 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.15em;
  }

  .book-toc-subtitle {
    font-family: Caveat, cursive;
    font-size: 1.1rem;
    color: var(--muted);
    margin: 0;
  }

  .toc-search {
    margin: 1.5rem 0;
  }

  .book-toc-divider {
    width: 100px;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--alpine), transparent);
    margin: 1.5rem auto;
  }

  .toc-entries {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .toc-entry {
    width: 100%;
    display: flex;
    align-items: baseline;
    padding: 0.6rem 0.5rem;
    margin: 0 -0.5rem;
    border: 0;
    background: transparent;
    border-radius: 6px;
    text-align: left;
    cursor: pointer;
    transition: background 0.15s ease;
    color: inherit;
    font: inherit;
  }

  .toc-entry:hover {
    background: rgba(166, 181, 137, 0.1);
  }

  .toc-entry:hover .toc-entry-title {
    color: var(--pine);
  }

  .toc-entry-number {
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--alpine);
    min-width: 2.5rem;
    flex-shrink: 0;
  }

  .toc-entry-content {
    flex: 1;
    min-width: 0;
  }

  .toc-entry-title {
    font-family: Oswald, sans-serif;
    font-size: 1.05rem;
    font-weight: 600;
    color: var(--ink);
    transition: color 0.15s ease;
  }

  .toc-entry-desc {
    font-size: 0.85rem;
    color: var(--muted);
    margin-top: 0.15rem;
    line-height: 1.4;
  }

  .toc-entry-leader {
    flex: 1;
    border-bottom: 1px dotted var(--stone);
    margin: 0 0.75rem;
    min-width: 20px;
    align-self: center;
    margin-bottom: 0.3rem;
  }

  .toc-entry-page {
    font-family: Oswald, sans-serif;
    font-size: 0.8rem;
    color: var(--muted);
    flex-shrink: 0;
  }

  /* Quick Reference Section in TOC */
  .toc-section-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin: 2rem 0 1rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--border);
  }

  .toc-section-label {
    font-family: Oswald, sans-serif;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: var(--terra);
    font-weight: 600;
    white-space: nowrap;
  }

  .toc-section-line {
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, var(--terra), transparent);
  }

  .toc-quick-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 0.75rem;
    margin-top: 1rem;
  }

  .toc-quick-card {
    display: flex;
    flex-direction: column;
    gap: 0;
    padding: 0.75rem 1rem;
    text-align: left;
    background: var(--marker);
    border: 2px solid #e0d400;
    border-radius: 8px;
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
    font: inherit;
  }

  .toc-quick-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .toc-quick-title {
    font-weight: 700;
    font-size: 0.9rem;
    color: #2b2f26;
  }

  .toc-quick-desc {
    font-size: 0.75rem;
    color: #4a4a40;
    margin-top: 0.15rem;
  }

  /* Download buttons in TOC */
  .toc-downloads {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--border);
  }

  /* Offline Save Card */
  .offline-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-top: 1.25rem;
    padding: 1rem 1.25rem;
    background: linear-gradient(135deg, rgba(166, 181, 137, 0.15), rgba(166, 181, 137, 0.05));
    border: 2px solid var(--alpine);
    border-radius: 12px;
    transition: all 0.2s ease;
  }

  :global(.offline-card.saved) {
    background: linear-gradient(135deg, rgba(166, 181, 137, 0.25), rgba(166, 181, 137, 0.1));
    border-color: var(--pine);
  }

  :global(.offline-card.saving) {
    background: linear-gradient(135deg, rgba(240, 224, 0, 0.2), rgba(240, 224, 0, 0.05));
    border-color: #d4c800;
  }

  .offline-card-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
  }

  .offline-card-content {
    flex: 1;
    min-width: 0;
  }

  .offline-card-title {
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 600;
    color: var(--pine);
  }

  .offline-card-desc {
    font-size: 0.8rem;
    color: var(--muted);
    margin-top: 0.15rem;
  }

  .offline-save-btn {
    padding: 0.5rem 1rem;
    background: var(--pine);
    color: #fff;
    border: none;
    border-radius: 6px;
    font-family: inherit;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
  }

  .offline-save-btn:hover {
    background: var(--ink);
    transform: translateY(-1px);
  }

  .offline-save-btn:disabled {
    background: var(--muted);
    cursor: not-allowed;
    transform: none;
  }

  :global(.offline-save-btn.saved) {
    background: var(--alpine);
  }

  /* ===== Chapter Sections ===== */
  .chapter-section {
    scroll-margin-top: 110px;
    padding: 3rem 0;
    border-bottom: 1px dashed var(--border);
    position: relative;
  }

  .chapter-section:last-child {
    border-bottom: none;
  }

  .chapter-section.quick-ref {
    background: linear-gradient(to right, rgba(240, 224, 0, 0.03), transparent);
    margin: 0 -1.5rem;
    padding: 3rem 1.5rem;
  }

  .chapter-number-bg {
    position: absolute;
    top: 2rem;
    right: 0;
    font-family: Oswald, sans-serif;
    font-size: 8rem;
    font-weight: 700;
    color: var(--pine);
    opacity: 0.03;
    line-height: 1;
    pointer-events: none;
    user-select: none;
  }

  .chapter-header {
    margin-bottom: 2rem;
    position: relative;
  }

  .chapter-header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .chapter-label {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-family: Oswald, sans-serif;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: var(--muted);
    margin-bottom: 0.5rem;
  }

  .chapter-label-line {
    width: 30px;
    height: 1px;
    background: var(--stone);
  }

  .chapter-label.quick-ref-label {
    color: var(--terra);
  }

  .chapter-label.quick-ref-label .chapter-label-line {
    background: var(--terra);
  }

  /* ===== Prose Typography ===== */
  /* Using :global() because {@html chapter.html} creates dynamic DOM */
  .manual-builder-page :global(.chapter-prose h1) {
    font-family: Oswald, sans-serif;
    font-size: 2rem;
    font-weight: 700;
    color: var(--ink);
    margin: 0 0 1.5rem;
    line-height: 1.2;
  }

  .manual-builder-page :global(.chapter-prose h2) {
    font-family: Oswald, sans-serif;
    font-size: 1.4rem;
    font-weight: 600;
    color: var(--pine);
    margin: 2.5rem 0 1rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--border);
  }

  .manual-builder-page :global(.chapter-prose h2:first-of-type) {
    border-top: none;
    padding-top: 0;
  }

  .manual-builder-page :global(.chapter-prose h3) {
    font-family: Oswald, sans-serif;
    font-size: 1.15rem;
    font-weight: 600;
    color: var(--pine);
    margin: 2rem 0 0.75rem;
  }

  .manual-builder-page :global(.chapter-prose h4) {
    font-size: 1rem;
    font-weight: 600;
    color: var(--ink);
    margin: 1.5rem 0 0.5rem;
  }

  .manual-builder-page :global(.chapter-prose p) {
    margin: 1.25rem 0;
  }

  .manual-builder-page :global(.chapter-prose ul),
  .manual-builder-page :global(.chapter-prose ol) {
    margin: 1.25rem 0;
    padding-left: 1.5rem;
  }

  .manual-builder-page :global(.chapter-prose li) {
    margin: 0.5rem 0;
  }

  .manual-builder-page :global(.chapter-prose li::marker) {
    color: var(--alpine);
  }

  .manual-builder-page :global(.chapter-prose blockquote) {
    position: relative;
    margin: 2rem 0;
    padding: 1.25rem 1.5rem 1.25rem 2rem;
    background: linear-gradient(135deg, rgba(166, 181, 137, 0.08), rgba(166, 181, 137, 0.03));
    border-left: 4px solid var(--alpine);
    border-radius: 0 8px 8px 0;
    font-style: italic;
    color: var(--pine);
  }

  .manual-builder-page :global(.chapter-prose blockquote::before) {
    content: '"';
    position: absolute;
    top: 0.5rem;
    left: 0.75rem;
    font-family: Georgia, serif;
    font-size: 2rem;
    color: var(--alpine);
    opacity: 0.3;
    line-height: 1;
  }

  .manual-builder-page :global(.chapter-prose blockquote p) {
    margin: 0;
  }

  .manual-builder-page :global(.chapter-prose strong) {
    color: var(--ink);
    font-weight: 600;
  }

  .manual-builder-page :global(.chapter-prose table) {
    position: relative;
    display: block;
    width: 100%;
    margin: 2rem 0;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }

  .manual-builder-page :global(.chapter-prose table thead),
  .manual-builder-page :global(.chapter-prose table tbody),
  .manual-builder-page :global(.chapter-prose table tr) {
    display: table;
    width: 100%;
    table-layout: fixed;
  }

  .manual-builder-page :global(.chapter-prose table thead) {
    position: sticky;
    top: 0;
    z-index: 1;
  }

  .manual-builder-page :global(.chapter-prose th) {
    text-align: left;
    padding: 0.75rem 1rem;
    background: linear-gradient(to bottom, var(--pine), #3d4a3a);
    color: #f5f2e8;
    font-family: Oswald, sans-serif;
    font-weight: 600;
    font-size: 0.8rem;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .manual-builder-page :global(.chapter-prose td) {
    padding: 0.625rem 1rem;
    border-bottom: 1px solid var(--border);
    vertical-align: top;
    font-size: 0.9rem;
    line-height: 1.5;
  }

  .manual-builder-page :global(.chapter-prose tbody tr:nth-child(even)) {
    background: rgba(166, 181, 137, 0.06);
  }

  .manual-builder-page :global(.chapter-prose tbody tr:hover) {
    background: rgba(166, 181, 137, 0.12);
  }

  .manual-builder-page :global(.chapter-prose tr:last-child td) {
    border-bottom: none;
  }

  .manual-builder-page :global(.chapter-prose td strong) {
    color: var(--pine);
    font-weight: 700;
  }

  .manual-builder-page :global(.chapter-prose code) {
    font-family: 'SF Mono', Menlo, Monaco, monospace;
    font-size: 0.85em;
    background: rgba(77, 89, 74, 0.08);
    padding: 0.15rem 0.4rem;
    border-radius: 4px;
    color: var(--pine);
  }

  .manual-builder-page :global(.chapter-prose pre) {
    margin: 2rem 0;
    padding: 1.25rem;
    background: #2b2f26;
    border-radius: 8px;
    overflow-x: auto;
  }

  .manual-builder-page :global(.chapter-prose pre code) {
    background: none;
    padding: 0;
    color: #e8e6e1;
    font-size: 0.85rem;
    line-height: 1.6;
  }

  .manual-builder-page :global(.chapter-prose hr) {
    border: none;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--border), transparent);
    margin: 3rem 0;
  }

  .manual-builder-page :global(.chapter-prose a) {
    color: var(--pine);
    text-decoration: underline;
    text-decoration-color: var(--alpine);
    text-underline-offset: 3px;
    transition: color 0.15s ease;
  }

  .manual-builder-page :global(.chapter-prose a:hover) {
    color: var(--terra);
  }

  /* ===== chapter-prose base styles (non-dynamic elements) ===== */
  .chapter-prose {
    font-size: 1.05rem;
    line-height: 1.85;
    color: var(--fg);
  }

  /* ===== Guide Footer ===== */
  .guide-footer {
    text-align: center;
    padding: 5rem 0 3rem;
    margin-top: 4rem;
    position: relative;
  }

  .guide-footer::before {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 200px;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--alpine), transparent);
  }

  .footer-trail {
    display: flex;
    justify-content: center;
    gap: 0.75rem;
    margin-bottom: 2rem;
  }

  .trail-blaze {
    width: 12px;
    height: 20px;
    background: var(--marker);
    border-radius: 2px;
    opacity: 0.9;
    transform: rotate(-2deg);
  }

  .trail-blaze:nth-child(2) {
    transform: rotate(1deg);
    opacity: 0.7;
  }

  .trail-blaze:nth-child(3) {
    transform: rotate(-1deg);
    opacity: 0.5;
  }

  .footer-text {
    font-family: Caveat, cursive;
    font-size: 2.25rem;
    color: var(--pine);
    margin: 0 0 0.25rem;
    line-height: 1.2;
  }

  .footer-subtext {
    font-family: Caveat, cursive;
    font-size: 1.35rem;
    color: var(--muted);
    margin: 0 0 2rem;
    opacity: 0.8;
  }

  .footer-divider {
    width: 40px;
    height: 2px;
    background: var(--stone);
    margin: 0 auto 1.5rem;
    border-radius: 1px;
  }

  .footer-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--muted);
    text-decoration: none;
    font-size: 0.85rem;
    letter-spacing: 0.02em;
    transition: all 0.2s ease;
  }

  .footer-link:hover {
    color: var(--pine);
  }

  .footer-link:hover .link-arrow {
    transform: translateX(-3px);
  }

  .link-arrow {
    font-size: 1rem;
    transition: transform 0.2s ease;
  }

  .link-text {
    border-bottom: 1px solid transparent;
    transition: border-color 0.2s ease;
  }

  .footer-link:hover .link-text {
    border-bottom-color: var(--alpine);
  }

  /* ===== Highlight Styles ===== */
  :global(.guide-highlight) {
    cursor: pointer;
    border-radius: 2px;
    padding: 1px 0;
    transition: all 0.15s ease;
  }

  :global(.guide-highlight:hover) {
    filter: brightness(0.95);
  }

  :global(.guide-highlight--yellow) {
    background: rgba(254, 240, 138, 0.8);
    box-shadow: 0 0 0 2px rgba(254, 240, 138, 0.3);
  }

  :global(.guide-highlight--blue) {
    background: rgba(191, 219, 254, 0.8);
    box-shadow: 0 0 0 2px rgba(191, 219, 254, 0.3);
  }

  :global(.guide-highlight--green) {
    background: rgba(187, 247, 208, 0.8);
    box-shadow: 0 0 0 2px rgba(187, 247, 208, 0.3);
  }

  :global(.guide-highlight--pink) {
    background: rgba(251, 207, 232, 0.8);
    box-shadow: 0 0 0 2px rgba(251, 207, 232, 0.3);
  }

  /* ===== Print Styles ===== */
  @media print {
    .guide-wrapper {
      margin-left: 0;
      padding-top: 0;
    }

    .guide-content-area {
      max-width: none;
      padding: 0.5in;
    }

    .guide-masthead {
      padding: 0.25in 0 0.5in;
      border-bottom: 2pt solid #333;
      margin-bottom: 0.25in;
    }

    .masthead-badge {
      background: none;
      border: 1pt solid #333;
    }

    .masthead-divider {
      display: none;
    }

    .book-toc {
      border: 1pt solid #666;
      padding: 0.25in;
      margin-bottom: 0.5in;
      background: #f9f9f9 !important;
    }

    .book-toc::before {
      display: none;
    }

    .toc-search,
    .toc-downloads {
      display: none !important;
    }

    .toc-entry {
      padding: 0.15in 0;
    }

    .toc-entry-desc {
      display: none;
    }

    .toc-quick-grid {
      gap: 0.1in;
    }

    .toc-quick-card {
      padding: 0.1in;
      border: 1pt solid #999;
      background: #fff !important;
    }

    .chapter-section {
      padding: 0.25in 0;
      border-bottom: 0.5pt solid #ccc;
      page-break-inside: auto;
    }

    .chapter-section.quick-ref {
      background: none !important;
      margin: 0;
      padding: 0.25in 0;
    }

    .chapter-number-bg {
      display: none;
    }

    .guide-footer {
      display: none;
    }

    :global(.guide-highlight) {
      background: none !important;
      box-shadow: none !important;
    }
  }

  /* ===== Responsive ===== */
  @media (max-width: 1024px) {
    .guide-wrapper {
      margin-left: 0;
    }
  }

  @media (max-width: 600px) {
    .guide-content-area {
      padding: 1.5rem 1rem 5rem;
    }

    .guide-surface-tabs {
      flex-direction: column;
    }

    .guide-surface-tab {
      width: 100%;
    }

    .guide-corpus-tabs {
      flex-direction: column;
    }

    .guide-corpus-tab {
      width: 100%;
    }

    .guide-masthead {
      padding: 2rem 0 1.5rem;
    }

    .masthead-title {
      font-size: 2rem;
    }

    .masthead-subtitle {
      font-size: 1.25rem;
    }

    .book-toc {
      padding: 1.5rem 1rem;
    }

    .toc-entry-leader {
      display: none;
    }

    .toc-entry-page {
      display: none;
    }

    .toc-entry {
      flex-direction: column;
      gap: 0.15rem;
    }

    .toc-entry-number {
      font-size: 0.75rem;
    }

    .toc-downloads {
      flex-direction: column;
    }

    .chapter-section {
      padding: 2rem 0;
    }

    .chapter-header-row {
      flex-direction: column;
      align-items: flex-start;
    }

    .chapter-number-bg {
      font-size: 5rem;
      top: 1.5rem;
    }

    .chapter-prose {
      font-size: 1rem;
    }
  }
</style>
