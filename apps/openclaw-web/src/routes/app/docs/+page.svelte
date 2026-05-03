<script lang="ts">
  import { onMount } from 'svelte';
  import { createWorkspaceDocument, deleteImportedDocument, importDocumentFiles, listImportedDocuments, searchWorkspace } from '$lib/manual-db';
  import { inferStandardDocumentSlotKey, STANDARD_DOCUMENT_SLOTS, standardDocumentSlotForKey, type StandardDocumentSlot, type StandardDocumentSlotKey, type ImportedDocument, type SearchHit } from '@hoggcountry/manual-core';

  type CollectionKey = 'extra' | 'review' | 'living' | 'imports';

  let docs = $state<ImportedDocument[]>([]);
  let results = $state<SearchHit[]>([]);
  let query = $state('');
  let error = $state('');
  let notice = $state('');
  let importing = $state(false);
  let searching = $state(false);
  let activeCollection = $state<CollectionKey>('extra');

  async function refresh() {
    docs = await listImportedDocuments();
  }

  async function handleImport(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    error = '';
    notice = '';
    importing = true;

    try {
      await importDocumentFiles(input.files);
      await refresh();
      notice = input.files.length === 1 ? 'Document imported.' : `${input.files.length} documents imported.`;
      activeCollection = 'imports';
      input.value = '';
    } catch (caught) {
      console.error(caught);
      error = 'Could not import those documents.';
    } finally {
      importing = false;
    }
  }

  async function handleDelete(document: ImportedDocument) {
    const confirmed = window.confirm(`Delete “${document.title}”? This removes it from your private workspace.`);
    if (!confirmed) return;

    error = '';
    notice = '';

    try {
      await deleteImportedDocument(document.id);
      await refresh();
      if (query.trim()) {
        await runSearch();
      }
      notice = 'Document deleted.';
    } catch (caught) {
      console.error(caught);
      error = 'Could not delete that document.';
    }
  }

  async function handleNewExtraDocument() {
    const title = window.prompt('Name this extra document');
    if (!title?.trim()) return;

    error = '';
    notice = '';

    try {
      const document = await createWorkspaceDocument({
        title: title.trim(),
        note: 'Extra private Scout document.'
      });
      await refresh();
      notice = 'Extra document created.';
      activeCollection = 'extra';
      window.location.href = `/app/docs/${encodeURIComponent(document.id)}`;
    } catch (caught) {
      console.error(caught);
      error = caught instanceof Error ? caught.message : 'Could not create that document.';
    }
  }

  async function runSearch() {
    const normalized = query.trim();
    if (!normalized) {
      results = [];
      return;
    }

    searching = true;

    try {
      results = await searchWorkspace(normalized);
    } finally {
      searching = false;
    }
  }

  function hitHref(hit: SearchHit): string {
    if (hit.href) return hit.href;
    if (hit.sourceType === 'manual' && hit.sectionId) return `/app/manual#${hit.sectionId}`;
    if (hit.sourceType === 'tool') return `/app/tools#${hit.id}`;
    if (hit.sourceType === 'doc') return `/app/docs/${encodeURIComponent(hit.id)}`;
    return '/app/docs';
  }

  function slotKeyForDocument(document: ImportedDocument): StandardDocumentSlotKey | null {
    return document.slotKey ?? inferStandardDocumentSlotKey(document.title);
  }

  function standardSlotDocument(slot: StandardDocumentSlot): ImportedDocument | null {
    return docs.find((document) => slotKeyForDocument(document) === slot.key) ?? null;
  }

  function standardDocs(): ImportedDocument[] {
    return docs.filter((document) => slotKeyForDocument(document));
  }

  function extraDocs(): ImportedDocument[] {
    return docs.filter((document) => !slotKeyForDocument(document) && document.status !== 'archived');
  }

  function livingDocs(): ImportedDocument[] {
    return docs.filter((document) => document.rights === 'assistant-generated' && document.status !== 'archived');
  }

  function importedDocs(): ImportedDocument[] {
    return docs.filter((document) => document.rights !== 'assistant-generated' && document.status !== 'archived');
  }

  function reviewDocs(): ImportedDocument[] {
    return docs.filter((document) => document.status === 'needs-review' || document.status === 'draft');
  }

  function searchableDocs(): ImportedDocument[] {
    return docs.filter((document) => document.searchable);
  }

  function visibleDocs(): ImportedDocument[] {
    if (activeCollection === 'review') return reviewDocs();
    if (activeCollection === 'living') return livingDocs();
    if (activeCollection === 'imports') return importedDocs();
    return extraDocs();
  }

  function collectionLabel(): string {
    if (activeCollection === 'review') return 'Review queue';
    if (activeCollection === 'living') return 'Living docs';
    if (activeCollection === 'imports') return 'Private imports';
    return 'Extra docs';
  }

  function documentKind(document: ImportedDocument): string {
    const slot = standardDocumentSlotForKey(slotKeyForDocument(document));
    if (slot) return `Standard · ${slot.title}`;
    if (document.rights === 'assistant-generated') return 'Scout extra doc';
    if (document.kind === 'pdf') return 'PDF import';
    if (document.kind === 'html') return 'HTML import';
    if (document.kind === 'markdown') return 'Markdown import';
    return 'Text import';
  }

  function updatedAt(document: ImportedDocument): string {
    return new Date(document.updatedAt ?? document.importedAt).toLocaleString();
  }

  function fileSize(document: ImportedDocument): string {
    if (!Number.isFinite(document.sizeBytes)) return 'stored';
    if (document.sizeBytes > 1024 * 1024) return `${(document.sizeBytes / 1024 / 1024).toFixed(1)} MB`;
    return `${(document.sizeBytes / 1024).toFixed(1)} KB`;
  }

  function excerpt(document: ImportedDocument): string {
    const source = document.note || document.textContent || 'No preview yet.';
    const normalized = source.replace(/\s+/g, ' ').trim();
    return normalized.length > 190 ? `${normalized.slice(0, 190).trimEnd()}…` : normalized;
  }

  function statusTone(document: ImportedDocument): string {
    if (document.status === 'needs-review') return 'warn';
    if (document.status === 'draft') return 'prep';
    if (document.status === 'archived') return 'muted';
    return 'live';
  }

  onMount(() => {
    refresh().catch((caught) => {
      console.error(caught);
      error = 'Could not load your documents.';
    });
  });
</script>

<section class="docs-product-hero">
  <div class="hero-copy">
    <p class="eyebrow">Scout Docs</p>
    <h1>Docs are Scout’s durable workspace.</h1>
    <p class="lede">
      Save strong Scout plans, import private notes and guide excerpts you own, review proposed revisions, and decide what Scout can search. Docs are where the conversation turns into artifacts.
    </p>
    <div class="hero-actions">
      <label class="btn btn-secondary import-button">
        <span>{importing ? 'Importing…' : 'Import source'}</span>
        <input
          type="file"
          multiple
          accept=".md,.markdown,.txt,.html,.htm,.pdf,text/plain,text/html,application/pdf"
          onchange={handleImport}
        />
      </label>
      <button class="btn btn-ghost" type="button" onclick={handleNewExtraDocument}>New doc</button>
      <a class="btn btn-ghost" href="/app/claw">Ask Scout</a>
    </div>
  </div>

  <div class="docs-command-card">
    <strong>Private by default</strong>
    <span>Docs can help Scout without becoming public trail intel.</span>
    <div class="mini-stats" aria-label="Document summary">
      <span><b>{STANDARD_DOCUMENT_SLOTS.length}</b> slots</span>
      <span><b>{reviewDocs().length}</b> review</span>
      <span><b>{extraDocs().length}</b> extra</span>
    </div>
  </div>
</section>

{#if error}
  <p class="surface-alert surface-alert--error">{error}</p>
{/if}
{#if notice}
  <p class="surface-alert surface-alert--success">{notice}</p>
{/if}

<section class="docs-search-card card">
  <div>
    <p class="eyebrow">Searchable workspace</p>
    <h2>Find the source before Scout acts on it.</h2>
  </div>
  <label class="search-input">
    <span class="sr-only">Search workspace</span>
    <input bind:value={query} placeholder="Search plans, private imports, manual sections, towns, gear, permits…" oninput={runSearch} />
  </label>
  <p class="muted">This searches the material Scout can use now. User-owned imports and living docs stay private unless you explicitly change that later.</p>
</section>

{#if query.trim()}
  <section class="search-results stack">
    <div class="section-title-row">
      <div>
        <p class="eyebrow">Search results</p>
        <h2>{searching ? 'Searching…' : `${results.length} result${results.length === 1 ? '' : 's'}`}</h2>
      </div>
      <button class="btn btn-ghost compact-button" type="button" onclick={() => { query = ''; results = []; }}>Clear</button>
    </div>

    {#if !searching && results.length === 0}
      <article class="card empty-state">
        <h2>No results yet.</h2>
        <p class="muted">Try a town, body issue, gear item, permit, food carry, or exact phrase from an import.</p>
      </article>
    {:else}
      <div class="result-grid">
        {#each results as hit}
          <a class="result-card card" href={hitHref(hit)}>
            <p class="eyebrow">{hit.sourceLabel}</p>
            <h3>{hit.title}</h3>
            <p>{hit.excerpt}</p>
          </a>
        {/each}
      </div>
    {/if}
  </section>
{/if}

<section class="standard-docs-section">
  <div class="section-title-row">
    <div>
      <p class="eyebrow">Standard docs</p>
      <h2>Scout's compact working shelf.</h2>
    </div>
    <span class="status-pill">{standardDocs().length}/{STANDARD_DOCUMENT_SLOTS.length} started</span>
  </div>

  <div class="standard-doc-grid">
    {#each STANDARD_DOCUMENT_SLOTS as slot}
      {@const doc = standardSlotDocument(slot)}
      <article class:standard-doc-card={true} class:standard-doc-card--empty={!doc} class="card">
        <div class="standard-doc-topline">
          <p class="eyebrow">{slot.shortTitle}</p>
          {#if doc}
            <span class={`status-pill ${statusTone(doc)}`}>{doc.status ?? 'active'}</span>
          {:else}
            <span class="status-pill prep">empty</span>
          {/if}
        </div>
        <h3>{slot.title}</h3>
        <p>{doc ? excerpt(doc) : slot.purpose}</p>
        <div class="artifact-meta">
          {#if doc}
            <span>{doc.versions?.length ?? 1}v</span>
            <span>{doc.searchable ? 'searchable' : 'not searchable'}</span>
            <span>updated {updatedAt(doc)}</span>
          {:else}
            <span>private</span>
            <span>versioned</span>
            <span>Scout-draftable</span>
          {/if}
        </div>
        <div class="artifact-actions">
          {#if doc}
            <a class="btn btn-secondary" href={`/app/docs/${encodeURIComponent(doc.id)}`}>Review</a>
            <a class="btn btn-ghost" href={`/app/claw?documentId=${encodeURIComponent(doc.id)}&documentAction=review`}>Revise</a>
          {:else}
            <a class="btn btn-secondary" href={`/app/claw?standardDocSlot=${encodeURIComponent(slot.key)}&documentAction=draft`}>{slot.emptyCta}</a>
          {/if}
        </div>
      </article>
    {/each}
  </div>
</section>

<section class="docs-collections" aria-label="Document collections">
  <button class:active={activeCollection === 'extra'} type="button" onclick={() => (activeCollection = 'extra')}>
    <span>{extraDocs().length}</span>
    <strong>Extra</strong>
  </button>
  <button class:active={activeCollection === 'review'} type="button" onclick={() => (activeCollection = 'review')}>
    <span>{reviewDocs().length}</span>
    <strong>Review</strong>
  </button>
  <button class:active={activeCollection === 'living'} type="button" onclick={() => (activeCollection = 'living')}>
    <span>{livingDocs().length}</span>
    <strong>Living docs</strong>
  </button>
  <button class:active={activeCollection === 'imports'} type="button" onclick={() => (activeCollection = 'imports')}>
    <span>{importedDocs().length}</span>
    <strong>Imports</strong>
  </button>
</section>

<section class="artifact-section">
  <div class="section-title-row">
    <div>
      <p class="eyebrow">Artifact locker</p>
      <h2>{collectionLabel()}</h2>
    </div>
    <span class="status-pill">{visibleDocs().length} shown</span>
  </div>

  {#if visibleDocs().length === 0 && activeCollection === 'extra'}
    <article class="empty-docs card">
      <div>
        <p class="eyebrow">Start here</p>
        <h2>No extra docs yet.</h2>
        <p class="muted">Standard docs live above. Extra docs are for town notes, weather calls, social drafts, imported files, or one-off plans Scout should preserve.</p>
      </div>
      <div class="hero-actions">
        <button class="btn btn-secondary" type="button" onclick={handleNewExtraDocument}>New extra doc</button>
        <label class="btn btn-ghost import-button">
          <span>{importing ? 'Importing…' : 'Import source'}</span>
          <input
            type="file"
            multiple
            accept=".md,.markdown,.txt,.html,.htm,.pdf,text/plain,text/html,application/pdf"
            onchange={handleImport}
          />
        </label>
      </div>
    </article>
  {:else if visibleDocs().length === 0}
    <article class="card empty-state">
      <h2>Nothing in this lane yet.</h2>
      <p class="muted">Switch lanes or import a source. Scout living docs appear after you save or seed plans.</p>
    </article>
  {:else}
    <div class="artifact-grid">
      {#each visibleDocs() as doc}
        <article class="artifact-card card" id={`doc-${doc.id}`}>
          <div class="artifact-topline">
            <p class="eyebrow">{documentKind(doc)}</p>
            <span class={`status-pill ${statusTone(doc)}`}>{doc.status ?? 'active'}</span>
          </div>
          <h3>{doc.title}</h3>
          <p class="artifact-excerpt">{excerpt(doc)}</p>

          <div class="artifact-meta">
            <span>{doc.visibility ?? 'private'}</span>
            <span>{doc.searchable ? 'searchable' : 'not searchable'}</span>
            <span>{doc.versions?.length ?? 1}v</span>
            <span>{fileSize(doc)}</span>
          </div>

          <p class="meta-line">Updated {updatedAt(doc)} · {doc.fileName}</p>

          <div class="artifact-actions">
            <a class="btn btn-secondary" href={`/app/docs/${encodeURIComponent(doc.id)}`}>Review</a>
            <a class="btn btn-ghost" href={`/app/claw?documentId=${encodeURIComponent(doc.id)}&documentAction=review`}>Ask Scout</a>
            <button class="btn btn-ghost danger-button" type="button" onclick={() => handleDelete(doc)}>Delete</button>
          </div>
        </article>
      {/each}
    </div>
  {/if}
</section>

<section class="docs-product-rules card">
  <div>
    <p class="eyebrow">Product rule</p>
    <h2>Docs are artifacts, not a public feed.</h2>
  </div>
  <ul>
    <li><strong>Living docs:</strong> Scout plans that can be revised, versioned, restored, and reviewed.</li>
    <li><strong>Private imports:</strong> user-owned context Scout can use without rewriting or publishing it.</li>
    <li><strong>Review queue:</strong> proposed AI revisions stay inspectable before they become trusted current versions.</li>
  </ul>
</section>

<style>
  .docs-product-hero {
    display: grid;
    gap: 1rem;
    border: 1px solid rgba(230, 225, 212, 0.95);
    border-radius: 28px;
    background:
      linear-gradient(135deg, rgba(255, 253, 248, 0.92), rgba(237, 243, 229, 0.86)),
      url('/default-background.svg') center top / cover no-repeat;
    box-shadow: var(--shadow-soft);
    padding: clamp(1rem, 4vw, 1.5rem);
  }

  .hero-copy h1,
  .docs-search-card h2,
  .standard-docs-section h2,
  .artifact-section h2,
  .docs-product-rules h2 {
    margin: 0;
  }

  .hero-copy h1 {
    max-width: 13ch;
    font-size: clamp(2.35rem, 9vw, 4.35rem);
    line-height: 0.96;
  }

  .hero-actions,
  .artifact-actions,
  .section-title-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.65rem;
    align-items: center;
  }

  .hero-actions {
    margin-top: 1rem;
  }

  .section-title-row {
    justify-content: space-between;
    margin: 1rem 0;
  }

  .import-button {
    position: relative;
    overflow: hidden;
  }

  .import-button input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
  }

  .docs-command-card {
    display: grid;
    align-content: end;
    gap: 0.65rem;
    border: 1px solid rgba(77, 89, 74, 0.12);
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.72);
    color: var(--muted);
    padding: 1rem;
  }

  .docs-command-card strong {
    color: var(--pine);
    font-family: Oswald, sans-serif;
    font-size: 1.35rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .mini-stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.5rem;
  }

  .mini-stats span {
    display: grid;
    gap: 0.1rem;
    border-radius: 16px;
    background: rgba(245, 242, 232, 0.88);
    color: var(--muted);
    padding: 0.65rem;
    text-align: center;
  }

  .mini-stats b {
    color: var(--pine);
    font-family: Oswald, sans-serif;
    font-size: 1.45rem;
  }

  .surface-alert {
    border-radius: 16px;
    padding: 0.8rem 1rem;
    font-weight: 800;
  }

  .surface-alert--error {
    border: 1px solid rgba(138, 47, 47, 0.18);
    background: #fff0ed;
    color: #8a2f2f;
  }

  .surface-alert--success {
    border: 1px solid rgba(22, 101, 52, 0.18);
    background: #edf7e8;
    color: #166534;
  }

  .docs-search-card {
    display: grid;
    gap: 0.8rem;
    margin-top: 1rem;
    padding: 1rem;
  }

  .search-input input {
    min-height: 3.1rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.94);
  }

  .search-results,
  .standard-docs-section,
  .artifact-section,
  .docs-product-rules {
    margin-top: 1rem;
  }

  .result-grid,
  .artifact-grid,
  .standard-doc-grid {
    display: grid;
    gap: 0.85rem;
  }

  .result-card {
    display: grid;
    gap: 0.35rem;
    padding: 1rem;
    color: inherit;
    text-decoration: none;
  }

  .result-card h3,
  .result-card p {
    margin: 0;
  }

  .docs-collections {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .docs-collections button {
    display: grid;
    gap: 0.12rem;
    min-height: 4.1rem;
    border: 1px solid rgba(77, 89, 74, 0.14);
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.74);
    color: var(--pine);
    cursor: pointer;
    padding: 0.55rem;
  }

  .docs-collections button.active {
    background: linear-gradient(160deg, #304136, #4b5d4d);
    color: #fff;
  }

  .docs-collections span {
    font-family: Oswald, sans-serif;
    font-size: 1.45rem;
    font-weight: 900;
    line-height: 1;
  }

  .docs-collections strong {
    font-size: 0.75rem;
  }

  .standard-doc-card {
    display: grid;
    gap: 0.65rem;
    padding: 1rem;
  }

  .standard-doc-card--empty {
    border-style: dashed;
    background: rgba(255, 253, 248, 0.72);
  }

  .standard-doc-topline {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .standard-doc-card h3 {
    margin: 0;
    color: var(--ink);
    font-family: Oswald, sans-serif;
    font-size: 1.35rem;
    line-height: 1.05;
  }

  .standard-doc-card p {
    margin: 0;
    color: var(--fg);
    line-height: 1.5;
  }

  .artifact-card {
    display: grid;
    gap: 0.65rem;
    padding: 1rem;
  }

  .artifact-topline,
  .artifact-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.45rem;
    justify-content: space-between;
  }

  .artifact-card h3 {
    margin: 0;
    color: var(--ink);
    font-family: Oswald, sans-serif;
    font-size: 1.4rem;
    line-height: 1.05;
  }

  .artifact-excerpt {
    margin: 0;
    color: var(--fg);
    line-height: 1.55;
  }

  .artifact-meta {
    justify-content: flex-start;
  }

  .artifact-meta span {
    border: 1px solid rgba(77, 89, 74, 0.12);
    border-radius: 999px;
    background: rgba(255, 253, 248, 0.86);
    color: var(--muted);
    font-size: 0.78rem;
    font-weight: 800;
    padding: 0.25rem 0.55rem;
  }

  .artifact-actions .btn {
    min-height: 2.35rem;
    padding: 0.55rem 0.78rem;
  }

  .danger-button {
    color: #8a2f2f;
  }

  .empty-docs {
    display: grid;
    gap: 1rem;
    padding: 1rem;
  }

  .docs-product-rules {
    display: grid;
    gap: 0.8rem;
    padding: 1rem;
  }

  .docs-product-rules ul {
    margin: 0;
    padding-left: 1.1rem;
    color: var(--muted);
    line-height: 1.55;
  }

  .docs-product-rules li + li {
    margin-top: 0.45rem;
  }

  .compact-button {
    min-height: 2.25rem;
    padding: 0.45rem 0.75rem;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  @media (min-width: 860px) {
    .docs-product-hero {
      grid-template-columns: minmax(0, 1fr) minmax(280px, 0.42fr);
      align-items: stretch;
    }

    .docs-search-card {
      grid-template-columns: minmax(220px, 0.35fr) minmax(0, 1fr);
      align-items: center;
    }

    .docs-search-card .muted {
      grid-column: 2;
    }

    .artifact-grid,
    .result-grid,
    .standard-doc-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 560px) {
    .docs-product-hero {
      gap: 0.75rem;
      border-radius: 22px;
      padding: 0.85rem;
    }

    .hero-copy h1 {
      max-width: none;
      font-size: clamp(1.95rem, 8vw, 2.55rem);
      line-height: 1;
    }

    .hero-copy .lede {
      margin: 0.55rem 0 0;
      font-size: 0.95rem;
      line-height: 1.55;
    }

    .hero-actions {
      margin-top: 0.75rem;
    }

    .docs-command-card {
      gap: 0.45rem;
      border-radius: 20px;
      padding: 0.75rem;
    }

    .docs-command-card strong {
      font-size: 1.08rem;
    }

    .mini-stats span {
      padding: 0.45rem 0.35rem;
    }

    .mini-stats b {
      font-size: 1.16rem;
    }

    .docs-collections {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
