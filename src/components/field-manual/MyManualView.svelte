<script lang="ts">
  import { onMount } from 'svelte';
  import {
    createManualNoteEntry,
    downloadManualExport,
    getManualSnapshot,
    hydrateManual,
    pinToManual,
    removeFromManual,
    reorderManual,
    subscribeToManual,
    updateNote,
    type FieldManualEntry,
  } from '../../lib/field-manual';

  let entries = $state<FieldManualEntry[]>([]);
  let isLoading = $state(true);
  let isExporting = $state(false);
  let actionError = $state('');

  const saveTimers = new Map<string, ReturnType<typeof setTimeout>>();

  function syncEntries(snapshot: readonly FieldManualEntry[]) {
    entries = [...snapshot];
    isLoading = false;
  }

  function queueNoteSave(entryId: string, note: string) {
    const existingTimer = saveTimers.get(entryId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(async () => {
      try {
        await updateNote(entryId, note);
      } catch (error) {
        console.error(error);
        actionError = 'Could not save that note.';
      } finally {
        saveTimers.delete(entryId);
      }
    }, 250);

    saveTimers.set(entryId, timer);
  }

  function handleNoteInput(entryId: string, note: string) {
    entries = entries.map((entry) => (
      entry.id === entryId
        ? { ...entry, note }
        : entry
    ));

    queueNoteSave(entryId, note);
  }

  async function moveEntry(entryId: string, direction: -1 | 1) {
    const currentIndex = entries.findIndex((entry) => entry.id === entryId);
    const targetIndex = currentIndex + direction;

    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= entries.length) {
      return;
    }

    const reordered = [...entries];
    const [moved] = reordered.splice(currentIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    entries = reordered;

    try {
      await reorderManual(reordered.map((entry) => entry.id));
    } catch (error) {
      console.error(error);
      actionError = 'Could not reorder your Field Manual.';
    }
  }

  async function handleRemove(entryId: string) {
    actionError = '';

    try {
      await removeFromManual(entryId);
    } catch (error) {
      console.error(error);
      actionError = 'Could not remove that entry.';
    }
  }

  async function handleAddNotePage() {
    actionError = '';

    const noteCount = entries.filter((entry) => entry.kind === 'note').length + 1;

    try {
      await pinToManual(createManualNoteEntry({
        title: `Trail note ${noteCount}`,
        summary: 'A personal note page in your Field Manual.',
        contentText: '',
        note: '',
      }));
    } catch (error) {
      console.error(error);
      actionError = 'Could not create a note page.';
    }
  }

  async function handleExport() {
    actionError = '';
    isExporting = true;

    try {
      await downloadManualExport();
    } catch (error) {
      console.error(error);
      actionError = 'Could not export your Field Manual.';
    } finally {
      isExporting = false;
    }
  }

  onMount(() => {
    syncEntries(getManualSnapshot());

    const unsubscribe = subscribeToManual((snapshot) => {
      syncEntries(snapshot);
    });

    hydrateManual().catch((error) => {
      console.error(error);
      actionError = 'Could not load your Field Manual.';
      isLoading = false;
    });

    return () => {
      unsubscribe();
      for (const timer of saveTimers.values()) {
        clearTimeout(timer);
      }
      saveTimers.clear();
    };
  });
</script>

<section class="manual-shell">
  <header class="manual-hero card">
    <div>
      <p class="manual-eyebrow">My Field Manual</p>
      <h2>Build the book you will actually use on trail.</h2>
      <p class="manual-copy">
        Save the guidance you trust, add your own notes, reorder it until it reads right,
        then export one self-contained HTML file that survives offline.
      </p>
    </div>
    <div class="manual-actions">
      <button type="button" class="btn" onclick={handleAddNotePage}>Add note page</button>
      <button type="button" class="btn btn-primary" onclick={handleExport} disabled={isExporting}>
        {isExporting ? 'Exporting…' : 'Export HTML'}
      </button>
    </div>
  </header>

  <div class="manual-status-row">
    <span class="badge"><strong>Entries</strong> {entries.length}</span>
    <span class="badge"><strong>Format</strong> Single-file HTML</span>
    <span class="badge"><strong>Import</strong> Scaffolded for v1.1</span>
  </div>

  {#if actionError}
    <p class="manual-error" role="alert">{actionError}</p>
  {/if}

  {#if isLoading}
    <div class="manual-empty card">
      <p>Loading your Field Manual…</p>
    </div>
  {:else if entries.length === 0}
    <div class="manual-empty card">
      <h3>Nothing pinned yet.</h3>
      <p>
        Go back to <a href="/guide/">Hogg Country&apos;s Field Manual</a>, save a few chapters or quick refs,
        then come back here to shape your own manual.
      </p>
    </div>
  {:else}
    <div class="manual-list">
      {#each entries as entry, index}
        <article class="manual-entry card">
          <div class="manual-entry-top">
            <div class="manual-index">{String(index + 1).padStart(2, '0')}</div>
            <div class="manual-heading">
              <div class="manual-heading-row">
                <h3>{entry.title}</h3>
                <span class="manual-kind">{entry.kind}</span>
              </div>
              <p class="manual-summary">{entry.summary}</p>
              <div class="manual-meta">
                {#if entry.source.citation}
                  <span>{entry.source.citation}</span>
                {/if}
                {#if entry.source.href}
                  <a href={entry.source.href}>Open source</a>
                {/if}
              </div>
            </div>
            <div class="manual-controls">
              <button type="button" class="control-btn" onclick={() => moveEntry(entry.id, -1)} disabled={index === 0}>Move up</button>
              <button type="button" class="control-btn" onclick={() => moveEntry(entry.id, 1)} disabled={index === entries.length - 1}>Move down</button>
              <button type="button" class="control-btn is-danger" onclick={() => handleRemove(entry.id)}>Remove</button>
            </div>
          </div>

          {#if entry.contentHtml && entry.kind !== 'note'}
            <details class="manual-preview">
              <summary>Preview saved entry</summary>
              <div class="manual-preview-body">
                {@html entry.contentHtml}
              </div>
            </details>
          {/if}

          <label class="manual-note-label" for={`manual-note-${entry.id}`}>
            {entry.kind === 'note' ? 'Note page' : 'Your note'}
          </label>
          <textarea
            id={`manual-note-${entry.id}`}
            class="manual-note"
            rows={entry.kind === 'note' ? 7 : 4}
            value={entry.note}
            placeholder={entry.kind === 'note' ? 'Write your own page here…' : 'Add your own trail note…'}
            oninput={(event) => handleNoteInput(entry.id, (event.currentTarget as HTMLTextAreaElement).value)}
          />
        </article>
      {/each}
    </div>
  {/if}
</section>

<style>
  .manual-shell {
    display: grid;
    gap: 1rem;
  }

  .manual-hero {
    display: grid;
    gap: 1rem;
    padding: 1.5rem;
  }

  .manual-eyebrow {
    margin: 0 0 0.5rem;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--terra, #d97706);
  }

  .manual-hero h2 {
    margin: 0 0 0.6rem;
  }

  .manual-copy {
    margin: 0;
    color: var(--muted, #5c665a);
    max-width: 58ch;
  }

  .manual-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .manual-status-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
  }

  .manual-error {
    margin: 0;
    padding: 0.9rem 1rem;
    border: 1px solid rgba(153, 27, 27, 0.2);
    border-radius: 12px;
    background: rgba(127, 29, 29, 0.06);
    color: #7f1d1d;
  }

  .manual-empty {
    padding: 1.5rem;
  }

  .manual-empty h3 {
    margin-top: 0;
  }

  .manual-list {
    display: grid;
    gap: 1rem;
  }

  .manual-entry {
    padding: 1.25rem;
  }

  .manual-entry-top {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 1rem;
  }

  .manual-index {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 999px;
    background: rgba(166, 181, 137, 0.2);
    color: var(--pine, #4d594a);
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 700;
  }

  .manual-heading {
    min-width: 0;
  }

  .manual-heading-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
  }

  .manual-heading h3 {
    margin: 0;
    color: var(--ink, #1f2937);
  }

  .manual-kind {
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.55rem;
    border-radius: 999px;
    background: rgba(77, 89, 74, 0.08);
    color: var(--pine, #4d594a);
    font-size: 0.74rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .manual-summary {
    margin: 0.45rem 0 0;
    color: var(--muted, #5c665a);
  }

  .manual-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-top: 0.6rem;
    font-size: 0.88rem;
    color: var(--muted, #5c665a);
  }

  .manual-controls {
    grid-column: 1 / -1;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.75rem;
  }

  .control-btn {
    min-height: 40px;
    padding: 0.55rem 0.8rem;
    border-radius: 10px;
    border: 1px solid var(--border, #e6e1d4);
    background: #fff;
    color: var(--pine, #4d594a);
    font: inherit;
    font-weight: 600;
    cursor: pointer;
  }

  .control-btn:disabled {
    opacity: 0.45;
    cursor: default;
  }

  .control-btn.is-danger {
    color: #8a2f2f;
  }

  .manual-preview {
    margin-top: 1rem;
    padding: 0.85rem 1rem;
    border: 1px solid var(--border, #e6e1d4);
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.55);
  }

  .manual-preview summary {
    cursor: pointer;
    font-weight: 700;
    color: var(--pine, #4d594a);
  }

  .manual-preview-body {
    margin-top: 0.85rem;
    color: var(--fg, #333333);
  }

  .manual-preview-body :global(h1),
  .manual-preview-body :global(h2),
  .manual-preview-body :global(h3) {
    margin-top: 1rem;
  }

  .manual-note-label {
    display: block;
    margin-top: 1rem;
    margin-bottom: 0.35rem;
    font-size: 0.84rem;
    font-weight: 700;
    color: var(--pine, #4d594a);
  }

  .manual-note {
    width: 100%;
    border-radius: 12px;
    border: 1px solid var(--border, #e6e1d4);
    padding: 0.9rem 1rem;
    font: inherit;
    line-height: 1.6;
    resize: vertical;
    background: #fff;
    color: var(--fg, #333333);
  }

  @media (min-width: 760px) {
    .manual-hero {
      grid-template-columns: 1fr auto;
      align-items: end;
    }

    .manual-entry-top {
      grid-template-columns: auto 1fr auto;
      align-items: start;
    }

    .manual-controls {
      grid-column: auto;
      margin-top: 0;
      justify-content: flex-end;
    }
  }
</style>
