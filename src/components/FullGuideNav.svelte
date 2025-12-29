<script>
  import { onMount } from 'svelte';

  export let chapters = [];
  export let markdownContent = '';

  let activeChapter = '';
  let progress = 0;
  let showMobileNav = false;
  let showBackToTop = false;

  onMount(() => {
    const sections = document.querySelectorAll('.chapter-section');
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -70% 0px',
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          activeChapter = entry.target.id;
        }
      });
    }, observerOptions);

    sections.forEach(section => observer.observe(section));

    // Progress tracking
    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      progress = Math.min((scrollTop / docHeight) * 100, 100);
      showBackToTop = scrollTop > 500;
    };

    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', updateProgress);
    };
  });

  function scrollToChapter(id) {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const top = element.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
      showMobileNav = false;
    }
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function scrollToTOC() {
    const toc = document.getElementById('table-of-contents');
    if (toc) {
      const offset = 80;
      const top = toc.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }

  function downloadPDF() {
    window.print();
  }

  function downloadMarkdown() {
    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'AT-Field-Guide-2026.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Separate main chapters from quick refs
  $: mainChapters = chapters.filter(c => !c.data.quickRef);
  $: quickRefs = chapters.filter(c => c.data.quickRef);
</script>

<!-- Progress Bar -->
<div class="progress-container">
  <div class="progress-track">
    <div class="progress-fill" style="width: {progress}%"></div>
    <div class="progress-marker" style="left: {progress}%">
      <span class="marker-dot"></span>
    </div>
  </div>
  <div class="progress-labels">
    <span class="progress-start">Springer</span>
    <span class="progress-percent">{Math.round(progress)}%</span>
    <span class="progress-end">Katahdin</span>
  </div>
</div>

<!-- Desktop Sidebar -->
<nav class="sidebar" aria-label="Table of Contents">
  <div class="sidebar-header">
    <span class="sidebar-icon">📖</span>
    <span class="sidebar-title">Contents</span>
  </div>

  <div class="sidebar-scroll">
    <ul class="toc-list">
      {#each mainChapters as chapter, i}
        <li>
          <button
            class="toc-item"
            class:active={activeChapter === chapter.id}
            on:click={() => scrollToChapter(chapter.id)}
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
        {#each quickRefs as ref}
          <li>
            <button
              class="toc-item toc-item-quick"
              class:active={activeChapter === ref.id}
              on:click={() => scrollToChapter(ref.id)}
            >
              <span class="toc-text">{ref.data.title}</span>
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>

  <div class="sidebar-footer">
    <div class="download-buttons">
      <button class="download-btn" on:click={downloadPDF} title="Download as PDF">
        <span class="download-icon">📄</span>
        <span>PDF</span>
      </button>
      <button class="download-btn" on:click={downloadMarkdown} title="Download as Markdown">
        <span class="download-icon">📝</span>
        <span>MD</span>
      </button>
    </div>
    <button class="toc-link" on:click={scrollToTOC}>
      <span>↑ Table of Contents</span>
    </button>
  </div>
</nav>

<!-- Mobile Nav Toggle -->
<button
  class="mobile-nav-toggle"
  class:open={showMobileNav}
  on:click={() => showMobileNav = !showMobileNav}
  aria-label="Toggle navigation"
>
  <span class="toggle-icon">☰</span>
  <span class="toggle-label">Contents</span>
</button>

<!-- Mobile Nav Drawer -->
{#if showMobileNav}
  <div class="mobile-overlay" on:click={() => showMobileNav = false}></div>
  <div class="mobile-drawer">
    <div class="drawer-header">
      <span>Field Guide Contents</span>
      <button class="drawer-close" on:click={() => showMobileNav = false}>×</button>
    </div>
    <div class="drawer-scroll">
      <!-- Download buttons at top of mobile drawer -->
      <div class="drawer-downloads">
        <button class="drawer-download-btn" on:click={downloadPDF}>
          <span>📄</span> Download PDF
        </button>
        <button class="drawer-download-btn" on:click={downloadMarkdown}>
          <span>📝</span> Download Markdown
        </button>
      </div>
      <div class="drawer-divider"></div>

      <ul class="drawer-list">
        {#each mainChapters as chapter, i}
          <li>
            <button
              class="drawer-item"
              class:active={activeChapter === chapter.id}
              on:click={() => scrollToChapter(chapter.id)}
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
          {#each quickRefs as ref}
            <li>
              <button
                class="drawer-item"
                class:active={activeChapter === ref.id}
                on:click={() => scrollToChapter(ref.id)}
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
  <button class="back-to-top" on:click={scrollToTop} aria-label="Back to top">
    <span class="top-arrow">↑</span>
    <span class="top-label">Top</span>
  </button>
{/if}

<style>
  /* ===== Progress Bar ===== */
  .progress-container {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    background: linear-gradient(to bottom, rgba(245, 242, 232, 0.98), rgba(245, 242, 232, 0.95));
    backdrop-filter: blur(8px);
    padding: 0.5rem 1rem 0.4rem;
    border-bottom: 1px solid var(--border, #e6e1d4);
  }

  .progress-track {
    position: relative;
    height: 6px;
    background: linear-gradient(90deg,
      var(--stone, #ccc) 0%,
      var(--stone, #ccc) 100%
    );
    border-radius: 3px;
    overflow: visible;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg,
      var(--alpine, #a6b589) 0%,
      var(--pine, #4d594a) 100%
    );
    border-radius: 3px;
    transition: width 0.1s ease-out;
  }

  .progress-marker {
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    transition: left 0.1s ease-out;
  }

  .marker-dot {
    display: block;
    width: 14px;
    height: 14px;
    background: var(--marker, #f0e000);
    border: 3px solid var(--pine, #4d594a);
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
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
    top: 60px;
    bottom: 0;
    width: 220px;
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

  .download-buttons {
    display: flex;
    gap: 0.5rem;
  }

  .download-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    padding: 0.5rem;
    background: var(--pine, #4d594a);
    color: #fff;
    border: none;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .download-btn:hover {
    background: var(--ink, #2b2f26);
    transform: translateY(-1px);
  }

  .download-icon {
    font-size: 0.85rem;
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
    background: rgba(0,0,0,0.4);
    z-index: 600;
    animation: fadeIn 0.2s ease;
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
    z-index: 700;
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
