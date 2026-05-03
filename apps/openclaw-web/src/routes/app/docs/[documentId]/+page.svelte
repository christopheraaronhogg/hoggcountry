<script lang="ts">
  import { onMount } from 'svelte';
  import { getImportedDocument, updateImportedDocumentState } from '$lib/manual-db';
  import { inferStandardDocumentSlotKey, standardDocumentSlotForKey, type ImportedDocument, type ImportedDocumentStatus, type ImportedDocumentVersion, type ImportedDocumentVisibility } from '@hoggcountry/manual-core';

  let { data } = $props<{ data?: { documentId?: string } }>();
  const documentId = $derived(data?.documentId ?? '');

  let document = $state<ImportedDocument | null>(null);
  let selectedVersionId = $state('');
  let compareVersionId = $state('');
  let loading = $state(true);
  let saving = $state(false);
  let error = $state('');
  let notice = $state('');

  const statuses: ImportedDocumentStatus[] = ['draft', 'needs-review', 'active', 'archived'];
  const visibilities: ImportedDocumentVisibility[] = ['private', 'trusted-link', 'public'];

  function sortedVersions(doc: ImportedDocument | null): ImportedDocumentVersion[] {
    return [...(doc?.versions ?? [])].sort((left, right) => right.versionNumber - left.versionNumber);
  }

  function currentVersion(doc: ImportedDocument | null): ImportedDocumentVersion | null {
    if (!doc) return null;
    return doc.versions?.find((version) => version.id === doc.currentVersionId) ?? doc.versions?.at(-1) ?? null;
  }

  function selectedVersion(): ImportedDocumentVersion | null {
    if (!document) return null;
    return document.versions?.find((version) => version.id === selectedVersionId) ?? currentVersion(document);
  }

  function compareVersion(): ImportedDocumentVersion | null {
    if (!document || !compareVersionId) return null;
    return document.versions?.find((version) => version.id === compareVersionId) ?? null;
  }

  function versionPreview(version: ImportedDocumentVersion): string {
    const normalized = version.textContent.replace(/\s+/g, ' ').trim();
    return normalized.length > 180 ? `${normalized.slice(0, 180).trimEnd()}…` : normalized;
  }

  function slotForDocument(doc: ImportedDocument) {
    return standardDocumentSlotForKey(doc.slotKey ?? inferStandardDocumentSlotKey(doc.title));
  }

  function artifactKind(doc: ImportedDocument): string {
    const slot = slotForDocument(doc);
    if (slot) return `Standard doc · ${slot.title}`;
    if (doc.rights === 'assistant-generated') return 'Scout extra doc';
    if (doc.kind === 'pdf') return 'Private PDF import';
    if (doc.kind === 'html') return 'Private HTML import';
    if (doc.kind === 'markdown') return 'Private markdown import';
    return 'Private text import';
  }

  function workflowCopy(doc: ImportedDocument): string {
    const slot = slotForDocument(doc);
    if (slot) {
      return `${slot.title} is one of Scout's standard documents. Scout can revise it, but every update stays in version history for review or rollback.`;
    }

    if (doc.rights === 'assistant-generated') {
      return 'Scout can revise this extra document. Revisions create new versions for review instead of silently overwriting the current artifact.';
    }

    return 'Scout can use this as private source context. Imports stay source material; Scout should not rewrite the original import in place.';
  }

  function updatedAt(doc: ImportedDocument): string {
    return new Date(doc.updatedAt ?? doc.importedAt).toLocaleString();
  }

  function fileSize(doc: ImportedDocument): string {
    if (!Number.isFinite(doc.sizeBytes)) return 'stored';
    if (doc.sizeBytes > 1024 * 1024) return `${(doc.sizeBytes / 1024 / 1024).toFixed(1)} MB`;
    return `${(doc.sizeBytes / 1024).toFixed(1)} KB`;
  }

  function statusTone(status: ImportedDocumentStatus | undefined): string {
    if (status === 'needs-review') return 'warn';
    if (status === 'draft') return 'prep';
    if (status === 'archived') return 'muted';
    return 'live';
  }

  async function load() {
    loading = true;
    error = '';

    try {
      document = await getImportedDocument(documentId);
      selectedVersionId = document.currentVersionId ?? document.versions?.at(-1)?.id ?? '';
      compareVersionId = sortedVersions(document).find((version) => version.id !== selectedVersionId)?.id ?? '';
    } catch (caught) {
      console.error(caught);
      error = caught instanceof Error ? caught.message : 'Could not load this document.';
    } finally {
      loading = false;
    }
  }

  async function updateState(input: {
    status?: ImportedDocumentStatus;
    visibility?: ImportedDocumentVisibility;
    searchable?: boolean;
    currentVersionId?: string;
  }) {
    if (!document) return;
    saving = true;
    error = '';
    notice = '';

    try {
      document = await updateImportedDocumentState(document.id, input);
      selectedVersionId = document.currentVersionId ?? selectedVersionId;
      notice = 'Document updated.';
    } catch (caught) {
      console.error(caught);
      error = caught instanceof Error ? caught.message : 'Could not update this document.';
    } finally {
      saving = false;
    }
  }

  async function restoreVersion(version: ImportedDocumentVersion) {
    await updateState({ currentVersionId: version.id, status: 'active' });
  }

  onMount(() => {
    load().catch(() => undefined);
  });
</script>

{#if loading}
  <section class="card empty-state">
    <h1>Loading document…</h1>
  </section>
{:else if error && !document}
  <section class="card empty-state">
    <h1>Could not load document.</h1>
    <p class="muted">{error}</p>
    <a class="btn btn-secondary" href="/app/docs">Back to Docs</a>
  </section>
{:else if document}
  {@const activeVersion = currentVersion(document)}
  {@const viewedVersion = selectedVersion()}
  {@const compared = compareVersion()}

  <section class="document-workspace">
    <nav class="artifact-toolbar" aria-label="Document actions">
      <a class="toolbar-back" href="/app/docs">← Docs</a>
      <strong>{document.title}</strong>
      <a class="btn btn-secondary" href={`/app/claw?documentId=${encodeURIComponent(document.id)}&documentAction=review`}>Ask Scout</a>
    </nav>

    <section class="document-hero">
      <div>
        <p class="eyebrow">{artifactKind(document)}</p>
        <h1>{document.title}</h1>
        <p class="lede">{workflowCopy(document)}</p>
        <div class="doc-badges">
          <span class={`status-pill ${statusTone(document.status)}`}>{document.status ?? 'active'}</span>
          {#if slotForDocument(document)}<span>standard slot</span>{/if}
          <span>{document.visibility ?? 'private'}</span>
          <span>{document.searchable ? 'Scout-searchable' : 'Not searchable'}</span>
          <span>{document.versions?.length ?? 1} version{(document.versions?.length ?? 1) === 1 ? '' : 's'}</span>
        </div>
      </div>

      <div class="artifact-summary card">
        <p class="eyebrow">Artifact state</p>
        <dl>
          <div><dt>Updated</dt><dd>{updatedAt(document)}</dd></div>
          <div><dt>Source file</dt><dd>{document.fileName}</dd></div>
          <div><dt>Size</dt><dd>{fileSize(document)}</dd></div>
        </dl>
      </div>
    </section>

    {#if error}
      <p class="surface-alert surface-alert--error">{error}</p>
    {/if}
    {#if notice}
      <p class="surface-alert surface-alert--success">{notice}</p>
    {/if}

    <main class="document-layout">
      <section class="document-body-card card">
        <div class="section-head">
          <div>
            <p class="eyebrow">{viewedVersion?.id === activeVersion?.id ? 'Current version' : 'Viewing previous version'}</p>
            <h2>{viewedVersion ? `Version ${viewedVersion.versionNumber}` : 'Current content'}</h2>
          </div>
          {#if viewedVersion && viewedVersion.id !== activeVersion?.id}
            <button class="btn btn-secondary" type="button" disabled={saving} onclick={() => restoreVersion(viewedVersion)}>
              {saving ? 'Restoring…' : 'Restore this version'}
            </button>
          {/if}
        </div>

        <pre class="document-markdown">{viewedVersion?.textContent ?? document.textContent}</pre>
      </section>

      <aside class="document-side">
        <section class="card side-card scout-workflow-card">
          <p class="eyebrow">Scout workflow</p>
          <h2>{slotForDocument(document) ? 'Keep the standard doc current.' : document.rights === 'assistant-generated' ? 'Revise without losing history.' : 'Use as private context.'}</h2>
          <p class="muted">{workflowCopy(document)}</p>
          <a class="btn btn-secondary" href={`/app/claw?documentId=${encodeURIComponent(document.id)}&documentAction=review`}>
            {document.rights === 'assistant-generated' ? 'Revise with Scout' : 'Ask Scout about this'}
          </a>
        </section>

        <section class="card side-card">
          <p class="eyebrow">Review controls</p>
          <label>
            <span>Status</span>
            <select value={document.status ?? 'active'} onchange={(event) => updateState({ status: (event.currentTarget as HTMLSelectElement).value as ImportedDocumentStatus })} disabled={saving}>
              {#each statuses as status}
                <option value={status}>{status}</option>
              {/each}
            </select>
          </label>
          <label>
            <span>Visibility</span>
            <select value={document.visibility ?? 'private'} onchange={(event) => updateState({ visibility: (event.currentTarget as HTMLSelectElement).value as ImportedDocumentVisibility })} disabled={saving}>
              {#each visibilities as visibility}
                <option value={visibility}>{visibility}</option>
              {/each}
            </select>
          </label>
          <label class="check-row">
            <input type="checkbox" checked={document.searchable} onchange={(event) => updateState({ searchable: (event.currentTarget as HTMLInputElement).checked })} disabled={saving} />
            <span>Searchable by Scout</span>
          </label>
          <p class="muted">Private by default. Sharing and public trail intel are separate future approval flows.</p>
        </section>

        <section class="card side-card">
          <div class="section-head compact">
            <div>
              <p class="eyebrow">Version history</p>
              <h2>{sortedVersions(document).length} saved</h2>
            </div>
          </div>
          <div class="version-list">
            {#each sortedVersions(document) as version}
              <button class:selected={version.id === selectedVersionId} type="button" onclick={() => selectedVersionId = version.id}>
                <span>v{version.versionNumber} · {version.author}</span>
                <strong>{new Date(version.createdAt).toLocaleString()}</strong>
                <small>{versionPreview(version)}</small>
              </button>
            {/each}
          </div>
        </section>

        {#if sortedVersions(document).length > 1}
          <section class="card side-card compare-card">
            <p class="eyebrow">Compare</p>
            <label>
              <span>Compare current against</span>
              <select bind:value={compareVersionId}>
                {#each sortedVersions(document).filter((version) => version.id !== activeVersion?.id) as version}
                  <option value={version.id}>Version {version.versionNumber} · {new Date(version.createdAt).toLocaleDateString()}</option>
                {/each}
              </select>
            </label>
            {#if compared && activeVersion}
              <div class="compare-stack">
                <div>
                  <strong>Current v{activeVersion.versionNumber}</strong>
                  <pre>{activeVersion.textContent}</pre>
                </div>
                <div>
                  <strong>Previous v{compared.versionNumber}</strong>
                  <pre>{compared.textContent}</pre>
                </div>
              </div>
            {/if}
          </section>
        {/if}
      </aside>
    </main>
  </section>
{/if}

<style>
  .document-workspace {
    display: grid;
    gap: 1rem;
  }

  .artifact-toolbar {
    position: sticky;
    top: 0.5rem;
    z-index: 8;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.75rem;
    border: 1px solid rgba(230, 225, 212, 0.92);
    border-radius: 999px;
    background: rgba(255, 253, 248, 0.92);
    box-shadow: var(--shadow-soft);
    padding: 0.35rem;
    backdrop-filter: blur(12px);
  }

  .artifact-toolbar strong {
    overflow: hidden;
    color: var(--pine);
    font-family: Oswald, sans-serif;
    letter-spacing: 0.06em;
    text-overflow: ellipsis;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .toolbar-back {
    color: var(--pine);
    font-weight: 900;
    padding-left: 0.7rem;
    text-decoration: none;
  }

  .artifact-toolbar .btn {
    min-height: 2.35rem;
    padding: 0.45rem 0.8rem;
  }

  .document-hero {
    display: grid;
    gap: 1rem;
    border: 1px solid rgba(230, 225, 212, 0.95);
    border-radius: 28px;
    background:
      linear-gradient(135deg, rgba(255, 253, 248, 0.94), rgba(237, 243, 229, 0.86)),
      url('/default-background.svg') center top / cover no-repeat;
    box-shadow: var(--shadow-soft);
    padding: clamp(1rem, 4vw, 1.45rem);
  }

  .document-hero h1 {
    max-width: 13ch;
    margin: 0;
    font-size: clamp(2.25rem, 9vw, 4.1rem);
    line-height: 0.96;
  }

  .doc-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .doc-badges span {
    display: inline-flex;
    align-items: center;
    min-height: 34px;
    border: 1px solid rgba(77, 89, 74, 0.14);
    border-radius: 999px;
    background: rgba(255, 253, 248, 0.9);
    color: #394638;
    padding: 0.25rem 0.65rem;
    font-size: 0.82rem;
    font-weight: 850;
  }

  .artifact-summary {
    display: grid;
    align-content: end;
    gap: 0.65rem;
    padding: 1rem;
  }

  .artifact-summary dl {
    display: grid;
    gap: 0.55rem;
    margin: 0;
  }

  .artifact-summary div {
    display: grid;
    gap: 0.1rem;
  }

  .artifact-summary dt {
    color: var(--muted);
    font-size: 0.74rem;
    font-weight: 900;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .artifact-summary dd {
    margin: 0;
    color: var(--ink);
    font-weight: 800;
    word-break: break-word;
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

  .document-layout {
    display: grid;
    gap: 1rem;
  }

  .document-body-card,
  .side-card {
    padding: 1rem;
  }

  .document-side {
    display: grid;
    gap: 1rem;
    align-content: start;
  }

  .section-head {
    display: flex;
    gap: 1rem;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    margin-bottom: 1rem;
  }

  .section-head.compact {
    margin-bottom: 0.65rem;
  }

  .section-head h2,
  .side-card h2 {
    margin: 0;
  }

  .document-markdown,
  .compare-stack pre {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
    border: 1px solid rgba(230, 225, 212, 0.95);
    border-radius: 20px;
    background: rgba(255, 253, 248, 0.92);
    color: #28382f;
    padding: 1rem;
    line-height: 1.6;
    font-family: Lato, system-ui, sans-serif;
    font-size: 0.98rem;
  }

  .scout-workflow-card {
    background:
      linear-gradient(160deg, rgba(237, 243, 229, 0.92), rgba(255, 253, 248, 0.9));
  }

  .scout-workflow-card .btn {
    width: 100%;
    margin-top: 0.45rem;
  }

  .version-list {
    display: grid;
    gap: 0.5rem;
  }

  .version-list button {
    display: grid;
    gap: 0.25rem;
    width: 100%;
    border: 1px solid rgba(77, 89, 74, 0.14);
    border-radius: 18px;
    background: rgba(255, 253, 248, 0.86);
    color: #394638;
    padding: 0.75rem;
    text-align: left;
    cursor: pointer;
  }

  .version-list button.selected,
  .version-list button:hover {
    border-color: rgba(77, 89, 74, 0.34);
    background: #edf3e5;
  }

  .version-list span {
    color: #7b6a3d;
    font-size: 0.72rem;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .version-list strong,
  .version-list small {
    line-height: 1.35;
  }

  label {
    display: grid;
    gap: 0.35rem;
    margin-top: 0.8rem;
    color: var(--muted);
    font-weight: 800;
  }

  select {
    min-height: 2.8rem;
    border: 1px solid rgba(77, 89, 74, 0.18);
    border-radius: 14px;
    background: #fffdf8;
    padding: 0 0.75rem;
  }

  .check-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .check-row input {
    width: auto;
    min-height: auto;
  }

  .compare-stack {
    display: grid;
    gap: 0.75rem;
    margin-top: 0.75rem;
  }

  .compare-stack pre {
    max-height: 18rem;
    overflow: auto;
    font-size: 0.86rem;
  }

  @media (min-width: 980px) {
    .document-hero,
    .document-layout {
      grid-template-columns: minmax(0, 1fr) minmax(300px, 0.36fr);
    }

    .document-side {
      position: sticky;
      top: 5.5rem;
    }
  }

  @media (max-width: 620px) {
    .artifact-toolbar {
      top: 0.35rem;
      gap: 0.45rem;
    }

    .artifact-toolbar strong {
      font-size: 0.86rem;
    }

    .artifact-toolbar .btn {
      min-height: 2.15rem;
      padding: 0.35rem 0.62rem;
    }

    .document-hero {
      gap: 0.75rem;
      border-radius: 22px;
      padding: 0.85rem;
    }

    .document-hero h1 {
      max-width: none;
      font-size: clamp(1.85rem, 7.5vw, 2.45rem);
      line-height: 1;
    }

    .document-hero .lede {
      margin: 0.55rem 0 0;
      font-size: 0.95rem;
      line-height: 1.52;
    }

    .doc-badges {
      gap: 0.35rem;
      margin-top: 0.65rem;
    }

    .doc-badges span {
      min-height: 30px;
      padding: 0.18rem 0.52rem;
      font-size: 0.76rem;
    }

    .artifact-summary {
      border-radius: 20px;
      padding: 0.75rem;
    }
  }
</style>
