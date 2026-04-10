<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { addNoteToSection, downloadManualExport, getProfile, getSections } from '$lib/manual-db';
  import type { ManualSection } from '@hoggcountry/manual-core';

  let sections: ManualSection[] = [];
  let selectedSection = '';
  let noteTitle = '';
  let noteContent = '';
  let error = '';

  async function refresh() {
    const profile = await getProfile();
    if (!profile) {
      await goto('/setup');
      return;
    }

    sections = await getSections();
    selectedSection = selectedSection || sections[0]?.id || '';
  }

  async function handleAddNote() {
    if (!selectedSection || !noteContent.trim()) return;
    await addNoteToSection(selectedSection, noteTitle, noteContent);
    noteTitle = '';
    noteContent = '';
    await refresh();
  }

  async function handleExport() {
    try {
      await downloadManualExport();
    } catch (caught) {
      console.error(caught);
      error = 'Could not export the manual.';
    }
  }

  onMount(() => {
    refresh().catch((caught) => {
      console.error(caught);
      error = 'Could not load the manual.';
    });
  });
</script>

<section class="hero card">
  <div>
    <p class="eyebrow">Manual</p>
    <h1>Your field manual stays the center of gravity.</h1>
    <p class="lede">Everything worth keeping ends up here: template rules, your own notes, and exported copies that work outside the app.</p>
  </div>
  <button type="button" onclick={handleExport}>Export HTML</button>
</section>

<section class="composer card">
  <div>
    <p class="eyebrow">Add note</p>
    <h2>Append a note without overwriting the template.</h2>
  </div>

  <div class="composer-grid">
    <select bind:value={selectedSection}>
      {#each sections as section}
        <option value={section.id}>{section.title}</option>
      {/each}
    </select>
    <input bind:value={noteTitle} placeholder="Note title" />
    <textarea bind:value={noteContent} rows="4" placeholder="What needs to live in your manual?"></textarea>
    <button type="button" onclick={handleAddNote}>Save note</button>
  </div>
</section>

{#if error}
  <p class="error">{error}</p>
{/if}

<div class="stack">
  {#each sections as section}
    <article class="card section">
      <p class="eyebrow">{section.kind}</p>
      <h2>{section.title}</h2>
      <p class="summary">{section.summary}</p>

      <div class="blocks">
        {#each section.blocks as block}
          <section class={`block block-${block.type}`}>
            <h3>{block.title}</h3>
            <p>{block.content}</p>
            {#if block.citations.length > 0}
              <p class="citation">{block.citations.map((citation) => citation.label).join(' | ')}</p>
            {/if}
          </section>
        {/each}
      </div>
    </article>
  {/each}
</div>

<style>
  .card {
    border: 1px solid rgba(48, 65, 54, 0.12);
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.84);
    box-shadow: 0 18px 44px rgba(0, 0, 0, 0.06);
  }

  .hero,
  .composer,
  .section {
    padding: 1.1rem;
  }

  .hero {
    display: grid;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .composer {
    display: grid;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .composer-grid {
    display: grid;
    gap: 0.75rem;
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
  h2,
  h3 {
    margin: 0;
    color: #1f2937;
  }

  .lede,
  .summary {
    color: #5d675c;
    line-height: 1.7;
  }

  .stack {
    display: grid;
    gap: 1rem;
  }

  .blocks {
    display: grid;
    gap: 0.75rem;
    margin-top: 1rem;
  }

  .block {
    padding: 0.95rem;
    border-radius: 18px;
    background: rgba(245, 242, 232, 0.78);
  }

  .block-reflection {
    background: rgba(166, 181, 137, 0.18);
  }

  .citation {
    margin: 0.7rem 0 0;
    font-size: 0.84rem;
    color: #5d675c;
  }

  input,
  select,
  textarea,
  button {
    min-height: 46px;
    border-radius: 14px;
    font: inherit;
  }

  input,
  select,
  textarea {
    width: 100%;
    border: 1px solid rgba(48, 65, 54, 0.12);
    padding: 0.8rem 0.9rem;
  }

  textarea {
    min-height: 140px;
    resize: vertical;
  }

  button {
    border: none;
    padding: 0.8rem 1rem;
    background: #304136;
    color: white;
    font-weight: 800;
    cursor: pointer;
  }

  .error {
    color: #8a2f2f;
    font-weight: 700;
  }

  @media (min-width: 860px) {
    .hero {
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: end;
    }
  }
</style>
