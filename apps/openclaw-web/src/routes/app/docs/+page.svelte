<script lang="ts">
  import { onMount } from 'svelte';
  import { deleteImportedDocument, importDocumentFiles, listImportedDocuments, searchWorkspace } from '$lib/manual-db';
  import type { ImportedDocument, SearchHit } from '@hoggcountry/manual-core';

  let docs = $state<ImportedDocument[]>([]);
  let results = $state<SearchHit[]>([]);
  let query = $state('');
  let error = $state('');
  let importing = $state(false);
  let searching = $state(false);

  async function refresh() {
    docs = await listImportedDocuments();
  }

  async function handleImport(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    error = '';
    importing = true;

    try {
      await importDocumentFiles(input.files);
      await refresh();
      input.value = '';
    } catch (caught) {
      console.error(caught);
      error = 'Could not import those documents.';
    } finally {
      importing = false;
    }
  }

  async function handleDelete(documentId: string) {
    await deleteImportedDocument(documentId);
    await refresh();
    if (query.trim()) {
      await runSearch();
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
    if (hit.sourceType === 'doc') return `#doc-${hit.id}`;
    return '/app/docs';
  }

  onMount(() => {
    refresh().catch((caught) => {
      console.error(caught);
      error = 'Could not load your documents.';
    });
  });
</script>

<section class="card hero-panel">
  <div>
    <p class="eyebrow">Docs</p>
    <h1>Keep the documents and signals you own close by.</h1>
    <p class="lede">
      Import text, markdown, HTML, or PDFs you legally own. Then search your manual, public corpus, imported docs,
      and trail tools from one locker. Text files index immediately. PDFs store now and can get deeper extraction later.
    </p>
  </div>
</section>

<section class="card panel-copy" style="margin-top:1rem; display:grid; gap:1rem;">
  <div class="subtle-actions">
    <label class="btn btn-secondary" style="position:relative; overflow:hidden;">
      <span>{importing ? 'Importing...' : 'Import documents'}</span>
      <input
        type="file"
        multiple
        accept=".md,.markdown,.txt,.html,.htm,.pdf,text/plain,text/html,application/pdf"
        onchange={handleImport}
        style="position:absolute; inset:0; opacity:0; cursor:pointer;"
      />
    </label>
  </div>

  <label>
    <span class="eyebrow">Search workspace</span>
    <input bind:value={query} placeholder="Search your manual, tools, docs, and the public trail corpus" oninput={runSearch} />
  </label>

  <p class="muted" style="margin-bottom:0;">
    Examples: Dad's notes, exported permits, town screenshots, or legally owned guide files you want in your private
    locker.
  </p>
</section>

{#if error}
  <p style="color:#8a2f2f; font-weight:700;">{error}</p>
{/if}

{#if query.trim()}
  <section class="stack" style="margin-top:1rem;">
    <div class="page-intro">
      <p class="eyebrow">Search results</p>
      <h2>{searching ? 'Searching...' : `${results.length} result${results.length === 1 ? '' : 's'}`}</h2>
    </div>

    {#if !searching && results.length === 0}
      <article class="card empty-state">
        <h2>No results yet.</h2>
        <p class="muted">Try a chapter topic, town name, gear item, or one of your tool titles.</p>
      </article>
    {:else}
      {#each results as hit}
        <a class="card panel-copy" href={hitHref(hit)}>
          <p class="eyebrow">{hit.sourceLabel}</p>
          <h3>{hit.title}</h3>
          <p class="muted">{hit.excerpt}</p>
        </a>
      {/each}
    {/if}
  </section>
{/if}

<section class="stack" style="margin-top:1rem;">
  {#if docs.length === 0}
    <article class="card empty-state">
      <h2>No imported docs yet.</h2>
      <p class="muted">The public guide still works. This locker is for the private docs you want beside it.</p>
    </article>
  {:else}
    {#each docs as doc}
      <article class="card panel-copy" id={`doc-${doc.id}`}>
        <div class="grid-two" style="align-items:start;">
          <div>
            <p class="eyebrow">{doc.kind}</p>
            <h2>{doc.title}</h2>
            <p class="muted">{doc.note || (doc.searchable ? 'Indexed locally for search.' : 'Stored locally only.')}</p>
            <p class="meta-line">{doc.fileName} | {(doc.sizeBytes / 1024).toFixed(1)} KB | imported {new Date(doc.importedAt).toLocaleString()}</p>
          </div>
          <div class="subtle-actions" style="justify-content:flex-end;">
            <button class="btn" type="button" onclick={() => handleDelete(doc.id)}>Delete</button>
          </div>
        </div>
      </article>
    {/each}
  {/if}
</section>
