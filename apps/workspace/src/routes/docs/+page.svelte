<script lang="ts">
  import { onMount } from 'svelte';
  import { deleteImportedDocument, importDocumentFiles, listImportedDocuments } from '$lib/manual-db';
  import type { ImportedDocument } from '@hoggcountry/manual-core';

  let docs: ImportedDocument[] = [];
  let error = '';
  let importing = false;

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
  }

  onMount(() => {
    refresh().catch((caught) => {
      console.error(caught);
      error = 'Could not load your documents.';
    });
  });
</script>

<section class="hero card">
  <p class="eyebrow">Docs</p>
  <h1>Keep the primary documents you own close by.</h1>
  <p class="lede">Import text, markdown, HTML, or PDFs you legally own. Everything stays local on this device. Search works immediately for text-based files; PDFs are stored now and text extraction can come later.</p>
</section>

<section class="card uploader">
  <label class="upload-label">
    <span>{importing ? 'Importing...' : 'Import documents'}</span>
    <input type="file" multiple accept=".md,.markdown,.txt,.html,.htm,.pdf,text/plain,text/html,application/pdf" onchange={handleImport} />
  </label>
  <p class="helper">Examples: Dad's notes, exported permits, town screenshots, or legally owned guide files you want in your private locker.</p>
</section>

{#if error}
  <p class="error">{error}</p>
{/if}

<section class="docs">
  {#if docs.length === 0}
    <article class="card doc">
      <h2>No imported docs yet.</h2>
      <p>Your public guide search still works. This locker is for the files you want beside it.</p>
    </article>
  {:else}
    {#each docs as doc}
      <article class="card doc">
        <div class="doc-top">
          <div>
            <p class="eyebrow">{doc.kind}</p>
            <h2>{doc.title}</h2>
          </div>
          <button type="button" onclick={() => handleDelete(doc.id)}>Delete</button>
        </div>
        <p>{doc.note || (doc.searchable ? 'Indexed locally for search.' : 'Stored locally only.')}</p>
        <p class="meta">{doc.fileName} | {(doc.sizeBytes / 1024).toFixed(1)} KB | imported {new Date(doc.importedAt).toLocaleString()}</p>
      </article>
    {/each}
  {/if}
</section>

<style>
  .card {
    border: 1px solid rgba(48, 65, 54, 0.12);
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.84);
    box-shadow: 0 18px 44px rgba(0, 0, 0, 0.06);
  }

  .hero,
  .uploader,
  .doc {
    padding: 1.1rem;
  }

  .hero,
  .uploader {
    margin-bottom: 1rem;
  }

  .eyebrow {
    margin: 0 0 0.35rem;
    font-size: 0.76rem;
    font-weight: 800;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #b45309;
  }

  h1,
  h2 {
    margin: 0;
    color: #1f2937;
  }

  .lede,
  .helper,
  .doc p {
    color: #5d675c;
    line-height: 1.7;
  }

  .upload-label {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 48px;
    padding: 0.8rem 1rem;
    border-radius: 999px;
    background: #304136;
    color: white;
    font-weight: 800;
    cursor: pointer;
  }

  .upload-label input {
    position: absolute;
    width: 1px;
    height: 1px;
    opacity: 0;
    overflow: hidden;
    pointer-events: none;
  }

  .docs {
    display: grid;
    gap: 1rem;
  }

  .doc-top {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: start;
  }

  .meta {
    font-size: 0.84rem;
    color: #6b665c;
  }

  button {
    min-height: 42px;
    border: none;
    border-radius: 999px;
    padding: 0.75rem 0.95rem;
    background: rgba(127, 29, 29, 0.1);
    color: #8a2f2f;
    font: inherit;
    font-weight: 800;
    cursor: pointer;
  }

  .error {
    color: #8a2f2f;
    font-weight: 700;
  }
</style>
