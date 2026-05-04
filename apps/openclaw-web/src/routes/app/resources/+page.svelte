<script lang="ts">
  import { onMount } from 'svelte';
  import { createWorkspaceResource, deleteWorkspaceResource, importResourceFiles, listWorkspaceResources } from '$lib/manual-db';
  import type { WorkspaceResource, WorkspaceResourceKind, WorkspaceResourceSensitivity } from '@hoggcountry/manual-core';

  let resources = $state<WorkspaceResource[]>([]);
  let error = $state('');
  let notice = $state('');
  let importing = $state(false);
  let saving = $state(false);
  let activeMode = $state<'file' | 'url' | 'note'>('file');
  let title = $state('');
  let sourceUri = $state('');
  let noteText = $state('');
  let sensitivity = $state<WorkspaceResourceSensitivity>('private');

  async function refresh() {
    resources = await listWorkspaceResources();
  }

  async function handleFileImport(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    error = '';
    notice = '';
    importing = true;

    try {
      await importResourceFiles(input.files);
      await refresh();
      notice = input.files.length === 1 ? 'Resource uploaded.' : `${input.files.length} resources uploaded.`;
      input.value = '';
    } catch (caught) {
      console.error(caught);
      error = caught instanceof Error ? caught.message : 'Could not upload those resources.';
    } finally {
      importing = false;
    }
  }

  async function handleCreateResource() {
    error = '';
    notice = '';
    saving = true;

    try {
      if (activeMode === 'url') {
        await createWorkspaceResource({
          kind: 'url',
          title: title.trim() || undefined,
          sourceUri: sourceUri.trim(),
          sensitivity
        });
        sourceUri = '';
      } else {
        await createWorkspaceResource({
          kind: 'note',
          title: title.trim() || undefined,
          text: noteText.trim(),
          sensitivity
        });
        noteText = '';
      }

      title = '';
      sensitivity = 'private';
      await refresh();
      notice = 'Resource saved.';
    } catch (caught) {
      console.error(caught);
      error = caught instanceof Error ? caught.message : 'Could not save that resource.';
    } finally {
      saving = false;
    }
  }

  async function handleDelete(resource: WorkspaceResource) {
    const confirmed = window.confirm(`Delete “${resource.title}”? This removes it from your private resources.`);
    if (!confirmed) return;

    error = '';
    notice = '';

    try {
      await deleteWorkspaceResource(resource.id);
      await refresh();
      notice = 'Resource deleted.';
    } catch (caught) {
      console.error(caught);
      error = 'Could not delete that resource.';
    }
  }

  function resourceKindLabel(kind: WorkspaceResourceKind): string {
    if (kind === 'official-source') return 'Official source';
    if (kind === 'url') return 'Web address';
    if (kind === 'file') return 'File';
    return 'Note';
  }

  function updatedAt(resource: WorkspaceResource): string {
    return new Date(resource.updatedAt).toLocaleString();
  }

  function fileSize(resource: WorkspaceResource): string {
    const size = resource.sizeBytes ?? 0;
    if (!size) return 'stored';
    if (size > 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`;
    return `${(size / 1024).toFixed(1)} KB`;
  }

  function excerpt(resource: WorkspaceResource): string {
    const source = resource.summary || resource.extractedText || resource.sourceUri || 'No preview yet.';
    const normalized = source.replace(/\s+/g, ' ').trim();
    return normalized.length > 220 ? `${normalized.slice(0, 220).trimEnd()}…` : normalized;
  }

  function searchableResources(): WorkspaceResource[] {
    return resources.filter((resource) => resource.searchable && resource.status !== 'archived');
  }

  function sensitiveResources(): WorkspaceResource[] {
    return resources.filter((resource) => resource.sensitivity === 'financial' || resource.sensitivity === 'medical' || resource.sensitivity === 'sensitive');
  }

  onMount(() => {
    refresh().catch((caught) => {
      console.error(caught);
      error = 'Could not load your resources.';
    });
  });
</script>

<section class="resources-hero">
  <div>
    <p class="eyebrow">Scout Resources</p>
    <h1>Source material stays separate from living docs.</h1>
    <p class="lede">
      Upload files, save links, or paste notes for Scout to use as private context. Resources are source material; Docs are the maintained plans and reports Scout helps revise.
    </p>
    <div class="hero-actions">
      <a class="btn btn-secondary" href="/app/docs">Open Docs</a>
      <a class="btn btn-ghost" href="/app/claw">Ask Scout</a>
    </div>
  </div>

  <article class="resources-command-card">
    <strong>Private source locker</strong>
    <span>Nothing here becomes public trail intel or a maintained document unless you explicitly turn it into one later.</span>
    <div class="mini-stats" aria-label="Resource summary">
      <span><b>{resources.length}</b> total</span>
      <span><b>{searchableResources().length}</b> searchable</span>
      <span><b>{sensitiveResources().length}</b> sensitive</span>
    </div>
  </article>
</section>

{#if error}
  <p class="surface-alert surface-alert--error">{error}</p>
{/if}
{#if notice}
  <p class="surface-alert surface-alert--success">{notice}</p>
{/if}

<section class="resource-create-card card">
  <div class="section-title-row">
    <div>
      <p class="eyebrow">Add source material</p>
      <h2>Give Scout something to read without making it a Doc.</h2>
    </div>
    <span class="status-pill prep">private by default</span>
  </div>

  <div class="mode-tabs" aria-label="Resource type">
    <button class:active={activeMode === 'file'} type="button" onclick={() => (activeMode = 'file')}>Upload file</button>
    <button class:active={activeMode === 'url'} type="button" onclick={() => (activeMode = 'url')}>Add URL</button>
    <button class:active={activeMode === 'note'} type="button" onclick={() => (activeMode = 'note')}>Paste note</button>
  </div>

  {#if activeMode === 'file'}
    <label class="upload-drop">
      <strong>{importing ? 'Uploading…' : 'Choose files'}</strong>
      <span>Text, markdown, HTML, CSV, or notes are readable now. Keep files under 8 MB. PDFs are metadata-only until extraction lands; paste/export text when Scout needs to read them.</span>
      <input
        type="file"
        multiple
        accept=".md,.markdown,.txt,.html,.htm,.pdf,.csv,text/plain,text/html,text/csv,application/pdf"
        onchange={handleFileImport}
      />
    </label>
  {:else}
    <div class="resource-form-grid">
      <label>
        <span>Title</span>
        <input bind:value={title} placeholder={activeMode === 'url' ? 'Hostel page, weather link, permit page…' : 'FarOut note, family constraint, town detail…'} />
      </label>

      <label>
        <span>Sensitivity</span>
        <select bind:value={sensitivity}>
          <option value="private">Private</option>
          <option value="normal">Normal</option>
          <option value="sensitive">Sensitive</option>
          <option value="financial">Financial</option>
          <option value="medical">Medical</option>
        </select>
      </label>

      {#if activeMode === 'url'}
        <label class="wide-field">
          <span>URL</span>
          <input bind:value={sourceUri} inputmode="url" placeholder="https://…" />
        </label>
      {:else}
        <label class="wide-field">
          <span>Note text</span>
          <textarea bind:value={noteText} rows="6" placeholder="Paste source context Scout can use later…"></textarea>
        </label>
      {/if}
    </div>

    <div class="hero-actions">
      <button class="btn btn-secondary" type="button" onclick={handleCreateResource} disabled={saving}>{saving ? 'Saving…' : 'Save resource'}</button>
    </div>
  {/if}
</section>

<section class="resources-list-section">
  <div class="section-title-row">
    <div>
      <p class="eyebrow">Resource locker</p>
      <h2>{resources.length} source{resources.length === 1 ? '' : 's'}</h2>
    </div>
  </div>

  {#if resources.length === 0}
    <article class="card empty-state">
      <h2>No resources yet.</h2>
      <p class="muted">Start with one file, web address, or pasted note. The goal is source context, not another document dump.</p>
    </article>
  {:else}
    <div class="resource-grid">
      {#each resources as resource}
        <article class="resource-card card" id={`resource-${resource.id}`}>
          <div class="resource-topline">
            <p class="eyebrow">{resourceKindLabel(resource.kind)}</p>
            <span class="status-pill">{resource.sensitivity}</span>
          </div>
          <h3>{resource.title}</h3>
          <p>{excerpt(resource)}</p>
          <div class="artifact-meta">
            <span>{resource.status}</span>
            <span>{resource.searchable ? 'searchable' : 'stored only'}</span>
            <span>{fileSize(resource)}</span>
          </div>
          {#if resource.sourceUri}
            <a class="meta-line" href={resource.sourceUri} rel="noreferrer" target="_blank">{resource.sourceUri}</a>
          {:else if resource.originalFileName}
            <p class="meta-line">{resource.originalFileName}</p>
          {/if}
          <p class="meta-line">Updated {updatedAt(resource)}</p>
          <div class="artifact-actions">
            <a class="btn btn-secondary" href={`/app/claw?resourceId=${encodeURIComponent(resource.id)}`}>Ask Scout</a>
            <a class="btn btn-ghost" href={`/app/claw?resourceId=${encodeURIComponent(resource.id)}&resourceAction=document`}>Draft Doc</a>
            <button class="btn btn-ghost danger-button" type="button" onclick={() => handleDelete(resource)}>Delete</button>
          </div>
        </article>
      {/each}
    </div>
  {/if}
</section>

<section class="resources-rules card">
  <div>
    <p class="eyebrow">Product rule</p>
    <h2>Resources are what Scout uses; Docs are what Scout maintains.</h2>
  </div>
  <ul>
    <li><strong>Resources:</strong> uploaded files, web links, screenshots, pasted notes, and official-source pointers.</li>
    <li><strong>Documents:</strong> versioned plans, briefs, reports, and other work products that can be reviewed and revised.</li>
    <li><strong>Scout flow:</strong> attach a resource to Scout, ask about it, or draft a reviewable Doc from it and save the reply into Docs.</li>
  </ul>
</section>

<style>
  .resources-hero {
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

  .resources-hero h1,
  .resource-create-card h2,
  .resources-list-section h2,
  .resources-rules h2 {
    margin: 0;
  }

  .resources-hero h1 {
    max-width: 14ch;
    font-size: clamp(2.2rem, 8vw, 4rem);
    line-height: 0.98;
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
    margin-bottom: 1rem;
  }

  .resources-command-card {
    display: grid;
    align-content: end;
    gap: 0.65rem;
    border: 1px solid rgba(77, 89, 74, 0.12);
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.72);
    color: var(--muted);
    padding: 1rem;
  }

  .resources-command-card strong {
    color: var(--pine);
    font-family: Oswald, sans-serif;
    font-size: 1.35rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .mini-stats,
  .resource-form-grid {
    display: grid;
    gap: 0.65rem;
  }

  .mini-stats {
    grid-template-columns: repeat(3, minmax(0, 1fr));
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
    margin-top: 1rem;
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

  .resource-create-card,
  .resources-list-section,
  .resources-rules {
    margin-top: 1rem;
  }

  .resource-create-card {
    padding: 1rem;
  }

  .mode-tabs {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .mode-tabs button {
    min-height: 2.7rem;
    border: 1px solid rgba(77, 89, 74, 0.13);
    border-radius: 999px;
    background: rgba(255, 253, 248, 0.92);
    color: #394638;
    font-weight: 850;
  }

  .mode-tabs button.active {
    background: #22382a;
    color: #fffdf8;
  }

  .upload-drop {
    position: relative;
    display: grid;
    gap: 0.35rem;
    border: 1px dashed rgba(77, 89, 74, 0.35);
    border-radius: 22px;
    background: rgba(255, 253, 248, 0.78);
    padding: 1.2rem;
    cursor: pointer;
  }

  .upload-drop strong {
    color: var(--pine);
    font-family: Oswald, sans-serif;
    font-size: 1.35rem;
    text-transform: uppercase;
  }

  .upload-drop span {
    color: var(--muted);
  }

  .upload-drop input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
  }

  .resource-form-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .resource-form-grid label {
    display: grid;
    gap: 0.35rem;
    color: var(--muted);
    font-weight: 800;
  }

  .wide-field {
    grid-column: 1 / -1;
  }

  textarea {
    resize: vertical;
  }

  .resource-grid {
    display: grid;
    gap: 0.85rem;
  }

  .resource-card {
    display: grid;
    gap: 0.55rem;
    padding: 1rem;
  }

  .resource-card h3,
  .resource-card p {
    margin: 0;
  }

  .resource-topline,
  .artifact-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
    justify-content: space-between;
  }

  .artifact-meta {
    justify-content: flex-start;
    color: var(--muted);
    font-size: 0.85rem;
    font-weight: 800;
  }

  .artifact-meta span {
    border-radius: 999px;
    background: rgba(245, 242, 232, 0.9);
    padding: 0.3rem 0.55rem;
  }

  .danger-button {
    color: #8a2f2f;
  }

  .resources-rules {
    padding: 1rem;
  }

  .resources-rules ul {
    margin-bottom: 0;
    padding-left: 1.15rem;
  }

  @media (min-width: 760px) {
    .resources-hero {
      grid-template-columns: minmax(0, 1.35fr) minmax(240px, 0.65fr);
      align-items: stretch;
    }

    .resource-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 560px) {
    .mode-tabs,
    .resource-form-grid,
    .mini-stats {
      grid-template-columns: 1fr;
    }
  }
</style>
