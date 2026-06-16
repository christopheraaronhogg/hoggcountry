<script lang="ts">
  import type { PageData } from './$types';
  import FullGuideNav from '../../../../../src/components/FullGuideNav.svelte';
  import GuideInlineSearch from '../../../../../src/components/GuideInlineSearch.svelte';
  import DownloadGuideButton from '../../../../../src/components/DownloadGuideButton.svelte';
  import GuideHighlighter from '../../../../../src/components/GuideHighlighter.svelte';

  const { data } = $props<{ data: PageData }>();

  const mainChapters = $derived(data.chapters.filter((chapter) => !chapter.quickRef));
  const quickRefs = $derived(data.chapters.filter((chapter) => chapter.quickRef));
  const navChapters = $derived(
    data.chapters.map((chapter) => ({
      id: chapter.slug,
      data: {
        title: chapter.title,
        description: chapter.description,
        part: chapter.part,
        order: chapter.order,
        quickRef: chapter.quickRef
      }
    }))
  );

  function scrollToSection(id: string) {
    const element = document.getElementById(id);
    if (!element) return;
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
</script>

<svelte:head>
  <title>AT NOBO Field Guide — Hogg Country</title>
  <meta
    name="description"
    content="The complete Appalachian Trail Northbound field guide in the new SvelteKit frontend, with chapters, quick references, search, and download."
  />
</svelte:head>

<FullGuideNav chapters={navChapters} markdownContent={data.markdownContent} />

<div class="guide-wrapper">
  <div class="guide-content-area">
    <header class="guide-masthead">
      <span class="masthead-badge">AT 2026 | NOBO | February Start</span>
      <h1 class="masthead-title">
        Appalachian Trail<br />NOBO Field Guide
      </h1>
      <p class="masthead-subtitle">Northbound: Springer → Katahdin</p>
      <p class="masthead-meta">2,197.4 Miles of Trail-Tested Knowledge</p>
      <p class="masthead-hiker">
        <span class="hiker-label">Prepared for</span>
        <span class="hiker-name hand">HoggCountry</span>
      </p>
      <div class="masthead-divider"></div>
    </header>

    <nav id="table-of-contents" class="book-toc" aria-label="Table of Contents">
      <div class="book-toc-header">
        <h2 class="book-toc-title">Table of Contents</h2>
        <p class="book-toc-subtitle">{mainChapters.length} Chapters + {quickRefs.length} Quick Reference Cards</p>
      </div>

      <div class="toc-search">
        <GuideInlineSearch chapters={navChapters} />
      </div>

      <div class="book-toc-divider"></div>

      <ol class="toc-entries">
        {#each mainChapters as chapter, index}
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

      {#if quickRefs.length > 0}
        <div class="toc-section-header">
          <span class="toc-section-label">Quick Reference Cards</span>
          <span class="toc-section-line"></span>
        </div>

        <div class="toc-quick-grid">
          {#each quickRefs as ref}
            <button class="toc-quick-card" type="button" onclick={() => scrollToSection(ref.slug)}>
              <span class="toc-quick-title">{ref.title}</span>
              {#if ref.description}
                <span class="toc-quick-desc">{ref.description}</span>
              {/if}
            </button>
          {/each}
        </div>
      {/if}

      <div class="toc-downloads">
        <DownloadGuideButton variant="toc" markdownContent={data.markdownContent} />
      </div>

      <div class="offline-card">
        <div class="offline-card-icon">📶</div>
        <div class="offline-card-content">
          <div class="offline-card-title">Save for Offline</div>
          <div class="offline-card-desc">Tap to save this guide for trail use without service</div>
        </div>
        <button type="button" class="offline-save-btn">Save</button>
      </div>
    </nav>

    {#each data.chapters as chapter}
      <section id={chapter.slug} class:quick-ref={chapter.quickRef} class="chapter-section">
        {#if !chapter.quickRef}
          <span class="chapter-number-bg">{String(mainChapters.findIndex((item) => item.slug === chapter.slug)).padStart(2, '0')}</span>
        {/if}

        <div class="chapter-header">
          <div class:quick-ref-label={chapter.quickRef} class="chapter-label">
            <span class="chapter-label-line"></span>
            <span>
              {chapter.quickRef
                ? 'Quick Reference'
                : `Chapter ${String(mainChapters.findIndex((item) => item.slug === chapter.slug)).padStart(2, '0')}`}
            </span>
          </div>
        </div>

        <div class="chapter-prose">
          {@html chapter.html}
        </div>
      </section>
    {/each}

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
</div>

<DownloadGuideButton variant="header" markdownContent={data.markdownContent} />
<GuideHighlighter />

<style>
  :global(.public-site-main) {
    overflow-x: clip;
  }

  .guide-wrapper {
    padding-top: 110px;
    padding-bottom: 4rem;
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
    line-height: 1.75;
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
    line-height: 1.75;
  }

  .hiker-label {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    line-height: 1.75;
    color: var(--muted);
  }

  .hiker-name {
    font-size: 1.75rem;
    line-height: 1.75;
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
    inset: 0 0 auto;
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
    gap: 0;
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
    line-height: 1.75;
    color: var(--ink);
    transition: color 0.15s ease;
  }

  .toc-entry:hover .toc-entry-title {
    color: var(--pine);
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
    margin: 0 0.75rem 0.3rem;
    min-width: 20px;
    align-self: center;
  }

  .toc-entry-page {
    font-family: Oswald, sans-serif;
    font-size: 0.8rem;
    color: var(--muted);
    flex-shrink: 0;
  }

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
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: var(--terra);
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
    border-radius: 8px;
    border: 2px solid #e0d400;
    background: var(--marker);
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
    font: inherit;
  }

  .toc-quick-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .toc-quick-title {
    font-size: 0.9rem;
    font-weight: 700;
    color: #2b2f26;
  }

  .toc-quick-desc {
    margin-top: 0.15rem;
    color: #4a4a40;
    font-size: 0.75rem;
    line-height: 1.4;
  }

  .toc-downloads {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--border);
  }

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

  .chapter-section {
    scroll-margin-top: 110px;
    position: relative;
    margin-bottom: 0;
    padding: 3rem 0;
    border-bottom: 1px dashed var(--border);
    overflow: hidden;
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
    line-height: 1;
    color: var(--pine);
    opacity: 0.03;
    pointer-events: none;
    user-select: none;
  }

  .chapter-header {
    position: relative;
    z-index: 1;
    margin-bottom: 2rem;
  }

  .chapter-label {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-family: Oswald, sans-serif;
    font-size: 0.7rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 0.5rem;
  }

  .chapter-label.quick-ref-label {
    color: var(--terra);
  }

  .chapter-label-line {
    width: 30px;
    height: 1px;
    background: var(--stone);
  }

  .chapter-label.quick-ref-label .chapter-label-line {
    background: var(--terra);
  }

  .chapter-prose {
    font-size: 1.05rem;
    line-height: 1.85;
    color: var(--fg);
  }

  .chapter-prose :global(h1) {
    font-family: Oswald, sans-serif;
    font-size: 3rem;
    font-weight: 700;
    color: var(--ink);
    margin: 2rem 0;
    line-height: 1.1;
  }

  .chapter-prose :global(h2) {
    color: var(--ink);
    font-family: Oswald, Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif;
    font-size: clamp(1.5rem, 2.5vw, 2rem);
    font-weight: 600;
    line-height: 1.15;
    margin: 0.83em 0;
    padding-top: 0;
    border-top: none;
  }

  .chapter-prose :global(h2:first-of-type) {
    border-top: none;
    padding-top: 0;
  }

  .chapter-prose :global(h3) {
    color: var(--pine);
    font-family: Oswald, Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif;
    font-size: 1.125rem;
    font-weight: 600;
    line-height: 1.25;
    margin: 1em 0;
  }

  .chapter-prose :global(h4) {
    color: var(--fg);
    font-size: 1rem;
    font-weight: 600;
    margin: 1em 0;
  }

  .chapter-prose :global(p) {
    margin: 1em 0;
    line-height: 1.75;
  }

  .chapter-prose :global(ul),
  .chapter-prose :global(ol) {
    margin: 1em 0;
    padding-left: 40px;
  }

  .chapter-prose :global(li) {
    margin: 0;
    line-height: 1.75;
  }

  .chapter-prose :global(blockquote) {
    margin: 1em 40px;
    padding: 0;
    background: none;
    border: 0;
    font-style: normal;
    color: inherit;
  }

  .chapter-prose :global(blockquote p) {
    margin: 1em 0;
  }

  .chapter-prose :global(table) {
    position: relative;
    display: block;
    width: 100%;
    margin: 1.5rem 0;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }

  .chapter-prose :global(table thead),
  .chapter-prose :global(table tbody),
  .chapter-prose :global(table tr) {
    display: table;
    width: 100%;
    table-layout: fixed;
  }

  .chapter-prose :global(th) {
    text-align: left;
    padding: 0.75rem 1rem;
    background: linear-gradient(to bottom, var(--pine), #3d4a3a);
    color: #f5f2e8;
    font-family: Oswald, Impact, sans-serif;
    font-weight: 600;
    font-size: 0.85rem;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .chapter-prose :global(td) {
    padding: 0.625rem 1rem;
    border-bottom: 1px solid var(--border);
    vertical-align: top;
    font-size: 0.92rem;
    line-height: 1.5;
  }

  .chapter-prose :global(tbody tr:nth-child(even)) {
    background: rgba(166, 181, 137, 0.06);
  }

  .chapter-prose :global(tr:last-child td) {
    border-bottom: none;
  }

  .chapter-prose :global(code) {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.9em;
    background: rgba(0, 0, 0, 0.05);
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
  }

  .chapter-prose :global(pre) {
    margin: 1.5rem 0;
    padding: 1rem;
    background: #2b2f26;
    border-radius: 8px;
    overflow-x: auto;
  }

  .chapter-prose :global(pre code) {
    background: none;
    padding: 0;
    color: #f5f2e8;
  }

  .chapter-prose :global(hr) {
    margin: 2rem 0;
    border: none;
    border-top: 2px dashed var(--border);
  }

  .guide-footer {
    text-align: center;
    padding: 2rem 0 0;
    color: var(--muted);
  }

  .footer-trail {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .trail-blaze {
    width: 14px;
    height: 22px;
    border-radius: 3px;
    background: var(--marker);
    border: 1px solid rgba(77, 89, 74, 0.15);
  }

  .footer-text {
    font-family: Oswald, sans-serif;
    font-size: 1.2rem;
    color: var(--pine);
    margin: 0;
  }

  .footer-subtext {
    font-family: Caveat, cursive;
    font-size: 1.2rem;
    margin: 0.35rem 0 1rem;
  }

  .footer-divider {
    width: 120px;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--alpine), transparent);
    margin: 0 auto 1rem;
  }

  .footer-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--pine);
    text-decoration: none;
    font-weight: 700;
  }

  .footer-link:hover {
    color: var(--ink);
  }

  @media (max-width: 1024px) {
    .guide-wrapper {
      margin-left: 0;
    }
  }

  @media (max-width: 760px) {
    .guide-content-area {
      padding: 1.5rem 1rem 5rem;
    }

    .guide-masthead {
      padding: 2rem 0 1.5rem;
    }

    .book-toc {
      padding: 1.5rem 1rem;
    }

    .toc-quick-grid {
      grid-template-columns: 1fr;
    }

    .chapter-section {
      padding: 1.25rem;
    }

    .toc-entry {
      align-items: flex-start;
    }
  }
</style>
