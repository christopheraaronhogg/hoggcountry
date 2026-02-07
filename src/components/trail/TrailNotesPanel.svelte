<script lang="ts">
  import { onMount } from 'svelte';

  const NOTES_KEY = 'hcTrailNotes.v1';

  let body = $state('');
  let lastSavedAt = $state<string | null>(null);
  let loaded = $state(false);

  function saveNow(next: string): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(
        NOTES_KEY,
        JSON.stringify({
          body: next,
          updatedAt: new Date().toISOString(),
        })
      );
      lastSavedAt = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } catch {
      // Non-fatal in private browsing / storage-restricted contexts.
    }
  }

  onMount(() => {
    try {
      const raw = localStorage.getItem(NOTES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.body === 'string') {
          body = parsed.body;
        }
      }
    } catch {
      // Ignore malformed note payloads.
    } finally {
      loaded = true;
    }
  });

  function onInput(event: Event): void {
    const target = event.currentTarget as HTMLTextAreaElement;
    body = target.value;
    saveNow(body);
  }
</script>

<div class="notes-panel" class:loaded>
  <header class="notes-head">
    <h3>Field Notes</h3>
    {#if lastSavedAt}
      <span class="saved">Saved {lastSavedAt}</span>
    {/if}
  </header>

  <label class="notes-label" for="trail-notes-body">Write quick observations, decisions, and reminders.</label>
  <textarea
    id="trail-notes-body"
    class="notes-area"
    value={body}
    oninput={onInput}
    placeholder="Water source dry at mile 440, camp option before gap, battery bank at 54%..."
  ></textarea>

  {#if loaded && !body.trim()}
    <p class="notes-hint">Tip: keep this short and tactical so you can read it fast on trail.</p>
  {/if}
</div>

<style>
  .notes-panel {
    display: grid;
    gap: 0.7rem;
    opacity: 0;
    transform: translateY(6px);
    transition: opacity 180ms ease, transform 180ms ease;
  }

  .notes-panel.loaded {
    opacity: 1;
    transform: translateY(0);
  }

  .notes-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.7rem;
  }

  .notes-head h3 {
    margin: 0;
    font-size: 0.88rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--pine, #4d594a);
  }

  .saved {
    font-size: 0.76rem;
    color: rgba(31, 41, 55, 0.7);
  }

  .notes-label {
    font-size: 0.84rem;
    color: rgba(31, 41, 55, 0.82);
  }

  .notes-area {
    min-height: 240px;
    border-radius: 12px;
    border: 1px solid rgba(77, 89, 74, 0.24);
    padding: 0.8rem;
    font: inherit;
    resize: vertical;
    background: rgba(255, 255, 255, 0.92);
    color: var(--fg, #1f2937);
    line-height: 1.5;
  }

  .notes-area:focus {
    outline: none;
    border-color: rgba(166, 181, 137, 0.8);
    box-shadow: 0 0 0 3px rgba(166, 181, 137, 0.3);
  }

  .notes-hint {
    margin: 0;
    font-size: 0.78rem;
    color: rgba(31, 41, 55, 0.65);
  }
</style>
