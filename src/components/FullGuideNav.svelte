<script>
  import { onMount } from 'svelte';

  let { chapters = [], markdownContent = '', currentSlug = '' } = $props();

  // When currentSlug is set, the nav is rendered on a single-chapter page
  // (no inline .chapter-section sections to scroll between). In that mode the
  // TOC items navigate to /guide/<slug> instead of scrolling, and the active
  // chapter is the one being viewed.
  let isChapterPage = $derived(Boolean(currentSlug));

  // observedChapter is updated by the IntersectionObserver on the index page
  // (where multiple sections share the viewport). On a chapter page, the
  // active item is simply the current slug.
  let observedChapter = $state('');
  let activeChapter = $derived(isChapterPage ? currentSlug : observedChapter);
  let showMobileNav = $state(false);
  let headerHidden = $state(false);
  let headerHeight = $state(52);
  let dragPointerId = null;

  // Use svelte:window binding for scroll position (most reliable in Svelte 5)
  let scrollY = $state(0);
  let innerHeight = $state(0);
  let scrollHeight = $state(1);
  let progressTrackEl = $state(null);
  let isScrubbing = $state(false);
  let scrubPreview = $state(null);

  // Throttle flag for scroll height updates
  let scrollHeightPending = false;

  // Derived values for progress bar
  let docHeight = $derived(scrollHeight - innerHeight);
  let progress = $derived(docHeight > 0 ? Math.min((scrollY / docHeight) * 100, 100) : 0);
  let displayedProgress = $derived(scrubPreview ?? progress);
  let showBackToTop = $derived(scrollY > 500);

  // Throttled scroll height update using rAF
  function updateScrollHeightThrottled() {
    if (scrollHeightPending) return;
    scrollHeightPending = true;
    requestAnimationFrame(() => {
      scrollHeight = document.documentElement.scrollHeight;
      scrollHeightPending = false;
    });
  }

  onMount(() => {
    // Get initial scroll height
    scrollHeight = document.documentElement.scrollHeight;

    // Watch for header wrapper visibility changes + keep a real header height offset
    let mutationObserver = null;
    let resizeObserver = null;
    const headerWrapper = document.querySelector('.guide-header-wrapper');

    const syncHeaderMetrics = () => {
      if (!headerWrapper) return;
      headerHidden = headerWrapper.classList.contains('is-hidden');
      headerHeight = Math.ceil(headerWrapper.getBoundingClientRect().height || 52);
    };

    if (headerWrapper) {
      syncHeaderMetrics();
      mutationObserver = new MutationObserver(syncHeaderMetrics);
      mutationObserver.observe(headerWrapper, {
        attributes: true,
        attributeFilter: ['class', 'style']
      });
      resizeObserver = new ResizeObserver(syncHeaderMetrics);
      resizeObserver.observe(headerWrapper);
    }

    // Single-chapter pages set activeChapter from the slug prop; skip the
    // observer there so we don't fight the explicit value.
    let intersectionObserver = null;
    if (!isChapterPage) {
      const sections = document.querySelectorAll('.chapter-section');
      const observerOptions = {
        root: null,
        rootMargin: '-20% 0px -70% 0px',
        threshold: 0
      };

      intersectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            observedChapter = entry.target.id;
          }
        });
      }, observerOptions);

      sections.forEach(section => intersectionObserver.observe(section));
    }

    // Update scrollHeight on resize (in case content changes)
    const updateScrollHeight = () => {
      scrollHeight = document.documentElement.scrollHeight;
      syncHeaderMetrics();
    };

    window.addEventListener('resize', updateScrollHeight, { passive: true });

    return () => {
      intersectionObserver?.disconnect();
      mutationObserver?.disconnect();
      resizeObserver?.disconnect();
      window.removeEventListener('resize', updateScrollHeight);
    };
  });

  function scrollToChapter(id) {
    if (isChapterPage) {
      // On a chapter page, TOC items navigate to the chosen chapter rather
      // than trying to scroll to an inline section that doesn't exist here.
      showMobileNav = false;
      if (id === currentSlug) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      window.location.href = `/guide/${id}`;
      return;
    }
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      showMobileNav = false;
    }
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function scrollToTOC() {
    if (isChapterPage) {
      window.location.href = '/guide#table-of-contents';
      return;
    }
    const toc = document.getElementById('table-of-contents');
    if (toc) {
      const offset = 80;
      const top = toc.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function getMaxScroll() {
    scrollHeight = document.documentElement.scrollHeight;
    return Math.max(0, scrollHeight - window.innerHeight);
  }

  function scrollToProgress(percent, behavior = 'auto') {
    const maxScroll = getMaxScroll();
    const nextPercent = clamp(percent, 0, 100);
    window.scrollTo({ top: (nextPercent / 100) * maxScroll, behavior });
  }

  function scrubToClientX(clientX, behavior = 'auto') {
    if (!progressTrackEl) return;

    const rect = progressTrackEl.getBoundingClientRect();
    const nextPercent = clamp(((clientX - rect.left) / rect.width) * 100, 0, 100);
    scrubPreview = nextPercent;
    scrollToProgress(nextPercent, behavior);
  }

  function handleScrubStart(event) {
    event.preventDefault();
    isScrubbing = true;
    dragPointerId = event.pointerId;
    progressTrackEl?.setPointerCapture?.(event.pointerId);
    scrubToClientX(event.clientX);
  }

  function handleScrubMove(event) {
    if (!isScrubbing) return;
    if (dragPointerId !== null && event.pointerId !== dragPointerId) return;
    event.preventDefault();
    scrubToClientX(event.clientX);
  }

  function handleScrubEnd(event) {
    if (!isScrubbing) return;
    if (dragPointerId !== null && event.pointerId !== dragPointerId) return;
    progressTrackEl?.releasePointerCapture?.(event.pointerId);
    scrubToClientX(event.clientX);
    isScrubbing = false;
    dragPointerId = null;
    scrubPreview = null;
  }

  function handleProgressKeydown(event) {
    const current = clamp(progress, 0, 100);
    let next = current;

    if (event.key === 'ArrowLeft') next = current - 5;
    else if (event.key === 'ArrowRight') next = current + 5;
    else if (event.key === 'PageUp') next = current - 10;
    else if (event.key === 'PageDown') next = current + 10;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = 100;
    else return;

    event.preventDefault();
    scrollToProgress(next, 'smooth');
  }

  function openDownloadModal() {
    window.dispatchEvent(new CustomEvent('open-download-modal'));
    showMobileNav = false;
  }

  // Separate main chapters from quick refs
  let mainChapters = $derived(chapters.filter(c => !c.data.quickRef));
  let quickRefs = $derived(chapters.filter(c => c.data.quickRef));
</script>

<!-- Progress Bar -->
<div class="progress-container" style={`top: ${headerHidden ? 0 : headerHeight}px`}>
  <div
    class="progress-track"
    class:scrubbing={isScrubbing}
    bind:this={progressTrackEl}
    role="slider"
    tabindex="0"
    aria-label="Guide progress"
    aria-valuemin="0"
    aria-valuemax="100"
    aria-valuenow={Math.round(displayedProgress)}
    aria-valuetext={`${Math.round(displayedProgress)}% through the guide`}
    onpointerdown={handleScrubStart}
    onpointermove={handleScrubMove}
    onpointerup={handleScrubEnd}
    onpointercancel={handleScrubEnd}
    onkeydown={handleProgressKeydown}
  >
    <div class="progress-fill" style="width: {displayedProgress}%"></div>
    <div class="progress-marker" style="left: {displayedProgress}%">
      <span class="marker-dot"></span>
    </div>
  </div>
  <div class="progress-labels">
    <span class="progress-start">Springer</span>
    <span class="progress-percent">{Math.round(displayedProgress)}%</span>
    <span class="progress-end">Katahdin</span>
  </div>
</div>

<!-- Desktop Sidebar -->
<nav class="sidebar" style={`top: ${headerHidden ? 48 : Math.ceil(headerHeight + 48)}px`} aria-label="Table of Contents">
  <div class="sidebar-header">
    <span class="sidebar-icon">📖</span>
    <span class="sidebar-title">Contents</span>
  </div>

  <div class="sidebar-scroll">
    <ul class="toc-list">
      {#each mainChapters as chapter, i (chapter.id)}
        <li>
          <button
            class="toc-item"
            class:active={activeChapter === chapter.id}
            onclick={() => scrollToChapter(chapter.id)}
          >
            <span class="toc-number">{String(i).padStart(2, '0')}</span>
            <span class="toc-text">{chapter.data.title}</span>
          </button>
        </li>
      {/each}
    </ul>

    {#if quickRefs.length > 0}
      <div class="toc-divider"></div>
      <div class="toc-section-label">Quick Reference</div>
      <ul class="toc-list toc-list-quick">
        {#each quickRefs as ref (ref.id)}
          <li>
            <button
              class="toc-item toc-item-quick"
              class:active={activeChapter === ref.id}
              onclick={() => scrollToChapter(ref.id)}
            >
              <span class="toc-text">{ref.data.title}</span>
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>

  <div class="sidebar-footer">
    <button class="toc-link" onclick={scrollToTOC}>
      <span>↑ Table of Contents</span>
    </button>
    <button class="download-btn full-width" onclick={openDownloadModal} title="Download Field Guide">
      <span class="download-icon">↓</span>
      <span>Download</span>
    </button>
  </div>
</nav>

<!-- Mobile Nav Toggle -->
<button
  class="mobile-nav-toggle"
  class:open={showMobileNav}
  onclick={() => showMobileNav = !showMobileNav}
  aria-label="Toggle navigation"
>
  <span class="toggle-icon">☰</span>
  <span class="toggle-label">Contents</span>
</button>

<!-- Mobile Nav Drawer -->
{#if showMobileNav}
  <button
    type="button"
    class="mobile-overlay"
    onclick={() => showMobileNav = false}
    aria-label="Close guide navigation"
  ></button>
  <div class="mobile-drawer">
    <div class="drawer-header">
      <span>Field Guide Contents</span>
      <button class="drawer-close" onclick={() => showMobileNav = false}>×</button>
    </div>
    <div class="drawer-scroll">
      <!-- Download button at top of mobile drawer -->
      <div class="drawer-downloads">
        <button class="drawer-download-btn" onclick={openDownloadModal}>
          <span>↓</span> Download Guide
        </button>
      </div>
      <div class="drawer-divider"></div>

      <ul class="drawer-list">
        {#each mainChapters as chapter, i (chapter.id)}
          <li>
            <button
              class="drawer-item"
              class:active={activeChapter === chapter.id}
              onclick={() => scrollToChapter(chapter.id)}
            >
              <span class="drawer-number">{String(i).padStart(2, '0')}</span>
              <span class="drawer-text">{chapter.data.title}</span>
            </button>
          </li>
        {/each}
      </ul>
      {#if quickRefs.length > 0}
        <div class="drawer-divider"></div>
        <div class="drawer-section-label">Quick Reference</div>
        <ul class="drawer-list">
          {#each quickRefs as ref (ref.id)}
            <li>
              <button
                class="drawer-item"
                class:active={activeChapter === ref.id}
                onclick={() => scrollToChapter(ref.id)}
              >
                <span class="drawer-text">{ref.data.title}</span>
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  </div>
{/if}

<!-- Back to Top -->
{#if showBackToTop}
  <button class="back-to-top" onclick={scrollToTop} aria-label="Back to top">
    <span class="top-arrow">↑</span>
    <span class="top-label">Top</span>
  </button>
{/if}

<!-- Svelte window bindings for scroll tracking -->
<svelte:window
  bind:scrollY={scrollY}
  bind:innerHeight={innerHeight}
  onscroll={updateScrollHeightThrottled}
/>

<style>
  /* ===== Progress Bar ===== */
  .progress-container {
    position: fixed;
    left: 0;
    right: 0;
    z-index: 1002; /* Above page content, below the fixed guide header wrapper */
    background: linear-gradient(to bottom, rgba(245, 242, 232, 0.98), rgba(245, 242, 232, 0.95));
    backdrop-filter: blur(8px);
    padding: 0.9rem 1rem 0.45rem;
    border-bottom: 1px solid var(--border, #e6e1d4);
    transition: top 0.3s ease;
  }

  /* Mobile: extra top padding to prevent marker clipping */
  @media (max-width: 600px) {
    .progress-container {
      padding-top: 0.95rem;
    }
  }

  .progress-track {
    position: relative;
    height: 8px;
    background: linear-gradient(90deg,
      var(--stone, #ccc) 0%,
      var(--stone, #ccc) 100%
    );
    border-radius: 999px;
    overflow: visible;
    cursor: grab;
    touch-action: none;
    user-select: none;
  }

  .progress-track::before {
    content: '';
    position: absolute;
    inset: -12px 0;
  }

  .progress-track:focus-visible {
    outline: 2px solid var(--terra, #d97706);
    outline-offset: 8px;
  }

  .progress-track.scrubbing {
    cursor: grabbing;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg,
      var(--alpine, #a6b589) 0%,
      var(--pine, #4d594a) 100%
    );
    border-radius: 999px;
    transition: width 0.1s ease-out;
  }

  .progress-track.scrubbing .progress-fill,
  .progress-track.scrubbing .progress-marker {
    transition: none;
  }

  .progress-marker {
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    transition: left 0.1s ease-out;
  }

  .marker-dot {
    display: block;
    width: 18px;
    height: 18px;
    background: var(--marker, #f0e000);
    border: 3px solid var(--pine, #4d594a);
    border-radius: 50%;
    box-shadow: 0 0 0 4px rgba(245, 242, 232, 0.95), 0 2px 10px rgba(0,0,0,0.22);
    pointer-events: none;
  }

  .progress-labels {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 0.35rem;
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--muted, #5c665a);
  }

  .progress-percent {
    font-family: Oswald, sans-serif;
    font-weight: 600;
    color: var(--pine, #4d594a);
    font-size: 0.75rem;
  }

  /* ===== Desktop Sidebar ===== */
  .sidebar {
    position: fixed;
    left: 0;
    bottom: 0;
    width: 220px;
    transition: top 0.3s ease;
    background: rgba(245, 242, 232, 0.95);
    backdrop-filter: blur(10px);
    border-right: 1px solid var(--border, #e6e1d4);
    display: flex;
    flex-direction: column;
    z-index: 100;
  }

  @media (max-width: 1024px) {
    .sidebar {
      display: none;
    }
  }

  .sidebar-header {
    padding: 1.25rem 1rem 1rem;
    border-bottom: 1px solid var(--border, #e6e1d4);
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .sidebar-icon {
    font-size: 1.1rem;
  }

  .sidebar-title {
    font-family: Oswald, sans-serif;
    font-weight: 600;
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--pine, #4d594a);
  }

  .sidebar-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 0.75rem 0;
  }

  .toc-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .toc-item {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    width: 100%;
    padding: 0.45rem 1rem;
    background: transparent;
    border: none;
    text-align: left;
    cursor: pointer;
    font-size: 0.8rem;
    color: var(--muted, #5c665a);
    transition: all 0.15s ease;
    border-left: 3px solid transparent;
  }

  .toc-item:hover {
    color: var(--pine, #4d594a);
    background: rgba(166, 181, 137, 0.1);
  }

  .toc-item.active {
    color: var(--pine, #4d594a);
    font-weight: 600;
    background: rgba(166, 181, 137, 0.15);
    border-left-color: var(--alpine, #a6b589);
  }

  .toc-number {
    font-family: Oswald, sans-serif;
    font-size: 0.7rem;
    opacity: 0.5;
    min-width: 1.2rem;
  }

  .toc-text {
    line-height: 1.3;
  }

  .toc-divider {
    height: 1px;
    background: var(--border, #e6e1d4);
    margin: 0.75rem 1rem;
  }

  .toc-section-label {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--terra, #d97706);
    padding: 0 1rem;
    margin-bottom: 0.5rem;
    font-weight: 600;
  }

  .toc-item-quick {
    padding-left: 1.5rem;
    font-size: 0.75rem;
  }

  .sidebar-footer {
    padding: 0.75rem;
    border-top: 1px solid var(--border, #e6e1d4);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .download-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    padding: 0.6rem 0.75rem;
    background: var(--pine, #4d594a);
    color: #fff;
    border: none;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .download-btn:hover {
    background: var(--ink, #2b2f26);
    transform: translateY(-1px);
  }

  .download-btn.full-width {
    width: 100%;
  }

  .download-icon {
    font-size: 1rem;
  }

  .toc-link {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.4rem 0.75rem;
    background: transparent;
    border: 1px solid var(--border, #e6e1d4);
    border-radius: 6px;
    font-size: 0.7rem;
    color: var(--muted, #5c665a);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .toc-link:hover {
    border-color: var(--alpine, #a6b589);
    color: var(--pine, #4d594a);
  }

  /* ===== Mobile Nav Toggle ===== */
  .mobile-nav-toggle {
    display: none;
    position: fixed;
    bottom: 1.5rem;
    left: 1.5rem;
    z-index: 500;
    padding: 0.75rem 1rem;
    background: var(--pine, #4d594a);
    color: #fff;
    border: none;
    border-radius: 25px;
    font-size: 0.85rem;
    cursor: pointer;
    box-shadow: 0 4px 20px rgba(0,0,0,0.25);
    transition: all 0.2s ease;
    align-items: center;
    gap: 0.5rem;
  }

  @media (max-width: 1024px) {
    .mobile-nav-toggle {
      display: flex;
    }
  }

  .mobile-nav-toggle:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 25px rgba(0,0,0,0.3);
  }

  .mobile-nav-toggle.open {
    background: var(--terra, #d97706);
  }

  .toggle-icon {
    font-size: 1rem;
  }

  .toggle-label {
    font-weight: 600;
  }

  /* ===== Mobile Overlay & Drawer ===== */
  .mobile-overlay {
    display: none;
    position: fixed;
    inset: 0;
    padding: 0;
    background: rgba(0,0,0,0.4);
    border: 0;
    z-index: 1100;
    animation: fadeIn 0.2s ease;
    cursor: pointer;
  }

  @media (max-width: 1024px) {
    .mobile-overlay {
      display: block;
    }
  }

  .mobile-drawer {
    display: none;
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    width: min(320px, 85vw);
    background: var(--bg, #f5f2e8);
    z-index: 1110;
    animation: slideIn 0.25s ease;
    flex-direction: column;
  }

  @media (max-width: 1024px) {
    .mobile-drawer {
      display: flex;
    }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideIn {
    from { transform: translateX(-100%); }
    to { transform: translateX(0); }
  }

  .drawer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 1rem;
    border-bottom: 1px solid var(--border, #e6e1d4);
    font-family: Oswald, sans-serif;
    font-weight: 600;
    color: var(--pine, #4d594a);
  }

  .drawer-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    color: var(--muted, #5c665a);
    cursor: pointer;
    padding: 0.25rem;
    line-height: 1;
  }

  .drawer-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 1rem 0;
  }

  .drawer-downloads {
    display: flex;
    gap: 0.5rem;
    padding: 0 1rem;
    margin-bottom: 0.5rem;
  }

  .drawer-download-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background: var(--pine, #4d594a);
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
  }

  .drawer-download-btn:active {
    transform: scale(0.98);
  }

  .drawer-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .drawer-item {
    display: flex;
    align-items: baseline;
    gap: 0.75rem;
    width: 100%;
    padding: 0.75rem 1.25rem;
    background: transparent;
    border: none;
    text-align: left;
    cursor: pointer;
    font-size: 0.95rem;
    color: var(--fg, #333);
    border-left: 3px solid transparent;
  }

  .drawer-item:hover,
  .drawer-item.active {
    background: rgba(166, 181, 137, 0.15);
    border-left-color: var(--alpine, #a6b589);
  }

  .drawer-number {
    font-family: Oswald, sans-serif;
    font-size: 0.8rem;
    opacity: 0.4;
    min-width: 1.5rem;
  }

  .drawer-divider {
    height: 1px;
    background: var(--border, #e6e1d4);
    margin: 1rem 1.25rem;
  }

  .drawer-section-label {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--terra, #d97706);
    padding: 0 1.25rem;
    margin-bottom: 0.5rem;
    font-weight: 600;
  }

  /* ===== Back to Top ===== */
  .back-to-top {
    position: fixed;
    bottom: 1.5rem;
    right: 1.5rem;
    z-index: 500;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.15rem;
    padding: 0.6rem 0.8rem;
    background: var(--card, #fff);
    border: 1px solid var(--border, #e6e1d4);
    border-radius: 8px;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    transition: all 0.2s ease;
    animation: fadeUp 0.3s ease;
  }

  @keyframes fadeUp {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .back-to-top:hover {
    border-color: var(--alpine, #a6b589);
    transform: translateY(-3px);
    box-shadow: 0 6px 20px rgba(0,0,0,0.15);
  }

  .top-arrow {
    font-size: 1rem;
    color: var(--pine, #4d594a);
  }

  .top-label {
    font-size: 0.6rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--muted, #5c665a);
  }

  /* Print: hide nav elements */
  @media print {
    .progress-container,
    .sidebar,
    .mobile-nav-toggle,
    .mobile-overlay,
    .mobile-drawer,
    .back-to-top {
      display: none !important;
    }
  }
</style>
