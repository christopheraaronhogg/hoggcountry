<script lang="ts">
  import { resolve } from '$app/paths';
  import type { PageData } from './$types';
  import type { GuideEntry } from '$lib/server/guide';
  import FullGuideNav from '../../../../../../src/components/FullGuideNav.svelte';
  import DownloadGuideButton from '../../../../../../src/components/DownloadGuideButton.svelte';
  import GuideHighlighter from '../../../../../../src/components/GuideHighlighter.svelte';

  const { data } = $props<{ data: PageData }>();

  const navChapters = $derived(
    data.chapters.map((chapter: GuideEntry) => ({
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

  const mainChapters = $derived(data.chapters.filter((chapter: GuideEntry) => !chapter.quickRef));
  const siblingChapters = $derived(
    data.chapters.filter((chapter: GuideEntry) => chapter.quickRef === data.entry.quickRef)
  );
  const currentIndex = $derived(
    siblingChapters.findIndex((chapter: GuideEntry) => chapter.slug === data.entry.slug)
  );
  const prevChapter = $derived(currentIndex > 0 ? siblingChapters[currentIndex - 1] : null);
  const nextChapter = $derived(
    currentIndex < siblingChapters.length - 1 ? siblingChapters[currentIndex + 1] : null
  );

  const chapterIndex = $derived(
    mainChapters.findIndex((chapter: GuideEntry) => chapter.slug === data.entry.slug)
  );
  const chapterLabel = $derived(
    data.entry.quickRef ? 'Quick Reference' : `Chapter ${String(chapterIndex).padStart(2, '0')}`
  );
</script>

<svelte:head>
  <title>{data.entry.title} | Hogg Country Guide</title>
  <meta name="description" content={data.entry.description} />
</svelte:head>

<FullGuideNav
  chapters={navChapters}
  markdownContent={data.markdownContent}
  currentSlug={data.entry.slug}
/>

<div class="guide-wrapper">
  <div class="guide-content-area">
    <header class="chapter-page-header">
      <a href={resolve('/guide')} class="back-link">&larr; Field Guide</a>
      {#if data.entry.quickRef}
        <span class="quick-badge">Quick Reference</span>
      {/if}
    </header>

    <article class="guide-article">
      <section
        id={data.entry.slug}
        class:quick-ref={data.entry.quickRef}
        class="chapter-section"
      >
        <div class="chapter-header">
          <div class:quick-ref-label={data.entry.quickRef} class="chapter-label">
            <span class="chapter-label-line"></span>
            <span>{chapterLabel}</span>
          </div>
        </div>

        <div class="prose">
          {@html data.entry.html}
        </div>
      </section>

      <nav class="chapter-nav" aria-label="Chapter navigation">
        <div class="nav-prev">
          {#if prevChapter}
            <a href={resolve(`/guide/${prevChapter.slug}`)} class="nav-link">
              <span class="nav-direction">&larr; Previous</span>
              <span class="nav-title">{prevChapter.title}</span>
            </a>
          {/if}
        </div>

        <div class="nav-next">
          {#if nextChapter}
            <a href={resolve(`/guide/${nextChapter.slug}`)} class="nav-link">
              <span class="nav-direction">Next &rarr;</span>
              <span class="nav-title">{nextChapter.title}</span>
            </a>
          {/if}
        </div>
      </nav>
    </article>
  </div>
</div>

<DownloadGuideButton variant="header" markdownContent={data.markdownContent} />
<GuideHighlighter />

<style>
  :global(.public-site-main) {
    overflow-x: clip;
  }

  .guide-wrapper {
    padding-top: 110px; /* Header (52px) + Progress bar (48px) + breathing room */
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

  .chapter-page-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .back-link {
    font-size: 0.9rem;
    color: var(--muted);
    text-decoration: none;
  }

  .back-link:hover {
    color: var(--pine);
  }

  .quick-badge {
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.25rem 0.5rem;
    background: var(--marker);
    border-radius: 4px;
    color: #2b2f26;
  }

  .guide-article {
    padding-bottom: 3rem;
  }

  .chapter-section {
    scroll-margin-top: 110px;
    position: relative;
    padding: 1.5rem 0 0;
  }

  .chapter-section.quick-ref {
    background: linear-gradient(to right, rgba(240, 224, 0, 0.04), transparent);
    border-radius: 12px;
    padding: 1.5rem 1rem 0;
  }

  .chapter-header {
    margin-bottom: 1.5rem;
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

  .prose :global(h1) {
    font-size: 2rem;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid var(--border);
  }

  .prose :global(h2) {
    font-size: 1.4rem;
    margin-top: 2.5rem;
    margin-bottom: 0.75rem;
    color: var(--pine);
  }

  .prose :global(h3) {
    font-size: 1.15rem;
    margin-top: 1.75rem;
    margin-bottom: 0.5rem;
  }

  .prose :global(p) {
    margin: 1rem 0;
  }

  .prose :global(ul),
  .prose :global(ol) {
    margin: 1rem 0;
    padding-left: 1.5rem;
  }

  .prose :global(li) {
    margin: 0.375rem 0;
  }

  .prose :global(blockquote) {
    margin: 1.5rem 0;
    padding: 1rem 1.25rem;
    background: var(--card);
    border-left: 4px solid var(--alpine);
    font-style: italic;
    color: var(--pine);
  }

  .prose :global(blockquote p) {
    margin: 0;
  }

  .prose :global(strong) {
    color: var(--ink);
  }

  .prose :global(table) {
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

  .prose :global(table thead),
  .prose :global(table tbody),
  .prose :global(table tr) {
    display: table;
    width: 100%;
    table-layout: fixed;
  }

  .prose :global(table thead) {
    position: sticky;
    top: 0;
    z-index: 1;
  }

  .prose :global(th) {
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

  .prose :global(th:first-child) {
    border-radius: 9px 0 0 0;
  }

  .prose :global(th:last-child) {
    border-radius: 0 9px 0 0;
  }

  .prose :global(th:only-child) {
    border-radius: 9px 9px 0 0;
  }

  .prose :global(td) {
    padding: 0.625rem 1rem;
    border-bottom: 1px solid var(--border);
    vertical-align: top;
    font-size: 0.9rem;
    line-height: 1.5;
  }

  .prose :global(tbody tr:nth-child(even)) {
    background: rgba(166, 181, 137, 0.06);
  }

  .prose :global(tbody tr:hover) {
    background: rgba(166, 181, 137, 0.12);
  }

  .prose :global(tr:last-child td) {
    border-bottom: none;
  }

  .prose :global(tr:last-child td:first-child) {
    border-radius: 0 0 0 9px;
  }

  .prose :global(tr:last-child td:last-child) {
    border-radius: 0 0 9px 0;
  }

  .prose :global(td strong) {
    color: var(--pine);
    font-weight: 700;
  }

  .prose :global(td:last-child:not(:first-child)) {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  .prose :global(td:first-child) {
    text-align: left;
  }

  .prose :global(code) {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.9em;
    background: rgba(0, 0, 0, 0.05);
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
  }

  .prose :global(pre) {
    margin: 1.5rem 0;
    padding: 1rem;
    background: #2b2f26;
    border-radius: 8px;
    overflow-x: auto;
  }

  .prose :global(pre code) {
    background: none;
    padding: 0;
    color: #f5f2e8;
  }

  .prose :global(hr) {
    margin: 2rem 0;
    border: none;
    border-top: 2px dashed var(--border);
  }

  .chapter-nav {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    margin-top: 3rem;
    padding-top: 1.5rem;
    border-top: 2px solid var(--border);
  }

  .nav-prev,
  .nav-next {
    flex: 1;
  }

  .nav-next {
    text-align: right;
  }

  .nav-link {
    display: inline-flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.75rem 1rem;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 8px;
    text-decoration: none;
    transition: border-color 0.12s ease, transform 0.12s ease;
  }

  .nav-link:hover {
    border-color: var(--alpine);
    transform: translateY(-1px);
  }

  .nav-direction {
    font-size: 0.8rem;
    color: var(--muted);
  }

  .nav-title {
    font-weight: 600;
    color: var(--ink);
    font-size: 0.95rem;
  }

  @media (max-width: 1024px) {
    .guide-wrapper {
      margin-left: 0;
    }
  }

  @media (max-width: 600px) {
    .guide-wrapper {
      padding-top: 100px;
    }

    .guide-content-area {
      padding: 1.25rem 1rem 5rem;
    }

    .prose :global(h1) {
      font-size: 1.5rem;
    }

    .prose :global(h2) {
      font-size: 1.2rem;
    }

    .prose :global(table) {
      font-size: 0.8rem;
      margin: 1rem 0;
    }

    .prose :global(th) {
      padding: 0.6rem 0.75rem;
      font-size: 0.75rem;
    }

    .prose :global(td) {
      padding: 0.5rem 0.75rem;
    }

    .prose :global(table)::after {
      content: '';
      position: absolute;
      right: 0;
      top: 0;
      bottom: 0;
      width: 20px;
      background: linear-gradient(to right, transparent, rgba(0, 0, 0, 0.05));
      pointer-events: none;
      border-radius: 0 10px 10px 0;
    }

    .chapter-nav {
      flex-direction: column;
    }

    .nav-next {
      text-align: left;
    }
  }
</style>
