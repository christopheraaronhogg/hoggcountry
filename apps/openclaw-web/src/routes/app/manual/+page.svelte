<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { addNoteToSection, downloadManualExport, getProfile, getSections } from '$lib/manual-db';
  import type { ManualSection } from '@hoggcountry/manual-core';

  let sections = $state<ManualSection[]>([]);
  let selectedSection = $state('');
  let noteTitle = $state('');
  let noteContent = $state('');
  let error = $state('');

  async function refresh() {
    const profile = await getProfile();
    if (!profile) {
      await goto('/app/setup');
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

<section class="card hero-panel">
  <div>
    <p class="eyebrow">Manual</p>
    <h1>Your field manual stays the center of gravity.</h1>
    <p class="lede">
      Everything worth keeping ends up here: template rules, your own notes, and exported copies that still work
      outside the app.
    </p>
  </div>
  <button class="btn btn-secondary" type="button" onclick={handleExport}>Export HTML</button>
</section>

<section class="card panel-copy" style="margin-top:1rem;">
  <div class="page-intro">
    <p class="eyebrow">Add note</p>
    <h2>Append a note without overwriting the template.</h2>
  </div>

  <div class="stack">
    <select bind:value={selectedSection}>
      {#each sections as section}
        <option value={section.id}>{section.title}</option>
      {/each}
    </select>
    <input bind:value={noteTitle} placeholder="Note title" />
    <textarea bind:value={noteContent} rows="4" placeholder="What needs to live in your manual?"></textarea>
    <div class="subtle-actions">
      <button class="btn btn-secondary" type="button" onclick={handleAddNote}>Save note</button>
    </div>
  </div>
</section>

{#if error}
  <p style="color:#8a2f2f; font-weight:700;">{error}</p>
{/if}

<div class="stack" style="margin-top:1rem;">
  {#each sections as section}
    <article class="card panel-copy">
      <p class="eyebrow">{section.kind}</p>
      <h2>{section.title}</h2>
      <p class="muted">{section.summary}</p>

      <div class="stack" style="margin-top:1rem;">
        {#each section.blocks as block}
          <section class="card card-soft panel-copy">
            <h3>{block.title}</h3>
            <p class="muted">{block.content}</p>
            {#if block.citations.length > 0}
              <p class="meta-line">{block.citations.map((citation) => citation.label).join(' | ')}</p>
            {/if}
          </section>
        {/each}
      </div>
    </article>
  {/each}
</div>
